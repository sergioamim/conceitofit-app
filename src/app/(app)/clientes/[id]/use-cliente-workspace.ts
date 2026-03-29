"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  getClienteOperationalContextService,
  listConveniosService,
  listFormasPagamentoService,
  listMatriculasByAlunoService,
  listPagamentosService,
  listPlanosService,
  listPresencasByAlunoService,
  receberPagamentoService,
  updateAlunoService,
} from "@/lib/tenant/comercial/runtime";
import { getNfseBloqueioMensagem } from "@/lib/backoffice/admin-financeiro";
import { isClientMigrationEnabled } from "@/lib/feature-flags";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import type {
  Aluno,
  ClienteOperationalContext,
  Matricula,
  Plano,
  Pagamento,
  Presenca,
  FormaPagamento,
  Convenio,
  ReceberPagamentoInput,
} from "@/lib/types";
import { isPagamentoEmAberto } from "@/lib/domain/status-helpers";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import type { ClienteTabKey } from "@/components/shared/cliente-tabs";

import { useClienteExclusao } from "./hooks/use-cliente-exclusao";
import { useClienteMigracao, type MigrationAuditSummary } from "./hooks/use-cliente-migracao";
import { useClienteLiberarAcesso } from "./hooks/use-cliente-liberar-acesso";
import { useClienteCartoes } from "./hooks/use-cliente-cartoes";
import { useClienteNfse } from "./hooks/use-cliente-nfse";

export type { MigrationAuditSummary };
export type { TabLoadStatus, NfseTabState } from "./hooks/use-cliente-nfse";
export type { CartoesTabState } from "./hooks/use-cliente-cartoes";

export function formatDate(d: string) {
  const normalized = d.includes("T") ? d.split("T")[0] : d;
  const [year, month, day] = normalized.split("-");
  if (!year || !month || !day) return normalized;
  return `${day}/${month}/${year}`;
}

export function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function resolveClienteTab(input: string | null): ClienteTabKey | null {
  if (input === "matriculas" || input === "financeiro" || input === "nfse" || input === "editar" || input === "cartoes") return input;
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
    tenantId, tenantResolved, tenants, eligibleTenants, setTenant, canDeleteClient,
  } = useTenantContext();

  // ─── Core data ──────────────────────────────────────────────────────────
  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [clienteContexto, setClienteContexto] = useState<ClienteOperationalContext | null>(null);
  const [matriculas, setMatriculas] = useState<Matricula[]>([]);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([]);
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [presencas, setPresencas] = useState<Presenca[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // ─── UI state ───────────────────────────────────────────────────────────
  const [tab, setTab] = useState<ClienteTabKey>(requestedTab ?? "resumo");
  const [freqMode, setFreqMode] = useState<"7d" | "ano">("7d");
  const [suspenderOpen, setSuspenderOpen] = useState(false);
  const [novaMatriculaOpen, setNovaMatriculaOpen] = useState(false);
  const [recebendo, setRecebendo] = useState<Pagamento | null>(null);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // ─── Sub-hooks ──────────────────────────────────────────────────────────
  const nfse = useClienteNfse({ activeTab: tab, tenantId: aluno?.tenantId });
  const cartoes = useClienteCartoes({ activeTab: tab, tenantId: aluno?.tenantId, alunoId: aluno?.id });
  const exclusao = useClienteExclusao();
  const liberarAcesso = useClienteLiberarAcesso();

  // ─── Derived values ─────────────────────────────────────────────────────
  const suspenso = aluno ? (aluno.status === "SUSPENSO" || Boolean(aluno.suspensao)) : false;
  const migracaoHabilitada = isClientMigrationEnabled();
  const tenantCatalogo = new Map(
    [...tenants, ...eligibleTenants].map((t) => [t.id, t] as const),
  );
  const baseTenantIdAtual = clienteContexto?.baseTenantId ?? aluno?.tenantId ?? "";
  const baseTenantNomeAtual =
    clienteContexto?.baseTenantName
    ?? tenantCatalogo.get(baseTenantIdAtual)?.nome
    ?? "Unidade base não informada";
  const opcoesMigracao = (clienteContexto?.eligibleTenants.length
    ? clienteContexto.eligibleTenants.map((t) => ({
        id: t.tenantId,
        nome: t.tenantName ?? tenantCatalogo.get(t.tenantId)?.nome ?? t.tenantId,
      }))
    : [...tenantCatalogo.values()].map((t) => ({ id: t.id, nome: t.nome })))
    .filter((t, i, arr) => arr.findIndex((x) => x.id === t.id) === i)
    .filter((t) => t.id !== baseTenantIdAtual);

  const migracao = useClienteMigracao({
    baseTenantNomeAtual,
    opcoesMigracao,
    tenantId,
    setTenant,
    reload,
  });

  const nfseConfiguracao = nfse.nfseTabState.tenantId === aluno?.tenantId ? nfse.nfseTabState.configuracao : null;
  const nfseBloqueio = getNfseBloqueioMensagem(nfseConfiguracao);
  const nfseEmissaoBloqueada = nfse.nfseTabState.status === "ready" && Boolean(nfseBloqueio);

  // ─── Computed data ──────────────────────────────────────────────────────
  const planoAtivo = useMemo(() => matriculas.find((m) => m.status === "ATIVA"), [matriculas]);
  const planoAtivoInfo = planoAtivo ? planos.find((p) => p.id === planoAtivo.planoId) : undefined;

  const saldo = useMemo(() => {
    const pago = pagamentos.filter((p) => p.status === "PAGO").reduce((s, p) => s + p.valorFinal, 0);
    const aberto = pagamentos.filter((p) => isPagamentoEmAberto(p.status)).reduce((s, p) => s + p.valorFinal, 0);
    return pago - aberto;
  }, [pagamentos]);

  const nfs = useMemo(() =>
    pagamentos.filter((p) => p.status === "PAGO").slice().sort((a, b) => {
      if (Boolean(a.nfseEmitida) !== Boolean(b.nfseEmitida)) return a.nfseEmitida ? -1 : 1;
      const aDate = a.dataEmissaoNfse ?? a.dataPagamento ?? a.dataVencimento ?? a.dataCriacao;
      const bDate = b.dataEmissaoNfse ?? b.dataPagamento ?? b.dataVencimento ?? b.dataCriacao;
      return aDate === bDate ? 0 : aDate > bDate ? -1 : 1;
    }),
  [pagamentos]);

  const recorrente = useMemo(() => {
    const mat = matriculas.find((m) => m.renovacaoAutomatica);
    if (!mat) return null;
    const plano = planos.find((p) => p.id === mat.planoId);
    if (!plano) return null;
    const nextDate = new Date(mat.dataFim + "T00:00:00");
    nextDate.setDate(nextDate.getDate() + 1);
    return { plano, data: nextDate.toISOString().split("T")[0], valor: plano.valor };
  }, [matriculas, planos]);

  const pendenteFinanceiro = useMemo(() => pagamentos.some((p) => isPagamentoEmAberto(p.status)), [pagamentos]);

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
      return days.map((d) => presencas.some((p) => p.data === d) ? 1 : 0);
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

  const vendas = pagamentos.slice().sort((a, b) => (a.dataCriacao > b.dataCriacao ? -1 : 1)).slice(0, 10);

  // ─── Core reload ────────────────────────────────────────────────────────
  // eslint-disable-next-line react-hooks/exhaustive-deps
  async function reload() {
    const id = params?.id;
    if (!id || !tenantResolved) { setLoading(false); return; }
    setLoading(true);
    setLoadError(null);
    try {
      const resolved = await getClienteOperationalContextService({
        alunoId: id,
        tenantId,
        tenants: (eligibleTenants.length > 0 ? eligibleTenants : tenants).map((t) => ({ id: t.id, nome: t.nome })),
      });
      if (!resolved) {
        setAluno(null); setClienteContexto(null); setMatriculas([]); setPlanos([]);
        setPagamentos([]); setPresencas([]); setFormasPagamento([]); setConvenios([]);
        nfse.resetNfseState(); cartoes.resetCartoesState();
        return;
      }
      if (resolved.tenantId !== tenantId) await setTenant(resolved.tenantId);
      const tid = resolved.tenantId;
      const [ms, ps, pres, fps, cvs, pags] = await Promise.all([
        listMatriculasByAlunoService({ tenantId: tid, alunoId: id, page: 0, size: 200 }),
        listPlanosService({ tenantId: tid, apenasAtivos: false }),
        listPresencasByAlunoService({ tenantId: tid, alunoId: id }),
        listFormasPagamentoService({ tenantId: tid, apenasAtivas: false }),
        listConveniosService(),
        listPagamentosService({ tenantId: tid, alunoId: id, page: 0, size: 80 }),
      ]);
      setAluno(resolved.aluno); setClienteContexto(resolved);
      setMatriculas(ms.filter((m) => m.alunoId === id)); setPlanos(ps);
      setPagamentos(pags); setPresencas(pres); setFormasPagamento(fps); setConvenios(cvs);
      nfse.resetNfseState(tid); cartoes.resetCartoesState(tid);
    } catch (error) {
      setLoadError(normalizeErrorMessage(error));
      setAluno(null); setClienteContexto(null);
      nfse.resetNfseState(); cartoes.resetCartoesState();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!params?.id || !tenantResolved) return;
    void reload();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.id, tenantResolved]);

  useEffect(() => {
    if (!canDeleteClient || !aluno) return;
    if (searchParams.get("action") !== "delete") return;
    exclusao.openExcluir();
    router.replace(`/clientes/${aluno.id}`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aluno, canDeleteClient, searchParams]);

  // ─── Action handlers ────────────────────────────────────────────────────
  function getConvenioForPagamento(pagamento: Pagamento) {
    const mat = matriculas.find((m) => m.id === pagamento.matriculaId);
    if (!mat?.convenioId) return undefined;
    const conv = convenios.find((c) => c.id === mat.convenioId);
    return conv ? { nome: conv.nome, descontoPercentual: conv.descontoPercentual } : undefined;
  }

  async function handleReceberPagamento(pagamento: Pagamento, data: ReceberPagamentoInput) {
    if (!aluno) return;
    setActionError(null);
    await receberPagamentoService({ tenantId: aluno.tenantId, id: pagamento.id, data });
    setRecebendo(null);
    await reload();
  }

  async function handleSuspender(payload: NonNullable<Aluno["suspensao"]>) {
    if (!aluno) return;
    setActionError(null);
    const registro = { ...payload, dataRegistro: new Date().toISOString().slice(0, 19) };
    await updateAlunoService({
      tenantId: aluno.tenantId, id: aluno.id,
      data: { status: "SUSPENSO", suspensao: payload, suspensoes: [registro, ...(aluno.suspensoes ?? [])] },
    });
    setSuspenderOpen(false);
    await reload();
  }

  async function handleReativar() {
    if (!aluno) return;
    setActionError(null);
    await updateAlunoService({ tenantId: aluno.tenantId, id: aluno.id, data: { status: "INATIVO", suspensao: undefined } });
    await reload();
  }

  return {
    // Core data
    aluno, clienteContexto, matriculas, planos, pagamentos, formasPagamento, convenios, presencas,
    loading, loadError,
    // Tab & UI
    tab, setTab, freqMode, setFreqMode,
    suspenderOpen, setSuspenderOpen, novaMatriculaOpen, setNovaMatriculaOpen,
    recebendo, setRecebendo, photoModalOpen, setPhotoModalOpen,
    // Sub-hooks (spread)
    nfseTabState: nfse.nfseTabState,
    cartoesTabState: cartoes.cartoesTabState,
    loadCartoesTabData: cartoes.loadCartoesTabData,
    ...exclusao,
    ...migracao,
    ...liberarAcesso,
    // Computed
    planoAtivo, planoAtivoInfo, saldo, nfs, nfseConfiguracao, nfseBloqueio, nfseEmissaoBloqueada,
    recorrente, pendenteFinanceiro, serie, vendas, suspenso, migracaoHabilitada,
    tenantCatalogo, baseTenantIdAtual, baseTenantNomeAtual, opcoesMigracao,
    // Actions
    actionError, setActionError, reload,
    handleReceberPagamento, handleSuspender, handleReativar,
    handleCreateCartao: (data: Parameters<typeof cartoes.handleCreateCartao>[2]) =>
      aluno ? cartoes.handleCreateCartao(aluno.tenantId, aluno.id, data) : Promise.resolve(),
    handleDeleteCartao: (id: string) =>
      aluno ? cartoes.handleDeleteCartao(aluno.tenantId, id) : Promise.resolve(),
    handleReloadCartoes: () =>
      aluno ? cartoes.handleReloadCartoes(aluno.tenantId, aluno.id) : Promise.resolve(),
    handleSetDefaultCartao: (id: string) =>
      aluno ? cartoes.handleSetDefaultCartao(aluno.tenantId, id) : Promise.resolve(),
    getConvenioForPagamento,
    // Context
    router, tenantId, tenants, eligibleTenants, canDeleteClient,
  };
}
