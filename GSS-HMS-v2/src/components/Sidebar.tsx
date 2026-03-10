import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard, Users, UserPlus, TestTubeDiagonal, Wallet,
  FileText, BarChart3, CalendarClock, Settings, Megaphone,
  ClipboardCheck, Calendar, Shield, Warehouse, Stethoscope,
  Wrench, UserCog, BriefcaseMedical, Ticket, Pill, Receipt, PieChart,
  AlertTriangle, ChevronDown,
} from "lucide-react";
import type { Permission } from "@/types";

interface SidebarLink {
  label: string;
  path: string;
  icon: React.ReactNode;
  permissions: Permission[];
}

interface SidebarGroup {
  title: string;
  links: SidebarLink[];
}

const SIDEBAR_GROUPS: SidebarGroup[] = [
  {
    title: "Overview",
    links: [
      { label: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={20} />, permissions: ["dashboard:view"] },
    ],
  },
  {
    title: "Patient Care",
    links: [
      { label: "Patients", path: "/patients", icon: <UserPlus size={20} />, permissions: ["patient:read"] },
      { label: "OPD & Tokens", path: "/opd", icon: <Ticket size={20} />, permissions: ["tokens:read"] },
      { label: "Labs & Radiology", path: "/laboratory", icon: <TestTubeDiagonal size={20} />, permissions: ["lab:read"] },
      { label: "Pharmacy", path: "/pharmacy", icon: <Pill size={20} />, permissions: ["patient:read"] },
    ],
  },
  {
    title: "Staff & HR",
    links: [
      { label: "Staff Registry", path: "/staff", icon: <Users size={20} />, permissions: ["staff:read"] },
      { label: "Nurse Mgmt", path: "/nurse-management", icon: <BriefcaseMedical size={20} />, permissions: ["roster:write"] },
      { label: "Technician", path: "/technician", icon: <Wrench size={20} />, permissions: ["reports:match"] },
      { label: "Schedules", path: "/schedules", icon: <Stethoscope size={20} />, permissions: ["schedule:read"] },
      { label: "Duty Roster", path: "/roster", icon: <CalendarClock size={20} />, permissions: ["roster:read"] },
      { label: "Attendance", path: "/attendance", icon: <ClipboardCheck size={20} />, permissions: ["attendance:read"] },
      { label: "Leave Mgmt", path: "/leave", icon: <Calendar size={20} />, permissions: ["leave:apply"] },
      { label: "Performance", path: "/performance", icon: <BarChart3 size={20} />, permissions: ["performance:read"] },
    ],
  },
  {
    title: "Finance",
    links: [
      { label: "Payroll", path: "/payroll", icon: <Wallet size={20} />, permissions: ["payroll:read"] },
      { label: "Billing", path: "/billing", icon: <Receipt size={20} />, permissions: ["payroll:read"] },
      { label: "Insurance", path: "/insurance", icon: <Shield size={20} />, permissions: ["insurance:read"] },
    ],
  },
  {
    title: "Operations",
    links: [
      { label: "Inventory", path: "/inventory", icon: <Warehouse size={20} />, permissions: ["inventory:read"] },
      { label: "Med Discrepancy", path: "/medicine-discrepancy", icon: <AlertTriangle size={20} />, permissions: ["patient:read"] },
      { label: "Documents", path: "/documents", icon: <FileText size={20} />, permissions: ["documents:read"] },
      { label: "Announcements", path: "/announcements", icon: <Megaphone size={20} />, permissions: ["announcements:read"] },
    ],
  },
  {
    title: "Administration",
    links: [
      { label: "Reports", path: "/reports", icon: <PieChart size={20} />, permissions: ["reports:read"] },
      { label: "User Admin", path: "/users", icon: <UserCog size={20} />, permissions: ["users:read"] },
      { label: "Settings", path: "/settings", icon: <Settings size={20} />, permissions: ["settings:read"] },
    ],
  },
];

export function Sidebar() {
  const { user, hasAnyPermission } = useAuth();
  const location = useLocation();

  // Filter groups: keep only links the user can see, then drop empty groups
  const visibleGroups = SIDEBAR_GROUPS
    .map((group) => ({
      ...group,
      links: group.links.filter((link) => hasAnyPermission(link.permissions)),
    }))
    .filter((group) => group.links.length > 0);

  // Initialize collapsed state — auto-expand group containing the active route
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    const state: Record<string, boolean> = {};
    visibleGroups.forEach((g) => {
      const hasActive = g.links.some((l) => location.pathname.startsWith(l.path));
      state[g.title] = !hasActive; // collapsed if not active
    });
    // Always keep Overview expanded
    if (state["Overview"] !== undefined) state["Overview"] = false;
    return state;
  });

  const toggleGroup = (title: string) => {
    setCollapsed((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  if (!user) return null;

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-sidebar">
      {/* Logo / Brand */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
          GSS
        </div>
        <div>
          <h1 className="text-sm font-bold text-sidebar-accent-foreground leading-none">GSS Hospital</h1>
          <p className="text-xs text-muted-foreground">Management System</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
        {visibleGroups.map((group, gi) => {
          const isCollapsed = !!collapsed[group.title];
          const isFirstGroup = gi === 0;
          return (
            <div key={group.title}>
              {isFirstGroup ? (
                /* Overview group — no header, always expanded */
                <div className="space-y-0.5">
                  {group.links.map((link) => (
                    <NavLink
                      key={link.path}
                      to={link.path}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                        )
                      }
                    >
                      {link.icon}
                      {link.label}
                    </NavLink>
                  ))}
                </div>
              ) : (
                <>
                  <button
                    onClick={() => toggleGroup(group.title)}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 hover:text-muted-foreground transition-colors"
                  >
                    {group.title}
                    <ChevronDown size={14} className={cn("transition-transform", isCollapsed ? "-rotate-90" : "")} />
                  </button>
                  {!isCollapsed && (
                    <div className="space-y-0.5">
                      {group.links.map((link) => (
                        <NavLink
                          key={link.path}
                          to={link.path}
                          className={({ isActive }) =>
                            cn(
                              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                              isActive
                                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                            )
                          }
                        >
                          {link.icon}
                          {link.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom user info */}
      <Separator />
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
            {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.role.replace("_", " ")}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
