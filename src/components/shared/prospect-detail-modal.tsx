"use client";

import { useEffect, useRef, useState } from "react";
import {
  addProspectMensagemApi,
  criarProspectAgendamentoApi,
  listProspectAgendamentosApi,
  listProspectMensagensApi,
  marcarProspectPerdidoApi,
  updateProspectAgendamentoApi,
  updateProspectStatusApi,
} from "@/lib/api/crm";
import { getActiveTenantIdFromSession } from "@/lib/api/session";
import {
  canTransitionProspectStatus,
  getNextProspectStatus,
  getSelectableProspectStatuses,
} from "@/lib/crm/prospect-status";
import { useTenantContext } from "@/hooks/use-session-context";
import type {
  Prospect,
  StatusProspect,
  Funcionario,
  ProspectMensagem,
  ProspectAgendamento,
  StatusAgendamento,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const STATUS_COLUMNS: { key: StatusProspect; label: string }[] = [
  { key: "NOVO", label: "Novo" },
  { key: "AGENDOU_VISITA", label: "Agendou visita" },
  { key: "VISITOU", label: "Visitou" },
  { key: "EM_CONTATO", label: "Em contato" },
  { key: "CONVERTIDO", label: "Convertido" },
  { key: "PERDIDO", label: "Perdido" },
];

const ORIGEM_LABEL: Record<string, string> = {
  VISITA_PRESENCIAL: "Visita presencial",
  WHATSAPP: "WhatsApp",
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  INDICACAO: "Indicação",
  SITE: "Site",
  OUTROS: "Outros",
};

const STATUS_AG_LABEL: Record<StatusAgendamento, string> = {
  AGENDADO: "Agendado",
  REALIZADO: "Realizado",
  CANCELADO: "Cancelado",
};

function formatDatetime(dt: string) {
  const d = new Date(dt);
  return d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR");
}

type Tab = "detalhes" | "conversa" | "agenda";

export function ProspectDetailModal({
  prospect,
  funcionarios,
  onClose,
  onChanged,
}: {
  prospect: Prospect | null;
  funcionarios: Funcionario[];
  onClose: () => void;
  onChanged: () => void;
}) {
  const tenantContext = useTenantContext();
  const [tab, setTab] = useState<Tab>("detalhes");
  const [mensagens, setMensagens] = useState<ProspectMensagem[]>([]);
  const [agendamentos, setAgendamentos] = useState<ProspectAgendamento[]>([]);
  const [msgTexto, setMsgTexto] = useState("");
  const [autorNome, setAutorNome] = useState("Academia");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [agendaOpen, setAgendaOpen] = useState(false);
  const [agForm, setAgForm] = useState({
    titulo: "Visita à academia",
    data: "",
    hora: "",
    funcionarioId: "",
    observacoes: "",
  });
  const [savingAg, setSavingAg] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const tenantId = tenantContext.tenantId || getActiveTenantIdFromSession() || "";

  const funcionariosMap = new Map(funcionarios.map((f) => [f.id, f]));

  useEffect(() => {
    if (!prospect || !tenantId) return;
    let cancelled = false;

    Promise.all([
      listProspectMensagensApi({ tenantId, prospectId: prospect.id }),
      listProspectAgendamentosApi({ tenantId, prospectId: prospect.id }),
    ]).then(([msgs, ags]) => {
      if (cancelled) return;
      setMensagens(msgs);
      setAgendamentos(ags);
    }).catch(() => {
      if (cancelled) return;
      setMensagens([]);
      setAgendamentos([]);
    });

    return () => {
      cancelled = true;
    };
  }, [prospect, tenantId]);

  useEffect(() => {
    if (tab === "conversa") {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }, [tab, mensagens]);

  async function refreshData(id: string) {
    if (!tenantId) return;
    const [msgs, ags] = await Promise.all([
      listProspectMensagensApi({ tenantId, prospectId: id }),
      listProspectAgendamentosApi({ tenantId, prospectId: id }),
    ]);
    setMensagens(msgs);
    setAgendamentos(ags);
  }

  async function handleSendMsg() {
    if (!prospect || !msgTexto.trim() || !tenantId) return;
    setSendingMsg(true);
    await addProspectMensagemApi({
      tenantId,
      prospectId: prospect.id,
      data: {
        texto: msgTexto.trim(),
        autorNome,
      },
    });
    setMsgTexto("");
    await refreshData(prospect.id);
    onChanged();
    setSendingMsg(false);
  }

  async function handleStatusChange(status: StatusProspect) {
    if (!prospect || !tenantId) return;
    if (status === prospect.status) return;
    if (!canTransitionProspectStatus(prospect.status, status)) return;
    if (status === "PERDIDO") {
      const motivo = prompt("Motivo da perda (opcional):");
      await marcarProspectPerdidoApi({
        tenantId,
        id: prospect.id,
        motivo: motivo ?? undefined,
      });
    } else {
      await updateProspectStatusApi({
        tenantId,
        id: prospect.id,
        status,
      });
    }
    onChanged();
    onClose();
  }

  async function handleAdvance() {
    if (!prospect || !tenantId) return;
    const next = getNextStatus(prospect);
    if (!next) return;
    await updateProspectStatusApi({
      tenantId,
      id: prospect.id,
      status: next,
    });
    onChanged();
    onClose();
  }

  async function handleSaveAgendamento() {
    if (!prospect || !agForm.data || !agForm.hora || !agForm.funcionarioId || !tenantId) return;
    setSavingAg(true);
    await criarProspectAgendamentoApi({
      tenantId,
      prospectId: prospect.id,
      data: {
        funcionarioId: agForm.funcionarioId,
        titulo: agForm.titulo || "Visita à academia",
        data: agForm.data,
        hora: agForm.hora,
        observacoes: agForm.observacoes || undefined,
      },
    });
    setAgForm({ titulo: "Visita à academia", data: "", hora: "", funcionarioId: "", observacoes: "" });
    setAgendaOpen(false);
    await refreshData(prospect.id);
    onChanged();
    setSavingAg(false);
  }

  async function handleAgStatus(id: string, status: StatusAgendamento) {
    if (!tenantId) return;
    await updateProspectAgendamentoApi({
      tenantId,
      id,
      status,
    });
    if (prospect) await refreshData(prospect.id);
    onChanged();
  }

  if (!prospect) return null;

  const nextStatus = getNextProspectStatus(prospect.status);
  const selectableStatuses = getSelectableProspectStatuses(prospect.status);
  const responsavel = prospect.responsavelId ? funcionariosMap.get(prospect.responsavelId) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative z-10 flex h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-xl font-bold tracking-tight">{prospect.nome}</h2>
              <StatusBadge status={prospect.status} />
            </div>
            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
              <span>📞 {prospect.telefone}</span>
              {prospect.email && <span>✉ {prospect.email}</span>}
              <span>Origem: {ORIGEM_LABEL[prospect.origem] ?? prospect.origem}</span>
              {responsavel && <span>Resp: {responsavel.nome}</span>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            ✕
          </button>
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b border-border">
          {(["detalhes", "conversa", "agenda"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "relative px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors",
                tab === t
                  ? "text-gym-accent after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-gym-accent"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t === "detalhes" && "Detalhes"}
              {t === "conversa" && `Conversa${mensagens.length ? ` (${mensagens.length})` : ""}`}
              {t === "agenda" && `Agenda${agendamentos.length ? ` (${agendamentos.length})` : ""}`}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}
        <div className="flex-1 overflow-y-auto">

          {/* DETALHES */}
          {tab === "detalhes" && (
            <div className="space-y-5 p-5">
              {/* Info grid */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 rounded-xl border border-border bg-secondary/30 p-4 text-sm">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Telefone</p>
                  <p className="mt-0.5 font-medium">{prospect.telefone}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">E-mail</p>
                  <p className="mt-0.5 font-medium">{prospect.email ?? "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">CPF</p>
                  <p className="mt-0.5 font-medium">{prospect.cpf ?? "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Origem</p>
                  <p className="mt-0.5 font-medium">{ORIGEM_LABEL[prospect.origem] ?? prospect.origem}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Responsável</p>
                  <p className="mt-0.5 font-medium">{responsavel?.nome ?? "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Cadastrado em</p>
                  <p className="mt-0.5 font-medium">{formatDatetime(prospect.dataCriacao)}</p>
                </div>
                {prospect.observacoes && (
                  <div className="col-span-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Observações</p>
                    <p className="mt-0.5">{prospect.observacoes}</p>
                  </div>
                )}
                {prospect.motivoPerda && (
                  <div className="col-span-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Motivo da perda</p>
                    <p className="mt-0.5 text-gym-danger">{prospect.motivoPerda}</p>
                  </div>
                )}
              </div>

              {/* Status change */}
              {prospect.status !== "CONVERTIDO" && (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Evoluir status
                  </p>
                  <div className="flex items-center gap-2">
                    <Select value={prospect.status} onValueChange={(v) => handleStatusChange(v as StatusProspect)}>
                      <SelectTrigger className="w-52 border-border bg-secondary text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-border bg-card">
                        {STATUS_COLUMNS.filter((s) => selectableStatuses.includes(s.key)).map((s) => (
                          <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {nextStatus && (
                      <Button size="sm" onClick={handleAdvance}>
                        Avançar → {STATUS_COLUMNS.find((s) => s.key === nextStatus)?.label}
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Status timeline */}
              {(prospect.statusLog ?? []).length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Histórico de evolução
                  </p>
                  <div className="space-y-1">
                    {[...(prospect.statusLog ?? [])].reverse().map((log, i) => (
                      <div key={i} className="flex items-center gap-3 text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-gym-accent shrink-0" />
                        <StatusBadge status={log.status} />
                        <span className="text-muted-foreground">{formatDatetime(log.data)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CONVERSA */}
          {tab === "conversa" && (
            <div className="flex h-full flex-col">
              <div className="flex-1 space-y-3 overflow-y-auto p-5">
                {mensagens.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Nenhuma mensagem ainda. Inicie a conversa!
                  </p>
                )}
                {mensagens.map((m) => (
                  <div key={m.id} className="rounded-xl border border-border bg-secondary/30 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-gym-accent">{m.autorNome}</span>
                      <span className="text-[11px] text-muted-foreground">{formatDatetime(m.datahora)}</span>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed">{m.texto}</p>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Send message */}
              <div className="border-t border-border p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">Enviando como:</span>
                  <Select value={autorNome} onValueChange={setAutorNome}>
                    <SelectTrigger className="h-7 w-44 border-border bg-secondary text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-border bg-card">
                      <SelectItem value="Academia">Academia</SelectItem>
                      {funcionarios.map((f) => (
                        <SelectItem key={f.id} value={f.nome}>{f.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite uma mensagem..."
                    value={msgTexto}
                    onChange={(e) => setMsgTexto(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMsg(); } }}
                    className="border-border bg-secondary text-sm"
                  />
                  <Button onClick={handleSendMsg} disabled={!msgTexto.trim() || sendingMsg} className="shrink-0">
                    Enviar
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* AGENDA */}
          {tab === "agenda" && (
            <div className="space-y-4 p-5">
              {/* New appointment form */}
              <div className="rounded-xl border border-border bg-secondary/30">
                <button
                  onClick={() => setAgendaOpen((v) => !v)}
                  className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold"
                >
                  <span>+ Agendar nova visita</span>
                  <span className="text-muted-foreground">{agendaOpen ? "▲" : "▼"}</span>
                </button>

                {agendaOpen && (
                  <div className="space-y-3 border-t border-border p-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Título
                      </label>
                      <Input
                        value={agForm.titulo}
                        onChange={(e) => setAgForm((f) => ({ ...f, titulo: e.target.value }))}
                        className="border-border bg-secondary text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Data *
                        </label>
                        <Input
                          type="date"
                          value={agForm.data}
                          onChange={(e) => setAgForm((f) => ({ ...f, data: e.target.value }))}
                          className="border-border bg-secondary text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Hora *
                        </label>
                        <Input
                          type="time"
                          value={agForm.hora}
                          onChange={(e) => setAgForm((f) => ({ ...f, hora: e.target.value }))}
                          className="border-border bg-secondary text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Atendente *
                      </label>
                      <Select value={agForm.funcionarioId} onValueChange={(v) => setAgForm((f) => ({ ...f, funcionarioId: v }))}>
                        <SelectTrigger className="w-full border-border bg-secondary text-sm">
                          <SelectValue placeholder="Selecione o atendente" />
                        </SelectTrigger>
                        <SelectContent className="border-border bg-card">
                          {funcionarios.map((f) => (
                            <SelectItem key={f.id} value={f.id}>{f.nome} {f.cargo ? `· ${f.cargo}` : ""}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Observações
                      </label>
                      <Input
                        placeholder="Ex: cliente quer ver sala de musculação"
                        value={agForm.observacoes}
                        onChange={(e) => setAgForm((f) => ({ ...f, observacoes: e.target.value }))}
                        className="border-border bg-secondary text-sm"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setAgendaOpen(false)} className="border-border">
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleSaveAgendamento}
                        disabled={!agForm.data || !agForm.hora || !agForm.funcionarioId || savingAg}
                      >
                        Confirmar agendamento
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Appointments list */}
              {agendamentos.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma visita agendada</p>
              ) : (
                <div className="space-y-3">
                  {agendamentos.map((ag) => {
                    const func = funcionariosMap.get(ag.funcionarioId);
                    return (
                      <div key={ag.id} className="rounded-xl border border-border bg-secondary/30 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold">{ag.titulo}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {formatDate(ag.data)} às {ag.hora} · {func?.nome ?? "—"}
                              {func?.cargo ? ` (${func.cargo})` : ""}
                            </p>
                            {ag.observacoes && (
                              <p className="mt-1 text-xs text-muted-foreground">{ag.observacoes}</p>
                            )}
                          </div>
                          <span
                            className={cn(
                              "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                              ag.status === "AGENDADO" && "bg-gym-accent/15 text-gym-accent",
                              ag.status === "REALIZADO" && "bg-gym-teal/15 text-gym-teal",
                              ag.status === "CANCELADO" && "bg-muted text-muted-foreground"
                            )}
                          >
                            {STATUS_AG_LABEL[ag.status]}
                          </span>
                        </div>
                        {ag.status === "AGENDADO" && (
                          <div className="mt-3 flex gap-2">
                            <button
                              onClick={() => handleAgStatus(ag.id, "REALIZADO")}
                              className="rounded-md border border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:border-gym-teal/50 hover:text-gym-teal"
                            >
                              Marcar realizado
                            </button>
                            <button
                              onClick={() => handleAgStatus(ag.id, "CANCELADO")}
                              className="rounded-md border border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:border-gym-danger/50 hover:text-gym-danger"
                            >
                              Cancelar
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
