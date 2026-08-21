import React, { useState, useRef } from "react";
import { 
  X, 
  Sparkles, 
  Clock, 
  MapPin, 
  User, 
  Shield, 
  Wrench, 
  Building2, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Send, 
  Camera, 
  UploadCloud, 
  Printer, 
  Flame, 
  Share2, 
  Star, 
  MessageSquare, 
  Loader2, 
  RotateCw,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { Complaint, ComplaintStatus, UserProfile, ProgressLog, AIAnalysis } from "../types";
import { getCategoryMeta, getStatusMeta } from "./ComplaintCard";
import { analyzeComplaintWithAI } from "../services/geminiService";
import confetti from "canvas-confetti";

interface ComplaintDetailModalProps {
  complaint: Complaint | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUpdateStatus: (complaintId: string, newStatus: ComplaintStatus, note: string, proofPhoto?: string) => void;
  onAssignPIC: (complaintId: string, assignedTo: string, department: string) => void;
  onAddLog: (complaintId: string, log: ProgressLog) => void;
  onUpdateAIAnalysis: (complaintId: string, analysis: AIAnalysis) => void;
  onSubmitFeedback: (complaintId: string, rating: number, feedback: string) => void;
  onOpenPrintReport: (complaint: Complaint) => void;
}

export const ComplaintDetailModal: React.FC<ComplaintDetailModalProps> = ({
  complaint,
  isOpen,
  onClose,
  currentUser,
  onUpdateStatus,
  onAssignPIC,
  onAddLog,
  onUpdateAIAnalysis,
  onSubmitFeedback,
  onOpenPrintReport,
}) => {
  if (!isOpen || !complaint) return null;

  const [activeTab, setActiveTab] = useState<"overview" | "ai_sop" | "timeline" | "repair_proof">("overview");
  const [newStatus, setNewStatus] = useState<ComplaintStatus>(complaint.status);
  const [statusNote, setStatusNote] = useState("");
  const [assignedPIC, setAssignedPIC] = useState(complaint.assignedTo || "");
  const [assignedDept, setAssignedDept] = useState(complaint.assignedDepartment || "");
  const [repairPhotoInput, setRepairPhotoInput] = useState<string>("");
  const [isReanalyzingAI, setIsReanalyzingAI] = useState(false);

  // Satisfaction feedback states
  const [rating, setRating] = useState(complaint.satisfactionRating || 5);
  const [feedbackText, setFeedbackText] = useState(complaint.satisfactionFeedback || "");
  const [isFeedbackSaved, setIsFeedbackSaved] = useState(!!complaint.satisfactionRating);

  const fileProofRef = useRef<HTMLInputElement | null>(null);

  const catMeta = getCategoryMeta(complaint.category);
  const statusMeta = getStatusMeta(complaint.status);
  const CategoryIcon = catMeta.icon;

  const handleStatusChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusNote.trim()) {
      alert("Mohon sertakan catatan progres/alasan perubahan status.");
      return;
    }

    onUpdateStatus(complaint.id, newStatus, statusNote, repairPhotoInput || undefined);

    if (newStatus === "selesai") {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (err) {
        // silent
      }
    }

    setStatusNote("");
    setRepairPhotoInput("");
  };

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignedPIC) return;
    onAssignPIC(complaint.id, assignedPIC, assignedDept || "Petugas Penanggung Jawab");
    alert(`Tugas berhasil didelegasikan kepada ${assignedPIC}`);
  };

  const handleProofPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setRepairPhotoInput(event.target!.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleReanalyzeWithAI = async () => {
    setIsReanalyzingAI(true);
    try {
      const freshAnalysis = await analyzeComplaintWithAI({
        title: complaint.title,
        category: complaint.category,
        subCategory: complaint.subCategory,
        description: complaint.description,
        location: complaint.location,
        urgencyLevel: complaint.urgencyLevel,
        isAnonymous: complaint.isAnonymous,
        reporterRole: complaint.reporterRole,
      });
      onUpdateAIAnalysis(complaint.id, freshAnalysis);
      alert("Analisis AI dan Rekomendasi SOP Berhasil Diperbarui!");
    } catch (err) {
      console.error("Failed to reanalyze with AI:", err);
    } finally {
      setIsReanalyzingAI(false);
    }
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitFeedback(complaint.id, rating, feedbackText);
    setIsFeedbackSaved(true);
    alert("Terima kasih! Penilaian kepuasan Anda berhasil disimpan.");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg bg-gradient-to-r ${catMeta.badgeClass}`}>
              <CategoryIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs px-2 py-0.5 bg-slate-800 text-blue-300 rounded font-bold border border-slate-700">
                  {complaint.ticketNumber}
                </span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${statusMeta.badgeClass}`}>
                  {statusMeta.label}
                </span>
              </div>
              <h3 className="font-bold text-base sm:text-lg mt-0.5 line-clamp-1">{complaint.title}</h3>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onOpenPrintReport(complaint)}
              title="Cetak Berita Acara Resmi"
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center space-x-1.5 text-xs font-semibold"
            >
              <Printer className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">Cetak Laporan</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Sub-Tabs inside Modal */}
        <div className="flex items-center space-x-2 px-6 py-2.5 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === "overview"
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:bg-white/50"
            }`}
          >
            Ringkasan & Detail
          </button>
          <button
            onClick={() => setActiveTab("ai_sop")}
            className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 ${
              activeTab === "ai_sop"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:bg-white/50"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>SOP & Rekomendasi AI</span>
          </button>
          <button
            onClick={() => setActiveTab("timeline")}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === "timeline"
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:bg-white/50"
            }`}
          >
            Timeline & Log Progres ({complaint.logs.length})
          </button>
          <button
            onClick={() => setActiveTab("repair_proof")}
            className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1 ${
              activeTab === "repair_proof"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:bg-white/50"
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Foto Sebelum & Sesudah</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 dark:text-slate-200">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Critical Warning Bar */}
              {(complaint.priorityScore >= 85 || complaint.urgencyLevel === "darurat") && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start space-x-3 text-rose-800 dark:text-rose-200">
                  <Flame className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold">Kasus Prioritas Kritis K3 / Perlindungan Anak</p>
                    <p className="mt-0.5 text-rose-700 dark:text-rose-300 leading-relaxed">
                      Laporan ini memiliki skor risiko {complaint.priorityScore}/100. Diperlukan respons tanggap darurat secepatnya untuk menjamin keselamatan warga sekolah.
                    </p>
                  </div>
                </div>
              )}

              {/* Grid 2 Columns: Information & Admin Action */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Cols: Main Info */}
                <div className="lg:col-span-2 space-y-5">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Deskripsi Kronologi Kejadian / Kerusakan
                    </h4>
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-sm leading-relaxed whitespace-pre-wrap">
                      {complaint.description}
                    </div>
                  </div>

                  {/* Meta Specs */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400 block font-medium">Lokasi</span>
                      <span className="font-bold text-slate-900 dark:text-white mt-1 flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="truncate">{complaint.location}</span>
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400 block font-medium">Pelapor</span>
                      <span className="font-bold text-slate-900 dark:text-white mt-1 flex items-center space-x-1">
                        <User className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="truncate">{complaint.reporterName}</span>
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400 block font-medium">Urgensi Pelapor</span>
                      <span className="font-bold uppercase text-slate-900 dark:text-white mt-1">
                        {complaint.urgencyLevel}
                      </span>
                    </div>
                  </div>

                  {/* Damage Photos Grid */}
                  {complaint.photos.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Foto Bukti Kerusakan / Kejadian
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {complaint.photos.map((src, i) => (
                          <div key={i} className="rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 aspect-video shadow-sm">
                            <img src={src} alt="Bukti" className="w-full h-full object-cover hover:scale-105 transition" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reporter Satisfaction Feedback if resolved */}
                  {complaint.status === "selesai" && (
                    <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center space-x-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Evaluasi & Kepuasan Pelapor</span>
                        </span>
                        <div className="flex items-center space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRating(star)}
                              className={`p-0.5 transition ${star <= rating ? "text-amber-500" : "text-slate-300"}`}
                            >
                              <Star className="w-4 h-4 fill-current" />
                            </button>
                          ))}
                        </div>
                      </div>

                      <form onSubmit={handleFeedbackSubmit} className="space-y-2 pt-1">
                        <input
                          type="text"
                          value={feedbackText}
                          onChange={(e) => setFeedbackText(e.target.value)}
                          placeholder="Tulis ulasan atau konfirmasi kepuasan terhadap hasil penanganan..."
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 rounded-lg text-xs"
                        />
                        <div className="flex justify-end">
                          <button
                            type="submit"
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow"
                          >
                            Simpan Ulasan Kepuasan
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>

                {/* Right 1 Col: Admin & Technician Workflow Panel */}
                <div className="space-y-5">
                  {/* Status Progression Form */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>Perbarui Status Penanganan</span>
                      <span className="text-[10px] text-blue-500 font-semibold">{currentUser.roleTitle}</span>
                    </h4>

                    <form onSubmit={handleStatusChangeSubmit} className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                          Pilih Status Baru
                        </label>
                        <select
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value as ComplaintStatus)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="dilaporkan">Menunggu Verifikasi</option>
                          <option value="ditinjau">Sedang Ditinjau Admin/BK</option>
                          <option value="proses">Sedang Dikerjakan di Lapangan</option>
                          <option value="menunggu_material">Menunggu Suku Cadang / Anggaran</option>
                          <option value="selesai">✅ Selesai (Terselesaikan)</option>
                          <option value="ditolak">❌ Ditolak / Duplikat</option>
                        </select>
                      </div>

                      {/* If status is "selesai", allow uploading proof photo right away */}
                      {newStatus === "selesai" && (
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-lg space-y-2">
                          <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center space-x-1">
                            <Camera className="w-3.5 h-3.5" />
                            <span>Unggah Foto Bukti Hasil Perbaikan</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => fileProofRef.current?.click()}
                            className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center space-x-1"
                          >
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>Pilih Foto Bukti Selesai</span>
                          </button>
                          <input
                            ref={fileProofRef}
                            type="file"
                            accept="image/*"
                            onChange={handleProofPhotoUpload}
                            className="hidden"
                          />
                          {repairPhotoInput && (
                            <div className="w-16 h-12 rounded overflow-hidden border border-emerald-400 mx-auto">
                              <img src={repairPhotoInput} alt="Bukti" className="w-full h-full object-cover" />
                            </div>
                          )}
                        </div>
                      )}

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                          Catatan Tindakan / Log Transparan <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                          rows={2}
                          value={statusNote}
                          onChange={(e) => setStatusNote(e.target.value)}
                          placeholder="Contoh: Teknisi telah mengganti kabel terbakar dan menguji tegangan..."
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow transition"
                      >
                        Simpan Progres & Kirim Notifikasi
                      </button>
                    </form>
                  </div>

                  {/* Assignee Delegation Box */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Penugasan Petugas (PIC)
                    </h4>

                    <form onSubmit={handleAssignSubmit} className="space-y-2 text-xs">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Nama Petugas PIC</label>
                        <input
                          type="text"
                          value={assignedPIC}
                          onChange={(e) => setAssignedPIC(e.target.value)}
                          placeholder="Contoh: Bambang Wicaksono, S.T"
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Divisi / Departemen</label>
                        <input
                          type="text"
                          value={assignedDept}
                          onChange={(e) => setAssignedDept(e.target.value)}
                          placeholder="Contoh: Divisi Sarpras / Tim BK"
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-1.5 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition"
                      >
                        Perbarui Penugasan
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AI RECOMMENDATIONS & SOP */}
          {activeTab === "ai_sop" && (
            <div className="space-y-6">
              {/* Top AI Badge and Re-run Button */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-gradient-to-r from-indigo-900 to-slate-900 text-white shadow-md">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-indigo-600 rounded-xl">
                    <Sparkles className="w-6 h-6 text-amber-300" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm sm:text-base">
                      Analisis Prioritas & Rekomendasi Solusi AI
                    </h4>
                    <p className="text-xs text-indigo-200">
                      Didukung Google Gemini 3.7 Flash berbasis SOP K3 Sekolah & PPKSP
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleReanalyzeWithAI}
                    disabled={isReanalyzingAI}
                    className="px-3.5 py-1.5 bg-indigo-700 hover:bg-indigo-600 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 shadow transition disabled:opacity-50"
                  >
                    {isReanalyzingAI ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Menganalisis...</span>
                      </>
                    ) : (
                      <>
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>Analisis Ulang AI</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {complaint.aiAnalysis ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left 2 Cols: Step-by-Step SOP */}
                  <div className="lg:col-span-2 space-y-5">
                    {/* Ringkasan & Risiko */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Ringkasan Inti & Asesmen Dampak Risiko
                      </span>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
                        {complaint.aiAnalysis.summary}
                      </p>
                      <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed bg-rose-50 dark:bg-rose-950/30 p-2.5 rounded-lg border border-rose-200 dark:border-rose-900/40">
                        <strong>⚠️ Analisis Risiko:</strong> {complaint.aiAnalysis.riskAssessment}
                      </p>
                    </div>

                    {/* Immediate Emergency Action */}
                    {complaint.aiAnalysis.immediateActions?.length > 0 && (
                      <div className="p-4 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-2">
                        <h5 className="text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center space-x-1.5">
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                          <span>1. Tindakan Tanggap Darurat / Pengamanan Awal</span>
                        </h5>
                        <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                          {complaint.aiAnalysis.immediateActions.map((act, i) => (
                            <li key={i} className="flex items-start space-x-2">
                              <span className="w-4 h-4 rounded-full bg-rose-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                {i + 1}
                              </span>
                              <span className="leading-relaxed">{act}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Resolution Steps SOP */}
                    {complaint.aiAnalysis.resolutionSteps?.length > 0 && (
                      <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 space-y-2">
                        <h5 className="text-xs font-bold text-blue-800 dark:text-blue-300 flex items-center space-x-1.5">
                          <Wrench className="w-4 h-4 text-blue-600" />
                          <span>2. SOP Langkah-Langkah Penyelesaian Teknis / Mediasi</span>
                        </h5>
                        <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                          {complaint.aiAnalysis.resolutionSteps.map((step, i) => (
                            <li key={i} className="flex items-start space-x-2">
                              <span className="w-4 h-4 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                {i + 1}
                              </span>
                              <span className="leading-relaxed">{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Preventive Measures */}
                    {complaint.aiAnalysis.preventiveMeasures?.length > 0 && (
                      <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-2">
                        <h5 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center space-x-1.5">
                          <Shield className="w-4 h-4 text-emerald-600" />
                          <span>3. Tindakan Pencegahan & Mitigasi Jangka Panjang</span>
                        </h5>
                        <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                          {complaint.aiAnalysis.preventiveMeasures.map((prev, i) => (
                            <li key={i} className="flex items-start space-x-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              <span className="leading-relaxed">{prev}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Right 1 Col: Score & Specs */}
                  <div className="space-y-4">
                    {/* Priority Score Meter */}
                    <div className="p-5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-center">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Skor Tingkat Prioritas AI
                      </span>
                      <div className="my-3">
                        <span className={`text-4xl font-extrabold ${
                          complaint.priorityScore >= 85 ? "text-rose-600" : complaint.priorityScore >= 70 ? "text-amber-600" : "text-emerald-600"
                        }`}>
                          {complaint.priorityScore}
                        </span>
                        <span className="text-slate-400 text-sm font-semibold">/100</span>
                      </div>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold text-white ${
                        complaint.priorityScore >= 85 ? "bg-rose-600" : complaint.priorityScore >= 70 ? "bg-amber-600" : "bg-emerald-600"
                      }`}>
                        Tingkat: {complaint.aiAnalysis.priorityLevel}
                      </span>
                    </div>

                    {/* Operational Specs */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
                      <div>
                        <span className="text-slate-400 font-medium block">Departemen Penanggung Jawab</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {complaint.aiAnalysis.assignedDepartment}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 font-medium block">Estimasi Waktu Penyelesaian</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center space-x-1 mt-0.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{complaint.aiAnalysis.estimatedTimeframe}</span>
                        </span>
                      </div>

                      {complaint.aiAnalysis.requiredResources && complaint.aiAnalysis.requiredResources.length > 0 && (
                        <div>
                          <span className="text-slate-400 font-medium block mb-1">Kebutuhan Alat / Material</span>
                          <div className="flex flex-wrap gap-1">
                            {complaint.aiAnalysis.requiredResources.map((res, i) => (
                              <span key={i} className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-[10px]">
                                {res}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {complaint.aiAnalysis.legalOrPolicyAdvice && (
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                          <span className="text-slate-400 font-medium block">Rujukan Aturan / Standar</span>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 italic mt-0.5">
                            {complaint.aiAnalysis.legalOrPolicyAdvice}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <p className="text-sm text-slate-500">Belum ada data analisis AI tersimpan.</p>
                  <button
                    onClick={handleReanalyzeWithAI}
                    className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold"
                  >
                    Jalankan Analisis AI Sekarang
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TIMELINE & LOG PROGRES */}
          {activeTab === "timeline" && (
            <div className="space-y-6">
              <div className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-700 space-y-6">
                {complaint.logs.map((log) => (
                  <div key={log.id} className="relative group">
                    <span className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-blue-600 ring-4 ring-white dark:ring-slate-900" />
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-1 text-xs">
                        <span className="font-bold text-slate-900 dark:text-white">{log.actionTitle}</span>
                        <span className="text-slate-400 text-[11px]">{log.timestamp}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                        <span>Oleh: <strong>{log.updatedBy}</strong> ({log.role})</span>
                        {log.newStatus && (
                          <span className="font-semibold text-blue-600 dark:text-blue-400">
                            ➔ Status: {getStatusMeta(log.newStatus).label}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                        {log.note}
                      </p>
                      {log.proofPhoto && (
                        <div className="mt-2 w-32 h-24 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 shadow-sm">
                          <img src={log.proofPhoto} alt="Bukti Log" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: BEFORE & AFTER PHOTO PROOF COMPARISON */}
          {activeTab === "repair_proof" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* BEFORE: Foto Kerusakan / Kejadian Awal */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center space-x-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Kondisi Awal / Kerusakan (Before)</span>
                    </span>
                    <span className="text-[11px] text-slate-400">Saat Dilaporkan</span>
                  </div>

                  {complaint.photos.length > 0 ? (
                    <div className="space-y-2">
                      <div className="rounded-xl overflow-hidden aspect-video border border-slate-300 dark:border-slate-700 shadow">
                        <img src={complaint.photos[0]} alt="Foto Awal" className="w-full h-full object-cover" />
                      </div>
                      {complaint.photos.length > 1 && (
                        <div className="grid grid-cols-3 gap-2">
                          {complaint.photos.slice(1).map((src, i) => (
                            <img key={i} src={src} alt="Foto tambahan" className="rounded-lg h-16 w-full object-cover" />
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
                      Tidak ada foto awal yang dilampirkan pelapor
                    </div>
                  )}
                </div>

                {/* AFTER: Foto Hasil Perbaikan / Bukti Resolusi */}
                <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Hasil Perbaikan Selesai (After)</span>
                    </span>
                    <span className="text-[11px] text-emerald-600 font-semibold">Bukti Selesai</span>
                  </div>

                  {complaint.repairProofPhotos && complaint.repairProofPhotos.length > 0 ? (
                    <div className="space-y-2">
                      <div className="rounded-xl overflow-hidden aspect-video border border-emerald-300 dark:border-emerald-800 shadow">
                        <img src={complaint.repairProofPhotos[0]} alt="Foto Perbaikan" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-300 dark:border-slate-700 rounded-xl space-y-2">
                      <p>Belum ada foto bukti perbaikan diunggah.</p>
                      <button
                        type="button"
                        onClick={() => fileProofRef.current?.click()}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                      >
                        Unggah Bukti Perbaikan Sekarang
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0 text-xs text-slate-500">
          <span>Tiket Terdaftar: {new Date(complaint.createdAt).toLocaleString("id-ID")}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white dark:bg-slate-700 rounded-xl font-semibold"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
