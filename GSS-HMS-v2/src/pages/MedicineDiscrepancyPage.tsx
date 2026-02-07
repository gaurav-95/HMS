import { useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  useMedicineAdministrations, useCreateMedicineAdmin,
  useResolveMedicineDiscrepancy, usePrescriptions, useStaff,
} from "@/hooks/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Plus, Search, Loader2, CheckCircle2, ShieldAlert, Pill } from "lucide-react";
import { ExportButtons } from "@/components/ExportButtons";
import { formatDate } from "@/lib/utils";

export default function MedicineDiscrepancyPage() {
  const { user, hasPermission } = useAuth();
  const { data: administrations = [], isLoading } = useMedicineAdministrations();
  const { data: prescriptions = [] } = usePrescriptions();
  const { data: staffList = [] } = useStaff();
  const createAdmin = useCreateMedicineAdmin();
  const resolveDiscrepancy = useResolveMedicineDiscrepancy();

  const [showRecord, setShowRecord] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const canAdminister = hasPermission("medicine:administer");
  const canResolve = hasPermission("reports:match");

  const allRecords = administrations as any[];
  const flaggedRecords = allRecords.filter((r: any) => r.status === "Flagged");
  const resolvedRecords = allRecords.filter((r: any) => r.status === "Resolved");
  const cleanRecords = allRecords.filter((r: any) => r.status === "Administered");

  const filtered = useMemo(() => {
    const list = activeTab === "all" ? allRecords : activeTab === "flagged" ? flaggedRecords : activeTab === "resolved" ? resolvedRecords : cleanRecords;
    return list.filter((r: any) =>
      r.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.prescribedMedicine?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.administeredBy?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allRecords, activeTab, searchQuery]);

  // Get pending/dispensed prescriptions for the record form
  const rxList = (prescriptions as any[]).filter((p: any) => p.status === "Dispensed" || p.status === "Pending");
  const selectedRx = rxList.find((p: any) => p.id === selectedPrescription);

  const nurses = (staffList as any[]).filter((s: any) =>
    s.role === "Staff Nurse" || s.role === "Sr. Nurse" || s.role === "Jr. Nurse" ||
    s.nursingClassification
  );

  const handleRecordAdmin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createAdmin.mutate({
      prescriptionId: selectedPrescription || null,
      patientName: fd.get("patientName") as string,
      doctorName: fd.get("doctorName") as string,
      prescribedMedicine: fd.get("prescribedMedicine") as string,
      prescribedDosage: fd.get("prescribedDosage") as string,
      administeredMedicine: fd.get("administeredMedicine") as string,
      administeredDosage: fd.get("administeredDosage") as string,
      administeredBy: fd.get("administeredBy") as string || user?.name || "Unknown",
      administeredByRole: fd.get("administeredByRole") as string || user?.role || "STAFF",
    });
    setSelectedPrescription("");
    setShowRecord(false);
  };

  const handleResolve = (id: string) => {
    const notes = prompt("Resolution notes (optional):");
    resolveDiscrepancy.mutate({ id, notes: notes || "Reviewed and resolved" });
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Medicine Discrepancy Tracker</h1>
          <p className="text-muted-foreground">Track nurse medicine administration vs doctor prescriptions</p>
        </div>
        <div className="flex gap-2">
          <ExportButtons
            title="Medicine Administration Report"
            columns={["Patient", "Doctor", "Prescribed", "P.Dosage", "Administered", "A.Dosage", "By", "Date", "Discrepancy", "Status"]}
            rows={allRecords.map((r: any) => [r.patientName, r.doctorName, r.prescribedMedicine, r.prescribedDosage, r.administeredMedicine, r.administeredDosage, r.administeredBy, r.administeredDate, r.hasDiscrepancy ? "YES" : "No", r.status])}
          />
          {canAdminister && <Button onClick={() => setShowRecord(true)} className="gap-2"><Plus size={16} /> Record Administration</Button>}
        </div>
      </div>

      {/* Alert banner for active discrepancies */}
      {flaggedRecords.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold text-red-800">Discrepancies Detected</h3>
            <p className="text-sm text-red-700">
              <span className="font-medium">{flaggedRecords.length} record(s)</span> show differences between prescribed and administered medicine — require review.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Total Records</p><p className="text-2xl font-bold">{allRecords.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Clean</p><p className="text-2xl font-bold text-green-600">{cleanRecords.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Flagged</p><p className="text-2xl font-bold text-destructive">{flaggedRecords.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Resolved</p><p className="text-2xl font-bold text-blue-600">{resolvedRecords.length}</p></CardContent></Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by patient, medicine, nurse..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" className="gap-2"><Pill size={14} /> All ({allRecords.length})</TabsTrigger>
          <TabsTrigger value="flagged" className="gap-2"><ShieldAlert size={14} /> Flagged ({flaggedRecords.length})</TabsTrigger>
          <TabsTrigger value="clean" className="gap-2"><CheckCircle2 size={14} /> Clean ({cleanRecords.length})</TabsTrigger>
          <TabsTrigger value="resolved" className="gap-2">Resolved ({resolvedRecords.length})</TabsTrigger>
        </TabsList>

        {(["all", "flagged", "clean", "resolved"] as const).map((tab) => (
          <TabsContent key={tab} value={tab}>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Prescribed</TableHead>
                      <TableHead>Administered</TableHead>
                      <TableHead>Nurse</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      {canResolve && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((r: any) => (
                      <TableRow key={r.id} className={r.hasDiscrepancy && r.status === "Flagged" ? "bg-red-50/50" : ""}>
                        <TableCell className="font-medium">{r.patientName}</TableCell>
                        <TableCell className="text-muted-foreground">{r.doctorName}</TableCell>
                        <TableCell>
                          <div className="text-sm">{r.prescribedMedicine}</div>
                          <div className="text-xs text-muted-foreground">{r.prescribedDosage}</div>
                        </TableCell>
                        <TableCell>
                          <div className={`text-sm ${r.hasDiscrepancy ? "text-red-600 font-medium" : ""}`}>{r.administeredMedicine}</div>
                          <div className={`text-xs ${r.hasDiscrepancy ? "text-red-500" : "text-muted-foreground"}`}>{r.administeredDosage}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{r.administeredBy}</div>
                          <div className="text-xs text-muted-foreground">{r.administeredByRole}</div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(r.administeredDate)}</TableCell>
                        <TableCell>
                          <Badge variant={r.status === "Flagged" ? "destructive" : r.status === "Resolved" ? "info" : "success"}>
                            {r.hasDiscrepancy ? `⚠ ${r.status}` : r.status}
                          </Badge>
                        </TableCell>
                        {canResolve && (
                          <TableCell>
                            {r.status === "Flagged" && (
                              <Button size="sm" variant="outline" onClick={() => handleResolve(r.id)} disabled={resolveDiscrepancy.isPending}>
                                Resolve
                              </Button>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                    {filtered.length === 0 && (
                      <TableRow><TableCell colSpan={canResolve ? 8 : 7} className="text-center py-8 text-muted-foreground">No records found</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Record Administration Dialog */}
      <Dialog open={showRecord} onOpenChange={setShowRecord}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Record Medicine Administration</DialogTitle></DialogHeader>
          <form onSubmit={handleRecordAdmin} className="space-y-4">
            <div className="space-y-2">
              <Label>Link to Prescription (optional)</Label>
              <Select value={selectedPrescription} onValueChange={setSelectedPrescription}>
                <SelectTrigger><SelectValue placeholder="Select prescription..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None (manual entry) —</SelectItem>
                  {rxList.map((rx: any) => (
                    <SelectItem key={rx.id} value={rx.id}>
                      {rx.patientName} — {rx.medicineName} ({rx.dosage})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Patient Name</Label>
                <Input name="patientName" required defaultValue={selectedRx?.patientName || ""} />
              </div>
              <div className="space-y-2">
                <Label>Doctor Name</Label>
                <Input name="doctorName" required defaultValue={selectedRx?.doctorName || ""} />
              </div>
            </div>

            <div className="rounded-lg border p-3 bg-muted/50 space-y-3">
              <p className="font-medium text-sm">Prescribed (as per doctor)</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Medicine</Label><Input name="prescribedMedicine" required defaultValue={selectedRx?.medicineName || ""} /></div>
                <div className="space-y-2"><Label>Dosage</Label><Input name="prescribedDosage" required defaultValue={selectedRx?.dosage || ""} /></div>
              </div>
            </div>

            <div className="rounded-lg border p-3 bg-blue-50/50 space-y-3">
              <p className="font-medium text-sm">Actually Administered (by nurse)</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Medicine Given</Label><Input name="administeredMedicine" required defaultValue={selectedRx?.medicineName || ""} /></div>
                <div className="space-y-2"><Label>Dosage Given</Label><Input name="administeredDosage" required defaultValue={selectedRx?.dosage || ""} /></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Administered By</Label>
                <Input name="administeredBy" defaultValue={user?.name || ""} required />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Input name="administeredByRole" defaultValue={user?.role || ""} required />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowRecord(false)}>Cancel</Button>
              <Button type="submit" disabled={createAdmin.isPending}>Record Administration</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
