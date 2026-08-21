export type ComplaintCategory = 'sarpras' | 'pelayanan' | 'bullying';

export type ComplaintStatus = 
  | 'dilaporkan'           // Baru masuk, menunggu verifikasi
  | 'ditinjau'             // Sedang diverifikasi oleh admin/petugas
  | 'proses'               // Sedang ditangani/dalam perbaikan fisik/konseling
  | 'menunggu_material'    // Menunggu suku cadang/anggaran/tindakan khusus
  | 'selesai'              // Telah terselesaikan dengan bukti foto & catatan
  | 'ditolak';             // Tidak valid / duplikat dengan penjelasan

export type UrgencyLevel = 'rendah' | 'sedang' | 'mendesak' | 'darurat';

export type PriorityLevel = 'Kritis' | 'Tinggi' | 'Sedang' | 'Rendah';

export type UserRole = 'admin' | 'sarpras' | 'bk' | 'kepsek' | 'guru';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  roleTitle: string;
  email: string;
  avatarUrl: string;
  badgeDepartment: string;
}

export interface AIAnalysis {
  priorityScore: number;
  priorityLevel: PriorityLevel;
  summary: string;
  riskAssessment: string;
  immediateActions: string[];
  resolutionSteps: string[];
  preventiveMeasures: string[];
  assignedDepartment: string;
  estimatedTimeframe: string;
  requiredResources?: string[];
  legalOrPolicyAdvice?: string;
  analyzedAt?: string;
}

export interface ProgressLog {
  id: string;
  timestamp: string;
  updatedBy: string;
  role: string;
  actionTitle: string;
  previousStatus?: ComplaintStatus;
  newStatus?: ComplaintStatus;
  note: string;
  proofPhoto?: string;
}

export interface Complaint {
  id: string;
  ticketNumber: string; // e.g. "LAP-2026-0801"
  title: string;
  category: ComplaintCategory;
  subCategory: string;
  description: string;
  location: string;
  urgencyLevel: UrgencyLevel;
  isAnonymous: boolean;
  reporterName: string;
  reporterRole: string; // e.g. "Guru Matematika / Kelas 8B"
  reporterContact?: string;
  photos: string[]; // Base64 or URL photos of the damage/incident
  repairProofPhotos?: string[]; // Photos after repair/resolution
  status: ComplaintStatus;
  assignedTo?: string; // Name of technician or BK counselor
  assignedDepartment?: string;
  priorityScore: number; // 1-100 from AI
  aiAnalysis?: AIAnalysis;
  logs: ProgressLog[];
  createdAt: string;
  updatedAt: string;
  estimatedResolutionDate?: string;
  resolutionSummary?: string;
  satisfactionRating?: number; // 1-5 stars from reporter
  satisfactionFeedback?: string;
}

export interface PushNotification {
  id: string;
  title: string;
  message: string;
  type: 'status_change' | 'ai_alert' | 'urgent_case' | 'new_report';
  complaintId?: string;
  ticketNumber?: string;
  timestamp: string;
  isRead: boolean;
}

export interface BatchPrioritizationResult {
  executiveSummary: string;
  topUrgentActions: string[];
  prioritizedList: {
    complaintId: string;
    recommendedOrder: number;
    priorityTier: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    reasonForPriority: string;
    actionableRecommendation: string;
  }[];
}

export interface ComplaintFilter {
  category: string;
  status: string;
  urgency: string;
  searchQuery: string;
  sortBy: 'latest' | 'oldest' | 'priority_desc' | 'urgency';
}
