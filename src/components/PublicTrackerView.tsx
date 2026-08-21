import React, { useState } from "react";
import { 
  Search, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  User, 
  Camera, 
  ShieldAlert, 
  Sparkles, 
  ArrowRight,
  HelpCircle,
  FileCheck
} from "lucide-react";
import { Complaint } from "../types";
import { getCategoryMeta, getStatusMeta } from "./ComplaintCard";

interface PublicTrackerViewProps {
  complaints: Complaint[];
  onOpenDetail: (complaint: Complaint) => void;
}

export const PublicTrackerView: React.FC<PublicTrackerViewProps> = ({
  complaints,
  onOpenDetail,
}) => {
  const [ticketInput, setTicketInput] = useState("");
  const [searchedTicket, setSearchedTicket] = useState<Complaint | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketInput.trim()) return;

    const query = ticketInput.trim().toUpperCase();
    const match = complaints.find(
      (c) => c.ticketNumber.toUpperCase() === query || c.id.toUpperCase() === query
    );
    setSearchedTicket(match || null);
    setHasSearched(true);
  };

  const selectQuickTicket = (comp: Complaint) => {
    setTicketInput(comp.ticketNumber);
    setSearchedTicket(comp);
    setHasSearched(true);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in">
      {/* Search Header Banner */}
      <div className="text-center space-y-3 py-6">
        <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
          <Search className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Lacak Transparansi Penanganan Pengaduan
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
          Masukkan Nomor Registrasi Tiket Pengaduan (Contoh: <code>LAP-2026-0801</code>) untuk memantau status pengerjaan, siapa petugas yang menangani, dan bukti foto perbaikan secara real-time.
        </p>

        {/* Input Form */}
        <form onSubmit={handleSearch} className="max-w-xl mx-auto flex items-center space-x-2 pt-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={ticketInput}
              onChange={(e) => setTicketInput(e.target.value)}
              placeholder="Ketik Nomor Tiket: LAP-2026-0801"
              className="w-full pl-4 pr-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono font-bold focus:border-blue-500 focus:outline-none shadow-sm uppercase placeholder:normal-case placeholder:font-normal"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/20 transition active:scale-95 shrink-0"
          >
            Lacak Tiket
          </button>
        </form>

        {/* Quick Sample Links */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs text-slate-500">
          <span>Contoh Tiket Cepat:</span>
          {complaints.slice(0, 3).map((c) => (
            <button
              key={c.id}
              onClick={() => selectQuickTicket(c)}
              className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 rounded-md font-mono font-semibold transition"
            >
              {c.ticketNumber}
            </button>
          ))}
        </div>
      </div>

      {/* Search Result Display */}
      {hasSearched && (
        <div className="space-y-6">
          {searchedTicket ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
              {/* Result Header */}
              {(() => {
                const catMeta = getCategoryMeta(searchedTicket.category);
                const statusMeta = getStatusMeta(searchedTicket.status);
                const CatIcon = catMeta.icon;

                return (
                  <div>
                    <div className="p-6 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-sm px-2.5 py-0.5 bg-blue-600 text-white rounded font-bold">
                            {searchedTicket.ticketNumber}
                          </span>
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${statusMeta.badgeClass}`}>
                            {statusMeta.label}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold mt-1 text-white">{searchedTicket.title}</h3>
                        <p className="text-xs text-slate-400">
                          Dilaporkan pada {new Date(searchedTicket.createdAt).toLocaleString("id-ID")}
                        </p>
                      </div>

                      <button
                        onClick={() => onOpenDetail(searchedTicket)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs font-bold rounded-xl border border-slate-700 transition"
                      >
                        Buka Detail Lengkap ➔
                      </button>
                    </div>

                    {/* Progress Milestone Bar */}
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                        Tahapan Progres Penanganan Transparan
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-semibold">
                        <div className={`p-3 rounded-xl border flex items-center space-x-2 ${
                          ["dilaporkan", "ditinjau", "proses", "menunggu_material", "selesai"].includes(searchedTicket.status)
                            ? "bg-blue-50 dark:bg-blue-950/40 border-blue-300 text-blue-700 dark:text-blue-300"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200"
                        }`}>
                          <CheckCircle2 className="w-4 h-4 text-blue-600" />
                          <span>1. Laporan Masuk</span>
                        </div>

                        <div className={`p-3 rounded-xl border flex items-center space-x-2 ${
                          ["ditinjau", "proses", "menunggu_material", "selesai"].includes(searchedTicket.status)
                            ? "bg-blue-50 dark:bg-blue-950/40 border-blue-300 text-blue-700 dark:text-blue-300"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200"
                        }`}>
                          <CheckCircle2 className="w-4 h-4 text-blue-600" />
                          <span>2. Verifikasi & Analisis AI</span>
                        </div>

                        <div className={`p-3 rounded-xl border flex items-center space-x-2 ${
                          ["proses", "menunggu_material", "selesai"].includes(searchedTicket.status)
                            ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-700 dark:text-amber-300"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200"
                        }`}>
                          <Clock className="w-4 h-4 text-amber-600" />
                          <span>3. Penanganan Lapangan</span>
                        </div>

                        <div className={`p-3 rounded-xl border flex items-center space-x-2 ${
                          searchedTicket.status === "selesai"
                            ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-700 dark:text-emerald-300"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200"
                        }`}>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>4. Perbaikan Selesai</span>
                        </div>
                      </div>
                    </div>

                    {/* Information Grid */}
                    <div className="p-6 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                        <div className="space-y-4">
                          <div>
                            <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">
                              Lokasi & Sub-Kategori
                            </span>
                            <p className="font-semibold text-sm text-slate-900 dark:text-white">
                              {searchedTicket.location} ({searchedTicket.subCategory})
                            </p>
                          </div>

                          <div>
                            <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">
                              Petugas Penanggung Jawab (PIC)
                            </span>
                            <p className="font-semibold text-sm text-indigo-600 dark:text-indigo-400">
                              {searchedTicket.assignedTo || "Dalam Proses Delegasi Tim"} ({searchedTicket.assignedDepartment || "Divisi Terkait"})
                            </p>
                          </div>

                          <div>
                            <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">
                              Deskripsi Laporan
                            </span>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                              {searchedTicket.description}
                            </p>
                          </div>
                        </div>

                        {/* Photos comparison snippet */}
                        <div className="space-y-3">
                          <span className="font-bold text-slate-400 uppercase tracking-wider block">
                            Dokumentasi Foto Transparan
                          </span>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-slate-500 block">Kondisi Awal (Before)</span>
                              {searchedTicket.photos.length > 0 ? (
                                <img
                                  src={searchedTicket.photos[0]}
                                  alt="Before"
                                  className="w-full h-28 object-cover rounded-xl border border-slate-300 dark:border-slate-700"
                                />
                              ) : (
                                <div className="h-28 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-400 text-[11px]">
                                  Tidak ada foto
                                </div>
                              )}
                            </div>

                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-emerald-600 block">Hasil Perbaikan (After)</span>
                              {searchedTicket.repairProofPhotos && searchedTicket.repairProofPhotos.length > 0 ? (
                                <img
                                  src={searchedTicket.repairProofPhotos[0]}
                                  alt="After"
                                  className="w-full h-28 object-cover rounded-xl border border-emerald-300 dark:border-emerald-700 shadow"
                                />
                              ) : (
                                <div className="h-28 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-400 text-[11px] text-center p-2">
                                  Menunggu perbaikan selesai
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Timeline Logs in Tracker */}
                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Catatan Riwayat Penanganan Terbaru
                        </span>
                        <div className="space-y-2 text-xs">
                          {searchedTicket.logs.map((log) => (
                            <div key={log.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-start space-x-3">
                              <Clock className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-slate-900 dark:text-white">{log.actionTitle}</span>
                                  <span className="text-[11px] text-slate-400">{log.timestamp}</span>
                                </div>
                                <p className="text-slate-600 dark:text-slate-300 mt-0.5">{log.note}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="p-10 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Nomor Tiket &ldquo;{ticketInput}&rdquo; Tidak Ditemukan
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Pastikan format nomor tiket sudah benar seperti contoh: <code>LAP-2026-0801</code>.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
