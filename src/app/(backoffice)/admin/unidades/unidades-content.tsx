"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { Building2, CheckCircle2, Globe, MapPin, Pencil, Plus, Power } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TableCell } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { PaginatedTable } from "@/components/shared/paginated-table";
import { TableFilters, type ActiveFilters, type FilterConfig } from "@/components/shared/table-filters";
import { DataTableRowActions } from "@/components/shared/data-table-row-actions";
import { BiMetricCard } from "@/components/shared/bi-metric-card";
import {
  useAdminAcademias,
  useAdminUnidades,
  useCreateUnidade,
  useDeleteUnidade,
  useToggleUnidade,
  useUpdateUnidade,
} from "@/backoffice/query";
import type { Academia, Tenant } from "@/lib/types";
import { cn } from "@/lib/utils";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { zodResolver } from "@/lib/forms/zod-resolver";
import { applyApiFieldErrors, buildFormApiErrorMessage } from "@/lib/forms/api-form-errors";
import { ApiRequestError } from "@/lib/api/http";
import {
  backofficeUnidadeSchema,
  buildBackofficeUnidadeDefaults,
  buildBackofficeUnidadePayload,
  mapBackofficeUnidadeFieldError,
  type BackofficeUnidadeFormValues,
} from "@/lib/forms/backoffice-unidade-form";
import { UnidadeEditorDialog } from "./unidade-editor-dialog";
import {
  UnidadeDeleteDialog,
} from "./unidade-delete-dialog";

type PageSize = 20 | 50 | 100;
const EMPTY_ACADEMIAS: Academia[] = [];
const EMPTY_UNIDADES: Tenant[] = [];
type UnidadeBlockedBy = { type?: string; message: string };

function parseDeleteError(error: unknown): { message: string; blockedBy: UnidadeBlockedBy[] } {
  if (error instanceof ApiRequestError) {
    let blockedBy: UnidadeBlockedBy[] = [];
    if (error.responseBody) {
      try {
        const parsed = JSON.parse(error.responseBody) as { blockedBy?: UnidadeBlockedBy[] };
        if (Array.isArray(parsed.blockedBy)) {
          blockedBy = parsed.blockedBy.filter(
            (item): item is UnidadeBlockedBy =>
              typeof item?.message === "string" && item.message.trim().length > 0,
          );
        }
      } catch {
        blockedBy = [];
      }
    }
    if (error.status === 409) {
      return {
        message: blockedBy[0]?.message ?? "A unidade possui dependências que impedem a exclusão.",
        blockedBy,
      };
    }
  }
  return { message: normalizeErrorMessage(error), blockedBy: [] };
}

export function UnidadesContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const academiasQuery = useAdminAcademias();
  const unidadesQuery = useAdminUnidades();
  const createMutation = useCreateUnidade();
  const updateMutation = useUpdateUnidade();
  const toggleMutation = useToggleUnidade();
  const deleteMutation = useDeleteUnidade();
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<BackofficeUnidadeFormValues>({
    resolver: zodResolver(backofficeUnidadeSchema),
    defaultValues: buildBackofficeUnidadeDefaults(),
  });

  const loading = academiasQuery.isLoading || unidadesQuery.isLoading;
  const academias = academiasQuery.data ?? EMPTY_ACADEMIAS;
  const unidades = unidadesQuery.data ?? EMPTY_UNIDADES;
  const error =
    academiasQuery.error || unidadesQuery.error
      ? normalizeErrorMessage(academiasQuery.error ?? unidadesQuery.error)
      : null;

  const selectedAcademiaId = (searchParams.get("academiaId") ?? "").trim();
  const editingId = (searchParams.get("edit") ?? "").trim();
  const isCreateMode = searchParams.get("create") === "1";
  const editorOpen = isCreateMode || Boolean(editingId);
  const editingUnit = useMemo(
    () => unidades.find((item) => item.id === editingId) ?? null,
    [editingId, unidades],
  );
  const saving = createMutation.isPending || updateMutation.isPending;
  const [deleteTarget, setDeleteTarget] = useState<Tenant | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleteBlockedBy, setDeleteBlockedBy] = useState<UnidadeBlockedBy[]>([]);

  const academiaIndex = useMemo(() => {
    const map = new Map<string, string>();
    academias.forEach((item) => map.set(item.id, item.nome));
    return map;
  }, [academias]);

  const [filters, setFilters] = useState<ActiveFilters>({});
  const [page, setPage] = useState(0);
  const pageSize: PageSize = 20;

  const selectedAcademia = useMemo(
    () => academias.find((item) => item.id === selectedAcademiaId) ?? null,
    [academias, selectedAcademiaId],
  );

  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      { type: "text", key: "busca", label: "Buscar", placeholder: "Nome, documento, subdominio...", debounceMs: 300 },
      {
        type: "select",
        key: "status",
        label: "Status",
        placeholder: "Todos",
        options: [
          { value: "ativa", label: "Ativa" },
          { value: "inativa", label: "Inativa" },
        ],
      },
      { type: "text", key: "cidade", label: "Cidade", placeholder: "Filtrar por cidade...", debounceMs: 300 },
    ],
    [],
  );

  const syncQuery = useCallback(
    (updates: Record<string, string | null | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value && value.trim()) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });
      const next = params.toString();
      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    if (!editorOpen) {
      return;
    }
    reset(buildBackofficeUnidadeDefaults(editingUnit, selectedAcademiaId));
  }, [editingUnit, editorOpen, reset, selectedAcademiaId]);

  const filteredUnidades = useMemo(() => {
    let result = unidades;
    if (selectedAcademiaId) {
      result = result.filter((item) => (item.academiaId ?? item.groupId) === selectedAcademiaId);
    }

    const searchTerm = (filters.busca ?? "").trim().toLowerCase();
    if (searchTerm) {
      result = result.filter((item) => {
        const haystack = [
          item.nome,
          item.razaoSocial,
          item.documento,
          item.subdomain,
          item.email,
          item.endereco?.cidade,
          item.endereco?.estado,
          academiaIndex.get(item.academiaId ?? item.groupId ?? ""),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(searchTerm);
      });
    }

    if (filters.status === "ativa") {
      result = result.filter((item) => item.ativo !== false);
    } else if (filters.status === "inativa") {
      result = result.filter((item) => item.ativo === false);
    }

    const cidadeFilter = (filters.cidade ?? "").trim().toLowerCase();
    if (cidadeFilter) {
      result = result.filter((item) => (item.endereco?.cidade ?? "").toLowerCase().includes(cidadeFilter));
    }

    return result;
  }, [academiaIndex, filters, selectedAcademiaId, unidades]);

  const totalFiltered = filteredUnidades.length;
  const paginaItens = useMemo(
    () => filteredUnidades.slice(page * pageSize, page * pageSize + pageSize),
    [filteredUnidades, page],
  );
  const hasNext = (page + 1) * pageSize < totalFiltered;

  const totalUnidades = unidades.length;
  const totalAtivas = unidades.filter((item) => item.ativo !== false).length;
  const totalAcademiasCount = useMemo(
    () => new Set(unidades.map((item) => item.academiaId ?? item.groupId).filter(Boolean)).size,
    [unidades],
  );

  const handleFiltersChange = useCallback((active: ActiveFilters) => {
    setFilters(active);
    setPage(0);
  }, []);

  const openCreate = useCallback(() => {
    syncQuery({
      create: "1",
      edit: null,
      academiaId: selectedAcademiaId || null,
    });
  }, [selectedAcademiaId, syncQuery]);

  const openEdit = useCallback(
    (unit: Tenant) => {
      syncQuery({
        create: null,
        edit: unit.id,
        academiaId: unit.academiaId ?? unit.groupId ?? selectedAcademiaId ?? null,
      });
    },
    [selectedAcademiaId, syncQuery],
  );

  const closeEditor = useCallback(() => {
    reset(buildBackofficeUnidadeDefaults(null, selectedAcademiaId));
    syncQuery({ create: null, edit: null });
  }, [reset, selectedAcademiaId, syncQuery]);

  const handleSave = handleSubmit(async (values) => {
    try {
      const payload = buildBackofficeUnidadePayload(values);
      const saved = editingId
        ? await updateMutation.mutateAsync({ id: editingId, data: payload })
        : await createMutation.mutateAsync(payload);

      toast({
        title: editingId ? "Unidade atualizada" : "Unidade criada",
        description: saved.nome,
      });
      closeEditor();
    } catch (saveError) {
      const { appliedFields } = applyApiFieldErrors(saveError, setError, {
        mapField: mapBackofficeUnidadeFieldError,
      });
      toast({
        title: editingId ? "Não foi possível salvar a unidade" : "Não foi possível criar a unidade",
        description: buildFormApiErrorMessage(saveError, {
          appliedFields,
          fallbackMessage: normalizeErrorMessage(saveError),
        }),
        variant: "destructive",
      });
    }
  });

  async function handleToggle(unit: Tenant) {
    try {
      const updated = await toggleMutation.mutateAsync(unit.id);
      toast({
        title: updated.ativo === false ? "Unidade inativada" : "Unidade ativada",
        description: updated.nome,
      });
    } catch (toggleError) {
      toast({
        title: "Não foi possível alterar o status",
        description: normalizeErrorMessage(toggleError),
        variant: "destructive",
      });
    }
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    setDeleteError("");
    setDeleteBlockedBy([]);

    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast({
        title: "Unidade excluída",
        description: deleteTarget.nome,
      });
      setDeleteTarget(null);
    } catch (deleteFailure) {
      const parsed = parseDeleteError(deleteFailure);
      setDeleteError(parsed.message);
      setDeleteBlockedBy(parsed.blockedBy);
    }
  }

  const showAcademiaColumn = !selectedAcademiaId;

  return (
    <div className="flex flex-col gap-10 pb-20">
      <UnidadeEditorDialog
        open={editorOpen}
        isEditing={Boolean(editingId)}
        academias={academias}
        saving={saving}
        errors={errors}
        control={control}
        register={register}
        onClose={closeEditor}
        onSubmit={handleSave}
      />
      <UnidadeDeleteDialog
        unit={deleteTarget}
        pending={deleteMutation.isPending}
        error={deleteError}
        blockedBy={deleteBlockedBy}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
      />

      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <p className="mb-2 text-sm font-bold uppercase tracking-widest text-gym-accent">Ecossistema</p>
          <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
            Unidades <span className="text-gym-accent">(Tenants)</span>
          </h1>
          <p className="mt-2 max-w-2xl text-lg text-muted-foreground">
            Gestão de instâncias operacionais, provisionamento e configurações de acesso por unidade.
          </p>
        </motion.div>
        <Button
          className="h-11 rounded-xl bg-gym-accent px-6 font-bold text-black shadow-lg shadow-gym-accent/20 hover:bg-gym-accent/90"
          onClick={openCreate}
        >
          <Plus className="mr-2 size-5" strokeWidth={3} /> Nova unidade
        </Button>
      </header>

      {error ? (
        <div className="flex items-center gap-3 rounded-2xl border border-gym-danger/30 bg-gym-danger/10 p-4 text-sm text-gym-danger">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <BiMetricCard label="Total de Unidades" value={String(totalUnidades)} icon={Globe} tone="accent" description="Instâncias configuradas" />
        <BiMetricCard label="Unidades Ativas" value={String(totalAtivas)} icon={CheckCircle2} tone="teal" description="Operando normalmente" />
        <BiMetricCard label="Academias Atendidas" value={String(totalAcademiasCount)} icon={Building2} tone="warning" description="Grupos econômicos únicos" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/40 shadow-xl shadow-black/5">
        <div className="space-y-6 border-b border-border/40 bg-muted/10 p-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="space-y-1">
              <h3 className="flex items-center gap-2 font-display text-lg font-bold">
                <Building2 className="size-5 text-gym-accent" />
                {selectedAcademia ? `Unidades de ${selectedAcademia.nome}` : "Todas as Unidades"}
              </h3>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Listagem global de clientes SaaS</p>
            </div>

            <div className="flex min-w-72 flex-col gap-1">
              <span className="ml-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Filtro por Academia</span>
                  <Select
                    value={selectedAcademiaId || "__all__"}
                    onValueChange={(value) => {
                  setPage(0);
                  syncQuery({ academiaId: value === "__all__" ? null : value });
                }}
              >
                <SelectTrigger className="h-11 rounded-xl border-border/60 bg-background/50">
                  <SelectValue placeholder="Selecione a academia" />
                </SelectTrigger>
                <SelectContent className="border-border bg-card">
                        <SelectItem value="__all__">Todas as academias</SelectItem>
                  {academias.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="pt-2">
            <TableFilters filters={filterConfigs} onFiltersChange={handleFiltersChange} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <PaginatedTable<Tenant>
            columns={[
              { label: "Unidade" },
              { label: "Documento" },
              ...(showAcademiaColumn ? [{ label: "Academia" }] : []),
              { label: "Localização" },
              { label: "Status" },
              { label: "Ações", className: "text-right" },
            ]}
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
                      <div className="flex size-10 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground transition-colors group-hover:bg-gym-accent/10 group-hover:text-gym-accent">
                        <Building2 size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold tracking-tight">{unit.nome}</span>
                        <span className="text-[11px] font-mono uppercase tracking-tighter text-muted-foreground">
                          {unit.subdomain ? `${unit.subdomain}.conceito.fit` : "Sem subdomínio"}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-5 text-sm font-medium text-foreground/70">{unit.documento || "---"}</TableCell>
                  {showAcademiaColumn ? (
                    <TableCell className="px-4 py-5 text-sm font-medium text-foreground/70">
                      {academiaIndex.get(unit.academiaId ?? unit.groupId ?? "") ?? "---"}
                    </TableCell>
                  ) : null}
                  <TableCell className="px-4 py-5">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin size={14} className="opacity-50" />
                      {cidadeUf || "Não informado"}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-5">
                    <Badge
                      variant="outline"
                      className={cn(
                        "rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest shadow-sm",
                        unit.ativo === false
                          ? "border-muted bg-muted/10 text-muted-foreground"
                          : "border-gym-teal/30 bg-gym-teal/10 text-gym-teal",
                      )}
                    >
                      {unit.ativo === false ? "Inativa" : "Ativa"}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-5 text-right">
                    <DataTableRowActions
                      actions={[
                        {
                          label: "Editar unidade",
                          kind: "edit",
                          onClick: () => openEdit(unit),
                          icon: Pencil,
                        },
                        {
                          label: unit.ativo === false ? "Ativar unidade" : "Inativar unidade",
                          kind: "toggle",
                          onClick: () => void handleToggle(unit),
                          icon: Power,
                        },
                        {
                          label: "Importação EVO",
                          kind: "open",
                          href: `/admin/importacao-evo?tenantId=${encodeURIComponent(unit.id)}`,
                        },
                        {
                          label: "Excluir unidade",
                          kind: "delete",
                          onClick: () => {
                            setDeleteError("");
                            setDeleteBlockedBy([]);
                            setDeleteTarget(unit);
                          },
                        },
                      ]}
                      className="justify-end"
                    />
                  </TableCell>
                </>
              );
            }}
            page={page}
            pageSize={pageSize}
            total={totalFiltered}
            hasNext={hasNext}
            onPrevious={() => setPage((current) => Math.max(0, current - 1))}
            onNext={() => setPage((current) => current + 1)}
            itemLabel="unidades"
            tableAriaLabel="Tabela de unidades"
            showPagination={totalFiltered > pageSize}
          />
        </div>

        <div className="border-t border-border/40 bg-muted/5 p-4">
          {!loading && totalFiltered > 0 ? (
            <p className="ml-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
              {totalFiltered} Unidade{totalFiltered === 1 ? "" : "s"} Encontrada{totalFiltered === 1 ? "" : "s"}
              {selectedAcademia ? ` em ${selectedAcademia.nome}` : " na rede"}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
