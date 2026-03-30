"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageSquare, Plus, Send, Settings, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ListErrorState } from "@/components/shared/list-states";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import {
  getWhatsAppConfigApi,
  saveWhatsAppConfigApi,
  testWhatsAppConnectionApi,
  listWhatsAppTemplatesApi,
  createWhatsAppTemplateApi,
  updateWhatsAppTemplateApi,
  deleteWhatsAppTemplateApi,
  listWhatsAppLogsApi,
} from "@/lib/api/whatsapp";
import type {
  WhatsAppConfig,
  WhatsAppMessageLog,
  WhatsAppTemplate,
  WhatsAppTemplateEvent,
} from "@/lib/types";

const EVENTO_LABEL: Record<WhatsAppTemplateEvent, string> = {
  WELCOME: "Boas-vindas",
  MATRICULA_VENCENDO: "Matricula vencendo",
  COBRANCA_PENDENTE: "Cobranca pendente",
  COBRANCA_VENCIDA: "Cobranca vencida",
  PROSPECT_FOLLOWUP: "Follow-up prospect",
  ANIVERSARIO: "Aniversario",
  CUSTOM: "Personalizado",
};

const STATUS_CLASS: Record<string, string> = {
  ENVIADA: "bg-gym-accent/15 text-gym-accent",
  ENTREGUE: "bg-gym-teal/15 text-gym-teal",
  LIDA: "bg-gym-teal/15 text-gym-teal",
  FALHA: "bg-gym-danger/15 text-gym-danger",
};

function formatDateTime(v?: string) {
  if (!v) return "—";
  return new Date(v).toLocaleString("pt-BR");
}

type Tab = "config" | "templates" | "logs";

type TemplateForm = {
  evento: WhatsAppTemplateEvent;
  nome: string;
  conteudo: string;
  ativo: boolean;
};

const INITIAL_TEMPLATE: TemplateForm = {
  evento: "WELCOME",
  nome: "",
  conteudo: "",
  ativo: true,
};

export default function WhatsAppPage() {
  const { tenantId, tenantResolved } = useTenantContext();
  const [tab, setTab] = useState<Tab>("config");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Config
  const [config, setConfig] = useState<WhatsAppConfig | null>(null);
  const [configForm, setConfigForm] = useState({
    provedor: "EVOLUTION_API" as WhatsAppConfig["provedor"],
    apiUrl: "",
    apiKey: "",
    instanciaId: "",
    numeroRemetente: "",
    ativo: false,
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  // Templates
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [openTemplateModal, setOpenTemplateModal] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [templateForm, setTemplateForm] = useState<TemplateForm>(INITIAL_TEMPLATE);

  // Logs
  const [logs, setLogs] = useState<WhatsAppMessageLog[]>([]);

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const [cfg, tpls, lgs] = await Promise.all([
        getWhatsAppConfigApi({ tenantId }),
        listWhatsAppTemplatesApi({ tenantId }),
        listWhatsAppLogsApi({ tenantId, size: 50 }),
      ]);
      setConfig(cfg);
      if (cfg) {
        setConfigForm({
          provedor: cfg.provedor,
          apiUrl: cfg.apiUrl ?? "",
          apiKey: cfg.apiKey ?? "",
          instanciaId: cfg.instanciaId ?? "",
          numeroRemetente: cfg.numeroRemetente ?? "",
          ativo: cfg.ativo,
        });
      }
      setTemplates(tpls);
      setLogs(lgs);
    } catch (err) {
      setError(normalizeErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    if (tenantResolved && tenantId) void load();
  }, [load, tenantResolved, tenantId]);

  async function handleSaveConfig() {
    if (!tenantId) return;
    setSaving(true);
    try {
      const saved = await saveWhatsAppConfigApi({ tenantId, data: configForm });
      setConfig(saved);
    } catch (err) {
      setError(normalizeErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleTestConnection() {
    if (!tenantId) return;
    setTesting(true);
    try {
      const result = await testWhatsAppConnectionApi({ tenantId });
      alert(result.success ? "Conexao OK!" : `Falha: ${result.message ?? "Erro desconhecido"}`);
    } catch (err) {
      alert(`Erro: ${normalizeErrorMessage(err)}`);
    } finally {
      setTesting(false);
    }
  }

  function openNewTemplate() {
    setEditingTemplateId(null);
    setTemplateForm(INITIAL_TEMPLATE);
    setOpenTemplateModal(true);
  }

  function openEditTemplate(tpl: WhatsAppTemplate) {
    setEditingTemplateId(tpl.id);
    setTemplateForm({
      evento: tpl.evento,
      nome: tpl.nome,
      conteudo: tpl.conteudo,
      ativo: tpl.ativo,
    });
    setOpenTemplateModal(true);
  }

  async function handleSaveTemplate() {
    if (!tenantId || !templateForm.nome.trim() || !templateForm.conteudo.trim()) return;
    try {
      if (editingTemplateId) {
        await updateWhatsAppTemplateApi({ tenantId, id: editingTemplateId, data: templateForm });
      } else {
        const variaveis = (templateForm.conteudo.match(/\{\{(\w+)\}\}/g) ?? []).map((v) => v.replace(/\{|\}/g, ""));
        await createWhatsAppTemplateApi({ tenantId, data: { ...templateForm, variaveis } });
      }
      setOpenTemplateModal(false);
      const updated = await listWhatsAppTemplatesApi({ tenantId });
      setTemplates(updated);
    } catch (err) {
      setError(normalizeErrorMessage(err));
    }
  }

  async function handleDeleteTemplate(id: string) {
    if (!tenantId || !confirm("Remover este template?")) return;
    try {
      await deleteWhatsAppTemplateApi({ tenantId, id });
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(normalizeErrorMessage(err));
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Administrativo</p>
        <h1 className="font-display text-2xl font-bold tracking-tight">WhatsApp</h1>
        <p className="mt-1 text-sm text-muted-foreground">Configuracao, templates de mensagem e historico de envios.</p>
      </div>

      {error ? <ListErrorState error={error} onRetry={() => void load()} /> : null}

      {/* Tabs */}
      <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-2">
        {([
          { key: "config" as Tab, label: "Configuracao", icon: Settings },
          { key: "templates" as Tab, label: "Templates", icon: MessageSquare },
          { key: "logs" as Tab, label: "Historico", icon: Send },
        ]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              tab === key ? "bg-gym-accent/15 text-gym-accent" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl border border-border bg-card/60" />
          ))}
        </div>
      ) : (
        <>
          {/* Config tab */}
          {tab === "config" ? (
            <div className="rounded-xl border border-border bg-card p-5 space-y-5">
              <h2 className="font-display text-base font-semibold">Configuracao do provedor</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Provedor</label>
                  <Select value={configForm.provedor} onValueChange={(v) => setConfigForm({ ...configForm, provedor: v as WhatsAppConfig["provedor"] })}>
                    <SelectTrigger className="border-border bg-secondary"><SelectValue /></SelectTrigger>
                    <SelectContent className="border-border bg-card">
                      <SelectItem value="EVOLUTION_API">Evolution API</SelectItem>
                      <SelectItem value="WHATSAPP_BUSINESS">WhatsApp Business API</SelectItem>
                      <SelectItem value="OUTRO">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">URL da API</label>
                  <Input value={configForm.apiUrl} onChange={(e) => setConfigForm({ ...configForm, apiUrl: e.target.value })} placeholder="https://api.example.com" className="border-border bg-secondary" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Chave da API</label>
                  <Input type="password" value={configForm.apiKey} onChange={(e) => setConfigForm({ ...configForm, apiKey: e.target.value })} placeholder="sk_..." className="border-border bg-secondary font-mono" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">ID da instancia</label>
                  <Input value={configForm.instanciaId} onChange={(e) => setConfigForm({ ...configForm, instanciaId: e.target.value })} placeholder="instancia-01" className="border-border bg-secondary" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Numero remetente</label>
                  <Input value={configForm.numeroRemetente} onChange={(e) => setConfigForm({ ...configForm, numeroRemetente: e.target.value })} placeholder="5511999990000" className="border-border bg-secondary" />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <input type="checkbox" checked={configForm.ativo} onChange={(e) => setConfigForm({ ...configForm, ativo: e.target.checked })} />
                    Ativar envio de mensagens
                  </label>
                </div>
              </div>
              <div className="flex gap-2 border-t border-border pt-4">
                <Button variant="outline" onClick={handleTestConnection} disabled={testing} className="border-border">
                  {testing ? "Testando..." : "Testar conexao"}
                </Button>
                <Button onClick={handleSaveConfig} disabled={saving}>
                  {saving ? "Salvando..." : "Salvar configuracao"}
                </Button>
              </div>
            </div>
          ) : null}

          {/* Templates tab */}
          {tab === "templates" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-base font-semibold">Templates de mensagem</h2>
                <Button onClick={openNewTemplate} size="sm"><Plus className="size-4" /> Novo template</Button>
              </div>
              {templates.length === 0 ? (
                <div className="rounded-xl border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
                  Nenhum template cadastrado.
                </div>
              ) : (
                <div className="space-y-2">
                  {templates.map((tpl) => (
                    <div key={tpl.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{tpl.nome}</p>
                          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                            {EVENTO_LABEL[tpl.evento] ?? tpl.evento}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${tpl.ativo ? "bg-gym-teal/15 text-gym-teal" : "bg-muted text-muted-foreground"}`}>
                            {tpl.ativo ? "Ativo" : "Inativo"}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-xs text-muted-foreground">{tpl.conteudo}</p>
                        {tpl.variaveis.length > 0 ? (
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            Variaveis: {tpl.variaveis.map((v) => `{{${v}}}`).join(", ")}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="text-xs" onClick={() => openEditTemplate(tpl)}>Editar</Button>
                        <Button variant="ghost" size="sm" className="text-xs text-gym-danger" onClick={() => handleDeleteTemplate(tpl.id)}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Dialog open={openTemplateModal} onOpenChange={setOpenTemplateModal}>
                <DialogContent className="border-border bg-card sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="font-display">{editingTemplateId ? "Editar template" : "Novo template"}</DialogTitle>
                    <DialogDescription>Use {`{{NOME}}`}, {`{{TELEFONE}}`}, {`{{PLANO}}`} etc. como variaveis.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nome</label>
                        <Input value={templateForm.nome} onChange={(e) => setTemplateForm({ ...templateForm, nome: e.target.value })} className="border-border bg-secondary" placeholder="Boas-vindas novo aluno" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Evento</label>
                        <Select value={templateForm.evento} onValueChange={(v) => setTemplateForm({ ...templateForm, evento: v as WhatsAppTemplateEvent })}>
                          <SelectTrigger className="border-border bg-secondary"><SelectValue /></SelectTrigger>
                          <SelectContent className="border-border bg-card">
                            {Object.entries(EVENTO_LABEL).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Conteudo da mensagem</label>
                      <textarea
                        value={templateForm.conteudo}
                        onChange={(e) => setTemplateForm({ ...templateForm, conteudo: e.target.value })}
                        placeholder={`Ola {{NOME}}! Bem-vindo a {{ACADEMIA}}. Seu plano {{PLANO}} esta ativo.`}
                        className="h-32 w-full resize-y rounded-md border border-border bg-secondary p-3 text-sm outline-none focus:ring-1 focus:ring-gym-accent"
                      />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <input type="checkbox" checked={templateForm.ativo} onChange={(e) => setTemplateForm({ ...templateForm, ativo: e.target.checked })} />
                      Template ativo
                    </label>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpenTemplateModal(false)} className="border-border">Cancelar</Button>
                    <Button onClick={handleSaveTemplate} disabled={!templateForm.nome.trim() || !templateForm.conteudo.trim()}>Salvar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          ) : null}

          {/* Logs tab */}
          {tab === "logs" ? (
            <div className="space-y-4">
              <h2 className="font-display text-base font-semibold">Historico de envios</h2>
              {logs.length === 0 ? (
                <div className="rounded-xl border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
                  Nenhuma mensagem enviada ainda.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-secondary text-[11px] uppercase tracking-wider text-muted-foreground">
                        <th scope="col" className="px-3 py-2 text-left font-semibold">Data</th>
                        <th scope="col" className="px-3 py-2 text-left font-semibold">Destinatario</th>
                        <th scope="col" className="px-3 py-2 text-left font-semibold">Evento</th>
                        <th scope="col" className="px-3 py-2 text-left font-semibold">Template</th>
                        <th scope="col" className="px-3 py-2 text-center font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-secondary/30">
                          <td className="px-3 py-2 text-xs text-muted-foreground">{formatDateTime(log.enviadoEm)}</td>
                          <td className="px-3 py-2">
                            <p className="text-sm font-medium">{log.destinatarioNome ?? log.destinatario}</p>
                            <p className="text-xs text-muted-foreground">{log.destinatario}</p>
                          </td>
                          <td className="px-3 py-2">
                            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                              {EVENTO_LABEL[log.evento] ?? log.evento}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">{log.templateNome ?? "—"}</td>
                          <td className="px-3 py-2 text-center">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_CLASS[log.status] ?? "bg-secondary text-muted-foreground"}`}>
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
