"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueries, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { listarCapacidades, obterPerfil } from "@/lib/api/gestao-acessos";

import { listarPerfisContexto } from "../api/client";
import { cn } from "@/lib/utils";

import type { Dominio } from "../api/types";
import { useRbacHref } from "../context";

const MAX_COMPARE = 4;

interface RolesCompareProps {
  dominio: Dominio;
  tenantId?: string;
  /** IDs dos papéis sendo comparados (vem de query string `ids`). */
  ids: string[];
}

export function RbacRolesCompare({ dominio, tenantId, ids }: RolesCompareProps) {
  const router = useRouter();
  const href = useRbacHref();
  const [pickerOpen, setPickerOpen] = useState(false);

  const enabled = dominio === "PLATAFORMA" || Boolean(tenantId);

  const perfisDetalheQ = useQueries({
    queries: ids.slice(0, MAX_COMPARE).map((id) => ({
      queryKey: ["rbac", "perfil", id],
      queryFn: () => obterPerfil(id),
      enabled,
    })),
  });

  const capsQ = useQuery({
    queryKey: ["rbac", "caps-by-grupo", dominio],
    queryFn: () => listarCapacidades(dominio),
    staleTime: 60_000,
  });

  const allPapeisQ = useQuery({
    queryKey: ["rbac", "perfis", dominio, tenantId ?? null],
    queryFn: () => listarPerfisContexto(dominio, tenantId),
    enabled,
    staleTime: 60_000,
  });

  const papeis = useMemo(
    () =>
      perfisDetalheQ
        .map((q) => q.data)
        .filter((p): p is NonNullable<typeof p> => Boolean(p)),
    [perfisDetalheQ],
  );

  const isLoading =
    perfisDetalheQ.some((q) => q.isLoading) || capsQ.isLoading;

  function updateUrl(nextIds: string[]) {
    const url = new URL(window.location.href);
    if (nextIds.length === 0) url.searchParams.delete("ids");
    else url.searchParams.set("ids", nextIds.join(","));
    router.replace(url.pathname + url.search);
  }

  function removeRole(id: string) {
    updateUrl(ids.filter((x) => x !== id));
  }

  function addRole(id: string) {
    if (ids.includes(id) || ids.length >= MAX_COMPARE) return;
    updateUrl([...ids, id]);
    setPickerOpen(false);
  }

  // Conjuntos de capacidades por papel pra cell-toggle rápido
  const setsPorPapel = useMemo(
    () => papeis.map((p) => new Set<string>(p.capacidades)),
    [papeis],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button asChild variant="ghost" size="sm" className="h-auto p-0">
          <Link href={href("/papeis")}>
            <ArrowLeft className="mr-1 size-3" /> Papéis
          </Link>
        </Button>
        <span>/</span>
        <span>Comparar</span>
      </div>

      <div>
        <h1 className="text-2xl font-display font-bold">Comparador de papéis</h1>
        <p className="text-sm text-muted-foreground">
          Visualize as diferenças de permissões entre até {MAX_COMPARE} papéis.
        </p>
      </div>

      {ids.length === 0 ? (
        <Card>
          <CardContent className="px-5 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              Adicione papéis para começar a comparar.
            </p>
            <Button className="mt-4" onClick={() => setPickerOpen(true)}>
              <Plus className="mr-1 size-3" /> Adicionar papel
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            {/* Header com colunas dos papéis */}
            <div
              className="grid border-b border-border"
              style={{
                gridTemplateColumns: `minmax(220px, 1fr) repeat(${papeis.length}, minmax(160px, 1fr)) auto`,
              }}
            >
              <div className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Permissão
              </div>
              {papeis.map((p) => (
                <div
                  key={p.id}
                  className="flex items-start justify-between gap-2 border-l border-border p-4"
                  style={{
                    background: p.cor
                      ? `color-mix(in oklab, ${p.cor} 8%, transparent)`
                      : undefined,
                  }}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2 rounded-full"
                        style={{ background: p.cor ?? "#6b8c1a" }}
                      />
                      <p className="truncate text-sm font-bold">{p.nome}</p>
                    </div>
                    <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                      {p.tipo === "PADRAO" ? "Sistema" : "Custom"} ·{" "}
                      {p.capacidades.length} perms
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6 shrink-0 text-muted-foreground hover:text-foreground"
                    onClick={() => removeRole(p.id)}
                    aria-label="Remover do comparador"
                  >
                    <X className="size-3" />
                  </Button>
                </div>
              ))}
              <div className="p-4">
                {papeis.length < MAX_COMPARE && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPickerOpen(true)}
                  >
                    <Plus className="mr-1 size-3" /> Adicionar
                  </Button>
                )}
              </div>
            </div>

            {/* Heatmap rows */}
            {isLoading && (
              <div className="space-y-2 p-5">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            )}
            {!isLoading &&
              capsQ.data &&
              Object.entries(capsQ.data).map(([grupo, caps]) => (
                <div key={grupo}>
                  <div
                    className="grid bg-muted/40 border-b border-border"
                    style={{
                      gridTemplateColumns: `minmax(220px, 1fr) repeat(${papeis.length}, minmax(160px, 1fr)) auto`,
                    }}
                  >
                    <div className="px-4 py-2 text-sm font-bold">{grupo}</div>
                    {papeis.map((p, idx) => {
                      const granted = caps.filter((c) =>
                        setsPorPapel[idx].has(c.key),
                      ).length;
                      return (
                        <div
                          key={p.id}
                          className="border-l border-border px-4 py-2 text-right font-mono text-xs text-muted-foreground"
                        >
                          {granted}/{caps.length}
                        </div>
                      );
                    })}
                    <div />
                  </div>
                  {caps.map((c) => (
                    <div
                      key={c.key}
                      className="grid border-b border-border last:border-b-0 hover:bg-secondary/30"
                      style={{
                        gridTemplateColumns: `minmax(220px, 1fr) repeat(${papeis.length}, minmax(160px, 1fr)) auto`,
                      }}
                    >
                      <div className="px-4 py-2.5 pl-8">
                        <p className="text-sm">
                          {c.nome}
                          {c.critica && (
                            <span className="ml-1 text-xs font-bold text-gym-danger">
                              !
                            </span>
                          )}
                        </p>
                        <p className="font-mono text-[10px] text-muted-foreground">
                          {c.key}
                        </p>
                      </div>
                      {papeis.map((p, idx) => {
                        const has = setsPorPapel[idx].has(c.key);
                        return (
                          <div
                            key={p.id}
                            className="flex items-center justify-center border-l border-border px-4 py-2.5"
                          >
                            <span
                              className={cn(
                                "size-3.5 rounded-full",
                                !has && "border border-border bg-transparent",
                              )}
                              style={
                                has
                                  ? { background: p.cor ?? "#6b8c1a" }
                                  : undefined
                              }
                              aria-label={has ? "concedida" : "não concedida"}
                            />
                          </div>
                        );
                      })}
                      <div />
                    </div>
                  ))}
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar papel ao comparador</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2 max-h-[60vh] overflow-y-auto">
            {allPapeisQ.data
              ?.filter((p) => !ids.includes(p.id) && p.ativo)
              .map((p) => (
                <button
                  key={p.id}
                  onClick={() => addRole(p.id)}
                  className="flex w-full items-center gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:bg-secondary/50"
                >
                  <span
                    className="size-3 shrink-0 rounded-full"
                    style={{ background: p.cor ?? "#6b8c1a" }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{p.nome}</p>
                    {p.descricao && (
                      <p className="truncate text-xs text-muted-foreground">
                        {p.descricao}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {p.tipo === "PADRAO" ? "Sistema" : "Custom"}
                  </span>
                </button>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
