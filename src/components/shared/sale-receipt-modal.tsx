"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import {
  CheckCircle2,
  FileDown,
  MessageCircle,
  Plus,
  Printer,
  RotateCcw,
  Send,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ThermalReceipt,
  type ThermalReceiptItem,
} from "@/components/shared/thermal-receipt";
import { useToast } from "@/components/ui/use-toast";
import type { Aluno, Plano, Tenant, Venda } from "@/lib/types";
import type { TipoFormaPagamento } from "@/lib/shared/types/pagamento";
import { cn } from "@/lib/utils";

/**
 * Modal pós-venda (VUN-4.1): layout 820×560 em duas colunas.
 *
 * - **Esquerda**: `<ThermalReceipt variant="modal" />` — fonte única de verdade
 *   visual do recibo (RN-017: carrinho e modal NÃO divergem).
 * - **Direita**: badge "Venda Aprovada" + valor total + parcelamento + envio
 *   de recibo por e-mail + card de impressora + atalhos PDF/WhatsApp/2ª via +
 *   botão "Nova venda".
 *
 * Responsivo: viewport < 860px cai em full-screen com layout empilhado.
 *
 * API externa preservada (consumidores como `/vendas/nova` continuam funcionando
 * sem mudanças). Wiring automático com `finalizar()` (VUN-3.3) fica para
 * integração em follow-up — aqui o modal aceita `venda: Venda | null`.
 */

type MetodoThermal =
  | "DINHEIRO"
  | "CREDITO"
  | "DEBITO"
  | "PIX"
  | "RECORRENTE";

function mapMetodoPagamento(
  forma: TipoFormaPagamento | undefined,
): MetodoThermal | undefined {
  switch (forma) {
    case "DINHEIRO":
      return "DINHEIRO";
    case "PIX":
      return "PIX";
    case "CARTAO_CREDITO":
      return "CREDITO";
    case "CARTAO_DEBITO":
      return "DEBITO";
    case "RECORRENTE":
      return "RECORRENTE";
    default:
      // BOLETO e outros ficam sem equivalente no thermal — omitimos.
      return undefined;
  }
}

function mapItensToThermal(venda: Venda): ThermalReceiptItem[] {
  return venda.itens.map((item) => ({
    id: item.id,
    nome: item.descricao,
    qtd: item.quantidade,
    valorUnit: item.valorUnitario,
    valorTotal: item.valorTotal,
  }));
}

const PLACEHOLDER_TOTAL = "R$ —";

// Sentinel "hasMounted" via useSyncExternalStore — canônico para SSR safety
// sem disparar `react-hooks/set-state-in-effect`. Retorna false no SSR e
// true após hidratação no cliente.
const subscribeNoop = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

function useHasMounted(): boolean {
  return useSyncExternalStore(
    subscribeNoop,
    getClientSnapshot,
    getServerSnapshot,
  );
}

function useBRLFormatter(): (value: number) => string {
  const mounted = useHasMounted();
  // Formatador BRL só aparece pós-mount para evitar divergência SSR/client
  // (Intl.NumberFormat pode diferir entre Node e browser).
  if (!mounted) return () => PLACEHOLDER_TOTAL;
  const fmt = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  return (value: number) =>
    Number.isFinite(value) ? fmt.format(value) : PLACEHOLDER_TOTAL;
}

export function SaleReceiptModal({
  open,
  onClose,
  venda,
  cliente,
  tenant,
  plano,
  contratoAutoEnvioMensagem,
  voucherCodigo,
  voucherDescontoPercent,
}: {
  open: boolean;
  onClose: () => void;
  venda: Venda | null;
  cliente?: Aluno | null;
  tenant?: Tenant | null;
  plano?: Plano | null;
  contratoAutoEnvioMensagem?: string;
  voucherCodigo?: string;
  voucherDescontoPercent?: number;
}) {
  const { toast } = useToast();
  const [emailOverride, setEmailOverride] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [printing, setPrinting] = useState(false);
  // Status fictício da impressora (mock). Integração real é follow-up.
  const [printerOnline] = useState(true);
  const formatBRL = useBRLFormatter();

  const emailValue = emailOverride ?? cliente?.email ?? "";

  function handleClose() {
    setEmailOverride(null);
    setSendingEmail(false);
    setPrinting(false);
    onClose();
  }

  async function handleSendEmail() {
    const mail = emailValue.trim();
    if (!mail || !mail.includes("@")) {
      toast({
        title: "E-mail inválido",
        description: "Informe um e-mail válido para o envio do recibo.",
        variant: "destructive",
      });
      return;
    }
    setSendingEmail(true);
    // Mock: integração real com backend em follow-up.
    await new Promise((resolve) => setTimeout(resolve, 700));
    setSendingEmail(false);
    toast({
      title: "Recibo enviado",
      description: `Recibo enviado para ${mail}.`,
    });
  }

  async function handlePrint() {
    setPrinting(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setPrinting(false);
    toast({
      title: "Impressão enviada",
      description: "Recibo enviado para a impressora térmica.",
    });
  }

  function handleShortcut(
    tipo: "PDF" | "WHATSAPP" | "SEGUNDA_VIA",
    label: string,
  ) {
    // Mock shortcuts — integrações reais são follow-up.
    toast({
      title: label,
      description: `Ação "${label}" acionada (mock).`,
    });
    // Usa o tipo em data-* para testes e telemetria.
    void tipo;
  }

  function handleNovaVenda() {
    handleClose();
    toast({
      title: "Nova venda",
      description: "Iniciando nova venda.",
    });
  }

  const thermalItems = useMemo<ThermalReceiptItem[]>(
    () => (venda ? mapItensToThermal(venda) : []),
    [venda],
  );

  const cabecalho = {
    academiaNome: tenant?.nome ?? "Unidade",
    cnpj: tenant?.documento,
    endereco:
      tenant?.endereco?.logradouro ||
      tenant?.endereco?.bairro ||
      tenant?.endereco?.cidade ||
      undefined,
  };

  const parcelas = venda?.pagamento.parcelas;
  const total = venda?.total ?? 0;
  const showParcelamento = !!(parcelas && parcelas > 1 && total > 0);
  const valorParcela = showParcelamento ? total / (parcelas as number) : 0;

  const rodape = useMemo(() => {
    if (voucherCodigo) {
      const pct = voucherDescontoPercent ? ` (${voucherDescontoPercent}%)` : "";
      return `Cupom ${voucherCodigo}${pct} aplicado. Documento não fiscal.`;
    }
    return "Documento comercial não fiscal.";
  }, [voucherCodigo, voucherDescontoPercent]);

  return (
    <Dialog open={open} onOpenChange={(next) => (!next ? handleClose() : null)}>
      <DialogContent
        data-testid="sale-receipt-modal"
        className={cn(
          // Layout 820×560 em viewports >= 860px; fullscreen abaixo disso.
          "max-h-[100dvh] w-screen max-w-[100vw] overflow-hidden p-0",
          "md:h-[560px] md:w-[820px] md:max-w-[820px] md:rounded-2xl",
          "border-border bg-card",
        )}
        showCloseButton
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Recibo da venda</DialogTitle>
        </DialogHeader>

        {venda ? (
          <div
            className="flex h-full min-h-0 w-full flex-col md:flex-row"
            data-testid="sale-receipt-modal-layout"
          >
            {/* Coluna esquerda — Recibo térmico */}
            <div
              className={cn(
                "flex min-h-0 shrink-0 items-start justify-center bg-neutral-100 p-4",
                "md:h-full md:w-[420px]",
              )}
              data-testid="sale-receipt-modal-left"
            >
              <div className="h-full w-full max-w-[380px]">
                <ThermalReceipt
                  items={thermalItems}
                  subtotal={venda.subtotal}
                  desconto={venda.descontoTotal}
                  total={venda.total}
                  parcelamento={
                    showParcelamento
                      ? { n: parcelas as number, valorParcela }
                      : undefined
                  }
                  cupomAplicado={voucherCodigo}
                  metodoPagamento={mapMetodoPagamento(
                    venda.pagamento.formaPagamento,
                  )}
                  cabecalho={cabecalho}
                  rodape={rodape}
                  variant="modal"
                  className="!h-full !w-full"
                />
              </div>
            </div>

            {/* Coluna direita — Ações */}
            <div
              className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5"
              data-testid="sale-receipt-modal-right"
            >
              <div className="space-y-3">
                <Badge
                  variant="default"
                  className="bg-emerald-500 text-white [&>svg]:size-3.5"
                  data-testid="sale-receipt-status-badge"
                >
                  <CheckCircle2 />
                  Venda Aprovada
                </Badge>

                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Valor total
                  </p>
                  <p
                    className="font-mono text-[32px] font-bold leading-tight text-foreground"
                    data-testid="sale-receipt-total"
                  >
                    {formatBRL(venda.total)}
                  </p>
                  {showParcelamento ? (
                    <p
                      className="text-sm text-muted-foreground"
                      data-testid="sale-receipt-parcelamento"
                    >
                      {parcelas}x de {formatBRL(valorParcela)}
                    </p>
                  ) : null}
                </div>
              </div>

              {/* Envio por e-mail */}
              <div className="space-y-2">
                <label
                  htmlFor="sale-receipt-email"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Enviar recibo por e-mail
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    id="sale-receipt-email"
                    type="email"
                    value={emailValue}
                    onChange={(e) => setEmailOverride(e.target.value)}
                    placeholder="cliente@exemplo.com"
                    className="flex-1"
                    data-testid="sale-receipt-email-input"
                  />
                  <Button
                    type="button"
                    onClick={handleSendEmail}
                    disabled={sendingEmail}
                    data-testid="sale-receipt-send-email"
                  >
                    <Send className="size-4" aria-hidden />
                    {sendingEmail ? "Enviando..." : "Enviar por e-mail"}
                  </Button>
                </div>
              </div>

              {/* Card impressora */}
              <div
                className="rounded-lg border border-border p-3"
                data-testid="sale-receipt-printer-card"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Printer className="size-4 text-muted-foreground" aria-hidden />
                    <div>
                      <p className="text-sm font-semibold">Impressora térmica</p>
                      <p className="text-xs text-muted-foreground">
                        Status:{" "}
                        <span
                          className={cn(
                            "font-medium",
                            printerOnline
                              ? "text-emerald-600"
                              : "text-destructive",
                          )}
                          data-testid="sale-receipt-printer-status"
                        >
                          {printerOnline ? "Conectada" : "Offline"}
                        </span>
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrint}
                    disabled={!printerOnline || printing}
                    data-testid="sale-receipt-print-button"
                  >
                    {printing ? "Imprimindo..." : "Imprimir"}
                  </Button>
                </div>
              </div>

              {/* Atalhos */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Atalhos
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleShortcut("PDF", "Baixar PDF")}
                    data-testid="sale-receipt-shortcut-pdf"
                  >
                    <FileDown className="size-4" aria-hidden />
                    PDF
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleShortcut("WHATSAPP", "WhatsApp")}
                    data-testid="sale-receipt-shortcut-whatsapp"
                  >
                    <MessageCircle className="size-4" aria-hidden />
                    WhatsApp
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleShortcut("SEGUNDA_VIA", "2ª via")}
                    data-testid="sale-receipt-shortcut-segunda-via"
                  >
                    <RotateCcw className="size-4" aria-hidden />
                    2ª via
                  </Button>
                </div>
              </div>

              {/* Contrato/auto-envio — mantido para compat com API atual */}
              {contratoAutoEnvioMensagem || plano?.contratoTemplateHtml ? (
                <p
                  className="text-xs text-muted-foreground"
                  data-testid="sale-receipt-contrato-msg"
                >
                  {contratoAutoEnvioMensagem ?? "Contrato disponível para envio manual."}
                </p>
              ) : null}

              {/* Spacer para empurrar o CTA final para baixo em telas grandes */}
              <div className="flex-1" aria-hidden />

              <Button
                type="button"
                onClick={handleNovaVenda}
                className="w-full"
                data-testid="sale-receipt-nova-venda"
              >
                <Plus className="size-4" aria-hidden />
                Nova venda
              </Button>
            </div>
          </div>
        ) : (
          <div
            className="flex h-full min-h-[320px] w-full items-center justify-center p-8 text-center text-sm text-muted-foreground"
            data-testid="sale-receipt-empty"
          >
            Nenhuma venda para exibir.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
