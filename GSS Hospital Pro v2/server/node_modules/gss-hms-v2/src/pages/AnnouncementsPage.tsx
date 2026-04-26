import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAnnouncements, useCreateAnnouncement, useUpdateAnnouncement, useDeleteAnnouncement, usePermanentDeleteAnnouncement } from "@/hooks/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Megaphone, Plus, Loader2, Pencil, Trash2 } from "lucide-react";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { formatDate } from "@/lib/utils";

export default function AnnouncementsPage() {
  const { user, hasPermission } = useAuth();
  const canWrite = hasPermission("announcements:write");
  const canDelete = hasPermission("announcements:delete");
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const { data: announcements = [], isLoading } = useAnnouncements();
  const createAnnouncement = useCreateAnnouncement();
  const updateAnnouncement = useUpdateAnnouncement();
  const deleteAnnouncement = useDeleteAnnouncement();
  const permanentDeleteAnnouncement = usePermanentDeleteAnnouncement();
  const [showCreate, setShowCreate] = useState(false);
  const [announcementType, setAnnouncementType] = useState("general");
  const [editingAnnouncement, setEditingAnnouncement] = useState<any | null>(null);
  const [deletingAnnouncement, setDeletingAnnouncement] = useState<any | null>(null);

  const allAnnouncements = announcements as any[];
  const visible = allAnnouncements.filter(
    (a: any) => a.isActive && (!user || (a.targetRoles ? JSON.parse(a.targetRoles).includes(user.role) : true))
  );

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const type = announcementType;
    const data: Record<string, unknown> = {
      title: fd.get("title") as string,
      body: fd.get("body") as string,
      type,
      targetRoles: JSON.stringify(["SUPER_ADMIN", "CEO", "COO", "CMO", "METRON", "DOCTOR", "SR_NURSE", "JR_NURSE", "RECEPTIONIST", "TECHNICIAN", "PHARMACIST", "ACCOUNTANT", "STAFF"]),
      isActive: true,
      createdBy: user?.name || "Admin",
    };
    if (type === "penalty") {
      data.penaltyConfig = JSON.stringify({
        absenceDeductionAmount: Number(fd.get("deduction") || 500),
        absenceLimit: Number(fd.get("limit") || 3),
      });
    }
    createAnnouncement.mutate(data);
    setAnnouncementType("general");
    setShowCreate(false);
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Announcements</h1>
          <p className="text-muted-foreground">Hospital-wide notices, policy updates, and penalties</p>
        </div>
        {canWrite && (
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus size={16} /> New Announcement
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {visible.map((a: any) => {
          const penalty = a.penaltyConfig ? JSON.parse(a.penaltyConfig) : null;
          return (
            <Card key={a.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Megaphone className="h-5 w-5" />
                    {a.title}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={a.type === "penalty" ? "destructive" : a.type === "policy" ? "warning" : "secondary"}>
                      {a.type}
                    </Badge>
                    {canWrite && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingAnnouncement(a)}>
                        <Pencil size={14} />
                      </Button>
                    )}
                    {canDelete && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeletingAnnouncement(a)}>
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{a.body}</p>
                {a.type === "penalty" && penalty && (
                  <div className="flex gap-4 text-sm bg-red-50 border border-red-100 rounded-lg p-3">
                    <div><span className="text-muted-foreground">Deduction per absence:</span> <strong>₹{penalty.absenceDeductionAmount}</strong></div>
                    <div><span className="text-muted-foreground">Absence limit:</span> <strong>{penalty.absenceLimit}/month</strong></div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-3">Published: {formatDate(a.createdAt)} · By: {a.createdBy}</p>
              </CardContent>
            </Card>
          );
        })}
        {visible.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No announcements for your role.
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Announcement</DialogTitle></DialogHeader>
          <form className="space-y-4" onSubmit={handleCreate}>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input name="title" placeholder="Announcement title" required />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea name="body" placeholder="Write the announcement body..." rows={4} required />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={announcementType} onValueChange={setAnnouncementType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="policy">Policy</SelectItem>
                  <SelectItem value="penalty">Penalty</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit">Publish</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Announcement Modal */}
      <Dialog open={!!editingAnnouncement} onOpenChange={(v) => { if (!v) setEditingAnnouncement(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Announcement</DialogTitle></DialogHeader>
          <form className="space-y-4" onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            updateAnnouncement.mutate({
              id: editingAnnouncement?.id,
              title: fd.get("title") as string,
              body: fd.get("body") as string,
            });
            setEditingAnnouncement(null);
          }}>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input name="title" defaultValue={editingAnnouncement?.title || ""} required />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea name="body" defaultValue={editingAnnouncement?.body || ""} rows={4} required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingAnnouncement(null)}>Cancel</Button>
              <Button type="submit" disabled={updateAnnouncement.isPending}>
                {updateAnnouncement.isPending ? "Saving..." : "Update"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <DeleteConfirmationDialog
        open={!!deletingAnnouncement}
        onClose={() => setDeletingAnnouncement(null)}
        onConfirm={() => { deleteAnnouncement.mutate(deletingAnnouncement?.id); setDeletingAnnouncement(null); }}
        entityName={deletingAnnouncement?.title || ""}
        entityType="announcement"
        isSuperAdmin={isSuperAdmin}
        onPermanentDelete={() => { permanentDeleteAnnouncement.mutate(deletingAnnouncement?.id); setDeletingAnnouncement(null); }}
        isPending={deleteAnnouncement.isPending || permanentDeleteAnnouncement.isPending}
      />
    </div>
  );
}
