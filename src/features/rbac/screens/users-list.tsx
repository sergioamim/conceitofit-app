"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, Download, KeyRound, Search, UserPlus } from "lucide-react";

import { BulkActionBar } from "@/components/shared/bulk-action-bar";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { atribuirPerfil } from "@/lib/api/gestao-acessos";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

import {
  alterarStatusUsuario,
  listarPerfisContexto,
  listarUsuarios,
} from "../api/client";
import type { Dominio, StatusUsuario, UsuarioListItem } from "../api/types";
import { AvatarIniciais } from "../components/avatar-iniciais";
import { RoleChip } from "../components/role-chip";
import { StatusChip } from "../components/status-chip";
import { useRbacHref } from "../context";

const BULK_LIMIT = 100;

interface UsersListProps {
  dominio: Dominio;
  tenantId?: string;
}

export function RbacUsersList({ dominio, tenantId }: UsersListProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const href = useRbacHref();

  const [q, setQ] = useState("");
  const [papelId, setPapelId] = useState<string>("");
  const [status, setStatus] = useState<StatusUsuario | "">("");
  const [page, setPage] = useState(0);
  const size = 25;

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkPapelOpen, setBulkPapelOpen] = useState(false);
  const [bulkPapelId, setBulkPapelId] = useState<string>("");

  const enabled = dominio === "PLATAFORMA" || Boolean(tenantId);

  const usersQ = useQuery({
    queryKey: ["rbac", "users", dominio, tenantId ?? null, q, papelId, status, page],
    queryFn: () =>
      listarUsuarios({
        dominio,
        tenantId,
        q: q || undefined,
        papelId: papelId || undefined,
        status: status || undefined,
        page,
        size,
      }),
    enabled,
    staleTime: 15_000,
  });

  const papeisQ = useQuery({
    queryKey: ["rbac", "perfis", dominio, tenantId ?? null],
    queryFn: () => listarPerfisContexto(dominio, tenantId),
    enabled,
    staleTime: 60_000,
  });

  function toggleSelect(id: number) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function selectAllPage(rows: UsuarioListItem[]) {
    setSelected((s) => {
      const next = new Set(s);
      const allSelected = rows.every((r) => next.has(r.id));
      if (allSelected) rows.forEach((r) => next.delete(r.id));
      else rows.forEach((r) => next.add(r.id));
      return next;
    });
  }
  function clearSelection() {
    setSelected(new Set());
  }

  const bulkSuspenderMutation = useMutation({
    mutationFn: async () => {
      const ids = Array.from(selected).slice(0, BULK_LIMIT);
      // Concorrência limitada a 5 — evita rate-limit e deadlock no DB.
      const concurrency = 5;
      let failed = 0;
      for (let i = 0; i < ids.length; i += concurrency) {
        const batch = ids.slice(i, i + concurrency);
        const results = await Promise.allSettled(
          batch.map((id) => alterarStatusUsuario(id, { ativo: false })),
        );
        failed += results.filter((r) => r.status === "rejected").length;
      }
      return { total: ids.length, failed };
    },
    onSuccess: ({ total, failed }) => {
      toast({
        title:
          failed === 0
            ? `${total} usuário(s) suspenso(s)`
            : `${total - failed} de ${total} suspensos`,
        description: failed > 0 ? `${failed} falharam — tente novamente` : undefined,
      });
      clearSelection();
      qc.invalidateQueries({ queryKey: ["rbac"] });
    },
    onError: (err) =>
      toast({
        title: "Falha na suspensão em massa",
        description: normalizeErrorMessage(err),
        variant: "destructive",
      }),
  });

  const bulkAtribuirMutation = useMutation({
    mutationFn: async () => {
      if (!tenantId) throw new Error("Tenant inválido");
      if (!bulkPapelId) throw new Error("Selecione um papel");
      const ids = Array.from(selected).slice(0, BULK_LIMIT);
      const concurrency = 5;
      let failed = 0;
      for (let i = 0; i < ids.length; i += concurrency) {
        const batch = ids.slice(i, i + concurrency);
        const results = await Promise.allSettled(
          batch.map((id) => atribuirPerfil(id, tenantId, bulkPapelId)),
        );
        failed += results.filter((r) => r.status === "rejected").length;
      }
      return { total: ids.length, failed };
    },
    onSuccess: ({ total, failed }) => {
      toast({
        title: failed === 0
          ? `${total} usuário(s) atualizados`
          : `${total - failed} de ${total} atualizados`,
        description: failed > 0 ? `${failed} falharam — tente novamente` : undefined,
      });
      setBulkPapelOpen(false);
      setBulkPapelId("");
      clearSelection();
      qc.invalidateQueries({ queryKey: ["rbac"] });
    },
    onError: (err) =>
      toast({
        title: "Falha na atribuição em massa",
        description: normalizeErrorMessage(err),
        variant: "destructive",
      }),
  });

  function exportCsv() {
    const rows = (usersQ.data?.content ?? []).filter((u) => selected.has(u.id));
    if (rows.length === 0) return;
    const header = ["id", "nome", "email", "papel", "status"];
    const csv = [
      header.join(","),
      ...rows.map((r) =>
        [
          r.id,
          csvEscape(r.nome),
          csvEscape(r.email),
          csvEscape(r.papel?.nome ?? ""),
          r.status,
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `usuarios-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: `${rows.length} linha(s) exportada(s)` });
  }

  const allRowsSelected =
    (usersQ.data?.content.length ?? 0) > 0 &&
    usersQ.data!.content.every((r) => selected.has(r.id));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Gestão de Acesso / Usuários
          </p>
          <h1 className="text-2xl font-display font-bold mt-1">Usuários</h1>
          <p className="text-sm text-muted-foreground">
            {usersQ.data?.totalElements ?? 0} pessoa(s) com acesso
          </p>
        </div>
        <Button asChild>
          <Link href={href("/usuarios/convidar")}>
            <UserPlus className="mr-2 size-4" />
            Convidar
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(0);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={papelId || "all"}
          onValueChange={(v) => {
            setPapelId(v === "all" ? "" : v);
            setPage(0);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todos os papéis" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os papéis</SelectItem>
            {papeisQ.data?.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={status || "all"}
          onValueChange={(v) => {
            setStatus(v === "all" ? "" : (v as StatusUsuario));
            setPage(0);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Qualquer status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Qualquer status</SelectItem>
            <SelectItem value="ativo">Ativo</SelectItem>
            <SelectItem value="convite-pendente">Convite pendente</SelectItem>
            <SelectItem value="suspenso">Suspenso</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {usersQ.isLoading && (
            <div className="space-y-3 p-5">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          )}
          {!usersQ.isLoading && (usersQ.data?.content.length ?? 0) === 0 && (
            <div className="px-5 py-12 text-center text-sm text-muted-foreground">
              Nenhum usuário encontrado.
            </div>
          )}
          {!usersQ.isLoading && (usersQ.data?.content.length ?? 0) > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    <th className="w-10 px-3 py-3">
                      <input
                        type="checkbox"
                        aria-label="Selecionar todos"
                        checked={allRowsSelected}
                        onChange={() =>
                          selectAllPage(usersQ.data!.content)
                        }
                        className="size-4"
                      />
                    </th>
                    <th className="px-5 py-3">Usuário</th>
                    <th className="px-5 py-3">Papel</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {Array.from(
                    new Map(
                      (usersQ.data?.content ?? []).map((u) => [u.id, u]),
                    ).values(),
                  ).map((u) => (
                    <tr
                      key={u.id}
                      className="transition-colors hover:bg-secondary/30"
                    >
                      <td className="w-10 px-3 py-3">
                        <input
                          type="checkbox"
                          aria-label={`Selecionar ${u.nome || u.email}`}
                          checked={selected.has(u.id)}
                          onChange={() => toggleSelect(u.id)}
                          className="size-4"
                        />
                      </td>
                      <td className="px-5 py-3">
                        <Link
                          href={{
                            pathname: href(`/usuarios/${u.id}`),
                            query: { nome: u.nome, email: u.email },
                          }}
                          className="flex items-center gap-3"
                        >
                          <AvatarIniciais
                            nome={u.nome || u.email}
                            cor={u.papel?.cor}
                          />
                          <div>
                            <p className="text-sm font-semibold">{u.nome || "—"}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-5 py-3">
                        {u.papel ? (
                          <RoleChip nome={u.papel.nome} cor={u.papel.cor} />
                        ) : (
                          <span className="text-xs italic text-muted-foreground/60">
                            sem papel
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <StatusChip status={u.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {usersQ.data && usersQ.data.totalElements > size && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {usersQ.data.content.length} de {usersQ.data.totalElements} usuários
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={(page + 1) * size >= usersQ.data.totalElements}
              onClick={() => setPage((p) => p + 1)}
            >
              Próximo
            </Button>
          </div>
        </div>
      )}

      <BulkActionBar
        selectedCount={selected.size}
        selectedIds={Array.from(selected).map(String)}
        onClearSelection={clearSelection}
        actions={[
          {
            label: "Atribuir papel",
            icon: KeyRound,
            onClick: () => setBulkPapelOpen(true),
          },
          {
            label: "Suspender",
            icon: Ban,
            variant: "ghost",
            onClick: () => bulkSuspenderMutation.mutate(),
          },
          {
            label: "Exportar CSV",
            icon: Download,
            onClick: () => exportCsv(),
          },
        ]}
      />

      <Dialog open={bulkPapelOpen} onOpenChange={setBulkPapelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atribuir papel a {selected.size} usuário(s)</DialogTitle>
            <DialogDescription>
              {selected.size > BULK_LIMIT && (
                <span className="text-gym-warning">
                  Limite de {BULK_LIMIT} aplicações por batch — apenas os primeiros serão processados.
                </span>
              )}
              {selected.size <= BULK_LIMIT &&
                "Mudança aplica imediatamente. Usuários online continuam com permissões antigas até a próxima sessão."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <Label>Novo papel</Label>
            <Select value={bulkPapelId} onValueChange={setBulkPapelId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um papel" />
              </SelectTrigger>
              <SelectContent>
                {papeisQ.data?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkPapelOpen(false)}
              disabled={bulkAtribuirMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              disabled={!bulkPapelId || bulkAtribuirMutation.isPending}
              onClick={() => bulkAtribuirMutation.mutate()}
            >
              {bulkAtribuirMutation.isPending ? "Aplicando…" : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function csvEscape(s: string): string {
  if (s == null) return "";
  if (/[,"\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
