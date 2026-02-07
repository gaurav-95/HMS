const Database = require("better-sqlite3");
const path = require("path");

// Accept DB path as argument, or default
const dbPath = process.argv[2] || "data/gss-hms.db";
console.log("Using DB:", path.resolve(dbPath));

const db = new Database(dbPath);

db.exec(`CREATE TABLE IF NOT EXISTS prescriptions (
  id TEXT PRIMARY KEY,
  patient_name TEXT NOT NULL,
  doctor_name TEXT NOT NULL,
  medicine_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  duration TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'Pending',
  notes TEXT,
  prescribed_date TEXT NOT NULL,
  dispensed_date TEXT,
  dispensed_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
)`);

db.exec(`CREATE TABLE IF NOT EXISTS billing_records (
  id TEXT PRIMARY KEY,
  patient_name TEXT NOT NULL,
  invoice_number TEXT NOT NULL UNIQUE,
  items TEXT NOT NULL,
  subtotal REAL NOT NULL DEFAULT 0,
  discount REAL NOT NULL DEFAULT 0,
  tax REAL NOT NULL DEFAULT 0,
  total_amount REAL NOT NULL DEFAULT 0,
  paid_amount REAL NOT NULL DEFAULT 0,
  payment_method TEXT,
  status TEXT NOT NULL DEFAULT 'Unpaid',
  created_date TEXT NOT NULL,
  paid_date TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
)`);

console.log("Tables created.");

// Seed prescriptions
const insertRx = db.prepare(`INSERT OR IGNORE INTO prescriptions (id, patient_name, doctor_name, medicine_name, dosage, frequency, duration, quantity, status, notes, prescribed_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
const rxData = [
  ["rx-001", "Ramesh Kumar", "Dr. Anand Sharma", "Paracetamol 500mg", "500mg", "TDS", "5 days", 15, "Dispensed", "For fever", "2026-01-15"],
  ["rx-002", "Sita Devi", "Dr. Meera Patel", "Amoxicillin 250mg", "250mg", "BD", "7 days", 14, "Pending", "Throat infection", "2026-01-20"],
  ["rx-003", "Mohan Lal", "Dr. Anand Sharma", "Omeprazole 20mg", "20mg", "OD", "14 days", 14, "Pending", "Gastric issues", "2026-01-22"],
  ["rx-004", "Geeta Rani", "Dr. Meera Patel", "Cetirizine 10mg", "10mg", "OD", "10 days", 10, "Dispensed", "Allergy", "2026-01-18"],
  ["rx-005", "Vijay Singh", "Dr. Anand Sharma", "Metformin 500mg", "500mg", "BD", "30 days", 60, "Pending", "Diabetes management", "2026-01-25"],
];
rxData.forEach(r => insertRx.run(...r));
console.log("  ✓", rxData.length, "prescriptions");

// Seed billing
const insertBill = db.prepare(`INSERT OR IGNORE INTO billing_records (id, patient_name, invoice_number, items, subtotal, discount, tax, total_amount, paid_amount, payment_method, status, created_date, paid_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
const billData = [
  ["bill-001", "Ramesh Kumar", "INV-2026-001", JSON.stringify([{description:"OPD Consultation",amount:500},{description:"Blood Test",amount:800}]), 1300, 0, 234, 1534, 1534, "Cash", "Paid", "2026-01-15", "2026-01-15", "admin"],
  ["bill-002", "Sita Devi", "INV-2026-002", JSON.stringify([{description:"OPD Consultation",amount:500},{description:"X-Ray",amount:1200}]), 1700, 100, 288, 1888, 500, "UPI", "Partial", "2026-01-20", null, "admin"],
  ["bill-003", "Mohan Lal", "INV-2026-003", JSON.stringify([{description:"OPD Consultation",amount:500}]), 500, 0, 90, 590, 0, null, "Unpaid", "2026-01-22", null, "admin"],
  ["bill-004", "Geeta Rani", "INV-2026-004", JSON.stringify([{description:"OPD Consultation",amount:500},{description:"Medicine",amount:350}]), 850, 50, 144, 944, 944, "Card", "Paid", "2026-01-18", "2026-01-18", "admin"],
];
billData.forEach(r => insertBill.run(...r));
console.log("  ✓", billData.length, "billing records");

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log("\nAll tables:", tables.map(t => t.name).join(", "));
console.log("✅ Done!");
db.close();
