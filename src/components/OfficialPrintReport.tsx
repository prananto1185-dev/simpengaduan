import React from "react";
import { Printer, ArrowLeft, ShieldAlert, CheckCircle2, MapPin, User, Calendar, FileText } from "lucide-react";
import { Complaint } from "../types";
import { getCategoryMeta, getStatusMeta } from "./ComplaintCard";

interface OfficialPrintReportProps {
  complaint: Complaint;
  onBack: () => void;
}

export const OfficialPrintReport: React.FC<OfficialPrintReportProps> = ({ complaint, onBack }) => {
  const catMeta = getCategoryMeta(complaint.category);
  const statusMeta = getStatusMeta(complaint.status);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in pb-12">
      {/* Top Action Toolbar (Hidden during print) */}
      <div className="print:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <button
          onClick={onBack}
          className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center space-x-1.5 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Dasbor</span>
        </button>

        <button
          onClick={handlePrint}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/20 flex items-center space-x-2 transition"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak Dokumen Resmi (Print / PDF)</span>
        </button>
      </div>

      {/* Official Printable Sheet (A4 format style) */}
      <div className="bg-white text-slate-900 p-8 sm:p-12 rounded-2xl shadow-xl border border-slate-300 print:border-none print:shadow-none print:p-0 space-y-6">
        {/* Kop Surat Resmi Sekolah */}
        <div className="border-b-4 border-double border-slate-900 pb-4 text-center space-y-1">
          <div className="flex items-center justify-center space-x-3 mb-1">
            <div className="w-12 h-12 rounded-full border-2 border-slate-900 flex items-center justify-center font-black text-lg">
              SP
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-wide uppercase text-slate-950">
                PEMERINTAH PROVINSI / KEMENTERIAN PENDIDIKAN
              </h1>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight uppercase text-blue-900">
                SMA / SMK NEGERI TELADAN TERPADU
              </h2>
              <p className="text-xs text-slate-600">
                Jl. Pendidikan No. 101, Telp: (021) 88997766 • Email: pengaduan@sekolah.sch.id
              </p>
            </div>
          </div>
        </div>

        {/* Title of Document */}
        <div className="text-center space-y-1 pt-2">
          <h3 className="text-base font-black uppercase underline tracking-wider">
            BERITA ACARA & LEMBAR PENANGANAN PENGADUAN SEKOLAH
          </h3>
          <p className="text-xs font-mono font-bold text-slate-600">
            NOMOR REGISTRASI: {complaint.ticketNumber} / SIPENGADU / {new Date().getFullYear()}
          </p>
        </div>

        {/* Section 1: Identitas Laporan */}
        <div className="space-y-3 text-xs">
          <h4 className="font-bold text-sm bg-slate-100 p-1.5 border-l-4 border-slate-900 uppercase">
            I. Data Pengaduan Masuk
          </h4>
          <table className="w-full text-left border-collapse">
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="py-1.5 font-bold w-1/3 text-slate-600">Kategori Pengaduan</td>
                <td className="py-1.5 font-semibold uppercase">{catMeta.label} ({complaint.subCategory})</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="py-1.5 font-bold text-slate-600">Judul Pengaduan</td>
                <td className="py-1.5 font-bold text-slate-900">{complaint.title}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="py-1.5 font-bold text-slate-600">Lokasi Kejadian / Sarpras</td>
                <td className="py-1.5 font-medium">{complaint.location}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="py-1.5 font-bold text-slate-600">Nama Pelapor</td>
                <td className="py-1.5 font-medium">{complaint.reporterName} ({complaint.reporterRole})</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="py-1.5 font-bold text-slate-600">Waktu Pelaporan</td>
                <td className="py-1.5 font-medium">{new Date(complaint.createdAt).toLocaleString("id-ID")}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="py-1.5 font-bold text-slate-600">Urgensi & Skor Prioritas AI</td>
                <td className="py-1.5 font-bold text-rose-700">
                  {complaint.urgencyLevel.toUpperCase()} (Skor Risiko AI: {complaint.priorityScore}/100)
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 2: Deskripsi & Kronologi */}
        <div className="space-y-2 text-xs">
          <h4 className="font-bold text-sm bg-slate-100 p-1.5 border-l-4 border-slate-900 uppercase">
            II. Kronologi & Uraian Masalah
          </h4>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded leading-relaxed whitespace-pre-wrap">
            {complaint.description}
          </div>
        </div>

        {/* Section 3: Rekomendasi Solusi SOP AI & Tindakan */}
        {complaint.aiAnalysis && (
          <div className="space-y-2 text-xs">
            <h4 className="font-bold text-sm bg-slate-100 p-1.5 border-l-4 border-slate-900 uppercase">
              III. Rekomendasi SOP & Tindakan Penanganan
            </h4>
            <div className="p-3 bg-slate-50 border border-slate-200 space-y-2">
              <p><strong>Ringkasan Analisis:</strong> {complaint.aiAnalysis.summary}</p>
              <div>
                <strong>Langkah SOP Yang Diterapkan:</strong>
                <ul className="list-disc list-inside mt-1 space-y-0.5">
                  {complaint.aiAnalysis.resolutionSteps?.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ul>
              </div>
              <p><strong>Departemen Penanggung Jawab:</strong> {complaint.aiAnalysis.assignedDepartment} (PIC: {complaint.assignedTo || "Tim Terkait"})</p>
            </div>
          </div>
        )}

        {/* Section 4: Foto Dokumentasi (Before & After) */}
        <div className="space-y-2 text-xs">
          <h4 className="font-bold text-sm bg-slate-100 p-1.5 border-l-4 border-slate-900 uppercase">
            IV. Dokumentasi Fisik Bukti Sebelum & Sesudah Penanganan
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-slate-300 p-2 text-center rounded space-y-1">
              <span className="font-bold block text-[11px]">Foto Kondisi Awal (Kerusakan)</span>
              {complaint.photos.length > 0 ? (
                <img src={complaint.photos[0]} alt="Before" className="h-36 w-full object-cover rounded" />
              ) : (
                <div className="h-36 flex items-center justify-center bg-slate-100 text-slate-400 text-[10px]">
                  Foto tidak tersedia
                </div>
              )}
            </div>

            <div className="border border-slate-300 p-2 text-center rounded space-y-1">
              <span className="font-bold block text-[11px] text-emerald-800">Foto Hasil Penyelesaian (After)</span>
              {complaint.repairProofPhotos && complaint.repairProofPhotos.length > 0 ? (
                <img src={complaint.repairProofPhotos[0]} alt="After" className="h-36 w-full object-cover rounded" />
              ) : (
                <div className="h-36 flex items-center justify-center bg-slate-100 text-slate-400 text-[10px]">
                  {complaint.status === "selesai" ? "Terselesaikan dengan baik" : "Dalam proses penanganan"}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 5: Tanda Tangan Pengesahan 3 Pihak */}
        <div className="pt-8 grid grid-cols-3 gap-4 text-center text-xs">
          <div className="space-y-16">
            <p className="font-bold">Pelapor / Guru</p>
            <div>
              <p className="font-bold underline">{complaint.reporterName}</p>
              <p className="text-[10px] text-slate-500">{complaint.reporterRole}</p>
            </div>
          </div>

          <div className="space-y-16">
            <p className="font-bold">Koordinator Penanganan (PIC)</p>
            <div>
              <p className="font-bold underline">{complaint.assignedTo || "Bambang Wicaksono, S.T"}</p>
              <p className="text-[10px] text-slate-500">Divisi Sarpras / Tim TPPK</p>
            </div>
          </div>

          <div className="space-y-16">
            <p className="font-bold">Mengetahui,<br />Kepala Sekolah</p>
            <div>
              <p className="font-bold underline">Drs. H. Ahmad Sudirman, M.Pd</p>
              <p className="text-[10px] text-slate-500">NIP. 19740512 200003 1 002</p>
            </div>
          </div>
        </div>

        {/* Footer verification token */}
        <div className="pt-6 border-t border-slate-200 text-[10px] text-slate-400 flex items-center justify-between">
          <span>Dicetak otomatis oleh Sistem Informasi Pengaduan Sekolah (SIPENGADU)</span>
          <span className="font-mono">Token Otentikasi: {complaint.id}-{Date.now()}</span>
        </div>
      </div>
    </div>
  );
};
