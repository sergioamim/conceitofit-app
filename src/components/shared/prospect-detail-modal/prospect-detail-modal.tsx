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
} from "@/lib/tenant/crm/prospect-status";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import type {
  Prospect,
  StatusProspect,
  Funcionario,
  ProspectMensagem,
  ProspectAgendamento,
  StatusAgendamento,
} from "@/lib/types";
import { ProspectLossReasonDialog } from "@/components/shared/prospect-loss-reason-dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { cn } from "@/lib/utils";
import { ORIGEM_LABEL, type Tab } from "./prospect-shared";
import { ProspectInfoTab } from "./prospect-info-tab";
import { ProspectConversaTab } from "./prospect-conversa-tab";
import { ProspectAgendaTab, type AgForm } from "./prospect-agenda-tab";

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
  const [lossDialogOpen, setLossDialogOpen] = useState(false);
  const [agForm, setAgForm] = useState<AgForm>({
    titulo: "Visita à academia",
    data: "",
    hora: "",
    funcionarioId: "",
    observacoes: "",
  });
  const [savingAg, setSavingAg] = useState(false);
  const [savingLoss, setSavingLoss] = useState(false);
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
      setLossDialogOpen(true);
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

  async function handleConfirmLost(motivo?: string) {
    if (!prospect || !tenantId) return;
    setSavingLoss(true);
    try {
      await marcarProspectPerdidoApi({
        tenantId,
        id: prospect.id,
        motivo,
      });
      setLossDialogOpen(false);
      onChanged();
      onClose();
    } finally {
      setSavingLoss(false);
    }
  }

  async function handleAdvance() {
    if (!prospect || !tenantId) return;
    const next = getNextProspectStatus(prospect.status);
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
    <>
      <ProspectLossReasonDialog
        open={lossDialogOpen}
        submitting={savingLoss}
        onClose={() => setLossDialogOpen(false)}
        onConfirm={handleConfirmLost}
      />
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
            <ProspectInfoTab
              prospect={prospect}
              responsavel={responsavel}
              nextStatus={nextStatus}
              selectableStatuses={selectableStatuses}
              onStatusChange={handleStatusChange}
              onAdvance={handleAdvance}
            />
          )}

          {/* CONVERSA */}
          {tab === "conversa" && (
            <ProspectConversaTab
              mensagens={mensagens}
              msgTexto={msgTexto}
              setMsgTexto={setMsgTexto}
              autorNome={autorNome}
              setAutorNome={setAutorNome}
              sendingMsg={sendingMsg}
              funcionarios={funcionarios}
              handleSendMsg={handleSendMsg}
              messagesEndRef={messagesEndRef}
            />
          )}

          {/* AGENDA */}
          {tab === "agenda" && (
            <ProspectAgendaTab
              agendamentos={agendamentos}
              agendaOpen={agendaOpen}
              setAgendaOpen={setAgendaOpen}
              agForm={agForm}
              setAgForm={setAgForm}
              savingAg={savingAg}
              funcionarios={funcionarios}
              funcionariosMap={funcionariosMap}
              handleSaveAgendamento={handleSaveAgendamento}
              handleAgStatus={handleAgStatus}
            />
          )}
        </div>
        </div>
      </div>
    </>
  );
}
