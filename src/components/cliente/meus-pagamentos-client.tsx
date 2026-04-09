"use client";

import { useCallback, useMemo, useState } from "react";
import {
  CreditCard,
  Download,
  FileText,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  DollarSign,
  Info,
  ArrowLeft,
  ExternalLink,
  Copy,
  Loader2,
  QrCode,
  Link2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { useMeusPagamentos, useMinhasCobrancas, useCobrancaDetalhe, useSolicitarSegundaVia } from "@/lib/query/use-portal-aluno";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Pagamento } from "@/lib/types";
import { formatBRL, formatDate } from "@/lib/formatters";
import { StatusBadge } from "@/components/shared/status-badge";

// ---------------------------------------------------------------------------
// Cobranca Status Badge
// ---------------------------------------------------------------------------

function cobrancaStatusBadge(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    ABERTA: { label: "Aberta", className: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
    PAGA: { label: "Paga", className: "bg-gym-teal/10 text-gym-teal border-gym-teal/20" },
    VENCIDA: { label: "Vencida", className: "bg-gym-danger/10 text-gym-danger border-gym-danger/20" },
    CANCELADA: { label: "Cancelada", className: "bg-muted/50 text-muted-foreground border-border/40" },
  };
  const config = map[status] ?? { label: status, className: "bg-muted text-muted-foreground border-border" };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap shadow-sm",
        config.className,
      )}
    >
      {config.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Detalhe da cobranca (PIX, boleto, link de pagamento, 2a via)
// ---------------------------------------------------------------------------

function CobrancaDetalheView({
  cobrancaId,
  onBack,
}: {
  cobrancaId: string;
  onBack: () => void;
}) {
  const { tenantId, tenantResolved } = useTenantContext();
  const { data: cobranca, isLoading } = useCobrancaDetalhe({
    id: cobrancaId,
    tenantId,
    tenantResolved,
  });
  const segundaVia = useSolicitarSegundaVia();
  const [copied, setCopied] = useState(false);
  const [segundaViaResult, setSegundaViaResult] = useState<{ link: string; tipo: string } | null>(null);

  const handleCopyPix = useCallback(async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback silencioso
    }
  }, []);

  const handleSegundaVia = useCallback(async () => {
    if (!tenantId) return;
    try {
      const res = await segundaVia.mutateAsync({ id: cobrancaId, tenantId });
      setSegundaViaResult(res);
      if (res.link) {
        window.open(res.link, "_blank", "noopener,noreferrer");
      }
    } catch {
      // silencioso
    }
  }, [cobrancaId, tenantId, segundaVia]);

  if (isLoading) {
    return (
      <div className="space-y-4 py-6">
        <div className="h-8 w-32 animate-pulse rounded-lg bg-primary/10" />
        <div className="h-64 animate-pulse rounded-2xl bg-muted/20 border border-border/40" />
      </div>
    );
  }

  if (!cobranca) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        Cobranca nao encontrada.
      </div>
    );
  }

  const isPendente = cobranca.status === "ABERTA" || cobranca.status === "VENCIDA" || cobranca.status === "PENDENTE";

  return (
    <div className="space-y-6 py-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex size-9 items-center justify-center rounded-xl border border-border/60 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-xl font-extrabold tracking-tight truncate">
            {cobranca.descricao}
          </h2>
          <div className="mt-1 flex items-center gap-2">
            {cobrancaStatusBadge(cobranca.status)}
            <span className="text-xs text-muted-foreground">{cobranca.formaPagamento}</span>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl border border-border/40 p-5 shadow-lg shadow-black/5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Valor</p>
            <p className="text-2xl font-display font-extrabold">{formatBRL(cobranca.valor)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Vencimento</p>
            <p className="text-sm font-bold">{formatDate(cobranca.vencimento)}</p>
          </div>
        </div>

        {/* Opcoes de pagamento */}
        {isPendente && (
          <div className="space-y-3 pt-2 border-t border-border/30">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Opcoes de pagamento</p>

            {cobranca.pixCopiaECola && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <QrCode className="size-4 text-primary" />
                  <span className="text-xs font-bold">PIX Copia e Cola</span>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 rounded-xl bg-muted/30 border border-border/40 px-3 py-2 text-xs font-mono break-all text-muted-foreground leading-relaxed line-clamp-2">
                    {cobranca.pixCopiaECola}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-10 rounded-xl border-border/60 shrink-0"
                    onClick={() => void handleCopyPix(cobranca.pixCopiaECola!)}
                  >
                    {copied ? <CheckCircle2 className="size-4 text-gym-teal" /> : <Copy className="size-4" />}
                  </Button>
                </div>
              </div>
            )}

            {cobranca.boletoUrl && (
              <Button
                variant="outline"
                className="w-full rounded-xl border-border/60 h-12 justify-between font-bold"
                onClick={() => window.open(cobranca.boletoUrl!, "_blank", "noopener,noreferrer")}
              >
                <span className="flex items-center gap-2">
                  <FileText className="size-4 text-primary" />
                  Ver boleto
                </span>
                <ExternalLink className="size-4 text-muted-foreground" />
              </Button>
            )}

            {cobranca.linkPagamento && (
              <Button
                variant="outline"
                className="w-full rounded-xl border-border/60 h-12 justify-between font-bold"
                onClick={() => window.open(cobranca.linkPagamento!, "_blank", "noopener,noreferrer")}
              >
                <span className="flex items-center gap-2">
                  <Link2 className="size-4 text-primary" />
                  Link de pagamento
                </span>
                <ExternalLink className="size-4 text-muted-foreground" />
              </Button>
            )}

            <Button
              onClick={() => void handleSegundaVia()}
              disabled={segundaVia.isPending}
              className="w-full rounded-xl bg-gym-accent text-[#0e0f11] font-bold hover:bg-gym-accent/90 shadow-lg shadow-gym-accent/20 h-12"
            >
              {segundaVia.isPending ? (
                <Loader2 className="size-4 animate-spin mr-2" />
              ) : (
                <Download className="size-4 mr-2" />
              )}
              Solicitar 2a via
            </Button>

            {segundaViaResult && (
              <div className="flex items-center gap-2 rounded-xl bg-gym-teal/[0.06] border border-gym-teal/20 px-4 py-2.5">
                <CheckCircle2 className="size-4 text-gym-teal shrink-0" />
                <p className="text-xs font-medium text-gym-teal">
                  2a via gerada ({segundaViaResult.tipo})
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Componente principal (lista pagamentos + cobrancas)
// ---------------------------------------------------------------------------

export function MeusPagamentosClient() {
  const { tenantId, userId, tenantResolved } = useTenantContext();
  const [filterStatus, setFilterStatus] = useState<string>("TODOS");
  const [selectedCobrancaId, setSelectedCobrancaId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"pagamentos" | "cobrancas">("cobrancas");

  const {
    data: pagamentos = [],
    isLoading: loading,
    isError
  } = useMeusPagamentos({
    tenantId,
    tenantResolved,
    userId
  });

  const {
    data: cobrancas = [],
    isLoading: cobrancasLoading,
  } = useMinhasCobrancas({
    tenantId,
    tenantResolved,
  });

  const summary = useMemo(() => {
    return pagamentos.reduce((acc, p) => {
      if (p.status === "PAGO") acc.totalPago += p.valorFinal;
      if (p.status === "PENDENTE") acc.totalPendente += p.valorFinal;
      if (p.status === "VENCIDO") acc.totalVencido += p.valorFinal;
      return acc;
    }, { totalPago: 0, totalPendente: 0, totalVencido: 0 });
  }, [pagamentos]);

  const filteredPagamentos = useMemo(() => {
    if (filterStatus === "TODOS") return pagamentos;
    return pagamentos.filter(p => p.status === filterStatus);
  }, [pagamentos, filterStatus]);

  // Se ha detalhe de cobranca selecionado
  if (selectedCobrancaId) {
    return (
      <CobrancaDetalheView
        cobrancaId={selectedCobrancaId}
        onBack={() => setSelectedCobrancaId(null)}
      />
    );
  }

  if (loading || cobrancasLoading) {
    return (
      <div className="space-y-8 py-6">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-primary/10" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted/20 border border-border/40" />
          ))}
        </div>
        <div className="h-96 animate-pulse rounded-3xl bg-muted/20 border border-border/40" />
      </div>
    );
  }

  return (
    <div className="space-y-8 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
              <CreditCard className="size-5 text-primary" />
            </div>
            <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5">Financeiro</Badge>
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Meus Pagamentos</h1>
          <p className="mt-1 text-muted-foreground font-medium">Cobrancas, mensalidades e faturas.</p>
        </motion.div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl border border-border/40 p-5 flex items-center justify-between shadow-lg shadow-black/5"
        >
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Total Pago</p>
            <p className="text-xl font-display font-extrabold text-gym-teal">{formatBRL(summary.totalPago)}</p>
          </div>
          <div className="size-12 rounded-xl bg-gym-teal/10 flex items-center justify-center text-gym-teal">
            <CheckCircle2 size={24} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl border border-border/40 p-5 flex items-center justify-between shadow-lg shadow-black/5"
        >
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Pendente</p>
            <p className="text-xl font-display font-extrabold text-amber-500">{formatBRL(summary.totalPendente)}</p>
          </div>
          <div className="size-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
            <TrendingUp size={24} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl border border-border/40 p-5 flex items-center justify-between shadow-lg shadow-black/5"
        >
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Vencido</p>
            <p className="text-xl font-display font-extrabold text-gym-danger">{formatBRL(summary.totalVencido)}</p>
          </div>
          <div className="size-12 rounded-xl bg-gym-danger/10 flex items-center justify-center text-gym-danger">
            <AlertTriangle size={24} />
          </div>
        </motion.div>
      </div>

      {/* View mode toggle: Cobrancas / Historico */}
      <div className="flex gap-2">
        <button
          onClick={() => setViewMode("cobrancas")}
          className={cn(
            "flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border uppercase tracking-wider",
            viewMode === "cobrancas"
              ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
              : "bg-muted/30 text-muted-foreground border-border/40 hover:bg-muted/50 hover:text-foreground"
          )}
        >
          Cobrancas
        </button>
        <button
          onClick={() => setViewMode("pagamentos")}
          className={cn(
            "flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border uppercase tracking-wider",
            viewMode === "pagamentos"
              ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
              : "bg-muted/30 text-muted-foreground border-border/40 hover:bg-muted/50 hover:text-foreground"
          )}
        >
          Historico
        </button>
      </div>

      {/* Cobrancas List */}
      {viewMode === "cobrancas" && (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {cobrancas.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed border-border/60 p-12 text-center bg-card/30">
                <p className="text-sm font-medium text-muted-foreground">Nenhuma cobranca encontrada.</p>
              </div>
            ) : (
              cobrancas.map((c, i) => (
                <motion.button
                  key={c.id}
                  type="button"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedCobrancaId(c.id)}
                  className={cn(
                    "w-full text-left glass-card group rounded-2xl border border-border/40 p-5 transition-all hover:shadow-xl hover:shadow-primary/5",
                    (c.status === "VENCIDA" || c.status === "VENCIDO") && "border-gym-danger/30 bg-gym-danger/[0.02]"
                  )}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={cn(
                        "size-12 rounded-2xl flex items-center justify-center shrink-0",
                        (c.status === "PAGA" || c.status === "PAGO") ? "bg-gym-teal/10 text-gym-teal" :
                        (c.status === "VENCIDA" || c.status === "VENCIDO") ? "bg-gym-danger/10 text-gym-danger" :
                        "bg-amber-500/10 text-amber-500"
                      )}>
                        <DollarSign size={24} />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <h3 className="font-bold text-base tracking-tight truncate">
                          {c.descricao}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} className="text-primary/60" />
                            Vence em {formatDate(c.vencimento)}
                          </span>
                          <span className="text-muted-foreground/40">{c.formaPagamento}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-display font-extrabold">{formatBRL(c.valor)}</p>
                      {cobrancaStatusBadge(c.status)}
                    </div>
                  </div>
                </motion.button>
              ))
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Pagamentos (historico) */}
      {viewMode === "pagamentos" && (
        <>
          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {(["TODOS", "PAGO", "PENDENTE", "VENCIDO"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={cn(
                  "whitespace-nowrap px-6 py-2 rounded-xl text-xs font-bold transition-all border uppercase tracking-wider",
                  filterStatus === s
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                    : "bg-muted/30 text-muted-foreground border-border/40 hover:bg-muted/50 hover:text-foreground"
                )}
              >
                {s}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredPagamentos.length === 0 ? (
                <div className="rounded-3xl border-2 border-dashed border-border/60 p-12 text-center bg-card/30">
                  <p className="text-sm font-medium text-muted-foreground">Nenhum pagamento encontrado com este filtro.</p>
                </div>
              ) : (
                filteredPagamentos.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={cn(
                      "glass-card group rounded-2xl border border-border/40 p-5 transition-all hover:shadow-xl hover:shadow-primary/5",
                      p.status === "VENCIDO" && "border-gym-danger/30 bg-gym-danger/[0.02]"
                    )}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "size-12 rounded-2xl flex items-center justify-center shrink-0",
                          (p.status === "PAGO") ? "bg-gym-teal/10 text-gym-teal" :
                          p.status === "VENCIDO" ? "bg-gym-danger/10 text-gym-danger" : "bg-amber-500/10 text-amber-500"
                        )}>
                          <DollarSign size={24} />
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-bold text-base tracking-tight">
                            {p.descricao || "Mensalidade / Plano"}
                          </h3>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                            <span className="flex items-center gap-1">
                              <Calendar size={14} className="text-primary/60" />
                              Vence em {formatDate(p.dataVencimento)}
                            </span>
                            {p.dataPagamento && (
                              <span className="flex items-center gap-1">
                                <CheckCircle2 size={14} className="text-gym-teal" />
                                Pago em {formatDate(p.dataPagamento)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-6">
                        <div className="text-right">
                          <p className="text-lg font-display font-extrabold">{formatBRL(p.valorFinal)}</p>
                          <StatusBadge status={p.status} />
                        </div>

                        <div className="flex gap-2">
                          {p.nfseEmitida && (
                            <Button variant="outline" size="icon" className="size-10 rounded-xl border-border/60 hover:bg-primary/10 hover:text-primary" title="Baixar Nota Fiscal" aria-label="Baixar Nota Fiscal">
                              <FileText size={18} />
                            </Button>
                          )}
                          {(p.status === "PENDENTE" || p.status === "VENCIDO") && (
                            <Button variant="outline" size="icon" className="size-10 rounded-xl border-border/60 hover:bg-primary/10 hover:text-primary" title="Gerar 2a Via" aria-label="Gerar 2a Via do boleto">
                              <Download size={18} />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </>
      )}

      <div className="glass-card rounded-2xl border border-border/40 p-5 flex items-start gap-4 bg-primary/5">
        <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
          <Info size={20} />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold tracking-tight text-foreground">Ajuda Financeira</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Duvidas sobre seus pagamentos ou deseja alterar sua forma de cobranca? Entre em contato com o financeiro da sua unidade pelo WhatsApp ou recepcao.
          </p>
        </div>
      </div>
    </div>
  );
}
