"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type ProspectLossReasonDialogProps = {
  open: boolean;
  submitting?: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void | Promise<void>;
};

export function ProspectLossReasonDialog({
  open,
  submitting = false,
  onClose,
  onConfirm,
}: ProspectLossReasonDialogProps) {
  const [reason, setReason] = useState("");

  function handleClose() {
    setReason("");
    onClose();
  }

  async function handleConfirm() {
    await onConfirm(reason.trim() || undefined);
    setReason("");
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!submitting && !nextOpen) handleClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Marcar prospect como perdido</DialogTitle>
          <DialogDescription>
            Registre o motivo da perda para manter o histórico comercial consistente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <label
            htmlFor="prospect-loss-reason"
            className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Motivo da perda
          </label>
          <Textarea
            id="prospect-loss-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Ex.: não respondeu, escolheu concorrente, orçamento fora do perfil"
            className="min-h-28"
            disabled={submitting}
          />
          <p className="text-xs text-muted-foreground">
            Campo opcional. Se preferir, você pode continuar sem preencher.
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="button" variant="destructive" onClick={() => void handleConfirm()} disabled={submitting}>
            {submitting ? "Salvando..." : "Marcar como perdido"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
