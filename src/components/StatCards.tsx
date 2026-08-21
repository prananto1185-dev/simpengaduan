import React from "react";
import { 
  AlertOctagon, 
  Clock, 
  Wrench, 
  CheckCircle, 
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  Shield,
  Building2,
  ArrowUpRight,
  Flame
} from "lucide-react";
import { Complaint } from "../types";

interface StatCardsProps {
  complaints: Complaint[];
  onFilterCategory?: (cat: string) => void;
  onFilterStatus?: (status: string) => void;
}

export const StatCards: React.FC<StatCardsProps> = ({ complaints, onFilterCategory, onFilterStatus }) => {
  const totalCount = complaints.length;
  const criticalCount = complaints.filter(
    (c) => (c.priorityScore >= 85 || c.urgencyLevel === "darurat") && c.status !== "selesai" && c.status !== "ditolak"
  ).length;
  const inProgressCount = complaints.filter((c) => c.status === "proses" || c.status === "menunggu_material").length;
  const resolvedCount = complaints.filter((c) => c.status === "selesai").length;

  const sarprasCount = complaints.filter((c) => c.category === "sarpras").length;
  const bullyingCount = complaints.filter((c) => c.category === "bullying").length;
  const pelayananCount = complaints.filter((c) => c.category === "pelayanan").length;

  const resolvedRate = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Bento Grid Metrics Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Bento Tile 1: Total Pengaduan & Category Distribution (Span 4) */}
        <div 
          id="bento-stat-total"
          onClick={() => onFilterStatus && onFilterStatus("all")}
          className="md:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-blue-400 dark:hover:border-blue-600 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Pengaduan Masuk
              </span>
              <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl group-hover:scale-110 transition">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline space-x-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {totalCount}
              </span>
              <span className="text-xs font-semibold text-slate-400">Total Tiket</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center space-x-1.5">
                <Wrench className="w-3.5 h-3.5 text-amber-500" />
                <span>Sarpras: <strong className="text-slate-900 dark:text-white">{sarprasCount}</strong></span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Shield className="w-3.5 h-3.5 text-rose-500" />
                <span>TPPK: <strong className="text-slate-900 dark:text-white">{bullyingCount}</strong></span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-500" />
                <span>Layanan: <strong className="text-slate-900 dark:text-white">{pelayananCount}</strong></span>
              </div>
            </div>
            {/* Distribution mini progress bar */}
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
              <div 
                style={{ width: `${totalCount ? (sarprasCount / totalCount) * 100 : 0}%` }} 
                className="bg-amber-500 h-full" 
                title={`Sarpras: ${sarprasCount}`}
              />
              <div 
                style={{ width: `${totalCount ? (bullyingCount / totalCount) * 100 : 0}%` }} 
                className="bg-rose-500 h-full" 
                title={`Bullying: ${bullyingCount}`}
              />
              <div 
                style={{ width: `${totalCount ? (pelayananCount / totalCount) * 100 : 0}%` }} 
                className="bg-blue-500 h-full" 
                title={`Layanan: ${pelayananCount}`}
              />
            </div>
          </div>
        </div>

        {/* Bento Tile 2: Kasus Kritis K3 & Prioritas AI (Span 4) */}
        <div 
          id="bento-stat-critical"
          onClick={() => onFilterStatus && onFilterStatus("kritis")}
          className={`md:col-span-4 rounded-2xl p-5 border shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden ${
            criticalCount > 0
              ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60 hover:border-rose-400"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800/80"
          }`}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-bl-full pointer-events-none" />
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                  Kasus Kritis K3 / AI &gt; 85
                </span>
                {criticalCount > 0 && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </span>
                )}
              </div>
              <div className="p-2 bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-xl group-hover:scale-110 transition">
                <AlertOctagon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline space-x-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight">
                {criticalCount}
              </span>
              <span className="text-xs font-semibold text-rose-700/80 dark:text-rose-300">
                {criticalCount > 0 ? "Memerlukan Aksi Cepat" : "Semua Terkendali"}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-rose-200/50 dark:border-rose-900/30 flex items-center justify-between text-xs text-rose-700 dark:text-rose-300">
            <span className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Target Respon: &lt; 2-4 Jam</span>
            </span>
            <span className="font-bold flex items-center">
              Lihat Kasus <ArrowUpRight className="w-3.5 h-3.5 ml-0.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
            </span>
          </div>
        </div>

        {/* Bento Tile 3: Sedang Dikerjakan (Span 2) */}
        <div 
          id="bento-stat-progress"
          onClick={() => onFilterStatus && onFilterStatus("proses")}
          className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-amber-400 dark:hover:border-amber-600 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                Proses Kerja
              </span>
              <div className="p-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl group-hover:scale-110 transition">
                <Wrench className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline space-x-1.5">
              <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight">
                {inProgressCount}
              </span>
              <span className="text-[11px] font-semibold text-slate-400">Aktif</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Petugas Lapangan</span>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          </div>
        </div>

        {/* Bento Tile 4: Tingkat Penyelesaian (Span 2) */}
        <div 
          id="bento-stat-resolved"
          onClick={() => onFilterStatus && onFilterStatus("selesai")}
          className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-emerald-400 dark:hover:border-emerald-600 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Selesai
              </span>
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl group-hover:scale-110 transition">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline space-x-1.5">
              <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
                {resolvedCount}
              </span>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/40 px-1.5 py-0.5 rounded">
                {resolvedRate}%
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Bukti Foto</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          </div>
        </div>
      </div>
    </div>
  );
};

