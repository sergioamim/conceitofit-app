"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronRight,
  Copy,
  Trash,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import {
  atualizarCapacidadesPerfil,
  desativarPerfil,
  listarCapacidades,
  obterPerfil,
} from "@/lib/api/gestao-acessos";
import type { Capacidade } from "@/lib/api/gestao-acessos.types";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { cn } from "@/lib/utils";

import { listarUsuarios } from "../api/client";
import type { Dominio } from "../api/types";
import { AvatarIniciais } from "../components/avatar-iniciais";
import { PermissionToggle } from "../components/permission-toggle";
import { useRbacHref } from "../context";

type MatrixLayout = "table" | "cards" | "tree";

function isMatrixLayout(value: string | null): value is MatrixLayout {
  return value === "table" || value === "cards" || value === "tree";
}

interface RoleEditorProps {
  dominio: Dominio;
  tenantId?: string;
  roleId: string;
}

export function RbacRoleEditor({ dominio, tenantId, roleId }: RoleEditorProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const href = useRbacHref();

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const layoutParam = searchParams.get("layout");
  const layout: MatrixLayout = isMatrixLayout(layoutParam) ? layoutParam : "table";

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);
  const [openDomain, setOpenDomain] = useState<string | null>(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  function changeLayout(next: MatrixLayout) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "table") params.delete("layout");
    else params.set("layout", next);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  const perfilQ = useQuery({
    queryKey: ["rbac", "perfil", roleId],
    queryFn: () => obterPerfil(roleId),
  });

  const capsQ = useQuery({
    queryKey: ["rbac", "caps-by-grupo", dominio],
    queryFn: () => listarCapacidades(dominio),
    staleTime: 60_000,
  });

  const usuariosQ = useQuery({
    queryKey: ["rbac", "users-by-papel", dominio, tenantId ?? null, roleId],
    queryFn: () =>
      listarUsuarios({ dominio, tenantId, papelId: roleId, page: 0, size: 5 }),
    enabled: dominio === "PLATAFORMA" || Boolean(tenantId),
  });

  // Inicializa seleção quando perfil carrega
  useEffect(() => {
    if (perfilQ.data) {
      setSelected(new Set(perfilQ.data.capacidades));
    }
  }, [perfilQ.data]);

  const totalCaps = useMemo(
    () =>
      Object.values(capsQ.data ?? {}).reduce((acc, list) => acc + list.length, 0),
    [capsQ.data],
  );

  const temCriticas = useMemo(() => {
    if (!capsQ.data) return false;
    for (const list of Object.values(capsQ.data)) {
      for (const c of list) if (c.critica && selected.has(c.key)) return true;
    }
    return false;
  }, [capsQ.data, selected]);

  function toggle(key: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleGrupo(grupo: string, on: boolean) {
    const list = capsQ.data?.[grupo] ?? [];
    setSelected((s) => {
      const next = new Set(s);
      list.forEach((c) => (on ? next.add(c.key) : next.delete(c.key)));
      return next;
    });
  }

  function setAll(on: boolean) {
    if (!capsQ.data) return;
    setSelected(() => {
      if (!on) return new Set();
      const next = new Set<string>();
      Object.values(capsQ.data!).forEach((list) =>
        list.forEach((c) => next.add(c.key)),
      );
      return next;
    });
  }

  const saveMutation = useMutation({
    mutationFn: () =>
      atualizarCapacidadesPerfil(roleId, Array.from(selected)),
    onSuccess: () => {
      toast({ title: "Papel atualizado" });
      qc.invalidateQueries({ queryKey: ["rbac"] });
    },
    onError: (err) =>
      toast({
        title: "Falha ao salvar",
        description: normalizeErrorMessage(err),
        variant: "destructive",
      }),
  });

  const excluirMutation = useMutation({
    mutationFn: () => desativarPerfil(roleId),
    onSuccess: async () => {
      toast({ title: "Papel excluído" });
      await qc.invalidateQueries({ queryKey: ["rbac"] });
      router.push(href("/papeis"));
    },
    onError: (err) =>
      toast({
        title: "Falha ao excluir",
        description: normalizeErrorMessage(err),
        variant: "destructive",
      }),
  });

  // Dirty state — compara seleção atual com original do papel
  const dirty = useMemo(() => {
    if (!perfilQ.data) return false;
    const original = new Set(perfilQ.data.capacidades);
    if (original.size !== selected.size) return true;
    for (const k of selected) if (!original.has(k)) return true;
    return false;
  }, [selected, perfilQ.data]);

  const [confirmLimparOpen, setConfirmLimparOpen] = useState(false);
  const [confirmExcluirOpen, setConfirmExcluirOpen] = useState(false);

  if (perfilQ.isLoading || capsQ.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }
  if (!perfilQ.data) {
    return <p className="text-sm text-gym-danger">Papel não encontrado.</p>;
  }

  const perfil = perfilQ.data;
  const sistema = perfil.tipo === "PADRAO";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button asChild variant="ghost" size="sm" className="h-auto p-0">
          <Link href={href("/papeis")}>
            <ArrowLeft className="mr-1 size-3" /> Papéis
          </Link>
        </Button>
        <span>/</span>
        <span>{perfil.nome}</span>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="h-9 w-2 rounded"
            style={{ background: perfil.cor ?? "#6b8c1a" }}
          />
          <div>
            <h1 className="text-2xl font-display font-bold">{perfil.nome}</h1>
            {perfil.descricao && (
              <p className="text-sm text-muted-foreground">{perfil.descricao}</p>
            )}
          </div>
          {sistema && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
              Sistema
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {dirty && (
            <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-semibold text-amber-600">
              mudanças não salvas
            </span>
          )}
          <Button variant="outline" disabled title="Em breve">
            <Copy className="mr-1 size-3" /> Duplicar
          </Button>
          {!sistema && (
            <Button
              variant="destructive"
              onClick={() => setConfirmExcluirOpen(true)}
              disabled={excluirMutation.isPending}
            >
              <Trash className="mr-1 size-3" /> Excluir
            </Button>
          )}
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !dirty}
          >
            <Check className="mr-1 size-3" />
            {saveMutation.isPending ? "Salvando…" : "Salvar alterações"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardContent className="p-0">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
              <div>
                <p className="text-sm font-bold">Matriz de permissões</p>
                <p className="text-xs text-muted-foreground">
                  {selected.size} de {totalCaps} permissões selecionadas · layout:{" "}
                  <b>{layout}</b>
                </p>
              </div>
              <div className="flex gap-2">
                <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5">
                  {(["table", "cards", "tree"] as MatrixLayout[]).map((l) => (
                    <button
                      key={l}
                      onClick={() => changeLayout(l)}
                      className={cn(
                        "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                        layout === l
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground",
                      )}
                    >
                      {l === "table" ? "Tabela" : l === "cards" ? "Cards" : "Árvore"}
                    </button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAll(true)}
                >
                  Conceder tudo
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmLimparOpen(true)}
                >
                  Limpar
                </Button>
              </div>
            </div>

            {layout === "table" && (
              <MatrixTable
                grupos={capsQ.data ?? {}}
                selected={selected}
                onToggle={toggle}
                onToggleGrupo={toggleGrupo}
              />
            )}
            {layout === "cards" && (
              <MatrixCards
                grupos={capsQ.data ?? {}}
                selected={selected}
                onToggle={toggle}
                onToggleGrupo={toggleGrupo}
              />
            )}
            {layout === "tree" && hydrated && (
              <MatrixTree
                grupos={capsQ.data ?? {}}
                selected={selected}
                onToggle={toggle}
                onToggleGrupo={toggleGrupo}
                openDomain={openDomain}
                setOpenDomain={setOpenDomain}
              />
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardContent className="p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Resumo
              </p>
              <p className="mt-1 text-3xl font-bold">
                {selected.size}
                <span className="text-base font-normal text-muted-foreground">
                  /{totalCaps}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">permissões neste papel</p>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-gym-accent"
                  style={{
                    width:
                      totalCaps > 0 ? `${(selected.size / totalCaps) * 100}%` : "0%",
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Aplicado a
              </p>
              <p className="mt-1 text-2xl font-bold">
                {usuariosQ.data?.totalElements ?? 0} usuário(s)
              </p>
              <p className="mb-3 text-xs text-muted-foreground">
                Mudanças entram em vigor na próxima sessão.
              </p>
              {usuariosQ.data?.content.slice(0, 5).map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-3 border-t border-border py-2 first:border-t-0"
                >
                  <AvatarIniciais
                    nome={u.nome || u.email}
                    cor={u.papel?.cor}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{u.nome || "—"}</p>
                    <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {temCriticas && (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertTriangle className="size-4" />
                  <b className="text-sm">Permissões críticas</b>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Este papel concede ações irreversíveis (cancelamentos, exclusões,
                  fechamento). Atenção ao atribuí-lo.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Confirm Limpar */}
      <AlertDialog open={confirmLimparOpen} onOpenChange={setConfirmLimparOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar todas as permissões?</AlertDialogTitle>
            <AlertDialogDescription>
              Vai desmarcar as {selected.size} permissões selecionadas. A mudança ainda
              precisa ser salva para entrar em vigor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                setAll(false);
                setConfirmLimparOpen(false);
              }}
            >
              Limpar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Excluir */}
      <AlertDialog open={confirmExcluirOpen} onOpenChange={setConfirmExcluirOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir o papel "{perfil.nome}"?</AlertDialogTitle>
            <AlertDialogDescription>
              O papel será desativado (soft-delete). Usuários atualmente atribuídos a
              ele continuam funcionando, mas o papel não aparecerá mais para novas
              atribuições. Essa ação fica registrada na auditoria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={excluirMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                excluirMutation.mutate();
              }}
              disabled={excluirMutation.isPending}
            >
              {excluirMutation.isPending ? "Excluindo…" : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Layouts da matriz
// ---------------------------------------------------------------------------

type GruposMap = Record<string, Capacidade[]>;

interface LayoutProps {
  grupos: GruposMap;
  selected: Set<string>;
  onToggle: (key: string) => void;
  onToggleGrupo: (grupo: string, on: boolean) => void;
}

function MatrixTable({ grupos, selected, onToggle, onToggleGrupo }: LayoutProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-3">Permissão</th>
            <th className="px-4 py-3">Crítica</th>
            <th className="px-4 py-3 text-right">Concedida</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {Object.entries(grupos).map(([grupo, caps]) => {
            const granted = caps.filter((c) => selected.has(c.key)).length;
            const all = granted === caps.length;
            return (
              <DomainRows
                key={grupo}
                grupo={grupo}
                caps={caps}
                granted={granted}
                all={all}
                selected={selected}
                onToggle={onToggle}
                onToggleGrupo={onToggleGrupo}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DomainRows({
  grupo,
  caps,
  granted,
  all,
  selected,
  onToggle,
  onToggleGrupo,
}: {
  grupo: string;
  caps: Capacidade[];
  granted: number;
  all: boolean;
  selected: Set<string>;
  onToggle: (key: string) => void;
  onToggleGrupo: (grupo: string, on: boolean) => void;
}) {
  return (
    <>
      <tr className="bg-muted/40">
        <td className="px-4 py-2.5 text-sm font-bold" colSpan={2}>
          {grupo}{" "}
          <span className="ml-2 font-mono text-xs font-normal text-muted-foreground">
            {granted}/{caps.length}
          </span>
        </td>
        <td className="px-4 py-2.5 text-right">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs"
            onClick={() => onToggleGrupo(grupo, !all)}
          >
            {all ? "limpar" : "todos"}
          </Button>
        </td>
      </tr>
      {caps.map((c) => (
        <tr key={c.key}>
          <td className="px-4 py-2 pl-8">
            <p className="text-sm font-medium">{c.nome}</p>
            <p className="font-mono text-[10px] text-muted-foreground">{c.key}</p>
          </td>
          <td className="px-4 py-2">
            {c.critica && (
              <span className="inline-flex items-center gap-1 rounded-full border border-gym-danger/30 bg-gym-danger/10 px-1.5 py-0.5 text-[9px] font-bold text-gym-danger">
                <AlertTriangle className="size-2.5" />
                crítica
              </span>
            )}
          </td>
          <td className="px-4 py-2 text-right">
            <PermissionToggle
              checked={selected.has(c.key)}
              onChange={() => onToggle(c.key)}
            />
          </td>
        </tr>
      ))}
    </>
  );
}

function MatrixCards({ grupos, selected, onToggle, onToggleGrupo }: LayoutProps) {
  return (
    <div className="grid gap-3 p-4 md:grid-cols-2">
      {Object.entries(grupos).map(([grupo, caps]) => {
        const granted = caps.filter((c) => selected.has(c.key)).length;
        const all = granted === caps.length;
        return (
          <div
            key={grupo}
            className="rounded-xl border border-border bg-background"
          >
            <div className="flex items-center justify-between gap-2 border-b border-border p-3">
              <b className="text-sm">{grupo}</b>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">
                  {granted}/{caps.length}
                </span>
                <PermissionToggle
                  checked={all}
                  onChange={() => onToggleGrupo(grupo, !all)}
                />
              </div>
            </div>
            <ul className="divide-y divide-border">
              {caps.map((c) => (
                <li
                  key={c.key}
                  className="flex items-center justify-between gap-3 p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm">
                      {c.nome}
                      {c.critica && (
                        <span className="ml-1 text-gym-danger">!</span>
                      )}
                    </p>
                    <p className="font-mono text-[10px] text-muted-foreground">
                      {c.key}
                    </p>
                  </div>
                  <PermissionToggle
                    checked={selected.has(c.key)}
                    onChange={() => onToggle(c.key)}
                  />
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function MatrixTree({
  grupos,
  selected,
  onToggle,
  onToggleGrupo,
  openDomain,
  setOpenDomain,
}: LayoutProps & {
  openDomain: string | null;
  setOpenDomain: (g: string | null) => void;
}) {
  return (
    <div className="p-4 space-y-1.5">
      {Object.entries(grupos).map(([grupo, caps]) => {
        const granted = caps.filter((c) => selected.has(c.key)).length;
        const all = granted === caps.length;
        const open = openDomain === null ? granted > 0 : openDomain === grupo;
        return (
          <div key={grupo} className="rounded-lg border border-border">
            <button
              onClick={() => setOpenDomain(open ? "" : grupo)}
              className="flex w-full items-center gap-2 p-3 text-left"
            >
              <ChevronRight
                className={cn(
                  "size-4 transition-transform",
                  open && "rotate-90",
                )}
              />
              <b className="flex-1 text-sm">{grupo}</b>
              <span className="font-mono text-xs text-muted-foreground">
                {granted}/{caps.length}
              </span>
              <span onClick={(e) => e.stopPropagation()}>
                <PermissionToggle
                  checked={all}
                  onChange={() => onToggleGrupo(grupo, !all)}
                />
              </span>
            </button>
            {open && (
              <ul className="divide-y divide-border border-t border-border">
                {caps.map((c) => (
                  <li
                    key={c.key}
                    className="flex items-center justify-between gap-3 p-3 pl-8"
                  >
                    <div className="min-w-0">
                      <p className="text-sm">{c.nome}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">
                        {c.key}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {c.critica && (
                        <span className="text-[10px] font-bold text-gym-danger">
                          crítica
                        </span>
                      )}
                      <PermissionToggle
                        checked={selected.has(c.key)}
                        onChange={() => onToggle(c.key)}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
