import { FileDown, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportPDF, exportExcel } from "@/lib/export";
import { toast } from "sonner";

interface ExportButtonsProps {
  title: string;
  columns: string[];
  rows: (string | number)[][];
  fileName?: string;
}

export function ExportButtons({ title, columns, rows, fileName }: ExportButtonsProps) {
  const handlePDF = () => {
    if (!rows.length) { toast.error("No data to export"); return; }
    exportPDF(title, columns, rows, fileName);
    toast.success(`${title} exported as PDF`);
  };

  const handleExcel = () => {
    if (!rows.length) { toast.error("No data to export"); return; }
    exportExcel(title, columns, rows, fileName);
    toast.success(`${title} exported as Excel`);
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handlePDF}>
        <FileDown className="h-4 w-4 mr-1" /> PDF
      </Button>
      <Button variant="outline" size="sm" onClick={handleExcel}>
        <FileSpreadsheet className="h-4 w-4 mr-1" /> Excel
      </Button>
    </div>
  );
}
