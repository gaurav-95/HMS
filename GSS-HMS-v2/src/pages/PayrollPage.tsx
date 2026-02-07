import { usePayroll } from "@/hooks/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { ExportButtons } from "@/components/ExportButtons";
import { formatCurrency } from "@/lib/utils";

export default function PayrollPage() {
  const { data: payroll = [], isLoading } = usePayroll();

  const allPayroll = payroll as any[];
  const totalGross = allPayroll.reduce((sum: number, p: any) => sum + (p.baseSalary || 0) + (p.bonus || 0), 0);
  const totalNet = allPayroll.reduce((sum: number, p: any) => sum + (p.netSalary || 0), 0);

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Monthly Payroll</h1>
          <p className="text-muted-foreground">Salary processing and disbursement</p>
        </div>
        <ExportButtons
          title="Monthly Payroll"
          columns={["Employee", "Month", "Base Salary", "Bonus", "Deductions", "Net Salary", "Status"]}
          rows={allPayroll.map((p: any) => [p.staffName || "", p.month || "", p.baseSalary ?? 0, p.bonus ?? 0, p.deductions ?? 0, p.netSalary ?? 0, p.status || ""])}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Gross Payroll</p><p className="text-2xl font-bold">{formatCurrency(totalGross)}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Net Payroll</p><p className="text-2xl font-bold">{formatCurrency(totalNet)}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Employees</p><p className="text-2xl font-bold">{allPayroll.length}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Payroll Records</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Base + Bonus</TableHead>
                <TableHead className="text-right">Deductions</TableHead>
                <TableHead className="text-right">Net Salary</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allPayroll.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.staffName}</TableCell>
                  <TableCell>{p.month}</TableCell>
                  <TableCell className="text-right">{formatCurrency((p.baseSalary || 0) + (p.bonus || 0))}</TableCell>
                  <TableCell className="text-right text-destructive">{formatCurrency(p.deductions)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(p.netSalary)}</TableCell>
                  <TableCell>
                    <Badge variant={p.status === "Paid" ? "success" : p.status === "Processed" ? "info" : "warning"}>
                      {p.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {allPayroll.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No payroll records</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
