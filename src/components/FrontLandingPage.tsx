import React, { useState, useRef } from "react";
import { 
  Send, 
  Search, 
  ShieldCheck, 
  Clock, 
  Camera, 
  UploadCloud, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Wrench, 
  Shield, 
  Building2, 
  EyeOff, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  Lock, 
  ArrowRight, 
  Copy, 
  Check, 
  ExternalLink,
  ChevronRight,
  HelpCircle,
  QrCode,
  X,
  Layers,
  Flame,
  AlertOctagon
} from "lucide-react";
import { Complaint, ComplaintCategory, UrgencyLevel, AIAnalysis } from "../types";
import { analyzeComplaintWithAI } from "../services/geminiService";

interface FrontLandingPageProps {
  onGoToLogin: () => void;
  onSubmitComplaint: (complaintData: Omit<Complaint, "id" | "ticketNumber" | "logs" | "createdAt" | "updatedAt">) => Promise<Complaint>;
  complaints: Complaint[];
  onOpenDetailModal: (complaint: Complaint) => void;
}

export const FrontLandingPage: React.FC<FrontLandingPageProps> = ({
  onGoToLogin,
  onSubmitComplaint,
  complaints,
  onOpenDetailModal,
}) => {
  // Tab selector: "kirim" | "lacak"
  const [activeTab, setActiveTab] = useState<"kirim" | "lacak">("kirim");

  // Form states
  const [namaLengkap, setNamaLengkap] = useState("");
  const [email, setEmail] = useState("");
  const [telepon, setTelepon] = useState("");
  const [subjek, setSubjek] = useState("");
  const [kategori, setKategori] = useState<ComplaintCategory>("sarpras");
  const [subKategori, setSubKategori] = useState("Instalasi Listrik & K3");
  const [lokasi, setLokasi] = useState("");
  const [urgensi, setUrgensi] = useState<UrgencyLevel>("sedang");
  const [isiPengaduan, setIsiPengaduan] = useState("");
  const [isAnonim, setIsAnonim] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Camera capture
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Success dialog state after submit
  const [submittedTicket, setSubmittedTicket] = useState<Complaint | null>(null);
  const [copiedTicket, setCopiedTicket] = useState(false);

  // Tracker state
  const [trackingQuery, setTrackingQuery] = useState("");
  const [searchedComplaint, setSearchedComplaint] = useState<Complaint | null>(null);
  const [searchAttempted, setSearchAttempted] = useState(false);

  // Handle file uploads
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
      }
    } catch (err) {
      alert("Tidak dapat mengakses kamera. Pastikan izin kamera telah diizinkan.");
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
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL("image/jpeg", 0.85);
      setPhotos((prev) => [...prev, base64]);
    }
    stopCamera();
  };

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAnonim && namaLengkap.trim().length < 3) {
      alert("Nama lengkap minimal 3 karakter.");
      return;
    }
    if (subjek.trim().length < 5) {
      alert("Subjek aduan minimal 5 karakter.");
      return;
    }
    if (isiPengaduan.trim().length < 20) {
      alert("Isi pengaduan minimal 20 karakter agar jelas dan dapat ditindaklanjuti.");
      return;
    }

    setIsSubmitting(true);
    try {
      const newComplaint = await onSubmitComplaint({
        title: subjek.trim(),
        category: kategori,
        subCategory: subKategori,
        description: isiPengaduan.trim(),
        location: lokasi.trim() || "Lingkungan Sekolah SMPN 2 Bantul",
        urgencyLevel: urgensi,
        isAnonymous: isAnonim,
        reporterName: isAnonim ? "Anonim (Rahasia)" : namaLengkap.trim(),
        reporterRole: isAnonim ? "Siswa/Warga Sekolah" : "Warga Sekolah / Pelapor",
        reporterContact: telepon.trim() || email.trim() || undefined,
        photos: photos,
        status: "dilaporkan",
        priorityScore: urgensi === "darurat" ? 90 : urgensi === "mendesak" ? 75 : 55,
      });

      setSubmittedTicket(newComplaint);
      // Reset form
      setNamaLengkap("");
      setEmail("");
      setTelepon("");
      setSubjek("");
      setIsiPengaduan("");
      setLokasi("");
      setPhotos([]);
      setIsAnonim(false);
    } catch (error) {
      console.error("Submit error:", error);
      alert("Terjadi kesalahan saat mengirim pengaduan. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tracker search handler
  const handleSearchTicket = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSearchAttempted(true);
    const cleaned = trackingQuery.trim().toUpperCase();
    if (!cleaned) {
      setSearchedComplaint(null);
      return;
    }

    const found = complaints.find(
      (c) => c.ticketNumber.toUpperCase() === cleaned || c.id.toUpperCase() === cleaned || c.title.toLowerCase().includes(cleaned.toLowerCase())
    );
    setSearchedComplaint(found || null);
  };

  const copyTicketToClipboard = (ticketNum: string) => {
    navigator.clipboard.writeText(ticketNum);
    setCopiedTicket(true);
    setTimeout(() => setCopiedTicket(false), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans">
      {/* 1. Header Bar: SMPN 2 Bantul */}
      <header className="bg-emerald-950 text-white border-b border-emerald-900 sticky top-0 z-30 shadow-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* School Crest / Logo */}
            <div className="w-10 h-10 rounded-full bg-emerald-800 border-2 border-amber-400 flex items-center justify-center shadow-inner shrink-0 overflow-hidden">
              <span className="text-xs font-black text-amber-300 tracking-tighter">SMP2</span>
            </div>
            <div>
              <h1 className="font-extrabold text-sm sm:text-base tracking-wide text-white flex items-center">
                SMP NEGERI 2 BANTUL
              </h1>
              <p className="text-[11px] text-emerald-200 tracking-tight font-medium">
                Bertaqwa, Berprestasi, dan Berkarakter
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="btn-nav-admin-login"
              onClick={onGoToLogin}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-800/90 hover:bg-emerald-700 text-white text-xs font-semibold border border-emerald-600 shadow-sm transition"
            >
              <Lock className="w-3.5 h-3.5 text-amber-300" />
              <span>Login Admin / Petugas</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Background Section with Official School Header */}
      <section className="relative bg-slate-900 text-white py-12 px-4 sm:px-6 overflow-hidden">
        {/* Background Image Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-25 filter blur-xs scale-105"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=1600&q=80')`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-900/90 to-slate-950" />

        <div className="relative max-w-4xl mx-auto text-center space-y-3">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Layanan Pengaduan & K3 Resmi</span>
          </div>

          {/* Blue Main Card Title */}
          <div className="bg-blue-600 rounded-2xl p-6 sm:p-8 text-white shadow-xl max-w-3xl mx-auto border border-blue-500/40">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight uppercase">
              ADUAN & ASPIRASI
            </h2>
            <p className="mt-2 text-sm sm:text-base text-blue-100 max-w-xl mx-auto leading-relaxed">
              Sampaikan aduan, saran, dan aspirasi Anda kepada kami. Kami berkomitmen untuk mendengar dan merespons setiap masukan.
            </p>
          </div>
        </div>
      </section>

      {/* 3. 3 Feature Highlights (from user screenshot) */}
      <section className="max-w-4xl mx-auto w-full px-4 -mt-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Card 1: Mudah Disampaikan */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition">
            <div className="flex items-center space-x-2 text-blue-600 mb-1.5">
              <FileText className="w-4 h-4" />
              <h3 className="font-bold text-xs uppercase tracking-wider">MUDAH DISAMPAIKAN</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Isi formulir singkat, aduan langsung tercatat dalam sistem kami.
            </p>
          </div>

          {/* Card 2: Aman & Terpercaya */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition">
            <div className="flex items-center space-x-2 text-blue-600 mb-1.5">
              <Shield className="w-4 h-4" />
              <h3 className="font-bold text-xs uppercase tracking-wider">AMAN & TERPERCAYA</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Identitas Anda dijaga kerahasiaannya oleh pihak sekolah.
            </p>
          </div>

          {/* Card 3: Transparan */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition">
            <div className="flex items-center space-x-2 text-blue-600 mb-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <h3 className="font-bold text-xs uppercase tracking-wider">TRANSPARAN</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Lacak perkembangan aduan Anda kapan saja menggunakan kode unik.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Action Selector Buttons */}
      <section className="max-w-4xl mx-auto w-full px-4 mt-6">
        <div className="grid grid-cols-2 gap-3">
          <button
            id="btn-tab-kirim-aduan"
            onClick={() => setActiveTab("kirim")}
            className={`py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center space-x-2 transition shadow-sm ${
              activeTab === "kirim"
                ? "bg-blue-600 text-white shadow-blue-500/20"
                : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Kirim Aduan</span>
          </button>

          <button
            id="btn-tab-lacak-aduan"
            onClick={() => setActiveTab("lacak")}
            className={`py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center space-x-2 transition shadow-sm ${
              activeTab === "lacak"
                ? "bg-blue-600 text-white shadow-blue-500/20"
                : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Lacak Aduan</span>
          </button>
        </div>
      </section>

      {/* 5. Main Content Area: Form Pengaduan vs Lacak Aduan */}
      <main className="max-w-4xl mx-auto w-full px-4 py-6 flex-1">
        {activeTab === "kirim" ? (
          /* FORM PENGADUAN (Matches screenshot structure exactly) */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Blue Form Header */}
            <div className="bg-blue-600 text-white px-6 py-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-200">FORMULIR</span>
              <h3 className="text-lg sm:text-xl font-extrabold uppercase tracking-tight">
                FORM PENGADUAN
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Row 1: Nama Lengkap & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Lengkap <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required={!isAnonim}
                    disabled={isAnonim}
                    value={isAnonim ? "Anonim (Dirahasiakan)" : namaLengkap}
                    onChange={(e) => setNamaLengkap(e.target.value)}
                    placeholder="Masukkan nama lengkap"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white disabled:opacity-60"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">Nama minimal 3 karakter</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email <span className="text-slate-400 font-normal">(Opsional)</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contoh@email.com"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">Untuk menerima notifikasi status perbaikan</p>
                </div>
              </div>

              {/* Row 2: Telepon/WA & Subjek */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Telepon / WA <span className="text-slate-400 font-normal">(Opsional)</span>
                  </label>
                  <input
                    type="tel"
                    value={telepon}
                    onChange={(e) => setTelepon(e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Subjek <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={subjek}
                    onChange={(e) => setSubjek(e.target.value)}
                    placeholder="Subjek pengaduan"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">Subjek minimal 5 karakter</p>
                </div>
              </div>

              {/* Row 3: Kategori, Lokasi, dan Urgensi */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kategori Pengaduan <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={kategori}
                    onChange={(e) => {
                      const val = e.target.value as ComplaintCategory;
                      setKategori(val);
                      if (val === "sarpras") setSubKategori("Instalasi Listrik & K3");
                      else if (val === "bullying") {
                        setSubKategori("Perundungan Fisik / Kekerasan");
                        setIsAnonim(true);
                      } else setSubKategori("Administrasi Tata Usaha & Legalisir");
                    }}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-medium"
                  >
                    <option value="sarpras">Kerusakan Sarana Prasarana (K3)</option>
                    <option value="bullying">Pengaduan Bullying / TPPK</option>
                    <option value="pelayanan">Pelayanan & Administrasi Sekolah</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Lokasi Kejadian / Ruang
                  </label>
                  <input
                    type="text"
                    value={lokasi}
                    onChange={(e) => setLokasi(e.target.value)}
                    placeholder="Contoh: Kelas 8B, Lab Komputer, Toilet..."
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tingkat Urgensi
                  </label>
                  <select
                    value={urgensi}
                    onChange={(e) => setUrgensi(e.target.value as UrgencyLevel)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-medium"
                  >
                    <option value="rendah">Biasa (Rendah)</option>
                    <option value="sedang">Sedang (Standar)</option>
                    <option value="mendesak">Mendesak (Prioritas)</option>
                    <option value="darurat">Darurat K3 / Butuh Aksi Cepat</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Isi Pengaduan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Isi Pengaduan <span className="text-rose-600">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={isiPengaduan}
                  onChange={(e) => setIsiPengaduan(e.target.value)}
                  placeholder="Jelaskan aduan, saran, atau aspirasi Anda secara detail..."
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
                <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                  <span>Isi pengaduan minimal 20 karakter</span>
                  <span className={isiPengaduan.length < 20 ? "text-rose-500 font-semibold" : "text-emerald-600 font-semibold"}>
                    {isiPengaduan.length} / 20 karakter
                  </span>
                </div>
              </div>

              {/* Lampiran Foto Kerusakan / Bukti */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                      <Camera className="w-4 h-4 text-blue-600" />
                      <span>Lampiran Foto Kerusakan / Bukti (Opsional)</span>
                    </span>
                    <p className="text-[11px] text-slate-500">Membantu petugas dan AI mengidentifikasi masalah secara akurat</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 flex items-center space-x-1"
                    >
                      <UploadCloud className="w-3.5 h-3.5 text-blue-600" />
                      <span>Pilih File</span>
                    </button>

                    <button
                      type="button"
                      onClick={isCameraActive ? stopCamera : startCamera}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 ${
                        isCameraActive
                          ? "bg-rose-600 text-white"
                          : "bg-white border border-slate-300 hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{isCameraActive ? "Tutup Kamera" : "Ambil Foto"}</span>
                    </button>
                  </div>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  multiple
                  accept="image/*"
                  className="hidden"
                />

                {/* Live Camera View */}
                {isCameraActive && (
                  <div className="relative rounded-xl overflow-hidden bg-black border border-slate-700 max-w-md mx-auto aspect-video">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-2 bg-rose-600 text-white font-bold text-xs rounded-full shadow-lg hover:bg-rose-700 flex items-center space-x-2"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Jepret Foto</span>
                    </button>
                  </div>
                )}

                {/* Uploaded Photos Preview */}
                {photos.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {photos.map((p, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-300 group shadow-xs">
                        <img src={p} alt={`Bukti ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setPhotos((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute top-0.5 right-0.5 bg-rose-600 text-white rounded-full p-0.5 opacity-90 hover:opacity-100"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Anonymous Checkbox */}
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="anonim-check"
                  checked={isAnonim}
                  onChange={(e) => setIsAnonim(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="anonim-check" className="text-xs font-semibold text-slate-700 cursor-pointer flex items-center space-x-1">
                  <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                  <span>Kirim Sebagai Anonim (Rahasiakan nama dan kontak saya dari publik)</span>
                </label>
              </div>

              {/* Submit Button (Matching screenshot: black full width button) */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 bg-slate-900 hover:bg-black text-white text-xs sm:text-sm font-black rounded-lg uppercase tracking-wider shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4 text-white" />
                  <span>{isSubmitting ? "MENGIRIM & MENGANALISIS AI..." : "KIRIM ADUAN"}</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* LACAK ADUAN (Tracker View for public) */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="text-center max-w-md mx-auto space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">Lacak Status Aduan Anda</h3>
              <p className="text-xs text-slate-500">
                Masukkan Kode Tiket Pengaduan (misal: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono font-bold text-blue-600">LAP-2026-0801</code>) untuk memantau progres perbaikan secara transparan.
              </p>
            </div>

            {/* Search Input Bar */}
            <form onSubmit={handleSearchTicket} className="max-w-lg mx-auto flex gap-2">
              <input
                type="text"
                value={trackingQuery}
                onChange={(e) => setTrackingQuery(e.target.value)}
                placeholder="Ketik Nomor Tiket Pengaduan..."
                className="flex-1 px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow transition flex items-center space-x-1.5"
              >
                <Search className="w-4 h-4" />
                <span>Cari</span>
              </button>
            </form>

            {/* Quick Sample Tickets */}
            <div className="max-w-lg mx-auto flex flex-wrap items-center justify-center gap-2 pt-1 text-xs text-slate-500">
              <span className="font-semibold">Contoh Tiket:</span>
              {complaints.slice(0, 3).map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setTrackingQuery(c.ticketNumber);
                    setSearchedComplaint(c);
                    setSearchAttempted(true);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 font-mono text-[11px] transition"
                >
                  {c.ticketNumber}
                </button>
              ))}
            </div>

            {/* Search Result */}
            {searchAttempted && (
              <div className="pt-4 border-t border-slate-100">
                {searchedComplaint ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4 max-w-2xl mx-auto">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold bg-blue-600 text-white px-2.5 py-1 rounded-md">
                          {searchedComplaint.ticketNumber}
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700 uppercase">
                          {searchedComplaint.category}
                        </span>
                      </div>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${
                        searchedComplaint.status === "selesai"
                          ? "bg-emerald-100 text-emerald-800"
                          : searchedComplaint.status === "proses"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-blue-100 text-blue-800"
                      }`}>
                        Status: {searchedComplaint.status}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{searchedComplaint.title}</h4>
                      <p className="text-xs text-slate-600 mt-1">{searchedComplaint.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200">
                      <div>
                        <span className="text-slate-400 block">Lokasi:</span>
                        <span className="font-semibold text-slate-800">{searchedComplaint.location}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Petugas Penanggung Jawab:</span>
                        <span className="font-semibold text-slate-800">{searchedComplaint.assignedTo || "Tim Terpadu Sekolah"}</span>
                      </div>
                    </div>

                    {/* Timeline logs */}
                    {searchedComplaint.logs && searchedComplaint.logs.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <span className="text-xs font-bold text-slate-700 block">Riwayat Penanganan:</span>
                        <div className="space-y-2 border-l-2 border-blue-500 pl-3">
                          {searchedComplaint.logs.map((log) => (
                            <div key={log.id} className="text-xs space-y-0.5">
                              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                                <span className="font-semibold text-slate-700">{log.actionTitle}</span>
                                <span>{log.timestamp}</span>
                              </div>
                              <p className="text-slate-600">{log.note}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => onOpenDetailModal(searchedComplaint)}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center justify-center space-x-1"
                    >
                      <span>Lihat Rincian Lengkap & Foto Bukti</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    <p className="font-semibold text-slate-600">Tiket Tidak Ditemukan</p>
                    <p>Pastikan kode tiket yang dimasukkan sesuai dengan bukti pelaporan Anda.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* 6. Success Modal after Submit */}
      {submittedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Aduan Berhasil Terkirim!</h3>
              <p className="text-xs text-slate-600">
                Terima kasih atas kepedulian Anda. Sistem AI telah mencatat dan meneruskan tiket ke divisi terkait.
              </p>
            </div>

            {/* Ticket Code Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center space-y-2">
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">
                Kode Tiket Pelaporan Anda
              </span>
              <div className="flex items-center justify-center space-x-2">
                <span className="font-mono text-xl font-extrabold text-blue-950">
                  {submittedTicket.ticketNumber}
                </span>
                <button
                  onClick={() => copyTicketToClipboard(submittedTicket.ticketNumber)}
                  className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  title="Salin Kode Tiket"
                >
                  {copiedTicket ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-blue-600">
                Simpan nomor tiket ini untuk melacak status pengerjaan secara berkala.
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setTrackingQuery(submittedTicket.ticketNumber);
                  setSearchedComplaint(submittedTicket);
                  setSearchAttempted(true);
                  setActiveTab("lacak");
                  setSubmittedTicket(null);
                }}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow transition flex items-center justify-center space-x-1.5"
              >
                <Search className="w-4 h-4" />
                <span>Lacak Tiket Sekarang</span>
              </button>

              <button
                onClick={() => setSubmittedTicket(null)}
                className="w-full py-2 text-slate-500 hover:text-slate-800 text-xs font-semibold"
              >
                Tutup & Kembali
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Footer: SMP Negeri 2 Bantul Info & Map Widget */}
      <footer className="bg-emerald-950 text-emerald-100 border-t border-emerald-900 mt-12 py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-emerald-800 border border-amber-400 flex items-center justify-center font-black text-[9px] text-amber-300">
                SMP2
              </div>
              <span className="font-extrabold text-sm text-white">SMP NEGERI 2 BANTUL</span>
            </div>
            <p className="text-emerald-200 leading-relaxed">
              Jalan RA Kartini, Bantul, Daerah Istimewa Yogyakarta. Berkomitmen mewujudkan lingkungan belajar yang aman, nyaman, dan berkarakter.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white uppercase tracking-wider mb-2">Kontak Layanan</h4>
            <ul className="space-y-1.5 text-emerald-200">
              <li>Telepon: (0274) 367123</li>
              <li>Email: info@smpn2bantul.sch.id</li>
              <li>Satgas TPPK: 0812-3456-7890 (Layanan Rahasia)</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white uppercase tracking-wider mb-2">Akses Cepat Petugas</h4>
            <p className="text-emerald-300 mb-2">
              Bagi guru, teknisi sarpras, konselor BK, dan pimpinan sekolah:
            </p>
            <button
              onClick={onGoToLogin}
              className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg transition flex items-center space-x-1.5 shadow-sm"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Masuk Dashboard Petugas</span>
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-6 pt-4 border-t border-emerald-900/60 text-center text-[11px] text-emerald-400">
          © 2026 SIPENGADU - Sistem Pengaduan Terpadu SMP Negeri 2 Bantul. Dilindungi AI Analisis Risiko & K3.
        </div>
      </footer>
    </div>
  );
};
