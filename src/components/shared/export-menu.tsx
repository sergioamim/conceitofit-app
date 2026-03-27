"use client";

import { useCallback, useRef, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportToCSV, exportToPDF, type ExportColumn } from "@/lib/export/table-export";

export type { ExportColumn } from "@/lib/export/table-export";

export interface ExportMenuProps<T> {
  data: T[];
  columns: ExportColumn<T>[];
  filename: string;
  title?: string;
  disabled?: boolean;
}

export function ExportMenu<T>({
  data,
  columns,
  filename,
  title,
  disabled = false,
}: ExportMenuProps<T>) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleCSV = useCallback(() => {
    exportToCSV(data, columns, filename);
    setOpen(false);
  }, [data, columns, filename]);

  const handlePDF = useCallback(async () => {
    setExporting(true);
    try {
      await exportToPDF(data, columns, filename, title);
    } finally {
      setExporting(false);
      setOpen(false);
    }
  }, [data, columns, filename, title]);

  return (
    <div className="relative" ref={menuRef}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-9 border-border"
        disabled={disabled || data.length === 0}
        onClick={() => setOpen((prev) => !prev)}
      >
        <Download className="size-4" />
        Exportar
      </Button>

      {open && (
        <>
          {/* backdrop to close */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-1 w-40 rounded-md border border-border bg-card shadow-lg">
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary"
              onClick={handleCSV}
            >
              Exportar CSV
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary"
              disabled={exporting}
              onClick={() => void handlePDF()}
            >
              {exporting ? "Gerando PDF..." : "Exportar PDF"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
