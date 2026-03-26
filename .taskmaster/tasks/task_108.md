# Task ID: 108

**Title:** Convergência de Domínio: Venda vs. Contrato

**Status:** todo

**Dependencies:** 106

**Priority:** high

**Description:** Resolver a inconsistência terminológica e funcional entre "Matrícula" e "Venda", focando no conceito de "Contrato/Assinatura".

**Details:**

Garantir que toda venda de plano resulte em um contrato rastreável e que o status do aluno (Ativo/Inativo) derive de uma única fonte de verdade comercial.

**Test Strategy:**

Verificar se a criação de uma venda de plano reflete instantaneamente no dashboard de matrículas e no status do perfil do aluno.

## Subtasks

### 108.1. Unificar Terminologia na UI (Renomear Matrículas para Contratos)

**Status:** todo
**Dependencies:** None

Ajustar menus e títulos de `/matriculas` para refletirem o conceito de gestão de contratos e assinaturas.

### 108.2. Sincronizar Status do Aluno via Evento de Venda

**Status:** todo
**Dependencies:** None

Garantir que o cálculo de status (Ativo/Inativo) no frontend e backend considere o contrato vigente gerado pela venda, eliminando o "limbo" de alunos matriculados sem venda ativa.

### 108.3. Unificar Listagem de Vendas e Contratos

**Status:** todo
**Dependencies:** None

Garantir que a página de Vendas e a de Contratos compartilhem a mesma base de dados filtrada, evitando discrepância de valores totais.
