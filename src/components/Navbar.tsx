import React, { useState } from "react";
import { 
  ShieldAlert, 
  Bell, 
  PlusCircle, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  FileText, 
  BarChart3, 
  UserCheck, 
  ChevronDown,
  Volume2,
  VolumeX,
  ExternalLink,
  LifeBuoy
} from "lucide-react";
import { UserProfile, PushNotification, UserRole } from "../types";
import { MOCK_USERS } from "../data/mockComplaints";

interface NavbarProps {
  currentUser: UserProfile;
  onSelectUser: (user: UserProfile) => void;
  activeTab: "dashboard" | "ai_priority" | "tracker" | "analytics" | "print";
  onSelectTab: (tab: "dashboard" | "ai_priority" | "tracker" | "analytics" | "print") => void;
  onOpenNewReportModal: () => void;
  notifications: PushNotification[];
  onMarkNotificationRead: (id: string) => void;
  onClearAllNotifications: () => void;
  onSelectNotificationComplaint: (complaintId: string) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  criticalCount: number;
  onGoToPublic?: () => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onSelectUser,
  activeTab,
  onSelectTab,
  onOpenNewReportModal,
  notifications,
  onMarkNotificationRead,
  onClearAllNotifications,
  onSelectNotificationComplaint,
  soundEnabled,
  onToggleSound,
  criticalCount,
  onGoToPublic,
  onLogout,
}) => {
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const unreadNotifs = notifications.filter((n) => !n.isRead);

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onSelectTab("dashboard")}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/30">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">SIPENGADU</span>
                <span className="text-[10px] uppercase font-semibold tracking-wider bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30">
                  Terpadu & AI
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Sistem Pengaduan & K3 Sekolah</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              id="nav-tab-dashboard"
              onClick={() => onSelectTab("dashboard")}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${
                activeTab === "dashboard"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Semua Pengaduan</span>
              {criticalCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs font-bold bg-rose-500 text-white rounded-full animate-pulse">
                  {criticalCount}
                </span>
              )}
            </button>

            <button
              id="nav-tab-ai-priority"
              onClick={() => onSelectTab("ai_priority")}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${
                activeTab === "ai_priority"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Prioritas AI & Solusi</span>
            </button>

            <button
              id="nav-tab-tracker"
              onClick={() => onSelectTab("tracker")}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${
                activeTab === "tracker"
                  ? "bg-slate-800 text-white border border-slate-700"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Lacak Tiket</span>
            </button>

            <button
              id="nav-tab-analytics"
              onClick={() => onSelectTab("analytics")}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${
                activeTab === "analytics"
                  ? "bg-slate-800 text-white border border-slate-700"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Statistik & Laporan</span>
            </button>
          </nav>

          {/* Action Buttons & Right Menu */}
          <div className="flex items-center space-x-3">
            {/* Sound Toggle */}
            <button
              id="btn-toggle-sound"
              onClick={onToggleSound}
              title={soundEnabled ? "Suara Notifikasi Aktif" : "Suara Notifikasi Senyap"}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>

            {/* Push Notifications Dropdown */}
            <div className="relative">
              <button
                id="btn-notification-bell"
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifs.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-slate-900 animate-bounce">
                    {unreadNotifs.length}
                  </span>
                )}
              </button>

              {showNotifDropdown && (
                <div 
                  id="dropdown-notifications"
                  className="absolute right-0 mt-2 w-84 sm:w-96 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2"
                >
                  <div className="p-3.5 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bell className="w-4 h-4 text-blue-400" />
                      <span className="font-semibold text-sm text-white">Notifikasi Real-time</span>
                      <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full font-medium">
                        {unreadNotifs.length} baru
                      </span>
                    </div>
                    {notifications.length > 0 && (
                      <button
                        onClick={onClearAllNotifications}
                        className="text-xs text-slate-400 hover:text-slate-200 transition"
                      >
                        Tandai semua dibaca
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-800">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-500 text-sm">
                        Belum ada notifikasi baru
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            onMarkNotificationRead(n.id);
                            if (n.complaintId) {
                              onSelectNotificationComplaint(n.complaintId);
                              setShowNotifDropdown(false);
                            }
                          }}
                          className={`p-3.5 cursor-pointer hover:bg-slate-800/60 transition ${
                            !n.isRead ? "bg-slate-800/30 font-medium" : "opacity-80"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <span className="text-xs font-semibold text-white">{n.title}</span>
                            <span className="text-[10px] text-slate-400">{n.timestamp}</span>
                          </div>
                          <p className="text-xs text-slate-300 mt-1 leading-relaxed">{n.message}</p>
                          {n.ticketNumber && (
                            <span className="inline-block mt-1.5 text-[10px] font-mono px-1.5 py-0.5 bg-slate-800 text-blue-300 rounded">
                              {n.ticketNumber}
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Report Button */}
            <button
              id="btn-open-new-report"
              onClick={onOpenNewReportModal}
              className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-sm font-semibold shadow-md shadow-blue-600/20 flex items-center space-x-1.5 transition active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Buat Laporan Baru</span>
            </button>

            {/* Go to Public Portal Button */}
            {onGoToPublic && (
              <button
                id="btn-nav-public-portal"
                onClick={onGoToPublic}
                title="Lihat Beranda Pelaporan Publik"
                className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 text-xs font-bold border border-emerald-600 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Beranda Publik</span>
              </button>
            )}

            {/* Role / User Switcher */}
            <div className="relative">
              <button
                id="btn-user-role-dropdown"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center space-x-2.5 p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition text-left"
              >
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-blue-500"
                />
                <div className="hidden lg:block">
                  <p className="text-xs font-semibold text-white leading-tight">{currentUser.name}</p>
                  <p className="text-[11px] text-blue-400 font-medium">{currentUser.roleTitle}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showUserDropdown && (
                <div 
                  id="dropdown-user-roles"
                  className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in"
                >
                  <div className="px-3 py-2 border-b border-slate-800 mb-1">
                    <p className="text-xs text-slate-400 font-medium">Ganti Akun Demo / Hak Akses:</p>
                  </div>
                  {MOCK_USERS.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        onSelectUser(user);
                        setShowUserDropdown(false);
                      }}
                      className={`w-full flex items-center space-x-3 p-2 rounded-lg text-left transition ${
                        currentUser.id === user.id ? "bg-blue-600/20 border border-blue-500/40" : "hover:bg-slate-800"
                      }`}
                    >
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{user.roleTitle}</p>
                      </div>
                      {currentUser.id === user.id && (
                        <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                      )}
                    </button>
                  ))}

                  {onLogout && (
                    <div className="pt-2 mt-1 border-t border-slate-800">
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          onLogout();
                        }}
                        className="w-full py-2 px-3 rounded-lg text-xs font-bold text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition flex items-center justify-center space-x-1.5"
                      >
                        <span>Keluar / Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-800 text-xs overflow-x-auto space-x-1">
          <button
            onClick={() => onSelectTab("dashboard")}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${
              activeTab === "dashboard" ? "bg-blue-600 text-white font-semibold" : "text-slate-400"
            }`}
          >
            Semua Laporan ({criticalCount > 0 ? `${criticalCount} Kritis` : ""})
          </button>
          <button
            onClick={() => onSelectTab("ai_priority")}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap flex items-center space-x-1 ${
              activeTab === "ai_priority" ? "bg-indigo-600 text-white font-semibold" : "text-slate-400"
            }`}
          >
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>Prioritas AI</span>
          </button>
          <button
            onClick={() => onSelectTab("tracker")}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${
              activeTab === "tracker" ? "bg-slate-800 text-white font-semibold" : "text-slate-400"
            }`}
          >
            Lacak
          </button>
          <button
            onClick={() => onSelectTab("analytics")}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${
              activeTab === "analytics" ? "bg-slate-800 text-white font-semibold" : "text-slate-400"
            }`}
          >
            Statistik
          </button>
        </div>
      </div>
    </header>
  );
};
