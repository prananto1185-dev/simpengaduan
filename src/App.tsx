import React, { useState, useEffect, useMemo } from "react";
import { 
  PlusCircle, 
  Search, 
  Filter, 
  SlidersHorizontal, 
  Sparkles, 
  FileText, 
  BarChart3, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Layers, 
  Wrench, 
  Shield, 
  Building2, 
  X,
  LayoutGrid,
  Table as TableIcon
} from "lucide-react";
import { 
  Complaint, 
  ComplaintCategory, 
  ComplaintStatus, 
  UserProfile, 
  PushNotification, 
  ProgressLog, 
  AIAnalysis 
} from "./types";
import { MOCK_USERS, INITIAL_COMPLAINTS, INITIAL_NOTIFICATIONS } from "./data/mockComplaints";
import { Navbar } from "./components/Navbar";
import { StatCards } from "./components/StatCards";
import { ComplaintCard, getCategoryMeta, getStatusMeta } from "./components/ComplaintCard";
import { ReportFormModal } from "./components/ReportFormModal";
import { ComplaintDetailModal } from "./components/ComplaintDetailModal";
import { AIPriorityDashboard } from "./components/AIPriorityDashboard";
import { PublicTrackerView } from "./components/PublicTrackerView";
import { AnalyticsView } from "./components/AnalyticsView";
import { OfficialPrintReport } from "./components/OfficialPrintReport";
import { NotificationToast } from "./components/NotificationToast";
import { FrontLandingPage } from "./components/FrontLandingPage";
import { AdminLoginPage } from "./components/AdminLoginPage";
import { analyzeComplaintWithAI } from "./services/geminiService";
import { 
  subscribeToComplaints, 
  createComplaintInDb, 
  updateComplaintInDb, 
  seedInitialComplaintsIfEmpty 
} from "./services/complaintDbService";

// Web Audio API notification chime generator
function playNotificationChime() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (err) {
    // silent fallback
  }
}

export default function App() {
  // Persistence state
  const [complaints, setComplaints] = useState<Complaint[]>(() => {
    try {
      const saved = localStorage.getItem("sipengadu_complaints_v1");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Using initial complaints");
    }
    return INITIAL_COMPLAINTS;
  });

  const [currentUser, setCurrentUser] = useState<UserProfile>(MOCK_USERS[0]);
  const [notifications, setNotifications] = useState<PushNotification[]>(INITIAL_NOTIFICATIONS);
  const [activeToast, setActiveToast] = useState<PushNotification | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // App Mode State: "public" (Front landing page) | "admin_login" | "admin_dashboard"
  const [appMode, setAppMode] = useState<"public" | "admin_login" | "admin_dashboard">("public");

  // View & Filter states
  const [activeTab, setActiveTab] = useState<"dashboard" | "ai_priority" | "tracker" | "analytics" | "print">("dashboard");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Modal states
  const [isNewReportModalOpen, setIsNewReportModalOpen] = useState(false);
  const [detailComplaint, setDetailComplaint] = useState<Complaint | null>(null);
  const [printComplaint, setPrintComplaint] = useState<Complaint | null>(null);

  // Real-time Firestore sync & LocalStorage backup
  useEffect(() => {
    // 1. Initial seed check if database is fresh
    seedInitialComplaintsIfEmpty();

    // 2. Setup real-time listener from Firestore
    const unsubscribe = subscribeToComplaints(
      (remoteComplaints) => {
        if (remoteComplaints && remoteComplaints.length > 0) {
          setComplaints(remoteComplaints);
          try {
            localStorage.setItem("sipengadu_complaints_v1", JSON.stringify(remoteComplaints));
          } catch (e) {
            // ignore
          }
        }
      },
      (err) => {
        console.warn("Real-time sync notice (using local cache):", err);
      }
    );

    return () => unsubscribe();
  }, []);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("sipengadu_complaints_v1", JSON.stringify(complaints));
    } catch (e) {
      // ignore
    }
  }, [complaints]);

  // Push Notification Dispatcher
  const triggerNotification = (notif: Omit<PushNotification, "id" | "timestamp" | "isRead">) => {
    const newNotif: PushNotification = {
      ...notif,
      id: `notif-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      isRead: false,
    };

    setNotifications((prev) => [newNotif, ...prev]);
    setActiveToast(newNotif);

    if (soundEnabled) {
      playNotificationChime();
    }
  };

  // Add new complaint from ReportFormModal or FrontLandingPage (Real Database Persistence)
  const handleAddNewComplaint = async (newCompData: Omit<Complaint, "id" | "ticketNumber" | "logs" | "createdAt" | "updatedAt">): Promise<Complaint> => {
    const nextTicketNum = `LAP-2026-${String(complaints.length + 801).padStart(4, "0")}`;
    const newId = `comp-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const nowReadable = new Date().toLocaleString("id-ID", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

    const initialLog: ProgressLog = {
      id: `log-${Date.now()}-1`,
      timestamp: nowReadable,
      updatedBy: newCompData.reporterName,
      role: newCompData.reporterRole,
      actionTitle: "Laporan Diajukan",
      newStatus: "dilaporkan",
      note: `Pengaduan baru "${newCompData.title}" berhasil diajukan ke sistem sekolah.`,
    };

    // Run AI analysis
    let calculatedScore = newCompData.priorityScore || 50;
    let aiRes: AIAnalysis | undefined = undefined;
    try {
      aiRes = await analyzeComplaintWithAI({
        title: newCompData.title,
        category: newCompData.category,
        subCategory: newCompData.subCategory,
        description: newCompData.description,
        location: newCompData.location,
        urgencyLevel: newCompData.urgencyLevel,
        isAnonymous: newCompData.isAnonymous,
        reporterRole: newCompData.reporterRole,
      });
      if (aiRes && aiRes.priorityScore) {
        calculatedScore = aiRes.priorityScore;
      }
    } catch (e) {
      console.warn("AI pre-calc fallback:", e);
    }

    const createdComplaint: Complaint = {
      ...newCompData,
      id: newId,
      ticketNumber: nextTicketNum,
      priorityScore: calculatedScore,
      aiAnalysis: aiRes,
      logs: [initialLog],
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // 1. Update React local state immediately for snappy UX
    setComplaints((prev) => [createdComplaint, ...prev]);

    // 2. Persist to Firestore cloud database
    try {
      await createComplaintInDb(createdComplaint);
      console.log("Complaint saved to Firestore cloud database:", newId);
    } catch (err) {
      console.warn("Local persistence active (Firestore offline/error):", err);
    }

    triggerNotification({
      title: `📝 Laporan Masuk: ${nextTicketNum}`,
      message: `${createdComplaint.title} (${createdComplaint.location}) - Skor AI: ${createdComplaint.priorityScore}`,
      type: createdComplaint.priorityScore >= 85 ? "urgent_case" : "new_report",
      complaintId: newId,
      ticketNumber: nextTicketNum,
    });

    return createdComplaint;
  };

  // Update Status Progression
  const handleUpdateStatus = (
    complaintId: string,
    newStatus: ComplaintStatus,
    note: string,
    proofPhoto?: string
  ) => {
    const nowIso = new Date().toISOString();
    const nowReadable = new Date().toLocaleString("id-ID", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

    let updatedComplaintObject: Complaint | null = null;

    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id !== complaintId) return c;

        const newLog: ProgressLog = {
          id: `log-${Date.now()}`,
          timestamp: nowReadable,
          updatedBy: currentUser.name,
          role: currentUser.roleTitle,
          actionTitle: `Status: ${getStatusMeta(newStatus).label}`,
          previousStatus: c.status,
          newStatus: newStatus,
          note: note,
          proofPhoto: proofPhoto,
        };

        const updatedRepairPhotos = proofPhoto
          ? [...(c.repairProofPhotos || []), proofPhoto]
          : c.repairProofPhotos;

        const updated: Complaint = {
          ...c,
          status: newStatus,
          logs: [newLog, ...c.logs],
          repairProofPhotos: updatedRepairPhotos,
          updatedAt: nowIso,
        };

        updatedComplaintObject = updated;

        if (detailComplaint && detailComplaint.id === complaintId) {
          setDetailComplaint(updated);
        }

        return updated;
      })
    );

    // Persist update to Firestore
    if (updatedComplaintObject) {
      const target: Complaint = updatedComplaintObject;
      updateComplaintInDb(complaintId, {
        status: target.status,
        logs: target.logs,
        repairProofPhotos: target.repairProofPhotos,
        updatedAt: target.updatedAt,
      }).catch((e) => console.warn("Firestore update error:", e));
    }

    const comp = complaints.find((c) => c.id === complaintId);
    triggerNotification({
      title: `🔄 Status Diperbarui: ${comp?.ticketNumber || complaintId}`,
      message: `Status berubah menjadi "${getStatusMeta(newStatus).label}". Catatan: ${note.substring(0, 50)}...`,
      type: "status_change",
      complaintId: complaintId,
      ticketNumber: comp?.ticketNumber,
    });
  };

  // Delegate PIC
  const handleAssignPIC = (complaintId: string, assignedTo: string, department: string) => {
    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id !== complaintId) return c;
        const updated = { ...c, assignedTo, assignedDepartment: department };
        if (detailComplaint && detailComplaint.id === complaintId) {
          setDetailComplaint(updated);
        }
        return updated;
      })
    );

    updateComplaintInDb(complaintId, {
      assignedTo,
      assignedDepartment: department,
      updatedAt: new Date().toISOString(),
    }).catch((e) => console.warn("Firestore assign PIC error:", e));
  };

  // Update AI analysis
  const handleUpdateAIAnalysis = (complaintId: string, analysis: AIAnalysis) => {
    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id !== complaintId) return c;
        const updated = {
          ...c,
          priorityScore: analysis.priorityScore,
          aiAnalysis: analysis,
        };
        if (detailComplaint && detailComplaint.id === complaintId) {
          setDetailComplaint(updated);
        }
        return updated;
      })
    );

    updateComplaintInDb(complaintId, {
      priorityScore: analysis.priorityScore,
      aiAnalysis: analysis,
      updatedAt: new Date().toISOString(),
    }).catch((e) => console.warn("Firestore AI update error:", e));
  };

  // Submit Feedback
  const handleSubmitFeedback = (complaintId: string, satisfactionRating: number, feedback: string) => {
    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id !== complaintId) return c;
        const updated = { ...c, satisfactionRating, satisfactionFeedback: feedback };
        if (detailComplaint && detailComplaint.id === complaintId) {
          setDetailComplaint(updated);
        }
        return updated;
      })
    );

    updateComplaintInDb(complaintId, {
      satisfactionRating,
      satisfactionFeedback: feedback,
      updatedAt: new Date().toISOString(),
    }).catch((e) => console.warn("Firestore feedback error:", e));
  };

  // Add Log
  const handleAddLog = (complaintId: string, log: ProgressLog) => {
    let updatedLogs: ProgressLog[] = [];
    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id !== complaintId) return c;
        updatedLogs = [log, ...c.logs];
        const updated = { ...c, logs: updatedLogs };
        if (detailComplaint && detailComplaint.id === complaintId) {
          setDetailComplaint(updated);
        }
        return updated;
      })
    );

    if (updatedLogs.length > 0) {
      updateComplaintInDb(complaintId, {
        logs: updatedLogs,
        updatedAt: new Date().toISOString(),
      }).catch((e) => console.warn("Firestore add log error:", e));
    }
  };

  // Filtered complaints computation
  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      // Category filter
      if (categoryFilter !== "all" && c.category !== categoryFilter) return false;

      // Status filter
      if (statusFilter === "kritis") {
        if (c.priorityScore < 85 && c.urgencyLevel !== "darurat") return false;
        if (c.status === "selesai" || c.status === "ditolak") return false;
      } else if (statusFilter !== "all" && c.status !== statusFilter) {
        return false;
      }

      // Urgency filter
      if (urgencyFilter !== "all" && c.urgencyLevel !== urgencyFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = c.title.toLowerCase().includes(q);
        const matchDesc = c.description.toLowerCase().includes(q);
        const matchTicket = c.ticketNumber.toLowerCase().includes(q);
        const matchLoc = c.location.toLowerCase().includes(q);
        const matchReporter = c.reporterName.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchTicket && !matchLoc && !matchReporter) {
          return false;
        }
      }

      return true;
    });
  }, [complaints, categoryFilter, statusFilter, urgencyFilter, searchQuery]);

  const criticalCount = complaints.filter(
    (c) => (c.priorityScore >= 85 || c.urgencyLevel === "darurat") && c.status !== "selesai" && c.status !== "ditolak"
  ).length;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* 1. PUBLIC FRONT LANDING PAGE (Sesuai Permintaan & Screenshot) */}
      {appMode === "public" && (
        <FrontLandingPage
          onGoToLogin={() => setAppMode("admin_login")}
          onSubmitComplaint={handleAddNewComplaint}
          complaints={complaints}
          onOpenDetailModal={(c) => setDetailComplaint(c)}
        />
      )}

      {/* 2. DEDICATED ADMIN LOGIN PAGE */}
      {appMode === "admin_login" && (
        <AdminLoginPage
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            setAppMode("admin_dashboard");
          }}
          onBackToPublic={() => setAppMode("public")}
        />
      )}

      {/* 3. SIMPLIFIED ADMIN DASHBOARD */}
      {appMode === "admin_dashboard" && (
        <>
          {/* Top Main Navigation */}
          <Navbar
            currentUser={currentUser}
            onSelectUser={setCurrentUser}
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            onOpenNewReportModal={() => setIsNewReportModalOpen(true)}
            notifications={notifications}
            onMarkNotificationRead={(id) =>
              setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
            }
            onClearAllNotifications={() =>
              setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
            }
            onSelectNotificationComplaint={(comp) => {
              const target = complaints.find((c) => c.id === comp || c.ticketNumber === comp);
              if (target) {
                setDetailComplaint(target);
              }
            }}
            soundEnabled={soundEnabled}
            onToggleSound={() => setSoundEnabled(!soundEnabled)}
            criticalCount={criticalCount}
            onGoToPublic={() => setAppMode("public")}
            onLogout={() => setAppMode("public")}
          />

          {/* Main App Container */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {/* VIEW 1: SEMUA PENGADUAN DASHBOARD */}
        {activeTab === "dashboard" && (
          <div className="space-y-6 animate-in fade-in">
            {/* Top Stat Metrics */}
            <StatCards
              complaints={complaints}
              onFilterCategory={(cat) => setCategoryFilter(cat)}
              onFilterStatus={(status) => setStatusFilter(status)}
            />

            {/* Filter, Search & Category Selector Bar */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-4">
              {/* Category Pills Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
                    Kategori:
                  </span>
                  <button
                    id="filter-cat-all"
                    onClick={() => setCategoryFilter("all")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                      categoryFilter === "all"
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                    }`}
                  >
                    <span>Semua Kategori</span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-slate-700/30 rounded-full">
                      {complaints.length}
                    </span>
                  </button>

                  <button
                    id="filter-cat-sarpras"
                    onClick={() => setCategoryFilter("sarpras")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                      categoryFilter === "sarpras"
                        ? "bg-amber-600 text-white shadow-sm"
                        : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 border border-amber-200 dark:border-amber-900/50"
                    }`}
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Sarpras ({complaints.filter((c) => c.category === "sarpras").length})</span>
                  </button>

                  <button
                    id="filter-cat-bullying"
                    onClick={() => setCategoryFilter("bullying")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                      categoryFilter === "bullying"
                        ? "bg-rose-600 text-white shadow-sm"
                        : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 border border-rose-200 dark:border-rose-900/50"
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Bullying / TPPK ({complaints.filter((c) => c.category === "bullying").length})</span>
                  </button>

                  <button
                    id="filter-cat-pelayanan"
                    onClick={() => setCategoryFilter("pelayanan")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                      categoryFilter === "pelayanan"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 border border-blue-200 dark:border-blue-900/50"
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Pelayanan ({complaints.filter((c) => c.category === "pelayanan").length})</span>
                  </button>
                </div>

                {/* View Mode Grid/Table toggle */}
                <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-1.5 rounded-lg transition ${
                      viewMode === "grid" ? "bg-white dark:bg-slate-900 text-blue-600 shadow-sm" : "text-slate-400"
                    }`}
                    title="Tampilan Grid Kartu"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("table")}
                    className={`p-1.5 rounded-lg transition ${
                      viewMode === "table" ? "bg-white dark:bg-slate-900 text-blue-600 shadow-sm" : "text-slate-400"
                    }`}
                    title="Tampilan Tabel Rinci"
                  >
                    <TableIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Search Box & Dropdown Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                {/* Search Bar */}
                <div className="sm:col-span-6 relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari tiket, kata kunci judul, lokasi, pelapor..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Status Dropdown */}
                <div className="sm:col-span-3">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="all">Semua Status</option>
                    <option value="kritis">🚨 Kritis Saja (Darurat / Skor &gt; 85)</option>
                    <option value="dilaporkan">Menunggu Verifikasi</option>
                    <option value="ditinjau">Sedang Ditinjau</option>
                    <option value="proses">Sedang Dikerjakan</option>
                    <option value="menunggu_material">Menunggu Suku Cadang</option>
                    <option value="selesai">Terselesaikan</option>
                    <option value="ditolak">Ditolak</option>
                  </select>
                </div>

                {/* Urgency Dropdown */}
                <div className="sm:col-span-3">
                  <select
                    value={urgencyFilter}
                    onChange={(e) => setUrgencyFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="all">Semua Tingkat Urgensi</option>
                    <option value="darurat">🔴 Darurat</option>
                    <option value="mendesak">🟠 Mendesak</option>
                    <option value="sedang">🟡 Sedang</option>
                    <option value="rendah">🟢 Rendah</option>
                  </select>
                </div>
              </div>
            </div>

            {/* List / Grid of Complaints */}
            {filteredComplaints.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Tidak Ada Pengaduan yang Cocok
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Silakan sesuaikan kata kunci pencarian atau reset filter kategori dan status.
                </p>
                <button
                  onClick={() => {
                    setCategoryFilter("all");
                    setStatusFilter("all");
                    setUrgencyFilter("all");
                    setSearchQuery("");
                  }}
                  className="px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-xl"
                >
                  Reset Semua Filter
                </button>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredComplaints.map((comp) => (
                  <ComplaintCard
                    key={comp.id}
                    complaint={comp}
                    onOpenDetail={(c) => setDetailComplaint(c)}
                  />
                ))}
              </div>
            ) : (
              /* Table View */
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-3.5">No. Tiket</th>
                      <th className="p-3.5">Kategori</th>
                      <th className="p-3.5">Judul & Lokasi</th>
                      <th className="p-3.5">Prioritas AI</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">PIC</th>
                      <th className="p-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredComplaints.map((comp) => {
                      const catMeta = getCategoryMeta(comp.category);
                      const statusMeta = getStatusMeta(comp.status);

                      return (
                        <tr
                          key={comp.id}
                          onClick={() => setDetailComplaint(comp)}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition"
                        >
                          <td className="p-3.5 font-mono font-bold text-blue-600 dark:text-blue-400">
                            {comp.ticketNumber}
                          </td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded font-semibold border ${catMeta.badgeClass}`}>
                              {catMeta.label}
                            </span>
                          </td>
                          <td className="p-3.5 max-w-xs">
                            <div className="font-bold text-slate-900 dark:text-white truncate">
                              {comp.title}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate mt-0.5">
                              {comp.location}
                            </div>
                          </td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded-full font-bold text-white text-[11px] ${
                              comp.priorityScore >= 85 ? "bg-rose-600" : comp.priorityScore >= 70 ? "bg-amber-600" : "bg-emerald-600"
                            }`}>
                              {comp.priorityScore}/100
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className={`px-2.5 py-1 rounded-full font-semibold border ${statusMeta.badgeClass}`}>
                              {statusMeta.label}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-600 dark:text-slate-300">
                            {comp.assignedTo || "-"}
                          </td>
                          <td className="p-3.5 text-right font-semibold text-blue-600 dark:text-blue-400">
                            Detail ➔
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: AI PRIORITY & MATRIX DASHBOARD */}
        {activeTab === "ai_priority" && (
          <AIPriorityDashboard
            complaints={complaints}
            currentUser={currentUser}
            onOpenDetail={(c) => setDetailComplaint(c)}
          />
        )}

        {/* VIEW 3: PUBLIC TRANSPARENCY TRACKER */}
        {activeTab === "tracker" && (
          <PublicTrackerView
            complaints={complaints}
            onOpenDetail={(c) => setDetailComplaint(c)}
          />
        )}

        {/* VIEW 4: ANALYTICS & STATS */}
        {activeTab === "analytics" && <AnalyticsView complaints={complaints} />}

        {/* VIEW 5: OFFICIAL PRINT REPORT */}
        {activeTab === "print" && printComplaint && (
          <OfficialPrintReport
            complaint={printComplaint}
            onBack={() => setActiveTab("dashboard")}
          />
        )}
      </main>
      </>
      )}

      {/* Floating Push Notification Toast Alert */}
      <NotificationToast
        notification={activeToast}
        onClose={() => setActiveToast(null)}
        onClick={(comp) => {
          if (comp) {
            const target = complaints.find((c) => c.id === comp || c.ticketNumber === comp);
            if (target) setDetailComplaint(target);
          }
          setActiveToast(null);
        }}
      />

      {/* Report Form Modal */}
      <ReportFormModal
        isOpen={isNewReportModalOpen}
        onClose={() => setIsNewReportModalOpen(false)}
        onSubmit={handleAddNewComplaint}
        currentUser={currentUser}
      />

      {/* Complaint Detail & Status Management Modal */}
      <ComplaintDetailModal
        complaint={detailComplaint}
        isOpen={!!detailComplaint}
        onClose={() => setDetailComplaint(null)}
        currentUser={currentUser}
        onUpdateStatus={handleUpdateStatus}
        onAssignPIC={handleAssignPIC}
        onAddLog={handleAddLog}
        onUpdateAIAnalysis={handleUpdateAIAnalysis}
        onSubmitFeedback={handleSubmitFeedback}
        onOpenPrintReport={(c) => {
          setPrintComplaint(c);
          setDetailComplaint(null);
          setActiveTab("print");
        }}
      />
    </div>
  );
}
