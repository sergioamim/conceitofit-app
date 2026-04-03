"use client";

import { useCallback, useMemo, useState } from "react";
import { Building2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TableCell } from "@/components/ui/table";
import { PaginatedTable } from "@/components/shared/paginated-table";
import {
  TableFilters,
  type ActiveFilters,
  type FilterConfig,
} from "@/components/shared/table-filters";
import { SuggestionInput } from "@/components/shared/suggestion-input";
import { DataTableRowActions } from "@/components/shared/data-table-row-actions";
import { useAcademiaSuggestion } from "@/backoffice/lib/use-academia-suggestion";
import { useAdminAcademias, useAdminUnidades } from "@/backoffice/query";
import type { Tenant } from "@/lib/types";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

type PageSize = 20 | 50 | 100;

export default function UnidadesPage() {
  const academiasQuery = useAdminAcademias();
  const unidadesQuery = useAdminUnidades();

  const loading = academiasQuery.isLoading || unidadesQuery.isLoading;
  const error =
    academiasQuery.error || unidadesQuery.error
      ? normalizeErrorMessage(academiasQuery.error ?? unidadesQuery.error)
      : null;

  const academias = academiasQuery.data ?? [];
  const unidades = unidadesQuery.data ?? [];

  // --- SuggestionInput para academia ---
  const academiaSuggestion = useAcademiaSuggestion();
  const [academiaSuggestionText, setAcademiaSuggestionText] = useState("");
  const [selectedAcademiaId, setSelectedAcademiaId] = useState("");

  const selectedAcademia = useMemo(
    () => academias.find((a) => a.id === selectedAcademiaId) ?? null,
    [academias, selectedAcademiaId],
  );

  // --- Index de academia por id ---
  const academiaIndex = useMemo(() => {
    const map = new Map<string, string>();
    academias.forEach((a) => map.set(a.id, a.nome));
    return map;
  }, [academias]);

  // --- Filtros via TableFilters ---
  const [filters, setFilters] = useState<ActiveFilters>({});
  const [page, setPage] = useState(0);
  const [pageSize] = useState<PageSize>(20);

  const handleFiltersChange = useCallback((active: ActiveFilters) => {
    setFilters(active);
    setPage(0);
  }, []);

  const handleClearAcademia = useCallback(() => {
    setSelectedAcademiaId("");
    setAcademiaSuggestionText("");
    setPage(0);
  }, []);

  // --- Colunas visiveis dependem se academia foi selecionada ---
  const showAcademiaColumn = !selectedAcademiaId;

  // --- Filtragem ---
  const filteredUnidades = useMemo(() => {
    let result = unidades;

    // Filtro por academia selecionada
    if (selectedAcademiaId) {
      result = result.filter(
        (u) => (u.academiaId ?? u.groupId) === selectedAcademiaId,
      );
    }

    // Filtro textual (busca)
    const searchTerm = (filters.busca ?? "").trim().toLowerCase();
    if (searchTerm) {
      result = result.filter((u) => {
        const haystack = [
          u.nome,
          u.razaoSocial,
          u.documento,
          u.subdomain,
          u.email,
          u.endereco?.cidade,
          u.endereco?.estado,
          academiaIndex.get(u.academiaId ?? u.groupId ?? ""),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(searchTerm);
      });
    }

    // Filtro por status
    const statusFilter = filters.status ?? "";
    if (statusFilter === "ativa") {
      result = result.filter((u) => u.ativo !== false);
    } else if (statusFilter === "inativa") {
      result = result.filter((u) => u.ativo === false);
    }

    // Filtro por cidade
    const cidadeFilter = (filters.cidade ?? "").trim().toLowerCase();
    if (cidadeFilter) {
      result = result.filter((u) =>
        (u.endereco?.cidade ?? "").toLowerCase().includes(cidadeFilter),
      );
    }

    return result;
  }, [unidades, selectedAcademiaId, filters, academiaIndex]);

  // --- Paginacao ---
  const totalFiltered = filteredUnidades.length;
  const paginaItens = useMemo(
    () => filteredUnidades.slice(page * pageSize, page * pageSize + pageSize),
    [filteredUnidades, page, pageSize],
  );
  const hasNext = (page + 1) * pageSize < totalFiltered;

  // --- Stats ---
  const totalUnidades = unidades.length;
  const totalAtivas = unidades.filter((u) => u.ativo !== false).length;
  const totalAcademias = useMemo(
    () =>
      new Set(
        unidades
          .map((u) => u.academiaId ?? u.groupId)
          .filter(Boolean),
      ).size,
    [unidades],
  );

  // --- FilterConfig ---
  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        type: "text" as const,
        key: "busca",
        label: "Buscar",
        placeholder: "Nome, documento, subdominio...",
        debounceMs: 300,
      },
      {
        type: "select" as const,
        key: "status",
        label: "Status",
        placeholder: "Todos",
        options: [
          { value: "ativa", label: "Ativa" },
          { value: "inativa", label: "Inativa" },
        ],
      },
      {
        type: "text" as const,
        key: "cidade",
        label: "Cidade",
        placeholder: "Filtrar por cidade...",
        debounceMs: 300,
      },
    ],
    [],
  );

  // --- Colunas da tabela ---
  const columns = useMemo(() => {
    const base = [
      { label: "Nome" },
      { label: "CNPJ" },
      ...(showAcademiaColumn ? [{ label: "Academia" }] : []),
      { label: "Cidade / UF" },
      { label: "Status" },
      { label: "Acoes", className: "text-right" },
    ];
    return base;
  }, [showAcademiaColumn]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="space-y-2">
        <p className="text-sm font-medium text-gym-accent">
          Admin &gt; Unidades
        </p>
        <h1 className="font-display text-3xl font-bold">
          Unidades (tenants)
        </h1>
        <p className="text-sm text-muted-foreground">
          Consulte e gerencie as unidades cadastradas. Selecione uma academia
          para filtrar ou veja todas as unidades da rede.
        </p>
      </header>

      {/* Error */}
      {error ? (
        <div className="rounded-xl border border-gym-danger/30 bg-gym-danger/10 px-4 py-3 text-sm text-gym-danger">
          {error}
        </div>
      ) : null}

      {/* Stats */}
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Total de unidades
          </p>
          <p className="mt-2 text-2xl font-bold text-gym-accent">
            {loading ? "..." : totalUnidades}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Unidades ativas
          </p>
          <p className="mt-2 text-2xl font-bold text-gym-teal">
            {loading ? "..." : totalAtivas}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Academias atendidas
          </p>
          <p className="mt-2 text-2xl font-bold text-gym-warning">
            {loading ? "..." : totalAcademias}
          </p>
        </div>
      </div>

      {/* Seletor de academia + Filtros + Tabela */}
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="size-4 text-gym-accent" />
              {selectedAcademia
                ? `Unidades de ${selectedAcademia.nome}`
                : "Todas as unidades"}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {selectedAcademia
                ? "Mostrando somente as unidades da academia selecionada."
                : "Selecione uma academia no filtro para restringir a listagem."}
            </p>
          </div>
          <Button
            variant="outline"
            className="gap-1.5 border-border"
            onClick={() => {
              const params = new URLSearchParams();
              if (selectedAcademiaId) params.set("academiaId", selectedAcademiaId);
              const qs = params.toString();
              window.location.href = qs ? `/admin/unidades?${qs}` : "/admin/unidades";
            }}
          >
            <Plus className="size-3.5" />
            Nova unidade
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* SuggestionInput de academia */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Academia
              </span>
              <div className="flex items-center gap-2">
                <SuggestionInput
                  value={academiaSuggestionText}
                  onValueChange={(v) => {
                    setAcademiaSuggestionText(v);
                    if (!v.trim()) {
                      handleClearAcademia();
                    }
                  }}
                  onSelect={(option) => {
                    setAcademiaSuggestionText(option.label);
                    setSelectedAcademiaId(option.id);
                    setPage(0);
                  }}
                  options={academiaSuggestion.options}
                  onFocusOpen={academiaSuggestion.onFocusOpen}
                  placeholder="Filtrar por academia..."
                  minCharsToSearch={1}
                  preloadOnFocus
                  className="w-64"
                />
                {selectedAcademiaId && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-9 text-xs text-muted-foreground hover:text-foreground"
                    onClick={handleClearAcademia}
                  >
                    Limpar
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* TableFilters */}
          <TableFilters
            filters={filterConfigs}
            onFiltersChange={handleFiltersChange}
          />

          {/* PaginatedTable */}
          <PaginatedTable<Tenant>
            columns={columns}
            items={paginaItens}
            isLoading={loading}
            emptyText={
              selectedAcademia
                ? "Nenhuma unidade encontrada para a academia selecionada."
                : "Nenhuma unidade encontrada."
            }
            getRowKey={(item) => item.id}
            renderCells={(unit) => {
              const cidadeUf = [unit.endereco?.cidade, unit.endereco?.estado]
                .filter(Boolean)
                .join(" / ");

              return (
                <>
                  <TableCell className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">
                        {unit.nome}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {unit.subdomain || "Sem subdominio"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                    {unit.documento || "---"}
                  </TableCell>
                  {showAcademiaColumn && (
                    <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                      {academiaIndex.get(unit.academiaId ?? unit.groupId ?? "") ??
                        "---"}
                    </TableCell>
                  )}
                  <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                    {cidadeUf || "---"}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={
                        unit.ativo === false
                          ? "border-muted bg-muted/30 text-muted-foreground"
                          : "border-gym-teal/30 bg-gym-teal/10 text-gym-teal"
                      }
                    >
                      {unit.ativo === false ? "Inativa" : "Ativa"}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    <DataTableRowActions
                      actions={[
                        {
                          label: "Editar",
                          kind: "edit",
                          href: `/admin/unidades?edit=${encodeURIComponent(unit.id)}&academiaId=${encodeURIComponent(unit.academiaId ?? unit.groupId ?? "")}`,
                        },
                        {
                          label: "Importacao",
                          kind: "open",
                          href: `/admin/importacao-evo?tenantId=${encodeURIComponent(unit.id)}`,
                        },
                      ]}
                    />
                  </TableCell>
                </>
              );
            }}
            page={page}
            pageSize={pageSize}
            total={totalFiltered}
            hasNext={hasNext}
            onPrevious={() => setPage((p) => Math.max(0, p - 1))}
            onNext={() => setPage((p) => p + 1)}
            itemLabel="unidades"
            tableAriaLabel="Tabela de unidades"
            showPagination={totalFiltered > pageSize}
          />

          {!loading && totalFiltered > 0 && (
            <p className="text-xs text-muted-foreground">
              {totalFiltered} unidade{totalFiltered === 1 ? "" : "s"}{" "}
              encontrada{totalFiltered === 1 ? "" : "s"}
              {selectedAcademia ? ` em ${selectedAcademia.nome}` : ""}.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
