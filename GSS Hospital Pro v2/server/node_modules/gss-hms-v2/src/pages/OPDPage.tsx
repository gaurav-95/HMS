import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTokens, useCreateToken, useUpdateTokenStatus } from "@/hooks/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Ticket, Plus, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function OPDPage() {
  const { hasPermission } = useAuth();
  const { data: tokens = [], isLoading } = useTokens();
  const createToken = useCreateToken();
  const updateStatus = useUpdateTokenStatus();
  const [showGenerate, setShowGenerate] = useState(false);
  const canWrite = hasPermission("tokens:write");

  const allTokens = tokens as any[];
  const waiting = allTokens.filter((t: any) => t.status === "Waiting").length;
  const inProgress = allTokens.filter((t: any) => t.status === "In-Progress").length;
  const completed = allTokens.filter((t: any) => t.status === "Completed").length;

  const handleGenerate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createToken.mutate({
      patientName: fd.get("patientName") as string,
      department: fd.get("department") as string,
      doctor: fd.get("doctor") as string,
    });
    setShowGenerate(false);
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">OPD & Token Queue</h1>
          <p className="text-muted-foreground">Outpatient department management and token system</p>
        </div>
        {canWrite && (
          <Button onClick={() => setShowGenerate(true)} className="gap-2">
            <Plus size={16} /> Generate Token
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Total Today</p><p className="text-2xl font-bold">{allTokens.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Waiting</p><p className="text-2xl font-bold text-amber-600">{waiting}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">In Progress</p><p className="text-2xl font-bold text-blue-600">{inProgress}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Completed</p><p className="text-2xl font-bold text-green-600">{completed}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" /> Today's Queue
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Token #</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Status</TableHead>
                {canWrite && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {allTokens.map((t: any) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                      {t.tokenNumber}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{t.patientName}</TableCell>
                  <TableCell>{t.department}</TableCell>
                  <TableCell>{t.doctor}</TableCell>
                  <TableCell>
                    <Badge variant={t.status === "Completed" ? "success" : t.status === "In-Progress" ? "info" : "warning"}>
                      {t.status}
                    </Badge>
                  </TableCell>
                  {canWrite && (
                    <TableCell>
                      {t.status === "Waiting" && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: t.id, status: "In-Progress" })}>
                          Start
                        </Button>
                      )}
                      {t.status === "In-Progress" && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: t.id, status: "Completed" })}>
                          Complete
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {allTokens.length === 0 && (
                <TableRow>
                  <TableCell colSpan={canWrite ? 6 : 5} className="text-center py-8 text-muted-foreground">No tokens today</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Generate Token Modal */}
      <Dialog open={showGenerate} onOpenChange={setShowGenerate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Generate OPD Token</DialogTitle></DialogHeader>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="space-y-2"><Label>Patient Name</Label><Input name="patientName" required /></div>
            <div className="space-y-2"><Label>Department</Label><Input name="department" required /></div>
            <div className="space-y-2"><Label>Doctor</Label><Input name="doctor" required /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowGenerate(false)}>Cancel</Button>
              <Button type="submit">Generate</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
