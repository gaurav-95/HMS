import { useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSchedules, useCreateSchedule, useUpdateSchedule, useDeleteSchedule, usePermanentDeleteSchedule, useStaff } from "@/hooks/queries";
import { DEPARTMENTS } from "@/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Stethoscope, Plus, Loader2, Pencil, Trash2, Search, Filter } from "lucide-react";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const blankForm = {
  doctorName: "",
  doctorId: "",
  department: "",
  dayOfWeek: "Monday",
  startTime: "09:00",
  endTime: "13:00",
  maxPatients: 20,
};

export default function SchedulesPage() {
  const { hasPermission, user } = useAuth();
  const { data: schedules = [], isLoading } = useSchedules();
  const { data: staffList = [] } = useStaff();
  const createSchedule = useCreateSchedule();
  const updateSchedule = useUpdateSchedule();
  const deleteSchedule = useDeleteSchedule();
  const permanentDeleteSchedule = usePermanentDeleteSchedule();

  const canWrite = hasPermission("schedule:write");
  const canDelete = hasPermission("schedule:delete");
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const allSchedules = schedules as any[];
  const allStaff = staffList as any[];

  // Filter only doctors from staff list
  const doctors = useMemo(() => allStaff.filter((s: any) => s.role === "Doctor" && s.isActive !== false), [allStaff]);

  const [search, setSearch] = useState("");
  const [filterDay, setFilterDay] = useState<string>("all");
  const [filterDept, setFilterDept] = useState<string>("all");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(blankForm);
  const [editingSchedule, setEditingSchedule] = useState<any | null>(null);
  const [editForm, setEditForm] = useState(blankForm);
  const [deletingSchedule, setDeletingSchedule] = useState<any | null>(null);

  const filtered = useMemo(() => {
    return allSchedules.filter((s: any) => {
      const matchSearch = !search || s.doctorName?.toLowerCase().includes(search.toLowerCase());
      const matchDay = filterDay === "all" || s.dayOfWeek === filterDay;
      const matchDept = filterDept === "all" || s.department === filterDept;
      return matchSearch && matchDay && matchDept;
    });
  }, [allSchedules, search, filterDay, filterDept]);

  const uniqueDepts = useMemo(() => [...new Set(allSchedules.map((s: any) => s.department))].sort(), [allSchedules]);

  const handleDoctorSelect = (doctorId: string, target: "add" | "edit") => {
    const doc = doctors.find((d: any) => d.id === doctorId);
    if (!doc) return;
    const data = { doctorId, doctorName: doc.name, department: doc.department || "" };
    if (target === "add") setForm((f) => ({ ...f, ...data }));
    else setEditForm((f) => ({ ...f, ...data }));
  };

  const handleAdd = () => {
    if (!form.doctorName || !form.department || !form.startTime || !form.endTime) return;
    createSchedule.mutate({
      doctorName: form.doctorName,
      department: form.department,
      dayOfWeek: form.dayOfWeek,
      startTime: form.startTime,
      endTime: form.endTime,
      maxPatients: form.maxPatients,
    }, { onSuccess: () => { setShowAdd(false); setForm(blankForm); } });
  };

  const openEditDialog = (s: any) => {
    setEditingSchedule(s);
    setEditForm({
      doctorName: s.doctorName,
      doctorId: "",
      department: s.department,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      maxPatients: s.maxPatients || 20,
    });
  };

  const handleEdit = () => {
    if (!editingSchedule) return;
    updateSchedule.mutate({
      id: editingSchedule.id,
      doctorName: editForm.doctorName,
      department: editForm.department,
      dayOfWeek: editForm.dayOfWeek,
      startTime: editForm.startTime,
      endTime: editForm.endTime,
      maxPatients: editForm.maxPatients,
    }, { onSuccess: () => setEditingSchedule(null) });
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Doctor Schedules</h1>
          <p className="text-muted-foreground">Manage doctor availability, OPD time slots, and department assignments</p>
        </div>
        {canWrite && (
          <Button onClick={() => setShowAdd(true)} className="gap-2">
            <Plus size={16} /> Add Schedule
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by doctor..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterDay} onValueChange={setFilterDay}>
          <SelectTrigger className="w-[150px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Days</SelectItem>
            {DAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterDept} onValueChange={setFilterDept}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {uniqueDepts.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Stethoscope className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No Schedules Found</h3>
            <p className="text-muted-foreground max-w-sm mt-2">
              {allSchedules.length === 0 ? "Add doctor schedules to manage availability and OPD slots." : "No schedules match current filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Stethoscope className="h-5 w-5" /> Weekly Schedule ({filtered.length} entries)</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Day</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Max Patients</TableHead>
                  <TableHead>Status</TableHead>
                  {(canWrite || canDelete) && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.doctorName}</TableCell>
                    <TableCell>{s.department}</TableCell>
                    <TableCell><Badge variant="outline">{s.dayOfWeek}</Badge></TableCell>
                    <TableCell>{s.startTime} – {s.endTime}</TableCell>
                    <TableCell>{s.maxPatients}</TableCell>
                    <TableCell><Badge variant={s.isActive !== false ? "success" : "secondary"}>{s.isActive !== false ? "Active" : "Inactive"}</Badge></TableCell>
                    {(canWrite || canDelete) && (
                      <TableCell className="text-right space-x-1">
                        {canWrite && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(s)}>
                            <Pencil size={14} />
                          </Button>
                        )}
                        {canDelete && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeletingSchedule(s)}>
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Add Schedule Modal */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Schedule</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Doctor</Label>
              <Select value={form.doctorId} onValueChange={(v) => handleDoctorSelect(v, "add")}>
                <SelectTrigger><SelectValue placeholder="Select a doctor" /></SelectTrigger>
                <SelectContent>
                  {doctors.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.name} — {d.department}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={form.department} onValueChange={(v) => setForm((f) => ({ ...f, department: v }))}>
                <SelectTrigger><SelectValue placeholder="Filled from doctor selection" /></SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Day of Week</Label>
              <Select value={form.dayOfWeek} onValueChange={(v) => setForm((f) => ({ ...f, dayOfWeek: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{DAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input type="time" value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input type="time" value={form.endTime} onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Max Patients</Label>
              <Input type="number" value={form.maxPatients} onChange={(e) => setForm((f) => ({ ...f, maxPatients: Number(e.target.value) }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={!form.doctorName || createSchedule.isPending}>
              {createSchedule.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Create Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Schedule Modal */}
      <Dialog open={!!editingSchedule} onOpenChange={(v) => { if (!v) setEditingSchedule(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Schedule</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Doctor</Label>
              <Select value={editForm.doctorId || ""} onValueChange={(v) => handleDoctorSelect(v, "edit")}>
                <SelectTrigger><SelectValue placeholder={editForm.doctorName || "Select a doctor"} /></SelectTrigger>
                <SelectContent>
                  {doctors.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.name} — {d.department}</SelectItem>)}
                </SelectContent>
              </Select>
              {editForm.doctorName && <p className="text-xs text-muted-foreground">Current: {editForm.doctorName}</p>}
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={editForm.department} onValueChange={(v) => setEditForm((f) => ({ ...f, department: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Day of Week</Label>
              <Select value={editForm.dayOfWeek} onValueChange={(v) => setEditForm((f) => ({ ...f, dayOfWeek: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{DAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input type="time" value={editForm.startTime} onChange={(e) => setEditForm((f) => ({ ...f, startTime: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input type="time" value={editForm.endTime} onChange={(e) => setEditForm((f) => ({ ...f, endTime: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Max Patients</Label>
              <Input type="number" value={editForm.maxPatients} onChange={(e) => setEditForm((f) => ({ ...f, maxPatients: Number(e.target.value) }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSchedule(null)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={updateSchedule.isPending}>
              {updateSchedule.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Update Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <DeleteConfirmationDialog
        open={!!deletingSchedule}
        onClose={() => setDeletingSchedule(null)}
        onConfirm={() => { deleteSchedule.mutate(deletingSchedule?.id); setDeletingSchedule(null); }}
        entityName={`${deletingSchedule?.doctorName} - ${deletingSchedule?.dayOfWeek}`}
        entityType="schedule"
        isSuperAdmin={isSuperAdmin}
        onPermanentDelete={() => { permanentDeleteSchedule.mutate(deletingSchedule?.id); setDeletingSchedule(null); }}
        isPending={deleteSchedule.isPending || permanentDeleteSchedule.isPending}
      />
    </div>
  );
}
