import { useCallback, useEffect, useMemo, useState } from "react";
import { logger } from "@/lib/shared/logger";
import {
  createVendaService,
  listAlunosService,
  listConveniosService,
  listFormasPagamentoService,
  listPlanosService,
  validarVoucherCodigoService,
} from "@/lib/tenant/comercial/runtime";
import { getBusinessTodayIso } from "@/lib/business-date";
import { planoDryRun } from "@/lib/tenant/comercial/plano-flow";
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
  
  // Plano specific state
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
  const [manualDiscount, setManualDiscount] = useState(0);
  const [motivoDesconto, setMotivoDesconto] = useState("");
  const [isentarMatricula, setIsentarMatricula] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadAlunos = useCallback(async () => {
    if (!tenantId || alunosLoaded) return;
    try {
      const loaded = await listAlunosService({ tenantId });
      setAlunos(loaded);
      setAlunosLoaded(true);
    } catch (err) {
      logger.error("Failed to load alunos", { module: "commercial-flow", error: err });
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
      logger.error("Failed to load commercial data", { module: "commercial-flow", error: err });
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

  // Totals calculations via Dry-Run
  const dryRun = useMemo(() => {
    if (!selectedPlano) return null;
    return planoDryRun({
      plano: selectedPlano,
      dataInicio: dataInicioPlano,
      parcelasAnuidade: parseInt(parcelasAnuidade, 10) || 1,
      manualDiscount,
      motivoDesconto,
      couponPercent: cupomPercent,
      convenio: selectedConvenio ?? undefined,
      renovacaoAutomatica: renovacaoAutomaticaPlano,
      isentarMatricula,
    });
  }, [selectedPlano, dataInicioPlano, parcelasAnuidade, manualDiscount, motivoDesconto, cupomPercent, selectedConvenio, renovacaoAutomaticaPlano, isentarMatricula]);

  // Sync cart items with dry-run when it's a plan sale
  useEffect(() => {
    if (dryRun && cart.some(i => i.tipo === "PLANO")) {
      setCart((prev) => {
        const others = prev.filter(i => i.tipo !== "PLANO");
        const planoItems = dryRun.items.map(i => ({ ...i, tipo: "PLANO" as TipoVenda }));
        return [...planoItems, ...others];
      });
    }
  }, [dryRun]);

  const subtotal = useMemo(() => {
    const othersSubtotal = cart.filter(i => i.tipo !== "PLANO").reduce((sum, i) => sum + i.valorUnitario * i.quantidade, 0);
    return othersSubtotal + (dryRun?.subtotal ?? 0);
  }, [cart, dryRun]);

  const descontoTotal = useMemo(() => (dryRun?.descontoTotal ?? 0), [dryRun]);
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
    
    const initialDryRun = planoDryRun({
      plano,
      dataInicio: dataInicioPlano,
      parcelasAnuidade: safeParcelas,
      manualDiscount: 0,
      couponPercent: 0,
      renovacaoAutomatica: plano.permiteRenovacaoAutomatica ? renovacaoAutomaticaPlano : false,
    });

    setCart((prev) => {
      const semPlano = prev.filter((item) => item.tipo !== "PLANO");
      const planoItems = initialDryRun.items.map(item => ({
        ...item,
        tipo: "PLANO" as TipoVenda
      }));
      return [...planoItems, ...semPlano];
    });
  }, [dataInicioPlano, renovacaoAutomaticaPlano]);

  const refreshPlanoItems = useCallback((parcelas: number) => {
    if (!selectedPlano) return;
    const maxParcelas = Math.max(1, Number(selectedPlano.parcelasMaxAnuidade ?? 1));
    const safeParcelas = Math.min(maxParcelas, Math.max(1, parcelas));
    setParcelasAnuidade(String(safeParcelas));
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
    setIsentarMatricula(false);
    setCupomCode("");
    setCupomAppliedCode("");
    setCupomPercent(0);
    setCupomError("");
    setAcrescimoGeral("0");
    setManualDiscount(0);
    setMotivoDesconto("");
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
  const processSale = useCallback(async (pagamento: PagamentoVenda) => {
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
          convenioId: selectedConvenio?.id || undefined,
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
        },
      });
      return venda;
    } finally {
      setSaving(false);
    }
  }, [tenantId, cart, clienteId, selectedConvenio?.id, cupomAppliedCode, descontoTotal, acrescimoGeral]);

  return {
    alunos,
    planos,
    convenios,
    formasPagamento,
    loadingData,
    loadAlunos,
    alunosLoaded,
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
    cart,
    setCart,
    addPlanoToCart,
    refreshPlanoItems,
    addItemToCart,
    removeCartItem,
    clearCart,
    cupomCode,
    setCupomCode,
    cupomAppliedCode,
    cupomPercent,
    cupomError,
    applyCupom,
    acrescimoGeral,
    setAcrescimoGeral,
    manualDiscount,
    setManualDiscount,
    motivoDesconto,
    setMotivoDesconto,
    isentarMatricula,
    setIsentarMatricula,
    subtotal,
    descontoTotal,
    total,
    dryRun,
    saving,
    processSale,
  };
}
