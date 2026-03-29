"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, CheckCircle2, Clock3, Link2, RefreshCcw, ServerCrash } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useFieldArray, useForm, type UseFormRegisterReturn } from "react-hook-form";
import dynamic from "next/dynamic";

const RichTextEditor = dynamic(
  () => import("@/components/shared/rich-text-editor").then((mod) => mod.RichTextEditor),
  { ssr: false },
);
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  getGlobalConfigApi,
  getIntegrationStatusApi,
  updateGlobalConfigApi,
} from "@/lib/api/admin-config";
import type { GlobalConfig, IntegrationHealthStatus, IntegrationStatus } from "@/lib/types";
import { globalConfigFormSchema, integrationStatusFilterSchema, type GlobalConfigFormValues } from "@/lib/forms/admin-config-schemas";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { cn } from "@/lib/utils";

const STATUS_META: Record<IntegrationHealthStatus, { label: string; tone: string; icon: typeof CheckCircle2 }> = {
  ONLINE: {
    label: "Online",
    tone: "border-gym-teal/30 bg-gym-teal/10 text-gym-teal",
    icon: CheckCircle2,
  },
  DEGRADED: {
    label: "Degradada",
    tone: "border-yellow-500/30 bg-yellow-500/10 text-yellow-200",
    icon: AlertTriangle,
  },
  OFFLINE: {
    label: "Offline",
    tone: "border-gym-danger/30 bg-gym-danger/10 text-gym-danger",
    icon: ServerCrash,
  },
  MAINTENANCE: {
    label: "Manutenção",
    tone: "border-sky-500/30 bg-sky-500/10 text-sky-200",
    icon: Clock3,
  },
};

const EMPTY_GLOBAL_CONFIG: GlobalConfig = {
  emailTemplates: [
    {
      id: "template-boas-vindas",
      slug: "boas-vindas",
      nome: "Boas-vindas",
      assunto: "Boas-vindas à plataforma Conceito Fit",
      canal: "EMAIL",
      ativo: true,
      bodyHtml: "<p>Olá {{NOME_CLIENTE}}, seja bem-vindo à plataforma.</p>",
      variables: ["{{NOME_CLIENTE}}", "{{UNIDADE_NOME}}"],
    },
    {
      id: "template-cobranca",
      slug: "cobranca-pendente",
      nome: "Cobrança pendente",
      assunto: "Existe uma pendência financeira no seu cadastro",
      canal: "EMAIL",
      ativo: true,
      bodyHtml: "<p>Olá {{NOME_CLIENTE}}, identificamos uma pendência de {{VALOR_PENDENTE}}.</p>",
      variables: ["{{NOME_CLIENTE}}", "{{VALOR_PENDENTE}}", "{{DATA_VENCIMENTO}}"],
    },
    {
      id: "template-primeiro-acesso",
      slug: "primeiro-acesso",
      nome: "Primeiro acesso",
      assunto: "Ative o seu acesso administrativo",
      canal: "EMAIL",
      ativo: true,
      bodyHtml: "<p>Olá {{NOME_USUARIO}}, conclua seu primeiro acesso pelo link {{LINK_ATIVACAO}}.</p>",
      variables: ["{{NOME_USUARIO}}", "{{LINK_ATIVACAO}}"],
    },
  ],
  termsOfUseHtml: "<p></p>",
  termsVersion: "v1.0",
  apiLimits: {
    requestsPerMinute: 120,
    burstLimit: 240,
    webhookRequestsPerMinute: 90,
    adminRequestsPerMinute: 60,
  },
};

function globalConfigToForm(config: GlobalConfig): GlobalConfigFormValues {
  return {
    emailTemplates: config.emailTemplates.map((template) => ({
      id: template.id,
      slug: template.slug,
      nome: template.nome,
      assunto: template.assunto,
      canal: template.canal,
      ativo: template.ativo,
      bodyHtml: template.bodyHtml,
      variables: template.variables,
    })),
    termsOfUseHtml: config.termsOfUseHtml,
    termsVersion: config.termsVersion,
    apiLimits: {
      requestsPerMinute: config.apiLimits.requestsPerMinute,
      burstLimit: config.apiLimits.burstLimit,
      webhookRequestsPerMinute: config.apiLimits.webhookRequestsPerMinute,
      adminRequestsPerMinute: config.apiLimits.adminRequestsPerMinute,
    },
  };
}

function formToGlobalConfig(values: GlobalConfigFormValues, current: GlobalConfig | null): GlobalConfig {
  return {
    emailTemplates: values.emailTemplates.map((template, index) => ({
      ...template,
      id: template.id || `${template.slug}-${index + 1}`,
      updatedAt: current?.emailTemplates.find((item) => item.id === template.id)?.updatedAt,
    })),
    termsOfUseHtml: values.termsOfUseHtml,
    termsVersion: values.termsVersion,
    termsUpdatedAt: current?.termsUpdatedAt,
    apiLimits: values.apiLimits,
    updatedAt: current?.updatedAt,
    updatedBy: current?.updatedBy,
  };
}

function formatTimestamp(value?: string) {
  if (!value) return "Sem registro";
  return value.slice(0, 16).replace("T", " ");
}

function formatPercent(value: number) {
  return `${value.toFixed(1).replace(".", ",")}%`;
}

function summarizeStatuses(integrations: IntegrationStatus[]) {
  return integrations.reduce(
    (acc, item) => {
      acc.total += 1;
      acc[item.status] += 1;
      return acc;
    },
    {
      total: 0,
      ONLINE: 0,
      DEGRADED: 0,
      OFFLINE: 0,
      MAINTENANCE: 0,
    }
  );
}

export default function AdminConfiguracoesPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [integrationError, setIntegrationError] = useState<string | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
  const [config, setConfig] = useState<GlobalConfig | null>(null);
  const [statusFilter, setStatusFilter] = useState<"TODAS" | IntegrationHealthStatus>("TODAS");

  const form = useForm<GlobalConfigFormValues>({
    resolver: zodResolver(globalConfigFormSchema),
    defaultValues: globalConfigToForm(EMPTY_GLOBAL_CONFIG),
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "emailTemplates",
  });

  const loadPage = useCallback(async () => {
    setLoading(true);
    try {
      setIntegrationError(null);
      setConfigError(null);

      const [integrationResult, globalConfigResult] = await Promise.allSettled([
        getIntegrationStatusApi(),
        getGlobalConfigApi(),
      ]);

      if (integrationResult.status === "fulfilled") {
        setIntegrations(integrationResult.value);
      } else {
        setIntegrations([]);
        setIntegrationError(normalizeErrorMessage(integrationResult.reason));
      }

      if (globalConfigResult.status === "fulfilled") {
        setConfig(globalConfigResult.value);
        form.reset(globalConfigToForm(globalConfigResult.value));
      } else {
        setConfig(EMPTY_GLOBAL_CONFIG);
        form.reset(globalConfigToForm(EMPTY_GLOBAL_CONFIG));
        setConfigError(normalizeErrorMessage(globalConfigResult.reason));
      }
    } finally {
      setLoading(false);
    }
  }, [form]);

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  const statusSummary = useMemo(() => summarizeStatuses(integrations), [integrations]);
  const visibleIntegrations = useMemo(() => {
    if (statusFilter === "TODAS") return integrations;
    return integrations.filter((item) => item.status === statusFilter);
  }, [integrations, statusFilter]);

  async function handleSave(values: GlobalConfigFormValues) {
    setSaving(true);
    try {
      const persisted = await updateGlobalConfigApi(formToGlobalConfig(values, config));
      setConfig(persisted);
      form.reset(globalConfigToForm(persisted));
      toast({
        title: "Configurações globais atualizadas",
        description: persisted.updatedBy ? `Última revisão por ${persisted.updatedBy}.` : "Persistência concluída.",
      });
    } catch (error) {
      toast({
        title: "Não foi possível salvar as configurações",
        description: normalizeErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[28px] border border-border bg-card">
        <div className="relative overflow-hidden border-b border-border px-6 py-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(61,232,160,0.16),transparent_46%),radial-gradient(circle_at_bottom_right,rgba(91,141,239,0.16),transparent_42%)]" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-secondary/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Governança Global
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold tracking-tight">Configurações e integrações</h1>
                <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                  Monitora as integrações críticas do backoffice e centraliza templates, termos de uso e limites operacionais da plataforma.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="border-border" onClick={() => void loadPage()} disabled={loading}>
                <RefreshCcw className="mr-2 size-4" />
                Atualizar
              </Button>
              <Button onClick={form.handleSubmit(handleSave)} disabled={saving || loading}>
                {saving ? "Salvando..." : "Salvar alterações"}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 border-b border-border px-6 py-5 md:grid-cols-4">
          <StatCard label="Integrações monitoradas" value={loading ? "…" : String(statusSummary.total)} helper="Gateway, fiscal, acesso e ETL" />
          <StatCard label="Online" value={loading ? "…" : String(statusSummary.ONLINE)} helper="Saudáveis no último check" />
          <StatCard label="Degradação/Falha" value={loading ? "…" : String(statusSummary.DEGRADED + statusSummary.OFFLINE)} helper="Demandam revisão operacional" />
          <StatCard
            label="Última revisão global"
            value={loading ? "…" : formatTimestamp(config?.updatedAt)}
            helper={config?.updatedBy ? `Por ${config.updatedBy}` : "Sem autoria informada"}
          />
        </div>

        <div className="px-6 py-6">
          <Tabs defaultValue="integracoes" className="space-y-6">
            <TabsList className="grid h-auto grid-cols-2 gap-1 rounded-2xl bg-secondary/50 p-1 md:grid-cols-4">
              <TabsTrigger value="integracoes" className="rounded-xl">Integrações</TabsTrigger>
              <TabsTrigger value="templates" className="rounded-xl">Templates</TabsTrigger>
              <TabsTrigger value="termos" className="rounded-xl">Termos</TabsTrigger>
              <TabsTrigger value="limites" className="rounded-xl">Limites</TabsTrigger>
            </TabsList>

            <TabsContent value="integracoes" className="space-y-4">
              {integrationError ? (
                <div className="rounded-2xl border border-gym-danger/30 bg-gym-danger/10 px-4 py-3 text-sm text-gym-danger">
                  {integrationError}
                </div>
              ) : null}

              <div className="flex flex-col gap-3 rounded-2xl border border-border bg-secondary/30 p-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Saúde das integrações externas</p>
                  <p className="text-sm text-muted-foreground">
                    Acompanha uptime, latência média, backlog e o último erro conhecido por integração.
                  </p>
                </div>
                <div className="w-full max-w-xs space-y-2">
                  <Label htmlFor="integration-status-filter">Filtro de status</Label>
                  <Select value={statusFilter} onValueChange={(value) => setStatusFilter(integrationStatusFilterSchema.parse(value))}>
                    <SelectTrigger id="integration-status-filter">
                      <SelectValue placeholder="Todas as integrações" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODAS">Todas</SelectItem>
                      <SelectItem value="ONLINE">Online</SelectItem>
                      <SelectItem value="DEGRADED">Degradadas</SelectItem>
                      <SelectItem value="OFFLINE">Offline</SelectItem>
                      <SelectItem value="MAINTENANCE">Manutenção</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                {visibleIntegrations.map((integration) => {
                  const meta = STATUS_META[integration.status];
                  const Icon = meta.icon;
                  return (
                    <Card key={integration.integrationKey} className="border-border/80 bg-card/70">
                      <CardHeader className="space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <CardTitle className="text-lg">{integration.integrationName}</CardTitle>
                            <p className="text-sm text-muted-foreground">{integration.providerLabel}</p>
                          </div>
                          <Badge className={cn("gap-1 border", meta.tone)}>
                            <Icon className="size-3.5" />
                            {meta.label}
                          </Badge>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                          <MetricChip label="Uptime" value={formatPercent(integration.uptimePercent)} />
                          <MetricChip label="Latência média" value={`${integration.avgLatencyMs} ms`} />
                          <MetricChip label="Fila pendente" value={String(integration.pendingCount)} />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm">
                        <div className="grid gap-3 md:grid-cols-2">
                          <InlineMeta label="Última checagem" value={formatTimestamp(integration.lastCheckAt)} />
                          <InlineMeta label="Último sucesso" value={formatTimestamp(integration.lastSuccessAt)} />
                        </div>
                        <div className="rounded-xl border border-border/70 bg-secondary/40 px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Último erro</p>
                          <p className="mt-2 text-sm text-foreground">{integration.lastErrorMessage ?? "Nenhum erro registrado."}</p>
                          <p className="mt-2 text-xs text-muted-foreground">{formatTimestamp(integration.lastErrorAt)}</p>
                        </div>
                        {integration.docsHref ? (
                          <a
                            href={integration.docsHref}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-medium text-gym-accent hover:underline"
                          >
                            <Link2 className="size-4" />
                            Abrir documentação operacional
                          </a>
                        ) : null}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {!loading && visibleIntegrations.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card/60 px-4 py-3 text-sm text-muted-foreground">
                  Nenhuma integração corresponde ao filtro selecionado.
                </div>
              ) : null}
            </TabsContent>

            <TabsContent value="templates" className="space-y-4">
              {configError ? (
                <div className="rounded-2xl border border-gym-danger/30 bg-gym-danger/10 px-4 py-3 text-sm text-gym-danger">
                  {configError}
                </div>
              ) : null}

              <div className="grid gap-4 xl:grid-cols-2">
                {fields.map((field, index) => (
                  <Card key={field.id} className="border-border/80 bg-card/70">
                    <CardHeader className="space-y-1">
                      <div className="flex items-center justify-between gap-3">
                        <CardTitle className="text-lg">{field.nome}</CardTitle>
                        <Controller
                          control={form.control}
                          name={`emailTemplates.${index}.ativo`}
                          render={({ field: controllerField }) => (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Checkbox checked={controllerField.value} onCheckedChange={(checked) => controllerField.onChange(Boolean(checked))} />
                              Ativo
                            </div>
                          )}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">Slug canônico: {field.slug}</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor={`template-subject-${index}`}>Assunto</Label>
                        <Input id={`template-subject-${index}`} {...form.register(`emailTemplates.${index}.assunto`)} />
                        <FieldError message={form.formState.errors.emailTemplates?.[index]?.assunto?.message} />
                      </div>

                      <div className="grid gap-4 md:grid-cols-[160px_1fr]">
                        <div className="space-y-2">
                          <Label>Canal</Label>
                          <Controller
                            control={form.control}
                            name={`emailTemplates.${index}.canal`}
                            render={({ field: controllerField }) => (
                              <Select value={controllerField.value} onValueChange={controllerField.onChange}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="EMAIL">E-mail</SelectItem>
                                  <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                                  <SelectItem value="SMS">SMS</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`template-variables-${index}`}>Variáveis disponíveis</Label>
                          <Textarea
                            id={`template-variables-${index}`}
                            value={form.getValues(`emailTemplates.${index}.variables`).join(", ")}
                            onChange={(event) => {
                              const nextVariables = event.target.value
                                .split(",")
                                .map((item) => item.trim())
                                .filter(Boolean);
                              form.setValue(`emailTemplates.${index}.variables`, nextVariables, { shouldDirty: true });
                            }}
                            className="min-h-24"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Corpo do template</Label>
                        <Controller
                          control={form.control}
                          name={`emailTemplates.${index}.bodyHtml`}
                          render={({ field: controllerField }) => (
                            <RichTextEditor
                              value={controllerField.value}
                              onChange={controllerField.onChange}
                              placeholder="Monte o template global com placeholders como {{NOME_CLIENTE}}."
                            />
                          )}
                        />
                        <FieldError message={form.formState.errors.emailTemplates?.[index]?.bodyHtml?.message} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="termos" className="space-y-4">
              <Card className="border-border/80 bg-card/70">
                <CardHeader>
                  <CardTitle>Termos de uso globais</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Editor central para a versão canônica dos termos exibidos nos fluxos públicos e administrativos.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-[220px_1fr]">
                    <div className="space-y-2">
                      <Label htmlFor="terms-version">Versão publicada</Label>
                      <Input id="terms-version" {...form.register("termsVersion")} />
                      <FieldError message={form.formState.errors.termsVersion?.message} />
                    </div>
                    <div className="rounded-xl border border-border bg-secondary/30 px-4 py-3 text-sm text-muted-foreground">
                      Última atualização registrada:
                      <span className="ml-2 font-medium text-foreground">{formatTimestamp(config?.termsUpdatedAt)}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Conteúdo dos termos</Label>
                    <Controller
                      control={form.control}
                      name="termsOfUseHtml"
                      render={({ field }) => (
                        <RichTextEditor
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Descreva cláusulas, consentimento de dados, faturamento e aceite operacional."
                        />
                      )}
                    />
                    <FieldError message={form.formState.errors.termsOfUseHtml?.message} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="limites" className="space-y-4">
              <Card className="border-border/80 bg-card/70">
                <CardHeader>
                  <CardTitle>Rate limiting global</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Limites usados pelo ecossistema da plataforma para APIs públicas, webhooks e tráfego administrativo.
                  </p>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <NumberField
                    id="rpm-geral"
                    label="Requests por minuto"
                    error={form.formState.errors.apiLimits?.requestsPerMinute?.message}
                    inputProps={form.register("apiLimits.requestsPerMinute")}
                  />
                  <NumberField
                    id="burst-limit"
                    label="Burst máximo"
                    error={form.formState.errors.apiLimits?.burstLimit?.message}
                    inputProps={form.register("apiLimits.burstLimit")}
                  />
                  <NumberField
                    id="webhook-rpm"
                    label="Webhook RPM"
                    error={form.formState.errors.apiLimits?.webhookRequestsPerMinute?.message}
                    inputProps={form.register("apiLimits.webhookRequestsPerMinute")}
                  />
                  <NumberField
                    id="admin-rpm"
                    label="Admin RPM"
                    error={form.formState.errors.apiLimits?.adminRequestsPerMinute?.message}
                    inputProps={form.register("apiLimits.adminRequestsPerMinute")}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-2xl border border-border bg-secondary/30 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-3 font-display text-3xl font-bold leading-none text-foreground">{value}</p>
      <p className="mt-2 text-sm text-muted-foreground">{helper}</p>
    </div>
  );
}

function MetricChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-secondary/40 px-3 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}

function InlineMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-secondary/30 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm text-foreground">{value}</p>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-gym-danger">{message}</p>;
}

function NumberField({
  id,
  label,
  error,
  inputProps,
}: {
  id: string;
  label: string;
  error?: string;
  inputProps: UseFormRegisterReturn;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type="number" min={1} step={1} {...inputProps} />
      <FieldError message={error} />
    </div>
  );
}
