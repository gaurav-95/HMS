import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  LayoutDashboard, Users, ClipboardCheck, Calendar, Wallet,
  UserCog, Settings, ChevronRight, ChevronLeft, X, Play,
} from "lucide-react";

// ── Tour content per route ──────────────────────────────────
export const PAGE_HINTS: Record<string, { title: string; description: string; tips: string[] }> = {
  "/dashboard": {
    title: "Dashboard",
    description: "Your central hub for hospital operations at a glance.",
    tips: [
      "Summary cards show real-time stats — staff on duty, pending leaves, attendance.",
      "Scroll down for expiring certifications, penalty summaries, and department overviews.",
      "Click any notification bell icon in the header to view active announcements.",
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
  "/users": {
    title: "User Administration",
    description: "Manage system users, roles, and access permissions.",
    tips: [
      "Create user accounts and assign roles: Super Admin, Admin, Leader, Staff.",
      "Each role has predefined permissions controlling which pages and actions are accessible.",
      "Deactivate accounts instead of deleting them to preserve audit history.",
    ],
  },
  "/settings": {
    title: "Settings",
    description: "System configuration and preferences.",
    tips: [
      "Manage hospital-level settings and system preferences.",
      "Switch between Demo and User mode to reset or personalize data.",
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
  { path: "/staff", icon: <Users size={20} />, group: "Staff & HR" },
  { path: "/attendance", icon: <ClipboardCheck size={20} />, group: "Staff & HR" },
  { path: "/leave", icon: <Calendar size={20} />, group: "Staff & HR" },
  { path: "/payroll", icon: <Wallet size={20} />, group: "Finance" },
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


