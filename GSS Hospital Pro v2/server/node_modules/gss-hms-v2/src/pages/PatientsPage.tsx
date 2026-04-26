import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Search, Loader2, Pencil, Trash2, Eye, Upload, FileText, Download, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePatients, useCreatePatient, useUpdatePatient, useDeletePatient, usePermanentDeletePatient, usePatientDocuments, useUploadPatientDocument, useDeletePatientDocument } from "@/hooks/queries";
import { ExportButtons } from "@/components/ExportButtons";
import { useAuth } from "@/context/AuthContext";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { patientsApi } from "@/services/api";
import { toast } from "sonner";

const DOCUMENT_TYPES = ["Aadhar", "PAN", "Insurance", "Prescription", "Report", "Voter ID", "Driving License", "Other"] as const;

const emptyForm = { name: "", age: "", gender: "Male", phone: "", address: "", bloodGroup: "" };

export default function PatientsPage() {
  const { data: patients = [], isLoading } = usePatients();
  const { hasPermission, user } = useAuth();
  const createPatient = useCreatePatient();
  const updatePatient = useUpdatePatient();
  const deletePatient = useDeletePatient();
  const permanentDeletePatient = usePermanentDeletePatient();
  const uploadDoc = useUploadPatientDocument();
  const deleteDoc = useDeletePatientDocument();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editingPatient, setEditingPatient] = useState<any | null>(null);
  const [deletingPatient, setDeletingPatient] = useState<any | null>(null);
  const [viewingPatient, setViewingPatient] = useState<any | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{ url: string; mimeType: string; fileName: string } | null>(null);
  const [docType, setDocType] = useState<string>("Aadhar");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(emptyForm);
  const canDelete = hasPermission("patient:delete");
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  // Documents query for the currently viewed patient
  const { data: patientDocs = [], isLoading: docsLoading } = usePatientDocuments(viewingPatient?.id || "");

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !viewingPatient) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("File must be under 5 MB"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadDoc.mutate({ patientId: viewingPatient.id, docType, fileName: file.name, mimeType: file.type, fileData: base64 });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleViewDoc = async (doc: any) => {
    try {
      const res = await patientsApi.downloadDocument(viewingPatient.id, doc.id);
      const full = res.data as any;
      const byteString = atob(full.fileData);
      const bytes = new Uint8Array(byteString.length);
      for (let i = 0; i < byteString.length; i++) bytes[i] = byteString.charCodeAt(i);
      const blob = new Blob([bytes], { type: full.mimeType });
      const url = URL.createObjectURL(blob);
      setPreviewDoc({ url, mimeType: full.mimeType, fileName: full.fileName });
    } catch { toast.error("Failed to load document"); }
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
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="View Details & Documents" onClick={() => setViewingPatient(p)}>
                      <Eye size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                      <Pencil size={14} />
                    </Button>
                    {canDelete && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeletingPatient(p)}>
                        <Trash2 size={14} />
                      </Button>
                    )}
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

      {/* Delete Confirmation */}
      <DeleteConfirmationDialog
        open={!!deletingPatient}
        onClose={() => setDeletingPatient(null)}
        onConfirm={() => { deletePatient.mutate(deletingPatient?.id); setDeletingPatient(null); }}
        entityName={deletingPatient?.name || ""}
        entityType="patient"
        isSuperAdmin={isSuperAdmin}
        onPermanentDelete={() => { permanentDeletePatient.mutate(deletingPatient?.id); setDeletingPatient(null); }}
        isPending={deletePatient.isPending || permanentDeletePatient.isPending}
      />

      {/* ── Patient Detail + Documents Dialog ──────────── */}
      <Dialog open={!!viewingPatient} onOpenChange={(o) => { if (!o) setViewingPatient(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Patient Details — {viewingPatient?.name}</DialogTitle></DialogHeader>
          <Tabs defaultValue="info">
            <TabsList className="mb-4">
              <TabsTrigger value="info">Information</TabsTrigger>
              <TabsTrigger value="documents">Documents {(patientDocs as any[]).length > 0 && <Badge variant="secondary" className="ml-1.5">{(patientDocs as any[]).length}</Badge>}</TabsTrigger>
            </TabsList>

            {/* Info tab */}
            <TabsContent value="info">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Name</span><p className="font-medium mt-0.5">{viewingPatient?.name}</p></div>
                <div><span className="text-muted-foreground">Phone</span><p className="font-medium mt-0.5">{viewingPatient?.phone || "—"}</p></div>
                <div><span className="text-muted-foreground">Gender</span><p className="font-medium mt-0.5">{viewingPatient?.gender}</p></div>
                <div><span className="text-muted-foreground">Age</span><p className="font-medium mt-0.5">{viewingPatient?.age}</p></div>
                <div><span className="text-muted-foreground">Blood Group</span><p className="font-medium mt-0.5">{viewingPatient?.bloodGroup || "—"}</p></div>
                <div><span className="text-muted-foreground">Emergency Contact</span><p className="font-medium mt-0.5">{viewingPatient?.emergencyContact || "—"}</p></div>
                <div className="col-span-2"><span className="text-muted-foreground">Address</span><p className="font-medium mt-0.5">{viewingPatient?.address || "—"}</p></div>
              </div>
            </TabsContent>

            {/* Documents tab */}
            <TabsContent value="documents">
              <div className="space-y-4">
                {/* Upload section */}
                <Card>
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm flex items-center gap-2"><Upload size={14} /> Upload Document</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 pt-0">
                    <div className="flex items-end gap-3">
                      <div className="space-y-1 flex-1">
                        <Label className="text-xs">Document Type</Label>
                        <Select value={docType} onValueChange={setDocType}>
                          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {DOCUMENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <input ref={fileInputRef} type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileUpload} />
                        <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploadDoc.isPending}>
                          {uploadDoc.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload size={14} className="mr-1" />}
                          Choose File
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Accepted: Images & PDFs (max 5 MB)</p>
                  </CardContent>
                </Card>

                {/* Document list */}
                {docsLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                ) : (patientDocs as any[]).length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No documents uploaded yet</p>
                ) : (
                  <div className="space-y-2">
                    {(patientDocs as any[]).map((doc: any) => (
                      <div key={doc.id} className="flex items-center gap-3 border rounded-lg px-3 py-2">
                        <FileText className="h-8 w-8 text-primary/60 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{doc.fileName}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className="text-xs">{doc.docType}</Badge>
                            <span className="text-xs text-muted-foreground">{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="View" onClick={() => handleViewDoc(doc)}>
                          <Eye size={14} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Delete" onClick={() => deleteDoc.mutate({ patientId: viewingPatient.id, docId: doc.id })}>
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* ── Document Preview Dialog ────────────────────── */}
      <Dialog open={!!previewDoc} onOpenChange={(o) => { if (!o) { if (previewDoc) URL.revokeObjectURL(previewDoc.url); setPreviewDoc(null); } }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText size={16} /> {previewDoc?.fileName}
              <a href={previewDoc?.url} download={previewDoc?.fileName} className="ml-auto">
                <Button variant="outline" size="sm"><Download size={14} className="mr-1" /> Download</Button>
              </a>
            </DialogTitle>
          </DialogHeader>
          {previewDoc?.mimeType.startsWith("image/") ? (
            <img src={previewDoc.url} alt={previewDoc.fileName} className="w-full rounded-lg" />
          ) : previewDoc?.mimeType === "application/pdf" ? (
            <iframe src={previewDoc.url} className="w-full h-[70vh] rounded-lg border" title={previewDoc.fileName} />
          ) : (
            <p className="text-center py-8 text-muted-foreground">Preview not available — use the download button</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
