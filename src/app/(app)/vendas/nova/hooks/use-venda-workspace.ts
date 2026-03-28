"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  listAlunosService,
  listProdutosService,
  resolveAlunoTenantService,
  listServicosService,
} from "@/lib/tenant/comercial/runtime";
import { getBusinessTodayIso } from "@/lib/business-date";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { useCommercialFlow } from "@/lib/tenant/hooks/use-commercial-flow";
import type { Aluno, Plano, Produto, Servico, Tenant, TipoVenda, Venda } from "@/lib/types";
import { formatBRL } from "@/lib/formatters";
import { SuggestionOption } from "@/components/shared/suggestion-input";

export interface CartItem {
  tipo: TipoVenda;
  referenciaId: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  desconto: number;
  detalhes?: string;
}

export interface DetectResult {
  rawValue: string;
}

export type VendaWorkspace = ReturnType<typeof useVendaWorkspace>;

export function useVendaWorkspace() {
  const tenantContext = useTenantContext();
  const [tenantId, setTenantId] = useState(() => tenantContext.tenantId);
  const tenantIdRef = useRef(tenantId);
  const [tenant, setTenant] = useState<Tenant | null>(tenantContext.tenant ?? null);
  const [tipoVenda, setTipoVenda] = useState<TipoVenda>("PLANO");

  const flow = useCommercialFlow({
    tenantId,
  });

  const {
    alunos,
    planos,
    convenios,
    formasPagamento,
    loadAlunos,
    alunosLoaded,
    clienteId,
    setClienteId,
    selectedPlano,
    conveniosPlano,
    convenioPlanoId,
    setConvenioPlanoId,
    parcelasAnuidade,
    setParcelasAnuidade,
    dataInicioPlano,
    setDataInicioPlano,
    renovacaoAutomaticaPlano,
    setRenovacaoAutomaticaPlano,
    cart,
    addPlanoToCart,
    refreshPlanoItems,
    addItemToCart,
    clearCart,
    processSale,
  } = flow;

  const [servicos, setServicos] = useState<Servico[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [clienteQuery, setClienteQuery] = useState("");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [itemQuery, setItemQuery] = useState("");
  const [qtd, setQtd] = useState("1");

  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptVenda, setReceiptVenda] = useState<Venda | null>(null);
  const [receiptCliente, setReceiptCliente] = useState<Aluno | null>(null);
  const [receiptPlano, setReceiptPlano] = useState<Plano | null>(null);
  const [receiptContratoAutoMsg, setReceiptContratoAutoMsg] = useState("");
  const [receiptVoucherCodigo, setReceiptVoucherCodigo] = useState("");
  const [receiptVoucherPercent, setReceiptVoucherPercent] = useState(0);

  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const [manualCode, setManualCode] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const searchParams = useSearchParams();
  const prefillClienteId = searchParams.get("clienteId") ?? "";
  const prefillHandledRef = useRef(false);
  const [servicosLoaded, setServicosLoaded] = useState(false);
  const [produtosLoaded, setProdutosLoaded] = useState(false);

  const loadServicos = useCallback(async () => {
    if (servicosLoaded) return;
    const servicosResponse = await listServicosService(true);
    setServicos(servicosResponse);
    setServicosLoaded(true);
  }, [servicosLoaded]);

  const loadProdutos = useCallback(async () => {
    if (produtosLoaded) return;
    const produtosResponse = await listProdutosService(true);
    setProdutos(produtosResponse);
    setProdutosLoaded(true);
  }, [produtosLoaded]);

  const syncTenantFromContext = useCallback(() => {
    const nextTenantId = tenantContext.tenantId || tenantIdRef.current;
    if (!nextTenantId) return;
    if (nextTenantId === tenantIdRef.current) {
      setTenant(tenantContext.tenant ?? null);
      return;
    }

    tenantIdRef.current = nextTenantId;
    setTenantId(nextTenantId);
    setTenant(tenantContext.tenant ?? null);
    setServicos([]);
    setProdutos([]);
    setServicosLoaded(false);
    setProdutosLoaded(false);
    prefillHandledRef.current = false;
    clearCart();
  }, [tenantContext.tenant, tenantContext.tenantId, clearCart]);

  useEffect(() => {
    tenantIdRef.current = tenantId;
  }, [tenantId]);

  useEffect(() => {
    syncTenantFromContext();
  }, [syncTenantFromContext]);

  useEffect(() => {
    if (prefillClienteId && !alunosLoaded && tenantId) {
      loadAlunos();
    }
  }, [alunosLoaded, loadAlunos, prefillClienteId, tenantId]);

  useEffect(() => {
    if (tipoVenda === "SERVICO") void loadServicos();
    if (tipoVenda === "PRODUTO") void loadProdutos();
  }, [tipoVenda, loadProdutos, loadServicos]);

  useEffect(() => {
    setSelectedItemId("");
    setItemQuery("");
    setQtd("1");
    if (tipoVenda !== "PLANO") {
      clearCart();
      setDataInicioPlano(getBusinessTodayIso());
    }
  }, [tipoVenda, clearCart, setDataInicioPlano]);

  useEffect(() => {
    if (!prefillClienteId || prefillHandledRef.current || !tenantIdRef.current) return;

    let cancelled = false;
    async function applyPrefillCliente() {
      if (!alunosLoaded) {
        await loadAlunos();
      }

      const currentTenantId = tenantIdRef.current;
      const alvoCarregado = alunos.find((aluno) => aluno.id === prefillClienteId);
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
      if (!resolved) {
        prefillHandledRef.current = true;
        return;
      }
      if (resolved.tenantId !== currentTenantId) {
        await tenantContext.setTenant(resolved.tenantId);
        return;
      }

      setClienteId(resolved.aluno.id);
      setClienteQuery(`${resolved.aluno.nome} · CPF ${resolved.aluno.cpf}`);
      prefillHandledRef.current = true;
    }

    void applyPrefillCliente();
    return () => {
      cancelled = true;
    };
  }, [alunos, alunosLoaded, loadAlunos, prefillClienteId, setClienteId, tenantContext]);

  const options = useMemo(() => {
    if (tipoVenda === "PLANO") {
      return planos.map((p) => ({ id: p.id, nome: p.nome, valor: Number(p.valor ?? 0), searchText: p.nome }));
    }
    if (tipoVenda === "SERVICO") {
      return servicos.map((s) => ({ id: s.id, nome: s.nome, valor: Number(s.valor ?? 0), searchText: `${s.nome} ${s.sku ?? ""}` }));
    }
    return produtos.map((p) => ({
      id: p.id,
      nome: p.nome,
      valor: Number(p.valorVenda ?? 0),
      codigoBarras: p.codigoBarras,
      sku: p.sku,
      searchText: `${p.nome} ${p.sku ?? ""} ${p.codigoBarras ?? ""}`,
    }));
  }, [tipoVenda, planos, servicos, produtos]);

  const clienteOptions = useMemo<SuggestionOption[]>(
    () =>
      alunos.map((a) => ({
        id: a.id,
        label: `${a.nome} · CPF ${a.cpf}`,
        searchText: `${a.nome} ${a.cpf}`,
      })),
    [alunos]
  );

  const itemOptions = useMemo<SuggestionOption[]>(
    () =>
      options.map((o) => ({
        id: o.id,
        label: `${o.nome} · ${formatBRL(o.valor)}`,
        searchText: `${o.searchText ?? ""}`,
      })),
    [options]
  );

  useEffect(() => {
    if (!clienteId) return;
    const selected = clienteOptions.find((c) => c.id === clienteId);
    if (selected) setClienteQuery(selected.label);
  }, [clienteId, clienteOptions]);

  useEffect(() => {
    if (!selectedItemId) return;
    const selected = itemOptions.find((o) => o.id === selectedItemId);
    if (selected) setItemQuery(selected.label);
  }, [selectedItemId, itemOptions]);

  useEffect(() => {
    if (convenioPlanoId === "__SEM_CONVENIO__") return;
    if (conveniosPlano.some((convenio) => convenio.id === convenioPlanoId)) return;
    setConvenioPlanoId("__SEM_CONVENIO__");
  }, [convenioPlanoId, conveniosPlano, setConvenioPlanoId]);

  const requireCliente = useMemo(
    () => cart.some((item) => item.tipo === "PLANO" || item.tipo === "SERVICO"),
    [cart]
  );

  function addItem() {
    const selected = options.find((o) => o.id === selectedItemId);
    if (!selected) return;

    const item: CartItem = {
      tipo: tipoVenda,
      referenciaId: selected.id,
      descricao: selected.nome,
      quantidade: Math.max(1, parseInt(qtd, 10) || 1),
      valorUnitario: selected.valor,
      desconto: 0,
    };

    addItemToCart(item);
  }

  function handleAddPlano(plano: Plano) {
    const maxParcelas = Math.max(1, Number(plano.parcelasMaxAnuidade ?? 1));
    const parcelas = Math.min(maxParcelas, Math.max(1, parseInt(parcelasAnuidade, 10) || 1));
    addPlanoToCart(plano, parcelas);
  }

  function clearScannerResources() {
    if (scanIntervalRef.current) {
      window.clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }

  const applyCodeToProduct = useCallback((code: string): boolean => {
    const normalized = code.trim().toUpperCase();
    if (!normalized) return false;

    const match = produtos.find((p) => {
      const cb = p.codigoBarras?.trim().toUpperCase();
      const sku = p.sku?.trim().toUpperCase();
      return cb === normalized || sku === normalized;
    });

    if (!match) return false;

    if (tipoVenda !== "PRODUTO") {
      setTipoVenda("PRODUTO");
    }
    setSelectedItemId(match.id);
    setItemQuery(`${match.nome} · ${formatBRL(Number(match.valorVenda ?? 0))}`);
    return true;
  }, [produtos, tipoVenda]);

  useEffect(() => {
    if (!scannerOpen) {
      clearScannerResources();
      return;
    }

    let cancelled = false;
    async function startScanner() {
      setScannerError("");
      try {
        if (!navigator?.mediaDevices?.getUserMedia) {
          setScannerError("Câmera não disponível neste dispositivo/navegador.");
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        const Detector = (window as any).BarcodeDetector;
        if (!Detector) {
          setScannerError("Leitura automática não suportada. Use o campo de código manual.");
          return;
        }

        const detector = new Detector({
          formats: ["ean_13", "ean_8", "code_128", "upc_a", "upc_e"],
        });

        scanIntervalRef.current = window.setInterval(async () => {
          if (!videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes.length === 0) return;
            const codeValue = codes[0]?.rawValue ?? "";
            if (applyCodeToProduct(codeValue)) {
              setScannerOpen(false);
            } else {
              setScannerError(`Código ${codeValue} não encontrado nos produtos.`);
            }
          } catch {
            setScannerError("Não foi possível ler o código. Tente novamente.");
          }
        }, 600);
      } catch {
        setScannerError("Não foi possível acessar a câmera.");
      }
    }

    startScanner();
    return () => {
      cancelled = true;
      clearScannerResources();
    };
  }, [applyCodeToProduct, scannerOpen]);

  return {
    ...flow,
    tenant,
    tipoVenda,
    setTipoVenda,
    servicos,
    produtos,
    clienteQuery,
    setClienteQuery,
    selectedItemId,
    setSelectedItemId,
    itemQuery,
    setItemQuery,
    qtd,
    setQtd,
    receiptOpen,
    setReceiptOpen,
    receiptVenda,
    setReceiptVenda,
    receiptCliente,
    setReceiptCliente,
    receiptPlano,
    setReceiptPlano,
    receiptContratoAutoMsg,
    setReceiptContratoAutoMsg,
    receiptVoucherCodigo,
    setReceiptVoucherCodigo,
    receiptVoucherPercent,
    setReceiptVoucherPercent,
    scannerOpen,
    setScannerOpen,
    scannerError,
    setScannerError,
    manualCode,
    setManualCode,
    videoRef,
    clienteOptions,
    itemOptions,
    requireCliente,
    addItem,
    handleAddPlano,
    applyCodeToProduct,
    handleConfirmPayment: async (pagamento: PagamentoVenda) => {
      if (requireCliente && !clienteId) {
        alert("Cliente é obrigatório para venda de plano/serviço.");
        return;
      }

      try {
        const venda = await processSale({
          ...pagamento,
          status: "PAGO",
        });

        const selectedCliente = alunos.find((a) => a.id === venda.clienteId) ?? null;
        setReceiptVenda(venda);
        setReceiptCliente(selectedCliente);
        setReceiptPlano(selectedPlano ?? null);
        setReceiptVoucherCodigo(flow.cupomAppliedCode);
        setReceiptVoucherPercent(flow.cupomPercent);
        if (selectedPlano?.contratoTemplateHtml && selectedPlano.contratoEnviarAutomaticoEmail && selectedCliente?.email) {
          setReceiptContratoAutoMsg(`Contrato enviado automaticamente para ${selectedCliente.email}.`);
        } else {
          setReceiptContratoAutoMsg("");
        }
        setReceiptOpen(true);
        clearCart();
        setSelectedItemId("");
        setItemQuery("");
        setQtd("1");
      } catch (err) {
        alert(err instanceof Error ? err.message : "Erro ao registrar venda");
      }
    },
  };
}
