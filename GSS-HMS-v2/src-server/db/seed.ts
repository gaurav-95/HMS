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
  users, staff, certifications, kpis,
  attendanceRecords, leaveRequests, payrollRecords,
  leaveTypes, appSettings, hospitalLicenses,
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
