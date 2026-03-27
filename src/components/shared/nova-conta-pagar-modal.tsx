"use client";

import { useMemo, useState } from "react";
import type {
  CategoriaContaPagar,
  ContaPagar,
  FormaPagamento,
  GrupoDre,
  TipoContaPagar,
  TipoFormaPagamento,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATEGORIA_LABEL: Record<CategoriaContaPagar, string> = {
  FOLHA: "Folha",
  ALUGUEL: "Aluguel",
  UTILIDADES: "Utilidades",
  IMPOSTOS: "Impostos",
  MARKETING: "Marketing",
  MANUTENCAO: "Manutenção",
  FORNECEDORES: "Fornecedores",
  OUTROS: "Outros",
};

const GRUPO_DRE_LABEL: Record<GrupoDre, string> = {
  CUSTO_VARIAVEL: "Custo variável",
  DESPESA_OPERACIONAL: "Despesa operacional",
  DESPESA_FINANCEIRA: "Despesa financeira",
  IMPOSTOS: "Impostos",
};

const FORMA_PAGAMENTO_LABEL: Record<TipoFormaPagamento, string> = {
  DINHEIRO: "Dinheiro",
  PIX: "PIX",
  CARTAO_CREDITO: "Cartão de crédito",
  CARTAO_DEBITO: "Cartão de débito",
  BOLETO: "Boleto",
  RECORRENTE: "Recorrente",
};

type NovaContaFormState = {
  tipoContaId: string;
  fornecedor: string;
  documentoFornecedor: string;
  descricao: string;
  categoria: CategoriaContaPagar;
  grupoDre: GrupoDre;
  centroCusto: string;
  regime: ContaPagar["regime"];
  competencia: string;
  dataEmissao: string;
  dataVencimento: string;
  valorOriginal: string;
  desconto: string;
  jurosMulta: string;
  observacoes: string;
  recorrente: boolean;
  recorrenciaTipo: "MENSAL" | "INTERVALO_DIAS";
  recorrenciaIntervaloDias: string;
  recorrenciaDiaDoMes: string;
  recorrenciaDataInicial: string;
  recorrenciaTermino: "SEM_FIM" | "EM_DATA" | "APOS_OCORRENCIAS";
  recorrenciaDataFim: string;
  recorrenciaNumeroOcorrencias: string;
  criarLancamentoInicialAgora: boolean;
};

type PagamentoNoCadastroState = {
  dataPagamento: string;
  formaPagamento: TipoFormaPagamento;
  valorPago: string;
  observacoes: string;
};

export type NovaContaPagarSubmitData = {
  form: NovaContaFormState;
  registrarComoPaga: boolean;
  pagamento: PagamentoNoCadastroState;
};

type NovaContaPagarModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tiposAtivos: TipoContaPagar[];
  tiposConta: TipoContaPagar[];
  formasPagamentoUnicas: FormaPagamento[];
  defaultCompetencia: string;
  defaultDataVencimento: string;
  todayISO: string;
  onSubmit: (data: NovaContaPagarSubmitData) => Promise<void>;
};

function formatBRL(value: number) {
  return Number(value ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function NovaContaPagarModal({
  open,
  onOpenChange,
  tiposAtivos,
  tiposConta,
  formasPagamentoUnicas,
  defaultCompetencia,
  defaultDataVencimento,
  todayISO,
  onSubmit,
}: NovaContaPagarModalProps) {
  const makeDefault = (): NovaContaFormState => ({
    tipoContaId: "",
    fornecedor: "",
    documentoFornecedor: "",
    descricao: "",
    categoria: "OUTROS",
    grupoDre: "DESPESA_OPERACIONAL",
    centroCusto: "",
    regime: "AVULSA",
    competencia: defaultCompetencia,
    dataEmissao: "",
    dataVencimento: defaultDataVencimento,
    valorOriginal: "",
    desconto: "0",
    jurosMulta: "0",
    observacoes: "",
    recorrente: false,
    recorrenciaTipo: "MENSAL",
    recorrenciaIntervaloDias: "30",
    recorrenciaDiaDoMes: "",
    recorrenciaDataInicial: defaultDataVencimento,
    recorrenciaTermino: "SEM_FIM",
    recorrenciaDataFim: "",
    recorrenciaNumeroOcorrencias: "12",
    criarLancamentoInicialAgora: true,
  });

  const makePagamentoDefault = (): PagamentoNoCadastroState => ({
    dataPagamento: todayISO,
    formaPagamento: "PIX",
    valorPago: "",
    observacoes: "",
  });

  const [form, setForm] = useState(makeDefault);
  const [registrarComoPaga, setRegistrarComoPaga] = useState(false);
  const [pagamento, setPagamento] = useState(makePagamentoDefault);

  function reset() {
    setForm(makeDefault());
    setRegistrarComoPaga(false);
    setPagamento(makePagamentoDefault());
  }

  function applyTipoConta(tipoId: string) {
    const tipo = tiposConta.find((item) => item.id === tipoId);
    setForm((prev) => ({
      ...prev,
      tipoContaId: tipoId,
      categoria: tipo?.categoriaOperacional ?? prev.categoria,
      grupoDre: tipo?.grupoDre ?? prev.grupoDre,
      centroCusto: prev.centroCusto || tipo?.centroCustoPadrao || "",
    }));
  }

  const diaVencimentoSugestao = Number(form.dataVencimento.split("-")[2] || 1);
  const valorContaLiquida = useMemo(() => {
    return Math.max(
      0,
      Number(form.valorOriginal || 0) - Number(form.desconto || 0) + Number(form.jurosMulta || 0)
    );
  }, [form.desconto, form.jurosMulta, form.valorOriginal]);

  function handleClose() {
    reset();
    onOpenChange(false);
  }

  async function handleSubmit() {
    await onSubmit({ form, registrarComoPaga, pagamento });
    reset();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          handleClose();
          return;
        }
        onOpenChange(true);
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto bg-card border-border sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">Nova conta a pagar</DialogTitle>
          <DialogDescription>
            Cadastre compromissos financeiros da unidade com classificação obrigatória para DRE.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Tipo de conta
            </label>
            <Select value={form.tipoContaId} onValueChange={applyTipoConta}>
              <SelectTrigger className="w-full bg-secondary border-border">
                <SelectValue placeholder="Selecione o tipo *" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {tiposAtivos.map((tipo) => (
                  <SelectItem key={tipo.id} value={tipo.id}>
                    {tipo.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Fornecedor
            </label>
            <Input
              value={form.fornecedor}
              onChange={(e) => setForm((v) => ({ ...v, fornecedor: e.target.value }))}
              placeholder="Nome do fornecedor *"
              className="bg-secondary border-border"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Documento do fornecedor
            </label>
            <Input
              value={form.documentoFornecedor}
              onChange={(e) => setForm((v) => ({ ...v, documentoFornecedor: e.target.value }))}
              placeholder="CPF/CNPJ"
              className="bg-secondary border-border"
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Descrição
            </label>
            <Input
              value={form.descricao}
              onChange={(e) => setForm((v) => ({ ...v, descricao: e.target.value }))}
              placeholder="Descrição da conta *"
              className="bg-secondary border-border"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Categoria operacional (herdada do tipo)
            </label>
            <Input
              readOnly
              value={CATEGORIA_LABEL[form.categoria]}
              className="bg-secondary border-border text-muted-foreground"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Grupo DRE (somente leitura)
            </label>
            <Input
              readOnly
              value={GRUPO_DRE_LABEL[form.grupoDre]}
              className="bg-secondary border-border text-muted-foreground"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Centro de custo
            </label>
            <Input
              value={form.centroCusto}
              onChange={(e) => setForm((v) => ({ ...v, centroCusto: e.target.value }))}
              placeholder="Opcional"
              className="bg-secondary border-border"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Regime
            </label>
            <Select
              value={form.regime}
              onValueChange={(value) =>
                setForm((f) => ({ ...f, regime: value as ContaPagar["regime"] }))
              }
            >
              <SelectTrigger className="w-full bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="AVULSA">Avulsa</SelectItem>
                <SelectItem value="FIXA">Fixa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Competência
            </label>
            <Input
              type="date"
              value={form.competencia}
              onChange={(e) => setForm((v) => ({ ...v, competencia: e.target.value }))}
              className="bg-secondary border-border"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Data de emissão
            </label>
            <Input
              type="date"
              value={form.dataEmissao}
              onChange={(e) => setForm((v) => ({ ...v, dataEmissao: e.target.value }))}
              className="bg-secondary border-border"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Data de vencimento
            </label>
            <Input
              type="date"
              value={form.dataVencimento}
              onChange={(e) =>
                setForm((v) => ({
                  ...v,
                  dataVencimento: e.target.value,
                  recorrenciaDiaDoMes: v.recorrenciaDiaDoMes || e.target.value.split("-")[2] || "",
                }))
              }
              className="bg-secondary border-border"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Valor original
            </label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={form.valorOriginal}
              onChange={(e) => setForm((v) => ({ ...v, valorOriginal: e.target.value }))}
              className="bg-secondary border-border"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Desconto
            </label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={form.desconto}
              onChange={(e) => setForm((v) => ({ ...v, desconto: e.target.value }))}
              className="bg-secondary border-border"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Juros / Multa
            </label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={form.jurosMulta}
              onChange={(e) => setForm((v) => ({ ...v, jurosMulta: e.target.value }))}
              className="bg-secondary border-border"
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Observações
            </label>
            <textarea
              value={form.observacoes}
              onChange={(e) => setForm((v) => ({ ...v, observacoes: e.target.value }))}
              className="focus-ring-brand h-24 w-full resize-y rounded-md border border-border bg-secondary p-2 text-sm outline-none"
            />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-secondary/30 p-4">
          <label className="inline-flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={form.recorrente}
              onChange={(e) =>
                setForm((v) => ({
                  ...v,
                  recorrente: e.target.checked,
                  regime: e.target.checked ? "FIXA" : v.regime,
                  recorrenciaDiaDoMes:
                    v.recorrenciaDiaDoMes || String(diaVencimentoSugestao),
                  recorrenciaDataInicial: v.recorrenciaDataInicial || v.dataVencimento,
                }))
              }
            />
            Conta recorrente
          </label>

          {form.recorrente && (
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Tipo de recorrência
                </label>
                <Select
                  value={form.recorrenciaTipo}
                  onValueChange={(value) =>
                    setForm((v) => ({
                      ...v,
                      recorrenciaTipo: value as "MENSAL" | "INTERVALO_DIAS",
                    }))
                  }
                >
                  <SelectTrigger className="w-full bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="MENSAL">Mensal</SelectItem>
                    <SelectItem value="INTERVALO_DIAS">A cada X dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {form.recorrenciaTipo === "INTERVALO_DIAS" && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    A cada X dias
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={form.recorrenciaIntervaloDias}
                    onChange={(e) =>
                      setForm((v) => ({
                        ...v,
                        recorrenciaIntervaloDias: e.target.value,
                      }))
                    }
                    className="bg-secondary border-border"
                  />
                </div>
              )}

              {form.recorrenciaTipo === "MENSAL" && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Dia do mês
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={31}
                    value={form.recorrenciaDiaDoMes || String(diaVencimentoSugestao)}
                    onChange={(e) =>
                      setForm((v) => ({
                        ...v,
                        recorrenciaDiaDoMes: e.target.value,
                      }))
                    }
                    className="bg-secondary border-border"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Data inicial (âncora)
                </label>
                <Input
                  type="date"
                  value={form.recorrenciaDataInicial}
                  onChange={(e) =>
                    setForm((v) => ({
                      ...v,
                      recorrenciaDataInicial: e.target.value,
                    }))
                  }
                  className="bg-secondary border-border"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Término da recorrência
                </label>
                <Select
                  value={form.recorrenciaTermino}
                  onValueChange={(value) =>
                    setForm((v) => ({
                      ...v,
                      recorrenciaTermino: value as "SEM_FIM" | "EM_DATA" | "APOS_OCORRENCIAS",
                    }))
                  }
                >
                  <SelectTrigger className="w-full bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="SEM_FIM">Sem fim</SelectItem>
                    <SelectItem value="EM_DATA">Em data</SelectItem>
                    <SelectItem value="APOS_OCORRENCIAS">Após N ocorrências</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {form.recorrenciaTermino === "EM_DATA" && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Data fim
                  </label>
                  <Input
                    type="date"
                    value={form.recorrenciaDataFim}
                    onChange={(e) =>
                      setForm((v) => ({
                        ...v,
                        recorrenciaDataFim: e.target.value,
                      }))
                    }
                    className="bg-secondary border-border"
                  />
                </div>
              )}

              {form.recorrenciaTermino === "APOS_OCORRENCIAS" && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Qtd. ocorrências
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={form.recorrenciaNumeroOcorrencias}
                    onChange={(e) =>
                      setForm((v) => ({
                        ...v,
                        recorrenciaNumeroOcorrencias: e.target.value,
                      }))
                    }
                    className="bg-secondary border-border"
                  />
                </div>
              )}

              <label className="inline-flex items-center gap-2 text-sm md:col-span-2">
                <input
                  type="checkbox"
                  checked={form.criarLancamentoInicialAgora}
                  onChange={(e) =>
                    setForm((v) => ({
                      ...v,
                      criarLancamentoInicialAgora: e.target.checked,
                    }))
                  }
                />
                Criar lançamento inicial agora
              </label>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border bg-secondary/30 p-4">
          <label className="inline-flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={registrarComoPaga}
              onChange={(e) => setRegistrarComoPaga(e.target.checked)}
            />
            Registrar como paga no cadastro
          </label>

          {registrarComoPaga && (
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Data de pagamento
                </label>
                <Input
                  type="date"
                  value={pagamento.dataPagamento}
                  onChange={(e) =>
                    setPagamento((p) => ({
                      ...p,
                      dataPagamento: e.target.value,
                    }))
                  }
                  className="bg-secondary border-border"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Forma de pagamento
                </label>
                <Select
                  value={pagamento.formaPagamento}
                  onValueChange={(value) =>
                    setPagamento((p) => ({ ...p, formaPagamento: value as TipoFormaPagamento }))
                  }
                >
                  <SelectTrigger className="w-full bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {formasPagamentoUnicas.map((forma) => (
                      <SelectItem key={forma.id} value={forma.tipo}>
                        {FORMA_PAGAMENTO_LABEL[forma.tipo] ?? forma.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Valor pago
                </label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder={`Padrão: ${formatBRL(valorContaLiquida)}`}
                  value={pagamento.valorPago}
                  onChange={(e) =>
                    setPagamento((p) => ({ ...p, valorPago: e.target.value }))
                  }
                  className="bg-secondary border-border"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Observações
                </label>
                <textarea
                  value={pagamento.observacoes}
                  onChange={(e) =>
                    setPagamento((p) => ({ ...p, observacoes: e.target.value }))
                  }
                  className="focus-ring-brand h-24 w-full resize-y rounded-md border border-border bg-secondary p-2 text-sm outline-none"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            className="border-border"
            onClick={handleClose}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>Salvar conta</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
