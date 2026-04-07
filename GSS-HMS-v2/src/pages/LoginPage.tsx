import { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { settingsApi } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { FlaskConical, UserCog, ArrowRightLeft, AlertTriangle, Loader2, Info, KeyRound } from "lucide-react";
import { toast } from "sonner";

const QUICK_ACCESS = [
  { label: "Super Admin", email: "superadmin@gsshospital.com" },
  { label: "Admin", email: "admin@gsshospital.com" },
  { label: "Leader", email: "leader@gsshospital.com" },
  { label: "Staff", email: "staff@gsshospital.com" },
];

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mode state
  const [appMode, setAppMode] = useState<"demo" | "user">("demo");
  const [modeLoading, setModeLoading] = useState(true);
  const [switchDialogOpen, setSwitchDialogOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [targetMode, setTargetMode] = useState<"demo" | "user">("user");

  // Fetch current mode on mount
  useEffect(() => {
    settingsApi
      .getMode()
      .then((res) => setAppMode(res.data.mode))
      .catch(() => setAppMode("demo"))
      .finally(() => setModeLoading(false));
  }, []);

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    const success = await login(email, password);
    setIsSubmitting(false);
    if (success) {
      navigate("/dashboard");
    } else {
      setError("Invalid email or password");
    }
  };

  const handleQuickAccess = async (quickEmail: string) => {
    setError("");
    setIsSubmitting(true);
    const success = await login(quickEmail, "password123");
    setIsSubmitting(false);
    if (success) navigate("/dashboard");
  };

  const openSwitchDialog = (to: "demo" | "user") => {
    setTargetMode(to);
    setSwitchDialogOpen(true);
  };

  const handleModeSwitch = async () => {
    setSwitching(true);
    try {
      const res = await settingsApi.switchMode(targetMode);
      setAppMode(targetMode);
      setSwitchDialogOpen(false);
      toast.success(res.data.message);

      // Pre-fill credentials for the new mode
      if (targetMode === "user") {
        setEmail("admin@hospital.com");
        setPassword("admin123");
      } else {
        setEmail("");
        setPassword("");
      }
    } catch {
      toast.error("Failed to switch mode. Please try again.");
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-50 p-4">
      <div className="w-full max-w-md space-y-5">
        {/* Logo / Brand */}
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold text-2xl shadow-lg">
            GSS
          </div>
          <h1 className="mt-4 text-2xl font-bold">GSS Hospital Pro</h1>
          <p className="text-muted-foreground">Gandhi Seva Sadan — Management System</p>
        </div>

        {/* Mode Badge */}
        {!modeLoading && (
          <div className="flex justify-center">
            <Badge
              variant={appMode === "demo" ? "default" : "secondary"}
              className="gap-1.5 px-3 py-1 text-xs"
            >
              {appMode === "demo" ? <FlaskConical size={14} /> : <UserCog size={14} />}
              {appMode === "demo" ? "Demo Mode" : "User Mode"}
            </Badge>
          </div>
        )}

        {/* Login Card */}
        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              {appMode === "demo"
                ? "Try the system with sample data, or use quick access below"
                : "Enter your credentials to access the system"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@hospital.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 text-base"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full h-12 text-base" disabled={isSubmitting}>
                {isSubmitting ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Quick Access — demo mode only */}
        {appMode === "demo" && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Quick Access (Demo)</CardTitle>
              <CardDescription className="text-xs">Click any role to sign in instantly</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_ACCESS.map((qa) => (
                  <Button
                    key={qa.email}
                    variant="outline"
                    onClick={() => handleQuickAccess(qa.email)}
                    disabled={isSubmitting}
                    className="h-11 text-sm"
                  >
                    {qa.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* First-time guidance for user mode */}
        {appMode === "user" && (
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="pt-5 pb-4">
              <div className="flex gap-3">
                <Info size={20} className="text-blue-600 shrink-0 mt-0.5" />
                <div className="text-sm space-y-1">
                  <p className="font-medium text-blue-900">Getting Started</p>
                  <p className="text-blue-700">
                    Sign in with the default admin account, then go to
                    <strong> User Admin</strong> to create user accounts and
                    <strong> Staff Directory</strong> to add your team.
                  </p>
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-blue-600 bg-blue-100 rounded px-2 py-1.5 w-fit">
                    <KeyRound size={12} />
                    <span>admin@hospital.com &nbsp;/&nbsp; admin123</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mode Switch */}
        {!modeLoading && (
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft size={16} className="text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {appMode === "demo"
                      ? "Ready to use with your own data?"
                      : "Want to explore with sample data?"}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openSwitchDialog(appMode === "demo" ? "user" : "demo")}
                  className="shrink-0"
                >
                  {appMode === "demo" ? "Switch to User Mode" : "Switch to Demo Mode"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={switchDialogOpen} onOpenChange={setSwitchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle size={20} className="text-amber-500" />
              Switch to {targetMode === "demo" ? "Demo" : "User"} Mode?
            </DialogTitle>
            <DialogDescription>
              {targetMode === "demo"
                ? "This will replace all current data with sample demo data. Any data you've entered will be permanently deleted."
                : "This will clear all demo data and start fresh with a clean database. You'll get a default admin account to begin setup."}
            </DialogDescription>
          </DialogHeader>

          <Separator />

          <div className="space-y-3 text-sm">
            {targetMode === "user" ? (
              <>
                <p className="font-medium">What happens next:</p>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>All demo data will be removed</li>
                  <li>A default <strong>Super Admin</strong> account will be created</li>
                  <li>You can then create real users, staff, and start managing your hospital</li>
                </ul>
                <div className="rounded-md bg-muted p-3 mt-2">
                  <p className="text-xs font-medium mb-1">Default Admin Credentials</p>
                  <p className="text-xs text-muted-foreground">Email: admin@hospital.com</p>
                  <p className="text-xs text-muted-foreground">Password: admin123</p>
                  <p className="text-xs text-amber-600 mt-1">Change this password after first login!</p>
                </div>
              </>
            ) : (
              <>
                <p className="font-medium">What happens next:</p>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>All your current data will be permanently deleted</li>
                  <li>Sample data with demo staff, attendance, payroll, and leave records will be loaded</li>
                  <li>You can explore the system using quick access buttons</li>
                </ul>
              </>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setSwitchDialogOpen(false)} disabled={switching}>
              Cancel
            </Button>
            <Button
              variant={targetMode === "demo" ? "default" : "default"}
              onClick={handleModeSwitch}
              disabled={switching}
            >
              {switching ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-1" />
                  Switching...
                </>
              ) : (
                `Switch to ${targetMode === "demo" ? "Demo" : "User"} Mode`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
