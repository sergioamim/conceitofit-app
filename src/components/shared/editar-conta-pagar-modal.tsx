"use client";

import { useState } from "react";
import type {
  CategoriaContaPagar,
  ContaPagar,
  GrupoDre,
  RegraRecorrenciaContaPagar,
  TipoContaPagar,
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

export type EdicaoContaFormState = {
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

type EditarContaPagarModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tiposAtivos: TipoContaPagar[];
  tiposConta: TipoContaPagar[];
  contaEditandoId: string | null;
  initialForm: EdicaoContaFormState;
  onSubmit: (id: string, form: EdicaoContaFormState) => Promise<void>;
};

export function buildEdicaoFormFromConta(
  conta: ContaPagar,
  regrasRecorrencia: RegraRecorrenciaContaPagar[]
): EdicaoContaFormState {
  const regra = conta.regraRecorrenciaId
    ? regrasRecorrencia.find((r) => r.id === conta.regraRecorrenciaId)
    : undefined;
  return {
    tipoContaId: conta.tipoContaId ?? "",
    fornecedor: conta.fornecedor,
    documentoFornecedor: conta.documentoFornecedor ?? "",
    descricao: conta.descricao,
    categoria: conta.categoria,
    grupoDre: conta.grupoDre ?? "DESPESA_OPERACIONAL",
    centroCusto: conta.centroCusto ?? "",
    regime: conta.regime,
    competencia: conta.competencia,
    dataEmissao: conta.dataEmissao ?? "",
    dataVencimento: conta.dataVencimento,
    valorOriginal: String(conta.valorOriginal ?? 0),
    desconto: String(conta.desconto ?? 0),
    jurosMulta: String(conta.jurosMulta ?? 0),
    observacoes: conta.observacoes ?? "",
    recorrente: !!regra,
    recorrenciaTipo: regra?.recorrencia ?? "MENSAL",
    recorrenciaIntervaloDias: String(regra?.intervaloDias ?? 30),
    recorrenciaDiaDoMes: String(regra?.diaDoMes ?? conta.dataVencimento.split("-")[2] ?? ""),
    recorrenciaDataInicial: regra?.dataInicial ?? conta.dataVencimento,
    recorrenciaTermino: regra?.termino ?? "SEM_FIM",
    recorrenciaDataFim: regra?.dataFim ?? "",
    recorrenciaNumeroOcorrencias: String(regra?.numeroOcorrencias ?? 12),
    criarLancamentoInicialAgora: false,
  };
}

export function EditarContaPagarModal({
  open,
  onOpenChange,
  tiposAtivos,
  tiposConta,
  contaEditandoId,
  initialForm,
  onSubmit,
}: EditarContaPagarModalProps) {
  const [form, setForm] = useState(initialForm);

  // Sync form when initialForm changes (new account selected)
  const [prevInitial, setPrevInitial] = useState(initialForm);
  if (initialForm !== prevInitial) {
    setPrevInitial(initialForm);
    setForm(initialForm);
  }

  function applyTipoContaEdicao(tipoId: string) {
    const tipo = tiposConta.find((item) => item.id === tipoId);
    setForm((prev) => ({
      ...prev,
      tipoContaId: tipoId,
      categoria: tipo?.categoriaOperacional ?? prev.categoria,
      grupoDre: tipo?.grupoDre ?? prev.grupoDre,
      centroCusto: prev.centroCusto || tipo?.centroCustoPadrao || "",
    }));
  }

  async function handleSubmit() {
    if (!contaEditandoId) return;
    await onSubmit(contaEditandoId, form);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto bg-card border-border sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">Editar conta a pagar</DialogTitle>
          <DialogDescription>
            Atualize os dados da conta selecionada.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Tipo de conta
            </label>
            <Select value={form.tipoContaId} onValueChange={applyTipoContaEdicao}>
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
              Categoria
            </label>
            <Input value={CATEGORIA_LABEL[form.categoria]} readOnly className="bg-secondary border-border" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Grupo DRE
            </label>
            <Input value={GRUPO_DRE_LABEL[form.grupoDre]} readOnly className="bg-secondary border-border" />
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
            <Select value={form.regime} onValueChange={(value) => setForm((v) => ({ ...v, regime: value as ContaPagar["regime"] }))}>
              <SelectTrigger className="w-full bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="FIXA">Fixa</SelectItem>
                <SelectItem value="AVULSA">Avulsa</SelectItem>
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
              onChange={(e) => setForm((v) => ({ ...v, dataVencimento: e.target.value }))}
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
              Juros/Multa
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
                    v.recorrenciaDiaDoMes || (v.dataVencimento.split("-")[2] ?? ""),
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
                    value={form.recorrenciaDiaDoMes || (form.dataVencimento.split("-")[2] ?? "")}
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
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" className="border-border" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button onClick={handleSubmit}>Salvar alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
