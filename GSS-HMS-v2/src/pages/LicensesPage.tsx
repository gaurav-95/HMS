import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import {
  useHospitalLicenses,
  useCreateHospitalLicense,
  useUpdateHospitalLicense,
  useDeleteHospitalLicense,
  useUploadHospitalLicense,
  useAddressHospitalLicense,
  useUnaddressHospitalLicense,
  useAllCertifications,
  useAddressCertification,
  useUnaddressCertification,
  useUploadCertificationFile,
} from "@/hooks/queries";
import { getUploadUrl } from "@/services/api";
import type { HospitalLicense } from "@/types";
import {
  FileCheck2, Plus, Upload, Download, Eye, Pencil, Trash2, CheckCircle2,
  RotateCcw, Loader2, Search, ShieldAlert, Building2,
} from "lucide-react";

const LICENSE_CATEGORIES = ["Statutory", "Clinical", "Income Tax", "Regulatory", "Accreditation", "Pharmacy", "Other"] as const;

const STATUS_COLORS: Record<string, string> = {
  Valid: "bg-green-100 text-green-700 border-green-300",
  Expiring: "bg-amber-100 text-amber-700 border-amber-300",
  Expired: "bg-red-100 text-red-700 border-red-300",
  "N/A": "bg-gray-100 text-gray-600 border-gray-300",
};

const BLANK_FORM = {
  name: "",
  category: "Statutory",
  issuingAuthority: "",
  licenseNumber: "",
  issueDate: "",
  expiryDate: "",
};

interface CertRow {
  id: string;
  staffId: string;
  staffName: string;
  department: string;
  certName: string;
  expiryDate: string;
  status: string;
  addressed: boolean;
  filePath?: string | null;
  fileSize?: string | null;
}

export default function LicensesPage() {
  const { hasPermission } = useAuth();
  const canWrite = hasPermission("staff:write");
  const canDelete = hasPermission("staff:delete");

  // ── Queries & Mutations ─────────────────────────────────
  const { data: allLicenses = [], isLoading: loadingLic } = useHospitalLicenses();
  const { data: allCerts = [], isLoading: loadingCerts } = useAllCertifications();
  const licArray: HospitalLicense[] = Array.isArray(allLicenses) ? allLicenses as HospitalLicense[] : [];
  const certArray: CertRow[] = Array.isArray(allCerts) ? allCerts as CertRow[] : [];
  const createLic = useCreateHospitalLicense();
  const updateLic = useUpdateHospitalLicense();
  const deleteLic = useDeleteHospitalLicense();
  const uploadLic = useUploadHospitalLicense();
  const addressLic = useAddressHospitalLicense();
  const unaddressLic = useUnaddressHospitalLicense();
  const addressCert = useAddressCertification();
  const unaddressCert = useUnaddressCertification();
  const uploadCertFile = useUploadCertificationFile();

  // ── Local State ─────────────────────────────────────────
  const [tab, setTab] = useState<"licenses" | "certifications">("licenses");

  // Licenses tab filters
  const [licSearch, setLicSearch] = useState("");
  const [licStatusFilter, setLicStatusFilter] = useState("all");
  const [licCategoryFilter, setLicCategoryFilter] = useState("all");
  const [showAddressed, setShowAddressed] = useState(false);

  // Certifications tab filters
  const [certSearch, setCertSearch] = useState("");
  const [certStatusFilter, setCertStatusFilter] = useState("all");
  const [certShowAddressed, setCertShowAddressed] = useState(false);

  // Dialogs
  const [addOpen, setAddOpen] = useState(false);
  const [editLicense, setEditLicense] = useState<HospitalLicense | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingName, setDeletingName] = useState("");
  const [addressingLicId, setAddressingLicId] = useState<string | null>(null);
  const [addressingLicName, setAddressingLicName] = useState("");
  const [addressingCertId, setAddressingCertId] = useState<string | null>(null);
  const [addressingCertName, setAddressingCertName] = useState("");

  const [form, setForm] = useState({ ...BLANK_FORM });
  const [editForm, setEditForm] = useState({ ...BLANK_FORM });

  // License file upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  // Certification file upload
  const certFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingCertId, setUploadingCertId] = useState<string | null>(null);
  const [uploadingCertStaffId, setUploadingCertStaffId] = useState<string | null>(null);

  // File viewer
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerTitle, setViewerTitle] = useState("");
  const [viewerType, setViewerType] = useState<"image" | "pdf">("image");
  const [viewerLoading, setViewerLoading] = useState(false);
  const [viewerError, setViewerError] = useState<string | null>(null);
  const prevViewerUrl = useRef<string | null>(null);

  useEffect(() => {
    return () => { if (prevViewerUrl.current) URL.revokeObjectURL(prevViewerUrl.current); };
  }, []);

  function closeViewer() {
    if (prevViewerUrl.current) { URL.revokeObjectURL(prevViewerUrl.current); prevViewerUrl.current = null; }
    setViewerUrl(null);
    setViewerError(null);
    setViewerLoading(false);
    setViewerTitle("");
  }

  async function openViewer(apiPath: string, title: string) {
    setViewerTitle(title);
    setViewerLoading(true);
    setViewerUrl(null);
    setViewerError(null);
    if (prevViewerUrl.current) { URL.revokeObjectURL(prevViewerUrl.current); prevViewerUrl.current = null; }
    try {
      const token = localStorage.getItem("auth-token") ?? "";
      const isTauri = window.location.protocol === "tauri:" ||
        (window.location.protocol === "https:" && window.location.hostname === "tauri.localhost");
      const base = isTauri ? "http://localhost:3001" : "";
      const resp = await fetch(`${base}${apiPath}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) {
        const text = await resp.text().catch(() => `HTTP ${resp.status}`);
        let msg: string;
        try { msg = JSON.parse(text).error ?? text; } catch { msg = text || `HTTP ${resp.status}`; }
        setViewerError(msg);
        return;
      }
      const blob = await resp.blob();
      const mime = blob.type || resp.headers.get("content-type") || "";
      const objUrl = URL.createObjectURL(blob);
      prevViewerUrl.current = objUrl;
      setViewerUrl(objUrl);
      setViewerType(mime.startsWith("image/") ? "image" : "pdf");
    } catch (err: any) {
      setViewerError(err?.message ?? "Could not load the file.");
    } finally {
      setViewerLoading(false);
    }
  }

  // ── Prepare license list ─────────────────────────────────
  const licenses = licArray.filter((l) => {
    if (!showAddressed && l.addressed) return false;
    if (licStatusFilter !== "all" && l.status !== licStatusFilter) return false;
    if (licCategoryFilter !== "all" && l.category !== licCategoryFilter) return false;
    if (licSearch) {
      const q = licSearch.toLowerCase();
      return (
        l.name.toLowerCase().includes(q) ||
        (l.licenseNumber || "").toLowerCase().includes(q) ||
        (l.issuingAuthority || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  // ── Prepare certs list ───────────────────────────────────
  const certs = certArray.filter((c) => {
    if (!certShowAddressed && c.addressed) return false;
    if (certStatusFilter !== "all" && c.status !== certStatusFilter) return false;
    if (certSearch) {
      const q = certSearch.toLowerCase();
      return (
        c.certName.toLowerCase().includes(q) ||
        c.staffName.toLowerCase().includes(q) ||
        (c.department || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  // ── Handlers ─────────────────────────────────────────────
  function handleAdd() {
    createLic.mutate(form as any, {
      onSuccess: () => { setAddOpen(false); setForm({ ...BLANK_FORM }); },
    });
  }

  function handleEdit() {
    if (!editLicense) return;
    updateLic.mutate({ id: editLicense.id, ...editForm } as any, {
      onSuccess: () => setEditLicense(null),
    });
  }

  function handleDelete() {
    if (!deletingId) return;
    deleteLic.mutate(deletingId, { onSuccess: () => setDeletingId(null) });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file && uploadingId) {
      uploadLic.mutate({ id: uploadingId, file });
    }
    setUploadingId(null);
    e.target.value = "";
  }

  function handleCertFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file && uploadingCertId && uploadingCertStaffId) {
      uploadCertFile.mutate({ staffId: uploadingCertStaffId, certId: uploadingCertId, file });
    }
    setUploadingCertId(null);
    setUploadingCertStaffId(null);
    e.target.value = "";
  }

  function openEdit(lic: HospitalLicense) {
    setEditForm({
      name: lic.name,
      category: lic.category,
      issuingAuthority: lic.issuingAuthority || "",
      licenseNumber: lic.licenseNumber || "",
      issueDate: lic.issueDate || "",
      expiryDate: lic.expiryDate || "",
    });
    setEditLicense(lic);
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileCheck2 className="h-6 w-6 text-primary" />
            Licenses &amp; Certifications
          </h1>
          <p className="text-muted-foreground">Manage hospital licenses and staff certifications</p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setTab("licenses")}
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${tab === "licenses" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          <span className="flex items-center gap-1.5"><Building2 size={15} /> Hospital Licenses</span>
        </button>
        <button
          onClick={() => setTab("certifications")}
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${tab === "certifications" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          <span className="flex items-center gap-1.5"><ShieldAlert size={15} /> Staff Certifications</span>
        </button>
      </div>

      {/* ── HOSPITAL LICENSES TAB ── */}
      {tab === "licenses" && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search licenses…" className="pl-8 h-9 text-sm" value={licSearch} onChange={(e) => setLicSearch(e.target.value)} />
            </div>
            <Select value={licStatusFilter} onValueChange={setLicStatusFilter}>
              <SelectTrigger className="w-36 h-9 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Valid">Valid</SelectItem>
                <SelectItem value="Expiring">Expiring</SelectItem>
                <SelectItem value="Expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Select value={licCategoryFilter} onValueChange={setLicCategoryFilter}>
              <SelectTrigger className="w-36 h-9 text-sm"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {LICENSE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button
              variant={showAddressed ? "default" : "outline"}
              size="sm"
              className="h-9 text-xs"
              onClick={() => setShowAddressed((v) => !v)}
            >
              {showAddressed ? "Hide Addressed" : "Show Addressed"}
            </Button>
            <div className="flex-1" />
            {canWrite && (
              <Button size="sm" className="h-9 gap-1.5" onClick={() => { setForm({ ...BLANK_FORM }); setAddOpen(true); }}>
                <Plus size={15} /> Add License
              </Button>
            )}
          </div>

          {/* Summary badges */}
          {!loadingLic && (
            <div className="flex gap-2 flex-wrap text-xs">
              {(["Valid", "Expiring", "Expired"] as const).map((s) => {
                const cnt = licArray.filter((l) => l.status === s && !l.addressed).length;
                if (cnt === 0) return null;
                return (
                  <span key={s} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[s]}`}>
                    {cnt} {s}
                  </span>
                );
              })}
              {licArray.filter((l) => l.addressed).length > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border font-medium bg-slate-100 text-slate-600 border-slate-300">
                  {licArray.filter((l) => l.addressed).length} Addressed
                </span>
              )}
            </div>
          )}

          {/* Table */}
          {loadingLic ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : licenses.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground text-sm">
                No licenses found.{" "}
                {canWrite && <button className="text-primary underline" onClick={() => { setForm({ ...BLANK_FORM }); setAddOpen(true); }}>Add one</button>}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left py-2.5 px-4 font-medium text-muted-foreground">Name</th>
                        <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">Category</th>
                        <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">License #</th>
                        <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">Issuing Authority</th>
                        <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">Issue Date</th>
                        <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">Expiry Date</th>
                        <th className="text-center py-2.5 px-3 font-medium text-muted-foreground">Status</th>
                        <th className="text-center py-2.5 px-3 font-medium text-muted-foreground">File</th>
                        <th className="text-right py-2.5 px-4 font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {licenses.map((lic) => (
                        <tr key={lic.id} className={`border-b last:border-0 hover:bg-muted/20 ${lic.addressed ? "opacity-60" : ""}`}>
                          <td className="py-2.5 px-4 font-medium">
                            <div>{lic.name}</div>
                            {lic.addressed && <span className="text-[10px] text-green-600 font-normal">✓ Addressed</span>}
                          </td>
                          <td className="py-2.5 px-3 text-muted-foreground">{lic.category}</td>
                          <td className="py-2.5 px-3 text-muted-foreground font-mono text-xs">{lic.licenseNumber || "—"}</td>
                          <td className="py-2.5 px-3 text-muted-foreground text-xs">{lic.issuingAuthority || "—"}</td>
                          <td className="py-2.5 px-3 text-muted-foreground text-xs">{lic.issueDate || "—"}</td>
                          <td className="py-2.5 px-3 text-muted-foreground text-xs">{lic.expiryDate || "—"}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${STATUS_COLORS[lic.status] ?? STATUS_COLORS["N/A"]}`}>
                              {lic.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {lic.filePath ? (
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="ghost" size="sm" className="h-7 w-7 p-0"
                                  title="View"
                                  onClick={() => openViewer(`/api/hospital-licenses/${lic.id}/download`, lic.name)}
                                >
                                  <Eye size={14} />
                                </Button>
                                <Button
                                  variant="ghost" size="sm" className="h-7 w-7 p-0"
                                  title="Download"
                                  onClick={() => window.open(getUploadUrl(lic.filePath!), "_blank")}
                                >
                                  <Download size={14} />
                                </Button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {canWrite && (
                                <Button
                                  variant="ghost" size="sm" className="h-7 w-7 p-0" title="Upload file"
                                  onClick={() => { setUploadingId(lic.id); fileInputRef.current?.click(); }}
                                  disabled={uploadLic.isPending && uploadingId === lic.id}
                                >
                                  {uploadLic.isPending && uploadingId === lic.id ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                                </Button>
                              )}
                              {canWrite && (
                                <Button
                                  variant="ghost" size="sm" className="h-7 w-7 p-0" title="Edit"
                                  onClick={() => openEdit(lic)}
                                >
                                  <Pencil size={13} />
                                </Button>
                              )}
                              {canWrite && !lic.addressed && (
                                <Button
                                  variant="ghost" size="sm" className="h-7 w-7 p-0 text-green-600 hover:text-green-700" title="Mark as addressed"
                                  onClick={() => { setAddressingLicId(lic.id); setAddressingLicName(lic.name); }}
                                >
                                  <CheckCircle2 size={13} />
                                </Button>
                              )}
                              {canWrite && lic.addressed && (
                                <Button
                                  variant="ghost" size="sm" className="h-7 w-7 p-0 text-amber-600 hover:text-amber-700" title="Reopen (unaddress)"
                                  onClick={() => unaddressLic.mutate(lic.id)}
                                  disabled={unaddressLic.isPending}
                                >
                                  <RotateCcw size={13} />
                                </Button>
                              )}
                              {canDelete && (
                                <Button
                                  variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" title="Delete"
                                  onClick={() => { setDeletingId(lic.id); setDeletingName(lic.name); }}
                                >
                                  <Trash2 size={13} />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── STAFF CERTIFICATIONS TAB ── */}
      {tab === "certifications" && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name, staff, dept…" className="pl-8 h-9 text-sm" value={certSearch} onChange={(e) => setCertSearch(e.target.value)} />
            </div>
            <Select value={certStatusFilter} onValueChange={setCertStatusFilter}>
              <SelectTrigger className="w-36 h-9 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Valid">Valid</SelectItem>
                <SelectItem value="Expiring">Expiring</SelectItem>
                <SelectItem value="Expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={certShowAddressed ? "default" : "outline"}
              size="sm"
              className="h-9 text-xs"
              onClick={() => setCertShowAddressed((v) => !v)}
            >
              {certShowAddressed ? "Hide Addressed" : "Show Addressed"}
            </Button>
          </div>

          {/* Summary badges */}
          {!loadingCerts && (
            <div className="flex gap-2 flex-wrap text-xs">
              {(["Valid", "Expiring", "Expired"] as const).map((s) => {
                const cnt = certArray.filter((c) => c.status === s && !c.addressed).length;
                if (cnt === 0) return null;
                return (
                  <span key={s} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[s]}`}>
                    {cnt} {s}
                  </span>
                );
              })}
              {certArray.filter((c) => c.addressed).length > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border font-medium bg-slate-100 text-slate-600 border-slate-300">
                  {certArray.filter((c) => c.addressed).length} Addressed
                </span>
              )}
            </div>
          )}

          {/* Table */}
          {loadingCerts ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : certs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground text-sm">No certifications found.</CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left py-2.5 px-4 font-medium text-muted-foreground">Certification</th>
                        <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">Staff</th>
                        <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">Department</th>
                        <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">Expiry Date</th>
                        <th className="text-center py-2.5 px-3 font-medium text-muted-foreground">Status</th>
                        <th className="text-center py-2.5 px-3 font-medium text-muted-foreground">File</th>
                        <th className="text-right py-2.5 px-4 font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {certs.map((c) => (
                        <tr key={c.id} className={`border-b last:border-0 hover:bg-muted/20 ${c.addressed ? "opacity-60" : ""}`}>
                          <td className="py-2.5 px-4 font-medium">
                            <div>{c.certName}</div>
                            {c.addressed && <span className="text-[10px] text-green-600 font-normal">✓ Addressed</span>}
                          </td>
                          <td className="py-2.5 px-3 text-muted-foreground">{c.staffName}</td>
                          <td className="py-2.5 px-3 text-muted-foreground text-xs">{c.department || "—"}</td>
                          <td className="py-2.5 px-3 text-muted-foreground text-xs">{c.expiryDate}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${STATUS_COLORS[c.status] ?? STATUS_COLORS["N/A"]}`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {c.filePath ? (
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="ghost" size="sm" className="h-7 w-7 p-0" title="View"
                                  onClick={() => openViewer(`/api/staff/${c.staffId}/certifications/${c.id}/download`, `${c.certName} — ${c.staffName}`)}
                                >
                                  <Eye size={14} />
                                </Button>
                                <Button
                                  variant="ghost" size="sm" className="h-7 w-7 p-0" title="Download"
                                  onClick={() => window.open(getUploadUrl(c.filePath!), "_blank")}
                                >
                                  <Download size={14} />
                                </Button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {canWrite && (
                                <Button
                                  variant="ghost" size="sm" className="h-7 w-7 p-0" title="Upload certificate file"
                                  onClick={() => { setUploadingCertId(c.id); setUploadingCertStaffId(c.staffId); certFileInputRef.current?.click(); }}
                                  disabled={uploadCertFile.isPending && uploadingCertId === c.id}
                                >
                                  {uploadCertFile.isPending && uploadingCertId === c.id ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                                </Button>
                              )}
                              {!c.addressed ? (
                                <Button
                                  variant="ghost" size="sm" className="h-7 w-7 p-0 text-green-600 hover:text-green-700" title="Mark as addressed"
                                  onClick={() => { setAddressingCertId(c.id); setAddressingCertName(`${c.certName} (${c.staffName})`); }}
                                >
                                  <CheckCircle2 size={12} />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost" size="sm" className="h-7 w-7 p-0 text-amber-600 hover:text-amber-700" title="Reopen"
                                  onClick={() => unaddressCert.mutate(c.id)}
                                  disabled={unaddressCert.isPending}
                                >
                                  <RotateCcw size={12} />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Hidden file input — licenses */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        onChange={handleFileChange}
      />

      {/* Hidden file input — certifications */}
      <input
        ref={certFileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        onChange={handleCertFileChange}
      />

      {/* ── Add License Dialog ────────────────────────────── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Hospital License</DialogTitle>
          </DialogHeader>
          <LicenseFormFields form={form} setForm={setForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={createLic.isPending || !form.name || !form.category}>
              {createLic.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Add License
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit License Dialog ───────────────────────────── */}
      <Dialog open={!!editLicense} onOpenChange={() => setEditLicense(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit License</DialogTitle>
          </DialogHeader>
          <LicenseFormFields form={editForm} setForm={setEditForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditLicense(null)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={updateLic.isPending}>
              {updateLic.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ────────────────────────────────── */}
      <Dialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" /> Delete License
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Are you sure you want to delete <strong>{deletingName}</strong>? This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteLic.isPending}>
              {deleteLic.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Address License Confirm ───────────────────────── */}
      <Dialog open={!!addressingLicId} onOpenChange={() => setAddressingLicId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" /> Mark License as Addressed
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Mark <strong>{addressingLicName}</strong> as addressed? You can reopen it later if needed.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddressingLicId(null)}>Cancel</Button>
            <Button
              onClick={() => { if (addressingLicId) { addressLic.mutate(addressingLicId); setAddressingLicId(null); } }}
              disabled={addressLic.isPending}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── File Viewer ───────────────────────────────────── */}
      <Dialog open={viewerLoading || viewerUrl !== null || viewerError !== null} onOpenChange={closeViewer}>
        <DialogContent className="max-w-4xl w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Eye className="h-4 w-4" /> {viewerTitle}</DialogTitle>
          </DialogHeader>
          <div className="relative flex items-center justify-center bg-muted/30 rounded-md overflow-hidden" style={{ minHeight: "60vh" }}>
            {viewerLoading && (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="text-sm">Loading file…</span>
              </div>
            )}
            {!viewerLoading && viewerError && (
              <div className="flex flex-col items-center gap-3 text-destructive p-6 text-center">
                <ShieldAlert className="h-10 w-10" />
                <p className="text-sm font-medium">Could not load file</p>
                <p className="text-xs text-muted-foreground">{viewerError}</p>
              </div>
            )}
            {!viewerLoading && viewerUrl && viewerType === "image" && (
              <img src={viewerUrl} alt={viewerTitle} className="max-w-full object-contain rounded" style={{ maxHeight: "70vh" }} />
            )}
            {!viewerLoading && viewerUrl && viewerType === "pdf" && (
              <iframe src={viewerUrl} title={viewerTitle} className="w-full rounded" style={{ height: "70vh", border: "none", display: "block" }} />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeViewer}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Address Cert Confirm ──────────────────────────── */}
      <Dialog open={!!addressingCertId} onOpenChange={() => setAddressingCertId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" /> Mark Certification as Addressed
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Mark <strong>{addressingCertName}</strong> as addressed? You can reopen it later if needed.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddressingCertId(null)}>Cancel</Button>
            <Button
              onClick={() => { if (addressingCertId) { addressCert.mutate(addressingCertId); setAddressingCertId(null); } }}
              disabled={addressCert.isPending}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Sub-component: shared license form fields ─────────────────
function LicenseFormFields({
  form,
  setForm,
}: {
  form: typeof BLANK_FORM;
  setForm: (f: typeof BLANK_FORM) => void;
}) {
  const update = (key: keyof typeof BLANK_FORM, val: string) => setForm({ ...form, [key]: val });
  return (
    <div className="grid gap-3 py-2">
      <div className="grid gap-1.5">
        <Label htmlFor="lic-name">License Name *</Label>
        <Input id="lic-name" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. NABH Accreditation" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label>Category *</Label>
          <Select value={form.category} onValueChange={(v) => update("category", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {LICENSE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="lic-num">License Number</Label>
          <Input id="lic-num" value={form.licenseNumber} onChange={(e) => update("licenseNumber", e.target.value)} placeholder="Optional" />
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="lic-auth">Issuing Authority</Label>
        <Input id="lic-auth" value={form.issuingAuthority} onChange={(e) => update("issuingAuthority", e.target.value)} placeholder="e.g. Ministry of Health" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="lic-issue">Issue Date</Label>
          <Input id="lic-issue" type="date" value={form.issueDate} onChange={(e) => update("issueDate", e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="lic-expiry">Expiry Date</Label>
          <Input id="lic-expiry" type="date" value={form.expiryDate} onChange={(e) => update("expiryDate", e.target.value)} />
        </div>
      </div>
    </div>
  );
}
