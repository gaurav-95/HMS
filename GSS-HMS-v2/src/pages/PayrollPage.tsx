import { useState, useMemo } from "react";
import { usePayroll, useCreatePayroll, useUpdatePayrollStatus, useDeletePayroll, useStaff } from "@/hooks/queries";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Search, Filter, Trash2, ArrowRight } from "lucide-react";
import { ExportButtons } from "@/components/ExportButtons";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { formatCurrency } from "@/lib/utils";
import { useSearchParams } from "react-router-dom";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const currentMonth = MONTHS[new Date().getMonth()];
const currentYear = new Date().getFullYear().toString();

const STATUS_FLOW: Record<string, string> = { Draft: "Processed", Processed: "Approved", Approved: "Paid" };

const blankForm = {
  staffId: "",
  staffName: "",
  month: currentMonth,
  year: currentYear,
  baseSalary: 0,
  bonus: 0,
  deductions: 0,
  netSalary: 0,
  status: "Draft",
};

export default function PayrollPage() {
  const { data: payroll = [], isLoading } = usePayroll();
  const { data: staffList = [] } = useStaff();
  const { hasPermission } = useAuth();
  const createPayroll = useCreatePayroll();
  const updatePayrollStatus = useUpdatePayrollStatus();
  const deletePayroll = useDeletePayroll();

  const allPayroll = payroll as any[];
  const allStaff = staffList as any[];

  const [searchParams] = useSearchParams();
  const staffIdFromUrl = searchParams.get("staff") || "";

  const [search, setSearch] = useState("");
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blankForm);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  // Auto-compute net salary
  const netSalary = (form.baseSalary || 0) + (form.bonus || 0) - (form.deductions || 0);

  const filtered = useMemo(() => {
    return allPayroll.filter((p: any) => {
      const matchSearch = !search || p.staffName?.toLowerCase().includes(search.toLowerCase());
      const matchMonth = filterMonth === "all" || p.month === filterMonth;
      const matchStatus = filterStatus === "all" || p.status === filterStatus;
      const matchStaffUrl = !staffIdFromUrl || p.staffId === staffIdFromUrl;
      return matchSearch && matchMonth && matchStatus && matchStaffUrl;
    });
  }, [allPayroll, search, filterMonth, filterStatus, staffIdFromUrl]);

  const totalGross = filtered.reduce((sum: number, p: any) => sum + (p.baseSalary || 0) + (p.bonus || 0), 0);
  const totalNet = filtered.reduce((sum: number, p: any) => sum + (p.netSalary || 0), 0);
  const totalDeductions = filtered.reduce((sum: number, p: any) => sum + (p.deductions || 0), 0);

  const staffMap = useMemo(() => {
    const map: Record<string, any> = {};
    allStaff.forEach((s: any) => { map[s.id] = s; });
    return map;
  }, [allStaff]);

  const urlStaffName = staffIdFromUrl ? staffMap[staffIdFromUrl]?.name : null;

  const handleStaffSelect = (staffId: string) => {
    const s = allStaff.find((m: any) => m.id === staffId);
    if (s) {
      const base = s.baseSalary || 0;
      setForm((f) => ({
        ...f,
        staffId,
        staffName: s.name,
        baseSalary: base,
        netSalary: base + (f.bonus || 0) - (f.deductions || 0),
      }));
    }
  };

  const handleSubmit = () => {
    if (!form.staffId) return;
    createPayroll.mutate({
      ...form,
      netSalary,
    }, { onSuccess: () => { setOpen(false); setForm(blankForm); } });
  };

  const handleStatusChange = (id: string, currentStatus: string) => {
    const nextStatus = STATUS_FLOW[currentStatus];
    if (nextStatus) {
      updatePayrollStatus.mutate({ id, status: nextStatus });
    }
  };

  const handleDelete = () => {
    if (deleteTarget) {
      deletePayroll.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
    }
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Monthly Payroll</h1>
          <p className="text-muted-foreground">
            {urlStaffName ? `Showing payroll for ${urlStaffName}` : "Salary processing and disbursement"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButtons
            title="Monthly Payroll"
            columns={["Employee", "Month", "Year", "Base Salary", "Bonus", "Deductions", "Net Salary", "Status"]}
            rows={filtered.map((p: any) => [p.staffName || "", p.month || "", p.year || "", p.baseSalary ?? 0, p.bonus ?? 0, p.deductions ?? 0, p.netSalary ?? 0, p.status || ""])}
          />
          {hasPermission("payroll:write") && (
            <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Create Payroll</Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterMonth} onValueChange={setFilterMonth}>
          <SelectTrigger className="w-[150px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger>
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
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Gross Payroll</p><p className="text-2xl font-bold">{formatCurrency(totalGross)}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Total Deductions</p><p className="text-2xl font-bold text-red-600">{formatCurrency(totalDeductions)}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Net Payroll</p><p className="text-2xl font-bold text-green-600">{formatCurrency(totalNet)}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Records</p><p className="text-2xl font-bold">{filtered.length}</p></CardContent></Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader><CardTitle>Payroll Records</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Base Salary</TableHead>
                <TableHead className="text-right">Bonus</TableHead>
                <TableHead className="text-right">Deductions</TableHead>
                <TableHead className="text-right">Net Salary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p: any) => {
                const nextStatus = STATUS_FLOW[p.status];
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.staffName}</TableCell>
                    <TableCell>{p.month} {p.year}</TableCell>
                    <TableCell className="text-right">{formatCurrency(p.baseSalary)}</TableCell>
                    <TableCell className="text-right text-green-600">{formatCurrency(p.bonus)}</TableCell>
                    <TableCell className="text-right text-red-600">{formatCurrency(p.deductions)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(p.netSalary)}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === "Paid" ? "success" : p.status === "Approved" ? "info" : p.status === "Processed" ? "secondary" : "warning"}>
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {nextStatus && hasPermission("payroll:approve") && (
                          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => handleStatusChange(p.id, p.status)}>
                            <ArrowRight className="h-3 w-3 mr-1" /> {nextStatus}
                          </Button>
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
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No payroll records match filters</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Payroll Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Payroll Entry</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Staff Member</Label>
              <Select value={form.staffId} onValueChange={handleStaffSelect}>
                <SelectTrigger><SelectValue placeholder="Select staff member" /></SelectTrigger>
                <SelectContent>
                  {allStaff.filter((s: any) => s.isActive !== false).map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>{s.name} — {s.department}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Month</Label>
                <Select value={form.month} onValueChange={(v) => setForm((f) => ({ ...f, month: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{MONTHS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Input value={form.year} onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Base Salary</Label>
                <Input type="number" value={form.baseSalary} onChange={(e) => setForm((f) => ({ ...f, baseSalary: Number(e.target.value) }))} />
              </div>
              <div className="space-y-2">
                <Label>Bonus</Label>
                <Input type="number" value={form.bonus} onChange={(e) => setForm((f) => ({ ...f, bonus: Number(e.target.value) }))} />
              </div>
              <div className="space-y-2">
                <Label>Deductions</Label>
                <Input type="number" value={form.deductions} onChange={(e) => setForm((f) => ({ ...f, deductions: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="bg-muted rounded-md p-3 text-center">
              <span className="text-sm text-muted-foreground">Net Salary: </span>
              <span className="text-lg font-bold">{formatCurrency(netSalary)}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!form.staffId || createPayroll.isPending}>
              {createPayroll.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Create Entry
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
