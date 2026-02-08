import { useState } from "react";
import { LAB_CATEGORIES } from "@/constants";
import { useAuth } from "@/context/AuthContext";
import { useLabTests, useCreateLabTest, useUpdateLabTest, useDeleteLabTest, usePermanentDeleteLabTest } from "@/hooks/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Loader2, Pencil, Trash2 } from "lucide-react";
import { ExportButtons } from "@/components/ExportButtons";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { formatDate } from "@/lib/utils";
import type { LabTest, LabCategory } from "@/types";

export default function LaboratoryPage() {
  const { hasPermission, user } = useAuth();
  const { data: tests = [], isLoading } = useLabTests();
  const createLabTest = useCreateLabTest();
  const updateLabTest = useUpdateLabTest();
  const deleteLabTest = useDeleteLabTest();
  const permanentDeleteLabTest = usePermanentDeleteLabTest();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTest, setEditingTest] = useState<any | null>(null);
  const [deletingTest, setDeletingTest] = useState<any | null>(null);
  const canWrite = hasPermission("lab:write");
  const canDelete = hasPermission("lab:delete");
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const allTests = tests as any[];
  const filteredTests = allTests.filter((t: any) => {
    const matchSearch =
      t.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.testName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = categoryFilter === "All" || t.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const statusCounts = {
    total: allTests.length,
    pending: allTests.filter((t: any) => t.status === "Pending").length,
    processing: allTests.filter((t: any) => t.status === "InProgress").length,
    completed: allTests.filter((t: any) => t.status === "Completed").length,
  };

  const handleAddTest = (newTest: Partial<LabTest>) => {
    createLabTest.mutate(newTest as Record<string, unknown>);
    setShowAddModal(false);
  };

  const handleEditTest = (updatedTest: Partial<LabTest>) => {
    if (!editingTest) return;
    updateLabTest.mutate({ id: editingTest.id, ...updatedTest });
    setEditingTest(null);
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Labs & Radiology</h1>
          <p className="text-muted-foreground">Diagnostic test queue and results</p>
        </div>
        <div className="flex gap-2">
          <ExportButtons
            title="Lab Tests Report"
            columns={["Patient", "Test", "Category", "Status", "Priority", "Date"]}
            rows={filteredTests.map((t: any) => [t.patientName, t.testName, t.category || "", t.status, t.priority || "", t.requestDate || ""])}
          />
          {canWrite && (
            <Button onClick={() => setShowAddModal(true)} className="gap-2">
              <Plus size={16} /> New Test
            </Button>
          )}
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Total", value: statusCounts.total, color: "text-foreground" },
          { label: "Pending", value: statusCounts.pending, color: "text-amber-600" },
          { label: "Processing", value: statusCounts.processing, color: "text-blue-600" },
          { label: "Completed", value: statusCounts.completed, color: "text-green-600" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search patient or test name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Categories</SelectItem>
            {LAB_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Tests Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Test</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTests.map((test) => (
                <TableRow key={test.id}>
                  <TableCell className="font-mono text-sm">{test.id}</TableCell>
                  <TableCell className="font-medium">{test.patientName}</TableCell>
                  <TableCell>{test.testName}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{test.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={test.priority === "STAT" ? "destructive" : test.priority === "Urgent" ? "warning" : "outline"}
                    >
                      {test.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={test.status === "Completed" ? "success" : test.status === "InProgress" ? "info" : "warning"}
                    >
                      {test.status === "InProgress" ? "Processing" : test.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(test.requestDate)}</TableCell>
                  <TableCell className="text-right space-x-1">
                    {canWrite && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingTest(test)}>
                        <Pencil size={14} />
                      </Button>
                    )}
                    {canDelete && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeletingTest(test)}>
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filteredTests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No tests found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Test Modal */}
      <AddTestModal open={showAddModal} onClose={() => setShowAddModal(false)} onSubmit={handleAddTest} />

      {/* Edit Test Modal */}
      {editingTest && (
        <AddTestModal
          open={!!editingTest}
          onClose={() => setEditingTest(null)}
          onSubmit={handleEditTest}
          defaultValues={editingTest}
          title="Edit Lab Test"
        />
      )}

      {/* Delete Confirmation */}
      <DeleteConfirmationDialog
        open={!!deletingTest}
        onClose={() => setDeletingTest(null)}
        onConfirm={() => { deleteLabTest.mutate(deletingTest?.id); setDeletingTest(null); }}
        entityName={`${deletingTest?.testName} (${deletingTest?.patientName})`}
        entityType="lab test"
        isSuperAdmin={isSuperAdmin}
        onPermanentDelete={() => { permanentDeleteLabTest.mutate(deletingTest?.id); setDeletingTest(null); }}
        isPending={deleteLabTest.isPending || permanentDeleteLabTest.isPending}
      />
    </div>
  );
}

// ── Add Test Modal ─────────────────────────────────────────

function AddTestModal({ open, onClose, onSubmit, defaultValues, title = "Order New Test" }: { open: boolean; onClose: () => void; onSubmit: (data: Partial<LabTest>) => void; defaultValues?: any; title?: string }) {
  const [patientName, setPatientName] = useState(defaultValues?.patientName || "");
  const [testName, setTestName] = useState(defaultValues?.testName || "");
  const [category, setCategory] = useState<LabCategory>(defaultValues?.category || "Biochemistry");
  const [priority, setPriority] = useState<"Normal" | "Urgent" | "STAT">(defaultValues?.priority || "Normal");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ patientName, testName, category, priority });
    if (!defaultValues) {
      setPatientName("");
      setTestName("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Patient Name</Label>
            <Input value={patientName} onChange={(e) => setPatientName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Test Name</Label>
            <Input value={testName} onChange={(e) => setTestName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as LabCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LAB_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Normal">Normal</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                  <SelectItem value="STAT">STAT</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">{defaultValues ? "Update Test" : "Order Test"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
