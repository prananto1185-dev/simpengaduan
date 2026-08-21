import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Flame, 
  AlertTriangle, 
  ArrowUpRight, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  RefreshCw, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Wrench, 
  Layers,
  ChevronRight,
  Lightbulb
} from "lucide-react";
import { Complaint, BatchPrioritizationResult, UserProfile } from "../types";
import { batchPrioritizeWithAI, consultAIAdvisor } from "../services/geminiService";
import { getCategoryMeta } from "./ComplaintCard";

interface AIPriorityDashboardProps {
  complaints: Complaint[];
  currentUser: UserProfile;
  onOpenDetail: (complaint: Complaint) => void;
}

export const AIPriorityDashboard: React.FC<AIPriorityDashboardProps> = ({
  complaints,
  currentUser,
  onOpenDetail,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [batchResult, setBatchResult] = useState<BatchPrioritizationResult | null>(null);
  
  // AI Chat Consultant states
  const [chatMessages, setChatMessages] = useState<{ sender: "user" | "ai"; text: string; time: string }[]>([
    {
      sender: "ai",
      text: "Halo! Saya Asisten AI Tata Kelola & Satgas K3 Sekolah. Anda dapat menanyakan panduan langkah penyelesaian, standar penanganan bullying (TPPK Permendikbud 46/2023), atau prosedur keselamatan sarpras listrik/bangunan sekolah.",
      time: "Sekarang",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isConsulting, setIsConsulting] = useState(false);

  // Auto-run or load initial batch prioritization
  useEffect(() => {
    const activeComplaints = complaints.filter(
      (c) => c.status !== "selesai" && c.status !== "ditolak"
    );
    if (activeComplaints.length > 0 && !batchResult) {
      handleRunBatchPrioritization();
    }
  }, [complaints.length]);

  const handleRunBatchPrioritization = async () => {
    const activeComplaints = complaints.filter(
      (c) => c.status !== "selesai" && c.status !== "ditolak"
    );
    if (activeComplaints.length === 0) return;

    setIsGenerating(true);
    try {
      const result = await batchPrioritizeWithAI(activeComplaints);
      setBatchResult(result);
    } catch (err) {
      console.error("Batch prioritization error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isConsulting) return;

    const userText = chatInput;
    setChatInput("");
    const nowTime = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

    setChatMessages((prev) => [...prev, { sender: "user", text: userText, time: nowTime }]);
    setIsConsulting(true);

    try {
      const aiReply = await consultAIAdvisor(userText, {
        activeCount: complaints.filter((c) => c.status !== "selesai").length,
      });
      setChatMessages((prev) => [
        ...prev,
        { sender: "ai", text: aiReply, time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) },
      ]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Maaf, terjadi gangguan koneksi AI. Silakan coba kembali.", time: nowTime },
      ]);
    } finally {
      setIsConsulting(false);
    }
  };

  // Find complaint by id
  const getComplaintById = (id: string) => complaints.find((c) => c.id === id);

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-blue-950 text-white p-6 sm:p-8 border border-indigo-800/40 shadow-xl">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-400/30 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Mesin Prioritas Cerdas & Asisten Solusi Gemini 3.7</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight">
            Urutan Rekomendasi Penyelesaian Pengaduan Sekolah
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            Sistem menganalisis seluruh tiket aktif secara simultan untuk menentukan <strong>&ldquo;Mana dulu yang harus diselesaikan sekolah hari ini&rdquo;</strong> berdasarkan kalkulasi risiko keselamatan K3, dampak perundungan psikologis, serta kelancaran KBM.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={handleRunBatchPrioritization}
              disabled={isGenerating}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 flex items-center space-x-2 transition active:scale-95 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sedang Mengurutkan Prioritas...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Kalkulasi Ulang Prioritas Hari Ini</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Top Urgent Actions Bar from AI */}
      {batchResult && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Ringkasan Eksekutif & Arahan Kepala Sekolah
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                {batchResult.executiveSummary}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 shadow-sm space-y-3">
              <div className="flex items-center space-x-2 text-rose-700 dark:text-rose-300">
                <Flame className="w-4 h-4 text-rose-600" />
                <h3 className="font-bold text-sm">3 Tindakan Paling Genting (&lt; 3 Jam)</h3>
              </div>
              <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                {batchResult.topUrgentActions.map((act, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="w-4 h-4 rounded-full bg-rose-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed font-medium">{act}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Prioritized Ranked List */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Matriks Urutan Eksekusi Penanganan (Prioritas 1 hingga Selesai)
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                {batchResult.prioritizedList.length} Pengaduan Aktif
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {batchResult.prioritizedList.map((item) => {
                const comp = getComplaintById(item.complaintId);
                if (!comp) return null;
                const catMeta = getCategoryMeta(comp.category);
                const isCritical = item.priorityTier === "CRITICAL";

                return (
                  <div
                    key={item.complaintId}
                    onClick={() => onOpenDetail(comp)}
                    className="p-4 sm:p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start space-x-3.5">
                      {/* Priority Number Badge */}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-sm ${
                        item.recommendedOrder === 1
                          ? "bg-rose-600 text-white ring-2 ring-rose-300"
                          : item.recommendedOrder === 2
                          ? "bg-orange-500 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      }`}>
                        #{item.recommendedOrder}
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            isCritical ? "bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300" : "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                          }`}>
                            {item.priorityTier}
                          </span>
                          <span className="font-mono text-xs font-semibold text-slate-400">
                            {comp.ticketNumber}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            • {comp.location}
                          </span>
                        </div>

                        <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                          {comp.title}
                        </h4>

                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          <strong>Justifikasi Prioritas:</strong> {item.reasonForPriority}
                        </p>

                        <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                          <strong>💡 Arahan Tindakan:</strong> {item.actionableRecommendation}
                        </p>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto shrink-0 space-y-2">
                      <div className="text-right">
                        <span className="text-[11px] text-slate-400 block">Skor Risiko AI</span>
                        <span className="text-lg font-black text-slate-900 dark:text-white">
                          {comp.priorityScore}/100
                        </span>
                      </div>

                      <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg flex items-center space-x-1 shadow transition">
                        <span>Buka Penanganan</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* AI Consultation Chat Widget */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
              Konsultan AI Solusi & Tata Kelola Pengaduan Sekolah
            </h3>
            <p className="text-xs text-slate-500">
              Tanyakan panduan penanganan kasus, aturan Permendikbud TPPK, atau SOP sarpras langsung ke AI.
            </p>
          </div>
        </div>

        {/* Chat Stream Window */}
        <div className="max-h-72 overflow-y-auto space-y-3 p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
          {chatMessages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start space-x-2.5 ${
                msg.sender === "user" ? "flex-row-reverse space-x-reverse" : ""
              }`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                msg.sender === "user" ? "bg-blue-600 text-white" : "bg-indigo-600 text-white"
              }`}>
                {msg.sender === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              <div className={`max-w-[85%] p-3 rounded-xl leading-relaxed whitespace-pre-wrap ${
                msg.sender === "user"
                  ? "bg-blue-600 text-white rounded-tr-none font-medium"
                  : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200 dark:border-slate-700 shadow-sm"
              }`}>
                <p>{msg.text}</p>
                <span className={`block text-[9px] mt-1 text-right ${
                  msg.sender === "user" ? "text-blue-100" : "text-slate-400"
                }`}>
                  {msg.time}
                </span>
              </div>
            </div>
          ))}

          {isConsulting && (
            <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 p-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs">Asisten AI sedang menyusun rekomendasi SOP...</span>
            </div>
          )}
        </div>

        {/* Chat Input Box */}
        <form onSubmit={handleSendChat} className="flex items-center space-x-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Contoh: Bagaimana langkah mediasi jika ada kasus cyberbullying antar siswa di kelas 8?"
            className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isConsulting || !chatInput.trim()}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl text-xs shadow flex items-center space-x-1.5 disabled:opacity-50"
          >
            <span>Kirim</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
