"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Gift,
  Star,
  Trophy,
} from "lucide-react";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { formatDate } from "@/lib/formatters";
import { motion } from "framer-motion";
import type { RewardsWallet } from "@/lib/api/app-cliente";
import { getRewardsWalletApi } from "@/lib/api/app-cliente";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function RecompensasPage() {
  const { tenantId, tenantResolved } = useTenantContext();
  const [wallet, setWallet] = useState<RewardsWallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!tenantResolved || !tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getRewardsWalletApi({ tenantId });
      setWallet(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar recompensas.");
    } finally {
      setLoading(false);
    }
  }, [tenantId, tenantResolved]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-8 py-6">
      {/* Header */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
          <Trophy className="size-7 text-primary" />
        </div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Recompensas</h1>
      </div>

      {/* Error */}
      {error ? (
        <div className="rounded-2xl border border-gym-danger/30 bg-gym-danger/10 px-4 py-4 text-sm text-gym-danger flex items-center gap-3">
          <AlertTriangle className="size-5" />
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-4">
          <div className="h-32 animate-pulse rounded-2xl bg-muted/20 border border-border/40" />
          <div className="h-64 animate-pulse rounded-2xl bg-muted/20 border border-border/40" />
        </div>
      ) : wallet ? (
        <>
          {/* Saldo */}
          <motion.section
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-gym-accent/30 bg-gym-accent/5 p-6 text-center space-y-2"
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
              Saldo de Pontos
            </p>
            <p className="text-5xl font-display font-extrabold text-gym-accent">
              {wallet.saldoPontos.toLocaleString("pt-BR")}
            </p>
            <div className="flex items-center justify-center gap-6 pt-2">
              <div className="flex items-center gap-1.5 text-xs text-gym-teal font-bold">
                <ArrowDownLeft className="size-3.5" />
                +{wallet.totalCreditos.toLocaleString("pt-BR")} ganhos
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gym-danger font-bold">
                <ArrowUpRight className="size-3.5" />
                -{wallet.totalDebitos.toLocaleString("pt-BR")} usados
              </div>
            </div>
          </motion.section>

          {/* Opcoes de resgate */}
          {wallet.opcoesResgate && wallet.opcoesResgate.length > 0 ? (
            <section className="space-y-4">
              <h2 className="font-display text-xl font-bold tracking-tight px-1">
                <Gift className="inline mr-2 size-5 -mt-0.5" />
                Opcoes de Resgate
              </h2>
              <div className="space-y-3">
                {wallet.opcoesResgate.map((opcao) => (
                  <motion.div
                    key={opcao.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm p-4"
                  >
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gym-accent/10 text-gym-accent">
                      <Star className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-foreground">{opcao.descricao}</p>
                      <p className="text-xs text-muted-foreground">
                        {opcao.pontosNecessarios.toLocaleString("pt-BR")} pontos
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        wallet.saldoPontos >= opcao.pontosNecessarios
                          ? "bg-gym-teal/10 text-gym-teal border-gym-teal/20"
                          : "bg-muted/50 text-muted-foreground border-border/40"
                      }`}
                    >
                      {wallet.saldoPontos >= opcao.pontosNecessarios ? "Disponivel" : "Insuficiente"}
                    </span>
                  </motion.div>
                ))}
              </div>
            </section>
          ) : null}

          {/* Historico */}
          <section className="space-y-4">
            <h2 className="font-display text-xl font-bold tracking-tight px-1">Historico</h2>
            {wallet.historico.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed border-border/60 bg-card/30 px-4 py-12 text-center">
                <p className="text-sm font-medium text-muted-foreground">
                  Nenhum lancamento registrado.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {wallet.historico.map((h, i) => {
                  const isCredito = h.tipo === "CREDITO";
                  return (
                    <motion.div
                      key={`${h.data}-${i}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.04, 0.4) }}
                      className="flex items-center gap-4 rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm p-4"
                    >
                      <div
                        className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                          isCredito
                            ? "bg-gym-teal/10 text-gym-teal"
                            : "bg-gym-danger/10 text-gym-danger"
                        }`}
                      >
                        {isCredito ? (
                          <ArrowDownLeft className="size-5" />
                        ) : (
                          <ArrowUpRight className="size-5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-foreground">{h.motivo}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {formatDate(h.data)} &middot; Saldo: {h.saldoApos.toLocaleString("pt-BR")}
                        </p>
                      </div>
                      <p
                        className={`text-sm font-display font-extrabold shrink-0 ${
                          isCredito ? "text-gym-teal" : "text-gym-danger"
                        }`}
                      >
                        {isCredito ? "+" : "-"}{Math.abs(h.pontos).toLocaleString("pt-BR")}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
