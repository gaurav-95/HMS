// ─── Enums ───────────────────────────────────────────────

export type Department =
  | "Cardiology"
  | "Pediatrics"
  | "Orthopedics"
  | "General OPD"
  | "General Medicine"
  | "IPD - General Ward"
  | "Ayush"
  | "ICU"
  | "Emergency"
  | "Radiology"
  | "Laboratory"
  | "Administration"
  | "Accounts"
  | "Insurance"
  | "Pharmacy"
  | "ENT"
  | "Dermatology"
  | "Ophthalmology"
  | "Pathology"
  | "Gynecology"
  | "Front Desk"
  | "Security"
  | "Finance"
  | "Nursing";

export type StaffRole =
  | "Consultant"
  | "RMO"
  | "Doctor"
  | "Staff Nurse"
  | "Sr. Nurse"
  | "Jr. Nurse"
  | "Nurse"
  | "Paramedic"
  | "Administrative"
  | "Technician"
  | "Lab Technician"
  | "Lab In-charge"
  | "Receptionist"
  | "Accountant"
  | "Pharmacist"
  | "Security"
  | "Driver"
  | "Housekeeping"
  | "Metron";

export type NursingClassification = "BSc Nursing" | "GN Nursing" | "BNF" | "BSc" | "GNM" | "ANM";

export type StaffCategory = "Admin" | "Clinical" | "Receptionist" | "Nurse" | "Technical";

export type SalaryType = "Fixed" | "Shift-Based";

export type DocCategory =
  | "Income Tax"
  | "Clinical"
  | "Statutory"
  | "Doctor's Documents"
  | "Staff Documents"
  | "Insurance"
  | "Patient Records";

export type LeaveType = "Casual" | "Sick" | "Earned" | "Maternity" | "Paternity" | "Unpaid";

export type LeaveStatus = "Pending" | "Approved" | "Rejected" | "Cancelled";

export type AttendanceStatus = "Present" | "Absent" | "Late" | "HalfDay" | "OnLeave";

export type PayrollStatus = "Draft" | "Processed" | "Approved" | "Paid";

// ─── Simplified Roles (4 roles) ──────────────────────────

export type UserRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "LEADER"
  | "STAFF";

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  SUPER_ADMIN: 0,
  ADMIN: 1,
  LEADER: 2,
  STAFF: 3,
};

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  LEADER: "Leader",
  STAFF: "Staff",
};

// ─── Permission System ───────────────────────────────────

export type Permission =
  | "dashboard:view"
  | "staff:read"
  | "staff:write"
  | "staff:delete"
  | "payroll:read"
  | "payroll:write"
  | "payroll:approve"
  | "users:read"
  | "users:write"
  | "users:delete"
  | "leave:apply"
  | "leave:approve"
  | "leave:manage-types"
  | "attendance:read"
  | "attendance:write"
  | "settings:read"
  | "settings:write";

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [
    "dashboard:view",
    "staff:read", "staff:write", "staff:delete",
    "payroll:read", "payroll:write", "payroll:approve",
    "users:read", "users:write", "users:delete",
    "leave:apply", "leave:approve", "leave:manage-types",
    "attendance:read", "attendance:write",
    "settings:read", "settings:write",
  ],
  ADMIN: [
    "dashboard:view",
    "staff:read", "staff:write",
    "payroll:read", "payroll:write", "payroll:approve",
    "users:read", "users:write",
    "leave:apply", "leave:approve",
    "attendance:read", "attendance:write",
    "settings:read",
  ],
  LEADER: [
    "dashboard:view",
    "staff:read",
    "payroll:read",
    "leave:apply", "leave:approve",
    "attendance:read", "attendance:write",
    "settings:read",
  ],
  STAFF: [
    "dashboard:view",
    "attendance:read",
    "leave:apply",
    "payroll:read",
    "settings:read",
  ],
};



// ─── Data Interfaces ─────────────────────────────────────

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  permissions: Permission[];
  avatarUrl?: string;
}

export interface Staff {
  id: string;
  userId?: string;
  name: string;
  role: StaffRole;
  department: Department;
  nursingClassification?: NursingClassification;
  category?: StaffCategory;
  phone: string;
  email: string;
  address?: string;
  residentialAddress?: string;
  joiningDate: string;
  appointmentDate?: string;
  terminationDate?: string;
  salaryType: SalaryType;
  baseSalary: number;
  ctcAnnual?: number;
  shiftRate?: number;
  attendanceRate?: number;
  shiftInterval?: string;
  imageUrl?: string;
  photoPath?: string;
  aadhaarNumber?: string;
  aadhaarDocPath?: string;
  panNumber?: string;
  isActive?: boolean;
  kpis: KPI[];
  certifications: Certification[];
}

export interface StaffDocument {
  id: string;
  staffId: string;
  fileName: string;
  originalName: string;
  category: "official" | "medical";
  documentType: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

export interface Certification {
  id: string;
  staffId?: string;
  name: string;
  expiryDate: string;
  status: "Valid" | "Expiring" | "Expired";
  addressed?: boolean;
  filePath?: string;
  fileSize?: string;
}

export interface KPI {
  id?: string;
  staffId?: string;
  name: string;
  value: number;
  target?: number;
}

export interface LeaveRequest {
  id: string;
  staffId: string;
  staffName: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  approvedBy?: string;
  appliedDate: string;
}

export interface AttendanceRecord {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: AttendanceStatus;
}

export interface PayrollRecord {
  id: string;
  staffId: string;
  staffName: string;
  department?: string;
  month: string;
  year?: string;
  baseSalary: number;
  basicSalary?: number;
  hra?: number;
  epfEmployer?: number;
  otherAllowance?: number;
  grossSalary?: number;
  professionalTax?: number;
  epfEmployee?: number;
  leaveDeductions?: number;
  totalShifts?: number;
  attendedShifts?: number;
  leavesTaken?: number;
  shiftRate?: number;
  bonus: number;
  deductions: number;
  netSalary: number;
  status: PayrollStatus;
}

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  isActive: boolean;
  avatarUrl?: string;
  createdAt: string;
}

export interface LeaveTypeConfig {
  id: string;
  name: string;
  isActive: boolean;
}

export interface AppSettings {
  workingDaysPerMonth: number;
}

export interface HospitalLicense {
  id: string;
  name: string;
  category: string;
  issuingAuthority?: string;
  licenseNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  status: "Valid" | "Expiring" | "Expired" | "N/A";
  filePath?: string;
  fileSize?: string;
  addressed: boolean;
  uploadedBy?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
