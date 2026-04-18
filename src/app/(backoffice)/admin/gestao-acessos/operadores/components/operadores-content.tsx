"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, Pencil, Search, Shield, UserPlus, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { useToast } from "@/components/ui/use-toast";
import { useRbacTenant } from "@/lib/tenant/rbac/hooks";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { listUsersApi } from "@/lib/api/rbac";
import {
  listarPerfis,
  atribuirPerfil,
  obterCapacidadesEfetivas,
  obterPerfilUsuarioTenant,
} from "@/lib/api/gestao-acessos";
import type { RbacUser } from "@/lib/types";
import type { PerfilAcesso } from "@/lib/api/gestao-acessos.types";

// Cores por perfil pra badges
const PERFIL_COLORS: Record<string, string> = {
  Admin: "bg-gym-accent/15 text-gym-accent border-gym-accent/30",
  Gerente: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Financeiro: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  Professor: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  Recepcionista: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

function perfilBadgeClass(nome: string): string {
  return PERFIL_COLORS[nome] ?? "bg-secondary text-muted-foreground border-border";
}

interface OperadorRow {
  user: RbacUser;
  perfilId: string | null;
  perfilNome: string | null;
}

export function OperadoresContent() {
  const { toast } = useToast();
  const tenant = useRbacTenant();

  const [operadores, setOperadores] = useState<OperadorRow[]>([]);
  const [perfis, setPerfis] = useState<PerfilAcesso[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [hydrated, setHydrated] = useState(false);

  // Modal alterar perfil
  const [alterarOpen, setAlterarOpen] = useState(false);
  const [alterarUser, setAlterarUser] = useState<OperadorRow | null>(null);
  const [selectedPerfilId, setSelectedPerfilId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Modal detalhes/capacidades
  const [detalhesOpen, setDetalhesOpen] = useState(false);
  const [detalhesUser, setDetalhesUser] = useState<OperadorRow | null>(null);
  const [capacidades, setCapacidades] = useState<string[]>([]);
  const [capsLoading, setCapsLoading] = useState(false);

  useEffect(() => setHydrated(true), []);

  const reload = useCallback(async () => {
    if (!tenant.tenantId) return;
    setLoading(true);
    try {
      const [usersData, perfisData] = await Promise.all([
        listUsersApi({ tenantId: tenant.tenantId }),
        listarPerfis("ACADEMIA", tenant.tenantId),
      ]);
      setPerfis(Array.isArray(perfisData) ? perfisData : []);

      // Filtrar apenas operadores (excluir clientes/alunos)
      // Clientes geralmente não têm role ou têm role CUSTOMER
      const operadoresOnly = usersData.filter((u) => {
        const raw = u as unknown as { userKind?: string; roles?: string[] };
        // Se tem userKind definido, filtrar
        if (raw.userKind === "CLIENTE") return false;
        return true;
      });

      // Enriquecer com perfil atribuído (em paralelo)
      const rows: OperadorRow[] = await Promise.all(
        operadoresOnly.map(async (u) => {
          try {
            const perfilData = await obterPerfilUsuarioTenant(Number(u.id), tenant.tenantId!);
            return {
              user: u,
              perfilId: perfilData?.perfilId ?? null,
              perfilNome: perfilData?.perfilNome ?? null,
            };
          } catch {
            return { user: u, perfilId: null, perfilNome: null };
          }
        }),
      );
      setOperadores(rows);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [tenant.tenantId]);

  useEffect(() => {
    if (tenant.tenantId) void reload();
  }, [reload, tenant.tenantId]);

  // --- Alterar perfil ---
  function openAlterar(op: OperadorRow) {
    setAlterarUser(op);
    setSelectedPerfilId(op.perfilId);
    setAlterarOpen(true);
  }

  async function confirmarAlterarPerfil() {
    if (!alterarUser || !selectedPerfilId || !tenant.tenantId) return;
    setSaving(true);
    try {
      await atribuirPerfil(Number(alterarUser.user.id), tenant.tenantId, selectedPerfilId);
      const perfil = perfis.find((p) => p.id === selectedPerfilId);
      setOperadores((prev) =>
        prev.map((op) =>
          op.user.id === alterarUser.user.id
            ? { ...op, perfilId: selectedPerfilId, perfilNome: perfil?.nome ?? null }
            : op,
        ),
      );
      toast({ title: `Perfil alterado para ${perfil?.nome}` });
      setAlterarOpen(false);
    } catch (err) {
      toast({
        title: "Erro ao alterar perfil",
        description: normalizeErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  // --- Detalhes/Capacidades ---
  async function openDetalhes(op: OperadorRow) {
    setDetalhesUser(op);
    setDetalhesOpen(true);
    setCapsLoading(true);
    setCapacidades([]);
    try {
      if (tenant.tenantId) {
        const caps = await obterCapacidadesEfetivas(Number(op.user.id), tenant.tenantId);
        setCapacidades(Array.isArray(caps) ? caps : []);
      }
    } catch {
      // silent
    } finally {
      setCapsLoading(false);
    }
  }

  if (!hydrated) return null;

  // Filtro de busca
  const filtered = search.trim()
    ? operadores.filter(
        (op) =>
          (op.user.fullName || op.user.name || "").toLowerCase().includes(search.toLowerCase()) ||
          (op.user.email || "").toLowerCase().includes(search.toLowerCase()),
      )
    : operadores;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Operadores</h1>
          <p className="text-sm text-muted-foreground">
            Veja os operadores desta unidade e gerencie seus perfis de acesso.
          </p>
        </div>
        <Button className="gap-2" disabled>
          <UserPlus className="size-4" />
          Novo Operador
        </Button>
      </div>

      {/* Busca */}
      {operadores.length > 3 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {/* Loading */}
      {loading && (
        <Card>
          <CardContent className="px-5 py-12 text-center text-sm text-muted-foreground">
            Carregando operadores...
          </CardContent>
        </Card>
      )}

      {/* Empty */}
      {!loading && operadores.length === 0 && (
        <Card>
          <CardContent className="px-5 py-12 text-center">
            <Users className="size-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum operador encontrado nesta unidade.</p>
          </CardContent>
        </Card>
      )}

      {/* Tabela */}
      {!loading && filtered.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    <th className="px-5 py-3">Operador</th>
                    <th className="px-5 py-3">Email</th>
                    <th className="px-5 py-3">Perfil</th>
                    <th className="px-5 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((op) => (
                    <tr key={op.user.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium">{op.user.fullName || op.user.name || "—"}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-muted-foreground">{op.user.email}</p>
                      </td>
                      <td className="px-5 py-4">
                        {op.perfilNome ? (
                          <Badge
                            variant="outline"
                            className={`text-xs font-medium ${perfilBadgeClass(op.perfilNome)}`}
                          >
                            <Shield className="size-3 mr-1" />
                            {op.perfilNome}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground/50 italic">Sem perfil</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-xs"
                            onClick={() => openAlterar(op)}
                          >
                            <Pencil className="size-3" />
                            Alterar Perfil
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-xs text-muted-foreground"
                            onClick={() => openDetalhes(op)}
                          >
                            <Eye className="size-3" />
                            Detalhes
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legenda de perfis */}
      {!loading && perfis.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-muted-foreground">Perfis disponíveis:</span>
          {perfis.map((p) => (
            <Badge key={p.id} variant="outline" className={`text-[10px] ${perfilBadgeClass(p.nome)}`}>
              {p.nome}
            </Badge>
          ))}
        </div>
      )}

      {/* ============ Modal Alterar Perfil ============ */}
      <Dialog open={alterarOpen} onOpenChange={setAlterarOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Alterar Perfil de Acesso</DialogTitle>
            <DialogDescription>
              {alterarUser?.user.fullName || alterarUser?.user.name} — {alterarUser?.user.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-4">
            {perfis.map((p) => {
              const isSelected = selectedPerfilId === p.id;
              const isCurrent = alterarUser?.perfilId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPerfilId(p.id)}
                  className={`w-full rounded-lg border px-4 py-3 text-left transition-all ${
                    isSelected
                      ? "border-gym-accent bg-gym-accent/10 ring-1 ring-gym-accent/30"
                      : "border-border hover:border-muted-foreground/30 hover:bg-secondary/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="size-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{p.nome}</span>
                    </div>
                    {isCurrent && (
                      <Badge variant="secondary" className="text-[10px]">Atual</Badge>
                    )}
                  </div>
                  {p.descricao && (
                    <p className="text-xs text-muted-foreground mt-1 ml-6">{p.descricao}</p>
                  )}
                </button>
              );
            })}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAlterarOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={confirmarAlterarPerfil}
              disabled={saving || !selectedPerfilId || selectedPerfilId === alterarUser?.perfilId}
            >
              {saving ? "Salvando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============ Modal Detalhes ============ */}
      <Dialog open={detalhesOpen} onOpenChange={setDetalhesOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {detalhesUser?.user.fullName || detalhesUser?.user.name}
            </DialogTitle>
            <DialogDescription>{detalhesUser?.user.email}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Perfil:</span>
              {detalhesUser?.perfilNome ? (
                <Badge
                  variant="outline"
                  className={`text-xs ${perfilBadgeClass(detalhesUser.perfilNome)}`}
                >
                  <Shield className="size-3 mr-1" />
                  {detalhesUser.perfilNome}
                </Badge>
              ) : (
                <span className="text-xs text-muted-foreground/50 italic">Sem perfil atribuído</span>
              )}
            </div>

            {capsLoading ? (
              <p className="text-sm text-muted-foreground">Carregando capacidades...</p>
            ) : capacidades.length > 0 ? (
              <div>
                <p className="text-sm font-medium mb-2">
                  Capacidades efetivas ({capacidades.length}):
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {capacidades.sort().map((cap) => (
                    <span
                      key={cap}
                      className="rounded-full bg-secondary border border-border px-2.5 py-0.5 text-[11px] text-muted-foreground"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhuma capacidade encontrada. Atribua um perfil primeiro.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
