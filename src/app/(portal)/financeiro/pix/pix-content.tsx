"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, QrCode, X, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { formatBRL } from "@/lib/formatters";
import {
  useCriarCobrancaPix,
  useCancelarCobrancaPix,
  usePixCobrancaStatus,
} from "@/lib/query/use-pix";
import type { PixCobranca } from "@/lib/api/pix";

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  AGUARDANDO_PAGAMENTO: {
    label: "Aguardando pagamento",
    className: "border-gym-warning/30 bg-gym-warning/10 text-gym-warning",
  },
  CONFIRMADA: {
    label: "Confirmada",
    className: "border-gym-teal/30 bg-gym-teal/10 text-gym-teal",
  },
  CANCELADO: {
    label: "Cancelado",
    className: "border-gym-danger/30 bg-gym-danger/10 text-gym-danger",
  },
  DEVOLVIDO: {
    label: "Devolvido",
    className: "border-gym-danger/30 bg-gym-danger/10 text-gym-danger",
  },
};

function PixStatusBadge({ status }: { status: string }) {
  const mapped = STATUS_MAP[status] ?? {
    label: status,
    className: "border-border bg-muted text-muted-foreground",
  };
  return (
    <Badge
      variant="outline"
      className={`rounded-full px-3 py-1 text-xs font-medium ${mapped.className}`}
    >
      {mapped.label}
    </Badge>
  );
}

function isTerminalStatus(status: string): boolean {
  return ["CONFIRMADA", "CANCELADO", "DEVOLVIDO"].includes(status);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PixContent() {
  const { tenantId } = useTenantContext();

  // Form state
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  // Cobranca result
  const [cobranca, setCobranca] = useState<PixCobranca | null>(null);
  const [copiado, setCopiado] = useState(false);
  const copiadoTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mutations
  const criarMutation = useCriarCobrancaPix();
  const cancelarMutation = useCancelarCobrancaPix();

  // Polling de status
  const { data: statusData } = usePixCobrancaStatus({
    tenantId,
    txId: cobranca?.txId,
    enabled: Boolean(cobranca) && !isTerminalStatus(cobranca?.status ?? ""),
  });

  // Atualiza status local quando polling retorna novo valor
  useEffect(() => {
    if (statusData && cobranca && statusData.status !== cobranca.status) {
      setCobranca((prev) =>
        prev ? { ...prev, status: statusData.status } : prev,
      );
    }
  }, [statusData, cobranca]);

  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (copiadoTimeout.current) clearTimeout(copiadoTimeout.current);
    };
  }, []);

  const handleGerarPix = useCallback(async () => {
    if (!tenantId) return;

    const valorNumerico = parseFloat(valor.replace(",", "."));
    if (!valorNumerico || valorNumerico <= 0) {
      setErro("Informe um valor valido maior que zero.");
      return;
    }

    setErro(null);
    try {
      const result = await criarMutation.mutateAsync({
        tenantId,
        valor: valorNumerico,
        descricao: descricao.trim() || undefined,
      });
      setCobranca(result);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Falha ao gerar cobranca PIX.",
      );
    }
  }, [tenantId, valor, descricao, criarMutation]);

  const handleCopiar = useCallback(async () => {
    if (!cobranca?.pixCopiaECola) return;
    try {
      await navigator.clipboard.writeText(cobranca.pixCopiaECola);
      setCopiado(true);
      if (copiadoTimeout.current) clearTimeout(copiadoTimeout.current);
      copiadoTimeout.current = setTimeout(() => setCopiado(false), 2500);
    } catch {
      // fallback silencioso
    }
  }, [cobranca]);

  const handleCancelar = useCallback(async () => {
    if (!tenantId || !cobranca) return;
    try {
      const result = await cancelarMutation.mutateAsync({
        txId: cobranca.txId,
        tenantId,
      });
      setCobranca((prev) =>
        prev ? { ...prev, status: result.status } : prev,
      );
    } catch {
      // erro silencioso — status nao muda
    }
  }, [tenantId, cobranca, cancelarMutation]);

  const handleNova = useCallback(() => {
    setCobranca(null);
    setValor("");
    setDescricao("");
    setErro(null);
    setCopiado(false);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Cobranca PIX
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gere cobran&ccedil;as PIX com QR Code e acompanhe o pagamento em tempo
          real
        </p>
      </div>

      {/* Formulario */}
      <AnimatePresence mode="wait">
        {!cobranca && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="glass-card rounded-2xl border border-border/40 p-6 shadow-xl shadow-black/5"
          >
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Valor (R$)
                </label>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  className="bg-secondary border-border text-lg font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Descri&ccedil;&atilde;o (opcional)
                </label>
                <Input
                  type="text"
                  placeholder="Ex.: Mensalidade janeiro"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>

              {erro && (
                <div className="rounded-xl border border-gym-danger/30 bg-gym-danger/10 px-4 py-3 text-sm text-gym-danger">
                  {erro}
                </div>
              )}

              <Button
                onClick={() => void handleGerarPix()}
                disabled={criarMutation.isPending || !tenantId}
                className="w-full bg-gym-accent text-black hover:bg-gym-accent/90 font-semibold"
              >
                {criarMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <QrCode className="mr-2 h-4 w-4" />
                )}
                {criarMutation.isPending ? "Gerando..." : "Gerar PIX"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resultado */}
      <AnimatePresence mode="wait">
        {cobranca && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="glass-card relative rounded-2xl border-2 border-gym-accent/40 p-6 shadow-xl shadow-black/5"
          >
            <div className="flex flex-col items-center space-y-5">
              {/* Status */}
              <div className="flex items-center gap-3">
                <PixStatusBadge status={cobranca.status} />
                {!isTerminalStatus(cobranca.status) && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Atualizando...
                  </span>
                )}
              </div>

              {/* QR Code */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15, duration: 0.3 }}
                className="rounded-2xl border border-gym-accent/20 bg-surface p-4"
              >
                <QRCodeSVG
                  value={cobranca.pixCopiaECola}
                  size={200}
                  bgColor="transparent"
                  fgColor="#ffffff"
                  level="M"
                />
              </motion.div>

              {/* Valor */}
              <p className="font-display text-2xl font-bold text-gym-accent">
                {formatBRL(
                  parseFloat(valor.replace(",", ".")) || 0,
                )}
              </p>

              {/* Copia e cola */}
              <div className="w-full max-w-sm space-y-2">
                <p className="text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  PIX Copia e Cola
                </p>
                <div className="relative">
                  <Input
                    readOnly
                    value={cobranca.pixCopiaECola}
                    className="bg-secondary border-border pr-10 text-xs"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-gym-accent hover:text-gym-accent/80"
                    onClick={() => void handleCopiar()}
                  >
                    {copiado ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Botao copiar grande */}
              <Button
                onClick={() => void handleCopiar()}
                className="bg-gym-accent text-black hover:bg-gym-accent/90 font-semibold"
              >
                {copiado ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar codigo PIX
                  </>
                )}
              </Button>

              {/* Acoes */}
              <div className="flex gap-3">
                {!isTerminalStatus(cobranca.status) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gym-danger/30 text-gym-danger hover:bg-gym-danger/10"
                    onClick={() => void handleCancelar()}
                    disabled={cancelarMutation.isPending}
                  >
                    {cancelarMutation.isPending ? (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    ) : (
                      <X className="mr-2 h-3 w-3" />
                    )}
                    Cancelar cobranca
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="border-border"
                  onClick={handleNova}
                >
                  <QrCode className="mr-2 h-3 w-3" />
                  Nova cobranca
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
