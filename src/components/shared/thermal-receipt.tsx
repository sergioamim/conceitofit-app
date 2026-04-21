"use client";

import { useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

/**
 * Recibo térmico reusável (VUN-3.1, RN-017).
 *
 * Fonte única de verdade visual para:
 * - Carrinho no cockpit de vendas (coluna direita, altura flexível).
 * - Modal pós-venda (altura fixa 820×560).
 *
 * Papel creme (`--receipt-paper`), tipografia mono, bordas picotadas top/bottom.
 *
 * Hydration safety: formatação BRL (`Intl.NumberFormat`) só ocorre após o primeiro
 * mount — no SSR inicial, valores aparecem como `R$ —`. Isso evita divergência
 * SSR vs client em ambientes com locales distintos (happy-dom, CI, produção).
 */

type MetodoPagamento = "DINHEIRO" | "CREDITO" | "DEBITO" | "PIX" | "RECORRENTE";

export type ThermalReceiptItem = {
  id: string;
  nome: string;
  qtd: number;
  valorUnit: number;
  valorTotal: number;
};

export type ThermalReceiptProps = {
  items: ThermalReceiptItem[];
  subtotal: number;
  desconto?: number;
  total: number;
  parcelamento?: { n: number; valorParcela: number };
  cupomAplicado?: string;
  convenio?: string;
  metodoPagamento?: MetodoPagamento;
  cabecalho: { academiaNome: string; cnpj?: string; endereco?: string };
  rodape?: string;
  variant: "carrinho" | "modal";
  className?: string;
};

const METODO_LABEL: Record<MetodoPagamento, string> = {
  DINHEIRO: "Dinheiro",
  CREDITO: "Crédito",
  DEBITO: "Débito",
  PIX: "PIX",
  RECORRENTE: "Recorrente",
};

const PLACEHOLDER = "R$ —";

/**
 * Efeito picotado em SVG data-URL. Cria um "serrilhado" com círculos recortados
 * ao longo da borda — compatível com todos browsers modernos. Em navegadores
 * sem suporte a `mask-image`, o fallback é a borda tracejada (`border-dashed`).
 */
const TEAR_EDGE_STYLE: React.CSSProperties = {
  maskImage:
    "radial-gradient(circle 4px at 6px 0, transparent 4px, black 4.5px) 0 0 / 12px 6px repeat-x, linear-gradient(black, black)",
  maskComposite: "intersect",
  WebkitMaskImage:
    "radial-gradient(circle 4px at 6px 0, transparent 4px, black 4.5px) 0 0 / 12px 6px repeat-x, linear-gradient(black, black)",
  WebkitMaskComposite: "source-in",
};

function TearEdge({ side }: { side: "top" | "bottom" }) {
  return (
    <div
      aria-hidden="true"
      data-testid={`thermal-receipt-tear-${side}`}
      className={cn(
        "h-[6px] w-full shrink-0 bg-receipt-paper",
        side === "top" ? "[mask-position:0_0]" : "[mask-position:0_bottom]",
      )}
      style={TEAR_EDGE_STYLE}
    />
  );
}

// Sentinel "hasMounted" via useSyncExternalStore — retorna `false` no SSR
// (getServerSnapshot) e `true` no cliente após hidratação. Evita o lint
// `react-hooks/set-state-in-effect` e é o pattern canônico para SSR safety.
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

function useBRLFormatter(): ((value: number) => string) | null {
  // Formatador disponível apenas após mount (hydration-safe). No primeiro
  // render SSR/cliente, retorna null → valores aparecem como PLACEHOLDER.
  const mounted = useHasMounted();
  if (!mounted) return null;
  const fmt = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  return (value: number) => {
    const safe = Number.isFinite(value) ? value : 0;
    return fmt.format(safe);
  };
}

export function ThermalReceipt({
  items,
  subtotal,
  desconto,
  total,
  parcelamento,
  cupomAplicado,
  convenio,
  metodoPagamento,
  cabecalho,
  rodape,
  variant,
  className,
}: ThermalReceiptProps) {
  const format = useBRLFormatter();
  const fmt = (value: number) => (format ? format(value) : PLACEHOLDER);

  const isModal = variant === "modal";

  return (
    <div
      role="region"
      aria-label="Recibo da venda"
      data-testid="thermal-receipt"
      data-variant={variant}
      className={cn(
        "flex flex-col bg-receipt-paper text-[color:#111418] shadow-sm",
        isModal
          ? "h-[560px] w-[820px] max-w-full"
          : "h-full w-full",
        className,
      )}
    >
      <TearEdge side="top" />

      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col gap-3 px-6 py-4 text-sm",
          isModal ? "overflow-y-auto" : "",
        )}
        data-testid="thermal-receipt-body"
      >
        {/* Cabeçalho */}
        <header
          className="text-center"
          data-testid="thermal-receipt-header"
        >
          <h3 className="font-mono text-base font-bold uppercase tracking-wider">
            {cabecalho.academiaNome}
          </h3>
          {cabecalho.cnpj ? (
            <p className="mt-0.5 font-mono text-[11px] text-[color:#3a3e47]">
              CNPJ {cabecalho.cnpj}
            </p>
          ) : null}
          {cabecalho.endereco ? (
            <p className="mt-0.5 text-[11px] text-[color:#3a3e47]">
              {cabecalho.endereco}
            </p>
          ) : null}
        </header>

        <DividerDashed />

        {/* Itens */}
        <ul
          className="space-y-2"
          data-testid="thermal-receipt-items"
        >
          {items.length === 0 ? (
            <li className="text-center text-[11px] italic text-[color:#3a3e47]">
              Nenhum item
            </li>
          ) : null}
          {items.map((item) => (
            <li
              key={item.id}
              className="space-y-0.5"
              data-testid="thermal-receipt-item"
            >
              <p className="break-words font-medium leading-tight">
                {item.nome}
              </p>
              <div className="flex items-center justify-between font-mono text-[12px] text-[color:#3a3e47]">
                <span>
                  {item.qtd} × {fmt(item.valorUnit)}
                </span>
                <span
                  className="font-semibold text-[color:#111418]"
                  data-testid="thermal-receipt-item-total"
                >
                  {fmt(item.valorTotal)}
                </span>
              </div>
            </li>
          ))}
        </ul>

        <DividerDashed />

        {/* Totais */}
        <section className="space-y-1 font-mono text-[12px]">
          <Row
            label="Subtotal"
            value={fmt(subtotal)}
            data-testid="thermal-receipt-subtotal"
          />
          {cupomAplicado ? (
            <Row
              label={`Cupom ${cupomAplicado}`}
              value=""
              data-testid="thermal-receipt-cupom"
              muted
            />
          ) : null}
          {convenio ? (
            <Row
              label={`Convênio ${convenio}`}
              value=""
              data-testid="thermal-receipt-convenio"
              muted
            />
          ) : null}
          {typeof desconto === "number" && desconto > 0 ? (
            <Row
              label="Desconto"
              value={`- ${fmt(desconto)}`}
              data-testid="thermal-receipt-desconto"
            />
          ) : null}
          <div
            className="mt-2 flex items-center justify-between border-t border-dashed border-[color:#3a3e47] pt-2 text-[14px] font-bold"
            data-testid="thermal-receipt-total"
          >
            <span>TOTAL</span>
            <span className="font-mono">{fmt(total)}</span>
          </div>
        </section>

        {/* Pagamento / Parcelamento */}
        {metodoPagamento || parcelamento ? (
          <>
            <DividerDashed />
            <section className="space-y-1 font-mono text-[12px]">
              {metodoPagamento ? (
                <Row
                  label="Pagamento"
                  value={METODO_LABEL[metodoPagamento]}
                  data-testid="thermal-receipt-metodo"
                />
              ) : null}
              {parcelamento ? (
                <Row
                  label={`${parcelamento.n}x`}
                  value={fmt(parcelamento.valorParcela)}
                  data-testid="thermal-receipt-parcelamento"
                />
              ) : null}
            </section>
          </>
        ) : null}

        {/* Rodapé */}
        {rodape ? (
          <>
            <DividerDashed />
            <footer
              className="text-center text-[10px] italic text-[color:#3a3e47]"
              data-testid="thermal-receipt-footer"
            >
              {rodape}
            </footer>
          </>
        ) : null}
      </div>

      <TearEdge side="bottom" />
    </div>
  );
}

function DividerDashed() {
  return (
    <div
      aria-hidden="true"
      className="border-t border-dashed border-[color:#3a3e47]"
      data-testid="thermal-receipt-divider"
    />
  );
}

function Row({
  label,
  value,
  muted = false,
  "data-testid": testId,
}: {
  label: string;
  value: string;
  muted?: boolean;
  "data-testid"?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2",
        muted ? "text-[color:#3a3e47]" : "",
      )}
      data-testid={testId}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
