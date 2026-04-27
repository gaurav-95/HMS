import { NavLink } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useBranding } from "@/context/BrandingContext";
import { useHospitalSettings } from "@/hooks/queries";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard, Users, Wallet, ClipboardCheck, Calendar, UserCog, Settings, FileCheck2,
} from "lucide-react";
import type { Permission } from "@/types";
import { ROLE_LABELS } from "@/types";

interface SidebarLink {
  label: string;
  path: string;
  icon: React.ReactNode;
  permissions: Permission[];
}

const ICON_SIZE = 28;

const SIDEBAR_LINKS: SidebarLink[] = [
  { label: "Dashboard",      path: "/dashboard",  icon: <LayoutDashboard size={ICON_SIZE} />,  permissions: ["dashboard:view"] },
  { label: "Staff Directory", path: "/staff",      icon: <Users size={ICON_SIZE} />,            permissions: ["staff:read"] },
  { label: "Attendance",     path: "/attendance",  icon: <ClipboardCheck size={ICON_SIZE} />,   permissions: ["attendance:read"] },
  { label: "Leave",          path: "/leave",       icon: <Calendar size={ICON_SIZE} />,         permissions: ["leave:apply"] },
  { label: "Payroll",        path: "/payroll",     icon: <Wallet size={ICON_SIZE} />,           permissions: ["payroll:read"] },
  { label: "Licenses & Certs", path: "/licenses",   icon: <FileCheck2 size={ICON_SIZE} />,       permissions: ["staff:read"] },
  { label: "User Admin",    path: "/users",       icon: <UserCog size={ICON_SIZE} />,          permissions: ["users:read"] },
  { label: "Settings",       path: "/settings",    icon: <Settings size={ICON_SIZE} />,         permissions: ["settings:read"] },
];

export function Sidebar() {
  const { user, hasAnyPermission } = useAuth();
  const { logoDataUrl } = useBranding();
  const { data: hospitalData } = useHospitalSettings();
  const hospitalName = hospitalData?.name || "GSS Hospital";
  // Derive 2-3 letter initials from hospital name
  const initials = hospitalName
    .split(" ")
    .filter((w: string) => w.length > 2)
    .slice(0, 3)
    .map((w: string) => w[0].toUpperCase())
    .join("") || hospitalName.slice(0, 3).toUpperCase();

  const visibleLinks = SIDEBAR_LINKS.filter((link) => hasAnyPermission(link.permissions));

  if (!user) return null;

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-sidebar">
      {/* Logo / Brand */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-sidebar-border">
        {logoDataUrl ? (
          <img src={logoDataUrl} alt="Logo" className="h-10 w-10 rounded-lg object-cover" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm shrink-0">
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-base font-bold text-sidebar-accent-foreground leading-none truncate">{hospitalName}</h1>
          <p className="text-xs text-muted-foreground">Management System</p>
        </div>
      </div>

      {/* Navigation Links — flat list */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {visibleLinks.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-4 rounded-xl px-4 py-3 text-base font-medium transition-colors",
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
      </nav>

      {/* Bottom user info */}
      <Separator />
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
            {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-medium truncate">{user.name}</p>
            <p className="text-sm text-muted-foreground truncate">{ROLE_LABELS[user.role]}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
