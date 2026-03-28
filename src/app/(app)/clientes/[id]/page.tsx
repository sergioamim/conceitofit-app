"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getNfseConfiguracaoAtualApi } from "@/lib/api/admin-financeiro";
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
import { getNfseBloqueioMensagem } from "@/lib/backoffice/admin-financeiro";
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
} from "@/lib/types";
import { StatusBadge } from "@/components/shared/status-badge";
const NovaMatriculaModal = dynamic(
  () => import("@/components/shared/nova-matricula-modal").then((mod) => mod.NovaMatriculaModal),
  { ssr: false }
);
const ReceberPagamentoModal = dynamic(
  () => import("@/components/shared/receber-pagamento-modal").then((mod) => mod.ReceberPagamentoModal),
  { ssr: false }
);
import { Button } from "@/components/ui/button";
const SuspenderClienteModal = dynamic(
  () => import("@/components/shared/suspender-cliente-modal").then((mod) => mod.SuspenderClienteModal),
  { ssr: false }
);
import { cn } from "@/lib/utils";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { ClienteEditForm } from "@/components/shared/cliente-edit-form";
import { ClienteHeader } from "@/components/shared/cliente-header";
import { ClienteCartoesPanel } from "@/components/shared/cliente-cartoes-panel";
import { ClientePhotoModal } from "@/components/shared/cliente-photo-modal";
import { ClienteTabs, ClienteTabKey } from "@/components/shared/cliente-tabs";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

type MigrationAuditSummary = {
  auditId?: string;
  tenantOrigemNome?: string;
  tenantDestinoNome?: string;
  message?: string;
};

type TabLoadStatus = "idle" | "loading" | "ready" | "error";

type NfseTabState = {
  tenantId: string | null;
  configuracao: NfseConfiguracao | null;
  status: TabLoadStatus;
  error: string | null;
};

type CartoesTabState = {
  tenantId: string | null;
  cartoes: CartaoCliente[];
  bandeiras: BandeiraCartao[];
  status: TabLoadStatus;
  error: string | null;
};

function formatDate(d: string) {
  const normalized = d.includes("T") ? d.split("T")[0] : d;
  const [year, month, day] = normalized.split("-");
  if (!year || !month || !day) return normalized;
  return `${day}/${month}/${year}`;
}

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

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

export default function ClienteDetalhePage() {
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
      const configuracao = await getNfseConfiguracaoAtualApi({ tenantId: currentTenantId });
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
      .filter((p) => p.status === "PENDENTE" || p.status === "VENCIDO")
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
    () => pagamentos.some((p) => p.status === "PENDENTE" || p.status === "VENCIDO"),
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

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground">Carregando cliente...</div>
    );
  }

  if (loadError) {
    return (
      <div className="text-sm text-gym-danger">{loadError}</div>
    );
  }

  if (!aluno) {
    return (
      <div className="text-sm text-muted-foreground">Cliente não encontrado para a unidade ativa.</div>
    );
  }

  const suspenso = aluno.status === "SUSPENSO" || Boolean(aluno.suspensao);
  const motivoOptions = [
    { value: "INADIMPLENCIA", label: "Inadimplência" },
    { value: "SAUDE", label: "Saúde" },
    { value: "VIAGEM", label: "Viagem" },
    { value: "PAUSA_CONTRATO", label: "Pausa de contrato" },
    { value: "OUTROS", label: "Outros" },
  ];
  const migracaoHabilitada = isClientMigrationEnabled();
  const tenantCatalogo = new Map(
    [...tenants, ...eligibleTenants].map((tenant) => [tenant.id, tenant] as const)
  );
  const baseTenantIdAtual = clienteContexto?.baseTenantId ?? aluno.tenantId;
  const baseTenantNomeAtual =
    clienteContexto?.baseTenantName
    ?? tenantCatalogo.get(baseTenantIdAtual)?.nome
    ?? "Unidade base não informada";
  const opcoesMigracao = (clienteContexto?.eligibleTenants.length
    ? clienteContexto.eligibleTenants.map((tenant) => ({
        id: tenant.tenantId,
        nome: tenant.tenantName ?? tenantCatalogo.get(tenant.tenantId)?.nome ?? tenant.tenantId,
      }))
    : [...tenantCatalogo.values()].map((tenant) => ({ id: tenant.id, nome: tenant.nome })))
    .filter((tenant, index, items) => items.findIndex((item) => item.id === tenant.id) === index)
    .filter((tenant) => tenant.id !== baseTenantIdAtual);

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
        return { message: "Seu perfil não possui permissão para excluir clientes.", blockedBy };
      }
      if (error.status === 409) {
        return {
          message: blockedBy[0]?.message ?? "O cliente possui dependências que impedem a exclusão.",
          blockedBy,
        };
      }
      if (error.status === 422) {
        return { message: "Informe uma justificativa válida para excluir o cliente.", blockedBy };
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
        return { message: "Seu perfil não possui permissão para migrar a unidade-base do cliente.", blockedBy };
      }
      if (error.status === 409) {
        return {
          message: blockedBy[0]?.message ?? "A migração foi bloqueada pelas regras estruturais do cliente.",
          blockedBy,
        };
      }
      if (error.status === 422) {
        return { message: "Revise destino e justificativa antes de confirmar a migração.", blockedBy };
      }
    }

    return { message: normalizeErrorMessage(error), blockedBy: [] };
  }

  return (
    <div className="space-y-6">
      {recebendo && (
        <ReceberPagamentoModal
          pagamento={recebendo}
          formasPagamento={formasPagamento}
          convenio={(() => {
            const mat = matriculas.find((m) => m.id === recebendo.matriculaId);
            if (!mat?.convenioId) return undefined;
            const conv = convenios.find((c) => c.id === mat.convenioId);
            return conv ? { nome: conv.nome, descontoPercentual: conv.descontoPercentual } : undefined;
          })()}
          onClose={() => setRecebendo(null)}
          onConfirm={async (data) => {
            try {
              setActionError(null);
              await receberPagamentoService({
                tenantId: aluno.tenantId,
                id: recebendo.id,
                data,
              });
              setRecebendo(null);
              await reload();
            } catch (error) {
              setActionError(normalizeErrorMessage(error));
            }
          }}
        />
      )}
      <NovaMatriculaModal
        open={novaMatriculaOpen}
        onClose={() => setNovaMatriculaOpen(false)}
        onDone={reload}
        prefillClienteId={aluno.id}
      />
      <SuspenderClienteModal
        open={suspenderOpen}
        onClose={() => setSuspenderOpen(false)}
        initial={aluno.suspensao}
        onConfirm={async (payload) => {
          try {
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
          } catch (error) {
            setActionError(normalizeErrorMessage(error));
          }
        }}
      />
      <ClientePhotoModal
        open={photoModalOpen}
        onClose={() => setPhotoModalOpen(false)}
        aluno={aluno}
        onSaved={async () => {
          await reload();
        }}
      />
      <Dialog
        open={liberarAcessoOpen}
        onOpenChange={(next) => {
          if (next) return;
          setLiberarAcessoOpen(false);
          setLiberarAcessoJustificativa("");
          setLiberarAcessoErro("");
        }}
      >
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold">
              Liberar acesso (catraca)
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Informe a justificativa para envio do comando de liberação. Este campo é obrigatório.
            </p>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Justificativa
              </label>
              <textarea
                value={liberarAcessoJustificativa}
                onChange={(event) => {
                  setLiberarAcessoJustificativa(event.target.value);
                  if (liberarAcessoErro) setLiberarAcessoErro("");
                  if (liberarAcessoInfo) setLiberarAcessoInfo(null);
                }}
                rows={4}
                maxLength={500}
                className="min-h-24 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm"
                placeholder="Justificativa obrigatória para liberação..."
              />
            </div>
            {liberarAcessoErro ? <p className="text-xs text-gym-danger">{liberarAcessoErro}</p> : null}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setLiberarAcessoOpen(false);
                setLiberarAcessoJustificativa("");
                setLiberarAcessoErro("");
              }}
              disabled={liberandoAcesso}
            >
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                const reason = liberarAcessoJustificativa.trim();
                if (!reason) {
                  setLiberarAcessoErro("Justificativa é obrigatória.");
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
                  setLiberarAcessoInfo(`Comando de liberação enviado com sucesso (requestId: ${requestId}).`);
                } catch (error) {
                  setLiberarAcessoErro(normalizeErrorMessage(error));
                } finally {
                  setLiberandoAcesso(false);
                }
              }}
              disabled={liberandoAcesso || !liberarAcessoJustificativa.trim()}
            >
              {liberandoAcesso ? "Enviando..." : "Enviar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={excluirOpen} onOpenChange={(next) => { if (!next) closeExcluirModal(); }}>
        <DialogContent className="border-border bg-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold">
              Excluir cliente
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Esta ação deve ser usada apenas quando a exclusão controlada estiver permitida para o cliente. Informe a justificativa para auditoria.
            </p>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Justificativa *
              </label>
              <textarea
                value={excluirJustificativa}
                onChange={(event) => {
                  setExcluirJustificativa(event.target.value);
                  if (excluirErro) setExcluirErro("");
                  if (excluirBlockedBy.length > 0) setExcluirBlockedBy([]);
                }}
                rows={4}
                maxLength={500}
                className="min-h-24 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm"
                placeholder="Descreva o motivo da exclusão controlada..."
              />
            </div>
            {excluirErro ? <p className="text-xs text-gym-danger">{excluirErro}</p> : null}
            {excluirBlockedBy.length > 0 ? (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                  Bloqueios encontrados
                </p>
                <ul className="mt-2 space-y-1 text-sm text-amber-100">
                  {excluirBlockedBy.map((item) => (
                    <li key={item.code}>{item.message}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeExcluirModal} disabled={excluindo}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                const justificativa = excluirJustificativa.trim();
                if (!justificativa) {
                  setExcluirErro("Justificativa é obrigatória.");
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
              }}
              disabled={excluindo || !excluirJustificativa.trim()}
            >
              {excluindo ? "Excluindo..." : "Excluir cliente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={migracaoOpen} onOpenChange={(next) => { if (!next) closeMigracaoModal(); }}>
        <DialogContent className="border-border bg-card sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold">
              Migrar unidade-base do cliente
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              Esta operação altera a unidade-base estrutural do cliente. Não é apenas uma troca temporária de contexto.
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-secondary/40 px-3 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Origem atual
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">{baseTenantNomeAtual}</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Unidade destino *
                </label>
                <select
                  value={migracaoTenantDestinoId}
                  onChange={(event) => {
                    setMigracaoTenantDestinoId(event.target.value);
                    if (migracaoErro) setMigracaoErro("");
                    if (migracaoBlockedBy.length > 0) setMigracaoBlockedBy([]);
                  }}
                  className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 text-sm"
                >
                  <option value="">Selecione a unidade destino</option>
                  {opcoesMigracao.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Justificativa *
              </label>
              <textarea
                value={migracaoJustificativa}
                onChange={(event) => {
                  setMigracaoJustificativa(event.target.value);
                  if (migracaoErro) setMigracaoErro("");
                  if (migracaoBlockedBy.length > 0) setMigracaoBlockedBy([]);
                }}
                rows={4}
                maxLength={500}
                className="min-h-24 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm"
                placeholder="Explique o motivo operacional e estrutural da migração..."
              />
            </div>
            <label className="flex items-start gap-2 rounded-xl border border-border px-3 py-3 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={migracaoPreservaContexto}
                onChange={(event) => setMigracaoPreservaContexto(event.target.checked)}
                className="mt-1"
              />
              <span>
                Preservar o contexto comercial no tenant de destino após a migração.
              </span>
            </label>
            {migracaoErro ? <p className="text-xs text-gym-danger">{migracaoErro}</p> : null}
            {migracaoBlockedBy.length > 0 ? (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                  Bloqueios encontrados
                </p>
                <ul className="mt-2 space-y-1 text-sm text-amber-100">
                  {migracaoBlockedBy.map((item) => (
                    <li key={item.code}>{item.message}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeMigracaoModal} disabled={migrandoCliente}>
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                if (!migracaoTenantDestinoId) {
                  setMigracaoErro("Selecione a unidade destino.");
                  return;
                }
                const justificativa = migracaoJustificativa.trim();
                if (!justificativa) {
                  setMigracaoErro("Justificativa é obrigatória.");
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
              }}
              disabled={migrandoCliente || !migracaoTenantDestinoId || !migracaoJustificativa.trim()}
            >
              {migrandoCliente ? "Migrando..." : "Confirmar migração"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      

      <div className="space-y-3">
        <Breadcrumb
          items={[
            { label: "Clientes", href: "/clientes" },
            { label: aluno.nome },
          ]}
        />

        <ClienteHeader
          aluno={aluno}
          planoAtivo={planoAtivo ? { dataFim: planoAtivo.dataFim } : null}
          planoAtivoInfo={planoAtivoInfo ?? null}
          suspenso={suspenso}
          onCartoes={() => setTab("cartoes")}
          onNovaVenda={() => setNovaMatriculaOpen(true)}
          onSuspender={() => setSuspenderOpen(true)}
          onReativar={async () => {
            try {
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
            } catch (error) {
              setActionError(normalizeErrorMessage(error));
            }
          }}
          onCompletarCadastro={() => setTab("editar")}
          showCartoesAction={false}
          onLiberarAcesso={() => {
            setActionError(null);
            setLiberarAcessoErro("");
            setLiberarAcessoInfo(null);
            setLiberarAcessoJustificativa("");
            setLiberarAcessoOpen(true);
          }}
          canDeleteCliente={canDeleteClient}
          onExcluir={() => {
            setActionError(null);
            setExcluirErro("");
            setExcluirBlockedBy([]);
            setExcluirJustificativa("");
            setExcluirOpen(true);
          }}
          onMigrarUnidadeBase={
            migracaoHabilitada && opcoesMigracao.length > 0
              ? () => {
                  setActionError(null);
                  setMigracaoErro("");
                  setMigracaoBlockedBy([]);
                  setMigracaoTenantDestinoId(opcoesMigracao[0]?.id ?? "");
                  setMigracaoJustificativa("");
                  setMigracaoPreservaContexto(true);
                  setMigracaoOpen(true);
                }
              : undefined
          }
          onEdit={() => setTab("editar")}
          onChangeFoto={() => setPhotoModalOpen(true)}
        />
        {liberarAcessoInfo ? (
          <div className="mt-3 rounded-xl border border-gym-accent/40 bg-gym-accent/10 p-3 text-sm text-gym-accent">
            {liberarAcessoInfo}
          </div>
        ) : null}
        {actionError ? (
          <div className="mt-3 rounded-xl border border-gym-danger/40 bg-gym-danger/10 p-3 text-sm text-gym-danger">
            {actionError}
          </div>
        ) : null}
        {migracaoResumo ? (
          <div className="mt-3 rounded-xl border border-gym-teal/40 bg-gym-teal/10 p-3 text-sm text-gym-teal">
            <p className="font-medium">
              Unidade-base migrada de {migracaoResumo.tenantOrigemNome ?? "origem atual"} para {migracaoResumo.tenantDestinoNome ?? "destino informado"}.
            </p>
            <p className="mt-1 text-xs text-gym-teal/90">
              {migracaoResumo.message ?? "A operação estrutural foi registrada com auditoria."}
              {migracaoResumo.auditId ? ` Auditoria: ${migracaoResumo.auditId}.` : ""}
            </p>
          </div>
        ) : null}
      </div>

      {suspenso && aluno.suspensao && (
        <div className="rounded-xl border border-gym-warning/50 bg-gym-warning/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gym-warning">
            Cliente suspenso
          </p>
          <p className="mt-1 text-sm text-foreground">
            Motivo:{" "}
            {motivoOptions.find((m) => m.value === aluno.suspensao?.motivo)?.label ??
              aluno.suspensao?.motivo}
          </p>
          <p className="text-xs text-muted-foreground">
            {aluno.suspensao.inicio || aluno.suspensao.fim
              ? `${aluno.suspensao.inicio ? formatDate(aluno.suspensao.inicio) : "Imediato"} → ${aluno.suspensao.fim ? formatDate(aluno.suspensao.fim) : "Indeterminado"}`
              : "Prazo indeterminado"}
          </p>
        </div>
      )}

      <ClienteTabs
        current={tab}
        baseHref={`/clientes/${aluno.id}`}
        onSelect={(next) => setTab(next)}
        pendenteFinanceiro={pendenteFinanceiro}
        showEditTab={tab === "editar"}
      />

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Contexto rede-unidade
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Unidade-base</p>
              <p className="text-sm font-medium text-foreground">{baseTenantNomeAtual}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Unidade ativa</p>
              <p className="text-sm font-medium text-foreground">
                {clienteContexto?.tenantName ?? tenantCatalogo.get(aluno.tenantId)?.nome ?? aluno.tenantId}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Elegibilidade operacional
          </p>
          <p className="mt-2 text-sm text-foreground">
            {clienteContexto?.eligibleTenants.length
              ? clienteContexto.eligibleTenants.map((tenant) => tenant.tenantName ?? tenant.tenantId).join(" • ")
              : "Sem unidades elegíveis informadas"}
          </p>
          {clienteContexto?.blockedTenants.length ? (
            <p className="mt-2 text-xs text-amber-300">
              Bloqueios: {clienteContexto.blockedTenants.map((tenant) => tenant.tenantName ?? tenant.tenantId).join(" • ")}
            </p>
          ) : null}
        </div>
      </div>

      {tab === "resumo" && (
        <>
          <div className="grid grid-cols-4 gap-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Dados principais
              </p>
              <div className="mt-2 space-y-1 text-sm">
                <div>{aluno.email}</div>
                <div>{aluno.telefone}</div>
                {aluno.telefoneSec && <div>{aluno.telefoneSec}</div>}
                <div>CPF: {aluno.cpf}</div>
                <div>Nascimento: {formatDate(aluno.dataNascimento)}</div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Frequência
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={() => setFreqMode("7d")}
                    className={cn(
                      "rounded-md border px-2 py-0.5 text-[11px]",
                      freqMode === "7d"
                        ? "border-gym-accent bg-gym-accent/10 text-gym-accent"
                        : "border-border text-muted-foreground"
                    )}
                  >
                    7 dias
                  </button>
                  <button
                    onClick={() => setFreqMode("ano")}
                    className={cn(
                      "rounded-md border px-2 py-0.5 text-[11px]",
                      freqMode === "ano"
                        ? "border-gym-accent bg-gym-accent/10 text-gym-accent"
                        : "border-border text-muted-foreground"
                    )}
                  >
                    Anual
                  </button>
                </div>
              </div>
              <div className="mt-3 flex items-end gap-1.5">
                {serie.map((v, i) => (
                  <div
                    key={`${v}-${i}`}
                    className="w-full rounded-sm bg-gym-accent/70"
                    style={{ height: `${6 + v * 6}px` }}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Saldo financeiro
              </p>
              <p className={cn(
                "mt-2 font-display text-2xl font-extrabold",
                saldo >= 0 ? "text-gym-teal" : "text-gym-danger"
              )}>
                {formatBRL(Math.abs(saldo))}
              </p>
              <p className="text-xs text-muted-foreground">
                {saldo >= 0 ? "Crédito" : "Devedor"}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Próxima cobrança
              </p>
              {recorrente ? (
                <>
                  <p className="mt-2 text-sm font-semibold">
                    {formatDate(recorrente.data)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {recorrente.plano.nome}
                  </p>
                  <p className="font-display text-lg font-bold text-gym-accent">
                    {formatBRL(recorrente.valor)}
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  Sem cobrança recorrente
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-base font-bold">
                Histórico de vendas
              </h2>
              <Button
                variant="outline"
                onClick={() => {
                  router.push(`/pagamentos?clienteId=${aluno.id}`);
                }}
                className="border-border text-xs"
              >
                Ver todas
              </Button>
            </div>
            <div className="divide-y divide-border">
              {vendas.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Nenhuma venda encontrada
                </p>
              )}
              {vendas.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">{p.descricao}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(p.dataVencimento)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gym-accent">
                      {formatBRL(p.valorFinal)}
                    </p>
                    <StatusBadge status={p.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-display text-base font-bold">
              Histórico de suspensão
            </h2>
            <div className="mt-3 divide-y divide-border">
              {(aluno.suspensoes?.length ?? 0) === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Nenhuma suspensão registrada
                </p>
              )}
              {(aluno.suspensoes ?? []).map((s, idx) => (
                <div key={`${s.dataRegistro}-${idx}`} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">
                      {motivoOptions.find((m) => m.value === s.motivo)?.label ?? s.motivo}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {s.inicio || s.fim
                        ? `${s.inicio ? formatDate(s.inicio) : "Imediato"} → ${s.fim ? formatDate(s.fim) : "Indeterminado"}`
                        : "Prazo indeterminado"}
                    </p>
                    {s.detalhes && (
                      <p className="mt-1 text-xs text-muted-foreground">{s.detalhes}</p>
                    )}
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    Registrado em {formatDate(s.dataRegistro.split("T")[0])}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === "editar" && (
        <div className="rounded-xl border border-border bg-card p-5">
          <ClienteEditForm
            aluno={aluno}
            onCancel={() => setTab("resumo")}
            onSaved={async () => {
              await reload();
              setTab("resumo");
            }}
          />
        </div>
      )}

      {tab === "matriculas" && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-display text-base font-bold">Histórico de contratos</h2>
          <div className="mt-3 divide-y divide-border">
            {matriculas.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhum contrato encontrado
              </p>
            )}
            {matriculas.map((m) => (
              <div key={m.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">
                    {planos.find((p) => p.id === m.planoId)?.nome ?? "Plano"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(m.dataInicio)} → {formatDate(m.dataFim)}
                  </p>
                </div>
                <StatusBadge status={m.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "cartoes" && aluno && (
        <ClienteCartoesPanel
          cartoes={cartoesTabState.cartoes}
          bandeiras={cartoesTabState.bandeiras}
          loading={cartoesTabState.status === "loading" || cartoesTabState.status === "idle"}
          error={cartoesTabState.status === "error" ? cartoesTabState.error : null}
          onCreate={async (data) => {
            await createCartaoClienteService({
              tenantId: aluno.tenantId,
              alunoId: aluno.id,
              data,
            });
            await loadCartoesTabData(aluno.tenantId, aluno.id, { force: true });
          }}
          onDelete={async (id) => {
            await deleteCartaoClienteService({
              tenantId: aluno.tenantId,
              id,
            });
          }}
          onReload={async () => {
            await loadCartoesTabData(aluno.tenantId, aluno.id, { force: true });
          }}
          onSetDefault={async (id) => {
            await setCartaoPadraoService({
              tenantId: aluno.tenantId,
              id,
            });
          }}
        />
      )}

      {tab === "financeiro" && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-display text-base font-bold">Financeiro</h2>
          <div className="mt-3 divide-y divide-border">
            {pagamentos.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhum pagamento encontrado
              </p>
            )}
            {pagamentos.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">{p.descricao}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(p.dataVencimento)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gym-accent">
                    {formatBRL(p.valorFinal)}
                  </p>
                  <StatusBadge status={p.status} />
                  {(p.status === "PENDENTE" || p.status === "VENCIDO") && (
                    <div className="mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-border"
                        onClick={() => setRecebendo(p)}
                      >
                        Receber pagamento
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "nfse" && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-display text-base font-bold">NFS-e do cliente</h2>
          {nfseTabState.status === "loading" ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Verificando bloqueios fiscais da unidade...
            </p>
          ) : null}
          {nfseTabState.status === "error" ? (
            <div className="mt-3 rounded-xl border border-gym-warning/40 bg-gym-warning/10 p-3 text-sm text-gym-warning">
              Não foi possível validar a configuração fiscal da unidade agora.
              {nfseTabState.error ? ` ${nfseTabState.error}` : ""}
            </div>
          ) : null}
          {nfseEmissaoBloqueada ? (
            <div className="mt-3 rounded-xl border border-gym-danger/40 bg-gym-danger/10 p-3 text-sm text-gym-danger">
              {nfseBloqueio}
            </div>
          ) : null}
          <div className="mt-3 divide-y divide-border">
            {nfs.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhum pagamento pago com status fiscal para este cliente
              </p>
            )}
            {nfs.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">{p.descricao}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(p.dataVencimento)}
                    {p.dataEmissaoNfse ? ` • Emitida em ${formatDate(p.dataEmissaoNfse)}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gym-accent">
                    {formatBRL(p.valorFinal)}
                  </p>
                  <p
                    className={`text-xs font-semibold uppercase tracking-wider ${
                      p.nfseEmitida
                        ? "text-gym-teal"
                        : nfseEmissaoBloqueada
                          ? "text-gym-danger"
                          : "text-gym-warning"
                    }`}
                  >
                    {p.nfseEmitida ? p.nfseNumero || "NF sem número" : nfseEmissaoBloqueada ? "Emissão bloqueada" : "Emissão pendente"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
