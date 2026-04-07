"use client";

import { useCallback, useMemo, useState } from "react";
import { Building2, Plus, Globe, CheckCircle2, AlertTriangle, ArrowRight, Search, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { BiMetricCard } from "@/components/shared/bi-metric-card";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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

  const academiaSuggestion = useAcademiaSuggestion();
  const [academiaSuggestionText, setAcademiaSuggestionText] = useState("");
  const [selectedAcademiaId, setSelectedAcademiaId] = useState("");

  const selectedAcademia = useMemo(
    () => academias.find((a) => a.id === selectedAcademiaId) ?? null,
    [academias, selectedAcademiaId],
  );

  const academiaIndex = useMemo(() => {
    const map = new Map<string, string>();
    academias.forEach((a) => map.set(a.id, a.nome));
    return map;
  }, [academias]);

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

  const showAcademiaColumn = !selectedAcademiaId;

  const filteredUnidades = useMemo(() => {
    let result = unidades;
    if (selectedAcademiaId) {
      result = result.filter((u) => (u.academiaId ?? u.groupId) === selectedAcademiaId);
    }
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
        ].filter(Boolean).join(" ").toLowerCase();
        return haystack.includes(searchTerm);
      });
    }
    const statusFilter = filters.status ?? "";
    if (statusFilter === "ativa") {
      result = result.filter((u) => u.ativo !== false);
    } else if (statusFilter === "inativa") {
      result = result.filter((u) => u.ativo === false);
    }
    const cidadeFilter = (filters.cidade ?? "").trim().toLowerCase();
    if (cidadeFilter) {
      result = result.filter((u) => (u.endereco?.cidade ?? "").toLowerCase().includes(cidadeFilter));
    }
    return result;
  }, [unidades, selectedAcademiaId, filters, academiaIndex]);

  const totalFiltered = filteredUnidades.length;
  const paginaItens = useMemo(
    () => filteredUnidades.slice(page * pageSize, page * pageSize + pageSize),
    [filteredUnidades, page, pageSize],
  );
  const hasNext = (page + 1) * pageSize < totalFiltered;

  const totalUnidades = unidades.length;
  const totalAtivas = unidades.filter((u) => u.ativo !== false).length;
  const totalAcademiasCount = useMemo(() => new Set(unidades.map((u) => u.academiaId ?? u.groupId).filter(Boolean)).size, [unidades]);

  const filterConfigs: FilterConfig[] = useMemo(() => [
    { type: "text", key: "busca", label: "Buscar", placeholder: "Nome, documento, subdominio...", debounceMs: 300 },
    { type: "select", key: "status", label: "Status", placeholder: "Todos", options: [ { value: "ativa", label: "Ativa" }, { value: "inativa", label: "Inativa" } ] },
    { type: "text", key: "cidade", label: "Cidade", placeholder: "Filtrar por cidade...", debounceMs: 300 },
  ], []);

  const columns = useMemo(() => [
    { label: "Unidade" },
    { label: "Documento" },
    ...(showAcademiaColumn ? [{ label: "Academia" }] : []),
    { label: "Localização" },
    { label: "Status" },
    { label: "Ações", className: "text-right" },
  ], [showAcademiaColumn]);

  return (
    <div className="flex flex-col gap-10 pb-20">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <p className="text-sm font-bold uppercase tracking-widest text-gym-accent mb-2">Ecossistema</p>
          <h1 className="text-4xl font-extrabold tracking-tight font-display sm:text-5xl">Unidades <span className="text-gym-accent">(Tenants)</span></h1>
          <p className="text-lg text-muted-foreground max-w-2xl mt-2">
            Gestão de instâncias operacionais, provisionamento e configurações de acesso por unidade.
          </p>
        </motion.div>
        <div className="flex gap-3">
          <Button 
            className="rounded-xl h-11 px-6 shadow-lg shadow-gym-accent/20 bg-gym-accent text-black font-bold hover:bg-gym-accent/90"
            onClick={() => {
              const params = new URLSearchParams();
              if (selectedAcademiaId) params.set("academiaId", selectedAcademiaId);
              const qs = params.toString();
              window.location.href = qs ? `/admin/unidades?${qs}` : "/admin/unidades";
            }}
          >
            <Plus className="mr-2 size-5" strokeWidth={3} /> Nova Unidade
          </Button>
        </div>
      </header>

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-gym-danger/30 bg-gym-danger/10 p-4 text-sm text-gym-danger flex items-center gap-3">
          <AlertTriangle size={20} />
          {error}
        </div>
      )}

      {/* Stats V2 */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <BiMetricCard label="Total de Unidades" value={String(totalUnidades)} icon={Globe} tone="accent" description="Instâncias configuradas" />
        <BiMetricCard label="Unidades Ativas" value={String(totalAtivas)} icon={CheckCircle2} tone="teal" description="Operando normalmente" />
        <BiMetricCard label="Academias Atendidas" value={String(totalAcademiasCount)} icon={Building2} tone="warning" description="Grupos econômicos únicos" />
      </div>

      {/* Main Container */}
      <div className="glass-card rounded-2xl border border-border/40 overflow-hidden shadow-xl shadow-black/5">
        <div className="p-6 border-b border-border/40 bg-muted/10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-1">
              <h3 className="font-display text-lg font-bold flex items-center gap-2">
                <Building2 className="size-5 text-gym-accent" />
                {selectedAcademia ? `Unidades de ${selectedAcademia.nome}` : "Todas as Unidades"}
              </h3>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">Listagem global de clientes SaaS</p>
            </div>
            
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">Filtro por Academia</span>
              <div className="flex items-center gap-2">
                <SuggestionInput
                  value={academiaSuggestionText}
                  onValueChange={(v) => {
                    setAcademiaSuggestionText(v);
                    if (!v.trim()) handleClearAcademia();
                  }}
                  onSelect={(option) => {
                    setAcademiaSuggestionText(option.label);
                    setSelectedAcademiaId(option.id);
                    setPage(0);
                  }}
                  options={academiaSuggestion.options}
                  onFocusOpen={academiaSuggestion.onFocusOpen}
                  placeholder="Selecione para filtrar..."
                  minCharsToSearch={1}
                  preloadOnFocus
                  className="w-72 h-11 bg-background/50 border-border/60 rounded-xl"
                />
                {selectedAcademiaId && (
                  <Button variant="ghost" size="sm" className="h-11 px-4 text-xs font-bold uppercase text-muted-foreground hover:text-gym-accent rounded-xl" onClick={handleClearAcademia}>
                    Limpar
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="pt-2">
            <TableFilters filters={filterConfigs} onFiltersChange={handleFiltersChange} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <PaginatedTable<Tenant>
            columns={columns}
            items={paginaItens}
            isLoading={loading}
            emptyText={selectedAcademia ? "Nenhuma unidade encontrada para esta academia." : "Nenhuma unidade registrada."}
            getRowKey={(item) => item.id}
            renderCells={(unit) => {
              const cidadeUf = [unit.endereco?.cidade, unit.endereco?.estado].filter(Boolean).join(" / ");
              return (
                <>
                  <TableCell className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground group-hover:bg-gym-accent/10 group-hover:text-gym-accent transition-colors">
                        <Building2 size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold tracking-tight">{unit.nome}</span>
                        <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-tighter">
                          {unit.subdomain ? `${unit.subdomain}.conceito.fit` : "Sem subdomínio"}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-5 text-sm font-medium text-foreground/70">{unit.documento || "---"}</TableCell>
                  {showAcademiaColumn && (
                    <TableCell className="px-4 py-5 text-sm font-medium text-foreground/70">
                      {academiaIndex.get(unit.academiaId ?? unit.groupId ?? "") ?? "---"}
                    </TableCell>
                  )}
                  <TableCell className="px-4 py-5">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin size={14} className="opacity-50" />
                      {cidadeUf || "Não informado"}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-5">
                    <Badge variant="outline" className={cn(
                      "text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border shadow-sm",
                      unit.ativo === false ? "border-muted bg-muted/10 text-muted-foreground" : "border-gym-teal/30 bg-gym-teal/10 text-gym-teal"
                    )}>
                      {unit.ativo === false ? "Inativa" : "Ativa"}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-5 text-right">
                    <DataTableRowActions
                      actions={[
                        { label: "Editar Unidade", kind: "edit", href: `/admin/unidades?edit=${encodeURIComponent(unit.id)}&academiaId=${encodeURIComponent(unit.academiaId ?? unit.groupId ?? "")}` },
                        { label: "Importação EVO", kind: "open", href: `/admin/importacao-evo?tenantId=${encodeURIComponent(unit.id)}` },
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
        </div>

        <div className="p-4 border-t border-border/40 bg-muted/5">
          {!loading && totalFiltered > 0 && (
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-2">
              {totalFiltered} Unidade{totalFiltered === 1 ? "" : "s"} Encontrada{totalFiltered === 1 ? "" : "s"}
              {selectedAcademia ? ` em ${selectedAcademia.nome}` : " na rede"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
