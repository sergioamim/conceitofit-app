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

  const flow = useCommercialFlow({ tenantId });
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
  }, [alunos, alunosLoaded, loadAlunos, prefillClienteId, setClienteId, tenantContext]);

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
  // Estado aditivo: não altera o shape legado usado por SaleSummary.
  // ---------------------------------------------------------------------
  const [formaPagamento, setFormaPagamentoState] = useState<TipoFormaPagamento>("PIX");
  const [parcelas, setParcelasState] = useState<number>(1);
  const [autorizacao, setAutorizacaoState] = useState<string>("");

  const setParcelas = useCallback((next: number) => {
    const clamped = Math.min(12, Math.max(1, Math.floor(Number.isFinite(next) ? next : 1)));
    setParcelasState(clamped);
  }, []);

  const setAutorizacao = useCallback((next: string) => {
    setAutorizacaoState(String(next ?? "").replace(/\D/g, "").slice(0, 12));
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
  const nsuValid = !requiresNsu || autorizacao.trim().length >= 4;
  const valorParcela = useMemo(() => {
    const n = Math.max(1, parcelas || 1);
    return total > 0 ? total / n : 0;
  }, [parcelas, total]);

  /**
   * canFinalize (RN-005 + RN-013):
   *  - carrinho não-vazio e total > 0
   *  - se requireCliente (plano/serviço), clienteId presente
   *  - se crédito/débito, NSU ≥ 4 dígitos
   *  - forma de pagamento selecionada (sempre true: state tem default PIX)
   */
  const canFinalize = useMemo(() => {
    if (cart.length === 0) return false;
    if (total <= 0) return false;
    if (requireCliente && !clienteId) return false;
    if (!nsuValid) return false;
    return true;
  }, [cart.length, total, requireCliente, clienteId, nsuValid]);

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
      clearCart();
      // Invalidar cache de vendas para que a listagem reflita a nova venda
      if (tenantId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.vendas.all(tenantId) });
      }
      items.setSelectedItemId("");
      items.setItemQuery("");
      items.setQtd("1");
      // VUN-3.3: reset dos extras do PaymentPanel após confirmação.
      setFormaPagamentoState("PIX");
      setParcelasState(1);
      setAutorizacaoState("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao registrar venda");
    }
  }, [alunos, clearCart, clienteId, flow.cupomAppliedCode, flow.cupomPercent, items, processSale, queryClient, receipt, requireCliente, selectedPlano, tenantId]);

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

    // VUN-3.3 — Payment panel workspace extras
    formaPagamento,
    setFormaPagamento,
    parcelas,
    setParcelas,
    autorizacao,
    setAutorizacao,
    valorParcela,
    canFinalize,
  };
}
