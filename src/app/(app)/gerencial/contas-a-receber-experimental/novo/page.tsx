"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Beaker, CalendarClock, Edit3, Save, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SuggestionInput, type SuggestionOption } from "@/components/shared/suggestion-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ajustarPagamento,
  createRecebimentoAvulso,
  listAlunos,
  listContasReceberExperimental,
  listFormasPagamento,
} from "@/lib/mock/services";
import type { Aluno, FormaPagamento, Pagamento, TipoFormaPagamento, TipoPagamento } from "@/lib/types";

type PagamentoComAluno = Pagamento & {
  aluno?: Aluno;
  clienteNome?: string;
  documentoCliente?: string;
};
type ModoTela = "NOVO" | "AJUSTE";

type NovoFormState = {
  alunoId: string;
  descricao: string;
  tipo: TipoPagamento;
  valor: string;
  desconto: string;
  dataVencimento: string;
  status: "PENDENTE" | "PAGO";
  dataPagamento: string;
  formaPagamento: TipoFormaPagamento;
  observacoes: string;
};

type AjusteFormState = {
  descricao: string;
  tipo: TipoPagamento;
  valor: string;
  desconto: string;
  dataVencimento: string;
  status: Pagamento["status"];
  dataPagamento: string;
  formaPagamento: TipoFormaPagamento;
  observacoes: string;
};

const FORMA_PAGAMENTO_LABEL: Record<TipoFormaPagamento, string> = {
  DINHEIRO: "Dinheiro",
  PIX: "PIX",
  CARTAO_CREDITO: "Cartão de crédito",
  CARTAO_DEBITO: "Cartão de débito",
  BOLETO: "Boleto",
  RECORRENTE: "Recorrente",
};

const TIPO_RECEBIMENTO_LABEL: Record<TipoPagamento, string> = {
  MATRICULA: "Matrícula",
  MENSALIDADE: "Mensalidade",
  TAXA: "Taxa",
  PRODUTO: "Produto",
  AVULSO: "Avulso",
};

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function monthRangeFromNow() {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;
}

function toMoneyNumber(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  const normalized = trimmed.includes(",")
    ? trimmed.replace(/\./g, "").replace(",", ".")
    : trimmed;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function pagamentoLabel(item: PagamentoComAluno) {
  const cliente = item.aluno?.nome ?? item.clienteNome ?? "Sem cliente";
  const valor = Number(item.valorFinal ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  return `${cliente} · ${item.descricao} · ${valor} · venc. ${new Date(`${item.dataVencimento}T00:00:00`).toLocaleDateString("pt-BR")}`;
}

export default function NovoRecebimentoExperimentalPage() {
  const [modoFromQuery, setModoFromQuery] = useState("");
  const [pagamentoIdFromQuery, setPagamentoIdFromQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [modo, setModo] = useState<ModoTela>("NOVO");
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [pagamentos, setPagamentos] = useState<PagamentoComAluno[]>([]);
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([]);
  const [buscaAjuste, setBuscaAjuste] = useState("");
  const [pagamentoAjusteId, setPagamentoAjusteId] = useState("");
  const [ultimoPagamentoPrefill, setUltimoPagamentoPrefill] = useState<string>("");
  const [clienteQuery, setClienteQuery] = useState("");
  const [novoForm, setNovoForm] = useState<NovoFormState>({
    alunoId: "SEM_CLIENTE",
    descricao: "",
    tipo: "AVULSO",
    valor: "",
    desconto: "0",
    dataVencimento: monthRangeFromNow(),
    status: "PENDENTE",
    dataPagamento: todayISO(),
    formaPagamento: "PIX",
    observacoes: "",
  });
  const [ajusteForm, setAjusteForm] = useState<AjusteFormState>({
    descricao: "",
    tipo: "AVULSO",
    valor: "",
    desconto: "0",
    dataVencimento: monthRangeFromNow(),
    status: "PENDENTE",
    dataPagamento: todayISO(),
    formaPagamento: "PIX",
    observacoes: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [alunosData, pagamentosData, formasData] = await Promise.all([
        listAlunos(),
        listContasReceberExperimental(),
        listFormasPagamento({ apenasAtivas: true }),
      ]);
      setAlunos(alunosData);
      setPagamentos(pagamentosData);
      setFormasPagamento(formasData);
    } catch (loadError) {
      console.error("[novo-recebimento-experimental] erro ao carregar", loadError);
      setError("Não foi possível carregar dados de recebimentos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const formasDisponiveis = useMemo(() => {
    const seen = new Set<TipoFormaPagamento>();
    return formasPagamento
      .filter((forma) => forma.ativo)
      .filter((forma) => {
        if (seen.has(forma.tipo)) return false;
        seen.add(forma.tipo);
        return true;
      });
  }, [formasPagamento]);

  useEffect(() => {
    if (formasDisponiveis.length === 0) return;
    const tipo = formasDisponiveis[0].tipo;
    setNovoForm((prev) => {
      if (formasDisponiveis.some((item) => item.tipo === prev.formaPagamento)) return prev;
      return { ...prev, formaPagamento: tipo };
    });
    setAjusteForm((prev) => {
      if (formasDisponiveis.some((item) => item.tipo === prev.formaPagamento)) return prev;
      return { ...prev, formaPagamento: tipo };
    });
  }, [formasDisponiveis]);

  const clienteOptions = useMemo<SuggestionOption[]>(
    () =>
      alunos.map((aluno) => ({
        id: aluno.id,
        label: `${aluno.nome} · CPF ${aluno.cpf}`,
        searchText: `${aluno.nome} ${aluno.cpf}`,
      })),
    [alunos]
  );

  useEffect(() => {
    if (!novoForm.alunoId || novoForm.alunoId === "SEM_CLIENTE") return;
    const selected = clienteOptions.find((option) => option.id === novoForm.alunoId);
    if (selected && selected.label !== clienteQuery) {
      setClienteQuery(selected.label);
    }
  }, [clienteOptions, clienteQuery, novoForm.alunoId]);

  const pagamentosFiltradosParaAjuste = useMemo(() => {
    const term = buscaAjuste.trim().toLowerCase();
    if (!term) return pagamentos;
    const digits = buscaAjuste.replace(/\D/g, "");
    return pagamentos.filter((item) => {
      const nome = (item.aluno?.nome ?? item.clienteNome ?? "").toLowerCase();
      const cpf = (item.aluno?.cpf ?? item.documentoCliente ?? "").replace(/\D/g, "");
      return (
        nome.includes(term) ||
        item.descricao.toLowerCase().includes(term) ||
        item.tipo.toLowerCase().includes(term) ||
        (digits.length > 0 && cpf.includes(digits))
      );
    });
  }, [buscaAjuste, pagamentos]);

  const pagamentoSelecionado = useMemo(
    () => pagamentos.find((item) => item.id === pagamentoAjusteId),
    [pagamentoAjusteId, pagamentos]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setModoFromQuery((params.get("modo") ?? "").toUpperCase());
    setPagamentoIdFromQuery(params.get("pagamentoId") ?? "");
  }, []);

  useEffect(() => {
    if (modoFromQuery === "AJUSTE") {
      setModo("AJUSTE");
    }
  }, [modoFromQuery]);

  useEffect(() => {
    const targetId = pagamentoIdFromQuery.trim();
    if (!targetId || targetId === ultimoPagamentoPrefill) return;
    const exists = pagamentos.some((item) => item.id === targetId);
    if (!exists) return;
    setModo("AJUSTE");
    setPagamentoAjusteId(targetId);
    setUltimoPagamentoPrefill(targetId);
  }, [pagamentoIdFromQuery, pagamentos, ultimoPagamentoPrefill]);

  useEffect(() => {
    if (!pagamentoSelecionado) return;
    setAjusteForm({
      descricao: pagamentoSelecionado.descricao,
      tipo: pagamentoSelecionado.tipo,
      valor: Number(pagamentoSelecionado.valor).toString(),
      desconto: Number(pagamentoSelecionado.desconto ?? 0).toString(),
      dataVencimento: pagamentoSelecionado.dataVencimento,
      status: pagamentoSelecionado.status,
      dataPagamento: pagamentoSelecionado.dataPagamento ?? todayISO(),
      formaPagamento: pagamentoSelecionado.formaPagamento ?? "PIX",
      observacoes: pagamentoSelecionado.observacoes ?? "",
    });
  }, [pagamentoSelecionado]);

  async function handleSubmitNovo(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (novoForm.descricao.trim().length < 3) {
      setError("Informe uma descrição para o recebimento.");
      return;
    }
    if (novoForm.alunoId === "") {
      setError("Selecione um cliente da lista ou use Sem cliente (avulso).");
      return;
    }
    const valor = toMoneyNumber(novoForm.valor);
    if (valor <= 0) {
      setError("Informe um valor maior que zero.");
      return;
    }
    if (!novoForm.dataVencimento) {
      setError("Informe a data de vencimento.");
      return;
    }
    if (novoForm.status === "PAGO" && !novoForm.dataPagamento) {
      setError("Informe a data de pagamento para recebimento já concluído.");
      return;
    }

    setSaving(true);
    try {
      await createRecebimentoAvulso({
        alunoId: novoForm.alunoId && novoForm.alunoId !== "SEM_CLIENTE" ? novoForm.alunoId : undefined,
        descricao: novoForm.descricao.trim(),
        tipo: novoForm.tipo,
        valor,
        desconto: toMoneyNumber(novoForm.desconto),
        dataVencimento: novoForm.dataVencimento,
        status: novoForm.status,
        dataPagamento: novoForm.status === "PAGO" ? novoForm.dataPagamento : undefined,
        formaPagamento: novoForm.status === "PAGO" ? novoForm.formaPagamento : undefined,
        observacoes: novoForm.observacoes.trim() || undefined,
      });
      setSuccess("Recebimento registrado com sucesso.");
      setNovoForm((prev) => ({
        ...prev,
        descricao: "",
        valor: "",
        desconto: "0",
        observacoes: "",
      }));
      await load();
    } catch (submitError) {
      console.error("[novo-recebimento-experimental] erro ao registrar", submitError);
      setError("Não foi possível registrar o recebimento.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmitAjuste(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!pagamentoSelecionado) {
      setError("Selecione um recebimento para ajustar.");
      return;
    }
    if (ajusteForm.descricao.trim().length < 3) {
      setError("Informe uma descrição válida.");
      return;
    }
    if (toMoneyNumber(ajusteForm.valor) <= 0) {
      setError("Informe um valor maior que zero no ajuste.");
      return;
    }
    if (!ajusteForm.dataVencimento) {
      setError("Informe uma data de vencimento.");
      return;
    }
    if (ajusteForm.status === "PAGO" && !ajusteForm.dataPagamento) {
      setError("Informe a data de pagamento para status pago.");
      return;
    }

    setSaving(true);
    try {
      await ajustarPagamento(pagamentoSelecionado.id, {
        descricao: ajusteForm.descricao.trim(),
        tipo: ajusteForm.tipo,
        valor: toMoneyNumber(ajusteForm.valor),
        desconto: toMoneyNumber(ajusteForm.desconto),
        dataVencimento: ajusteForm.dataVencimento,
        status: ajusteForm.status,
        dataPagamento: ajusteForm.status === "PAGO" ? ajusteForm.dataPagamento : undefined,
        formaPagamento: ajusteForm.status === "PAGO" ? ajusteForm.formaPagamento : undefined,
        observacoes: ajusteForm.observacoes,
      });
      setSuccess("Ajuste aplicado com sucesso.");
      await load();
    } catch (submitError) {
      console.error("[novo-recebimento-experimental] erro ao ajustar", submitError);
      setError("Não foi possível aplicar o ajuste.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Badge variant="outline" className="border-gym-accent/40 text-gym-accent">
            <Beaker className="size-3.5" />
            Protótipo experimental
          </Badge>
          <h1 className="font-display text-2xl font-bold tracking-tight">Novo Recebimento ou Ajuste</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Lance recebimentos avulsos fora do fluxo padrão e ajuste títulos de clientes sem sair do financeiro.
          </p>
        </div>
        <Button asChild variant="outline" className="border-border">
          <Link href="/gerencial/contas-a-receber-experimental">
            <ArrowLeft className="size-4" />
            Voltar para protótipo
          </Link>
        </Button>
      </div>

      {error && (
        <Card className="gap-3 border-gym-danger/40 bg-gym-danger/5 py-4">
          <CardHeader className="px-4 pb-0">
            <CardTitle className="text-base text-gym-danger">Não foi possível concluir</CardTitle>
            <CardDescription className="text-gym-danger/90">{error}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {success && (
        <Card className="gap-3 border-gym-teal/40 bg-gym-teal/5 py-4">
          <CardHeader className="px-4 pb-0">
            <CardTitle className="text-base text-gym-teal">Operação concluída</CardTitle>
            <CardDescription className="text-gym-teal/90">{success}</CardDescription>
          </CardHeader>
          <CardContent className="px-4">
            <Button asChild variant="outline" className="border-gym-teal/40">
              <Link href="/gerencial/contas-a-receber-experimental">Ir para fila de cobrança</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant={modo === "NOVO" ? "default" : "outline"} className={modo === "NOVO" ? "" : "border-border"} onClick={() => setModo("NOVO")}>
          Novo recebimento avulso
        </Button>
        <Button type="button" variant={modo === "AJUSTE" ? "default" : "outline"} className={modo === "AJUSTE" ? "" : "border-border"} onClick={() => setModo("AJUSTE")}>
          Ajustar recebimento existente
        </Button>
      </div>

      {modo === "NOVO" && (
        <form className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]" onSubmit={handleSubmitNovo}>
          <Card>
            <CardHeader>
              <CardTitle>Dados do novo recebimento</CardTitle>
              <CardDescription>Use sem cliente para lançamentos avulsos.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cliente</label>
                <SuggestionInput
                  value={clienteQuery}
                  onValueChange={(value) => {
                    setClienteQuery(value);
                    const exact = clienteOptions.find((option) => option.label === value);
                    setNovoForm((prev) => ({
                      ...prev,
                      alunoId: exact?.id ?? (value.trim() === "" ? "SEM_CLIENTE" : ""),
                    }));
                  }}
                  onSelect={(option) => {
                    setNovoForm((prev) => ({ ...prev, alunoId: option.id }));
                    setClienteQuery(option.label);
                  }}
                  options={clienteOptions}
                  placeholder="Buscar cliente por nome ou CPF"
                  minCharsToSearch={3}
                />
                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-auto px-0 py-0 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setNovoForm((prev) => ({ ...prev, alunoId: "SEM_CLIENTE" }));
                      setClienteQuery("");
                    }}
                  >
                    Sem cliente (avulso)
                  </Button>
                  {novoForm.alunoId && novoForm.alunoId !== "SEM_CLIENTE" && (
                    <span className="text-xs text-gym-teal">Cliente selecionado</span>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tipo</label>
                <Select value={novoForm.tipo} onValueChange={(value) => setNovoForm((prev) => ({ ...prev, tipo: value as TipoPagamento }))}>
                  <SelectTrigger className="w-full border-border bg-secondary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-border bg-card">
                    {(Object.keys(TIPO_RECEBIMENTO_LABEL) as TipoPagamento[]).map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {TIPO_RECEBIMENTO_LABEL[tipo]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Descrição</label>
                <Input
                  value={novoForm.descricao}
                  onChange={(event) => setNovoForm((prev) => ({ ...prev, descricao: event.target.value }))}
                  placeholder="Ex.: Recebimento de parceria, ajuste comercial..."
                  className="border-border bg-secondary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Valor</label>
                <Input
                  value={novoForm.valor}
                  onChange={(event) => setNovoForm((prev) => ({ ...prev, valor: event.target.value }))}
                  placeholder="0,00"
                  className="border-border bg-secondary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Desconto</label>
                <Input
                  value={novoForm.desconto}
                  onChange={(event) => setNovoForm((prev) => ({ ...prev, desconto: event.target.value }))}
                  placeholder="0,00"
                  className="border-border bg-secondary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Vencimento</label>
                <Input
                  type="date"
                  value={novoForm.dataVencimento}
                  onChange={(event) => setNovoForm((prev) => ({ ...prev, dataVencimento: event.target.value }))}
                  className="border-border bg-secondary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status inicial</label>
                <Select value={novoForm.status} onValueChange={(value) => setNovoForm((prev) => ({ ...prev, status: value as "PENDENTE" | "PAGO" }))}>
                  <SelectTrigger className="w-full border-border bg-secondary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-border bg-card">
                    <SelectItem value="PENDENTE">Pendente</SelectItem>
                    <SelectItem value="PAGO">Já recebido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Data de recebimento</label>
                <Input
                  type="date"
                  value={novoForm.dataPagamento}
                  onChange={(event) => setNovoForm((prev) => ({ ...prev, dataPagamento: event.target.value }))}
                  className="border-border bg-secondary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Forma de recebimento</label>
                <Select
                  value={novoForm.formaPagamento}
                  onValueChange={(value) => setNovoForm((prev) => ({ ...prev, formaPagamento: value as TipoFormaPagamento }))}
                >
                  <SelectTrigger className="w-full border-border bg-secondary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-border bg-card">
                    {(formasDisponiveis.length > 0
                      ? formasDisponiveis.map((item) => item.tipo)
                      : (Object.keys(FORMA_PAGAMENTO_LABEL) as TipoFormaPagamento[])
                    ).map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {FORMA_PAGAMENTO_LABEL[tipo]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {novoForm.status !== "PAGO" && (
                <p className="text-[11px] text-muted-foreground md:col-span-2">
                  Esses dados ficam pré-definidos e serão aplicados quando o status for alterado para pago.
                </p>
              )}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Observações</label>
                <Input
                  value={novoForm.observacoes}
                  onChange={(event) => setNovoForm((prev) => ({ ...prev, observacoes: event.target.value }))}
                  placeholder="Opcional"
                  className="border-border bg-secondary"
                />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Resumo do lançamento</CardTitle>
                <CardDescription>Prévia antes de gravar.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Cliente</span>
                  <span className="font-medium">
                    {novoForm.alunoId === "SEM_CLIENTE"
                      ? "Avulso (sem cliente)"
                      : (alunos.find((item) => item.id === novoForm.alunoId)?.nome ?? "Cliente")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tipo</span>
                  <span className="font-medium">{TIPO_RECEBIMENTO_LABEL[novoForm.tipo]}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Valor final</span>
                  <span className="font-medium">
                    {Math.max(0, toMoneyNumber(novoForm.valor) - toMoneyNumber(novoForm.desconto)).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card className="gap-3 border-gym-accent/25 bg-gym-accent/5 py-4">
              <CardHeader className="px-4 pb-0">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="size-4 text-gym-accent" />
                  Dica de operação
                </CardTitle>
                <CardDescription>
                  Para recebimento avulso, use Sem cliente e deixe a descrição bem clara para rastreabilidade.
                </CardDescription>
              </CardHeader>
            </Card>
            <Button type="submit" className="w-full" disabled={saving || loading}>
              <Save className="size-4" />
              {saving ? "Salvando..." : "Salvar recebimento"}
            </Button>
          </div>
        </form>
      )}

      {modo === "AJUSTE" && (
        <form className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]" onSubmit={handleSubmitAjuste}>
          <Card>
            <CardHeader>
              <CardTitle>Ajustar recebimento de cliente</CardTitle>
              <CardDescription>Selecione um título e ajuste os dados necessários.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_2fr]">
                <Input
                  value={buscaAjuste}
                  onChange={(event) => setBuscaAjuste(event.target.value)}
                  placeholder="Buscar por cliente, CPF, tipo ou descrição..."
                  className="border-border bg-secondary"
                />
                <Select value={pagamentoAjusteId} onValueChange={setPagamentoAjusteId}>
                  <SelectTrigger className="w-full border-border bg-secondary">
                    <SelectValue placeholder="Selecione o recebimento" />
                  </SelectTrigger>
                  <SelectContent className="border-border bg-card">
                    {pagamentosFiltradosParaAjuste.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {pagamentoLabel(item)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {pagamentoSelecionado ? (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Descrição</label>
                    <Input
                      value={ajusteForm.descricao}
                      onChange={(event) => setAjusteForm((prev) => ({ ...prev, descricao: event.target.value }))}
                      className="border-border bg-secondary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tipo</label>
                    <Select value={ajusteForm.tipo} onValueChange={(value) => setAjusteForm((prev) => ({ ...prev, tipo: value as TipoPagamento }))}>
                      <SelectTrigger className="w-full border-border bg-secondary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-border bg-card">
                        {(Object.keys(TIPO_RECEBIMENTO_LABEL) as TipoPagamento[]).map((tipo) => (
                          <SelectItem key={tipo} value={tipo}>
                            {TIPO_RECEBIMENTO_LABEL[tipo]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</label>
                    <Select value={ajusteForm.status} onValueChange={(value) => setAjusteForm((prev) => ({ ...prev, status: value as Pagamento["status"] }))}>
                      <SelectTrigger className="w-full border-border bg-secondary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-border bg-card">
                        <SelectItem value="PENDENTE">Pendente</SelectItem>
                        <SelectItem value="PAGO">Pago</SelectItem>
                        <SelectItem value="CANCELADO">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Valor</label>
                    <Input
                      value={ajusteForm.valor}
                      onChange={(event) => setAjusteForm((prev) => ({ ...prev, valor: event.target.value }))}
                      className="border-border bg-secondary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Desconto</label>
                    <Input
                      value={ajusteForm.desconto}
                      onChange={(event) => setAjusteForm((prev) => ({ ...prev, desconto: event.target.value }))}
                      className="border-border bg-secondary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Vencimento</label>
                    <Input
                      type="date"
                      value={ajusteForm.dataVencimento}
                      onChange={(event) => setAjusteForm((prev) => ({ ...prev, dataVencimento: event.target.value }))}
                      className="border-border bg-secondary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Data de recebimento</label>
                    <Input
                      type="date"
                      value={ajusteForm.dataPagamento}
                      onChange={(event) => setAjusteForm((prev) => ({ ...prev, dataPagamento: event.target.value }))}
                      className="border-border bg-secondary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Forma de recebimento</label>
                    <Select
                      value={ajusteForm.formaPagamento}
                      onValueChange={(value) => setAjusteForm((prev) => ({ ...prev, formaPagamento: value as TipoFormaPagamento }))}
                    >
                      <SelectTrigger className="w-full border-border bg-secondary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-border bg-card">
                        {(formasDisponiveis.length > 0
                          ? formasDisponiveis.map((item) => item.tipo)
                          : (Object.keys(FORMA_PAGAMENTO_LABEL) as TipoFormaPagamento[])
                        ).map((tipo) => (
                          <SelectItem key={tipo} value={tipo}>
                            {FORMA_PAGAMENTO_LABEL[tipo]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {ajusteForm.status !== "PAGO" && (
                    <p className="text-[11px] text-muted-foreground md:col-span-2">
                      Esses dados serão utilizados quando o título ficar com status pago.
                    </p>
                  )}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Observações</label>
                    <Input
                      value={ajusteForm.observacoes}
                      onChange={(event) => setAjusteForm((prev) => ({ ...prev, observacoes: event.target.value }))}
                      placeholder="Opcional"
                      className="border-border bg-secondary"
                    />
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border bg-secondary/20 p-4 text-sm text-muted-foreground">
                  Selecione um recebimento para carregar os dados de ajuste.
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contexto do ajuste</CardTitle>
                <CardDescription>Conferência antes de salvar.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Cliente</span>
                  <span className="font-medium">
                    {pagamentoSelecionado?.aluno?.nome ?? pagamentoSelecionado?.clienteNome ?? "Sem cliente"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Valor final</span>
                  <span className="font-medium">
                    {Math.max(0, toMoneyNumber(ajusteForm.valor) - toMoneyNumber(ajusteForm.desconto)).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium">{ajusteForm.status}</span>
                </div>
              </CardContent>
            </Card>
            <Card className="gap-3 border-gym-accent/25 bg-gym-accent/5 py-4">
              <CardHeader className="px-4 pb-0">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Edit3 className="size-4 text-gym-accent" />
                  Dica de ajuste
                </CardTitle>
                <CardDescription>
                  Prefira ajustar apenas dados necessários para preservar histórico e rastreabilidade financeira.
                </CardDescription>
              </CardHeader>
            </Card>
            <Button type="submit" className="w-full" disabled={saving || !pagamentoSelecionado || loading}>
              <Save className="size-4" />
              {saving ? "Salvando ajuste..." : "Salvar ajuste"}
            </Button>
          </div>
        </form>
      )}

      <Card className="gap-3 border-border/80 py-4">
        <CardHeader className="px-4 pb-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarClock className="size-4" />
            Fluxo recomendado
          </CardTitle>
          <CardDescription>
            1) Lance recebimento avulso ou ajuste um título existente. 2) Volte para Contas a Receber (Protótipo). 3)
            Siga a fila de cobrança prioritária.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
