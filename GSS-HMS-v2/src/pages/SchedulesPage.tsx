import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSchedules, useCreateSchedule } from "@/hooks/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Stethoscope, Plus, Loader2 } from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function SchedulesPage() {
  const { hasPermission } = useAuth();
  const { data: schedules = [], isLoading } = useSchedules();
  const createSchedule = useCreateSchedule();
  const [showAdd, setShowAdd] = useState(false);
  const [dayOfWeek, setDayOfWeek] = useState("Monday");
  const canWrite = hasPermission("schedule:write");

  const allSchedules = schedules as any[];

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createSchedule.mutate({
      doctorName: fd.get("doctorName") as string,
      department: fd.get("department") as string,
      dayOfWeek,
      startTime: fd.get("startTime") as string,
      endTime: fd.get("endTime") as string,
      maxPatients: Number(fd.get("maxPatients") || 20),
    });
    setDayOfWeek("Monday");
    setShowAdd(false);
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
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

      {allSchedules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Stethoscope className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No Schedules Yet</h3>
            <p className="text-muted-foreground max-w-sm mt-2">
              Add doctor schedules to manage availability and OPD slots.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Stethoscope className="h-5 w-5" /> Weekly Schedule</CardTitle></CardHeader>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {allSchedules.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.doctorName}</TableCell>
                    <TableCell>{s.department}</TableCell>
                    <TableCell><Badge variant="outline">{s.dayOfWeek}</Badge></TableCell>
                    <TableCell>{s.startTime} – {s.endTime}</TableCell>
                    <TableCell>{s.maxPatients}</TableCell>
                    <TableCell><Badge variant={s.isActive ? "success" : "secondary"}>{s.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Schedule</DialogTitle></DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-2"><Label>Doctor Name</Label><Input name="doctorName" required /></div>
            <div className="space-y-2"><Label>Department</Label><Input name="department" required /></div>
            <div className="space-y-2">
              <Label>Day of Week</Label>
              <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{DAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Start Time</Label><Input name="startTime" placeholder="09:00" required /></div>
              <div className="space-y-2"><Label>End Time</Label><Input name="endTime" placeholder="13:00" required /></div>
            </div>
            <div className="space-y-2"><Label>Max Patients</Label><Input name="maxPatients" type="number" defaultValue={20} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button type="submit">Create</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
