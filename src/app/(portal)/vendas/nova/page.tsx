"use client";

import { Suspense } from "react";
import nextDynamic from "next/dynamic";
import { useVendaWorkspace } from "./hooks/use-venda-workspace";
import { CatalogTabs } from "./components/catalog-tabs";
import { ClientAndItemSelector } from "./components/client-and-item-selector";
import { CartItems } from "./components/cart-items";
import { SaleSummary } from "./components/sale-summary";
import { ScannerDialog } from "./components/scanner-dialog";
import { CockpitShell } from "./components/cockpit-shell";

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
    <>
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

      <CockpitShell
        headerLeft={
          <div className="flex flex-col leading-tight">
            <span className="font-display text-[15px] font-bold tracking-tight">
              Nova Venda
            </span>
            <span className="font-mono text-[11px] text-[color:oklch(0.72_0_0)]">
              ponto de venda · carrinho unificado
            </span>
          </div>
        }
        headerRight={
          <div className="flex items-center gap-3 text-right leading-tight">
            <div className="flex flex-col">
              <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-[color:oklch(0.72_0_0)]">
                Unidade
              </span>
              <span className="text-[12px] font-semibold text-[color:oklch(0.98_0_0)]">
                {tenant?.nome ?? "—"}
              </span>
            </div>
          </div>
        }
        columnLeft={
          <div className="flex flex-col gap-4 p-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <ClientAndItemSelector workspace={workspace} />
            </div>
          </div>
        }
        columnCenter={
          <div className="flex flex-col gap-4 p-4">
            <CatalogTabs workspace={workspace} />
          </div>
        }
        columnRight={
          <div className="flex flex-col gap-4 p-4">
            <CartItems workspace={workspace} />
            <SaleSummary
              workspace={workspace}
              handleConfirmPayment={handleConfirmPayment}
            />
          </div>
        }
      />

      <ScannerDialog workspace={workspace} />
    </>
  );
}

export default function NovaVendaPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 text-sm text-muted-foreground">
          Carregando nova venda...
        </div>
      }
    >
      <NovaVendaPageContent />
    </Suspense>
  );
}
