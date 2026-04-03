"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VendaWorkspace } from "../hooks/use-venda-workspace";

interface ScannerDialogProps {
  workspace: VendaWorkspace;
}

export function ScannerDialog({ workspace }: ScannerDialogProps) {
  const {
    scannerOpen,
    setScannerOpen,
    videoRef,
    manualCode,
    setManualCode,
    applyCodeToProduct,
    setScannerError,
    scannerError,
  } = workspace;

  return (
    <Dialog open={scannerOpen} onOpenChange={setScannerOpen}>
      <DialogContent className="border-border bg-card sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Leitor de código de barras</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Aponte a câmera para o código de barras do produto ou informe o código manualmente.
          </p>
          <video ref={videoRef} className="h-56 w-full rounded-md border border-border bg-black/80 object-cover" />

          <div className="flex items-center gap-2">
            <Input
              placeholder="Código de barras ou SKU"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="bg-secondary border-border"
            />
            <Button
              type="button"
              onClick={() => {
                if (!applyCodeToProduct(manualCode)) {
                  setScannerError("Código não encontrado nos produtos.");
                  return;
                }
                setScannerOpen(false);
              }}
            >
              Buscar
            </Button>
          </div>

          {scannerError && (
            <p className="text-xs text-gym-danger">{scannerError}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
