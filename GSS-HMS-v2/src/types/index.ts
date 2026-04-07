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

export type LeaveType = "Casual" | "Sick" | "Earned" | "Maternity" | "Paternity" | "Unpaid";

export type LeaveStatus = "Pending" | "Approved" | "Rejected" | "Cancelled";

export type AttendanceStatus = "Present" | "Absent" | "Late" | "HalfDay" | "OnLeave";

export type PayrollStatus = "Draft" | "Processed" | "Approved" | "Paid";

export type TokenStatus = "Waiting" | "In-Progress" | "Completed" | "Cancelled";

export type InventoryCategory = "Bed" | "Chair" | "Equipment" | "Nebulizer" | "Other";

export type InventoryStatus = "Active" | "Damaged" | "Disposed";

export type DisposalType = "Sell" | "Charitable";

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
    "payroll:read",
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
  employeeCode: string;
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

export interface PerformanceEvaluation {
  id: string;
  staffId: string;
  staffName: string;
  evaluatorId?: string;
  evaluationDate: string;
  responsible: number;
  engaged: number;
  selfStarter: number;
  teamPlayer: number;
  challenged: number;
  employeeOriented: number;
  overallScore: number;
  comments?: string;
  period: string;
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
