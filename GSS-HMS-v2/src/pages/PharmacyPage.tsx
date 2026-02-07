import { useState, useMemo } from "react";
import { usePrescriptions, useCreatePrescription, useDispensePrescription, useDeletePrescription } from "@/hooks/queries";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Search, Pill, CheckCircle, Trash2 } from "lucide-react";
import { ExportButtons } from "@/components/ExportButtons";

const today = new Date().toISOString().split("T")[0];
const FREQUENCIES = ["OD", "BD", "TDS", "QID", "SOS"] as const;
const STATUSES = ["Pending", "Dispensed", "Cancelled"] as const;

const blankRx = {
  patientName: "",
  doctorName: "",
  medicineName: "",
  dosage: "",
  frequency: "OD",
  duration: "",
  quantity: 1,
  status: "Pending",
  notes: "",
  prescribedDate: today,
};

export default function PharmacyPage() {
  const { data: rxList = [], isLoading } = usePrescriptions();
  const { hasPermission, user } = useAuth();
  const createRx = useCreatePrescription();
  const dispenseRx = useDispensePrescription();
  const deleteRx = useDeletePrescription();

  const all = rxList as any[];
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blankRx);

  const filtered = useMemo(() => all.filter((r: any) => {
    const matchSearch = !search || r.patientName?.toLowerCase().includes(search.toLowerCase()) || r.medicineName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    return matchSearch && matchStatus;
  }), [all, search, filterStatus]);

  const pending = all.filter((r: any) => r.status === "Pending").length;
  const dispensed = all.filter((r: any) => r.status === "Dispensed").length;

  const handleSubmit = () => {
    if (!form.patientName || !form.medicineName) return;
    createRx.mutate(form, { onSuccess: () => { setOpen(false); setForm(blankRx); } });
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Pharmacy</h1>
          <p className="text-muted-foreground">Prescription management and dispensing</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButtons
            title="Pharmacy Report"
            columns={["Patient", "Doctor", "Medicine", "Dosage", "Frequency", "Quantity", "Status", "Date"]}
            rows={filtered.map((r: any) => [r.patientName, r.doctorName, r.medicineName, r.dosage, r.frequency, r.quantity, r.status, r.prescribedDate])}
          />
          {hasPermission("lab:write") && (
            <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> New Prescription</Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search patient or medicine..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="pt-4 pb-4 flex items-center gap-3">
          <Pill className="h-5 w-5 text-blue-600" />
          <div><p className="text-sm text-muted-foreground">Total Prescriptions</p><p className="text-2xl font-bold">{all.length}</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4 flex items-center gap-3">
          <Loader2 className="h-5 w-5 text-amber-600" />
          <div><p className="text-sm text-muted-foreground">Pending</p><p className="text-2xl font-bold text-amber-600">{pending}</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <div><p className="text-sm text-muted-foreground">Dispensed</p><p className="text-2xl font-bold text-green-600">{dispensed}</p></div>
        </CardContent></Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader><CardTitle>Prescriptions</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Medicine</TableHead>
                <TableHead>Dosage</TableHead>
                <TableHead>Freq</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.patientName}</TableCell>
                  <TableCell>{r.doctorName}</TableCell>
                  <TableCell>{r.medicineName}</TableCell>
                  <TableCell>{r.dosage}</TableCell>
                  <TableCell>{r.frequency}</TableCell>
                  <TableCell>{r.quantity}</TableCell>
                  <TableCell className="text-muted-foreground">{r.prescribedDate}</TableCell>
                  <TableCell>
                    <Badge variant={r.status === "Dispensed" ? "success" : r.status === "Pending" ? "warning" : "destructive"}>{r.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    {r.status === "Pending" && hasPermission("inventory:write") && (
                      <Button size="sm" variant="outline" onClick={() => dispenseRx.mutate({ id: r.id, dispensedBy: user?.name || "" })}>
                        <CheckCircle className="h-3 w-3 mr-1" /> Dispense
                      </Button>
                    )}
                    {hasPermission("lab:write") && (
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteRx.mutate(r.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No prescriptions found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* New Prescription Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Prescription</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Patient Name</Label>
                <Input value={form.patientName} onChange={(e) => setForm((f) => ({ ...f, patientName: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Doctor Name</Label>
                <Input value={form.doctorName} onChange={(e) => setForm((f) => ({ ...f, doctorName: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Medicine Name</Label>
                <Input value={form.medicineName} onChange={(e) => setForm((f) => ({ ...f, medicineName: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Dosage</Label>
                <Input placeholder="e.g. 500mg" value={form.dosage} onChange={(e) => setForm((f) => ({ ...f, dosage: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select value={form.frequency} onValueChange={(v) => setForm((f) => ({ ...f, frequency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{FREQUENCIES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Duration</Label>
                <Input placeholder="e.g. 5 days" value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input type="number" min={1} value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Optional notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!form.patientName || !form.medicineName || createRx.isPending}>
              {createRx.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Create Prescription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
