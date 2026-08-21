import React, { useState, useRef } from "react";
import { 
  X, 
  Camera, 
  UploadCloud, 
  Sparkles, 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  Wrench, 
  Building2, 
  HeartHandshake, 
  EyeOff, 
  User, 
  MapPin, 
  FileText,
  Loader2,
  Trash2,
  HelpCircle
} from "lucide-react";
import { ComplaintCategory, UrgencyLevel, Complaint, UserProfile, AIAnalysis } from "../types";
import { analyzeComplaintWithAI } from "../services/geminiService";

interface ReportFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newComplaint: Omit<Complaint, "id" | "ticketNumber" | "logs" | "createdAt" | "updatedAt">) => void;
  currentUser: UserProfile;
}

const CATEGORY_DETAILS = {
  sarpras: {
    title: "Kerusakan Sarana Prasarana",
    desc: "AC rusak, lampu/korslet listrik, atap bocor, kursi patah, sanitasi/toilet, proyektor, lab.",
    icon: Wrench,
    color: "from-amber-500 to-orange-600",
    bgColor: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 border-amber-300",
    subCategories: [
      "Instalasi Listrik & K3",
      "Struktur Bangunan & Plafon",
      "Sanitasi & Toilet Siswa/Guru",
      "Fasilitas Kelas & Meja/Kursi",
      "Perangkat TIK / Proyektor / Lab",
      "Fasilitas Olahraga & Lapangan",
      "Lainnya (Sarpras)",
    ],
  },
  bullying: {
    title: "Pengaduan Perundungan (Bullying)",
    desc: "Kekerasan fisik, pemalakan, ejekan verbal, pengucilan, pelecehan, atau cyberbullying.",
    icon: Shield,
    color: "from-rose-500 to-pink-600",
    bgColor: "bg-rose-50 dark:bg-rose-950/40 text-rose-600 border-rose-300",
    subCategories: [
      "Perundungan Fisik / Kekerasan",
      "Perundungan Verbal & Ejekan",
      "Cyberbullying (Grup WA / Medsos)",
      "Pemalakan / Pemerasan Uang/Barang",
      "Pengucilan Sosial / Relasional",
      "Pelecehan / Kekerasan Seksual (TPPK)",
      "Lainnya (Kekerasan Anak)",
    ],
  },
  pelayanan: {
    title: "Pelayanan & Administrasi Sekolah",
    desc: "Layanan TU, kurikulum, kebersihan lingkungan, kantin/katering, transparansi, keamanan.",
    icon: Building2,
    color: "from-blue-500 to-indigo-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 border-blue-300",
    subCategories: [
      "Administrasi Tata Usaha & Legalisir",
      "Kebersihan Lingkungan & Sampah",
      "Kantin & Katering Sekolah",
      "Keamanan Satpam & Parkir",
      "Pelayanan Perpustakaan / Lab",
      "Jadwal & Komunikasi Akademik",
      "Lainnya (Pelayanan Umum)",
    ],
  },
};

export const ReportFormModal: React.FC<ReportFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  currentUser,
}) => {
  const [category, setCategory] = useState<ComplaintCategory>("sarpras");
  const [subCategory, setSubCategory] = useState<string>("Instalasi Listrik & K3");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [urgencyLevel, setUrgencyLevel] = useState<UrgencyLevel>("sedang");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [reporterName, setReporterName] = useState(currentUser.name);
  const [reporterRole, setReporterRole] = useState(currentUser.roleTitle);
  const [reporterContact, setReporterContact] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);

  // Camera capture states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // AI Pre-analysis state
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  const [aiPreview, setAiPreview] = useState<AIAnalysis | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleCategoryChange = (newCat: ComplaintCategory) => {
    setCategory(newCat);
    setSubCategory(CATEGORY_DETAILS[newCat].subCategories[0]);
    if (newCat === "bullying") {
      setIsAnonymous(true);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotos((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Camera start/stop & capture
  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.warn("Unable to access camera:", err);
      alert("Kamera tidak dapat diakses atau izin ditolak. Silakan gunakan upload foto biasa.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setPhotos((prev) => [...prev, dataUrl]);
      }
    }
    stopCamera();
  };

  const handleRunAIPreview = async () => {
    if (!title || !description) {
      alert("Mohon isi Judul dan Deskripsi laporan terlebih dahulu untuk dianalisis AI.");
      return;
    }
    setIsAnalyzingAI(true);
    try {
      const analysis = await analyzeComplaintWithAI({
        title,
        category,
        subCategory,
        description,
        location,
        urgencyLevel,
        isAnonymous,
        reporterRole: isAnonymous ? "Anonim" : reporterRole,
      });
      setAiPreview(analysis);
    } catch (err) {
      console.error("AI preview error:", err);
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert("Harap lengkapi judul dan deskripsi pengaduan.");
      return;
    }

    let finalAIAnalysis = aiPreview;
    if (!finalAIAnalysis) {
      // Auto analyze in background if user hasn't clicked preview
      finalAIAnalysis = await analyzeComplaintWithAI({
        title,
        category,
        subCategory,
        description,
        location,
        urgencyLevel,
        isAnonymous,
        reporterRole: isAnonymous ? "Anonim" : reporterRole,
      });
    }

    const priorityScore = finalAIAnalysis ? finalAIAnalysis.priorityScore : (urgencyLevel === "darurat" ? 90 : urgencyLevel === "mendesak" ? 75 : 50);

    onSubmit({
      title,
      category,
      subCategory,
      description,
      location: location || "Lingkungan Sekolah",
      urgencyLevel,
      isAnonymous,
      reporterName: isAnonymous ? "Anonim (Dirahasiakan)" : reporterName,
      reporterRole: isAnonymous ? "Guru / Warga Sekolah" : reporterRole,
      reporterContact: isAnonymous ? undefined : reporterContact,
      photos,
      repairProofPhotos: [],
      status: "dilaporkan",
      priorityScore,
      aiAnalysis: finalAIAnalysis,
      assignedDepartment: finalAIAnalysis?.assignedDepartment,
    });

    stopCamera();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">Formulir Pengaduan Sekolah Terpadu</h3>
              <p className="text-xs text-slate-400">Laporkan kerusakan sarpras, bullying, atau pelayanan sekolah</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1 text-slate-800 dark:text-slate-200">
          {/* Step 1: Pilih Kategori Pengaduan */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              1. Pilih Kategori Pengaduan <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(["sarpras", "bullying", "pelayanan"] as ComplaintCategory[]).map((catKey) => {
                const config = CATEGORY_DETAILS[catKey];
                const IconComponent = config.icon;
                const isSelected = category === catKey;
                return (
                  <div
                    key={catKey}
                    onClick={() => handleCategoryChange(catKey)}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition relative flex flex-col justify-between ${
                      isSelected
                        ? `${config.bgColor} shadow-sm ring-1 ring-offset-1 ring-blue-500`
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/50"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className={`p-2 rounded-lg bg-gradient-to-r ${config.color} text-white shadow`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                        {config.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
                        {config.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sub-Category Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Sub-Kategori Spesifik
              </label>
              <select
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {CATEGORY_DETAILS[category].subCategories.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Tingkat Urgensi Menurut Pelapor <span className="text-rose-500">*</span>
              </label>
              <select
                value={urgencyLevel}
                onChange={(e) => setUrgencyLevel(e.target.value as UrgencyLevel)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="rendah">🟢 Rendah (Tidak mendesak, perbaikan berkala)</option>
                <option value="sedang">🟡 Sedang (Mengganggu kenyamanan KBM/layanan)</option>
                <option value="mendesak">🟠 Mendesak (Harus ditangani dalam 24 jam)</option>
                <option value="darurat">🔴 Darurat K3 / Bahaya Jiwa / Bullying Berat (Segera!)</option>
              </select>
            </div>
          </div>

          {/* Judul & Lokasi */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Judul Ringkas Masalah / Kejadian <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Stop Kontak Lab Komputer 2 Korslet Percikan Api"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-500" />
                  <span>Lokasi Spesifik Kejadian / Kerusakan</span>
                </span>
                <span className="text-[11px] text-slate-400">Gedung, Lantai, No. Ruang</span>
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Contoh: Gedung B, Lantai 2, Ruang Lab Komputer 2"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Deskripsi Kronologi / Detail Kerusakan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Deskripsi Rinci Masalah & Dampak <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan kronologi secara jelas, apa yang rusak/terjadi, potensi bahaya, pihak yang terdampak, atau langkah awal yang sudah dilakukan..."
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed"
              required
            />
          </div>

          {/* Foto Bukti / Kamera */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Camera className="w-4 h-4 text-slate-500" />
                <span>Foto Bukti Kerusakan / Dokumen Kejadian</span>
              </span>
              <span className="text-[11px] text-slate-400">Opsional namun sangat disarankan</span>
            </label>

            {/* Live Camera Box if active */}
            {isCameraActive && (
              <div className="mb-3 p-3 bg-slate-900 rounded-xl border border-slate-700 text-center">
                <video ref={videoRef} autoPlay playsInline className="w-full max-h-60 rounded-lg object-cover mx-auto" />
                <div className="mt-3 flex items-center justify-center space-x-3">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg flex items-center space-x-1 shadow"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Ambil Jepretan</span>
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-lg"
                  >
                    Batal Kamera
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2.5 items-center">
              <button
                type="button"
                onClick={startCamera}
                className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center space-x-2 border border-slate-300 dark:border-slate-700 transition"
              >
                <Camera className="w-4 h-4 text-blue-500" />
                <span>Buka Kamera Langsung</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center space-x-2 border border-slate-300 dark:border-slate-700 transition"
              >
                <UploadCloud className="w-4 h-4 text-indigo-500" />
                <span>Unggah File Foto</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Thumbnail Preview list */}
            {photos.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {photos.map((src, index) => (
                  <div key={index} className="relative group w-20 h-20 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 shadow-sm">
                    <img src={src} alt={`Bukti ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPhotos((prev) => prev.filter((_, i) => i !== index))}
                      className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition shadow"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Identitas Pelapor & Mode Anonim */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                <User className="w-4 h-4 text-blue-500" />
                <span>Identitas & Kerahasiaan Pelapor</span>
              </span>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center space-x-1">
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Kirim Sebagai Anonim (Rahasia)</span>
                </span>
              </label>
            </div>

            {!isAnonymous ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Jabatan / Peran</label>
                  <input
                    type="text"
                    value={reporterRole}
                    onChange={(e) => setReporterRole(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">No. WhatsApp (Notifikasi)</label>
                  <input
                    type="tel"
                    value={reporterContact}
                    onChange={(e) => setReporterContact(e.target.value)}
                    placeholder="0812xxxx"
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
              </div>
            ) : (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-lg text-xs text-rose-700 dark:text-rose-300">
                🔒 <strong>Mode Perlindungan Saksi & Korban Aktif:</strong> Identitas pelapor akan disamarkan sebagai Anonim dan laporan kasus ini hanya dapat diakses secara terbatas oleh Tim Konselor BK / Satgas TPPK dan Kepala Sekolah sesuai Permendikbud PPKSP.
              </div>
            )}
          </div>

          {/* AI Pre-Analysis Preview Box */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50/70 to-blue-50/70 dark:from-indigo-950/30 dark:to-blue-950/30 border border-indigo-200 dark:border-indigo-800/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                  Asisten Analisis Prioritas & SOP AI (Gemini 3.7)
                </span>
              </div>
              <button
                type="button"
                onClick={handleRunAIPreview}
                disabled={isAnalyzingAI || !title}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center space-x-1 shadow transition disabled:opacity-50"
              >
                {isAnalyzingAI ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menganalisis...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Cek Skor Prioritas AI</span>
                  </>
                )}
              </button>
            </div>

            {aiPreview ? (
              <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300 pt-1">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">Prediksi Skor Prioritas:</span>
                  <span className={`px-2 py-0.5 rounded-full font-bold text-white ${
                    aiPreview.priorityScore >= 85 ? "bg-rose-600" : aiPreview.priorityScore >= 70 ? "bg-amber-600" : "bg-emerald-600"
                  }`}>
                    {aiPreview.priorityScore}/100 ({aiPreview.priorityLevel})
                  </span>
                  <span className="text-[11px] text-slate-500">Estimasi Waktu: {aiPreview.estimatedTimeframe}</span>
                </div>
                <p className="italic bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-lg border border-indigo-100 dark:border-indigo-900/40">
                  &ldquo;{aiPreview.summary}&rdquo;
                </p>
                {aiPreview.immediateActions && aiPreview.immediateActions.length > 0 && (
                  <div>
                    <span className="font-semibold text-rose-600 dark:text-rose-400">Langkah Tanggap Pertama yang Disarankan:</span>
                    <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-600 dark:text-slate-400">
                      {aiPreview.immediateActions.slice(0, 2).map((act, i) => (
                        <li key={i}>{act}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80">
                Klik tombol di atas untuk menganalisis tingkat keparahan risiko K3/bullying, estimasi waktu penanganan, dan SOP langkah penyelesaian secara otomatis.
              </p>
            )}
          </div>

          {/* Footer Submit Buttons */}
          <div className="pt-2 flex items-center justify-end space-x-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 flex items-center space-x-2 transition active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Kirim Laporan Pengaduan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
