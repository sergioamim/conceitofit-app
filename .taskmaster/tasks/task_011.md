# Task ID: 11

**Title:** Completar operacao web de treinos com catalogo, templates e prescricao

**Status:** done

**Dependencies:** 1 ✓, 3 ✓

**Priority:** high

**Description:** Evoluir as telas de treinos para consumir o backend atual de grupos musculares, templates e prescricao do treino do cliente.

**Details:**

Abrange `src/app/(app)/treinos*`, `src/components/shared/treino-modal.tsx`, `src/lib/api/treinos.ts` e a reducao dos fallbacks em `src/lib/mock/services.ts`, cobrindo CRUD real de grupos musculares, biblioteca de templates, atribuicao para cliente, validade/frequencia/revisao e indicadores de aderencia.

**Test Strategy:**

Executar `npm run lint`, `npx tsc --noEmit` e `npm run e2e`, cobrindo ao menos a trilha `/treinos`, `/treinos/[id]`, `/treinos/exercicios` e `/treinos/grupos-musculares`.

## Subtasks

### 11.1. Auditar a trilha web atual de treinos e seus pontos em mock

**Status:** done  
**Dependencies:** None  

Mapear telas, modais e clients que ainda nao acompanham o backend novo.

**Details:**

Revisar `src/app/(app)/treinos/page.tsx`, `src/app/(app)/treinos/[id]/page.tsx`, `src/app/(app)/treinos/exercicios/page.tsx`, `src/app/(app)/treinos/grupos-musculares/page.tsx`, `src/components/shared/treino-modal.tsx`, `src/lib/api/treinos.ts` e `src/lib/mock/services.ts`, registrando placeholders, fallbacks e contratos ausentes.

### 11.2. Expandir camada API e tipos de treinos para os contratos atuais

**Status:** done  
**Dependencies:** 11.1  

Alinhar clients e mapeamentos aos novos campos e acoes do backend.

**Details:**

Atualizar `src/lib/api/treinos.ts` e tipos associados para suportar CRUD real de grupos musculares, metadados de template, duplicacao/versionamento, atribuicao para cliente, renovacao/revisao, execucoes e aderencia.

### 11.3. Implementar CRUD real de grupos musculares e integracao ao catalogo de exercicios

**Status:** done  
**Dependencies:** 11.1, 11.2  

Substituir a visao derivada atual por operacao real do catalogo canonico.

**Details:**

Refatorar `/treinos/grupos-musculares` para listar/criar/editar/inativar grupos via API real e ajustar formularios de exercicios para usar a referencia canonica do grupo muscular em vez de apenas texto livre.

### 11.4. Implementar biblioteca de templates e atribuicao de treino para cliente

**Status:** done  
**Dependencies:** 11.2  

Fechar a camada web que hoje para no card `Templates de treino (em breve)`.

**Details:**

Adicionar filtros e acoes para templates (`PRE_MONTADO`), metadados operacionais, duplicacao versionada e atribuicao formal para cliente a partir do fluxo de clonagem do backend.

### 11.5. Evoluir listagem e detalhe do treino do cliente para prescricao e aderencia

**Status:** done  
**Dependencies:** 11.2, 11.4  

Levar para a UI os campos e acoes novas do treino do cliente.

**Details:**

Atualizar `/treinos` e `/treinos/[id]` para exibir validade, frequencia planejada, quantidade prevista, revisoes, historico de execucao, status do ciclo e indicadores de aderencia, com acoes coerentes para revisar, encerrar e renovar.

### 11.6. Remover fallbacks locais e fechar testes de regressao de treinos

**Status:** done  
**Dependencies:** 11.3, 11.4, 11.5  

Concluir a migracao do dominio de treinos para API real no web.

**Details:**

Reduzir o uso de `src/lib/mock/services.ts` nas telas de treinos, revisar estados de loading/erro/vazio e adicionar testes de regressao para catalogo, templates, atribuicao e detalhe do treino do cliente.
