"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  FileDown,
  MessageCircle,
  Plus,
  Printer,
  RotateCcw,
  Send,
  UserCircle,
} from "lucide-react";
import { z } from "zod";

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
 * Modal pós-venda (VUN-4.1 + VUN-4.2).
 *
 * VUN-4.1: layout 820×560 em duas colunas (esquerda = ThermalReceipt modal;
 * direita = ações).
 *
 * VUN-4.2: a11y + ações:
 *  - Handler mock e-mail (zod + delay 600ms) com `aria-live="polite"`.
 *  - Handler mock print (delay 800ms) idem.
 *  - Stubs PDF / WhatsApp / 2ª via com `aria-label` corretos.
 *  - "Nova venda" dispatcha `CustomEvent("focus-universal-search")` no window
 *    (baixo acoplamento com VUN-2.1 — o input escuta e foca).
 *  - Foco inicial no botão "Enviar por e-mail" via `onOpenAutoFocus`.
 *  - `onCloseAutoFocus` devolve foco ao elemento que abriu o modal (default
 *    do Radix Dialog — preservamos).
 *
 * Responsivo: viewport < 860px cai em full-screen com layout empilhado.
 * API externa preservada.
 */

// Evento global para foco no input da busca universal (VUN-2.1).
// Quando o componente `UniversalSearch` estiver disponível nesta branch,
// basta adicionar um listener em `window` que chame `.focus()` no input.
export const FOCUS_UNIVERSAL_SEARCH_EVENT = "focus-universal-search";

// Schema Zod para validar o e-mail antes do envio mockado.
const emailSchema = z.string().trim().email();

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

/**
 * VUN-Onda-5: Preenche placeholders `{{entidade.campo}}` no template HTML do
 * contrato com valores simples do cliente/plano/venda/tenant. Valores ausentes
 * são substituídos por "—". Regex cobre dot.notation de 2 níveis.
 */
export function preencherContratoTemplate(
  template: string,
  ctx: {
    cliente?: { nome?: string; cpf?: string; email?: string; telefone?: string };
    plano?: { nome?: string; valor?: string };
    venda?: {
      dataCriacao?: string;
      total?: string;
      dataInicioContrato?: string;
      dataFimContrato?: string;
    };
    tenant?: { nome?: string; documento?: string };
  },
): string {
  return template.replace(
    /\{\{\s*(cliente|plano|venda|tenant)\.(\w+)\s*\}\}/g,
    (_match, entidade: string, campo: string) => {
      const bag = (ctx as Record<string, Record<string, string | undefined> | undefined>)[
        entidade
      ];
      const raw = bag?.[campo];
      if (raw === undefined || raw === null || raw === "") return "—";
      return String(raw);
    },
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
  const router = useRouter();
  const [emailOverride, setEmailOverride] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [printing, setPrinting] = useState(false);
  // Status fictício da impressora (mock). Integração real é follow-up.
  const [printerOnline] = useState(true);
  // Região aria-live para anúncios a11y (mudanças em tempo real).
  const [liveMessage, setLiveMessage] = useState("");
  const sendEmailButtonRef = useRef<HTMLButtonElement | null>(null);
  const formatBRL = useBRLFormatter();

  const emailValue = emailOverride ?? cliente?.email ?? "";

  function handleClose() {
    setEmailOverride(null);
    setSendingEmail(false);
    setPrinting(false);
    setLiveMessage("");
    onClose();
  }

  async function handleSendEmail() {
    const parsed = emailSchema.safeParse(emailValue);
    if (!parsed.success) {
      setLiveMessage("E-mail inválido. Verifique e tente novamente.");
      toast({
        title: "E-mail inválido",
        description: "Informe um e-mail válido para o envio do recibo.",
        variant: "destructive",
      });
      return;
    }
    const mail = parsed.data;
    setSendingEmail(true);
    setLiveMessage("Enviando e-mail…");
    // Mock: integração real com backend em follow-up.
    await new Promise((resolve) => setTimeout(resolve, 600));
    setSendingEmail(false);
    setLiveMessage("E-mail enviado");
    toast({
      title: "Recibo enviado",
      description: `Recibo enviado para ${mail}.`,
    });
  }

  async function handlePrint() {
    setPrinting(true);
    setLiveMessage("Enviando para impressora…");
    // Mock: integração real com hardware é follow-up.
    await new Promise((resolve) => setTimeout(resolve, 800));
    setPrinting(false);
    setLiveMessage("Enviado para impressora");
    toast({
      title: "Impressão enviada",
      description: "Recibo enviado para a impressora térmica.",
    });
  }

  // Stubs AC3: integrações reais são follow-up; preservamos aria-label
  // descritivo para leitores de tela.
  // VUN-Onda-5: abre nova janela e imprime o contrato preenchido.
  // TODO: quando o backend expor `renovacaoMesmoPlano` no VendaResponse,
  // esconder este botão se `renovacaoMesmoPlano === true` e
  // `plano.exigeAssinaturaRenovacao === false`.
  function handleImprimirContrato() {
    const templateHtml = plano?.contratoTemplateHtml?.trim();
    if (!venda || !cliente || !templateHtml) {
      return;
    }
    const ctx = {
      cliente: {
        nome: cliente.nome,
        cpf: cliente.cpf,
        email: cliente.email,
        telefone: cliente.telefone,
      },
      plano: {
        nome: plano?.nome,
        valor:
          typeof plano?.valor === "number" ? formatBRL(plano.valor) : undefined,
      },
      venda: {
        dataCriacao: venda.dataCriacao,
        total: formatBRL(venda.total),
        dataInicioContrato: venda.dataInicioContrato ?? undefined,
        dataFimContrato: venda.dataFimContrato ?? undefined,
      },
      tenant: {
        nome: tenant?.nome,
        documento: tenant?.documento,
      },
    };
    const htmlPreenchido = preencherContratoTemplate(templateHtml, ctx);
    const win =
      typeof window !== "undefined"
        ? window.open("", "_blank", "width=800,height=600")
        : null;
    if (!win) {
      toast({
        title: "Popup bloqueado",
        description:
          "Libere popups para esta página para imprimir o contrato.",
        variant: "destructive",
      });
      return;
    }
    const tituloPagina = `Contrato — ${cliente.nome ?? "Cliente"}`;
    win.document.write(
      `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${tituloPagina}</title><style>@media print { body { margin: 0; } } body { font-family: system-ui, sans-serif; padding: 2rem; line-height: 1.5; }</style></head><body>${htmlPreenchido}</body></html>`,
    );
    win.document.close();
    win.focus();
    win.print();
    // Não chamar win.close() — deixar o usuário fechar após imprimir.
  }

  function handleShortcutPDF() {
    toast({
      title: "Baixar PDF",
      description: "Geração de PDF ainda não disponível (mock).",
    });
  }

  function handleShortcutWhatsApp() {
    toast({
      title: "Enviar por WhatsApp",
      description: "Envio por WhatsApp ainda não disponível (mock).",
    });
  }

  function handleShortcutSegundaVia() {
    toast({
      title: "2ª via",
      description: "Geração de 2ª via ainda não disponível (mock).",
    });
  }

  function handleVerPerfil() {
    // Fecha o modal e navega pro perfil do cliente da venda. Só dispara quando
    // `cliente?.id` está presente — venda avulsa sem cliente (produto) oculta
    // o botão pra evitar navegação quebrada.
    if (!cliente?.id) {
      return;
    }
    handleClose();
    router.push(`/clientes/${cliente.id}`);
  }

  function handleNovaVenda() {
    // Fecha o modal (o consumidor em `page.tsx` usa isso para reabrir o
    // fluxo de nova venda). O `useVendaWorkspace.handleConfirmPayment` já
    // chama `clearCart()` após a venda; uma nova venda herdará workspace
    // limpo. Campos de pagamento/autorização (quando vierem em VUN-3.2+3.3)
    // são resetados dentro do próprio `CheckoutPayment` ao trocar venda.
    handleClose();
    // Dispatch custom event para foco na busca universal (VUN-2.1). O
    // `UniversalSearch` escuta e chama `focus()` no input. Usamos
    // requestAnimationFrame para garantir que o close do Radix terminou
    // antes do foco — evita focus trap residual.
    if (typeof window !== "undefined") {
      const dispatchFocus = () => {
        window.dispatchEvent(new CustomEvent(FOCUS_UNIVERSAL_SEARCH_EVENT));
      };
      if (typeof window.requestAnimationFrame === "function") {
        window.requestAnimationFrame(dispatchFocus);
      } else {
        dispatchFocus();
      }
    }
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

  // VUN-Onda-5: visibilidade do botão "Imprimir contrato".
  const exibirImprimirContrato = Boolean(
    venda?.tipo === "PLANO" &&
      cliente &&
      plano?.contratoTemplateHtml?.trim(),
  );

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
        onOpenAutoFocus={(event) => {
          // Foco inicial programaticamente no botão "Enviar por e-mail"
          // (AC5). Cancelamos o autofoco default do Radix para evitar foco
          // no botão "Fechar" (X) — que é a primeira tab stop.
          if (sendEmailButtonRef.current) {
            event.preventDefault();
            sendEmailButtonRef.current.focus();
          }
        }}
        // `onCloseAutoFocus` default do Radix já devolve o foco ao elemento
        // que invocou o Dialog — não sobrescrevemos (AC5).
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
                    aria-label="E-mail do cliente"
                  />
                  <Button
                    ref={sendEmailButtonRef}
                    type="button"
                    onClick={handleSendEmail}
                    disabled={sendingEmail}
                    data-testid="sale-receipt-send-email"
                    aria-label="Enviar recibo por e-mail"
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
                    aria-label="Imprimir recibo na impressora térmica"
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
                    onClick={handleShortcutPDF}
                    data-testid="sale-receipt-shortcut-pdf"
                    aria-label="Baixar recibo em PDF"
                  >
                    <FileDown className="size-4" aria-hidden />
                    PDF
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleShortcutWhatsApp}
                    data-testid="sale-receipt-shortcut-whatsapp"
                    aria-label="Enviar recibo por WhatsApp"
                  >
                    <MessageCircle className="size-4" aria-hidden />
                    WhatsApp
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleShortcutSegundaVia}
                    data-testid="sale-receipt-shortcut-segunda-via"
                    aria-label="Gerar 2ª via do recibo"
                  >
                    <RotateCcw className="size-4" aria-hidden />
                    2ª via
                  </Button>
                </div>
              </div>

              {/* VUN-Onda-5: Imprimir contrato de adesão (quando plano tem
                  template HTML). Renderiza entre os Atalhos e o CTA final. */}
              {exibirImprimirContrato ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleImprimirContrato}
                  data-testid="sale-receipt-imprimir-contrato"
                  aria-label="Imprimir contrato de adesão"
                >
                  <Printer className="size-4" aria-hidden />
                  Imprimir contrato
                </Button>
              ) : null}

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

              <div className="flex flex-col gap-2 sm:flex-row">
                {cliente?.id ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleVerPerfil}
                    className="sm:flex-1"
                    data-testid="sale-receipt-ver-perfil"
                    aria-label={`Fechar e abrir perfil de ${cliente.nome ?? "cliente"}`}
                  >
                    <UserCircle className="size-4" aria-hidden />
                    Ver perfil do cliente
                  </Button>
                ) : null}
                <Button
                  type="button"
                  onClick={handleNovaVenda}
                  className={cliente?.id ? "sm:flex-1" : "w-full"}
                  data-testid="sale-receipt-nova-venda"
                  aria-label="Iniciar nova venda"
                >
                  <Plus className="size-4" aria-hidden />
                  Nova venda
                </Button>
              </div>

              {/* Região aria-live para anúncios a11y (status de ações). */}
              <div
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className="sr-only"
                data-testid="sale-receipt-live-region"
              >
                {liveMessage}
              </div>
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
