"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useAdminAcademiaDetail, useAdminUnidades, useUpdateAcademia } from "@/backoffice/query";
import type { Academia, Tenant } from "@/lib/types";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { zodResolver } from "@/lib/forms/zod-resolver";
import {
  applyApiFieldErrors,
  buildFormApiErrorMessage,
} from "@/lib/forms/api-form-errors";
import {
  backofficeAcademiaDetailSchema,
  buildBackofficeAcademiaDetailDefaults,
  type BackofficeAcademiaDetailForm,
} from "@/lib/forms/backoffice-academia-form";

function buildManageUnitHref(academiaId: string, unitId?: string) {
  const params = new URLSearchParams({ academiaId });
  if (unitId) {
    params.set("edit", unitId);
  } else {
    params.set("create", "1");
  }
  return `/admin/unidades?${params.toString()}`;
}

const EMPTY_UNIDADES: Tenant[] = [];

function buildForm(academia: Academia | null): BackofficeAcademiaDetailForm {
  return {
    nome: academia?.nome ?? "",
    razaoSocial: academia?.razaoSocial ?? "",
    documento: academia?.documento ?? "",
    email: academia?.email ?? "",
    telefone: academia?.telefone ?? "",
    ativo: academia?.ativo === false ? "INATIVA" : "ATIVA",
  };
}

export default function AcademiaDetalhePage() {
  const params = useParams();
  const id = params?.id as string;
  const { toast } = useToast();
  const academiaQuery = useAdminAcademiaDetail(id);
  const unidadesQuery = useAdminUnidades();
  const updateMutation = useUpdateAcademia();
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<BackofficeAcademiaDetailForm>({
    resolver: zodResolver(backofficeAcademiaDetailSchema),
    defaultValues: buildBackofficeAcademiaDetailDefaults(),
  });

  const loading = academiaQuery.isLoading || unidadesQuery.isLoading;
  const academia = academiaQuery.data ?? null;
  const unidades = unidadesQuery.data ?? EMPTY_UNIDADES;
  const error = academiaQuery.error || unidadesQuery.error
    ? normalizeErrorMessage(academiaQuery.error ?? unidadesQuery.error)
    : null;

  useEffect(() => {
    if (academiaQuery.data) {
      reset(buildForm(academiaQuery.data));
    }
  }, [academiaQuery.data, reset]);

  const unidadesDaAcademia = useMemo(
    () => unidades.filter((unit) => (unit.academiaId ?? unit.groupId) === id),
    [id, unidades]
  );

  const saving = updateMutation.isPending;

  const handleSave = handleSubmit(async (values) => {
    try {
      const updated = await updateMutation.mutateAsync({
        id,
        data: {
          nome: values.nome.trim(),
          razaoSocial: values.razaoSocial.trim() || undefined,
          documento: values.documento.trim() || undefined,
          email: values.email.trim() || undefined,
          telefone: values.telefone.trim() || undefined,
          ativo: values.ativo === "ATIVA",
        },
      });
      reset(buildForm(updated));
      toast({ title: "Academia atualizada", description: updated.nome });
    } catch (saveError) {
      const { appliedFields } = applyApiFieldErrors(saveError, setError);
      toast({
        title: "Não foi possível salvar a academia",
        description: buildFormApiErrorMessage(saveError, {
          appliedFields,
          fallbackMessage: normalizeErrorMessage(saveError),
        }),
        variant: "destructive",
      });
    }
  });

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-1">
        <p className="text-sm font-medium text-gym-accent">Admin &gt; Academias</p>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-display font-bold">
              {loading ? "Carregando..." : academia?.nome ?? "Academia não encontrada"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {loading ? "Carregando dados..." : academia?.documento || "Sem documento cadastrado"}
            </p>
          </div>
          <Button asChild variant="outline" className="border-border">
            <Link href="/admin/academias">Voltar para academias</Link>
          </Button>
        </div>
      </header>

      {error ? (
        <div className="rounded-xl border border-gym-danger/30 bg-gym-danger/10 px-4 py-3 text-sm text-gym-danger">
          {error}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados da academia</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="academia-detalhe-nome">Nome *</Label>
            <Input
              id="academia-detalhe-nome"
              disabled={loading || !academia}
              aria-invalid={errors.nome ? "true" : "false"}
              {...register("nome")}
            />
            {errors.nome ? <p className="text-xs text-gym-danger">{errors.nome.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="academia-detalhe-razao">Razão social</Label>
            <Input
              id="academia-detalhe-razao"
              disabled={loading || !academia}
              aria-invalid={errors.razaoSocial ? "true" : "false"}
              {...register("razaoSocial")}
            />
            {errors.razaoSocial ? <p className="text-xs text-gym-danger">{errors.razaoSocial.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="academia-detalhe-documento">Documento</Label>
            <Input
              id="academia-detalhe-documento"
              disabled={loading || !academia}
              aria-invalid={errors.documento ? "true" : "false"}
              {...register("documento")}
            />
            {errors.documento ? <p className="text-xs text-gym-danger">{errors.documento.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="academia-detalhe-email">E-mail</Label>
            <Input
              id="academia-detalhe-email"
              type="email"
              disabled={loading || !academia}
              aria-invalid={errors.email ? "true" : "false"}
              {...register("email")}
            />
            {errors.email ? <p className="text-xs text-gym-danger">{errors.email.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="academia-detalhe-telefone">Telefone</Label>
            <Input
              id="academia-detalhe-telefone"
              disabled={loading || !academia}
              aria-invalid={errors.telefone ? "true" : "false"}
              {...register("telefone")}
            />
            {errors.telefone ? <p className="text-xs text-gym-danger">{errors.telefone.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Controller
              control={control}
              name="ativo"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={loading || !academia}>
                  <SelectTrigger aria-label="Status da academia" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ATIVA">Ativa</SelectItem>
                    <SelectItem value="INATIVA">Inativa</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.ativo ? <p className="text-xs text-gym-danger">{errors.ativo.message}</p> : null}
          </div>

          <div className="md:col-span-2 flex justify-end">
            <Button onClick={handleSave} disabled={saving || loading || !academia}>
              {saving ? "Salvando..." : "Salvar academia"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">Unidades desta academia</CardTitle>
            <p className="text-sm text-muted-foreground">
              Crie uma nova unidade já vinculada a esta academia ou abra uma unidade existente para edição.
            </p>
          </div>
          {academia ? (
            <Button asChild variant="outline" className="border-border">
              <Link href={buildManageUnitHref(academia.id)}>Nova unidade</Link>
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? <p className="text-sm text-muted-foreground">Carregando unidades...</p> : null}
          {!loading && academia == null ? (
            <p className="text-sm text-muted-foreground">A academia solicitada não foi encontrada.</p>
          ) : null}
          {!loading && academia != null && unidadesDaAcademia.length === 0 ? (
            <div className="space-y-3 rounded-xl border border-dashed border-border px-4 py-4">
              <p className="text-sm text-muted-foreground">Nenhuma unidade vinculada.</p>
              <Button asChild variant="outline" className="border-border">
                <Link href={buildManageUnitHref(academia.id)}>Criar primeira unidade</Link>
              </Button>
            </div>
          ) : null}
          {!loading &&
            unidadesDaAcademia.map((unit) => (
              <div key={unit.id} className="flex flex-col gap-3 rounded-md border border-border px-3 py-3 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <p className="font-semibold">{unit.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {unit.subdomain || unit.id}
                    {unit.groupId ? ` · ${unit.groupId}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">{unit.email || unit.telefone || "Sem contato cadastrado"}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground">{unit.ativo === false ? "Inativa" : "Ativa"}</span>
                  <Button asChild variant="outline" size="sm" className="border-border">
                    <Link href={buildManageUnitHref(id, unit.id)}>Editar unidade</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="border-border">
                    <Link href={`/admin/importacao-evo?tenantId=${encodeURIComponent(unit.id)}`}>Importação</Link>
                  </Button>
                </div>
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
