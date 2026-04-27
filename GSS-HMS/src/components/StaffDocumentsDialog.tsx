import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  useStaffDocuments, useUploadStaffDocument, useDeleteStaffDocument, useDocumentAsPhoto, useUploadStaffFile,
  useStaffCertifications, useCreateCertification, useUpdateCertification, useDeleteCertification,
} from "@/hooks/queries";
import { getUploadUrl } from "@/services/api";
import { getInitials, formatDate } from "@/lib/utils";
import { Upload, Trash2, FileText, Download, Camera, Loader2, ImagePlus, Plus, Edit, Award, Save, X } from "lucide-react";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import type { Staff, StaffDocument, Certification } from "@/types";

const OFFICIAL_DOC_TYPES = ["Aadhaar Card", "PAN Card", "Voter ID", "Driving License", "Passport", "Bank Passbook", "Other"];
const MEDICAL_DOC_TYPES = ["Degree Certificate", "Registration Certificate", "Experience Letter", "Training Certificate", "Medical License", "Other"];

interface Props {
  open: boolean;
  onClose: () => void;
  staff: Staff;
  canEdit: boolean;
}

export function StaffDocumentsDialog({ open, onClose, staff, canEdit }: Props) {
  const { data: documents = [], isLoading } = useStaffDocuments(staff.id);
  const uploadDoc = useUploadStaffDocument();
  const deleteDoc = useDeleteStaffDocument();
  const useAsPhoto = useDocumentAsPhoto();
  const uploadPhoto = useUploadStaffFile();

  // Certifications
  const { data: certs = [], isLoading: certsLoading } = useStaffCertifications(staff.id);
  const createCert = useCreateCertification();
  const updateCert = useUpdateCertification();
  const deleteCert = useDeleteCertification();

  const [tab, setTab] = useState("photo");
  const [docType, setDocType] = useState("");
  const [deletingDoc, setDeletingDoc] = useState<StaffDocument | null>(null);
  const [deletingCert, setDeletingCert] = useState<any | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Cert form state
  const [showCertForm, setShowCertForm] = useState(false);
  const [editingCert, setEditingCert] = useState<any | null>(null);
  const [certName, setCertName] = useState("");
  const [certExpiry, setCertExpiry] = useState("");
  const [certStatus, setCertStatus] = useState("Valid");

  const photoInputRef = useRef<HTMLInputElement>(null);
  const officialInputRef = useRef<HTMLInputElement>(null);
  const medicalInputRef = useRef<HTMLInputElement>(null);

  const officialDocs = (documents as StaffDocument[]).filter((d) => d.category === "official");
  const medicalDocs = (documents as StaffDocument[]).filter((d) => d.category === "medical");

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    uploadPhoto.mutate({ id: staff.id, file, fieldType: "photo" });
    e.target.value = "";
  };

  const handleDocUpload = (category: "official" | "medical") => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!docType) return;
    uploadDoc.mutate({ staffId: staff.id, file, category, documentType: docType });
    setDocType("");
    e.target.value = "";
  };

  const handleUseAsPhoto = (doc: StaffDocument) => {
    useAsPhoto.mutate({ staffId: staff.id, documentId: doc.id });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImage = (mime: string) => mime.startsWith("image/");

  const resetCertForm = () => { setCertName(""); setCertExpiry(""); setCertStatus("Valid"); setEditingCert(null); setShowCertForm(false); };

  const handleCertSubmit = () => {
    if (!certName || !certExpiry || !certStatus) return;
    if (editingCert) {
      updateCert.mutate({ staffId: staff.id, certId: editingCert.id, name: certName, expiryDate: certExpiry, status: certStatus });
    } else {
      createCert.mutate({ staffId: staff.id, name: certName, expiryDate: certExpiry, status: certStatus });
    }
    resetCertForm();
  };

  const startEditCert = (c: any) => {
    setEditingCert(c);
    setCertName(c.name);
    setCertExpiry(c.expiryDate);
    setCertStatus(c.status);
    setShowCertForm(true);
  };

  const certStatusColor = (s: string) => s === "Valid" ? "bg-emerald-500" : s === "Expiring" ? "bg-amber-500" : "bg-red-500";

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                {staff.photoPath && <AvatarImage src={getUploadUrl(staff.photoPath)} />}
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                  {getInitials(staff.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <span>{staff.name} — Documents</span>
                <p className="text-xs text-muted-foreground font-normal">{staff.role} · {staff.department}</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <Tabs value={tab} onValueChange={setTab} className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="photo">Photo</TabsTrigger>
              <TabsTrigger value="official">
                Official {officialDocs.length > 0 && <Badge variant="secondary" className="ml-1.5 h-5 min-w-[20px] px-1 text-[10px]">{officialDocs.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="medical">
                Medical {medicalDocs.length > 0 && <Badge variant="secondary" className="ml-1.5 h-5 min-w-[20px] px-1 text-[10px]">{medicalDocs.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="certs">
                Certs {(certs as any[]).length > 0 && <Badge variant="secondary" className="ml-1.5 h-5 min-w-[20px] px-1 text-[10px]">{(certs as any[]).length}</Badge>}
              </TabsTrigger>
            </TabsList>

            {/* ─── Profile Photo Tab ─────────────────────────── */}
            <TabsContent value="photo" className="flex-1 overflow-y-auto mt-4">
              <div className="flex flex-col items-center gap-4">
                <Avatar className="h-32 w-32 border-2">
                  {staff.photoPath && <AvatarImage src={getUploadUrl(staff.photoPath)} />}
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-3xl">
                    {getInitials(staff.name)}
                  </AvatarFallback>
                </Avatar>
                {canEdit && (
                  <>
                    <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                    <Button variant="outline" className="gap-2" onClick={() => photoInputRef.current?.click()} disabled={uploadPhoto.isPending}>
                      {uploadPhoto.isPending ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                      {staff.photoPath ? "Change Photo" : "Upload Photo"}
                    </Button>
                  </>
                )}
                <p className="text-xs text-muted-foreground text-center max-w-xs">
                  Upload a passport-size photo, or use the <ImagePlus size={12} className="inline" /> button on any uploaded ID document to use it as profile photo.
                </p>
              </div>
            </TabsContent>

            {/* ─── Official Documents Tab ────────────────────── */}
            <TabsContent value="official" className="flex-1 overflow-y-auto mt-4 space-y-4">
              {canEdit && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Select value={docType} onValueChange={setDocType}>
                    <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select document type" /></SelectTrigger>
                    <SelectContent>
                      {OFFICIAL_DOC_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <input ref={officialInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleDocUpload("official")} />
                  <Button size="sm" className="gap-1.5" disabled={!docType || uploadDoc.isPending} onClick={() => officialInputRef.current?.click()}>
                    {uploadDoc.isPending ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    Upload
                  </Button>
                </div>
              )}
              {isLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : officialDocs.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground text-sm">No official documents uploaded yet.</p>
              ) : (
                <div className="space-y-2">
                  {officialDocs.map((doc) => (
                    <DocumentCard key={doc.id} doc={doc} canEdit={canEdit} isImage={isImage(doc.mimeType)}
                      onDelete={() => setDeletingDoc(doc)} onUseAsPhoto={() => handleUseAsPhoto(doc)}
                      onPreview={() => setPreviewUrl(getUploadUrl(`/uploads/staff/${doc.fileName}`))}
                      formatFileSize={formatFileSize} useAsPhotoPending={useAsPhoto.isPending} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ─── Medical Documents Tab ─────────────────────── */}
            <TabsContent value="medical" className="flex-1 overflow-y-auto mt-4 space-y-4">
              {canEdit && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Select value={docType} onValueChange={setDocType}>
                    <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select document type" /></SelectTrigger>
                    <SelectContent>
                      {MEDICAL_DOC_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <input ref={medicalInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleDocUpload("medical")} />
                  <Button size="sm" className="gap-1.5" disabled={!docType || uploadDoc.isPending} onClick={() => medicalInputRef.current?.click()}>
                    {uploadDoc.isPending ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    Upload
                  </Button>
                </div>
              )}
              {isLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : medicalDocs.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground text-sm">No medical documents or certifications uploaded yet.</p>
              ) : (
                <div className="space-y-2">
                  {medicalDocs.map((doc) => (
                    <DocumentCard key={doc.id} doc={doc} canEdit={canEdit} isImage={isImage(doc.mimeType)}
                      onDelete={() => setDeletingDoc(doc)} onUseAsPhoto={() => handleUseAsPhoto(doc)}
                      onPreview={() => setPreviewUrl(getUploadUrl(`/uploads/staff/${doc.fileName}`))}
                      formatFileSize={formatFileSize} useAsPhotoPending={useAsPhoto.isPending} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ─── Certifications Tab ────────────────────────── */}
            <TabsContent value="certs" className="flex-1 overflow-y-auto mt-4 space-y-4">
              {canEdit && !showCertForm && (
                <Button size="sm" className="gap-1.5" onClick={() => { resetCertForm(); setShowCertForm(true); }}>
                  <Plus size={14} /> Add Certification
                </Button>
              )}
              {showCertForm && (
                <div className="p-3 rounded-lg border bg-muted/30 space-y-3">
                  <p className="text-sm font-medium">{editingCert ? "Edit Certification" : "Add Certification"}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Name <span className="text-destructive">*</span></Label>
                      <Input value={certName} onChange={(e) => setCertName(e.target.value)} placeholder="e.g. Medical License" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Expiry Date <span className="text-destructive">*</span></Label>
                      <Input type="date" value={certExpiry} onChange={(e) => setCertExpiry(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Status <span className="text-destructive">*</span></Label>
                    <Select value={certStatus} onValueChange={setCertStatus}>
                      <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Valid">Valid</SelectItem>
                        <SelectItem value="Expiring">Expiring</SelectItem>
                        <SelectItem value="Expired">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="gap-1.5" onClick={handleCertSubmit} disabled={!certName || !certExpiry || createCert.isPending || updateCert.isPending}>
                      <Save size={14} /> {editingCert ? "Update" : "Save"}
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={resetCertForm}>
                      <X size={14} /> Cancel
                    </Button>
                  </div>
                </div>
              )}
              {certsLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : (certs as any[]).length === 0 ? (
                <p className="text-center py-8 text-muted-foreground text-sm">No certifications recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {(certs as any[]).map((c: any) => (
                    <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                      <div className="h-10 w-10 rounded shrink-0 flex items-center justify-center bg-muted">
                        <Award size={20} className="text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{c.name}</span>
                          <span className={`inline-block h-2.5 w-2.5 rounded-full ${certStatusColor(c.status)}`} title={c.status} />
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{c.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">Expires: {formatDate(c.expiryDate)}</p>
                      </div>
                      {canEdit && (
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEditCert(c)} title="Edit">
                            <Edit size={14} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeletingCert(c)} title="Delete">
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Image Preview Overlay */}
      {previewUrl && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center cursor-pointer" onClick={() => setPreviewUrl(null)}>
          <img src={previewUrl} alt="Preview" className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl" />
        </div>
      )}

      {/* Delete Confirmation */}
      <DeleteConfirmationDialog
        open={!!deletingDoc}
        onClose={() => setDeletingDoc(null)}
        onConfirm={() => { if (deletingDoc) { deleteDoc.mutate({ staffId: staff.id, docId: deletingDoc.id }); setDeletingDoc(null); } }}
        entityName={deletingDoc?.originalName || ""}
        entityType="document"
        isPending={deleteDoc.isPending}
      />

      {/* Delete Certification Confirmation */}
      <DeleteConfirmationDialog
        open={!!deletingCert}
        onClose={() => setDeletingCert(null)}
        onConfirm={() => { if (deletingCert) { deleteCert.mutate({ staffId: staff.id, certId: deletingCert.id }); setDeletingCert(null); } }}
        entityName={deletingCert?.name || ""}
        entityType="certification"
        isPending={deleteCert.isPending}
      />
    </>
  );
}

// ─── Document Card ──────────────────────────────────────────

function DocumentCard({ doc, canEdit, isImage, onDelete, onUseAsPhoto, onPreview, formatFileSize, useAsPhotoPending }: {
  doc: StaffDocument; canEdit: boolean; isImage: boolean;
  onDelete: () => void; onUseAsPhoto: () => void; onPreview: () => void;
  formatFileSize: (n: number) => string; useAsPhotoPending: boolean;
}) {
  const fileUrl = getUploadUrl(`/uploads/staff/${doc.fileName}`);
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
      {/* Thumbnail or icon */}
      <div className="h-12 w-12 rounded shrink-0 flex items-center justify-center bg-muted overflow-hidden cursor-pointer" onClick={isImage ? onPreview : undefined}>
        {isImage ? (
          <img src={fileUrl} alt={doc.originalName} className="h-full w-full object-cover" />
        ) : (
          <FileText size={24} className="text-muted-foreground" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{doc.documentType}</span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">{doc.category}</Badge>
        </div>
        <p className="text-xs text-muted-foreground truncate">{doc.originalName} · {formatFileSize(doc.fileSize)}</p>
        <p className="text-[10px] text-muted-foreground">{formatDate(doc.uploadedAt)}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {isImage && canEdit && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onUseAsPhoto} title="Use as profile photo" disabled={useAsPhotoPending}>
            <ImagePlus size={14} />
          </Button>
        )}
        <a href={fileUrl} download={doc.originalName} onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Download">
            <Download size={14} />
          </Button>
        </a>
        {canEdit && (
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={onDelete} title="Delete">
            <Trash2 size={14} />
          </Button>
        )}
      </div>
    </div>
  );
}
