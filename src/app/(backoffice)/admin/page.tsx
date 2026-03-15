"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { listGlobalAcademias, listGlobalUnidades } from "@/lib/backoffice/admin";
import { getGlobalSecurityOverview } from "@/lib/backoffice/seguranca";
import type { Academia, Tenant } from "@/lib/types";
import Link from "next/link";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

export default function AdminHomePage() {
  const [loading, setLoading] = useState(true);
  const [academias, setAcademias] = useState<Academia[]>([]);
  const [unidades, setUnidades] = useState<Tenant[]>([]);
  const [seguranca, setSeguranca] = useState({
    totalUsers: 0,
    eligibleForNewUnits: 0,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        setError(null);
        const [acs, uns, segurancaOverview] = await Promise.all([
          listGlobalAcademias(),
          listGlobalUnidades(),
          getGlobalSecurityOverview(),
        ]);
        if (!mounted) return;
        setAcademias(acs);
        setUnidades(uns);
        setSeguranca({
          totalUsers: segurancaOverview.totalUsers,
          eligibleForNewUnits: segurancaOverview.eligibleForNewUnits,
        });
      } catch (loadError) {
        if (!mounted) return;
        setError(normalizeErrorMessage(loadError));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(
    () => ({
      totalAcademias: academias.length,
      totalUnidades: unidades.length,
      totalAdmins: seguranca.totalUsers,
      elegiveisNovasUnidades: seguranca.eligibleForNewUnits,
    }),
    [academias.length, seguranca.eligibleForNewUnits, seguranca.totalUsers, unidades.length]
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-gym-accent">Administração</p>
        <h1 className="text-3xl font-display font-bold leading-tight">Dashboard do backoffice</h1>
        <p className="text-sm text-muted-foreground">
          Visão geral e atalhos para gestão de academias, unidades, segurança global e integrações.
        </p>
      </header>

      {error ? (
        <div className="rounded-xl border border-gym-danger/30 bg-gym-danger/10 px-4 py-3 text-sm text-gym-danger">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Academias</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-display font-bold">{loading ? "…" : stats.totalAcademias}</p>
              <p className="text-sm text-muted-foreground">Total cadastrado</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Unidades (tenants)</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-display font-bold">{loading ? "…" : stats.totalUnidades}</p>
              <p className="text-sm text-muted-foreground">Clientes únicos por unidade</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Segurança global</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-display font-bold">{loading ? "…" : stats.totalAdmins}</p>
              <p className="text-sm text-muted-foreground">
                {loading ? "…" : `${stats.elegiveisNovasUnidades} elegíveis para novas unidades`}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Academias</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-display font-bold">{loading ? "…" : stats.totalAcademias}</p>
              <p className="text-sm text-muted-foreground">Total cadastradas</p>
            </div>
            <Link href="/admin/academias">
              <Button variant="outline" size="sm">Gerir</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Unidades (tenants)</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-display font-bold">{loading ? "…" : stats.totalUnidades}</p>
              <p className="text-sm text-muted-foreground">Clientes únicos</p>
            </div>
            <Link href="/admin/unidades">
              <Button variant="outline" size="sm">Gerir</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Segurança global</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-display font-bold">{loading ? "…" : stats.totalAdmins}</p>
              <p className="text-sm text-muted-foreground">Usuários administrativos</p>
            </div>
            <Link href="/admin/seguranca">
              <Button variant="outline" size="sm">Abrir</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Importação EVO</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-display font-bold">EVO</p>
              <p className="text-sm text-muted-foreground">Acompanhar jobs e onboarding</p>
            </div>
            <Link href="/admin/importacao-evo">
              <Button variant="outline" size="sm">Abrir</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Atalhos rápidos</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Link href="/admin/academias"><Button size="sm">Cadastrar academia</Button></Link>
          <Link href="/admin/unidades"><Button size="sm" variant="secondary">Cadastrar unidade</Button></Link>
          <Link href="/admin/seguranca"><Button size="sm" variant="outline">Segurança global</Button></Link>
          <Link href="/admin/importacao-evo"><Button size="sm" variant="outline">Importação EVO</Button></Link>
        </CardContent>
      </Card>
    </div>
  );
}
