import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import { useDashboardStats, usePatients, useLabTests, useInventory, useStaff } from "@/hooks/queries";
import { Users, TestTubeDiagonal, AlertTriangle, ClipboardCheck, Megaphone, Clock, Loader2, TrendingUp, Package, ShieldAlert, Pill, IndianRupee } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatCurrency, formatDate } from "@/lib/utils";

const CHART_COLORS = ["#0d9488", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6", "#ec4899", "#10b981", "#f97316"];

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useDashboardStats();
  const { data: patients = [] } = usePatients();
  const { data: labTests = [] } = useLabTests();
  const { data: inventory = [] } = useInventory();
  const { data: staffData = [] } = useStaff();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalStaff = stats?.totalStaff ?? 0;
  const pendingTests = stats?.pendingTests ?? 0;
  const expiringDocs = stats?.expiringDocs ?? 0;
  const todayAttendance = stats?.todayAttendance ?? 0;
  const waitingTokens = stats?.waitingTokens ?? 0;
  const activeAnnouncements = stats?.announcements ?? [];
  const recentTests = stats?.recentTests ?? [];
  const expiringCerts: any[] = stats?.expiringCerts ?? [];
  const discrepancyCount: number = stats?.discrepancyCount ?? 0;
  const penaltySummary: any[] = stats?.penaltySummary ?? [];

  // ─── Chart data ─────────────────────────────────────────
  const allStaff = staffData as any[];
  const allTests = labTests as any[];
  const allInventory = inventory as any[];
  const allPatients = patients as any[];

  // Department-wise staff distribution
  const deptMap: Record<string, number> = {};
  allStaff.forEach((s: any) => { deptMap[s.department] = (deptMap[s.department] || 0) + 1; });
  const deptChartData = Object.entries(deptMap).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, count]) => ({ name: name.length > 12 ? name.slice(0, 12) + "…" : name, count }));

  // Lab test status distribution (pie)
  const testStatusMap: Record<string, number> = {};
  allTests.forEach((t: any) => { testStatusMap[t.status] = (testStatusMap[t.status] || 0) + 1; });
  const testPieData = Object.entries(testStatusMap).map(([name, value]) => ({ name, value }));

  // Inventory category distribution (pie)
  const invCatMap: Record<string, number> = {};
  allInventory.forEach((i: any) => { invCatMap[i.category] = (invCatMap[i.category] || 0) + 1; });
  const invPieData = Object.entries(invCatMap).map(([name, value]) => ({ name, value }));

  // Patient registrations trend (last 7 months)
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();
  const patientTrend = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (6 - i), 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const count = allPatients.filter((p: any) => p.createdAt?.startsWith(monthKey)).length;
    return { month: monthNames[d.getMonth()], patients: count };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Hospital overview and key metrics</p>
      </div>

      {/* Compliance Alert Banner */}
      {expiringDocs > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold text-amber-800">Compliance Alert</h3>
            <p className="text-sm text-amber-700">
              <span className="font-medium">{expiringDocs} certification(s)</span> expired or expiring soon — require immediate attention.
            </p>
          </div>
        </div>
      )}

      {/* Medicine Discrepancy Alert */}
      {discrepancyCount > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <Pill className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold text-red-800">Medicine Discrepancy Alert</h3>
            <p className="text-sm text-red-700">
              <span className="font-medium">{discrepancyCount} flagged discrepanc{discrepancyCount === 1 ? "y" : "ies"}</span> — administered medicines don't match prescriptions. Review immediately.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalStaff}</div>
            <p className="text-xs text-muted-foreground">Active employees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Tests</CardTitle>
            <TestTubeDiagonal className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingTests}</div>
            <p className="text-xs text-muted-foreground">Awaiting processing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Doc Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{expiringDocs}</div>
            <p className="text-xs text-muted-foreground">Expired or expiring soon</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Attendance</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{todayAttendance}</div>
            <p className="text-xs text-muted-foreground">Present today</p>
          </CardContent>
        </Card>
      </div>

      {/* OPD Queue + Announcements Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* OPD Queue Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              OPD Queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <div className="text-4xl font-bold text-primary">{waitingTokens}</div>
              <p className="text-sm text-muted-foreground mt-1">Patients waiting today</p>
            </div>
          </CardContent>
        </Card>

        {/* Announcements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              Announcements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeAnnouncements.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No active announcements</p>
            )}
            {activeAnnouncements.slice(0, 3).map((a: any) => (
              <div key={a.id} className="flex items-start gap-3 rounded-lg border p-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm">{a.title}</h4>
                    <Badge variant={a.type === "Penalty" ? "destructive" : a.type === "Policy" ? "warning" : "secondary"}>
                      {a.type}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{a.content}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Lab Tests */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Lab Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTests.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No recent tests</p>
            )}
            {recentTests.map((test: any) => (
              <div key={test.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium text-sm">{test.testName}</p>
                  <p className="text-xs text-muted-foreground">{test.patientName} — {test.category}</p>
                </div>
                <Badge
                  variant={test.status === "Completed" ? "success" : test.status === "InProgress" ? "info" : "warning"}
                >
                  {test.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* License Expiration Details + Penalty Summary Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* License Expiration Alert Detail */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-600" />
              License / Certification Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expiringCerts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">All certifications are up-to-date</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff</TableHead>
                    <TableHead>Certification</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expiringCerts.slice(0, 10).map((c: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium text-sm">{c.staffName}</TableCell>
                      <TableCell className="text-sm">{c.certName}</TableCell>
                      <TableCell className="text-sm">{formatDate(c.expiryDate)}</TableCell>
                      <TableCell>
                        <Badge variant={c.status === "Expired" ? "destructive" : "warning"}>
                          {c.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Penalty Auto-Calculation Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-red-600" />
              Absence Penalty Summary (This Month)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {penaltySummary.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No penalties calculated this month</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff</TableHead>
                    <TableHead>Absences</TableHead>
                    <TableHead>Penalty Rule</TableHead>
                    <TableHead className="text-right">Deduction</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {penaltySummary.slice(0, 10).map((p: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium text-sm">{p.staffName}</TableCell>
                      <TableCell>
                        <Badge variant={p.absences > (p.limit || 3) ? "destructive" : "secondary"}>
                          {p.absences} day{p.absences !== 1 ? "s" : ""}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.penaltyRule || "Default"}</TableCell>
                      <TableCell className="text-right font-bold text-red-600">{formatCurrency(p.deduction)}</TableCell>
                    </TableRow>
                  ))}
                  {penaltySummary.length > 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-right font-bold">Total Deductions</TableCell>
                      <TableCell className="text-right font-bold text-red-600">
                        {formatCurrency(penaltySummary.reduce((s: number, p: any) => s + (p.deduction || 0), 0))}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── Analytics Charts ──────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Staff by Department Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Staff by Department</CardTitle>
          </CardHeader>
          <CardContent>
            {deptChartData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No staff data</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={deptChartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Patient Registration Trend Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Patient Registrations (7 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={patientTrend} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="patients" stroke="#0d9488" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Lab Test Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TestTubeDiagonal className="h-5 w-5" /> Lab Test Status</CardTitle>
          </CardHeader>
          <CardContent>
            {testPieData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No test data</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={testPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={100} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                    {testPieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Inventory by Category Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> Inventory by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {invPieData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No inventory data</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={invPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={100} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                    {invPieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[(i + 3) % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
