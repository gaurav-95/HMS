import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// ─── Users (authentication) ─────────────────────────────────
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(), // SUPER_ADMIN | ADMIN | LEADER | STAFF
  department: text("department"), // for LEADER role — department they lead
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  lastLogin: text("last_login"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// ─── Staff (employee detail) ────────────────────────────────
export const staff = sqliteTable("staff", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  name: text("name").notNull(),
  role: text("role").notNull(),       // StaffRole
  department: text("department").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  joiningDate: text("joining_date").notNull(),
  appointmentDate: text("appointment_date"),
  salaryType: text("salary_type").notNull(),
  baseSalary: real("base_salary").notNull(),
  ctcAnnual: real("ctc_annual"),
  avatar: text("avatar"),
  nursingClassification: text("nursing_classification"),
  category: text("category"),           // Admin | Clinical | Receptionist | Nurse | Technical
  residentialAddress: text("residential_address"),
  aadhaarDocPath: text("aadhaar_doc_path"),
  photoPath: text("photo_path"),
  terminationDate: text("termination_date"),
  shiftInterval: text("shift_interval"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// ─── Certifications ─────────────────────────────────────────
export const certifications = sqliteTable("certifications", {
  id: text("id").primaryKey(),
  staffId: text("staff_id").notNull().references(() => staff.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  expiryDate: text("expiry_date").notNull(),
  status: text("status").notNull(), // Valid | Expiring | Expired
  addressed: integer("addressed", { mode: "boolean" }).notNull().default(false),
  filePath: text("file_path"),
  fileSize: text("file_size"),
});

// ─── KPIs ───────────────────────────────────────────────────
export const kpis = sqliteTable("kpis", {
  id: text("id").primaryKey(),
  staffId: text("staff_id").notNull().references(() => staff.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  value: integer("value").notNull(),
  target: integer("target").notNull(),
});

// ─── Hospital Licenses / Certificates ───────────────────────
export const hospitalLicenses = sqliteTable("hospital_licenses", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // Statutory | Clinical | Income Tax | Regulatory | Other
  issuingAuthority: text("issuing_authority"),
  licenseNumber: text("license_number"),
  issueDate: text("issue_date"),
  expiryDate: text("expiry_date"),
  status: text("status").notNull().default("Valid"), // Valid | Expiring | Expired
  filePath: text("file_path"),
  fileSize: text("file_size"),
  addressed: integer("addressed", { mode: "boolean" }).notNull().default(false),
  uploadedBy: text("uploaded_by"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// ─── Staff Documents ────────────────────────────────────────
export const staffDocuments = sqliteTable("staff_documents", {
  id: text("id").primaryKey(),
  staffId: text("staff_id").notNull().references(() => staff.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),        // stored filename on disk
  originalName: text("original_name").notNull(), // user's original filename
  category: text("category").notNull(),          // official | medical
  documentType: text("document_type").notNull(), // Aadhaar | PAN | Voter ID | Driving License | Passport | Degree | Registration | Experience | Other
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  uploadedAt: text("uploaded_at").notNull(),
});

// ─── Attendance ─────────────────────────────────────────────
export const attendanceRecords = sqliteTable("attendance_records", {
  id: text("id").primaryKey(),
  staffId: text("staff_id").notNull().references(() => staff.id),
  staffName: text("staff_name").notNull(),
  date: text("date").notNull(),
  status: text("status").notNull(), // Present | Absent | Late | HalfDay | OnLeave
  checkIn: text("check_in"),
  checkOut: text("check_out"),
});

// ─── Leave Requests ─────────────────────────────────────────
export const leaveRequests = sqliteTable("leave_requests", {
  id: text("id").primaryKey(),
  staffId: text("staff_id").notNull().references(() => staff.id),
  staffName: text("staff_name").notNull(),
  type: text("type").notNull(),     // Casual | Sick | Earned | Maternity | Paternity | Unpaid
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  reason: text("reason").notNull(),
  status: text("status").notNull(), // Pending | Approved | Rejected
  appliedDate: text("applied_date").notNull(),
  approvedBy: text("approved_by"),
});

// ─── Payroll ────────────────────────────────────────────────
export const payrollRecords = sqliteTable("payroll_records", {
  id: text("id").primaryKey(),
  staffId: text("staff_id").notNull().references(() => staff.id),
  staffName: text("staff_name").notNull(),
  department: text("department"),
  month: text("month").notNull(),
  year: text("year"),
  baseSalary: real("base_salary").notNull(),
  basicSalary: real("basic_salary"),
  hra: real("hra").default(0),
  epfEmployer: real("epf_employer").default(0),
  otherAllowance: real("other_allowance").default(0),
  grossSalary: real("gross_salary").default(0),
  professionalTax: real("professional_tax").default(0),
  epfEmployee: real("epf_employee").default(0),
  leaveDeductions: real("leave_deductions").default(0),
  totalShifts: integer("total_shifts").default(0),
  attendedShifts: integer("attended_shifts").default(0),
  leavesTaken: integer("leaves_taken").default(0),
  shiftRate: real("shift_rate").default(0),
  deductions: real("deductions").notNull().default(0),
  bonus: real("bonus").notNull().default(0),
  netSalary: real("net_salary").notNull(),
  status: text("status").notNull(), // Draft | Processed | Approved | Paid
});

// ─── Leave Types (configurable by Super Admin) ──────────────
export const leaveTypes = sqliteTable("leave_types", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull(),
});

// ─── App Settings (key-value) ───────────────────────────────
export const appSettings = sqliteTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull(),
});
