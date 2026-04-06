# Task ID: 466

**Title:** Splitar pagamentos-client.tsx (1057 LOC) em sub-componentes

**Status:** pending

**Dependencies:** None

**Priority:** high

**Description:** Refatorar src/app/(portal)/pagamentos/components/pagamentos-client.tsx de 1057 LOC em 5-7 componentes coesos.

**Details:**

O componente mistura: (1) Header e filtros de pagamentos, (2) Tabela de pagamentos com paginação, (3) Modal de recebimento, (4) Modal de NFSe em lote, (5) Barra de ações em massa, (6) Estado de loading/error/empty. Separar em: PagamentosHeader (filtros), PagamentosTable (tabela + paginação), PagamentoActions (ações em massa), ReceberPagamentoModal (já existente, extrair), NfseLoteModal (extrair), PagamentosEmptyState. Manter pagina.tsx com data fetching RSC e passar props.

**Test Strategy:**

Testes unitários de cada sub-componente extraído. Teste E2E da página de pagamentos sem regressão funcional. Verificar coverage mantida.
