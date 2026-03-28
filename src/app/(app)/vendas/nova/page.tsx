"use client";

import { Suspense } from "react";
import nextDynamic from "next/dynamic";
import { useVendaWorkspace } from "./hooks/use-venda-workspace";
import { SaleHeader } from "./components/sale-header";
import { SaleTypeSelector } from "./components/sale-type-selector";
import { ClientAndItemSelector } from "./components/client-and-item-selector";
import { PlanoDetails } from "./components/plano-details";
import { CartItems } from "./components/cart-items";
import { SaleSummary } from "./components/sale-summary";
import { ScannerDialog } from "./components/scanner-dialog";

const SaleReceiptModal = nextDynamic(
  () => import("@/components/shared/sale-receipt-modal").then((mod) => mod.SaleReceiptModal),
  { ssr: false }
);

function NovaVendaPageContent() {
  const workspace = useVendaWorkspace();
  const {
    receiptOpen,
    setReceiptOpen,
    receiptVenda,
    receiptCliente,
    tenant,
    receiptPlano,
    receiptContratoAutoMsg,
    receiptVoucherCodigo,
    receiptVoucherPercent,
    handleConfirmPayment,
  } = workspace;

  return (
    <div className="space-y-6">
      <SaleReceiptModal
        open={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        venda={receiptVenda}
        cliente={receiptCliente}
        tenant={tenant}
        plano={receiptPlano}
        contratoAutoEnvioMensagem={receiptContratoAutoMsg}
        voucherCodigo={receiptVoucherCodigo || undefined}
        voucherDescontoPercent={receiptVoucherPercent || undefined}
      />

      <SaleHeader workspace={workspace} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <SaleTypeSelector workspace={workspace} />
          
          <div className="rounded-xl border border-border bg-card p-4">
            <ClientAndItemSelector workspace={workspace} />
            <PlanoDetails workspace={workspace} />
          </div>

          <CartItems workspace={workspace} />
        </div>

        <SaleSummary workspace={workspace} handleConfirmPayment={handleConfirmPayment} />
      </div>

      <ScannerDialog workspace={workspace} />
    </div>
  );
}

export default function NovaVendaPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Carregando nova venda...</div>}>
      <NovaVendaPageContent />
    </Suspense>
  );
}
