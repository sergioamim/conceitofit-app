"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  createCrmCadenciaApi,
  createCrmPlaybookApi,
  listCrmCadenciasApi,
  listCrmPlaybooksApi,
  updateCrmCadenciaApi,
  updateCrmPlaybookApi,
} from "@/lib/api/crm";
import { normalizeCapabilityError } from "@/lib/api/backend-capability";
import { getActiveTenantIdFromSession } from "@/lib/api/session";
import type {
  CrmCadencia,
  CrmCadenciaAcao,
  CrmCadenciaGatilho,
  CrmPipelineStage,
  CrmPlaybook,
  CrmPlaybookAcao,
  StatusProspect,
} from "@/lib/types";
import {
  buildDefaultCrmPipelineStages,
  CRM_CADENCIA_ACTION_LABEL,
  CRM_CADENCIA_TRIGGER_LABEL,
  CRM_PLAYBOOK_ACTION_LABEL,
} from "@/lib/tenant/crm/workspace";
import { useTenantContext } from "@/hooks/use-session-context";
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

type PlaybookStepForm = {
  id?: string;
  titulo: string;
  descricao: string;
  acao: CrmPlaybookAcao;
  prazoHoras: number;
  obrigatoria: boolean;
};

type PlaybookFormState = {
  nome: string;
  objetivo: string;
  stageStatus: StatusProspect;
  ativo: boolean;
  passos: PlaybookStepForm[];
};

type CadenciaStepForm = {
  id?: string;
  titulo: string;
  acao: CrmCadenciaAcao;
  delayDias: number;
  template: string;
  automatica: boolean;
};

type CadenciaFormState = {
  nome: string;
  objetivo: string;
  stageStatus: StatusProspect;
  gatilho: CrmCadenciaGatilho;
  ativo: boolean;
  passos: CadenciaStepForm[];
};

function createPlaybookStep(): PlaybookStepForm {
  return {
    titulo: "",
    descricao: "",
    acao: "CHECKLIST",
    prazoHoras: 4,
    obrigatoria: true,
  };
}

function createCadenciaStep(): CadenciaStepForm {
  return {
    titulo: "",
    acao: "WHATSAPP",
    delayDias: 0,
    template: "",
    automatica: true,
  };
}

const EMPTY_PLAYBOOK_FORM: PlaybookFormState = {
  nome: "",
  objetivo: "",
  stageStatus: "NOVO",
  ativo: true,
  passos: [createPlaybookStep()],
};

const EMPTY_CADENCIA_FORM: CadenciaFormState = {
  nome: "",
  objetivo: "",
  stageStatus: "NOVO",
  gatilho: "NOVO_PROSPECT",
  ativo: true,
  passos: [createCadenciaStep()],
};

function toPlaybookForm(playbook?: CrmPlaybook | null): PlaybookFormState {
  if (!playbook) return EMPTY_PLAYBOOK_FORM;
  return {
    nome: playbook.nome,
    objetivo: playbook.objetivo,
    stageStatus: playbook.stageStatus,
    ativo: playbook.ativo,
    passos: playbook.passos.map((step) => ({
      id: step.id,
      titulo: step.titulo,
      descricao: step.descricao ?? "",
      acao: step.acao,
      prazoHoras: step.prazoHoras,
      obrigatoria: step.obrigatoria,
    })),
  };
}

function toCadenciaForm(cadencia?: CrmCadencia | null): CadenciaFormState {
  if (!cadencia) return EMPTY_CADENCIA_FORM;
  return {
    nome: cadencia.nome,
    objetivo: cadencia.objetivo,
    stageStatus: cadencia.stageStatus,
    gatilho: cadencia.gatilho,
    ativo: cadencia.ativo,
    passos: cadencia.passos.map((step) => ({
      id: step.id,
      titulo: step.titulo,
      acao: step.acao,
      delayDias: step.delayDias,
      template: step.template ?? "",
      automatica: step.automatica,
    })),
  };
}

function formatDateTime(value?: string): string {
  if (!value) return "Sem atualização recente";
  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function CrmPlaybooksPage() {
  const tenantContext = useTenantContext();
  const [playbooks, setPlaybooks] = useState<CrmPlaybook[]>([]);
  const [cadencias, setCadencias] = useState<CrmCadencia[]>([]);
  const [editingPlaybook, setEditingPlaybook] = useState<CrmPlaybook | null>(null);
  const [editingCadencia, setEditingCadencia] = useState<CrmCadencia | null>(null);
  const [playbookForm, setPlaybookForm] = useState<PlaybookFormState>(EMPTY_PLAYBOOK_FORM);
  const [cadenciaForm, setCadenciaForm] = useState<CadenciaFormState>(EMPTY_CADENCIA_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [cadenciasUnavailable, setCadenciasUnavailable] = useState(false);
  const tenantId = tenantContext.tenantId || getActiveTenantIdFromSession() || "";
  const stages: CrmPipelineStage[] = buildDefaultCrmPipelineStages(tenantId || "tenant-runtime");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const [playbookResult, cadenciaResult] = await Promise.allSettled([
      listCrmPlaybooksApi({ tenantId }),
      listCrmCadenciasApi({ tenantId }),
    ]);

    if (playbookResult.status === "fulfilled") {
      setPlaybooks(playbookResult.value);
    } else {
      setPlaybooks([]);
      setError(normalizeCapabilityError(playbookResult.reason, "Falha ao carregar playbooks."));
    }

    if (cadenciaResult.status === "fulfilled") {
      setCadencias(cadenciaResult.value);
      setCadenciasUnavailable(false);
    } else {
      const message = normalizeCapabilityError(cadenciaResult.reason, "Falha ao carregar cadências.");
      setCadencias([]);
      setCadenciasUnavailable(message.startsWith("Backend ainda não expõe"));
      if (!message.startsWith("Backend ainda não expõe")) {
        setError((current) => current || message);
      }
    }

    setLoading(false);
  }, [tenantId]);

  useEffect(() => {
    void load();
  }, [load]);

  function resetPlaybookForm(playbook?: CrmPlaybook | null) {
    setEditingPlaybook(playbook ?? null);
    setPlaybookForm(toPlaybookForm(playbook));
  }

  function resetCadenciaForm(cadencia?: CrmCadencia | null) {
    setEditingCadencia(cadencia ?? null);
    setCadenciaForm(toCadenciaForm(cadencia));
  }

  async function handleSavePlaybook(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!tenantId) return;
    setSaving(true);
    setError("");
    try {
      const payload = {
        nome: playbookForm.nome,
        objetivo: playbookForm.objetivo,
        stageStatus: playbookForm.stageStatus,
        ativo: playbookForm.ativo,
        passos: playbookForm.passos.map((step) => ({
          id: step.id,
          titulo: step.titulo,
          descricao: step.descricao,
          acao: step.acao,
          prazoHoras: step.prazoHoras,
          obrigatoria: step.obrigatoria,
        })),
      };
      if (editingPlaybook) {
        await updateCrmPlaybookApi({
          tenantId,
          id: editingPlaybook.id,
          data: payload,
        });
      } else {
        await createCrmPlaybookApi({
          tenantId,
          data: payload,
        });
      }
      resetPlaybookForm(null);
      await load();
    } catch (submitError) {
      setError(normalizeCapabilityError(submitError, "Falha ao salvar playbook."));
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveCadencia(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!tenantId) return;
    setSaving(true);
    setError("");
    try {
      const payload = {
        nome: cadenciaForm.nome,
        objetivo: cadenciaForm.objetivo,
        stageStatus: cadenciaForm.stageStatus,
        gatilho: cadenciaForm.gatilho,
        ativo: cadenciaForm.ativo,
        passos: cadenciaForm.passos.map((step) => ({
          id: step.id,
          titulo: step.titulo,
          acao: step.acao,
          delayDias: step.delayDias,
          template: step.template,
          automatica: step.automatica,
        })),
      };
      if (editingCadencia) {
        await updateCrmCadenciaApi({
          tenantId,
          id: editingCadencia.id,
          data: payload,
        });
      } else {
        await createCrmCadenciaApi({
          tenantId,
          data: payload,
        });
      }
      resetCadenciaForm(null);
      await load();
    } catch (submitError) {
      const message = normalizeCapabilityError(submitError, "Falha ao salvar cadência.");
      setError(message);
      if (message.startsWith("Backend ainda não expõe")) {
        setCadenciasUnavailable(true);
      }
    } finally {
      setSaving(false);
    }
  }

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

      {error ? (
        <Card className="border-rose-500/40 bg-rose-500/10">
          <CardContent className="px-6 py-5 text-sm text-rose-100">{error}</CardContent>
        </Card>
      ) : null}
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
                <CardDescription>Checklists e scripts por etapa do funil.</CardDescription>
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
                          <p className="mt-1 text-sm text-muted-foreground">{playbook.objetivo}</p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            Etapa base: {stages.find((stage) => stage.status === playbook.stageStatus)?.nome ?? playbook.stageStatus}
                            {" · "}
                            {playbook.passos.length} etapas
                          </p>
                          <div className="mt-3 space-y-2">
                            {playbook.passos.map((step, index) => (
                              <div key={step.id} className="rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm">
                                <span className="font-medium">
                                  {index + 1}. {step.titulo}
                                </span>
                                <span className="ml-2 text-muted-foreground">
                                  {CRM_PLAYBOOK_ACTION_LABEL[step.acao]} · {step.prazoHoras}h
                                </span>
                              </div>
                            ))}
                          </div>
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
                <CardDescription>Defina roteiro, prazo e obrigatoriedade das ações.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleSavePlaybook}>
                  <div className="space-y-1.5">
                    <Label htmlFor="crm-playbook-nome">Nome do playbook</Label>
                    <Input
                      id="crm-playbook-nome"
                      value={playbookForm.nome}
                      onChange={(event) => setPlaybookForm((current) => ({ ...current, nome: event.target.value }))}
                      className="border-border bg-secondary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="crm-playbook-objetivo">Objetivo</Label>
                    <Textarea
                      id="crm-playbook-objetivo"
                      value={playbookForm.objetivo}
                      onChange={(event) =>
                        setPlaybookForm((current) => ({ ...current, objetivo: event.target.value }))
                      }
                      className="border-border bg-secondary"
                    />
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="crm-playbook-stage">Etapa base</Label>
                      <select
                        id="crm-playbook-stage"
                        value={playbookForm.stageStatus}
                        onChange={(event) =>
                          setPlaybookForm((current) => ({
                            ...current,
                            stageStatus: event.target.value as StatusProspect,
                          }))
                        }
                        className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 text-sm"
                      >
                        {stages.map((stage) => (
                          <option key={stage.id} value={stage.status}>
                            {stage.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                    <label className="flex items-center gap-2 rounded-md border border-border bg-secondary px-3 text-sm">
                      <input
                        type="checkbox"
                        checked={playbookForm.ativo}
                        onChange={(event) =>
                          setPlaybookForm((current) => ({ ...current, ativo: event.target.checked }))
                        }
                      />
                      Playbook ativo
                    </label>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Etapas do playbook</Label>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          setPlaybookForm((current) => ({
                            ...current,
                            passos: [...current.passos, createPlaybookStep()],
                          }))
                        }
                      >
                        Adicionar etapa
                      </Button>
                    </div>
                    {playbookForm.passos.map((step, index) => (
                      <div key={`${step.id ?? "new"}-${index}`} className="rounded-xl border border-border/70 bg-secondary/20 p-4">
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-1.5">
                            <Label htmlFor={`playbook-step-title-${index}`}>Título da etapa {index + 1}</Label>
                            <Input
                              id={`playbook-step-title-${index}`}
                              value={step.titulo}
                              onChange={(event) =>
                                setPlaybookForm((current) => ({
                                  ...current,
                                  passos: current.passos.map((item, itemIndex) =>
                                    itemIndex === index ? { ...item, titulo: event.target.value } : item
                                  ),
                                }))
                              }
                              className="border-border bg-background/60"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor={`playbook-step-action-${index}`}>Ação da etapa {index + 1}</Label>
                            <select
                              id={`playbook-step-action-${index}`}
                              value={step.acao}
                              onChange={(event) =>
                                setPlaybookForm((current) => ({
                                  ...current,
                                  passos: current.passos.map((item, itemIndex) =>
                                    itemIndex === index
                                      ? { ...item, acao: event.target.value as CrmPlaybookAcao }
                                      : item
                                  ),
                                }))
                              }
                              className="flex h-10 w-full rounded-md border border-border bg-background/60 px-3 text-sm"
                            >
                              {Object.entries(CRM_PLAYBOOK_ACTION_LABEL).map(([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="mt-3 grid gap-3 md:grid-cols-[1fr_120px_auto]">
                          <div className="space-y-1.5">
                            <Label htmlFor={`playbook-step-desc-${index}`}>Descrição da etapa {index + 1}</Label>
                            <Textarea
                              id={`playbook-step-desc-${index}`}
                              value={step.descricao}
                              onChange={(event) =>
                                setPlaybookForm((current) => ({
                                  ...current,
                                  passos: current.passos.map((item, itemIndex) =>
                                    itemIndex === index ? { ...item, descricao: event.target.value } : item
                                  ),
                                }))
                              }
                              className="border-border bg-background/60"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor={`playbook-step-prazo-${index}`}>Prazo (h)</Label>
                            <Input
                              id={`playbook-step-prazo-${index}`}
                              type="number"
                              min={0}
                              value={step.prazoHoras}
                              onChange={(event) =>
                                setPlaybookForm((current) => ({
                                  ...current,
                                  passos: current.passos.map((item, itemIndex) =>
                                    itemIndex === index
                                      ? { ...item, prazoHoras: Number(event.target.value || 0) }
                                      : item
                                  ),
                                }))
                              }
                              className="border-border bg-background/60"
                            />
                          </div>
                          <label className="mt-7 flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={step.obrigatoria}
                              onChange={(event) =>
                                setPlaybookForm((current) => ({
                                  ...current,
                                  passos: current.passos.map((item, itemIndex) =>
                                    itemIndex === index
                                      ? { ...item, obrigatoria: event.target.checked }
                                      : item
                                  ),
                                }))
                              }
                            />
                            Obrigatória
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={saving}>
                      {saving ? "Salvando..." : editingPlaybook ? "Salvar playbook" : "Criar playbook"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => resetPlaybookForm(null)} disabled={saving}>
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
                            última execução {formatDateTime(cadencia.ultimaExecucao)}
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
                <form className="space-y-4" onSubmit={handleSaveCadencia}>
                  <div className="space-y-1.5">
                    <Label htmlFor="crm-cadencia-nome">Nome da cadência</Label>
                    <Input
                      id="crm-cadencia-nome"
                      value={cadenciaForm.nome}
                      onChange={(event) => setCadenciaForm((current) => ({ ...current, nome: event.target.value }))}
                      className="border-border bg-secondary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="crm-cadencia-objetivo">Objetivo</Label>
                    <Textarea
                      id="crm-cadencia-objetivo"
                      value={cadenciaForm.objetivo}
                      onChange={(event) =>
                        setCadenciaForm((current) => ({ ...current, objetivo: event.target.value }))
                      }
                      className="border-border bg-secondary"
                    />
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="crm-cadencia-stage">Etapa base</Label>
                      <select
                        id="crm-cadencia-stage"
                        value={cadenciaForm.stageStatus}
                        onChange={(event) =>
                          setCadenciaForm((current) => ({
                            ...current,
                            stageStatus: event.target.value as StatusProspect,
                          }))
                        }
                        className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 text-sm"
                      >
                        {stages.map((stage) => (
                          <option key={stage.id} value={stage.status}>
                            {stage.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="crm-cadencia-gatilho">Gatilho</Label>
                      <select
                        id="crm-cadencia-gatilho"
                        value={cadenciaForm.gatilho}
                        onChange={(event) =>
                          setCadenciaForm((current) => ({
                            ...current,
                            gatilho: event.target.value as CrmCadenciaGatilho,
                          }))
                        }
                        className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 text-sm"
                      >
                        {Object.entries(CRM_CADENCIA_TRIGGER_LABEL).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 rounded-md border border-border bg-secondary px-3 py-3 text-sm">
                    <input
                      type="checkbox"
                      checked={cadenciaForm.ativo}
                      onChange={(event) =>
                        setCadenciaForm((current) => ({ ...current, ativo: event.target.checked }))
                      }
                    />
                    Cadência ativa
                  </label>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Passos da cadência</Label>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={cadenciasUnavailable}
                        onClick={() =>
                          setCadenciaForm((current) => ({
                            ...current,
                            passos: [...current.passos, createCadenciaStep()],
                          }))
                        }
                      >
                        Adicionar passo
                      </Button>
                    </div>
                    {cadenciaForm.passos.map((step, index) => (
                      <div key={`${step.id ?? "new"}-${index}`} className="rounded-xl border border-border/70 bg-secondary/20 p-4">
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-1.5">
                            <Label htmlFor={`cadencia-step-title-${index}`}>Título do passo {index + 1}</Label>
                            <Input
                              id={`cadencia-step-title-${index}`}
                              value={step.titulo}
                              onChange={(event) =>
                                setCadenciaForm((current) => ({
                                  ...current,
                                  passos: current.passos.map((item, itemIndex) =>
                                    itemIndex === index ? { ...item, titulo: event.target.value } : item
                                  ),
                                }))
                              }
                              className="border-border bg-background/60"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor={`cadencia-step-action-${index}`}>Ação do passo {index + 1}</Label>
                            <select
                              id={`cadencia-step-action-${index}`}
                              value={step.acao}
                              onChange={(event) =>
                                setCadenciaForm((current) => ({
                                  ...current,
                                  passos: current.passos.map((item, itemIndex) =>
                                    itemIndex === index
                                      ? { ...item, acao: event.target.value as CrmCadenciaAcao }
                                      : item
                                  ),
                                }))
                              }
                              className="flex h-10 w-full rounded-md border border-border bg-background/60 px-3 text-sm"
                            >
                              {Object.entries(CRM_CADENCIA_ACTION_LABEL).map(([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="mt-3 grid gap-3 md:grid-cols-[120px_1fr_auto]">
                          <div className="space-y-1.5">
                            <Label htmlFor={`cadencia-step-delay-${index}`}>Delay (dias)</Label>
                            <Input
                              id={`cadencia-step-delay-${index}`}
                              type="number"
                              min={0}
                              value={step.delayDias}
                              onChange={(event) =>
                                setCadenciaForm((current) => ({
                                  ...current,
                                  passos: current.passos.map((item, itemIndex) =>
                                    itemIndex === index
                                      ? { ...item, delayDias: Number(event.target.value || 0) }
                                      : item
                                  ),
                                }))
                              }
                              className="border-border bg-background/60"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor={`cadencia-step-template-${index}`}>Template / orientação</Label>
                            <Textarea
                              id={`cadencia-step-template-${index}`}
                              value={step.template}
                              onChange={(event) =>
                                setCadenciaForm((current) => ({
                                  ...current,
                                  passos: current.passos.map((item, itemIndex) =>
                                    itemIndex === index ? { ...item, template: event.target.value } : item
                                  ),
                                }))
                              }
                              className="border-border bg-background/60"
                            />
                          </div>
                          <label className="mt-7 flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={step.automatica}
                              onChange={(event) =>
                                setCadenciaForm((current) => ({
                                  ...current,
                                  passos: current.passos.map((item, itemIndex) =>
                                    itemIndex === index
                                      ? { ...item, automatica: event.target.checked }
                                      : item
                                  ),
                                }))
                              }
                            />
                            Automática
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={saving || cadenciasUnavailable}>
                      {saving ? "Salvando..." : editingCadencia ? "Salvar cadência" : "Criar cadência"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => resetCadenciaForm(null)} disabled={saving}>
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
