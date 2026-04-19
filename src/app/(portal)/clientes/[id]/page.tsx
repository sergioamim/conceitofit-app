"use client";

import { useState } from "react";
import nextDynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { ClienteHeader } from "@/components/shared/cliente-header";
import { ClienteCartoesPanel } from "@/components/shared/cliente-cartoes-panel";
import { ClientePhotoModal } from "@/components/shared/cliente-photo-modal";
import { ClienteTabs } from "@/components/shared/cliente-tabs";
import { StatusBadge } from "@/components/shared/status-badge";
import { isPagamentoEmAberto } from "@/lib/domain/status-helpers";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

import { formatBRL, formatDate } from "@/lib/formatters";
import { bloquearAcessoApi, desbloquearAcessoApi, excluirDadosPessoaisApi, excluirDadosSensiveisApi } from "@/lib/api/alunos";
import { useClienteWorkspace } from "./use-cliente-workspace";
import { ClienteDialogs } from "./cliente-dialogs";
import { ClienteSidebar } from "./cliente-sidebar";
import { ClienteStatusBanners } from "./cliente-status-banners";
import { ClienteEditDrawer } from "./cliente-edit-drawer";
import { ClienteTabRelacionamento } from "./cliente-tab-relacionamento";
import { ClienteTabAtividades } from "./cliente-tab-atividades";
import { ClienteMesclarDialog } from "./cliente-mesclar-dialog";

const NovaMatriculaModal = nextDynamic(
  () => import("@/components/shared/nova-matricula-modal").then((mod) => mod.NovaMatriculaModal),
  { ssr: false }
);
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

export default function ClienteDetalhePage() {
  const w = useClienteWorkspace();
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [mesclarOpen, setMesclarOpen] = useState(false);

  if (w.loading) return <div className="text-sm text-muted-foreground">Carregando cliente...</div>;
  if (w.loadError) return <div className="text-sm text-gym-danger">{w.loadError}</div>;
  if (!w.aluno) return <div className="text-sm text-muted-foreground">Cliente não encontrado para a unidade ativa.</div>;

  const aluno = w.aluno;

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
      <NovaMatriculaModal open={w.novaMatriculaOpen} onClose={() => w.setNovaMatriculaOpen(false)} onDone={w.reload} prefillClienteId={aluno.id} />
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
      <ClienteDialogs {...w} />

      {/* Breadcrumb + Header */}
      <Breadcrumb items={[{ label: "Clientes", href: "/clientes" }, { label: aluno.nome }]} />
      <ClienteHeader
        aluno={aluno}
        planoAtivo={w.planoAtivo ? { dataFim: w.planoAtivo.dataFim } : null}
        planoAtivoInfo={w.planoAtivoInfo ?? null}
        suspenso={w.suspenso}
        onCartoes={() => w.setTab("cartoes")}
        onNovaVenda={() => w.setNovaMatriculaOpen(true)}
        onSuspender={() => w.setSuspenderOpen(true)}
        onReativar={async () => {
          try { await w.handleReativar(); } catch (e) { w.setActionError(normalizeErrorMessage(e)); }
        }}
        onCompletarCadastro={() => setEditDrawerOpen(true)}
        showCartoesAction={false}
        onLiberarAcesso={w.openLiberarAcesso}
        canDeleteCliente={w.canDeleteClient}
        onExcluir={w.openExcluir}
        onMigrarUnidadeBase={w.migracaoHabilitada && w.opcoesMigracao.length > 0 ? w.openMigracao : undefined}
        onEdit={() => setEditDrawerOpen(true)}
        onChangeFoto={() => w.setPhotoModalOpen(true)}
        onSyncFace={aluno.foto ? w.handleSyncFace : undefined}
        onMesclar={() => setMesclarOpen(true)}
        onBloquearAcesso={async () => {
          const justificativa = prompt("Justificativa para bloquear acesso:");
          if (!justificativa?.trim()) return;
          try {
            await bloquearAcessoApi({ tenantId: w.tenantId ?? "", id: aluno.id, justificativa });
            w.setLiberarAcessoInfo("Acesso bloqueado com sucesso.");
            await w.reload();
          } catch (e) { w.setActionError(normalizeErrorMessage(e)); }
        }}
        onDesbloquearAcesso={async () => {
          try {
            await desbloquearAcessoApi({ tenantId: w.tenantId ?? "", id: aluno.id });
            w.setLiberarAcessoInfo("Acesso desbloqueado com sucesso.");
            await w.reload();
          } catch (e) { w.setActionError(normalizeErrorMessage(e)); }
        }}
        acessoBloqueado={aluno.status === "SUSPENSO" || aluno.bloqueioSistemaAtualId != null}
        onExcluirDadosPessoais={async () => {
          if (!confirm("Excluir dados pessoais deste cliente? Esta acao e IRREVERSIVEL. Nome, email, telefone e CPF serao anonimizados.")) return;
          const justificativa = prompt("Justificativa (obrigatoria):");
          if (!justificativa?.trim()) return;
          try {
            await excluirDadosPessoaisApi({ tenantId: w.tenantId ?? "", id: aluno.id, justificativa });
            w.setLiberarAcessoInfo("Dados pessoais excluidos com sucesso (LGPD).");
            await w.reload();
          } catch (e) { w.setActionError(normalizeErrorMessage(e)); }
        }}
        onExcluirDadosSensiveis={async () => {
          if (!confirm("Excluir dados sensiveis (anamnese, observacoes medicas)? Esta acao e IRREVERSIVEL.")) return;
          const justificativa = prompt("Justificativa (obrigatoria):");
          if (!justificativa?.trim()) return;
          try {
            await excluirDadosSensiveisApi({ tenantId: w.tenantId ?? "", id: aluno.id, justificativa });
            w.setLiberarAcessoInfo("Dados sensiveis excluidos com sucesso (LGPD).");
            await w.reload();
          } catch (e) { w.setActionError(normalizeErrorMessage(e)); }
        }}
      />

      {/* Feedback banners */}
      {w.liberarAcessoInfo && <div className="rounded-xl border border-gym-accent/40 bg-gym-accent/10 p-3 text-sm text-gym-accent">{w.liberarAcessoInfo}</div>}
      {w.actionError && <div className="rounded-xl border border-gym-danger/40 bg-gym-danger/10 p-3 text-sm text-gym-danger">{w.actionError}</div>}
      {w.migracaoResumo && (
        <div className="rounded-xl border border-gym-teal/40 bg-gym-teal/10 p-3 text-sm text-gym-teal">
          <p className="font-medium">Unidade-base migrada de {w.migracaoResumo.tenantOrigemNome ?? "origem atual"} para {w.migracaoResumo.tenantDestinoNome ?? "destino informado"}.</p>
          <p className="mt-1 text-xs text-gym-teal/90">
            {w.migracaoResumo.message ?? "A operação estrutural foi registrada com auditoria."}
            {w.migracaoResumo.auditId ? ` Auditoria: ${w.migracaoResumo.auditId}.` : ""}
          </p>
        </div>
      )}

      {/* Status banners */}
      <ClienteStatusBanners
        aluno={aluno}
        suspenso={w.suspenso}
        pendenteFinanceiro={w.pendenteFinanceiro}
        planoAtivo={w.planoAtivo ? { dataFim: w.planoAtivo.dataFim } : null}
        presencas={w.presencas}
        pagamentos={w.pagamentos}
      />

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
      <ClienteTabs current={w.tab} baseHref={`/clientes/${aluno.id}`} onSelect={(next) => w.setTab(next)} pendenteFinanceiro={w.pendenteFinanceiro} showEditTab={false} />

      {/* Layout 2 colunas: conteúdo + sidebar */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* Coluna principal */}
        <div className="space-y-4">
          {w.tab === "resumo" && (
            <>
              {/* Cards de métricas (3 colunas, sem "Dados principais" que foi para sidebar) */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Frequência</p>
                    <div className="flex gap-1">
                      <button onClick={() => w.setFreqMode("7d")} className={cn("rounded-md border px-2 py-0.5 text-[11px]", w.freqMode === "7d" ? "border-gym-accent bg-gym-accent/10 text-gym-accent" : "border-border text-muted-foreground")}>7 dias</button>
                      <button onClick={() => w.setFreqMode("ano")} className={cn("rounded-md border px-2 py-0.5 text-[11px]", w.freqMode === "ano" ? "border-gym-accent bg-gym-accent/10 text-gym-accent" : "border-border text-muted-foreground")}>Anual</button>
                    </div>
                  </div>
                  <div className="mt-3 flex items-end gap-1.5 h-12">
                    {w.serie.map((v, i) => (<div key={`${v}-${i}`} className="w-full rounded-sm bg-gym-accent/70" style={{ height: `${6 + v * 6}px` }} />))}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Saldo financeiro</p>
                  <p className={cn("mt-2 font-display text-2xl font-extrabold", w.saldo >= 0 ? "text-gym-teal" : "text-gym-danger")}>{formatBRL(Math.abs(w.saldo))}</p>
                  <p className="text-xs text-muted-foreground">{w.saldo >= 0 ? "Crédito" : "Devedor"}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Próxima cobrança</p>
                  {w.recorrente ? (
                    <>
                      <p className="mt-2 text-sm font-semibold">{formatDate(w.recorrente.data)}</p>
                      <p className="text-sm text-muted-foreground">{w.recorrente.plano.nome}</p>
                      <p className="font-display text-lg font-bold text-gym-accent">{formatBRL(w.recorrente.valor)}</p>
                    </>
                  ) : (<p className="mt-2 text-sm text-muted-foreground">Sem cobrança recorrente</p>)}
                </div>
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
          )}

          {w.tab === "cartoes" && (
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
                        <div className="mt-2"><Button variant="outline" size="sm" className="border-border" onClick={() => w.setRecebendo(p)}>Receber pagamento</Button></div>
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
            />
          )}

          {w.tab === "atividades" && (
            <ClienteTabAtividades
              alunoId={aluno.id}
              tenantId={aluno.tenantId}
            />
          )}
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
