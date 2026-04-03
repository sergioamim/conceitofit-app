"use client";

import Link from "next/link";
import { GlobalSecurityShell } from "@/backoffice/components/security/global-security-shell";
import { SecurityEligibilityBadge } from "@/components/security/security-badges";
import { SecurityEmptyState, SecuritySectionFeedback } from "@/components/security/security-feedback";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminSecurityOverview, useAdminSecurityEligiblePreview } from "@/backoffice/query";
import type { GlobalAdminSecurityOverview } from "@/lib/types";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

const EMPTY_OVERVIEW: GlobalAdminSecurityOverview = {
  totalUsers: 0,
  activeMemberships: 0,
  defaultUnitsConfigured: 0,
  eligibleForNewUnits: 0,
  broadAccessUsers: 0,
  expiringExceptions: 0,
  pendingReviews: 0,
  rolloutPercentage: 0,
  compatibilityModeUsers: 0,
};

export default function AdminSegurancaPage() {
  const overviewQuery = useAdminSecurityOverview();
  const previewQuery = useAdminSecurityEligiblePreview();

  const loading = overviewQuery.isLoading || previewQuery.isLoading;
  const overview: GlobalAdminSecurityOverview = overviewQuery.data
    ? { ...EMPTY_OVERVIEW, ...overviewQuery.data }
    : EMPTY_OVERVIEW;
  const preview = previewQuery.data?.items ?? [];
  const error = overviewQuery.error || previewQuery.error
    ? normalizeErrorMessage(overviewQuery.error ?? previewQuery.error)
    : null;

  return (
    <GlobalSecurityShell
      title="Segurança global"
      description="Acompanhe a saúde da governança de acesso, distribua a operação por pessoas e avance no rollout da nova arquitetura de segurança."
      highlight={
        <Card className="border-border/80 bg-gradient-to-r from-gym-accent/10 via-background to-background">
          <CardContent className="flex flex-col gap-3 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gym-accent">Rollout da nova segurança</p>
              <p className="text-sm text-muted-foreground">
                Acompanhe a migração da leitura técnica para a leitura de produto sem interromper o suporte fino.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-background px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Cobertura nova IA</p>
                <p className="text-2xl font-display font-bold">{loading ? "…" : `${overview.rolloutPercentage ?? 0}%`}</p>
              </div>
              <div className="rounded-2xl border border-border bg-background px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Compatibilidade transitória</p>
                <p className="text-2xl font-display font-bold">{loading ? "…" : overview.compatibilityModeUsers ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      }
    >
      <SecuritySectionFeedback loading={loading} error={error} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SummaryCard title="Pessoas com acesso administrativo" value={loading ? "…" : String(overview.totalUsers)} />
        <SummaryCard title="Acessos ativos por unidade" value={loading ? "…" : String(overview.activeMemberships)} />
        <SummaryCard title="Pessoas com unidade base definida" value={loading ? "…" : String(overview.defaultUnitsConfigured)} />
        <SummaryCard title="Política para novas unidades" value={loading ? "…" : String(overview.eligibleForNewUnits)} subtitle="Pessoas que propagam acesso automaticamente" />
        <SummaryCard title="Revisões pendentes" value={loading ? "…" : String(overview.pendingReviews ?? 0)} subtitle="Acessos que exigem recertificação" />
        <SummaryCard title="Exceções vencendo" value={loading ? "…" : String(overview.expiringExceptions ?? 0)} subtitle="Itens próximos do prazo final" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base">Leitura rápida da operação</CardTitle>
              <p className="text-sm text-muted-foreground">
                A nova segurança organiza a operação por pessoa, governa exceções em separado e deixa o RBAC técnico
                como camada de suporte.
              </p>
            </div>
            <Button asChild>
              <Link href="/admin/seguranca/usuarios">Abrir usuários e acessos</Link>
            </Button>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <HighlightCard
              title="Usuários e acessos"
              text="Entenda quem opera cada unidade, qual papel está ativo e onde há risco ou revisão vencida."
              href="/admin/seguranca/usuarios"
            />
            <HighlightCard
              title="Perfis padronizados"
              text="Use linguagem de negócio para explicar o papel esperado antes de entrar na base técnica."
              href="/admin/seguranca/perfis"
            />
            <HighlightCard
              title="Funcionalidades"
              text="Acompanhe as capacidades liberadas, criticidade e rollout sem depender de códigos internos."
              href="/admin/seguranca/funcionalidades"
            />
            <HighlightCard
              title="Revisões e auditoria"
              text="Priorize filas de revisão, exceções vencendo, acessos amplos e mudanças recentes."
              href="/admin/seguranca/revisoes"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">Política ativa para novas unidades</CardTitle>
            <p className="text-sm text-muted-foreground">
              Pessoas que hoje receberiam acesso automaticamente quando uma nova unidade entrar em operação.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {preview.length === 0 ? (
              <SecurityEmptyState text="Nenhuma pessoa está elegível para novas unidades no momento." />
            ) : (
              preview.map((user) => (
                <div key={user.id} className="rounded-2xl border border-border bg-background px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">{user.fullName || user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <SecurityEligibilityBadge eligible={user.eligibleForNewUnits} />
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">
                      {user.defaultTenantName ? `Base operacional: ${user.defaultTenantName}` : "Sem unidade base definida"}
                    </p>
                    <Link href={`/admin/seguranca/usuarios/${user.id}`} className="text-xs font-semibold text-gym-accent">
                      Abrir governança
                    </Link>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </GlobalSecurityShell>
  );
}

function SummaryCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="text-3xl font-display font-bold">{value}</p>
        {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
      </CardContent>
    </Card>
  );
}

function HighlightCard({
  title,
  text,
  href,
}: {
  title: string;
  text: string;
  href: string;
}) {
  return (
    <Link href={href} className="rounded-2xl border border-border bg-background px-4 py-4 transition-colors hover:border-gym-accent/30">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
    </Link>
  );
}
