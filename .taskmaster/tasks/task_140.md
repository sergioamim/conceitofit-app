# Task ID: 140

**Title:** Backend: API de métricas operacionais globais (/admin/metricas)

**Status:** pending

**Dependencies:** None

**Priority:** medium

**Description:** Implementar endpoints para métricas operacionais cross-tenant: dashboard global, mapa de saúde, alertas operacionais e uso de features por academia.

**Details:**

Endpoints:
1. GET /api/v1/admin/metricas/operacionais/global → { totalAlunosAtivos, totalMatriculasAtivas, vendasMesQuantidade, vendasMesValor, ticketMedio, novasMatriculasMes, evolucaoMensal: [{ mes, novosAlunos, churn }], distribuicaoPorAcademia: [{ academiaId, academiaNome, unidades, alunosAtivos, matriculasAtivas, vendasMes }] }
2. GET /api/v1/admin/metricas/operacionais/saude → [{ academiaId, academiaNome, totalUnidades, alunosAtivos, churnMensal, inadimplenciaPct, ultimoLoginAdmin, statusContrato, classificacao: SAUDAVEL|RISCO|CRITICO }]
3. GET /api/v1/admin/metricas/operacionais/alertas → [{ id, tipo, severidade: INFO|WARNING|CRITICAL, mensagem, academiaId, academiaNome, criadoEm, acao }]
4. GET /api/v1/admin/metricas/operacionais/features → [{ academiaId, academiaNome, features: { treinos, crm, catraca, vendasOnline, bi } }]
Para saúde: SAUDAVEL = alunos>50 e inadimplencia<10%, RISCO = entre, CRITICO = alunos<10 ou inadimplencia>20% ou sem login 30d.

**Test Strategy:**

Verificar que totais globais batem com soma individual. Confirmar classificação de saúde por regras. Verificar alertas gerados automaticamente.

## Subtasks

### 140.1. Criar endpoint de dashboard operacional global

**Status:** pending  
**Dependencies:** None  

Agregação cross-tenant de alunos, matrículas, vendas com evolução mensal

### 140.2. Criar endpoint de mapa de saúde das academias

**Status:** pending  
**Dependencies:** None  

Classificação automática (saudável/risco/crítico) por regras de negócio

### 140.3. Criar endpoints de alertas e uso de features

**Status:** pending  
**Dependencies:** None  

Alertas automáticos por regras + mapa de features ativas por academia
