import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDashboardStats, useAddressCertification, useAddressHospitalLicense, useUploadHospitalLicense } from "@/hooks/queries";
import { useAuth } from "@/context/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Users, ClipboardCheck, Calendar, Loader2, ShieldAlert, CheckCircle2, Building2, Upload, Download } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useTranslation } from "react-i18next";

import type { HospitalLicense } from "@/types";

const CHART_COLORS = ["#0d9488", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6", "#ec4899", "#10b981", "#f97316"];
const PERIOD_KEYS = [
  { key: "monthly",   labelKey: "dashboard.thisMonth" },
  { key: "quarterly", labelKey: "dashboard.thisQuarter" },
  { key: "yearly",    labelKey: "dashboard.thisYear" },
] as const;

export default function DashboardPage() {
  const [period, setPeriod] = useState<string>("monthly");
  const { data: stats, isLoading } = useDashboardStats(period);
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const addressCert = useAddressCertification();
  const addressLicense = useAddressHospitalLicense();
  const uploadLicense = useUploadHospitalLicense();
  const [addressingCertId, setAddressingCertId] = useState<string | null>(null);
  const [addressingCertName, setAddressingCertName] = useState("");
  const [addressingLicenseId, setAddressingLicenseId] = useState<string | null>(null);
  const [addressingLicenseName, setAddressingLicenseName] = useState("");
  const [uploadingLicenseId, setUploadingLicenseId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const downloadLicenseFile = useCallback(async (licId: string, licName: string) => {
    setDownloadingId(licId);
    try {
      const token = localStorage.getItem("auth-token") ?? "";
      const isTauri = window.location.protocol === "tauri:" ||
        (window.location.protocol === "https:" && window.location.hostname === "tauri.localhost");
      const base = isTauri ? "http://localhost:3001" : "";
      const resp = await fetch(`${base}/api/hospital-licenses/${licId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) return;
      const blob = await resp.blob();
      const ext = blob.type.includes("pdf") ? ".pdf" : blob.type.includes("png") ? ".png" : ".jpg";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${licName}${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDownloadingId(null);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalStaff = stats?.totalStaff ?? 0;
  const todayPresent = stats?.todayPresent ?? 0;
  const pendingLeaves = stats?.pendingLeaves ?? 0;
  const staffByDepartment: { department: string; count: number }[] = stats?.staffByDepartment ?? [];
  const staffByRole: { role: string; count: number }[] = stats?.staffByRole ?? [];
  const attendanceSummary: { status: string; count: number }[] = stats?.attendanceSummary ?? [];
  const leaveSummary: { status: string; count: number }[] = stats?.leaveSummary ?? [];
  const expiredCerts: { id: string; staffId: string; staffName: string; department: string; certName: string; expiryDate: string; status: string }[] = stats?.expiredCerts ?? [];
  const hospitalLicenses: HospitalLicense[] = stats?.hospitalLicenses ?? [];
  const attendanceByDept: { department: string; present: number; absent: number; onLeave: number }[] = stats?.attendanceByDept ?? [];

  const attendancePct = totalStaff > 0 ? Math.round((todayPresent / totalStaff) * 100) : 0;

  const deptChartData = staffByDepartment
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map((d) => ({ name: d.department?.length > 14 ? d.department.slice(0, 14) + "\u2026" : (d.department || "Unassigned"), count: d.count }));

  const roleChartData = staffByRole.map((r) => ({ name: r.role || "Unknown", value: r.count }));

  // Summarize period attendance (for fallback when no dept data)
  const attMap: Record<string, number> = {};
  attendanceSummary.forEach((a) => { attMap[a.status] = a.count; });

  // Summarize period leaves
  const leaveMap: Record<string, number> = {};
  leaveSummary.forEach((l) => { leaveMap[l.status] = l.count; });

  return (
    <div className="space-y-8">
      {/* Period filter */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">{t("dashboard.title")}</h1>
          <p className="text-muted-foreground">{t("dashboard.subtitle")}</p>
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {PERIOD_KEYS.map(({ key, labelKey }) => (
            <Button key={key} variant={period === key ? "default" : "ghost"} size="sm" className="text-xs h-7" onClick={() => setPeriod(key)}>
              {t(labelKey)}
            </Button>
          ))}
        </div>
      </div>
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        <KpiCard icon={Users} label={t("dashboard.currentEmployees")} value={totalStaff} sub={t("dashboard.activeStaff")} onClick={() => navigate("/staff")} />
        <KpiCard icon={ClipboardCheck} label={t("dashboard.attendanceToday")} value={`${attendancePct}%`} sub={t("dashboard.presentToday", { present: todayPresent, total: totalStaff })} onClick={() => navigate("/attendance")} />
        <KpiCard icon={Calendar} label={t("dashboard.pendingLeaves")} value={pendingLeaves} sub={t("dashboard.awaitingApproval")} accent={pendingLeaves > 0} onClick={() => navigate("/leave")} />
      </div>

      {/* Period Summary by Department */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("dashboard.periodSummary", { period: t(PERIOD_KEYS.find(p => p.key === period)?.labelKey ?? "dashboard.thisMonth") })}</CardTitle>
        </CardHeader>
        <CardContent>
          {attendanceByDept.length === 0 ? (
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-6">
              <div><p className="text-xs text-muted-foreground">{t("dashboard.presentDays")}</p><p className="text-lg font-bold text-green-600">{attMap["Present"] || 0}</p></div>
              <div><p className="text-xs text-muted-foreground">{t("dashboard.absentDays")}</p><p className="text-lg font-bold text-red-600">{attMap["Absent"] || 0}</p></div>
              <div><p className="text-xs text-muted-foreground">{t("dashboard.onLeave")}</p><p className="text-lg font-bold text-amber-600">{attMap["OnLeave"] || 0}</p></div>
              <div><p className="text-xs text-muted-foreground">{t("dashboard.leavesApproved")}</p><p className="text-lg font-bold text-green-600">{leaveMap["Approved"] || 0}</p></div>
              <div><p className="text-xs text-muted-foreground">{t("dashboard.leavesPending")}</p><p className="text-lg font-bold text-amber-600">{leaveMap["Pending"] || 0}</p></div>
              <div><p className="text-xs text-muted-foreground">{t("dashboard.leavesRejected")}</p><p className="text-lg font-bold text-red-600">{leaveMap["Rejected"] || 0}</p></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-medium text-muted-foreground">{t("dashboard.department")}</th>
                    <th className="text-right py-2 px-3 font-medium text-green-700">{t("dashboard.present")}</th>
                    <th className="text-right py-2 px-3 font-medium text-red-700">{t("dashboard.absent")}</th>
                    <th className="text-right py-2 px-3 font-medium text-amber-700">{t("dashboard.onLeave")}</th>
                    <th className="text-right py-2 pl-3 font-medium text-muted-foreground">{t("dashboard.totals")}</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceByDept.map((row) => (
                    <tr key={row.department} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-1.5 pr-4 font-medium">{row.department || "—"}</td>
                      <td className="text-right py-1.5 px-3 text-green-600 font-semibold">{row.present}</td>
                      <td className="text-right py-1.5 px-3 text-red-600 font-semibold">{row.absent}</td>
                      <td className="text-right py-1.5 px-3 text-amber-600 font-semibold">{row.onLeave}</td>
                      <td className="text-right py-1.5 pl-3 text-muted-foreground">{row.present + row.absent + row.onLeave}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t font-bold bg-muted/20">
                    <td className="py-1.5 pr-4">{t("dashboard.totals")}</td>
                    <td className="text-right py-1.5 px-3 text-green-700">{attendanceByDept.reduce((s, r) => s + r.present, 0)}</td>
                    <td className="text-right py-1.5 px-3 text-red-700">{attendanceByDept.reduce((s, r) => s + r.absent, 0)}</td>
                    <td className="text-right py-1.5 px-3 text-amber-700">{attendanceByDept.reduce((s, r) => s + r.onLeave, 0)}</td>
                    <td className="text-right py-1.5 pl-3 text-muted-foreground">
                      {attendanceByDept.reduce((s, r) => s + r.present + r.absent + r.onLeave, 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Staff by Department */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("dashboard.staffByDepartment")}</CardTitle>
          </CardHeader>
          <CardContent>
            {deptChartData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">{t("dashboard.noDepartmentData")}</p>
            ) : (
              <div className="h-[300px] lg:h-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deptChartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0d9488" radius={[8, 8, 0, 0]} barSize={45} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Staff by Role */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("dashboard.staffByRole")}</CardTitle>
          </CardHeader>
          <CardContent>
            {roleChartData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">{t("dashboard.noRoleData")}</p>
            ) : (
              <div className="h-[320px] lg:h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={roleChartData} cx="50%" cy="45%" innerRadius={65} outerRadius={115} paddingAngle={4} dataKey="value" isAnimationActive={false} label={({ cx, cy, midAngle, outerRadius, name, percent }: any) => {
                    const RADIAN = Math.PI / 180;
                    const radius = outerRadius + 32;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    return <text x={x} y={y} textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" fontSize={11} fill="#555">{`${name} ${Math.round((percent ?? 0) * 100)}%`}</text>;
                  }} labelLine={{ stroke: "#999", strokeWidth: 1 }}>
                    {roleChartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 16 }} />
                </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hospital Licenses Alert */}
      {hospitalLicenses.filter(l => l.status !== "Valid" && l.status !== "N/A" && !l.addressed).length > 0 && (
        <Card className="border-amber-400/40 bg-amber-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-amber-700 cursor-pointer hover:underline" onClick={() => navigate("/licenses")}>
              <Building2 size={18} />
              Hospital Licenses &amp; Registrations
              <Badge variant="outline" className="ml-1 border-amber-500 text-amber-700">
                {t("dashboard.needAttention", { count: hospitalLicenses.filter(l => l.status !== "Valid" && l.status !== "N/A" && !l.addressed).length })}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {hospitalLicenses
                .filter(l => l.status !== "Valid" && l.status !== "N/A" && !l.addressed)
                .map((lic) => (
                  <div key={lic.id} className="flex items-center justify-between gap-3 p-2.5 rounded-lg border bg-card">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`inline-block h-2.5 w-2.5 rounded-full shrink-0 ${lic.status === "Expired" ? "bg-red-500" : "bg-amber-500"}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{lic.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {lic.category}{lic.licenseNumber ? ` · ${lic.licenseNumber}` : ""}{lic.expiryDate ? ` · Expires ${lic.expiryDate}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <Badge variant={lic.status === "Expired" ? "destructive" : "outline"} className="text-[10px]">{lic.status}</Badge>
                      {lic.filePath && (
                        <Button
                          variant="outline" size="sm" className="gap-1.5 h-7 text-xs"
                          onClick={() => downloadLicenseFile(lic.id, lic.name)}
                          disabled={downloadingId === lic.id}
                        >
                          {downloadingId === lic.id ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />} {t("common.download")}
                        </Button>
                      )}
                      {hasPermission("staff:write") && (
                        <Button
                          variant="outline" size="sm" className="gap-1.5 h-7 text-xs"
                          onClick={() => { setUploadingLicenseId(lic.id); fileInputRef.current?.click(); }}
                        >
                          <Upload size={12} /> {t("common.upload")}
                        </Button>
                      )}
                      {hasPermission("staff:write") && (
                        <Button
                          variant="outline" size="sm" className="gap-1.5 h-7 text-xs"
                          onClick={() => { setAddressingLicenseId(lic.id); setAddressingLicenseName(lic.name); }}
                        >
                          <CheckCircle2 size={12} /> Addressed
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
            {/* Hidden file input for license upload */}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && uploadingLicenseId) {
                  uploadLicense.mutate({ id: uploadingLicenseId, file });
                }
                setUploadingLicenseId(null);
                e.target.value = "";
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Expired / Expiring Certifications Alert */}
      {expiredCerts.length > 0 && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-destructive cursor-pointer hover:underline" onClick={() => navigate("/licenses?tab=certifications")}>
              <ShieldAlert size={18} />
              Expired / Expiring Staff Certifications
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
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Badge variant={c.status === "Expired" ? "destructive" : "outline"} className="text-[10px]">
                      {c.status}
                    </Badge>
                    {hasPermission("staff:write") && (
                      <Button
                        variant="outline" size="sm" className="gap-1.5 h-7 text-xs"
                        onClick={() => { setAddressingCertId(c.id); setAddressingCertName(`${c.certName} (${c.staffName})`); }}
                      >
                        <CheckCircle2 size={12} /> {t("dashboard.address")}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mark License Addressed Confirmation */}
      <Dialog open={!!addressingLicenseId} onOpenChange={() => setAddressingLicenseId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Mark License as Addressed
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Mark <strong>{addressingLicenseName}</strong> as addressed? It will be cleared from this alert list.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddressingLicenseId(null)} disabled={addressLicense.isPending}>{t("common.cancel")}</Button>
            <Button onClick={() => { if (addressingLicenseId) { addressLicense.mutate(addressingLicenseId); setAddressingLicenseId(null); } }} disabled={addressLicense.isPending}>
              {addressLicense.isPending ? t("common.loading") : t("common.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark Cert Addressed Confirmation */}
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
            <Button variant="outline" onClick={() => setAddressingCertId(null)} disabled={addressCert.isPending}>{t("common.cancel")}</Button>
            <Button onClick={() => { if (addressingCertId) { addressCert.mutate(addressingCertId); setAddressingCertId(null); } }} disabled={addressCert.isPending}>
              {addressCert.isPending ? t("common.loading") : t("common.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, sub, accent, onClick }: { icon: any; label: string; value: string | number; sub: string; accent?: boolean; onClick?: () => void }) {
  return (
    <Card className={onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""} onClick={onClick}>
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
