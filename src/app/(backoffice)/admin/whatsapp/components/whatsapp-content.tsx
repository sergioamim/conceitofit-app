"use client";

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckCircle2,
  MessageSquare,
  Pencil,
  Plus,
  ScrollText,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TableCell } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { PaginatedTable, type PaginatedTableColumn } from "@/components/shared/paginated-table";
import { TableFilters, type ActiveFilters, type FilterConfig } from "@/components/shared/table-filters";
import {
  getWhatsAppTemplatesApi,
  createWhatsAppTemplateApi,
  updateWhatsAppTemplateApi,
  deleteWhatsAppTemplateApi,
  getWhatsAppLogsApi,
} from "@/lib/api/whatsapp";
import { WhatsAppProviderConfig } from "../whatsapp-provider-config";
import {
  useWhatsAppConfig,
  useWhatsAppStats,
} from "@/lib/query/use-whatsapp";
import {
  useWhatsAppCredentials,
  useCreateWhatsAppCredential,
  useUpdateWhatsAppCredential,
  useDeleteWhatsAppCredential,
  useRefreshCredentialToken,
} from "@/lib/query/use-whatsapp-credentials";
import { TokenExpiryAlert } from "@/components/admin/token-expiry-alert";
import { CredentialList } from "@/components/admin/credential-list";
import { WhatsAppCredentialForm } from "@/components/admin/whatsapp-credential-form";
import type {
  WhatsAppCredentialResponse,
  WhatsAppCredentialRequest,
} from "@/lib/shared/types/whatsapp-crm";
import type { WhatsAppCredentialFormValues } from "@/lib/forms/atendimento-schemas";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import type {
  WhatsAppMessageLog,
  WhatsAppTemplate,
  WhatsAppTemplateEvent,
} from "@/lib/types";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import {
  whatsAppTemplateFormSchema,
  type WhatsAppTemplateFormValues,
} from "@/lib/forms/whatsapp-schemas";

const TIPO_LABELS: Record<string, string> = {
  WELCOME: "Boas-vindas",
  COBRANCA: "Cobranca",
  COBRANCA_PENDENTE: "Cobranca pendente",
  COBRANCA_VENCIDA: "Cobranca vencida",
  MATRICULA_VENCENDO: "Matricula vencendo",
  VENCIMENTO_MATRICULA: "Vencimento",
  PROSPECT_FOLLOWUP: "Follow-up prospect",
  FOLLOWUP_PROSPECT: "Follow-up",
  ANIVERSARIO: "Aniversario",
  CUSTOM: "Personalizado",
};

const STATUS_COLORS: Record<string, string> = {
  ENVIADA: "border-sky-500/30 bg-sky-500/10 text-sky-200",
  ENTREGUE: "border-gym-teal/30 bg-gym-teal/10 text-gym-teal",
  LIDA: "border-gym-accent/30 bg-gym-accent/10 text-gym-accent",
  FALHA: "border-gym-danger/30 bg-gym-danger/10 text-gym-danger",
};

const PAGE_SIZE = 15;

const TEMPLATES_TABLE_COLUMNS: PaginatedTableColumn[] = [
  { label: "Nome" },
  { label: "Slug", className: "hidden md:table-cell" },
  { label: "Tipo", className: "w-[140px]" },
  { label: "Status", className: "w-[100px]" },
  { label: "Conteúdo" },
  { label: "Variáveis", className: "hidden xl:table-cell" },
  { label: "Ações", className: "w-[140px]" },
];

const LOGS_TABLE_COLUMNS: PaginatedTableColumn[] = [
  { label: "Destinatário" },
  { label: "Template" },
  { label: "Status", className: "w-[120px]" },
  { label: "Enviado em", className: "w-[160px]" },
  { label: "Mensagem", className: "hidden xl:table-cell" },
];

const TEMPLATE_FILTER_CONFIGS: FilterConfig[] = [
  {
    type: "text",
    key: "busca",
    label: "Buscar",
    placeholder: "Nome ou slug...",
  },
  {
    type: "select",
    key: "tipo",
    label: "Tipo",
    placeholder: "Todos os tipos",
    options: [
      { value: "WELCOME", label: "Boas-vindas" },
      { value: "COBRANCA", label: "Cobranca" },
      { value: "VENCIMENTO_MATRICULA", label: "Vencimento" },
      { value: "FOLLOWUP_PROSPECT", label: "Follow-up" },
      { value: "CUSTOM", label: "Personalizado" },
    ],
  },
  {
    type: "status-badge",
    key: "ativo",
    label: "Status",
    options: [
      { value: "true", label: "Ativo", className: "bg-gym-teal/15 text-gym-teal border-gym-teal/30" },
      { value: "false", label: "Inativo", className: "bg-secondary text-muted-foreground border-border" },
    ],
  },
];

const LOG_FILTER_CONFIGS: FilterConfig[] = [
  {
    type: "text",
    key: "busca_log",
    label: "Buscar",
    placeholder: "Destinatario ou template...",
  },
  {
    type: "status-badge",
    key: "status_log",
    label: "Status",
    options: [
      { value: "ENVIADA", label: "Enviada", className: "bg-sky-500/15 text-sky-200 border-sky-500/30" },
      { value: "ENTREGUE", label: "Entregue", className: "bg-gym-teal/15 text-gym-teal border-gym-teal/30" },
      { value: "LIDA", label: "Lida", className: "bg-gym-accent/15 text-gym-accent border-gym-accent/30" },
      { value: "FALHA", label: "Falha", className: "bg-gym-danger/15 text-gym-danger border-gym-danger/30" },
    ],
  },
];

function formatTimestamp(value?: string) {
  if (!value) return "—";
  return value.slice(0, 16).replace("T", " ");
}

const EMPTY_FORM: WhatsAppTemplateFormValues = {
  nome: "",
  slug: "",
  tipo: "CUSTOM",
  conteudo: "",
  variables: "",
  ativo: true,
};

export function WhatsappContent() {
  const { toast } = useToast();
  const tenantContext = useTenantContext();
  const tenantId = tenantContext.tenantId ?? "";
  const { data: whatsAppConfig, isLoading: configLoading } = useWhatsAppConfig({
    tenantId: tenantId || undefined,
    tenantResolved: tenantContext.tenantResolved,
  });
  const { data: stats } = useWhatsAppStats({
    tenantId: tenantId || undefined,
    tenantResolved: tenantContext.tenantResolved,
  });
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [logs, setLogs] = useState<WhatsAppMessageLog[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // --- Credenciais ---
  const { data: credentials = [], isLoading: credentialsLoading } =
    useWhatsAppCredentials({
      tenantId: tenantId || undefined,
      tenantResolved: tenantContext.tenantResolved,
    });
  const createCredential = useCreateWhatsAppCredential();
  const updateCredential = useUpdateWhatsAppCredential();
  const deleteCredential = useDeleteWhatsAppCredential();
  const refreshToken = useRefreshCredentialToken();
  const [credDialogOpen, setCredDialogOpen] = useState(false);
  const [editingCredential, setEditingCredential] =
    useState<WhatsAppCredentialResponse | null>(null);

  // Filtros e paginacao — Templates
  const [templateFilters, setTemplateFilters] = useState<ActiveFilters>({});
  const [templatePage, setTemplatePage] = useState(0);

  // Filtros e paginacao — Logs
  const [logFilters, setLogFilters] = useState<ActiveFilters>({});
  const [logPage, setLogPage] = useState(0);

  const form = useForm<WhatsAppTemplateFormValues>({
    resolver: zodResolver(whatsAppTemplateFormSchema),
    mode: "onChange",
    defaultValues: EMPTY_FORM,
  });

  const loadData = useCallback(async () => {
    if (!tenantContext.tenantResolved || !tenantId) {
      return;
    }

    setLoading(true);
    try {
      const [templatesResult, logsResult] = await Promise.allSettled([
        getWhatsAppTemplatesApi(tenantId),
        getWhatsAppLogsApi({ size: 50, tenantId }),
      ]);
      if (templatesResult.status === "fulfilled") {
        setTemplates(templatesResult.value);
      }
      if (logsResult.status === "fulfilled") {
        setLogs(logsResult.value);
      }
    } finally {
      setLoading(false);
    }
  }, [tenantContext.tenantResolved, tenantId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // --- Dados filtrados: Templates ---
  const filteredTemplates = useMemo(() => {
    const busca = (templateFilters.busca ?? "").toLowerCase();
    const tipo = templateFilters.tipo ?? "";
    const ativo = templateFilters.ativo ?? "";

    return templates.filter((t) => {
      if (busca) {
        const match =
          t.nome.toLowerCase().includes(busca) ||
          (t.slug ?? "").toLowerCase().includes(busca);
        if (!match) return false;
      }
      if (tipo && (t.tipo ?? t.evento) !== tipo) return false;
      if (ativo === "true" && !t.ativo) return false;
      if (ativo === "false" && t.ativo) return false;
      return true;
    });
  }, [templates, templateFilters]);

  const templatePageItems = useMemo(
    () => filteredTemplates.slice(templatePage * PAGE_SIZE, (templatePage + 1) * PAGE_SIZE),
    [filteredTemplates, templatePage],
  );
  const templateHasNext = (templatePage + 1) * PAGE_SIZE < filteredTemplates.length;

  // --- Dados filtrados: Logs ---
  const filteredLogs = useMemo(() => {
    const busca = (logFilters.busca_log ?? "").toLowerCase();
    const status = logFilters.status_log ?? "";

    return logs.filter((l) => {
      if (busca) {
        const match =
          (l.destinatarioNome ?? "").toLowerCase().includes(busca) ||
          l.destinatario.toLowerCase().includes(busca) ||
          (l.templateNome ?? "").toLowerCase().includes(busca);
        if (!match) return false;
      }
      if (status && l.status !== status) return false;
      return true;
    });
  }, [logs, logFilters]);

  const logPageItems = useMemo(
    () => filteredLogs.slice(logPage * PAGE_SIZE, (logPage + 1) * PAGE_SIZE),
    [filteredLogs, logPage],
  );
  const logHasNext = (logPage + 1) * PAGE_SIZE < filteredLogs.length;

  const handleTemplateFiltersChange = useCallback((filters: ActiveFilters) => {
    setTemplateFilters(filters);
    setTemplatePage(0);
  }, []);

  const handleLogFiltersChange = useCallback((filters: ActiveFilters) => {
    setLogFilters(filters);
    setLogPage(0);
  }, []);

  // --- Renderers ---
  const renderTemplateCells = useCallback(
    (template: WhatsAppTemplate) => (
      <>
        <TableCell className="px-4 py-3">
          <p className="font-medium text-foreground">{template.nome}</p>
        </TableCell>
        <TableCell className="hidden px-4 py-3 text-sm text-muted-foreground md:table-cell">
          {template.slug ?? "—"}
        </TableCell>
        <TableCell className="px-4 py-3">
          <Badge className="border-border bg-secondary/50 text-muted-foreground">
            {TIPO_LABELS[template.tipo ?? template.evento] ?? template.tipo ?? template.evento}
          </Badge>
        </TableCell>
        <TableCell className="px-4 py-3">
          <Badge
            className={
              template.ativo
                ? "border-gym-teal/30 bg-gym-teal/10 text-gym-teal"
                : "border-border bg-secondary/50 text-muted-foreground"
            }
          >
            {template.ativo ? "Ativo" : "Inativo"}
          </Badge>
        </TableCell>
        <TableCell className="max-w-[260px] px-4 py-3">
          <p className="truncate text-sm text-muted-foreground">{template.conteudo}</p>
        </TableCell>
        <TableCell className="hidden px-4 py-3 xl:table-cell">
          <div className="flex flex-wrap gap-1">
            {(template.variables ?? template.variaveis ?? []).slice(0, 3).map((v) => (
              <Badge key={v} variant="outline" className="text-xs">
                {v}
              </Badge>
            ))}
            {(template.variables ?? template.variaveis ?? []).length > 3 && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                +{(template.variables ?? template.variaveis ?? []).length - 3}
              </Badge>
            )}
          </div>
        </TableCell>
        <TableCell className="px-4 py-3">
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                openEdit(template);
              }}
            >
              <Pencil className="size-3.5" />
              Editar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs text-gym-danger hover:text-gym-danger"
              onClick={(e) => {
                e.stopPropagation();
                void handleDelete(template.id);
              }}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </TableCell>
      </>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const renderLogCells = useCallback(
    (log: WhatsAppMessageLog) => (
      <>
        <TableCell className="px-4 py-3">
          <div>
            <p className="font-medium text-foreground">{log.destinatarioNome}</p>
            <p className="text-xs text-muted-foreground">{log.destinatario}</p>
          </div>
        </TableCell>
        <TableCell className="px-4 py-3 text-sm text-foreground">
          {log.templateNome}
        </TableCell>
        <TableCell className="px-4 py-3">
          <Badge
            className={
              STATUS_COLORS[log.status] ??
              "border-border bg-secondary/50 text-muted-foreground"
            }
          >
            {log.status === "ENVIADA" && <CheckCircle2 className="mr-1 size-3" />}
            {log.status === "FALHA" && <X className="mr-1 size-3" />}
            {log.status}
          </Badge>
        </TableCell>
        <TableCell className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
          {formatTimestamp(log.enviadoEm)}
        </TableCell>
        <TableCell className="hidden max-w-xs truncate px-4 py-3 text-sm text-muted-foreground xl:table-cell">
          {log.conteudo}
        </TableCell>
      </>
    ),
    [],
  );

  function openCreate() {
    setEditingId(null);
    form.reset(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(template: WhatsAppTemplate) {
    setEditingId(template.id);
    form.reset({
      nome: template.nome,
      slug: template.slug ?? template.nome.toLowerCase().replace(/\s+/g, "-"),
      tipo: (template.tipo ?? template.evento) as WhatsAppTemplateFormValues["tipo"],
      conteudo: template.conteudo,
      variables: (template.variables ?? template.variaveis ?? []).join(", "),
      ativo: template.ativo,
    });
    setDialogOpen(true);
  }

  async function handleSave(values: WhatsAppTemplateFormValues) {
    try {
      const variables = values.variables
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);

      const templateData = {
        evento: values.tipo as WhatsAppTemplateEvent,
        nome: values.nome,
        slug: values.slug,
        tipo: values.tipo as WhatsAppTemplateEvent,
        conteudo: values.conteudo,
        variaveis: variables,
        variables,
        ativo: values.ativo,
      };

      if (editingId) {
        await updateWhatsAppTemplateApi({ tenantId: "", id: editingId, data: templateData });
        toast({ title: "Template atualizado" });
      } else {
        await createWhatsAppTemplateApi({ tenantId: "", data: templateData });
        toast({ title: "Template criado" });
      }
      setDialogOpen(false);
      void loadData();
    } catch (error) {
      toast({
        title: "Erro ao salvar template",
        description: normalizeErrorMessage(error),
        variant: "destructive",
      });
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteWhatsAppTemplateApi({ tenantId: "", id });
      toast({ title: "Template removido" });
      void loadData();
    } catch (error) {
      toast({
        title: "Erro ao remover template",
        description: normalizeErrorMessage(error),
        variant: "destructive",
      });
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
                Comunicacao
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold tracking-tight">
                  WhatsApp
                </h1>
                <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                  Gerencie templates de mensagens e acompanhe o historico de
                  envios via WhatsApp.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 border-b border-border px-6 py-5 md:grid-cols-6">
          <StatCard
            label="Templates"
            value={loading ? "…" : String(templates.length)}
            helper="Total cadastrados"
          />
          <StatCard
            label="Ativos"
            value={loading ? "…" : String(templates.filter((t) => t.ativo).length)}
            helper="Habilitados para envio"
          />
          <StatCard
            label="Enviadas"
            value={stats ? String(stats.total) : loading ? "…" : String(logs.length)}
            helper="Total de mensagens"
          />
          <StatCard
            label="Entregues"
            value={stats ? String(stats.entregues) : "…"}
            helper={stats ? `${stats.taxaEntrega.toFixed(0)}% taxa entrega` : "Calculando..."}
          />
          <StatCard
            label="Lidas"
            value={stats ? String(stats.lidas) : "…"}
            helper={stats ? `${stats.taxaLeitura.toFixed(0)}% taxa leitura` : "Calculando..."}
          />
          <StatCard
            label="Falhas"
            value={
              stats
                ? String(stats.falhas)
                : loading
                  ? "…"
                  : String(logs.filter((l) => l.status === "FALHA").length)
            }
            helper="Mensagens com erro de envio"
          />
        </div>

        <div className="px-6 py-6">
          <Tabs defaultValue="templates" className="space-y-6">
            <TabsList className="grid h-auto grid-cols-4 gap-1 rounded-2xl bg-secondary/50 p-1">
              <TabsTrigger value="templates" className="rounded-xl">
                <MessageSquare className="mr-2 size-4" />
                Templates
              </TabsTrigger>
              <TabsTrigger value="logs" className="rounded-xl">
                <ScrollText className="mr-2 size-4" />
                Logs de Envio
              </TabsTrigger>
              <TabsTrigger value="credenciais" className="rounded-xl">
                <ShieldCheck className="mr-2 size-4" />
                Credenciais
              </TabsTrigger>
              <TabsTrigger value="config" className="rounded-xl">
                Configuração
              </TabsTrigger>
            </TabsList>

            {/* --- Tab Templates --- */}
            <TabsContent value="templates" className="space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <TableFilters
                  filters={TEMPLATE_FILTER_CONFIGS}
                  onFiltersChange={handleTemplateFiltersChange}
                />
                <Button onClick={openCreate}>
                  <Plus className="mr-2 size-4" />
                  Novo Template
                </Button>
              </div>

              <PaginatedTable
                columns={TEMPLATES_TABLE_COLUMNS}
                items={templatePageItems}
                emptyText="Nenhum template encontrado."
                renderCells={renderTemplateCells}
                getRowKey={(t) => t.id}
                isLoading={loading}
                page={templatePage}
                pageSize={PAGE_SIZE}
                total={filteredTemplates.length}
                hasNext={templateHasNext}
                onPrevious={() => setTemplatePage((p) => Math.max(0, p - 1))}
                onNext={() => setTemplatePage((p) => p + 1)}
                itemLabel="templates"
                tableAriaLabel="Tabela de templates de WhatsApp"
              />
            </TabsContent>

            {/* --- Tab Logs --- */}
            <TabsContent value="logs" className="space-y-4">
              <TableFilters
                filters={LOG_FILTER_CONFIGS}
                onFiltersChange={handleLogFiltersChange}
              />

              <PaginatedTable
                columns={LOGS_TABLE_COLUMNS}
                items={logPageItems}
                emptyText="Nenhuma mensagem enviada ainda."
                renderCells={renderLogCells}
                getRowKey={(l) => l.id}
                isLoading={loading}
                page={logPage}
                pageSize={PAGE_SIZE}
                total={filteredLogs.length}
                hasNext={logHasNext}
                onPrevious={() => setLogPage((p) => Math.max(0, p - 1))}
                onNext={() => setLogPage((p) => p + 1)}
                itemLabel="mensagens"
                tableAriaLabel="Tabela de logs de envio WhatsApp"
              />
            </TabsContent>

            {/* --- Tab Credenciais (Task 511) --- */}
            <TabsContent value="credenciais" className="space-y-4">
              <TokenExpiryAlert
                credentials={credentials}
                onRenew={(ids) => {
                  for (const credId of ids) {
                    refreshToken.mutate(
                      { tenantId, id: credId },
                      {
                        onSuccess: () =>
                          toast({ title: "Token renovado com sucesso" }),
                        onError: (err) =>
                          toast({
                            title: "Erro ao renovar token",
                            description: normalizeErrorMessage(err),
                            variant: "destructive",
                          }),
                      },
                    );
                  }
                }}
              />

              <CredentialList
                credentials={credentials}
                isLoading={credentialsLoading}
                onEdit={(cred) => {
                  setEditingCredential(cred);
                  setCredDialogOpen(true);
                }}
                onDelete={(credId) => {
                  deleteCredential.mutate(
                    { tenantId, id: credId },
                    {
                      onSuccess: () =>
                        toast({ title: "Credencial removida" }),
                      onError: (err) =>
                        toast({
                          title: "Erro ao remover credencial",
                          description: normalizeErrorMessage(err),
                          variant: "destructive",
                        }),
                    },
                  );
                }}
                onHealthCheck={(credId) => {
                  toast({ title: "Health check solicitado" });
                }}
                onRefreshToken={(credId) => {
                  refreshToken.mutate(
                    { tenantId, id: credId },
                    {
                      onSuccess: () =>
                        toast({ title: "Token renovado" }),
                      onError: (err) =>
                        toast({
                          title: "Erro ao renovar token",
                          description: normalizeErrorMessage(err),
                          variant: "destructive",
                        }),
                    },
                  );
                }}
              />

              <Button
                onClick={() => {
                  setEditingCredential(null);
                  setCredDialogOpen(true);
                }}
              >
                <Plus className="mr-2 size-4" />
                Nova Credencial
              </Button>

              <Dialog open={credDialogOpen} onOpenChange={setCredDialogOpen}>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>
                      {editingCredential
                        ? "Editar Credencial"
                        : "Nova Credencial"}
                    </DialogTitle>
                  </DialogHeader>
                  <WhatsAppCredentialForm
                    credential={editingCredential}
                    tenantId={tenantId}
                    isSubmitting={
                      createCredential.isPending || updateCredential.isPending
                    }
                    onCancel={() => setCredDialogOpen(false)}
                    onSave={(values: WhatsAppCredentialFormValues) => {
                      const request: WhatsAppCredentialRequest = {
                        tenantId: values.tenantId,
                        academiaId: values.academiaId,
                        unidadeId: values.unidadeId,
                        businessAccountId: values.businessAccountId,
                        wabaId: values.wabaId,
                        phoneId: values.phoneId,
                        phoneNumber: values.phoneNumber,
                        mode: values.mode,
                        accessToken: values.accessToken,
                        accessTokenExpiresAt: values.accessTokenExpiresAt,
                        webhookVerifyToken: values.webhookVerifyToken,
                      };

                      if (editingCredential) {
                        updateCredential.mutate(
                          {
                            tenantId,
                            id: editingCredential.id,
                            data: request,
                          },
                          {
                            onSuccess: () => {
                              toast({ title: "Credencial atualizada" });
                              setCredDialogOpen(false);
                            },
                            onError: (err) =>
                              toast({
                                title: "Erro ao atualizar",
                                description: normalizeErrorMessage(err),
                                variant: "destructive",
                              }),
                          },
                        );
                      } else {
                        createCredential.mutate(
                          { tenantId, data: request },
                          {
                            onSuccess: () => {
                              toast({ title: "Credencial criada" });
                              setCredDialogOpen(false);
                            },
                            onError: (err) =>
                              toast({
                                title: "Erro ao criar",
                                description: normalizeErrorMessage(err),
                                variant: "destructive",
                              }),
                          },
                        );
                      }
                    }}
                  />
                </DialogContent>
              </Dialog>
            </TabsContent>

            {/* --- Tab Configuração (Task 481) --- */}
            <TabsContent value="config" className="space-y-4">
              <WhatsAppProviderConfig
                config={whatsAppConfig}
                tenantId={tenantId}
                isLoading={configLoading}
              />
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* --- Dialog Criar/Editar Template --- */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar Template" : "Novo Template"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit(handleSave)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="tpl-nome">
                Nome <span className="text-gym-danger">*</span>
              </Label>
              <Input
                id="tpl-nome"
                {...form.register("nome")}
                aria-invalid={form.formState.errors.nome ? "true" : "false"}
              />
              {form.formState.errors.nome && (
                <p className="text-xs text-gym-danger">
                  {form.formState.errors.nome.message}
                </p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tpl-slug">Slug</Label>
                <Input
                  id="tpl-slug"
                  placeholder="ex: welcome_student"
                  {...form.register("slug")}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Controller
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WELCOME">Boas-vindas</SelectItem>
                        <SelectItem value="COBRANCA">Cobranca</SelectItem>
                        <SelectItem value="VENCIMENTO_MATRICULA">
                          Vencimento
                        </SelectItem>
                        <SelectItem value="FOLLOWUP_PROSPECT">
                          Follow-up
                        </SelectItem>
                        <SelectItem value="CUSTOM">Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tpl-conteudo">
                Conteudo (use {"{{VARIAVEL}}"} para placeholders){" "}
                <span className="text-gym-danger">*</span>
              </Label>
              <Textarea
                id="tpl-conteudo"
                placeholder="Ola {{NOME}}, seja bem-vindo a {{ACADEMIA}}!"
                {...form.register("conteudo")}
                aria-invalid={form.formState.errors.conteudo ? "true" : "false"}
                className="min-h-28"
              />
              {form.formState.errors.conteudo && (
                <p className="text-xs text-gym-danger">
                  {form.formState.errors.conteudo.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tpl-variables">
                Variaveis (separadas por virgula)
              </Label>
              <Input
                id="tpl-variables"
                placeholder="{{NOME}}, {{ACADEMIA}}, {{PLANO}}"
                {...form.register("variables")}
              />
            </div>

            <Controller
              control={form.control}
              name="ativo"
              render={({ field }) => (
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) =>
                      field.onChange(Boolean(checked))
                    }
                  />
                  <Label>Template ativo</Label>
                </div>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={!form.formState.isValid}>
                {editingId ? "Salvar" : "Criar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-secondary/30 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-3 font-display text-3xl font-bold leading-none text-foreground">
        {value}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">{helper}</p>
    </div>
  );
}
