"use client";

import { getBusinessTodayIso } from "@/lib/business-date";
import { NovaContaPagarModal } from "@/components/shared/nova-conta-pagar-modal";
import { EditarContaPagarModal } from "@/components/shared/editar-conta-pagar-modal";
import { PagarContaModal } from "@/components/shared/pagar-conta-modal";
import { ContasPagarWorkspace } from "../hooks/use-contas-pagar-workspace";

interface ContasPagarModalsProps {
  workspace: ContasPagarWorkspace;
}

export function ContasPagarModals({ workspace }: ContasPagarModalsProps) {
  const {
    openNovaConta,
    setOpenNovaConta,
    tiposAtivos,
    tiposConta,
    formasPagamentoUnicas,
    range,
    handleCriarConta,
    openPagarConta,
    setOpenPagarConta,
    selectedConta,
    formasPagamento,
    handlePagarConta,
    edicaoContaForm,
    openEditarConta,
    setOpenEditarConta,
    contaEditandoId,
    handleSalvarEdicaoConta,
  } = workspace;

  return (
    <>
      <NovaContaPagarModal
        open={openNovaConta}
        onOpenChange={setOpenNovaConta}
        tiposAtivos={tiposAtivos}
        tiposConta={tiposConta}
        formasPagamentoUnicas={formasPagamentoUnicas}
        defaultCompetencia={range.start}
        defaultDataVencimento={range.end}
        todayISO={getBusinessTodayIso()}
        onSubmit={handleCriarConta}
      />
      <PagarContaModal
        open={openPagarConta}
        onOpenChange={setOpenPagarConta}
        conta={selectedConta}
        formasPagamento={formasPagamento}
        todayISO={getBusinessTodayIso()}
        onSubmit={handlePagarConta}
      />

      {edicaoContaForm && (
        <EditarContaPagarModal
          open={openEditarConta}
          onOpenChange={setOpenEditarConta}
          tiposAtivos={tiposAtivos}
          tiposConta={tiposConta}
          contaEditandoId={contaEditandoId}
          initialForm={edicaoContaForm}
          onSubmit={handleSalvarEdicaoConta}
        />
      )}
    </>
  );
}
