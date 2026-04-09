"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  Clock,
  CreditCard,
  Dumbbell,
  QrCode,
  ScanLine,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { motion } from "framer-motion";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { useHomeSnapshot } from "@/lib/query/use-portal-aluno";
import { formatCurrency, formatDate } from "@/lib/formatters";

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function CardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl border border-border/40 bg-card/30 ${className}`}
    />
  );
}

// ---------------------------------------------------------------------------
// Quick Actions
// ---------------------------------------------------------------------------

const QUICK_ACTIONS: ReadonlyArray<{
  href: string;
  label: string;
  icon: typeof ScanLine;
  color: string;
  highlight?: boolean;
}> = [
  {
    href: "/check-in",
    label: "Check-in",
    icon: ScanLine,
    color: "bg-gym-accent/15 text-gym-accent",
    highlight: true,
  },
  {
    href: "/meus-treinos",
    label: "Treinos",
    icon: Dumbbell,
    color: "bg-blue-500/15 text-blue-400",
  },
  {
    href: "/minhas-aulas",
    label: "Aulas",
    icon: CalendarDays,
    color: "bg-purple-500/15 text-purple-400",
  },
  {
    href: "/meus-pagamentos",
    label: "Pagamentos",
    icon: Wallet,
    color: "bg-gym-teal/15 text-gym-teal",
  },
];

function QuickActions() {
  return (
    <div className="grid grid-cols-4 gap-3">
      {QUICK_ACTIONS.map((action, i) => {
        const Icon = action.icon;
        return (
          <motion.div
            key={action.href}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link
              href={action.href}
              className={`flex flex-col items-center gap-2 rounded-2xl border p-3 transition-colors ${
                action.highlight
                  ? "border-gym-accent/30 bg-gym-accent/5 hover:bg-gym-accent/10"
                  : "border-border/40 bg-card/40 hover:bg-card/80"
              }`}
            >
              <div
                className={`flex size-10 items-center justify-center rounded-xl ${action.color}`}
              >
                <Icon className="size-5" />
              </div>
              <span className="text-[11px] font-bold text-foreground">
                {action.label}
              </span>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Financial Summary Card
// ---------------------------------------------------------------------------

function FinancialSummaryCard({
  totalPendente,
  totalVencido,
  proximoVencimento,
}: {
  totalPendente: number;
  totalVencido: number;
  proximoVencimento: string | null;
}) {
  const hasIssue = totalVencido > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className={`rounded-2xl border p-4 space-y-3 ${
        hasIssue
          ? "border-gym-danger/30 bg-gym-danger/5"
          : "border-border/40 bg-card/40"
      }`}
    >
      <div className="flex items-center gap-2">
        <div
          className={`flex size-8 items-center justify-center rounded-lg ${
            hasIssue
              ? "bg-gym-danger/15 text-gym-danger"
              : "bg-gym-teal/15 text-gym-teal"
          }`}
        >
          {hasIssue ? (
            <AlertTriangle className="size-4" />
          ) : (
            <CreditCard className="size-4" />
          )}
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
          Financeiro
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
            Pendente
          </p>
          <p className="text-lg font-bold text-foreground">
            {formatCurrency(totalPendente)}
          </p>
        </div>
        {totalVencido > 0 ? (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gym-danger/80">
              Vencido
            </p>
            <p className="text-lg font-bold text-gym-danger">
              {formatCurrency(totalVencido)}
            </p>
          </div>
        ) : null}
      </div>

      {proximoVencimento ? (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="size-3" />
          Vence em {formatDate(proximoVencimento)}
        </p>
      ) : null}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Next Class Card
// ---------------------------------------------------------------------------

function NextClassCard({
  nome,
  horario,
  data,
}: {
  nome: string;
  horario: string;
  data: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-2xl border border-border/40 bg-card/40 p-4 space-y-2"
    >
      <div className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-purple-500/15 text-purple-400">
          <CalendarDays className="size-4" />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
          Proxima aula
        </span>
      </div>
      <p className="text-sm font-bold text-foreground">{nome}</p>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <CalendarDays className="size-3" />
          {formatDate(data)}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="size-3" />
          {horario}
        </span>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Active Workout Card
// ---------------------------------------------------------------------------

function ActiveWorkoutCard({
  nome,
  aderencia,
  ultimaExecucao,
}: {
  nome: string;
  aderencia: number | null;
  ultimaExecucao: string | null;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="rounded-2xl border border-border/40 bg-card/40 p-4 space-y-2"
    >
      <div className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400">
          <Dumbbell className="size-4" />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
          Treino ativo
        </span>
      </div>
      <p className="text-sm font-bold text-foreground">{nome}</p>
      <div className="flex items-center gap-3">
        {aderencia != null ? (
          <span className="flex items-center gap-1 text-xs font-bold text-gym-teal">
            <TrendingUp className="size-3" />
            {aderencia}% aderencia
          </span>
        ) : null}
        {ultimaExecucao ? (
          <span className="text-xs text-muted-foreground">
            Ultimo: {formatDate(ultimaExecucao)}
          </span>
        ) : null}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Check-in Stats Card
// ---------------------------------------------------------------------------

function CheckInStatsCard({
  totalMes,
  ultimoCheckin,
}: {
  totalMes: number;
  ultimoCheckin: string | null;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-2xl border border-border/40 bg-card/40 p-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-gym-accent/15 text-gym-accent">
            <Activity className="size-4" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
              Check-ins no mes
            </p>
            <p className="text-2xl font-bold text-foreground">{totalMes}</p>
          </div>
        </div>
        {ultimoCheckin ? (
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
              Ultimo
            </p>
            <p className="text-xs font-bold text-muted-foreground">
              {formatDate(ultimoCheckin)}
            </p>
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Carteirinha Quick Access
// ---------------------------------------------------------------------------

function CarteirinhaQuickAccess() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Link
        href="/carteirinha"
        className="flex items-center gap-3 rounded-2xl border border-gym-accent/20 bg-gym-accent/5 p-4 transition-colors hover:bg-gym-accent/10"
      >
        <div className="flex size-10 items-center justify-center rounded-xl bg-gym-accent/15 text-gym-accent">
          <QrCode className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">
            Carteirinha Digital
          </p>
          <p className="text-[11px] text-muted-foreground">
            Acesse sua identidade digital com QR Code
          </p>
        </div>
      </Link>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// HomeContent
// ---------------------------------------------------------------------------

export function HomeContent() {
  const { tenantId, displayName, tenantResolved } = useTenantContext();

  const {
    data: snapshot,
    isLoading,
    isError,
  } = useHomeSnapshot({ tenantId, tenantResolved });

  const firstName = useMemo(() => {
    if (!displayName) return "";
    return displayName.split(" ")[0];
  }, [displayName]);

  return (
    <div className="space-y-6 py-4">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-1"
      >
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground">
          Ola, {firstName || "Aluno"}!
        </h1>
        <p className="text-sm text-muted-foreground">
          Confira seu resumo de hoje.
        </p>
      </motion.div>

      {/* Carteirinha Quick Access */}
      <CarteirinhaQuickAccess />

      {/* Quick Actions */}
      <QuickActions />

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          <CardSkeleton className="h-32" />
          <CardSkeleton className="h-24" />
          <CardSkeleton className="h-24" />
          <CardSkeleton className="h-20" />
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-gym-danger/30 bg-gym-danger/10 px-4 py-4 text-sm text-gym-danger flex items-center gap-3">
          <AlertTriangle className="size-5 shrink-0" />
          Falha ao carregar resumo. Tente novamente mais tarde.
        </div>
      ) : snapshot ? (
        <div className="space-y-4">
          {/* Financial Summary */}
          <FinancialSummaryCard
            totalPendente={snapshot.financeiro.totalPendente}
            totalVencido={snapshot.financeiro.totalVencido}
            proximoVencimento={snapshot.financeiro.proximoVencimento}
          />

          {/* Next Class */}
          {snapshot.agenda.proximaAula ? (
            <NextClassCard
              nome={snapshot.agenda.proximaAula.nome}
              horario={snapshot.agenda.proximaAula.horario}
              data={snapshot.agenda.proximaAula.data}
            />
          ) : null}

          {/* Active Workout */}
          {snapshot.treino.treinoAtivoNome ? (
            <ActiveWorkoutCard
              nome={snapshot.treino.treinoAtivoNome}
              aderencia={snapshot.treino.aderenciaPercentual}
              ultimaExecucao={snapshot.treino.ultimaExecucao}
            />
          ) : null}

          {/* Check-in Stats */}
          <CheckInStatsCard
            totalMes={snapshot.checkin.totalMes}
            ultimoCheckin={snapshot.checkin.ultimoCheckin}
          />
        </div>
      ) : null}
    </div>
  );
}
