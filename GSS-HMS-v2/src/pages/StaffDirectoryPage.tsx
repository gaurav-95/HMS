import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useStaff, useCreateStaff, useUpdateStaff } from "@/hooks/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Phone, Mail, Edit, Upload, Loader2 } from "lucide-react";
import { getInitials, formatCurrency } from "@/lib/utils";
import { DEPARTMENTS } from "@/constants";
import { ExportButtons } from "@/components/ExportButtons";
import { useNavigate } from "react-router-dom";
import type { Staff, StaffRole, Department, SalaryType } from "@/types";

export default function StaffDirectoryPage() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const { data: staff = [], isLoading } = useStaff();
  const createStaff = useCreateStaff();
  const updateStaff = useUpdateStaff();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any | null>(null);
  const canWrite = hasPermission("staff:write");

  const filteredStaff = (staff as any[]).filter(
    (s: any) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <p className="text-muted-foreground">{filteredStaff.length} employees</p>
        </div>
        <div className="flex gap-2">
          <ExportButtons
            title="Staff Directory"
            columns={["Name", "Department", "Role", "Phone", "Email", "Salary"]}
            rows={filteredStaff.map((s: any) => [s.name, s.department || "", s.role || "", s.phone || "", s.email || "", s.salary ?? ""])}
          />
          {canWrite && (
            <Button onClick={() => setShowAddModal(true)} className="gap-2">
              <Plus size={16} />
              Add Employee
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, department, or role..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
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
              </div>

              {/* Certifications */}
              {member.certifications.length > 0 && (
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

              {canWrite && (
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditingStaff(member)} className="flex-1 gap-1">
                    <Edit size={14} /> Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigate("/documents")} className="gap-1">
                    <Upload size={14} /> Docs
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

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
    </div>
  );
}

// ── Staff Form Modal ──────────────────────────────────────────

interface StaffFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Staff>) => void;
  title: string;
  defaultValues?: Partial<Staff>;
}

const STAFF_ROLES: StaffRole[] = [
  "Consultant", "RMO", "Staff Nurse", "Sr. Nurse", "Jr. Nurse",
  "Paramedic", "Administrative", "Technician", "Lab In-charge",
  "Receptionist", "Accountant", "Metron",
];

function StaffFormModal({ open, onClose, onSubmit, title, defaultValues }: StaffFormModalProps) {
  const [name, setName] = useState(defaultValues?.name || "");
  const [role, setRole] = useState<StaffRole>(defaultValues?.role || "Staff Nurse");
  const [department, setDepartment] = useState<Department>(defaultValues?.department || "General OPD");
  const [phone, setPhone] = useState(defaultValues?.phone || "");
  const [email, setEmail] = useState(defaultValues?.email || "");
  const [salaryType, setSalaryType] = useState<SalaryType>(defaultValues?.salaryType || "Fixed");
  const [baseSalary, setBaseSalary] = useState(defaultValues?.baseSalary?.toString() || "");
  const [joiningDate, setJoiningDate] = useState(defaultValues?.joiningDate || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      role,
      department,
      phone,
      email,
      salaryType,
      baseSalary: parseInt(baseSalary) || 0,
      joiningDate,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as StaffRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STAFF_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={department} onValueChange={(v) => setDepartment(v as Department)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Joining Date</Label>
              <Input type="date" value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Salary Type</Label>
              <Select value={salaryType} onValueChange={(v) => setSalaryType(v as SalaryType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fixed">Fixed</SelectItem>
                  <SelectItem value="Shift-Based">Shift-Based</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Base Salary (₹)</Label>
              <Input type="number" value={baseSalary} onChange={(e) => setBaseSalary(e.target.value)} required />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">{defaultValues ? "Update" : "Add Employee"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
