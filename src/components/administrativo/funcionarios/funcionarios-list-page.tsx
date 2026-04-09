"use client";

import { useEffect, useMemo, useState } from "react";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CargoModal } from "@/components/shared/cargo-modal";
import { DataTableRowActions } from "@/components/shared/data-table-row-actions";
import { useAuthAccess } from "@/lib/tenant/hooks/use-session-context";
import { createCargoApi, deleteCargoApi, deleteFuncionarioApi, toggleCargoApi, toggleFuncionarioApi, updateCargoApi } from "@/lib/api/administrativo";
import { filterColaboradores, type ColaboradorFlagFiltro } from "@/lib/tenant/administrativo-colaboradores";
import { cn } from "@/lib/utils";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import type { Cargo } from "@/lib/types";
import { useFuncionariosWorkspace } from "./use-funcionarios-workspace";
import { DEFAULT_FILTERS, FLAG_OPTIONS, STATUS_ACESSO_OPTIONS, STATUS_OPERACIONAL_OPTIONS, statusTone } from "./shared";

const PAGE_SIZE = 10;

export function FuncionariosListPage() {
  const router = useRouter();
  const access = useAuthAccess();
  const {
    tenantContext,
    tenantOptions,
    funcionarios,
    setFuncionarios,
    cargos,
    loading,
    error,
    setError,
    loadWorkspace,
  } = useFuncionariosWorkspace();

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [cargoFormOpen, setCargoFormOpen] = useState(false);
  const [cargosModalOpen, setCargosModalOpen] = useState(false);
  const [editingCargo, setEditingCargo] = useState<Cargo | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const { confirm, ConfirmDialog } = useConfirmDialog();

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const filteredFuncionarios = useMemo(() => filterColaboradores(funcionarios, filters), [filters, funcionarios]);

  const pageCount = Math.max(1, Math.ceil(filteredFuncionarios.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredFuncionarios.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredFuncionarios]);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  const stats = useMemo(() => {
    const ativos = funcionarios.filter((item) => item.statusOperacional === "ATIVO").length;
    const comAcesso = funcionarios.filter((item) => item.possuiAcessoSistema).length;
    const multiunidade = funcionarios.filter((item) => (item.memberships?.length ?? 0) > 1).length;
    const operacaoCritica = funcionarios.filter(
      (item) => item.permiteCatraca || item.permiteForaHorario || item.utilizaTecladoAcesso
    ).length;
    return { ativos, comAcesso, multiunidade, operacaoCritica };
  }, [funcionarios]);

  async function handleSaveCargo(data: Omit<Cargo, "id" | "tenantId">, id?: string) {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      if (id) {
        await updateCargoApi(id, data);
      } else {
        await createCargoApi({ nome: data.nome });
      }
      setCargoFormOpen(false);
      setEditingCargo(null);
      setSuccess("Catálogo de cargos atualizado.");
      await loadWorkspace();
    } catch (saveError) {
      setError(normalizeErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleCargo(id: string) {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await toggleCargoApi(id);
      setSuccess("Status do cargo atualizado.");
      await loadWorkspace();
    } catch (toggleError) {
      setError(normalizeErrorMessage(toggleError));
    } finally {
      setSaving(false);
    }
  }

  function handleDeleteCargo(id: string) {
    confirm("Remover este cargo?", async () => {
      setSaving(true);
      setError(null);
      setSuccess(null);
      try {
        await deleteCargoApi(id);
        setSuccess("Cargo removido.");
        await loadWorkspace();
      } catch (deleteError) {
        setError(normalizeErrorMessage(deleteError));
      } finally {
        setSaving(false);
      }
    }, { title: "Confirmar remoção", variant: "destructive" });
  }

  async function handleToggleColaborador(id: string) {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const saved = await toggleFuncionarioApi(id);
      setFuncionarios((current) => current.map((item) => (item.id === id ? saved : item)));
      setSuccess(saved.ativo ? "Colaborador reativado." : "Colaborador inativado.");
    } catch (toggleError) {
      setError(normalizeErrorMessage(toggleError));
    } finally {
      setSaving(false);
    }
  }

  function handleDeleteColaborador(id: string) {
    confirm("Remover este colaborador?", async () => {
      setSaving(true);
      setError(null);
      setSuccess(null);
      try {
        await deleteFuncionarioApi(id);
        setFuncionarios((current) => current.filter((item) => item.id !== id));
        setSuccess("Colaborador removido.");
      } catch (deleteError) {
        setError(normalizeErrorMessage(deleteError));
      } finally {
        setSaving(false);
      }
    }, { title: "Confirmar remoção", variant: "destructive" });
  }

  if (!hasMounted) {
    return (
      <div className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
        Carregando base operacional de colaboradores...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {ConfirmDialog}
      {cargoFormOpen ? (
        <CargoModal
          open={cargoFormOpen}
          onClose={() => {
            setCargoFormOpen(false);
            setEditingCargo(null);
          }}
          onSave={handleSaveCargo}
          initial={editingCargo}
        />
      ) : null}

      <section className="overflow-hidden rounded-[28px] border border-border bg-card">
        <div className="relative overflow-hidden border-b border-border px-6 py-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(61,232,160,0.16),transparent_46%),radial-gradient(circle_at_bottom_right,rgba(255,214,51,0.12),transparent_42%)]" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-secondary/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Colaboradores
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold tracking-tight">Workspace de equipe operacional</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Acompanhe filtros, métricas e vínculos multiunidade em uma grade estável. A ficha completa agora vive em rotas próprias.
                </p>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <Card className="border-border/70 bg-background/60 backdrop-blur">
                <CardContent className="p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Ativos</p>
                  <p className="mt-2 font-display text-2xl font-bold">{stats.ativos}</p>
                </CardContent>
              </Card>
              <Card className="border-border/70 bg-background/60 backdrop-blur">
                <CardContent className="p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Com acesso</p>
                  <p className="mt-2 font-display text-2xl font-bold">{stats.comAcesso}</p>
                </CardContent>
              </Card>
              <Card className="border-border/70 bg-background/60 backdrop-blur">
                <CardContent className="p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Multiunidade</p>
                  <p className="mt-2 font-display text-2xl font-bold">{stats.multiunidade}</p>
                </CardContent>
              </Card>
              <Card className="border-border/70 bg-background/60 backdrop-blur">
                <CardContent className="p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Operação crítica</p>
                  <p className="mt-2 font-display text-2xl font-bold">{stats.operacaoCritica}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl text-sm text-muted-foreground">
            Unidade ativa:
            <span className="ml-2 font-medium text-foreground">{tenantContext.tenantName || "Unidade ativa"}</span>
            {tenantContext.networkName ? (
              <>
                <span className="mx-2 text-border">•</span>
                Rede: <span className="ml-1 font-medium text-foreground">{tenantContext.networkName}</span>
              </>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="border-border" onClick={() => setCargosModalOpen(true)}>
              Cargos
            </Button>
            <Button asChild>
              <Link href="/administrativo/funcionarios/novo">Novo colaborador</Link>
            </Button>
          </div>
        </div>
      </section>

      {access.loading || tenantContext.loading || loading ? (
        <div className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          Carregando base operacional de colaboradores...
        </div>
      ) : null}

      {error ? <div className="rounded-2xl border border-gym-danger/30 bg-gym-danger/10 px-4 py-3 text-sm text-gym-danger">{error}</div> : null}
      {success ? <div className="rounded-2xl border border-gym-teal/30 bg-gym-teal/10 px-4 py-3 text-sm text-gym-teal">{success}</div> : null}

      {!access.canAccessElevatedModules ? (
        <div className="rounded-2xl border border-gym-warning/30 bg-gym-warning/10 px-4 py-3 text-sm text-gym-warning">
          Dados sensíveis continuam protegidos no seu contexto atual. A ficha dedicada mantém o mascaramento em contratação e notas internas.
        </div>
      ) : null}

      <Card className="border-border bg-card">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CardTitle className="font-display text-xl">Base de colaboradores</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Busca, filtros por acesso e abertura direta da ficha via rota dedicada.
              </p>
            </div>
            <p className="text-sm text-muted-foreground">{filteredFuncionarios.length} resultado(s)</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <Input
              aria-label="Buscar colaborador"
              value={filters.query}
              onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
              className="border-border bg-secondary"
              placeholder="Buscar por nome, cargo, e-mail ou unidade"
            />

            <Select
              value={filters.statusOperacional}
              onValueChange={(value) =>
                setFilters((current) => ({ ...current, statusOperacional: value as (typeof current.statusOperacional) }))
              }
            >
              <SelectTrigger aria-label="Filtrar por status operacional" className="border-border bg-secondary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPERACIONAL_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.statusAcesso}
              onValueChange={(value) =>
                setFilters((current) => ({ ...current, statusAcesso: value as (typeof current.statusAcesso) }))
              }
            >
              <SelectTrigger aria-label="Filtrar por status de acesso" className="border-border bg-secondary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_ACESSO_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.cargoId || "__all__"}
              onValueChange={(value) => setFilters((current) => ({ ...current, cargoId: value === "__all__" ? "" : value }))}
            >
              <SelectTrigger aria-label="Filtrar por cargo" className="border-border bg-secondary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos os cargos</SelectItem>
                {cargos.map((cargo) => (
                  <SelectItem key={cargo.id} value={cargo.id}>
                    {cargo.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.unidadeId || "__all__"}
              onValueChange={(value) => setFilters((current) => ({ ...current, unidadeId: value === "__all__" ? "" : value }))}
            >
              <SelectTrigger aria-label="Filtrar por unidade" className="border-border bg-secondary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todas as unidades</SelectItem>
                {tenantOptions.map((tenant) => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.flag}
              onValueChange={(value) => setFilters((current) => ({ ...current, flag: value as ColaboradorFlagFiltro }))}
            >
              <SelectTrigger aria-label="Filtrar por flag operacional" className="border-border bg-secondary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FLAG_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" className="border-border" onClick={() => setFilters(DEFAULT_FILTERS)}>
              Limpar filtros
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {pageRows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
              Nenhum colaborador encontrado para a combinação atual de filtros.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/70">
                    <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Colaborador</th>
                    <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                    <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Unidade base</th>
                    <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Flags</th>
                    <th scope="col" className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pageRows.map((funcionario) => (
                    <tr
                      key={funcionario.id}
                      className="cursor-pointer bg-card transition-colors hover:bg-secondary/25"
                      onClick={() => router.push(`/administrativo/funcionarios/${funcionario.id}`)}
                    >
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          className="w-full text-left"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            router.push(`/administrativo/funcionarios/${funcionario.id}`);
                          }}
                        >
                          <p className="font-medium text-foreground">{funcionario.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            {funcionario.cargo ?? "Sem cargo definido"}
                            {funcionario.emailProfissional ? ` • ${funcionario.emailProfissional}` : ""}
                          </p>
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Badge className={cn("border-0", statusTone(funcionario.statusOperacional))}>
                            {funcionario.statusOperacional ?? "ATIVO"}
                          </Badge>
                          <Badge className={cn("border-0", statusTone(funcionario.statusAcesso))}>
                            {funcionario.statusAcesso ?? "SEM_ACESSO"}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-foreground">
                        <p>{funcionario.tenantBaseNome ?? tenantContext.tenantName ?? "Sem base"}</p>
                        <p className="text-xs text-muted-foreground">{funcionario.memberships?.length ?? 0} vínculo(s)</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          {funcionario.podeMinistrarAulas ? <Badge variant="outline">Aulas</Badge> : null}
                          {funcionario.permiteCatraca ? <Badge variant="outline">Catraca</Badge> : null}
                          {funcionario.permiteForaHorario ? <Badge variant="outline">Extra</Badge> : null}
                          {funcionario.utilizaTecladoAcesso ? <Badge variant="outline">Teclado</Badge> : null}
                          {funcionario.coordenador ? <Badge variant="outline">Coordenação</Badge> : null}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div
                          className="flex justify-end"
                          onClick={(event) => {
                            event.stopPropagation();
                          }}
                        >
                          <DataTableRowActions
                            actions={[
                              {
                                label: "Abrir ficha",
                                kind: "view",
                                onClick: () => router.push(`/administrativo/funcionarios/${funcionario.id}`),
                              },
                              {
                                label: funcionario.ativo ? "Desativar" : "Ativar",
                                kind: "toggle",
                                onClick: () => {
                                  void handleToggleColaborador(funcionario.id);
                                },
                              },
                              {
                                label: "Remover",
                                kind: "delete",
                                onClick: () => {
                                  void handleDeleteColaborador(funcionario.id);
                                },
                              },
                            ]}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-muted-foreground">
              Página {currentPage} de {pageCount}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="border-border" disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
                Anterior
              </Button>
              <Button variant="outline" className="border-border" disabled={currentPage >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>
                Próxima
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <CargoCatalogDialog
        cargosModalOpen={cargosModalOpen}
        setCargosModalOpen={setCargosModalOpen}
        cargos={cargos}
        onCreate={() => {
          setEditingCargo(null);
          setCargoFormOpen(true);
        }}
        onEdit={(cargo) => {
          setEditingCargo(cargo);
          setCargoFormOpen(true);
        }}
        onToggle={handleToggleCargo}
        onDelete={handleDeleteCargo}
        saving={saving}
      />
    </div>
  );
}

function CargoCatalogDialog({
  cargosModalOpen,
  setCargosModalOpen,
  cargos,
  onCreate,
  onEdit,
  onToggle,
  onDelete,
}: {
  cargosModalOpen: boolean;
  setCargosModalOpen: (open: boolean) => void;
  cargos: Cargo[];
  onCreate: () => void;
  onEdit: (cargo: Cargo) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  saving: boolean;
}) {
  return (
    <Dialog open={cargosModalOpen} onOpenChange={setCargosModalOpen}>
      <DialogContent className="border-border bg-card sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">Catálogo de cargos</DialogTitle>
        </DialogHeader>

        <div className="mb-4 flex justify-end">
          <Button onClick={onCreate}>Novo cargo</Button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary">
                <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Cargo</th>
                <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {cargos.map((cargo) => (
                <tr key={cargo.id} className="transition-colors hover:bg-secondary/40">
                  <td className="px-4 py-3 text-sm">{cargo.nome}</td>
                  <td className="px-4 py-3 text-sm">
                    <Badge className={cn("border-0", cargo.ativo ? "bg-gym-teal/15 text-gym-teal" : "bg-secondary text-muted-foreground")}>
                      {cargo.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <DataTableRowActions
                      actions={[
                        { label: "Editar", kind: "edit", onClick: () => onEdit(cargo) },
                        { label: cargo.ativo ? "Desativar" : "Ativar", kind: "toggle", onClick: () => onToggle(cargo.id) },
                        { label: "Remover", kind: "delete", onClick: () => onDelete(cargo.id) },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
