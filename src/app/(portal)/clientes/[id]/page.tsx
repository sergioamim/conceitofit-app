"use client";

import { useEffect, useState } from "react";
import nextDynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { ClienteHeader } from "@/components/shared/cliente-header";
import { ClienteCartoesPanel } from "@/components/shared/cliente-cartoes-panel";
import { ClientePhotoModal } from "@/components/shared/cliente-photo-modal";
import { ClienteTabs } from "@/components/shared/cliente-tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { StatusBadge } from "@/components/shared/status-badge";
import { isPagamentoEmAberto, getClienteHaloStatus } from "@/lib/domain/status-helpers";
import { computeSugestoesCliente, type SugestaoAcao } from "@/lib/domain/sugestoes-cliente";
import { usePerfilDrawerAcoesEnabled } from "@/lib/query/use-feature-flags";
import {
  trackPerfilCartoesDrawerOpen,
  trackPerfilDrawerAcoesOpen,
  trackPerfilRiscoDetalhesOpen,
  trackPerfilSugestaoClick,
  trackPerfilTabChange,
} from "@/lib/shared/analytics";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { VincularAgregadorModal } from "@/components/shared/vincular-agregador-modal";

import { formatBRL, formatDate } from "@/lib/formatters";
import { bloquearAcessoApi, desbloquearAcessoApi, excluirDadosPessoaisApi, excluirDadosSensiveisApi } from "@/lib/api/alunos";
import {
  listAgregadorVinculosDoAluno,
  type AgregadorVinculoResponse,
} from "@/lib/api/agregadores-vinculos";
import { useClienteWorkspace } from "./use-cliente-workspace";
import { ClienteDialogs } from "./cliente-dialogs";
import { ClienteSidebar } from "./cliente-sidebar";
import { computeClienteBanners } from "./cliente-status-banners";
import { ClienteSinaisRail, buildSinaisCliente } from "./cliente-sinais-rail";
import { ClienteAcoesDrawer } from "./cliente-acoes-drawer";
import { ClienteFrequenciaCard } from "./cliente-frequencia-card";
import { ClienteCreditoDiasPanel } from "./cliente-credito-dias-panel";
import { ClientePlanoCard } from "./cliente-plano-card";
import { ClienteRiscoCard } from "./cliente-risco-card";
import { ClienteEditDrawer } from "./cliente-edit-drawer";
import { ClienteTabRelacionamento } from "./cliente-tab-relacionamento";
import { ClienteTabFrequencia } from "./cliente-tab-frequencia";
import { ClienteTabTreinos } from "./cliente-tab-treinos";
import { ClienteTabAvaliacoes } from "./cliente-tab-avaliacoes";
import { ClienteTabFidelidade } from "./cliente-tab-fidelidade";
import { ClienteTabDocumentos } from "./cliente-tab-documentos";
import { ClienteMesclarDialog } from "./cliente-mesclar-dialog";
import { ExcluirCobrancaModal } from "@/components/shared/excluir-cobranca-modal";

const ReceberPagamentoModal = nextDynamic(
  () => import("@/components/shared/receber-pagamento-modal").then((mod) => mod.ReceberPagamentoModal),
  { ssr: false }
);
const SuspenderClienteModal = nextDynamic(
  () => import("@/components/shared/suspender-cliente-modal").then((mod) => mod.SuspenderClienteModal),
  { ssr: false }
);

const motivoOptions = [
  { value: "INADIMPLENCIA", label: "Inadimplência" },
  { value: "SAUDE", label: "Saúde" },
  { value: "VIAGEM", label: "Viagem" },
  { value: "PAUSA_CONTRATO", label: "Pausa de contrato" },
  { value: "OUTROS", label: "Outros" },
];

type LgpdDialogTipo = "pessoais" | "sensiveis" | null;

export default function ClienteDetalhePage() {
  const w = useClienteWorkspace();
  const drawerAcoesEnabled = usePerfilDrawerAcoesEnabled();
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [mesclarOpen, setMesclarOpen] = useState(false);
  const [acoesOpen, setAcoesOpen] = useState(false);
  const [cartoesOpen, setCartoesOpen] = useState(false);
  const [agregadorVinculos, setAgregadorVinculos] = useState<AgregadorVinculoResponse[]>([]);
  const [vincularAgregadorOpen, setVincularAgregadorOpen] = useState(false);
  const [bloquearAcessoOpen, setBloquearAcessoOpen] = useState(false);
  const [bloquearAcessoJustificativa, setBloquearAcessoJustificativa] = useState("");
  const [bloqueandoAcesso, setBloqueandoAcesso] = useState(false);
  const [bloquearAcessoErro, setBloquearAcessoErro] = useState("");
  const [lgpdDialogTipo, setLgpdDialogTipo] = useState<LgpdDialogTipo>(null);
  const [lgpdJustificativa, setLgpdJustificativa] = useState("");
  const [lgpdProcessando, setLgpdProcessando] = useState(false);
  const [lgpdErro, setLgpdErro] = useState("");

  // Carrega vínculos ATIVOS de agregadores B2B (Wellhub/TotalPass/...) para
  // exibir no card "Plano ativo" como contrato alternativo — mesmo sem
  // contrato próprio, o vínculo indica acesso operacional.
  useEffect(() => {
    const tenantId = w.aluno?.tenantId;
    const alunoId = w.aluno?.id;
    if (!tenantId || !alunoId) return;
    let cancelled = false;
    void listAgregadorVinculosDoAluno({ tenantId, alunoId }).then((items) => {
      if (!cancelled) setAgregadorVinculos(items);
    });
    return () => { cancelled = true; };
  }, [w.aluno?.tenantId, w.aluno?.id]);

  // Perfil v3 Wave 4 (AC4.7): deep-link `?tab=cartoes|editar` abre o
  // drawer/painel correspondente para preservar bookmarks após a
  // reorganização das abas. Lemos só no mount (window.location) para
  // não re-disparar em navegações internas como `setTenant` pós-migração.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const alias = new URLSearchParams(window.location.search).get("tab");
    if (alias === "cartoes") setCartoesOpen(true);
    if (alias === "editar") setEditDrawerOpen(true);
  }, []);

  // Load cartões sob demanda apenas quando o drawer está aberto. Gatilha
  // durante deep-link (mount) e também se o tenant muda com drawer aberto.
  // Drawer fechado = sem load → não interfere em outros efeitos (migração).
  useEffect(() => {
    if (!cartoesOpen || !w.aluno?.tenantId) return;
    if (w.cartoesTabState.status !== "idle") return;
    void w.loadCartoesTabData(w.aluno.tenantId, w.aluno.id);
  }, [cartoesOpen, w.aluno, w.cartoesTabState.status, w.loadCartoesTabData]);

  if (w.loading) return <div className="text-sm text-muted-foreground">Carregando cliente...</div>;
  if (w.loadError) return <div className="text-sm text-gym-danger">{w.loadError}</div>;
  if (!w.aluno) return <div className="text-sm text-muted-foreground">Cliente não encontrado para a unidade ativa.</div>;

  const aluno = w.aluno;
  const acessoBloqueado =
    aluno.status === "SUSPENSO" ||
    (aluno as { bloqueioSistemaAtualId?: string | null }).bloqueioSistemaAtualId != null;

  // Perfil v3 — Wave 1: halo do avatar + rail de sinais
  const haloStatus = getClienteHaloStatus({
    aluno,
    suspenso: w.suspenso,
    acessoBloqueado,
    pendenteFinanceiro: w.pendenteFinanceiro,
    planoAtivo: w.planoAtivo ? { dataFim: w.planoAtivo.dataFim } : null,
  });

  const banners = computeClienteBanners({
    aluno,
    suspenso: w.suspenso,
    pendenteFinanceiro: w.pendenteFinanceiro,
    planoAtivo: w.planoAtivo ? { dataFim: w.planoAtivo.dataFim } : null,
    presencas: w.presencas,
    pagamentos: w.pagamentos,
  });

  const sinais = buildSinaisCliente({
    planoAtivo: w.planoAtivo ? { dataFim: w.planoAtivo.dataFim } : null,
    planoAtivoInfo: w.planoAtivoInfo ?? null,
    presencas: w.presencas,
    pagamentos: w.pagamentos,
    saldo: w.saldo,
    recorrente: w.recorrente,
    // TODO(VUN-perfil): quando o workspace carregar histórico de avaliações,
    // passar `w.avaliacoes.length > 0`. Por ora, sem dado → sinal omitido.
    temAvaliacoes: false,
    // TODO(VUN-perfil): depende de `plano_extra.permite_convidados` ser
    // adicionado no backend. Por ora, sem flag → sinal omitido.
    planoPermiteConvidados: false,
  });

  // Perfil v3 — Wave 2: drawer de próximas ações (per-tenant via DB).
  const sugestoes: SugestaoAcao[] = drawerAcoesEnabled
    ? computeSugestoesCliente({
        aluno,
        suspenso: w.suspenso,
        acessoBloqueado,
        pendenteFinanceiro: w.pendenteFinanceiro,
        planoAtivo: w.planoAtivo ? { dataFim: w.planoAtivo.dataFim } : null,
        pagamentos: w.pagamentos,
        presencas: w.presencas,
      })
    : [];

  function closeBloquearAcessoModal() {
    setBloquearAcessoOpen(false);
    setBloquearAcessoJustificativa("");
    setBloquearAcessoErro("");
  }

  async function handleBloquearAcesso() {
    const justificativa = bloquearAcessoJustificativa.trim();
    if (!justificativa) {
      setBloquearAcessoErro("Justificativa é obrigatória.");
      return;
    }
    setBloqueandoAcesso(true);
    setBloquearAcessoErro("");
    try {
      const result = await bloquearAcessoApi({
        tenantId: w.tenantId ?? "",
        id: aluno.id,
        justificativa,
      });
      closeBloquearAcessoModal();
      w.setLiberarAcessoInfo(result.message || "Acesso bloqueado com sucesso.");
      await w.reload();
    } catch (error) {
      setBloquearAcessoErro(normalizeErrorMessage(error));
    } finally {
      setBloqueandoAcesso(false);
    }
  }

  function openLgpdModal(tipo: Exclude<LgpdDialogTipo, null>) {
    setLgpdDialogTipo(tipo);
    setLgpdJustificativa("");
    setLgpdErro("");
  }

  function closeLgpdModal() {
    setLgpdDialogTipo(null);
    setLgpdJustificativa("");
    setLgpdErro("");
  }

  async function handleLgpdConfirm() {
    const justificativa = lgpdJustificativa.trim();
    if (!justificativa || !lgpdDialogTipo) {
      setLgpdErro("Justificativa é obrigatória.");
      return;
    }
    setLgpdProcessando(true);
    setLgpdErro("");
    try {
      const result = lgpdDialogTipo === "pessoais"
        ? await excluirDadosPessoaisApi({ tenantId: w.tenantId ?? "", id: aluno.id, justificativa })
        : await excluirDadosSensiveisApi({ tenantId: w.tenantId ?? "", id: aluno.id, justificativa });
      closeLgpdModal();
      w.setLiberarAcessoInfo(
        result.message
          || (lgpdDialogTipo === "pessoais"
            ? "Dados pessoais excluídos com sucesso (LGPD)."
            : "Dados sensíveis excluídos com sucesso (LGPD).")
      );
      await w.reload();
    } catch (error) {
      setLgpdErro(normalizeErrorMessage(error));
    } finally {
      setLgpdProcessando(false);
    }
  }

  async function handleSugestaoAction(s: SugestaoAcao) {
    // Telemetria §7 PRD — cada clique em sugestão é rastreado por tipo +
    // prioridade. Atribuição de "renovações via drawer" é feita correlacionando
    // `perfil_sugestao_click` com tipo renovar-plano/reativar-plano e o evento
    // `matricula_created` subsequente.
    if (aluno.tenantId) {
      trackPerfilSugestaoClick(aluno.tenantId, aluno.id, s.tipo, s.prioridade);
    }

    switch (s.tipo) {
      case "cobrar-pendencia":
        w.setTab("financeiro");
        return;
      case "reativar-plano":
        try {
          await w.handleReativar();
        } catch (e) {
          w.setActionError(normalizeErrorMessage(e));
        }
        return;
      case "renovar-plano":
        w.router.push(`/vendas/nova?clienteId=${encodeURIComponent(aluno.id)}&prefill=1`);
        return;
      case "retencao-ativa":
      case "parabens-aniversario": {
        const telefone = aluno.telefone?.replace(/\D/g, "");
        if (telefone) {
          window.open(`https://wa.me/55${telefone}`, "_blank", "noopener,noreferrer");
        }
        return;
      }
      case "liberar-acesso":
        if (w.openLiberarAcesso) w.openLiberarAcesso();
        return;
      case "solicitar-foto":
        w.setPhotoModalOpen(true);
        return;
    }
  }

  return (
    <div className="space-y-4">
      {/* Modals */}
      {w.recebendo && (
        <ReceberPagamentoModal
          pagamento={w.recebendo}
          formasPagamento={w.formasPagamento}
          convenio={w.getConvenioForPagamento(w.recebendo)}
          onClose={() => w.setRecebendo(null)}
          onConfirm={async (data) => {
            try { await w.handleReceberPagamento(w.recebendo!, data); } catch (e) { w.setActionError(normalizeErrorMessage(e)); }
          }}
        />
      )}
      {w.excluindoCobranca && (
        <ExcluirCobrancaModal
          pagamento={w.excluindoCobranca}
          justificativa={w.excluirCobrancaJustificativa}
          setJustificativa={w.setExcluirCobrancaJustificativa}
          loading={w.excluindoCobrancaLoading}
          error={w.excluirCobrancaErro}
          onClose={w.closeExcluirCobranca}
          onConfirm={w.handleExcluirCobranca}
        />
      )}
      <SuspenderClienteModal
        open={w.suspenderOpen}
        onClose={() => w.setSuspenderOpen(false)}
        initial={aluno.suspensao}
        onConfirm={async (payload) => {
          try { await w.handleSuspender(payload); } catch (e) { w.setActionError(normalizeErrorMessage(e)); }
        }}
      />
      <ClientePhotoModal open={w.photoModalOpen} onClose={() => w.setPhotoModalOpen(false)} aluno={aluno} onSaved={() => w.reload()} />
      <ClienteEditDrawer open={editDrawerOpen} aluno={aluno} onClose={() => setEditDrawerOpen(false)} onSaved={w.reload} />
      <ClienteMesclarDialog open={mesclarOpen} onClose={() => setMesclarOpen(false)} aluno={aluno} tenantId={w.tenantId ?? ""} onMerged={w.reload} />
      <ClienteDialogs
        {...w}
        bloquearAcessoOpen={bloquearAcessoOpen}
        bloquearAcessoJustificativa={bloquearAcessoJustificativa}
        setBloquearAcessoJustificativa={setBloquearAcessoJustificativa}
        bloqueandoAcesso={bloqueandoAcesso}
        bloquearAcessoErro={bloquearAcessoErro}
        setBloquearAcessoErro={setBloquearAcessoErro}
        closeBloquearAcessoModal={closeBloquearAcessoModal}
        handleBloquearAcesso={handleBloquearAcesso}
        lgpdDialogTipo={lgpdDialogTipo}
        lgpdJustificativa={lgpdJustificativa}
        setLgpdJustificativa={setLgpdJustificativa}
        lgpdProcessando={lgpdProcessando}
        lgpdErro={lgpdErro}
        setLgpdErro={setLgpdErro}
        closeLgpdModal={closeLgpdModal}
        handleLgpdConfirm={handleLgpdConfirm}
      />
      <VincularAgregadorModal
        open={vincularAgregadorOpen}
        onOpenChange={setVincularAgregadorOpen}
        alunoId={aluno.id}
        tenantId={aluno.tenantId}
        onSuccess={(vinculo) => {
          setAgregadorVinculos((current) => [vinculo, ...current.filter((item) => item.id !== vinculo.id)]);
          setVincularAgregadorOpen(false);
        }}
      />
      {drawerAcoesEnabled && (
        <ClienteAcoesDrawer
          open={acoesOpen}
          onOpenChange={setAcoesOpen}
          sugestoes={sugestoes}
          onAction={handleSugestaoAction}
        />
      )}
      {/* Perfil v3 Wave 4 (AC4.6): Cartões via drawer em vez de tab */}
      <Sheet
        open={cartoesOpen}
        onOpenChange={(next) => {
          setCartoesOpen(next);
          // Carrega sob demanda ao abrir o drawer (preserva timing do
          // workspace para não afetar outros efeitos como migração).
          if (next && w.cartoesTabState.status === "idle" && aluno.tenantId) {
            void w.loadCartoesTabData(aluno.tenantId, aluno.id);
          }
        }}
      >
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="sr-only">
            <SheetTitle>Cartões do cliente</SheetTitle>
          </SheetHeader>
          <ClienteCartoesPanel
            cartoes={w.cartoesTabState.cartoes}
            bandeiras={w.cartoesTabState.bandeiras}
            loading={w.cartoesTabState.status === "loading" || w.cartoesTabState.status === "idle"}
            error={w.cartoesTabState.status === "error" ? w.cartoesTabState.error : null}
            onCreate={w.handleCreateCartao}
            onDelete={w.handleDeleteCartao}
            onReload={w.handleReloadCartoes}
            onSetDefault={w.handleSetDefaultCartao}
          />
        </SheetContent>
      </Sheet>

      {/* Breadcrumb + Header */}
      <Breadcrumb items={[{ label: "Clientes", href: "/clientes" }, { label: aluno.nome }]} />
      <ClienteHeader
        aluno={aluno}
        planoAtivo={w.planoAtivo ? { dataFim: w.planoAtivo.dataFim } : null}
        planoAtivoInfo={w.planoAtivoInfo ?? null}
        suspenso={w.suspenso}
        sticky={false}
        onCartoes={() => {
          setCartoesOpen(true);
          if (aluno.tenantId) {
            trackPerfilCartoesDrawerOpen(aluno.tenantId, aluno.id);
          }
        }}
        onNovaVenda={() => w.router.push(`/vendas/nova?clienteId=${encodeURIComponent(aluno.id)}&prefill=1`)}
        onSuspender={() => w.setSuspenderOpen(true)}
        onReativar={async () => {
          try { await w.handleReativar(); } catch (e) { w.setActionError(normalizeErrorMessage(e)); }
        }}
        onCompletarCadastro={() => setEditDrawerOpen(true)}
        onVincularAgregador={() => setVincularAgregadorOpen(true)}
        showCartoesAction={false}
        onLiberarAcesso={w.openLiberarAcesso}
        canDeleteCliente={w.canDeleteClient}
        onExcluir={w.openExcluir}
        onMigrarUnidadeBase={w.migracaoHabilitada && w.opcoesMigracao.length > 0 ? w.openMigracao : undefined}
        onEdit={() => setEditDrawerOpen(true)}
        onChangeFoto={() => w.setPhotoModalOpen(true)}
        onSyncFace={aluno.foto ? w.handleSyncFace : undefined}
        onMesclar={() => setMesclarOpen(true)}
        onBloquearAcesso={() => setBloquearAcessoOpen(true)}
        onDesbloquearAcesso={async () => {
          try {
            const result = await desbloquearAcessoApi({ tenantId: w.tenantId ?? "", id: aluno.id });
            w.setLiberarAcessoInfo(result.message || "Acesso desbloqueado com sucesso.");
            await w.reload();
          } catch (e) { w.setActionError(normalizeErrorMessage(e)); }
        }}
        acessoBloqueado={acessoBloqueado}
        haloStatus={haloStatus}
        banners={banners}
        onAcoesClick={
          drawerAcoesEnabled
            ? () => {
                setAcoesOpen(true);
                if (aluno.tenantId) {
                  trackPerfilDrawerAcoesOpen(aluno.tenantId, aluno.id, sugestoes.length);
                }
              }
            : undefined
        }
        acoesCount={drawerAcoesEnabled ? sugestoes.length : undefined}
        onExcluirDadosPessoais={() => openLgpdModal("pessoais")}
        onExcluirDadosSensiveis={() => openLgpdModal("sensiveis")}
      />

      {/* Perfil v3 Wave 1 — Rail de sinais de saúde do cliente */}
      <ClienteSinaisRail sinais={sinais} />

      {/* Feedback banners */}
      {w.liberarAcessoInfo && <div className="rounded-xl border border-gym-accent/40 bg-gym-accent/10 p-3 text-sm text-gym-accent">{w.liberarAcessoInfo}</div>}
      {w.actionError && <div className="rounded-xl border border-gym-danger/40 bg-gym-danger/10 p-3 text-sm text-gym-danger">{w.actionError}</div>}
      {w.migracaoResumo && (
        <div className="rounded-xl border border-gym-teal/40 bg-gym-teal/10 p-3 text-sm text-gym-teal">
          <p className="font-medium">Unidade-base migrada de {w.migracaoResumo.tenantOrigemNome ?? "origem atual"} para {w.migracaoResumo.tenantDestinoNome ?? "destino informado"}.</p>
          <p className="mt-1 text-xs text-gym-teal/90">
            {`${w.migracaoResumo.message ?? "A operação estrutural foi registrada com auditoria."}${w.migracaoResumo.auditId ? ` Auditoria: ${w.migracaoResumo.auditId}.` : ""}`}
          </p>
        </div>
      )}

      {/* Status banners agora ficam embutidos no ClienteHeader (canto
          inferior direito). Bloco removido em 2026-04-22. */}

      {/* Suspensão ativa */}
      {w.suspenso && aluno.suspensao && (
        <div className="rounded-xl border border-gym-warning/50 bg-gym-warning/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gym-warning">Cliente suspenso</p>
          <p className="mt-1 text-sm text-foreground">
            Motivo: {motivoOptions.find((m) => m.value === aluno.suspensao?.motivo)?.label ?? aluno.suspensao?.motivo}
          </p>
          <p className="text-xs text-muted-foreground">
            {aluno.suspensao.inicio || aluno.suspensao.fim
              ? `${aluno.suspensao.inicio ? formatDate(aluno.suspensao.inicio) : "Imediato"} → ${aluno.suspensao.fim ? formatDate(aluno.suspensao.fim) : "Indeterminado"}`
              : "Prazo indeterminado"}
          </p>
        </div>
      )}

      {/* Tabs */}
      <ClienteTabs
        current={w.tab}
        baseHref={`/clientes/${aluno.id}`}
        onSelect={(next) => {
          w.setTab(next);
          if (aluno.tenantId) trackPerfilTabChange(aluno.tenantId, aluno.id, next);
        }}
        pendenteFinanceiro={w.pendenteFinanceiro}
        showEditTab={false}
      />

      {/* Layout 2 colunas: conteúdo + sidebar */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* Coluna principal */}
        <div className="space-y-4">
          {w.tab === "resumo" && (
            <>
              {/* Perfil v3 Wave 3 — Cards de métricas: Frequência (14d) · Plano · Risco */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <ClienteFrequenciaCard presencas={w.presencas} />
                <ClientePlanoCard
                  planoAtivo={w.planoAtivo ? { dataFim: w.planoAtivo.dataFim } : null}
                  planoAtivoInfo={w.planoAtivoInfo ?? null}
                  recorrente={w.recorrente}
                  agregadorVinculos={agregadorVinculos}
                  onRenovar={() => w.router.push(`/vendas/nova?clienteId=${encodeURIComponent(aluno.id)}&prefill=1`)}
                  onPausar={!w.suspenso ? () => w.setSuspenderOpen(true) : undefined}
                />
                <ClienteRiscoCard
                  input={{
                    aluno,
                    suspenso: w.suspenso,
                    pendenteFinanceiro: w.pendenteFinanceiro,
                    planoAtivo: w.planoAtivo ? { dataFim: w.planoAtivo.dataFim } : null,
                    pagamentos: w.pagamentos,
                    presencas: w.presencas,
                  }}
                  clienteNome={aluno.nome}
                  onDetalhesOpen={(r) => {
                    if (aluno.tenantId) {
                      trackPerfilRiscoDetalhesOpen(aluno.tenantId, aluno.id, r.score, r.label);
                    }
                  }}
                />
              </div>

              {/* Contratos */}
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-display text-base font-bold">Contratos</h2>
                  <Button variant="outline" size="sm" onClick={() => w.setTab("matriculas")} className="border-border text-xs">Ver mais</Button>
                </div>
                <div className="divide-y divide-border">
                  {w.matriculas.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">Nenhum contrato encontrado</p>}
                  {w.matriculas.slice(0, 3).map((m) => (
                    <div key={m.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-medium">{w.planos.find((p) => p.id === m.planoId)?.nome ?? "Plano"}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(m.dataInicio)} → {formatDate(m.dataFim)}</p>
                      </div>
                      <StatusBadge status={m.status} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Histórico de vendas */}
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-display text-base font-bold">Histórico de vendas</h2>
                  <Button variant="outline" size="sm" onClick={() => w.router.push(`/pagamentos?clienteId=${aluno.id}`)} className="border-border text-xs">Ver todas</Button>
                </div>
                <div className="divide-y divide-border">
                  {w.vendas.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">Nenhuma venda encontrada</p>}
                  {w.vendas.map((p) => (
                    <div key={p.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-medium">{p.descricao}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(p.dataVencimento)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gym-accent">{formatBRL(p.valorFinal)}</p>
                        <StatusBadge status={p.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Histórico de suspensão */}
              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="font-display text-base font-bold">Histórico de suspensão</h2>
                <div className="mt-3 divide-y divide-border">
                  {(aluno.suspensoes?.length ?? 0) === 0 && <p className="py-4 text-center text-sm text-muted-foreground">Nenhuma suspensão registrada</p>}
                  {(aluno.suspensoes ?? []).map((s, idx) => (
                    <div key={`${s.dataRegistro}-${idx}`} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-medium">{motivoOptions.find((m) => m.value === s.motivo)?.label ?? s.motivo}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.inicio || s.fim ? `${s.inicio ? formatDate(s.inicio) : "Imediato"} → ${s.fim ? formatDate(s.fim) : "Indeterminado"}` : "Prazo indeterminado"}
                        </p>
                        {s.detalhes && <p className="mt-1 text-xs text-muted-foreground">{s.detalhes}</p>}
                      </div>
                      <div className="text-right text-xs text-muted-foreground">Registrado em {formatDate(s.dataRegistro.split("T")[0])}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {w.tab === "matriculas" && (
            <div className="space-y-4">
              <ClienteCreditoDiasPanel
                contratoAtivo={w.planoAtivo ?? null}
                planoNome={w.planoAtivoInfo?.nome}
                onReload={w.reload}
              />

              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="font-display text-base font-bold">Histórico de contratos</h2>
                <div className="mt-3 divide-y divide-border">
                  {w.matriculas.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Nenhum contrato encontrado</p>}
                  {w.matriculas.map((m) => (
                    <div key={m.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-medium">{w.planos.find((p) => p.id === m.planoId)?.nome ?? "Plano"}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(m.dataInicio)} → {formatDate(m.dataFim)}</p>
                      </div>
                      <StatusBadge status={m.status} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {w.tab === "financeiro" && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-display text-base font-bold">Financeiro</h2>
              <div className="mt-3 divide-y divide-border">
                {w.pagamentos.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Nenhum pagamento encontrado</p>}
                {w.pagamentos.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium">{p.descricao}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(p.dataVencimento)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gym-accent">{formatBRL(p.valorFinal)}</p>
                      <StatusBadge status={p.status} />
                      {isPagamentoEmAberto(p.status) && (
                        <div className="mt-2 flex flex-wrap justify-end gap-2">
                          <Button variant="outline" size="sm" className="border-border" onClick={() => w.setRecebendo(p)}>
                            Receber pagamento
                          </Button>
                          <Button variant="outline" size="sm" className="border-gym-danger/30 text-gym-danger hover:bg-gym-danger/5" onClick={() => w.openExcluirCobranca(p)}>
                            Excluir cobrança
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {w.tab === "nfse" && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-display text-base font-bold">NFS-e do cliente</h2>
              {w.nfseTabState.status === "loading" && <p className="mt-3 text-sm text-muted-foreground">Verificando bloqueios fiscais da unidade...</p>}
              {w.nfseTabState.status === "error" && (
                <div className="mt-3 rounded-xl border border-gym-warning/40 bg-gym-warning/10 p-3 text-sm text-gym-warning">
                  Não foi possível validar a configuração fiscal da unidade agora.{w.nfseTabState.error ? ` ${w.nfseTabState.error}` : ""}
                </div>
              )}
              {w.nfseEmissaoBloqueada && <div className="mt-3 rounded-xl border border-gym-danger/40 bg-gym-danger/10 p-3 text-sm text-gym-danger">{w.nfseBloqueio}</div>}
              <div className="mt-3 divide-y divide-border">
                {w.nfs.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Nenhum pagamento pago com status fiscal para este cliente</p>}
                {w.nfs.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium">{p.descricao}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(p.dataVencimento)}{p.dataEmissaoNfse ? ` • Emitida em ${formatDate(p.dataEmissaoNfse)}` : ""}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gym-accent">{formatBRL(p.valorFinal)}</p>
                      <p className={`text-xs font-semibold uppercase tracking-wider ${p.nfseEmitida ? "text-gym-teal" : w.nfseEmissaoBloqueada ? "text-gym-danger" : "text-gym-warning"}`}>
                        {p.nfseEmitida ? p.nfseNumero || "NF sem número" : w.nfseEmissaoBloqueada ? "Emissão bloqueada" : "Emissão pendente"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {w.tab === "relacionamento" && (
            <ClienteTabRelacionamento
              aluno={aluno}
              matriculas={w.matriculas}
              pagamentos={w.pagamentos}
              presencas={w.presencas}
            />
          )}

          {w.tab === "frequencia" && <ClienteTabFrequencia presencas={w.presencas} />}
          {w.tab === "treinos" && <ClienteTabTreinos />}
          {w.tab === "avaliacoes" && <ClienteTabAvaliacoes />}
          {w.tab === "fidelidade" && <ClienteTabFidelidade />}
          {w.tab === "documentos" && <ClienteTabDocumentos />}
        </div>

        {/* Sidebar direita — sempre visível */}
        <div className="space-y-4">
          <ClienteSidebar
            aluno={aluno}
            onEdit={() => setEditDrawerOpen(true)}
          />

          {/* Contexto rede-unidade (compacto na sidebar) */}
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Contexto rede-unidade</p>
            <div className="mt-2 space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">Unidade-base</p>
                <p className="text-sm font-medium text-foreground">{w.baseTenantNomeAtual}</p>
              </div>
            </div>
          </div>

          {/* Elegibilidade operacional */}
          {w.clienteContexto?.blockedTenants.length ? (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Elegibilidade operacional</p>
              <p className="mt-2 text-xs text-amber-300">
                Bloqueios: {w.clienteContexto.blockedTenants.map((t) => t.tenantName ?? t.tenantId).join(" • ")}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
