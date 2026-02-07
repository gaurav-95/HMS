import { useMemo } from "react";
import { useStaff } from "@/hooks/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, TrendingUp, TrendingDown, Award } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { ExportButtons } from "@/components/ExportButtons";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function PerformancePage() {
  const { data: staff = [], isLoading } = useStaff();

  const allStaff = staff as any[];

  // Aggregated KPI data across staff
  const { avgScores, topPerformers, departmentAvg, radarData, exportRows } = useMemo(() => {
    const staffWithKpis = allStaff.filter((m: any) => m.kpis && m.kpis.length > 0);

    // Average KPI score per staff (overall %)
    const avgScores = staffWithKpis.map((m: any) => {
      const avg = m.kpis.reduce((sum: number, k: any) => sum + (Number(k.value) || 0), 0) / m.kpis.length;
      return { name: m.name.split(" ")[0], avg: Math.round(avg), department: m.department };
    }).sort((a: any, b: any) => b.avg - a.avg);

    // Top 5 performers
    const topPerformers = avgScores.slice(0, 5);

    // Department averages
    const deptMap: Record<string, number[]> = {};
    avgScores.forEach((s: any) => {
      if (!deptMap[s.department]) deptMap[s.department] = [];
      deptMap[s.department].push(s.avg);
    });
    const departmentAvg = Object.entries(deptMap).map(([dept, vals]) => ({
      department: dept,
      average: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
    }));

    // Radar chart: gather all unique KPI names and average their values
    const kpiMap: Record<string, number[]> = {};
    staffWithKpis.forEach((m: any) => {
      m.kpis.forEach((k: any) => {
        const label = k.label || k.name;
        if (!kpiMap[label]) kpiMap[label] = [];
        kpiMap[label].push(Number(k.value) || 0);
      });
    });
    const radarData = Object.entries(kpiMap).slice(0, 8).map(([label, vals]) => ({
      subject: label,
      value: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
    }));

    // Export rows
    const exportRows = staffWithKpis.map((m: any) => {
      const avg = m.kpis.reduce((sum: number, k: any) => sum + (Number(k.value) || 0), 0) / m.kpis.length;
      return [m.name, m.department, m.role, m.kpis.map((k: any) => `${k.label || k.name}: ${k.value}%`).join("; "), `${Math.round(avg)}%`];
    });

    return { avgScores, topPerformers, departmentAvg, radarData, exportRows };
  }, [allStaff]);

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const overallAvg = avgScores.length > 0 ? Math.round(avgScores.reduce((s, a) => s + a.avg, 0) / avgScores.length) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Performance Tracker</h1>
          <p className="text-muted-foreground">KPI monitoring and staff performance metrics</p>
        </div>
        <ExportButtons
          title="Performance Report"
          columns={["Name", "Department", "Role", "KPIs", "Average"]}
          rows={exportRows}
        />
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="pt-4 pb-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100"><TrendingUp className="h-5 w-5 text-blue-600" /></div>
          <div><p className="text-sm text-muted-foreground">Average Score</p><p className="text-2xl font-bold">{overallAvg}%</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-100"><Award className="h-5 w-5 text-green-600" /></div>
          <div><p className="text-sm text-muted-foreground">High Performers (&ge;90%)</p><p className="text-2xl font-bold text-green-600">{avgScores.filter(s => s.avg >= 90).length}</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-100"><TrendingDown className="h-5 w-5 text-amber-600" /></div>
          <div><p className="text-sm text-muted-foreground">Need Improvement (&lt;60%)</p><p className="text-2xl font-bold text-amber-600">{avgScores.filter(s => s.avg < 60).length}</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-100"><TrendingUp className="h-5 w-5 text-purple-600" /></div>
          <div><p className="text-sm text-muted-foreground">Tracked Staff</p><p className="text-2xl font-bold">{avgScores.length}</p></div>
        </CardContent></Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bar chart — Staff scores */}
        <Card>
          <CardHeader><CardTitle className="text-base">Staff KPI Scores</CardTitle></CardHeader>
          <CardContent>
            {avgScores.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={avgScores.slice(0, 12)}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(v: any) => `${v}%`} />
                  <Bar dataKey="avg" name="Score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-12">No KPI data available</p>
            )}
          </CardContent>
        </Card>

        {/* Radar chart — KPI dimensions */}
        <Card>
          <CardHeader><CardTitle className="text-base">KPI Dimensions (Averages)</CardTitle></CardHeader>
          <CardContent>
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis domain={[0, 100]} />
                  <Radar name="Average" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-12">No KPI data available</p>
            )}
          </CardContent>
        </Card>

        {/* Department performance pie */}
        <Card>
          <CardHeader><CardTitle className="text-base">Department Performance</CardTitle></CardHeader>
          <CardContent>
            {departmentAvg.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={departmentAvg} dataKey="average" nameKey="department" cx="50%" cy="50%" outerRadius={100} label={({ department, average }: any) => `${department} (${average}%)`}>
                    {departmentAvg.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-12">No department data</p>
            )}
          </CardContent>
        </Card>

        {/* Top performers */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Award className="h-4 w-4" /> Top Performers</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {topPerformers.map((t: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${i === 0 ? "bg-yellow-100 text-yellow-700" : i === 1 ? "bg-gray-100 text-gray-700" : i === 2 ? "bg-orange-100 text-orange-700" : "bg-muted text-muted-foreground"}`}>{i + 1}</div>
                <div className="flex-1"><p className="text-sm font-medium">{t.name}</p><p className="text-xs text-muted-foreground">{t.department}</p></div>
                <Badge variant={t.avg >= 90 ? "success" : t.avg >= 75 ? "secondary" : "warning"}>{t.avg}%</Badge>
              </div>
            ))}
            {topPerformers.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No performance data</p>}
          </CardContent>
        </Card>
      </div>

      {/* Individual Staff KPIs */}
      <h2 className="text-lg font-semibold pt-2">Individual Staff KPIs</h2>
      <div className="grid gap-6 lg:grid-cols-2">
        {allStaff.map((member: any) => (
          <Card key={member.id}>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={member.imageUrl} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-base">{member.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary">{member.role}</Badge>
                    <Badge variant="outline">{member.department}</Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {(member.kpis || []).map((kpi: any) => {
                const val = Math.min(Number(kpi.value) || 0, 100);
                return (
                  <div key={kpi.id || kpi.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium truncate mr-2">{kpi.label}</span>
                      <span className="text-sm font-semibold shrink-0">{kpi.value}%</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          val >= 90 ? "bg-green-500" : val >= 75 ? "bg-blue-500" : val >= 60 ? "bg-amber-500" : "bg-red-500"
                        }`}
                        style={{ width: `${val}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {(!member.kpis || member.kpis.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">No KPI data available</p>
              )}
            </CardContent>
          </Card>
        ))}
        {allStaff.length === 0 && (
          <Card className="col-span-2">
            <CardContent className="py-12 text-center text-muted-foreground">No staff data available</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
