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

export default function AdminSegurancaPerfisPage() {
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
      title="Perfis padronizados"
      description="Explique cada papel pela responsabilidade que ele cobre, mantendo a base técnica disponível só quando ela realmente for necessária."
      actions={
        <Button asChild variant="outline" className="border-border">
          <Link href="/seguranca/rbac">Abrir base técnica</Link>
        </Button>
      }
    >
      <SecuritySectionFeedback loading={loading} error={error} />

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">Como ler perfis na nova segurança</CardTitle>
            <p className="text-sm text-muted-foreground">
              A nova IA usa três perguntas antes da sigla técnica: para quem é o papel, em qual contexto ele opera e
              qual responsabilidade de negócio ele cobre.
            </p>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <PatternCard title="Papel base" text="O papel esperado para operar uma unidade ou área sem exceções temporárias." />
            <PatternCard title="Variação local" text="Ajuste específico para uma unidade ou academia que não deve virar padrão de rede." />
            <PatternCard title="Leitura técnica" text="Siglas, grants e códigos seguem acessíveis para auditoria e suporte fino." />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">Sinais de transição</CardTitle>
            <p className="text-sm text-muted-foreground">
              Enquanto a governança visual amadurece, a leitura técnica continua em paralelo.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <RolloutRow label="Cobertura da nova IA" value={`${overview.rolloutPercentage ?? 0}%`} />
            <RolloutRow label="Pessoas em compatibilidade" value={String(overview.compatibilityModeUsers ?? 0)} />
            <RolloutRow label="Acessos amplos mapeados" value={String(overview.broadAccessUsers ?? 0)} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-base">Handoff até a task 52</CardTitle>
          <p className="text-sm text-muted-foreground">
            Esta página já define a arquitetura e a linguagem. A matriz detalhada de permissões continua na trilha
            técnica enquanto a governança visual completa é concluída.
          </p>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Use esta página para alinhar conceito, rollout e naming com a operação.</p>
          <p>Use a base técnica quando precisar editar grants, versionar perfis ou investigar código de permissão.</p>
        </CardContent>
      </Card>
    </GlobalSecurityShell>
  );
}

function PatternCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background px-4 py-4">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function RolloutRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-display font-bold">{value}</p>
    </div>
  );
}

