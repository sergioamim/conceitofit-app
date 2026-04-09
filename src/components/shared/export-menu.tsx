"use client";

import { useCallback, useRef, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportToCSV, exportToPDF, type ExportColumn } from "@/lib/export/table-export";

export type { ExportColumn } from "@/lib/export/table-export";

export interface ServerExportAction {
  label: string;
  onClick: () => Promise<void>;
}

export interface ExportMenuProps<T> {
  data: T[];
  columns: ExportColumn<T>[];
  filename: string;
  title?: string;
  disabled?: boolean;
  /** Opcoes de exportacao server-side (download via API). */
  serverActions?: ServerExportAction[];
}

export function ExportMenu<T>({
  data,
  columns,
  filename,
  title,
  disabled = false,
  serverActions,
}: ExportMenuProps<T>) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [serverExporting, setServerExporting] = useState(false);
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
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
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
            {serverActions && serverActions.length > 0 && (
              <>
                <div className="my-1 border-t border-border" />
                <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Exportar do servidor
                </p>
                {serverActions.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary"
                    disabled={serverExporting}
                    onClick={async () => {
                      setServerExporting(true);
                      try {
                        await action.onClick();
                      } finally {
                        setServerExporting(false);
                        setOpen(false);
                      }
                    }}
                  >
                    {serverExporting ? "Exportando..." : action.label}
                  </button>
                ))}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
