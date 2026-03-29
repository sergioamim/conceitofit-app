"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getNfseConfiguracaoAtualApi, listAgregadorTransacoesApi } from "@/lib/api/admin-financeiro";
import { emitirNfsePagamentoApi } from "@/lib/api/pagamentos";
import { AGREGADOR_REPASSE_LABEL, getNfseBloqueioMensagem, summarizeRecebimentosOperacionais } from "@/lib/backoffice/admin-financeiro";
import { getBusinessMonthRange } from "@/lib/business-date";
import {
  createRecebimentoAvulsoService,
  listContasReceberOperacionais,
  type PagamentoComAluno,
} from "@/lib/tenant/financeiro/recebimentos";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import type { AgregadorTransacao, NfseConfiguracao, Pagamento, TipoFormaPagamento } from "@/lib/types";
import { StatusBadge } from "@/components/shared/status-badge";
import { ExportMenu, type ExportColumn } from "@/components/shared/export-menu";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { FILTER_ALL, type WithFilterAll } from "@/lib/shared/constants/filters";

type StatusFiltro = WithFilterAll<Pagamento["status"]>;

type RecebimentoForm = {
  clienteNome: string;
  descricao: string;
  valor: string;
  dataVencimento: string;
  status: "PENDENTE" | "PAGO";
  dataPagamento: string;
  formaPagamento: TipoFormaPagamento;
};

const RECEBIMENTO_FORM_DEFAULT: RecebimentoForm = {
  clienteNome: "",
  descricao: "",
  valor: "",
  dataVencimento: "",
  status: "PENDENTE",
  dataPagamento: "",
  formaPagamento: "PIX",
};

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(value?: string) {
  if (!value) return "-";
  const normalized = value.includes("T") ? value.split("T")[0] : value;
  const [year, month, day] = normalized.split("-");
  if (!year || !month || !day) return normalized;
  return `${day}/${month}/${year}`;
}

function monthRangeFromNow() {
  return getBusinessMonthRange();
}

export default function RecebimentosPage() {
  const { tenantId, tenantName, tenantResolved } = useTenantContext();
  const initialRange = monthRangeFromNow();
  const [pagamentos, setPagamentos] = useState<PagamentoComAluno[]>([]);
  const [transacoes, setTransacoes] = useState<AgregadorTransacao[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFiltro>(FILTER_ALL);
  const [startDate, setStartDate] = useState(initialRange.start);
  const [endDate, setEndDate] = useState(initialRange.end);
  const [modalOpen, setModalOpen] = useState(false);
  const [nfseConfiguracao, setNfseConfiguracao] = useState<NfseConfiguracao | null>(null);
  const [form, setForm] = useState<RecebimentoForm>({
    ...RECEBIMENTO_FORM_DEFAULT,
    dataVencimento: initialRange.end,
    dataPagamento: initialRange.end,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const [pagamentosResponse, transacoesResponse, nfseConfig] = await Promise.all([
        listContasReceberOperacionais({
          tenantId,
          startDate,
          endDate,
        }),
        listAgregadorTransacoesApi({ tenantId }),
        getNfseConfiguracaoAtualApi({ tenantId }).catch(() => null),
      ]);
      setPagamentos(pagamentosResponse);
      setTransacoes(transacoesResponse);
      setNfseConfiguracao(nfseConfig);
    } catch (loadError) {
      setError(normalizeErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [endDate, startDate, tenantId]);

  useEffect(() => {
    if (tenantResolved) {
      void load();
    }
  }, [load, tenantResolved]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return pagamentos.filter((item) => {
      if (item.dataVencimento < startDate || item.dataVencimento > endDate) return false;
      if (status !== FILTER_ALL && item.status !== status) return false;
      if (!term) return true;
      return [
        item.aluno?.nome ?? "",
        item.descricao,
        item.aluno?.cpf ?? "",
        item.formaPagamento ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [endDate, pagamentos, search, startDate, status]);

  const resumo = useMemo(
    () => summarizeRecebimentosOperacionais(filtered, transacoes),
    [filtered, transacoes]
  );

  const transacaoPorPagamento = useMemo(
    () => new Map(transacoes.map((item) => [item.pagamentoId, item] as const)),
    [transacoes]
  );
  const nfseBloqueio = getNfseBloqueioMensagem(nfseConfiguracao);

  async function handleCreateRecebimento() {
    if (!tenantId) return;
    if (!form.descricao.trim() || !form.valor || !form.dataVencimento) {
      setError("Preencha descrição, valor e vencimento.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await createRecebimentoAvulsoService({
        tenantId,
        data: {
          clienteNome: form.clienteNome.trim() || undefined,
          descricao: form.descricao.trim(),
          valor: Number(form.valor),
          dataVencimento: form.dataVencimento,
          status: form.status,
          dataPagamento: form.status === "PAGO" ? form.dataPagamento : undefined,
          formaPagamento: form.status === "PAGO" ? form.formaPagamento : undefined,
        },
      });
      setModalOpen(false);
      setForm({
        ...RECEBIMENTO_FORM_DEFAULT,
        dataVencimento: endDate,
        dataPagamento: endDate,
      });
      setSuccess("Recebimento avulso criado.");
      await load();
    } catch (createError) {
      setError(normalizeErrorMessage(createError));
    } finally {
      setSaving(false);
    }
  }

  async function handleEmitirNfse(id: string) {
    if (!tenantId) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await emitirNfsePagamentoApi({
        tenantId,
        id,
      });
      setSuccess("NFSe emitida com sucesso.");
      await load();
    } catch (emitError) {
      setError(normalizeErrorMessage(emitError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Gerencial</p>
          <h1 className="font-display text-2xl font-bold tracking-tight">Recebimentos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cobrança, baixa e pendências fiscais da unidade ativa:{" "}
            <span className="font-medium text-foreground">{tenantResolved ? tenantName : "Carregando..."}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportMenu
            data={filtered}
            columns={[
              { label: "Cliente", accessor: (r) => r.aluno?.nome ?? "—" },
              { label: "Valor", accessor: (r) => formatBRL(Number(r.valor ?? 0)) },
              { label: "Vencimento", accessor: (r) => formatDate(r.dataVencimento) },
              { label: "Status", accessor: "status" },
            ] satisfies ExportColumn<(typeof filtered)[number]>[]}
            filename="recebimentos"
            title="Recebimentos"
          />
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="mr-2 size-4" />
            Novo recebimento
          </Button>
        </div>
      </div>

      {(error || success) && (
        <div
          className={`rounded-md border px-4 py-3 text-sm ${
            error
              ? "border-gym-danger/30 bg-gym-danger/10 text-gym-danger"
              : "border-gym-teal/30 bg-gym-teal/10 text-gym-teal"
          }`}
        >
          {error ?? success}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Recebido</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-gym-teal">{formatBRL(resumo.recebido)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Em aberto</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-gym-warning">{formatBRL(resumo.emAberto)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Inadimplência</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-gym-danger">{formatBRL(resumo.inadimplencia)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">NFSe pendente</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-gym-accent">{resumo.nfsePendente}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Repasse divergente</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-foreground">{resumo.repasseDivergente}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_180px_180px_180px]">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por cliente, CPF, descrição ou forma..."
            className="border-border bg-secondary"
          />
          <Input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="border-border bg-secondary"
          />
          <Input
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            className="border-border bg-secondary"
          />
          <Select value={status} onValueChange={(value) => setStatus(value as StatusFiltro)}>
            <SelectTrigger className="w-full border-border bg-secondary">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-border bg-card">
              <SelectItem value={FILTER_ALL}>Todos</SelectItem>
              <SelectItem value="PENDENTE">Pendente</SelectItem>
              <SelectItem value="VENCIDO">Vencido</SelectItem>
              <SelectItem value="PAGO">Pago</SelectItem>
              <SelectItem value="CANCELADO">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 text-left font-semibold">Cliente</th>
              <th className="px-4 py-3 text-left font-semibold">Recebimento</th>
              <th className="px-4 py-3 text-left font-semibold">Vencimento</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">NFSe</th>
              <th className="px-4 py-3 text-left font-semibold">Adquirente</th>
              <th className="px-4 py-3 text-right font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  Carregando recebimentos...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  Nenhum recebimento encontrado para o período.
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const transacao = transacaoPorPagamento.get(item.id);
                return (
                  <tr key={item.id} className="transition-colors hover:bg-secondary/30">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{item.aluno?.nome ?? "Cliente avulso"}</p>
                      {item.aluno?.cpf ? <p className="text-xs text-muted-foreground">{item.aluno.cpf}</p> : null}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{item.descricao}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatBRL(item.valorFinal)} · {item.formaPagamento ?? "Sem baixa"}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <p>{formatDate(item.dataVencimento)}</p>
                      <p className="text-xs">{formatDate(item.dataPagamento)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-3">
                      {item.nfseEmitida ? (
                        <div>
                          <p className="font-medium text-gym-teal">{item.nfseNumero ?? "Emitida"}</p>
                          <p className="text-xs text-muted-foreground">OK</p>
                        </div>
                      ) : nfseBloqueio ? (
                        <span className="text-xs font-medium text-gym-danger" title={nfseBloqueio}>
                          Bloqueada
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-gym-warning">Pendente</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {transacao ? (
                        <div>
                          <p className="font-medium text-foreground">{transacao.adquirente}</p>
                          <p className="text-xs text-muted-foreground">
                            {AGREGADOR_REPASSE_LABEL[transacao.statusRepasse]}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Sem adquirente</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {item.status === "PAGO" && !item.nfseEmitida && !nfseBloqueio ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-border"
                          onClick={() => void handleEmitirNfse(item.id)}
                          disabled={saving}
                        >
                          <ReceiptText className="mr-2 size-4" />
                          Emitir NFSe
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="border-border bg-card sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold">Novo recebimento avulso</DialogTitle>
            <DialogDescription>
              Lance uma cobrança manual e, se necessário, já registre a baixa financeira.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1 md:col-span-2">
              <label htmlFor="recebimento-cliente" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cliente</label>
              <Input
                id="recebimento-cliente"
                value={form.clienteNome}
                onChange={(event) => setForm((prev) => ({ ...prev, clienteNome: event.target.value }))}
                className="border-border bg-secondary"
                placeholder="Nome do cliente"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label htmlFor="recebimento-descricao" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Descrição *</label>
              <Input
                id="recebimento-descricao"
                value={form.descricao}
                onChange={(event) => setForm((prev) => ({ ...prev, descricao: event.target.value }))}
                className="border-border bg-secondary"
                placeholder="Ex.: taxa de avaliação"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="recebimento-valor" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Valor *</label>
              <Input
                id="recebimento-valor"
                type="number"
                min={0}
                step="0.01"
                value={form.valor}
                onChange={(event) => setForm((prev) => ({ ...prev, valor: event.target.value }))}
                className="border-border bg-secondary"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="recebimento-vencimento" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Vencimento *</label>
              <Input
                id="recebimento-vencimento"
                type="date"
                value={form.dataVencimento}
                onChange={(event) => setForm((prev) => ({ ...prev, dataVencimento: event.target.value }))}
                className="border-border bg-secondary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status inicial</label>
              <Select value={form.status} onValueChange={(value) => setForm((prev) => ({ ...prev, status: value as "PENDENTE" | "PAGO" }))}>
                <SelectTrigger className="w-full border-border bg-secondary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-border bg-card">
                  <SelectItem value="PENDENTE">Pendente</SelectItem>
                  <SelectItem value="PAGO">Pago</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Forma de pagamento</label>
              <Select
                value={form.formaPagamento}
                onValueChange={(value) => setForm((prev) => ({ ...prev, formaPagamento: value as TipoFormaPagamento }))}
              >
                <SelectTrigger className="w-full border-border bg-secondary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-border bg-card">
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="CARTAO_CREDITO">Cartão de crédito</SelectItem>
                  <SelectItem value="CARTAO_DEBITO">Cartão de débito</SelectItem>
                  <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
                  <SelectItem value="BOLETO">Boleto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.status === "PAGO" ? (
              <div className="space-y-1 md:col-span-2">
                <label htmlFor="recebimento-pagamento" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Data do pagamento</label>
                <Input
                  id="recebimento-pagamento"
                  type="date"
                  value={form.dataPagamento}
                  onChange={(event) => setForm((prev) => ({ ...prev, dataPagamento: event.target.value }))}
                  className="border-border bg-secondary"
                />
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-border" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleCreateRecebimento} disabled={saving}>
              {saving ? "Salvando..." : "Salvar recebimento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
