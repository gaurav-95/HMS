/**
 * Seed script — populates the database with comprehensive demo data
 * covering every module/page of the GSS Hospital Management System.
 *
 * Run once:  npx tsx src-server/db/seed.ts
 * Or import { seedDemoData } from "./seed" to call programmatically.
 */
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { db, sqlite } from "./index";
import { setupDatabase } from "./index";
import {
  users, staff, certifications, kpis, patients,
  labTests, tokens, documents, announcements,
  attendanceRecords, leaveRequests, payrollRecords,
  inventoryItems, doctorSchedules, prescriptions, billingRecords,
  medicineAdministrations, leaveTypes, appSettings, hospitalLicenses,
} from "./schema";

/** Seed all demo data into an already-initialized database */
export function seedDemoData() {
  // Wrap entire seed in a single transaction — makes ~950 INSERTs near-instant
  // instead of each auto-committing (which triggers fsync per statement in SQLite).
  const _seedAll = sqlite.transaction(() => {

const hash = (pw: string) => bcrypt.hashSync(pw, 10);
const now = new Date().toISOString();
const uuid = () => randomUUID();

console.log("🌱 Seeding database...\n");

// ═══════════════════════════════════════════════════════════════
//  USERS  (6 accounts — 4 roles covered, 2 leaders for departments)
// ═══════════════════════════════════════════════════════════════
const userRecords = [
  { id: uuid(), email: "superadmin@gsshospital.com",   password: hash("password123"), name: "Rajesh Kumar",      role: "SUPER_ADMIN", department: null,               isActive: true, createdAt: now, updatedAt: now },
  { id: uuid(), email: "admin@gsshospital.com",        password: hash("password123"), name: "Priya Sharma",      role: "ADMIN",       department: null,               isActive: true, createdAt: now, updatedAt: now },
  { id: uuid(), email: "leader@gsshospital.com",       password: hash("password123"), name: "Dr. Anil Mehta",    role: "LEADER",      department: "General Medicine", isActive: true, createdAt: now, updatedAt: now },
  { id: uuid(), email: "staff@gsshospital.com",        password: hash("password123"), name: "Sita Devi",         role: "STAFF",       department: null,               isActive: true, createdAt: now, updatedAt: now },
  { id: uuid(), email: "leader2@gsshospital.com",      password: hash("password123"), name: "Dr. Sunita Rao",    role: "LEADER",      department: "Surgery",          isActive: true, createdAt: now, updatedAt: now },
  { id: uuid(), email: "staff2@gsshospital.com",       password: hash("password123"), name: "Ramesh Gupta",      role: "STAFF",       department: null,               isActive: true, createdAt: now, updatedAt: now },
];

for (const u of userRecords) db.insert(users).values(u).run();
console.log(`  ✓ ${userRecords.length} users`);

// ═══════════════════════════════════════════════════════════════
//  STAFF  (12 staff — 3 doctors, 3 nurses, pharmacist, 2 techs,
//          receptionist, security, accountant)
// ═══════════════════════════════════════════════════════════════
const S = {
  rajesh:  uuid(), priya:   uuid(), anil:    uuid(),
  sita:    uuid(), sunita:  uuid(), ramesh:  uuid(),
  kavita:  uuid(), deepak:  uuid(), amit:    uuid(),
  neha:    uuid(), mohan:   uuid(), vikram:  uuid(),
};

const staffRecords = [
  // ── Linked to user accounts ──
  { id: S.rajesh, userId: userRecords[0].id, name: "Rajesh Kumar",     role: "Administrative",  department: "Administration", phone: "9876543210", email: "superadmin@gsshospital.com", joiningDate: "2018-03-15", salaryType: "Monthly", baseSalary: 120000, isActive: true, createdAt: now, updatedAt: now },
  { id: S.priya,  userId: userRecords[1].id, name: "Priya Sharma",    role: "Administrative",  department: "Administration", phone: "9876543220", email: "admin@gsshospital.com",      joiningDate: "2019-07-01", salaryType: "Monthly", baseSalary: 100000, isActive: true, createdAt: now, updatedAt: now },
  { id: S.anil,   userId: userRecords[2].id, name: "Dr. Anil Mehta",  role: "Doctor",          department: "General Medicine", phone: "9876543221", email: "leader@gsshospital.com",   joiningDate: "2020-01-10", salaryType: "Monthly", baseSalary: 130000, isActive: true, createdAt: now, updatedAt: now },
  { id: S.sita,   userId: userRecords[3].id, name: "Sita Devi",       role: "Nurse",           department: "General Medicine", phone: "9876543211", email: "staff@gsshospital.com",    joiningDate: "2021-06-01", salaryType: "Monthly", baseSalary: 45000,  nursingClassification: "GNM", isActive: true, createdAt: now, updatedAt: now },
  { id: S.sunita, userId: userRecords[4].id, name: "Dr. Sunita Rao",  role: "Doctor",          department: "Surgery",         phone: "9876543222", email: "leader2@gsshospital.com",   joiningDate: "2019-04-01", salaryType: "Monthly", baseSalary: 135000, isActive: true, createdAt: now, updatedAt: now },
  { id: S.ramesh, userId: userRecords[5].id, name: "Ramesh Gupta",    role: "Technician",      department: "Laboratory",      phone: "9876543226", email: "staff2@gsshospital.com",    joiningDate: "2022-01-01", salaryType: "Monthly", baseSalary: 38000,  isActive: true, createdAt: now, updatedAt: now },
  // ── Staff without user accounts ──
  { id: S.kavita, name: "Kavita Nair",    role: "Nurse",       department: "Surgery",          phone: "9876543223", email: "kavita@gsshospital.com",    joiningDate: "2023-01-15", salaryType: "Monthly", baseSalary: 40000,  nursingClassification: "ANM", isActive: true, createdAt: now, updatedAt: now },
  { id: S.deepak, name: "Deepak Joshi",   role: "Pharmacist",  department: "Pharmacy",         phone: "9876543224", email: "deepak@gsshospital.com",    joiningDate: "2021-08-15", salaryType: "Monthly", baseSalary: 42000,  isActive: true, createdAt: now, updatedAt: now },
  { id: S.amit,   name: "Amit Verma",     role: "Technician",  department: "Laboratory",       phone: "9876543212", email: "amit@gsshospital.com",      joiningDate: "2022-01-10", salaryType: "Monthly", baseSalary: 35000,  isActive: true, createdAt: now, updatedAt: now },
  { id: S.neha,   name: "Neha Kapoor",    role: "Receptionist",department: "Front Desk",       phone: "9876543214", email: "neha@gsshospital.com",      joiningDate: "2023-02-15", salaryType: "Monthly", baseSalary: 30000,  isActive: true, createdAt: now, updatedAt: now },
  { id: S.mohan,  name: "Mohan Das",      role: "Security",    department: "Security",         phone: "9876543225", email: "mohan@gsshospital.com",     joiningDate: "2020-01-01", salaryType: "Monthly", baseSalary: 22000,  isActive: true, createdAt: now, updatedAt: now },
  { id: S.vikram, name: "Vikram Singh",   role: "Nurse",       department: "General Medicine", phone: "9876543227", email: "vikram@gsshospital.com",    joiningDate: "2022-03-01", salaryType: "Monthly", baseSalary: 48000,  nursingClassification: "BSc", isActive: true, createdAt: now, updatedAt: now },
];

for (const s of staffRecords) db.insert(staff).values(s).run();
console.log(`  ✓ ${staffRecords.length} staff`);

// ═══════════════════════════════════════════════════════════════
//  CERTIFICATIONS  (24 — mix of Valid, Expiring, Expired across all staff)
// ═══════════════════════════════════════════════════════════════
const certRecords = [
  // Doctors
  { id: uuid(), staffId: S.anil,   name: "MBBS Degree Certificate",          expiryDate: "2099-01-01", status: "Valid" },
  { id: uuid(), staffId: S.anil,   name: "BLS Certification",                expiryDate: "2026-05-20", status: "Expiring" },
  { id: uuid(), staffId: S.anil,   name: "ACLS Provider",                    expiryDate: "2027-03-01", status: "Valid" },
  { id: uuid(), staffId: S.anil,   name: "Pediatric Life Support (PALS)",    expiryDate: "2025-11-30", status: "Expired" },
  { id: uuid(), staffId: S.sunita, name: "MBBS + MS (Surgery) Degree",       expiryDate: "2099-01-01", status: "Valid" },
  { id: uuid(), staffId: S.sunita, name: "ATLS Certification",               expiryDate: "2026-06-01", status: "Valid" },
  { id: uuid(), staffId: S.sunita, name: "Laparoscopic Surgery Certificate", expiryDate: "2025-12-31", status: "Expired" },
  { id: uuid(), staffId: S.vikram, name: "BSc Nursing License",              expiryDate: "2026-12-31", status: "Valid" },
  { id: uuid(), staffId: S.vikram, name: "BLS Certification",                expiryDate: "2026-05-10", status: "Expiring" },
  // Nurses
  { id: uuid(), staffId: S.sita,   name: "GNM Nursing License",              expiryDate: "2025-12-31", status: "Expired" },
  { id: uuid(), staffId: S.sita,   name: "ACLS Certification",               expiryDate: "2026-06-30", status: "Valid" },
  { id: uuid(), staffId: S.sita,   name: "Infection Control Certificate",    expiryDate: "2026-04-30", status: "Expiring" },
  { id: uuid(), staffId: S.kavita, name: "BSc Nursing License",              expiryDate: "2027-02-28", status: "Valid" },
  { id: uuid(), staffId: S.kavita, name: "BLS Certification",                expiryDate: "2026-05-15", status: "Expiring" },
  { id: uuid(), staffId: S.kavita, name: "Wound Care Management",            expiryDate: "2027-08-01", status: "Valid" },
  // Technicians
  { id: uuid(), staffId: S.ramesh, name: "DMLT Certificate",                 expiryDate: "2028-01-01", status: "Valid" },
  { id: uuid(), staffId: S.ramesh, name: "Phlebotomy Certification",         expiryDate: "2026-04-30", status: "Expiring" },
  { id: uuid(), staffId: S.amit,   name: "BMLT Degree",                      expiryDate: "2028-06-01", status: "Valid" },
  { id: uuid(), staffId: S.amit,   name: "ECG Interpretation Certificate",   expiryDate: "2025-10-31", status: "Expired" },
  // Pharmacist
  { id: uuid(), staffId: S.deepak, name: "B.Pharm License",                  expiryDate: "2028-03-01", status: "Valid" },
  { id: uuid(), staffId: S.deepak, name: "Pharmacovigilance Certificate",    expiryDate: "2026-05-01", status: "Expiring" },
  // Admin / Receptionist
  { id: uuid(), staffId: S.rajesh, name: "Hospital Admin Certification",     expiryDate: "2027-06-01", status: "Valid" },
  { id: uuid(), staffId: S.priya,  name: "Medical Records Management",       expiryDate: "2026-06-15", status: "Valid" },
  { id: uuid(), staffId: S.neha,   name: "Front Desk Management Certificate",expiryDate: "2026-05-01", status: "Expiring" },
];

for (const c of certRecords) db.insert(certifications).values(c).run();
console.log(`  ✓ ${certRecords.length} certifications`);

// ═══════════════════════════════════════════════════════════════
//  KPIs  (12 — 2 per doctor + nurses + techs)
// ═══════════════════════════════════════════════════════════════
const kpiRecords = [
  { id: uuid(), staffId: S.anil,   name: "Patient Satisfaction", value: 92, target: 100 },
  { id: uuid(), staffId: S.anil,   name: "Cases Handled",       value: 145, target: 150 },
  { id: uuid(), staffId: S.sunita, name: "Patient Satisfaction", value: 85, target: 100 },
  { id: uuid(), staffId: S.sunita, name: "Surgeries Completed", value: 32,  target: 40  },
  { id: uuid(), staffId: S.priya,  name: "Patient Satisfaction", value: 97, target: 100 },
  { id: uuid(), staffId: S.priya,  name: "Cases Handled",       value: 120, target: 130 },
  { id: uuid(), staffId: S.sita,   name: "Attendance",           value: 96, target: 100 },
  { id: uuid(), staffId: S.sita,   name: "Patient Care Score",   value: 88, target: 100 },
  { id: uuid(), staffId: S.vikram, name: "Attendance",           value: 100, target: 100 },
  { id: uuid(), staffId: S.vikram, name: "Patient Care Score",   value: 94, target: 100 },
  { id: uuid(), staffId: S.amit,   name: "Tests Completed",      value: 320, target: 350 },
  { id: uuid(), staffId: S.amit,   name: "Accuracy Rate",        value: 98,  target: 100 },
];

for (const k of kpiRecords) db.insert(kpis).values(k).run();
console.log(`  ✓ ${kpiRecords.length} KPIs`);

// ═══════════════════════════════════════════════════════════════
//  PATIENTS  (10 — varied demographics, some with insurance)
// ═══════════════════════════════════════════════════════════════
const patientRecords = [
  { id: uuid(), name: "Suresh Mehta",    age: 45, gender: "Male",   phone: "9988776655", address: "12 MG Road, Mumbai",         bloodGroup: "O+",  emergencyContact: "9988776600", createdAt: now, updatedAt: now },
  { id: uuid(), name: "Priya Desai",     age: 32, gender: "Female", phone: "9988776656", address: "45 Park Street, Kolkata",    bloodGroup: "B+",  insuranceId: "STAR-MED-20251",   createdAt: now, updatedAt: now },
  { id: uuid(), name: "Ravi Shankar",    age: 58, gender: "Male",   phone: "9988776657", address: "78 Nehru Nagar, Delhi",      bloodGroup: "A-",  emergencyContact: "9988776601", createdAt: now, updatedAt: now },
  { id: uuid(), name: "Anita Kumari",    age: 28, gender: "Female", phone: "9988776658", address: "23 Gandhi Bazaar, Bangalore", bloodGroup: "AB+", createdAt: now, updatedAt: now },
  { id: uuid(), name: "Mohd. Irfan",     age: 65, gender: "Male",   phone: "9988776659", address: "56 Civil Lines, Lucknow",   bloodGroup: "O-",  emergencyContact: "9988776602", insuranceId: "NIVA-BUPA-30412", createdAt: now, updatedAt: now },
  { id: uuid(), name: "Lakshmi Reddy",   age: 40, gender: "Female", phone: "9988776660", address: "9 Tank Bund Road, Hyderabad", bloodGroup: "A+", insuranceId: "HDFC-ERGO-72810", createdAt: now, updatedAt: now },
  { id: uuid(), name: "Arun Gupta",      age: 52, gender: "Male",   phone: "9988776661", address: "34 Mall Road, Shimla",      bloodGroup: "B-",  createdAt: now, updatedAt: now },
  { id: uuid(), name: "Fatima Begum",    age: 35, gender: "Female", phone: "9988776662", address: "67 Charbagh, Lucknow",      bloodGroup: "O+",  emergencyContact: "9988776603", createdAt: now, updatedAt: now },
  { id: uuid(), name: "Dinesh Tiwari",   age: 72, gender: "Male",   phone: "9988776663", address: "11 Hazratganj, Lucknow",    bloodGroup: "AB-", emergencyContact: "9988776604", insuranceId: "ICICI-LOM-55120", createdAt: now, updatedAt: now },
  { id: uuid(), name: "Sneha Patil",     age: 24, gender: "Female", phone: "9988776664", address: "88 FC Road, Pune",          bloodGroup: "B+",  createdAt: now, updatedAt: now },
];

for (const p of patientRecords) db.insert(patients).values(p).run();
console.log(`  ✓ ${patientRecords.length} patients`);

// ═══════════════════════════════════════════════════════════════
//  LAB TESTS  (12 — multi-doctor, multi-category, all statuses)
// ═══════════════════════════════════════════════════════════════
const labRecords = [
  { id: uuid(), patientName: "Suresh Mehta",  testName: "Complete Blood Count",  category: "Hematology",         priority: "Normal", status: "Completed",  result: "Normal ranges",     orderedBy: "Dr. Anjali Sharma", orderedDate: "2026-02-01", completedDate: "2026-02-02" },
  { id: uuid(), patientName: "Priya Desai",   testName: "Thyroid Panel",         category: "Biochemistry",       priority: "Normal", status: "Completed",  result: "TSH elevated",      orderedBy: "Dr. Anjali Sharma", orderedDate: "2026-02-01", completedDate: "2026-02-03" },
  { id: uuid(), patientName: "Ravi Shankar",  testName: "Liver Function Test",   category: "Biochemistry",       priority: "Urgent", status: "InProgress", orderedBy: "Dr. Anjali Sharma", orderedDate: "2026-02-05" },
  { id: uuid(), patientName: "Anita Kumari",  testName: "Urine Routine",         category: "Clinical Pathology", priority: "Normal", status: "Pending",    orderedBy: "Dr. Meena Iyer",    orderedDate: "2026-02-06" },
  { id: uuid(), patientName: "Mohd. Irfan",   testName: "ECG",                   category: "Cardiology",         priority: "Urgent", status: "Pending",    orderedBy: "Dr. Anjali Sharma", orderedDate: "2026-02-07" },
  { id: uuid(), patientName: "Suresh Mehta",  testName: "Blood Glucose Fasting", category: "Biochemistry",       priority: "Normal", status: "Completed",  result: "126 mg/dL — Pre-diabetic", orderedBy: "Dr. Anjali Sharma", orderedDate: "2026-02-01", completedDate: "2026-02-01" },
  { id: uuid(), patientName: "Ravi Shankar",  testName: "Chest X-Ray",           category: "Radiology",          priority: "Normal", status: "InProgress", orderedBy: "Dr. Vikram Rao",    orderedDate: "2026-02-06" },
  { id: uuid(), patientName: "Priya Desai",   testName: "Blood Culture",         category: "Microbiology",       priority: "Urgent", status: "Pending",    orderedBy: "Dr. Anjali Sharma", orderedDate: "2026-02-07" },
  { id: uuid(), patientName: "Lakshmi Reddy", testName: "Lipid Profile",         category: "Biochemistry",       priority: "Normal", status: "Completed",  result: "LDL slightly high", orderedBy: "Dr. Vikram Rao", orderedDate: "2026-02-03", completedDate: "2026-02-04" },
  { id: uuid(), patientName: "Arun Gupta",    testName: "HbA1c",                 category: "Hematology",         priority: "Normal", status: "Completed",  result: "7.2% — Diabetic",   orderedBy: "Dr. Anjali Sharma", orderedDate: "2026-02-02", completedDate: "2026-02-03" },
  { id: uuid(), patientName: "Sneha Patil",   testName: "Vitamin D Level",       category: "Biochemistry",       priority: "Normal", status: "Pending",    orderedBy: "Dr. Meena Iyer",    orderedDate: "2026-02-07" },
  { id: uuid(), patientName: "Dinesh Tiwari", testName: "Kidney Function Test",  category: "Biochemistry",       priority: "Urgent", status: "InProgress", orderedBy: "Dr. Vikram Rao",    orderedDate: "2026-02-06" },
];

for (const l of labRecords) db.insert(labTests).values(l).run();
console.log(`  ✓ ${labRecords.length} lab tests`);

// ═══════════════════════════════════════════════════════════════
//  OPD TOKENS  (8 — multi-doctor, multi-department, all statuses)
// ═══════════════════════════════════════════════════════════════
const tokenRecords = [
  { id: uuid(), tokenNumber: 1, patientName: "Suresh Mehta",    doctorName: "Dr. Anjali Sharma", department: "General Medicine", status: "Completed",  createdAt: now },
  { id: uuid(), tokenNumber: 2, patientName: "Priya Desai",     doctorName: "Dr. Anjali Sharma", department: "General Medicine", status: "InProgress", createdAt: now },
  { id: uuid(), tokenNumber: 3, patientName: "Ravi Shankar",    doctorName: "Dr. Anjali Sharma", department: "General Medicine", status: "Waiting",    createdAt: now },
  { id: uuid(), tokenNumber: 4, patientName: "Anita Kumari",    doctorName: "Dr. Meena Iyer",    department: "Pediatrics",      status: "Waiting",    createdAt: now },
  { id: uuid(), tokenNumber: 1, patientName: "Arun Gupta",      doctorName: "Dr. Vikram Rao",    department: "Orthopedics",     status: "Completed",  createdAt: now },
  { id: uuid(), tokenNumber: 2, patientName: "Lakshmi Reddy",   doctorName: "Dr. Vikram Rao",    department: "Orthopedics",     status: "InProgress", createdAt: now },
  { id: uuid(), tokenNumber: 5, patientName: "Fatima Begum",    doctorName: "Dr. Meena Iyer",    department: "Pediatrics",      status: "Waiting",    createdAt: now },
  { id: uuid(), tokenNumber: 6, patientName: "Sneha Patil",     doctorName: "Dr. Anjali Sharma", department: "General Medicine", status: "Waiting",    createdAt: now },
];

for (const t of tokenRecords) db.insert(tokens).values(t).run();
console.log(`  ✓ ${tokenRecords.length} OPD tokens`);

// ═══════════════════════════════════════════════════════════════
//  DOCUMENTS  (8 — Licenses, Policies, Reports, Compliance)
// ═══════════════════════════════════════════════════════════════
const docRecords = [
  { id: uuid(), name: "Hospital License 2026",         category: "License",    uploadedBy: "Admin",      uploadDate: "2026-01-15", expiryDate: "2027-01-15", fileSize: "2.4 MB" },
  { id: uuid(), name: "Fire Safety Certificate",       category: "License",    uploadedBy: "Admin",      uploadDate: "2025-06-01", expiryDate: "2026-06-01", fileSize: "1.1 MB" },
  { id: uuid(), name: "Staff Handbook v3",             category: "Policy",     uploadedBy: "HR Dept",    uploadDate: "2025-12-01", fileSize: "5.2 MB" },
  { id: uuid(), name: "NABH Accreditation",            category: "License",    uploadedBy: "Admin",      uploadDate: "2024-03-01", expiryDate: "2026-03-01", fileSize: "3.8 MB" },
  { id: uuid(), name: "Waste Management Protocol",     category: "Policy",     uploadedBy: "COO Office", uploadDate: "2025-11-15", fileSize: "1.5 MB" },
  { id: uuid(), name: "Bio-Medical Waste Compliance",  category: "Compliance", uploadedBy: "Admin",      uploadDate: "2025-10-01", expiryDate: "2026-10-01", fileSize: "890 KB" },
  { id: uuid(), name: "Drug License",                  category: "License",    uploadedBy: "Pharmacy",   uploadDate: "2025-08-01", expiryDate: "2026-08-01", fileSize: "1.2 MB" },
  { id: uuid(), name: "Annual Audit Report 2025",      category: "Report",     uploadedBy: "Accounts",   uploadDate: "2026-01-31", fileSize: "8.7 MB" },
];

for (const d of docRecords) db.insert(documents).values(d).run();
console.log(`  ✓ ${docRecords.length} documents`);

// ═══════════════════════════════════════════════════════════════
//  ANNOUNCEMENTS  (5 — General, Penalty, Policy, Urgent)
//  NOTE: penaltyConfig keys must match dashboard parser:
//        absenceLimit, deductionAmount
// ═══════════════════════════════════════════════════════════════
const announcementRecords = [
  {
    id: uuid(), title: "Annual Health Checkup Camp",
    content: "Free health checkup camp for all staff members on Feb 15, 2026. Please register at HR.",
    type: "General", postedBy: "Admin", postedDate: "2026-02-01", isActive: true,
  },
  {
    id: uuid(), title: "Attendance Penalty Policy",
    content: "Effective immediately: More than 3 unexcused absences per month will result in ₹500 deduction per extra absence.",
    type: "Penalty", postedBy: "COO Office", postedDate: "2026-01-20", isActive: true,
    penaltyConfig: JSON.stringify({ absenceLimit: 3, deductionAmount: 500, applicableFrom: "2026-02-01" }),
  },
  {
    id: uuid(), title: "New OPD Timings",
    content: "OPD timings changed to 9:00 AM – 5:00 PM starting March 1. Saturday half-day: 9:00 AM – 1:00 PM.",
    type: "Policy", postedBy: "CMO Office", postedDate: "2026-02-05", isActive: true,
  },
  {
    id: uuid(), title: "⚠️ Water Supply Disruption",
    content: "Municipal water supply will be interrupted on Feb 10. Tanker water arranged as backup.",
    type: "Urgent", postedBy: "Admin", postedDate: "2026-02-07", isActive: true,
  },
  {
    id: uuid(), title: "Staff ID Card Renewal",
    content: "All staff must renew their ID cards before March 31, 2026. Visit the HR office with updated passport-size photo.",
    type: "General", postedBy: "HR Dept", postedDate: "2026-02-03", isActive: true,
  },
];

for (const a of announcementRecords) db.insert(announcements).values(a).run();
console.log(`  ✓ ${announcementRecords.length} announcements`);

// ═══════════════════════════════════════════════════════════════
//  ATTENDANCE  (Jan 1 – Apr 7, 2026 × 12 staff — comprehensive)
// ═══════════════════════════════════════════════════════════════
const allStaff = [
  { id: S.rajesh, name: "Rajesh Kumar" },
  { id: S.priya,  name: "Priya Sharma" },
  { id: S.anil,   name: "Dr. Anil Mehta" },
  { id: S.sita,   name: "Sita Devi" },
  { id: S.sunita, name: "Dr. Sunita Rao" },
  { id: S.ramesh, name: "Ramesh Gupta" },
  { id: S.kavita, name: "Kavita Nair" },
  { id: S.deepak, name: "Deepak Joshi" },
  { id: S.amit,   name: "Amit Verma" },
  { id: S.neha,   name: "Neha Kapoor" },
  { id: S.mohan,  name: "Mohan Das" },
  { id: S.vikram, name: "Vikram Singh" },
];

// Cyclic attendance patterns (10-element cycle) per staff for realism
const attPatterns: Record<string, string[]> = {
  [S.rajesh]: ["Present","Present","Present","Present","Present","Present","Present","Present","Absent","Present"],
  [S.priya]:  ["Present","Present","Present","Present","Present","Present","Present","Present","Present","Present"],
  [S.anil]:   ["Present","Present","Present","Present","Present","Present","Present","Late","Present","Present"],
  [S.sita]:   ["Present","Present","Present","HalfDay","Present","Present","Present","Present","OnLeave","Present"],
  [S.sunita]: ["Present","Present","Late","Present","Present","Absent","Present","Present","Present","Present"],
  [S.ramesh]: ["Present","Present","Present","Present","Absent","Present","Present","Present","Present","Late"],
  [S.kavita]: ["Present","Late","Present","Absent","Present","Present","Present","Absent","Present","Present"],
  [S.deepak]: ["Present","Present","Present","Present","Present","Present","Late","Present","Present","Present"],
  [S.amit]:   ["Absent","Present","Present","Present","Absent","Present","Present","Present","Absent","Present"],
  [S.neha]:   ["Present","Present","Late","Present","Present","Present","Present","Late","Present","Present"],
  [S.mohan]:  ["Present","Present","Present","Present","Present","Present","Present","Present","Present","Present"],
  [S.vikram]: ["Present","Present","Present","Present","Present","Present","Present","Present","Present","OnLeave"],
};

// Generate weekday dates from Jan 1 to Apr 7, 2026
function getWeekdays(startStr: string, endStr: string): string[] {
  const dates: string[] = [];
  const cur = new Date(startStr);
  const end = new Date(endStr);
  while (cur <= end) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) { // skip Sat/Sun
      dates.push(cur.toISOString().slice(0, 10));
    }
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

const attDates = getWeekdays("2026-01-01", "2026-04-07");

let attCount = 0;
for (const s of allStaff) {
  const pattern = attPatterns[s.id] || ["Present","Present","Present","Present","Present","Present","Present","Present","Present","Present"];
  for (let i = 0; i < attDates.length; i++) {
    const status = pattern[i % pattern.length];
    const checkIn = status === "Present" ? "08:45" : status === "Late" ? "09:35" : status === "HalfDay" ? "08:50" : undefined;
    const checkOut = status === "Present" ? "17:15" : status === "Late" ? "17:30" : status === "HalfDay" ? "13:00" : undefined;
    db.insert(attendanceRecords).values({
      id: uuid(), staffId: s.id, staffName: s.name, date: attDates[i], status, checkIn, checkOut,
    }).run();
    attCount++;
  }
}
console.log(`  ✓ ${attCount} attendance records (${attDates.length} weekdays × ${allStaff.length} staff)`);

// ═══════════════════════════════════════════════════════════════
//  LEAVE REQUESTS  (7 — all statuses + leave types)
// ═══════════════════════════════════════════════════════════════
const leaveRecords = [
  { id: uuid(), staffId: S.sita,   staffName: "Sita Devi",          type: "Sick Leave",   startDate: "2026-02-10", endDate: "2026-02-11", reason: "Fever",                  status: "Pending",  appliedDate: "2026-02-06" },
  { id: uuid(), staffId: S.anil,   staffName: "Dr. Anil Mehta",     type: "Casual Leave", startDate: "2026-02-15", endDate: "2026-02-15", reason: "Personal work",          status: "Approved", appliedDate: "2026-02-01", approvedBy: "Rajesh Kumar" },
  { id: uuid(), staffId: S.amit,   staffName: "Amit Verma",         type: "Casual Leave", startDate: "2026-02-20", endDate: "2026-02-22", reason: "Family function",        status: "Pending",  appliedDate: "2026-02-05" },
  { id: uuid(), staffId: S.kavita, staffName: "Kavita Nair",        type: "Sick Leave",   startDate: "2026-03-01", endDate: "2026-03-05", reason: "Surgery recovery",       status: "Approved", appliedDate: "2026-02-15", approvedBy: "Dr. Sunita Rao" },
  { id: uuid(), staffId: S.vikram, staffName: "Vikram Singh",       type: "Casual Leave", startDate: "2026-02-08", endDate: "2026-02-08", reason: "Doctor appointment",     status: "Rejected", appliedDate: "2026-02-06", approvedBy: "Dr. Anil Mehta" },
  { id: uuid(), staffId: S.deepak, staffName: "Deepak Joshi",       type: "Sick Leave",   startDate: "2026-01-25", endDate: "2026-01-26", reason: "Migraine",               status: "Approved", appliedDate: "2026-01-24", approvedBy: "Rajesh Kumar" },
  { id: uuid(), staffId: S.mohan,  staffName: "Mohan Das",          type: "Casual Leave", startDate: "2026-02-12", endDate: "2026-02-14", reason: "Village emergency",      status: "Pending",  appliedDate: "2026-02-07" },
];

for (const l of leaveRecords) db.insert(leaveRequests).values(l).run();
console.log(`  ✓ ${leaveRecords.length} leave requests`);

// ═══════════════════════════════════════════════════════════════
//  PAYROLL  (3 months × 12 staff = 36 records — trend data)
// ═══════════════════════════════════════════════════════════════
const payMonthsData = [
  { month: "December", year: "2025", statuses: ["Paid","Paid","Paid","Paid","Paid","Paid","Paid","Paid","Paid","Paid","Paid","Paid"] },
  { month: "January",  year: "2026", statuses: ["Paid","Paid","Paid","Paid","Paid","Paid","Paid","Paid","Paid","Paid","Paid","Paid"] },
  { month: "February", year: "2026", statuses: ["Processed","Processed","Draft","Draft","Draft","Draft","Draft","Draft","Draft","Draft","Draft","Draft"] },
];

const workingDays = 26;
let payCount = 0;
for (const pm of payMonthsData) {
  for (let i = 0; i < staffRecords.length; i++) {
    const s = staffRecords[i];
    const basicSalary = s.baseSalary;
    const hra = Math.round(basicSalary * 0.5);
    const epfEmployer = 1800;
    const otherAllowance = Math.round(basicSalary * 0.47);
    const grossSalary = basicSalary + hra + otherAllowance;
    const professionalTax = 200;
    const epfEmployee = 1800;
    const leaveDeductions = 0;
    const bonus = pm.month === "December" ? Math.round(basicSalary * 0.05) : 0;
    const netSalary = grossSalary - professionalTax - epfEmployee - leaveDeductions + bonus;
    db.insert(payrollRecords).values({
      id: uuid(),
      staffId: s.id,
      staffName: s.name,
      department: s.department,
      month: pm.month,
      year: pm.year,
      baseSalary: basicSalary,
      basicSalary,
      hra,
      epfEmployer,
      otherAllowance,
      grossSalary,
      professionalTax,
      epfEmployee,
      leaveDeductions,
      totalShifts: workingDays,
      attendedShifts: workingDays,
      leavesTaken: 0,
      shiftRate: Math.round(grossSalary / workingDays),
      deductions: professionalTax + epfEmployee,
      bonus,
      netSalary: Math.round(netSalary),
      status: pm.statuses[i],
    }).run();
    payCount++;
  }
}
console.log(`  ✓ ${payCount} payroll records (3 months)`);

// ═══════════════════════════════════════════════════════════════
//  INVENTORY  (14 items — full lifecycle: InStock, LowStock,
//  OutOfStock, Expired, Damaged, Disposed + all schema fields)
// ═══════════════════════════════════════════════════════════════
const invRecords = [
  // ── Medicines ──
  { id: uuid(), name: "Paracetamol 500mg",     category: "Medicine",   assetType: "Recurring", quantity: 500, unit: "Tablets",  minStock: 100, maxStock: 1000, location: "Pharmacy Store A", supplier: "Sun Pharma",    unitCost: 1.5,   lastRestocked: "2026-01-20", expiryDate: "2027-06-01", purchaseDate: "2026-01-20", billReference: "BILL-2026-0042", status: "InStock" },
  { id: uuid(), name: "Amoxicillin 250mg",     category: "Medicine",   assetType: "Recurring", quantity: 300, unit: "Capsules", minStock: 100, maxStock: 800,  location: "Pharmacy Store A", supplier: "Cipla",         unitCost: 3.2,   lastRestocked: "2026-01-25", expiryDate: "2025-12-01", purchaseDate: "2025-06-10", status: "Expired" },
  { id: uuid(), name: "IV Saline 500ml",       category: "Medicine",   assetType: "Recurring", quantity: 200, unit: "Bottles",  minStock: 50,  maxStock: 500,  location: "Ward Store",       supplier: "Baxter India",  unitCost: 42,    lastRestocked: "2026-02-01", expiryDate: "2027-12-01", purchaseDate: "2026-02-01", status: "InStock" },
  { id: uuid(), name: "Omeprazole 20mg",       category: "Medicine",   assetType: "Recurring", quantity: 80,  unit: "Strips",  minStock: 50,  maxStock: 300,  location: "Pharmacy Store B", supplier: "Dr. Reddy's",   unitCost: 12,    lastRestocked: "2026-01-18", expiryDate: "2027-03-01", purchaseDate: "2026-01-18", status: "InStock" },
  // ── Consumables ──
  { id: uuid(), name: "Surgical Gloves (M)",   category: "Consumable", assetType: "Recurring", quantity: 45,  unit: "Boxes",   minStock: 50,  maxStock: 200,  location: "OT Store",         supplier: "MedSupply Co",  unitCost: 180,   lastRestocked: "2026-01-10", status: "LowStock" },
  { id: uuid(), name: "Syringe 5ml",           category: "Consumable", assetType: "Recurring", quantity: 0,   unit: "Boxes",   minStock: 30,  maxStock: 150,  location: "Ward Store",       supplier: "BD Medical",    unitCost: 95,    status: "OutOfStock" },
  { id: uuid(), name: "Cotton Roll 500g",      category: "Consumable", assetType: "Recurring", quantity: 60,  unit: "Rolls",   minStock: 20,  maxStock: 100,  location: "Dressing Room",    supplier: "MedSupply Co",  unitCost: 120,   lastRestocked: "2026-01-28", status: "InStock" },
  // ── Equipment ──
  { id: uuid(), name: "Oxygen Cylinder (B-Type)", category: "Equipment", assetType: "Fixed", quantity: 8,  unit: "Units", minStock: 5, maxStock: 20, location: "Emergency Bay", supplier: "Linde Gas",        unitCost: 8500,  lastRestocked: "2026-01-15", purchaseDate: "2023-06-01", warrantyExpiry: "2026-06-01", warrantyDoc: "WD-OXY-2023", status: "InStock" },
  { id: uuid(), name: "Blood Pressure Monitor",   category: "Equipment", assetType: "Fixed", quantity: 12, unit: "Units", minStock: 5, maxStock: 25, location: "OPD Room 1",    supplier: "Omron Healthcare", unitCost: 2200,  lastRestocked: "2025-11-01", purchaseDate: "2024-01-15", warrantyExpiry: "2027-01-15", warrantyDoc: "WD-BPM-2024", status: "InStock" },
  { id: uuid(), name: "Pulse Oximeter",            category: "Equipment", assetType: "Fixed", quantity: 6,  unit: "Units", minStock: 3, maxStock: 15, location: "ICU",            supplier: "Masimo",           unitCost: 15000, purchaseDate: "2022-03-01", warrantyExpiry: "2025-03-01", status: "InStock" },
  // ── Bed / Linen ──
  { id: uuid(), name: "Hospital Bed (Manual)",     category: "Bed",   assetType: "Fixed", quantity: 30, assignedQty: 22, unit: "Units", minStock: 5,  maxStock: 50,  location: "Ward A & B",  supplier: "HospEquip Pvt", unitCost: 25000, purchaseDate: "2021-06-01", warrantyExpiry: "2026-06-01", status: "InStock" },
  { id: uuid(), name: "Bed Sheet (White)",         category: "Linen", assetType: "Recurring", quantity: 100, disposableQty: 15, unit: "Pcs", minStock: 30, maxStock: 200, location: "Laundry", supplier: "Linen House", unitCost: 350, lastRestocked: "2026-01-05", status: "InStock" },
  // ── Damaged / Disposed examples ──
  { id: uuid(), name: "Nebulizer (Portable)",      category: "Nebulizer", assetType: "Fixed", quantity: 1, unit: "Units", minStock: 2, maxStock: 10, location: "Pediatrics", supplier: "Philips", unitCost: 3500, purchaseDate: "2022-09-01", damageStatus: "Declared", photoEvidence: "DMG-NEB-001.jpg", status: "Damaged" },
  { id: uuid(), name: "Wheelchair (Old)",           category: "Furniture", assetType: "Fixed", quantity: 0, unit: "Units", minStock: 2, maxStock: 10, location: "Disposed",   supplier: "N/A",    unitCost: 6000, purchaseDate: "2018-01-01", disposalStatus: "Disposed", disposalType: "Charitable", disposalDate: "2025-12-15", status: "Disposed" },
];

for (const i of invRecords) db.insert(inventoryItems).values(i).run();
console.log(`  ✓ ${invRecords.length} inventory items`);

// ═══════════════════════════════════════════════════════════════
//  DOCTOR SCHEDULES  (9 — 3 doctors × 3 days each)
// ═══════════════════════════════════════════════════════════════
const schedRecords = [
  // Dr. Anil — Gen Med — Mon/Wed/Fri
  { id: uuid(), doctorId: S.anil,   doctorName: "Dr. Anil Mehta",    department: "General Medicine", dayOfWeek: "Monday",    startTime: "09:00", endTime: "17:00", maxPatients: 30, isActive: true },
  { id: uuid(), doctorId: S.anil,   doctorName: "Dr. Anil Mehta",    department: "General Medicine", dayOfWeek: "Wednesday", startTime: "09:00", endTime: "17:00", maxPatients: 30, isActive: true },
  { id: uuid(), doctorId: S.anil,   doctorName: "Dr. Anil Mehta",    department: "General Medicine", dayOfWeek: "Friday",    startTime: "09:00", endTime: "13:00", maxPatients: 15, isActive: true },
  // Dr. Sunita — Surgery — Tue/Thu/Sat
  { id: uuid(), doctorId: S.sunita, doctorName: "Dr. Sunita Rao",    department: "Surgery",         dayOfWeek: "Tuesday",   startTime: "10:00", endTime: "18:00", maxPatients: 25, isActive: true },
  { id: uuid(), doctorId: S.sunita, doctorName: "Dr. Sunita Rao",    department: "Surgery",         dayOfWeek: "Thursday",  startTime: "10:00", endTime: "18:00", maxPatients: 25, isActive: true },
  { id: uuid(), doctorId: S.sunita, doctorName: "Dr. Sunita Rao",    department: "Surgery",         dayOfWeek: "Saturday",  startTime: "10:00", endTime: "14:00", maxPatients: 15, isActive: true },
  // Dr. Anil (covering Pediatrics too) — Mon/Tue/Thu
  { id: uuid(), doctorId: S.anil,   doctorName: "Dr. Anil Mehta",    department: "General Medicine", dayOfWeek: "Tuesday",   startTime: "14:00", endTime: "17:00", maxPatients: 20, isActive: true },
  { id: uuid(), doctorId: S.anil,   doctorName: "Dr. Anil Mehta",    department: "General Medicine", dayOfWeek: "Thursday",  startTime: "14:00", endTime: "17:00", maxPatients: 20, isActive: true },
  { id: uuid(), doctorId: S.sunita, doctorName: "Dr. Sunita Rao",    department: "Surgery",         dayOfWeek: "Monday",    startTime: "09:00", endTime: "15:00", maxPatients: 20, isActive: true },
];

for (const s of schedRecords) db.insert(doctorSchedules).values(s).run();
console.log(`  ✓ ${schedRecords.length} doctor schedules`);

// ═══════════════════════════════════════════════════════════════
//  PRESCRIPTIONS  (10 — consistent patient names, all statuses,
//                  multiple doctors)
// ═══════════════════════════════════════════════════════════════
const rxIds = { rx1: uuid(), rx2: uuid(), rx3: uuid(), rx4: uuid(), rx5: uuid(), rx6: uuid(), rx7: uuid(), rx8: uuid(), rx9: uuid(), rx10: uuid() };
const rxRecords = [
  { id: rxIds.rx1,  patientName: "Suresh Mehta",   doctorName: "Dr. Anjali Sharma", medicineName: "Paracetamol 500mg",  dosage: "500mg",  frequency: "TDS", duration: "5 days",  quantity: 15, status: "Dispensed",  notes: "After food",        prescribedDate: "2026-02-01", dispensedDate: "2026-02-01", dispensedBy: "Deepak Joshi" },
  { id: rxIds.rx2,  patientName: "Priya Desai",    doctorName: "Dr. Anjali Sharma", medicineName: "Amoxicillin 250mg",  dosage: "250mg",  frequency: "BD",  duration: "7 days",  quantity: 14, status: "Pending",    prescribedDate: "2026-02-05" },
  { id: rxIds.rx3,  patientName: "Ravi Shankar",   doctorName: "Dr. Anjali Sharma", medicineName: "Omeprazole 20mg",    dosage: "20mg",   frequency: "OD",  duration: "14 days", quantity: 14, status: "Dispensed",  notes: "Before breakfast",  prescribedDate: "2026-02-03", dispensedDate: "2026-02-03", dispensedBy: "Deepak Joshi" },
  { id: rxIds.rx4,  patientName: "Anita Kumari",   doctorName: "Dr. Meena Iyer",    medicineName: "Paracetamol 500mg",  dosage: "250mg",  frequency: "BD",  duration: "3 days",  quantity: 6,  status: "Dispensed",  notes: "Pediatric dose",    prescribedDate: "2026-02-04", dispensedDate: "2026-02-04", dispensedBy: "Deepak Joshi" },
  { id: rxIds.rx5,  patientName: "Arun Gupta",     doctorName: "Dr. Anjali Sharma", medicineName: "Metformin 500mg",    dosage: "500mg",  frequency: "BD",  duration: "30 days", quantity: 60, status: "Dispensed",  prescribedDate: "2026-02-02", dispensedDate: "2026-02-02", dispensedBy: "Deepak Joshi" },
  { id: rxIds.rx6,  patientName: "Lakshmi Reddy",  doctorName: "Dr. Vikram Rao",    medicineName: "Diclofenac 50mg",    dosage: "50mg",   frequency: "BD",  duration: "5 days",  quantity: 10, status: "Pending",    notes: "After food, for knee pain", prescribedDate: "2026-02-06" },
  { id: rxIds.rx7,  patientName: "Fatima Begum",   doctorName: "Dr. Meena Iyer",    medicineName: "Azithromycin 500mg", dosage: "500mg",  frequency: "OD",  duration: "3 days",  quantity: 3,  status: "Pending",    prescribedDate: "2026-02-07" },
  { id: rxIds.rx8,  patientName: "Mohd. Irfan",    doctorName: "Dr. Anjali Sharma", medicineName: "Atorvastatin 10mg",  dosage: "10mg",   frequency: "OD",  duration: "30 days", quantity: 30, status: "Dispensed",  notes: "At bedtime",        prescribedDate: "2026-01-20", dispensedDate: "2026-01-20", dispensedBy: "Deepak Joshi" },
  { id: rxIds.rx9,  patientName: "Dinesh Tiwari",  doctorName: "Dr. Vikram Rao",    medicineName: "Calcium + Vit D3",   dosage: "1 tab",  frequency: "OD",  duration: "60 days", quantity: 60, status: "Pending",    prescribedDate: "2026-02-06" },
  { id: rxIds.rx10, patientName: "Sneha Patil",    doctorName: "Dr. Meena Iyer",    medicineName: "Cetirizine 10mg",    dosage: "10mg",   frequency: "OD",  duration: "7 days",  quantity: 7,  status: "Cancelled",  notes: "Patient allergic — switched", prescribedDate: "2026-02-05" },
];

for (const rx of rxRecords) db.insert(prescriptions).values(rx).run();
console.log(`  ✓ ${rxRecords.length} prescriptions`);

// ═══════════════════════════════════════════════════════════════
//  MEDICINE ADMINISTRATIONS  (8 — some with discrepancies)
// ═══════════════════════════════════════════════════════════════
const medAdminRecords = [
  // Normal administrations (no discrepancy)
  { id: uuid(), prescriptionId: rxIds.rx1, patientName: "Suresh Mehta",  doctorName: "Dr. Anjali Sharma", prescribedMedicine: "Paracetamol 500mg", prescribedDosage: "500mg", administeredMedicine: "Paracetamol 500mg", administeredDosage: "500mg", administeredBy: "Sunita Yadav", administeredByRole: "SR_NURSE", administeredDate: "2026-02-01T10:30:00Z", hasDiscrepancy: false, status: "Administered" },
  { id: uuid(), prescriptionId: rxIds.rx3, patientName: "Ravi Shankar",  doctorName: "Dr. Anjali Sharma", prescribedMedicine: "Omeprazole 20mg",  prescribedDosage: "20mg",  administeredMedicine: "Omeprazole 20mg",  administeredDosage: "20mg",  administeredBy: "Rajesh Kumar", administeredByRole: "JR_NURSE", administeredDate: "2026-02-03T08:00:00Z", hasDiscrepancy: false, status: "Administered" },
  { id: uuid(), prescriptionId: rxIds.rx5, patientName: "Arun Gupta",    doctorName: "Dr. Anjali Sharma", prescribedMedicine: "Metformin 500mg",  prescribedDosage: "500mg", administeredMedicine: "Metformin 500mg",  administeredDosage: "500mg", administeredBy: "Sunita Yadav", administeredByRole: "SR_NURSE", administeredDate: "2026-02-02T09:15:00Z", hasDiscrepancy: false, status: "Administered" },
  // ── Discrepancies — wrong dosage ──
  { id: uuid(), prescriptionId: rxIds.rx4, patientName: "Anita Kumari",  doctorName: "Dr. Meena Iyer",    prescribedMedicine: "Paracetamol 500mg", prescribedDosage: "250mg", administeredMedicine: "Paracetamol 500mg", administeredDosage: "500mg", administeredBy: "Kavita Nair",  administeredByRole: "JR_NURSE", administeredDate: "2026-02-04T11:00:00Z", hasDiscrepancy: true, discrepancyNotes: "Administered adult dose (500mg) instead of prescribed pediatric dose (250mg)", status: "Flagged" },
  // ── Discrepancy — wrong medicine ──
  { id: uuid(), prescriptionId: rxIds.rx8, patientName: "Mohd. Irfan",   doctorName: "Dr. Anjali Sharma", prescribedMedicine: "Atorvastatin 10mg", prescribedDosage: "10mg",  administeredMedicine: "Rosuvastatin 10mg", administeredDosage: "10mg",  administeredBy: "Rajesh Kumar", administeredByRole: "JR_NURSE", administeredDate: "2026-01-20T21:00:00Z", hasDiscrepancy: true, discrepancyNotes: "Administered Rosuvastatin instead of prescribed Atorvastatin — similar but different drug", status: "Flagged" },
  // ── Resolved discrepancy ──
  { id: uuid(), prescriptionId: rxIds.rx1, patientName: "Suresh Mehta",  doctorName: "Dr. Anjali Sharma", prescribedMedicine: "Paracetamol 500mg", prescribedDosage: "500mg", administeredMedicine: "Paracetamol 650mg", administeredDosage: "650mg", administeredBy: "Kavita Nair",  administeredByRole: "JR_NURSE", administeredDate: "2026-02-02T10:30:00Z", hasDiscrepancy: true, discrepancyNotes: "Gave 650mg instead of 500mg. Doctor reviewed — no harm, patient weight appropriate.", status: "Resolved" },
  // More normal ones
  { id: uuid(), prescriptionId: rxIds.rx1, patientName: "Suresh Mehta",  doctorName: "Dr. Anjali Sharma", prescribedMedicine: "Paracetamol 500mg", prescribedDosage: "500mg", administeredMedicine: "Paracetamol 500mg", administeredDosage: "500mg", administeredBy: "Sunita Yadav", administeredByRole: "SR_NURSE", administeredDate: "2026-02-03T10:30:00Z", hasDiscrepancy: false, status: "Administered" },
  { id: uuid(), prescriptionId: rxIds.rx5, patientName: "Arun Gupta",    doctorName: "Dr. Anjali Sharma", prescribedMedicine: "Metformin 500mg",  prescribedDosage: "500mg", administeredMedicine: "Metformin 500mg",  administeredDosage: "500mg", administeredBy: "Rajesh Kumar", administeredByRole: "JR_NURSE", administeredDate: "2026-02-03T09:15:00Z", hasDiscrepancy: false, status: "Administered" },
];

for (const ma of medAdminRecords) db.insert(medicineAdministrations).values(ma).run();
console.log(`  ✓ ${medAdminRecords.length} medicine administrations (${medAdminRecords.filter(m => m.hasDiscrepancy).length} discrepancies)`);

// ═══════════════════════════════════════════════════════════════
//  BILLING RECORDS  (8 — all statuses: Paid, Unpaid, Partial,
//                    Refunded; consistent patient names)
// ═══════════════════════════════════════════════════════════════
const billRecords = [
  { id: uuid(), patientName: "Suresh Mehta",  invoiceNumber: "INV-2026-001", items: JSON.stringify([{ description: "OPD Consultation", amount: 200 }, { description: "Blood Test (CBC)", amount: 500 }, { description: "Blood Glucose", amount: 300 }]), subtotal: 1000, discount: 0,   tax: 0, totalAmount: 1000, paidAmount: 1000, paymentMethod: "Cash", status: "Paid", createdDate: "2026-02-01", paidDate: "2026-02-01", createdBy: "Neha Kapoor" },
  { id: uuid(), patientName: "Priya Desai",   invoiceNumber: "INV-2026-002", items: JSON.stringify([{ description: "OPD Consultation", amount: 200 }, { description: "Thyroid Panel", amount: 800 }, { description: "Medicines", amount: 350 }]), subtotal: 1350, discount: 100, tax: 0, totalAmount: 1250, paidAmount: 0,    paymentMethod: "Insurance", status: "Unpaid", createdDate: "2026-02-03", createdBy: "Neha Kapoor" },
  { id: uuid(), patientName: "Ravi Shankar",  invoiceNumber: "INV-2026-003", items: JSON.stringify([{ description: "OPD Consultation", amount: 200 }, { description: "LFT", amount: 600 }, { description: "Chest X-Ray", amount: 400 }]), subtotal: 1200, discount: 0, tax: 0, totalAmount: 1200, paidAmount: 1200, paymentMethod: "UPI", status: "Paid", createdDate: "2026-02-05", paidDate: "2026-02-05", createdBy: "Neha Kapoor" },
  { id: uuid(), patientName: "Lakshmi Reddy", invoiceNumber: "INV-2026-004", items: JSON.stringify([{ description: "Ortho Consultation", amount: 300 }, { description: "Knee X-Ray", amount: 500 }, { description: "Medicines", amount: 450 }, { description: "Physiotherapy (3 sessions)", amount: 1500 }]), subtotal: 2750, discount: 250, tax: 0, totalAmount: 2500, paidAmount: 1000, paymentMethod: "Card", status: "Partial", createdDate: "2026-02-04", createdBy: "Neha Kapoor" },
  { id: uuid(), patientName: "Arun Gupta",    invoiceNumber: "INV-2026-005", items: JSON.stringify([{ description: "OPD Consultation", amount: 200 }, { description: "HbA1c Test", amount: 500 }, { description: "Medicines (Metformin)", amount: 180 }]), subtotal: 880, discount: 0, tax: 0, totalAmount: 880, paidAmount: 880, paymentMethod: "UPI", status: "Paid", createdDate: "2026-02-02", paidDate: "2026-02-02", createdBy: "Neha Kapoor" },
  { id: uuid(), patientName: "Mohd. Irfan",   invoiceNumber: "INV-2026-006", items: JSON.stringify([{ description: "OPD Consultation", amount: 200 }, { description: "ECG", amount: 600 }, { description: "Medicines", amount: 320 }]), subtotal: 1120, discount: 0, tax: 0, totalAmount: 1120, paidAmount: 0, paymentMethod: "Cash", status: "Unpaid", createdDate: "2026-02-07", createdBy: "Neha Kapoor" },
  { id: uuid(), patientName: "Dinesh Tiwari", invoiceNumber: "INV-2026-007", items: JSON.stringify([{ description: "Ortho Consultation", amount: 300 }, { description: "KFT", amount: 700 }, { description: "Calcium + Vit D3", amount: 250 }]), subtotal: 1250, discount: 0, tax: 0, totalAmount: 1250, paidAmount: 500, paymentMethod: "Cash", status: "Partial", createdDate: "2026-02-06", createdBy: "Ramesh Gupta" },
  { id: uuid(), patientName: "Sneha Patil",   invoiceNumber: "INV-2026-008", items: JSON.stringify([{ description: "Pediatric Consultation", amount: 200 }, { description: "Medicines (returned)", amount: 150 }]), subtotal: 350, discount: 0, tax: 0, totalAmount: 350, paidAmount: -350, paymentMethod: "UPI", status: "Refunded", createdDate: "2026-02-05", paidDate: "2026-02-06", createdBy: "Neha Kapoor" },
];

for (const b of billRecords) db.insert(billingRecords).values(b).run();
console.log(`  ✓ ${billRecords.length} billing records`);

// ═══════════════════════════════════════════════════════════════
//  LEAVE TYPES  (already seeded by setupDatabase, skip if present)
// ═══════════════════════════════════════════════════════════════
const existingTypes = db.select().from(leaveTypes).all();
if (existingTypes.length === 0) {
  const leaveTypeRecords = [
    { id: "lt-casual", name: "Casual Leave", isActive: true, createdBy: "system", createdAt: now },
    { id: "lt-sick",   name: "Sick Leave",   isActive: true, createdBy: "system", createdAt: now },
  ];
  for (const lt of leaveTypeRecords) db.insert(leaveTypes).values(lt).run();
  console.log(`  ✓ ${leaveTypeRecords.length} leave types`);
} else {
  console.log(`  ✓ ${existingTypes.length} leave types (already present)`);
}

// ═══════════════════════════════════════════════════════════════
//  HOSPITAL LICENSES  (12 — mix of Valid, Expiring, Expired)
// ═══════════════════════════════════════════════════════════════
const licenseRecords = [
  { id: uuid(), name: "NMC Hospital Registration",           category: "Statutory",     issuingAuthority: "National Medical Commission",                licenseNumber: "NMC/REG/WB/2024/001",   issueDate: "2024-01-01", expiryDate: "2027-01-01", status: "Valid",    addressed: false, uploadedBy: "Rajesh Kumar", isActive: true, createdAt: now, updatedAt: now },
  { id: uuid(), name: "PCPNDT Registration",                  category: "Regulatory",    issuingAuthority: "District Appropriate Authority",              licenseNumber: "PCPNDT/WB/2024/0234",   issueDate: "2024-03-01", expiryDate: "2026-05-15", status: "Expiring", addressed: false, uploadedBy: "Rajesh Kumar", isActive: true, createdAt: now, updatedAt: now },
  { id: uuid(), name: "Bio-Medical Waste Authorization",      category: "Statutory",     issuingAuthority: "West Bengal Pollution Control Board",         licenseNumber: "WBPCB/BMW/2023/4421",   issueDate: "2023-07-01", expiryDate: "2025-07-01", status: "Expired",  addressed: false, uploadedBy: "Priya Sharma",  isActive: true, createdAt: now, updatedAt: now },
  { id: uuid(), name: "Fire Safety NOC",                      category: "Regulatory",    issuingAuthority: "West Bengal Fire & Emergency Services",       licenseNumber: "WBFES/NOC/2024/1122",   issueDate: "2024-06-01", expiryDate: "2027-06-01", status: "Valid",    addressed: false, uploadedBy: "Priya Sharma",  isActive: true, createdAt: now, updatedAt: now },
  { id: uuid(), name: "GST Registration Certificate",         category: "Income Tax",    issuingAuthority: "GSTN",                                       licenseNumber: "19AACCS1234F1ZT",       issueDate: "2019-08-01", expiryDate: null,         status: "Valid",    addressed: false, uploadedBy: "Rajesh Kumar", isActive: true, createdAt: now, updatedAt: now },
  { id: uuid(), name: "Clinical Establishment Registration",  category: "Clinical",      issuingAuthority: "Directorate of Health Services, WB",         licenseNumber: "DHS/WB/CER/2024/5521",  issueDate: "2024-04-01", expiryDate: "2026-04-30", status: "Expiring", addressed: false, uploadedBy: "Priya Sharma",  isActive: true, createdAt: now, updatedAt: now },
  { id: uuid(), name: "Pharmacy License",                     category: "Pharmacy",      issuingAuthority: "West Bengal Pharmacy Council",               licenseNumber: "WBPC/LIC/2023/0892",    issueDate: "2023-09-01", expiryDate: "2027-09-01", status: "Valid",    addressed: false, uploadedBy: "Rajesh Kumar", isActive: true, createdAt: now, updatedAt: now },
  { id: uuid(), name: "Blood Bank License",                   category: "Clinical",      issuingAuthority: "Central Drugs Standard Control Organisation",licenseNumber: "CDSCO/BB/WB/2023/114",  issueDate: "2023-05-01", expiryDate: "2026-05-01", status: "Expiring", addressed: false, uploadedBy: "Priya Sharma",  isActive: true, createdAt: now, updatedAt: now },
  { id: uuid(), name: "Narcotics License (NDPS)",             category: "Regulatory",    issuingAuthority: "Narcotics Commissioner of India",             licenseNumber: "NDPS/WB/2024/0456",     issueDate: "2024-02-01", expiryDate: "2027-02-01", status: "Valid",    addressed: false, uploadedBy: "Rajesh Kumar", isActive: true, createdAt: now, updatedAt: now },
  { id: uuid(), name: "Lift Safety Certificate",              category: "Regulatory",    issuingAuthority: "West Bengal Inspectorate of Factories",       licenseNumber: "WBF/LIFT/2024/3301",    issueDate: "2024-08-01", expiryDate: "2025-08-01", status: "Expired",  addressed: false, uploadedBy: "Priya Sharma",  isActive: true, createdAt: now, updatedAt: now },
  { id: uuid(), name: "Income Tax Registration (80G)",        category: "Income Tax",    issuingAuthority: "Income Tax Department of India",              licenseNumber: "CIT/80G/WB/2020/0033",  issueDate: "2020-04-01", expiryDate: null,         status: "Valid",    addressed: false, uploadedBy: "Rajesh Kumar", isActive: true, createdAt: now, updatedAt: now },
  { id: uuid(), name: "NABH Accreditation",                   category: "Accreditation", issuingAuthority: "National Accreditation Board for Hospitals",  licenseNumber: "NABH/ACC/2023/WB/0987", issueDate: "2023-11-01", expiryDate: "2026-11-01", status: "Valid",    addressed: false, uploadedBy: "Rajesh Kumar", isActive: true, createdAt: now, updatedAt: now },
];

for (const l of licenseRecords) db.insert(hospitalLicenses).values(l).run();
console.log(`  ✓ ${licenseRecords.length} hospital licenses`);

// ═══════════════════════════════════════════════════════════════
//  APP SETTINGS  (already seeded by setupDatabase, skip if present)
// ═══════════════════════════════════════════════════════════════
const existingSettings = db.select().from(appSettings).all();
if (existingSettings.length === 0) {
  const settingsRecords = [
    { key: "workingDaysPerMonth", value: "26", updatedAt: now },
  ];
  for (const s of settingsRecords) db.insert(appSettings).values(s).run();
  console.log(`  ✓ ${settingsRecords.length} settings`);
} else {
  console.log(`  ✓ ${existingSettings.length} settings (already present)`);
}

// ═══════════════════════════════════════════════════════════════
console.log("\n✅ Database seeded successfully!\n");
console.log("Demo credentials (all use password: password123):");
console.log("  Super Admin  : superadmin@gsshospital.com");
console.log("  Admin        : admin@gsshospital.com");
console.log("  Leader (GM)  : leader@gsshospital.com");
console.log("  Staff        : staff@gsshospital.com");
console.log("  Leader (Surg): leader2@gsshospital.com");
console.log("  Staff 2      : staff2@gsshospital.com");

  }); // end sqlite.transaction

  _seedAll(); // execute the transaction

} // end seedDemoData

// ─── Direct execution: npx tsx src-server/db/seed.ts ─────────
const isDirectRun = process.argv[1]?.replace(/\\/g, "/").includes("seed");
if (isDirectRun) {
  setupDatabase();
  seedDemoData();
}
