"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { resolveAlunoTenantService } from "@/lib/tenant/comercial/runtime";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { useCommercialFlow } from "@/lib/tenant/hooks/use-commercial-flow";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import type { PagamentoVenda, Plano, Tenant, TipoFormaPagamento, TipoVenda } from "@/lib/types";
import type { SuggestionOption } from "@/components/shared/suggestion-input";

import { useBarcodeScanner } from "./use-barcode-scanner";
import { useSaleReceipt } from "./use-sale-receipt";
import { useSaleItems } from "./use-sale-items";

export type VendaWorkspace = ReturnType<typeof useVendaWorkspace>;

export function useVendaWorkspace() {
  const tenantContext = useTenantContext();
  const queryClient = useQueryClient();
  const [tenantId, setTenantId] = useState(() => tenantContext.tenantId);
  const tenantIdRef = useRef(tenantId);
  const [tenant, setTenant] = useState<Tenant | null>(tenantContext.tenant ?? null);
  const [tipoVenda, setTipoVenda] = useState<TipoVenda>("PLANO");

  // Declarado antes de `useCommercialFlow` porque o hook agora aceita a
  // forma atual como input para filtrar convênios elegíveis (Phase 2).
  // Setter abaixo mantém nome legado `setFormaPagamentoState`.
  const [formaPagamento, setFormaPagamentoState] = useState<TipoFormaPagamento>("PIX");

  const flow = useCommercialFlow({ tenantId, formaPagamento });
  const {
    alunos, planos, formasPagamento,
    loadAlunos, alunosLoaded,
    clienteId, setClienteId,
    selectedPlano, conveniosPlano, convenioPlanoId, setConvenioPlanoId,
    parcelasAnuidade, setParcelasAnuidade,
    dataInicioPlano, setDataInicioPlano,
    renovacaoAutomaticaPlano, setRenovacaoAutomaticaPlano,
    cart, addPlanoToCart, addItemToCart, clearCart, processSale,
    total,
  } = flow;

  // Extracted hooks
  const items = useSaleItems({
    tipoVenda,
    planos,
    addItemToCart,
    setTipoVenda,
  });

  const scanner = useBarcodeScanner(items.applyCodeToProduct);
  const receipt = useSaleReceipt();

  // Client selection
  const [clienteQuery, setClienteQuery] = useState("");
  const searchParams = useSearchParams();
  const prefillClienteId = searchParams.get("clienteId") ?? "";
  const prefillHandledRef = useRef(false);

  const clienteOptions = useMemo<SuggestionOption[]>(
    () =>
      alunos.map((a) => ({
        id: a.id,
        label: `${a.nome} · CPF ${a.cpf}`,
        searchText: `${a.nome} ${a.cpf}`,
      })),
    [alunos]
  );

  // Tenant sync
  useEffect(() => {
    tenantIdRef.current = tenantId;
  }, [tenantId]);

  useEffect(() => {
    const nextTenantId = tenantContext.tenantId || tenantIdRef.current;
    if (!nextTenantId) return;
    if (nextTenantId === tenantIdRef.current) {
      setTenant(tenantContext.tenant ?? null);
      return;
    }
    tenantIdRef.current = nextTenantId;
    setTenantId(nextTenantId);
    setTenant(tenantContext.tenant ?? null);
    prefillHandledRef.current = false;
    clearCart();
  }, [tenantContext.tenant, tenantContext.tenantId, clearCart]);

  // Tipo venda change resets item selection (RN-011 VUN-2.3: NÃO zerar carrinho).
  // Troca de aba PLANO/SERVIÇO/PRODUTO é filtro de catálogo — carrinho preserva
  // itens anteriores para permitir combo livre.
  useEffect(() => {
    items.setSelectedItemId("");
    items.setItemQuery("");
    items.setQtd("1");
  }, [tipoVenda]);

  // Prefill client from URL
  useEffect(() => {
    if (prefillClienteId && !alunosLoaded && tenantId) {
      loadAlunos();
    }
  }, [alunosLoaded, loadAlunos, prefillClienteId, tenantId]);

  useEffect(() => {
    if (!prefillClienteId || prefillHandledRef.current || !tenantIdRef.current) return;

    let cancelled = false;
    async function applyPrefillCliente() {
      if (!alunosLoaded) await loadAlunos();

      const currentTenantId = tenantIdRef.current;
      const alvoCarregado = alunos.find((a) => a.id === prefillClienteId);
      if (alvoCarregado) {
        if (cancelled) return;
        setClienteId(alvoCarregado.id);
        setClienteQuery(`${alvoCarregado.nome} · CPF ${alvoCarregado.cpf}`);
        prefillHandledRef.current = true;
        return;
      }

      const resolved = await resolveAlunoTenantService({
        alunoId: prefillClienteId,
        tenantId: currentTenantId,
        tenantIds: tenantContext.tenants.map((item) => item.id),
      });
      if (cancelled) return;
      if (!resolved) { prefillHandledRef.current = true; return; }
      if (resolved.tenantId !== currentTenantId) {
        await tenantContext.setTenant(resolved.tenantId);
        return;
      }
      setClienteId(resolved.aluno.id);
      setClienteQuery(`${resolved.aluno.nome} · CPF ${resolved.aluno.cpf}`);
      prefillHandledRef.current = true;
    }

    void applyPrefillCliente();
    return () => { cancelled = true; };
    // deps enxutos (valores, não o objeto `tenantContext`): passar o contexto
    // inteiro como dep fazia o effect re-disparar a cada render do provider
    // (objeto recriado), contribuindo pra loops de render em cascata e
    // "Maximum update depth exceeded" observados em 2026-04-22.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alunos, alunosLoaded, loadAlunos, prefillClienteId, setClienteId]);

  // Sync client query label
  useEffect(() => {
    if (!clienteId) return;
    const selected = clienteOptions.find((c) => c.id === clienteId);
    if (selected) setClienteQuery(selected.label);
  }, [clienteId, clienteOptions]);

  // Convenio reset
  useEffect(() => {
    if (convenioPlanoId === "__SEM_CONVENIO__") return;
    if (conveniosPlano.some((c) => c.id === convenioPlanoId)) return;
    setConvenioPlanoId("__SEM_CONVENIO__");
  }, [convenioPlanoId, conveniosPlano, setConvenioPlanoId]);

  const requireCliente = useMemo(
    () => cart.some((item) => item.tipo === "PLANO" || item.tipo === "SERVICO"),
    [cart]
  );

  // ---------------------------------------------------------------------
  // VUN-3.3 — Expansão do workspace: forma de pagamento, parcelas,
  // autorização (NSU) e flag canFinalize consumidos pelo PaymentPanel.
  // `formaPagamento` vive mais acima — é input do `useCommercialFlow`
  // desde a Phase 2 do convênio (filtro por forma).
  // ---------------------------------------------------------------------
  const [parcelas, setParcelasState] = useState<number>(1);
  const [autorizacao, setAutorizacaoState] = useState<string>("");

  /**
   * `saleCycleKey` — chave do ciclo de venda. Incrementada em
   * {@link handleReceiptClose}. Consumida como `key` no `<PaymentPanel />`
   * para forçar remount do formulário RHF a cada venda finalizada.
   *
   * Por quê: os 6 effects de sync form↔workspace do PaymentPanel fazem
   * ping-pong quando o workspace é resetado externamente (pós-venda) e o
   * form ainda está com o valor anterior — isso gerava "Maximum update
   * depth exceeded" em `setFormaPagamento` quando o usuário fechava o
   * recibo (inclusive via "Ver perfil do cliente", que também fecha).
   * Remontar o form com defaults do workspace resetado elimina a corrida
   * sem precisar reescrever os sync effects.
   */
  const [saleCycleKey, setSaleCycleKey] = useState(0);

  const setParcelas = useCallback((next: number) => {
    const clamped = Math.min(12, Math.max(1, Math.floor(Number.isFinite(next) ? next : 1)));
    setParcelasState(clamped);
  }, []);

  // Passthrough: a sanitização (só-dígitos + slice 12) é feita no RHF via
  // `setValueAs` no input de autorização (payment-panel.tsx). Duplicar aqui
  // gerava loop infinito no useEffect de sync form↔workspace quando as duas
  // rotinas divergiam por ordem de execução. Confiar numa única fonte
  // elimina o ping-pong.
  const setAutorizacao = useCallback((next: string) => {
    setAutorizacaoState(next ?? "");
  }, []);

  /**
   * Setter combinado: ao trocar a forma de pagamento, cuida dos resets
   * dependentes (parcelas → 1 se não for crédito; NSU → "" se não for
   * crédito/débito). Evita useEffect-cascades e satisfaz a regra
   * `react-hooks/set-state-in-effect`.
   */
  const setFormaPagamento = useCallback((next: TipoFormaPagamento) => {
    setFormaPagamentoState(next);
    if (next !== "CARTAO_CREDITO") {
      setParcelasState(1);
    }
    if (next !== "CARTAO_CREDITO" && next !== "CARTAO_DEBITO") {
      setAutorizacaoState("");
    }
  }, []);

  const requiresNsu = formaPagamento === "CARTAO_CREDITO" || formaPagamento === "CARTAO_DEBITO";
  // Código de autorização agora é opcional em qualquer forma de pagamento —
  // manter `nsuValid` sempre true preserva a shape pública do workspace sem
  // gate em `canFinalize`. Consumidores legados continuam recebendo true.
  const nsuValid = true;
  const valorParcela = useMemo(() => {
    const n = Math.max(1, parcelas || 1);
    return total > 0 ? total / n : 0;
  }, [parcelas, total]);

  /**
   * canFinalize (RN-013):
   *  - carrinho não-vazio e total > 0
   *  - se requireCliente (plano/serviço), clienteId presente
   *  - forma de pagamento selecionada (sempre true: state tem default PIX)
   *
   * Obs: código de autorização (NSU / auth do cartão) é opcional — não entra
   * neste gate. O PaymentPanel segue mostrando o input em cartões, mas sem
   * obrigatoriedade de preenchimento.
   */
  const canFinalize = useMemo(() => {
    if (cart.length === 0) return false;
    if (total <= 0) return false;
    if (requireCliente && !clienteId) return false;
    return true;
  }, [cart.length, total, requireCliente, clienteId]);

  function handleAddPlano(plano: Plano) {
    const maxParcelas = Math.max(1, Number(plano.parcelasMaxAnuidade ?? 1));
    const parcelas = Math.min(maxParcelas, Math.max(1, parseInt(parcelasAnuidade, 10) || 1));
    addPlanoToCart(plano, parcelas);
  }

  const handleConfirmPayment = useCallback(async (pagamento: PagamentoVenda) => {
    if (requireCliente && !clienteId) {
      alert("Cliente é obrigatório para venda de plano/serviço.");
      return;
    }
    try {
      const venda = await processSale(pagamento);
      const selectedCliente = alunos.find((a) => a.id === venda.clienteId) ?? null;
      const contratoAutoMsg =
        selectedPlano?.contratoTemplateHtml && selectedPlano.contratoEnviarAutomaticoEmail && selectedCliente?.email
          ? `Contrato enviado automaticamente para ${selectedCliente.email}.`
          : "";
      receipt.showReceipt({
        venda,
        cliente: selectedCliente,
        plano: selectedPlano ?? null,
        contratoAutoMsg,
        voucherCodigo: flow.cupomAppliedCode,
        voucherPercent: flow.cupomPercent,
      });
      // Cache invalidations podem (e devem) rodar logo — o usuário pode
      // abrir `/vendas` ou o perfil do cliente em outra aba enquanto o
      // recibo está aberto e esperar dados frescos. Nada aqui mexe em
      // state do PaymentPanel.
      if (tenantId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.vendas.all(tenantId) });
        const criouContrato = venda.tipo === "PLANO" && Boolean(venda.clienteId);
        if (criouContrato) {
          void queryClient.invalidateQueries({ queryKey: queryKeys.contratos.all(tenantId) });
          if (venda.clienteId) {
            void queryClient.invalidateQueries({
              queryKey: queryKeys.contratos.byAluno(tenantId, venda.clienteId),
            });
          }
        }
      }
      // NOTA: resets de carrinho/forma-pagamento/parcelas/autorização/
      // dataInício foram movidos pro `handleReceiptClose` (abaixo). Motivo:
      // fazer esses resets aqui — no mesmo tick em que o modal abre —
      // disparava cascata com os 6 useEffects de sync form↔workspace do
      // PaymentPanel E ainda re-renderizava o modal recém-montado. Na 2ª
      // venda consecutiva a cadeia batia "Maximum update depth exceeded"
      // no DialogOverlay. Resetar só após o usuário fechar o recibo deixa
      // o ciclo limpo: venda abre modal → modal fecha → cockpit reseta.
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao registrar venda");
    }
  }, [alunos, clienteId, flow.cupomAppliedCode, flow.cupomPercent, processSale, queryClient, receipt, requireCliente, selectedPlano, tenantId]);

  /**
   * Handler de fechamento do recibo (VUN-Onda-4 follow-up, 2026-04-22):
   * limpa carrinho + extras do PaymentPanel. Rodar no close (em vez de
   * no fim do confirm payment) elimina a corrida de re-renders que
   * disparava loop no DialogOverlay na 2ª venda consecutiva.
   */
  const handleReceiptClose = useCallback(() => {
    receipt.setReceiptOpen(false);
    clearCart();
    items.setSelectedItemId("");
    items.setItemQuery("");
    items.setQtd("1");
    setFormaPagamentoState("PIX");
    setParcelasState(1);
    setAutorizacaoState("");
    setDataInicioPlano("");
    // Bump da key do PaymentPanel: remonta o form RHF limpo, sem disputar
    // com os effects de sync form↔workspace. Ver comentário no
    // `saleCycleKey` acima.
    setSaleCycleKey((k) => k + 1);
  }, [clearCart, items, receipt, setDataInicioPlano]);

  return {
    ...flow,
    tenant,
    tipoVenda,
    setTipoVenda,

    // Items (extracted)
    servicos: items.servicos,
    produtos: items.produtos,
    selectedItemId: items.selectedItemId,
    setSelectedItemId: items.setSelectedItemId,
    itemQuery: items.itemQuery,
    setItemQuery: items.setItemQuery,
    qtd: items.qtd,
    setQtd: items.setQtd,
    itemOptions: items.itemOptions,
    addItem: items.addItem,
    applyCodeToProduct: items.applyCodeToProduct,

    // Scanner (extracted)
    ...scanner,

    // Receipt (extracted)
    ...receipt,

    // Client
    clienteQuery,
    setClienteQuery,
    clienteOptions,
    requireCliente,

    // Actions
    handleAddPlano,
    handleConfirmPayment,
    handleReceiptClose,

    // VUN-3.3 — Payment panel workspace extras
    formaPagamento,
    setFormaPagamento,
    parcelas,
    setParcelas,
    autorizacao,
    setAutorizacao,
    valorParcela,
    canFinalize,

    // Ciclo de venda — usado como `key` no PaymentPanel para remontar
    // o form a cada venda finalizada (evita loop de sync form↔workspace).
    saleCycleKey,
  };
}
