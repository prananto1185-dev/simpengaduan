import express from "express";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
app.use(express.json({ limit: "25mb" }));

// Lazy Google Gen AI initialization
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured in environment variables.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Server-side fallback analyzer if Gemini API key quota is exhausted (429) or offline
function generateServerFallbackAnalysis(data: {
  title: string;
  category: string;
  subCategory?: string;
  description: string;
  location?: string;
  urgencyLevel?: string;
  reporterRole?: string;
}) {
  const text = `${data.title} ${data.description} ${data.subCategory || ""}`.toLowerCase();
  let score = 55;
  let level = "Sedang";

  if (
    text.includes("api") ||
    text.includes("listrik") ||
    text.includes("korslet") ||
    text.includes("runtuh") ||
    text.includes("darah") ||
    text.includes("pukul") ||
    text.includes("pingsan") ||
    text.includes("ambruk") ||
    data.urgencyLevel === "darurat"
  ) {
    score = 92;
    level = "Kritis";
  } else if (
    text.includes("bullying") ||
    text.includes("ancam") ||
    text.includes("bocor") ||
    text.includes("pecah") ||
    text.includes("rusak berat") ||
    data.urgencyLevel === "mendesak"
  ) {
    score = 80;
    level = "Tinggi";
  } else if (data.urgencyLevel === "sedang") {
    score = 60;
    level = "Sedang";
  } else {
    score = 35;
    level = "Rendah";
  }

  let dept = "Tim Sarana Prasarana & K3";
  let immediateActions = [
    "Lakukan isolasi dan pengamanan area kejadian segera.",
    "Pasang rambu peringatan atau batasi akses siswa ke lokasi.",
    "Laporkan kondisi terkini kepada Koordinator Sarpras.",
  ];
  let resolutionSteps = [
    "Petugas teknis melakukan inspeksi kerusakan fisik di lokasi.",
    "Pengadaan suku cadang atau perbaikan instalasi darurat.",
    "Uji kelayakan pasca-perbaikan dan unggah bukti dokumentasi foto.",
  ];
  let preventiveMeasures = [
    "Jadwalkan pemeliharaan preventif berkala tiap pekan.",
    "Lakukan inspeksi rutin fasilitas kelas dan laboratorium.",
  ];
  let requiredResources = ["Peralatan teknis / toolbox K3", "Dokumen Berita Acara", "Kamera dokumentasi"];

  if (data.category === "bullying" || text.includes("bully") || text.includes("perundungan")) {
    dept = "Satgas TPPK & Guru Bimbingan Konseling";
    immediateActions = [
      "Amankan korban ke ruang Bimbingan Konseling (BK) yang aman dan tertutup.",
      "Berikan pertolongan pertama fisik dan pendampingan psikologis awal.",
      "Jaga kerahasiaan identitas siswa sesuai Permendikbudristek PPKSP.",
    ];
    resolutionSteps = [
      "Konselor BK memanggil saksi dan pihak terkait secara terpisah.",
      "Pertemuan mediasi tertutup bersama wali murid dan Satgas TPPK.",
      "Penyusunan komitmen tertulis dan rencana pemulihan trauma korban.",
    ];
    preventiveMeasures = [
      "Sosialisasi anti-perundungan di setiap kelas.",
      "Optimalisasi pengawasan guru piket pada jam istirahat.",
    ];
    requiredResources = ["Ruang konseling privat", "Form asesmen psikologis", "Buku catatan kasus tertutup"];
  } else if (data.category === "pelayanan") {
    dept = "Tata Usaha & Humas Sekolah";
    immediateActions = [
      "Petugas TU mengonfirmasi detail kendala kepada pelapor.",
      "Verifikasi data berkas atau dokumen yang dikeluhkan.",
    ];
    resolutionSteps = [
      "Koordinasi dengan bagian kearsipan/kurikulum.",
      "Percepatan proses administrasi dan penyerahan hasil kepada pelapor.",
    ];
    preventiveMeasures = ["Digitalisasi alur layanan administrasi sekolah."];
    requiredResources = ["Akses sistem informasi sekolah", "Form verifikasi dokumen"];
  }

  return {
    priorityScore: score,
    priorityLevel: level,
    summary: `Pengaduan mengenai "${data.title}" di ${data.location || "lingkungan sekolah"} teridentifikasi membutuhkan penanganan divisi ${dept}.`,
    riskAssessment:
      level === "Kritis"
        ? "Berisiko tinggi terhadap keselamatan jiwa, potensi cidera fisik, atau trauma psikologis bila tidak ditindaklanjuti segera."
        : "Berpotensi mengganggu kelancaran kegiatan belajar mengajar jika penanganan tertunda.",
    immediateActions,
    resolutionSteps,
    preventiveMeasures,
    assignedDepartment: dept,
    estimatedTimeframe: level === "Kritis" ? "1 - 3 Jam" : level === "Tinggi" ? "1 Hari Kerja" : "2 - 3 Hari Kerja",
    requiredResources,
    legalOrPolicyAdvice:
      data.category === "bullying"
        ? "Sesuai Permendikbudristek No. 46 Tahun 2023 tentang Pencegahan dan Penanganan Kekerasan di Satuan Pendidikan (PPKSP)."
        : "Mengacu pada Standar Operasional Prosedur Sarana Prasarana & K3 Sekolah.",
  };
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "SIPENGADU School Complaints Backend (Vercel Serverless)" });
});

// Endpoint to analyze a complaint using Gemini AI
app.post("/api/ai/analyze-complaint", async (req, res) => {
  const { title, category, subCategory, description, location, urgencyLevel, isAnonymous, reporterRole } = req.body;

  if (!title || !description || !category) {
    return res.status(400).json({ error: "Title, category, and description are required for analysis." });
  }

  try {
    const ai = getAIClient();

    const systemPrompt = `Anda adalah Asisten Pakar Manajemen Sekolah Terpadu & Satgas Penanganan Masalah Pendidikan (Mencakup Sarana Prasarana K3, Layanan Akademik/TU, dan Satgas Pencegahan & Penanganan Kekerasan TPPK / Bimbingan Konseling).
Tugas Anda adalah menganalisis laporan pengaduan sekolah yang masuk, mengevaluasi tingkat keparahan, risiko keselamatan, serta menghasilkan panduan operasional langkah demi langkah (SOP) untuk tim sekolah.

KATEGORI PENGADUAN:
1. sarpras (Kerusakan Fisik & K3: atap bocor, plafon rapuh, kelistrikan/korsleting, lantai licin/pecah, fasilitas toilet, laboratorium, meja kursi, dll.)
2. bullying (Satgas TPPK / BK: perundungan fisik, verbal, siber, pemalakan, pengucilan, pelecehan)
3. pelayanan (Layanan Akademik / TU: keterlambatan legalisir, administrasi ijazah/rapor, transparansi keuangan/SPP, pungutan liar, sikap petugas, dll.)

Analisis secara objektif, berikan skor urgensi 1-100 (Skor >= 85: KRITIS/DARURAT, 70-84: TINGGI, 40-69: SEDANG, <40: RENDAH).
Berikan rekomendasi tindakan segera (immediate action), langkah resolusi teknis/konseling lengkap, estimasi waktu penyelesaian, divisi penanggung jawab, serta referensi regulasi (Permendikbudristek PPKSP No 46/2023 atau SOP Sarpras).`;

    const userPrompt = `Analisis Laporan Pengaduan Sekolah berikut:
- Judul: ${title}
- Kategori Utama: ${category}
- Sub Kategori: ${subCategory || "Umum"}
- Lokasi Kejadian / Fasilitas: ${location || "Lingkungan Sekolah"}
- Klaim Urgensi Pelapor: ${urgencyLevel || "sedang"}
- Peran Pelapor: ${reporterRole || "warga sekolah"}
- Status Anonim: ${isAnonymous ? "Ya (Rahasiakan identitas pelapor)" : "Tidak (Terbuka)"}
- Isi Kronologi & Deskripsi Pengaduan:
"""
${description}
"""

Hasilkan output JSON terstruktur sesuai skema.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: [
        { role: "system", parts: [{ text: systemPrompt }] },
        { role: "user", parts: [{ text: userPrompt }] },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            priorityScore: {
              type: Type.INTEGER,
              description: "Skor prioritas 1 - 100 berdasarkan risiko K3, dampak belajar, atau trauma siswa",
            },
            priorityLevel: {
              type: Type.STRING,
              enum: ["Kritis", "Tinggi", "Sedang", "Rendah"],
              description: "Level urgensi penanganan",
            },
            summary: {
              type: Type.STRING,
              description: "Ringkasan eksekutif kasus dalam 1-2 kalimat padat untuk Kepala Sekolah / Koordinator",
            },
            riskAssessment: {
              type: Type.STRING,
              description: "Analisis potensi bahaya fisik, keselamatan jiwa, hukum, atau dampak psikologis bila terlambat ditangani",
            },
            immediateActions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Daftar 2-3 langkah mitigasi darurat dalam 1 jam pertama (misal: pasang police line/isolasi area, amankan korban ke ruang BK)",
            },
            resolutionSteps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Langkah-langkah terperinci penyelesaian SOP hingga tuntas",
            },
            preventiveMeasures: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Rekomendasi pencegahan agar kejadian serupa tidak terulang kembali di masa depan",
            },
            assignedDepartment: {
              type: Type.STRING,
              description: "Departemen yang paling tepat ditugaskan (contoh: Tim Sarana Prasarana & K3, Satgas TPPK & Guru BK, atau Tata Usaha)",
            },
            estimatedTimeframe: {
              type: Type.STRING,
              description: "Estimasi waktu pengerjaan / penyelesaian realistis (contoh: '2 - 4 Jam', '1 Hari Kerja', '3 Hari Kerja')",
            },
            requiredResources: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Daftar alat, logistik, atau pihak yang perlu dilibatkan (misal: Tukang Las, Suku Cadang MCB, Konselor Psikolog, Wali Kelas)",
            },
            legalOrPolicyAdvice: {
              type: Type.STRING,
              description: "Rujukan dasar hukum atau regulasi terkait (Permendikbud PPKSP, SOP K3, dll.)",
            },
          },
          required: [
            "priorityScore",
            "priorityLevel",
            "summary",
            "riskAssessment",
            "immediateActions",
            "resolutionSteps",
            "assignedDepartment",
            "estimatedTimeframe",
          ],
        },
      },
    });

    const parsedData = JSON.parse(response.text || "{}");
    return res.json({ success: true, analysis: parsedData });
  } catch (error: any) {
    console.warn("Notice: Vercel serverless Gemini quota/fallback:", error?.message);
    const fallbackAnalysis = generateServerFallbackAnalysis({
      title,
      category,
      subCategory,
      description,
      location,
      urgencyLevel,
      reporterRole,
    });
    return res.json({ success: true, analysis: fallbackAnalysis, fallbackUsed: true });
  }
});

// Endpoint for AI Prioritization Batch
app.post("/api/ai/prioritize-batch", async (req, res) => {
  const { complaints } = req.body;
  if (!Array.isArray(complaints) || complaints.length === 0) {
    return res.status(400).json({ error: "Complaints array is required" });
  }

  try {
    const ai = getAIClient();
    const complaintsContext = complaints.map((c: any, index: number) => ({
      index: index + 1,
      id: c.id,
      ticketNumber: c.ticketNumber,
      title: c.title,
      category: c.category,
      urgencyLevel: c.urgencyLevel,
      location: c.location,
      status: c.status,
      score: c.priorityScore || 50,
      createdAt: c.createdAt,
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: `Anda adalah Kepala Manajemen Pengendalian Mutu & K3 Sekolah.
Evaluasi daftar antrean pengaduan berikut dan susun matriks urutan prioritas eksekusi yang paling mendesak bagi tim teknis & satgas sekolah.

Daftar Laporan:
${JSON.stringify(complaintsContext, null, 2)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            executiveSummary: { type: Type.STRING },
            topUrgentActions: { type: Type.ARRAY, items: { type: Type.STRING } },
            prioritizedList: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  complaintId: { type: Type.STRING },
                  recommendedOrder: { type: Type.INTEGER },
                  priorityTier: { type: Type.STRING, enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW"] },
                  reasonForPriority: { type: Type.STRING },
                  actionableRecommendation: { type: Type.STRING },
                },
                required: ["complaintId", "recommendedOrder", "priorityTier", "reasonForPriority"],
              },
            },
          },
          required: ["executiveSummary", "topUrgentActions", "prioritizedList"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    return res.json({ success: true, result });
  } catch (error: any) {
    console.warn("Notice: Vercel serverless Gemini batch fallback:", error?.message);
    const sorted = [...complaints].sort((a: any, b: any) => (b.priorityScore || 50) - (a.priorityScore || 50));
    const fallbackResult = {
      executiveSummary: `Terdapat ${complaints.length} laporan pengaduan yang sedang ditangani. Prioritaskan investigasi K3 darurat dan perlindungan anak siswa terlebih dahulu.`,
      topUrgentActions: [
        "Lakukan inspeksi dan pengamanan pada sarana dengan indikasi bahaya fisik/listrik.",
        "Satgas TPPK melakukan pendampingan tertutup terhadap korban kasus perundungan.",
        "Koordinator Sarpras memastikan ketersediaan suku cadang dan logistik perbaikan.",
      ],
      prioritizedList: sorted.map((c: any, idx: number) => ({
        complaintId: c.id,
        recommendedOrder: idx + 1,
        priorityTier: (c.priorityScore || 50) >= 85 ? "CRITICAL" : (c.priorityScore || 50) >= 70 ? "HIGH" : "MEDIUM",
        reasonForPriority: `Skor Prioritas ${c.priorityScore || 50}/100 pada kategori ${(c.category || "Sarpras").toUpperCase()}`,
        actionableRecommendation: `Tugaskan ${c.assignedTo || "petugas piket"} untuk verifikasi langsung di lokasi: ${c.location || "Sekolah"}.`,
      })),
    };
    return res.json({ success: true, result: fallbackResult, fallbackUsed: true });
  }
});

// Endpoint for AI Consultation / Chat
app.post("/api/ai/consult", async (req, res) => {
  const { message, complaintContext } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    const ai = getAIClient();
    let contextPrompt = "";
    if (complaintContext) {
      contextPrompt = `\n[Konteks Laporan yang Sedang Dibahas]:\n- ID: ${complaintContext.ticketNumber || complaintContext.id}\n- Judul: ${complaintContext.title}\n- Kategori: ${complaintContext.category}\n- Lokasi: ${complaintContext.location}\n- Status: ${complaintContext.status}\n- Deskripsi: ${complaintContext.description}\n`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: `Anda adalah Konsultan Ahli Tata Kelola Sekolah, K3 Sarpras, dan Satgas Anti-Bullying (TPPK Kemendikbudristek). Jawablah pertanyaan admin/guru dengan bahasa Indonesia yang jelas, empatik, praktis, dan sesuai regulasi sekolah Indonesia.\n${contextPrompt}\n\nPertanyaan: ${message}`,
      config: {
        temperature: 0.7,
      },
    });

    return res.json({ success: true, reply: response.text });
  } catch (error: any) {
    console.warn("Notice: Vercel serverless Gemini consult fallback:", error?.message);
    const fallbackReply = `Berdasarkan pedoman tata kelola dan K3 sekolah: Pastikan keselamatan siswa dan guru selalu menjadi prioritas utama. Segera amankan area terkait atau berikan pendampingan konseling tertutup jika berkaitan dengan bullying, lalu catat kronologi lengkap dalam sistem SIPENGADU.`;
    return res.json({ success: true, reply: fallbackReply, fallbackUsed: true });
  }
});

export default app;
