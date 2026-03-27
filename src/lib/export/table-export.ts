/**
 * Client-side table export utilities (CSV and PDF).
 * No backend dependency — generates files entirely in the browser.
 */

export interface ExportColumn<T = Record<string, unknown>> {
  /** Column header label */
  label: string;
  /** Property key or accessor function to extract the cell value */
  accessor: keyof T | ((row: T) => string | number);
}

function resolveCell<T>(row: T, col: ExportColumn<T>): string {
  if (typeof col.accessor === "function") {
    return String(col.accessor(row) ?? "");
  }
  return String((row as Record<string, unknown>)[col.accessor as string] ?? "");
}

/* ---------- CSV ---------- */

function escapeCsvCell(value: string): string {
  if (value.includes('"') || value.includes(";") || value.includes("\n")) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

export function exportToCSV<T>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string,
): void {
  const BOM = "\uFEFF"; // UTF-8 BOM for Excel compatibility
  const header = columns.map((col) => escapeCsvCell(col.label)).join(";");
  const rows = data.map((row) =>
    columns.map((col) => escapeCsvCell(resolveCell(row, col))).join(";"),
  );
  const csv = BOM + [header, ...rows].join("\r\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, filename.endsWith(".csv") ? filename : `${filename}.csv`);
}

/* ---------- PDF ---------- */

export async function exportToPDF<T>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string,
  title?: string,
): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  if (title) {
    doc.setFontSize(14);
    doc.text(title, 14, 16);
  }

  const head = [columns.map((col) => col.label)];
  const body = data.map((row) => columns.map((col) => resolveCell(row, col)));

  autoTable(doc, {
    startY: title ? 22 : 14,
    head,
    body,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [30, 32, 38], textColor: [200, 241, 53] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { left: 14, right: 14 },
  });

  doc.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}

/* ---------- Helpers ---------- */

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
