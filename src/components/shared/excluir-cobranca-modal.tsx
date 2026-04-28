"use client";

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatBRL, formatDate } from "@/lib/formatters";
import type { Pagamento } from "@/lib/types";

export function ExcluirCobrancaModal({
  pagamento,
  justificativa,
  setJustificativa,
  loading,
  error,
  onClose,
  onConfirm,
}: {
  pagamento: Pagamento;
  justificativa: string;
  setJustificativa: (value: string) => void;
  loading: boolean;
  error: string;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}) {
  return (
    <Dialog
      open
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent className="border-border bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Excluir cobrança?</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-secondary/40 p-3 text-sm">
            <p className="font-medium">{pagamento.descricao}</p>
            <p className="text-muted-foreground">
              Valor: <span className="font-semibold text-foreground">{formatBRL(pagamento.valorFinal)}</span>
            </p>
            <p className="text-muted-foreground">Vencimento: {formatDate(pagamento.dataVencimento)}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Essa ação cancelará a cobrança e a retirará dos valores em aberto do cliente. O histórico será mantido para auditoria.
          </p>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Justificativa *
            </label>
            <Textarea
              value={justificativa}
              onChange={(event) => setJustificativa(event.target.value)}
              className="min-h-24 border-border bg-secondary"
              maxLength={500}
              placeholder="Explique por que a cobrança deve ser excluída..."
            />
          </div>
          {error ? <p className="text-xs text-gym-danger">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="border-border">
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => void onConfirm()}
            disabled={loading || !justificativa.trim()}
          >
            {loading ? "Excluindo..." : "Excluir cobrança"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
