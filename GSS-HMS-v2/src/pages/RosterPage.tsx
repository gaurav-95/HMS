import { useState, useMemo } from "react";
import { useStaff, useSchedules } from "@/hooks/queries";
import { DEPARTMENTS } from "@/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CalendarClock, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const SHIFTS: Record<string, { label: string; color: string }> = {
  Morning: { label: "06:00 – 14:00", color: "bg-amber-100 text-amber-800" },
  Afternoon: { label: "14:00 – 22:00", color: "bg-sky-100 text-sky-800" },
  Night: { label: "22:00 – 06:00", color: "bg-indigo-100 text-indigo-800" },
};

function getShift(startTime: string): string {
  const h = parseInt(startTime?.split(":")[0] || "9", 10);
  if (h >= 6 && h < 14) return "Morning";
  if (h >= 14 && h < 22) return "Afternoon";
  return "Night";
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

export default function RosterPage() {
  const navigate = useNavigate();
  const { data: allStaff = [], isLoading: ls } = useStaff();
  const { data: schedules = [], isLoading: lsc } = useSchedules();
  const [deptFilter, setDeptFilter] = useState("All");
  const [weekOffset, setWeekOffset] = useState(0);

  const staff = allStaff as any[];
  const allSchedules = schedules as any[];

  const currentMonday = useMemo(() => addDays(getMonday(new Date()), weekOffset * 7), [weekOffset]);
  const weekDates = useMemo(() => DAYS.map((_, i) => addDays(currentMonday, i)), [currentMonday]);
  const weekLabel = `${formatShortDate(weekDates[0])} – ${formatShortDate(weekDates[6])}`;
  const isCurrentWeek = weekOffset === 0;

  const filteredSchedules = deptFilter === "All"
    ? allSchedules
    : allSchedules.filter((s: any) => s.department === deptFilter);

  // Build week grid: day → list of schedules
  const weekGrid = DAYS.map((day, i) => ({
    day,
    date: weekDates[i],
    entries: filteredSchedules.filter((s: any) => s.dayOfWeek === day),
  }));

  const departments = [...new Set(allSchedules.map((s: any) => s.department))];
  const uniqueStaff = [...new Set(filteredSchedules.map((s: any) => s.doctorName))].length;
  const morningCount = filteredSchedules.filter((s: any) => getShift(s.startTime) === "Morning").length;
  const nightCount = filteredSchedules.filter((s: any) => getShift(s.startTime) === "Night").length;

  if (ls || lsc) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Duty Roster</h1>
          <p className="text-muted-foreground">Weekly shift scheduling and department-wise roster management</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="w-52"><SelectValue placeholder="Filter department" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Departments</SelectItem>
              {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-center gap-4">
        <Button variant="outline" size="icon" onClick={() => setWeekOffset((w) => w - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center min-w-[200px]">
          <p className="font-semibold">{weekLabel}</p>
          {!isCurrentWeek && (
            <button className="text-xs text-primary hover:underline" onClick={() => setWeekOffset(0)}>
              Jump to current week
            </button>
          )}
        </div>
        <Button variant="outline" size="icon" onClick={() => setWeekOffset((w) => w + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Total Shifts</p><p className="text-2xl font-bold">{filteredSchedules.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Staff Rostered</p><p className="text-2xl font-bold">{uniqueStaff}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Morning Shifts</p><p className="text-2xl font-bold text-amber-600">{morningCount}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Night Shifts</p><p className="text-2xl font-bold text-indigo-600">{nightCount}</p></CardContent></Card>
      </div>

      {/* Weekly Grid */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><CalendarClock className="h-5 w-5" /> Weekly Roster — {weekLabel}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-7 border-b">
            {weekGrid.map(({ day, date }) => {
              const isToday = date.toDateString() === new Date().toDateString();
              return (
                <div key={day} className={`px-3 py-2.5 text-center text-sm font-semibold border-r last:border-r-0 ${isToday ? "bg-primary/10 text-primary" : "bg-muted/30"}`}>
                  <div>{day.slice(0, 3)}</div>
                  <div className="text-xs font-normal text-muted-foreground">{formatShortDate(date)}</div>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-7 min-h-[320px]">
            {weekGrid.map(({ day, date, entries }) => {
              const isToday = date.toDateString() === new Date().toDateString();
              return (
                <div key={day} className={`border-r last:border-r-0 p-2 space-y-1.5 ${isToday ? "bg-primary/5" : ""}`}>
                  {entries.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center pt-8">No shifts</p>
                  )}
                  {entries.map((e: any) => {
                    const shift = getShift(e.startTime);
                    return (
                      <div key={e.id} className={`rounded-md px-2 py-1.5 text-xs ${SHIFTS[shift]?.color || "bg-muted"}`}>
                        <p className="font-medium truncate">{e.doctorName}</p>
                        <p className="opacity-75">{e.startTime}–{e.endTime}</p>
                        <p className="opacity-60 truncate">{e.department}</p>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Table View */}
      <Card>
        <CardHeader><CardTitle>Full Roster List</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Day</TableHead>
                <TableHead>Shift</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Max Patients</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSchedules.map((s: any) => {
                const shift = getShift(s.startTime);
                return (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7"><AvatarFallback className="text-[10px] bg-primary/10 text-primary">{getInitials(s.doctorName)}</AvatarFallback></Avatar>
                        <span className="font-medium">{s.doctorName}</span>
                      </div>
                    </TableCell>
                    <TableCell>{s.department}</TableCell>
                    <TableCell><Badge variant="outline">{s.dayOfWeek}</Badge></TableCell>
                    <TableCell><Badge className={`${SHIFTS[shift]?.color || ""} border-0`}>{shift}</Badge></TableCell>
                    <TableCell>{s.startTime} – {s.endTime}</TableCell>
                    <TableCell>{s.maxPatients}</TableCell>
                    <TableCell><Badge variant={s.isActive !== false ? "success" : "secondary"}>{s.isActive !== false ? "Active" : "Inactive"}</Badge></TableCell>
                  </TableRow>
                );
              })}
              {filteredSchedules.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No schedules found. Add shifts from the <button className="text-primary underline hover:text-primary/80" onClick={() => navigate("/schedules")}>Schedules page</button>.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
