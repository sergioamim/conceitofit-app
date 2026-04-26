"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeftRight, Edit, KeyRound, Plus, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { getStats, listarPerfisContexto } from "../api/client";
import type { Dominio } from "../api/types";
import { useRbacHref } from "../context";

const COMPARE_MAX = 4;

interface RolesListProps {
  dominio: Dominio;
  tenantId?: string;
}

export function RbacRolesList({ dominio, tenantId }: RolesListProps) {
  const href = useRbacHref();
  const router = useRouter();
  const enabled = dominio === "PLATAFORMA" || Boolean(tenantId);

  const [compareOpen, setCompareOpen] = useState(false);
  const [compareSel, setCompareSel] = useState<Set<string>>(new Set());

  const perfisQ = useQuery({
    queryKey: ["rbac", "perfis", dominio, tenantId ?? null],
    queryFn: () => listarPerfisContexto(dominio, tenantId),
    enabled,
  });

  const statsQ = useQuery({
    queryKey: ["rbac", "stats", dominio, tenantId ?? null],
    queryFn: () => getStats({ dominio, tenantId }),
    enabled,
    staleTime: 30_000,
  });

  const usuariosByPapel = useMemo(() => {
    const map = new Map<string, number>();
    statsQ.data?.distribuicaoPorPapel.forEach((d) =>
      map.set(d.papelId, d.usuarios),
    );
    return map;
  }, [statsQ.data]);

  function toggleCompareSel(id: string) {
    setCompareSel((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else if (next.size < COMPARE_MAX) next.add(id);
      return next;
    });
  }

  function abrirComparador() {
    if (compareSel.size < 2) return;
    const ids = Array.from(compareSel).join(",");
    router.push(`${href("/papeis/comparar")}?ids=${ids}`);
    setCompareOpen(false);
    setCompareSel(new Set());
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Gestão de Acesso / Papéis
          </p>
          <h1 className="text-2xl font-display font-bold mt-1">Papéis</h1>
          <p className="text-sm text-muted-foreground">
            Conjuntos de permissões aplicados a usuários. Papéis do sistema não podem ser excluídos.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setCompareOpen(true)}
            disabled={(perfisQ.data?.length ?? 0) < 2}
          >
            <ArrowLeftRight className="mr-2 size-4" />
            Comparar papéis
          </Button>
          <Button asChild>
            <Link href={href("/papeis/novo")}>
              <Plus className="mr-2 size-4" />
              Novo papel
            </Link>
          </Button>
        </div>
      </div>

      {perfisQ.isLoading && (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      )}

      {!perfisQ.isLoading && (perfisQ.data?.length ?? 0) === 0 && (
        <Card>
          <CardContent className="px-5 py-12 text-center text-sm text-muted-foreground">
            Nenhum papel configurado. Clique em "Novo papel" para começar.
          </CardContent>
        </Card>
      )}

      {!perfisQ.isLoading && perfisQ.data && perfisQ.data.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {perfisQ.data.map((p) => {
            const sistema = p.tipo === "PADRAO";
            return (
              <Link
                key={p.id}
                href={href(`/papeis/${p.id}`)}
                className="block"
              >
                <Card
                  className="h-full transition-all hover:shadow-md"
                  style={{ borderLeft: `4px solid ${p.cor ?? "#6b8c1a"}` }}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex size-10 items-center justify-center rounded-xl"
                          style={{
                            background: `color-mix(in oklab, ${p.cor ?? "#6b8c1a"} 14%, transparent)`,
                            color: p.cor ?? "#6b8c1a",
                          }}
                        >
                          <KeyRound className="size-5" />
                        </div>
                        <div>
                          <p className="text-base font-bold">{p.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            {sistema ? "Papel do sistema" : "Papel customizado"}
                          </p>
                        </div>
                      </div>
                      {sistema && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                          <Shield className="size-3" />
                          Sistema
                        </span>
                      )}
                    </div>

                    {p.descricao && (
                      <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                        {p.descricao}
                      </p>
                    )}

                    <div className="mt-4 flex items-end justify-between">
                      <div className="flex gap-6">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Usuários
                          </p>
                          <p className="text-xl font-bold">
                            {usuariosByPapel.get(p.id) ?? 0}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Edit className="mr-1 size-3" />
                        Editar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Comparar papéis</DialogTitle>
            <DialogDescription>
              Selecione de 2 a {COMPARE_MAX} papéis pra ver lado-a-lado quais permissões
              cada um concede.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-2 overflow-y-auto py-2">
            {perfisQ.data?.map((p) => {
              const selected = compareSel.has(p.id);
              const disabled = !selected && compareSel.size >= COMPARE_MAX;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggleCompareSel(p.id)}
                  disabled={disabled}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all",
                    selected
                      ? "border-gym-accent bg-gym-accent/10"
                      : "border-border hover:bg-secondary/50",
                    disabled && "cursor-not-allowed opacity-50",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    readOnly
                    className="size-4"
                  />
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
              );
            })}
          </div>
          <DialogFooter>
            <p className="mr-auto text-xs text-muted-foreground self-center">
              {compareSel.size} selecionado(s)
            </p>
            <Button variant="outline" onClick={() => setCompareOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={compareSel.size < 2}
              onClick={abrirComparador}
            >
              Comparar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
