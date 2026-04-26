"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  History,
  KeyRound,
  Send,
  UserPlus,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { getStats } from "../api/client";
import type { AtividadeRecente, Dominio, StatsResponse } from "../api/types";
import { AvatarIniciais } from "../components/avatar-iniciais";
import { useRbacHref } from "../context";

interface OverviewProps {
  dominio: Dominio;
  tenantId?: string;
}

export function RbacOverview({ dominio, tenantId }: OverviewProps) {
  const href = useRbacHref();
  const enabled = dominio === "PLATAFORMA" || Boolean(tenantId);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["rbac", "stats", dominio, tenantId ?? null],
    queryFn: () => getStats({ dominio, tenantId }),
    enabled,
    staleTime: 30_000,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {dominio === "ACADEMIA" ? "Administração / Gestão de Acesso" : "Plataforma / Gestão de Acesso"}
          </p>
          <h1 className="text-2xl font-display font-bold mt-1">Gestão de Acesso</h1>
          <p className="text-sm text-muted-foreground">
            {dominio === "ACADEMIA"
              ? "RBAC da rede — usuários, papéis e auditoria."
              : "RBAC da plataforma — staff SaaS, papéis e auditoria."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={href("/auditoria")}>
              <History className="mr-2 size-4" />
              Auditoria
            </Link>
          </Button>
          <Button asChild>
            <Link href={href("/usuarios/convidar")}>
              <UserPlus className="mr-2 size-4" />
              Convidar usuário
            </Link>
          </Button>
        </div>
      </div>

      {isError && (
        <Card>
          <CardContent className="px-5 py-5 text-sm text-gym-danger">
            Falha ao carregar estatísticas: {(error as Error).message}
          </CardContent>
        </Card>
      )}

      <StatsGrid data={data} loading={isLoading} />

      <div className="grid gap-4 lg:grid-cols-2">
        <DistribuicaoCard data={data} loading={isLoading} />
        <AtividadeCard data={data?.atividadeRecente} loading={isLoading} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 4 KPI cards
// ---------------------------------------------------------------------------

interface StatProps {
  label: string;
  value: string | number;
  delta?: string;
  deltaTone?: "neutral" | "danger" | "primary";
  icon: React.ReactNode;
  iconTone?: "primary" | "warning" | "danger";
  loading?: boolean;
}

function StatCard({ label, value, delta, deltaTone = "neutral", icon, iconTone = "primary", loading }: StatProps) {
  const iconBg = {
    primary: "bg-gym-accent/15 text-gym-accent",
    warning: "bg-amber-500/15 text-amber-500",
    danger: "bg-gym-danger/15 text-gym-danger",
  }[iconTone];

  const deltaColor = {
    neutral: "text-muted-foreground",
    danger: "text-gym-danger",
    primary: "text-gym-accent",
  }[deltaTone];

  return (
    <Card>
      <CardContent className="p-5">
        <div className={cn("inline-flex size-9 items-center justify-center rounded-xl", iconBg)}>
          {icon}
        </div>
        <p className="mt-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <div className="mt-1 text-2xl font-bold">
          {loading ? <Skeleton className="h-7 w-16" /> : value}
        </div>
        {delta && !loading && (
          <p className={cn("mt-1 text-xs font-medium", deltaColor)}>{delta}</p>
        )}
      </CardContent>
    </Card>
  );
}

function StatsGrid({ data, loading }: { data: StatsResponse | undefined; loading: boolean }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Usuários ativos"
        value={data?.usuariosAtivos ?? 0}
        delta={data && data.usuariosAtivosDelta7d > 0 ? `+${data.usuariosAtivosDelta7d} esta semana` : "sem novos"}
        icon={<Users className="size-4" />}
        loading={loading}
      />
      <StatCard
        label="Convites pendentes"
        value={data?.convitesPendentes ?? 0}
        delta={
          data && data.convitesExpiramEm48h > 0
            ? `${data.convitesExpiramEm48h} expiram em <48h`
            : undefined
        }
        icon={<Send className="size-4" />}
        iconTone="warning"
        loading={loading}
      />
      <StatCard
        label="Papéis configurados"
        value={data?.papeisConfigurados ?? 0}
        delta={data ? `${data.papeisCustom} customizados` : undefined}
        icon={<KeyRound className="size-4" />}
        loading={loading}
      />
      <StatCard
        label="Permissões críticas"
        value={data?.capacidadesCriticas ?? 0}
        delta={data && data.capacidadesCriticas > 0 ? "ações sensíveis" : undefined}
        icon={<AlertTriangle className="size-4" />}
        iconTone="danger"
        loading={loading}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Distribuição por papel
// ---------------------------------------------------------------------------

function DistribuicaoCard({ data, loading }: { data: StatsResponse | undefined; loading: boolean }) {
  const href = useRbacHref();
  const totalUsuarios = data
    ? data.distribuicaoPorPapel.reduce((sum, p) => sum + p.usuarios, 0)
    : 0;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="text-base">Distribuição por papel</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            {totalUsuarios} usuário(s) com papel atribuído
          </p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href={href("/papeis")}>
            Ver papéis <ArrowRight className="ml-1 size-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && (
          <>
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </>
        )}
        {!loading && data?.distribuicaoPorPapel.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhum papel configurado ainda.
          </p>
        )}
        {!loading &&
          data?.distribuicaoPorPapel.map((p) => {
            const max = Math.max(1, ...data.distribuicaoPorPapel.map((x) => x.usuarios));
            const pct = (p.usuarios / max) * 100;
            const cor = p.papelCor ?? "var(--gym-accent)";
            return (
              <div key={p.papelId}>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ background: cor }}
                    />
                    <span className="text-sm font-semibold">{p.papelNome}</span>
                  </div>
                  <span className="text-sm font-mono text-muted-foreground">
                    {p.usuarios}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: cor }}
                  />
                </div>
              </div>
            );
          })}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Atividade recente
// ---------------------------------------------------------------------------

function AtividadeCard({
  data,
  loading,
}: {
  data: AtividadeRecente[] | undefined;
  loading: boolean;
}) {
  const href = useRbacHref();
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="text-base">Atividade recente</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Últimas mudanças sensíveis
          </p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href={href("/auditoria")}>
            Ver tudo <ArrowRight className="ml-1 size-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}
        {!loading && (data == null || data.length === 0) && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhuma atividade recente.
          </p>
        )}
        {!loading && data && data.length > 0 && (
          <ul className="divide-y divide-border">
            {data.map((ev) => (
              <AtividadeRow key={ev.id} ev={ev} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function AtividadeRow({ ev }: { ev: AtividadeRecente }) {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  return (
    <li className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
      <AvatarIniciais nome={ev.autorEmail} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          <span className="font-semibold">{ev.autorEmail}</span>{" "}
          <span className="text-muted-foreground">{ev.acao}</span>
          {ev.alvo && (
            <>
              {" "}
              <span className="font-mono text-xs">{ev.alvo}</span>
            </>
          )}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {hydrated ? formatRelative(ev.createdAt) : ""}
        </p>
      </div>
      {ev.critico && (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-gym-danger/30 bg-gym-danger/10 px-2 py-0.5 text-[10px] font-semibold text-gym-danger">
          <AlertTriangle className="size-3" />
          crítica
        </span>
      )}
    </li>
  );
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 60) return "agora";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} h`;
  if (diffSec < 86400 * 2) return "ontem";
  return `${Math.floor(diffSec / 86400)} dias`;
}
