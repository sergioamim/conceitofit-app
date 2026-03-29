"use client";

import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import {
  contaPagarFormSchema,
  type ContaPagarFormValues,
} from "./nova-conta-pagar-modal/conta-pagar-schema";

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

export type EdicaoContaFormState = ContaPagarFormValues;

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
  const { register, control, handleSubmit, reset, setValue, watch } = useForm<ContaPagarFormValues>({
    resolver: zodResolver(contaPagarFormSchema),
    defaultValues: initialForm,
  });

  const formValues = useWatch({ control }) as ContaPagarFormValues;

  useEffect(() => {
    reset(initialForm);
  }, [initialForm, reset]);

  function applyTipoContaEdicao(tipoId: string) {
    const tipo = tiposConta.find((item) => item.id === tipoId);
    setValue("tipoContaId", tipoId);
    if (tipo?.categoriaOperacional) setValue("categoria", tipo.categoriaOperacional);
    if (tipo?.grupoDre) setValue("grupoDre", tipo.grupoDre);
    if (!formValues.centroCusto && tipo?.centroCustoPadrao) {
      setValue("centroCusto", tipo.centroCustoPadrao);
    }
  }

  async function onFormSubmit(values: ContaPagarFormValues) {
    if (!contaEditandoId) return;
    await onSubmit(contaEditandoId, values);
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

        <form onSubmit={handleSubmit(onFormSubmit)}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Tipo de conta
              </label>
              <Controller
                control={control}
                name="tipoContaId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={applyTipoContaEdicao}>
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
                )}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Fornecedor
              </label>
              <Input
                {...register("fornecedor")}
                placeholder="Nome do fornecedor *"
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Documento do fornecedor
              </label>
              <Input
                {...register("documentoFornecedor")}
                placeholder="CPF/CNPJ"
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Descrição
              </label>
              <Input
                {...register("descricao")}
                placeholder="Descrição da conta *"
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Categoria
              </label>
              <Input value={CATEGORIA_LABEL[formValues.categoria ?? "OUTROS"]} readOnly className="bg-secondary border-border" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Grupo DRE
              </label>
              <Input value={GRUPO_DRE_LABEL[formValues.grupoDre ?? "DESPESA_OPERACIONAL"]} readOnly className="bg-secondary border-border" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Centro de custo
              </label>
              <Input
                {...register("centroCusto")}
                placeholder="Opcional"
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Regime
              </label>
              <Controller
                control={control}
                name="regime"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="FIXA">Fixa</SelectItem>
                      <SelectItem value="AVULSA">Avulsa</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Competência
              </label>
              <Input type="date" {...register("competencia")} className="bg-secondary border-border" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Data de emissão
              </label>
              <Input type="date" {...register("dataEmissao")} className="bg-secondary border-border" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Data de vencimento
              </label>
              <Input type="date" {...register("dataVencimento")} className="bg-secondary border-border" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Valor original
              </label>
              <Input type="number" min={0} step="0.01" {...register("valorOriginal")} className="bg-secondary border-border" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Desconto
              </label>
              <Input type="number" min={0} step="0.01" {...register("desconto")} className="bg-secondary border-border" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Juros/Multa
              </label>
              <Input type="number" min={0} step="0.01" {...register("jurosMulta")} className="bg-secondary border-border" />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Observações
              </label>
              <textarea
                {...register("observacoes")}
                className="focus-ring-brand h-24 w-full resize-y rounded-md border border-border bg-secondary p-2 text-sm outline-none"
              />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-secondary/30 p-4">
            <label className="inline-flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={formValues.recorrente}
                onChange={(e) => {
                  setValue("recorrente", e.target.checked);
                  if (e.target.checked) {
                    setValue("regime", "FIXA");
                    if (!watch("recorrenciaDiaDoMes")) {
                      setValue("recorrenciaDiaDoMes", (formValues.dataVencimento ?? "").split("-")[2] ?? "");
                    }
                    if (!watch("recorrenciaDataInicial")) {
                      setValue("recorrenciaDataInicial", formValues.dataVencimento ?? "");
                    }
                  }
                }}
              />
              Conta recorrente
            </label>

            {formValues.recorrente && (
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Tipo de recorrência
                  </label>
                  <Controller
                    control={control}
                    name="recorrenciaTipo"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full bg-secondary border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          <SelectItem value="MENSAL">Mensal</SelectItem>
                          <SelectItem value="INTERVALO_DIAS">A cada X dias</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                {formValues.recorrenciaTipo === "INTERVALO_DIAS" && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      A cada X dias
                    </label>
                    <Input type="number" min={1} {...register("recorrenciaIntervaloDias")} className="bg-secondary border-border" />
                  </div>
                )}

                {formValues.recorrenciaTipo === "MENSAL" && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Dia do mês
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={31}
                      {...register("recorrenciaDiaDoMes")}
                      className="bg-secondary border-border"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Data inicial (âncora)
                  </label>
                  <Input type="date" {...register("recorrenciaDataInicial")} className="bg-secondary border-border" />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Término da recorrência
                  </label>
                  <Controller
                    control={control}
                    name="recorrenciaTermino"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full bg-secondary border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          <SelectItem value="SEM_FIM">Sem fim</SelectItem>
                          <SelectItem value="EM_DATA">Em data</SelectItem>
                          <SelectItem value="APOS_OCORRENCIAS">Após N ocorrências</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                {formValues.recorrenciaTermino === "EM_DATA" && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Data fim
                    </label>
                    <Input type="date" {...register("recorrenciaDataFim")} className="bg-secondary border-border" />
                  </div>
                )}

                {formValues.recorrenciaTermino === "APOS_OCORRENCIAS" && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Qtd. ocorrências
                    </label>
                    <Input type="number" min={1} {...register("recorrenciaNumeroOcorrencias")} className="bg-secondary border-border" />
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" className="border-border" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            <Button type="submit">Salvar alterações</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
