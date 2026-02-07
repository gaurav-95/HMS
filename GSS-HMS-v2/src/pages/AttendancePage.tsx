import { useState, useMemo } from "react";
import { useAttendance, useCreateAttendance, useStaff } from "@/hooks/queries";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClipboardCheck, Loader2, Plus, Search, Filter } from "lucide-react";
import { ExportButtons } from "@/components/ExportButtons";

const today = new Date().toISOString().split("T")[0];

const ATTENDANCE_STATUSES = ["Present", "Absent", "Late", "HalfDay", "OnLeave"] as const;

const blankRecord = {
  staffId: "",
  staffName: "",
  date: today,
  status: "Present" as string,
  checkIn: "09:00",
  checkOut: "17:00",
};

export default function AttendancePage() {
  const { data: records = [], isLoading } = useAttendance();
  const { data: staffList = [] } = useStaff();
  const { hasPermission } = useAuth();
  const createAttendance = useCreateAttendance();

  const allRecords = records as any[];
  const allStaff = staffList as any[];

  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState(today);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blankRecord);

  const filtered = useMemo(() => {
    return allRecords.filter((a: any) => {
      const matchSearch = !search || a.staffName?.toLowerCase().includes(search.toLowerCase());
      const matchDate = !filterDate || a.date === filterDate;
      const matchStatus = filterStatus === "all" || a.status === filterStatus;
      return matchSearch && matchDate && matchStatus;
    });
  }, [allRecords, search, filterDate, filterStatus]);

  const present = filtered.filter((a: any) => a.status === "Present").length;
  const absent = filtered.filter((a: any) => a.status === "Absent").length;
  const late = filtered.filter((a: any) => a.status === "Late").length;

  const handleStaffSelect = (staffId: string) => {
    const s = allStaff.find((m: any) => m.id === staffId);
    setForm((f) => ({ ...f, staffId, staffName: s?.name || "" }));
  };

  const handleSubmit = () => {
    if (!form.staffId || !form.date) return;
    createAttendance.mutate(form, { onSuccess: () => { setOpen(false); setForm(blankRecord); } });
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Attendance</h1>
          <p className="text-muted-foreground">Daily attendance tracking and history</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButtons
            title="Attendance Report"
            columns={["Employee", "Date", "Check In", "Check Out", "Status"]}
            rows={filtered.map((a: any) => [a.staffName || "", a.date || "", a.checkIn || "—", a.checkOut || "—", a.status || ""])}
          />
          {hasPermission("attendance:mark") && (
            <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Mark Attendance</Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="w-[180px]" />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {ATTENDANCE_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Present</p><p className="text-2xl font-bold text-green-600">{present}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Absent</p><p className="text-2xl font-bold text-red-600">{absent}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Late</p><p className="text-2xl font-bold text-amber-600">{late}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Total Records</p><p className="text-2xl font-bold">{filtered.length}</p></CardContent></Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" /> Attendance — {filterDate || "All Dates"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((a: any) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.staffName}</TableCell>
                  <TableCell className="text-muted-foreground">{a.date}</TableCell>
                  <TableCell>{a.checkIn || "—"}</TableCell>
                  <TableCell>{a.checkOut || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={a.status === "Present" ? "success" : a.status === "Late" ? "warning" : "destructive"}>{a.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No attendance records match filters</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mark Attendance Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Mark Attendance</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Staff Member</Label>
              <Select value={form.staffId} onValueChange={handleStaffSelect}>
                <SelectTrigger><SelectValue placeholder="Select staff member" /></SelectTrigger>
                <SelectContent>
                  {allStaff.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name} — {s.department}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ATTENDANCE_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Check In</Label>
                <Input type="time" value={form.checkIn} onChange={(e) => setForm((f) => ({ ...f, checkIn: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Check Out</Label>
                <Input type="time" value={form.checkOut} onChange={(e) => setForm((f) => ({ ...f, checkOut: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!form.staffId || createAttendance.isPending}>
              {createAttendance.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Record Attendance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
