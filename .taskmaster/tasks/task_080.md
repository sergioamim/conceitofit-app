# Task ID: 80

**Title:** Adicionar histórico por arquivo na importação EVO

**Status:** pending

**Dependencies:** 74 ✓, 75 ✓, 76 ✓, 77 ✓, 78 ✓

**Priority:** high

**Description:** Implementar a visão de histórico por arquivo lógico no fluxo de importação EVO por pacote, exibindo o último processamento relevante por unidade e preparando a ação de retry somente dos dados com erro quando o backend disponibilizar o contrato.

**Details:**

Atualizar o contrato de `UploadAnaliseArquivo` em `src/lib/api/importacao-evo.ts` para incluir um bloco de histórico por arquivo (ex.: `ultimoProcessamento` com `jobId`, `alias`, `status`, `processadoEm`, resumo `EvoImportEntidadeResumo` e flag de suporte a retry somente erros), e propagar o tipo/export em `src/lib/backoffice/importacao-evo.ts`.
No `src/app/(backoffice)/admin/importacao-evo-p0/page.tsx`, enriquecer `PacoteArquivoDisponivel` e o mapeamento de `pacoteArquivosDisponiveis` para carregar o histórico e derivar um status de UX consistente: nunca importado, sucesso, parcial, com erros (ex.: baseado em `status`, `rejeitadas` ou flags de parcialidade), usando placeholders estáveis quando não houver dados.
Na lista de seleção de arquivos do pacote, renderizar um bloco de histórico por arquivo com badge de status, contadores (processadas/criadas/atualizadas/rejeitadas), alias/jobId e data formatada via `formatDateTime`, reaproveitando `resolveJobAlias`/`jobsHistorico` como fallback quando o backend não enviar alias.
Adicionar CTA “Tentar somente erros” no card de histórico do arquivo com estado desabilitado e texto de “aguardando backend” quando o contrato não indicar suporte; quando o backend sinalizar suporte, reutilizar o fluxo de criação de job (`createBackofficeEvoP0PacoteJob`) com o arquivo alvo e flag específica, registrando no histórico local (`upsertJobHistorico`) para evitar fluxo paralelo.
Integrar com a estrutura atual de rejeições: permitir atalho para `openRejeicoesPorEntidade` quando houver erros e mapear entidade via `IMPORT_RESUMO_CARD_CONFIG`, sem duplicar lógica de retry seletivo existente, apenas reaproveitando filtros e estados já presentes.

**Test Strategy:**

Atualizar `tests/unit/backoffice-importacao-evo.spec.ts` para incluir o novo bloco de histórico no mock de análise de pacote e validar que o wrapper retorna os campos esperados (status, contadores, alias/jobId, suporte a retry).
Ajustar `tests/e2e/backoffice-importacao-evo.spec.ts` para stubar histórico por arquivo com cenários distintos (nunca importado, sucesso, parcial, com erros) e verificar a renderização dos badges/contadores/alias/data na lista de arquivos; validar que o botão “Tentar somente erros” aparece desabilitado quando o suporte não estiver disponível e que o atalho para rejeições funciona quando houver erros.
Executar a suíte unitária e o teste E2E do fluxo de importação EVO após as alterações.

## Subtasks

### 80.1. Fechar o contrato frontend do histórico por arquivo

**Status:** pending  
**Dependencies:** None  

Ajustar tipos e wrappers para consumir o resumo do último processamento por arquivo lógico vindo do backend.

**Details:**

Atualizar `src/lib/api/importacao-evo.ts` e `src/lib/backoffice/importacao-evo.ts` para suportar os campos de histórico por arquivo, incluindo status, jobId, alias, timestamps, resumo quantitativo e capacidade de retry somente erros. Definir fallback compatível para payloads que ainda não tragam todos os campos.

### 80.2. Normalizar os estados visuais por arquivo lógico

**Status:** pending  
**Dependencies:** 80.1  

Criar helpers para derivar os estados de UX de cada arquivo sem depender apenas do histórico local.

**Details:**

Implementar mapeamento para estados como nunca importado, sucesso, parcial, com erros e retry disponível, usando o resumo por arquivo do backend e fallback controlado para jobs locais quando necessário.

### 80.3. Renderizar o histórico na lista de arquivos do pacote

**Status:** pending  
**Dependencies:** 80.2  

Exibir badges, contadores e referência ao último job em cada item selecionável do pacote.

**Details:**

Ajustar `src/app/(backoffice)/admin/importacao-evo-p0/page.tsx` para renderizar o bloco de histórico por arquivo na seção de arquivos reconhecidos, preservando a legibilidade da tela e mantendo placeholders estáveis para SSR/hidratação.

### 80.4. Preparar a ação de tentar somente os dados com erro

**Status:** pending  
**Dependencies:** 80.2  

Conectar a nova visão por arquivo com a affordance de retry somente erros sem criar fluxo paralelo incoerente.

**Details:**

Adicionar CTA por arquivo ou bloco conforme a capacidade informada pelo backend. Quando o endpoint ainda não existir, manter o botão desabilitado com texto explicativo; quando existir, reaproveitar o fluxo atual de criação de job e o mecanismo de histórico local.

### 80.5. Conciliar o histórico por arquivo com a malha de colaboradores

**Status:** pending  
**Dependencies:** 80.3, 80.4  

Garantir consistência entre o histórico geral por arquivo e os blocos específicos já exibidos para colaboradores.

**Details:**

Revisar o comportamento conjunto de `funcionarios` e seus arquivos auxiliares para que o novo histórico por arquivo não contradiga o diagnóstico por bloco já existente. Priorizar a granularidade por bloco quando isso produzir uma UX mais fiel ao backend.

### 80.6. Atualizar testes unitários e E2E do fluxo de importação EVO

**Status:** pending  
**Dependencies:** 80.3, 80.4, 80.5  

Expandir a cobertura automatizada para a nova visão de histórico por arquivo e retry somente erros.

**Details:**

Ajustar `tests/unit/backoffice-importacao-evo.spec.ts` e `tests/e2e/backoffice-importacao-evo.spec.ts` para cenários de nunca importado, sucesso, parcial, com erros e CTA de retry habilitado/desabilitado, garantindo que a seleção de arquivos continue funcionando sem regressão.
