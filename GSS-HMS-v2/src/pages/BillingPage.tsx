import { useState, useMemo } from "react";
import { useBilling, useCreateBilling, usePayBilling, useDeleteBilling } from "@/hooks/queries";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Search, IndianRupee, CreditCard, Trash2 } from "lucide-react";
import { ExportButtons } from "@/components/ExportButtons";

const today = new Date().toISOString().split("T")[0];
const PAYMENT_METHODS = ["Cash", "Card", "UPI", "Insurance"] as const;
const BILL_STATUSES = ["Unpaid", "Partial", "Paid", "Refunded"] as const;

const blankBill = {
  patientName: "",
  items: "[]",
  subtotal: 0,
  discount: 0,
  tax: 0,
  totalAmount: 0,
  paidAmount: 0,
  paymentMethod: "Cash",
  status: "Unpaid",
  createdDate: today,
  createdBy: "",
};

// Simple line-item editor state
interface LineItem { description: string; amount: number; }

export default function BillingPage() {
  const { data: bills = [], isLoading } = useBilling();
  const { hasPermission, user } = useAuth();
  const createBill = useCreateBilling();
  const payBill = usePayBilling();
  const deleteBill = useDeleteBilling();

  const all = bills as any[];
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [payTarget, setPayTarget] = useState<any>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState("Cash");

  // Form state
  const [patientName, setPatientName] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([{ description: "", amount: 0 }]);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);

  const filtered = useMemo(() => all.filter((b: any) => {
    const matchSearch = !search || b.patientName?.toLowerCase().includes(search.toLowerCase()) || b.invoiceNumber?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || b.status === filterStatus;
    return matchSearch && matchStatus;
  }), [all, search, filterStatus]);

  const totalRevenue = all.filter((b: any) => b.status === "Paid").reduce((s: number, b: any) => s + (b.totalAmount || 0), 0);
  const totalPending = all.filter((b: any) => b.status === "Unpaid" || b.status === "Partial").reduce((s: number, b: any) => s + ((b.totalAmount || 0) - (b.paidAmount || 0)), 0);

  const addLineItem = () => setLineItems((l) => [...l, { description: "", amount: 0 }]);
  const updateLine = (i: number, field: keyof LineItem, val: string | number) => {
    setLineItems((l) => l.map((item, idx) => idx === i ? { ...item, [field]: val } : item));
  };
  const removeLine = (i: number) => setLineItems((l) => l.filter((_, idx) => idx !== i));

  const subtotal = lineItems.reduce((s, l) => s + (Number(l.amount) || 0), 0);
  const totalAmount = subtotal - discount + tax;

  const handleCreate = () => {
    if (!patientName || lineItems.length === 0) return;
    createBill.mutate({
      patientName,
      items: JSON.stringify(lineItems),
      subtotal,
      discount,
      tax,
      totalAmount,
      paidAmount: 0,
      paymentMethod: "Cash",
      status: "Unpaid",
      createdDate: today,
      createdBy: user?.name || "",
    }, {
      onSuccess: () => {
        setOpen(false);
        setPatientName("");
        setLineItems([{ description: "", amount: 0 }]);
        setDiscount(0);
        setTax(0);
      },
    });
  };

  const handlePay = () => {
    if (!payTarget) return;
    payBill.mutate({ id: payTarget.id, paidAmount: payAmount, paymentMethod: payMethod }, {
      onSuccess: () => { setPayOpen(false); setPayTarget(null); },
    });
  };

  const openPay = (b: any) => {
    setPayTarget(b);
    setPayAmount(b.totalAmount - (b.paidAmount || 0));
    setPayMethod(b.paymentMethod || "Cash");
    setPayOpen(true);
  };

  const fmt = (n: number) => `₹${(n || 0).toLocaleString("en-IN")}`;

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Billing</h1>
          <p className="text-muted-foreground">Invoice management and payment tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButtons
            title="Billing Report"
            columns={["Invoice #", "Patient", "Subtotal", "Discount", "Tax", "Total", "Paid", "Status", "Date"]}
            rows={filtered.map((b: any) => [b.invoiceNumber, b.patientName, b.subtotal, b.discount, b.tax, b.totalAmount, b.paidAmount, b.status, b.createdDate])}
          />
          {hasPermission("payroll:write") && (
            <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> New Invoice</Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search patient or invoice..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {BILL_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="pt-4 pb-4 flex items-center gap-3">
          <IndianRupee className="h-5 w-5 text-green-600" />
          <div><p className="text-sm text-muted-foreground">Total Revenue</p><p className="text-2xl font-bold text-green-600">{fmt(totalRevenue)}</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4 flex items-center gap-3">
          <IndianRupee className="h-5 w-5 text-amber-600" />
          <div><p className="text-sm text-muted-foreground">Pending Dues</p><p className="text-2xl font-bold text-amber-600">{fmt(totalPending)}</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4">
          <p className="text-sm text-muted-foreground">Total Invoices</p><p className="text-2xl font-bold">{all.length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4">
          <p className="text-sm text-muted-foreground">Paid Invoices</p><p className="text-2xl font-bold text-green-600">{all.filter((b: any) => b.status === "Paid").length}</p>
        </CardContent></Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader><CardTitle>Invoices</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((b: any) => (
                <TableRow key={b.id}>
                  <TableCell className="font-mono text-sm">{b.invoiceNumber}</TableCell>
                  <TableCell className="font-medium">{b.patientName}</TableCell>
                  <TableCell>{fmt(b.totalAmount)}</TableCell>
                  <TableCell>{fmt(b.paidAmount)}</TableCell>
                  <TableCell>{b.paymentMethod || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{b.createdDate}</TableCell>
                  <TableCell>
                    <Badge variant={b.status === "Paid" ? "success" : b.status === "Partial" ? "warning" : b.status === "Refunded" ? "secondary" : "destructive"}>
                      {b.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    {(b.status === "Unpaid" || b.status === "Partial") && hasPermission("payroll:write") && (
                      <Button size="sm" variant="outline" onClick={() => openPay(b)}>
                        <CreditCard className="h-3 w-3 mr-1" /> Pay
                      </Button>
                    )}
                    {hasPermission("payroll:write") && (
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteBill.mutate(b.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No billing records found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Invoice Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Invoice</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Patient Name</Label>
              <Input value={patientName} onChange={(e) => setPatientName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Line Items</Label>
              {lineItems.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input placeholder="Description" className="flex-1" value={item.description} onChange={(e) => updateLine(i, "description", e.target.value)} />
                  <Input type="number" className="w-28" placeholder="₹ Amount" value={item.amount || ""} onChange={(e) => updateLine(i, "amount", Number(e.target.value))} />
                  {lineItems.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeLine(i)}><Trash2 className="h-3 w-3" /></Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addLineItem}><Plus className="h-3 w-3 mr-1" /> Add Item</Button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1"><Label>Subtotal</Label><p className="text-lg font-semibold">{fmt(subtotal)}</p></div>
              <div className="space-y-1"><Label>Discount</Label><Input type="number" value={discount || ""} onChange={(e) => setDiscount(Number(e.target.value))} /></div>
              <div className="space-y-1"><Label>Tax</Label><Input type="number" value={tax || ""} onChange={(e) => setTax(Number(e.target.value))} /></div>
            </div>
            <div className="text-right text-lg font-bold">Total: {fmt(totalAmount)}</div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!patientName || createBill.isPending}>
              {createBill.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Create Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pay Dialog */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <p className="text-sm text-muted-foreground">Invoice: <strong>{payTarget?.invoiceNumber}</strong> — Due: <strong>{fmt((payTarget?.totalAmount || 0) - (payTarget?.paidAmount || 0))}</strong></p>
            <div className="space-y-2">
              <Label>Payment Amount</Label>
              <Input type="number" value={payAmount || ""} onChange={(e) => setPayAmount(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={payMethod} onValueChange={setPayMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOpen(false)}>Cancel</Button>
            <Button onClick={handlePay} disabled={payBill.isPending}>
              {payBill.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
