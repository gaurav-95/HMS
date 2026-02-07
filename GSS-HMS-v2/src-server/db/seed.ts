/**
 * Seed script — populates the database with initial demo data.
 * Run once: npx tsx src-server/db/seed.ts
 */
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { db } from "./index";
import { setupDatabase } from "./index";
import {
  users, staff, certifications, kpis, patients,
  labTests, tokens, documents, announcements,
  attendanceRecords, leaveRequests, payrollRecords,
  inventoryItems, doctorSchedules, prescriptions, billingRecords,
} from "./schema";

setupDatabase();

const hash = (pw: string) => bcrypt.hashSync(pw, 10);
const now = new Date().toISOString();
const uuid = () => randomUUID();

console.log("🌱 Seeding database...");

// ─── Users ──────────────────────────────────────────────────
const userRecords = [
  { id: uuid(), email: "admin@gsshospital.com", password: hash("password123"), name: "Admin", role: "SUPER_ADMIN", isActive: true, createdAt: now, updatedAt: now },
  { id: uuid(), email: "doctor@gsshospital.com", password: hash("password123"), name: "Dr. Anjali Sharma", role: "DOCTOR", isActive: true, createdAt: now, updatedAt: now },
  { id: uuid(), email: "tech@gsshospital.com", password: hash("password123"), name: "Lab Tech Priya", role: "TECHNICIAN", isActive: true, createdAt: now, updatedAt: now },
  { id: uuid(), email: "accountant@gsshospital.com", password: hash("password123"), name: "Ramesh Gupta", role: "ACCOUNTANT", isActive: true, createdAt: now, updatedAt: now },
  { id: uuid(), email: "metron@gsshospital.com", password: hash("password123"), name: "Metron Singh", role: "METRON", isActive: true, createdAt: now, updatedAt: now },
  { id: uuid(), email: "ceo@gsshospital.com", password: hash("password123"), name: "Vikram Patel", role: "CEO", isActive: true, createdAt: now, updatedAt: now },
  { id: uuid(), email: "receptionist@gsshospital.com", password: hash("password123"), name: "Neha Kapoor", role: "RECEPTIONIST", isActive: true, createdAt: now, updatedAt: now },
];

for (const u of userRecords) {
  db.insert(users).values(u).run();
}
console.log(`  ✓ ${userRecords.length} users`);

// ─── Staff ──────────────────────────────────────────────────
const staffIds = { anjali: uuid(), rajesh: uuid(), amit: uuid(), priya: uuid(), neha: uuid() };

const staffRecords = [
  { id: staffIds.anjali, userId: userRecords[1].id, name: "Dr. Anjali Sharma", role: "Doctor", department: "General Medicine", phone: "9876543210", email: "doctor@gsshospital.com", joiningDate: "2020-03-15", salaryType: "Monthly", baseSalary: 120000, isActive: true, createdAt: now, updatedAt: now },
  { id: staffIds.rajesh, name: "Rajesh Kumar", role: "Nurse", department: "Emergency", phone: "9876543211", email: "rajesh@gsshospital.com", joiningDate: "2021-06-01", salaryType: "Monthly", baseSalary: 45000, nursingClassification: "GNM", isActive: true, createdAt: now, updatedAt: now },
  { id: staffIds.amit, name: "Amit Verma", role: "Technician", department: "Laboratory", phone: "9876543212", email: "amit@gsshospital.com", joiningDate: "2022-01-10", salaryType: "Monthly", baseSalary: 35000, isActive: true, createdAt: now, updatedAt: now },
  { id: staffIds.priya, userId: userRecords[2].id, name: "Lab Tech Priya", role: "Lab Technician", department: "Laboratory", phone: "9876543213", email: "tech@gsshospital.com", joiningDate: "2021-09-01", salaryType: "Monthly", baseSalary: 38000, isActive: true, createdAt: now, updatedAt: now },
  { id: staffIds.neha, userId: userRecords[6].id, name: "Neha Kapoor", role: "Receptionist", department: "Front Desk", phone: "9876543214", email: "receptionist@gsshospital.com", joiningDate: "2023-02-15", salaryType: "Monthly", baseSalary: 30000, isActive: true, createdAt: now, updatedAt: now },
];

for (const s of staffRecords) {
  db.insert(staff).values(s).run();
}
console.log(`  ✓ ${staffRecords.length} staff`);

// ─── Certifications ─────────────────────────────────────────
const certRecords = [
  { id: uuid(), staffId: staffIds.anjali, name: "Medical License", expiryDate: "2026-03-15", status: "Valid" },
  { id: uuid(), staffId: staffIds.anjali, name: "BLS Certification", expiryDate: "2026-02-28", status: "Expiring" },
  { id: uuid(), staffId: staffIds.rajesh, name: "Nursing License", expiryDate: "2025-12-31", status: "Expired" },
  { id: uuid(), staffId: staffIds.rajesh, name: "ACLS Certification", expiryDate: "2026-06-30", status: "Valid" },
  { id: uuid(), staffId: staffIds.priya, name: "Lab Tech Certificate", expiryDate: "2027-01-01", status: "Valid" },
];

for (const c of certRecords) {
  db.insert(certifications).values(c).run();
}
console.log(`  ✓ ${certRecords.length} certifications`);

// ─── KPIs ───────────────────────────────────────────────────
const kpiRecords = [
  { id: uuid(), staffId: staffIds.anjali, name: "Patient Satisfaction", value: 92, target: 100 },
  { id: uuid(), staffId: staffIds.anjali, name: "Cases Handled", value: 145, target: 150 },
  { id: uuid(), staffId: staffIds.rajesh, name: "Attendance", value: 96, target: 100 },
  { id: uuid(), staffId: staffIds.rajesh, name: "Patient Care Score", value: 88, target: 100 },
  { id: uuid(), staffId: staffIds.amit, name: "Tests Completed", value: 320, target: 350 },
  { id: uuid(), staffId: staffIds.amit, name: "Accuracy Rate", value: 98, target: 100 },
];

for (const k of kpiRecords) {
  db.insert(kpis).values(k).run();
}
console.log(`  ✓ ${kpiRecords.length} KPIs`);

// ─── Patients ───────────────────────────────────────────────
const patientRecords = [
  { id: uuid(), name: "Suresh Mehta", age: 45, gender: "Male", phone: "9988776655", address: "12 MG Road, Mumbai", bloodGroup: "O+", createdAt: now, updatedAt: now },
  { id: uuid(), name: "Priya Desai", age: 32, gender: "Female", phone: "9988776656", address: "45 Park Street, Kolkata", bloodGroup: "B+", createdAt: now, updatedAt: now },
  { id: uuid(), name: "Ravi Shankar", age: 58, gender: "Male", phone: "9988776657", address: "78 Nehru Nagar, Delhi", bloodGroup: "A-", emergencyContact: "9988776600", createdAt: now, updatedAt: now },
  { id: uuid(), name: "Anita Kumari", age: 28, gender: "Female", phone: "9988776658", address: "23 Gandhi Bazaar, Bangalore", bloodGroup: "AB+", createdAt: now, updatedAt: now },
  { id: uuid(), name: "Mohd. Irfan", age: 65, gender: "Male", phone: "9988776659", address: "56 Civil Lines, Lucknow", bloodGroup: "O-", emergencyContact: "9988776601", createdAt: now, updatedAt: now },
];

for (const p of patientRecords) {
  db.insert(patients).values(p).run();
}
console.log(`  ✓ ${patientRecords.length} patients`);

// ─── Lab Tests ──────────────────────────────────────────────
const labRecords = [
  { id: uuid(), patientName: "Suresh Mehta", testName: "Complete Blood Count", category: "Hematology", priority: "Normal", status: "Completed", result: "Normal ranges", orderedBy: "Dr. Anjali Sharma", orderedDate: "2026-02-01", completedDate: "2026-02-02" },
  { id: uuid(), patientName: "Priya Desai", testName: "Thyroid Panel", category: "Biochemistry", priority: "Normal", status: "Completed", result: "TSH elevated", orderedBy: "Dr. Anjali Sharma", orderedDate: "2026-02-01", completedDate: "2026-02-03" },
  { id: uuid(), patientName: "Ravi Shankar", testName: "Liver Function Test", category: "Biochemistry", priority: "Urgent", status: "InProgress", orderedBy: "Dr. Anjali Sharma", orderedDate: "2026-02-05" },
  { id: uuid(), patientName: "Anita Kumari", testName: "Urine Routine", category: "Clinical Pathology", priority: "Normal", status: "Pending", orderedBy: "Dr. Anjali Sharma", orderedDate: "2026-02-06" },
  { id: uuid(), patientName: "Mohd. Irfan", testName: "ECG", category: "Cardiology", priority: "Urgent", status: "Pending", orderedBy: "Dr. Anjali Sharma", orderedDate: "2026-02-07" },
  { id: uuid(), patientName: "Suresh Mehta", testName: "Blood Glucose Fasting", category: "Biochemistry", priority: "Normal", status: "Completed", result: "126 mg/dL", orderedBy: "Dr. Anjali Sharma", orderedDate: "2026-02-01", completedDate: "2026-02-01" },
  { id: uuid(), patientName: "Ravi Shankar", testName: "Chest X-Ray", category: "Radiology", priority: "Normal", status: "InProgress", orderedBy: "Dr. Anjali Sharma", orderedDate: "2026-02-06" },
  { id: uuid(), patientName: "Priya Desai", testName: "Blood Culture", category: "Microbiology", priority: "Urgent", status: "Pending", orderedBy: "Dr. Anjali Sharma", orderedDate: "2026-02-07" },
];

for (const l of labRecords) {
  db.insert(labTests).values(l).run();
}
console.log(`  ✓ ${labRecords.length} lab tests`);

// ─── OPD Tokens ─────────────────────────────────────────────
const tokenRecords = [
  { id: uuid(), tokenNumber: 1, patientName: "Suresh Mehta", doctorName: "Dr. Anjali Sharma", department: "General Medicine", status: "Completed", createdAt: now },
  { id: uuid(), tokenNumber: 2, patientName: "Priya Desai", doctorName: "Dr. Anjali Sharma", department: "General Medicine", status: "InProgress", createdAt: now },
  { id: uuid(), tokenNumber: 3, patientName: "Ravi Shankar", doctorName: "Dr. Anjali Sharma", department: "General Medicine", status: "Waiting", createdAt: now },
  { id: uuid(), tokenNumber: 4, patientName: "Anita Kumari", doctorName: "Dr. Anjali Sharma", department: "General Medicine", status: "Waiting", createdAt: now },
];

for (const t of tokenRecords) {
  db.insert(tokens).values(t).run();
}
console.log(`  ✓ ${tokenRecords.length} OPD tokens`);

// ─── Documents ──────────────────────────────────────────────
const docRecords = [
  { id: uuid(), name: "Hospital License 2026", category: "License", uploadedBy: "Admin", uploadDate: "2026-01-15", expiryDate: "2027-01-15", fileSize: "2.4 MB" },
  { id: uuid(), name: "Fire Safety Certificate", category: "License", uploadedBy: "Admin", uploadDate: "2025-06-01", expiryDate: "2026-06-01", fileSize: "1.1 MB" },
  { id: uuid(), name: "Staff Handbook v3", category: "Policy", uploadedBy: "HR Dept", uploadDate: "2025-12-01", fileSize: "5.2 MB" },
  { id: uuid(), name: "NABH Accreditation", category: "License", uploadedBy: "Admin", uploadDate: "2024-03-01", expiryDate: "2026-03-01", fileSize: "3.8 MB" },
  { id: uuid(), name: "Waste Management Protocol", category: "Policy", uploadedBy: "COO Office", uploadDate: "2025-11-15", fileSize: "1.5 MB" },
];

for (const d of docRecords) {
  db.insert(documents).values(d).run();
}
console.log(`  ✓ ${docRecords.length} documents`);

// ─── Announcements ──────────────────────────────────────────
const announcementRecords = [
  {
    id: uuid(), title: "Annual Health Checkup Camp", content: "Free health checkup camp for all staff members on Feb 15, 2026. Please register at HR.", type: "General", postedBy: "Admin", postedDate: "2026-02-01", isActive: true,
  },
  {
    id: uuid(), title: "Attendance Penalty Policy", content: "Effective immediately: More than 3 unexcused absences per month will result in salary deduction.", type: "Penalty", postedBy: "COO Office", postedDate: "2026-01-20", isActive: true,
    penaltyConfig: JSON.stringify({ deductionPerAbsence: 500, maxAbsences: 3, applicableFrom: "2026-02-01" }),
  },
  {
    id: uuid(), title: "New OPD Timings", content: "OPD timings changed to 9:00 AM - 5:00 PM starting March 1.", type: "Policy", postedBy: "CMO Office", postedDate: "2026-02-05", isActive: true,
  },
];

for (const a of announcementRecords) {
  db.insert(announcements).values(a).run();
}
console.log(`  ✓ ${announcementRecords.length} announcements`);

// ─── Attendance ─────────────────────────────────────────────
const attendanceDate = "2026-02-07";
const attRecords = [
  { id: uuid(), staffId: staffIds.anjali, staffName: "Dr. Anjali Sharma", date: attendanceDate, status: "Present", checkIn: "08:45", checkOut: "17:15" },
  { id: uuid(), staffId: staffIds.rajesh, staffName: "Rajesh Kumar", date: attendanceDate, status: "Present", checkIn: "06:55", checkOut: "15:05" },
  { id: uuid(), staffId: staffIds.amit, staffName: "Amit Verma", date: attendanceDate, status: "Absent" },
  { id: uuid(), staffId: staffIds.priya, staffName: "Lab Tech Priya", date: attendanceDate, status: "Present", checkIn: "08:50", checkOut: "17:00" },
  { id: uuid(), staffId: staffIds.neha, staffName: "Neha Kapoor", date: attendanceDate, status: "Late", checkIn: "09:35", checkOut: "17:30" },
];

for (const a of attRecords) {
  db.insert(attendanceRecords).values(a).run();
}
console.log(`  ✓ ${attRecords.length} attendance records`);

// ─── Leave Requests ─────────────────────────────────────────
const leaveRecords = [
  { id: uuid(), staffId: staffIds.rajesh, staffName: "Rajesh Kumar", type: "Sick", startDate: "2026-02-10", endDate: "2026-02-11", reason: "Fever", status: "Pending", appliedDate: "2026-02-06" },
  { id: uuid(), staffId: staffIds.anjali, staffName: "Dr. Anjali Sharma", type: "Casual", startDate: "2026-02-15", endDate: "2026-02-15", reason: "Personal work", status: "Approved", appliedDate: "2026-02-01", approvedBy: "CEO" },
  { id: uuid(), staffId: staffIds.amit, staffName: "Amit Verma", type: "Earned", startDate: "2026-02-20", endDate: "2026-02-22", reason: "Family function", status: "Pending", appliedDate: "2026-02-05" },
];

for (const l of leaveRecords) {
  db.insert(leaveRequests).values(l).run();
}
console.log(`  ✓ ${leaveRecords.length} leave requests`);

// ─── Payroll ────────────────────────────────────────────────
const payrollMonth = "2026-02";
const payRecords = [
  { id: uuid(), staffId: staffIds.anjali, staffName: "Dr. Anjali Sharma", month: payrollMonth, baseSalary: 120000, deductions: 14400, bonus: 0, netSalary: 105600, status: "Processed" },
  { id: uuid(), staffId: staffIds.rajesh, staffName: "Rajesh Kumar", month: payrollMonth, baseSalary: 45000, deductions: 5400, bonus: 2000, netSalary: 41600, status: "Draft" },
  { id: uuid(), staffId: staffIds.amit, staffName: "Amit Verma", month: payrollMonth, baseSalary: 35000, deductions: 4200, bonus: 0, netSalary: 30800, status: "Draft" },
  { id: uuid(), staffId: staffIds.priya, staffName: "Lab Tech Priya", month: payrollMonth, baseSalary: 38000, deductions: 4560, bonus: 1000, netSalary: 34440, status: "Draft" },
  { id: uuid(), staffId: staffIds.neha, staffName: "Neha Kapoor", month: payrollMonth, baseSalary: 30000, deductions: 3600, bonus: 0, netSalary: 26400, status: "Draft" },
];

for (const p of payRecords) {
  db.insert(payrollRecords).values(p).run();
}
console.log(`  ✓ ${payRecords.length} payroll records`);

// ─── Inventory ──────────────────────────────────────────────
const invRecords = [
  { id: uuid(), name: "Paracetamol 500mg", category: "Medicine", quantity: 500, unit: "Tablets", minStock: 100, maxStock: 1000, supplier: "Sun Pharma", lastRestocked: "2026-01-20", expiryDate: "2027-06-01", status: "InStock" },
  { id: uuid(), name: "Surgical Gloves (M)", category: "Consumable", quantity: 45, unit: "Boxes", minStock: 50, maxStock: 200, supplier: "MedSupply Co", lastRestocked: "2026-01-10", status: "LowStock" },
  { id: uuid(), name: "IV Saline 500ml", category: "Medicine", quantity: 200, unit: "Bottles", minStock: 50, maxStock: 500, supplier: "Baxter India", lastRestocked: "2026-02-01", expiryDate: "2027-12-01", status: "InStock" },
  { id: uuid(), name: "Syringe 5ml", category: "Consumable", quantity: 0, unit: "Boxes", minStock: 30, maxStock: 150, supplier: "BD Medical", status: "OutOfStock" },
  { id: uuid(), name: "Amoxicillin 250mg", category: "Medicine", quantity: 300, unit: "Capsules", minStock: 100, maxStock: 800, supplier: "Cipla", lastRestocked: "2026-01-25", expiryDate: "2025-12-01", status: "Expired" },
  { id: uuid(), name: "Oxygen Cylinder (B-Type)", category: "Equipment", quantity: 8, unit: "Units", minStock: 5, maxStock: 20, supplier: "Linde Gas", lastRestocked: "2026-01-15", status: "InStock" },
  { id: uuid(), name: "Blood Pressure Monitor", category: "Equipment", quantity: 12, unit: "Units", minStock: 5, maxStock: 25, supplier: "Omron Healthcare", lastRestocked: "2025-11-01", status: "InStock" },
  { id: uuid(), name: "Cotton Roll 500g", category: "Consumable", quantity: 60, unit: "Rolls", minStock: 20, maxStock: 100, supplier: "MedSupply Co", lastRestocked: "2026-01-28", status: "InStock" },
];

for (const i of invRecords) {
  db.insert(inventoryItems).values(i).run();
}
console.log(`  ✓ ${invRecords.length} inventory items`);

// ─── Doctor Schedules ───────────────────────────────────────
const schedRecords = [
  { id: uuid(), doctorId: staffIds.anjali, doctorName: "Dr. Anjali Sharma", department: "General Medicine", dayOfWeek: "Monday", startTime: "09:00", endTime: "17:00", maxPatients: 30, isActive: true },
  { id: uuid(), doctorId: staffIds.anjali, doctorName: "Dr. Anjali Sharma", department: "General Medicine", dayOfWeek: "Wednesday", startTime: "09:00", endTime: "17:00", maxPatients: 30, isActive: true },
  { id: uuid(), doctorId: staffIds.anjali, doctorName: "Dr. Anjali Sharma", department: "General Medicine", dayOfWeek: "Friday", startTime: "09:00", endTime: "13:00", maxPatients: 15, isActive: true },
];

for (const s of schedRecords) {
  db.insert(doctorSchedules).values(s).run();
}
console.log(`  ✓ ${schedRecords.length} doctor schedules`);

// ─── Prescriptions ──────────────────────────────────────────
const rxRecords = [
  { id: uuid(), patientName: "Ramesh Singh", doctorName: "Dr. Anjali Sharma", medicineName: "Paracetamol 500mg", dosage: "500mg", frequency: "TDS", duration: "5 days", quantity: 15, status: "Dispensed", notes: "After food", prescribedDate: "2025-01-10", dispensedDate: "2025-01-10", dispensedBy: "Pharmacy" },
  { id: uuid(), patientName: "Sunita Devi", doctorName: "Dr. Anjali Sharma", medicineName: "Amoxicillin 250mg", dosage: "250mg", frequency: "BD", duration: "7 days", quantity: 14, status: "Pending", prescribedDate: "2025-01-15" },
  { id: uuid(), patientName: "Manoj Kumar", doctorName: "Dr. Anjali Sharma", medicineName: "Omeprazole 20mg", dosage: "20mg", frequency: "OD", duration: "14 days", quantity: 14, status: "Pending", notes: "Before breakfast", prescribedDate: "2025-01-15" },
  { id: uuid(), patientName: "Priya Sharma", doctorName: "Dr. Anjali Sharma", medicineName: "Metformin 500mg", dosage: "500mg", frequency: "BD", duration: "30 days", quantity: 60, status: "Dispensed", prescribedDate: "2025-01-05", dispensedDate: "2025-01-05", dispensedBy: "Pharmacy" },
  { id: uuid(), patientName: "Anil Gupta", doctorName: "Dr. Anjali Sharma", medicineName: "Azithromycin 500mg", dosage: "500mg", frequency: "OD", duration: "3 days", quantity: 3, status: "Pending", prescribedDate: "2025-01-16" },
];

for (const rx of rxRecords) {
  db.insert(prescriptions).values(rx).run();
}
console.log(`  ✓ ${rxRecords.length} prescriptions`);

// ─── Billing Records ────────────────────────────────────────
const billRecords = [
  { id: uuid(), patientName: "Ramesh Singh", invoiceNumber: "INV-00001", items: JSON.stringify([{ description: "OPD Consultation", amount: 200 }, { description: "Blood Test", amount: 500 }]), subtotal: 700, discount: 0, tax: 126, totalAmount: 826, paidAmount: 826, paymentMethod: "Cash", status: "Paid", createdDate: "2025-01-10", paidDate: "2025-01-10", createdBy: "Admin" },
  { id: uuid(), patientName: "Sunita Devi", invoiceNumber: "INV-00002", items: JSON.stringify([{ description: "OPD Consultation", amount: 200 }, { description: "X-Ray", amount: 800 }, { description: "Medicines", amount: 350 }]), subtotal: 1350, discount: 100, tax: 225, totalAmount: 1475, paidAmount: 0, paymentMethod: "UPI", status: "Unpaid", createdDate: "2025-01-15", createdBy: "Admin" },
  { id: uuid(), patientName: "Manoj Kumar", invoiceNumber: "INV-00003", items: JSON.stringify([{ description: "OPD Consultation", amount: 200 }]), subtotal: 200, discount: 0, tax: 36, totalAmount: 236, paidAmount: 236, paymentMethod: "UPI", status: "Paid", createdDate: "2025-01-12", paidDate: "2025-01-12", createdBy: "Admin" },
  { id: uuid(), patientName: "Priya Sharma", invoiceNumber: "INV-00004", items: JSON.stringify([{ description: "OPD Consultation", amount: 200 }, { description: "ECG Test", amount: 600 }, { description: "Medicines", amount: 450 }]), subtotal: 1250, discount: 0, tax: 225, totalAmount: 1475, paidAmount: 500, paymentMethod: "Card", status: "Partial", createdDate: "2025-01-08", createdBy: "Admin" },
];

for (const b of billRecords) {
  db.insert(billingRecords).values(b).run();
}
console.log(`  ✓ ${billRecords.length} billing records`);

console.log("\n✅ Database seeded successfully!\n");
console.log("Demo credentials (all use password: password123):");
console.log("  Super Admin : admin@gsshospital.com");
console.log("  Doctor      : doctor@gsshospital.com");
console.log("  Technician  : tech@gsshospital.com");
console.log("  Accountant  : accountant@gsshospital.com");
console.log("  Metron      : metron@gsshospital.com");
console.log("  CEO         : ceo@gsshospital.com");
console.log("  Receptionist: receptionist@gsshospital.com");
