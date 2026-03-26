"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createVendaService,
  listAlunosService,
  listConveniosService,
  listFormasPagamentoService,
  listPlanosService,
  validarVoucherCodigoService,
} from "@/lib/comercial/runtime";
import { getBusinessTodayIso } from "@/lib/business-date";
import { buildPlanoVendaItems } from "@/lib/comercial/plano-flow";
import type {
  Aluno,
  Convenio,
  FormaPagamento,
  PagamentoVenda,
  Plano,
  TipoVenda,
  Venda,
} from "@/lib/types";

export interface CartItem {
  tipo: TipoVenda;
  referenciaId: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  desconto: number;
  detalhes?: string;
}

export interface UseCommercialFlowProps {
  tenantId: string | null;
  initialClienteId?: string;
}

export function useCommercialFlow({ tenantId, initialClienteId }: UseCommercialFlowProps) {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([]);
  
  const [loadingData, setLoadingData] = useState(false);
  const [alunosLoaded, setAlunosLoaded] = useState(false);

  const [clienteId, setClienteId] = useState(initialClienteId ?? "");
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Plano specific state (if a plano is in cart)
  const [selectedPlanoId, setSelectedPlanoId] = useState("");
  const [parcelasAnuidade, setParcelasAnuidade] = useState("1");
  const [dataInicioPlano, setDataInicioPlano] = useState(() => getBusinessTodayIso());
  const [renovacaoAutomaticaPlano, setRenovacaoAutomaticaPlano] = useState(false);
  const [convenioPlanoId, setConvenioPlanoId] = useState("__SEM_CONVENIO__");

  // Cupom state
  const [cupomCode, setCupomCode] = useState("");
  const [cupomAppliedCode, setCupomAppliedCode] = useState("");
  const [cupomPercent, setCupomPercent] = useState(0);
  const [cupomError, setCupomError] = useState("");
  
  const [acrescimoGeral, setAcrescimoGeral] = useState("0");
  const [saving, setSaving] = useState(false);

  const loadAlunos = useCallback(async () => {
    if (!tenantId || alunosLoaded) return;
    try {
      const loaded = await listAlunosService({ tenantId });
      setAlunos(loaded);
      setAlunosLoaded(true);
    } catch (err) {
      console.error("Failed to load alunos", err);
    }
  }, [alunosLoaded, tenantId]);

  const loadInitialData = useCallback(async () => {
    if (!tenantId) return;
    setLoadingData(true);
    try {
      const [pls, cvs, fps] = await Promise.all([
        listPlanosService({ tenantId, apenasAtivos: true }),
        listConveniosService(true),
        listFormasPagamentoService({ tenantId }),
      ]);
      setPlanos(pls.filter(p => p.ativo));
      setConvenios(cvs);
      setFormasPagamento(fps);
    } catch (err) {
      console.error("Failed to load commercial data", err);
    } finally {
      setLoadingData(false);
    }
  }, [tenantId]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const selectedPlano = useMemo(
    () => planos.find((plano) => plano.id === selectedPlanoId),
    [planos, selectedPlanoId]
  );

  const conveniosPlano = useMemo(
    () =>
      selectedPlano
        ? convenios.filter((convenio) => (convenio.planoIds ?? []).includes(selectedPlano.id))
        : [],
    [convenios, selectedPlano]
  );

  const selectedConvenio = useMemo(
    () =>
      convenioPlanoId !== "__SEM_CONVENIO__"
        ? conveniosPlano.find((convenio) => convenio.id === convenioPlanoId) ?? null
        : null,
    [convenioPlanoId, conveniosPlano]
  );

  // Totals calculations
  const subtotal = useMemo(
    () => cart.reduce((sum, i) => sum + i.valorUnitario * i.quantidade, 0),
    [cart]
  );

  const descontoCupom = useMemo(() => (subtotal * cupomPercent) / 100, [subtotal, cupomPercent]);
  
  const descontoConvenioPlano = useMemo(() => {
    if (!selectedPlano || !selectedConvenio) return 0;
    return (Number(selectedPlano.valor ?? 0) * selectedConvenio.descontoPercentual) / 100;
  }, [selectedConvenio, selectedPlano]);

  const descontoTotal = descontoCupom + descontoConvenioPlano;
  const acrescimoTotal = parseFloat(acrescimoGeral) || 0;
  const total = Math.max(0, subtotal - descontoTotal + acrescimoTotal);

  // Cart Actions
  const addPlanoToCart = useCallback((plano: Plano, parcelas: number = 1) => {
    const maxParcelas = Math.max(1, Number(plano.parcelasMaxAnuidade ?? 1));
    const safeParcelas = Math.min(maxParcelas, Math.max(1, parcelas));
    
    setSelectedPlanoId(plano.id);
    setParcelasAnuidade(String(safeParcelas));
    setConvenioPlanoId("__SEM_CONVENIO__");
    if (!plano.permiteRenovacaoAutomatica) {
      setRenovacaoAutomaticaPlano(false);
    }
    
    setCart((prev) => {
      const semPlano = prev.filter((item) => item.tipo !== "PLANO");
      const planoItems = buildPlanoVendaItems(plano, safeParcelas).map(item => ({
        ...item,
        tipo: "PLANO" as TipoVenda
      }));
      return [...planoItems, ...semPlano];
    });
  }, []);

  const refreshPlanoItems = useCallback((parcelas: number) => {
    if (!selectedPlano) return;
    const maxParcelas = Math.max(1, Number(selectedPlano.parcelasMaxAnuidade ?? 1));
    const safeParcelas = Math.min(maxParcelas, Math.max(1, parcelas));
    setParcelasAnuidade(String(safeParcelas));
    
    setCart((prev) => {
      const semPlano = prev.filter((item) => item.tipo !== "PLANO");
      const planoItems = buildPlanoVendaItems(selectedPlano, safeParcelas).map(item => ({
        ...item,
        tipo: "PLANO" as TipoVenda
      }));
      return [...planoItems, ...semPlano];
    });
  }, [selectedPlano]);

  const addItemToCart = useCallback((item: CartItem) => {
    setCart((prev) => [...prev, item]);
  }, []);

  const removeCartItem = useCallback((index: number) => {
    setCart((prev) => {
      const target = prev[index];
      if (target?.tipo === "PLANO") {
        setSelectedPlanoId("");
        setParcelasAnuidade("1");
        setConvenioPlanoId("__SEM_CONVENIO__");
        setRenovacaoAutomaticaPlano(false);
        return prev.filter((item) => item.tipo !== "PLANO");
      }
      return prev.filter((_, idx) => idx !== index);
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setSelectedPlanoId("");
    setParcelasAnuidade("1");
    setConvenioPlanoId("__SEM_CONVENIO__");
    setRenovacaoAutomaticaPlano(false);
    setCupomCode("");
    setCupomAppliedCode("");
    setCupomPercent(0);
    setCupomError("");
    setAcrescimoGeral("0");
  }, []);

  // Cupom Actions
  const applyCupom = useCallback(async (code: string) => {
    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode) {
      setCupomPercent(0);
      setCupomAppliedCode("");
      setCupomError("");
      return;
    }
    try {
      const result = await validarVoucherCodigoService({
        codigo: normalizedCode,
        tenantId: tenantId ?? undefined,
        clienteId: clienteId || undefined,
        planoId: selectedPlanoId || undefined,
      });
      if (!result.valido) {
        setCupomError(result.mensagem || "Cupom inválido para esta venda.");
        setCupomAppliedCode("");
        setCupomPercent(0);
        return;
      }
      if (result.planoIds?.length && selectedPlanoId && !result.planoIds.includes(selectedPlanoId)) {
        setCupomError("Este cupom não é válido para o plano selecionado.");
        setCupomAppliedCode("");
        setCupomPercent(0);
        return;
      }
      setCupomAppliedCode(normalizedCode);
      setCupomPercent(result.descontoPercentual);
      setCupomError("");
    } catch {
      setCupomError("Não foi possível validar o cupom. Tente novamente.");
      setCupomAppliedCode("");
      setCupomPercent(0);
    }
  }, [tenantId, clienteId, selectedPlanoId]);

  // Checkout Action
  const processSale = useCallback(async (pagamento: PagamentoVenda, extra?: {
    motivoDesconto?: string;
    descontoPlanoManual?: number;
  }) => {
    if (!tenantId) throw new Error("Tenant ativo não encontrado.");
    if (cart.length === 0) throw new Error("Adicione ao menos um item à venda.");

    setSaving(true);
    try {
      const tipoFinal = cart.some(i => i.tipo === "PLANO") ? "PLANO" : 
                         cart.some(i => i.tipo === "SERVICO") ? "SERVICO" : "PRODUTO";
      
      const venda = await createVendaService({
        tenantId,
        data: {
          tipo: tipoFinal as TipoVenda,
          clienteId: clienteId || undefined,
          voucherCodigo: cupomAppliedCode || undefined,
          itens: cart.map((i) => ({
            tipo: i.tipo,
            referenciaId: i.referenciaId,
            descricao: i.descricao,
            quantidade: i.quantidade,
            valorUnitario: i.valorUnitario,
            desconto: i.desconto,
          })),
          descontoTotal,
          acrescimoTotal: parseFloat(acrescimoGeral) || 0,
          pagamento: {
            ...pagamento,
          },
          planoContexto:
            tipoFinal === "PLANO" && selectedPlano
              ? {
                  planoId: selectedPlano.id,
                  dataInicio: dataInicioPlano,
                  descontoPlano: cupomPercent || (extra?.descontoPlanoManual ?? 0),
                  motivoDesconto: extra?.motivoDesconto,
                  renovacaoAutomatica: renovacaoAutomaticaPlano,
                  convenioId: selectedConvenio?.id,
                }
              : undefined,
        },
      });
      return venda;
    } finally {
      setSaving(false);
    }
  }, [tenantId, cart, clienteId, descontoTotal, acrescimoGeral, selectedPlano, dataInicioPlano, renovacaoAutomaticaPlano, selectedConvenio?.id, cupomAppliedCode, cupomPercent]);

  return {
    // Data
    alunos,
    planos,
    convenios,
    formasPagamento,
    loadingData,
    loadAlunos,
    alunosLoaded,
    
    // Selection state
    clienteId,
    setClienteId,
    selectedPlanoId,
    selectedPlano,
    conveniosPlano,
    selectedConvenio,
    convenioPlanoId,
    setConvenioPlanoId,
    parcelasAnuidade,
    setParcelasAnuidade,
    dataInicioPlano,
    setDataInicioPlano,
    renovacaoAutomaticaPlano,
    setRenovacaoAutomaticaPlano,
    
    // Cart
    cart,
    setCart,
    addPlanoToCart,
    refreshPlanoItems,
    addItemToCart,
    removeCartItem,
    clearCart,
    
    // Cupom & Totals
    cupomCode,
    setCupomCode,
    cupomAppliedCode,
    cupomPercent,
    cupomError,
    applyCupom,
    acrescimoGeral,
    setAcrescimoGeral,
    subtotal,
    descontoTotal,
    total,
    
    // Checkout
    saving,
    processSale,
  };
}
