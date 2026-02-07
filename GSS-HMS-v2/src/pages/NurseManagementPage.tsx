import { useState } from "react";
import { useStaff } from "@/hooks/queries";
import { useSchedules } from "@/hooks/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BriefcaseMedical, Search, Loader2, Users, CalendarClock } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const NURSE_CLASSIFICATIONS = ["BSc Nursing", "GNM", "ANM", "BNF", "Nursing Assistant"];

export default function NurseManagementPage() {
  const navigate = useNavigate();
  const { data: allStaff = [], isLoading: loadingStaff } = useStaff();
  const { data: schedules = [], isLoading: loadingSchedules } = useSchedules();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterClass, setFilterClass] = useState("All");

  const nurses = (allStaff as any[]).filter((s: any) =>
    s.role?.toLowerCase().includes("nurse") ||
    s.department?.toLowerCase().includes("nursing") ||
    NURSE_CLASSIFICATIONS.some((c) => s.nursingClassification?.includes(c))
  );

  const filtered = nurses.filter((n: any) => {
    const matchSearch = n.name?.toLowerCase().includes(searchQuery.toLowerCase()) || n.department?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchClass = filterClass === "All" || n.nursingClassification === filterClass;
    return matchSearch && matchClass;
  });

  const nurseSchedules = (schedules as any[]).filter((s: any) =>
    nurses.some((n: any) => n.name === s.doctorName || s.department?.toLowerCase().includes("nursing"))
  );

  const classifications = [...new Set(nurses.map((n: any) => n.nursingClassification).filter(Boolean))];

  if (loadingStaff || loadingSchedules) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nurse Management (Metron)</h1>
        <p className="text-muted-foreground">Nursing staff directory, classifications, and scheduling</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Total Nurses</p><p className="text-2xl font-bold">{nurses.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Classifications</p><p className="text-2xl font-bold">{classifications.length || "—"}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Active Schedules</p><p className="text-2xl font-bold">{nurseSchedules.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Avg Salary</p><p className="text-2xl font-bold">₹{nurses.length ? Math.round(nurses.reduce((s: number, n: any) => s + (n.baseSalary || 0), 0) / nurses.length).toLocaleString("en-IN") : "—"}</p></CardContent></Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search nurses..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
      </div>

      <Tabs defaultValue="directory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="directory" className="gap-2"><Users size={14} /> Directory ({filtered.length})</TabsTrigger>
          <TabsTrigger value="schedules" className="gap-2"><CalendarClock size={14} /> Schedules ({nurseSchedules.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="directory">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><BriefcaseMedical className="h-5 w-5" /> Nursing Staff</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nurse</TableHead>
                    <TableHead>Classification</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Joining Date</TableHead>
                    <TableHead>Salary</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((n: any) => (
                    <TableRow key={n.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8"><AvatarFallback className="text-xs bg-primary/10 text-primary">{getInitials(n.name)}</AvatarFallback></Avatar>
                          <div>
                            <p className="font-medium">{n.name}</p>
                            <p className="text-xs text-muted-foreground">{n.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline">{n.nursingClassification || n.role}</Badge></TableCell>
                      <TableCell>{n.department}</TableCell>
                      <TableCell className="text-muted-foreground">{n.phone}</TableCell>
                      <TableCell className="text-muted-foreground">{n.joiningDate}</TableCell>
                      <TableCell className="font-medium">₹{(n.baseSalary || 0).toLocaleString("en-IN")}</TableCell>
                      <TableCell><Badge variant={n.isActive ? "success" : "secondary"}>{n.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No nursing staff found. Add staff with nursing roles in <button className="text-primary underline hover:text-primary/80" onClick={() => navigate("/staff")}>Staff Directory</button>.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedules">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><CalendarClock className="h-5 w-5" /> Nurse Schedules</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Day</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Max Patients</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nurseSchedules.map((s: any) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.doctorName}</TableCell>
                      <TableCell>{s.department}</TableCell>
                      <TableCell><Badge variant="outline">{s.dayOfWeek}</Badge></TableCell>
                      <TableCell>{s.startTime} – {s.endTime}</TableCell>
                      <TableCell>{s.maxPatients}</TableCell>
                      <TableCell><Badge variant={s.isActive ? "success" : "secondary"}>{s.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                    </TableRow>
                  ))}
                  {nurseSchedules.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No nurse schedules found. Create schedules from the <button className="text-primary underline hover:text-primary/80" onClick={() => navigate("/schedules")}>Schedules page</button>.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
