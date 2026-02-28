"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Beaker, CalendarClock, Save, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createContaPagar, listTiposContaPagar, pagarContaPagar } from "@/lib/mock/services";
import type {
  ContaPagar,
  RecorrenciaContaPagar,
  TerminoRecorrenciaContaPagar,
  TipoContaPagar,
  TipoFormaPagamento,
} from "@/lib/types";

type FormState = {
  tipoContaId: string;
  fornecedor: string;
  documentoFornecedor: string;
  descricao: string;
  centroCusto: string;
  competencia: string;
  dataEmissao: string;
  dataVencimento: string;
  valorOriginal: string;
  desconto: string;
  jurosMulta: string;
  observacoes: string;
  regime: ContaPagar["regime"];
  recorrente: boolean;
  recorrenciaTipo: RecorrenciaContaPagar;
  recorrenciaIntervaloDias: string;
  recorrenciaDiaDoMes: string;
  recorrenciaDataInicial: string;
  recorrenciaTermino: TerminoRecorrenciaContaPagar;
  recorrenciaDataFim: string;
  recorrenciaNumeroOcorrencias: string;
  criarLancamentoInicialAgora: boolean;
};

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function monthRangeFromNow() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`,
    end: `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`,
  };
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

const RECORRENCIA_TERMINO_OPTIONS: Array<{ value: TerminoRecorrenciaContaPagar; label: string }> = [
  { value: "SEM_FIM", label: "Sem fim" },
  { value: "EM_DATA", label: "Até uma data" },
  { value: "APOS_OCORRENCIAS", label: "Após N ocorrências" },
];

const FORMA_PAGAMENTO_LABEL: Record<TipoFormaPagamento, string> = {
  DINHEIRO: "Dinheiro",
  PIX: "PIX",
  CARTAO_CREDITO: "Cartão de crédito",
  CARTAO_DEBITO: "Cartão de débito",
  BOLETO: "Boleto",
  RECORRENTE: "Recorrente",
};

export default function NovaContaPagarExperimentalPage() {
  const range = monthRangeFromNow();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tiposConta, setTiposConta] = useState<TipoContaPagar[]>([]);
  const [marcarComoPaga, setMarcarComoPaga] = useState(false);
  const [pagamentoInicial, setPagamentoInicial] = useState({
    dataPagamento: todayISO(),
    formaPagamento: "PIX" as TipoFormaPagamento,
    valorPago: "",
    observacoes: "",
  });
  const [form, setForm] = useState<FormState>({
    tipoContaId: "",
    fornecedor: "",
    documentoFornecedor: "",
    descricao: "",
    centroCusto: "",
    competencia: range.start,
    dataEmissao: todayISO(),
    dataVencimento: range.end,
    valorOriginal: "",
    desconto: "0",
    jurosMulta: "0",
    observacoes: "",
    regime: "AVULSA",
    recorrente: false,
    recorrenciaTipo: "MENSAL",
    recorrenciaIntervaloDias: "30",
    recorrenciaDiaDoMes: "",
    recorrenciaDataInicial: range.end,
    recorrenciaTermino: "SEM_FIM",
    recorrenciaDataFim: "",
    recorrenciaNumeroOcorrencias: "12",
    criarLancamentoInicialAgora: true,
  });

  const loadTipos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const tipos = await listTiposContaPagar({ apenasAtivos: true });
      setTiposConta(tipos);
      if (tipos.length > 0 && !form.tipoContaId) {
        setForm((prev) => ({ ...prev, tipoContaId: tipos[0].id }));
      }
    } catch (loadError) {
      console.error("[nova-conta-pagar-experimental] erro ao carregar tipos", loadError);
      setError("Não foi possível carregar os tipos de conta.");
    } finally {
      setLoading(false);
    }
  }, [form.tipoContaId]);

  useEffect(() => {
    void loadTipos();
  }, [loadTipos]);

  const tipoSelecionado = useMemo(
    () => tiposConta.find((item) => item.id === form.tipoContaId),
    [form.tipoContaId, tiposConta]
  );

  const valorContaLiquida = useMemo(() => {
    return Math.max(
      0,
      toMoneyNumber(form.valorOriginal) - toMoneyNumber(form.desconto) + toMoneyNumber(form.jurosMulta)
    );
  }, [form.desconto, form.jurosMulta, form.valorOriginal]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.tipoContaId) {
      setError("Selecione um tipo de conta.");
      return;
    }
    if (form.fornecedor.trim().length < 2) {
      setError("Informe o fornecedor.");
      return;
    }
    if (form.descricao.trim().length < 3) {
      setError("Informe uma descrição mais completa.");
      return;
    }
    if (!form.competencia || !form.dataVencimento) {
      setError("Competência e vencimento são obrigatórios.");
      return;
    }
    const valorOriginal = toMoneyNumber(form.valorOriginal);
    if (valorOriginal <= 0) {
      setError("Informe um valor maior que zero.");
      return;
    }

    if (form.recorrente) {
      if (!form.recorrenciaDataInicial) {
        setError("Informe a data inicial da recorrência.");
        return;
      }
      if (form.recorrenciaTipo === "MENSAL" && !form.recorrenciaDiaDoMes) {
        setError("Informe o dia do mês para recorrência mensal.");
        return;
      }
      if (form.recorrenciaTipo === "INTERVALO_DIAS" && toMoneyNumber(form.recorrenciaIntervaloDias) < 1) {
        setError("Informe um intervalo de dias válido.");
        return;
      }
      if (form.recorrenciaTermino === "EM_DATA" && !form.recorrenciaDataFim) {
        setError("Informe a data fim da recorrência.");
        return;
      }
      if (form.recorrenciaTermino === "APOS_OCORRENCIAS" && toMoneyNumber(form.recorrenciaNumeroOcorrencias) < 1) {
        setError("Informe o número de ocorrências.");
        return;
      }
    }

    setSaving(true);
    try {
      const created = await createContaPagar({
        tipoContaId: form.tipoContaId,
        fornecedor: form.fornecedor.trim(),
        documentoFornecedor: form.documentoFornecedor.trim() || undefined,
        descricao: form.descricao.trim(),
        centroCusto: form.centroCusto.trim() || undefined,
        regime: form.regime,
        competencia: form.competencia,
        dataEmissao: form.dataEmissao || undefined,
        dataVencimento: form.dataVencimento,
        valorOriginal,
        desconto: toMoneyNumber(form.desconto),
        jurosMulta: toMoneyNumber(form.jurosMulta),
        observacoes: form.observacoes.trim() || undefined,
        recorrencia: form.recorrente
          ? {
              tipo: form.recorrenciaTipo,
              intervaloDias:
                form.recorrenciaTipo === "INTERVALO_DIAS"
                  ? Math.max(1, Math.floor(toMoneyNumber(form.recorrenciaIntervaloDias)))
                  : undefined,
              diaDoMes:
                form.recorrenciaTipo === "MENSAL"
                  ? Math.max(1, Math.min(31, Math.floor(toMoneyNumber(form.recorrenciaDiaDoMes))))
                  : undefined,
              dataInicial: form.recorrenciaDataInicial,
              termino: form.recorrenciaTermino,
              dataFim: form.recorrenciaTermino === "EM_DATA" ? form.recorrenciaDataFim : undefined,
              numeroOcorrencias:
                form.recorrenciaTermino === "APOS_OCORRENCIAS"
                  ? Math.max(1, Math.floor(toMoneyNumber(form.recorrenciaNumeroOcorrencias)))
                  : undefined,
              criarLancamentoInicial: form.criarLancamentoInicialAgora,
              timezone: "America/Sao_Paulo",
            }
          : undefined,
      });

      if (marcarComoPaga) {
        if (!created) {
          setError("Não foi possível marcar como paga porque o lançamento inicial não foi criado.");
          setSaving(false);
          return;
        }

        const valorPago = toMoneyNumber(pagamentoInicial.valorPago);
        await pagarContaPagar(created.id, {
          dataPagamento: pagamentoInicial.dataPagamento,
          formaPagamento: pagamentoInicial.formaPagamento,
          valorPago: valorPago > 0 ? valorPago : valorContaLiquida,
          observacoes: pagamentoInicial.observacoes.trim() || undefined,
        });
        setSuccess("Conta criada e marcada como paga.");
      } else if (created) {
        setSuccess("Conta criada com sucesso.");
      } else {
        setSuccess("Regra recorrente criada com sucesso. O lançamento inicial não foi criado.");
      }
      setForm((prev) => ({
        ...prev,
        fornecedor: "",
        documentoFornecedor: "",
        descricao: "",
        centroCusto: "",
        valorOriginal: "",
        desconto: "0",
        jurosMulta: "0",
        observacoes: "",
      }));
      setMarcarComoPaga(false);
      setPagamentoInicial({
        dataPagamento: todayISO(),
        formaPagamento: "PIX",
        valorPago: "",
        observacoes: "",
      });
    } catch (submitError) {
      console.error("[nova-conta-pagar-experimental] erro ao salvar", submitError);
      setError("Não foi possível salvar a conta a pagar.");
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
          <h1 className="font-display text-2xl font-bold tracking-tight">Nova Conta a Pagar</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Cadastro rápido com linguagem simples e opção avançada de recorrência.
          </p>
        </div>
        <Button asChild variant="outline" className="border-border">
          <Link href="/gerencial/contas-a-pagar-experimental">
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
            <CardTitle className="text-base text-gym-teal">Cadastro concluído</CardTitle>
            <CardDescription className="text-gym-teal/90">{success}</CardDescription>
          </CardHeader>
          <CardContent className="px-4">
            <Button asChild variant="outline" className="border-gym-teal/40">
              <Link href="/gerencial/contas-a-pagar-experimental">Ir para fila de pagamento</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <form className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]" onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Dados principais</CardTitle>
            <CardDescription>Campos essenciais para registrar a conta sem retrabalho.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tipo de conta</label>
              <Select value={form.tipoContaId} onValueChange={(value) => setForm((prev) => ({ ...prev, tipoContaId: value }))}>
                <SelectTrigger className="w-full border-border bg-secondary">
                  <SelectValue placeholder={loading ? "Carregando..." : "Selecione"} />
                </SelectTrigger>
                <SelectContent className="border-border bg-card">
                  {tiposConta.map((tipo) => (
                    <SelectItem key={tipo.id} value={tipo.id}>
                      {tipo.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fornecedor</label>
              <Input
                value={form.fornecedor}
                onChange={(event) => setForm((prev) => ({ ...prev, fornecedor: event.target.value }))}
                placeholder="Ex.: Energia Elétrica S/A"
                className="border-border bg-secondary"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Descrição</label>
              <Input
                value={form.descricao}
                onChange={(event) => setForm((prev) => ({ ...prev, descricao: event.target.value }))}
                placeholder="Ex.: Conta de energia da unidade"
                className="border-border bg-secondary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Regime</label>
              <Select value={form.regime} onValueChange={(value) => setForm((prev) => ({ ...prev, regime: value as ContaPagar["regime"] }))}>
                <SelectTrigger className="w-full border-border bg-secondary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-border bg-card">
                  <SelectItem value="AVULSA">Avulsa</SelectItem>
                  <SelectItem value="FIXA">Fixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Centro de custo</label>
              <Input
                value={form.centroCusto}
                onChange={(event) => setForm((prev) => ({ ...prev, centroCusto: event.target.value }))}
                placeholder="Opcional"
                className="border-border bg-secondary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Competência</label>
              <Input
                type="date"
                value={form.competencia}
                onChange={(event) => setForm((prev) => ({ ...prev, competencia: event.target.value }))}
                className="border-border bg-secondary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Vencimento</label>
              <Input
                type="date"
                value={form.dataVencimento}
                onChange={(event) => setForm((prev) => ({ ...prev, dataVencimento: event.target.value }))}
                className="border-border bg-secondary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Valor original</label>
              <Input
                value={form.valorOriginal}
                onChange={(event) => setForm((prev) => ({ ...prev, valorOriginal: event.target.value }))}
                placeholder="0,00"
                className="border-border bg-secondary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Desconto</label>
              <Input
                value={form.desconto}
                onChange={(event) => setForm((prev) => ({ ...prev, desconto: event.target.value }))}
                placeholder="0,00"
                className="border-border bg-secondary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Juros/Multa</label>
              <Input
                value={form.jurosMulta}
                onChange={(event) => setForm((prev) => ({ ...prev, jurosMulta: event.target.value }))}
                placeholder="0,00"
                className="border-border bg-secondary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Documento do fornecedor</label>
              <Input
                value={form.documentoFornecedor}
                onChange={(event) => setForm((prev) => ({ ...prev, documentoFornecedor: event.target.value }))}
                placeholder="Opcional"
                className="border-border bg-secondary"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Observações</label>
              <Input
                value={form.observacoes}
                onChange={(event) => setForm((prev) => ({ ...prev, observacoes: event.target.value }))}
                placeholder="Opcional"
                className="border-border bg-secondary"
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Leitura inteligente</CardTitle>
              <CardDescription>Resumo para checar antes de salvar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Tipo selecionado</span>
                <span className="font-medium">{tipoSelecionado?.nome ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Categoria</span>
                <span className="font-medium">{tipoSelecionado?.categoriaOperacional ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Grupo DRE</span>
                <span className="font-medium">{tipoSelecionado?.grupoDre ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Valor líquido</span>
                <span className="font-medium">
                  {Math.max(
                    0,
                    toMoneyNumber(form.valorOriginal) - toMoneyNumber(form.desconto) + toMoneyNumber(form.jurosMulta)
                  ).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recorrência (opcional)</CardTitle>
              <CardDescription>Ative apenas para despesas repetitivas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <label className="inline-flex items-center gap-2 text-muted-foreground">
                <input
                  type="checkbox"
                  checked={form.recorrente}
                  onChange={(event) => setForm((prev) => ({ ...prev, recorrente: event.target.checked }))}
                />
                Esta conta é recorrente
              </label>

              {form.recorrente && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tipo de recorrência</label>
                    <Select
                      value={form.recorrenciaTipo}
                      onValueChange={(value) => setForm((prev) => ({ ...prev, recorrenciaTipo: value as RecorrenciaContaPagar }))}
                    >
                      <SelectTrigger className="w-full border-border bg-secondary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-border bg-card">
                        <SelectItem value="MENSAL">Mensal</SelectItem>
                        <SelectItem value="INTERVALO_DIAS">Intervalo de dias</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Data inicial</label>
                    <Input
                      type="date"
                      value={form.recorrenciaDataInicial}
                      onChange={(event) => setForm((prev) => ({ ...prev, recorrenciaDataInicial: event.target.value }))}
                      className="border-border bg-secondary"
                    />
                  </div>
                  {form.recorrenciaTipo === "MENSAL" ? (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dia do mês</label>
                      <Input
                        value={form.recorrenciaDiaDoMes}
                        onChange={(event) => setForm((prev) => ({ ...prev, recorrenciaDiaDoMes: event.target.value }))}
                        placeholder="1 a 31"
                        className="border-border bg-secondary"
                      />
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Intervalo em dias</label>
                      <Input
                        value={form.recorrenciaIntervaloDias}
                        onChange={(event) => setForm((prev) => ({ ...prev, recorrenciaIntervaloDias: event.target.value }))}
                        placeholder="Ex.: 30"
                        className="border-border bg-secondary"
                      />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Término</label>
                    <Select
                      value={form.recorrenciaTermino}
                      onValueChange={(value) => setForm((prev) => ({ ...prev, recorrenciaTermino: value as TerminoRecorrenciaContaPagar }))}
                    >
                      <SelectTrigger className="w-full border-border bg-secondary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-border bg-card">
                        {RECORRENCIA_TERMINO_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {form.recorrenciaTermino === "EM_DATA" && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Data fim</label>
                      <Input
                        type="date"
                        value={form.recorrenciaDataFim}
                        onChange={(event) => setForm((prev) => ({ ...prev, recorrenciaDataFim: event.target.value }))}
                        className="border-border bg-secondary"
                      />
                    </div>
                  )}
                  {form.recorrenciaTermino === "APOS_OCORRENCIAS" && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Número de ocorrências</label>
                      <Input
                        value={form.recorrenciaNumeroOcorrencias}
                        onChange={(event) => setForm((prev) => ({ ...prev, recorrenciaNumeroOcorrencias: event.target.value }))}
                        placeholder="Ex.: 12"
                        className="border-border bg-secondary"
                      />
                    </div>
                  )}
                  <label className="inline-flex items-center gap-2 text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={form.criarLancamentoInicialAgora}
                      onChange={(event) => setForm((prev) => ({ ...prev, criarLancamentoInicialAgora: event.target.checked }))}
                    />
                    Criar lançamento inicial agora
                  </label>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="gap-3 border-gym-accent/25 bg-gym-accent/5 py-4">
            <CardHeader className="px-4 pb-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="size-4 text-gym-accent" />
                Dica de operação
              </CardTitle>
              <CardDescription>
                Preencha primeiro tipo, valor e vencimento. Depois adicione os detalhes extras apenas se necessário.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pagamento imediato</CardTitle>
              <CardDescription>Marque para registrar a conta já como paga.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <label className="inline-flex items-center gap-2 text-muted-foreground">
                <input
                  type="checkbox"
                  checked={marcarComoPaga}
                  onChange={(event) => {
                    const checked = event.target.checked;
                    setMarcarComoPaga(checked);
                    setPagamentoInicial((prev) => ({
                      ...prev,
                      dataPagamento: checked ? prev.dataPagamento || todayISO() : prev.dataPagamento,
                      valorPago: checked ? prev.valorPago || valorContaLiquida.toFixed(2) : prev.valorPago,
                    }));
                  }}
                />
                Marcar essa conta como paga no cadastro
              </label>

              {marcarComoPaga && (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Data de pagamento</label>
                    <Input
                      type="date"
                      value={pagamentoInicial.dataPagamento}
                      onChange={(event) =>
                        setPagamentoInicial((prev) => ({ ...prev, dataPagamento: event.target.value }))
                      }
                      className="border-border bg-secondary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Forma de pagamento</label>
                    <Select
                      value={pagamentoInicial.formaPagamento}
                      onValueChange={(value) =>
                        setPagamentoInicial((prev) => ({
                          ...prev,
                          formaPagamento: value as TipoFormaPagamento,
                        }))
                      }
                    >
                      <SelectTrigger className="w-full border-border bg-secondary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-border bg-card">
                        {Object.entries(FORMA_PAGAMENTO_LABEL).map(([valor, titulo]) => (
                          <SelectItem key={valor} value={valor}>
                            {titulo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Valor pago</label>
                    <Input
                      value={pagamentoInicial.valorPago}
                      onChange={(event) =>
                        setPagamentoInicial((prev) => ({ ...prev, valorPago: event.target.value }))
                      }
                      placeholder={`Sugerido: ${valorContaLiquida.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}`}
                      className="border-border bg-secondary"
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Observações</label>
                    <Input
                      value={pagamentoInicial.observacoes}
                      onChange={(event) =>
                        setPagamentoInicial((prev) => ({ ...prev, observacoes: event.target.value }))
                      }
                      placeholder="Opcional"
                      className="border-border bg-secondary"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={saving || loading}>
              <Save className="size-4" />
              {saving ? "Salvando..." : "Salvar conta"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-border"
              onClick={() => {
                const month = monthRangeFromNow();
                setForm((prev) => ({
                  ...prev,
                  fornecedor: "",
                  documentoFornecedor: "",
                  descricao: "",
                  centroCusto: "",
                  competencia: month.start,
                  dataEmissao: todayISO(),
                  dataVencimento: month.end,
                  valorOriginal: "",
                  desconto: "0",
                  jurosMulta: "0",
                  observacoes: "",
                }));
                setMarcarComoPaga(false);
                setPagamentoInicial({
                  dataPagamento: todayISO(),
                  formaPagamento: "PIX",
                  valorPago: "",
                  observacoes: "",
                });
                setError(null);
                setSuccess(null);
              }}
            >
              Limpar
            </Button>
          </div>
        </div>
      </form>

      <Card className="gap-3 border-border/80 py-4">
        <CardHeader className="px-4 pb-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarClock className="size-4" />
            Fluxo recomendado
          </CardTitle>
          <CardDescription>
            1) Cadastre a conta. 2) Volte para o protótipo de contas a pagar. 3) Use a fila prioritária para efetuar
            a baixa no momento certo.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
