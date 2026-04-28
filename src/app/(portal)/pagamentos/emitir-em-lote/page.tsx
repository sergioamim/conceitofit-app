"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getNfseConfiguracaoAtualApi } from "@/lib/api/financeiro-operacional";
import { emitirNfseEmLoteApi } from "@/lib/api/pagamentos";
import { getNfseBloqueioMensagem } from "@/lib/domain/financeiro";
import { listContasReceberOperacionais, type PagamentoComAluno } from "@/lib/tenant/financeiro/recebimentos";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import type { NfseConfiguracao } from "@/lib/types";
import { StatusBadge } from "@/components/shared/status-badge";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

import { formatBRL, formatDate } from "@/lib/formatters";

export default function EmitirNfseEmLotePage() {
  const { tenantId } = useTenantContext();
  const [pagamentos, setPagamentos] = useState<PagamentoComAluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmando, setConfirmando] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [nfseConfiguracao, setNfseConfiguracao] = useState<NfseConfiguracao | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const carregar = useCallback(async () => {
    if (!tenantId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [list, nfseConfig] = await Promise.all([
        listContasReceberOperacionais({ tenantId }),
        // Task #556: unidadeId = tenantId (1 tenant = 1 unidade no modelo AIOX)
        getNfseConfiguracaoAtualApi({ tenantId, unidadeId: tenantId }).catch(
          () => null,
        ),
      ]);
      setPagamentos(list);
      setNfseConfiguracao(nfseConfig);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const candidatos = useMemo(
    () => pagamentos.filter((item) => item.status === "PAGO" && !item.nfseEmitida),
    [pagamentos]
  );
  const totalSelecionado = candidatos.filter((item) => selectedIds.includes(item.id));
  const bloqueioFiscal = getNfseBloqueioMensagem(nfseConfiguracao);

  function setAllSelected(next: boolean) {
    setSelectedIds(next ? candidatos.map((item) => item.id) : []);
  }

  function toggleSelected(itemId: string, checked: boolean) {
    setSelectedIds((current) => {
      if (checked) {
        return current.includes(itemId) ? current : [...current, itemId];
      }
      return current.filter((id) => id !== itemId);
    });
  }

  async function handleConfirmarEmissao() {
    if (!tenantId) return;
    setConfirmando(true);
    try {
      setFeedback(null);
      await emitirNfseEmLoteApi({
        tenantId,
        ids: selectedIds,
      });
      setSelectedIds([]);
      setDialogOpen(false);
      setFeedback({ type: "success", message: "NFSe emitida em lote com sucesso." });
      await carregar();
    } catch (error) {
      setFeedback({ type: "error", message: normalizeErrorMessage(error) });
      setDialogOpen(false);
    } finally {
      setConfirmando(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Button asChild variant="outline" className="h-8 border-border text-xs">
          <Link href="/pagamentos">
            <ArrowLeft className="size-3.5" />
            Voltar para pagamentos
          </Link>
        </Button>
        <h1 className="font-display text-2xl font-bold tracking-tight">Emitir NFS-e em lote</h1>
        <p className="text-sm text-muted-foreground">Selecione os pagamentos pagos e confirme a emissão simultânea.</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        {feedback ? (
          <div
            className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
              feedback.type === "error"
                ? "border-gym-danger/30 bg-gym-danger/10 text-gym-danger"
                : "border-gym-teal/30 bg-gym-teal/10 text-gym-teal"
            }`}
          >
            {feedback.message}
          </div>
        ) : null}
        {bloqueioFiscal ? (
          <div className="mb-4 rounded-lg border border-gym-warning/30 bg-gym-warning/10 px-4 py-3 text-sm text-gym-warning">
            {bloqueioFiscal}
          </div>
        ) : null}
        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando pagamentos...</p>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">
                Pagamentos elegíveis: {candidatos.length} {totalSelecionado.length > 0 && `• Selecionados: ${totalSelecionado.length}`}
              </p>
              <Button
                size="sm"
                variant="outline"
                className="border-border text-xs"
                disabled={candidatos.length === 0 || Boolean(bloqueioFiscal)}
                onClick={() => setAllSelected(selectedIds.length !== candidatos.length)}
              >
                {selectedIds.length === candidatos.length ? "Desmarcar todos" : "Selecionar todos"}
              </Button>
            </div>

            <div className="mt-4 overflow-hidden rounded-lg border border-border">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary">
                    <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Pagamento
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Cliente
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Valor
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {candidatos.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                        Nenhum pagamento elegível para emissão em lote
                      </td>
                    </tr>
                  )}
                  {candidatos.map((item) => (
                    <tr key={item.id} className="hover:bg-secondary/40">
                      <td className="px-4 py-3">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(item.id)}
                            disabled={Boolean(bloqueioFiscal)}
                            onChange={(event) => toggleSelected(item.id, event.target.checked)}
                          />
                          <div>
                            <p className="text-sm font-medium">{item.descricao}</p>
                            <p className="text-xs text-muted-foreground">Vencimento: {formatDate(item.dataVencimento)}</p>
                          </div>
                        </label>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{item.aluno?.nome ?? "—"}</td>
                      <td className="px-4 py-3 text-sm">
                        {formatBRL(item.valorFinal)}
                        {item.desconto > 0 && (
                          <p className="text-xs text-muted-foreground">Desc: {formatBRL(item.desconto)}</p>
                        )}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-end">
              <Button
                size="sm"
                className="h-8"
                disabled={totalSelecionado.length === 0 || Boolean(bloqueioFiscal)}
                onClick={() => setDialogOpen(true)}
              >
                Emitir em lote ({totalSelecionado.length})
              </Button>
            </div>
          </>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-border bg-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">Confirmar emissão em lote</DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              <FileText className="size-4" />
              Confirmar emissão da NFS-e para <strong>{totalSelecionado.length}</strong> pagamento(s) selecionado(s).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-border"
              onClick={() => setDialogOpen(false)}
              disabled={confirmando}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => void handleConfirmarEmissao()}
              disabled={confirmando || totalSelecionado.length === 0}
            >
              {confirmando ? "Emitindo..." : "Confirmar emissão"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
