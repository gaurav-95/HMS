import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { UserPlus, Search, Loader2, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { usePatients, useCreatePatient, useUpdatePatient } from "@/hooks/queries";
import { ExportButtons } from "@/components/ExportButtons";

const emptyForm = { name: "", age: "", gender: "Male", phone: "", address: "", bloodGroup: "" };

export default function PatientsPage() {
  const { data: patients = [], isLoading } = usePatients();
  const createPatient = useCreatePatient();
  const updatePatient = useUpdatePatient();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editingPatient, setEditingPatient] = useState<any | null>(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = (patients as any[]).filter(
    (p: any) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery)
  );

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    createPatient.mutate({ ...form, age: parseInt(form.age) || 0 });
    setShowAdd(false);
    setForm(emptyForm);
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPatient) return;
    updatePatient.mutate({ id: editingPatient.id, ...form, age: parseInt(form.age) || 0 });
    setEditingPatient(null);
    setForm(emptyForm);
  };

  const openEdit = (p: any) => {
    setEditingPatient(p);
    setForm({ name: p.name, age: String(p.age || ""), gender: p.gender || "Male", phone: p.phone || "", address: p.address || "", bloodGroup: p.bloodGroup || "" });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Patient Management</h1>
          <p className="text-muted-foreground">{filtered.length} patients registered</p>
        </div>
        <div className="flex gap-2">
          <ExportButtons
            title="Patient Registry"
            columns={["Name", "Phone", "Gender", "Age", "Blood Group", "Address"]}
            rows={filtered.map((p: any) => [p.name, p.phone || "", p.gender || "", p.age ?? "", p.bloodGroup || "", p.address || ""])}
          />
          <Button className="gap-2" onClick={() => setShowAdd(true)}>
            <UserPlus size={16} /> Register Patient
          </Button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search patients by name or phone..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Blood Group</TableHead>
                <TableHead>Address</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.phone}</TableCell>
                  <TableCell>{p.gender}</TableCell>
                  <TableCell>{p.age}</TableCell>
                  <TableCell><Badge variant="outline">{p.bloodGroup || "—"}</Badge></TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px] truncate">{p.address || "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                      <Pencil size={14} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No patients found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Register Patient Modal */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Register New Patient</DialogTitle></DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Full Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Age</Label><Input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Gender</Label><Input value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Blood Group</Label><Input value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })} /></div>
              <div className="space-y-2"><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button type="submit" disabled={createPatient.isPending}>{createPatient.isPending ? "Saving..." : "Register"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Patient Modal */}
      <Dialog open={!!editingPatient} onOpenChange={(v) => { if (!v) { setEditingPatient(null); setForm(emptyForm); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Patient</DialogTitle></DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Full Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Age</Label><Input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Gender</Label><Input value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Blood Group</Label><Input value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })} /></div>
              <div className="space-y-2"><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setEditingPatient(null); setForm(emptyForm); }}>Cancel</Button>
              <Button type="submit" disabled={updatePatient.isPending}>{updatePatient.isPending ? "Saving..." : "Update Patient"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
