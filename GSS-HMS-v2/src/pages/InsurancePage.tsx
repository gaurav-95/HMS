import { useState } from "react";
import { useDocuments, useCreateDocument, useDeleteDocument, usePatients } from "@/hooks/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Plus, Search, Trash2, FileText, Loader2, Users } from "lucide-react";
import { formatDate } from "@/lib/utils";

const INSURANCE_TYPES = ["Health Insurance", "Life Insurance", "Accidental", "Mediclaim", "Group Policy", "Government Scheme"];

export default function InsurancePage() {
  const { data: documents = [], isLoading: loadingDocs } = useDocuments();
  const { data: patients = [], isLoading: loadingPatients } = usePatients();
  const createDocument = useCreateDocument();
  const deleteDocument = useDeleteDocument();
  const [showUpload, setShowUpload] = useState(false);
  const [insType, setInsType] = useState("Health Insurance");
  const [searchQuery, setSearchQuery] = useState("");

  const allDocs = (documents as any[]).filter((d: any) =>
    INSURANCE_TYPES.some((t) => d.category?.toLowerCase().includes(t.toLowerCase())) || d.category === "Insurance"
  );
  const insuredPatients = (patients as any[]).filter((p: any) => p.insuranceId);

  const filteredDocs = allDocs.filter((d: any) =>
    d.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.staffName?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredPatients = insuredPatients.filter((p: any) =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.insuranceId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const expired = allDocs.filter((d: any) => d.expiryDate && new Date(d.expiryDate) < new Date()).length;
  const expiringSoon = allDocs.filter((d: any) => {
    if (!d.expiryDate) return false;
    const exp = new Date(d.expiryDate);
    const now = new Date();
    return exp > now && exp < new Date(now.getTime() + 30 * 86400000);
  }).length;

  const handleUpload = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createDocument.mutate({
      title: fd.get("title") as string,
      category: insType,
      staffName: fd.get("entityName") as string,
      expiryDate: fd.get("expiryDate") as string,
    });
    setInsType("Health Insurance");
    setShowUpload(false);
  };

  if (loadingDocs || loadingPatients) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Insurance Documents</h1>
          <p className="text-muted-foreground">Upload and manage insurance documents — patient-wise and policy-wise</p>
        </div>
        <Button onClick={() => setShowUpload(true)} className="gap-2"><Plus size={16} /> Upload Document</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Insurance Docs</p><p className="text-2xl font-bold">{allDocs.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Insured Patients</p><p className="text-2xl font-bold">{insuredPatients.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Expired Policies</p><p className="text-2xl font-bold text-destructive">{expired}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Expiring Soon</p><p className="text-2xl font-bold text-amber-600">{expiringSoon}</p></CardContent></Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search documents or patients..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
      </div>

      <Tabs defaultValue="documents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="documents" className="gap-2"><FileText size={14} /> Documents ({filteredDocs.length})</TabsTrigger>
          <TabsTrigger value="patients" className="gap-2"><Users size={14} /> Insured Patients ({filteredPatients.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="documents">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocs.map((doc: any) => {
                    const isExp = doc.expiryDate && new Date(doc.expiryDate) < new Date();
                    const isSoon = doc.expiryDate && !isExp && new Date(doc.expiryDate) < new Date(Date.now() + 30 * 86400000);
                    const st = isExp ? "Expired" : isSoon ? "Expiring" : "Active";
                    return (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium"><div className="flex items-center gap-2"><Shield size={14} className="text-primary" />{doc.title}</div></TableCell>
                        <TableCell>{doc.staffName || "—"}</TableCell>
                        <TableCell><Badge variant="secondary">{doc.category}</Badge></TableCell>
                        <TableCell className="text-muted-foreground">{doc.expiryDate ? formatDate(doc.expiryDate) : "—"}</TableCell>
                        <TableCell><Badge variant={st === "Active" ? "success" : st === "Expired" ? "destructive" : "warning"}>{st}</Badge></TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteDocument.mutate(doc.id)}><Trash2 size={14} /></Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredDocs.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No insurance documents found</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patients">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient Name</TableHead>
                    <TableHead>Age / Gender</TableHead>
                    <TableHead>Insurance ID</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Blood Group</TableHead>
                    <TableHead>Registered</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatients.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>{p.age} / {p.gender}</TableCell>
                      <TableCell><Badge variant="outline">{p.insuranceId}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{p.phone}</TableCell>
                      <TableCell>{p.bloodGroup || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(p.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                  {filteredPatients.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No insured patients found</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upload Insurance Document</DialogTitle></DialogHeader>
          <form className="space-y-4" onSubmit={handleUpload}>
            <div className="space-y-2"><Label>Document Title</Label><Input name="title" placeholder="e.g., Mediclaim Policy 2026" required /></div>
            <div className="space-y-2"><Label>Entity Name (Patient / Doctor)</Label><Input name="entityName" placeholder="Name or entity" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Insurance Type</Label>
                <Select value={insType} onValueChange={setInsType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{INSURANCE_TYPES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Policy Expiry</Label><Input name="expiryDate" type="date" required /></div>
            </div>
            <div className="space-y-2"><Label>File</Label><Input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowUpload(false)}>Cancel</Button>
              <Button type="submit">Upload</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
