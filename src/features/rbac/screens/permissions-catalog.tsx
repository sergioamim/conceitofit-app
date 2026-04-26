"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, KeyRound, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { listarCapacidades } from "@/lib/api/gestao-acessos";

import { listarPerfisContexto, papeisPorCapacidade } from "../api/client";

import type { Dominio } from "../api/types";
import { RoleChip } from "../components/role-chip";
import { useRbacHref } from "../context";

interface PermissionsCatalogProps {
  dominio: Dominio;
  tenantId?: string;
}

export function RbacPermissionsCatalog({
  dominio,
  tenantId,
}: PermissionsCatalogProps) {
  const href = useRbacHref();
  const [q, setQ] = useState("");
  const [grupo, setGrupo] = useState("");

  const enabled = dominio === "PLATAFORMA" || Boolean(tenantId);

  const capsQ = useQuery({
    queryKey: ["rbac", "caps-by-grupo", dominio],
    queryFn: () => listarCapacidades(dominio),
    staleTime: 60_000,
  });

  const perfisQ = useQuery({
    queryKey: ["rbac", "perfis", dominio, tenantId ?? null],
    queryFn: () => listarPerfisContexto(dominio, tenantId),
    enabled,
    staleTime: 60_000,
  });

  const papeisGrantQ = useQuery({
    queryKey: ["rbac", "papeis-por-cap", dominio, tenantId ?? null],
    queryFn: () => papeisPorCapacidade(dominio, tenantId),
    enabled,
    staleTime: 60_000,
  });

  const grupos = capsQ.data ?? {};
  const allCaps = useMemo(() => {
    const list: { grupo: string; cap: typeof grupos[string][number] }[] = [];
    Object.entries(grupos).forEach(([g, caps]) =>
      caps.forEach((c) => list.push({ grupo: g, cap: c })),
    );
    return list;
  }, [grupos]);

  const filtered = useMemo(
    () =>
      allCaps.filter(({ grupo: g, cap }) => {
        if (grupo && g !== grupo) return false;
        if (q) {
          const s = q.toLowerCase();
          return (
            cap.nome.toLowerCase().includes(s) ||
            cap.key.toLowerCase().includes(s)
          );
        }
        return true;
      }),
    [allCaps, grupo, q],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Gestão de Acesso / Permissões
          </p>
          <h1 className="text-2xl font-display font-bold mt-1">
            Catálogo de permissões
          </h1>
          <p className="text-sm text-muted-foreground">
            Todas as permissões granulares deste domínio. Use-as para compor papéis customizados.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={href("/papeis")}>
            <KeyRound className="mr-2 size-4" />
            Ver papéis
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou ID…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={grupo || "all"} onValueChange={(v) => setGrupo(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Todos os grupos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os grupos</SelectItem>
            {Object.keys(grupos).map((g) => (
              <SelectItem key={g} value={g}>
                {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {capsQ.isLoading && (
            <div className="space-y-2 p-5">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          )}
          {!capsQ.isLoading && filtered.length === 0 && (
            <div className="px-5 py-12 text-center text-sm text-muted-foreground">
              Nenhuma permissão encontrada.
            </div>
          )}
          {!capsQ.isLoading && filtered.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    <th className="px-5 py-3">Permissão</th>
                    <th className="px-5 py-3">Grupo</th>
                    <th className="px-5 py-3">Identificador</th>
                    <th className="px-5 py-3">Risco</th>
                    <th className="px-5 py-3">Papéis que concedem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map(({ grupo: g, cap }) => (
                    <tr key={cap.key} className="hover:bg-secondary/30">
                      <td className="px-5 py-3">
                        <p className="text-sm font-semibold">{cap.nome}</p>
                        {cap.descricao && (
                          <p className="text-xs text-muted-foreground">
                            {cap.descricao}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs">
                          {g}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-mono text-xs text-muted-foreground">
                          {cap.key}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {cap.critica ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-gym-danger/30 bg-gym-danger/10 px-2 py-0.5 text-[10px] font-bold text-gym-danger">
                            <AlertTriangle className="size-3" />
                            Crítica
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">comum</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {(() => {
                          const papeis = papeisGrantQ.data?.[cap.key] ?? [];
                          if (papeisGrantQ.isLoading) {
                            return <span className="text-xs text-muted-foreground/60">…</span>;
                          }
                          if (papeis.length === 0) {
                            return <span className="text-xs italic text-muted-foreground/60">nenhum</span>;
                          }
                          return (
                            <div className="flex flex-wrap gap-1">
                              {papeis.slice(0, 4).map((p) => (
                                <RoleChip key={p.id} nome={p.nome} cor={p.cor} size="sm" />
                              ))}
                              {papeis.length > 4 && (
                                <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                                  +{papeis.length - 4}
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {perfisQ.data && (
        <p className="text-xs text-muted-foreground">
          {perfisQ.data.length} papel(éis) configurado(s) usam este catálogo. Clique em "Ver papéis" para conferir quais permissões cada um concede.
        </p>
      )}
    </div>
  );
}
