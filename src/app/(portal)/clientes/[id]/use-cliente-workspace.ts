"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { getNfseConfiguracaoAtualApi } from "@/lib/api/financeiro-operacional";
import {
  createCartaoClienteService,
  deleteCartaoClienteService,
  excluirAlunoService,
  getClienteOperationalContextService,
  liberarAcessoCatracaService,
  listBandeirasCartaoService,
  listCartoesClienteService,
  listConveniosService,
  listFormasPagamentoService,
  listMatriculasByAlunoService,
  listPagamentosService,
  listPlanosService,
  listPresencasByAlunoService,
  migrarClienteParaUnidadeService,
  receberPagamentoService,
  setCartaoPadraoService,
  updateAlunoService,
} from "@/lib/tenant/comercial/runtime";
import { ApiRequestError } from "@/lib/api/http";
import { getNfseBloqueioMensagem } from "@/lib/domain/financeiro";
import { isClientMigrationEnabled } from "@/lib/feature-flags";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import type {
  Aluno,
  BandeiraCartao,
  CartaoCliente,
  ClienteExclusaoBlockedBy,
  ClienteMigracaoUnidadeResult,
  ClienteOperationalContext,
  Matricula,
  Plano,
  Pagamento,
  Presenca,
  FormaPagamento,
  Convenio,
  NfseConfiguracao,
  ReceberPagamentoInput,
} from "@/lib/types";
import { isPagamentoEmAberto } from "@/lib/domain/status-helpers";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import type { ClienteTabKey } from "@/components/shared/cliente-tabs";

export type MigrationAuditSummary = {
  auditId?: string;
  tenantOrigemNome?: string;
  tenantDestinoNome?: string;
  message?: string;
};

export type TabLoadStatus = "idle" | "loading" | "ready" | "error";

export type NfseTabState = {
  tenantId: string | null;
  configuracao: NfseConfiguracao | null;
  status: TabLoadStatus;
  error: string | null;
};

export type CartoesTabState = {
  tenantId: string | null;
  cartoes: CartaoCliente[];
  bandeiras: BandeiraCartao[];
  status: TabLoadStatus;
  error: string | null;
};

function createIdleNfseTabState(tenantId: string | null = null): NfseTabState {
  return {
    tenantId,
    configuracao: null,
    status: "idle",
    error: null,
  };
}

function createIdleCartoesTabState(tenantId: string | null = null): CartoesTabState {
  return {
    tenantId,
    cartoes: [],
    bandeiras: [],
    status: "idle",
    error: null,
  };
}

function resolveClienteTab(input: string | null): ClienteTabKey | null {
  if (input === "matriculas" || input === "financeiro" || input === "nfse" || input === "editar" || input === "cartoes") {
    return input;
  }
  if (input === "resumo") return input;
  return null;
}

export type ClienteWorkspace = ReturnType<typeof useClienteWorkspace>;

export function useClienteWorkspace() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTab = resolveClienteTab(searchParams.get("tab"));
  const {
    tenantId,
    tenantResolved,
    tenants,
    eligibleTenants,
    setTenant,
    canDeleteClient,
  } = useTenantContext();
  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [clienteContexto, setClienteContexto] = useState<ClienteOperationalContext | null>(null);
  const [matriculas, setMatriculas] = useState<Matricula[]>([]);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([]);
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [nfseTabState, setNfseTabState] = useState<NfseTabState>(() => createIdleNfseTabState());
  const [cartoesTabState, setCartoesTabState] = useState<CartoesTabState>(() => createIdleCartoesTabState());
  const [freqMode, setFreqMode] = useState<"7d" | "ano">("7d");
  const [presencas, setPresencas] = useState<Presenca[]>([]);
  const [tab, setTab] = useState<ClienteTabKey>(requestedTab ?? "resumo");
  const [suspenderOpen, setSuspenderOpen] = useState(false);
  const [novaMatriculaOpen, setNovaMatriculaOpen] = useState(false);
  const [recebendo, setRecebendo] = useState<Pagamento | null>(null);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [liberarAcessoOpen, setLiberarAcessoOpen] = useState(false);
  const [liberarAcessoJustificativa, setLiberarAcessoJustificativa] = useState("");
  const [liberandoAcesso, setLiberandoAcesso] = useState(false);
  const [liberarAcessoErro, setLiberarAcessoErro] = useState("");
  const [liberarAcessoInfo, setLiberarAcessoInfo] = useState<string | null>(null);
  const [excluirOpen, setExcluirOpen] = useState(false);
  const [excluirJustificativa, setExcluirJustificativa] = useState("");
  const [excluindo, setExcluindo] = useState(false);
  const [excluirErro, setExcluirErro] = useState("");
  const [excluirBlockedBy, setExcluirBlockedBy] = useState<ClienteExclusaoBlockedBy[]>([]);
  const [migracaoOpen, setMigracaoOpen] = useState(false);
  const [migracaoTenantDestinoId, setMigracaoTenantDestinoId] = useState("");
  const [migracaoJustificativa, setMigracaoJustificativa] = useState("");
  const [migracaoPreservaContexto, setMigracaoPreservaContexto] = useState(true);
  const [migrandoCliente, setMigrandoCliente] = useState(false);
  const [migracaoErro, setMigracaoErro] = useState("");
  const [migracaoBlockedBy, setMigracaoBlockedBy] = useState<ClienteExclusaoBlockedBy[]>([]);
  const [migracaoResumo, setMigracaoResumo] = useState<MigrationAuditSummary | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const nfseTabStateRef = useRef(nfseTabState);
  const cartoesTabStateRef = useRef(cartoesTabState);

  useEffect(() => {
    nfseTabStateRef.current = nfseTabState;
  }, [nfseTabState]);

  useEffect(() => {
    cartoesTabStateRef.current = cartoesTabState;
  }, [cartoesTabState]);

  const loadNfseTabData = useCallback(async (currentTenantId: string) => {
    const current = nfseTabStateRef.current;
    if (
      current.tenantId === currentTenantId
      && (current.status === "loading" || current.status === "ready")
    ) {
      return;
    }

    setNfseTabState({
      tenantId: currentTenantId,
      configuracao: null,
      status: "loading",
      error: null,
    });

    try {
      // Task #556: unidadeId = tenantId (modelo AIOX)
      const configuracao = await getNfseConfiguracaoAtualApi({
        tenantId: currentTenantId,
        unidadeId: currentTenantId,
      });
      setNfseTabState((current) => {
        if (current.tenantId !== currentTenantId) return current;
        return {
          tenantId: currentTenantId,
          configuracao,
          status: "ready",
          error: null,
        };
      });
    } catch (error) {
      const message = normalizeErrorMessage(error);
      setNfseTabState((current) => {
        if (current.tenantId !== currentTenantId) return current;
        return {
          tenantId: currentTenantId,
          configuracao: null,
          status: "error",
          error: message,
        };
      });
    }
  }, []);

  const loadCartoesTabData = useCallback(async (
    currentTenantId: string,
    alunoId: string,
    options?: { force?: boolean }
  ) => {
    const current = cartoesTabStateRef.current;
    if (
      !options?.force
      && current.tenantId === currentTenantId
      && (current.status === "loading" || current.status === "ready")
    ) {
      return;
    }

    if (
      current.tenantId === currentTenantId
      && current.status === "loading"
    ) {
      return;
    }

    setCartoesTabState({
      tenantId: currentTenantId,
      cartoes: [],
      bandeiras: [],
      status: "loading",
      error: null,
    });

    try {
      const [cartoes, bandeiras] = await Promise.all([
        listCartoesClienteService({ tenantId: currentTenantId, alunoId }),
        listBandeirasCartaoService({ apenasAtivas: true }),
      ]);

      setCartoesTabState((current) => {
        if (current.tenantId !== currentTenantId) return current;
        return {
          tenantId: currentTenantId,
          cartoes,
          bandeiras,
          status: "ready",
          error: null,
        };
      });
    } catch (error) {
      const message = normalizeErrorMessage(error);
      setCartoesTabState((current) => {
        if (current.tenantId !== currentTenantId) return current;
        return {
          tenantId: currentTenantId,
          cartoes: [],
          bandeiras: [],
          status: "error",
          error: message,
        };
      });
    }
  }, []);

  const reload = useCallback(async () => {
    const id = params?.id;
    if (!id || !tenantResolved) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const resolved = await getClienteOperationalContextService({
        alunoId: id,
        tenantId,
        tenants: (eligibleTenants.length > 0 ? eligibleTenants : tenants).map((item) => ({
          id: item.id,
          nome: item.nome,
        })),
      });
      if (!resolved) {
        setAluno(null);
        setClienteContexto(null);
        setMatriculas([]);
        setPlanos([]);
        setPagamentos([]);
        setPresencas([]);
        setFormasPagamento([]);
        setConvenios([]);
        setNfseTabState(createIdleNfseTabState());
        setCartoesTabState(createIdleCartoesTabState());
        return;
      }
      if (resolved.tenantId !== tenantId) {
        await setTenant(resolved.tenantId);
      }
      const currentTenantId = resolved.tenantId;
      const [ms, ps, pres, fps, cvs, pags] = await Promise.all([
        listMatriculasByAlunoService({
          tenantId: currentTenantId,
          alunoId: id,
          page: 0,
          size: 200,
        }),
        listPlanosService({
          tenantId: currentTenantId,
          apenasAtivos: false,
        }),
        listPresencasByAlunoService({
          tenantId: currentTenantId,
          alunoId: id,
        }),
        listFormasPagamentoService({
          tenantId: currentTenantId,
          apenasAtivas: false,
        }),
        listConveniosService(),
        listPagamentosService({
          tenantId: currentTenantId,
          alunoId: id,
          page: 0,
          size: 80,
        }),
      ]);
      setAluno(resolved.aluno);
      setClienteContexto(resolved);
      setMatriculas(ms.filter((m) => m.alunoId === id));
      setPlanos(ps);
      setPagamentos(pags);
      setPresencas(pres);
      setFormasPagamento(fps);
      setConvenios(cvs);
      setNfseTabState((current) =>
        current.tenantId === currentTenantId ? current : createIdleNfseTabState(currentTenantId)
      );
      setCartoesTabState((current) =>
        current.tenantId === currentTenantId ? current : createIdleCartoesTabState(currentTenantId)
      );
    } catch (error) {
      setLoadError(normalizeErrorMessage(error));
      setAluno(null);
      setClienteContexto(null);
      setNfseTabState(createIdleNfseTabState());
      setCartoesTabState(createIdleCartoesTabState());
    } finally {
      setLoading(false);
    }
  }, [eligibleTenants, params?.id, setTenant, tenantId, tenantResolved, tenants]);

  useEffect(() => {
    if (!params?.id || !tenantResolved) return;
    void reload();
  }, [params?.id, reload, tenantResolved]);

  useEffect(() => {
    if (!canDeleteClient || !aluno) return;
    if (searchParams.get("action") !== "delete") return;
    setExcluirErro("");
    setExcluirBlockedBy([]);
    setExcluirJustificativa("");
    setExcluirOpen(true);
    router.replace(`/clientes/${aluno.id}`);
  }, [aluno, canDeleteClient, router, searchParams]);

  useEffect(() => {
    if (tab !== "nfse" || !aluno?.tenantId) return;
    void loadNfseTabData(aluno.tenantId);
  }, [aluno?.tenantId, loadNfseTabData, tab]);

  useEffect(() => {
    if (tab !== "cartoes" || !aluno?.tenantId || !aluno.id) return;
    void loadCartoesTabData(aluno.tenantId, aluno.id);
  }, [aluno?.id, aluno?.tenantId, loadCartoesTabData, tab]);

  const planoAtivo = useMemo(() => {
    return matriculas.find((m) => m.status === "ATIVA");
  }, [matriculas]);

  const planoAtivoInfo = planoAtivo
    ? planos.find((p) => p.id === planoAtivo.planoId)
    : undefined;

  const saldo = useMemo(() => {
    const pago = pagamentos
      .filter((p) => p.status === "PAGO")
      .reduce((s, p) => s + p.valorFinal, 0);
    const aberto = pagamentos
      .filter((p) => isPagamentoEmAberto(p.status))
      .reduce((s, p) => s + p.valorFinal, 0);
    return pago - aberto;
  }, [pagamentos]);

  const nfs = useMemo(() => {
    return pagamentos
      .filter((p) => p.status === "PAGO")
      .slice()
      .sort((left, right) => {
        if (Boolean(left.nfseEmitida) !== Boolean(right.nfseEmitida)) {
          return left.nfseEmitida ? -1 : 1;
        }
        const leftDate = left.dataEmissaoNfse ?? left.dataPagamento ?? left.dataVencimento ?? left.dataCriacao;
        const rightDate = right.dataEmissaoNfse ?? right.dataPagamento ?? right.dataVencimento ?? right.dataCriacao;
        if (leftDate === rightDate) return 0;
        return leftDate > rightDate ? -1 : 1;
      });
  }, [pagamentos]);
  const nfseConfiguracao = nfseTabState.tenantId === aluno?.tenantId ? nfseTabState.configuracao : null;
  const nfseBloqueio = getNfseBloqueioMensagem(nfseConfiguracao);
  const nfseEmissaoBloqueada = nfseTabState.status === "ready" && Boolean(nfseBloqueio);

  const recorrente = useMemo(() => {
    const mat = matriculas.find((m) => m.renovacaoAutomatica);
    if (!mat) return null;
    const plano = planos.find((p) => p.id === mat.planoId);
    if (!plano) return null;
    const nextDate = new Date(mat.dataFim + "T00:00:00");
    nextDate.setDate(nextDate.getDate() + 1);
    return {
      plano,
      data: nextDate.toISOString().split("T")[0],
      valor: plano.valor,
    };
  }, [matriculas, planos]);

  const pendenteFinanceiro = useMemo(
    () => pagamentos.some((p) => isPagamentoEmAberto(p.status)),
    [pagamentos]
  );

  const serie = useMemo(() => {
    if (!aluno) return [];
    const today = new Date();
    if (freqMode === "7d") {
      const days: string[] = [];
      for (let i = 6; i >= 0; i -= 1) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().split("T")[0]);
      }
      return days.map((d) =>
        presencas.some((p) => p.data === d) ? 1 : 0
      );
    }
    const year = today.getFullYear();
    const uniqueByMonth = Array.from({ length: 12 }).map(() => new Set<string>());
    presencas.forEach((p) => {
      if (p.data.startsWith(String(year))) {
        const month = parseInt(p.data.split("-")[1], 10) - 1;
        if (month >= 0 && month < 12) uniqueByMonth[month].add(p.data);
      }
    });
    return uniqueByMonth.map((set) => set.size);
  }, [aluno, freqMode, presencas]);

  const vendas = pagamentos
    .slice()
    .sort((a, b) => (a.dataCriacao > b.dataCriacao ? -1 : 1))
    .slice(0, 10);

  // --- Derived values computed after early returns in the original page ---
  const suspenso = aluno ? (aluno.status === "SUSPENSO" || Boolean(aluno.suspensao)) : false;
  const migracaoHabilitada = isClientMigrationEnabled();
  const tenantCatalogo = new Map(
    [...tenants, ...eligibleTenants].map((tenant) => [tenant.id, tenant] as const)
  );
  const baseTenantIdAtual = clienteContexto?.baseTenantId ?? aluno?.tenantId ?? "";
  const baseTenantNomeAtual =
    clienteContexto?.baseTenantName
    ?? tenantCatalogo.get(baseTenantIdAtual)?.nome
    ?? "Unidade base n\u00e3o informada";
  const opcoesMigracao = (clienteContexto?.eligibleTenants.length
    ? clienteContexto.eligibleTenants.map((tenant) => ({
        id: tenant.tenantId,
        nome: tenant.tenantName ?? tenantCatalogo.get(tenant.tenantId)?.nome ?? tenant.tenantId,
      }))
    : [...tenantCatalogo.values()].map((tenant) => ({ id: tenant.id, nome: tenant.nome })))
    .filter((tenant, index, items) => items.findIndex((item) => item.id === tenant.id) === index)
    .filter((tenant) => tenant.id !== baseTenantIdAtual);

  // --- Modal helper functions ---
  function closeExcluirModal() {
    setExcluirOpen(false);
    setExcluirJustificativa("");
    setExcluirErro("");
    setExcluirBlockedBy([]);
  }

  function parseExcluirErro(error: unknown): { message: string; blockedBy: ClienteExclusaoBlockedBy[] } {
    if (error instanceof ApiRequestError) {
      let blockedBy: ClienteExclusaoBlockedBy[] = [];
      if (error.responseBody) {
        try {
          const parsed = JSON.parse(error.responseBody) as { blockedBy?: ClienteExclusaoBlockedBy[]; message?: string };
          if (Array.isArray(parsed.blockedBy)) {
            blockedBy = parsed.blockedBy.filter(
              (item): item is ClienteExclusaoBlockedBy =>
                typeof item?.code === "string" && typeof item?.message === "string"
            );
          }
        } catch {
          blockedBy = [];
        }
      }

      if (error.status === 403) {
        return { message: "Seu perfil n\u00e3o possui permiss\u00e3o para excluir clientes.", blockedBy };
      }
      if (error.status === 409) {
        return {
          message: blockedBy[0]?.message ?? "O cliente possui depend\u00eancias que impedem a exclus\u00e3o.",
          blockedBy,
        };
      }
      if (error.status === 422) {
        return { message: "Informe uma justificativa v\u00e1lida para excluir o cliente.", blockedBy };
      }
    }

    return { message: normalizeErrorMessage(error), blockedBy: [] };
  }

  function closeMigracaoModal() {
    setMigracaoOpen(false);
    setMigracaoTenantDestinoId("");
    setMigracaoJustificativa("");
    setMigracaoPreservaContexto(true);
    setMigracaoErro("");
    setMigracaoBlockedBy([]);
  }

  function parseMigracaoErro(error: unknown): { message: string; blockedBy: ClienteExclusaoBlockedBy[] } {
    if (error instanceof ApiRequestError) {
      let blockedBy: ClienteExclusaoBlockedBy[] = [];
      if (error.responseBody) {
        try {
          const parsed = JSON.parse(error.responseBody) as { blockedBy?: ClienteExclusaoBlockedBy[] };
          if (Array.isArray(parsed.blockedBy)) {
            blockedBy = parsed.blockedBy.filter(
              (item): item is ClienteExclusaoBlockedBy =>
                typeof item?.code === "string" && typeof item?.message === "string"
            );
          }
        } catch {
          blockedBy = [];
        }
      }

      if (error.status === 403) {
        return { message: "Seu perfil n\u00e3o possui permiss\u00e3o para migrar a unidade-base do cliente.", blockedBy };
      }
      if (error.status === 409) {
        return {
          message: blockedBy[0]?.message ?? "A migra\u00e7\u00e3o foi bloqueada pelas regras estruturais do cliente.",
          blockedBy,
        };
      }
      if (error.status === 422) {
        return { message: "Revise destino e justificativa antes de confirmar a migra\u00e7\u00e3o.", blockedBy };
      }
    }

    return { message: normalizeErrorMessage(error), blockedBy: [] };
  }

  // --- Page-level action handlers ---
  function getConvenioForPagamento(pagamento: Pagamento) {
    const mat = matriculas.find((m) => m.id === pagamento.matriculaId);
    if (!mat?.convenioId) return undefined;
    const conv = convenios.find((c) => c.id === mat.convenioId);
    return conv ? { nome: conv.nome, descontoPercentual: conv.descontoPercentual } : undefined;
  }

  async function handleReceberPagamento(pagamento: Pagamento, data: ReceberPagamentoInput) {
    if (!aluno) return;
    setActionError(null);
    await receberPagamentoService({
      tenantId: aluno.tenantId,
      id: pagamento.id,
      data,
    });
    setRecebendo(null);
    await reload();
  }

  async function handleSuspender(payload: NonNullable<Aluno["suspensao"]>) {
    if (!aluno) return;
    setActionError(null);
    const registro = {
      ...payload,
      dataRegistro: new Date().toISOString().slice(0, 19),
    };
    await updateAlunoService({
      tenantId: aluno.tenantId,
      id: aluno.id,
      data: {
        status: "SUSPENSO",
        suspensao: payload,
        suspensoes: [registro, ...(aluno.suspensoes ?? [])],
      },
    });
    setSuspenderOpen(false);
    await reload();
  }

  async function handleReativar() {
    if (!aluno) return;
    setActionError(null);
    await updateAlunoService({
      tenantId: aluno.tenantId,
      id: aluno.id,
      data: {
        status: "INATIVO",
        suspensao: undefined,
      },
    });
    await reload();
  }

  async function handleCreateCartao(data: Parameters<typeof createCartaoClienteService>[0]["data"]) {
    if (!aluno) return;
    await createCartaoClienteService({
      tenantId: aluno.tenantId,
      alunoId: aluno.id,
      data,
    });
    await loadCartoesTabData(aluno.tenantId, aluno.id, { force: true });
  }

  async function handleDeleteCartao(id: string) {
    if (!aluno) return;
    await deleteCartaoClienteService({
      tenantId: aluno.tenantId,
      id,
    });
  }

  async function handleReloadCartoes() {
    if (!aluno) return;
    await loadCartoesTabData(aluno.tenantId, aluno.id, { force: true });
  }

  async function handleSetDefaultCartao(id: string) {
    if (!aluno) return;
    await setCartaoPadraoService({
      tenantId: aluno.tenantId,
      id,
    });
  }

  function openLiberarAcesso() {
    setActionError(null);
    setLiberarAcessoErro("");
    setLiberarAcessoInfo(null);
    setLiberarAcessoJustificativa("");
    setLiberarAcessoOpen(true);
  }

  function openExcluir() {
    setActionError(null);
    setExcluirErro("");
    setExcluirBlockedBy([]);
    setExcluirJustificativa("");
    setExcluirOpen(true);
  }

  function openMigracao() {
    setActionError(null);
    setMigracaoErro("");
    setMigracaoBlockedBy([]);
    setMigracaoTenantDestinoId(opcoesMigracao[0]?.id ?? "");
    setMigracaoJustificativa("");
    setMigracaoPreservaContexto(true);
    setMigracaoOpen(true);
  }

  // --- Dialog action handlers ---
  async function handleLiberarAcesso() {
    if (!aluno) return;
    const reason = liberarAcessoJustificativa.trim();
    if (!reason) {
      setLiberarAcessoErro("Justificativa \u00e9 obrigat\u00f3ria.");
      return;
    }
    setLiberarAcessoErro("");
    setLiberandoAcesso(true);
    try {
      const requestId = await liberarAcessoCatracaService({
        tenantId: aluno.tenantId,
        alunoId: aluno.id,
        justificativa: reason,
        issuedBy: "frontend",
      });
      setLiberarAcessoOpen(false);
      setLiberarAcessoJustificativa("");
      setLiberarAcessoInfo(`Comando de libera\u00e7\u00e3o enviado com sucesso (requestId: ${requestId}).`);
    } catch (error) {
      setLiberarAcessoErro(normalizeErrorMessage(error));
    } finally {
      setLiberandoAcesso(false);
    }
  }

  async function handleExcluir() {
    if (!aluno) return;
    const justificativa = excluirJustificativa.trim();
    if (!justificativa) {
      setExcluirErro("Justificativa \u00e9 obrigat\u00f3ria.");
      return;
    }
    setExcluindo(true);
    setExcluirErro("");
    try {
      await excluirAlunoService({
        tenantId: aluno.tenantId,
        id: aluno.id,
        justificativa,
        issuedBy: "frontend",
      });
      closeExcluirModal();
      router.push("/clientes?deleted=1");
    } catch (error) {
      const parsed = parseExcluirErro(error);
      setExcluirErro(parsed.message);
      setExcluirBlockedBy(parsed.blockedBy);
    } finally {
      setExcluindo(false);
    }
  }

  async function handleMigracao() {
    if (!aluno) return;
    if (!migracaoTenantDestinoId) {
      setMigracaoErro("Selecione a unidade destino.");
      return;
    }
    const justificativa = migracaoJustificativa.trim();
    if (!justificativa) {
      setMigracaoErro("Justificativa \u00e9 obrigat\u00f3ria.");
      return;
    }

    setMigrandoCliente(true);
    setMigracaoErro("");
    try {
      const result: ClienteMigracaoUnidadeResult = await migrarClienteParaUnidadeService({
        tenantId: aluno.tenantId,
        id: aluno.id,
        tenantDestinoId: migracaoTenantDestinoId,
        justificativa,
        preservarContextoComercial: migracaoPreservaContexto,
      });
      setMigracaoResumo({
        auditId: result.auditId,
        tenantOrigemNome: result.tenantOrigemNome ?? baseTenantNomeAtual,
        tenantDestinoNome:
          result.tenantDestinoNome
          ?? opcoesMigracao.find((tenant) => tenant.id === migracaoTenantDestinoId)?.nome,
        message: result.message,
      });
      closeMigracaoModal();
      if (result.suggestedActiveTenantId && result.suggestedActiveTenantId !== tenantId) {
        await setTenant(result.suggestedActiveTenantId);
      }
      await reload();
    } catch (error) {
      const parsed = parseMigracaoErro(error);
      setMigracaoErro(parsed.message);
      setMigracaoBlockedBy(parsed.blockedBy);
    } finally {
      setMigrandoCliente(false);
    }
  }

  return {
    // Core data
    aluno,
    clienteContexto,
    matriculas,
    planos,
    pagamentos,
    formasPagamento,
    convenios,
    presencas,
    loading,
    loadError,

    // Tab state
    tab,
    setTab,
    nfseTabState,
    cartoesTabState,
    freqMode,
    setFreqMode,

    // Computed
    planoAtivo,
    planoAtivoInfo,
    saldo,
    nfs,
    nfseConfiguracao,
    nfseBloqueio,
    nfseEmissaoBloqueada,
    recorrente,
    pendenteFinanceiro,
    serie,
    vendas,
    suspenso,
    migracaoHabilitada,
    tenantCatalogo,
    baseTenantIdAtual,
    baseTenantNomeAtual,
    opcoesMigracao,

    // Modal open/close state
    suspenderOpen,
    setSuspenderOpen,
    novaMatriculaOpen,
    setNovaMatriculaOpen,
    recebendo,
    setRecebendo,
    photoModalOpen,
    setPhotoModalOpen,

    // Liberar acesso dialog state
    liberarAcessoOpen,
    setLiberarAcessoOpen,
    liberarAcessoJustificativa,
    setLiberarAcessoJustificativa,
    liberandoAcesso,
    liberarAcessoErro,
    setLiberarAcessoErro,
    liberarAcessoInfo,
    setLiberarAcessoInfo,

    // Excluir dialog state
    excluirOpen,
    setExcluirOpen,
    excluirJustificativa,
    setExcluirJustificativa,
    excluindo,
    excluirErro,
    setExcluirErro,
    excluirBlockedBy,
    setExcluirBlockedBy,
    closeExcluirModal,

    // Migracao dialog state
    migracaoOpen,
    setMigracaoOpen,
    migracaoTenantDestinoId,
    setMigracaoTenantDestinoId,
    migracaoJustificativa,
    setMigracaoJustificativa,
    migracaoPreservaContexto,
    setMigracaoPreservaContexto,
    migrandoCliente,
    migracaoErro,
    setMigracaoErro,
    migracaoBlockedBy,
    setMigracaoBlockedBy,
    migracaoResumo,
    closeMigracaoModal,

    // Actions
    actionError,
    setActionError,
    reload,
    loadCartoesTabData,
    handleLiberarAcesso,
    handleExcluir,
    handleMigracao,
    handleReceberPagamento,
    handleSuspender,
    handleReativar,
    handleCreateCartao,
    handleDeleteCartao,
    handleReloadCartoes,
    handleSetDefaultCartao,
    getConvenioForPagamento,
    openLiberarAcesso,
    openExcluir,
    openMigracao,

    // Context
    router,
    tenantId,
    tenants,
    eligibleTenants,
    canDeleteClient,
  };
}
