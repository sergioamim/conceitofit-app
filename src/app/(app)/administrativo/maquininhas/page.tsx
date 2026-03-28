"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTableRowActions } from "@/components/shared/data-table-row-actions";
import { createMaquininhaApi, listMaquininhasApi, toggleMaquininhaApi, updateMaquininhaApi } from "@/lib/api/maquininhas";
import { listContasBancariasApi } from "@/lib/api/contas-bancarias";
import type { AdquirenteMaquininha, ContaBancaria } from "@/lib/types";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { PageError } from "@/components/shared/page-error";

type MaquininhaForm = {
  nome: string;
  adquirente: AdquirenteMaquininha;
  terminal: string;
  contaBancariaId: string;
};

type MaquininhaItem = {
  id: string;
  tenantId: string;
  nome: string;
  adquirente: AdquirenteMaquininha;
  terminal: string;
  contaBancariaId: string;
  statusCadastro: "ATIVA" | "INATIVA";
};

const ADQUIRENTE_LABEL: Record<AdquirenteMaquininha, string> = {
  STONE: "Stone",
  CIELO: "Cielo",
  REDE: "Rede",
  GETNET: "GetNet",
  PAGARME_POS: "Pagar.me",
  OUTROS: "Outros",
};

const MAQUININHA_FORM_DEFAULT: MaquininhaForm = {
  nome: "",
  adquirente: "STONE",
  terminal: "",
  contaBancariaId: "",
};

function getStatusClass(status: "ATIVA" | "INATIVA") {
  return status === "ATIVA"
    ? "bg-gym-teal/15 text-gym-teal"
    : "bg-muted text-muted-foreground";
}

export default function MaquininhasPage() {
  const [maquininhas, setMaquininhas] = useState<MaquininhaItem[]>([]);
  const [contasBancarias, setContasBancarias] = useState<ContaBancaria[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MaquininhaItem | null>(null);
  const [form, setForm] = useState<MaquininhaForm>(MAQUININHA_FORM_DEFAULT);

  const [search, setSearch] = useState("");
  const { tenantId, tenantName, tenantResolved, loading: tenantLoading, error: tenantError } = useTenantContext();

  const contasAtivas = useMemo(
    () => contasBancarias.filter((conta) => conta.statusCadastro === "ATIVA"),
    [contasBancarias]
  );

  const contasMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const conta of contasBancarias) {
      map.set(conta.id, `${conta.apelido} (${conta.banco} - ${conta.agencia})`);
    }
    return map;
  }, [contasBancarias]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return maquininhas;
    return maquininhas.filter((item) =>
      [item.nome, item.terminal, ADQUIRENTE_LABEL[item.adquirente], contasMap.get(item.contaBancariaId) ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [maquininhas, search, contasMap]);

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setLoadError(null);
    try {
      const [maqs, contas] = await Promise.all([
        listMaquininhasApi({ tenantId: tenantId || undefined }),
        listContasBancariasApi({ tenantId: tenantId || undefined }),
      ]);
      setMaquininhas(maqs);
      setContasBancarias(contas);
    } catch (loadErr) {
      setLoadError(normalizeErrorMessage(loadErr));
    } finally {
      setLoading(false);
      setHasLoadedOnce(true);
    }
  }, [tenantId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setLoadError(tenantError);
  }, [tenantError]);

  useEffect(() => {
    setHasLoadedOnce(false);
    setModalOpen(false);
    setEditing(null);
    setForm(MAQUININHA_FORM_DEFAULT);
    setSuccess(null);
  }, [tenantId]);

  function isFormValid() {
    return Boolean(
      form.nome.trim() && form.terminal.trim() && form.contaBancariaId.trim() && form.adquirente
    );
  }

  function openCreate() {
    setEditing(null);
    setForm({
      nome: "",
      adquirente: "STONE",
      terminal: "",
      contaBancariaId: contasAtivas[0]?.id ?? "",
    });
    setModalOpen(true);
  }

  function openEdit(item: MaquininhaItem) {
    setEditing(item);
    setForm({
      nome: item.nome,
      adquirente: item.adquirente,
      terminal: item.terminal,
      contaBancariaId: item.contaBancariaId,
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!tenantId) {
      setError("Não foi possível identificar a unidade ativa.");
      return;
    }
    if (!isFormValid()) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        nome: form.nome.trim(),
        adquirente: form.adquirente,
        terminal: form.terminal.trim(),
        contaBancariaId: form.contaBancariaId,
      };
      if (editing) {
        await updateMaquininhaApi({
          tenantId: tenantId || undefined,
          id: editing.id,
          data: payload,
        });
      } else {
        await createMaquininhaApi({
          tenantId: tenantId || undefined,
          data: payload,
        });
      }
      setModalOpen(false);
      setEditing(null);
      setForm(MAQUININHA_FORM_DEFAULT);
      await load();
      setSuccess(editing ? "Maquininha atualizada." : "Maquininha cadastrada.");
    } catch (saveError) {
      setError(normalizeErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(item: MaquininhaItem) {
    if (!tenantId) {
      setError("Não foi possível identificar a unidade ativa.");
      return;
    }
    setError(null);
    setSuccess(null);
    try {
      const updated = await toggleMaquininhaApi({
        tenantId: tenantId || undefined,
        id: item.id,
      });
      setMaquininhas((prev) => prev.map((entry) => (entry.id === updated.id ? updated : entry)));
      setSuccess(
        `Maquininha ${updated.statusCadastro === "ATIVA" ? "ativada" : "inativada"} com sucesso.`
      );
    } catch (errorPayload) {
      setError(normalizeErrorMessage(errorPayload));
    }
  }

  const initialLoading = tenantLoading || !tenantResolved || (loading && !hasLoadedOnce);
  const isTenantUnavailable = tenantResolved && !tenantId;
  const emptyStateMessage = isTenantUnavailable
    ? "Não foi possível identificar a unidade ativa."
    : loadError
      ? "Não foi possível carregar as maquininhas."
      : "Nenhuma maquininha cadastrada.";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Administrativo</p>
          <h1 className="font-display text-2xl font-bold tracking-tight">Maquininhas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Unidade ativa:{" "}
            <span className="font-medium text-foreground">
              {tenantResolved ? tenantName : "Carregando..."}
            </span>
          </p>
        </div>
        <Button onClick={openCreate} disabled={!tenantResolved || !tenantId || contasAtivas.length === 0}>
          Nova maquininha
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nome, terminal ou adquirente"
          className="bg-secondary border-border"
        />
      </div>

      <PageError error={loadError} onRetry={load} />

      {(error || success) && (
        <div
          className={`rounded-md border px-4 py-3 text-sm ${
            error ? "border-gym-danger/30 bg-gym-danger/10 text-gym-danger" : "border-gym-teal/30 bg-gym-teal/10 text-gym-teal"
          }`}
        >
          {error ?? success}
        </div>
      )}
      {!editing && contasAtivas.length === 0 && (
        <div className="rounded-md border border-gym-warning/30 bg-gym-warning/10 px-4 py-3 text-sm text-gym-warning">
          Você precisa cadastrar ao menos uma conta bancária ativa para vincular a maquininha.
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="border-border bg-card sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold">
              {editing ? "Editar maquininha" : "Nova maquininha"}
            </DialogTitle>
            <DialogDescription>
              Seleção de conta bancária ativa é obrigatória para vincular recebimentos.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Nome *
              </label>
              <Input
                value={form.nome}
                onChange={(event) => setForm((prev) => ({ ...prev, nome: event.target.value }))}
                placeholder="Ex.: POS Recepção"
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Adquirente *
              </label>
              <Select
                value={form.adquirente}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, adquirente: value as AdquirenteMaquininha }))
                }
              >
                <SelectTrigger className="w-full bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {Object.entries(ADQUIRENTE_LABEL).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Terminal *
              </label>
              <Input
                value={form.terminal}
                onChange={(event) => setForm((prev) => ({ ...prev, terminal: event.target.value }))}
                placeholder="Ex.: T001"
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Conta de repasse *
              </label>
              <Select
                value={form.contaBancariaId}
                onValueChange={(value) => setForm((prev) => ({ ...prev, contaBancariaId: value }))}
              >
                <SelectTrigger className="w-full bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {contasAtivas.map((conta) => (
                    <SelectItem key={conta.id} value={conta.id}>
                      {conta.apelido} — {conta.banco}/{conta.agencia}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-border"
              onClick={() => {
                setModalOpen(false);
                setEditing(null);
                setForm(MAQUININHA_FORM_DEFAULT);
              }}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={!isFormValid() || saving}>
              {saving ? "Salvando..." : editing ? "Salvar alterações" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Adquirente</th>
              <th className="px-4 py-3">Terminal</th>
              <th className="px-4 py-3">Conta de repasse</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-sm">
            {initialLoading && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-muted-foreground">
                  Carregando...
                </td>
              </tr>
            )}
            {!initialLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-muted-foreground">
                  {emptyStateMessage}
                </td>
              </tr>
            )}
            {!initialLoading &&
              filtered.map((item) => (
                <tr key={item.id} className="hover:bg-secondary/30">
                  <td className="px-4 py-3 font-medium">{item.nome}</td>
                  <td className="px-4 py-3">{ADQUIRENTE_LABEL[item.adquirente]}</td>
                  <td className="px-4 py-3">{item.terminal}</td>
                  <td className="px-4 py-3">{contasMap.get(item.contaBancariaId) ?? "Não localizada"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getStatusClass(item.statusCadastro)}`}
                    >
                      {item.statusCadastro === "ATIVA" ? "Ativa" : "Inativa"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <DataTableRowActions
                      actions={[
                        {
                          label: "Editar",
                          kind: "edit",
                          onClick: () => openEdit(item),
                        },
                        {
                          label: item.statusCadastro === "ATIVA" ? "Inativar" : "Ativar",
                          kind: "toggle",
                          onClick: () => handleToggle(item),
                        },
                      ]}
                    />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
