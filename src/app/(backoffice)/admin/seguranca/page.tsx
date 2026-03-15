"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SecurityEligibilityBadge } from "@/components/security/security-badges";
import { getGlobalSecurityOverview, listEligibleNewUnitAdminsPreview } from "@/lib/backoffice/seguranca";
import type { GlobalAdminUserSummary } from "@/lib/types";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

export default function AdminSegurancaPage() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState({
    totalUsers: 0,
    activeMemberships: 0,
    defaultUnitsConfigured: 0,
    eligibleForNewUnits: 0,
  });
  const [preview, setPreview] = useState<GlobalAdminUserSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        setError(null);
        const [overviewResponse, previewResponse] = await Promise.all([
          getGlobalSecurityOverview(),
          listEligibleNewUnitAdminsPreview({ size: 5 }),
        ]);
        if (!mounted) return;
        setOverview(overviewResponse);
        setPreview(previewResponse.items);
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
    <div className="flex flex-col gap-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-gym-accent">Admin &gt; Segurança</p>
        <h1 className="text-3xl font-display font-bold">Segurança global</h1>
        <p className="text-sm text-muted-foreground">
          Consolide usuários administrativos, memberships por unidade e a política de novas unidades em uma visão só.
        </p>
      </header>

      {error ? (
        <div className="rounded-xl border border-gym-danger/30 bg-gym-danger/10 px-4 py-3 text-sm text-gym-danger">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Usuários administrativos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-display font-bold">{loading ? "…" : overview.totalUsers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Memberships ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-display font-bold">{loading ? "…" : overview.activeMemberships}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Unidade padrão definida</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-display font-bold">{loading ? "…" : overview.defaultUnitsConfigured}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Novas unidades</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-display font-bold">{loading ? "…" : overview.eligibleForNewUnits}</p>
            <p className="mt-1 text-xs text-muted-foreground">Usuários com propagação automática</p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-base">Operação de acessos</CardTitle>
              <p className="text-sm text-muted-foreground">
                Use a lista global para filtrar por academia, unidade, perfil e abrir o detalhe consolidado do usuário.
              </p>
            </div>
            <Button asChild>
              <Link href="/admin/seguranca/usuarios">Abrir usuários</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Na página de detalhe você consegue:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>associar e remover acesso por unidade;</li>
              <li>definir unidade padrão;</li>
              <li>atribuir ou remover perfis administrativos por tenant;</li>
              <li>editar elegibilidade para novas unidades.</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">Elegíveis agora</CardTitle>
            <p className="text-sm text-muted-foreground">
              Usuários com política ativa para receber acesso automático em unidades novas.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {preview.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum usuário elegível no momento.</p>
            ) : (
              preview.map((user) => (
                <div key={user.id} className="rounded-lg border border-border px-3 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{user.fullName || user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <SecurityEligibilityBadge eligible={user.eligibleForNewUnits} />
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {user.defaultTenantName ? `Padrão: ${user.defaultTenantName}` : "Sem unidade padrão"}
                    </p>
                    <Link href={`/admin/seguranca/usuarios/${user.id}`} className="text-xs font-medium text-gym-accent">
                      Abrir
                    </Link>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
