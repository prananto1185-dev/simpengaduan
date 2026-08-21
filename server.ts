import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

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

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "SIPENGADU School Complaints Backend" });
});

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

// Endpoint to analyze a complaint using Gemini AI: priority score, severity, step-by-step SOP resolution, estimated time & materials
app.post("/api/ai/analyze-complaint", async (req, res) => {
  const { title, category, subCategory, description, location, urgencyLevel, isAnonymous, reporterRole } = req.body;

  if (!title || !description || !category) {
    return res.status(400).json({ error: "Title, category, and description are required for analysis." });
  }

  try {
    const ai = getAIClient();

    const systemPrompt = `Anda adalah Asisten Pakar Manajemen Sekolah Terpadu & Satgas Penanganan Masalah Pendidikan (Mencakup Sarana Prasarana K3, Layanan Akademik/TU, dan Satgas Pencegahan & Penanganan Kekerasan TPPK / Bimbingan Konseling).
Tugas Anda adalah menganalisis laporan pengaduan sekolah secara komprehensif, objektif, profesional, dan memberikan saran penyelesaian langkah demi langkah (SOP) yang konkret serta menentukan prioritas penyelesaian secara akurat.

Kategori Pengaduan:
1. Sarana Prasarana (Sarpras): utamakan keselamatan K3 (listrik korslet, plafon rapuh, air bocor, kaca pecah) & kelancaran KBM.
2. Perundungan / Bullying: utamakan keselamatan fisik & psikologis korban, kerahasiaan, pendampingan BK, mediasi orang tua, dan pencegahan trauma berulang (Permendikbudristek PPKSP).
3. Pelayanan Sekolah: efisiensi birokrasi, transparansi, kepuasan wali murid/guru, etika pelayanan.

Berikan output JSON terstruktur sesuai format yang diminta.`;

    const userPrompt = `Analisis Laporan Pengaduan Sekolah berikut:
- Judul Laporan: "${title}"
- Kategori Utama: "${category}"
- Sub-Kategori: "${subCategory || 'Umum'}"
- Lokasi Kejadian / Fasilitas: "${location || 'Lingkungan Sekolah'}"
- Tingkat Urgensi Laporan Guru/Pengguna: "${urgencyLevel || 'Sedang'}"
- Peran Pelapor: "${reporterRole || 'Guru/Staf'}" (Anonim: ${isAnonymous ? 'Ya' : 'Tidak'})
- Detail Laporan: "${description}"

Buatkan analisis mendalam mencakup:
1. Skor Prioritas (1 - 100, di mana 85-100 adalah Kritis/Darurat, 70-84 Tinggi, 45-69 Sedang, 1-44 Rendah).
2. Tingkat Prioritas (Kritis, Tinggi, Sedang, Rendah).
3. Ringkasan Singkat Masalah (1-2 kalimat padat).
4. Analisis Dampak & Risiko (Jika tidak segera ditangani).
5. Langkah Penyelesaian Cepat / Tindakan Tanggap Darurat (Immediate Action).
6. Langkah Penyelesaian Teknis / Penanganan Komprehensif (Resolution Steps SOP).
7. Langkah Pencegahan Jangka Panjang (Preventive Action).
8. Rekomendasi Pihak Penanggung Jawab (PIC / Departemen terkait).
9. Estimasi Waktu Penanganan (misal: "1-2 Jam", "1 Hari Kerja", "3-5 Hari Kerja").
10. Rekomendasi Alokasi Sumber Daya / Alat / Anggaran yang dibutuhkan.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            priorityScore: {
              type: Type.INTEGER,
              description: "Skor prioritas dari 1 sampai 100",
            },
            priorityLevel: {
              type: Type.STRING,
              description: "Kritis | Tinggi | Sedang | Rendah",
            },
            summary: {
              type: Type.STRING,
              description: "Ringkasan inti pengaduan dalam 1-2 kalimat",
            },
            riskAssessment: {
              type: Type.STRING,
              description: "Dampak dan risiko keselamatan/operasional jika penanganan tertunda",
            },
            immediateActions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Langkah pertolongan pertama / pengamanan darurat",
            },
            resolutionSteps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "SOP langkah-langkah penyelesaian teknis atau investigasi BK",
            },
            preventiveMeasures: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Langkah mitigasi agar masalah tidak terulang kembali",
            },
            assignedDepartment: {
              type: Type.STRING,
              description: "Departemen/Tim penanggung jawab utama (misal: Tim Sarpras, Tim BK & TPPK, Tata Usaha, Kepala Sekolah)",
            },
            estimatedTimeframe: {
              type: Type.STRING,
              description: "Estimasi lama pengerjaan atau penyelesaian",
            },
            requiredResources: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Daftar alat, suku cadang, dokumen SOP, atau logistik yang dibutuhkan",
            },
            legalOrPolicyAdvice: {
              type: Type.STRING,
              description: "Rujukan aturan sekolah, Permendikbudristek atau standar K3 jika relevan",
            },
          },
          required: [
            "priorityScore",
            "priorityLevel",
            "summary",
            "riskAssessment",
            "immediateActions",
            "resolutionSteps",
            "preventiveMeasures",
            "assignedDepartment",
            "estimatedTimeframe",
          ],
        },
      },
    });

    const parsedData = JSON.parse(response.text || "{}");
    return res.json({ success: true, analysis: parsedData });
  } catch (error: any) {
    console.warn("Notice: Gemini API returned quota rate limit or network issue. Using intelligent heuristic analyzer:", error?.message);
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

// Endpoint for AI Prioritization Matrix of all pending complaints
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
      title: c.title,
      category: c.category,
      location: c.location,
      urgency: c.urgencyLevel,
      status: c.status,
      description: c.description,
      createdAt: c.createdAt,
    }));

    const prompt = `Berikut adalah daftar pengaduan sekolah yang sedang aktif/belum selesai:
${JSON.stringify(complaintsContext, null, 2)}

Urutkan dan rekomendasikan urutan penyelesaian prioritas ("Mana dulu yang harus diselesaikan sekolah hari ini").
Pertimbangkan:
1. Bahaya langsung keselamatan jiwa / K3 (misal: korsleting listrik, atap mau roboh).
2. Kasus kekerasan/bullying aktif terhadap anak/siswa yang membutuhkan intervensi perlindungan secepatnya.
3. Gangguan fatal terhadap kelancaran KBM / Ujian.
4. Masalah sarana umum & pelayanan administratif.

Keluarkan hasil JSON berisi daftar urutan prioritas rekomendasi dengan justifikasi logis.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction: "Anda adalah Kepala Auditor Manajemen Risiko & Koordinator Satgas Sekolah. Berikan urutan prioritas yang adil, berbasis risiko terukur.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            executiveSummary: {
              type: Type.STRING,
              description: "Ringkasan arahan untuk Kepala Sekolah & Tim mengenai situasi pengaduan saat ini",
            },
            topUrgentActions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 tindakan paling genting yang harus segera dieksekusi dalam 1-3 jam pertama",
            },
            prioritizedList: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  complaintId: { type: Type.STRING },
                  recommendedOrder: { type: Type.INTEGER },
                  priorityTier: { type: Type.STRING, description: "CRITICAL | HIGH | MEDIUM | LOW" },
                  reasonForPriority: { type: Type.STRING },
                  actionableRecommendation: { type: Type.STRING },
                },
                required: ["complaintId", "recommendedOrder", "priorityTier", "reasonForPriority", "actionableRecommendation"],
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
    console.warn("Notice: Gemini batch prioritization quota/network fallback:", error?.message);
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

// Endpoint for AI Consultation / Chat regarding school SOP & handling guidance
app.post("/api/ai/consult", async (req, res) => {
  const { message, complaintContext, chatHistory } = req.body;
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
    console.warn("Notice: Gemini consultation quota/network fallback:", error?.message);
    const fallbackReply = `Berdasarkan pedoman tata kelola dan K3 sekolah: Pastikan keselamatan siswa dan guru selalu menjadi prioritas utama. Segera amankan area terkait atau berikan pendampingan konseling tertutup jika berkaitan dengan bullying, lalu catat kronologi lengkap dalam sistem SIPENGADU. (Catatan: Sistem saat ini mengaktifkan mode proteksi kuota)`;
    return res.json({ success: true, reply: fallbackReply, fallbackUsed: true });
  }
});

// Start Server with Vite Middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SIPENGADU server running on http://localhost:${PORT}`);
  });
}

startServer();
