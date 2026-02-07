import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Settings, Building2, Clock, Shield, Database, Save } from "lucide-react";
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
  const canWrite = hasPermission("settings:write") || user?.role === "SUPER_ADMIN" || user?.role === "CEO";

  const [hospital, setHospital] = useState(HOSPITAL_DEFAULTS);
  const [opd, setOpd] = useState(OPD_DEFAULTS);
  const [theme, setTheme] = useState("system");

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
    </div>
  );
}
