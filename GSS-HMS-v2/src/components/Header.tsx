import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAnnouncements } from "@/hooks/queries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Bell, Megaphone, X, ArrowLeft, ChevronRight, Home, Play } from "lucide-react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { formatDate } from "@/lib/utils";

// Route-to-breadcrumb mapping
const ROUTE_META: Record<string, { label: string; group: string }> = {
  "/dashboard": { label: "Dashboard", group: "Overview" },
  "/patients": { label: "Patients", group: "Patient Care" },
  "/opd": { label: "OPD & Tokens", group: "Patient Care" },
  "/laboratory": { label: "Labs & Radiology", group: "Patient Care" },
  "/pharmacy": { label: "Pharmacy", group: "Patient Care" },
  "/staff": { label: "Staff Registry", group: "Staff & HR" },
  "/nurse-management": { label: "Nurse Management", group: "Staff & HR" },
  "/technician": { label: "Technician", group: "Staff & HR" },
  "/schedules": { label: "Schedules", group: "Staff & HR" },
  "/roster": { label: "Duty Roster", group: "Staff & HR" },
  "/attendance": { label: "Attendance", group: "Staff & HR" },
  "/leave": { label: "Leave Management", group: "Staff & HR" },
  "/performance": { label: "Performance", group: "Staff & HR" },
  "/payroll": { label: "Payroll", group: "Finance" },
  "/billing": { label: "Billing", group: "Finance" },
  "/insurance": { label: "Insurance", group: "Finance" },
  "/inventory": { label: "Inventory", group: "Operations" },
  "/medicine-discrepancy": { label: "Med Discrepancy", group: "Operations" },
  "/documents": { label: "Documents", group: "Operations" },
  "/announcements": { label: "Announcements", group: "Operations" },
  "/reports": { label: "Reports", group: "Administration" },
  "/users": { label: "User Admin", group: "Administration" },
  "/settings": { label: "Settings", group: "Administration" },
};

export function Header({ onStartTour }: { onStartTour?: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: announcements = [] } = useAnnouncements();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const allAnnouncements = (announcements as any[]).filter((a: any) => a.isActive);
  const count = allAnnouncements.length;

  const currentPath = location.pathname;
  const routeMeta = ROUTE_META[currentPath];
  const isDashboard = currentPath === "/dashboard";

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!user) return null;

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <div className="flex items-center gap-3 min-w-0">
        {/* Back Button — hidden on dashboard */}
        {!isDashboard && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => navigate(-1)}
            title="Go back"
          >
            <ArrowLeft size={18} />
          </Button>
        )}

        {/* Breadcrumbs + Welcome */}
        <div className="min-w-0">
          {isDashboard ? (
            <>
              <h2 className="text-lg font-semibold">Welcome back, {user.name.split(" ")[0]}</h2>
              <p className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </>
          ) : (
            <>
              {/* Breadcrumb trail */}
              <nav className="flex items-center gap-1 text-sm text-muted-foreground">
                <Link to="/dashboard" className="hover:text-foreground transition-colors flex items-center gap-1">
                  <Home size={14} /> Home
                </Link>
                {routeMeta && (
                  <>
                    <ChevronRight size={14} className="shrink-0" />
                    <span>{routeMeta.group}</span>
                    <ChevronRight size={14} className="shrink-0" />
                    <span className="text-foreground font-medium truncate">{routeMeta.label}</span>
                  </>
                )}
              </nav>
              <h2 className="text-lg font-semibold leading-tight">{routeMeta?.label || "Page"}</h2>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Demo Tour */}
        {onStartTour && (
          <Button variant="ghost" size="sm" onClick={onStartTour} className="gap-1.5 text-muted-foreground" title="Start guided demo tour">
            <Play size={16} className="text-primary" />
            <span className="text-xs hidden sm:inline">Demo Tour</span>
          </Button>
        )}

        {/* Notification Bell */}
        <div className="relative" ref={ref}>
          <Button variant="ghost" size="icon" className="relative" onClick={() => setOpen(!open)}>
            <Bell size={20} />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-white">
                {count > 9 ? "9+" : count}
              </span>
            )}
          </Button>

          {open && (
            <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border bg-popover shadow-lg z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <h4 className="text-sm font-semibold">Notifications</h4>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setOpen(false)}>
                  <X size={14} />
                </Button>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {allAnnouncements.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No notifications</p>
                ) : (
                  allAnnouncements.slice(0, 8).map((a: any) => (
                    <div
                      key={a.id}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-muted/50 border-b last:border-0 cursor-pointer"
                      onClick={() => { setOpen(false); navigate("/announcements"); }}
                    >
                      <Megaphone size={16} className="mt-0.5 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{a.title}</p>
                          <Badge
                            variant={a.type === "penalty" ? "destructive" : a.type === "policy" ? "warning" : "secondary"}
                            className="text-[10px] shrink-0"
                          >
                            {a.type}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{a.body}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{formatDate(a.createdAt)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {allAnnouncements.length > 0 && (
                <div className="border-t px-4 py-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => { setOpen(false); navigate("/announcements"); }}
                  >
                    View all announcements
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-muted-foreground">
          <LogOut size={16} />
          Logout
        </Button>
      </div>
    </header>
  );
}
