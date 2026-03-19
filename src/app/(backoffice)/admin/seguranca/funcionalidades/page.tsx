"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GlobalSecurityShell } from "@/components/security/global-security-shell";
import { SecuritySectionFeedback } from "@/components/security/security-feedback";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getGlobalSecurityOverview } from "@/lib/backoffice/seguranca";
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

export default function AdminSegurancaFuncionalidadesPage() {
  const [overview, setOverview] = useState<GlobalAdminSecurityOverview>(EMPTY_OVERVIEW);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const response = await getGlobalSecurityOverview();
        if (!mounted) return;
        setOverview({ ...EMPTY_OVERVIEW, ...response });
      } catch (loadError) {
        if (!mounted) return;
        setError(normalizeErrorMessage(loadError));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <GlobalSecurityShell
      title="Funcionalidades"
      description="Troque a leitura crua de feature e grant por capacidades de negócio, criticidade e rollout controlado."
      actions={
        <Button asChild variant="outline" className="border-border">
          <Link href="/seguranca/rbac">Abrir configuração técnica</Link>
        </Button>
      }
    >
      <SecuritySectionFeedback loading={loading} error={error} />

      <div className="grid gap-4 md:grid-cols-3">
        <CapabilityCard title="Capacidade habilitada" text="O que a pessoa pode fazer no produto, em linguagem que a operação entende." />
        <CapabilityCard title="Criticidade" text="Quão sensível é liberar ou ampliar uma capacidade para uma pessoa ou perfil." />
        <CapabilityCard title="Rollout" text="Percentual da funcionalidade exposto e quem ainda depende de compatibilidade transitória." />
      </div>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-base">Indicadores de rollout</CardTitle>
          <p className="text-sm text-muted-foreground">
            A nova camada de produto já acompanha a transição, mesmo antes da matriz visual completa.
          </p>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <RolloutCard label="Cobertura da nova leitura" value={`${overview.rolloutPercentage ?? 0}%`} />
          <RolloutCard label="Pessoas em modo transitório" value={String(overview.compatibilityModeUsers ?? 0)} />
          <RolloutCard label="Acessos amplos identificados" value={String(overview.broadAccessUsers ?? 0)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-base">Handoff até a task 52</CardTitle>
          <p className="text-sm text-muted-foreground">
            A taxonomia de produto já está pronta. A edição visual da matriz e o catálogo pesquisável continuam na trilha seguinte.
          </p>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Priorize a leitura por impacto de negócio ao explicar uma liberação.</p>
          <p>Caia para a base técnica apenas quando precisar alterar o grant em si.</p>
        </CardContent>
      </Card>
    </GlobalSecurityShell>
  );
}

function CapabilityCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background px-4 py-4">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function RolloutCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background px-4 py-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-display font-bold">{value}</p>
    </div>
  );
}

