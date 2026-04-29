"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@/lib/forms/zod-resolver";
import { applyApiFieldErrors, buildFormApiErrorMessage } from "@/lib/forms/api-form-errors";
import { Controller, useForm, useWatch, type FieldPath } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { CargoModal } from "@/components/shared/cargo-modal";
import { useAuthAccess } from "@/lib/tenant/hooks/use-session-context";
import { createCargoApi, createFuncionarioApi, updateCargoApi, updateFuncionarioApi } from "@/lib/api/administrativo";
import { buildQuickCreateColaboradorPayload } from "@/lib/tenant/administrativo-colaboradores";
import { buildFuncionarioProfileFormSchema } from "@/lib/tenant/forms/administrativo-schemas";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import type { Cargo, FuncionarioStatusAcesso, FuncionarioStatusOperacional } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useFuncionariosWorkspace } from "./use-funcionarios-workspace";
import {
  TAB_OPTIONS,
  TIPO_CONTRATACAO_OPTIONS,
  buildQuickCreateDraftFromForm,
  createFuncionarioFormDefaults,
  formValuesToFuncionario,
  funcionarioToFormValues,
  maskSensitive,
  statusTone,
  type FuncionarioFormValues,
} from "./shared";

type FuncionarioFormPageProps = {
  mode: "create" | "edit";
  funcionarioId?: string;
};

export function FuncionarioFormPage({ mode, funcionarioId }: FuncionarioFormPageProps) {
  const router = useRouter();
  const access = useAuthAccess();
  const canViewSensitiveData = access.canAccessElevatedModules;
  const {
    tenantContext,
    tenantOptions,
    funcionarios,
    setFuncionarios,
    cargos,
    activePerfis,
    loading,
    error,
    setError,
    loadWorkspace,
  } = useFuncionariosWorkspace();

  const [hasMounted, setHasMounted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<(typeof TAB_OPTIONS)[number]["value"]>("cadastro");
  const [cargoFormOpen, setCargoFormOpen] = useState(false);
  const [editingCargo, setEditingCargo] = useState<Cargo | null>(null);

  const funcionario = useMemo(
    () => (mode === "edit" ? funcionarios.find((item) => item.id === funcionarioId) ?? null : null),
    [funcionarioId, funcionarios, mode]
  );

  const form = useForm<FuncionarioFormValues>({
    resolver: zodResolver(buildFuncionarioProfileFormSchema(mode)),
    defaultValues: createFuncionarioFormDefaults(tenantContext.tenantId),
  });

  const values = (useWatch({ control: form.control }) ?? createFuncionarioFormDefaults(tenantContext.tenantId)) as FuncionarioFormValues;

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (mode === "edit") {
      if (funcionario) {
        form.reset(funcionarioToFormValues(funcionario));
      }
      return;
    }

    form.reset(createFuncionarioFormDefaults(tenantContext.tenantId));
  }, [form, funcionario, mode, tenantContext.tenantId]);

  useEffect(() => {
    if (mode !== "create") return;

    const tenantIds = form.getValues("tenantIds");
    const tenantBaseId = form.getValues("tenantBaseId");

    if (tenantContext.tenantId && tenantIds.length === 0) {
      form.setValue("tenantIds", [tenantContext.tenantId], { shouldDirty: false });
    }

    if (tenantContext.tenantId && !tenantBaseId) {
      form.setValue("tenantBaseId", tenantContext.tenantId, { shouldDirty: false });
    }
  }, [form, mode, tenantContext.tenantId]);

  useEffect(() => {
    const selectedBase = tenantOptions.find((tenant) => tenant.id === values.tenantBaseId);
    form.setValue("tenantBaseNome", selectedBase?.nome ?? "", { shouldDirty: false });
  }, [form, tenantOptions, values.tenantBaseId]);

  const pageTitle = mode === "create" ? "Novo colaborador" : "Ficha do colaborador";
  const pageDescription =
    mode === "create"
      ? "Crie o colaborador em uma rota dedicada, organizando cadastro, contratação, permissões, horários e notificações por abas."
      : "Atualize a ficha completa sem depender da listagem principal. A navegação por abas preserva contexto e deep-link por rota.";

  function mapApiField(field: string): FieldPath<FuncionarioFormValues> | null {
    const normalized = field.replace(/\[(\d+)\]/g, ".$1");
    switch (normalized) {
      case "tenantIdsAdicionais":
        return "tenantIds";
      case "acesso.email":
        return "emailProfissional";
      case "acesso.roleName":
        return "perfilAcessoInicialId";
      case "contratacao.tipoContratacao":
        return "contratacao.tipo";
      default:
        return normalized as FieldPath<FuncionarioFormValues>;
    }
  }

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

  async function onSubmit(submitted: FuncionarioFormValues) {
    setSaving(true);
    setError(null);
    setSuccess(null);
    form.clearErrors();

    try {
      if (mode === "create") {
        const draft = buildQuickCreateDraftFromForm(submitted);
        const payload = buildQuickCreateColaboradorPayload({
          draft,
          cargos,
          perfis: activePerfis,
          availableTenants: tenantOptions,
          currentTenantId: tenantContext.tenantId,
        });

        const created = await createFuncionarioApi(payload);
        setFuncionarios((current) => [created, ...current]);
        router.replace(`/administrativo/funcionarios/${created.id}`);
        return;
      }

      if (!funcionario) {
        setError("Colaborador não encontrado.");
        return;
      }

      const saved = await updateFuncionarioApi(funcionario.id, formValuesToFuncionario(submitted, funcionario));
      setFuncionarios((current) => current.map((item) => (item.id === saved.id ? saved : item)));
      form.reset(funcionarioToFormValues(saved));
      setSuccess("Ficha do colaborador atualizada.");
    } catch (saveError) {
      const { appliedFields } = applyApiFieldErrors(saveError, form.setError, {
        mapField: mapApiField,
      });
      setError(buildFormApiErrorMessage(saveError, {
        appliedFields,
        fallbackMessage: normalizeErrorMessage(saveError) || "Falha ao salvar colaborador.",
      }));
    } finally {
      setSaving(false);
    }
  }

  if (!hasMounted) {
    return (
      <div className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
        Carregando ficha de colaboradores...
      </div>
    );
  }

  if (mode === "edit" && !loading && !funcionario) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          Colaborador não encontrado para a rota informada.
        </div>
        <Button asChild variant="outline" className="border-border">
          <Link href="/administrativo/funcionarios">Voltar para a listagem</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-secondary/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                {mode === "create" ? "Onboarding" : "Ficha"}
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold tracking-tight">{pageTitle}</h1>
                <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{pageDescription}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" className="border-border">
                <Link href="/administrativo/funcionarios">Voltar para a listagem</Link>
              </Button>
              {mode === "edit" && funcionario ? (
                <>
                  <Badge className={cn("border-0", statusTone(funcionario.statusOperacional))}>
                    {funcionario.statusOperacional ?? "ATIVO"}
                  </Badge>
                  <Badge className={cn("border-0", statusTone(funcionario.statusAcesso))}>
                    {funcionario.statusAcesso ?? "SEM_ACESSO"}
                  </Badge>
                </>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-muted-foreground">
            Unidade ativa:
            <span className="ml-2 font-medium text-foreground">{tenantContext.tenantName || "Unidade ativa"}</span>
            {tenantContext.networkName ? (
              <>
                <span className="mx-2 text-border">•</span>
                Rede: <span className="ml-1 font-medium text-foreground">{tenantContext.networkName}</span>
              </>
            ) : null}
          </div>
          <Button
            variant="outline"
            className="border-border"
            onClick={() => {
              setEditingCargo(null);
              setCargoFormOpen(true);
            }}
          >
            Novo cargo
          </Button>
        </div>
      </section>

      {access.loading || tenantContext.loading || loading ? (
        <div className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          Carregando ficha de colaboradores...
        </div>
      ) : null}

      {error ? <div className="rounded-2xl border border-gym-danger/30 bg-gym-danger/10 px-4 py-3 text-sm text-gym-danger">{error}</div> : null}
      {success ? <div className="rounded-2xl border border-gym-teal/30 bg-gym-teal/10 px-4 py-3 text-sm text-gym-teal">{success}</div> : null}

      {!canViewSensitiveData ? (
        <div className="rounded-2xl border border-gym-warning/30 bg-gym-warning/10 px-4 py-3 text-sm text-gym-warning">
          Dados sensíveis de contratação e informações internas estão mascarados no seu contexto atual.
        </div>
      ) : null}

      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="border-border bg-card">
          <CardHeader>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle className="font-display text-xl">
                  {mode === "create" ? "Estruture a ficha desde o início" : "Perfil completo do colaborador"}
                </CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Cadastro, contratação, permissões, horários e comunicação em um único workspace operacional.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-secondary/20 px-4 py-3 text-sm">
                <p className="font-medium text-foreground">{values.nome || "Novo colaborador"}</p>
                <p className="text-muted-foreground">
                  {values.cargo || "Sem cargo definido"}
                  {values.emailProfissional ? ` • ${values.emailProfissional}` : ""}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="space-y-4">
              <TabsList className="grid h-auto grid-cols-2 gap-1 rounded-2xl bg-secondary/50 p-1 md:grid-cols-6">
                {TAB_OPTIONS.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value} className="rounded-xl">
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <div className="rounded-2xl border border-border bg-secondary/20 px-4 py-3">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-display text-xl font-semibold">{values.nome || "Novo colaborador"}</p>
                    <p className="text-sm text-muted-foreground">
                      {values.cargo || "Sem cargo definido"}
                      {values.emailProfissional ? ` • ${values.emailProfissional}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>
                      Origem: <span className="font-medium text-foreground">{values.origemCadastro ?? "MANUAL"}</span>
                    </span>
                    <span>
                      Base: <span className="font-medium text-foreground">{values.tenantBaseNome || tenantContext.tenantName || "Sem base"}</span>
                    </span>
                  </div>
                </div>
              </div>

              <TabsContent value="cadastro" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Nome completo" error={form.formState.errors.nome?.message}>
                    <Input aria-label="Nome do colaborador" {...form.register("nome")} className="border-border bg-secondary" />
                  </Field>
                  <Field label="Nome de registro" error={form.formState.errors.nomeRegistro?.message}>
                    <Input aria-label="Nome de registro" {...form.register("nomeRegistro")} className="border-border bg-secondary" />
                  </Field>
                  <Field label="Apelido">
                    <Input {...form.register("apelido")} className="border-border bg-secondary" />
                  </Field>
                  <Field label="Data de nascimento">
                    <Input type="date" {...form.register("dataNascimento")} className="border-border bg-secondary" />
                  </Field>
                  <Field label="CPF">
                    <Input {...form.register("cpf")} className="border-border bg-secondary" />
                  </Field>
                  <Field label="RG">
                    <Input {...form.register("rg")} className="border-border bg-secondary" />
                  </Field>
                  <Field label="E-mail profissional" error={form.formState.errors.emailProfissional?.message}>
                    <Input aria-label="E-mail profissional do colaborador" type="email" {...form.register("emailProfissional")} className="border-border bg-secondary" />
                  </Field>
                  <Field label="E-mail pessoal">
                    <Input {...form.register("emailPessoal")} className="border-border bg-secondary" />
                  </Field>
                  <Field label="Celular">
                    <Input aria-label="Contato principal do colaborador" {...form.register("celular")} className="border-border bg-secondary" />
                  </Field>
                  <Field label="Telefone">
                    <Input {...form.register("telefone")} className="border-border bg-secondary" />
                  </Field>
                  <Field label="Cargo">
                    <div className="flex gap-2">
                      <Controller
                        control={form.control}
                        name="cargoId"
                        render={({ field }) => (
                          <Select
                            value={field.value || "__none__"}
                            onValueChange={(value) => {
                              const nextValue = value === "__none__" ? "" : value;
                              field.onChange(nextValue);
                              const selectedCargo = cargos.find((cargo) => cargo.id === nextValue);
                              form.setValue("cargo", selectedCargo?.nome ?? "", { shouldDirty: true });
                            }}
                          >
                            <SelectTrigger aria-label="Cargo do colaborador" className="border-border bg-secondary">
                              <SelectValue placeholder="Selecione um cargo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">Sem cargo</SelectItem>
                              {cargos.filter((cargo) => cargo.ativo).map((cargo) => (
                                <SelectItem key={cargo.id} value={cargo.id}>
                                  {cargo.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="border-border"
                        onClick={() => {
                          setEditingCargo(null);
                          setCargoFormOpen(true);
                        }}
                      >
                        Novo cargo
                      </Button>
                    </div>
                  </Field>
                </div>

                <Separator />

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="CEP">
                    <Input {...form.register("endereco.cep")} className="border-border bg-secondary" />
                  </Field>
                  <Field label="Logradouro">
                    <Input {...form.register("endereco.logradouro")} className="border-border bg-secondary" />
                  </Field>
                  <Field label="Número">
                    <Input {...form.register("endereco.numero")} className="border-border bg-secondary" />
                  </Field>
                  <Field label="Complemento">
                    <Input {...form.register("endereco.complemento")} className="border-border bg-secondary" />
                  </Field>
                  <Field label="Bairro">
                    <Input {...form.register("endereco.bairro")} className="border-border bg-secondary" />
                  </Field>
                  <Field label="Cidade">
                    <Input {...form.register("endereco.cidade")} className="border-border bg-secondary" />
                  </Field>
                </div>

                <Separator />

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Contato de emergência">
                    <Input {...form.register("emergencia.nomeResponsavel")} className="border-border bg-secondary" />
                  </Field>
                  <Field label="Telefone de emergência">
                    <Input {...form.register("emergencia.telefoneResponsavel")} className="border-border bg-secondary" />
                  </Field>
                </div>
              </TabsContent>

              <TabsContent value="contratacao" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Tipo de contratação">
                    <Controller
                      control={form.control}
                      name="contratacao.tipo"
                      render={({ field }) => (
                        <Select value={field.value || "__none__"} onValueChange={(value) => field.onChange(value === "__none__" ? "" : value)}>
                          <SelectTrigger className="border-border bg-secondary">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">Não definido</SelectItem>
                            {TIPO_CONTRATACAO_OPTIONS.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </Field>
                  <Field label="Cargo contratual">
                    <Input {...form.register("contratacao.cargoContratual")} className="border-border bg-secondary" />
                  </Field>
                  <Field label="Data de admissão">
                    <Input type="date" {...form.register("contratacao.dataAdmissao")} className="border-border bg-secondary" />
                  </Field>
                  <Field label="Data de desligamento">
                    <Input type="date" {...form.register("contratacao.dataDemissao")} className="border-border bg-secondary" />
                  </Field>
                  <Field label="Salário atual" error={form.formState.errors.contratacao?.salarioAtual?.message}>
                    <Input
                      value={canViewSensitiveData ? values.contratacao.salarioAtual : String(maskSensitive(values.contratacao.salarioAtual, false))}
                      onChange={(event) => {
                        if (!canViewSensitiveData) return;
                        form.setValue("contratacao.salarioAtual", event.target.value, { shouldDirty: true });
                      }}
                      disabled={!canViewSensitiveData}
                      className="border-border bg-secondary"
                    />
                  </Field>
                  <Field label="Banco">
                    <Input
                      value={canViewSensitiveData ? values.contratacao.banco : String(maskSensitive(values.contratacao.banco, false))}
                      onChange={(event) => {
                        if (!canViewSensitiveData) return;
                        form.setValue("contratacao.banco", event.target.value, { shouldDirty: true });
                      }}
                      disabled={!canViewSensitiveData}
                      className="border-border bg-secondary"
                    />
                  </Field>
                </div>
              </TabsContent>

              <TabsContent value="permissoes" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="border-border bg-secondary/20">
                    <CardHeader>
                      <CardTitle className="text-base">Identidade e acesso</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {mode === "create" ? (
                        <label className="flex items-center justify-between gap-3 rounded-xl border border-border/70 px-3 py-2 text-sm">
                          <span>Criar acesso ao sistema</span>
                          <input
                            type="checkbox"
                            checked={values.criarAcessoSistema}
                            onChange={(event) => {
                              const checked = event.target.checked;
                              form.setValue("criarAcessoSistema", checked, { shouldDirty: true });
                              form.setValue("possuiAcessoSistema", checked, { shouldDirty: true });
                              form.setValue("statusAcesso", checked ? "CONVITE_PENDENTE" : "SEM_ACESSO", { shouldDirty: true });
                              form.setValue("provisionamentoAcesso", checked ? values.provisionamentoAcesso : "SEM_ACESSO", { shouldDirty: true });
                            }}
                          />
                        </label>
                      ) : (
                        <>
                          <label className="flex items-center justify-between gap-3 rounded-xl border border-border/70 px-3 py-2 text-sm">
                            <span>Acesso ao sistema</span>
                            <input
                              type="checkbox"
                              checked={values.possuiAcessoSistema}
                              onChange={(event) => form.setValue("possuiAcessoSistema", event.target.checked, { shouldDirty: true })}
                            />
                          </label>
                          <label className="flex items-center justify-between gap-3 rounded-xl border border-border/70 px-3 py-2 text-sm">
                            <span>Bloquear acesso</span>
                            <input
                              type="checkbox"
                              checked={values.bloqueiaAcessoSistema}
                              onChange={(event) => {
                                const checked = event.target.checked;
                                form.setValue("bloqueiaAcessoSistema", checked, { shouldDirty: true });
                                form.setValue("statusAcesso", checked ? "BLOQUEADO" : values.statusAcesso, { shouldDirty: true });
                              }}
                            />
                          </label>
                        </>
                      )}

                      <Field label="Status operacional">
                        <Controller
                          control={form.control}
                          name="statusOperacional"
                          render={({ field }) => (
                            <Select value={field.value} onValueChange={(value) => field.onChange(value as FuncionarioStatusOperacional)}>
                              <SelectTrigger className="border-border bg-secondary">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {["ATIVO", "BLOQUEADO", "INATIVO", "DESLIGADO"].map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </Field>

                      <Field label="Status de acesso">
                        <Controller
                          control={form.control}
                          name="statusAcesso"
                          render={({ field }) => (
                            <Select value={field.value} onValueChange={(value) => field.onChange(value as FuncionarioStatusAcesso)}>
                              <SelectTrigger className="border-border bg-secondary">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {["SEM_ACESSO", "ATIVO", "CONVITE_PENDENTE", "PRIMEIRO_ACESSO", "BLOQUEADO"].map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </Field>

                      {mode === "create" && values.criarAcessoSistema ? (
                        <>
                          <Field label="Provisionamento">
                            <Controller
                              control={form.control}
                              name="provisionamentoAcesso"
                              render={({ field }) => (
                                <Select value={field.value} onValueChange={(value) => field.onChange(value as typeof field.value)}>
                                  <SelectTrigger className="border-border bg-secondary">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="CONVITE">Enviar convite</SelectItem>
                                    <SelectItem value="REUTILIZAR_USUARIO">Vincular usuário existente</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          </Field>

                          <Field label="Perfil inicial" error={form.formState.errors.perfilAcessoInicialId?.message}>
                            <Controller
                              control={form.control}
                              name="perfilAcessoInicialId"
                              render={({ field }) => (
                                <Select value={field.value || "__none__"} onValueChange={(value) => field.onChange(value === "__none__" ? "" : value)}>
                                  <SelectTrigger aria-label="Perfil inicial de acesso" className="border-border bg-secondary">
                                    <SelectValue placeholder="Selecione um perfil" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="__none__">Selecione</SelectItem>
                                    {activePerfis.map((perfil) => (
                                      <SelectItem key={perfil.id} value={perfil.id}>
                                        {perfil.displayName}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          </Field>
                        </>
                      ) : null}
                    </CardContent>
                  </Card>

                  <Card className="border-border bg-secondary/20">
                    <CardHeader>
                      <CardTitle className="text-base">Flags locais</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3">
                      <BooleanRow
                        label="Ministra aulas"
                        checked={values.podeMinistrarAulas}
                        onChange={(checked) => form.setValue("podeMinistrarAulas", checked, { shouldDirty: true })}
                      />
                      <BooleanRow
                        label="Opera catraca"
                        checked={values.permiteCatraca}
                        onChange={(checked) => form.setValue("permiteCatraca", checked, { shouldDirty: true })}
                      />
                      <BooleanRow
                        label="Fora do horário"
                        checked={values.permiteForaHorario}
                        onChange={(checked) => form.setValue("permiteForaHorario", checked, { shouldDirty: true })}
                      />
                      <BooleanRow
                        label="Teclado de acesso"
                        checked={values.utilizaTecladoAcesso}
                        onChange={(checked) => form.setValue("utilizaTecladoAcesso", checked, { shouldDirty: true })}
                      />
                      <BooleanRow
                        label="Coordenação"
                        checked={values.coordenador}
                        onChange={(checked) => form.setValue("coordenador", checked, { shouldDirty: true })}
                      />
                    </CardContent>
                  </Card>
                </div>

                {mode === "create" ? (
                  <div className="space-y-3 rounded-2xl border border-border bg-secondary/20 p-4">
                    <div>
                      <p className="font-semibold text-foreground">Unidades iniciais</p>
                      <p className="text-sm text-muted-foreground">Defina memberships iniciais e a unidade base do colaborador.</p>
                    </div>
                    <div className="grid gap-2 md:grid-cols-2">
                      {tenantOptions.map((tenant) => (
                        <label key={tenant.id} className="flex items-start gap-2 rounded-xl border border-border/70 px-3 py-2 text-sm">
                          <input
                            type="checkbox"
                            checked={values.tenantIds.includes(tenant.id)}
                            onChange={(event) => {
                              const tenantIds = event.target.checked
                                ? [...new Set([...values.tenantIds, tenant.id])]
                                : values.tenantIds.filter((item) => item !== tenant.id);
                              form.setValue("tenantIds", tenantIds, { shouldDirty: true });
                              if (!tenantIds.includes(values.tenantBaseId)) {
                                form.setValue("tenantBaseId", tenantIds[0] ?? "", { shouldDirty: true });
                              }
                            }}
                          />
                          <span>
                            <span className="block font-medium text-foreground">{tenant.nome}</span>
                            <span className="block text-xs text-muted-foreground">{tenant.subdomain ?? tenant.id}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                    {form.formState.errors.tenantIds?.message ? <p className="text-xs text-gym-danger">{form.formState.errors.tenantIds.message}</p> : null}

                    <Field label="Unidade base" error={form.formState.errors.tenantBaseId?.message}>
                      <Controller
                        control={form.control}
                        name="tenantBaseId"
                        render={({ field }) => (
                          <Select value={field.value || "__none__"} onValueChange={(value) => field.onChange(value === "__none__" ? "" : value)}>
                            <SelectTrigger aria-label="Unidade base do colaborador" className="border-border bg-secondary">
                              <SelectValue placeholder="Selecione a unidade base" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">Selecione</SelectItem>
                              {tenantOptions
                                .filter((tenant) => values.tenantIds.includes(tenant.id))
                                .map((tenant) => (
                                  <SelectItem key={tenant.id} value={tenant.id}>
                                    {tenant.nome}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </Field>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-border bg-secondary/20 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground">Memberships por unidade</p>
                        <p className="text-sm text-muted-foreground">Acesso por unidade separado das flags locais do colaborador.</p>
                      </div>
                      <Badge variant="outline">{values.memberships.length} vínculo(s)</Badge>
                    </div>
                    <div className="mt-3 grid gap-2">
                      {values.memberships.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nenhum membership configurado no momento.</p>
                      ) : (
                        values.memberships.map((membership) => (
                          <div key={`${membership.tenantId}-${membership.roleName ?? membership.roleDisplayName ?? "membership"}`} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 px-3 py-2 text-sm">
                            <div>
                              <p className="font-medium text-foreground">{membership.tenantNome}</p>
                              <p className="text-xs text-muted-foreground">{membership.roleDisplayName ?? membership.roleName ?? "Sem role definida"}</p>
                            </div>
                            <div className="flex gap-2">
                              {membership.defaultTenant ? <Badge variant="outline">Base</Badge> : null}
                              <Badge className={cn("border-0", membership.active === false ? "bg-secondary text-muted-foreground" : "bg-gym-teal/15 text-gym-teal")}>
                                {membership.active === false ? "Inativo" : "Ativo"}
                              </Badge>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="horario" className="space-y-4">
                <div className="space-y-3 rounded-2xl border border-border bg-secondary/20 p-4">
                  <div>
                    <p className="font-semibold text-foreground">Jornada operacional</p>
                    <p className="text-sm text-muted-foreground">
                      Use esta aba para distinguir agenda de trabalho da permissão global de operar fora do horário.
                    </p>
                  </div>
                  {values.horarios.map((horario, index) => (
                    <div key={`${horario.diaSemana}-${index}`} className="grid gap-3 rounded-xl border border-border/70 px-3 py-3 md:grid-cols-[90px_1fr_1fr_auto_auto] md:items-center">
                      <div className="font-semibold text-foreground">{horario.diaSemana}</div>
                      <Input
                        type="time"
                        value={horario.horaInicio}
                        onChange={(event) => form.setValue(`horarios.${index}.horaInicio`, event.target.value, { shouldDirty: true })}
                        className="border-border bg-secondary"
                      />
                      <Input
                        type="time"
                        value={horario.horaFim}
                        onChange={(event) => form.setValue(`horarios.${index}.horaFim`, event.target.value, { shouldDirty: true })}
                        className="border-border bg-secondary"
                      />
                      <label className="flex items-center gap-2 text-sm text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={horario.ativo}
                          onChange={(event) => form.setValue(`horarios.${index}.ativo`, event.target.checked, { shouldDirty: true })}
                        />
                        Ativo
                      </label>
                      <label className="flex items-center gap-2 text-sm text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={horario.permiteForaHorario}
                          onChange={(event) => form.setValue(`horarios.${index}.permiteForaHorario`, event.target.checked, { shouldDirty: true })}
                        />
                        Extra
                      </label>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="informacoes" className="space-y-4">
                <div className="grid gap-4">
                  <Field label="Observações operacionais">
                    <Textarea {...form.register("observacoes")} className="min-h-28 border-border bg-secondary" />
                  </Field>
                  <Field label="Informações internas">
                    <Textarea
                      value={canViewSensitiveData ? values.informacoesInternas : String(maskSensitive(values.informacoesInternas, false))}
                      onChange={(event) => {
                        if (!canViewSensitiveData) return;
                        form.setValue("informacoesInternas", event.target.value, { shouldDirty: true });
                      }}
                      disabled={!canViewSensitiveData}
                      className="min-h-28 border-border bg-secondary"
                    />
                  </Field>
                </div>
              </TabsContent>

              <TabsContent value="notificacoes" className="space-y-4">
                <div className="grid gap-3 rounded-2xl border border-border bg-secondary/20 p-4">
                  <BooleanRow
                    label="Notificar por e-mail"
                    checked={values.notificacoes.email}
                    onChange={(checked) => form.setValue("notificacoes.email", checked, { shouldDirty: true })}
                  />
                  <BooleanRow
                    label="Notificar por WhatsApp"
                    checked={values.notificacoes.whatsapp}
                    onChange={(checked) => form.setValue("notificacoes.whatsapp", checked, { shouldDirty: true })}
                  />
                  <BooleanRow
                    label="Avisos de pendências operacionais"
                    checked={values.notificacoes.pendenciasOperacionais}
                    onChange={(checked) => form.setValue("notificacoes.pendenciasOperacionais", checked, { shouldDirty: true })}
                  />
                  <BooleanRow
                    label="Atualizações de escala"
                    checked={values.notificacoes.escala}
                    onChange={(checked) => form.setValue("notificacoes.escala", checked, { shouldDirty: true })}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            className="border-border"
            onClick={() => {
              if (mode === "edit" && funcionario) {
                form.reset(funcionarioToFormValues(funcionario));
                return;
              }
              form.reset(createFuncionarioFormDefaults(tenantContext.tenantId));
            }}
          >
            Descartar alterações
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Salvando..." : mode === "create" ? "Criar colaborador" : "Salvar ficha"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
      {children}
      {error ? <p className="text-xs text-gym-danger">{error}</p> : null}
    </div>
  );
}

function BooleanRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-border/70 px-3 py-2 text-sm">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}
