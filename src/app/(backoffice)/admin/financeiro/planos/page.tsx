"use client";

import { useMemo, useState } from "react";
import { z } from "zod";
import { CrudModal, type FormFieldConfig } from "@/components/shared/crud-modal";
import { DataTableRowActions } from "@/components/shared/data-table-row-actions";
import { ListErrorState } from "@/components/shared/list-states";
import { PaginatedTable } from "@/components/shared/paginated-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  createAdminPlano,
  toggleAdminPlano,
  updateAdminPlano,
} from "@/backoffice/api/admin-billing";
import { useAdminPlanos } from "@/backoffice/query";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { formatBRL } from "@/lib/formatters";
import { requiredTrimmedString } from "@/lib/forms/zod-helpers";
import type { CicloPlanoPlataforma, PlanoPlataforma } from "@/lib/types";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

type PageSize = 10 | 20 | 50;

type PlanoFormValues = {
  nome: string;
  descricao?: string;
  precoMensal: string;
  precoAnual?: string;
  ciclo: CicloPlanoPlataforma;
  maxUnidades?: string;
  maxAlunos?: string;
  featuresIncluidasText?: string;
  ativo: boolean;
};

const PAGE_SIZES: PageSize[] = [10, 20, 50];

const CICLO_OPTIONS: { value: CicloPlanoPlataforma; label: string }[] = [
  { value: "MENSAL", label: "Mensal" },
  { value: "ANUAL", label: "Anual" },
];

const FIELDS: FormFieldConfig[] = [
  { name: "nome", label: "Nome *", type: "text", required: true, className: "md:col-span-2" },
  { name: "ciclo", label: "Ciclo *", type: "select", options: CICLO_OPTIONS, className: "space-y-1.5" },
  { name: "precoMensal", label: "Preço mensal *", type: "number", required: true, min: 0, step: "0.01" },
  { name: "precoAnual", label: "Preço anual", type: "number", min: 0, step: "0.01" },
  { name: "maxUnidades", label: "Máx. unidades", type: "number", min: 1, step: "1" },
  { name: "maxAlunos", label: "Máx. alunos", type: "number", min: 1, step: "1" },
  {
    name: "descricao",
    label: "Descrição",
    type: "textarea",
    placeholder: "Resumo comercial e escopo do plano.",
    className: "md:col-span-3",
  },
  {
    name: "featuresIncluidasText",
    label: "Features incluídas",
    type: "textarea",
    placeholder: "Uma feature por linha",
    className: "md:col-span-3",
  },
  {
    name: "ativo",
    label: "Status",
    type: "checkbox",
    checkboxLabel: "Plano ativo para novas contratações",
    className: "md:col-span-3",
  },
];

const planoFormSchema = z.object({
  nome: requiredTrimmedString("Informe o nome do plano."),
  descricao: z.string().trim().optional(),
  precoMensal: z.string().trim().min(1, "Informe o preço mensal.").refine(
    (value) => Number.isFinite(Number(value.replace(",", "."))),
    { message: "Informe um preço mensal válido." }
  ),
  precoAnual: z.string().trim().optional(),
  ciclo: z.enum(["MENSAL", "ANUAL"]).default("MENSAL"),
  maxUnidades: z.string().trim().optional(),
  maxAlunos: z.string().trim().optional(),
  featuresIncluidasText: z.string().trim().optional(),
  ativo: z.boolean().default(true),
});

function parseNumberString(value: string | undefined, fallback?: number): number | undefined {
  const normalized = value?.trim();
  if (!normalized) return fallback;
  const parsed = Number(normalized.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseFeatures(value?: string): string[] {
  if (!value) return [];
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toFormValues(plano: PlanoPlataforma): PlanoFormValues {
  return {
    nome: plano.nome,
    descricao: plano.descricao ?? "",
    precoMensal: String(plano.precoMensal),
    precoAnual: plano.precoAnual != null ? String(plano.precoAnual) : "",
    ciclo: plano.ciclo,
    maxUnidades: plano.maxUnidades != null ? String(plano.maxUnidades) : "",
    maxAlunos: plano.maxAlunos != null ? String(plano.maxAlunos) : "",
    featuresIncluidasText: plano.featuresIncluidas.join("\n"),
    ativo: plano.ativo,
  };
}

function buildPayload(values: PlanoFormValues): Omit<PlanoPlataforma, "id"> {
  return {
    nome: values.nome.trim(),
    descricao: values.descricao?.trim() || undefined,
    precoMensal: parseNumberString(values.precoMensal, 0) ?? 0,
    precoAnual: parseNumberString(values.precoAnual),
    ciclo: values.ciclo,
    maxUnidades: parseNumberString(values.maxUnidades),
    maxAlunos: parseNumberString(values.maxAlunos),
    featuresIncluidas: parseFeatures(values.featuresIncluidasText),
    ativo: values.ativo,
  };
}

function getCicloLabel(ciclo: CicloPlanoPlataforma) {
  return ciclo === "ANUAL" ? "Anual" : "Mensal";
}

export default function AdminPlanosPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const planosQuery = useAdminPlanos();
  const loading = planosQuery.isLoading;
  const error = planosQuery.error ? normalizeErrorMessage(planosQuery.error) : null;
  const planos = planosQuery.data ?? [];
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PlanoPlataforma | null>(null);

  const filteredPlanos = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return planos;
    return planos.filter((plano) =>
      [
        plano.nome,
        plano.descricao ?? "",
        getCicloLabel(plano.ciclo),
        plano.featuresIncluidas.join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [planos, search]);

  const pageItems = useMemo(
    () => filteredPlanos.slice(page * pageSize, page * pageSize + pageSize),
    [filteredPlanos, page, pageSize]
  );

  const hasNext = (page + 1) * pageSize < filteredPlanos.length;
  const totalAtivos = useMemo(() => planos.filter((plano) => plano.ativo).length, [planos]);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(0);
  }

  function handleOpenCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function handleOpenEdit(plano: PlanoPlataforma) {
    setEditing(plano);
    setModalOpen(true);
  }

  function handleCloseModal() {
    setModalOpen(false);
    setEditing(null);
  }

  async function handleSave(values: PlanoFormValues, id?: string) {
    setSaving(true);
    try {
      const payload = buildPayload(values);
      const saved = id ? await updateAdminPlano(id, payload) : await createAdminPlano(payload);
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.financeiro.planos() });
      setPage(0);
      handleCloseModal();
      toast({
        title: id ? "Plano atualizado" : "Plano criado",
        description: saved.nome,
      });
    } catch (saveError) {
      toast({
        title: "Não foi possível salvar o plano",
        description: normalizeErrorMessage(saveError),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(plano: PlanoPlataforma) {
    try {
      const toggled = await toggleAdminPlano(plano.id);
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.financeiro.planos() });
      toast({
        title: toggled.ativo ? "Plano reativado" : "Plano inativado",
        description: toggled.nome,
      });
    } catch (toggleError) {
      toast({
        title: "Não foi possível alterar o status do plano",
        description: normalizeErrorMessage(toggleError),
        variant: "destructive",
      });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-gym-accent">Admin &gt; Financeiro &gt; Planos</p>
        <h1 className="font-display text-3xl font-bold">Planos da plataforma</h1>
        <p className="text-sm text-muted-foreground">
          Cadastro global dos planos comerciais contratados pelas academias.
        </p>
      </header>

      {error ? <ListErrorState error={error} onRetry={() => void planosQuery.refetch()} /> : null}

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total de planos</p>
          <p className="mt-2 text-2xl font-bold text-gym-accent">{loading ? "…" : planos.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ativos</p>
          <p className="mt-2 text-2xl font-bold text-gym-teal">{loading ? "…" : totalAtivos}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Inativos</p>
          <p className="mt-2 text-2xl font-bold text-gym-warning">{loading ? "…" : planos.length - totalAtivos}</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-base">Gestão de planos</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Controle preços, limites e o catálogo de features por plano.
            </p>
          </div>
          <Button onClick={handleOpenCreate}>Novo plano</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-72 flex-1">
              <Input
                value={search}
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder="Buscar por nome, descrição ou feature"
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
                <SelectTrigger className="w-full border-border bg-secondary text-xs">
                  <SelectValue placeholder="Itens por página" />
                </SelectTrigger>
                <SelectContent className="border-border bg-card">
                  {PAGE_SIZES.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size} por página
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {search ? (
              <Button variant="outline" size="sm" onClick={() => handleSearchChange("")}>
                Limpar
              </Button>
            ) : null}
          </div>

          <PaginatedTable<PlanoPlataforma>
            columns={[
              { label: "Plano" },
              { label: "Mensal" },
              { label: "Anual" },
              { label: "Limites" },
              { label: "Features" },
              { label: "Status" },
              { label: "Ações", className: "text-right" },
            ]}
            items={pageItems}
            emptyText={loading ? "Carregando planos..." : "Nenhum plano encontrado."}
            isLoading={loading}
            getRowKey={(plano) => plano.id}
            page={page}
            pageSize={pageSize}
            total={filteredPlanos.length}
            hasNext={hasNext}
            onPrevious={() => setPage((current) => Math.max(0, current - 1))}
            onNext={() => setPage((current) => current + 1)}
            itemLabel="planos"
            showPagination={filteredPlanos.length > pageSize}
            renderCells={(plano) => (
              <>
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">{plano.nome}</span>
                    <span className="text-xs text-muted-foreground">
                      {plano.descricao || `Cobrança ${getCicloLabel(plano.ciclo).toLowerCase()}`}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{formatBRL(plano.precoMensal)}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {plano.precoAnual != null ? formatBRL(plano.precoAnual) : "—"}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {`Unidades: ${plano.maxUnidades ?? "Ilimitado"} · Alunos: ${plano.maxAlunos ?? "Ilimitado"}`}
                </td>
                <td className="px-4 py-3">
                  <div className="flex max-w-sm flex-wrap gap-1">
                    {plano.featuresIncluidas.length > 0 ? (
                      plano.featuresIncluidas.slice(0, 3).map((feature) => (
                        <Badge key={feature} variant="secondary" className="border-border bg-secondary text-xs">
                          {feature}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">Sem features</span>
                    )}
                    {plano.featuresIncluidas.length > 3 ? (
                      <Badge variant="outline" className="text-xs">
                        +{plano.featuresIncluidas.length - 3}
                      </Badge>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant={plano.ativo ? "default" : "outline"}
                    className={plano.ativo ? "bg-gym-teal text-white hover:bg-gym-teal/90" : ""}
                  >
                    {plano.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <DataTableRowActions
                      actions={[
                        {
                          kind: "edit",
                          label: "Editar plano",
                          onClick: () => handleOpenEdit(plano),
                        },
                        {
                          kind: "toggle",
                          label: plano.ativo ? "Inativar plano" : "Reativar plano",
                          onClick: () => void handleToggle(plano),
                        },
                      ]}
                    />
                  </div>
                </td>
              </>
            )}
          />
        </CardContent>
      </Card>

      <CrudModal<PlanoFormValues>
        open={modalOpen}
        onClose={handleCloseModal}
        onSave={(values, id) => {
          void handleSave(values, id);
        }}
        initial={editing ? toFormValues(editing) : null}
        initialId={editing?.id}
        title="Novo plano"
        editTitle="Editar plano"
        description="Cadastre nome, preço, limites e features do plano."
        editDescription="Atualize o plano e o status comercial disponível para a rede."
        fields={FIELDS}
        schema={planoFormSchema}
        fieldsClassName="grid gap-4 py-2 md:grid-cols-3"
        contentClassName="border-border bg-card sm:max-w-3xl"
        submitLabel={saving ? "Criando..." : "Criar plano"}
        editSubmitLabel={saving ? "Salvando..." : "Salvar plano"}
      />
    </div>
  );
}
