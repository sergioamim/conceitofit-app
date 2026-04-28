"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Tenant } from "@/lib/types";

type UnidadeBlockedBy = { type?: string; message: string };

type UnidadeDeleteDialogProps = {
  unit: Tenant | null;
  pending: boolean;
  error: string;
  blockedBy: UnidadeBlockedBy[];
  onClose: () => void;
  onConfirm: () => void;
};

export function UnidadeDeleteDialog({
  unit,
  pending,
  error,
  blockedBy,
  onClose,
  onConfirm,
}: UnidadeDeleteDialogProps) {
  return (
    <Dialog open={Boolean(unit)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border-border bg-card sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Excluir unidade</DialogTitle>
          <DialogDescription>
            {unit
              ? `Essa ação remove ${unit.nome} do backoffice global.`
              : "Confirme a exclusão da unidade selecionada."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>Use esta ação apenas quando a unidade realmente não puder permanecer cadastrada.</p>
          {error ? <p className="rounded-lg border border-gym-danger/30 bg-gym-danger/10 px-3 py-2 text-gym-danger">{error}</p> : null}
          {blockedBy.length > 0 ? (
            <div className="rounded-lg border border-border bg-secondary/30 px-3 py-2">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground">Dependências bloqueando a exclusão</p>
              <ul className="space-y-1">
                {blockedBy.map((item, index) => (
                  <li key={`${item.type ?? "blocked"}-${index}`}>{item.message}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" className="border-border" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={pending}>
            {pending ? "Excluindo..." : "Excluir unidade"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
