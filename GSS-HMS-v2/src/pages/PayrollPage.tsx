import { useState, useMemo, useEffect } from "react";
import { usePayroll, useGeneratePayroll, useUpdatePayrollStatus, useDeletePayroll, useStaff } from "@/hooks/queries";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Search, Filter, Trash2, ArrowRight, Zap, RotateCcw, ChevronUp, ChevronDown, ChevronsUpDown, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { ExportButtons } from "@/components/ExportButtons";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { formatCurrency } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Tip } from "@/components/ui/tooltip";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const currentMonth = MONTHS[new Date().getMonth()];
const currentYear = new Date().getFullYear().toString();
const STATUS_FLOW: Record<string, string> = { Draft: "Processed", Processed: "Approved", Approved: "Paid" };
const STATUS_REVERSE: Record<string, string> = { Processed: "Draft", Approved: "Processed", Paid: "Approved" };

export default function PayrollPage() {
  const { data: payroll = [], isLoading } = usePayroll();
  const { data: staffList = [] } = useStaff();
  const { hasPermission, user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const generatePayroll = useGeneratePayroll();
  const updatePayrollStatus = useUpdatePayrollStatus();
  const deletePayroll = useDeletePayroll();

  const allPayroll = payroll as any[];
  const allStaff = staffList as any[];

  const [search, setSearch] = useState("");
  const [filterMonth, setFilterMonth] = useState<string>(currentMonth);
  const [filterYear, setFilterYear] = useState<string>(currentYear);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [genMonth, setGenMonth] = useState(currentMonth);
  const [genYear, setGenYear] = useState(currentYear);
  const [showGenerate, setShowGenerate] = useState(false);
  const [selectedStaffIds, setSelectedStaffIds] = useState<Set<string>>(new Set());
  const [filterDept, setFilterDept] = useState<string>("all");
  const [deptSort, setDeptSort] = useState<"asc" | "desc" | null>(null);
  const [actionTarget, setActionTarget] = useState<{ record: any; nextStatus: string; isUndo: boolean } | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  // Active staff for the generate dialog
  const activeStaff = useMemo(() => allStaff.filter((s: any) => s.isActive !== false && !s.terminationDate), [allStaff]);

  // When dialog opens, select all staff by default
  const openGenerateDialog = () => {
    setSelectedStaffIds(new Set(activeStaff.map((s: any) => s.id)));
    setShowGenerate(true);
  };

  const toggleStaff = (id: string) => {
    setSelectedStaffIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedStaffIds.size === activeStaff.length) {
      setSelectedStaffIds(new Set());
    } else {
      setSelectedStaffIds(new Set(activeStaff.map((s: any) => s.id)));
    }
  };

  // Extract distinct years from data for the year dropdown
  const availableYears = useMemo(() => {
    const yrs = new Set(allPayroll.map((p: any) => p.year).filter(Boolean));
    yrs.add(currentYear);
    return [...yrs].sort((a, b) => Number(b) - Number(a));
  }, [allPayroll]);

  const availableDepts = useMemo(() => {
    const fromStaff = allStaff.map((s: any) => s.department).filter(Boolean);
    const fromPayroll = allPayroll.map((p: any) => p.department).filter(Boolean);
    const depts = new Set([...fromStaff, ...fromPayroll]);
    return [...depts].sort() as string[];
  }, [allStaff, allPayroll]);

  const filtered = useMemo(() => {
    let list = allPayroll.filter((p: any) => {
      const matchSearch = !search || p.staffName?.toLowerCase().includes(search.toLowerCase());
      const matchMonth = filterMonth === "all" || p.month === filterMonth;
      const matchYear = filterYear === "all" || p.year === filterYear;
      const matchStatus = filterStatus === "all" || p.status === filterStatus;
      const matchDept = filterDept === "all" || p.department === filterDept;
      return matchSearch && matchMonth && matchYear && matchStatus && matchDept;
    });
    if (deptSort) {
      list = [...list].sort((a, b) => {
        const da = (a.department || "").toLowerCase();
        const db = (b.department || "").toLowerCase();
        return deptSort === "asc" ? da.localeCompare(db) : db.localeCompare(da);
      });
    }
    return list;
  }, [allPayroll, search, filterMonth, filterYear, filterStatus, filterDept, deptSort]);

  useEffect(() => { setPage(1); }, [search, filterMonth, filterYear, filterStatus, filterDept, deptSort]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);

  const totalGross = filtered.reduce((s: number, p: any) => s + (p.grossSalary || 0), 0);
  const totalNet = filtered.reduce((s: number, p: any) => s + (p.netSalary || 0), 0);
  const totalDeductions = filtered.reduce((s: number, p: any) => s + (p.deductions || 0), 0);

  const handleConfirmAction = () => {
    if (actionTarget) {
      updatePayrollStatus.mutate(
        { id: actionTarget.record.id, status: actionTarget.nextStatus },
        { onSuccess: () => setActionTarget(null) },
      );
    }
  };

  const handleGenerate = () => {
    const staffIds = [...selectedStaffIds];
    generatePayroll.mutate(
      { month: genMonth, year: genYear, staffIds: staffIds.length === activeStaff.length ? undefined : staffIds },
      { onSuccess: () => setShowGenerate(false) },
    );
  };

  const handleDelete = () => {
    if (deleteTarget) deletePayroll.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Monthly Payroll</h1>
          <p className="text-muted-foreground">Indian salary structure &mdash; auto-generated from attendance</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButtons
            title="Monthly Payroll"
            columns={isSuperAdmin ? ["Employee", "Department", "Month", "Year", "Basic", "HRA", "EPF (Employer)", "Other Allowance", "Gross Salary", "Prof. Tax", "EPF (Employee)", "Leave Ded.", "Net Salary", "Shifts", "Attended", "Leaves", "Status"] : ["Employee", "Department", "Month", "Year", "Shifts", "Attended", "Leaves", "Status"]}
            rows={filtered.map((p: any) => isSuperAdmin
              ? [p.staffName, p.department || "", p.month, p.year, p.basicSalary || 0, p.hra || 0, p.epfEmployer || 0, p.otherAllowance || 0, p.grossSalary || 0, p.professionalTax || 0, p.epfEmployee || 0, p.leaveDeductions || 0, p.netSalary || 0, p.totalShifts || 0, p.attendedShifts || 0, p.leavesTaken || 0, p.status]
              : [p.staffName, p.department || "", p.month, p.year, p.totalShifts || 0, p.attendedShifts || 0, p.leavesTaken || 0, p.status]
            )}
          />
          {hasPermission("payroll:write") && (
            <Tip content="Auto-calculate salary for selected staff based on their attendance records">
              <Button onClick={openGenerateDialog} className="gap-1.5"><Zap size={16} /> Generate Payroll</Button>
            </Tip>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterYear} onValueChange={setFilterYear}>
          <SelectTrigger className="w-[120px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {availableYears.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterMonth} onValueChange={setFilterMonth}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Months</SelectItem>
            {MONTHS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
            <SelectItem value="Processed">Processed</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="Paid">Paid</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterDept} onValueChange={setFilterDept}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Departments" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {availableDepts.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Summary cards */}
      {filterDept !== "all" && (
        <p className="text-sm text-muted-foreground">Showing results for <strong>{filterDept}</strong></p>
      )}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Gross Payroll{filterDept !== "all" ? ` · ${filterDept}` : ""}</p><p className="text-2xl font-bold">{isSuperAdmin ? formatCurrency(totalGross) : "—"}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Total Deductions{filterDept !== "all" ? ` · ${filterDept}` : ""}</p><p className="text-2xl font-bold text-red-600">{isSuperAdmin ? formatCurrency(totalDeductions) : "—"}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Net Payroll{filterDept !== "all" ? ` · ${filterDept}` : ""}</p><p className="text-2xl font-bold text-green-600">{isSuperAdmin ? formatCurrency(totalNet) : "—"}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Records{filterDept !== "all" ? ` · ${filterDept}` : ""}</p><p className="text-2xl font-bold">{filtered.length}</p></CardContent></Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader><CardTitle>Payroll Records</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead
                  className="cursor-pointer select-none whitespace-nowrap hover:bg-muted/50 transition-colors"
                  onClick={() => setDeptSort((s) => s === "asc" ? "desc" : s === "desc" ? null : "asc")}
                >
                  <span className="flex items-center gap-1 font-semibold">
                    Dept
                    {deptSort === "asc" ? <ChevronUp className="h-4 w-4 text-primary" /> : deptSort === "desc" ? <ChevronDown className="h-4 w-4 text-primary" /> : <ChevronsUpDown className="h-4 w-4" />}
                  </span>
                </TableHead>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Basic</TableHead>
                <TableHead className="text-right">HRA</TableHead>
                <TableHead className="text-right">Other</TableHead>
                <TableHead className="text-right">Gross</TableHead>
                <TableHead className="text-right">EPF</TableHead>
                <TableHead className="text-right">PT</TableHead>
                <TableHead className="text-right">Leave Ded.</TableHead>
                <TableHead className="text-right">Net Salary</TableHead>
                <TableHead className="text-center">Shifts</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((p: any) => {
                const nextStatus = STATUS_FLOW[p.status];
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.staffName}</TableCell>
                    <TableCell>{p.department || "—"}</TableCell>
                    <TableCell>{p.month} {p.year}</TableCell>
                    <TableCell className="text-right">{isSuperAdmin ? formatCurrency(p.basicSalary || 0) : "—"}</TableCell>
                    <TableCell className="text-right">{isSuperAdmin ? formatCurrency(p.hra || 0) : "—"}</TableCell>
                    <TableCell className="text-right">{isSuperAdmin ? formatCurrency(p.otherAllowance || 0) : "—"}</TableCell>
                    <TableCell className="text-right font-medium">{isSuperAdmin ? formatCurrency(p.grossSalary || 0) : "—"}</TableCell>
                    <TableCell className="text-right text-red-600">{isSuperAdmin ? formatCurrency(p.epfEmployee || 0) : "—"}</TableCell>
                    <TableCell className="text-right text-red-600">{isSuperAdmin ? formatCurrency(p.professionalTax || 0) : "—"}</TableCell>
                    <TableCell className="text-right text-red-600">{isSuperAdmin ? formatCurrency(p.leaveDeductions || 0) : "—"}</TableCell>
                    <TableCell className="text-right font-bold">{isSuperAdmin ? formatCurrency(p.netSalary || 0) : "—"}</TableCell>
                    <TableCell className="text-center">{p.attendedShifts ?? 0}/{p.totalShifts ?? 0}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === "Paid" ? "success" : p.status === "Approved" ? "info" : p.status === "Processed" ? "secondary" : "warning"}>
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {nextStatus && hasPermission("payroll:approve") && (
                          <Tip content={`Advance status: ${p.status} → ${nextStatus}`}>
                            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setActionTarget({ record: p, nextStatus, isUndo: false })}>
                              <ArrowRight className="h-3 w-3 mr-1" /> {nextStatus}
                            </Button>
                          </Tip>
                        )}
                        {isSuperAdmin && STATUS_REVERSE[p.status] && (
                          <Tip content={`Undo: revert ${p.status} → ${STATUS_REVERSE[p.status]}`}>
                            <Button variant="ghost" size="sm" className="h-8 text-xs text-amber-600 hover:text-amber-700" onClick={() => setActionTarget({ record: p, nextStatus: STATUS_REVERSE[p.status], isUndo: true })}>
                              <RotateCcw className="h-3 w-3 mr-1" /> Undo
                            </Button>
                          </Tip>
                        )}
                        {p.status === "Draft" && hasPermission("payroll:write") && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget(p)}>
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={14} className="text-center py-8 text-muted-foreground">No payroll records match filters</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
          </div>
          {filtered.length > PAGE_SIZE && (
            <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-muted-foreground">
              <span>Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} records</span>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                    if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push("...");
                    acc.push(p); return acc;
                  }, [])
                  .map((p, i) => p === "..." ? (
                    <span key={`e-${i}`} className="px-2">…</span>
                  ) : (
                    <Button key={p} variant={page === p ? "default" : "outline"} size="icon" className="h-8 w-8" onClick={() => setPage(p as number)}>{p}</Button>
                  ))}
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generate Payroll Dialog */}
      <Dialog open={showGenerate} onOpenChange={setShowGenerate}>
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader><DialogTitle>Generate Monthly Payroll</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Auto-calculate salary based on attendance data. Existing records for selected month won't be duplicated.</p>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-2">
              <Label>Month</Label>
              <Select value={genMonth} onValueChange={setGenMonth}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{MONTHS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Year</Label>
              <Input value={genYear} onChange={(e) => setGenYear(e.target.value)} />
            </div>
          </div>

          {/* Staff Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Select Staff ({selectedStaffIds.size} of {activeStaff.length})</Label>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={toggleAll}>
                {selectedStaffIds.size === activeStaff.length ? "Deselect All" : "Select All"}
              </Button>
            </div>
            <div className="border rounded-md max-h-[240px] overflow-y-auto">
              {activeStaff.map((s: any) => (
                <label key={s.id} className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer border-b last:border-b-0">
                  <Checkbox checked={selectedStaffIds.has(s.id)} onCheckedChange={() => toggleStaff(s.id)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.department} &middot; {s.role}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{isSuperAdmin ? formatCurrency(s.baseSalary) : "—"}</span>
                </label>
              ))}
              {activeStaff.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No active staff</p>}
            </div>
          </div>

          <div className="bg-muted rounded-md p-3 text-sm space-y-1">
            <p><strong>Salary structure:</strong></p>
            <p>Basic Salary + HRA (50%) + Other Allowance (47%)</p>
            <p>Deductions: EPF Employee + Professional Tax + Leave Deductions</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerate(false)}>Cancel</Button>
            <Button onClick={handleGenerate} disabled={generatePayroll.isPending || selectedStaffIds.size === 0}>
              {generatePayroll.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Zap size={16} className="mr-1" />}
              Generate ({selectedStaffIds.size})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Confirmation Dialog */}
      <Dialog open={!!actionTarget} onOpenChange={() => !updatePayrollStatus.isPending && setActionTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 ${actionTarget?.isUndo ? "text-amber-600" : ""}`}>
              {actionTarget?.isUndo
                ? <><RotateCcw className="h-5 w-5" /> Undo Payroll Status</>
                : <><ArrowRight className="h-5 w-5" /> Advance Payroll Status</>}
            </DialogTitle>
          </DialogHeader>
          <div className="py-3 space-y-3">
            <p className="text-sm text-muted-foreground">
              {actionTarget?.isUndo ? "Revert" : "Advance"} payroll record for{" "}
              <strong>{actionTarget?.record?.staffName}</strong>{" "}
              ({actionTarget?.record?.month} {actionTarget?.record?.year})?
            </p>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant={actionTarget?.record?.status === "Paid" ? "success" : actionTarget?.record?.status === "Approved" ? "info" : actionTarget?.record?.status === "Processed" ? "secondary" : "warning"}>
                {actionTarget?.record?.status}
              </Badge>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <Badge variant={actionTarget?.nextStatus === "Paid" ? "success" : actionTarget?.nextStatus === "Approved" ? "info" : actionTarget?.nextStatus === "Processed" ? "secondary" : "warning"}>
                {actionTarget?.nextStatus}
              </Badge>
            </div>
            {actionTarget?.isUndo && (
              <p className="text-xs text-amber-600 flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" /> This reverses an approved action. Use with caution.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionTarget(null)} disabled={updatePayrollStatus.isPending}>Cancel</Button>
            <Button
              variant={actionTarget?.isUndo ? "destructive" : "default"}
              onClick={handleConfirmAction}
              disabled={updatePayrollStatus.isPending}
            >
              {updatePayrollStatus.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {actionTarget?.isUndo ? "Undo" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <DeleteConfirmationDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        entityName={deleteTarget?.staffName || ""}
        entityType="payroll entry"
        isPending={deletePayroll.isPending}
      />
    </div>
  );
}
