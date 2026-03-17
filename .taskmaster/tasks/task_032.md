# Task ID: 32

**Title:** Expor bootstrap consolidado do app no backend e migrar o frontend

**Status:** pending

**Dependencies:** 31

**Priority:** medium

**Description:** Evoluir o desenho de bootstrap para um endpoint único do app que consolide usuário, contexto ativo, academia, branding e capacidades, reduzindo round-trips no cold start.

**Details:**

Implementar a fase opcional descrita em `/Users/sergioamim/dev/pessoal/academia-app/docs/SESSION_BOOTSTRAP_CACHE_PRD.md`: desenhar um endpoint como `GET /api/v1/app/bootstrap`, alinhar contrato, controller e testes no backend, e adaptar o frontend para consumir esse payload consolidado com fallback temporário para os endpoints legados durante a transição.

**Test Strategy:**

Validar contrato no backend com testes de integração e `openapi.yaml`, cobrir no frontend o consumo do bootstrap unificado com fallback de compatibilidade e medir a redução de round-trips na primeira carga autenticada.

## Subtasks

### 32.1. Definir contrato e regras de consistência do bootstrap unificado

**Status:** pending
**Dependencies:** None

Fechar o payload canônico e as regras de invalidação antes de implementar o endpoint.

**Details:**

Especificar no backend o shape mínimo com `user`, `tenantContext`, `academia`, `branding` e `capabilities`, incluindo a política de atualização quando claims ou tenant mudarem.

### 32.2. Implementar endpoint consolidado no backend com contrato alinhado

**Status:** pending
**Dependencies:** 32.1

Adicionar o endpoint unificado preservando a modelagem modular do monólito e o contrato OpenAPI.

**Details:**

Implementar controller/service/DTOs no backend, atualizar `openapi.yaml` e cobrir o fluxo com testes de integração, mantendo compatibilidade com `X-Context-Id` e as regras atuais de multiunidade.

### 32.3. Migrar o store global do frontend para consumir o endpoint novo

**Status:** pending
**Dependencies:** 32.2

Substituir a composição local de bootstrap por consumo do payload consolidado.

**Details:**

Adaptar o `SessionBootstrapStore` para usar o endpoint unificado no cold start e em refresh controlado, mantendo fallback temporário para `/auth/me`, `/context/unidade-ativa` e `/academia` enquanto a migração não estiver totalmente estabilizada.

### 32.4. Remover fallback legado quando a migração estiver estável

**Status:** pending
**Dependencies:** 32.3

Encerrar a transição e simplificar o bootstrap da aplicação.

**Details:**

Depois de validada a nova rota em produção e nos testes, eliminar os caminhos legados redundantes do shell autenticado e atualizar a documentação operacional do fluxo de bootstrap.
