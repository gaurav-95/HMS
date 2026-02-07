// ─── Enums ───────────────────────────────────────────────

export type Department =
  | "Cardiology"
  | "Pediatrics"
  | "Orthopedics"
  | "General OPD"
  | "IPD - General Ward"
  | "Ayush"
  | "ICU"
  | "Radiology"
  | "Laboratory"
  | "Administration"
  | "Accounts"
  | "Insurance"
  | "Pharmacy";

export type StaffRole =
  | "Consultant"
  | "RMO"
  | "Staff Nurse"
  | "Sr. Nurse"
  | "Jr. Nurse"
  | "Paramedic"
  | "Administrative"
  | "Technician"
  | "Lab In-charge"
  | "Receptionist"
  | "Accountant"
  | "Metron";

export type NursingClassification = "BSc Nursing" | "GN Nursing" | "BNF";

export type SalaryType = "Fixed" | "Shift-Based";

export type ShiftType = "Morning" | "Evening" | "Night" | "Off";

export type LabTestStatus = "Pending" | "Processing" | "Completed";

export type LabCategory =
  | "Biochemistry"
  | "Hematology"
  | "Serology"
  | "Clinical Pathology"
  | "Microbiology"
  | "Radiology";

export type DocCategory =
  | "Income Tax"
  | "Clinical"
  | "Statutory"
  | "Doctor's Documents"
  | "Staff Documents"
  | "Insurance"
  | "Patient Records";

export type LeaveType = "Casual" | "Sick" | "Earned" | "Maternity" | "Paternity";

export type LeaveStatus = "Pending" | "Approved" | "Rejected";

export type AttendanceStatus = "Present" | "Absent" | "Half-Day" | "Leave";

export type PayrollStatus = "Draft" | "Processed" | "Approved";

export type TokenStatus = "Waiting" | "In-Progress" | "Completed" | "Cancelled";

export type InventoryCategory = "Bed" | "Chair" | "Equipment" | "Nebulizer" | "Other";

export type InventoryStatus = "Active" | "Damaged" | "Disposed";

export type DisposalType = "Sell" | "Charitable";

// ─── Hierarchical Roles ──────────────────────────────────

export type UserRole =
  | "SUPER_ADMIN"
  | "CEO"
  | "COO"
  | "CMO"
  | "METRON"
  | "DOCTOR"
  | "SR_NURSE"
  | "JR_NURSE"
  | "RECEPTIONIST"
  | "TECHNICIAN"
  | "ACCOUNTANT"
  | "STAFF";

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  SUPER_ADMIN: 0,
  CEO: 1,
  CMO: 1,
  COO: 2,
  METRON: 2,
  DOCTOR: 2,
  ACCOUNTANT: 3,
  RECEPTIONIST: 3,
  SR_NURSE: 3,
  JR_NURSE: 3,
  TECHNICIAN: 3,
  STAFF: 4,
};

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  CEO: "CEO",
  COO: "COO",
  CMO: "CMO",
  METRON: "Metron",
  DOCTOR: "Doctor",
  SR_NURSE: "Sr. Nurse",
  JR_NURSE: "Jr. Nurse",
  RECEPTIONIST: "Receptionist",
  TECHNICIAN: "Technician",
  ACCOUNTANT: "Accountant",
  STAFF: "Staff",
};

// ─── Permission System ───────────────────────────────────

export type Permission =
  | "dashboard:view"
  | "staff:read"
  | "staff:write"
  | "patient:read"
  | "patient:write"
  | "patient:register"
  | "lab:read"
  | "lab:write"
  | "payroll:read"
  | "payroll:process"
  | "documents:read"
  | "documents:write"
  | "performance:read"
  | "performance:write"
  | "roster:read"
  | "roster:write"
  | "users:read"
  | "users:write"
  | "announcements:read"
  | "announcements:write"
  | "tokens:read"
  | "tokens:write"
  | "schedule:read"
  | "schedule:write"
  | "leave:apply"
  | "leave:approve"
  | "attendance:read"
  | "attendance:mark"
  | "insurance:read"
  | "insurance:write"
  | "inventory:read"
  | "inventory:write"
  | "medicine:administer"
  | "medicine:prescribe"
  | "reports:read"
  | "reports:match"
  | "settings:read"
  | "settings:write";

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [
    "dashboard:view", "staff:read", "staff:write", "patient:read", "patient:write",
    "patient:register", "lab:read", "lab:write", "payroll:read", "payroll:process",
    "documents:read", "documents:write", "performance:read", "performance:write",
    "roster:read", "roster:write", "users:read", "users:write",
    "announcements:read", "announcements:write", "tokens:read", "tokens:write",
    "schedule:read", "schedule:write", "leave:apply", "leave:approve",
    "attendance:read", "attendance:mark", "insurance:read", "insurance:write",
    "inventory:read", "inventory:write", "medicine:prescribe", "medicine:administer",
    "reports:read", "reports:match", "settings:read", "settings:write",
  ],
  CEO: [
    "dashboard:view", "staff:read", "staff:write", "patient:read", "payroll:read",
    "payroll:process", "documents:read", "documents:write", "performance:read",
    "performance:write", "roster:read", "users:read", "users:write",
    "announcements:read", "announcements:write", "tokens:read", "schedule:read",
    "schedule:write", "leave:approve", "attendance:read", "insurance:read",
    "inventory:read", "inventory:write", "reports:read", "settings:read", "settings:write",
  ],
  CMO: [
    "dashboard:view", "staff:read", "staff:write", "patient:read", "patient:write",
    "lab:read", "lab:write", "documents:read", "documents:write", "performance:read",
    "performance:write", "roster:read", "roster:write", "schedule:read",
    "schedule:write", "leave:approve", "attendance:read", "medicine:prescribe",
    "reports:read", "reports:match",
  ],
  COO: [
    "dashboard:view", "staff:read", "staff:write", "patient:read", "payroll:read",
    "documents:read", "documents:write", "performance:read", "roster:read",
    "announcements:read", "announcements:write", "tokens:read", "schedule:read",
    "leave:approve", "attendance:read", "attendance:mark", "inventory:read",
    "inventory:write", "settings:read",
  ],
  METRON: [
    "dashboard:view", "staff:read", "patient:read", "patient:write",
    "documents:read", "documents:write", "roster:read", "roster:write",
    "schedule:read", "schedule:write", "attendance:read", "attendance:mark",
    "medicine:administer", "reports:read",
  ],
  DOCTOR: [
    "dashboard:view", "staff:read", "patient:read", "patient:write", "lab:read",
    "lab:write", "documents:read", "performance:read", "schedule:read",
    "leave:apply", "attendance:read", "medicine:prescribe", "reports:read",
  ],
  ACCOUNTANT: [
    "dashboard:view", "staff:read", "payroll:read", "payroll:process",
    "documents:read", "documents:write", "leave:approve", "attendance:read",
    "leave:apply",
  ],
  RECEPTIONIST: [
    "dashboard:view", "patient:read", "patient:write", "patient:register",
    "tokens:read", "tokens:write", "schedule:read", "documents:read",
    "leave:apply", "attendance:read",
  ],
  SR_NURSE: [
    "dashboard:view", "patient:read", "patient:write", "documents:read",
    "documents:write", "roster:read", "attendance:read", "medicine:administer",
    "reports:read", "leave:apply",
  ],
  JR_NURSE: [
    "dashboard:view", "patient:read", "documents:read", "roster:read",
    "attendance:read", "medicine:administer", "leave:apply",
  ],
  TECHNICIAN: [
    "dashboard:view", "lab:read", "lab:write", "documents:read", "attendance:read",
    "reports:read", "reports:match", "leave:apply",
  ],
  STAFF: [
    "dashboard:view", "documents:read", "attendance:read", "leave:apply",
  ],
};



// ─── Data Interfaces ─────────────────────────────────────

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  avatarUrl?: string;
}

export interface Staff {
  id: string;
  employeeCode: string;
  name: string;
  role: StaffRole;
  department: Department;
  nursingClassification?: NursingClassification;
  phone: string;
  email: string;
  address?: string;
  joiningDate: string;
  salaryType: SalaryType;
  baseSalary: number;
  shiftRate?: number;
  attendanceRate?: number;
  imageUrl?: string;
  aadhaarNumber?: string;
  panNumber?: string;
  kpis: KPI[];
  certifications: Certification[];
}

export interface Patient {
  id: string;
  registrationNumber: string;
  name: string;
  phone: string;
  email?: string;
  dob: string;
  gender: "Male" | "Female" | "Other";
  bloodGroup?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  imageUrl?: string;
  createdAt: string;
}

export interface LabTest {
  id: string;
  patientName: string;
  patientId?: string;
  testName: string;
  category: LabCategory;
  status: LabTestStatus;
  technicianId?: string;
  requestedBy?: string;
  requestDate: string;
  completionDate?: string;
  priority: "Normal" | "Urgent" | "STAT";
  reportPath?: string;
  reportNumber?: string;
}

export interface Certification {
  id: string;
  name: string;
  expiryDate: string;
  status: "Valid" | "Expired" | "Expiring Soon";
  category: DocCategory;
  filePath?: string;
  uploadedBy?: string;
}

export interface KPI {
  label: string;
  value: number;
}

export interface Shift {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  shiftType: ShiftType;
  department: Department;
}

export interface Document {
  id: string;
  entityType: "staff" | "patient" | "department" | "insurance";
  entityId: string;
  title: string;
  category: DocCategory;
  filePath?: string;
  fileSize?: number;
  mimeType?: string;
  expiryDate?: string;
  uploadedBy?: string;
  isDeleted: boolean;
  deletedBy?: string;
  year?: number;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  type: "general" | "policy" | "penalty";
  targetRoles: UserRole[];
  absenceDeductionAmount?: number;
  absenceLimit?: number;
  createdBy: string;
  isActive: boolean;
  createdAt: string;
}

export interface Token {
  id: string;
  patientId: string;
  patientName: string;
  departmentId: string;
  doctorId?: string;
  tokenNumber: number;
  date: string;
  status: TokenStatus;
}

export interface LeaveRequest {
  id: string;
  staffId: string;
  staffName: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  approvedBy?: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: AttendanceStatus;
  markedBy?: string;
}

export interface PayrollRecord {
  id: string;
  staffId: string;
  staffName: string;
  month: number;
  year: number;
  baseAmount: number;
  deductions: Record<string, number>;
  additions: Record<string, number>;
  netAmount: number;
  status: PayrollStatus;
  processedBy?: string;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  type: "Fixed" | "Recurring";
  category: InventoryCategory;
  quantity: number;
  assignedQty: number;
  disposableQty: number;
  purchaseDate?: string;
  billPath?: string;
  warrantyPath?: string;
  warrantyExpiry?: string;
  photoPath?: string;
  location?: string;
  status: InventoryStatus;
}

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  avatarUrl?: string;
  createdAt: string;
}
