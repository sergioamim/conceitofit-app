"use client";

import { useMemo, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@/lib/forms/zod-resolver";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  NovaContaPagarModalProps,
  PagamentoNoCadastroState,
} from "./conta-pagar-types";
import { ContaPagarFormFields } from "./conta-pagar-form-fields";
import { ContaPagarRecorrencia } from "./conta-pagar-recorrencia";
import { ContaPagarPagamentoInline } from "./conta-pagar-pagamento-inline";
import { contaPagarFormSchema, type ContaPagarFormValues } from "./conta-pagar-schema";

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
  const makeDefault = (): ContaPagarFormValues => ({
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

  const formMethods = useForm<ContaPagarFormValues>({
    resolver: zodResolver(contaPagarFormSchema),
    mode: "onTouched",
    defaultValues: makeDefault(),
  });

  const { handleSubmit, reset, setValue, control, watch } = formMethods;

  const canSave =
    Boolean(watch("tipoContaId")) &&
    Boolean(watch("fornecedor")?.trim()) &&
    Boolean(watch("descricao")?.trim()) &&
    Boolean(watch("dataVencimento")) &&
    Boolean(watch("valorOriginal")?.trim());
  const formValues = useWatch({ control }) as ContaPagarFormValues;

  const [registrarComoPaga, setRegistrarComoPaga] = useState(false);
  const [pagamento, setPagamento] = useState(makePagamentoDefault);

  function resetAll() {
    reset(makeDefault());
    setRegistrarComoPaga(false);
    setPagamento(makePagamentoDefault());
  }

  function applyTipoConta(tipoId: string) {
    const tipo = tiposConta.find((item) => item.id === tipoId);
    setValue("tipoContaId", tipoId);
    if (tipo?.categoriaOperacional) setValue("categoria", tipo.categoriaOperacional);
    if (tipo?.grupoDre) setValue("grupoDre", tipo.grupoDre);
    if (!formValues.centroCusto && tipo?.centroCustoPadrao) {
      setValue("centroCusto", tipo.centroCustoPadrao);
    }
  }

  const diaVencimentoSugestao = Number((formValues.dataVencimento ?? "").split("-")[2] || 1);
  const valorContaLiquida = useMemo(() => {
    return Math.max(
      0,
      Number(formValues.valorOriginal || 0) - Number(formValues.desconto || 0) + Number(formValues.jurosMulta || 0)
    );
  }, [formValues.desconto, formValues.jurosMulta, formValues.valorOriginal]);

  function handleClose() {
    resetAll();
    onOpenChange(false);
  }

  async function onFormSubmit(values: ContaPagarFormValues) {
    await onSubmit({ form: values, registrarComoPaga, pagamento });
    resetAll();
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

        <FormProvider {...formMethods}>
          <form onSubmit={handleSubmit(onFormSubmit)}>
            <ContaPagarFormFields
              tiposAtivos={tiposAtivos}
              tiposConta={tiposConta}
              applyTipoConta={applyTipoConta}
            />

            <ContaPagarRecorrencia
              diaVencimentoSugestao={diaVencimentoSugestao}
            />

            <ContaPagarPagamentoInline
              registrarComoPaga={registrarComoPaga}
              setRegistrarComoPaga={setRegistrarComoPaga}
              pagamento={pagamento}
              setPagamento={setPagamento}
              formasPagamentoUnicas={formasPagamentoUnicas}
              valorContaLiquida={valorContaLiquida}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="border-border"
                onClick={handleClose}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={!canSave}>Salvar conta</Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
