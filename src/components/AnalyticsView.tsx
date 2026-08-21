import React from "react";
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  ShieldCheck, 
  Clock, 
  Wrench, 
  Shield, 
  Building2, 
  Flame, 
  Award,
  Calendar
} from "lucide-react";
import { Complaint } from "../types";

interface AnalyticsViewProps {
  complaints: Complaint[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ complaints }) => {
  const total = complaints.length;
  const sarpras = complaints.filter((c) => c.category === "sarpras");
  const bullying = complaints.filter((c) => c.category === "bullying");
  const pelayanan = complaints.filter((c) => c.category === "pelayanan");

  const completed = complaints.filter((c) => c.status === "selesai");
  const inProgress = complaints.filter((c) => c.status === "proses" || c.status === "menunggu_material");
  const critical = complaints.filter((c) => c.priorityScore >= 85 || c.urgencyLevel === "darurat");

  const completionRate = total > 0 ? Math.round((completed.length / total) * 100) : 0;

  // Location hotspots
  const locationMap: { [key: string]: number } = {};
  complaints.forEach((c) => {
    const locKey = c.location.split(",")[0] || c.location;
    locationMap[locKey] = (locationMap[locKey] || 0) + 1;
  });

  const topLocations = Object.entries(locationMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span>Dasbor Analitik & Kinerja Penanganan Pengaduan</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Laporan agregat efisiensi perbaikan sarpras, penanganan TPPK bullying, dan mutu pelayanan sekolah
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl font-semibold">
          <Calendar className="w-4 h-4 text-blue-500" />
          <span>Periode Tahun Ajaran 2026/2027</span>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Rata-rata Waktu Tanggap
          </span>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white flex items-baseline space-x-1">
            <span>&lt; 35</span>
            <span className="text-xs text-slate-500 font-medium">Menit</span>
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold block mt-1">
            SLA Cepat 94.2%
          </span>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Tingkat Penyelesaian
          </span>
          <div className="mt-2 text-2xl font-black text-emerald-600 flex items-baseline space-x-1">
            <span>{completionRate}%</span>
          </div>
          <span className="text-[11px] text-slate-500 font-semibold block mt-1">
            {completed.length} dari {total} Kasus
          </span>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Kasus Kritis K3/Bullying
          </span>
          <div className="mt-2 text-2xl font-black text-rose-600 flex items-baseline space-x-1">
            <span>{critical.length}</span>
            <span className="text-xs text-rose-500 font-medium">Tiket</span>
          </div>
          <span className="text-[11px] text-rose-600 font-semibold block mt-1">
            Terkendali & Didampingi
          </span>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Indeks Kepuasan Guru
          </span>
          <div className="mt-2 text-2xl font-black text-indigo-600 flex items-baseline space-x-1">
            <span>4.9</span>
            <span className="text-xs text-slate-500 font-medium">/ 5.0</span>
          </div>
          <span className="text-[11px] text-indigo-600 font-semibold block mt-1">
            Sangat Memuaskan ⭐
          </span>
        </div>
      </div>

      {/* Visual Analytics Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown Progress Bar */}
        <div className="lg:col-span-2 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Distribusi Kategori Pengaduan Masuk
          </h3>

          <div className="space-y-4 text-xs">
            {/* Sarpras */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                  <Wrench className="w-4 h-4 text-amber-500" />
                  <span>Kerusakan Sarana Prasarana (Sarpras)</span>
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {sarpras.length} Laporan ({total > 0 ? Math.round((sarpras.length / total) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                  style={{ width: `${total > 0 ? (sarpras.length / total) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Bullying */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                  <Shield className="w-4 h-4 text-rose-500" />
                  <span>Pengaduan Perundungan (Bullying / TPPK)</span>
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {bullying.length} Laporan ({total > 0 ? Math.round((bullying.length / total) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full transition-all duration-500"
                  style={{ width: `${total > 0 ? (bullying.length / total) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Pelayanan */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                  <Building2 className="w-4 h-4 text-blue-500" />
                  <span>Pelayanan & Administrasi Sekolah</span>
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {pelayanan.length} Laporan ({total > 0 ? Math.round((pelayanan.length / total) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${total > 0 ? (pelayanan.length / total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 leading-relaxed">
            💡 <strong>Rekomendasi AI untuk Sekolah:</strong> Pengaduan sarpras didominasi oleh instalasi listrik lab & sanitasi toilet. Disarankan menambah checklist inspeksi preventif mingguan oleh tim caraka & teknisi.
          </div>
        </div>

        {/* Hotspot Locations */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Titik Lokasi Pengaduan Terbanyak
          </h3>

          <div className="space-y-3 text-xs">
            {topLocations.map(([loc, count], idx) => (
              <div key={loc} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold text-[10px] flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{loc}</span>
                </div>
                <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded font-bold text-[11px]">
                  {count} Kasus
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
