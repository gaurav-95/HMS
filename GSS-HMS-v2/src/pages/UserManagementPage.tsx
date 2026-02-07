import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useUsers, useCreateUser, useUpdateUser } from "@/hooks/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Loader2 } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { ROLE_LABELS, type UserRole, type SystemUser } from "@/types";

const ALL_ROLES = Object.entries(ROLE_LABELS) as [UserRole, string][];

export default function UserManagementPage() {
  const { hasPermission } = useAuth();
  const { data: users = [], isLoading } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const canWrite = hasPermission("users:write");

  const allUsers = users as any[];

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Administration</h1>
          <p className="text-muted-foreground">{allUsers.length} system users</p>
        </div>
        {canWrite && (
          <Button onClick={() => setShowAddModal(true)} className="gap-2">
            <Plus size={16} /> Add User
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {allUsers.map((u: any) => (
          <Card key={u.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {getInitials(u.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{u.name}</h3>
                  <p className="text-sm text-muted-foreground truncate">{u.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="default">{ROLE_LABELS[u.role as UserRole] || u.role}</Badge>
                    <Badge variant={u.isActive ? "success" : "destructive"}>
                      {u.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>
              {canWrite && (
                <Button variant="outline" size="sm" onClick={() => setEditingUser(u)} className="mt-4 w-full gap-2">
                  <Edit size={14} /> Edit
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <UserFormModal open={showAddModal} onClose={() => setShowAddModal(false)} onSubmit={handleAddUser} title="Add System User" />

      {editingUser && (
        <UserFormModal
          open={!!editingUser}
          onClose={() => setEditingUser(null)}
          onSubmit={handleUpdateUser}
          title="Edit User"
          defaultValues={editingUser}
        />
      )}
    </div>
  );
}

function UserFormModal({
  open, onClose, onSubmit, title, defaultValues,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
  title: string;
  defaultValues?: any;
}) {
  const [name, setName] = useState(defaultValues?.name || "");
  const [email, setEmail] = useState(defaultValues?.email || "");
  const [role, setRole] = useState<UserRole>(defaultValues?.role || "STAFF");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: Record<string, unknown> = { name, email, role };
    if (!defaultValues && password) data.password = password;
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
                {ALL_ROLES.map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {!defaultValues && (
            <div className="space-y-2"><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required /></div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">{defaultValues ? "Update" : "Create User"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
