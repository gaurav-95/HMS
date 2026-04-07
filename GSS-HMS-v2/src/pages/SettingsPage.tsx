import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { settingsApi } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Settings, Building2, Clock, Shield, Database, Save, Lightbulb, Play, ArrowRightLeft, FlaskConical, UserCog, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

const HOSPITAL_DEFAULTS = {
  name: "Gandhi Seva Sadan Hospital",
  address: "Main Road, Patna, Bihar 800001",
  phone: "+91 612 222 1234",
  email: "info@gsshospital.com",
  website: "www.gsshospital.com",
  registrationNo: "GSS/REG/2024/001",
};

const OPD_DEFAULTS = {
  startTime: "09:00",
  endTime: "17:00",
  maxTokensPerDay: 100,
  tokenPrefix: "GSS",
  consultationFee: 200,
};

export default function SettingsPage() {
  const { user, hasPermission } = useAuth();
  const canWrite = hasPermission("settings:write") || user?.role === "SUPER_ADMIN";

  const [hospital, setHospital] = useState(HOSPITAL_DEFAULTS);
  const [opd, setOpd] = useState(OPD_DEFAULTS);
  const [theme, setTheme] = useState("system");

  // App mode state
  const [appMode, setAppMode] = useState<"demo" | "user">("demo");
  const [switchDialogOpen, setSwitchDialogOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    settingsApi.getMode().then((r) => setAppMode(r.data.mode)).catch(() => {});
  }, []);

  const handleModeSwitch = async () => {
    const target = appMode === "demo" ? "user" : "demo";
    setSwitching(true);
    try {
      const res = await settingsApi.switchMode(target);
      setAppMode(target);
      setSwitchDialogOpen(false);
      toast.success(res.data.message);
      // Log the user out since all data was replaced
      setTimeout(() => {
        localStorage.removeItem("auth-token");
        window.location.href = "/login";
      }, 1500);
    } catch {
      toast.error("Failed to switch mode");
    } finally {
      setSwitching(false);
    }
  };

  const handleSaveHospital = () => {
    // In a real production app this would call an API
    localStorage.setItem("gss-hospital-settings", JSON.stringify(hospital));
    toast.success("Hospital settings saved");
  };

  const handleSaveOPD = () => {
    localStorage.setItem("gss-opd-settings", JSON.stringify(opd));
    toast.success("OPD settings saved");
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">System configuration and preferences</p>
      </div>

      {/* Hospital Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            <div>
              <CardTitle>Hospital Information</CardTitle>
              <CardDescription>Basic details about the hospital</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Hospital Name</Label>
              <Input value={hospital.name} onChange={(e) => setHospital((h) => ({ ...h, name: e.target.value }))} disabled={!canWrite} />
            </div>
            <div className="space-y-2">
              <Label>Registration No.</Label>
              <Input value={hospital.registrationNo} onChange={(e) => setHospital((h) => ({ ...h, registrationNo: e.target.value }))} disabled={!canWrite} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Input value={hospital.address} onChange={(e) => setHospital((h) => ({ ...h, address: e.target.value }))} disabled={!canWrite} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={hospital.phone} onChange={(e) => setHospital((h) => ({ ...h, phone: e.target.value }))} disabled={!canWrite} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={hospital.email} onChange={(e) => setHospital((h) => ({ ...h, email: e.target.value }))} disabled={!canWrite} />
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input value={hospital.website} onChange={(e) => setHospital((h) => ({ ...h, website: e.target.value }))} disabled={!canWrite} />
            </div>
          </div>
          {canWrite && (
            <Button onClick={handleSaveHospital}><Save className="h-4 w-4 mr-1" /> Save Hospital Info</Button>
          )}
        </CardContent>
      </Card>

      {/* OPD Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <div>
              <CardTitle>OPD Configuration</CardTitle>
              <CardDescription>Token and scheduling settings</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>OPD Start Time</Label>
              <Input type="time" value={opd.startTime} onChange={(e) => setOpd((o) => ({ ...o, startTime: e.target.value }))} disabled={!canWrite} />
            </div>
            <div className="space-y-2">
              <Label>OPD End Time</Label>
              <Input type="time" value={opd.endTime} onChange={(e) => setOpd((o) => ({ ...o, endTime: e.target.value }))} disabled={!canWrite} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Max Tokens/Day</Label>
              <Input type="number" value={opd.maxTokensPerDay} onChange={(e) => setOpd((o) => ({ ...o, maxTokensPerDay: Number(e.target.value) }))} disabled={!canWrite} />
            </div>
            <div className="space-y-2">
              <Label>Token Prefix</Label>
              <Input value={opd.tokenPrefix} onChange={(e) => setOpd((o) => ({ ...o, tokenPrefix: e.target.value }))} disabled={!canWrite} />
            </div>
            <div className="space-y-2">
              <Label>Consultation Fee (₹)</Label>
              <Input type="number" value={opd.consultationFee} onChange={(e) => setOpd((o) => ({ ...o, consultationFee: Number(e.target.value) }))} disabled={!canWrite} />
            </div>
          </div>
          {canWrite && (
            <Button onClick={handleSaveOPD}><Save className="h-4 w-4 mr-1" /> Save OPD Settings</Button>
          )}
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <div>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Visual preferences</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Theme</Label>
            <Select value={theme} onValueChange={(v) => { setTheme(v); toast.success(`Theme set to ${v}`); }}>
              <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="system">System Default</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* System Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <div>
              <CardTitle>System Information</CardTitle>
              <CardDescription>Application details</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <p className="text-muted-foreground">Application</p>
              <p className="font-medium">GSS Hospital Pro</p>
            </div>
            <div className="space-y-2">
              <p className="text-muted-foreground">Version</p>
              <p className="font-medium">2.0.0</p>
            </div>
            <div className="space-y-2">
              <p className="text-muted-foreground">Database</p>
              <p className="font-medium">SQLite (WAL mode)</p>
            </div>
            <div className="space-y-2">
              <p className="text-muted-foreground">API Port</p>
              <p className="font-medium">3001</p>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Logged in as:</span>
            <Badge variant="secondary">{user?.name}</Badge>
            <Badge variant="outline">{user?.role}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Data Mode */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            <div>
              <CardTitle>Data Mode</CardTitle>
              <CardDescription>Switch between demo sample data and your own data</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {appMode === "demo" ? <FlaskConical size={20} className="text-primary" /> : <UserCog size={20} className="text-primary" />}
              <div>
                <p className="text-sm font-medium">Currently in {appMode === "demo" ? "Demo" : "User"} Mode</p>
                <p className="text-xs text-muted-foreground">
                  {appMode === "demo"
                    ? "Using sample data — great for exploring features"
                    : "Using your own data — real hospital operations"}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setSwitchDialogOpen(true)}>
              Switch to {appMode === "demo" ? "User" : "Demo"} Mode
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Help & Onboarding */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            <div>
              <CardTitle>Help & Onboarding</CardTitle>
              <CardDescription>Page hints, guided tour, and first-time user assistance</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Guided Demo Tour</p>
              <p className="text-xs text-muted-foreground">Step-by-step walkthrough of all 7 pages and features</p>
            </div>
            <Button variant="default" size="sm" onClick={() => { window.dispatchEvent(new CustomEvent("gss-start-tour")); }}>
              <Play className="h-4 w-4 mr-1" /> Start Tour
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Mode Switch Confirmation Dialog */}
      <Dialog open={switchDialogOpen} onOpenChange={setSwitchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle size={20} className="text-amber-500" />
              Switch to {appMode === "demo" ? "User" : "Demo"} Mode?
            </DialogTitle>
            <DialogDescription>
              {appMode === "demo"
                ? "This will clear all demo data and start fresh. You'll get a default admin account to begin setup."
                : "This will replace all your data with sample demo data. Your data will be permanently deleted."}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <p className="text-sm text-muted-foreground">You will be logged out after switching.</p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setSwitchDialogOpen(false)} disabled={switching}>Cancel</Button>
            <Button onClick={handleModeSwitch} disabled={switching}>
              {switching ? <><Loader2 size={16} className="animate-spin mr-1" /> Switching...</> : `Switch to ${appMode === "demo" ? "User" : "Demo"} Mode`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
