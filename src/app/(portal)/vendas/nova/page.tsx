"use client";

import { Suspense, useCallback } from "react";
import nextDynamic from "next/dynamic";
import { ScanLine } from "lucide-react";
import { formatBRL, formatCpf } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import type { CartItem } from "@/lib/tenant/hooks/use-commercial-flow";
import type { Prospect } from "@/lib/types";
import { useVendaWorkspace } from "./hooks/use-venda-workspace";
import { CatalogTabs } from "./components/catalog-tabs";
import { CartItems } from "./components/cart-items";
import { PaymentPanel } from "./components/payment-panel";
import { ScannerDialog } from "./components/scanner-dialog";
import { CockpitShell } from "./components/cockpit-shell";
import { UniversalSearch } from "./components/universal-search";
import { HeaderClienteChip } from "./components/header-cliente-chip";
import { FOCUS_UNIVERSAL_SEARCH_EVENT } from "@/components/shared/sale-receipt-modal";
import { useCheckinPendenteStream } from "@/hooks/use-checkin-pendente-stream";
import { CheckinPendenteStack } from "@/components/cockpit/checkin-pendente-toast";

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
    clienteId,
    clienteQuery,
    setClienteQuery,
    handleAddPlano,
    addItemToCart,
    setScannerOpen,
  } = workspace;

  // Onda 4 (2026-04-22): header passa a ser o único ponto de busca/seleção
  // de cliente no cockpit. A coluna esquerda com `ClientAndItemSelector`
  // foi eliminada; tudo passa pelo UniversalSearch (⌘K) que pode ser
  // aberto também via chip do cliente ou botão de scanner do header.
  const abrirBuscaUniversal = useCallback(() => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent(FOCUS_UNIVERSAL_SEARCH_EVENT));
  }, []);

  const limparClienteSelecionado = useCallback(() => {
    setClienteId("");
    setClienteQuery("");
  }, [setClienteId, setClienteQuery]);

  // VUN-5.8 — stream SSE de check-ins pendentes (Gympass/TotalPass) pra recepção.
  // Hook só conecta quando o cockpit está montado + tenant resolvido; limpa no unmount.
  const {
    pendentes: checkinPendentes,
    pendentesOcultos: checkinPendentesOcultos,
    dismissPendente: dismissCheckinPendente,
  } = useCheckinPendenteStream({ tenantId: tenant?.id });

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
          <div className="flex items-center gap-4 leading-tight">
            <div className="flex flex-col">
              <span className="font-display text-[15px] font-bold tracking-tight">
                Nova Venda
              </span>
              <span className="font-mono text-[11px] text-[color:oklch(0.72_0_0)]">
                ponto de venda · carrinho unificado
              </span>
            </div>
            <div className="hidden h-8 w-px bg-white/10 md:block" />
            <div className="hidden flex-col md:flex">
              <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[color:oklch(0.72_0_0)]">
                Unidade
              </span>
              <span className="text-[12px] font-semibold text-[color:oklch(0.98_0_0)]">
                {tenant?.nome ?? "—"}
              </span>
            </div>
          </div>
        }
        headerCenter={
          <HeaderClienteChip
            clienteQuery={clienteQuery}
            clienteSelecionado={Boolean(clienteId)}
            onTrocar={limparClienteSelecionado}
            onAbrirBusca={abrirBuscaUniversal}
          />
        }
        headerRight={
          <div className="flex items-center gap-2">
            <div className="w-[360px] max-w-[42vw]">
              <UniversalSearch
                onSelectCliente={handleSelectClienteFromSearch}
                onSelectPlano={handleAddPlano}
                onSelectProduto={handleSelectProdutoFromSearch}
                onCreateProspect={handleProspectCreatedFromSearch}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-9 shrink-0 border-white/15 bg-transparent text-white/80 hover:bg-white/10 hover:text-white"
              onClick={() => setScannerOpen(true)}
              title="Leitor de código de barras"
              aria-label="Abrir leitor de código de barras"
              data-testid="cockpit-header-scanner"
            >
              <ScanLine className="size-4" />
            </Button>
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
            <PaymentPanel
              workspace={workspace}
              handleConfirmPayment={handleConfirmPayment}
            />
          </div>
        }
      />

      <ScannerDialog workspace={workspace} />

      {/* VUN-5.8 — toasts laterais de check-in pendente (Gympass/TotalPass) */}
      <CheckinPendenteStack
        pendentes={checkinPendentes}
        pendentesOcultos={checkinPendentesOcultos}
        onDismiss={dismissCheckinPendente}
      />
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
