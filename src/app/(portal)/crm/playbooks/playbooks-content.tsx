"use client";

import { useState } from "react";
import { type FieldPath, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@/lib/forms/zod-resolver";
import { getActiveTenantIdFromSession } from "@/lib/api/session";
import { applyApiFieldErrors, buildFormApiErrorMessage } from "@/lib/forms/api-form-errors";
import {
  useCrmCadencias,
  useCrmPlaybooks,
  useSaveCadencia,
  useSavePlaybook,
} from "@/lib/query/use-crm-playbooks";
import type { CrmCadencia, CrmTaskPrioridade, CrmPlaybook } from "@/lib/types";
import {
  buildDefaultCrmPipelineStages,
  CRM_CADENCIA_ACTION_LABEL,
  CRM_CADENCIA_TRIGGER_LABEL,
  CRM_TASK_PRIORITY_LABEL,
} from "@/lib/tenant/crm/workspace";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { formatDateTime } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  cadenciaFormSchema,
  EMPTY_CADENCIA_FORM_VALUES,
  EMPTY_PLAYBOOK_FORM_VALUES,
  type CadenciaFormValues,
  type PlaybookFormValues,
  playbookFormSchema,
} from "./playbooks-form-schema";

function normalizeFieldErrorPath(field: string): string {
  return field.replace(/\[(\d+)\]/g, ".$1");
}

function mapPlaybookFieldError(field: string): FieldPath<PlaybookFormValues> | null {
  const normalized = normalizeFieldErrorPath(field);
  if (/^etapas\.\d+$/.test(normalized)) {
    return `${normalized}.value` as FieldPath<PlaybookFormValues>;
  }
  if (["nome", "descricao", "ativo", "prioridadePadrao", "prazoHorasPadrao", "etapas"].includes(normalized)) {
    return normalized as FieldPath<PlaybookFormValues>;
  }
  return null;
}

function mapCadenciaFieldError(field: string): FieldPath<CadenciaFormValues> | null {
  const normalized = normalizeFieldErrorPath(field);
  if (normalized.startsWith("passos.")) {
    return normalized as FieldPath<CadenciaFormValues>;
  }
  if (["nome", "objetivo", "stageStatus", "gatilho", "ativo", "passos"].includes(normalized)) {
    return normalized as FieldPath<CadenciaFormValues>;
  }
  return null;
}

function toPlaybookFormValues(playbook?: CrmPlaybook | null): PlaybookFormValues {
  if (!playbook) return EMPTY_PLAYBOOK_FORM_VALUES;
  return {
    nome: playbook.nome,
    descricao: playbook.descricao ?? "",
    ativo: playbook.ativo,
    prioridadePadrao: playbook.prioridadePadrao ?? "MEDIA",
    prazoHorasPadrao: playbook.prazoHorasPadrao ?? 24,
    etapas: playbook.etapas.length > 0 ? playbook.etapas.map((etapa) => ({ value: etapa })) : [{ value: "" }],
  };
}

function toCadenciaFormValues(cadencia?: CrmCadencia | null): CadenciaFormValues {
  if (!cadencia) return EMPTY_CADENCIA_FORM_VALUES;
  return {
    nome: cadencia.nome,
    objetivo: cadencia.objetivo,
    stageStatus: cadencia.stageStatus,
    gatilho: cadencia.gatilho,
    ativo: cadencia.ativo,
    passos: cadencia.passos.length > 0
      ? cadencia.passos.map((step) => ({
          titulo: step.titulo,
          acao: step.acao,
          delayDias: step.delayDias,
          template: step.template ?? "",
          automatica: step.automatica,
        }))
      : EMPTY_CADENCIA_FORM_VALUES.passos,
  };
}

function toPlaybookPayload(values: PlaybookFormValues) {
  return {
    nome: values.nome.trim(),
    descricao: values.descricao?.trim() ? values.descricao.trim() : undefined,
    ativo: values.ativo,
    prioridadePadrao: values.prioridadePadrao,
    prazoHorasPadrao: Number(values.prazoHorasPadrao),
    etapas: values.etapas.map((etapa) => etapa.value.trim()),
  };
}

function toCadenciaPayload(values: CadenciaFormValues) {
  return {
    nome: values.nome.trim(),
    objetivo: values.objetivo.trim(),
    stageStatus: values.stageStatus,
    gatilho: values.gatilho,
    ativo: values.ativo,
    passos: values.passos.map((step) => ({
      titulo: step.titulo.trim(),
      acao: step.acao,
      delayDias: Number(step.delayDias),
      template: step.template?.trim() ? step.template.trim() : undefined,
      automatica: step.automatica,
    })),
  };
}

const PRIORIDADES_PLAYBOOK = Object.keys(CRM_TASK_PRIORITY_LABEL) as CrmTaskPrioridade[];

export default function PlaybooksContent() {
  const tenantContext = useTenantContext();
  const tenantId = tenantContext.tenantId || getActiveTenantIdFromSession() || "";
  const stages = buildDefaultCrmPipelineStages(tenantId || "tenant-runtime");

  const [editingPlaybook, setEditingPlaybook] = useState<CrmPlaybook | null>(null);
  const [editingCadencia, setEditingCadencia] = useState<CrmCadencia | null>(null);
  const [playbookSubmitError, setPlaybookSubmitError] = useState<string | null>(null);
  const [cadenciaSubmitError, setCadenciaSubmitError] = useState<string | null>(null);

  const { data: playbooks = [], isLoading: playbooksLoading } = useCrmPlaybooks({ tenantId });
  const { data: cadencias = [], isLoading: cadenciasLoading, isError: cadenciasError } = useCrmCadencias({ tenantId });
  const savePlaybookMutation = useSavePlaybook(tenantId);
  const saveCadenciaMutation = useSaveCadencia(tenantId);

  const playbookForm = useForm<PlaybookFormValues>({
    resolver: zodResolver(playbookFormSchema),
    defaultValues: EMPTY_PLAYBOOK_FORM_VALUES,
    mode: "onChange",
  });
  const cadenciaForm = useForm<CadenciaFormValues>({
    resolver: zodResolver(cadenciaFormSchema),
    defaultValues: EMPTY_CADENCIA_FORM_VALUES,
    mode: "onChange",
  });

  const {
    register: registerPlaybook,
    handleSubmit: handleSubmitPlaybook,
    reset: resetPlaybookValues,
    setError: setPlaybookFieldError,
    control: playbookControl,
    formState: { errors: playbookErrors, isValid: isPlaybookValid },
  } = playbookForm;
  const {
    fields: playbookEtapas,
    append: appendPlaybookEtapa,
    remove: removePlaybookEtapa,
  } = useFieldArray({
    control: playbookControl,
    name: "etapas",
  });

  const {
    register: registerCadencia,
    handleSubmit: handleSubmitCadencia,
    reset: resetCadenciaValues,
    setError: setCadenciaFieldError,
    control: cadenciaControl,
    formState: { errors: cadenciaErrors, isValid: isCadenciaValid },
  } = cadenciaForm;
  const {
    fields: cadenciaPassos,
    append: appendCadenciaPasso,
    remove: removeCadenciaPasso,
  } = useFieldArray({
    control: cadenciaControl,
    name: "passos",
  });

  const loading = playbooksLoading || cadenciasLoading;
  const cadenciasUnavailable = cadenciasError;

  function resetPlaybookForm(playbook?: CrmPlaybook | null) {
    setEditingPlaybook(playbook ?? null);
    setPlaybookSubmitError(null);
    resetPlaybookValues(toPlaybookFormValues(playbook));
  }

  function resetCadenciaForm(cadencia?: CrmCadencia | null) {
    setEditingCadencia(cadencia ?? null);
    setCadenciaSubmitError(null);
    resetCadenciaValues(toCadenciaFormValues(cadencia));
  }

  async function submitPlaybook(values: PlaybookFormValues) {
    if (!tenantId) return;
    setPlaybookSubmitError(null);
    try {
      await savePlaybookMutation.mutateAsync({
        id: editingPlaybook?.id,
        data: toPlaybookPayload(values),
      });
      resetPlaybookForm(null);
    } catch (error) {
      const fieldResult = applyApiFieldErrors(error, setPlaybookFieldError, {
        mapField: mapPlaybookFieldError,
      });
      const message = buildFormApiErrorMessage(error, {
        appliedFields: fieldResult.appliedFields,
        fallbackMessage: "Falha ao salvar playbook.",
      });
      if (message) {
        setPlaybookSubmitError(message);
      }
    }
  }

  async function submitCadencia(values: CadenciaFormValues) {
    if (!tenantId) return;
    setCadenciaSubmitError(null);
    try {
      await saveCadenciaMutation.mutateAsync({
        id: editingCadencia?.id,
        data: toCadenciaPayload(values),
      });
      resetCadenciaForm(null);
    } catch (error) {
      const fieldResult = applyApiFieldErrors(error, setCadenciaFieldError, {
        mapField: mapCadenciaFieldError,
      });
      const message = buildFormApiErrorMessage(error, {
        appliedFields: fieldResult.appliedFields,
        fallbackMessage: "Falha ao salvar cadência.",
      });
      if (message) {
        setCadenciaSubmitError(message);
      }
    }
  }

  const playbookSaving = savePlaybookMutation.isPending;
  const cadenciaSaving = saveCadenciaMutation.isPending;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          CRM operacional
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight">Playbooks e cadências</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Scripts operacionais e sequências de contato da unidade{" "}
          <span className="font-semibold text-foreground">{tenantContext.tenantName ?? "atual"}</span>.
        </p>
      </div>

      {cadenciasUnavailable ? (
        <Card className="border-amber-500/40 bg-amber-500/10">
          <CardContent className="px-6 py-5 text-sm text-amber-100">
            Este ambiente ainda não expõe cadências CRM no backend. O tab permanece visível, mas em modo somente leitura.
          </CardContent>
        </Card>
      ) : null}

      <Tabs defaultValue="playbooks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="playbooks">Playbooks</TabsTrigger>
          <TabsTrigger value="cadencias">Cadências</TabsTrigger>
        </TabsList>

        <TabsContent value="playbooks" className="space-y-4">
          <div className="grid gap-6 xl:grid-cols-[1.25fr_1fr]">
            <Card className="border-border/70 bg-card/80">
              <CardHeader>
                <CardTitle>Biblioteca de playbooks</CardTitle>
                <CardDescription>Checklists e scripts operacionais com prioridade e prazo padrão.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading ? (
                  <div className="rounded-xl border border-dashed border-border/70 px-4 py-10 text-center text-sm text-muted-foreground">
                    Carregando playbooks...
                  </div>
                ) : playbooks.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border/70 px-4 py-10 text-center text-sm text-muted-foreground">
                    Nenhum playbook criado para esta unidade.
                  </div>
                ) : (
                  playbooks.map((playbook) => (
                    <div key={playbook.id} className="rounded-xl border border-border/70 bg-secondary/25 p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold">{playbook.nome}</p>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                playbook.ativo
                                  ? "bg-emerald-500/15 text-emerald-300"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {playbook.ativo ? "Ativo" : "Pausado"}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {playbook.descricao?.trim() || "Sem descrição cadastrada."}
                          </p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            Prioridade {CRM_TASK_PRIORITY_LABEL[playbook.prioridadePadrao ?? "MEDIA"]} · prazo padrão{" "}
                            {playbook.prazoHorasPadrao ?? 24}h · {playbook.etapas.length} etapa(s)
                          </p>
                          <div className="mt-3 space-y-2">
                            {playbook.etapas.map((etapa, index) => (
                              <div key={`${playbook.id}-etapa-${index}`} className="rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm">
                                <span className="font-medium">
                                  {index + 1}. {etapa}
                                </span>
                              </div>
                            ))}
                          </div>
                          <p className="mt-3 text-xs text-muted-foreground">
                            Atualizado {formatDateTime(playbook.dataAtualizacao ?? playbook.dataCriacao)}
                          </p>
                        </div>
                        <Button type="button" variant="outline" onClick={() => resetPlaybookForm(playbook)}>
                          Editar
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/80">
              <CardHeader>
                <CardTitle>{editingPlaybook ? "Editar playbook" : "Novo playbook"}</CardTitle>
                <CardDescription>Defina descrição, prioridade padrão e o checklist base do fluxo.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleSubmitPlaybook(submitPlaybook)}>
                  {playbookSubmitError ? (
                    <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {playbookSubmitError}
                    </div>
                  ) : null}

                  <div className="space-y-1.5">
                    <Label htmlFor="crm-playbook-nome">Nome do playbook</Label>
                    <Input
                      id="crm-playbook-nome"
                      {...registerPlaybook("nome")}
                      className="border-border bg-secondary"
                    />
                    {playbookErrors.nome?.message ? <p className="text-xs text-destructive">{playbookErrors.nome.message}</p> : null}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="crm-playbook-descricao">Descrição operacional</Label>
                    <Textarea
                      id="crm-playbook-descricao"
                      {...registerPlaybook("descricao")}
                      className="border-border bg-secondary"
                    />
                    {playbookErrors.descricao?.message ? <p className="text-xs text-destructive">{playbookErrors.descricao.message}</p> : null}
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="crm-playbook-prioridade">Prioridade padrão</Label>
                      <select
                        id="crm-playbook-prioridade"
                        {...registerPlaybook("prioridadePadrao")}
                        className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 text-sm"
                      >
                        {PRIORIDADES_PLAYBOOK.map((prioridade) => (
                          <option key={prioridade} value={prioridade}>
                            {CRM_TASK_PRIORITY_LABEL[prioridade]}
                          </option>
                        ))}
                      </select>
                      {playbookErrors.prioridadePadrao?.message ? (
                        <p className="text-xs text-destructive">{playbookErrors.prioridadePadrao.message}</p>
                      ) : null}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="crm-playbook-prazo">Prazo padrão (h)</Label>
                      <Input
                        id="crm-playbook-prazo"
                        type="number"
                        min={0}
                        max={720}
                        {...registerPlaybook("prazoHorasPadrao")}
                        className="border-border bg-secondary"
                      />
                      {playbookErrors.prazoHorasPadrao?.message ? (
                        <p className="text-xs text-destructive">{playbookErrors.prazoHorasPadrao.message}</p>
                      ) : null}
                    </div>
                  </div>

                  <label className="flex items-center gap-2 rounded-md border border-border bg-secondary px-3 py-2 text-sm">
                    <input type="checkbox" {...registerPlaybook("ativo")} />
                    Playbook ativo
                  </label>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Etapas do checklist</Label>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => appendPlaybookEtapa({ value: "" })}
                      >
                        Adicionar etapa
                      </Button>
                    </div>

                    {typeof playbookErrors.etapas?.message === "string" ? (
                      <p className="text-xs text-destructive">{playbookErrors.etapas.message}</p>
                    ) : null}

                    {playbookEtapas.map((field, index) => (
                      <div key={field.id} className="rounded-xl border border-border/70 bg-secondary/20 p-4">
                        <div className="flex items-start gap-3">
                          <div className="min-w-0 flex-1 space-y-1.5">
                            <Label htmlFor={`playbook-etapa-${index}`}>Etapa {index + 1}</Label>
                            <Input
                              id={`playbook-etapa-${index}`}
                              {...registerPlaybook(`etapas.${index}.value`)}
                              className="border-border bg-background/60"
                            />
                            {playbookErrors.etapas?.[index]?.value?.message ? (
                              <p className="text-xs text-destructive">{playbookErrors.etapas[index]?.value?.message}</p>
                            ) : null}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            className="mt-6"
                            onClick={() => removePlaybookEtapa(index)}
                            disabled={playbookEtapas.length <= 1}
                          >
                            Remover
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={!tenantId || playbookSaving || !isPlaybookValid}>
                      {playbookSaving ? "Salvando..." : editingPlaybook ? "Salvar playbook" : "Criar playbook"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => resetPlaybookForm(null)} disabled={playbookSaving}>
                      Limpar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cadencias" className="space-y-4">
          <div className="grid gap-6 xl:grid-cols-[1.25fr_1fr]">
            <Card className="border-border/70 bg-card/80">
              <CardHeader>
                <CardTitle>Cadências comerciais</CardTitle>
                <CardDescription>Sequências de ações acionadas por gatilho comercial.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading ? (
                  <div className="rounded-xl border border-dashed border-border/70 px-4 py-10 text-center text-sm text-muted-foreground">
                    Carregando cadências...
                  </div>
                ) : cadencias.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border/70 px-4 py-10 text-center text-sm text-muted-foreground">
                    Nenhuma cadência criada para esta unidade.
                  </div>
                ) : (
                  cadencias.map((cadencia) => (
                    <div key={cadencia.id} className="rounded-xl border border-border/70 bg-secondary/25 p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold">{cadencia.nome}</p>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                cadencia.ativo
                                  ? "bg-emerald-500/15 text-emerald-300"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {cadencia.ativo ? "Ativa" : "Pausada"}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">{cadencia.objetivo}</p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            {CRM_CADENCIA_TRIGGER_LABEL[cadencia.gatilho]} · etapa base{" "}
                            {stages.find((stage) => stage.status === cadencia.stageStatus)?.nome ?? cadencia.stageStatus}
                            {" · "}
                            última execução {cadencia.ultimaExecucao ? formatDateTime(cadencia.ultimaExecucao) : "Sem atualização recente"}
                          </p>
                          <div className="mt-3 space-y-2">
                            {cadencia.passos.map((step, index) => (
                              <div key={step.id} className="rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm">
                                <span className="font-medium">
                                  {index + 1}. {step.titulo}
                                </span>
                                <span className="ml-2 text-muted-foreground">
                                  {CRM_CADENCIA_ACTION_LABEL[step.acao]} · D+{step.delayDias}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <Button type="button" variant="outline" onClick={() => resetCadenciaForm(cadencia)}>
                          Editar
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/80">
              <CardHeader>
                <CardTitle>{editingCadencia ? "Editar cadência" : "Nova cadência"}</CardTitle>
                <CardDescription>Defina gatilho, atraso por passo e ação automática/manual.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleSubmitCadencia(submitCadencia)}>
                  {cadenciaSubmitError ? (
                    <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {cadenciaSubmitError}
                    </div>
                  ) : null}

                  <div className="space-y-1.5">
                    <Label htmlFor="crm-cadencia-nome">Nome da cadência</Label>
                    <Input
                      id="crm-cadencia-nome"
                      {...registerCadencia("nome")}
                      className="border-border bg-secondary"
                    />
                    {cadenciaErrors.nome?.message ? <p className="text-xs text-destructive">{cadenciaErrors.nome.message}</p> : null}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="crm-cadencia-objetivo">Objetivo</Label>
                    <Textarea
                      id="crm-cadencia-objetivo"
                      {...registerCadencia("objetivo")}
                      className="border-border bg-secondary"
                    />
                    {cadenciaErrors.objetivo?.message ? <p className="text-xs text-destructive">{cadenciaErrors.objetivo.message}</p> : null}
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="crm-cadencia-stage">Etapa base</Label>
                      <select
                        id="crm-cadencia-stage"
                        {...registerCadencia("stageStatus")}
                        className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 text-sm"
                      >
                        {stages.map((stage) => (
                          <option key={stage.id} value={stage.status}>
                            {stage.nome}
                          </option>
                        ))}
                      </select>
                      {cadenciaErrors.stageStatus?.message ? (
                        <p className="text-xs text-destructive">{cadenciaErrors.stageStatus.message}</p>
                      ) : null}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="crm-cadencia-trigger">Gatilho</Label>
                      <select
                        id="crm-cadencia-trigger"
                        {...registerCadencia("gatilho")}
                        className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 text-sm"
                      >
                        {Object.entries(CRM_CADENCIA_TRIGGER_LABEL).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                      {cadenciaErrors.gatilho?.message ? <p className="text-xs text-destructive">{cadenciaErrors.gatilho.message}</p> : null}
                    </div>
                  </div>

                  <label className="flex items-center gap-2 rounded-md border border-border bg-secondary px-3 py-2 text-sm">
                    <input type="checkbox" {...registerCadencia("ativo")} />
                    Cadência ativa
                  </label>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Passos da cadência</Label>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          appendCadenciaPasso({
                            titulo: "",
                            acao: "WHATSAPP",
                            delayDias: 0,
                            template: "",
                            automatica: true,
                          })
                        }
                        disabled={cadenciasUnavailable}
                      >
                        Adicionar passo
                      </Button>
                    </div>

                    {typeof cadenciaErrors.passos?.message === "string" ? (
                      <p className="text-xs text-destructive">{cadenciaErrors.passos.message}</p>
                    ) : null}

                    {cadenciaPassos.map((field, index) => (
                      <div key={field.id} className="rounded-xl border border-border/70 bg-secondary/20 p-4">
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-1.5">
                            <Label htmlFor={`cadencia-step-title-${index}`}>Título do passo {index + 1}</Label>
                            <Input
                              id={`cadencia-step-title-${index}`}
                              {...registerCadencia(`passos.${index}.titulo`)}
                              className="border-border bg-background/60"
                            />
                            {cadenciaErrors.passos?.[index]?.titulo?.message ? (
                              <p className="text-xs text-destructive">{cadenciaErrors.passos[index]?.titulo?.message}</p>
                            ) : null}
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor={`cadencia-step-action-${index}`}>Ação do passo {index + 1}</Label>
                            <select
                              id={`cadencia-step-action-${index}`}
                              {...registerCadencia(`passos.${index}.acao`)}
                              className="flex h-10 w-full rounded-md border border-border bg-background/60 px-3 text-sm"
                            >
                              {Object.entries(CRM_CADENCIA_ACTION_LABEL).map(([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              ))}
                            </select>
                            {cadenciaErrors.passos?.[index]?.acao?.message ? (
                              <p className="text-xs text-destructive">{cadenciaErrors.passos[index]?.acao?.message}</p>
                            ) : null}
                          </div>
                        </div>

                        <div className="mt-3 grid gap-3 md:grid-cols-[1fr_160px_auto_auto]">
                          <div className="space-y-1.5">
                            <Label htmlFor={`cadencia-step-template-${index}`}>Template</Label>
                            <Input
                              id={`cadencia-step-template-${index}`}
                              {...registerCadencia(`passos.${index}.template`)}
                              className="border-border bg-background/60"
                            />
                            {cadenciaErrors.passos?.[index]?.template?.message ? (
                              <p className="text-xs text-destructive">{cadenciaErrors.passos[index]?.template?.message}</p>
                            ) : null}
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor={`cadencia-step-delay-${index}`}>Delay (dias)</Label>
                            <Input
                              id={`cadencia-step-delay-${index}`}
                              type="number"
                              min={0}
                              max={365}
                              {...registerCadencia(`passos.${index}.delayDias`)}
                              className="border-border bg-background/60"
                            />
                            {cadenciaErrors.passos?.[index]?.delayDias?.message ? (
                              <p className="text-xs text-destructive">{cadenciaErrors.passos[index]?.delayDias?.message}</p>
                            ) : null}
                          </div>

                          <label className="mt-7 flex items-center gap-2 text-sm">
                            <input type="checkbox" {...registerCadencia(`passos.${index}.automatica`)} />
                            Automática
                          </label>

                          <Button
                            type="button"
                            variant="outline"
                            className="mt-6"
                            onClick={() => removeCadenciaPasso(index)}
                            disabled={cadenciaPassos.length <= 1 || cadenciasUnavailable}
                          >
                            Remover
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={!tenantId || cadenciaSaving || !isCadenciaValid || cadenciasUnavailable}>
                      {cadenciaSaving ? "Salvando..." : editingCadencia ? "Salvar cadência" : "Criar cadência"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => resetCadenciaForm(null)} disabled={cadenciaSaving}>
                      Limpar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
