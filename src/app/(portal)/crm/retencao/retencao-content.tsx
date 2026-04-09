"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  ListTodo,
  PlayCircle,
  ShieldAlert,
  TrendingUp,
  UserPlus,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import type { DashboardRetencao } from "@/lib/api/crm";
import { getCrmDashboardRetencaoApi } from "@/lib/api/crm";
import { BiMetricCard } from "@/components/shared/bi-metric-card";
import { ListErrorState } from "@/components/shared/list-states";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

export function RetencaoContent({
  initialData,
}: {
  initialData: DashboardRetencao | null;
}) {
  const tenantContext = useTenantContext();
  const [data, setData] = useState<DashboardRetencao | null>(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData || !tenantContext.tenantId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await getCrmDashboardRetencaoApi({
          tenantId: tenantContext.tenantId!,
        });
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) setError(normalizeErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [initialData, tenantContext.tenantId]);

  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground animate-pulse">
        Carregando dashboard de retenção...
      </div>
    );
  }

  if (error) {
    return <ListErrorState error={error} />;
  }

  if (!data) {
    return (
      <div className="text-sm text-muted-foreground">
        Sem dados disponíveis para o dashboard de retenção.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-4xl font-extrabold tracking-tight">
          Retenção
        </h1>
        <p className="mt-2 text-muted-foreground text-lg">
          Indicadores de retenção, engajamento e saúde do CRM.
        </p>
      </div>

      {/* Row 1: 4 metric cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="grid grid-cols-1 gap-4 lg:grid-cols-4"
      >
        <BiMetricCard
          label="Leads em aberto"
          value={String(data.leadsEmAberto)}
          description="prospects ativos no funil"
          icon={UserPlus}
          tone="accent"
        />
        <BiMetricCard
          label="Conversões (30d)"
          value={String(data.conversoes30Dias)}
          description="prospects convertidos no mês"
          icon={TrendingUp}
          tone="teal"
        />
        <BiMetricCard
          label="Matrículas vencendo (7d)"
          value={String(data.matriculasVencendo7Dias)}
          description="contratos a renovar em breve"
          icon={CalendarCheck}
          tone="warning"
        />
        <BiMetricCard
          label="Inadimplentes"
          value={String(data.alunosInadimplentes)}
          description="alunos com pagamento em atraso"
          icon={ShieldAlert}
          tone="danger"
        />
      </motion.div>

      {/* Row 2: 3 metric cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.05 }}
        className="grid grid-cols-1 gap-4 lg:grid-cols-3"
      >
        <BiMetricCard
          label="Tarefas pendentes"
          value={String(data.tarefasPendentes)}
          description="aguardando execução"
          icon={ListTodo}
          tone="warning"
        />
        <BiMetricCard
          label="Tarefas atrasadas"
          value={String(data.tarefasAtrasadas)}
          description="vencidas sem conclusão"
          icon={AlertTriangle}
          tone="danger"
        />
        <BiMetricCard
          label="Eventos (30d)"
          value={String(data.eventos30Dias)}
          description="interações registradas no período"
          icon={CheckCircle2}
          tone="teal"
        />
      </motion.div>

      {/* Row 3: 2 info cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.1 }}
        className="grid grid-cols-1 gap-4 lg:grid-cols-2"
      >
        <div className="glass-card group relative overflow-hidden rounded-2xl border p-6 transition-all hover:shadow-xl hover:shadow-primary/5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gym-accent/20 bg-gym-accent/10 text-gym-accent transition-transform group-hover:scale-110">
              <Zap size={24} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground/70">
                Automações ativas
              </p>
              <h3 className="font-display text-3xl font-extrabold tracking-tight">
                {data.automacoesAtivas}
              </h3>
              <p className="text-[11px] font-medium text-muted-foreground/60">
                fluxos automáticos em execução
              </p>
            </div>
          </div>
        </div>

        <div className="glass-card group relative overflow-hidden rounded-2xl border p-6 transition-all hover:shadow-xl hover:shadow-primary/5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gym-teal/20 bg-gym-teal/10 text-gym-teal transition-transform group-hover:scale-110">
              <ClipboardList size={24} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground/70">
                Playbooks ativos
              </p>
              <h3 className="font-display text-3xl font-extrabold tracking-tight">
                {data.playbooksAtivos}
              </h3>
              <p className="text-[11px] font-medium text-muted-foreground/60">
                roteiros de atendimento em uso
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
