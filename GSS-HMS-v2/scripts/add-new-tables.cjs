const Database = require("better-sqlite3");
const db = new Database("data/gss-hms.db");

db.exec(`CREATE TABLE IF NOT EXISTS prescriptions (
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
)`);

db.exec(`CREATE TABLE IF NOT EXISTS billing_records (
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
  status TEXT NOT NULL,
  created_date TEXT NOT NULL,
  paid_date TEXT,
  created_by TEXT NOT NULL
)`);

// Insert seed data
const crypto = require("crypto");
const uuid = () => crypto.randomUUID();

const rxRecords = [
  { patientName: "Ramesh Singh", doctorName: "Dr. Anjali Sharma", medicineName: "Paracetamol 500mg", dosage: "500mg", frequency: "TDS", duration: "5 days", quantity: 15, status: "Dispensed", notes: "After food", prescribedDate: "2025-01-10", dispensedDate: "2025-01-10", dispensedBy: "Pharmacy" },
  { patientName: "Sunita Devi", doctorName: "Dr. Anjali Sharma", medicineName: "Amoxicillin 250mg", dosage: "250mg", frequency: "BD", duration: "7 days", quantity: 14, status: "Pending", prescribedDate: "2025-01-15" },
  { patientName: "Manoj Kumar", doctorName: "Dr. Anjali Sharma", medicineName: "Omeprazole 20mg", dosage: "20mg", frequency: "OD", duration: "14 days", quantity: 14, status: "Pending", notes: "Before breakfast", prescribedDate: "2025-01-15" },
  { patientName: "Priya Sharma", doctorName: "Dr. Anjali Sharma", medicineName: "Metformin 500mg", dosage: "500mg", frequency: "BD", duration: "30 days", quantity: 60, status: "Dispensed", prescribedDate: "2025-01-05", dispensedDate: "2025-01-05", dispensedBy: "Pharmacy" },
  { patientName: "Anil Gupta", doctorName: "Dr. Anjali Sharma", medicineName: "Azithromycin 500mg", dosage: "500mg", frequency: "OD", duration: "3 days", quantity: 3, status: "Pending", prescribedDate: "2025-01-16" },
];

const insertRx = db.prepare(`INSERT OR IGNORE INTO prescriptions (id, patient_name, doctor_name, medicine_name, dosage, frequency, duration, quantity, status, notes, prescribed_date, dispensed_date, dispensed_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`);
for (const r of rxRecords) {
  insertRx.run(uuid(), r.patientName, r.doctorName, r.medicineName, r.dosage, r.frequency, r.duration, r.quantity, r.status, r.notes || null, r.prescribedDate, r.dispensedDate || null, r.dispensedBy || null);
}
console.log(`  ✓ ${rxRecords.length} prescriptions`);

const billRecords = [
  { patientName: "Ramesh Singh", invoiceNumber: "INV-00001", items: JSON.stringify([{description:"OPD Consultation",amount:200},{description:"Blood Test",amount:500}]), subtotal: 700, discount: 0, tax: 126, totalAmount: 826, paidAmount: 826, paymentMethod: "Cash", status: "Paid", createdDate: "2025-01-10", paidDate: "2025-01-10", createdBy: "Admin" },
  { patientName: "Sunita Devi", invoiceNumber: "INV-00002", items: JSON.stringify([{description:"OPD Consultation",amount:200},{description:"X-Ray",amount:800},{description:"Medicines",amount:350}]), subtotal: 1350, discount: 100, tax: 225, totalAmount: 1475, paidAmount: 0, paymentMethod: "UPI", status: "Unpaid", createdDate: "2025-01-15", paidDate: null, createdBy: "Admin" },
  { patientName: "Manoj Kumar", invoiceNumber: "INV-00003", items: JSON.stringify([{description:"OPD Consultation",amount:200}]), subtotal: 200, discount: 0, tax: 36, totalAmount: 236, paidAmount: 236, paymentMethod: "UPI", status: "Paid", createdDate: "2025-01-12", paidDate: "2025-01-12", createdBy: "Admin" },
  { patientName: "Priya Sharma", invoiceNumber: "INV-00004", items: JSON.stringify([{description:"OPD Consultation",amount:200},{description:"ECG Test",amount:600},{description:"Medicines",amount:450}]), subtotal: 1250, discount: 0, tax: 225, totalAmount: 1475, paidAmount: 500, paymentMethod: "Card", status: "Partial", createdDate: "2025-01-08", paidDate: null, createdBy: "Admin" },
];

const insertBill = db.prepare(`INSERT OR IGNORE INTO billing_records (id, patient_name, invoice_number, items, subtotal, discount, tax, total_amount, paid_amount, payment_method, status, created_date, paid_date, created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
for (const b of billRecords) {
  insertBill.run(uuid(), b.patientName, b.invoiceNumber, b.items, b.subtotal, b.discount, b.tax, b.totalAmount, b.paidAmount, b.paymentMethod, b.status, b.createdDate, b.paidDate, b.createdBy);
}
console.log(`  ✓ ${billRecords.length} billing records`);

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log("\nAll tables:", tables.map(t => t.name).join(", "));

db.close();
console.log("\n✅ New tables created and seeded!");
