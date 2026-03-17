# Task ID: 33

**Title:** Migrar Dashboard para endpoint unificado de dados e reduzir round-trips

**Status:** pending

**Dependencies:** 32

**Priority:** high

**Description:** Migrar a tela `/dashboard` para consumir um único payload consolidado (`/api/v1/academia/dashboard` com fallback), eliminando múltiplas chamadas paralelas atuais e centralizando o cálculo de métricas no backend para reduzir latência percebida.

**Details:**

Atualmente a página faz 4 chamadas distintas para construir a visão operacional do dashboard. Esta task estabelece a migração para o endpoint unificado com contrato padronizado, mantendo fallback seguro para ambiente sem rollout total e preservando os indicadores já exibidos (`clientes`, `vendas`, `financeiro` e listas de apoio).

**Test Strategy:**

Validar via e2e/smoke que a troca de aba e alteração de data disparam apenas a chamada consolidada esperada por referência (`tenantId`, `scope`, `referenceDate`), com fallback estável em caso de contrato parcial. Atualizar testes unitários de `src/lib/api/dashboard.ts` e criar cobertura mínima para o fluxo da página.

## Subtasks

### 33.1. Validar contrato alvo e alinhamento de campos

**Status:** pending
**Dependencies:** None

Fechar contrato de payload entre frontend e backend antes da implementação.

**Details:**

- Confirmar contrato oficial no backend (ou arquivo equivalente de especificação) para `GET /api/v1/academia/dashboard`.
- Definir campos obrigatórios e opcionais (`summary`, `prospectsRecentes`, `matriculasVencendo`, `pagamentosPendentes`, metadados).
- Validar timezone/serialização de datas e regra de janela (`referenceDate`, mês corrente e anterior).

### 33.2. Atualizar adapter de dashboard para contrato consolidado (com fallback)

**Status:** pending
**Dependencies:** 33.1

Adaptar `src/lib/api/dashboard.ts` para consumir o contrato novo/legado de forma resiliente.

**Details:**

- Aceitar respostas em formato normalizado e wrappers antigos (`data/content/result/dashboard`), preservando compatibilidade.
- Atualizar normalização para:
  - `summary` com totais e listas;
  - defaults seguros (`0`, `[]`) quando campos faltarem;
  - preservação do tipo `DashboardData` usado pela UI.
- Preparar `getDashboardApi` com novos params: `referenceDate`, `scope`.

### 33.4. Migrar `src/app/(app)/dashboard/page.tsx` para fetch único

**Status:** pending
**Dependencies:** 33.2

Trocar a agregação local por resposta do endpoint unificado.

**Details:**

- Remover `listProspectsApi`, `listAlunosApi`, `listMatriculasApi`, `listPagamentosApi` e a lógica derivada de contagem em front-end.
- Integrar `getDashboardApi` com `scope` conforme aba ativa.
- Calcular exibição das métricas a partir de `summary` retornado.
- Manter listas de apoio (prospects recentes, matrículas vencendo, pagamentos pendentes) alimentadas pelo payload.

### 33.5. Criar fallback controlado para ambiente sem endpoint completo

**Status:** pending
**Dependencies:** 33.4

Evitar quebra de produção até o backend estar completamente alinhado.

**Details:**

- Se o endpoint não retornar blocos esperados, aplicar fallback para estrutura parcial/legacy.
- Garantir que a interface continue renderizando com valores zerados e estado de erro claro.
- Documentar no código o ponto de troca de estratégia para remoção futura.

### 33.6. Otimização de carregamento por aba e observabilidade

**Status:** pending
**Dependencies:** 33.4

Diminuir chamadas redundantes em troca de abas e datas.

**Details:**

- Reusar payload por `referenceDate` e trocar somente `scope` conforme necessário.
- Implementar memoização mínima em cliente para evitar recarregamentos quando não houver mudança de parâmetros.
- Ajustar UX de loading/error para refletir uma única fonte de verdade.
- Registrar evidência de redução de chamadas no console de rede (documentar no PR).

### 33.7. Atualizar tipos e fechar evidência de aceite

**Status:** pending
**Dependencies:** 33.5, 33.6

Garantir contrato estável para evolução e validar aceite técnico.

**Details:**

- Ajustar `DashboardData` em `src/lib/types.ts` se necessário, sem regressão de tipagem.
- Atualizar snapshots/assinaturas de mocks se existirem nos testes de dashboard.
- Registrar evidência de que a tela renderiza com 1 chamada unificada por combinação de parâmetros.
