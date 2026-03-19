"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { GlobalSecurityShell, formatSecurityDateTime } from "@/components/security/global-security-shell";
import { SecurityRiskBadge } from "@/components/security/security-badges";
import { SecurityEmptyState, SecuritySectionFeedback } from "@/components/security/security-feedback";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getGlobalSecurityOverview, getGlobalSecurityReviewBoard } from "@/lib/backoffice/seguranca";
import type { GlobalAdminReviewBoard, GlobalAdminReviewBoardItem, GlobalAdminSecurityOverview } from "@/lib/types";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

const EMPTY_BOARD: GlobalAdminReviewBoard = {
  pendingReviews: [],
  expiringExceptions: [],
  recentChanges: [],
  broadAccess: [],
  orphanProfiles: [],
};

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

export default function AdminSegurancaRevisoesPage() {
  const [board, setBoard] = useState<GlobalAdminReviewBoard>(EMPTY_BOARD);
  const [overview, setOverview] = useState<GlobalAdminSecurityOverview>(EMPTY_OVERVIEW);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        setError(null);
        const [boardResponse, overviewResponse] = await Promise.all([
          getGlobalSecurityReviewBoard(),
          getGlobalSecurityOverview(),
        ]);
        if (!mounted) return;
        setBoard(boardResponse);
        setOverview({ ...EMPTY_OVERVIEW, ...overviewResponse });
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

  const tabs = useMemo(
    () => [
      { value: "revisoes", label: "Revisões pendentes", items: board.pendingReviews },
      { value: "excecoes", label: "Exceções vencendo", items: board.expiringExceptions },
      { value: "mudancas", label: "Mudanças recentes", items: board.recentChanges },
      { value: "amplo", label: "Acessos amplos", items: board.broadAccess },
      { value: "orfos", label: "Perfis sem dono", items: board.orphanProfiles },
    ],
    [board]
  );

  return (
    <GlobalSecurityShell
      title="Revisões e auditoria"
      description="Priorize o que precisa de recertificação, o que está perto de expirar e o que ampliou alcance além do esperado."
      actions={
        <Button asChild variant="outline" className="border-border">
          <Link href="/admin/seguranca/usuarios">Abrir usuários e acessos</Link>
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard title="Revisões pendentes" value={loading ? "…" : String(overview.pendingReviews ?? 0)} />
        <SummaryCard title="Exceções vencendo" value={loading ? "…" : String(overview.expiringExceptions ?? 0)} />
        <SummaryCard title="Acessos amplos" value={loading ? "…" : String(overview.broadAccessUsers ?? 0)} />
      </div>

      <SecuritySectionFeedback loading={loading} error={error} />

      <Tabs defaultValue="revisoes" className="space-y-4">
        <TabsList className="flex h-auto flex-wrap justify-start gap-2 bg-transparent p-0">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-base">{tab.label}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Itens ordenados para apoiar recertificação, follow-up e saneamento do rollout.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {tab.items.length === 0 ? (
                  <SecurityEmptyState text={`Nenhum item em "${tab.label}" no momento.`} />
                ) : (
                  tab.items.map((item) => <ReviewBoardItemCard key={`${tab.value}-${item.id}`} item={item} />)
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </GlobalSecurityShell>
  );
}

function SummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-display font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function ReviewBoardItemCard({ item }: { item: GlobalAdminReviewBoardItem }) {
  return (
    <div className="rounded-2xl border border-border bg-background px-4 py-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold">{item.title}</p>
            <SecurityRiskBadge level={item.severity} />
          </div>
          <p className="text-sm text-muted-foreground">{item.description || "Sem descrição adicional."}</p>
          <p className="text-xs text-muted-foreground">
            {item.userName}
            {item.dueAt ? ` · prazo ${formatSecurityDateTime(item.dueAt)}` : ""}
          </p>
        </div>
        {item.userId ? (
          <Button asChild size="sm" variant="outline" className="border-border">
            <Link href={`/admin/seguranca/usuarios/${item.userId}`}>Abrir pessoa</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}

