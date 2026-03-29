"use client";

import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTableRowActions } from "@/components/shared/data-table-row-actions";
import { createContaBancariaApi, listContasBancariasApi, toggleContaBancariaApi, updateContaBancariaApi } from "@/lib/api/contas-bancarias";
import type { ContaBancaria, PixTipo, TipoContaBancaria } from "@/lib/types";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { PageError } from "@/components/shared/page-error";
import { useCrudOperations } from "@/hooks/use-crud-operations";

const TIPO_CONTA_LABEL: Record<TipoContaBancaria, string> = {
  CORRENTE: "Conta corrente",
  POUPANCA: "Conta poupança",
  PAGAMENTO: "Conta pagamento",
};

const PIX_TIPO_LABEL: Record<PixTipo, string> = {
  CPF: "CPF",
  CNPJ: "CNPJ",
  EMAIL: "E-mail",
  TELEFONE: "Telefone",
  CHAVE_ALEATORIA: "Chave aleatória",
  OUTRA: "Outra",
};

type PixTipoForm = PixTipo | "SEM_PIX";

type FormConta = {
  apelido: string;
  banco: string;
  agencia: string;
  conta: string;
  digito: string;
  tipo: TipoContaBancaria;
  titular: string;
  pixChave: string;
  pixTipo: PixTipoForm;
};

const FORM_DEFAULT: FormConta = {
  apelido: "",
  banco: "",
  agencia: "",
  conta: "",
  digito: "",
  tipo: "CORRENTE",
  titular: "",
  pixChave: "",
  pixTipo: "SEM_PIX",
};

function getStatusClass(status: "ATIVA" | "INATIVA") {
  return status === "ATIVA"
    ? "bg-gym-teal/15 text-gym-teal"
    : "bg-muted text-muted-foreground";
}

interface ContasBancariasContentProps {
  initialData: ContaBancaria[];
  tenantId: string;
  tenantName: string;
}

export function ContasBancariasContent({ initialData, tenantId, tenantName }: ContasBancariasContentProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ContaBancaria | null>(null);
  const [form, setForm] = useState<FormConta>(FORM_DEFAULT);

  const { items: contas, loading, error: loadError, reload } = useCrudOperations<ContaBancaria>({
    listFn: () => listContasBancariasApi({ tenantId: tenantId || undefined }),
    initialData,
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return contas;
    return contas.filter((conta) =>
      [conta.apelido, conta.banco, conta.titular, conta.pixChave ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [contas, search]);

  function normalizeForm(data: FormConta): Omit<ContaBancaria, "id" | "tenantId"> {
    return {
      apelido: data.apelido.trim(),
      banco: data.banco.trim(),
      agencia: data.agencia.trim(),
      conta: data.conta.trim(),
      digito: data.digito.trim(),
      tipo: data.tipo,
      titular: data.titular.trim(),
      pixChave: data.pixChave.trim() || undefined,
      pixTipo: data.pixTipo === "SEM_PIX" ? undefined : data.pixTipo,
      statusCadastro: "ATIVA",
    };
  }

  function isFormValid(): boolean {
    return Boolean(
      form.apelido.trim() &&
        form.banco.trim() &&
        form.agencia.trim() &&
        form.conta.trim() &&
        form.digito.trim() &&
        form.titular.trim()
    );
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
      const payload = normalizeForm(form);
      if (editing) {
        await updateContaBancariaApi({
          tenantId: tenantId || undefined,
          id: editing.id,
          data: payload,
        });
      } else {
        await createContaBancariaApi({
          tenantId: tenantId || undefined,
          data: payload,
        });
      }
      setModalOpen(false);
      setEditing(null);
      setForm(FORM_DEFAULT);
      await reload();
      setSuccess(editing ? "Conta atualizada." : "Conta cadastrada.");
    } catch (saveError) {
      setError(normalizeErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(conta: ContaBancaria) {
    if (!tenantId) {
      setError("Não foi possível identificar a unidade ativa.");
      return;
    }
    setError(null);
    setSuccess(null);
    try {
      await toggleContaBancariaApi({
        tenantId: tenantId || undefined,
        id: conta.id,
      });
      await reload();
      setSuccess("Status da conta alterado com sucesso.");
    } catch (toggleError) {
      setError(normalizeErrorMessage(toggleError));
    }
  }

  function openCreate() {
    setEditing(null);
    setForm(FORM_DEFAULT);
    setModalOpen(true);
  }

  function openEdit(conta: ContaBancaria) {
    setEditing(conta);
    setForm({
      apelido: conta.apelido,
      banco: conta.banco,
      agencia: conta.agencia,
      conta: conta.conta,
      digito: conta.digito,
      tipo: conta.tipo,
      titular: conta.titular,
      pixChave: conta.pixChave ?? "",
      pixTipo: conta.pixTipo ?? "SEM_PIX",
    });
    setModalOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Administrativo</p>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Contas bancárias
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cadastro da unidade ativa:{" "}
            <span className="font-medium text-foreground">
              {tenantId ? tenantName : "Nenhuma unidade ativa"}
            </span>
          </p>
        </div>
        <Button onClick={openCreate} disabled={!tenantId}>
          Nova conta bancária
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por apelido, banco, titular ou chave PIX"
          className="bg-secondary border-border"
        />
      </div>

      <PageError error={loadError} onRetry={reload} />

      {(error || success) && (
        <div
          className={`rounded-md border px-4 py-3 text-sm ${
            error ? "border-gym-danger/30 bg-gym-danger/10 text-gym-danger" : "border-gym-teal/30 bg-gym-teal/10 text-gym-teal"
          }`}
        >
          {error ?? success}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="border-border bg-card sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold">
              {editing ? "Editar conta bancária" : "Nova conta bancária"}
            </DialogTitle>
            <DialogDescription>
              Campos marcados com * são obrigatórios. O status padrão é ativo.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Apelido *
              </label>
              <Input
                value={form.apelido}
                onChange={(event) => setForm((prev) => ({ ...prev, apelido: event.target.value }))}
                placeholder="Ex.: Conta principal"
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Banco *
              </label>
              <Input
                value={form.banco}
                onChange={(event) => setForm((prev) => ({ ...prev, banco: event.target.value }))}
                placeholder="Ex.: Banco do Brasil"
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Agência *
              </label>
              <Input
                value={form.agencia}
                onChange={(event) => setForm((prev) => ({ ...prev, agencia: event.target.value }))}
                placeholder="Ex.: 0001"
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Conta *
              </label>
              <Input
                value={form.conta}
                onChange={(event) => setForm((prev) => ({ ...prev, conta: event.target.value }))}
                placeholder="Ex.: 12345-6"
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Dígito *
              </label>
              <Input
                value={form.digito}
                onChange={(event) => setForm((prev) => ({ ...prev, digito: event.target.value }))}
                placeholder="Ex.: 9"
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Tipo *
              </label>
              <Select
                value={form.tipo}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, tipo: value as TipoContaBancaria }))
                }
              >
                <SelectTrigger className="w-full bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {Object.entries(TIPO_CONTA_LABEL).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Titular *
              </label>
              <Input
                value={form.titular}
                onChange={(event) => setForm((prev) => ({ ...prev, titular: event.target.value }))}
                placeholder="Nome completo do titular"
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Tipo da chave PIX
              </label>
              <Select
                value={form.pixTipo}
                onValueChange={(value) => setForm((prev) => ({ ...prev, pixTipo: value as PixTipoForm }))}
              >
                <SelectTrigger className="w-full bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="SEM_PIX">Sem chave PIX</SelectItem>
                  {Object.entries(PIX_TIPO_LABEL).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Chave PIX
              </label>
              <Input
                value={form.pixChave}
                onChange={(event) => setForm((prev) => ({ ...prev, pixChave: event.target.value }))}
                placeholder="Digite a chave PIX"
                className="bg-secondary border-border"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="border-border"
              onClick={() => {
                setModalOpen(false);
                setEditing(null);
                setForm(FORM_DEFAULT);
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
              <th scope="col" className="px-4 py-3">Apelido</th>
              <th scope="col" className="px-4 py-3">Banco</th>
              <th scope="col" className="px-4 py-3">Conta</th>
              <th scope="col" className="px-4 py-3">Titular</th>
              <th scope="col" className="px-4 py-3">Tipo</th>
              <th scope="col" className="px-4 py-3">PIX</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-sm">
            {loading && contas.length === 0 && (
              <tr>
                <td colSpan={8} className="py-10 text-center text-muted-foreground">
                  Carregando...
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="py-10 text-center text-muted-foreground">
                  Nenhuma conta bancária encontrada.
                </td>
              </tr>
            )}
            {filtered.map((conta) => (
              <tr key={conta.id} className="hover:bg-secondary/30">
                <td className="px-4 py-3 font-medium">{conta.apelido}</td>
                <td className="px-4 py-3">
                  <p>{conta.banco}</p>
                  <p className="text-xs text-muted-foreground">Ag {conta.agencia}</p>
                </td>
                <td className="px-4 py-3">{conta.conta}-{conta.digito}</td>
                <td className="px-4 py-3">{conta.titular}</td>
                <td className="px-4 py-3">{TIPO_CONTA_LABEL[conta.tipo]}</td>
                <td className="px-4 py-3">
                  <p className="text-sm">
                    {conta.pixTipo ? PIX_TIPO_LABEL[conta.pixTipo] : "Não configurado"}
                  </p>
                  {conta.pixChave && <p className="text-xs text-muted-foreground">{conta.pixChave}</p>}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getStatusClass(conta.statusCadastro)}`}>
                    {conta.statusCadastro === "ATIVA" ? "Ativa" : "Inativa"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <DataTableRowActions
                    actions={[
                      {
                        label: "Editar",
                        kind: "edit",
                        onClick: () => openEdit(conta),
                      },
                      {
                        label: conta.statusCadastro === "ATIVA" ? "Inativar" : "Ativar",
                        kind: "toggle",
                        onClick: () => handleToggle(conta),
                      },
                    ]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-[11px] text-muted-foreground">
        {contas.length > 0 && (
          <p>
            Total: <span className="font-semibold text-foreground">{contas.length}</span> contas
          </p>
        )}
      </div>
    </div>
  );
}
