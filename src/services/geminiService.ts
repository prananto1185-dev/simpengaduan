import { AIAnalysis, BatchPrioritizationResult, Complaint } from "../types";

export async function analyzeComplaintWithAI(complaintData: {
  title: string;
  category: string;
  subCategory?: string;
  description: string;
  location: string;
  urgencyLevel: string;
  isAnonymous?: boolean;
  reporterRole?: string;
}): Promise<AIAnalysis> {
  try {
    const response = await fetch("/api/ai/analyze-complaint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(complaintData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const data = await response.json();
    if (data.success && data.analysis) {
      return {
        ...data.analysis,
        analyzedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      };
    }
    throw new Error(data.error || "Analysis failed");
  } catch (error) {
    console.warn("Using fallback rule-based AI analyzer:", error);
    return generateFallbackAIAnalysis(complaintData);
  }
}

export async function batchPrioritizeWithAI(complaints: Complaint[]): Promise<BatchPrioritizationResult> {
  try {
    const response = await fetch("/api/ai/prioritize-batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ complaints }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const data = await response.json();
    if (data.success && data.result) {
      return data.result;
    }
    throw new Error(data.error || "Batch prioritization failed");
  } catch (error) {
    console.warn("Using fallback batch prioritization:", error);
    return generateFallbackBatchPrioritization(complaints);
  }
}

export async function consultAIAdvisor(message: string, complaintContext?: any): Promise<string> {
  try {
    const response = await fetch("/api/ai/consult", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, complaintContext }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const data = await response.json();
    if (data.success && data.reply) {
      return data.reply;
    }
    throw new Error(data.error || "Consultation failed");
  } catch (error) {
    console.warn("Fallback AI consultation response:", error);
    return "Berdasarkan pedoman tata kelola dan K3 sekolah: Pastikan keselamatan siswa dan guru selalu menjadi prioritas utama. Segera amankan area terkait atau berikan pendampingan konseling tertutup jika berkaitan dengan bullying, lalu catat kronologi lengkap dalam sistem.";
  }
}

// Fallback intelligent heuristics if backend server is starting or network delayed
function generateFallbackAIAnalysis(data: {
  title: string;
  category: string;
  subCategory?: string;
  description: string;
  location: string;
  urgencyLevel: string;
}): AIAnalysis {
  const text = `${data.title} ${data.description}`.toLowerCase();
  let score = 50;
  let level: 'Kritis' | 'Tinggi' | 'Sedang' | 'Rendah' = 'Sedang';

  if (text.includes('api') || text.includes('listrik') || text.includes('korslet') || text.includes('runtuh') || text.includes('darah') || text.includes('pukul') || data.urgencyLevel === 'darurat') {
    score = 92;
    level = 'Kritis';
  } else if (text.includes('bullying') || text.includes('ancam') || text.includes('bocor') || text.includes('pecah') || data.urgencyLevel === 'mendesak') {
    score = 80;
    level = 'Tinggi';
  } else if (data.urgencyLevel === 'sedang') {
    score = 60;
    level = 'Sedang';
  } else {
    score = 35;
    level = 'Rendah';
  }

  let dept = 'Tim Sarana Prasarana';
  if (data.category === 'bullying') dept = 'Satgas TPPK & Bimbingan Konseling';
  if (data.category === 'pelayanan') dept = 'Tata Usaha & Humas Sekolah';

  return {
    priorityScore: score,
    priorityLevel: level,
    summary: `Pengaduan mengenai ${data.title} di lokasi ${data.location || 'lingkungan sekolah'} memerlukan penanganan terarah.`,
    riskAssessment: level === 'Kritis' 
      ? 'Dapat menimbulkan bahaya keselamatan jiwa, cidera fisik, atau trauma psikologis mendalam jika tidak ditangani segera.'
      : 'Berpotensi mengganggu kenyamanan proses belajar mengajar dan menurunkan kualitas layanan sekolah.',
    immediateActions: [
      'Lakukan pengamanan lokasi atau isolasi sumber risiko segera.',
      'Koordinasikan dengan guru piket dan kepala bagian terkait.',
      'Pastikan siswa terlindungi dari potensi bahaya.',
    ],
    resolutionSteps: [
      'Petugas teknis/konselor melakukan asesmen langsung di tempat.',
      'Eksekusi perbaikan atau mediasi sesuai standar operasional prosedur sekolah.',
      'Catat hasil penanganan dan unggah foto dokumentasi hasil perbaikan.',
    ],
    preventiveMeasures: [
      'Lakukan pemeliharaan preventif dan pengawasan rutin mingguan.',
      'Edukasi warga sekolah terkait tata tertib dan keselamatan bersama.',
    ],
    assignedDepartment: dept,
    estimatedTimeframe: level === 'Kritis' ? '1 - 3 Jam' : level === 'Tinggi' ? '1 Hari Kerja' : '2 - 3 Hari Kerja',
    requiredResources: ['Peralatan standar teknis', 'Lembar SOP Berita Acara', 'Dokumentasi kamera'],
    analyzedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
  };
}

function generateFallbackBatchPrioritization(complaints: Complaint[]): BatchPrioritizationResult {
  const activeComplaints = complaints.filter(c => c.status !== 'selesai' && c.status !== 'ditolak');
  const sorted = [...activeComplaints].sort((a, b) => (b.priorityScore || 50) - (a.priorityScore || 50));

  return {
    executiveSummary: `Ditemukan ${activeComplaints.length} laporan aktif yang membutuhkan tindakan. Prioritaskan laporan dengan risiko K3 dan perlindungan anak terlebih dahulu.`,
    topUrgentActions: [
      "Amankan lokasi yang mengalami gangguan listrik/struktur bangunan berbahaya.",
      "Lakukan pendampingan mendesak bagi korban kasus perundungan aktif.",
      "Tugaskan koordinator sarpras untuk memeriksa ketersediaan material perbaikan.",
    ],
    prioritizedList: sorted.map((c, idx) => ({
      complaintId: c.id,
      recommendedOrder: idx + 1,
      priorityTier: c.priorityScore >= 85 ? 'CRITICAL' : c.priorityScore >= 70 ? 'HIGH' : c.priorityScore >= 45 ? 'MEDIUM' : 'LOW',
      reasonForPriority: `Skor AI ${c.priorityScore}/100 pada kategori ${c.category.toUpperCase()} (${c.urgencyLevel}).`,
      actionableRecommendation: `Tugaskan ${c.assignedTo || 'petugas terkait'} untuk segera mengecek lokasi: ${c.location}.`,
    })),
  };
}
