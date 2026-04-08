"use client";

import { useMemo, useState } from "react";
import { 
  CreditCard, 
  Download, 
  FileText, 
  Filter, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle2,
  Calendar,
  DollarSign,
  ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { useMeusPagamentos } from "@/lib/query/use-portal-aluno";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Pagamento } from "@/lib/types";
import { formatBRL, formatDate } from "@/lib/formatters";
import { StatusBadge } from "@/components/shared/status-badge";

export function MeusPagamentosClient() {
  const { tenantId, userId, tenantResolved } = useTenantContext();
  const [filterStatus, setFilterStatus] = useState<string>("TODOS");

  const { 
    data: pagamentos = [], 
    isLoading: loading,
    isError 
  } = useMeusPagamentos({
    tenantId,
    tenantResolved,
    userId
  });

  const summary = useMemo(() => {
    return pagamentos.reduce((acc, p) => {
      if (p.status === "PAGO" || p.status === "PAGA") acc.totalPago += p.valorFinal;
      if (p.status === "PENDENTE") acc.totalPendente += p.valorFinal;
      if (p.status === "VENCIDO") acc.totalVencido += p.valorFinal;
      return acc;
    }, { totalPago: 0, totalPendente: 0, totalVencido: 0 });
  }, [pagamentos]);

  const filteredPagamentos = useMemo(() => {
    if (filterStatus === "TODOS") return pagamentos;
    return pagamentos.filter(p => p.status === filterStatus);
  }, [pagamentos, filterStatus]);

  if (loading) {
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
          <p className="mt-1 text-muted-foreground font-medium">Histórico de mensalidades e faturas.</p>
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
                      (p.status === "PAGO" || p.status === "PAGA") ? "bg-gym-teal/10 text-gym-teal" : 
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
                        <Button variant="outline" size="icon" className="size-10 rounded-xl border-border/60 hover:bg-primary/10 hover:text-primary" title="Baixar Nota Fiscal">
                          <FileText size={18} />
                        </Button>
                      )}
                      {(p.status === "PENDENTE" || p.status === "VENCIDO") && (
                        <Button variant="outline" size="icon" className="size-10 rounded-xl border-border/60 hover:bg-primary/10 hover:text-primary" title="Gerar 2ª Via">
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

      <div className="glass-card rounded-2xl border border-border/40 p-5 flex items-start gap-4 bg-primary/5">
        <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
          <Info size={20} />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold tracking-tight text-foreground">Ajuda Financeira</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Dúvidas sobre seus pagamentos ou deseja alterar sua forma de cobrança? Entre em contato com o financeiro da sua unidade pelo WhatsApp ou recepção.
          </p>
        </div>
      </div>
    </div>
  );
}
