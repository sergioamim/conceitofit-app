# Task ID: 15

**Title:** Erradicar runtime mock e consolidar frontend backend-only

**Status:** done

**Dependencies:** 12 ✓, 13 ✓, 14 ✓

**Priority:** high

**Description:** Eliminar integralmente `src/lib/mock/*` do runtime, migrando toda fonte de dados para API/Session e limitando localStorage a exceções explícitas.

**Details:**

Criar um fechamento definitivo da transição: remover imports de `@/lib/mock/*` de `src/`, substituir store e serviços mock por clients reais em todos os domínios, restringir `localStorage` a sessão/preferências/drafts excepcionais, apagar branches mortos e instituir guardrails para evitar regressão.

**Test Strategy:**

No test strategy provided.

## Subtasks

### 15.1. Consolidar inventário final e política anti-mock

**Status:** done  
**Dependencies:** None  

Fechar a lista completa de imports, consumidores e exceções permitidas antes da migração final.

**Details:**

Mapear todos os imports de `@/lib/mock/*`, referências a `getStore()/setStore()` e usos operacionais de `localStorage`; documentar a política final: somente API/Session e, excepcionalmente, drafts/cache local explicitamente transitórios.

### 15.2. Fechar gaps de clients reais e contratos pendentes

**Status:** done  
**Dependencies:** 15.1  

Garantir que a camada `src/lib/api/*` cubra 100% da superfície ainda servida por mock.

**Details:**

Auditar domínios e completar endpoints, adapters, normalizações e tratamento de erro para que nenhum fluxo de runtime precise recorrer a `src/lib/mock/services.ts`.

### 15.3. Migrar bootstrap de auth, sessão, tenant e branding

**Status:** done  
**Dependencies:** 15.1, 15.2  

Remover store/localStorage como fonte de verdade para contexto ativo e identidade visual.

**Details:**

Padronizar login, refresh, tenant ativo, unidades disponíveis, branding e bootstrap do app para depender apenas de `API/Session`, eliminando sincronização operacional via store legado.

### 15.4. Migrar comercial core para API-only

**Status:** done  
**Dependencies:** 15.1, 15.2, 15.3  

Substituir mock em clientes, prospects, planos, matrículas, vendas e pagamentos.

**Details:**

Revisar páginas, hooks, modais e services do domínio comercial para consumir exclusivamente `src/lib/api/*` e `session`, removendo qualquer fallback operacional baseado em store local.

### 15.5. Migrar CRM e automações para API-only

**Status:** done  
**Dependencies:** 15.1, 15.2, 15.3  

Eliminar mock do workspace CRM, pipeline, tarefas, playbooks, cadências, campanhas e automações.

**Details:**

Trocar consumers do domínio CRM para a camada real, ajustar estados assíncronos e remover qualquer leitura de mock/store em pipeline, detalhes, timeline e automações.

### 15.6. Migrar reservas, grade, monitor e catraca para API-only

**Status:** done  
**Dependencies:** 15.1, 15.2, 15.3  

Remover store/mock das telas operacionais e de exibição de aulas e acessos.

**Details:**

Substituir snapshots locais, geração de agenda a partir do store e leituras operacionais do monitor/grade/catraca por responses reais e estado client-side derivado apenas de API ou props estáveis.

### 15.7. Migrar administrativo, financeiro, fiscal e integrações para API-only

**Status:** done  
**Dependencies:** 15.1, 15.2, 15.3  

Fechar os módulos restantes que ainda misturam API com legado mock.

**Details:**

Cobrir contas a pagar/receber, recebimentos, DRE, BI, agregadores, fiscal, importações e catálogos administrativos, removendo caminhos duplicados e centralizando a operação na camada real.

### 15.8. Migrar jornada pública para API/Session com storage mínimo

**Status:** done  
**Dependencies:** 15.1, 15.2, 15.3, 15.4  

Eliminar uso de mock/store no funil público de adesão, trial, checkout e pendências.

**Details:**

Reescrever os fluxos públicos para depender apenas de API real; manter em `localStorage` somente drafts transitórios claramente documentados, nunca estado de negócio como fonte de verdade.

### 15.9. Migrar treinos e limitar drafts locais a exceções documentadas

**Status:** done  
**Dependencies:** 15.1, 15.2, 15.3  

Remover store mock do workspace de treinos e revisar qualquer persistência local remanescente.

**Details:**

Trocar fonte de verdade do módulo de treinos para API e limitar `localStorage` a drafts offline claramente marcados, sem papel operacional quando houver backend correspondente.

### 15.10. Eliminar consumidores diretos de getStore/localStorage e debug legado

**Status:** done  
**Dependencies:** 15.3, 15.4, 15.5, 15.6, 15.7, 15.8, 15.9  

Remover leituras operacionais de store/localStorage restantes em páginas, providers, componentes e painéis de debug.

**Details:**

Padronizar `src/` para usar apenas providers baseados em API/Session, apagando dependências diretas de `getStore()`, `setStore()` e painéis que exponham estado mock como parte do runtime.

### 15.11. Atualizar testes para mockar HTTP na borda

**Status:** done  
**Dependencies:** 15.4, 15.5, 15.6, 15.7, 15.8, 15.9, 15.10  

Parar de depender de `src/lib/mock/*` em testes de integração e runtime.

**Details:**

Reescrever fixtures, helpers e cenários para stubar rede na borda da API, preservando isolamento de teste sem reintroduzir runtime mock no código da aplicação.

### 15.12. Apagar `src/lib/mock/*`, remover branches mortos e adicionar guardrails

**Status:** done  
**Dependencies:** 15.10, 15.11  

Concluir a erradicação do mock com remoção física, validação e prevenção de regressão.

**Details:**

Excluir `src/lib/mock/store.ts`, `src/lib/mock/services.ts` e sobras relacionadas, remover branches mortos como fallbacks operacionais, adicionar checagens de CI/lint para proibir novos imports de `@/lib/mock/*` e validar o fechamento backend-only.
