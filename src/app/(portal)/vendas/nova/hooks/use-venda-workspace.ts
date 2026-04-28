"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getAlunoApi } from "@/lib/api/alunos";
import { getCaixaAtivo } from "@/lib/api/caixa";
import { isCaixaApiError } from "@/lib/api/caixa-error-handler";
import { useToast } from "@/components/ui/use-toast";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { useCommercialFlow } from "@/lib/tenant/hooks/use-commercial-flow";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import type { PagamentoVenda, Plano, Tenant, TipoFormaPagamento, TipoVenda } from "@/lib/types";
import type { SuggestionOption } from "@/components/shared/suggestion-input";
import type { CaixaResponse, SaldoParcialResponse } from "@/lib/api/caixa.types";

/**
 * Estado pendente quando backend rejeita venda por restrição de caixa
 * (409 CAIXA_DIA_ANTERIOR ou CAIXA_NAO_ABERTO). Cockpit renderiza modal
 * com ações dependendo do `kind`:
 *  - DIA_ANTERIOR: 3 ações (Continuar / Conferir+Fechar+Abrir / Cancelar)
 *  - NAO_ABERTO:   2 ações (Abrir caixa inline / Cancelar)
 *
 * `caixaAtivo` e `saldoAtual` só são populados em DIA_ANTERIOR.
 */
export interface VendaCaixaDiaAnteriorPendente {
  kind: "DIA_ANTERIOR" | "NAO_ABERTO";
  caixaAtivo: CaixaResponse | null;
  saldoAtual: SaldoParcialResponse | null;
  pagamentoRetry: PagamentoVenda;
}

import { useBarcodeScanner } from "./use-barcode-scanner";
import { useSaleReceipt } from "./use-sale-receipt";
import { useSaleItems } from "./use-sale-items";

export type VendaWorkspace = ReturnType<typeof useVendaWorkspace>;

export function useVendaWorkspace() {
  const { toast } = useToast();
  const tenantContext = useTenantContext();
  const queryClient = useQueryClient();
  // Fonte única de verdade: o tenant ativo da sessão (via TenantContext).
  // Antes mantinhamos um `useState` local inicializado no mount, o que
  // permitia que requests de venda saíssem com um tenantId stale após
  // troca de unidade/sandbox. Agora sempre espelha o contexto.
  const tenantId = tenantContext.tenantId ?? "";
  const tenantIdRef = useRef(tenantId);
  const tenant = tenantContext.tenant ?? null;
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

  // Sincroniza ref + reseta prefill/cart quando o tenant ativo muda.
  // Troca de tenant (ex: usuário trocou de unidade) invalida carrinho em
  // montagem — itens de um tenant não podem migrar pra outro.
  useEffect(() => {
    if (!tenantId) return;
    if (tenantId === tenantIdRef.current) return;
    tenantIdRef.current = tenantId;
    prefillHandledRef.current = false;
    clearCart();
  }, [tenantId, clearCart]);

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
      const currentTenantId = tenantIdRef.current;
      if (!currentTenantId) return;

      try {
        // Busca direta por ID tenant-scoped — simples e determinística.
        // Evita depender de `alunos` do closure (stale no cache) e não troca
        // o tenant ativo da sessão silenciosamente: se o aluno não pertence
        // ao tenant atual, o prefill é ignorado e o usuário precisa buscá-lo
        // manualmente (ou corrigir o contexto de unidade).
        const aluno = await getAlunoApi({ tenantId: currentTenantId, id: prefillClienteId });
        if (cancelled) return;
        setClienteId(aluno.id);
        setClienteQuery(`${aluno.nome} · CPF ${aluno.cpf ?? ""}`);
        prefillHandledRef.current = true;
      } catch {
        if (cancelled) return;
        // 404 / erro: aluno não existe neste tenant ativo. Não trocamos de
        // tenant — a sessão do usuário é a fonte de verdade. Apenas marca
        // como tratado para não retentar em loop.
        prefillHandledRef.current = true;
      }
    }

    void applyPrefillCliente();
    return () => { cancelled = true; };
  }, [prefillClienteId, setClienteId, tenantId]);

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

  // Wave A1: estado pendente quando backend rejeita venda com 409
  // CAIXA_DIA_ANTERIOR. Cockpit renderiza modal com 3 ações.
  const [caixaDiaAnteriorPendente, setCaixaDiaAnteriorPendente] =
    useState<VendaCaixaDiaAnteriorPendente | null>(null);

  const executarVenda = useCallback(async (
    pagamento: PagamentoVenda,
    options?: { aceitarCaixaDiaAnterior?: boolean },
  ) => {
    const venda = await processSale(pagamento, options);
    let selectedCliente = alunos.find((a) => a.id === venda.clienteId) ?? null;
    if (!selectedCliente && venda.clienteId && tenantId) {
      try {
        selectedCliente = await getAlunoApi({ tenantId, id: venda.clienteId });
      } catch {
        selectedCliente = null;
      }
    }
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
  }, [alunos, flow.cupomAppliedCode, flow.cupomPercent, processSale, queryClient, receipt, selectedPlano, tenantId]);

  const handleConfirmPayment = useCallback(async (pagamento: PagamentoVenda) => {
    if (requireCliente && !clienteId) {
      toast({
        variant: "destructive",
        title: "Cliente obrigatório",
        description: "Cliente é obrigatório para venda de plano/serviço.",
      });
      return;
    }
    try {
      await executarVenda(pagamento);
    } catch (err) {
      // 409 CAIXA_DIA_ANTERIOR: carrega ativo (com saldo) pra alimentar o
      // FecharCaixaModal caso operador escolha "Conferir e fechar".
      if (isCaixaApiError(err) && err.code === "CAIXA_DIA_ANTERIOR") {
        try {
          const ativo = await getCaixaAtivo();
          if (ativo) {
            setCaixaDiaAnteriorPendente({
              kind: "DIA_ANTERIOR",
              caixaAtivo: ativo.caixa,
              saldoAtual: ativo.saldo,
              pagamentoRetry: pagamento,
            });
            return;
          }
        } catch {
          // Falha ao carregar caixa — cai no toast genérico abaixo.
        }
      }
      // 409 CAIXA_NAO_ABERTO: nao ha caixa pra fechar; abre direto o
      // formulario de abertura inline e re-tenta a venda apos abrir.
      if (isCaixaApiError(err) && err.code === "CAIXA_NAO_ABERTO") {
        setCaixaDiaAnteriorPendente({
          kind: "NAO_ABERTO",
          caixaAtivo: null,
          saldoAtual: null,
          pagamentoRetry: pagamento,
        });
        return;
      }
      toast({
        variant: "destructive",
        title: "Erro ao registrar venda",
        description: err instanceof Error ? err.message : "Erro ao registrar venda",
      });
    }
  }, [clienteId, executarVenda, requireCliente, toast]);

  /** Wave A1: usuário confirmou "Continuar venda assim mesmo". */
  const handleConfirmarVendaDiaAnterior = useCallback(async () => {
    const pendente = caixaDiaAnteriorPendente;
    if (!pendente) return;
    setCaixaDiaAnteriorPendente(null);
    try {
      await executarVenda(pendente.pagamentoRetry, { aceitarCaixaDiaAnterior: true });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro ao registrar venda",
        description: err instanceof Error ? err.message : "Erro ao registrar venda",
      });
    }
  }, [caixaDiaAnteriorPendente, executarVenda, toast]);

  /** Wave A1: usuário cancelou — fecha modal sem efeito. */
  const handleCancelarVendaDiaAnterior = useCallback(() => {
    setCaixaDiaAnteriorPendente(null);
  }, []);

  /**
   * Caixa novo aberto inline (apos fechamento ou direto em NAO_ABERTO).
   * Reexecuta a venda original. Sem flag aceitarCaixaDiaAnterior porque
   * agora ha um caixa fresco do dia.
   */
  const handleNovoCaixaAberto = useCallback(async () => {
    const pendente = caixaDiaAnteriorPendente;
    if (!pendente) return;
    setCaixaDiaAnteriorPendente(null);
    toast({
      title: "Caixa aberto",
      description: "Refazendo a venda automaticamente.",
    });
    try {
      await executarVenda(pendente.pagamentoRetry);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro ao registrar venda",
        description: err instanceof Error ? err.message : "Erro ao registrar venda",
      });
    }
  }, [caixaDiaAnteriorPendente, executarVenda, toast]);

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

    // Modal de bloqueio por caixa (DIA_ANTERIOR ou NAO_ABERTO)
    caixaDiaAnteriorPendente,
    handleConfirmarVendaDiaAnterior,
    handleCancelarVendaDiaAnterior,
    handleNovoCaixaAberto,

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
