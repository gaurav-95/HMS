import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, ArrowLeft, ChevronRight, Home } from "lucide-react";
import { useNavigate, useLocation, Link } from "react-router-dom";

// Simple route-to-label mapping
const ROUTE_LABELS: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/staff": "Staff Directory",
  "/attendance": "Attendance",
  "/leave": "Leave",
  "/payroll": "Payroll",
  "/users": "User Admin",
  "/settings": "Settings",
};

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const currentPath = location.pathname;
  const pageLabel = ROUTE_LABELS[currentPath];
  const isDashboard = currentPath === "/dashboard";

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
            className="h-9 w-9 shrink-0"
            onClick={() => navigate(-1)}
            title="Go back"
          >
            <ArrowLeft size={20} />
          </Button>
        )}

        {/* Breadcrumbs + Welcome */}
        <div className="min-w-0">
          {isDashboard ? (
            <>
              <h2 className="text-xl font-semibold">Welcome, {user.name.split(" ")[0]}</h2>
              <p className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </>
          ) : (
            <>
              <nav className="flex items-center gap-1 text-sm text-muted-foreground">
                <Link to="/dashboard" className="hover:text-foreground transition-colors flex items-center gap-1">
                  <Home size={14} /> Home
                </Link>
                <ChevronRight size={14} className="shrink-0" />
                <span className="text-foreground font-medium truncate">{pageLabel || "Page"}</span>
              </nav>
              <h2 className="text-xl font-semibold leading-tight">{pageLabel || "Page"}</h2>
            </>
          )}
        </div>
      </div>

      <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-muted-foreground text-base">
        <LogOut size={20} />
        Logout
      </Button>
    </header>
  );
}
