"use client";

import { AlertCircle, CheckCircle2, CircleDashed } from "lucide-react";
import { ColunasMapeadasModal } from "@/components/admin/colunas-mapeadas-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EvoImportPageState } from "../hooks/useEvoImportPage";
import { ReutilizarLoteCard } from "./ReutilizarLoteCard";

export function EvoDestinoFotosCard({ state }: { state: EvoImportPageState }) {
  const {
    pacoteMapeamento,
    pacoteArquivo,
    escolherArquivoPacote,
    pacoteDryRun,
    setPacoteDryRun,
    pacoteJobAlias,
    setPacoteJobAlias,
    aliasSugestaoPacote,
    pacoteAnalisando,
    pacoteAnalise,
    pacotePrecisaReanaliseManual,
    pacoteArquivosDisponiveis,
    handleLoteReutilizado,
    analisarArquivoPacote,
    fotoImportEstado,
    fotoImportEstadoLoading,
    fotoImportJobStatus,
    fotoImportExecutando,
    fotoImportUltimoLote,
    fotoImportUltimoLoteLoading,
    fotoImportUltimoLoteErro,
    fotoImportUltimoLoteTemClientesCsv,
    clientesCsvDisponivelNoPacote,
    importarFotosDoPacote,
    formatBytes,
  } = state;

  const destinoSelecionado = Boolean(pacoteMapeamento.academiaId && pacoteMapeamento.tenantId);
  const pacoteSelecionado = Boolean(pacoteArquivo);
  const pacoteProntoParaFotos = Boolean(pacoteAnalise?.uploadId && clientesCsvDisponivelNoPacote);
  const ultimoLoteProntoParaFotos = Boolean(fotoImportUltimoLote && fotoImportUltimoLoteTemClientesCsv);
  const fonteFotosDisponivel = pacoteProntoParaFotos || ultimoLoteProntoParaFotos;
  const jobProcessando = fotoImportJobStatus?.status === "PROCESSANDO";
  const botoesFotosDesabilitados =
    fotoImportExecutando || jobProcessando || !destinoSelecionado || !fonteFotosDisponivel;
  const acaoPrincipalFotos = fotoImportEstado?.importado ? "Importar novamente" : "Importar fotos";
  const acaoAnaliseLabel = pacoteAnalisando
    ? "Analisando pacote..."
    : pacotePrecisaReanaliseManual
      ? "Reanalisar pacote"
      : pacoteAnalise?.uploadId
        ? "Atualizar análise"
        : "Analisar pacote";
  const statusPacoteLabel = pacoteAnalise?.uploadId
    ? "Pacote analisado"
    : pacoteSelecionado
      ? "Pacote selecionado"
      : "Sem pacote";
  const statusLoteFotosLabel = pacoteProntoParaFotos
    ? "Pacote atual pronto para fotos"
    : ultimoLoteProntoParaFotos
      ? "Último lote disponível para fotos"
      : fotoImportUltimoLoteLoading
        ? "Consultando último lote"
        : "Sem fonte de fotos";
  const requisitoLoteLabel = pacoteProntoParaFotos
    ? "Pacote atual analisado com CLIENTES.csv."
    : ultimoLoteProntoParaFotos
      ? "Último lote reutilizável contém CLIENTES.csv."
      : fotoImportUltimoLoteLoading
        ? "Consultando se a unidade já possui lote reutilizável."
        : "Nenhum pacote atual ou lote reutilizável com CLIENTES.csv.";
  const motivoBloqueioFotos = !destinoSelecionado
    ? "Selecione Academia e Unidade."
    : !fonteFotosDisponivel
      ? "A unidade ainda não possui pacote atual nem último lote com CLIENTES.csv."
      : jobProcessando
        ? "Existe um job de fotos em processamento."
        : null;
  const hintBotoesFotos = motivoBloqueioFotos
    ? `${motivoBloqueioFotos} As fotos podem vir do pacote atual ou do último lote reutilizável da unidade.`
    : null;
  const origemFotosLabel = pacoteProntoParaFotos
    ? "Pacote analisado agora"
    : ultimoLoteProntoParaFotos
      ? "Último lote reutilizável"
      : "Nenhuma fonte disponível";
  const detalheOrigemFotos = pacoteProntoParaFotos
    ? "O pacote atual já expõe CLIENTES.csv para baixar as imagens do EVO."
    : ultimoLoteProntoParaFotos
      ? `${fotoImportUltimoLote?.apelido || "Último lote"} fornece o CLIENTES.csv para a sincronização manual das fotos.`
      : fotoImportUltimoLoteErro
        ? fotoImportUltimoLoteErro
        : "Selecione a unidade e use um pacote com CLIENTES.csv ou um lote anterior reaproveitável.";

  let ajudaFotos =
    "Escolha a academia e a unidade para consultar o estado das fotos dessa operação.";
  if (destinoSelecionado) {
    ajudaFotos =
      "As fotos são baixadas das URLs do EVO presentes no CLIENTES.csv. A fonte pode ser o pacote atual ou o último lote reutilizável da unidade.";
  }
  if (pacoteProntoParaFotos) {
    ajudaFotos = pacoteDryRun
      ? "Modo de simulação ativo: o job valida e baixa as imagens, mas não grava no storage."
      : fotoImportEstado?.importado
        ? "A unidade já possui fotos importadas. Você pode rodar uma atualização manual ou forçar uma reimportação completa."
        : "O pacote atual já pode atualizar as fotos dos alunos diretamente no storage da unidade.";
  } else if (ultimoLoteProntoParaFotos) {
    ajudaFotos = pacoteDryRun
      ? "Modo de simulação ativo: o job usa o último lote reutilizável apenas para validar o download das imagens."
      : fotoImportEstado?.importado
        ? "A unidade já possui fotos importadas. Você pode reexecutar a sincronização usando o último lote EVO reutilizável."
        : "A unidade já possui um lote reutilizável com CLIENTES.csv para baixar as fotos direto do EVO.";
  }

  return (
    <Card className="border-gym-accent/25 shadow-sm">
      <CardHeader className="border-b border-border/50 bg-muted/20 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-lg">Início da importação</CardTitle>
            <p className="text-sm text-muted-foreground">
              Selecione <span className="font-medium text-foreground">Academia → Unidade</span> uma única vez. Depois escolha se vai reaproveitar o pacote anterior, analisar um novo ZIP e importar ou reimportar as fotos da unidade.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={destinoSelecionado ? "secondary" : "outline"}>
              {destinoSelecionado ? "Unidade selecionada" : "Selecione a unidade"}
            </Badge>
            <Badge variant={pacoteProntoParaFotos ? "secondary" : "outline"}>
              {statusLoteFotosLabel}
            </Badge>
            {pacoteDryRun ? <Badge variant="outline">Simulação ligada</Badge> : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.95fr)]">
          <div className="space-y-4 rounded-xl border border-border bg-background p-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold">Unidade escolhida no topo</p>
              <p className="text-xs text-muted-foreground">
                Esse contexto é compartilhado por todo o fluxo abaixo. Se você mudar a unidade acima, este card acompanha a mudança automaticamente.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm">
              <div className="space-y-1">
                <p className="font-medium">Destino atual</p>
                <p className="text-muted-foreground">
                  {destinoSelecionado
                    ? `${pacoteMapeamento.academiaNome || "Academia não informada"} · ${pacoteMapeamento.unidadeNome || "Unidade não informada"}`
                    : "Nenhuma unidade selecionada"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Reaproveitamento de lote, análise do ZIP e importação de fotos usam exatamente essa unidade.
                </p>
              </div>
            </div>
          </div>

          <ReutilizarLoteCard
            embedded
            description="Use um lote anterior para reaproveitar os CSVs da unidade sem novo upload. Esse mesmo lote também pode servir como fonte para baixar as fotos do EVO."
            tenantId={pacoteMapeamento.tenantId || undefined}
            ultimoLote={fotoImportUltimoLote}
            carregandoLote={fotoImportUltimoLoteLoading}
            erroLote={fotoImportUltimoLoteErro}
            onReutilizado={handleLoteReutilizado}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <div className="space-y-4 rounded-xl border border-border bg-background p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-semibold">Analisar novo pacote</p>
                <p className="text-xs text-muted-foreground">
                  Faça o upload do ZIP, mantenha o modo de simulação quando necessário e só depois siga para a revisão técnica do lote.
                </p>
              </div>
              <Badge variant={pacoteAnalise?.uploadId ? "secondary" : "outline"}>
                {statusPacoteLabel}
              </Badge>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pacoteArquivo">Arquivo do pacote</Label>
              <Input
                id="pacoteArquivo"
                type="file"
                accept=".zip,.csv,application/zip,text/csv"
                onChange={escolherArquivoPacote}
              />
              <p className="text-xs text-muted-foreground">
                Arquivo .zip contendo exportação EVO ou CSV unitário.
              </p>
              {pacoteArquivo ? (
                <p className="text-xs text-muted-foreground">
                  Arquivo selecionado: {pacoteArquivo.name} ({formatBytes(pacoteArquivo.size)})
                </p>
              ) : null}
            </div>

            <Label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={pacoteDryRun}
                onChange={(event) => setPacoteDryRun(event.target.checked)}
                className="accent-gym-accent"
              />
              Modo de simulação (Apenas validar, não salvar)
            </Label>

            <div className="space-y-2">
              <Label htmlFor="pacoteJobAlias">Nome de identificação deste lote</Label>
              <Input
                id="pacoteJobAlias"
                value={pacoteJobAlias}
                onChange={(event) => setPacoteJobAlias(event.target.value)}
                placeholder={aliasSugestaoPacote}
              />
              <p className="text-xs text-muted-foreground">
                Opcional. Nome livre para facilitar a busca deste lote no histórico.
              </p>
            </div>

            {pacoteAnalise?.uploadId ? (
              <div className="rounded-md border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                Upload atual: <span className="font-mono text-foreground">{pacoteAnalise.uploadId}</span> ·{" "}
                {pacoteAnalise.arquivos.length}{" "}
                {pacoteAnalise.arquivos.length === 1 ? "arquivo detectado" : "arquivos detectados"}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-2">
              <ColunasMapeadasModal
                arquivoSelecionado={null}
                arquivosDisponiveis={pacoteArquivosDisponiveis}
              />
              <Button onClick={analisarArquivoPacote} disabled={pacoteAnalisando || !pacoteArquivo}>
                {acaoAnaliseLabel}
              </Button>
            </div>
          </div>

          <div className="space-y-4 rounded-xl border border-border bg-background p-4">
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
                    : destinoSelecionado
                      ? "Pendente"
                      : "Sem unidade"}
              </Badge>
            </div>

            {fotoImportEstado ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-border bg-muted/20 px-3 py-2 text-sm">
                  <p className="font-medium">Alunos na unidade</p>
                  <p className="text-muted-foreground">{fotoImportEstado.totalAlunos}</p>
                </div>
                <div className="rounded-md border border-border bg-muted/20 px-3 py-2 text-sm">
                  <p className="font-medium">Vínculos EVO cliente</p>
                  <p className="text-muted-foreground">{fotoImportEstado.vinculosEvoClientes}</p>
                </div>
                <div className="rounded-md border border-border bg-muted/20 px-3 py-2 text-sm">
                  <p className="font-medium">Alunos com foto</p>
                  <p className="text-muted-foreground">{fotoImportEstado.alunosComFoto}</p>
                </div>
                <div className="rounded-md border border-border bg-muted/20 px-3 py-2 text-sm">
                  <p className="font-medium">Fotos importadas via EVO</p>
                  <p className="text-muted-foreground">{fotoImportEstado.alunosComFotoImportada}</p>
                </div>
              </div>
            ) : (
              <div className="rounded-md border border-border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
                O estado da importação de fotos será exibido assim que a unidade for consultada.
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-border bg-muted/20 px-3 py-3 text-sm">
                <div className="flex items-center gap-2">
                  {destinoSelecionado ? (
                    <CheckCircle2 className="size-4 text-emerald-400" />
                  ) : (
                    <CircleDashed className="size-4 text-muted-foreground" />
                  )}
                  <p className="font-medium">Destino da unidade</p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {destinoSelecionado
                    ? "Academia e unidade já definidas para esta operação."
                    : "Selecione Academia e Unidade para consultar o storage correto."}
                </p>
              </div>

              <div className="rounded-md border border-border bg-muted/20 px-3 py-3 text-sm">
                <div className="flex items-center gap-2">
                  {fonteFotosDisponivel ? (
                    <CheckCircle2 className="size-4 text-emerald-400" />
                  ) : (
                    <CircleDashed className="size-4 text-amber-300" />
                  )}
                  <p className="font-medium">Lote para fotos</p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{requisitoLoteLabel}</p>
              </div>
            </div>

            <div className="rounded-md border border-border bg-muted/20 px-3 py-3 text-sm">
              <p className="font-medium">Origem atual das fotos</p>
              <p className="mt-1 text-xs text-muted-foreground">{origemFotosLabel}</p>
              <p className="mt-2 text-xs text-muted-foreground">{detalheOrigemFotos}</p>
            </div>

            <div className="rounded-md border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
              Bucket: <span className="font-mono text-foreground">{fotoImportEstado?.bucket || "conceito-fit-fotos"}</span>
              {" · "}
              Prefixo: <span className="font-mono text-foreground">{fotoImportEstado?.storagePrefix || "—"}</span>
            </div>

            <div className="flex items-start gap-2 rounded-md border border-border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <p>{ajudaFotos}</p>
            </div>

            {fotoImportJobStatus ? (
              <div className="rounded-md border border-border bg-muted/20 px-3 py-2 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">Job de fotos</p>
                  <Badge
                    variant={
                      fotoImportJobStatus.status === "CONCLUIDO"
                        ? "secondary"
                        : fotoImportJobStatus.status === "PROCESSANDO"
                          ? "outline"
                          : "destructive"
                    }
                  >
                    {fotoImportJobStatus.status}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{fotoImportJobStatus.jobId}</p>
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

            {hintBotoesFotos ? (
              <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                {hintBotoesFotos}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button
                type="button"
                onClick={() => void importarFotosDoPacote(false)}
                disabled={botoesFotosDesabilitados}
                title={hintBotoesFotos ?? undefined}
              >
                {fotoImportExecutando || jobProcessando
                  ? "Importando fotos..."
                  : acaoPrincipalFotos}
              </Button>
              {fotoImportEstado?.importado ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void importarFotosDoPacote(true)}
                  disabled={botoesFotosDesabilitados}
                  title={hintBotoesFotos ?? undefined}
                >
                  Reimportar tudo
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
