"use client";

import { Suspense, useCallback } from "react";
import nextDynamic from "next/dynamic";
import { formatBRL, formatCpf } from "@/lib/formatters";
import type { CartItem } from "@/lib/tenant/hooks/use-commercial-flow";
import type { Prospect } from "@/lib/types";
import { useVendaWorkspace } from "./hooks/use-venda-workspace";
import { SaleTypeSelector } from "./components/sale-type-selector";
import { ClientAndItemSelector } from "./components/client-and-item-selector";
import { PlanoDetails } from "./components/plano-details";
import { CartItems } from "./components/cart-items";
import { SaleSummary } from "./components/sale-summary";
import { ScannerDialog } from "./components/scanner-dialog";
import { CockpitShell } from "./components/cockpit-shell";
import { UniversalSearch } from "./components/universal-search";

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
    setClienteId,
    setClienteQuery,
    handleAddPlano,
    addItemToCart,
  } = workspace;

  // Handlers da busca universal (VUN-2.1): traduzem o resultado selecionado em
  // mutações no workspace sem que o `<UniversalSearch />` precise conhecer os
  // detalhes internos do hook (`use-venda-workspace`).
  const handleSelectClienteFromSearch = useCallback(
    (cliente: { id: string; nome: string; cpf: string }) => {
      setClienteId(cliente.id);
      setClienteQuery(`${cliente.nome} · CPF ${cliente.cpf}`);
    },
    [setClienteId, setClienteQuery]
  );

  const handleSelectProdutoFromSearch = useCallback(
    (produto: { id: string; nome: string; valorVenda: number }) => {
      const item: CartItem = {
        tipo: "PRODUTO",
        referenciaId: produto.id,
        descricao: produto.nome,
        quantidade: 1,
        valorUnitario: Number(produto.valorVenda ?? 0),
        desconto: 0,
        detalhes: `${formatBRL(Number(produto.valorVenda ?? 0))}`,
      };
      addItemToCart(item);
    },
    [addItemToCart]
  );

  /**
   * VUN-2.4 — após criação inline do prospect, reflete o nome+CPF no campo
   * cliente do cockpit. Não chamamos `setClienteId` pois Prospect e Aluno
   * são entidades distintas no backend; o operador ainda precisa converter
   * o prospect para Aluno antes de fechar a venda de plano/serviço. A
   * UI do campo cliente já serve como "selecionado visualmente".
   */
  const handleProspectCreatedFromSearch = useCallback(
    (prospect: Prospect) => {
      const cpfLabel = prospect.cpf ? formatCpf(prospect.cpf) : "sem CPF";
      setClienteQuery(`${prospect.nome} · Prospect · CPF ${cpfLabel}`);
    },
    [setClienteQuery]
  );

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
        headerCenter={
          <UniversalSearch
            onSelectCliente={handleSelectClienteFromSearch}
            onSelectPlano={handleAddPlano}
            onSelectProduto={handleSelectProdutoFromSearch}
            onCreateProspect={handleProspectCreatedFromSearch}
          />
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
            <SaleTypeSelector workspace={workspace} />
            <div className="rounded-xl border border-border bg-card p-4">
              <ClientAndItemSelector workspace={workspace} />
            </div>
          </div>
        }
        columnCenter={
          <div className="flex flex-col gap-4 p-4">
            <PlanoDetails workspace={workspace} />
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
