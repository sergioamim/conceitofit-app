"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { resolveAlunoTenantService } from "@/lib/tenant/comercial/runtime";
import { getBusinessTodayIso } from "@/lib/business-date";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { useCommercialFlow } from "@/lib/tenant/hooks/use-commercial-flow";
import type { PagamentoVenda, Plano, Tenant, TipoVenda } from "@/lib/types";
import type { SuggestionOption } from "@/components/shared/suggestion-input";

import { useBarcodeScanner } from "./use-barcode-scanner";
import { useSaleReceipt } from "./use-sale-receipt";
import { useSaleItems } from "./use-sale-items";

export type VendaWorkspace = ReturnType<typeof useVendaWorkspace>;

export function useVendaWorkspace() {
  const tenantContext = useTenantContext();
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

  // Tipo venda change resets item selection
  useEffect(() => {
    items.setSelectedItemId("");
    items.setItemQuery("");
    items.setQtd("1");
    if (tipoVenda !== "PLANO") {
      clearCart();
      setDataInicioPlano(getBusinessTodayIso());
    }
  }, [tipoVenda, clearCart, setDataInicioPlano]);

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
      const venda = await processSale({ ...pagamento, status: "PAGO" });
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
      items.setSelectedItemId("");
      items.setItemQuery("");
      items.setQtd("1");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao registrar venda");
    }
  }, [alunos, clearCart, clienteId, flow.cupomAppliedCode, flow.cupomPercent, items, processSale, receipt, requireCliente, selectedPlano]);

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
  };
}
