"use client";

import { useState } from "react";
import type { ContaPagar } from "@/lib/types";
import type { RegraRecorrenciaContaPagar } from "@/lib/types";
import { buildEdicaoFormFromConta, type EdicaoContaFormState } from "@/components/shared/editar-conta-pagar-modal";

export function useContasPagarModals(regrasRecorrencia: RegraRecorrenciaContaPagar[]) {
  const [openNovaConta, setOpenNovaConta] = useState(false);
  const [openEditarConta, setOpenEditarConta] = useState(false);
  const [openPagarConta, setOpenPagarConta] = useState(false);
  const [selectedConta, setSelectedConta] = useState<ContaPagar | null>(null);
  const [contaEditandoId, setContaEditandoId] = useState<string | null>(null);
  const [edicaoContaForm, setEdicaoContaForm] = useState<EdicaoContaFormState | null>(null);

  function abrirModalEdicao(conta: ContaPagar) {
    setContaEditandoId(conta.id);
    setEdicaoContaForm(buildEdicaoFormFromConta(conta, regrasRecorrencia));
    setOpenEditarConta(true);
  }

  return {
    openNovaConta, setOpenNovaConta,
    openEditarConta, setOpenEditarConta,
    openPagarConta, setOpenPagarConta,
    selectedConta, setSelectedConta,
    contaEditandoId, setContaEditandoId,
    edicaoContaForm, setEdicaoContaForm,
    abrirModalEdicao,
  };
}
