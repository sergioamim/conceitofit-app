"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PaginatedTable } from "@/components/shared/paginated-table";
import { DataTableRowActions } from "@/components/shared/data-table-row-actions";
import { getUnidadeOnboardingStatusLabel, getUnidadeOnboardingStrategyLabel } from "@/lib/backoffice/onboarding";
import { Tenant } from "@/lib/types";
import { UnidadesWorkspace, PageSize } from "../hooks/use-unidades-workspace";

interface UnitsTableCardProps {
  workspace: UnidadesWorkspace;
}

export function UnitsTableCard({ workspace }: UnitsTableCardProps) {
  const {
    loading,
    selectedAcademia,
    busca,
    setBusca,
    page,
    setPage,
    pageSize,
    setPageSize,
    paginaItens,
    unidadesFiltradas,
    hasNext,
    academiaIndex,
    onboardingIndex,
    onboardingWarning,
    resetForm,
    handleEdit,
    handleToggle,
    resolveAcademiaId,
  } = workspace;

  function buildManageUnitHref(academiaId?: string, unitId?: string) {
    const params = new URLSearchParams();
    if (academiaId) params.set("academiaId", academiaId);
    if (unitId) params.set("edit", unitId);
    const query = params.toString();
    return query ? `/admin/unidades?${query}` : "/admin/unidades";
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-base">
            {selectedAcademia ? `Unidades de ${selectedAcademia.nome}` : "Unidades cadastradas"}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {selectedAcademia
              ? "Edite uma unidade existente ou inicie uma nova criação já vinculada à academia selecionada."
              : "Selecione uma academia para filtrar a operação."}
          </p>
        </div>
        {selectedAcademia ? (
          <Button variant="outline" className="border-border" onClick={() => resetForm(selectedAcademia.id)}>
            Nova unidade
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-72 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(event) => {
                setBusca(event.target.value);
                setPage(0);
              }}
              placeholder="Buscar por unidade, grupo, documento, subdomínio ou contato"
              className="pl-8"
            />
          </div>
          <div className="w-full max-w-44">
            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                setPageSize(Number(value) as PageSize);
                setPage(0);
              }}
            >
              <SelectTrigger className="w-full bg-secondary border-border text-xs">
                <SelectValue placeholder="Itens por página" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="20">20 por página</SelectItem>
                <SelectItem value="50">50 por página</SelectItem>
                <SelectItem value="100">100 por página</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <PaginatedTable<Tenant>
          columns={[
            { label: "Unidade" },
            { label: "Academia" },
            { label: "Onboarding" },
            { label: "Grupo / contato" },
            { label: "Status" },
            { label: "Ações" },
          ]}
          items={paginaItens}
          emptyText={
            loading
              ? "Carregando unidades..."
              : selectedAcademia
                ? "Nenhuma unidade encontrada para a academia selecionada."
                : "Nenhuma unidade encontrada."
          }
          getRowKey={(item) => item.id}
          renderCells={(unit) => {
            const academiaNome = academiaIndex.get(resolveAcademiaId(unit))?.nome ?? "—";
            const onboardingState = onboardingIndex.get(unit.id);
            return (
              <>
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">{unit.nome}</span>
                    <span className="text-xs text-muted-foreground">
                      {unit.subdomain || "Sem subdomínio"}
                      {unit.documento ? ` · ${unit.documento}` : ""}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{academiaNome}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{getUnidadeOnboardingStrategyLabel(onboardingState?.estrategia)}</Badge>
                      <Badge variant="outline">{getUnidadeOnboardingStatusLabel(onboardingState?.status)}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {onboardingState?.ultimaMensagem ||
                        (onboardingWarning
                          ? "Abra a unidade para consultar ou atualizar o onboarding."
                          : "Sem histórico operacional.")}
                    </span>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>EVO: {onboardingState?.evoFilialId || "não vinculado"}</span>
                      <span>Eventos: {onboardingState?.eventos?.length ?? 0}</span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  <div>{unit.groupId || "Sem grupo"}</div>
                  <div>{unit.email || unit.telefone || "Sem contato"}</div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      unit.ativo === false ? "bg-muted text-muted-foreground" : "bg-gym-teal/15 text-gym-teal"
                    }`}
                  >
                    {unit.ativo === false ? "Inativa" : "Ativa"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <DataTableRowActions
                    actions={[
                      {
                        label: "Importação",
                        kind: "open",
                        href: `/admin/importacao-evo?tenantId=${encodeURIComponent(unit.id)}`,
                      },
                      {
                        label: "Editar",
                        kind: "edit",
                        onClick: () => void handleEdit(unit),
                      },
                      {
                        label: unit.ativo === false ? "Ativar" : "Desativar",
                        kind: "toggle",
                        onClick: () => void handleToggle(unit),
                      },
                    ]}
                  />
                </td>
              </>
            );
          }}
          page={page}
          pageSize={pageSize}
          total={unidadesFiltradas.length}
          hasNext={hasNext}
          onPrevious={() => setPage((current) => Math.max(0, current - 1))}
          onNext={() => setPage((current) => current + 1)}
          itemLabel="unidades"
          showPagination={unidadesFiltradas.length > pageSize}
        />

        {selectedAcademia ? (
          <p className="text-xs text-muted-foreground">
            Acesso direto desta academia:
            <Link href={buildManageUnitHref(selectedAcademia.id)} className="ml-1 text-gym-accent underline underline-offset-4">
              compartilhar filtro atual
            </Link>
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
