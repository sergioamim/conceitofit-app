# Task ID: 80

**Title:** Adicionar histórico por arquivo na importação ETL EVO

**Status:** done

**Dependencies:** None

**Priority:** high

**Description:** Planejar e implementar a visão de histórico por arquivo na página de importação ETL EVO, exibindo o último processamento por arquivo do pacote e preparando a ação de reprocessar apenas erros quando o backend suportar.

**Details:**

Atualizar os tipos e wrappers em `src/lib/api/importacao-evo.ts` para refletir o novo contrato de histórico por arquivo (ex.: `EvoImportArquivoHistorico` com `arquivoChave`, `status` (`EvoImportJobStatus`), `resumo` (`EvoImportEntidadeResumo`), `jobId`, `alias`, `solicitadoEm/finalizadoEm` e metadados de reprocessamento), e expor um novo client (ex.: `getEvoImportPacoteHistoricoArquivosApi`) com fallback seguro para ausência de endpoint (404/501 -> lista vazia/indisponível, sem criar histórico local paralelo). Encapsular o wrapper em `src/lib/backoffice/importacao-evo.ts` seguindo o padrão das funções já exportadas. Na tela `src/app/(backoffice)/admin/importacao-evo-p0/page.tsx`, carregar o histórico quando houver `pacoteAnalise` + `pacoteMapeamento.tenantId`, mapear para o `PacoteArquivoChave` usando `resolvePacoteArquivoCanonico` e enriquecer cada item de `pacoteArquivosDisponiveis` com o histórico correspondente. Renderizar o bloco de histórico dentro da seleção de arquivos (seção “Arquivos reconhecidos”), exibindo: status (“Nunca importado”, “Sucesso”, “Parcial”, “Com erros”), contadores (processadas/criadas/atualizadas/rejeitadas via `resumoValue`), e metadados do último job (alias com fallback de `buildDefaultJobAlias`, `jobId` e data formatada por `formatDateTime`). Manter estados de carregamento/indisponível com placeholder estável e sem usar datas dinâmicas no render inicial. Preparar a ação “Reprocessar apenas erros” por arquivo reutilizando a estrutura atual de rejeições/retry: quando o backend sinalizar suporte, habilitar o botão e apontar para a rotina existente (ex.: abrir rejeições com `openRejeicoesPorEntidade`/jobId já selecionado); quando indisponível, manter CTA desabilitada com mensagem “Aguardando backend”, evitando fluxo paralelo. Ajustar a tipagem para suportar o mapeamento por arquivo e garantir consistência com os blocos de colaboradores (ex.: chave canônica `funcionarios`).

**Test Strategy:**

Atualizar e validar testes unitários em `tests/unit/backoffice-importacao-evo.spec.ts` cobrindo o novo wrapper de histórico (requisição correta, fallback em 404/501 e mapeamento básico). Ajustar `tests/e2e/backoffice-importacao-evo.spec.ts` para mockar o novo endpoint e afirmar a renderização do histórico por arquivo (status, contadores, alias/jobId/data) e o estado desabilitado da ação de reprocesso quando suporte não existir. Rodar `npm run e2e -- tests/e2e/backoffice-importacao-evo.spec.ts` e os unitários associados.
