import { useState } from "react";
import { DOC_CATEGORIES } from "@/constants";
import { useAuth } from "@/context/AuthContext";
import { useDocuments, useCreateDocument, useDeleteDocument } from "@/hooks/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Download, Trash2, FileText, AlertTriangle, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import type { DocCategory } from "@/types";

export default function DocumentsPage() {
  const { hasPermission } = useAuth();
  const canWrite = hasPermission("documents:write");
  const { data: documents = [], isLoading } = useDocuments();
  const createDocument = useCreateDocument();
  const deleteDocument = useDeleteDocument();
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [docCategory, setDocCategory] = useState("Clinical");

  const allDocs = documents as any[];

  const filteredDocs = allDocs.filter((d: any) => {
    const matchSearch = (d.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || (d.staffName || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = categoryFilter === "All" || d.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const expired = allDocs.filter((d: any) => {
    if (!d.expiryDate) return false;
    return new Date(d.expiryDate) < new Date();
  }).length;
  const expiringSoon = allDocs.filter((d: any) => {
    if (!d.expiryDate) return false;
    const expiry = new Date(d.expiryDate);
    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return expiry > now && expiry < thirtyDays;
  }).length;

  const handleUpload = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createDocument.mutate({
      title: fd.get("title") as string,
      category: docCategory,
      expiryDate: fd.get("expiryDate") as string,
      staffName: fd.get("staffName") as string,
    });
    setDocCategory("Clinical");
    setShowUploadModal(false);
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Compliance & Documents</h1>
          <p className="text-muted-foreground">Manage certifications, licenses, and documents</p>
        </div>
        {canWrite && (
          <Button onClick={() => setShowUploadModal(true)} className="gap-2">
            <Plus size={16} /> Upload Document
          </Button>
        )}
      </div>

      {(expired > 0 || expiringSoon > 0) && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold text-amber-800">License Alert</h3>
            <p className="text-sm text-amber-700">
              {expired} expired and {expiringSoon} expiring soon — review immediately.
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search documents or staff..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Categories</SelectItem>
            {DOC_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Staff Member</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocs.map((doc: any) => {
                const isExpired = doc.expiryDate && new Date(doc.expiryDate) < new Date();
                const isExpiringSoon = doc.expiryDate && !isExpired && new Date(doc.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                const status = isExpired ? "Expired" : isExpiringSoon ? "Expiring Soon" : "Valid";
                return (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-muted-foreground" />
                        {doc.title}
                      </div>
                    </TableCell>
                    <TableCell>{doc.staffName || "—"}</TableCell>
                    <TableCell><Badge variant="secondary">{doc.category}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{doc.expiryDate ? formatDate(doc.expiryDate) : "—"}</TableCell>
                    <TableCell>
                      <Badge variant={status === "Valid" ? "success" : status === "Expired" ? "destructive" : "warning"}>
                        {status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast.info("Document download is not available — files are tracked as metadata only in standalone mode.")} title="Download document"><Download size={14} /></Button>
                        {canWrite && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteDocument.mutate(doc.id)}>
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredDocs.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No documents found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
          <form className="space-y-4" onSubmit={handleUpload}>
            <div className="space-y-2"><Label>Document Title</Label><Input name="title" placeholder="e.g., Medical License" required /></div>
            <div className="space-y-2"><Label>Staff Name</Label><Input name="staffName" placeholder="Staff member name" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={docCategory} onValueChange={setDocCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{DOC_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Expiry Date</Label><Input name="expiryDate" type="date" required /></div>
            </div>
            <div className="space-y-2"><Label>File</Label><Input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowUploadModal(false)}>Cancel</Button>
              <Button type="submit">Upload</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
