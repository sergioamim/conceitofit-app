# Task ID: 137

**Title:** Backend: API de busca global cross-tenant (/admin/search)

**Status:** pending

**Dependencies:** None

**Priority:** high

**Description:** Implementar endpoint GET /api/v1/admin/search/pessoas para busca global de alunos, funcionários e administradores em qualquer academia/unidade. Suporta busca por nome, CPF e email com paginação.

**Details:**

Endpoint: GET /api/v1/admin/search/pessoas
Query params: q (string, min 2 chars), tipo (ALUNO|FUNCIONARIO|ADMIN, opcional), page (default 0), size (default 30)
Response: { items: [{ id, tipo, nome, cpf?, email?, telefone?, academiaId?, academiaNome?, tenantId?, unidadeNome?, status? }], total: number }
Lógica: buscar em paralelo nas tabelas de alunos, funcionários e usuários admin. Para alunos, buscar por nome (LIKE) ou CPF (exact) ou email (exact). Incluir academiaId/academiaNome e tenantId/unidadeNome no resultado. Limitar a 30 resultados por tipo. Requer autenticação de admin global.

**Test Strategy:**

Buscar por CPF existente e confirmar retorno correto. Buscar por nome parcial e verificar resultados de múltiplos tenants. Buscar com tipo=ALUNO e confirmar filtragem.

## Subtasks

### 137.1. Criar controller e service de busca global

**Status:** pending  
**Dependencies:** None  

Endpoint GET /api/v1/admin/search/pessoas com busca paralela em alunos, funcionários e admins

### 137.2. Implementar busca cross-tenant com join de academia/unidade

**Status:** pending  
**Dependencies:** 137.1  

Query que resolve academiaId/academiaNome/unidadeNome para cada resultado
