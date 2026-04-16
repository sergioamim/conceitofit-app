"use client";

import { AlertCircle, RefreshCw, Copy, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { EvoImportEntidadeResumo as EntidadeResumo } from "@/lib/api/importacao-evo";
import { formatDateTime } from "../date-time-format";
import { ENTIDADE_TODAS, BLOCO_TODOS, COLABORADOR_BLOCO_CONFIG } from "../shared";
import type { EvoImportPageState } from "../hooks/useEvoImportPage";

export function EvoAcompanhamentoTab({ state }: { state: EvoImportPageState }) {
  const {
    jobId, jobResumo, polling, jobTenantId, jobTenantIds, jobOrigem,
    jobContextoLabel,
    jobsEmExecucao, jobsRecentes,
    jobAliasAtual, jobAliasDraft, setJobAliasDraft, jobHistoricoAtual,
    progress, getPercentual,
    resumoCards, resumoCardsVisiveis, resumoCardsOcultos, resumoEntidadeMap,
    colaboradoresResumoCards, colaboradoresResumoAlertas, jobTemMalhaColaboradores,
    showRejeicoes, rejeicoesLoading,
    rejeicoesFiltradas,
    entidadeFiltro, setEntidadeFiltro, blocoFiltro, setBlocoFiltro,
    entidadesDisponiveis, blocosDisponiveis,
    retrySelecao, retryRejeicoesSelecionadas, retryPayload,
    handleJobIdInput, selecionarJobDoHistorico, selecionarJobDaLista,
    salvarAliasJobAtual, openRejeicoesPorEntidade,
    handleLoadJob, loadRejeicoes,
    startPolling, pollOnce, stopPolling,
    resolveCurrentTenantIdRaw, resolveJobAlias,
    statusVariant, resumoValue,
    toggleRetrySelecao, copiarPayloadRetry,
    toast,
  } = state;

  return (
    <>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Job de importação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!jobId && (
                <div className="flex h-40 flex-col items-center justify-center space-y-2 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
                    <p className="text-sm">Selecione uma importação no painel lateral para visualizar os diagnósticos detalhados.</p>
                </div>
              )}

              {jobId && (
                <div className="space-y-3 rounded-lg border border-border bg-card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-muted-foreground">Job</span>
                        <span className="text-sm font-semibold text-foreground">{jobAliasAtual || "Sem alias"}</span>
                      {(() => {
                        const v = statusVariant(jobResumo?.status);
                        return (
                          <Badge variant={v.variant} className={v.className}>
                            {jobResumo?.status ?? "—"}
                          </Badge>
                        );
                      })()}
                      {polling && <span className="text-xs text-muted-foreground">Atualizando a cada 3s…</span>}
                      </div>
                      <span className="font-mono text-xs text-muted-foreground">{jobId}</span>
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p>
                        Academia: <span className="font-medium text-foreground">{jobContextoLabel.academiaNome}</span>
                      </p>
                      <p>
                        Unidade: <span className="font-medium text-foreground">{jobContextoLabel.unidadeNome}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => loadRejeicoes(0)} disabled={!jobResumo}>
                        Abrir rejeições
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => pollOnce(jobId)} disabled={!jobResumo}>
                        <RefreshCw className="size-4" />
                        Atualizar agora
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                    <div className="space-y-2">
                      <Label htmlFor="jobAliasDraft">Alias do job</Label>
                      <Input
                        id="jobAliasDraft"
                        value={jobAliasDraft}
                        onChange={(e) => setJobAliasDraft(e.target.value)}
                        placeholder={jobAliasAtual || "Ex.: EVO Centro março"}
                      />
                      <p className="text-xs text-muted-foreground">
                        Salvo localmente neste navegador para facilitar localizar o job depois.
                      </p>
                    </div>
                    <div className="flex items-end">
                      <Button type="button" variant="outline" onClick={salvarAliasJobAtual}>
                        Salvar alias
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Solicitado em</p>
                      <p className="text-sm">{formatDateTime(jobResumo?.solicitadoEm)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Finalizado em</p>
                      <p className="text-sm">{formatDateTime(jobResumo?.finalizadoEm)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Progresso</p>
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-gym-accent"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium">{progress}%</span>
                      </div>
                    </div>
                  </div>

                  {jobResumo?.status === "FALHA" && (
                    <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                      <XCircle className="mt-0.5 size-4" />
                      <div>
                        <p className="font-semibold">Job falhou</p>
                        <p>{jobResumo?.detalheErro ?? "Verifique as rejeições para detalhes."}</p>
                      </div>
                    </div>
                  )}

                  <div className="grid gap-3 md:grid-cols-2">
                    {resumoCardsVisiveis.map(({ key, label }) => {
                      const resumo = jobResumo?.[key] as EntidadeResumo | undefined;
                      const { percentual, temTotal } = getPercentual(resumo);
                      const entityFilter =
                        key === "funcionarios" && jobTemMalhaColaboradores ? ENTIDADE_TODAS : resumoEntidadeMap[key];
                      const canOpenDetails = key === "geral" || Boolean(entityFilter);
                      return (
                        <Card
                          key={key}
                          className={cn(
                            "border-border",
                            canOpenDetails ? "focus-ring-brand cursor-pointer transition hover:bg-muted/40" : ""
                          )}
                          role={canOpenDetails ? "link" : undefined}
                          tabIndex={canOpenDetails ? 0 : -1}
                          onClick={() => {
                            if (!canOpenDetails) return;
                            openRejeicoesPorEntidade(entityFilter);
                          }}
                          onKeyDown={(event) => {
                            if (!canOpenDetails) return;
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              openRejeicoesPorEntidade(entityFilter);
                            }
                          }}
                        >
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">{label}</CardTitle>
                          </CardHeader>
                          <CardContent className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                            <span>Total</span>
                            <span className="text-right text-foreground">{resumoValue("total", resumo)}</span>
                            <span>Processadas</span>
                            <span className="text-right text-foreground">{resumoValue("processadas", resumo)}</span>
                            <span>Criadas</span>
                            <span className="text-right text-foreground">{resumoValue("criadas", resumo)}</span>
                            <span>Atualizadas</span>
                            <span className="text-right text-foreground">{resumoValue("atualizadas", resumo)}</span>
                            <span className="text-gym-danger">Rejeitadas</span>
                            <span className="text-right text-gym-danger font-semibold">{resumoValue("rejeitadas", resumo)}</span>
                            <span className="col-span-2 pt-2">Evolução</span>
                            <span className="col-span-2">
                              <span className="inline-flex w-full items-center gap-2">
                                <span className="text-foreground">
                                  {temTotal ? `${percentual}%` : "Aguardando total"}
                                </span>
                                <span className="flex-1 rounded-full bg-muted h-2">
                                  <span
                                    className="block h-2 rounded-full bg-gym-accent transition-all duration-300"
                                    style={{ width: temTotal ? `${percentual}%` : "0%" }}
                                  />
                                </span>
                              </span>
                            </span>
                            {canOpenDetails && (
                              <span className="col-span-2 pt-2 text-[11px] text-muted-foreground">
                                Abrir detalhes de rejeições
                              </span>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {colaboradoresResumoCards.length > 0 ? (
                    <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold">Diagnóstico de colaboradores</p>
                        <p className="text-xs text-muted-foreground">
                          O job agora separa ficha principal, funções, tipos, contratação, horários e perfil legado para evidenciar importações parciais.
                        </p>
                      </div>

                      {colaboradoresResumoAlertas.length > 0 ? (
                        <div className="space-y-2">
                          {colaboradoresResumoAlertas.map((alerta, index) => (
                            <div
                              key={`${alerta.bloco ?? "geral"}-${index}`}
                              className={cn(
                                "rounded-md border px-3 py-2 text-sm",
                                alerta.severidade === "error"
                                  ? "border-destructive/40 bg-destructive/10 text-destructive"
                                  : "border-amber-400/40 bg-amber-500/10 text-amber-100"
                              )}
                            >
                              {alerta.mensagem}
                            </div>
                          ))}
                        </div>
                      ) : null}

                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {colaboradoresResumoCards.map((bloco) => {
                          const resumo = bloco.resumo;
                          const { percentual, temTotal } = getPercentual(resumo);
                          const statusLabel =
                            bloco.status === "naoSelecionado"
                              ? "Não selecionado"
                              : bloco.status === "semLinhas"
                                ? "Sem linhas"
                                : bloco.status === "comRejeicoes"
                                  ? "Com rejeições"
                                  : "Sucesso";
                          const statusVariant = bloco.status === "sucesso" ? ("secondary" as const) : ("outline" as const);
                          return (
                            <Card
                              key={bloco.key}
                              className="cursor-pointer border-border transition hover:bg-muted/40"
                              role="link"
                              tabIndex={0}
                              onClick={() => openRejeicoesPorEntidade(ENTIDADE_TODAS, bloco.key)}
                              onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                  event.preventDefault();
                                  openRejeicoesPorEntidade(ENTIDADE_TODAS, bloco.key);
                                }
                              }}
                            >
                              <CardHeader className="pb-2">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <CardTitle className="text-sm">{bloco.label}</CardTitle>
                                  <Badge variant={statusVariant}>
                                    {statusLabel}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">{bloco.descricao}</p>
                              </CardHeader>
                              <CardContent className="space-y-3 text-xs text-muted-foreground">
                                <div className="grid grid-cols-2 gap-2">
                                  <span>Total</span>
                                  <span className="text-right text-foreground">{resumoValue("total", resumo)}</span>
                                  <span>Processadas</span>
                                  <span className="text-right text-foreground">{resumoValue("processadas", resumo)}</span>
                                  <span>Criadas</span>
                                  <span className="text-right text-foreground">{resumoValue("criadas", resumo)}</span>
                                  <span>Atualizadas</span>
                                  <span className="text-right text-foreground">{resumoValue("atualizadas", resumo)}</span>
                                  <span className="text-gym-danger">Rejeitadas</span>
                                  <span className="text-right font-semibold text-gym-danger">
                                    {resumoValue("rejeitadas", resumo)}
                                  </span>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-foreground">{temTotal ? `${percentual}%` : "Aguardando total"}</span>
                                    <span className="h-2 flex-1 rounded-full bg-muted">
                                      <span
                                        className="block h-2 rounded-full bg-gym-accent transition-all duration-300"
                                        style={{ width: temTotal ? `${percentual}%` : "0%" }}
                                      />
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {bloco.arquivosSelecionados.length > 0 ? (
                                      bloco.arquivosSelecionados.map((arquivo) => (
                                        <span
                                          key={arquivo.field}
                                          className="rounded-full border border-border px-2 py-1 text-[11px] text-muted-foreground"
                                        >
                                          {arquivo.label}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="rounded-full border border-destructive/40 px-2 py-1 text-[11px] text-destructive">
                                        Bloco não incluído
                                      </span>
                                    )}
                                    {bloco.arquivosAusentes.length > 0 && bloco.status !== "naoSelecionado" ? (
                                      <span className="rounded-full border border-amber-400/40 px-2 py-1 text-[11px] text-amber-100">
                                        {bloco.arquivosAusentes.length} arquivo(s) ausente(s)
                                      </span>
                                    ) : null}
                                  </div>
                                  {resumo?.mensagemParcial ? (
                                    <p className="text-[11px] text-muted-foreground">{resumo.mensagemParcial}</p>
                                  ) : bloco.status === "semLinhas" ? (
                                    <p className="text-[11px] text-muted-foreground">
                                      O backend executou este bloco, mas não encontrou linhas aplicáveis no job.
                                    </p>
                                  ) : bloco.status === "naoSelecionado" ? (
                                    <p className="text-[11px] text-muted-foreground">
                                      O resumo do backend indica que este bloco não participou da execução.
                                    </p>
                                  ) : bloco.arquivosAusentes.length > 0 ? (
                                    <p className="text-[11px] text-muted-foreground">
                                      {bloco.impactoAusencia}
                                    </p>
                                  ) : null}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  {resumoCardsOcultos.length > 0 ? (
                    <details className="rounded-lg border border-border bg-muted/20 p-4">
                      <summary className="cursor-pointer list-none text-sm font-medium text-foreground">
                        Arquivos ignorados nesta execução ({resumoCardsOcultos.length})
                      </summary>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Estes blocos não foram selecionados na criação do job e ficam recolhidos para não poluir a tela.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {resumoCardsOcultos.map((card) => (
                          <span
                            key={String(card.key)}
                            className="rounded-full border border-border px-2 py-1 text-xs text-muted-foreground"
                          >
                            {card.label}
                          </span>
                        ))}
                      </div>
                    </details>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>

          {showRejeicoes && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Rejeições</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {rejeicoesFiltradas.length} caso(s) exibido(s), sem paginação.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="min-w-56">
                    <Label htmlFor="filtro-entidade" className="text-xs">
                      Filtrar por entidade
                    </Label>
                    <Select
                      value={entidadeFiltro}
                      onValueChange={(value) => {
                        setEntidadeFiltro(value);
                      }}
                    >
                      <SelectTrigger className="mt-1 h-9 w-full" id="filtro-entidade">
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ENTIDADE_TODAS}>Todas</SelectItem>
                        {entidadesDisponiveis.map((entidade) => (
                          <SelectItem key={entidade} value={entidade}>
                            {entidade}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="min-w-56">
                    <Label htmlFor="filtro-bloco" className="text-xs">
                      Filtrar por bloco
                    </Label>
                    <Select
                      value={blocoFiltro}
                      onValueChange={(value) => {
                        setBlocoFiltro(value);
                      }}
                    >
                      <SelectTrigger className="mt-1 h-9 w-full" id="filtro-bloco">
                        <SelectValue placeholder="Todos os blocos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={BLOCO_TODOS}>Todos os blocos</SelectItem>
                        {blocosDisponiveis.map((bloco) => (
                          <SelectItem key={bloco.key} value={bloco.key}>
                            {bloco.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {rejeicoesLoading && <p className="text-sm text-muted-foreground">Carregando todas as rejeições…</p>}
                {!rejeicoesLoading && rejeicoesFiltradas.length === 0 && (
                  <div className="flex items-start gap-2 rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                    <AlertCircle className="mt-0.5 size-4" />
                    Nenhum erro encontrado com os filtros atuais.
                  </div>
                )}
                {!rejeicoesLoading && retryRejeicoesSelecionadas.length > 0 ? (
                  <div className="rounded-lg border border-border bg-muted/20 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold">Reprocesso seletivo preparado</p>
                        <p className="text-xs text-muted-foreground">
                          {retryRejeicoesSelecionadas.length} rejeição(ões) selecionada(s) para retry granular por bloco.
                        </p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => void copiarPayloadRetry()}>
                        Copiar payload de retry
                      </Button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {retryRejeicoesSelecionadas.map((rejeicao) => (
                        <span
                          key={rejeicao.idNormalizado}
                          className="rounded-full border border-border px-2 py-1 text-xs text-muted-foreground"
                        >
                          {rejeicao.blocoLabel ?? rejeicao.entidade} · linha {rejeicao.linhaArquivo}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
                {!rejeicoesLoading && rejeicoesFiltradas.length > 0 && (
                  <div className="space-y-3">
                    {rejeicoesFiltradas.map((rejeicao) => {
                      const retrySelecionado = Boolean(retrySelecao[rejeicao.idNormalizado]);
                      return (
                        <div key={rejeicao.idNormalizado} className="rounded-lg border border-border bg-background p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline">{rejeicao.entidade}</Badge>
                                {rejeicao.blocoLabel ? <Badge variant="secondary">{rejeicao.blocoLabel}</Badge> : null}
                                {rejeicao.retryConfig ? (
                                  <Badge variant={rejeicao.retryConfig.suportado ? "secondary" : "outline"}>
                                    {rejeicao.retryConfig.suportado ? "Retry disponível" : "Retry aguardando backend"}
                                  </Badge>
                                ) : null}
                              </div>
                              <p className="text-sm font-medium text-foreground">{rejeicao.motivo}</p>
                              {rejeicao.diagnostico ? (
                                <p className="text-xs text-muted-foreground">{rejeicao.diagnostico}</p>
                              ) : null}
                              {rejeicao.ocorrenciasAgrupadas > 1 ? (
                                <p className="text-xs text-muted-foreground">
                                  Este mesmo erro apareceu {rejeicao.ocorrenciasAgrupadas} vezes nos retries. A tela mostra só uma ocorrência.
                                </p>
                              ) : null}
                            </div>
                            {rejeicao.retryConfig ? (
                              <Label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                <input
                                  type="checkbox"
                                  checked={retrySelecionado}
                                  disabled={!rejeicao.retryConfig.suportado}
                                  onChange={(event) => toggleRetrySelecao(rejeicao, event.target.checked)}
                                  className="accent-gym-accent"
                                />
                                Selecionar para retry
                              </Label>
                            ) : null}
                          </div>

                          <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-2 xl:grid-cols-4">
                            <p>
                              <span className="font-medium text-foreground">Arquivo:</span> {rejeicao.arquivo}
                            </p>
                            <p>
                              <span className="font-medium text-foreground">Linha:</span> {rejeicao.linhaArquivo}
                            </p>
                            <p>
                              <span className="font-medium text-foreground">ID de origem:</span> {rejeicao.sourceId ?? "—"}
                            </p>
                            <p>
                              <span className="font-medium text-foreground">Criado em:</span> {formatDateTime(rejeicao.criadoEm)}
                            </p>
                          </div>

                          {rejeicao.retryConfig?.descricao ? (
                            <div className="mt-3 rounded-md border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                              <span className="font-medium text-foreground">Retry:</span> {rejeicao.retryConfig.descricao}
                            </div>
                          ) : null}

                          {rejeicao.payloadFormatado ? (
                            <div className="mt-3 space-y-2">
                              <p className="text-xs font-medium text-foreground">Dados da linha</p>
                              <pre className="overflow-auto rounded-md border border-border bg-muted/20 p-3 text-[11px] text-muted-foreground">
                                {rejeicao.payloadFormatado}
                              </pre>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
    </>
  );
}
