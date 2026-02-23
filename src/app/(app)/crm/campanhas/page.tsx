"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createCampanhaCrm,
  dispararCampanhaCrm,
  encerrarCampanhaCrm,
  listCampanhasCrm,
  listVouchers,
  updateCampanhaCrm,
} from "@/lib/mock/services";
import type {
  CampanhaCRM,
  CampanhaCanal,
  CampanhaPublicoAlvo,
  CampanhaStatus,
  Voucher,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const PUBLICO_OPTIONS: Array<{ value: CampanhaPublicoAlvo; label: string; help: string }> = [
  { value: "EVADIDOS_ULTIMOS_3_MESES", label: "Evadidos últimos 3 meses", help: "Alunos inativos/cancelados com última matrícula encerrada em até 90 dias." },
  { value: "PROSPECTS_EM_ABERTO", label: "Prospects em aberto", help: "Leads que ainda não converteram e não foram perdidos." },
  { value: "ALUNOS_INATIVOS", label: "Alunos inativos", help: "Alunos com status inativo, cancelado ou suspenso." },
];

const CANAIS: Array<{ value: CampanhaCanal; label: string }> = [
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "EMAIL", label: "E-mail" },
  { value: "SMS", label: "SMS" },
  { value: "LIGACAO", label: "Ligação" },
];

type FormState = {
  nome: string;
  descricao: string;
  publicoAlvo: CampanhaPublicoAlvo;
  canais: CampanhaCanal[];
  voucherId: string;
  dataInicio: string;
  dataFim: string;
  status: CampanhaStatus;
};

const todayIso = new Date().toISOString().slice(0, 10);

const EMPTY_FORM: FormState = {
  nome: "",
  descricao: "",
  publicoAlvo: "EVADIDOS_ULTIMOS_3_MESES",
  canais: ["WHATSAPP"],
  voucherId: "none",
  dataInicio: todayIso,
  dataFim: "",
  status: "RASCUNHO",
};

function statusStyle(status: CampanhaStatus): string {
  if (status === "ATIVA") return "bg-gym-teal/15 text-gym-teal";
  if (status === "ENCERRADA") return "bg-muted text-muted-foreground";
  return "bg-gym-warning/15 text-gym-warning";
}

export default function CampanhasCrmPage() {
  const [rows, setRows] = useState<CampanhaCRM[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [statusFilter, setStatusFilter] = useState<"TODAS" | CampanhaStatus>("TODAS");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CampanhaCRM | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [campanhas, allVouchers] = await Promise.all([
      listCampanhasCrm(statusFilter === "TODAS" ? undefined : { status: statusFilter }),
      listVouchers(),
    ]);
    setRows(campanhas);
    setVouchers(allVouchers.filter((v) => v.ativo && (v.usarNaVenda || v.tipo.toUpperCase().includes("DESCONTO"))));
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const summary = useMemo(() => {
    const total = rows.length;
    const ativas = rows.filter((r) => r.status === "ATIVA").length;
    const rascunho = rows.filter((r) => r.status === "RASCUNHO").length;
    const disparos = rows.reduce((sum, r) => sum + (r.disparosRealizados ?? 0), 0);
    return { total, ativas, rascunho, disparos };
  }, [rows]);

  function openCreate() {
    setEditing(null);
    setError("");
    setForm({
      ...EMPTY_FORM,
      dataInicio: new Date().toISOString().slice(0, 10),
    });
    setModalOpen(true);
  }

  function openEdit(row: CampanhaCRM) {
    setEditing(row);
    setError("");
    setForm({
      nome: row.nome,
      descricao: row.descricao ?? "",
      publicoAlvo: row.publicoAlvo,
      canais: row.canais,
      voucherId: row.voucherId ?? "none",
      dataInicio: row.dataInicio,
      dataFim: row.dataFim ?? "",
      status: row.status,
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.nome.trim()) {
      setError("Informe o nome da campanha.");
      return;
    }
    if (form.canais.length === 0) {
      setError("Selecione ao menos um canal.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (editing) {
        await updateCampanhaCrm(editing.id, {
          nome: form.nome.trim(),
          descricao: form.descricao.trim() || undefined,
          publicoAlvo: form.publicoAlvo,
          canais: form.canais,
          voucherId: form.voucherId === "none" ? undefined : form.voucherId,
          dataInicio: form.dataInicio,
          dataFim: form.dataFim || undefined,
          status: form.status,
        });
      } else {
        await createCampanhaCrm({
          nome: form.nome.trim(),
          descricao: form.descricao.trim() || undefined,
          publicoAlvo: form.publicoAlvo,
          canais: form.canais,
          voucherId: form.voucherId === "none" ? undefined : form.voucherId,
          dataInicio: form.dataInicio,
          dataFim: form.dataFim || undefined,
          status: form.status,
        });
      }
      setModalOpen(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDisparar(id: string) {
    await dispararCampanhaCrm(id);
    await load();
  }

  async function handleEncerrar(id: string) {
    await encerrarCampanhaCrm(id);
    await load();
  }

  function toggleCanal(canal: CampanhaCanal) {
    setForm((prev) => ({
      ...prev,
      canais: prev.canais.includes(canal)
        ? prev.canais.filter((item) => item !== canal)
        : [...prev.canais, canal],
    }));
  }

  return (
    <div className="space-y-6">
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="border-border bg-card sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold">
              {editing ? "Editar campanha CRM" : "Nova campanha CRM"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nome *</label>
              <Input
                value={form.nome}
                onChange={(e) => setForm((s) => ({ ...s, nome: e.target.value }))}
                className="border-border bg-secondary"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Descrição</label>
              <Input
                value={form.descricao}
                onChange={(e) => setForm((s) => ({ ...s, descricao: e.target.value }))}
                className="border-border bg-secondary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Público alvo</label>
              <Select
                value={form.publicoAlvo}
                onValueChange={(value) => setForm((s) => ({ ...s, publicoAlvo: value as CampanhaPublicoAlvo }))}
              >
                <SelectTrigger className="border-border bg-secondary"><SelectValue /></SelectTrigger>
                <SelectContent className="border-border bg-card">
                  {PUBLICO_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {PUBLICO_OPTIONS.find((option) => option.value === form.publicoAlvo)?.help}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Voucher da campanha</label>
              <Select value={form.voucherId} onValueChange={(value) => setForm((s) => ({ ...s, voucherId: value }))}>
                <SelectTrigger className="border-border bg-secondary"><SelectValue /></SelectTrigger>
                <SelectContent className="border-border bg-card">
                  <SelectItem value="none">Sem voucher</SelectItem>
                  {vouchers.map((voucher) => (
                    <SelectItem key={voucher.id} value={voucher.id}>
                      {voucher.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Data início</label>
              <Input
                type="date"
                value={form.dataInicio}
                onChange={(e) => setForm((s) => ({ ...s, dataInicio: e.target.value }))}
                className="border-border bg-secondary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Data fim</label>
              <Input
                type="date"
                value={form.dataFim}
                onChange={(e) => setForm((s) => ({ ...s, dataFim: e.target.value }))}
                className="border-border bg-secondary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</label>
              <Select
                value={form.status}
                onValueChange={(value) => setForm((s) => ({ ...s, status: value as CampanhaStatus }))}
              >
                <SelectTrigger className="border-border bg-secondary"><SelectValue /></SelectTrigger>
                <SelectContent className="border-border bg-card">
                  <SelectItem value="RASCUNHO">Rascunho</SelectItem>
                  <SelectItem value="ATIVA">Ativa</SelectItem>
                  <SelectItem value="ENCERRADA">Encerrada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Canais de divulgação</label>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                {CANAIS.map((canal) => {
                  const selected = form.canais.includes(canal.value);
                  return (
                    <button
                      key={canal.value}
                      type="button"
                      onClick={() => toggleCanal(canal.value)}
                      className={`cursor-pointer rounded-md border px-3 py-2 text-sm ${
                        selected
                          ? "border-gym-accent bg-gym-accent/10 text-foreground"
                          : "border-border bg-secondary/30 text-muted-foreground"
                      }`}
                    >
                      {canal.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-gym-danger">{error}</p>}

          <DialogFooter>
            <Button variant="outline" className="border-border" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar campanha"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Campanhas CRM</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Planejamento de campanhas com público alvo, voucher e canais de comunicação.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "TODAS" | CampanhaStatus)}>
            <SelectTrigger className="w-[170px] border-border bg-secondary"><SelectValue /></SelectTrigger>
            <SelectContent className="border-border bg-card">
              <SelectItem value="TODAS">Todas</SelectItem>
              <SelectItem value="RASCUNHO">Rascunho</SelectItem>
              <SelectItem value="ATIVA">Ativa</SelectItem>
              <SelectItem value="ENCERRADA">Encerrada</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={openCreate}>Nova campanha</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-3"><p className="text-[11px] uppercase tracking-wider text-muted-foreground">Campanhas</p><p className="mt-1 font-display text-2xl font-bold">{summary.total}</p></div>
        <div className="rounded-lg border border-border bg-card p-3"><p className="text-[11px] uppercase tracking-wider text-muted-foreground">Ativas</p><p className="mt-1 font-display text-2xl font-bold text-gym-teal">{summary.ativas}</p></div>
        <div className="rounded-lg border border-border bg-card p-3"><p className="text-[11px] uppercase tracking-wider text-muted-foreground">Rascunho</p><p className="mt-1 font-display text-2xl font-bold text-gym-warning">{summary.rascunho}</p></div>
        <div className="rounded-lg border border-border bg-card p-3"><p className="text-[11px] uppercase tracking-wider text-muted-foreground">Disparos</p><p className="mt-1 font-display text-2xl font-bold">{summary.disparos}</p></div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary">
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Campanha</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Público / Canais</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Voucher</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.id} className="transition-colors hover:bg-secondary/30">
                <td className="px-4 py-3">
                  <p className="text-sm font-semibold">{row.nome}</p>
                  <p className="text-xs text-muted-foreground">{row.descricao || "Sem descrição"}</p>
                  <p className="text-xs text-muted-foreground">Início: {new Date(`${row.dataInicio}T00:00:00`).toLocaleDateString("pt-BR")}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm">{PUBLICO_OPTIONS.find((item) => item.value === row.publicoAlvo)?.label}</p>
                  <p className="text-xs text-muted-foreground">{row.canais.join(" · ")}</p>
                  <p className="text-xs text-muted-foreground">Audiência estimada: {row.audienceEstimado ?? 0}</p>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {row.voucherId ? vouchers.find((v) => v.id === row.voucherId)?.nome ?? "Voucher removido" : "Sem voucher"}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusStyle(row.status)}`}>
                    {row.status}
                  </span>
                  <p className="mt-1 text-xs text-muted-foreground">Disparos: {row.disparosRealizados}</p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" className="border-border" onClick={() => openEdit(row)}>
                      Editar
                    </Button>
                    {row.status !== "ENCERRADA" && (
                      <Button size="sm" onClick={() => handleDisparar(row.id)}>
                        Disparar
                      </Button>
                    )}
                    {row.status === "ATIVA" && (
                      <Button variant="outline" size="sm" className="border-border" onClick={() => handleEncerrar(row.id)}>
                        Encerrar
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  Nenhuma campanha encontrada
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
