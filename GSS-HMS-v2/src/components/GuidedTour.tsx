import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  LayoutDashboard, UserPlus, Ticket, Pill, Stethoscope, TestTubeDiagonal,
  Users, ClipboardCheck, Calendar, CalendarClock, Wallet, BarChart3,
  AlertTriangle, BriefcaseMedical, Wrench, Warehouse, Receipt, Shield,
  FileText, Megaphone, PieChart, UserCog, Settings, ChevronRight, ChevronLeft, X, Play,
} from "lucide-react";

// ── Tour content per route ──────────────────────────────────
export const PAGE_HINTS: Record<string, { title: string; description: string; tips: string[] }> = {
  "/dashboard": {
    title: "Dashboard",
    description: "Your central hub for hospital operations at a glance.",
    tips: [
      "Summary cards show real-time stats — patients, staff on duty, pending labs, OPD tokens.",
      "Scroll down for expiring certifications, penalty summaries, and recent lab results.",
      "Click any notification bell icon in the header to view active announcements.",
    ],
  },
  "/patients": {
    title: "Patients",
    description: "Register, search, and manage patient records.",
    tips: [
      "Use the search bar to find patients by name, phone, or ID.",
      "Click 'Add Patient' to register a new patient with demographics and contact info.",
      "Upload patient documents (Aadhar, PAN, etc.) from the patient detail view.",
      "Patient records can be exported as PDF or Excel using the export buttons.",
    ],
  },
  "/opd": {
    title: "OPD & Tokens",
    description: "Manage outpatient department tokens and queue flow.",
    tips: [
      "Generate a new OPD token by selecting a patient and doctor.",
      "Tokens flow through statuses: Waiting → In Consultation → Completed.",
      "The queue board shows today's token status in real time.",
    ],
  },
  "/pharmacy": {
    title: "Pharmacy",
    description: "Manage prescriptions and dispense medications.",
    tips: [
      "View pending prescriptions and update their status when dispensed.",
      "Each prescription links to the patient and the prescribing doctor.",
      "Check stock via the Inventory page before dispensing.",
    ],
  },
  "/schedules": {
    title: "Schedules",
    description: "Create and manage doctor/staff shift schedules.",
    tips: [
      "Add a new schedule by selecting a doctor, department, day, and time slot.",
      "Set maximum patients per slot to manage capacity.",
      "Schedules created here appear on the Duty Roster page in the weekly grid view.",
    ],
  },
  "/laboratory": {
    title: "Labs & Radiology",
    description: "Order, track, and manage diagnostic lab tests and radiology.",
    tips: [
      "Create a new lab order by selecting a patient, test type, and priority.",
      "Lab tests flow from Pending → In Progress → Completed with optional results attached.",
      "Use category filters (Biochemistry, Radiology, etc.) to narrow down the view.",
    ],
  },
  "/staff": {
    title: "Staff Registry",
    description: "Complete personnel database with HR details.",
    tips: [
      "Each staff member can have a photo, Aadhaar document, appointment date, and CTC salary.",
      "Use the filter panel to search by category (Admin, Clinical, Nurse, Technical, Receptionist).",
      "Staff categories are auto-derived from their role but can be overridden.",
      "Terminated staff are shown with a red badge — set a termination date to mark them.",
    ],
  },
  "/attendance": {
    title: "Attendance",
    description: "Track daily attendance and view monthly reports.",
    tips: [
      "Mark attendance as Present, Absent, Late, Half Day, or On Leave for each staff member.",
      "The Monthly Report tab shows per-employee statistics and attendance percentages.",
      "Attendance data feeds into the Payroll system for deduction calculations.",
    ],
  },
  "/leave": {
    title: "Leave Management",
    description: "Apply for and approve staff leave requests.",
    tips: [
      "Staff can submit leave requests with type (Casual, Sick, Earned, etc.) and date range.",
      "Managers can approve or reject leave requests from the pending queue.",
      "Leave balances are tracked and reflected in monthly attendance summaries.",
    ],
  },
  "/roster": {
    title: "Duty Roster",
    description: "Weekly view of staff shift assignments across departments.",
    tips: [
      "This is a read-only view — shifts are created on the Schedules page.",
      "Use the week navigation arrows to browse past and future weeks.",
      "Shifts are color-coded: Morning (amber), Afternoon (blue), Night (indigo).",
      "Filter by department to see only relevant staff shifts.",
    ],
  },
  "/payroll": {
    title: "Payroll",
    description: "Process salary breakdowns and manage payroll records.",
    tips: [
      "Create a payroll entry with breakdown: Basic, TA, Conveyance, HRA, PF, TDS.",
      "Net salary is auto-calculated: (Basic + TA + Conveyance + HRA + Bonus) − (PF + TDS + Deductions).",
      "Payroll flows through statuses: Draft → Processed → Paid.",
      "Only Draft entries can be deleted.",
    ],
  },
  "/performance": {
    title: "Performance Evaluations",
    description: "Evaluate staff using the 6-criteria behavioral scoring system.",
    tips: [
      "Rate staff from 1–5 on: Responsible, Engaged, Self Starter, Team Player, Challenged, Employee Oriented.",
      "The overall score is auto-calculated as the average of all 6 criteria.",
      "View analytics via bar charts, radar charts, and department-level pie charts.",
      "Assign evaluation periods like 'Q1-2026' or '2025-26' for tracking over time.",
    ],
  },
  "/medicine-discrepancy": {
    title: "Medicine Discrepancy",
    description: "Track and resolve medication administration discrepancies.",
    tips: [
      "Flagged entries show when administered medicine differs from what was prescribed.",
      "Each discrepancy records the prescribing doctor, administering nurse, and notes.",
      "Resolve discrepancies with a resolution note to keep an audit trail.",
    ],
  },
  "/nurse-management": {
    title: "Nurse Management",
    description: "Manage nursing staff assignments and duties.",
    tips: [
      "View nurse assignments across departments and shifts.",
      "Track duty hours and workload distribution.",
      "Nurse data is pulled from the Staff Registry filtered to nursing roles.",
    ],
  },
  "/technician": {
    title: "Technician",
    description: "Manage technical staff and their equipment assignments.",
    tips: [
      "View technicians by department and their current assignments.",
      "Track equipment handling and maintenance responsibilities.",
    ],
  },
  "/inventory": {
    title: "Inventory",
    description: "Track hospital assets, consumables, and stock levels.",
    tips: [
      "Items are categorized as Fixed assets or Disposable consumables.",
      "Monitor stock levels with min/max thresholds — items below minimum show warnings.",
      "Track disposals, damages, and warranty expiry dates for each item.",
      "Attach bill references and warranty documents for audit purposes.",
    ],
  },
  "/billing": {
    title: "Billing",
    description: "Manage patient billing and payment tracking.",
    tips: [
      "Create bills linking to patients with itemized charges.",
      "Track payment statuses: Paid, Unpaid, Partial, Refunded.",
      "Export billing reports for accounting purposes.",
    ],
  },
  "/insurance": {
    title: "Insurance",
    description: "Manage patient insurance claims and provider information.",
    tips: [
      "Link insurance policies to patient records.",
      "Track claim submissions, approvals, and settlements.",
      "View insurance provider details and coverage information.",
    ],
  },
  "/documents": {
    title: "Documents & Certifications",
    description: "Upload and manage hospital and staff certifications.",
    tips: [
      "Track document categories: Clinical, Administrative, Regulatory, Training, Staff, Doctor's.",
      "Set expiry dates — documents nearing expiry appear on the Dashboard as alerts.",
      "Each document can be linked to a specific staff member.",
    ],
  },
  "/announcements": {
    title: "Announcements",
    description: "Create and manage hospital-wide announcements and penalty notices.",
    tips: [
      "Post announcements of types: General, Policy, Penalty, Emergency, Maintenance.",
      "Penalty announcements can include absence thresholds and deduction amounts.",
      "Active announcements appear in the notification bell dropdown across all pages.",
    ],
  },
  "/reports": {
    title: "Reports",
    description: "View analytics and generate operational reports.",
    tips: [
      "Access cross-functional hospital data summaries here.",
      "Reports pull live data from all modules — staff, patients, labs, billing, etc.",
      "Export reports as PDF or Excel for external sharing.",
    ],
  },
  "/users": {
    title: "User Administration",
    description: "Manage system users, roles, and access permissions.",
    tips: [
      "Create user accounts and assign roles: Super Admin, Admin, Manager, Doctor, Nurse, Staff, Viewer.",
      "Each role has predefined permissions controlling which pages and actions are accessible.",
      "Deactivate accounts instead of deleting them to preserve audit history.",
    ],
  },
  "/settings": {
    title: "Settings",
    description: "System configuration and preferences.",
    tips: [
      "Manage hospital-level settings and system preferences.",
      "Start the guided demo tour to walk through all features.",
    ],
  },
};

interface TourStep {
  path: string;
  icon: React.ReactNode;
  group: string;
}

const TOUR_STEPS: TourStep[] = [
  { path: "/dashboard", icon: <LayoutDashboard size={20} />, group: "Overview" },
  { path: "/patients", icon: <UserPlus size={20} />, group: "Patient Care" },
  { path: "/opd", icon: <Ticket size={20} />, group: "Patient Care" },
  { path: "/laboratory", icon: <TestTubeDiagonal size={20} />, group: "Patient Care" },
  { path: "/pharmacy", icon: <Pill size={20} />, group: "Patient Care" },
  { path: "/staff", icon: <Users size={20} />, group: "Staff & HR" },
  { path: "/nurse-management", icon: <BriefcaseMedical size={20} />, group: "Staff & HR" },
  { path: "/technician", icon: <Wrench size={20} />, group: "Staff & HR" },
  { path: "/schedules", icon: <Stethoscope size={20} />, group: "Staff & HR" },
  { path: "/roster", icon: <CalendarClock size={20} />, group: "Staff & HR" },
  { path: "/attendance", icon: <ClipboardCheck size={20} />, group: "Staff & HR" },
  { path: "/leave", icon: <Calendar size={20} />, group: "Staff & HR" },
  { path: "/performance", icon: <BarChart3 size={20} />, group: "Staff & HR" },
  { path: "/payroll", icon: <Wallet size={20} />, group: "Finance" },
  { path: "/billing", icon: <Receipt size={20} />, group: "Finance" },
  { path: "/insurance", icon: <Shield size={20} />, group: "Finance" },
  { path: "/inventory", icon: <Warehouse size={20} />, group: "Operations" },
  { path: "/medicine-discrepancy", icon: <AlertTriangle size={20} />, group: "Operations" },
  { path: "/documents", icon: <FileText size={20} />, group: "Operations" },
  { path: "/announcements", icon: <Megaphone size={20} />, group: "Operations" },
  { path: "/reports", icon: <PieChart size={20} />, group: "Administration" },
  { path: "/users", icon: <UserCog size={20} />, group: "Administration" },
  { path: "/settings", icon: <Settings size={20} />, group: "Administration" },
];

interface GuidedTourProps {
  active: boolean;
  onEnd: () => void;
}

export function GuidedTour({ active, onEnd }: GuidedTourProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const current = TOUR_STEPS[step];
  const hint = PAGE_HINTS[current?.path];
  const total = TOUR_STEPS.length;

  const goTo = useCallback((index: number) => {
    setStep(index);
    navigate(TOUR_STEPS[index].path);
  }, [navigate]);

  const handleNext = () => {
    if (step < total - 1) goTo(step + 1);
    else handleEnd();
  };

  const handlePrev = () => {
    if (step > 0) goTo(step - 1);
  };

  const handleEnd = () => {
    setStep(0);
    onEnd();
  };

  if (!active || !hint) return null;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 pointer-events-auto" onClick={handleEnd} />

      {/* Tour card — centered bottom area */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-xl pointer-events-auto">
        <Card className="border-2 border-primary/40 shadow-2xl">
          <CardContent className="p-5">
            {/* Progress bar */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${((step + 1) / total) * 100}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground font-mono shrink-0">{step + 1}/{total}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={handleEnd}>
                <X size={14} />
              </Button>
            </div>

            {/* Group + icon + title */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <span>{current.group}</span>
              <ChevronRight size={12} />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-md bg-primary/10 text-primary shrink-0">{current.icon}</div>
              <h3 className="text-lg font-bold">{hint.title}</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{hint.description}</p>

            {/* Tips */}
            <div className="space-y-1.5 mb-4 max-h-40 overflow-y-auto pr-1">
              {hint.tips.map((tip, i) => (
                <div key={i} className="flex gap-2 text-sm">
                  <span className="text-primary font-bold shrink-0">•</span>
                  <span className="text-foreground/80">{tip}</span>
                </div>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={handlePrev} disabled={step === 0}>
                <ChevronLeft size={16} className="mr-1" /> Previous
              </Button>
              <div className="flex gap-1">
                {TOUR_STEPS.map((_, i) => (
                  <button
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${i === step ? "w-4 bg-primary" : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"}`}
                    onClick={() => goTo(i)}
                    title={PAGE_HINTS[TOUR_STEPS[i].path]?.title}
                  />
                ))}
              </div>
              <Button size="sm" onClick={handleNext}>
                {step === total - 1 ? "Finish Tour" : <>Next <ChevronRight size={16} className="ml-1" /></>}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/** Button to launch the guided tour — used in Header and Settings */
export function StartTourButton({ onClick, variant = "ghost", size = "sm" }: { onClick: () => void; variant?: "ghost" | "outline" | "default"; size?: "sm" | "icon" | "default" }) {
  return (
    <Button variant={variant} size={size} onClick={onClick} className="gap-1.5" title="Start guided demo tour">
      <Play size={16} className="text-primary" />
      {size !== "icon" && <span className="text-xs">Demo Tour</span>}
    </Button>
  );
}
