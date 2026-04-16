"use client";

import Link from "next/link";
import { AlertCircle, FileText } from "lucide-react";
import { SuggestionInput } from "@/components/shared/suggestion-input";
import { MapeamentoAcademiaUnidadeSelector } from "@/backoffice/components/admin/importacao-academia-unidade-selector";
import { ColunasMapeadasModal } from "@/components/admin/colunas-mapeadas-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatCnpj, isValidCnpj } from "@/lib/utils/cnpj";
import { normalizeSubdomain } from "@/lib/utils/subdomain";
import { formatDateTime } from "../date-time-format";
import { getTargetTable } from "../lib/csv-to-table";
import { formatResumoCount, resolveArquivoHistoricoBadge } from "../shared";
import type { EvoImportPageState } from "../hooks/useEvoImportPage";
import { ReutilizarLoteCard } from "./ReutilizarLoteCard";

export function EvoPacoteTab({ state }: { state: EvoImportPageState }) {
  const {
    pacoteMapeamento, setPacoteMapeamento,
    pacoteArquivo, escolherArquivoPacote,
    pacoteDryRun, setPacoteDryRun,
    pacoteJobAlias, setPacoteJobAlias, aliasSugestaoPacote,
    pacoteEvoUnidadeId, setPacoteEvoUnidadeId,
    pacoteAnalisando, pacoteCriandoJob,
    fotoImportEstado, fotoImportEstadoLoading,
    fotoImportJobStatus, fotoImportExecutando,
    pacoteAnalise, pacoteEvoUnidadeResolvida,
    pacoteFilialResolvida, pacoteFiliaisEncontradas,
    pacoteFilialReferencia, pacoteNomeFilialReferencia,
    pacoteUnidadesSugeridas, pacoteSelecaoFilialPendente,
    pacotePrecisaVincularTenant, pacotePrecisaReanaliseManual,
    pacoteArquivosDisponiveis, pacoteColaboradoresBlocos,
    pacoteArquivosSelecionados, setPacoteArquivosSelecionados,
    pacoteArquivosSelecionadosSet,
    arquivosSelecionadosDaAnalise, clientesCsvDisponivelNoPacote,
    handleLoteReutilizado,
    eligibleAdminsPreview, pacoteResumoAcessoAutomatico, tenantFocoAcademiaId,
    tenantFoco, setActiveTab,
    academiaOptions, getUnidadesOptions, loadingMapeamento,
    analisarArquivoPacote, atualizarAnalisePacote,
    criarJobPacote, importarFotosDoPacote, tentarSomenteErrosDoArquivo,
    togglePacoteArquivo,
    aplicarDestinoPacotePorTenantId,
    abrirNovaUnidadePacote, abrirDiagnosticoDoHistoricoArquivo, abrirRejeicoesDoHistoricoArquivo,
    handlePacoteAcademiaNomeChange, handlePacoteUnidadeNomeChange,
    handlePacoteSelecionarAcademia, handlePacoteSelecionarUnidade,
    formatBytes, carregarMapeamentoData,
    novaUnidadePacoteAberta, setNovaUnidadePacoteAberta,
    novaUnidadePacoteSalvando,
    novaUnidadePacoteErro, setNovaUnidadePacoteErro,
    novaUnidadePacoteFieldErrors,
    novaUnidadePacoteForm, updateNovaUnidadePacoteField,
    salvarNovaUnidadePacote,
  } = state;

  const arquivosDisponiveisCount = pacoteArquivosDisponiveis.filter((a) => a.disponivel).length;
  const arquivosSelecionadosCount = arquivosSelecionadosDaAnalise.length;
  const temClientesSelecionado = pacoteArquivosSelecionadosSet.has("clientes");
  const temFuncionariosSelecionado = pacoteArquivosSelecionadosSet.has("funcionarios");
  const mostrarAvisoAcessos = temClientesSelecionado || temFuncionariosSelecionado;

  async function retryErrosSelecionados() {
    const alvos = pacoteArquivosDisponiveis.filter((arquivo) => {
      if (!pacoteArquivosSelecionadosSet.has(arquivo.chave)) return false;
      if (!arquivo.historico.retrySomenteErrosSuportado) return false;
      const status = arquivo.historico.status;
      if (status !== "comErros" && status !== "parcial") return false;
      return true;
    });
    for (const arquivo of alvos) {
      await tentarSomenteErrosDoArquivo(arquivo);
    }
  }

  const podeRetryErrosSelecionados = pacoteArquivosDisponiveis.some((arquivo) => {
    if (!pacoteArquivosSelecionadosSet.has(arquivo.chave)) return false;
    if (!arquivo.historico.retrySomenteErrosSuportado) return false;
    const status = arquivo.historico.status;
    return status === "comErros" || status === "parcial";
  });

  return (
    <>
      <div className="space-y-6 pb-12">
      <ReutilizarLoteCard
        tenantId={tenantFoco || undefined}
        onReutilizado={handleLoteReutilizado}
      />

      {pacoteAnalise ? (
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border py-3 -mx-1 px-1 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Novo lote</p>
            <p className="text-sm text-muted-foreground truncate">
              {arquivosSelecionadosCount} {arquivosSelecionadosCount === 1 ? "arquivo selecionado" : "arquivos selecionados"} de {arquivosDisponiveisCount} {arquivosDisponiveisCount === 1 ? "disponível" : "disponíveis"}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={criarJobPacote}
            disabled={pacoteCriandoJob || arquivosSelecionadosCount === 0}
          >
            {pacoteCriandoJob ? "Criando job..." : "Criar job"}
          </Button>
        </div>
      ) : null}

      <Card id="evo-pacote-upload">
        <CardHeader className="border-b border-border/50 bg-muted/20 pb-4">
          <CardTitle className="text-lg">Etapa 1: Analisar pacote ZIP</CardTitle>
          <p className="text-sm text-muted-foreground">Se quiser, já selecione a academia para contextualizar as sugestões. A EVO Unidade fica para depois da leitura do ZIP.</p>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Academia</Label>
                  <SuggestionInput
                    value={pacoteMapeamento.academiaNome}
                    onValueChange={handlePacoteAcademiaNomeChange}
                    onSelect={handlePacoteSelecionarAcademia}
                    options={academiaOptions}
                    minCharsToSearch={0}
                    placeholder="Pesquise por nome da academia"
                    emptyText={loadingMapeamento ? "Carregando academias..." : "Nenhuma academia encontrada"}
                  />
                  <p className="text-xs text-muted-foreground">
                    Opcional nesta etapa. Ajuda a filtrar sugestões e a abertura do cadastro de nova unidade.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pacoteArquivo">Arquivo</Label>
                  <Input
                    id="pacoteArquivo"
                    type="file"
                    accept=".zip,.csv,application/zip,text/csv"
                    onChange={escolherArquivoPacote}
                  />
                  <p className="text-xs text-muted-foreground">
                    Arquivo .zip contendo exportação EVO ou CSV unitário.
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex flex-wrap items-center gap-4">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={pacoteDryRun}
                    onChange={(e) => setPacoteDryRun(e.target.checked)}
                    className="accent-gym-accent"
                  />
                  Modo de simulação (Apenas validar, não salvar)
                </Label>
                <div className="min-w-72 flex-1 space-y-2">
                  <Label htmlFor="pacoteJobAlias">Nome de identificação deste lote</Label>
                  <Input
                    id="pacoteJobAlias"
                    value={pacoteJobAlias}
                    onChange={(e) => setPacoteJobAlias(e.target.value)}
                    placeholder={aliasSugestaoPacote}
                  />
                  <p className="text-xs text-muted-foreground">
                    Opcional. Nome livre para facilitar a busca deste lote no histórico.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <ColunasMapeadasModal
                  arquivoSelecionado={null}
                  arquivosDisponiveis={pacoteArquivosDisponiveis}
                />
                <Button onClick={analisarArquivoPacote} disabled={pacoteAnalisando || !pacoteArquivo}>
                  {pacoteAnalisando ? "Analisando pacote..." : "Analisar pacote"}
                </Button>
              </div>

              {pacoteArquivo && (
                <p className="text-xs text-muted-foreground">
                  Arquivo selecionado: {pacoteArquivo.name} ({formatBytes(pacoteArquivo.size)})
                </p>
              )}
        </CardContent>
      </Card>

      {pacoteAnalise && (
        <>
        <Card className="relative z-10 overflow-visible border-gym-accent/40 shadow-sm">
          <div className="bg-gym-accent/10 md:px-6 px-4 md:py-3 py-4 text-sm flex flex-wrap md:gap-x-8 gap-x-4 gap-y-2 text-muted-foreground border-b border-gym-accent/20">
            <p><span className="font-medium text-foreground">Upload ID:</span> {pacoteAnalise.uploadId}</p>
            <p><span className="font-medium text-foreground">EVO Unidade:</span> {pacoteEvoUnidadeResolvida ?? "pendente"}</p>
            <p><span className="font-medium text-foreground">Expira em:</span> {formatDateTime(pacoteAnalise.expiraEm)}</p>
            <p><span className="font-medium text-foreground">Arquivos Detectados:</span> {pacoteAnalise.arquivos.length}</p>
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Etapa 2: Validar Origem e Destino</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
                  {pacoteFilialResolvida && (
                    <>
                      <div className="space-y-3 rounded-md border border-border bg-background p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold">Filial detectada no pacote</p>
                          {pacoteEvoUnidadeResolvida ? (
                            <Badge variant="secondary">EVO Unidade {pacoteEvoUnidadeResolvida}</Badge>
                          ) : (
                            <Badge variant="outline">Sem EVO Unidade resolvida</Badge>
                          )}
                        </div>
                        <div className="grid gap-2 text-sm md:grid-cols-2">
                          <p>
                            <span className="font-medium">Nome no pacote:</span> {pacoteNomeFilialReferencia.nomeOriginal || "—"}
                          </p>
                          <p>
                            <span className="font-medium">Unidade/filial:</span> {pacoteNomeFilialReferencia.unidadeNome || "—"}
                          </p>
                          <p>
                            <span className="font-medium">Documento:</span> {pacoteFilialResolvida.documento?.trim() || "—"}
                          </p>
                          <p>
                            <span className="font-medium">Abreviação:</span> {pacoteFilialResolvida.abreviacao?.trim() || "—"}
                          </p>
                          <p>
                            <span className="font-medium">Local:</span>{" "}
                            {[pacoteFilialResolvida.bairro, pacoteFilialResolvida.cidade]
                              .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
                              .join(" · ") || "—"}
                          </p>
                          <p>
                            <span className="font-medium">Email:</span> {pacoteFilialResolvida.email?.trim() || "—"}
                          </p>
                          <p>
                            <span className="font-medium">Telefone:</span> {pacoteFilialResolvida.telefone?.trim() || "—"}
                          </p>
                          <p>
                            <span className="font-medium">EVO Filial ID:</span>{" "}
                            {typeof pacoteFilialResolvida.evoFilialId === "number" ? pacoteFilialResolvida.evoFilialId : "—"}
                          </p>
                          <p>
                            <span className="font-medium">EVO Academia ID:</span>{" "}
                            {typeof pacoteFilialResolvida.evoAcademiaId === "number" ? pacoteFilialResolvida.evoAcademiaId : "—"}
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  {pacoteFiliaisEncontradas.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-sm font-semibold">Filiais encontradas no pacote</p>
                        <div className="grid gap-2">
                          {pacoteFiliaisEncontradas.map((filial, index) => {
                            const nome = filial.nome?.trim() || filial.abreviacao?.trim() || `Filial ${index + 1}`;
                            const detalhes = [
                              filial.documento?.trim(),
                              filial.bairro?.trim(),
                              filial.cidade?.trim(),
                              filial.email?.trim(),
                              filial.telefone?.trim(),
                            ].filter((value): value is string => Boolean(value));
                            const filialResolvida = pacoteEvoUnidadeResolvida && filial.evoFilialId === pacoteEvoUnidadeResolvida;
                            return (
                              <div key={`${filial.evoFilialId ?? filial.documento ?? nome}-${index}`} className="rounded-md border border-border bg-background px-3 py-2 text-sm">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-medium">{nome}</p>
                                  {filialResolvida ? <Badge variant="secondary">Resolvida</Badge> : null}
                                  {typeof filial.evoFilialId === "number" ? (
                                    <Badge variant="outline">EVO {filial.evoFilialId}</Badge>
                                  ) : null}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {detalhes.length > 0 ? detalhes.join(" · ") : "Sem detalhes adicionais."}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}

                  {!pacoteEvoUnidadeResolvida && (
                    <>
                      <Separator />
                      <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                        <AlertCircle className="mt-0.5 size-4" />
                        <div>
                          <p className="font-semibold">
                            {pacoteSelecaoFilialPendente ? "Seleção de filial pendente" : "EVO Unidade ainda não resolvida"}
                          </p>
                          <p>
                            {pacoteSelecaoFilialPendente
                              ? "O pacote contém múltiplas filiais. Informe manualmente a EVO Unidade correta e rode a análise novamente antes de criar o job."
                              : "A análise ainda não retornou uma EVO Unidade válida. Se necessário, preencha o campo manualmente e reanalise o pacote antes de criar o job."}
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  <Separator className="my-2" />

                  <div className="space-y-3">

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="pacoteEvoUnidadeId">EVO Unidade</Label>
                        <Input
                          id="pacoteEvoUnidadeId"
                          type="number"
                          min={1}
                          placeholder="Ex.: 1"
                          value={pacoteEvoUnidadeId}
                          onChange={(e) => {
                            setPacoteEvoUnidadeId(e.target.value);
                            setPacoteMapeamento((current) => ({ ...current, idFilialEvo: e.target.value }));
                          }}
                        />
                        <p className="text-xs text-muted-foreground">
                          Se você informar manualmente uma EVO Unidade depois da análise, use{" "}
                          {pacotePrecisaReanaliseManual ? '"Atualizar análise"' : '"Analisar pacote"'} para reprocessar o ZIP com esse valor.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Academia selecionada</Label>
                        <div className="rounded-md border border-border bg-background px-3 py-2 text-sm">
                          <p className="font-medium">{pacoteMapeamento.academiaNome || "Nenhuma academia selecionada"}</p>
                          <p className="text-xs text-muted-foreground">
                            {pacoteMapeamento.academiaId
                              ? "Você pode ajustar a academia e a unidade logo abaixo, se necessário."
                              : "Selecione uma academia no passo 1 ou ajuste abaixo antes de criar o job."}
                          </p>
                        </div>
                      </div>
                    </div>

                    {pacoteUnidadesSugeridas.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Sugestões de unidades existentes</p>
                        <div className="grid gap-2">
                          {pacoteUnidadesSugeridas.map(({ unidade, academiaNome }) => {
                            const selecionada = unidade.id === pacoteMapeamento.tenantId;
                            return (
                              <div
                                key={unidade.id}
                                className="flex flex-col gap-3 rounded-md border border-border bg-background px-3 py-2 text-sm md:flex-row md:items-center md:justify-between"
                              >
                                <div className="space-y-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="font-medium">{unidade.nome}</p>
                                    {selecionada ? <Badge variant="secondary">Selecionada</Badge> : null}
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {academiaNome}
                                    {unidade.documento ? ` · ${unidade.documento}` : ""}
                                    {unidade.endereco?.cidade ? ` · ${unidade.endereco.cidade}` : ""}
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant={selecionada ? "secondary" : "outline"}
                                  onClick={() => aplicarDestinoPacotePorTenantId(unidade.id)}
                                >
                                  {selecionada ? "Destino atual" : "Usar esta unidade"}
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Nenhuma unidade existente corresponde automaticamente aos metadados detectados.
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={abrirNovaUnidadePacote}
                        disabled={!pacoteFilialReferencia || !pacoteMapeamento.academiaId}
                      >
                        Criar nova unidade
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void carregarMapeamentoData()}
                        disabled={loadingMapeamento}
                      >
                        {loadingMapeamento ? "Atualizando unidades..." : "Atualizar unidades"}
                      </Button>
                    </div>

                    <MapeamentoAcademiaUnidadeSelector
                      academiaNome={pacoteMapeamento.academiaNome}
                      unidadeNome={pacoteMapeamento.unidadeNome}
                      academiaId={pacoteMapeamento.academiaId}
                      academiaOptions={academiaOptions}
                      unidadesOptions={getUnidadesOptions(pacoteMapeamento.academiaId)}
                      loadingAcademias={loadingMapeamento}
                      onAcademiaNomeChange={handlePacoteAcademiaNomeChange}
                      onUnidadeNomeChange={handlePacoteUnidadeNomeChange}
                      onAcademiaSelect={handlePacoteSelecionarAcademia}
                      onUnidadeSelect={handlePacoteSelecionarUnidade}
                    />

                    {pacoteMapeamento.academiaId && pacoteMapeamento.tenantId ? (
                      <div className="rounded-md border border-border bg-background px-3 py-2 text-sm">
                        <p className="font-medium">Destino selecionado</p>
                        <p className="text-muted-foreground">
                          {pacoteMapeamento.academiaNome || "Academia não informada"} · {pacoteMapeamento.unidadeNome || "Unidade não informada"}
                        </p>
                        {pacotePrecisaVincularTenant ? (
                          <p className="mt-2 text-xs text-muted-foreground">
                            O pacote atual ainda será vinculado a essa unidade antes da criação do job.
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                        <AlertCircle className="mt-0.5 size-4" />
                        <div>
                          <p className="font-semibold">Destino ainda não selecionado</p>
                          <p>Escolha uma unidade existente ou crie uma nova unidade antes de criar o job.</p>
                        </div>
                      </div>
                    )}

                    {pacoteMapeamento.tenantId ? (
                      <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold">Fotos dos clientes</p>
                            <p className="text-xs text-muted-foreground">
                              Baixa as imagens referenciadas no <span className="font-medium">CLIENTES.csv</span> e grava no MinIO da unidade.
                            </p>
                          </div>
                          <Badge variant={fotoImportEstado?.importado ? "secondary" : "outline"}>
                            {fotoImportEstadoLoading
                              ? "Consultando estado..."
                              : fotoImportEstado?.importado
                                ? "Já importado"
                                : "Pendente"}
                          </Badge>
                        </div>

                        {fotoImportEstado ? (
                          <div className="grid gap-3 text-sm md:grid-cols-2">
                            <div className="rounded-md border border-border bg-background px-3 py-2">
                              <p className="font-medium">Alunos na unidade</p>
                              <p className="text-muted-foreground">{fotoImportEstado.totalAlunos}</p>
                            </div>
                            <div className="rounded-md border border-border bg-background px-3 py-2">
                              <p className="font-medium">Vínculos EVO cliente</p>
                              <p className="text-muted-foreground">{fotoImportEstado.vinculosEvoClientes}</p>
                            </div>
                            <div className="rounded-md border border-border bg-background px-3 py-2">
                              <p className="font-medium">Alunos com foto</p>
                              <p className="text-muted-foreground">{fotoImportEstado.alunosComFoto}</p>
                            </div>
                            <div className="rounded-md border border-border bg-background px-3 py-2">
                              <p className="font-medium">Fotos importadas via EVO</p>
                              <p className="text-muted-foreground">{fotoImportEstado.alunosComFotoImportada}</p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            O estado da importação de fotos será exibido assim que a unidade for consultada.
                          </p>
                        )}

                        <div className="rounded-md border border-border bg-background px-3 py-2 text-xs text-muted-foreground">
                          Bucket: <span className="font-mono text-foreground">{fotoImportEstado?.bucket || "conceito-fit-fotos"}</span>
                          {" · "}
                          Prefixo: <span className="font-mono text-foreground">{fotoImportEstado?.storagePrefix || "—"}</span>
                        </div>

                        {!pacoteAnalise?.uploadId ? (
                          <div className="flex items-start gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
                            <AlertCircle className="mt-0.5 size-4" />
                            <p>Analise um pacote EVO para habilitar a importação das imagens.</p>
                          </div>
                        ) : !clientesCsvDisponivelNoPacote ? (
                          <div className="flex items-start gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
                            <AlertCircle className="mt-0.5 size-4" />
                            <p>O pacote atual não possui CLIENTES.csv disponível para baixar as fotos.</p>
                          </div>
                        ) : null}

                        {fotoImportJobStatus ? (
                          <div className="rounded-md border border-border bg-background px-3 py-2 text-sm">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="font-medium">Job de fotos</p>
                              <Badge variant={fotoImportJobStatus.status === "CONCLUIDO" ? "secondary" : fotoImportJobStatus.status === "PROCESSANDO" ? "outline" : "destructive"}>
                                {fotoImportJobStatus.status}
                              </Badge>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {fotoImportJobStatus.jobId}
                            </p>
                            {typeof fotoImportJobStatus.total === "number" ? (
                              <p className="mt-2 text-xs text-muted-foreground">
                                Total {fotoImportJobStatus.total} · Importadas {fotoImportJobStatus.uploaded ?? 0} · Ignoradas {fotoImportJobStatus.skipped ?? 0} · Erros {fotoImportJobStatus.errors ?? 0}
                              </p>
                            ) : null}
                            {fotoImportJobStatus.erro ? (
                              <p className="mt-2 text-xs text-destructive">{fotoImportJobStatus.erro}</p>
                            ) : null}
                          </div>
                        ) : null}

                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-xs text-muted-foreground">
                            {pacoteDryRun
                              ? "Modo de simulação ativo: o job valida e baixa as imagens, mas não grava no storage."
                              : fotoImportEstado?.importado
                                ? "A unidade já possui fotos importadas. Você pode rodar uma nova importação manual ou forçar uma reimportação completa."
                                : "A ação usa o pacote analisado e atualiza as fotos dos alunos diretamente no storage da unidade."}
                          </p>
                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              type="button"
                              onClick={() => void importarFotosDoPacote(false)}
                              disabled={
                                fotoImportExecutando ||
                                fotoImportJobStatus?.status === "PROCESSANDO" ||
                                !pacoteAnalise?.uploadId ||
                                !clientesCsvDisponivelNoPacote
                              }
                            >
                              {fotoImportExecutando || fotoImportJobStatus?.status === "PROCESSANDO"
                                ? "Importando fotos..."
                                : "Importar fotos"}
                            </Button>
                            {fotoImportEstado?.importado ? (
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => void importarFotosDoPacote(true)}
                                disabled={
                                  fotoImportExecutando ||
                                  fotoImportJobStatus?.status === "PROCESSANDO" ||
                                  !pacoteAnalise?.uploadId ||
                                  !clientesCsvDisponivelNoPacote
                                }
                              >
                                Reimportar tudo
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border/50 bg-muted/20 pb-4">
            <CardTitle className="text-lg">Etapa 3: Revisar Malha de Dados</CardTitle>
            <p className="text-sm text-muted-foreground">A malha de colaboradores evidencia o que o backend reconheceu no pacote (completo, parcial ou não reconhecido). Marque ou desmarque chaves individuais.</p>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
                  {pacoteArquivosDisponiveis.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum arquivo reconhecido neste pacote.</p>
                  ) : (
                    <div className="space-y-3">
                      <div className="space-y-3 rounded-lg border border-border bg-background p-4">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold">Malha de colaboradores</p>
                          <p className="text-xs text-muted-foreground">
                            Se um arquivo existir no ZIP, mas não estiver nesta malha, ele não foi reconhecido pelo backend durante a análise do pacote.
                          </p>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          {pacoteColaboradoresBlocos.map((bloco) => {
                            const badgeLabel =
                              bloco.status === "completo"
                                ? "Completo"
                                : bloco.status === "parcial"
                                  ? "Parcial"
                                  : bloco.status === "naoEnviado"
                                    ? "Não enviado"
                                    : "Não reconhecido";
                            const badgeClassName =
                              bloco.status === "completo"
                                ? "bg-emerald-500/15 text-emerald-200 border-emerald-400/40"
                                : bloco.status === "parcial"
                                  ? "bg-amber-500/15 text-amber-200 border-amber-400/40"
                                  : bloco.status === "naoEnviado"
                                    ? "bg-slate-500/15 text-slate-200 border-slate-400/40"
                                    : "bg-destructive/10 text-destructive border-destructive/40";
                            return (
                              <div key={bloco.key} className="rounded-md border border-border bg-muted/20 p-3">
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                  <div>
                                    <p className="font-medium">{bloco.label}</p>
                                    <p className="text-xs text-muted-foreground">{bloco.descricao}</p>
                                  </div>
                                  <Badge variant="outline" className={badgeClassName}>
                                    {badgeLabel}
                                  </Badge>
                                </div>
                                <div className="mt-3 space-y-2">
                                  {bloco.arquivos.map((arquivo) => (
                                    <div
                                      key={arquivo.chave}
                                      className="flex items-start justify-between gap-3 rounded-md border border-border bg-background px-3 py-2"
                                    >
                                      <div className="space-y-1">
                                        <p className="text-sm font-medium">{arquivo.arquivoEsperado}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {arquivo.descricao ?? "Arquivo auxiliar de colaboradores."}
                                        </p>
                                      </div>
                                      <Badge variant={arquivo.disponivel ? "secondary" : "outline"}>
                                        {arquivo.disponivel
                                          ? "Disponível"
                                          : arquivo.catalogadoPeloBackend
                                            ? "Não enviado"
                                            : "Não reconhecido"}
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                                {bloco.status !== "completo" ? (
                                  <p className="mt-3 text-xs text-muted-foreground">{bloco.impactoAusencia}</p>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs text-muted-foreground">
                          Selecionados: {arquivosSelecionadosDaAnalise.length} de {pacoteArquivosDisponiveis.filter((arquivo) => arquivo.disponivel).length} disponíveis
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setPacoteArquivosSelecionados(
                                pacoteArquivosDisponiveis
                                  .filter((arquivo) => arquivo.disponivel && getTargetTable(arquivo.chave) !== null)
                                  .map((arquivo) => arquivo.chave)
                              )
                            }
                          >
                            Selecionar disponíveis
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setPacoteArquivosSelecionados([])}
                          >
                            Desmarcar todos
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={!podeRetryErrosSelecionados || pacoteCriandoJob}
                            onClick={() => {
                              void retryErrosSelecionados();
                            }}
                          >
                            Retry erros selecionados
                          </Button>
                        </div>
                      </div>

                      {mostrarAvisoAcessos ? (
                        <div className="rounded-md border border-border bg-secondary/20 px-3 py-2 text-xs text-muted-foreground">
                          <p className="font-medium text-foreground">
                            Propagação automática de acessos
                          </p>
                          <p className="mt-1">
                            {eligibleAdminsPreview.loading
                              ? "Consultando propagação automática de acessos..."
                              : pacoteResumoAcessoAutomatico ?? "Nenhum usuário administrativo está elegível para propagação automática nesta academia."}
                          </p>
                          {tenantFocoAcademiaId ? (
                            <Link
                              href={`/admin/seguranca/usuarios?academiaId=${tenantFocoAcademiaId}&eligible=1`}
                              className="mt-2 inline-flex text-xs font-medium text-gym-accent hover:underline"
                            >
                              Abrir segurança
                            </Link>
                          ) : null}
                        </div>
                      ) : null}

                      <TooltipProvider delayDuration={100}>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-8" />
                              <TableHead>Arquivo CSV</TableHead>
                              <TableHead>Tabela destino</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Processadas</TableHead>
                              <TableHead className="text-right">Rejeitadas</TableHead>
                              <TableHead>Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pacoteArquivosDisponiveis.map((arquivo) => {
                              const selecionado = pacoteArquivosSelecionadosSet.has(arquivo.chave);
                              const badgeHistorico = resolveArquivoHistoricoBadge(arquivo.historico);
                              const targetTable = getTargetTable(arquivo.chave);
                              const semTabela = targetTable === null;
                              const podeAbrirRejeicoes = Boolean(arquivo.blocoFiltro || arquivo.entidadeFiltro)
                                && (arquivo.historico.status === "comErros" || arquivo.historico.status === "parcial");
                              const podeRetrySomenteErros = arquivo.historico.retrySomenteErrosSuportado
                                && (arquivo.historico.status === "comErros" || arquivo.historico.status === "parcial")
                                && (arquivo.historico.status as string) !== "processando";
                              const labelRetrySomenteErros = arquivo.historico.retrySomenteErrosSuportado
                                ? "Tentar somente erros"
                                : "Tentar somente erros (aguardando backend)";
                              const rejeitadas = arquivo.historico.resumo?.rejeitadas ?? null;
                              const checkboxDisabled = !arquivo.disponivel || semTabela;
                              const linhaMuted = semTabela;
                              const podeAbrirDiagnostico = Boolean(arquivo.historico.jobIdExibicao);
                              const retryButton = (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="h-7"
                                  disabled={!podeRetrySomenteErros || pacoteCriandoJob}
                                  onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    void tentarSomenteErrosDoArquivo(arquivo);
                                  }}
                                >
                                  Retry erros
                                </Button>
                              );
                              return (
                                <TableRow
                                  key={arquivo.chave}
                                  className={cn(linhaMuted && "text-muted-foreground opacity-60")}
                                >
                                  <TableCell>
                                    <input
                                      type="checkbox"
                                      aria-label={`Selecionar ${arquivo.rotulo || arquivo.chave}`}
                                      disabled={checkboxDisabled}
                                      checked={selecionado}
                                      onChange={(e) => togglePacoteArquivo(arquivo.chave, e.target.checked)}
                                    />
                                  </TableCell>
                                  <TableCell className="max-w-[240px]">
                                    <p className="font-medium truncate">{arquivo.rotulo || arquivo.chave}</p>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {arquivo.arquivoEsperado} · {formatBytes(arquivo.tamanhoBytes)}
                                    </p>
                                    {!arquivo.disponivel ? (
                                      <p className="text-[11px] text-destructive">
                                        {arquivo.catalogadoPeloBackend ? "Não enviado" : "Não reconhecido"}
                                      </p>
                                    ) : null}
                                  </TableCell>
                                  <TableCell className="font-mono text-xs">
                                    {targetTable ?? "—"}
                                  </TableCell>
                                  <TableCell>
                                    {podeAbrirDiagnostico ? (
                                      <button
                                        type="button"
                                        className={cn(
                                          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition hover:opacity-90 focus-ring-brand",
                                          badgeHistorico.className,
                                        )}
                                        onClick={(event) => {
                                          event.preventDefault();
                                          event.stopPropagation();
                                          abrirDiagnosticoDoHistoricoArquivo(arquivo);
                                        }}
                                        title="Abrir diagnóstico deste processamento"
                                      >
                                        {badgeHistorico.label}
                                      </button>
                                    ) : (
                                      <Badge variant="outline" className={cn("text-[11px]", badgeHistorico.className)}>
                                        {badgeHistorico.label}
                                      </Badge>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right tabular-nums">
                                    {formatResumoCount(arquivo.historico.resumo?.processadas ?? null)}
                                  </TableCell>
                                  <TableCell
                                    className={cn(
                                      "text-right tabular-nums",
                                      typeof rejeitadas === "number" && rejeitadas > 0 ? "text-destructive font-medium" : undefined
                                    )}
                                  >
                                    {formatResumoCount(rejeitadas)}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                      {podeAbrirRejeicoes ? (
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="outline"
                                          className="h-7"
                                          onClick={(event) => {
                                            event.preventDefault();
                                            event.stopPropagation();
                                            abrirRejeicoesDoHistoricoArquivo(arquivo);
                                          }}
                                        >
                                          Rejeições
                                        </Button>
                                      ) : null}
                                      {podeRetrySomenteErros ? (
                                        retryButton
                                      ) : (
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <span className="inline-flex">{retryButton}</span>
                                          </TooltipTrigger>
                                          <TooltipContent>{labelRetrySomenteErros}</TooltipContent>
                                        </Tooltip>
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TooltipProvider>
                    </div>
                  )}

                  <div className="mt-6 flex flex-wrap gap-4 items-center justify-between border-t border-border pt-6">
                    <p className="text-sm text-muted-foreground hidden sm:block">Revise os passos acima antes de confirmar a importação do lote.</p>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={atualizarAnalisePacote} disabled={pacoteAnalisando}>
                        {pacotePrecisaReanaliseManual ? "Reanalisar pacote" : "Atualizar análise"}
                      </Button>
                      <Button onClick={criarJobPacote} disabled={pacoteCriandoJob || arquivosSelecionadosDaAnalise.length === 0}>
                        {pacoteCriandoJob ? "Criando job..." : "Criar Job"}
                      </Button>
                    </div>
                  </div>
          </CardContent>
        </Card>
        </>
      )}
    </div>
      <Dialog
        open={novaUnidadePacoteAberta}
        onOpenChange={(open) => {
          setNovaUnidadePacoteAberta(open);
          if (!open) {
            setNovaUnidadePacoteErro(null);
          }
        }}
      >
        <DialogContent className="border-border bg-card sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar nova unidade a partir do ZIP</DialogTitle>
            <DialogDescription>
              Os dados detectados no pacote foram pre-carregados e podem ser ajustados antes da criacao da unidade.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-md border border-border bg-muted/20 px-3 py-2 text-sm">
              <p className="font-medium">{pacoteMapeamento.academiaNome || "Academia nao informada"}</p>
              <p className="text-xs text-muted-foreground">
                A nova unidade sera criada dentro desta academia. O groupId e herdado automaticamente dela.
              </p>
            </div>

            <div className="rounded-md border border-gym-accent/30 bg-gym-accent/5 px-3 py-2 text-sm">
              <p className="font-medium text-foreground">Campos obrigatorios desta criacao</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Nome da unidade, subdominio, CNPJ e email. Os campos marcados com * precisam ser preenchidos antes de salvar.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="nova-unidade-pacote-nome-original">Nome detectado no pacote</Label>
                <Input
                  id="nova-unidade-pacote-nome-original"
                  value={novaUnidadePacoteForm.nomeOriginal}
                  onChange={(event) => updateNovaUnidadePacoteField("nomeOriginal", event.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Exemplo deste pacote: academia + unidade/filial, como `Academia Sergio Amim - S6`.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nova-unidade-pacote-nome">Nome da unidade *</Label>
                <Input
                  id="nova-unidade-pacote-nome"
                  required
                  aria-invalid={Boolean(novaUnidadePacoteFieldErrors.nome)}
                  value={novaUnidadePacoteForm.nome}
                  onChange={(event) => updateNovaUnidadePacoteField("nome", event.target.value)}
                />
                {novaUnidadePacoteFieldErrors.nome ? (
                  <p className="text-xs text-destructive">{novaUnidadePacoteFieldErrors.nome}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nova-unidade-pacote-subdomain">Subdominio *</Label>
                <Input
                  id="nova-unidade-pacote-subdomain"
                  required
                  aria-invalid={Boolean(novaUnidadePacoteFieldErrors.subdomain)}
                  placeholder="academia-sergio-amim-s6"
                  value={novaUnidadePacoteForm.subdomain}
                  onChange={(event) => updateNovaUnidadePacoteField("subdomain", normalizeSubdomain(event.target.value))}
                />
                {novaUnidadePacoteFieldErrors.subdomain ? (
                  <p className="text-xs text-destructive">{novaUnidadePacoteFieldErrors.subdomain}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Obrigatorio. O valor e normalizado para letras minusculas, numeros e hifens.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nova-unidade-pacote-documento">CNPJ *</Label>
                <Input
                  id="nova-unidade-pacote-documento"
                  inputMode="numeric"
                  required
                  aria-invalid={Boolean(novaUnidadePacoteFieldErrors.documento)}
                  placeholder="00.000.000/0000-00"
                  value={novaUnidadePacoteForm.documento}
                  onChange={(event) => updateNovaUnidadePacoteField("documento", formatCnpj(event.target.value))}
                />
                {novaUnidadePacoteFieldErrors.documento ? (
                  <p className="text-xs text-destructive">{novaUnidadePacoteFieldErrors.documento}</p>
                ) : novaUnidadePacoteForm.documento && !isValidCnpj(novaUnidadePacoteForm.documento) ? (
                  <p className="text-xs text-destructive">Informe um CNPJ valido no padrao 00.000.000/0000-00.</p>
                ) : (
                  <p className="text-xs text-muted-foreground">O CNPJ e padronizado e validado antes de salvar.</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nova-unidade-pacote-email">Email *</Label>
                <Input
                  id="nova-unidade-pacote-email"
                  type="email"
                  required
                  aria-invalid={Boolean(novaUnidadePacoteFieldErrors.email)}
                  value={novaUnidadePacoteForm.email}
                  onChange={(event) => updateNovaUnidadePacoteField("email", event.target.value)}
                />
                {novaUnidadePacoteFieldErrors.email ? (
                  <p className="text-xs text-destructive">{novaUnidadePacoteFieldErrors.email}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Obrigatorio. Este email sera salvo como contato principal e precisa ser valido.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nova-unidade-pacote-telefone">Telefone</Label>
                <Input
                  id="nova-unidade-pacote-telefone"
                  value={novaUnidadePacoteForm.telefone}
                  onChange={(event) => updateNovaUnidadePacoteField("telefone", event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nova-unidade-pacote-bairro">Bairro</Label>
                <Input
                  id="nova-unidade-pacote-bairro"
                  value={novaUnidadePacoteForm.bairro}
                  onChange={(event) => updateNovaUnidadePacoteField("bairro", event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nova-unidade-pacote-cidade">Cidade</Label>
                <Input
                  id="nova-unidade-pacote-cidade"
                  value={novaUnidadePacoteForm.cidade}
                  onChange={(event) => updateNovaUnidadePacoteField("cidade", event.target.value)}
                />
              </div>
            </div>

            {novaUnidadePacoteErro ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {novaUnidadePacoteErro}
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setNovaUnidadePacoteAberta(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={salvarNovaUnidadePacote} disabled={novaUnidadePacoteSalvando}>
              {novaUnidadePacoteSalvando ? "Criando unidade..." : "Criar e usar unidade"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
