# Task ID: 141

**Title:** Backend: API financeira B2B (/admin/financeiro)

**Status:** pending

**Dependencies:** None

**Priority:** high

**Description:** Implementar endpoints para gestão financeira B2B da plataforma: CRUD de planos de assinatura, contratos de academia, cobranças/boletos e dashboard financeiro com MRR.

**Details:**

Endpoints:
--- Planos ---
1. GET /api/v1/admin/financeiro/planos → [PlanoPlataforma]
2. POST /api/v1/admin/financeiro/planos body: { nome, descricao, precoMensal, precoAnual, ciclo, maxUnidades, maxAlunos, featuresIncluidas[], ativo }
3. PUT /api/v1/admin/financeiro/planos/{id}
4. PATCH /api/v1/admin/financeiro/planos/{id} (toggle ativo)
--- Contratos ---
5. GET /api/v1/admin/financeiro/contratos?status=&academiaId=&planoId=
6. POST /api/v1/admin/financeiro/contratos body: { academiaId, planoId, dataInicio, ciclo, valorMensal }
7. PUT /api/v1/admin/financeiro/contratos/{id}
8. PATCH /api/v1/admin/financeiro/contratos/{id}/suspender body: { motivo }
9. PATCH /api/v1/admin/financeiro/contratos/{id}/reativar
--- Cobranças ---
10. GET /api/v1/admin/financeiro/cobrancas?status=&academiaId=&vencimentoInicio=&vencimentoFim=
11. POST /api/v1/admin/financeiro/cobrancas body: { contratoId, valor, dataVencimento }
12. PATCH /api/v1/admin/financeiro/cobrancas/{id}/baixar body: { dataPagamento, formaPagamento, observacoes }
13. PATCH /api/v1/admin/financeiro/cobrancas/{id}/cancelar
--- Dashboard ---
14. GET /api/v1/admin/financeiro/dashboard?periodo=12M → { mrr, mrrProjetado, totalAcademiasAtivas, totalInadimplentes, churnRate, evolucaoMrr: [{ mes, valor }], aging: [{ faixa, quantidade, valor }], inadimplentes: [{ academiaId, academiaNome, valor, diasAtraso }], mrrPorPlano: [{ planoNome, valor, academias }] }
Modelo de dados: tabelas plano_plataforma, contrato_plataforma, cobranca_plataforma com relacionamentos.

**Test Strategy:**

CRUD completo de plano e contrato. Gerar cobrança, marcar como paga, cancelar. Verificar dashboard MRR e aging.

## Subtasks

### 141.1. Criar modelos de dados (plano, contrato, cobrança da plataforma)

**Status:** pending  
**Dependencies:** None  

Tabelas plano_plataforma, contrato_plataforma, cobranca_plataforma com migrations

### 141.2. Criar CRUD de planos da plataforma

**Status:** pending  
**Dependencies:** 141.1  

GET/POST/PUT/PATCH /admin/financeiro/planos

### 141.3. Criar CRUD de contratos com suspensão/reativação

**Status:** pending  
**Dependencies:** 141.1  

GET/POST/PUT/PATCH /admin/financeiro/contratos + suspender + reativar

### 141.4. Criar CRUD de cobranças com baixa e cancelamento

**Status:** pending  
**Dependencies:** 141.3  

GET/POST/PATCH /admin/financeiro/cobrancas + baixar + cancelar

### 141.5. Criar endpoint de dashboard financeiro (MRR, aging, churn)

**Status:** pending  
**Dependencies:** 141.4  

GET /admin/financeiro/dashboard com agregações de MRR, evolução, aging e inadimplentes
