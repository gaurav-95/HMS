import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLeaveRequests, useApplyLeave, useUpdateLeaveStatus } from "@/hooks/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Plus, Loader2 } from "lucide-react";

export default function LeavePage() {
  const { hasPermission } = useAuth();
  const { data: leaves = [], isLoading } = useLeaveRequests();
  const applyLeave = useApplyLeave();
  const updateLeaveStatus = useUpdateLeaveStatus();
  const [showApply, setShowApply] = useState(false);
  const [leaveType, setLeaveType] = useState("Casual");
  const canApprove = hasPermission("leave:approve");

  const allLeaves = leaves as any[];
  const pendingCount = allLeaves.filter((l: any) => l.status === "Pending").length;

  const handleApply = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    applyLeave.mutate({
      staffName: fd.get("staffName") as string,
      type: leaveType,
      startDate: fd.get("startDate") as string,
      endDate: fd.get("endDate") as string,
      reason: fd.get("reason") as string,
    });
    setLeaveType("Casual");
    setShowApply(false);
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leave Management</h1>
          <p className="text-muted-foreground">Apply for leave, track status, and manage approvals</p>
        </div>
        <Button onClick={() => setShowApply(true)} className="gap-2">
          <Plus size={16} /> Apply for Leave
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Total Requests</p><p className="text-2xl font-bold">{allLeaves.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Pending Requests</p><p className="text-2xl font-bold text-amber-600">{pendingCount}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Approved</p><p className="text-2xl font-bold text-green-600">{allLeaves.filter((l: any) => l.status === "Approved").length}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" /> Leave Requests
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                {canApprove && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {allLeaves.map((l: any) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.staffName}</TableCell>
                  <TableCell><Badge variant="secondary">{l.type}</Badge></TableCell>
                  <TableCell>{l.startDate}</TableCell>
                  <TableCell>{l.endDate}</TableCell>
                  <TableCell className="text-muted-foreground">{l.reason}</TableCell>
                  <TableCell>
                    <Badge variant={l.status === "Approved" ? "success" : l.status === "Rejected" ? "destructive" : "warning"}>
                      {l.status}
                    </Badge>
                  </TableCell>
                  {canApprove && (
                    <TableCell>
                      {l.status === "Pending" && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => updateLeaveStatus.mutate({ id: l.id, status: "Approved" })}>
                            Approve
                          </Button>
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => updateLeaveStatus.mutate({ id: l.id, status: "Rejected" })}>
                            Reject
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {allLeaves.length === 0 && (
                <TableRow><TableCell colSpan={canApprove ? 7 : 6} className="text-center py-8 text-muted-foreground">No leave requests</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Apply Leave Modal */}
      <Dialog open={showApply} onOpenChange={setShowApply}>
        <DialogContent>
          <DialogHeader><DialogTitle>Apply for Leave</DialogTitle></DialogHeader>
          <form onSubmit={handleApply} className="space-y-4">
            <div className="space-y-2"><Label>Staff Name</Label><Input name="staffName" required /></div>
            <div className="space-y-2">
              <Label>Leave Type</Label>
              <Select value={leaveType} onValueChange={setLeaveType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Casual">Casual</SelectItem>
                  <SelectItem value="Sick">Sick</SelectItem>
                  <SelectItem value="Earned">Earned</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Start Date</Label><Input name="startDate" type="date" required /></div>
              <div className="space-y-2"><Label>End Date</Label><Input name="endDate" type="date" required /></div>
            </div>
            <div className="space-y-2"><Label>Reason</Label><Input name="reason" required /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowApply(false)}>Cancel</Button>
              <Button type="submit">Submit</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
