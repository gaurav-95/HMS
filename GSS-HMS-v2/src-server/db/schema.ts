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
});

// ─── KPIs ───────────────────────────────────────────────────
export const kpis = sqliteTable("kpis", {
  id: text("id").primaryKey(),
  staffId: text("staff_id").notNull().references(() => staff.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  value: integer("value").notNull(),
  target: integer("target").notNull(),
});

// ─── Patients ───────────────────────────────────────────────
export const patients = sqliteTable("patients", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  gender: text("gender").notNull(),
  phone: text("phone").notNull(),
  address: text("address"),
  bloodGroup: text("blood_group"),
  emergencyContact: text("emergency_contact"),
  insuranceId: text("insurance_id"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// ─── Lab Tests ──────────────────────────────────────────────
export const labTests = sqliteTable("lab_tests", {
  id: text("id").primaryKey(),
  patientName: text("patient_name").notNull(),
  testName: text("test_name").notNull(),
  category: text("category").notNull(),
  priority: text("priority").notNull(),
  status: text("status").notNull(),
  result: text("result"),
  orderedBy: text("ordered_by").notNull(),
  orderedDate: text("ordered_date").notNull(),
  completedDate: text("completed_date"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
});

// ─── OPD Tokens ─────────────────────────────────────────────
export const tokens = sqliteTable("tokens", {
  id: text("id").primaryKey(),
  tokenNumber: integer("token_number").notNull(),
  patientName: text("patient_name").notNull(),
  doctorName: text("doctor_name").notNull(),
  department: text("department").notNull(),
  status: text("status").notNull(),
  createdAt: text("created_at").notNull(),
});

// ─── Documents ──────────────────────────────────────────────
export const documents = sqliteTable("documents", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  uploadedBy: text("uploaded_by").notNull(),
  uploadDate: text("upload_date").notNull(),
  expiryDate: text("expiry_date"),
  fileSize: text("file_size").notNull(),
  filePath: text("file_path"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
});

// ─── Announcements ──────────────────────────────────────────
export const announcements = sqliteTable("announcements", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull(),      // General | Policy | Penalty | Urgent
  postedBy: text("posted_by").notNull(),
  postedDate: text("posted_date").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  penaltyConfig: text("penalty_config"), // JSON string
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

// ─── Performance Evaluations ────────────────────────────────
export const performanceEvaluations = sqliteTable("performance_evaluations", {
  id: text("id").primaryKey(),
  staffId: text("staff_id").notNull().references(() => staff.id),
  staffName: text("staff_name").notNull(),
  evaluatorId: text("evaluator_id"),
  evaluationDate: text("evaluation_date").notNull(),
  responsible: integer("responsible").notNull(),       // 1-5
  engaged: integer("engaged").notNull(),               // 1-5
  selfStarter: integer("self_starter").notNull(),      // 1-5
  teamPlayer: integer("team_player").notNull(),        // 1-5
  challenged: integer("challenged").notNull(),         // 1-5
  employeeOriented: integer("employee_oriented").notNull(), // 1-5
  overallScore: real("overall_score").notNull(),
  comments: text("comments"),
  period: text("period").notNull(),  // e.g. "Q1-2026", "2025-26"
});

// ─── Inventory ──────────────────────────────────────────────
export const inventoryItems = sqliteTable("inventory_items", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),          // Bed | Chair | Equipment | Nebulizer | Medicine | Linen | Consumable | Furniture
  assetType: text("asset_type").notNull().default("Fixed"), // Fixed | Recurring
  quantity: integer("quantity").notNull().default(0),
  assignedQty: integer("assigned_qty").notNull().default(0),
  disposableQty: integer("disposable_qty").notNull().default(0),
  unit: text("unit").notNull().default("pcs"),
  minStock: integer("min_stock").notNull().default(0),
  maxStock: integer("max_stock").notNull().default(100),
  location: text("location"),
  supplier: text("supplier"),
  unitCost: real("unit_cost").notNull().default(0),
  lastRestocked: text("last_restocked"),
  expiryDate: text("expiry_date"),
  warrantyExpiry: text("warranty_expiry"),
  purchaseDate: text("purchase_date"),
  damageStatus: text("damage_status"),           // null | Declared | Inspected | WriteOff
  disposalStatus: text("disposal_status"),       // null | PendingDisposal | Disposed
  disposalType: text("disposal_type"),           // null | Sell | Charitable
  disposalDate: text("disposal_date"),
  photoEvidence: text("photo_evidence"),         // file path / reference
  billReference: text("bill_reference"),         // bill path / reference
  warrantyDoc: text("warranty_doc"),             // warranty doc path / reference
  status: text("status").notNull().default("InStock"), // InStock | LowStock | OutOfStock | Expired | Damaged | Disposed
});

// ─── Doctor Schedules ───────────────────────────────────────
export const doctorSchedules = sqliteTable("doctor_schedules", {
  id: text("id").primaryKey(),
  doctorId: text("doctor_id").notNull().references(() => staff.id),
  doctorName: text("doctor_name").notNull(),
  department: text("department").notNull(),
  dayOfWeek: text("day_of_week").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  maxPatients: integer("max_patients").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
});

// ─── Pharmacy / Prescriptions ───────────────────────────────
export const prescriptions = sqliteTable("prescriptions", {
  id: text("id").primaryKey(),
  patientName: text("patient_name").notNull(),
  doctorName: text("doctor_name").notNull(),
  medicineName: text("medicine_name").notNull(),
  dosage: text("dosage").notNull(),
  frequency: text("frequency").notNull(), // OD, BD, TDS, QID, SOS
  duration: text("duration").notNull(),   // e.g. "5 days"
  quantity: integer("quantity").notNull(),
  status: text("status").notNull(),       // Pending | Dispensed | Cancelled
  notes: text("notes"),
  prescribedDate: text("prescribed_date").notNull(),
  dispensedDate: text("dispensed_date"),
  dispensedBy: text("dispensed_by"),
});

// ─── Medicine Administration (Discrepancy Tracking) ─────────
export const medicineAdministrations = sqliteTable("medicine_administrations", {
  id: text("id").primaryKey(),
  prescriptionId: text("prescription_id").references(() => prescriptions.id),
  patientName: text("patient_name").notNull(),
  doctorName: text("doctor_name").notNull(),
  prescribedMedicine: text("prescribed_medicine").notNull(),
  prescribedDosage: text("prescribed_dosage").notNull(),
  administeredMedicine: text("administered_medicine").notNull(),
  administeredDosage: text("administered_dosage").notNull(),
  administeredBy: text("administered_by").notNull(), // nurse name
  administeredByRole: text("administered_by_role").notNull(), // SR_NURSE / JR_NURSE
  administeredDate: text("administered_date").notNull(),
  hasDiscrepancy: integer("has_discrepancy", { mode: "boolean" }).notNull().default(false),
  discrepancyNotes: text("discrepancy_notes"),
  status: text("status").notNull(), // Administered | Flagged | Resolved
});

// ─── Billing ────────────────────────────────────────────────
export const billingRecords = sqliteTable("billing_records", {
  id: text("id").primaryKey(),
  patientName: text("patient_name").notNull(),
  invoiceNumber: text("invoice_number").notNull(),
  items: text("items").notNull(),         // JSON string: [{description, amount}]
  subtotal: real("subtotal").notNull(),
  discount: real("discount").notNull().default(0),
  tax: real("tax").notNull().default(0),
  totalAmount: real("total_amount").notNull(),
  paidAmount: real("paid_amount").notNull().default(0),
  paymentMethod: text("payment_method"),  // Cash | Card | UPI | Insurance
  status: text("status").notNull().default("Unpaid"),       // Unpaid | Partial | Paid | Refunded
  createdDate: text("created_date").notNull().default(""),
  paidDate: text("paid_date"),
  createdBy: text("created_by").notNull().default("system"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
});

// ─── Patient Documents ─────────────────────────────────────
export const patientDocuments = sqliteTable("patient_documents", {
  id: text("id").primaryKey(),
  patientId: text("patient_id").notNull().references(() => patients.id),
  docType: text("doc_type").notNull(), // Aadhar | PAN | Insurance | Prescription | Report | Other
  fileName: text("file_name").notNull(),
  mimeType: text("mime_type").notNull(),
  fileData: text("file_data").notNull(), // base64-encoded
  uploadedAt: text("uploaded_at").notNull(),
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
