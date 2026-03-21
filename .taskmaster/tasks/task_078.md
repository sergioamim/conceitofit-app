# Task ID: 78

**Title:** Sincronizar diagnóstico de colaboradores com resumo do job

**Status:** done

**Dependencies:** 74 ✓, 77 ✓

**Priority:** medium

**Description:** Ajustar a tela de importação EVO para que a execução da malha de colaboradores use o resumo do backend como fonte de verdade, evitando inferências baseadas apenas no histórico local. O objetivo é refletir com precisão quais blocos foram executados, com ou sem linhas, e o resultado de rejeições.

**Details:**

Atualizar `src/app/(backoffice)/admin/importacao-evo-p0/page.tsx` para derivar `jobTemMalhaColaboradores`, `colaboradoresResumoCards` e `colaboradoresResumoAlertas` a partir de `jobResumo.colaboradoresDetalhe`, usando `arquivosSelecionados` e `arquivosAusentes` do backend (com `resolveColaboradorArquivoMetaFromValue`/`resolvePacoteArquivoCanonico` para mapear aliases). Criar um helper (no próprio arquivo ou extraído para `src/lib/backoffice/importacao-evo.ts`) que normalize a lista de arquivos executados por bloco e calcule um status por bloco: `naoSelecionado` (sem arquivos selecionados), `semLinhas` (selecionado com `total` 0), `comRejeicoes` (`rejeitadas` > 0 ou `parcial`/`mensagemParcial`), `sucesso` (`total` > 0 e `rejeitadas` 0). Atualizar o card “Diagnóstico de colaboradores” para renderizar badge e texto conforme esse status, além de listar chips de arquivos pelo resumo do job, removendo dependência de `jobsHistorico` para horários/perfil legado. Manter fallback para jobs antigos sem `colaboradoresDetalhe`, mas priorizar dados do backend quando presentes. Cobrir o job `7b6d9d3b-399a-4e6a-9d77-4bdd6dfc96a9`, garantindo que horários e perfil legado aparecem como não selecionados ou sem linhas conforme o resumo.

**Test Strategy:**

Adicionar/ajustar teste unitário para o helper de status (ex.: `tests/unit/importacao-evo-colaboradores.spec.ts`) cobrindo os quatro estados e o mapeamento de arquivos; executar `npx playwright test tests/unit/backoffice-importacao-evo.spec.ts` se reutilizar o arquivo existente. Validar manualmente em `/admin/importacao-evo?jobId=7b6d9d3b-399a-4e6a-9d77-4bdd6dfc96a9` com localStorage limpo para confirmar badges e chips conforme o resumo do backend.
