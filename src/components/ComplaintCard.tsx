import React from "react";
import { 
  Wrench, 
  Shield, 
  Building2, 
  MapPin, 
  Clock, 
  User, 
  AlertTriangle, 
  Sparkles, 
  CheckCircle2, 
  EyeOff, 
  ChevronRight,
  Camera,
  ArrowUpRight,
  Flame
} from "lucide-react";
import { Complaint, ComplaintCategory, ComplaintStatus } from "../types";

interface ComplaintCardProps {
  complaint: Complaint;
  onOpenDetail: (complaint: Complaint) => void;
}

export const getCategoryMeta = (cat: ComplaintCategory) => {
  switch (cat) {
    case "sarpras":
      return {
        label: "Sarana Prasarana",
        icon: Wrench,
        badgeClass: "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700/50",
      };
    case "bullying":
      return {
        label: "Perundungan / Bullying",
        icon: Shield,
        badgeClass: "bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700/50",
      };
    case "pelayanan":
      return {
        label: "Pelayanan Sekolah",
        icon: Building2,
        badgeClass: "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700/50",
      };
  }
};

export const getStatusMeta = (status: ComplaintStatus) => {
  switch (status) {
    case "dilaporkan":
      return {
        label: "Menunggu Verifikasi",
        badgeClass: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600",
        dotClass: "bg-slate-500",
      };
    case "ditinjau":
      return {
        label: "Sedang Ditinjau",
        badgeClass: "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 border-indigo-300",
        dotClass: "bg-indigo-500",
      };
    case "proses":
      return {
        label: "Sedang Dikerjakan",
        badgeClass: "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border-amber-300",
        dotClass: "bg-amber-500 animate-pulse",
      };
    case "menunggu_material":
      return {
        label: "Menunggu Suku Cadang",
        badgeClass: "bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300 border-orange-300",
        dotClass: "bg-orange-500",
      };
    case "selesai":
      return {
        label: "Terselesaikan",
        badgeClass: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border-emerald-300",
        dotClass: "bg-emerald-500",
      };
    case "ditolak":
      return {
        label: "Ditolak / Duplikat",
        badgeClass: "bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300 border-rose-300",
        dotClass: "bg-rose-500",
      };
  }
};

export const ComplaintCard: React.FC<ComplaintCardProps> = ({ complaint, onOpenDetail }) => {
  const catMeta = getCategoryMeta(complaint.category);
  const statusMeta = getStatusMeta(complaint.status);
  const CategoryIcon = catMeta.icon;

  const isCritical = complaint.priorityScore >= 85 || complaint.urgencyLevel === "darurat";

  return (
    <div
      id={`bento-card-${complaint.id}`}
      onClick={() => onOpenDetail(complaint)}
      className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group flex flex-col justify-between relative overflow-hidden ${
        isCritical && complaint.status !== "selesai"
          ? "border-rose-300/80 dark:border-rose-800/80 bg-rose-50/20"
          : "border-slate-200/90 dark:border-slate-800/90 hover:border-blue-400 dark:hover:border-blue-500"
      }`}
    >
      {/* Top Accent bar for critical cases */}
      {isCritical && complaint.status !== "selesai" && (
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-red-500 to-amber-500" />
      )}

      <div>
        {/* Header Badges: Category, Ticket ID, AI Priority */}
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl text-xs font-semibold border ${catMeta.badgeClass}`}>
              <CategoryIcon className="w-3.5 h-3.5 mr-1" />
              <span>{catMeta.label}</span>
            </span>

            <span className="font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
              {complaint.ticketNumber}
            </span>
          </div>

          {/* AI Priority Score pill */}
          <span
            className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-tight shadow-xs ${
              complaint.priorityScore >= 85
                ? "bg-rose-500 text-white"
                : complaint.priorityScore >= 70
                ? "bg-amber-500 text-white"
                : "bg-emerald-600 text-white"
            }`}
            title="Skor Prioritas Berdasarkan Analisis Risiko AI"
          >
            <Sparkles className="w-3 h-3 text-amber-200" />
            <span>AI: {complaint.priorityScore}</span>
          </span>
        </div>

        {/* Title */}
        <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition leading-snug line-clamp-2 mb-2">
          {complaint.title}
        </h3>

        {/* Description snippet */}
        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3.5">
          {complaint.description}
        </p>

        {/* Photos Preview if available */}
        {complaint.photos.length > 0 && (
          <div className="flex items-center space-x-2.5 mb-3.5 p-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="relative w-14 h-11 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
              <img src={complaint.photos[0]} alt="Foto Laporan" className="w-full h-full object-cover" />
              {complaint.photos.length > 1 && (
                <div className="absolute inset-0 bg-slate-900/60 text-white text-[10px] font-bold flex items-center justify-center">
                  +{complaint.photos.length - 1}
                </div>
              )}
            </div>
            <div className="text-[11px] text-slate-500 truncate">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1 truncate">
                <Camera className="w-3 h-3 text-blue-500 shrink-0" />
                <span className="truncate">Foto Kerusakan Terlampir</span>
              </span>
              {complaint.repairProofPhotos && complaint.repairProofPhotos.length > 0 && (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium block truncate">
                  ✓ Bukti Perbaikan Ada ({complaint.repairProofPhotos.length})
                </span>
              )}
            </div>
          </div>
        )}

        {/* Meta Info: Location & Reporter */}
        <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center space-x-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{complaint.location}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 truncate">
              {complaint.isAnonymous ? (
                <span className="text-rose-600 dark:text-rose-400 font-medium flex items-center space-x-1">
                  <EyeOff className="w-3 h-3" />
                  <span>Pelapor Anonim</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1 truncate">
                  <User className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{complaint.reporterName}</span>
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-400 shrink-0">
              {new Date(complaint.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusMeta.badgeClass}`}>
          <span className={`w-2 h-2 rounded-full ${statusMeta.dotClass}`} />
          <span>{statusMeta.label}</span>
        </div>

        <div className="flex items-center text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition">
          <span>Kelola</span>
          <ChevronRight className="w-4 h-4 ml-0.5" />
        </div>
      </div>
    </div>
  );
};
