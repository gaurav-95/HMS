import { useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser, usePermanentDeleteUser } from "@/hooks/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Loader2, Trash2, Search, Filter, ArrowUpDown } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { ROLE_LABELS, type UserRole } from "@/types";

const ALL_ROLES = Object.entries(ROLE_LABELS) as [UserRole, string][];

export default function UserManagementPage() {
  const { hasPermission, user } = useAuth();
  const { data: users = [], isLoading } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const permanentDeleteUser = usePermanentDeleteUser();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [deletingUser, setDeletingUser] = useState<any | null>(null);
  const canWrite = hasPermission("users:write");
  const canDelete = hasPermission("users:delete");
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const allUsers = users as any[];

  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [showInactive, setShowInactive] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "role" | "recent">("name");

  const filtered = useMemo(() => {
    const list = allUsers.filter((u: any) => {
      const matchSearch = !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
      const matchRole = filterRole === "all" || u.role === filterRole;
      const matchActive = showInactive ? !u.isActive : u.isActive !== false;
      return matchSearch && matchRole && matchActive;
    });
    if (sortBy === "name") list.sort((a: any, b: any) => (a.name || "").localeCompare(b.name || ""));
    else if (sortBy === "role") list.sort((a: any, b: any) => (a.role || "").localeCompare(b.role || ""));
    else list.sort((a: any, b: any) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    return list;
  }, [allUsers, search, filterRole, showInactive, sortBy]);

  const handleAddUser = (data: Record<string, unknown>) => {
    createUser.mutate(data);
    setShowAddModal(false);
  };

  const handleUpdateUser = (data: Record<string, unknown>) => {
    if (!editingUser) return;
    updateUser.mutate({ id: editingUser.id, ...data });
    setEditingUser(null);
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">User Administration</h1>
          <p className="text-muted-foreground">{filtered.length} of {allUsers.length} users</p>
        </div>
        {canWrite && (
          <Button onClick={() => setShowAddModal(true)} className="gap-2">
            <Plus size={16} /> Add User
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-[160px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {ALL_ROLES.map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
          <SelectTrigger className="w-[150px]"><ArrowUpDown className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Sort: Name</SelectItem>
            <SelectItem value="role">Sort: Role</SelectItem>
            <SelectItem value="recent">Sort: Recent</SelectItem>
          </SelectContent>
        </Select>
        <Button variant={showInactive ? "default" : "outline"} size="sm" onClick={() => setShowInactive(!showInactive)}>
          {showInactive ? "Showing Inactive" : "Show Inactive"}
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((u: any) => (
          <Card key={u.id} className={`hover:shadow-md transition-shadow ${!u.isActive ? "opacity-60" : ""}`}>
            <CardContent className="p-4">
              {/* Row 1: Identity */}
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 shrink-0">
                  {u.photoPath ? (
                    <AvatarImage src={`/uploads/staff/${u.photoPath.split("/").pop()}`} />
                  ) : u.avatar ? (
                    <AvatarImage src={u.avatar} />
                  ) : null}
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                    {getInitials(u.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">{u.name}</h3>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>
                <Badge variant="default" className="shrink-0 text-[10px]">{ROLE_LABELS[u.role as UserRole] || u.role}</Badge>
              </div>

              {/* Row 2: Tags + Actions */}
              <div className="mt-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                  {u.department && <Badge variant="outline" className="text-[10px] px-1.5 py-0">{u.department}</Badge>}
                  <Badge variant={u.isActive ? "success" : "destructive"} className="text-[10px] px-1.5 py-0">
                    {u.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                {canWrite && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingUser(u)} title="Edit">
                      <Edit size={14} />
                    </Button>
                    {canDelete && u.id !== user?.id && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeletingUser(u)} title="Delete">
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">No users match filters</div>
        )}
      </div>

      <UserFormModal open={showAddModal} onClose={() => setShowAddModal(false)} onSubmit={handleAddUser} title="Add System User" isSuperAdmin={isSuperAdmin} />

      {editingUser && (
        <UserFormModal
          open={!!editingUser}
          onClose={() => setEditingUser(null)}
          onSubmit={handleUpdateUser}
          title="Edit User"
          defaultValues={editingUser}
          isSuperAdmin={isSuperAdmin}
        />
      )}

      <DeleteConfirmationDialog
        open={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        onConfirm={() => { deleteUser.mutate(deletingUser?.id); setDeletingUser(null); }}
        entityName={deletingUser?.name || ""}
        entityType="user"
        isSuperAdmin={isSuperAdmin}
        onPermanentDelete={() => { permanentDeleteUser.mutate(deletingUser?.id); setDeletingUser(null); }}
        isPending={deleteUser.isPending || permanentDeleteUser.isPending}
      />
    </div>
  );
}

function UserFormModal({
  open, onClose, onSubmit, title, defaultValues, isSuperAdmin,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
  title: string;
  defaultValues?: any;
  isSuperAdmin?: boolean;
}) {
  const [name, setName] = useState(defaultValues?.name || "");
  const [email, setEmail] = useState(defaultValues?.email || "");
  const [role, setRole] = useState<UserRole>(defaultValues?.role || "STAFF");
  const [department, setDepartment] = useState(defaultValues?.department || "");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: Record<string, unknown> = { name, email, role, department: department || null };
    if (password) data.password = password;
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2"><Label>Full Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
          <div className="space-y-2"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ALL_ROLES.filter(([key]) => isSuperAdmin || key !== "SUPER_ADMIN").map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {role === "LEADER" && (
            <div className="space-y-2">
              <Label>Department (for scoped access)</Label>
              <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. General Medicine" />
            </div>
          )}
          <div className="space-y-2">
            <Label>{defaultValues ? "New Password (leave blank to keep current)" : "Password"}</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" {...(!defaultValues ? { required: true } : {})} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">{defaultValues ? "Update" : "Create User"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
