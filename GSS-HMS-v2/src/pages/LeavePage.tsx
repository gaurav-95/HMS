import { useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLeaveRequests, useApplyLeave, useUpdateLeaveStatus, useCancelLeave, useStaff, useLeaveTypes, useCreateLeaveType, useDeleteLeaveType } from "@/hooks/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Plus, Loader2, Search, Filter, XCircle, Trash2, Settings } from "lucide-react";
import { ExportButtons } from "@/components/ExportButtons";

const blankForm = {
  staffId: "",
  staffName: "",
  type: "Casual" as string,
  startDate: "",
  endDate: "",
  reason: "",
};

export default function LeavePage() {
  const { hasPermission, user } = useAuth();
  const { data: leaves = [], isLoading } = useLeaveRequests();
  const { data: staffList = [] } = useStaff();
  const { data: leaveTypesData = [] } = useLeaveTypes();
  const applyLeave = useApplyLeave();
  const updateLeaveStatus = useUpdateLeaveStatus();
  const cancelLeave = useCancelLeave();
  const createLeaveType = useCreateLeaveType();
  const deleteLeaveType = useDeleteLeaveType();
  const canApprove = hasPermission("leave:approve");
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const isAdmin = user?.role === "ADMIN";
  const isLeader = user?.role === "LEADER";
  const isStaff = user?.role === "STAFF";

  const leaveTypeNames = (leaveTypesData as any[]).map((t: any) => t.name as string);

  const allLeaves = leaves as any[];
  const allStaff = staffList as any[];

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [showApply, setShowApply] = useState(false);
  const [showTypeManager, setShowTypeManager] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [form, setForm] = useState(blankForm);

  const filtered = useMemo(() => {
    return allLeaves.filter((l: any) => {
      const matchSearch = !search || l.staffName?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "all" || l.status === filterStatus;
      const matchType = filterType === "all" || l.type === filterType;
      return matchSearch && matchStatus && matchType;
    });
  }, [allLeaves, search, filterStatus, filterType]);

  const pendingCount = allLeaves.filter((l: any) => l.status === "Pending").length;
  const approvedCount = allLeaves.filter((l: any) => l.status === "Approved").length;
  const rejectedCount = allLeaves.filter((l: any) => l.status === "Rejected").length;

  const handleStaffSelect = (staffId: string) => {
    const s = allStaff.find((m: any) => m.id === staffId);
    setForm((f) => ({ ...f, staffId, staffName: s?.name || "" }));
  };

  const handleApply = () => {
    if (!form.staffId || !form.startDate || !form.endDate || !form.reason) return;
    if (form.endDate < form.startDate) return;
    applyLeave.mutate({
      staffId: form.staffId,
      staffName: form.staffName,
      type: form.type,
      startDate: form.startDate,
      endDate: form.endDate,
      reason: form.reason,
    }, {
      onSuccess: () => { setShowApply(false); setForm(blankForm); },
    });
  };

  // Calculate days between dates
  const daysBetween = (start: string, end: string) => {
    if (!start || !end) return 0;
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1);
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Leave Management</h1>
          <p className="text-muted-foreground">Apply for leave, track status, and manage approvals</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButtons
            title="Leave Report"
            columns={["Employee", "Type", "From", "To", "Days", "Reason", "Status", "Approved By"]}
            rows={filtered.map((l: any) => [l.staffName, l.type, l.startDate, l.endDate, daysBetween(l.startDate, l.endDate), l.reason, l.status, l.approvedBy || "—"])}
          />
          {hasPermission("leave:apply") && (
            <Button onClick={() => setShowApply(true)} className="gap-2">
              <Plus size={16} /> Apply for Leave
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {leaveTypeNames.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        {isSuperAdmin && (
          <Button variant="outline" size="sm" onClick={() => setShowTypeManager(true)} className="gap-1.5">
            <Settings size={14} /> Manage Types
          </Button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Total Requests</p><p className="text-2xl font-bold">{allLeaves.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Pending</p><p className="text-2xl font-bold text-amber-600">{pendingCount}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Approved</p><p className="text-2xl font-bold text-green-600">{approvedCount}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Rejected</p><p className="text-2xl font-bold text-red-600">{rejectedCount}</p></CardContent></Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" /> Leave Requests
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((l: any) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.staffName}</TableCell>
                  <TableCell><Badge variant="secondary">{l.type}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{l.startDate}</TableCell>
                  <TableCell className="text-muted-foreground">{l.endDate}</TableCell>
                  <TableCell>{daysBetween(l.startDate, l.endDate)}</TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px] truncate">{l.reason}</TableCell>
                  <TableCell>
                    <Badge variant={l.status === "Approved" ? "success" : l.status === "Rejected" ? "destructive" : l.status === "Cancelled" ? "secondary" : "warning"}>
                      {l.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {l.status === "Pending" && canApprove && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => updateLeaveStatus.mutate({ id: l.id, status: "Approved" })}>
                            Approve
                          </Button>
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => updateLeaveStatus.mutate({ id: l.id, status: "Rejected" })}>
                            Reject
                          </Button>
                        </>
                      )}
                      {l.status === "Pending" && hasPermission("leave:apply") && (
                        <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => cancelLeave.mutate(l.id)}>
                          <XCircle className="h-4 w-4 mr-1" /> Cancel
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No leave requests match filters</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Apply Leave Modal */}
      <Dialog open={showApply} onOpenChange={setShowApply}>
        <DialogContent>
          <DialogHeader><DialogTitle>Apply for Leave</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Staff Member</Label>
              {(isAdmin || isStaff) ? (
                // Admin and Staff can only apply leave for themselves
                <Select value={form.staffId} onValueChange={handleStaffSelect}>
                  <SelectTrigger><SelectValue placeholder="Select staff member" /></SelectTrigger>
                  <SelectContent>
                    {allStaff.filter((s: any) => s.userId === user?.id && s.isActive !== false).map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>{s.name} — {s.department}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : isLeader ? (
                // Leader can apply for staff in their department
                <Select value={form.staffId} onValueChange={handleStaffSelect}>
                  <SelectTrigger><SelectValue placeholder="Select staff member" /></SelectTrigger>
                  <SelectContent>
                    {allStaff.filter((s: any) => s.isActive !== false && s.department === user?.department).map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>{s.name} — {s.department}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                // Super Admin can apply for anyone
                <Select value={form.staffId} onValueChange={handleStaffSelect}>
                  <SelectTrigger><SelectValue placeholder="Select staff member" /></SelectTrigger>
                  <SelectContent>
                    {allStaff.filter((s: any) => s.isActive !== false).map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>{s.name} — {s.department}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label>Leave Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {leaveTypeNames.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={form.endDate} min={form.startDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
              </div>
            </div>
            {form.startDate && form.endDate && (
              <p className="text-sm text-muted-foreground">Duration: {daysBetween(form.startDate, form.endDate)} day(s)</p>
            )}
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} rows={3} placeholder="Reason for leave..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApply(false)}>Cancel</Button>
            <Button onClick={handleApply} disabled={!form.staffId || !form.startDate || !form.endDate || !form.reason || applyLeave.isPending}>
              {applyLeave.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Submit Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Leave Type Manager (Super Admin) */}
      <Dialog open={showTypeManager} onOpenChange={setShowTypeManager}>
        <DialogContent>
          <DialogHeader><DialogTitle>Manage Leave Types</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex gap-2">
              <Input placeholder="New leave type name" value={newTypeName} onChange={(e) => setNewTypeName(e.target.value)} />
              <Button onClick={() => { if (newTypeName.trim()) { createLeaveType.mutate({ name: newTypeName.trim() }); setNewTypeName(""); } }} disabled={!newTypeName.trim()}>
                <Plus size={16} className="mr-1" /> Add
              </Button>
            </div>
            <div className="space-y-2">
              {(leaveTypesData as any[]).map((t: any) => (
                <div key={t.id} className="flex items-center justify-between rounded-lg border p-3">
                  <span className="font-medium">{t.name}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteLeaveType.mutate(t.id)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
              {(leaveTypesData as any[]).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No leave types configured</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
