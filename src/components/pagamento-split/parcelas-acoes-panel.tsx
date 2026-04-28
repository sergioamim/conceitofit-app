"use client";

import { useState } from "react";
import { Check, RotateCcw, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { formatBRL } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import {
  FORMA_PAGAMENTO_LABEL,
  type ParcelaResponseDto,
  confirmarParcelaApi,
  estornarParcelaApi,
} from "@/lib/api/pagamentos-split";

interface ParcelasAcoesPanelProps {
  tenantId: string;
  pagamentoId: string;
  parcelas: ParcelaResponseDto[];
  operadorId?: string;
  onParcelaUpdated: (parcela: ParcelaResponseDto) => void;
}

const STATUS_BADGE: Record<string, string> = {
  PENDENTE: "border-amber-500 bg-amber-500/10 text-amber-700",
  CONFIRMADO: "border-green-500 bg-green-500/10 text-green-700",
  FALHOU: "border-red-500 bg-red-500/10 text-red-700",
};

const STATUS_LABEL: Record<string, string> = {
  PENDENTE: "Pendente",
  CONFIRMADO: "Confirmado",
  FALHOU: "Estornado",
};

/**
 * Lista de parcelas de um pagamento com ações por linha:
 * - Confirmar (PENDENTE → CONFIRMADO) — útil pra PIX
 * - Estornar (CONFIRMADO/PENDENTE → FALHOU) — pede motivo
 *
 * W5 do PRD_PAGAMENTO_SPLIT.
 */
export function ParcelasAcoesPanel({
  tenantId,
  pagamentoId,
  parcelas,
  operadorId,
  onParcelaUpdated,
}: ParcelasAcoesPanelProps) {
  const { toast } = useToast();
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);
  const [nsuByParcela, setNsuByParcela] = useState<Record<string, string>>({});
  const [estornoTarget, setEstornoTarget] = useState<ParcelaResponseDto | null>(null);
  const [motivoEstorno, setMotivoEstorno] = useState("");
  const [estornando, setEstornando] = useState(false);

  const handleConfirmar = async (p: ParcelaResponseDto) => {
    setConfirmandoId(p.id);
    try {
      const result = await confirmarParcelaApi(tenantId, pagamentoId, p.id, {
        operadorId,
        codigoAutorizacao: nsuByParcela[p.id] || undefined,
      });
      onParcelaUpdated(result);
      toast({
        title: "Parcela confirmada",
        description: `${FORMA_PAGAMENTO_LABEL[p.forma]} · ${formatBRL(p.valor)}`,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao confirmar parcela";
      toast({ title: "Erro", description: msg, variant: "destructive" });
    } finally {
      setConfirmandoId(null);
    }
  };

  const openEstorno = (p: ParcelaResponseDto) => {
    setEstornoTarget(p);
    setMotivoEstorno("");
  };

  const handleEstornar = async () => {
    if (!estornoTarget) return;
    if (!motivoEstorno.trim()) {
      toast({
        title: "Motivo obrigatório",
        description: "Informe o motivo do estorno antes de confirmar.",
        variant: "destructive",
      });
      return;
    }
    setEstornando(true);
    try {
      const result = await estornarParcelaApi(
        tenantId,
        pagamentoId,
        estornoTarget.id,
        { operadorId, motivo: motivoEstorno.trim() },
      );
      onParcelaUpdated(result);
      toast({
        title: "Parcela estornada",
        description: `${FORMA_PAGAMENTO_LABEL[estornoTarget.forma]} · ${formatBRL(estornoTarget.valor)}`,
      });
      setEstornoTarget(null);
      setMotivoEstorno("");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao estornar parcela";
      toast({ title: "Erro", description: msg, variant: "destructive" });
    } finally {
      setEstornando(false);
    }
  };

  return (
    <>
      <ul className="space-y-2" data-testid="parcelas-acoes-list">
        {parcelas.map((p) => {
          const isPendente = p.status === "PENDENTE";
          const isConfirmado = p.status === "CONFIRMADO";
          const isFalhou = p.status === "FALHOU";
          return (
            <li
              key={p.id}
              className="rounded-lg border border-border bg-secondary/30 p-3"
              data-testid={`parcela-${p.id}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                        STATUS_BADGE[p.status] ?? STATUS_BADGE.PENDENTE,
                      )}
                    >
                      {STATUS_LABEL[p.status] ?? p.status}
                    </span>
                    <span className="font-semibold text-sm">
                      {FORMA_PAGAMENTO_LABEL[p.forma]}
                    </span>
                    {p.numeroParcelas > 1 && (
                      <span className="text-xs text-muted-foreground">
                        {p.numeroParcelas}×
                      </span>
                    )}
                    {p.bandeira && (
                      <span className="text-xs text-muted-foreground">
                        {p.bandeira}
                      </span>
                    )}
                  </div>
                  {p.codigoAutorizacao && (
                    <div className="mt-1 text-xs font-mono text-muted-foreground">
                      NSU {p.codigoAutorizacao}
                    </div>
                  )}
                  {p.motivoEstorno && (
                    <div className="mt-1 text-xs text-red-700">
                      Motivo: {p.motivoEstorno}
                    </div>
                  )}
                </div>
                <div className="font-mono text-sm font-bold whitespace-nowrap">
                  {formatBRL(p.valor)}
                </div>
              </div>

              {/* Ações: confirmar (pendente) / estornar (confirmado) */}
              {!isFalhou && (
                <div className="mt-3 flex items-center gap-2">
                  {isPendente && (
                    <>
                      <Input
                        placeholder="NSU/TXID (opcional)"
                        value={nsuByParcela[p.id] ?? ""}
                        onChange={(e) =>
                          setNsuByParcela((prev) => ({
                            ...prev,
                            [p.id]: e.target.value,
                          }))
                        }
                        className="h-8 flex-1 font-mono text-xs"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => void handleConfirmar(p)}
                        disabled={confirmandoId === p.id}
                        data-testid={`parcela-confirmar-${p.id}`}
                      >
                        {confirmandoId === p.id ? (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        ) : (
                          <Check className="mr-1 h-3 w-3" />
                        )}
                        Confirmar
                      </Button>
                    </>
                  )}
                  {isConfirmado && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => openEstorno(p)}
                      data-testid={`parcela-estornar-${p.id}`}
                    >
                      <RotateCcw className="mr-1 h-3 w-3" />
                      Estornar
                    </Button>
                  )}
                  {isPendente && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => openEstorno(p)}
                      className="text-muted-foreground"
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* Confirm dialog do estorno */}
      <AlertDialog
        open={estornoTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEstornoTarget(null);
            setMotivoEstorno("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Estornar parcela</AlertDialogTitle>
            <AlertDialogDescription>
              {estornoTarget && (
                <>
                  Estorno de{" "}
                  <strong>{FORMA_PAGAMENTO_LABEL[estornoTarget.forma]}</strong>{" "}
                  no valor de <strong>{formatBRL(estornoTarget.valor)}</strong>.
                  {estornoTarget.forma === "CREDITO_INTERNO" &&
                    " O saldo será devolvido ao cliente automaticamente."}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1">
            <label htmlFor="motivo-estorno" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Motivo do estorno *
            </label>
            <Input
              id="motivo-estorno"
              value={motivoEstorno}
              onChange={(e) => setMotivoEstorno(e.target.value)}
              placeholder="Ex: Cliente cancelou compra"
              data-testid="parcela-estorno-motivo"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={estornando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleEstornar();
              }}
              disabled={estornando || !motivoEstorno.trim()}
              data-testid="parcela-estorno-confirmar"
            >
              {estornando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Estornando...
                </>
              ) : (
                "Confirmar estorno"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
