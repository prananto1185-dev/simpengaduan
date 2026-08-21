import React, { useState } from "react";
import { 
  Lock, 
  ShieldCheck, 
  UserCheck, 
  ArrowLeft, 
  KeyRound, 
  Mail, 
  Building2, 
  Wrench, 
  Shield, 
  Crown, 
  CheckCircle2, 
  Sparkles,
  Eye,
  EyeOff
} from "lucide-react";
import { UserProfile, UserRole } from "../types";
import { MOCK_USERS } from "../data/mockComplaints";

interface AdminLoginPageProps {
  onLoginSuccess: (user: UserProfile) => void;
  onBackToPublic: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onLoginSuccess,
  onBackToPublic,
}) => {
  const [selectedUser, setSelectedUser] = useState<UserProfile>(MOCK_USERS[0]);
  const [emailInput, setEmailInput] = useState(MOCK_USERS[0].email);
  const [passwordInput, setPasswordInput] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleSelectRolePreset = (user: UserProfile) => {
    setSelectedUser(user);
    setEmailInput(user.email);
    setPasswordInput("sekolah123");
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess(selectedUser);
    }, 450);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Bar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-full bg-emerald-800 border-2 border-amber-400 flex items-center justify-center font-black text-xs text-amber-300 shadow-sm">
            SMP2
          </div>
          <div>
            <h1 className="font-extrabold text-sm sm:text-base tracking-wide text-white">
              SIPENGADU &bull; SMPN 2 BANTUL
            </h1>
            <p className="text-[11px] text-slate-400">Portal Akses Pengelola & Satgas Sekolah</p>
          </div>
        </div>

        <button
          id="btn-back-to-portal"
          onClick={onBackToPublic}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Beranda Publik</span>
        </button>
      </header>

      {/* Main Login Card Area */}
      <main className="max-w-4xl mx-auto w-full px-4 py-8 sm:py-12 flex-1 flex items-center justify-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Quick Role Picker & System Info */}
          <div className="lg:col-span-5 space-y-5">
            <div>
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[11px] font-bold uppercase tracking-wider mb-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Otorisasi Akses Terpadu</span>
              </span>
              <h2 className="text-2xl font-black text-white tracking-tight">
                Pilih Akun Petugas / Demo Role
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Klik salah satu profil di bawah untuk mengisi kredensial akses dengan cepat sesuai hak akses dan divisi masing-masing.
              </p>
            </div>

            {/* Role presets grid */}
            <div className="space-y-2.5">
              {MOCK_USERS.map((user) => {
                const isSelected = selectedUser.id === user.id;
                return (
                  <div
                    key={user.id}
                    onClick={() => handleSelectRolePreset(user)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? "bg-blue-600/20 border-blue-500 shadow-md shadow-blue-500/10"
                        : "bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600"
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="w-10 h-10 rounded-lg object-cover border border-slate-600 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{user.name}</p>
                        <p className="text-[11px] text-blue-400 font-medium truncate">{user.roleTitle}</p>
                        <span className="text-[10px] text-slate-400 font-mono">{user.badgeDepartment}</span>
                      </div>
                    </div>

                    <div className="shrink-0 ml-2">
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-600" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Actual Login Form Card */}
          <div className="lg:col-span-7">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-bl-full pointer-events-none" />

              <div className="space-y-1">
                <h3 className="text-lg font-black text-white tracking-tight">
                  Login Panel Administrator
                </h3>
                <p className="text-xs text-slate-400">
                  Akses modul verifikasi, penugasan teknisi sarpras, konseling TPPK, dan analitik AI.
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Email / Nama Pengguna Petugas
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="petugas@smpn2bantul.sch.id"
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Kata Sandi (Password)
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Logged in as profile badge indicator */}
                <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center space-x-3 text-xs">
                  <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-slate-200 font-bold truncate">Masuk sebagai: {selectedUser.name}</p>
                    <p className="text-slate-400 text-[11px] truncate">{selectedUser.roleTitle}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center space-x-2 text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Ingat sesi di perangkat ini</span>
                  </label>
                  <span className="text-slate-500 text-[11px]">Enkripsi TLS 256-bit</span>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center justify-center space-x-2 disabled:opacity-60"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{isLoading ? "MEMVALIDASI OTORISASI..." : "MASUK KE DASHBOARD ADMIN"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 px-4 text-center text-xs text-slate-500">
        SIPENGADU &bull; SMP Negeri 2 Bantul &bull; Sistem Terpadu Pengaduan & Manajemen Insiden
      </footer>
    </div>
  );
};
