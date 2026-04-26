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
  "Surgery",
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

// ── Staff categories (HR grouping) ─────────────────────
export const STAFF_CATEGORIES = [
  "Admin",
  "Clinical",
  "Receptionist",
  "Nurse",
  "Technical",
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