import { useState, useMemo } from "react";
import { useStaff, usePerformanceEvaluations, useCreatePerformanceEval, useDeletePerformanceEval } from "@/hooks/queries";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, TrendingUp, TrendingDown, Award, Plus, Trash2 } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { ExportButtons } from "@/components/ExportButtons";
import { EVALUATION_CRITERIA } from "@/constants";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function PerformancePage() {
  const { data: staff = [], isLoading } = useStaff();
  const { data: evaluations = [], isLoading: evalsLoading } = usePerformanceEvaluations();
  const createEval = useCreatePerformanceEval();
  const deleteEval = useDeletePerformanceEval();
  const { hasPermission } = useAuth();

  const allStaff = staff as any[];
  const allEvals = evaluations as any[];

  const [showEvalDialog, setShowEvalDialog] = useState(false);
  const [evalForm, setEvalForm] = useState({
    staffId: "",
    staffName: "",
    period: "",
    responsible: 3,
    engaged: 3,
    selfStarter: 3,
    teamPlayer: 3,
    challenged: 3,
    employeeOriented: 3,
    comments: "",
  });

  const handleCreateEval = () => {
    if (!evalForm.staffId || !evalForm.period) return;
    createEval.mutate(evalForm, {
      onSuccess: () => {
        setShowEvalDialog(false);
        setEvalForm({ staffId: "", staffName: "", period: "", responsible: 3, engaged: 3, selfStarter: 3, teamPlayer: 3, challenged: 3, employeeOriented: 3, comments: "" });
      },
    });
  };

  // Build radar data from evaluations
  const evalRadarData = useMemo(() => {
    if (allEvals.length === 0) return [];
    return EVALUATION_CRITERIA.map((c) => ({
      subject: c.label,
      value: Math.round(allEvals.reduce((sum: number, e: any) => sum + (e[c.key] || 0), 0) / allEvals.length * 20), // scale 1-5 → 0-100
    }));
  }, [allEvals]);

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

  if (isLoading || evalsLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

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

      {/* ── Behavioral Evaluations ───────────────────────── */}
      <div className="flex items-center justify-between pt-4">
        <h2 className="text-lg font-semibold">Behavioral Evaluations</h2>
        {hasPermission("performance:write") && (
          <Button size="sm" onClick={() => setShowEvalDialog(true)} className="gap-1">
            <Plus size={14} /> New Evaluation
          </Button>
        )}
      </div>

      {/* Evaluation Radar */}
      {evalRadarData.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Average Behavioral Scores</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={evalRadarData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis domain={[0, 100]} />
                <Radar name="Avg Score" dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Evaluation Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Period</TableHead>
                {EVALUATION_CRITERIA.map((c) => <TableHead key={c.key} className="text-center">{c.label}</TableHead>)}
                <TableHead className="text-center">Overall</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allEvals.map((ev: any) => (
                <TableRow key={ev.id}>
                  <TableCell className="font-medium">{ev.staffName}</TableCell>
                  <TableCell>{ev.period}</TableCell>
                  {EVALUATION_CRITERIA.map((c) => (
                    <TableCell key={c.key} className="text-center">
                      <Badge variant={ev[c.key] >= 4 ? "success" : ev[c.key] >= 3 ? "secondary" : "warning"}>{ev[c.key]}/5</Badge>
                    </TableCell>
                  ))}
                  <TableCell className="text-center font-semibold">{(ev.overallScore || 0).toFixed(1)}</TableCell>
                  <TableCell className="text-right">
                    {hasPermission("performance:write") && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteEval.mutate(ev.id)}>
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {allEvals.length === 0 && (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No evaluations yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Evaluation Dialog */}
      <Dialog open={showEvalDialog} onOpenChange={setShowEvalDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Behavioral Evaluation</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Staff Member</Label>
              <Select value={evalForm.staffId} onValueChange={(v) => {
                const s = allStaff.find((m: any) => m.id === v);
                setEvalForm((f) => ({ ...f, staffId: v, staffName: s?.name || "" }));
              }}>
                <SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger>
                <SelectContent>
                  {allStaff.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Evaluation Period</Label>
              <Input value={evalForm.period} onChange={(e) => setEvalForm((f) => ({ ...f, period: e.target.value }))} placeholder="e.g. Q1 2025, Jan 2025" />
            </div>
            {EVALUATION_CRITERIA.map((c) => (
              <div key={c.key} className="flex items-center justify-between">
                <Label className="text-sm">{c.label}</Label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Button
                      key={n}
                      type="button"
                      variant={(evalForm as any)[c.key] === n ? "default" : "outline"}
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setEvalForm((f) => ({ ...f, [c.key]: n }))}
                    >
                      {n}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
            <div className="space-y-2">
              <Label>Comments</Label>
              <Textarea value={evalForm.comments} onChange={(e) => setEvalForm((f) => ({ ...f, comments: e.target.value }))} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEvalDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateEval} disabled={!evalForm.staffId || !evalForm.period || createEval.isPending}>
              {createEval.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Submit Evaluation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
