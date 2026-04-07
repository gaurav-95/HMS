import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDashboardStats, useAddressCertification } from "@/hooks/queries";
import { useAuth } from "@/context/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Users, UserX, ClipboardCheck, Calendar, Loader2, ShieldAlert, CheckCircle2 } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const CHART_COLORS = ["#0d9488", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6", "#ec4899", "#10b981", "#f97316"];
const PERIODS = [
  { key: "monthly", label: "This Month" },
  { key: "quarterly", label: "This Quarter" },
  { key: "yearly", label: "This Year" },
] as const;

export default function DashboardPage() {
  const [period, setPeriod] = useState<string>("monthly");
  const { data: stats, isLoading } = useDashboardStats(period);
  const { hasPermission } = useAuth();
  const addressCert = useAddressCertification();
  const [addressingCertId, setAddressingCertId] = useState<string | null>(null);
  const [addressingCertName, setAddressingCertName] = useState("");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalStaff = stats?.totalStaff ?? 0;
  const terminatedStaff = stats?.terminatedStaff ?? 0;
  const todayPresent = stats?.todayPresent ?? 0;
  const pendingLeaves = stats?.pendingLeaves ?? 0;
  const staffByDepartment: { department: string; count: number }[] = stats?.staffByDepartment ?? [];
  const staffByRole: { role: string; count: number }[] = stats?.staffByRole ?? [];
  const attendanceSummary: { status: string; count: number }[] = stats?.attendanceSummary ?? [];
  const leaveSummary: { status: string; count: number }[] = stats?.leaveSummary ?? [];
  const expiredCerts: { id: string; staffId: string; staffName: string; department: string; certName: string; expiryDate: string; status: string }[] = stats?.expiredCerts ?? [];

  const attendancePct = totalStaff > 0 ? Math.round((todayPresent / totalStaff) * 100) : 0;

  const deptChartData = staffByDepartment
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map((d) => ({ name: d.department?.length > 14 ? d.department.slice(0, 14) + "\u2026" : (d.department || "Unassigned"), count: d.count }));

  const roleChartData = staffByRole.map((r) => ({ name: r.role || "Unknown", value: r.count }));

  // Summarize period attendance
  const attMap: Record<string, number> = {};
  attendanceSummary.forEach((a) => { attMap[a.status] = a.count; });
  const periodPresent = (attMap["Present"] || 0) + (attMap["Late"] || 0);
  const periodAbsent = attMap["Absent"] || 0;
  const periodLeave = attMap["OnLeave"] || 0;

  // Summarize period leaves
  const leaveMap: Record<string, number> = {};
  leaveSummary.forEach((l) => { leaveMap[l.status] = l.count; });

  return (
    <div className="space-y-6">
      {/* Period filter */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Hospital overview and key metrics</p>
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {PERIODS.map(({ key, label }) => (
            <Button key={key} variant={period === key ? "default" : "ghost"} size="sm" className="text-xs h-7" onClick={() => setPeriod(key)}>
              {label}
            </Button>
          ))}
        </div>
      </div>
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Users} label="Current Employees" value={totalStaff} sub="Active staff" />
        <KpiCard icon={UserX} label="Terminated" value={terminatedStaff} sub="Inactive records" />
        <KpiCard icon={ClipboardCheck} label="Attendance Today" value={`${attendancePct}%`} sub={`${todayPresent} of ${totalStaff} present`} />
        <KpiCard icon={Calendar} label="Pending Leaves" value={pendingLeaves} sub="Awaiting approval" accent={pendingLeaves > 0} />
      </div>

      {/* Period Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Period Summary — {PERIODS.find(p => p.key === period)?.label}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <div><p className="text-xs text-muted-foreground">Present Days</p><p className="text-lg font-bold text-green-600">{periodPresent}</p></div>
            <div><p className="text-xs text-muted-foreground">Absent Days</p><p className="text-lg font-bold text-red-600">{periodAbsent}</p></div>
            <div><p className="text-xs text-muted-foreground">On Leave</p><p className="text-lg font-bold text-amber-600">{periodLeave}</p></div>
            <div><p className="text-xs text-muted-foreground">Leaves Approved</p><p className="text-lg font-bold text-green-600">{leaveMap["Approved"] || 0}</p></div>
            <div><p className="text-xs text-muted-foreground">Leaves Pending</p><p className="text-lg font-bold text-amber-600">{leaveMap["Pending"] || 0}</p></div>
            <div><p className="text-xs text-muted-foreground">Leaves Rejected</p><p className="text-lg font-bold text-red-600">{leaveMap["Rejected"] || 0}</p></div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Staff by Department */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Staff by Department</CardTitle>
          </CardHeader>
          <CardContent>
            {deptChartData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No department data</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={deptChartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0d9488" radius={[8, 8, 0, 0]} barSize={36} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Staff by Role */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Staff by Role</CardTitle>
          </CardHeader>
          <CardContent>
            {roleChartData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No role data</p>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie data={roleChartData} cx="50%" cy="45%" innerRadius={50} outerRadius={90} paddingAngle={4} dataKey="value" isAnimationActive={false} label={({ cx, cy, midAngle, outerRadius, name, percent }: any) => {
                    const RADIAN = Math.PI / 180;
                    const radius = outerRadius + 28;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    return <text x={x} y={y} textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" fontSize={11} fill="#555">{`${name} ${Math.round((percent ?? 0) * 100)}%`}</text>;
                  }} labelLine={{ stroke: "#999", strokeWidth: 1 }}>
                    {roleChartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Expired / Expiring Certifications Alert */}
      {expiredCerts.length > 0 && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <ShieldAlert size={18} />
              Expired / Expiring Certifications
              <Badge variant="destructive" className="ml-1">{expiredCerts.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expiredCerts.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-3 p-2.5 rounded-lg border bg-card">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`inline-block h-2.5 w-2.5 rounded-full shrink-0 ${c.status === "Expired" ? "bg-red-500" : "bg-amber-500"}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{c.certName}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {c.staffName} · {c.department} · Expires {c.expiryDate}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={c.status === "Expired" ? "destructive" : "outline"} className="text-[10px]">
                      {c.status}
                    </Badge>
                    {hasPermission("staff:write") && (
                      <Button
                        variant="outline" size="sm" className="gap-1.5 h-7 text-xs"
                        onClick={() => { setAddressingCertId(c.id); setAddressingCertName(`${c.certName} (${c.staffName})`); }}
                      >
                        <CheckCircle2 size={12} /> Addressed
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mark Addressed Confirmation */}
      <Dialog open={!!addressingCertId} onOpenChange={() => setAddressingCertId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Mark as Addressed
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Are you sure you want to mark <strong>{addressingCertName}</strong> as addressed? It will be cleared from this alert list.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddressingCertId(null)} disabled={addressCert.isPending}>Cancel</Button>
            <Button onClick={() => { if (addressingCertId) { addressCert.mutate(addressingCertId); setAddressingCertId(null); } }} disabled={addressCert.isPending}>
              {addressCert.isPending ? "Saving..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, sub, accent }: { icon: any; label: string; value: string | number; sub: string; accent?: boolean }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${accent ? "text-amber-600" : ""}`}>{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{sub}</p>
      </CardContent>
    </Card>
  );
}
