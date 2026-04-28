"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { PaginatedTable } from "@/components/shared/paginated-table";
import { SuggestionInput, type SuggestionOption } from "@/components/shared/suggestion-input";
import { useAdminAcademias, useAdminUnidades, useCreateAcademia } from "@/backoffice/query";
import type { Academia, Tenant } from "@/lib/types";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { zodResolver } from "@/lib/forms/zod-resolver";
import {
  applyApiFieldErrors,
  buildFormApiErrorMessage,
} from "@/lib/forms/api-form-errors";
import {
  backofficeAcademiaCreateSchema,
  buildBackofficeAcademiaCreateDefaults,
  type BackofficeAcademiaCreateForm,
} from "@/lib/forms/backoffice-academia-form";

type PageSize = 20 | 50 | 100 | 200;
const EMPTY_ACADEMIAS: Academia[] = [];
const EMPTY_UNIDADES: Tenant[] = [];

export default function AcademiasPage() {
  const router = useRouter();
  const { toast } = useToast();
  const academiasQuery = useAdminAcademias();
  const unidadesQuery = useAdminUnidades();
  const createMutation = useCreateAcademia();
  const [busca, setBusca] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<PageSize>(20);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<BackofficeAcademiaCreateForm>({
    resolver: zodResolver(backofficeAcademiaCreateSchema),
    defaultValues: buildBackofficeAcademiaCreateDefaults(),
  });

  const loading = academiasQuery.isLoading || unidadesQuery.isLoading;
  const academias = academiasQuery.data ?? EMPTY_ACADEMIAS;
  const unidades = unidadesQuery.data ?? EMPTY_UNIDADES;
  const error = academiasQuery.error || unidadesQuery.error
    ? normalizeErrorMessage(academiasQuery.error ?? unidadesQuery.error)
    : null;

  const unidadesPorAcademia = useMemo(() => {
    const map = new Map<string, number>();
    unidades.forEach((u) => {
      const id = u.academiaId ?? u.groupId;
      if (!id) return;
      map.set(id, (map.get(id) ?? 0) + 1);
    });
    return map;
  }, [unidades]);

  const totalUnidades = unidades.length;

  const academiaOptions = useMemo<SuggestionOption[]>(
    () =>
      academias.map((a) => ({
        id: a.id,
        label: a.nome,
        searchText: `${a.nome} ${a.documento ?? ""} ${a.razaoSocial ?? ""}`,
      })),
    [academias]
  );

  const academiasFiltradas = useMemo(() => {
    const term = busca.trim().toLowerCase();
    if (!term) return academias;

    const rawDigits = term.replace(/\D/g, "");
    return academias.filter((a) => {
      const nome = a.nome.toLowerCase();
      const razao = (a.razaoSocial ?? "").toLowerCase();
      const doc = (a.documento ?? "").toLowerCase();
      const termoDoc = (a.documento ?? "").replace(/\D/g, "");

      if (nome.includes(term) || razao.includes(term) || doc.includes(term)) return true;
      if (rawDigits && termoDoc && termoDoc.includes(rawDigits)) return true;
      return false;
    });
  }, [academias, busca]);

  const hasNext = (page + 1) * pageSize < academiasFiltradas.length;
  const paginaItens = useMemo(
    () => academiasFiltradas.slice(page * pageSize, page * pageSize + pageSize),
    [academiasFiltradas, page, pageSize]
  );

  const saving = createMutation.isPending;

  const handleCreate = handleSubmit(async (values) => {
    if (loading) {
      return;
    }
    try {
      const created = await createMutation.mutateAsync({
        nome: values.nome.trim(),
        documento: values.documento.trim() || undefined,
        ativo: true,
      });
      reset(buildBackofficeAcademiaCreateDefaults());
      toast({ title: "Academia criada", description: created.nome });
      setBusca("");
      setPage(0);
    } catch (createError) {
      const { appliedFields } = applyApiFieldErrors(createError, setError);
      toast({
        title: "Não foi possível criar a academia",
        description: buildFormApiErrorMessage(createError, {
          appliedFields,
          fallbackMessage: normalizeErrorMessage(createError),
        }),
        variant: "destructive",
      });
    }
  });

  function handleSearchChange(nextValue: string) {
    setBusca(nextValue);
    setPage(0);
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-gym-accent">Admin &gt; Academias</p>
        <h1 className="text-3xl font-display font-bold">Academias</h1>
        <p className="text-sm text-muted-foreground">Cadastro e consulta de academias da rede.</p>
      </header>

      {error ? (
        <div className="rounded-xl border border-gym-danger/30 bg-gym-danger/10 px-4 py-3 text-sm text-gym-danger">
          {error}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cadastrar nova academia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="academia-nome">Nome *</Label>
            <Input
              id="academia-nome"
              placeholder="Conceito Fit - Rede Norte"
              disabled={loading || saving}
              aria-invalid={errors.nome ? "true" : "false"}
              {...register("nome")}
            />
            {errors.nome ? <p className="text-xs text-gym-danger">{errors.nome.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="academia-doc">Documento</Label>
            <Input
              id="academia-doc"
              placeholder="CNPJ"
              disabled={loading || saving}
              aria-invalid={errors.documento ? "true" : "false"}
              {...register("documento")}
            />
            {errors.documento ? <p className="text-xs text-gym-danger">{errors.documento.message}</p> : null}
          </div>
          <div className="flex justify-end">
            <Button onClick={handleCreate} disabled={saving || loading}>
              {saving ? "Criando..." : "Criar academia"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total de academias</p>
          <p className="mt-2 text-2xl font-bold text-gym-accent">{loading ? "…" : academias.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total de unidades</p>
          <p className="mt-2 text-2xl font-bold text-gym-teal">{loading ? "…" : totalUnidades}</p>
        </div>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Academias cadastradas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <SuggestionInput
                value={busca}
                onValueChange={handleSearchChange}
                onSelect={(option) => {
                  setBusca(option.label);
                  setPage(0);
                }}
                options={academiaOptions}
                placeholder="Buscar por nome, razão social ou documento"
                minCharsToSearch={1}
                className="pl-8"
              />
            </div>
            <div className="w-full max-w-44">
              <Select
                value={String(pageSize)}
                onValueChange={(v) => {
                  setPageSize(Number(v) as PageSize);
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
                  <SelectItem value="200">200 por página</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {busca && (
              <Button variant="outline" size="sm" onClick={() => handleSearchChange("")}>
                Limpar
              </Button>
            )}
          </div>

          <PaginatedTable<Academia>
            columns={[
              { label: "Nome" },
              { label: "Documento" },
              { label: "Razão social" },
              { label: "Unidades" },
              { label: "Status" },
            ]}
            items={paginaItens}
            emptyText={loading ? "Carregando academias..." : "Nenhuma academia encontrada."}
            getRowKey={(a) => a.id}
            onRowClick={(a) => router.push(`/admin/academias/${a.id}`)}
            rowClassName={() => "cursor-pointer transition-colors hover:bg-secondary/40"}
            renderCells={(a) => (
              <>
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">{a.nome}</span>
                    <span className="text-xs text-muted-foreground">{a.email || "Sem e-mail"}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{a.documento || "—"}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{a.razaoSocial || "—"}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{unidadesPorAcademia.get(a.id) ?? 0}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{a.ativo === false ? "Inativa" : "Ativa"}</td>
              </>
            )}
            page={page}
            pageSize={pageSize}
            total={academiasFiltradas.length}
            hasNext={hasNext}
            onPrevious={() => setPage((p) => Math.max(0, p - 1))}
            onNext={() => setPage((p) => p + 1)}
            itemLabel="academias"
            showPagination={academiasFiltradas.length > pageSize}
          />

          {!loading && academiasFiltradas.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma academia encontrada para o filtro aplicado.</p>
          )}

          {academiasFiltradas.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {academiasFiltradas.length} resultado{academiasFiltradas.length === 1 ? "" : "s"}
            </p>
          )}

          <p className="text-xs text-muted-foreground">
            Para acesso rápido ao cadastro de unidade, use a listagem de Unidades.
            <Link href="/admin/unidades" className="ml-1 text-gym-accent underline underline-offset-4">
              Ir para unidades
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
