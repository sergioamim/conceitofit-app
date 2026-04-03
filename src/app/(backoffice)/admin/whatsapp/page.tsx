"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckCircle2,
  MessageSquare,
  Pencil,
  Plus,
  ScrollText,
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
import { SuggestionInput } from "@/components/shared/suggestion-input";
import { useAcademiaSuggestion } from "@/app/(backoffice)/lib/use-academia-suggestion";
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
import type {
  WhatsAppMessageLog,
  WhatsAppTemplate,
  WhatsAppTemplateType,
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
      { value: "COBRANCA", label: "Cobrança" },
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
    placeholder: "Destinatário ou template...",
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

export default function AdminWhatsAppPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [logs, setLogs] = useState<WhatsAppMessageLog[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [selectedAcademiaId, setSelectedAcademiaId] = useState("");
  const [academiaBusca, setAcademiaBusca] = useState("");
  const {
    options: academiaOptions,
    onFocusOpen: academiaFocusOpen,
  } = useAcademiaSuggestion();

  const form = useForm<WhatsAppTemplateFormValues>({
    resolver: zodResolver(whatsAppTemplateFormSchema),
    defaultValues: EMPTY_FORM,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const tenantId = selectedAcademiaId || undefined;
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
  }, [selectedAcademiaId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function handleAcademiaLimpar() {
    setSelectedAcademiaId("");
    setAcademiaBusca("");
  }

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
                Comunicação
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold tracking-tight">
                  WhatsApp
                </h1>
                <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                  Gerencie templates de mensagens e acompanhe o histórico de
                  envios via WhatsApp.
                </p>
              </div>
            </div>
            <div className="flex items-end gap-2">
              <div className="w-72 space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Academia
                </label>
                <SuggestionInput
                  inputId="whatsapp-academia-filter"
                  inputAriaLabel="Filtrar por academia"
                  value={academiaBusca}
                  onValueChange={(v) => {
                    setAcademiaBusca(v);
                    if (!v) {
                      setSelectedAcademiaId("");
                    }
                  }}
                  onSelect={(option) => {
                    setSelectedAcademiaId(option.id);
                    setAcademiaBusca(option.label);
                  }}
                  onFocusOpen={academiaFocusOpen}
                  options={academiaOptions}
                  placeholder="Buscar academia..."
                  emptyText="Nenhuma academia encontrada"
                  preloadOnFocus
                />
              </div>
              {selectedAcademiaId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAcademiaLimpar}
                  className="mb-0.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="mr-1 size-3.5" />
                  Limpar
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4 border-b border-border px-6 py-5 md:grid-cols-4">
          <StatCard
            label="Templates"
            value={loading ? "…" : String(templates.length)}
            helper="Total de templates cadastrados"
          />
          <StatCard
            label="Ativos"
            value={
              loading
                ? "…"
                : String(templates.filter((t) => t.ativo).length)
            }
            helper="Templates habilitados para envio"
          />
          <StatCard
            label="Mensagens enviadas"
            value={loading ? "…" : String(logs.length)}
            helper="Total registrado no período"
          />
          <StatCard
            label="Falhas"
            value={
              loading
                ? "…"
                : String(logs.filter((l) => l.status === "FALHA").length)
            }
            helper="Mensagens com erro de envio"
          />
        </div>

        <div className="px-6 py-6">
          <Tabs defaultValue="templates" className="space-y-6">
            <TabsList className="grid h-auto grid-cols-2 gap-1 rounded-2xl bg-secondary/50 p-1">
              <TabsTrigger value="templates" className="rounded-xl">
                <MessageSquare className="mr-2 size-4" />
                Templates
              </TabsTrigger>
              <TabsTrigger value="logs" className="rounded-xl">
                <ScrollText className="mr-2 size-4" />
                Logs de Envio
              </TabsTrigger>
            </TabsList>

            {/* --- Tab Templates --- */}
            <TabsContent value="templates" className="space-y-4">
              <div className="flex justify-end">
                <Button onClick={openCreate}>
                  <Plus className="mr-2 size-4" />
                  Novo Template
                </Button>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                {templates.map((template) => (
                  <Card
                    key={template.id}
                    className="border-border/80 bg-card/70"
                  >
                    <CardHeader className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">
                            {template.nome}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {template.slug}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={
                              template.ativo
                                ? "border-gym-teal/30 bg-gym-teal/10 text-gym-teal"
                                : "border-border bg-secondary/50 text-muted-foreground"
                            }
                          >
                            {template.ativo ? "Ativo" : "Inativo"}
                          </Badge>
                          <Badge className="border-border bg-secondary/50 text-muted-foreground">
                            {TIPO_LABELS[template.tipo ?? template.evento] ?? template.tipo ?? template.evento}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="rounded-xl border border-border/70 bg-secondary/40 px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Conteúdo
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">
                          {template.conteudo}
                        </p>
                      </div>
                      {(template.variables ?? template.variaveis ?? []).length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {(template.variables ?? template.variaveis ?? []).map((v) => (
                            <Badge
                              key={v}
                              variant="outline"
                              className="text-xs"
                            >
                              {v}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(template)}
                        >
                          <Pencil className="mr-1 size-3.5" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-gym-danger hover:text-gym-danger"
                          onClick={() => void handleDelete(template.id)}
                        >
                          <Trash2 className="mr-1 size-3.5" />
                          Remover
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {!loading && templates.length === 0 && (
                <div className="rounded-2xl border border-border bg-card/60 px-4 py-8 text-center text-sm text-muted-foreground">
                  Nenhum template cadastrado. Crie o primeiro template para
                  começar a enviar mensagens.
                </div>
              )}
            </TabsContent>

            {/* --- Tab Logs --- */}
            <TabsContent value="logs" className="space-y-4">
              <div className="overflow-hidden rounded-2xl border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border bg-secondary/40">
                      <TableHead>Destinatário</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Enviado em</TableHead>
                      <TableHead className="hidden xl:table-cell">
                        Mensagem
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id} className="border-border">
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {log.destinatarioNome}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {log.destinatario}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.templateNome}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              STATUS_COLORS[log.status] ??
                              "border-border bg-secondary/50 text-muted-foreground"
                            }
                          >
                            {log.status === "ENVIADA" && (
                              <CheckCircle2 className="mr-1 size-3" />
                            )}
                            {log.status === "FALHA" && (
                              <X className="mr-1 size-3" />
                            )}
                            {log.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatTimestamp(log.enviadoEm)}
                        </TableCell>
                        <TableCell className="hidden max-w-xs truncate text-sm text-muted-foreground xl:table-cell">
                          {log.conteudo}
                        </TableCell>
                      </TableRow>
                    ))}
                    {!loading && logs.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="py-8 text-center text-sm text-muted-foreground"
                        >
                          Nenhuma mensagem enviada ainda.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
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
              <Label htmlFor="tpl-nome">Nome</Label>
              <Input id="tpl-nome" {...form.register("nome")} />
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
                        <SelectItem value="COBRANCA">Cobrança</SelectItem>
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
                Conteúdo (use {"{{VARIAVEL}}"} para placeholders)
              </Label>
              <Textarea
                id="tpl-conteudo"
                className="min-h-28"
                placeholder="Olá {{NOME}}, seja bem-vindo à {{ACADEMIA}}!"
                {...form.register("conteudo")}
              />
              {form.formState.errors.conteudo && (
                <p className="text-xs text-gym-danger">
                  {form.formState.errors.conteudo.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tpl-variables">
                Variáveis (separadas por vírgula)
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
              <Button type="submit">
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
