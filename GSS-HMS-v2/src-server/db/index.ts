import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Use __dirname to resolve data directory relative to the bundle location
// In dev: src-server/db/ → ../../data
// In prod (esbuild bundle dist-server/index.cjs): dist-server/ → ../data
const __filename_esm = typeof __filename !== "undefined" ? __filename : fileURLToPath(import.meta.url);
const __dirname_esm = typeof __dirname !== "undefined" ? __dirname : path.dirname(__filename_esm);
const DATA_DIR = path.resolve(__dirname_esm, "..", "data");
const DB_PATH = path.join(DATA_DIR, "gss-hms.db");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const sqlite = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance (LAN access)
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export { sqlite };
export const db = drizzle(sqlite, { schema });

export function closeDatabase() {
  sqlite.close();
}

/** Delete all user/operational data from every table (keeps app_settings) */
export function clearAllData() {
  sqlite.pragma("foreign_keys = OFF");
  const tables = [
    "certifications", "kpis", "attendance_records", "leave_requests",
    "payroll_records", "doctor_schedules", "performance_evaluations",
    "patient_documents", "medicine_administrations",
    "staff", "users", "patients", "tokens", "documents", "announcements",
    "inventory_items", "prescriptions", "billing_records", "lab_tests",
    "leave_types",
  ];
  for (const table of tables) {
    sqlite.exec(`DELETE FROM ${table}`);
  }
  sqlite.pragma("foreign_keys = ON");
  console.log("🗑️  All data cleared");
}

/** Create all tables if they don't exist (self-initializing for standalone app) */
export function setupDatabase() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      last_login TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS staff (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      department TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      joining_date TEXT NOT NULL,
      salary_type TEXT NOT NULL,
      base_salary REAL NOT NULL,
      avatar TEXT,
      nursing_classification TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS certifications (
      id TEXT PRIMARY KEY,
      staff_id TEXT NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      expiry_date TEXT NOT NULL,
      status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS kpis (
      id TEXT PRIMARY KEY,
      staff_id TEXT NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      value INTEGER NOT NULL,
      target INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      gender TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT,
      blood_group TEXT,
      emergency_contact TEXT,
      insurance_id TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS lab_tests (
      id TEXT PRIMARY KEY,
      patient_name TEXT NOT NULL,
      test_name TEXT NOT NULL,
      category TEXT NOT NULL,
      priority TEXT NOT NULL,
      status TEXT NOT NULL,
      result TEXT,
      ordered_by TEXT NOT NULL,
      ordered_date TEXT NOT NULL,
      completed_date TEXT,
      is_active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS tokens (
      id TEXT PRIMARY KEY,
      token_number INTEGER NOT NULL,
      patient_name TEXT NOT NULL,
      doctor_name TEXT NOT NULL,
      department TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      uploaded_by TEXT NOT NULL,
      upload_date TEXT NOT NULL,
      expiry_date TEXT,
      file_size TEXT NOT NULL,
      file_path TEXT,
      is_active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      type TEXT NOT NULL,
      posted_by TEXT NOT NULL,
      posted_date TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      penalty_config TEXT
    );

    CREATE TABLE IF NOT EXISTS attendance_records (
      id TEXT PRIMARY KEY,
      staff_id TEXT NOT NULL REFERENCES staff(id),
      staff_name TEXT NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL,
      check_in TEXT,
      check_out TEXT
    );

    CREATE TABLE IF NOT EXISTS leave_requests (
      id TEXT PRIMARY KEY,
      staff_id TEXT NOT NULL REFERENCES staff(id),
      staff_name TEXT NOT NULL,
      type TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL,
      applied_date TEXT NOT NULL,
      approved_by TEXT
    );

    CREATE TABLE IF NOT EXISTS payroll_records (
      id TEXT PRIMARY KEY,
      staff_id TEXT NOT NULL REFERENCES staff(id),
      staff_name TEXT NOT NULL,
      month TEXT NOT NULL,
      year TEXT,
      base_salary REAL NOT NULL,
      basic_salary REAL,
      ta REAL DEFAULT 0,
      conveyance REAL DEFAULT 0,
      pf REAL DEFAULT 0,
      tds REAL DEFAULT 0,
      hra REAL DEFAULT 0,
      deductions REAL NOT NULL DEFAULT 0,
      bonus REAL NOT NULL DEFAULT 0,
      net_salary REAL NOT NULL,
      status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS performance_evaluations (
      id TEXT PRIMARY KEY,
      staff_id TEXT NOT NULL REFERENCES staff(id),
      staff_name TEXT NOT NULL,
      evaluator_id TEXT,
      evaluation_date TEXT NOT NULL,
      responsible INTEGER NOT NULL,
      engaged INTEGER NOT NULL,
      self_starter INTEGER NOT NULL,
      team_player INTEGER NOT NULL,
      challenged INTEGER NOT NULL,
      employee_oriented INTEGER NOT NULL,
      overall_score REAL NOT NULL,
      comments TEXT,
      period TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS inventory_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      asset_type TEXT NOT NULL DEFAULT 'Fixed',
      quantity INTEGER NOT NULL DEFAULT 0,
      assigned_qty INTEGER NOT NULL DEFAULT 0,
      disposable_qty INTEGER NOT NULL DEFAULT 0,
      unit TEXT NOT NULL DEFAULT 'pcs',
      min_stock INTEGER NOT NULL DEFAULT 0,
      max_stock INTEGER NOT NULL DEFAULT 100,
      location TEXT,
      supplier TEXT,
      unit_cost REAL NOT NULL DEFAULT 0,
      last_restocked TEXT,
      expiry_date TEXT,
      warranty_expiry TEXT,
      purchase_date TEXT,
      damage_status TEXT,
      disposal_status TEXT,
      disposal_type TEXT,
      disposal_date TEXT,
      photo_evidence TEXT,
      bill_reference TEXT,
      warranty_doc TEXT,
      status TEXT NOT NULL DEFAULT 'InStock'
    );

    CREATE TABLE IF NOT EXISTS doctor_schedules (
      id TEXT PRIMARY KEY,
      doctor_id TEXT NOT NULL REFERENCES staff(id),
      doctor_name TEXT NOT NULL,
      department TEXT NOT NULL,
      day_of_week TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      max_patients INTEGER NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS prescriptions (
      id TEXT PRIMARY KEY,
      patient_name TEXT NOT NULL,
      doctor_name TEXT NOT NULL,
      medicine_name TEXT NOT NULL,
      dosage TEXT NOT NULL,
      frequency TEXT NOT NULL,
      duration TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      status TEXT NOT NULL,
      notes TEXT,
      prescribed_date TEXT NOT NULL,
      dispensed_date TEXT,
      dispensed_by TEXT
    );

    CREATE TABLE IF NOT EXISTS billing_records (
      id TEXT PRIMARY KEY,
      patient_name TEXT NOT NULL,
      invoice_number TEXT NOT NULL,
      items TEXT NOT NULL,
      subtotal REAL NOT NULL,
      discount REAL NOT NULL DEFAULT 0,
      tax REAL NOT NULL DEFAULT 0,
      total_amount REAL NOT NULL,
      paid_amount REAL NOT NULL DEFAULT 0,
      payment_method TEXT,
      status TEXT NOT NULL DEFAULT 'Unpaid',
      created_date TEXT NOT NULL DEFAULT '',
      paid_date TEXT,
      created_by TEXT NOT NULL DEFAULT 'system',
      is_active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS medicine_administrations (
      id TEXT PRIMARY KEY,
      prescription_id TEXT REFERENCES prescriptions(id),
      patient_name TEXT NOT NULL,
      doctor_name TEXT NOT NULL,
      prescribed_medicine TEXT NOT NULL,
      prescribed_dosage TEXT NOT NULL,
      administered_medicine TEXT NOT NULL,
      administered_dosage TEXT NOT NULL,
      administered_by TEXT NOT NULL,
      administered_by_role TEXT NOT NULL,
      administered_date TEXT NOT NULL,
      has_discrepancy INTEGER NOT NULL DEFAULT 0,
      discrepancy_notes TEXT,
      status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS patient_documents (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL REFERENCES patients(id),
      doc_type TEXT NOT NULL,
      file_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      file_data TEXT NOT NULL,
      uploaded_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS leave_types (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // ── Auto-migration: add missing columns to older databases ──
  const addColumnIfMissing = (table: string, column: string, def: string) => {
    const cols = sqlite.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
    if (!cols.some(c => c.name === column)) {
      sqlite.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${def}`);
    }
  };

  // Inventory columns added post-Phase 3
  const invCols: [string, string][] = [
    ["asset_type", "TEXT NOT NULL DEFAULT 'Fixed'"],
    ["assigned_qty", "INTEGER NOT NULL DEFAULT 0"],
    ["disposable_qty", "INTEGER NOT NULL DEFAULT 0"],
    ["warranty_expiry", "TEXT"],
    ["purchase_date", "TEXT"],
    ["damage_status", "TEXT"],
    ["disposal_status", "TEXT"],
    ["disposal_type", "TEXT"],
    ["disposal_date", "TEXT"],
    ["photo_evidence", "TEXT"],
    ["bill_reference", "TEXT"],
    ["warranty_doc", "TEXT"],
  ];
  for (const [col, def] of invCols) {
    addColumnIfMissing("inventory_items", col, def);
  }

  // Soft-delete columns for tables that previously lacked is_active
  const softDeleteTables = ["patients", "lab_tests", "documents", "billing_records"];
  for (const table of softDeleteTables) {
    addColumnIfMissing(table, "is_active", "INTEGER NOT NULL DEFAULT 1");
  }

  // Staff columns added for HR enhancements
  const staffHrCols: [string, string][] = [
    ["appointment_date", "TEXT"],
    ["ctc_annual", "REAL"],
    ["category", "TEXT"],
    ["residential_address", "TEXT"],
    ["aadhaar_doc_path", "TEXT"],
    ["photo_path", "TEXT"],
    ["termination_date", "TEXT"],
    ["shift_interval", "TEXT"],
  ];
  for (const [col, def] of staffHrCols) {
    addColumnIfMissing("staff", col, def);
  }

  // Payroll breakdown columns
  const payrollCols: [string, string][] = [
    ["year", "TEXT"],
    ["basic_salary", "REAL"],
    ["ta", "REAL DEFAULT 0"],
    ["conveyance", "REAL DEFAULT 0"],
    ["pf", "REAL DEFAULT 0"],
    ["tds", "REAL DEFAULT 0"],
    ["hra", "REAL DEFAULT 0"],
    ["department", "TEXT"],
    ["epf_employer", "REAL DEFAULT 0"],
    ["other_allowance", "REAL DEFAULT 0"],
    ["gross_salary", "REAL DEFAULT 0"],
    ["professional_tax", "REAL DEFAULT 0"],
    ["epf_employee", "REAL DEFAULT 0"],
    ["leave_deductions", "REAL DEFAULT 0"],
    ["total_shifts", "INTEGER DEFAULT 0"],
    ["attended_shifts", "INTEGER DEFAULT 0"],
    ["leaves_taken", "INTEGER DEFAULT 0"],
    ["shift_rate", "REAL DEFAULT 0"],
  ];
  for (const [col, def] of payrollCols) {
    addColumnIfMissing("payroll_records", col, def);
  }

  // Users department column (for LEADER role)
  addColumnIfMissing("users", "department", "TEXT");

  // Seed default leave types if table is empty
  const leaveTypeCount = sqlite.prepare("SELECT COUNT(*) as cnt FROM leave_types").get() as { cnt: number };
  if (leaveTypeCount.cnt === 0) {
    const now = new Date().toISOString();
    sqlite.exec(`
      INSERT INTO leave_types (id, name, is_active, created_by, created_at) VALUES
        ('lt-casual', 'Casual Leave', 1, 'system', '${now}'),
        ('lt-sick', 'Sick Leave', 1, 'system', '${now}');
    `);
  }

  // Seed default settings if table is empty
  const settingsCount = sqlite.prepare("SELECT COUNT(*) as cnt FROM app_settings").get() as { cnt: number };
  if (settingsCount.cnt === 0) {
    const now = new Date().toISOString();
    sqlite.exec(`
      INSERT INTO app_settings (key, value, updated_at) VALUES
        ('workingDaysPerMonth', '26', '${now}');
    `);
  }

  // Auto-migrate old roles to new simplified roles
  const oldRoleMapping: Record<string, string> = {
    CEO: "ADMIN", COO: "ADMIN", CMO: "ADMIN",
    ACCOUNTANT: "ADMIN",
    METRON: "LEADER",
    DOCTOR: "STAFF", SR_NURSE: "STAFF", JR_NURSE: "STAFF",
    NURSE: "STAFF", RECEPTIONIST: "STAFF", TECHNICIAN: "STAFF",
    PHARMACIST: "STAFF",
  };
  for (const [oldRole, newRole] of Object.entries(oldRoleMapping)) {
    sqlite.exec(`UPDATE users SET role = '${newRole}' WHERE role = '${oldRole}'`);
  }

  console.log("✓ Database tables initialized");
}
