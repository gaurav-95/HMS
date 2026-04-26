import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

// ─── PDF Export ──────────────────────────────────────────────
export function exportPDF(
  title: string,
  columns: string[],
  rows: (string | number)[][],
  fileName?: string
) {
  const doc = new jsPDF({ orientation: rows[0]?.length > 6 ? "landscape" : "portrait" });

  // Header
  doc.setFontSize(16);
  doc.setTextColor(13, 148, 136); // teal-600
  doc.text("GSS Hospital Pro", 14, 15);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`${title} — Generated ${new Date().toLocaleDateString("en-IN")}`, 14, 22);

  // Table
  autoTable(doc, {
    head: [columns],
    body: rows,
    startY: 28,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [13, 148, 136], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { left: 14, right: 14 },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.getWidth() - 30, doc.internal.pageSize.getHeight() - 10);
    doc.text("Gandhi Seva Sadan Hospital", 14, doc.internal.pageSize.getHeight() - 10);
  }

  doc.save(`${fileName || title.replace(/\s+/g, "_")}.pdf`);
}

// ─── Excel Export ────────────────────────────────────────────
export function exportExcel(
  title: string,
  columns: string[],
  rows: (string | number)[][],
  fileName?: string
) {
  const ws = XLSX.utils.aoa_to_sheet([columns, ...rows]);

  // Column widths
  ws["!cols"] = columns.map((col) => ({
    wch: Math.max(col.length, ...rows.map((r) => String(r[columns.indexOf(col)] ?? "").length)) + 2,
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 31)); // Sheet name max 31 chars
  XLSX.writeFile(wb, `${fileName || title.replace(/\s+/g, "_")}.xlsx`);
}
