// ── Department list ─────────────────────────────────────────
export const DEPARTMENTS = [
  "General Medicine",
  "Cardiology",
  "General OPD",
  "ICU",
  "Emergency",
  "Orthopedics",
  "Pediatrics",
  "Gynecology",
  "ENT",
  "Dermatology",
  "Ophthalmology",
  "Radiology",
  "Pathology",
  "Laboratory",
  "Pharmacy",
  "Nursing",
  "Administration",
  "Accounts",
  "Insurance",
  "Front Desk",
  "Security",
  "Finance",
  "IPD - General Ward",
  "Ayush",
] as const;

// ── Staff roles ─────────────────────────────────────────────
export const STAFF_ROLES = [
  "Consultant",
  "RMO",
  "Doctor",
  "Staff Nurse",
  "Sr. Nurse",
  "Jr. Nurse",
  "Nurse",
  "Paramedic",
  "Administrative",
  "Technician",
  "Lab Technician",
  "Lab In-charge",
  "Receptionist",
  "Accountant",
  "Pharmacist",
  "Security",
  "Driver",
  "Housekeeping",
  "Metron",
] as const;

// ── Lab test categories ─────────────────────────────────────
export const LAB_CATEGORIES = [
  "Biochemistry",
  "Hematology",
  "Microbiology",
  "Radiology",
  "Pathology",
  "Serology",
  "Urinalysis",
] as const;

// ── Document / certification categories ─────────────────────
export const DOC_CATEGORIES = [
  "Clinical",
  "Doctor's Documents",
  "Staff Documents",
  "Administrative",
  "Regulatory",
  "Training",
] as const;
// ── Staff categories (HR grouping) ─────────────────────
export const STAFF_CATEGORIES = [
  "Admin",
  "Clinical",
  "Receptionist",
  "Nurse",
  "Technical",
] as const;

// ── Performance evaluation criteria labels ────────────
export const EVALUATION_CRITERIA = [
  { key: "responsible", label: "Responsible" },
  { key: "engaged", label: "Engaged" },
  { key: "selfStarter", label: "Self Starter" },
  { key: "teamPlayer", label: "Team Player" },
  { key: "challenged", label: "Challenged" },
  { key: "employeeOriented", label: "Employee Oriented" },
] as const;

// ── Auto-derive staff category from role ───────────────
export function getDefaultCategory(role: string): string {
  const clinicalRoles = ["Consultant", "RMO", "Doctor", "Paramedic"];
  const nurseRoles = ["Staff Nurse", "Sr. Nurse", "Jr. Nurse", "Nurse", "Metron"];
  const technicalRoles = ["Technician", "Lab Technician", "Lab In-charge", "Pharmacist"];
  const adminRoles = ["Administrative", "Accountant", "Security", "Driver", "Housekeeping"];
  if (clinicalRoles.includes(role)) return "Clinical";
  if (nurseRoles.includes(role)) return "Nurse";
  if (technicalRoles.includes(role)) return "Technical";
  if (role === "Receptionist") return "Receptionist";
  if (adminRoles.includes(role)) return "Admin";
  return "Admin";
}