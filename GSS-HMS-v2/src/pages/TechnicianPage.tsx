import { useState, useMemo } from "react";
import { useLabTests, useUpdateLabTestStatus } from "@/hooks/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2, FlaskConical, Clock, CheckCircle2, AlertCircle, FileCheck, Bed } from "lucide-react";
import { formatDate } from "@/lib/utils";

/** Local state for report matching (no extra backend required — uses lab test result field) */
interface ReportMatch {
  testId: string;
  expectedRange: string;
  actualValue: string;
  matchStatus: "Match" | "Mismatch" | "Pending";
  notes: string;
}

export default function TechnicianPage() {
  const { data: tests = [], isLoading } = useLabTests();
  const updateStatus = useUpdateLabTestStatus();
  const [searchQuery, setSearchQuery] = useState("");
  const [reportMatches, setReportMatches] = useState<ReportMatch[]>([]);
  const [showMatchDialog, setShowMatchDialog] = useState(false);
  const [matchTest, setMatchTest] = useState<any>(null);

  const allTests = tests as any[];
  const pending = allTests.filter((t: any) => t.status === "Pending" || t.status === "Ordered");
  const inProgress = allTests.filter((t: any) => t.status === "InProgress" || t.status === "In Progress");
  const completed = allTests.filter((t: any) => t.status === "Completed");
  const urgent = allTests.filter((t: any) => t.priority === "Urgent" || t.priority === "STAT");

  // Ward-based grouping for WARD DBEO display
  const wardGroups = useMemo(() => {
    const groups: Record<string, any[]> = {};
    allTests.forEach((t: any) => {
      const ward = t.ward || t.location || "General";
      if (!groups[ward]) groups[ward] = [];
      groups[ward].push(t);
    });
    return groups;
  }, [allTests]);

  // Report matching stats
  const matchedReports = reportMatches.filter(r => r.matchStatus === "Match");
  const mismatchedReports = reportMatches.filter(r => r.matchStatus === "Mismatch");

  const filtered = (list: any[]) =>
    list.filter((t: any) =>
      t.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.testName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const handleStart = (id: string) => updateStatus.mutate({ id, status: "InProgress" });
  const handleComplete = (id: string) => updateStatus.mutate({ id, status: "Completed" });

  const handleReportMatch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const expected = (fd.get("expectedRange") as string).trim().toLowerCase();
    const actual = (fd.get("actualValue") as string).trim().toLowerCase();
    const matchStatus = expected === actual ? "Match" : "Mismatch";
    setReportMatches(prev => {
      const existing = prev.findIndex(r => r.testId === matchTest.id);
      const entry: ReportMatch = {
        testId: matchTest.id,
        expectedRange: fd.get("expectedRange") as string,
        actualValue: fd.get("actualValue") as string,
        matchStatus,
        notes: fd.get("notes") as string,
      };
      if (existing >= 0) { const copy = [...prev]; copy[existing] = entry; return copy; }
      return [...prev, entry];
    });
    setShowMatchDialog(false);
    setMatchTest(null);
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Technician Portal</h1>
        <p className="text-muted-foreground">Lab queue management, report matching, ward tracking, and status management</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Pending Queue</p><p className="text-2xl font-bold text-amber-600">{pending.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">In Progress</p><p className="text-2xl font-bold text-blue-600">{inProgress.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Completed Today</p><p className="text-2xl font-bold text-green-600">{completed.filter((t: any) => t.completedDate && new Date(t.completedDate).toDateString() === new Date().toDateString()).length}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Urgent / STAT</p><p className="text-2xl font-bold text-destructive">{urgent.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Report Mismatches</p><p className="text-2xl font-bold text-orange-600">{mismatchedReports.length}</p></CardContent></Card>
      </div>

      {/* Urgent Alert */}
      {urgent.filter((t: any) => t.status !== "Completed").length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold text-red-800">Urgent Tests Pending</h3>
            <p className="text-sm text-red-700">{urgent.filter((t: any) => t.status !== "Completed").length} urgent/STAT test(s) require immediate processing.</p>
          </div>
        </div>
      )}

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search tests, patients, categories..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2"><Clock size={14} /> Queue ({pending.length})</TabsTrigger>
          <TabsTrigger value="inprogress" className="gap-2"><FlaskConical size={14} /> In Progress ({inProgress.length})</TabsTrigger>
          <TabsTrigger value="completed" className="gap-2"><CheckCircle2 size={14} /> Completed ({completed.length})</TabsTrigger>
          <TabsTrigger value="reportmatch" className="gap-2"><FileCheck size={14} /> Report Matching</TabsTrigger>
          <TabsTrigger value="wards" className="gap-2"><Bed size={14} /> Wards</TabsTrigger>
        </TabsList>

        {(["pending", "inprogress", "completed"] as const).map((tab) => {
          const list = tab === "pending" ? pending : tab === "inprogress" ? inProgress : completed;
          const items = filtered(list);
          return (
            <TabsContent key={tab} value={tab}>
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Test</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Ordered By</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        {tab !== "completed" && <TableHead>Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((t: any) => (
                        <TableRow key={t.id} className={t.priority === "Urgent" || t.priority === "STAT" ? "bg-red-50/50" : ""}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2"><FlaskConical size={14} className="text-primary" />{t.testName}</div>
                          </TableCell>
                          <TableCell>{t.patientName}</TableCell>
                          <TableCell><Badge variant="secondary">{t.category}</Badge></TableCell>
                          <TableCell>
                            <Badge variant={t.priority === "Urgent" || t.priority === "STAT" ? "destructive" : t.priority === "High" ? "warning" : "outline"}>
                              {t.priority}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{t.orderedBy}</TableCell>
                          <TableCell className="text-muted-foreground">{formatDate(t.orderedDate)}</TableCell>
                          <TableCell>
                            <Badge variant={t.status === "Completed" ? "success" : t.status === "InProgress" || t.status === "In Progress" ? "info" : "warning"}>
                              {t.status}
                            </Badge>
                          </TableCell>
                          {tab !== "completed" && (
                            <TableCell>
                              {tab === "pending" && (
                                <Button size="sm" variant="outline" onClick={() => handleStart(t.id)} disabled={updateStatus.isPending}>Start</Button>
                              )}
                              {tab === "inprogress" && (
                                <Button size="sm" onClick={() => handleComplete(t.id)} disabled={updateStatus.isPending} className="gap-1">
                                  <CheckCircle2 size={14} /> Complete
                                </Button>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                      {items.length === 0 && (
                        <TableRow><TableCell colSpan={tab === "completed" ? 7 : 8} className="text-center py-8 text-muted-foreground">
                          {tab === "pending" ? "No pending tests in queue" : tab === "inprogress" ? "No tests in progress" : "No completed tests"}
                        </TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}

        {/* Report Matching Tab */}
        <TabsContent value="reportmatch">
          {mismatchedReports.length > 0 && (
            <div className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 p-4 mb-4">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-semibold text-orange-800">Report Mismatches Detected</h3>
                <p className="text-sm text-orange-700">{mismatchedReports.length} test(s) have actual results that don't match expected ranges.</p>
              </div>
            </div>
          )}
          <Card>
            <CardHeader>
              <CardTitle>Report Matching — Compare Expected vs Actual Results</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Test</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Expected Range</TableHead>
                    <TableHead>Actual Value</TableHead>
                    <TableHead>Match Status</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completed.map((t: any) => {
                    const match = reportMatches.find(r => r.testId === t.id);
                    return (
                      <TableRow key={t.id} className={match?.matchStatus === "Mismatch" ? "bg-orange-50/50" : ""}>
                        <TableCell className="font-medium">{t.testName}</TableCell>
                        <TableCell>{t.patientName}</TableCell>
                        <TableCell><Badge variant="secondary">{t.category}</Badge></TableCell>
                        <TableCell>{match?.expectedRange || <span className="text-muted-foreground">—</span>}</TableCell>
                        <TableCell>{match?.actualValue || <span className="text-muted-foreground">—</span>}</TableCell>
                        <TableCell>
                          {match ? (
                            <Badge variant={match.matchStatus === "Match" ? "success" : "destructive"}>
                              {match.matchStatus}
                            </Badge>
                          ) : (
                            <Badge variant="outline">Not Checked</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">{match?.notes || "—"}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" onClick={() => { setMatchTest(t); setShowMatchDialog(true); }}>
                            {match ? "Re-check" : "Match"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {completed.length === 0 && (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No completed tests to match</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ward Assignment Tab */}
        <TabsContent value="wards">
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(wardGroups).map(([ward, wardTests]) => (
              <Card key={ward}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2"><Bed size={16} /> {ward}</span>
                    <Badge variant="secondary">{wardTests.length} tests</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {wardTests.slice(0, 5).map((t: any) => (
                    <div key={t.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                      <div>
                        <span className="font-medium">{t.testName}</span>
                        <span className="text-muted-foreground ml-2">— {t.patientName}</span>
                      </div>
                      <Badge variant={t.status === "Completed" ? "success" : t.status === "InProgress" ? "info" : "warning"} className="text-xs">
                        {t.status}
                      </Badge>
                    </div>
                  ))}
                  {wardTests.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center">+{wardTests.length - 5} more</p>
                  )}
                </CardContent>
              </Card>
            ))}
            {Object.keys(wardGroups).length === 0 && (
              <p className="text-sm text-muted-foreground col-span-2 text-center py-8">No ward data available</p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Report Matching Dialog */}
      <Dialog open={showMatchDialog} onOpenChange={setShowMatchDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Match Report — {matchTest?.testName}</DialogTitle></DialogHeader>
          <form onSubmit={handleReportMatch} className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground">Patient:</span> {matchTest?.patientName}</div>
              <div><span className="text-muted-foreground">Category:</span> {matchTest?.category}</div>
            </div>
            <div className="space-y-2">
              <Label>Expected Range / Value</Label>
              <Input name="expectedRange" placeholder="e.g., 70-100 mg/dL" required defaultValue={reportMatches.find(r => r.testId === matchTest?.id)?.expectedRange || ""} />
            </div>
            <div className="space-y-2">
              <Label>Actual Result Value</Label>
              <Input name="actualValue" placeholder="e.g., 85 mg/dL" required defaultValue={reportMatches.find(r => r.testId === matchTest?.id)?.actualValue || ""} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea name="notes" placeholder="observations..." rows={2} defaultValue={reportMatches.find(r => r.testId === matchTest?.id)?.notes || ""} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowMatchDialog(false)}>Cancel</Button>
              <Button type="submit">Save Match</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
