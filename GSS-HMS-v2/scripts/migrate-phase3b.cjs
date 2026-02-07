const Database = require("better-sqlite3");
const path = require("path");

const dbPath = process.argv[2] || "data/gss-hms.db";
console.log("Phase 3.2 Migration — Using DB:", path.resolve(dbPath));

const db = new Database(dbPath);

// ─── New columns for inventory_items ─────────────────────
const existingCols = db.prepare("PRAGMA table_info(inventory_items)").all().map(c => c.name);
const newInventoryCols = [
  { name: "asset_type", def: "TEXT DEFAULT 'Recurring'" },
  { name: "assigned_qty", def: "INTEGER DEFAULT 0" },
  { name: "disposable_qty", def: "INTEGER DEFAULT 0" },
  { name: "warranty_expiry", def: "TEXT" },
  { name: "purchase_date", def: "TEXT" },
  { name: "damage_status", def: "TEXT" },
  { name: "disposal_status", def: "TEXT" },
  { name: "disposal_type", def: "TEXT" },
  { name: "disposal_date", def: "TEXT" },
  { name: "photo_evidence", def: "TEXT" },
  { name: "bill_reference", def: "TEXT" },
  { name: "warranty_doc", def: "TEXT" },
];
newInventoryCols.forEach(({ name, def }) => {
  if (!existingCols.includes(name)) {
    db.exec(`ALTER TABLE inventory_items ADD COLUMN ${name} ${def}`);
    console.log(`  + inventory_items.${name}`);
  } else {
    console.log(`  ~ inventory_items.${name} already exists`);
  }
});

// ─── Medicine Administrations table ──────────────────────
db.exec(`CREATE TABLE IF NOT EXISTS medicine_administrations (
  id TEXT PRIMARY KEY,
  prescription_id TEXT,
  patient_name TEXT NOT NULL,
  doctor_name TEXT NOT NULL,
  prescribed_medicine TEXT NOT NULL,
  prescribed_dosage TEXT,
  administered_medicine TEXT NOT NULL,
  administered_dosage TEXT,
  administered_by TEXT NOT NULL,
  administered_by_role TEXT,
  administered_date TEXT NOT NULL,
  has_discrepancy INTEGER DEFAULT 0,
  discrepancy_notes TEXT,
  status TEXT NOT NULL DEFAULT 'Administered',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
)`);
console.log("  ✓ medicine_administrations table");

// ─── Doctor Reviews table ────────────────────────────────
db.exec(`CREATE TABLE IF NOT EXISTS doctor_reviews (
  id TEXT PRIMARY KEY,
  doctor_id TEXT NOT NULL,
  doctor_name TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 5,
  efficacy_score INTEGER DEFAULT 0,
  cost_score INTEGER DEFAULT 0,
  review_text TEXT,
  diagnosis TEXT,
  treatment_cost REAL DEFAULT 0,
  review_date TEXT NOT NULL,
  is_resolved INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
)`);
console.log("  ✓ doctor_reviews table");

// ─── Seed medicine administrations ───────────────────────
const insertMA = db.prepare(`INSERT OR IGNORE INTO medicine_administrations (id, prescription_id, patient_name, doctor_name, prescribed_medicine, prescribed_dosage, administered_medicine, administered_dosage, administered_by, administered_by_role, administered_date, has_discrepancy, discrepancy_notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
const maData = [
  ["ma-001", "rx-001", "Ramesh Kumar", "Dr. Anand Sharma", "Paracetamol 500mg", "500mg", "Paracetamol 500mg", "500mg", "Sr. Nurse Priya", "Senior Nurse", "2026-01-15", 0, null, "Administered"],
  ["ma-002", "rx-002", "Sita Devi", "Dr. Meera Patel", "Amoxicillin 250mg", "250mg", "Amoxicillin 500mg", "500mg", "Jr. Nurse Kavita", "Junior Nurse", "2026-01-20", 1, "Dosage mismatch: 500mg given instead of 250mg", "Flagged"],
  ["ma-003", "rx-003", "Mohan Lal", "Dr. Anand Sharma", "Omeprazole 20mg", "20mg", "Omeprazole 20mg", "20mg", "Sr. Nurse Priya", "Senior Nurse", "2026-01-22", 0, null, "Administered"],
  ["ma-004", "rx-004", "Geeta Rani", "Dr. Meera Patel", "Cetirizine 10mg", "10mg", "Levocetirizine 5mg", "5mg", "Jr. Nurse Kavita", "Junior Nurse", "2026-01-18", 1, "Different medicine given: Levocetirizine instead of Cetirizine", "Flagged"],
  ["ma-005", "rx-005", "Vijay Singh", "Dr. Anand Sharma", "Metformin 500mg", "500mg", "Metformin 500mg", "500mg", "Sr. Nurse Priya", "Senior Nurse", "2026-01-25", 0, null, "Administered"],
];
maData.forEach(r => insertMA.run(...r));
console.log("  ✓", maData.length, "medicine administrations (2 flagged discrepancies)");

// ─── Seed doctor reviews ─────────────────────────────────
const insertDR = db.prepare(`INSERT OR IGNORE INTO doctor_reviews (id, doctor_id, doctor_name, patient_name, rating, efficacy_score, cost_score, review_text, diagnosis, treatment_cost, review_date, is_resolved) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
const drData = [
  ["dr-001", "staff-001", "Dr. Anand Sharma", "Ramesh Kumar", 5, 9, 7, "Excellent diagnosis and treatment. Very affordable.", "Viral Fever", 1500, "2026-01-16", 0],
  ["dr-002", "staff-001", "Dr. Anand Sharma", "Mohan Lal", 4, 8, 6, "Good treatment but slightly expensive.", "Gastric Issues", 2500, "2026-01-23", 0],
  ["dr-003", "staff-001", "Dr. Anand Sharma", "Vijay Singh", 5, 9, 8, "Best doctor for diabetes management. Cost-effective.", "Type-2 Diabetes", 1200, "2026-01-26", 0],
  ["dr-004", "staff-002", "Dr. Meera Patel", "Sita Devi", 4, 7, 5, "Good treatment but could improve on cost.", "Throat Infection", 3200, "2026-01-21", 0],
  ["dr-005", "staff-002", "Dr. Meera Patel", "Geeta Rani", 3, 6, 4, "Treatment took longer than expected. Expensive.", "Allergic Reaction", 4500, "2026-01-19", 0],
  ["dr-006", "staff-003", "Dr. Rajesh Gupta", "Arjun Mishra", 5, 10, 9, "Outstanding orthopedic surgeon. Minimal cost.", "Knee Pain", 800, "2026-01-10", 0],
  ["dr-007", "staff-003", "Dr. Rajesh Gupta", "Lakshmi Nair", 4, 8, 7, "Very knowledgeable. Reasonable fees.", "Back Pain", 1800, "2026-01-14", 0],
];
drData.forEach(r => insertDR.run(...r));
console.log("  ✓", drData.length, "doctor reviews (3 doctors)");

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log("\nAll tables:", tables.map(t => t.name).join(", "));
console.log("✅ Phase 3.2 migration complete!");
db.close();
