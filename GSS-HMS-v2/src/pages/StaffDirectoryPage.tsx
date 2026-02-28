import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useStaff, useCreateStaff, useUpdateStaff, useDeleteStaff, usePermanentDeleteStaff } from "@/hooks/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, Phone, Mail, Edit, Upload, Loader2, Trash2, ClipboardCheck, Wallet, Filter } from "lucide-react";
import { getInitials, formatCurrency } from "@/lib/utils";
import { DEPARTMENTS, STAFF_ROLES } from "@/constants";
import { ExportButtons } from "@/components/ExportButtons";
import { useNavigate } from "react-router-dom";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import type { Staff, StaffRole, Department, SalaryType, NursingClassification } from "@/types";

const NURSING_ROLES = ["Staff Nurse", "Sr. Nurse", "Jr. Nurse", "Nurse"];

export default function StaffDirectoryPage() {
  const { hasPermission, user } = useAuth();
  const navigate = useNavigate();
  const { data: staff = [], isLoading } = useStaff();
  const createStaff = useCreateStaff();
  const updateStaff = useUpdateStaff();
  const deleteStaff = useDeleteStaff();
  const permanentDeleteStaff = usePermanentDeleteStaff();
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [roleFilter, setRoleFilter] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any | null>(null);
  const [deletingStaff, setDeletingStaff] = useState<any | null>(null);
  const canWrite = hasPermission("staff:write");
  const canDelete = hasPermission("staff:delete");
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const allStaff = staff as any[];

  const filteredStaff = allStaff.filter(
    (s: any) => {
      const matchSearch = !searchQuery ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.role.toLowerCase().includes(searchQuery.toLowerCase());
      const matchDept = deptFilter === "All" || s.department === deptFilter;
      const matchRole = roleFilter === "All" || s.role === roleFilter;
      return matchSearch && matchDept && matchRole;
    }
  );

  // Collect unique departments and roles from actual data for smarter filtering
  const uniqueDepts = [...new Set(allStaff.map((s: any) => s.department))].sort();
  const uniqueRoles = [...new Set(allStaff.map((s: any) => s.role))].sort();

  const handleAddStaff = (newStaff: Partial<Staff>) => {
    createStaff.mutate(newStaff as Record<string, unknown>);
    setShowAddModal(false);
  };

  const handleUpdateStaff = (updated: any) => {
    updateStaff.mutate({ id: updated.id, ...updated });
    setEditingStaff(null);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Staff Registry</h1>
          <p className="text-muted-foreground">{filteredStaff.length} of {allStaff.length} employees</p>
        </div>
        <div className="flex gap-2">
          <ExportButtons
            title="Staff Directory"
            columns={["Name", "Department", "Role", "Phone", "Email", "Salary"]}
            rows={filteredStaff.map((s: any) => [s.name, s.department || "", s.role || "", s.phone || "", s.email || "", s.baseSalary ?? ""])}
          />
          {canWrite && (
            <Button onClick={() => setShowAddModal(true)} className="gap-2">
              <Plus size={16} />
              Add Employee
            </Button>
          )}
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, department, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-[180px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Departments</SelectItem>
            {uniqueDepts.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Roles</SelectItem>
            {uniqueRoles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Staff Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredStaff.map((member) => (
          <Card key={member.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={member.imageUrl} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{member.name}</h3>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                  <Badge variant="secondary" className="mt-1">{member.department}</Badge>
                  {member.nursingClassification && (
                    <Badge variant="info" className="mt-1 ml-1">{member.nursingClassification}</Badge>
                  )}
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone size={14} /> <span className="truncate">{member.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail size={14} /> <span className="truncate">{member.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Salary:</span>
                  <span className="font-medium">{formatCurrency(member.baseSalary)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <Badge variant="outline" className="text-[10px]">{member.salaryType || "Fixed"}</Badge>
                </div>
              </div>

              {/* Certifications */}
              {member.certifications && member.certifications.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {member.certifications.map((cert: any) => (
                    <Badge
                      key={cert.id}
                      variant={cert.status === "Valid" ? "success" : cert.status === "Expired" ? "destructive" : "warning"}
                      className="text-[10px]"
                    >
                      {cert.name}: {cert.status}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Quick Actions */}
              <div className="mt-4 flex gap-1.5 flex-wrap">
                {canWrite && (
                  <Button variant="outline" size="sm" onClick={() => setEditingStaff(member)} className="gap-1 flex-1">
                    <Edit size={14} /> Edit
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => navigate(`/attendance?staff=${member.id}`)} className="gap-1" title="View Attendance">
                  <ClipboardCheck size={14} />
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate(`/payroll?staff=${member.id}`)} className="gap-1" title="View Payroll">
                  <Wallet size={14} />
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate("/documents")} className="gap-1" title="Documents">
                  <Upload size={14} />
                </Button>
                {canDelete && (
                  <Button variant="outline" size="sm" className="gap-1 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => setDeletingStaff(member)}>
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredStaff.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No staff members match your search/filter criteria.
        </div>
      )}

      {/* Add Employee Modal */}
      <StaffFormModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddStaff}
        title="Add New Employee"
      />

      {/* Edit Employee Modal */}
      {editingStaff && (
        <StaffFormModal
          open={!!editingStaff}
          onClose={() => setEditingStaff(null)}
          onSubmit={(data) => handleUpdateStaff({ ...editingStaff, ...data } as Staff)}
          title="Edit Employee"
          defaultValues={editingStaff}
        />
      )}

      {/* Delete Confirmation */}
      <DeleteConfirmationDialog
        open={!!deletingStaff}
        onClose={() => setDeletingStaff(null)}
        onConfirm={() => { deleteStaff.mutate(deletingStaff?.id); setDeletingStaff(null); }}
        entityName={deletingStaff?.name || ""}
        entityType="staff member"
        isSuperAdmin={isSuperAdmin}
        onPermanentDelete={() => { permanentDeleteStaff.mutate(deletingStaff?.id); setDeletingStaff(null); }}
        isPending={deleteStaff.isPending || permanentDeleteStaff.isPending}
      />
    </div>
  );
}

// ── Staff Form Modal (expanded with all fields) ────────────

interface StaffFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Staff>) => void;
  title: string;
  defaultValues?: Partial<Staff>;
}

function StaffFormModal({ open, onClose, onSubmit, title, defaultValues }: StaffFormModalProps) {
  const [name, setName] = useState(defaultValues?.name || "");
  const [role, setRole] = useState<StaffRole>(defaultValues?.role || "Doctor");
  const [department, setDepartment] = useState<string>(defaultValues?.department || "General Medicine");
  const [phone, setPhone] = useState(defaultValues?.phone || "");
  const [email, setEmail] = useState(defaultValues?.email || "");
  const [salaryType, setSalaryType] = useState<SalaryType>(defaultValues?.salaryType || "Fixed");
  const [baseSalary, setBaseSalary] = useState(defaultValues?.baseSalary?.toString() || "");
  const [joiningDate, setJoiningDate] = useState(defaultValues?.joiningDate || "");
  const [nursingClassification, setNursingClassification] = useState<string>(defaultValues?.nursingClassification || "");
  const [address, setAddress] = useState(defaultValues?.address || "");
  const [aadhaarNumber, setAadhaarNumber] = useState(defaultValues?.aadhaarNumber || "");
  const [panNumber, setPanNumber] = useState(defaultValues?.panNumber || "");
  const [shiftRate, setShiftRate] = useState(defaultValues?.shiftRate?.toString() || "");
  const [attendanceRate, setAttendanceRate] = useState(defaultValues?.attendanceRate?.toString() || "");

  const isNurse = NURSING_ROLES.includes(role);
  const isShiftBased = salaryType === "Shift-Based";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: Partial<Staff> = {
      name,
      role,
      department: department as Department,
      phone,
      email,
      salaryType,
      baseSalary: parseInt(baseSalary) || 0,
      joiningDate,
      address: address || undefined,
      aadhaarNumber: aadhaarNumber || undefined,
      panNumber: panNumber || undefined,
    };
    if (isNurse && nursingClassification) {
      data.nursingClassification = nursingClassification as NursingClassification;
    }
    if (isShiftBased) {
      data.shiftRate = parseFloat(shiftRate) || undefined;
      data.attendanceRate = parseFloat(attendanceRate) || undefined;
    }
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name <span className="text-destructive">*</span></Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Role <span className="text-destructive">*</span></Label>
              <Select value={role} onValueChange={(v) => setRole(v as StaffRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STAFF_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Department <span className="text-destructive">*</span></Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Phone <span className="text-destructive">*</span></Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Email <span className="text-destructive">*</span></Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Joining Date <span className="text-destructive">*</span></Label>
              <Input type="date" value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} required />
            </div>
          </div>

          {/* Nursing Classification — conditional */}
          {isNurse && (
            <div className="space-y-2">
              <Label>Nursing Classification</Label>
              <Select value={nursingClassification} onValueChange={setNursingClassification}>
                <SelectTrigger><SelectValue placeholder="Select classification" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BSc Nursing">BSc Nursing</SelectItem>
                  <SelectItem value="GN Nursing">GN Nursing</SelectItem>
                  <SelectItem value="BNF">BNF</SelectItem>
                  <SelectItem value="BSc">BSc</SelectItem>
                  <SelectItem value="GNM">GNM</SelectItem>
                  <SelectItem value="ANM">ANM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Salary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Salary Type <span className="text-destructive">*</span></Label>
              <Select value={salaryType} onValueChange={(v) => setSalaryType(v as SalaryType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fixed">Fixed (Monthly)</SelectItem>
                  <SelectItem value="Shift-Based">Shift-Based</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Base Salary (₹) <span className="text-destructive">*</span></Label>
              <Input type="number" value={baseSalary} onChange={(e) => setBaseSalary(e.target.value)} required />
            </div>
            {isShiftBased && (
              <>
                <div className="space-y-2">
                  <Label>Shift Rate (₹ per shift)</Label>
                  <Input type="number" value={shiftRate} onChange={(e) => setShiftRate(e.target.value)} placeholder="e.g. 500" />
                </div>
                <div className="space-y-2">
                  <Label>Attendance Rate (₹ per day)</Label>
                  <Input type="number" value={attendanceRate} onChange={(e) => setAttendanceRate(e.target.value)} placeholder="e.g. 300" />
                </div>
              </>
            )}
          </div>

          {/* Identity & Address */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Aadhaar Number</Label>
              <Input value={aadhaarNumber} onChange={(e) => setAadhaarNumber(e.target.value)} placeholder="12-digit Aadhaar" maxLength={12} />
            </div>
            <div className="space-y-2">
              <Label>PAN Number</Label>
              <Input value={panNumber} onChange={(e) => setPanNumber(e.target.value)} placeholder="e.g. ABCDE1234F" maxLength={10} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full address" rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">{defaultValues ? "Update Employee" : "Add Employee"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
