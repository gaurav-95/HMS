import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAnnouncements } from "@/hooks/queries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Bell, Megaphone, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDate } from "@/lib/utils";

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { data: announcements = [] } = useAnnouncements();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const allAnnouncements = (announcements as any[]).filter((a: any) => a.isActive);
  const count = allAnnouncements.length;

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
      <div>
        <h2 className="text-lg font-semibold">Welcome back, {user.name.split(" ")[0]}</h2>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      <div className="flex items-center gap-2">
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
