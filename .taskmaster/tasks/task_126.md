# Task ID: 126

**Title:** Backoffice: geração e gestão de boletos/cobranças

**Status:** pending

**Dependencies:** 125

**Priority:** high

**Description:** Criar página /admin/financeiro/cobrancas para gerar, listar e gerenciar cobranças (boletos) de mensalidade das academias. Suportar geração manual e futura automática, com status de pagamento, vencimento, multa/juros e ações de baixa manual.

**Details:**

Criar src/app/(backoffice)/admin/financeiro/cobrancas/page.tsx com listagem de cobranças (filtros: status, academia, período de vencimento). Cada cobrança exibe: academia, valor, vencimento, status (pendente/pago/vencido/cancelado), forma de pagamento. Modal de nova cobrança: selecionar contrato → gerar cobrança com vencimento e valor do contrato. Ação de baixa manual (marcar como pago com data e observação). Adicionar tipos Cobranca em types.ts (id, contratoId, academiaId, academiaNome, valor, dataVencimento, dataPagamento, status, formaPagamento, multa, juros, observacoes). Criar endpoints: listAdminCobrancas, createAdminCobranca, baixarAdminCobranca, cancelarAdminCobranca. Resumo cards no topo: total pendente, total vencido, total recebido no mês, inadimplência.

**Test Strategy:**

Gerar cobrança para um contrato ativo. Marcar como paga. Verificar filtros e cards de resumo. Cancelar uma cobrança.

## Subtasks

### 126.1. Criar tipos e API client para cobranças

**Status:** pending  
**Dependencies:** None  

Adicionar Cobranca/CobrancaStatus em types.ts e endpoints CRUD em admin-billing.ts

### 126.2. Criar página de listagem com cards de resumo e filtros

**Status:** pending  
**Dependencies:** 126.1  

Listagem com status badges, filtros por academia/status/período, cards KPI no topo

### 126.3. Criar modais de geração de cobrança e baixa manual

**Status:** pending  
**Dependencies:** 126.2  

Modal de nova cobrança (selecionar contrato), modal de baixa manual (data + forma + observação), ação de cancelar
