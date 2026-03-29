"use client";

import { useMemo, useState } from "react";
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
  NovaContaFormState,
  NovaContaPagarModalProps,
  PagamentoNoCadastroState,
} from "./conta-pagar-types";
import { ContaPagarFormFields } from "./conta-pagar-form-fields";
import { ContaPagarRecorrencia } from "./conta-pagar-recorrencia";
import { ContaPagarPagamentoInline } from "./conta-pagar-pagamento-inline";

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

        <ContaPagarFormFields
          form={form}
          setForm={setForm}
          tiposAtivos={tiposAtivos}
          tiposConta={tiposConta}
          applyTipoConta={applyTipoConta}
        />

        <ContaPagarRecorrencia
          form={form}
          setForm={setForm}
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
