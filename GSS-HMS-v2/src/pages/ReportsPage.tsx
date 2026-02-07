import { useMemo } from "react";
import { useDashboardStats, useStaff, usePatients, usePayroll, useBilling, useAttendance } from "@/hooks/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, Users, IndianRupee, Activity } from "lucide-react";
import { ExportButtons } from "@/components/ExportButtons";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area,
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

export default function ReportsPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: staffData = [], isLoading: staffLoading } = useStaff();
  const { data: patientData = [], isLoading: patLoading } = usePatients();
  const { data: payrollData = [], isLoading: payLoading } = usePayroll();
  const { data: billingData = [] } = useBilling();
  const { data: attendanceData = [] } = useAttendance();

  const allStaff = staffData as any[];
  const allPatients = patientData as any[];
  const allPayroll = payrollData as any[];
  const allBilling = billingData as any[];
  const allAttendance = attendanceData as any[];

  const isLoading = statsLoading || staffLoading || patLoading || payLoading;

  // Department distribution
  const deptDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    allStaff.forEach((s: any) => { map[s.department] = (map[s.department] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [allStaff]);

  // Patient demographics (gender)
  const genderData = useMemo(() => {
    const map: Record<string, number> = {};
    allPatients.forEach((p: any) => { map[p.gender] = (map[p.gender] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [allPatients]);

  // Monthly revenue from billing
  const monthlyRevenue = useMemo(() => {
    const map: Record<string, number> = {};
    allBilling.filter((b: any) => b.status === "Paid").forEach((b: any) => {
      const month = b.createdDate?.slice(0, 7) || "Unknown";
      map[month] = (map[month] || 0) + (b.totalAmount || 0);
    });
    return Object.entries(map).sort().map(([month, amount]) => ({ month, amount }));
  }, [allBilling]);

  // Payroll by month
  const payrollByMonth = useMemo(() => {
    const map: Record<string, { base: number; bonus: number; deductions: number; net: number }> = {};
    allPayroll.forEach((p: any) => {
      const key = p.month || "Unknown";
      if (!map[key]) map[key] = { base: 0, bonus: 0, deductions: 0, net: 0 };
      map[key].base += p.baseSalary || 0;
      map[key].bonus += p.bonus || 0;
      map[key].deductions += p.deductions || 0;
      map[key].net += p.netSalary || 0;
    });
    return Object.entries(map).sort().map(([month, v]) => ({ month, ...v }));
  }, [allPayroll]);

  // Attendance stats
  const attendanceStats = useMemo(() => {
    const map: Record<string, number> = {};
    allAttendance.forEach((a: any) => { map[a.status] = (map[a.status] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [allAttendance]);

  // Export summary
  const exportRows = [
    ["Total Staff", String(allStaff.length)],
    ["Total Patients", String(allPatients.length)],
    ["Total Payroll Records", String(allPayroll.length)],
    ["Total Invoices", String(allBilling.length)],
    ["Revenue (Paid)", `₹${allBilling.filter((b: any) => b.status === "Paid").reduce((s: number, b: any) => s + (b.totalAmount || 0), 0).toLocaleString("en-IN")}`],
    ["Attendance Records", String(allAttendance.length)],
  ];

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const s = stats as any;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">Comprehensive hospital analytics and reports</p>
        </div>
        <ExportButtons title="Hospital Summary Report" columns={["Metric", "Value"]} rows={exportRows} />
      </div>

      {/* KPI summary */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="pt-4 pb-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100"><Users className="h-5 w-5 text-blue-600" /></div>
          <div><p className="text-sm text-muted-foreground">Total Staff</p><p className="text-2xl font-bold">{s?.totalStaff ?? allStaff.length}</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-100"><Activity className="h-5 w-5 text-green-600" /></div>
          <div><p className="text-sm text-muted-foreground">Total Patients</p><p className="text-2xl font-bold">{s?.totalPatients ?? allPatients.length}</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-100"><TrendingUp className="h-5 w-5 text-purple-600" /></div>
          <div><p className="text-sm text-muted-foreground">Invoices</p><p className="text-2xl font-bold">{allBilling.length}</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-100"><IndianRupee className="h-5 w-5 text-amber-600" /></div>
          <div><p className="text-sm text-muted-foreground">Revenue</p><p className="text-2xl font-bold">₹{allBilling.filter((b: any) => b.status === "Paid").reduce((s: number, b: any) => s + (b.totalAmount || 0), 0).toLocaleString("en-IN")}</p></div>
        </CardContent></Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Department Distribution */}
        <Card>
          <CardHeader><CardTitle className="text-base">Staff by Department</CardTitle></CardHeader>
          <CardContent>
            {deptDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={deptDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }: any) => `${name} (${value})`}>
                    {deptDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground py-12">No data</p>}
          </CardContent>
        </Card>

        {/* Patient demographics */}
        <Card>
          <CardHeader><CardTitle className="text-base">Patient Gender Distribution</CardTitle></CardHeader>
          <CardContent>
            {genderData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={genderData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }: any) => `${name} (${value})`}>
                    {genderData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground py-12">No data</p>}
          </CardContent>
        </Card>

        {/* Monthly Revenue */}
        <Card>
          <CardHeader><CardTitle className="text-base">Monthly Revenue</CardTitle></CardHeader>
          <CardContent>
            {monthlyRevenue.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={monthlyRevenue}>
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString("en-IN")}`} />
                  <Area type="monotone" dataKey="amount" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground py-12">No revenue data yet</p>}
          </CardContent>
        </Card>

        {/* Payroll monthly breakdown */}
        <Card>
          <CardHeader><CardTitle className="text-base">Monthly Payroll Breakdown</CardTitle></CardHeader>
          <CardContent>
            {payrollByMonth.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={payrollByMonth}>
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString("en-IN")}`} />
                  <Legend />
                  <Bar dataKey="base" name="Base" fill="#3b82f6" stackId="a" />
                  <Bar dataKey="bonus" name="Bonus" fill="#10b981" stackId="a" />
                  <Bar dataKey="deductions" name="Deductions" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground py-12">No payroll data</p>}
          </CardContent>
        </Card>

        {/* Attendance breakdown */}
        <Card>
          <CardHeader><CardTitle className="text-base">Attendance Overview</CardTitle></CardHeader>
          <CardContent>
            {attendanceStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={attendanceStats}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" name="Count" radius={[4, 4, 0, 0]}>
                    {attendanceStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground py-12">No attendance data</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
