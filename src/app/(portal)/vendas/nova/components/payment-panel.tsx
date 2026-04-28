"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { getParcelasMaximasApi } from "@/lib/api/pagamentos-split";
import { type SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@/lib/forms/zod-resolver";
import { ChevronDown, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThermalReceipt, type ThermalReceiptItem } from "@/components/shared/thermal-receipt";
import { formatBRL } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { PagamentoVenda, TipoFormaPagamento } from "@/lib/types";

import type { VendaWorkspace } from "../hooks/use-venda-workspace";
import { useDataInicioSugerida } from "../hooks/use-data-inicio-sugerida";
import {
  PAYMENT_PANEL_METODOS,
  type PaymentPanelFormValues,
  type PaymentPanelMetodo,
  paymentPanelSchema,
} from "./payment-panel.schema";

/**
 * Converte a forma de pagamento canônica do workspace
 * (`TipoFormaPagamento` — inclui `BOLETO`) para o subset aceito pelo
 * PaymentPanel (5 métodos). `BOLETO` cai em `PIX` como fallback seguro
 * (mantém backward-compat com eventuais dados legados).
 */
function toPanelMetodo(value: TipoFormaPagamento): PaymentPanelMetodo {
  if (PAYMENT_PANEL_METODOS.includes(value as PaymentPanelMetodo)) {
    return value as PaymentPanelMetodo;
  }
  return "PIX";
}

/**
 * Converte a forma canônica do projeto para o label simplificado esperado
 * pelo componente ThermalReceipt (que usa `CREDITO`/`DEBITO`).
 */
function toThermalMetodo(
  value: PaymentPanelMetodo,
): "DINHEIRO" | "CREDITO" | "DEBITO" | "PIX" {
  if (value === "CARTAO_CREDITO") return "CREDITO";
  if (value === "CARTAO_DEBITO") return "DEBITO";
  return value;
}

/**
 * VUN-3.2 — Painel de pagamento unificado (coluna direita do cockpit).
 *
 * Consome o workspace expandido (VUN-3.3) como fonte única de verdade:
 * items/subtotal/total/formaPagamento/parcelas/autorizacao/canFinalize.
 *
 * O form RHF+zod valida localmente (RN-005, NSU ≥ 4 dígitos) e mantém o
 * estado do workspace sincronizado via setters; o botão Finalizar é
 * desabilitado quando `!canFinalize` ou o schema reprova.
 */

const METODO_LABEL: Record<PaymentPanelMetodo, string> = {
  DINHEIRO: "Dinheiro",
  CARTAO_CREDITO: "Crédito",
  CARTAO_DEBITO: "Débito",
  PIX: "PIX",
};

// useHasMounted inline — evita hydration mismatch no `cabecalho` do
// ThermalReceipt (academiaNome/cnpj/endereço vêm do `tenant`, que só
// resolve client-side via session). Mesmo padrão já usado em `page.tsx`.
const subscribeNoop = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

interface PaymentPanelProps {
  workspace: VendaWorkspace;
  handleConfirmPayment: (pagamento: PagamentoVenda) => Promise<void>;
}

export function PaymentPanel({ workspace, handleConfirmPayment }: PaymentPanelProps) {
  const {
    cart,
    subtotal,
    total,
    descontoTotal,
    tenant,
    cupomCode,
    setCupomCode,
    applyCupom,
    cupomAppliedCode,
    cupomPercent,
    cupomError,
    selectedConvenio,
    conveniosPlano,
    convenioPlanoId,
    setConvenioPlanoId,
    saving,
    canFinalize,
    formaPagamento,
    setFormaPagamento,
    parcelas,
    setParcelas,
    autorizacao,
    setAutorizacao,
    valorParcela,
    // VUN-Onda3 — data de início do plano (sugerida + override manual).
    clienteId,
    dataInicioPlano,
    setDataInicioPlano,
  } = workspace;

  // VUN-Onda3 — busca a sugestão baseada no último contrato ativo do aluno.
  // Quando não há cliente, retorna hoje e `emSequencia=false`.
  const { dataInicioSugerida, emSequencia } = useDataInicioSugerida({
    tenantId: tenant?.id,
    alunoId: clienteId || null,
  });

  const temPlanoNoCarrinho = useMemo(
    () => cart.some((i) => i.tipo === "PLANO"),
    [cart],
  );

  // Limite de parcelas em CARTAO_CREDITO (Parte B do PRD_PAGAMENTO_SPLIT).
  // Calculado backend-side via planos do carrinho (default 12) ou valor mínimo
  // de parcela configurado na Unidade (quando carrinho só tem produto/avulso).
  const planoIdsCarrinho = useMemo(
    () =>
      Array.from(
        new Set(
          cart
            .filter((i) => i.tipo === "PLANO" && i.referenciaId)
            .map((i) => String(i.referenciaId)),
        ),
      ),
    [cart],
  );
  const temProdutoSemPlano = useMemo(
    () => cart.some((i) => i.tipo !== "PLANO"),
    [cart],
  );
  const [parcelasMaximas, setParcelasMaximas] = useState<number>(12);
  useEffect(() => {
    if (!tenant?.id || cart.length === 0) {
      setParcelasMaximas(12);
      return;
    }
    let cancelled = false;
    getParcelasMaximasApi(tenant.id, {
      planoIds: planoIdsCarrinho.length > 0 ? planoIdsCarrinho : undefined,
      temProduto: temProdutoSemPlano,
      total,
    })
      .then((r) => {
        if (!cancelled) setParcelasMaximas(r.parcelasMaximas);
      })
      .catch(() => {
        if (!cancelled) setParcelasMaximas(12); // fallback seguro
      });
    return () => {
      cancelled = true;
    };
  }, [tenant?.id, cart.length, planoIdsCarrinho, temProdutoSemPlano, total]);

  const form = useForm<PaymentPanelFormValues>({
    resolver: zodResolver(paymentPanelSchema),
    mode: "onChange",
    defaultValues: {
      formaPagamento: toPanelMetodo(formaPagamento),
      parcelas,
      autorizacao,
    },
  });

  const { register, handleSubmit, formState, setValue, watch } = form;

  // Sync form <-> workspace (workspace is source of truth downstream).
  const watchedForma = watch("formaPagamento");
  const watchedParcelas = watch("parcelas");
  const watchedAutorizacao = watch("autorizacao");

  useEffect(() => {
    if (watchedForma !== formaPagamento) setFormaPagamento(watchedForma);
  }, [watchedForma, formaPagamento, setFormaPagamento]);

  // Quando o workspace recebe uma forma fora do subset (ex.: BOLETO legado),
  // refletimos o fallback 'PIX' no form.
  useEffect(() => {
    const coerced = toPanelMetodo(formaPagamento);
    if (coerced !== formaPagamento) {
      setFormaPagamento(coerced);
    }
  }, [formaPagamento, setFormaPagamento]);

  useEffect(() => {
    if (watchedParcelas !== parcelas) setParcelas(watchedParcelas);
  }, [watchedParcelas, parcelas, setParcelas]);

  useEffect(() => {
    if ((watchedAutorizacao ?? "") !== autorizacao) setAutorizacao(watchedAutorizacao ?? "");
  }, [watchedAutorizacao, autorizacao, setAutorizacao]);

  // Reflete resets feitos no workspace (ex.: após finalizar venda).
  useEffect(() => {
    const coerced = toPanelMetodo(formaPagamento);
    if (watchedForma !== coerced) setValue("formaPagamento", coerced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formaPagamento]);

  useEffect(() => {
    if (watchedParcelas !== parcelas) setValue("parcelas", parcelas);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parcelas]);

  // Reset externo: quando o workspace zera `autorizacao` (ex.: após finalizar
  // venda em `handleConfirmPayment`), reflete no form. Checagem explícita
  // contra "" evita o ping-pong com o effect oposto (linha 133) que sincroniza
  // form → workspace — ambos tinham a mesma condição e causavam "Maximum
  // update depth exceeded".
  useEffect(() => {
    if (autorizacao === "" && (watchedAutorizacao ?? "") !== "") {
      setValue("autorizacao", "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autorizacao]);

  // Reset parcelas para 1 quando a forma deixa de ser CARTAO_CREDITO.
  useEffect(() => {
    if (watchedForma !== "CARTAO_CREDITO" && watchedParcelas !== 1) {
      setValue("parcelas", 1, { shouldValidate: true });
    }
  }, [watchedForma, watchedParcelas, setValue]);

  // Quando limite cai abaixo do valor selecionado (ex: removeu plano que
  // permitia 12x), força reset pra 1 pra não submeter > limite.
  useEffect(() => {
    if (watchedParcelas > parcelasMaximas) {
      setValue("parcelas", 1, { shouldValidate: true });
    }
  }, [parcelasMaximas, watchedParcelas, setValue]);

  // Colapsáveis
  const [convenioOpen, setConvenioOpen] = useState(false);
  const [cupomOpen, setCupomOpen] = useState(false);

  const mostrarParcelas = watchedForma === "CARTAO_CREDITO";
  const mostrarNsu =
    watchedForma === "CARTAO_CREDITO" || watchedForma === "CARTAO_DEBITO";
  const formIsValid = useMemo(
    () =>
      paymentPanelSchema.safeParse({
        formaPagamento: watchedForma,
        parcelas: watchedParcelas,
        autorizacao: watchedAutorizacao ?? "",
      }).success,
    [watchedAutorizacao, watchedForma, watchedParcelas],
  );

  // Botão Finalizar (RN-018)
  const finalizeLabel = useMemo(() => {
    if (mostrarParcelas && watchedParcelas > 1) {
      return `Finalizar · ${watchedParcelas}× ${formatBRL(valorParcela)}`;
    }
    return `Finalizar · ${formatBRL(total)}`;
  }, [mostrarParcelas, watchedParcelas, valorParcela, total]);

  // Items -> ThermalReceiptItem mapping
  const receiptItems = useMemo<ThermalReceiptItem[]>(
    () =>
      cart.map((item, idx) => {
        const qtd = Math.max(1, item.quantidade || 1);
        // Alguns itens (ex.: parcelas de PLANO) trazem valorUnitario por parcela;
        // valorTotal derivado = qtd × valorUnitario. Se qtd === 1, igual a valorUnitario.
        const valorTotal = item.valorUnitario * qtd;
        return {
          id: `${item.referenciaId}-${idx}`,
          nome: item.descricao,
          qtd,
          valorUnit: item.valorUnitario,
          valorTotal,
        };
      }),
    [cart],
  );

  // `hasMounted` é false no SSR e primeiro render client (suppressHydrationWarning
  // garante que o mismatch não quebra). Só depois do mount usamos dados do
  // `tenant` (resolvido via session client-side). Evita hydration error
  // "Conceito Fit" (SSR) vs "Unidade Mananciais - S1" (client).
  const hasMounted = useSyncExternalStore(
    subscribeNoop,
    getClientSnapshot,
    getServerSnapshot,
  );

  const cabecalho = useMemo(
    () => ({
      academiaNome: hasMounted
        ? tenant?.academiaNome || tenant?.nome || "Conceito Fit"
        : "Conceito Fit",
      cnpj: hasMounted ? tenant?.documento : undefined,
      endereco: hasMounted && tenant?.endereco
        ? [tenant.endereco.logradouro, tenant.endereco.numero, tenant.endereco.cidade]
            .filter(Boolean)
            .join(", ")
        : undefined,
    }),
    [hasMounted, tenant],
  );

  const parcelamentoReceipt = mostrarParcelas && watchedParcelas > 1
    ? { n: watchedParcelas, valorParcela }
    : undefined;

  const onSubmit: SubmitHandler<PaymentPanelFormValues> = async (values) => {
    const parcelasFinal = values.formaPagamento === "CARTAO_CREDITO" ? values.parcelas : undefined;
    const codigoTransacao = mostrarNsu ? (values.autorizacao ?? "").trim() : undefined;

    await handleConfirmPayment({
      formaPagamento: values.formaPagamento,
      parcelas: parcelasFinal,
      valorPago: Math.max(0, total),
      codigoTransacao: codigoTransacao || undefined,
    });
  };


  const disableFinalize = saving || !canFinalize || !formIsValid;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4"
      data-testid="payment-panel"
      noValidate
    >
      {/* Recibo térmico no topo */}
      <div className="overflow-hidden rounded-xl border border-border">
        <ThermalReceipt
          variant="carrinho"
          items={receiptItems}
          subtotal={subtotal}
          desconto={descontoTotal}
          total={total}
          cupomAplicado={cupomAppliedCode || undefined}
          convenio={selectedConvenio?.nome}
          metodoPagamento={toThermalMetodo(watchedForma)}
          parcelamento={parcelamentoReceipt}
          cabecalho={cabecalho}
        />
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        {/* Seção Convênio (colapsável) */}
        <CollapsibleSection
          id="payment-panel-convenio"
          title={
            selectedConvenio
              ? `Convênio · ${selectedConvenio.nome}`
              : "Convênio"
          }
          open={convenioOpen}
          onToggle={() => setConvenioOpen((o) => !o)}
          disabled={conveniosPlano.length === 0}
        >
          <select
            aria-label="Convênio"
            className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm"
            value={convenioPlanoId}
            onChange={(e) => setConvenioPlanoId(e.target.value)}
          >
            <option value="__SEM_CONVENIO__">Sem convênio</option>
            {conveniosPlano.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome} ({c.descontoPercentual}%)
              </option>
            ))}
          </select>
        </CollapsibleSection>

        {/* Seção Cupom (colapsável) */}
        <CollapsibleSection
          id="payment-panel-cupom"
          title={
            cupomAppliedCode
              ? `Cupom · ${cupomAppliedCode} (${cupomPercent}%)`
              : "Cupom"
          }
          open={cupomOpen}
          onToggle={() => setCupomOpen((o) => !o)}
        >
          <div className="flex items-center gap-2">
            <Input
              aria-label="Código do cupom"
              value={cupomCode}
              onChange={(e) => setCupomCode(e.target.value.toUpperCase())}
              placeholder="Código"
              className="h-8 flex-1 border-border bg-secondary"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-border"
              onClick={() => applyCupom(cupomCode)}
            >
              Aplicar
            </Button>
          </div>
          {cupomError ? (
            <p className="mt-1 text-xs text-gym-danger" role="alert">
              {cupomError}
            </p>
          ) : null}
        </CollapsibleSection>

        {/* Total destacado */}
        <div
          className="mt-4 flex items-center justify-between border-t border-border pt-3"
          data-testid="payment-panel-total"
        >
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Total
          </span>
          <span
            className="font-mono text-[28px] font-bold leading-none text-gym-accent"
            data-testid="payment-panel-total-value"
          >
            {formatBRL(total)}
          </span>
        </div>

        {/* Forma de pagamento (radios) */}
        <fieldset className="mt-4 space-y-2">
          <legend className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Forma de pagamento
          </legend>
          <div
            className="grid grid-cols-2 gap-2"
            role="radiogroup"
            aria-label="Forma de pagamento"
          >
            {PAYMENT_PANEL_METODOS.map((metodo) => {
              const checked = watchedForma === metodo;
              return (
                <label
                  key={metodo}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-md border border-border bg-secondary px-3 py-2 text-sm",
                    checked ? "border-gym-accent ring-1 ring-gym-accent" : "",
                  )}
                >
                  <input
                    type="radio"
                    value={metodo}
                    checked={checked}
                    onChange={() =>
                      setValue("formaPagamento", metodo, {
                        shouldValidate: true,
                        shouldDirty: true,
                      })
                    }
                    className="sr-only"
                    data-testid={`payment-panel-forma-${metodo}`}
                  />
                  <span>{METODO_LABEL[metodo]}</span>
                </label>
              );
            })}
          </div>
          {formState.errors.formaPagamento ? (
            <p className="text-xs text-gym-danger" role="alert">
              {formState.errors.formaPagamento.message}
            </p>
          ) : null}
        </fieldset>

        {/* VUN-Onda3 — Início do plano (só quando há plano no carrinho).
            Default = sugestão do hook (hoje ou dataFim+1 do último ativo).
            Operador pode editar livremente. */}
        {temPlanoNoCarrinho ? (
          <div className="mt-4 space-y-1.5">
            <label
              htmlFor="payment-panel-data-inicio"
              className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Início do plano
            </label>
            <Input
              id="payment-panel-data-inicio"
              type="date"
              value={dataInicioPlano || dataInicioSugerida}
              onChange={(e) => setDataInicioPlano(e.target.value)}
              className="bg-secondary"
              data-testid="payment-panel-data-inicio"
            />
            {emSequencia ? (
              <p
                className="text-xs text-gym-accent"
                data-testid="payment-panel-data-inicio-hint"
              >
                Plano em sequência: começa{" "}
                {new Date(dataInicioSugerida + "T00:00:00").toLocaleDateString(
                  "pt-BR",
                )}{" "}
                (dia seguinte ao contrato atual).
              </p>
            ) : null}
          </div>
        ) : null}

        {/* Grid de parcelas (só para CARTAO_CREDITO) */}
        {mostrarParcelas ? (
          <fieldset className="mt-4 space-y-2" data-testid="payment-panel-parcelas-grid">
            <legend className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Parcelas
            </legend>
            <div className="grid grid-cols-6 gap-1.5" role="radiogroup" aria-label="Número de parcelas">
              {Array.from({ length: Math.max(1, parcelasMaximas) }, (_, i) => i + 1).map((n) => {
                const checked = watchedParcelas === n;
                return (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={checked}
                    data-testid={`payment-panel-parcela-${n}`}
                    className={cn(
                      "rounded-md border border-border bg-secondary px-2 py-1.5 text-xs font-mono transition-colors",
                      checked
                        ? "border-gym-accent bg-gym-accent/10 text-gym-accent"
                        : "hover:bg-secondary/70",
                    )}
                    onClick={() =>
                      setValue("parcelas", n, {
                        shouldValidate: true,
                        shouldDirty: true,
                      })
                    }
                  >
                    {n}×
                  </button>
                );
              })}
            </div>
            {watchedParcelas > 1 ? (
              <p className="text-[11px] text-muted-foreground">
                {watchedParcelas}× de {formatBRL(valorParcela)}
              </p>
            ) : null}
            {formState.errors.parcelas ? (
              <p className="text-xs text-gym-danger" role="alert">
                {formState.errors.parcelas.message}
              </p>
            ) : null}
          </fieldset>
        ) : null}

        {/* Input Código Autorização — opcional */}
        {mostrarNsu ? (
          <div className="mt-4 space-y-1.5">
            <label
              htmlFor="payment-panel-nsu"
              className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Código Autorização
            </label>
            <Input
              id="payment-panel-nsu"
              data-testid="payment-panel-nsu"
              inputMode="numeric"
              autoComplete="off"
              placeholder="Opcional"
              className="border-border bg-secondary font-mono"
              aria-invalid={Boolean(formState.errors.autorizacao)}
              aria-describedby={
                formState.errors.autorizacao ? "payment-panel-nsu-error" : undefined
              }
              {...register("autorizacao", {
                setValueAs: (v: unknown) =>
                  String(v ?? "").replace(/\D/g, "").slice(0, 12),
              })}
            />
            {formState.errors.autorizacao ? (
              <p
                id="payment-panel-nsu-error"
                className="text-xs text-gym-danger"
                role="alert"
              >
                {formState.errors.autorizacao.message}
              </p>
            ) : null}
          </div>
        ) : null}

        {/* Botão Finalizar (RN-018) */}
        <Button
          type="submit"
          data-testid="payment-panel-finalizar"
          className="mt-4 w-full"
          disabled={disableFinalize}
          aria-disabled={disableFinalize}
        >
          {saving ? "Finalizando..." : finalizeLabel}
        </Button>
      </div>
    </form>
  );
}

function CollapsibleSection({
  id,
  title,
  open,
  onToggle,
  disabled = false,
  children,
}: {
  id: string;
  title: string;
  open: boolean;
  onToggle: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        id={`${id}-trigger`}
        aria-expanded={open}
        aria-controls={`${id}-content`}
        onClick={onToggle}
        disabled={disabled}
        className={cn(
          "flex w-full items-center justify-between py-2 text-left text-sm font-semibold",
          disabled ? "cursor-not-allowed opacity-60" : "",
        )}
      >
        <span>{title}</span>
        {open ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        )}
      </button>
      {open ? (
        <div id={`${id}-content`} className="pb-3">
          {children}
        </div>
      ) : null}
    </div>
  );
}
