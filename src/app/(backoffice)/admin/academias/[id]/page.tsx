"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { listAcademias, listTenantsGlobal } from "@/lib/mock/services";
import type { Academia, Tenant } from "@/lib/types";

export default function AcademiaDetalhePage() {
  const params = useParams();
  const id = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [academia, setAcademia] = useState<Academia | null>(null);
  const [unidades, setUnidades] = useState<Tenant[]>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const [acs, uns] = await Promise.all([listAcademias(), listTenantsGlobal()]);
        if (!mounted) return;
        setAcademia(acs.find((a) => a.id === id) ?? null);
        setUnidades(uns);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  const unidadesDaAcademia = useMemo(
    () => unidades.filter((u) => (u.academiaId ?? u.groupId) === id),
    [unidades, id]
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-1">
        <p className="text-sm font-medium text-gym-accent">Admin &gt; Academias</p>
        <h1 className="text-3xl font-display font-bold">
          {academia?.nome ?? "Academia"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {loading ? "Carregando..." : academia?.documento || "Sem documento cadastrado"}
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados da academia</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span>Nome</span>
            <span className="text-foreground font-semibold">{academia?.nome ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span>Documento</span>
            <span className="text-foreground">{academia?.documento ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span>Status</span>
            <span className="text-foreground">{academia?.ativo === false ? "Inativa" : "Ativa"}</span>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Unidades desta academia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading && <p className="text-sm text-muted-foreground">Carregando...</p>}
          {!loading && unidadesDaAcademia.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma unidade vinculada.</p>
          )}
          {!loading &&
            unidadesDaAcademia.map((u) => (
              <div key={u.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                <div>
                  <p className="font-semibold">{u.nome}</p>
                  <p className="text-xs text-muted-foreground">{u.subdomain ?? u.id}</p>
                </div>
                <span className="text-xs text-muted-foreground">{u.ativo === false ? "Inativa" : "Ativa"}</span>
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
