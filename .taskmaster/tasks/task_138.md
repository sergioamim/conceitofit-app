# Task ID: 138

**Title:** Backend: API de compliance LGPD (/admin/compliance)

**Status:** pending

**Dependencies:** None

**Priority:** high

**Description:** Implementar endpoints para dashboard de compliance LGPD: estatísticas de dados pessoais por academia, listagem de solicitações de exclusão, execução e rejeição de exclusões.

**Details:**

Endpoints:
1. GET /api/v1/admin/compliance/dashboard → { totalDadosPessoais, totalSolicitacoesPendentes, totalTermosAceitos, totalTermosPendentes, academias: [{ academiaId, academiaNome, totalUnidades, totalAlunos, alunosComCpf, alunosComEmail, alunosComTelefone, solicitacoesExclusaoPendentes, ultimaSolicitacao, termosAceitos, termosPendentes }] }
2. GET /api/v1/admin/compliance/exclusoes?status=PENDENTE&page=0&size=50 → [{ id, academiaId, academiaNome, tenantId, unidadeNome, alunoId, alunoNome, alunoCpf, alunoEmail, solicitadoEm, status, resolvidoEm, motivoRejeicao }]
3. POST /api/v1/admin/compliance/exclusoes/{id}/executar → executa exclusão de dados pessoais do aluno (anonimização)
4. POST /api/v1/admin/compliance/exclusoes/{id}/rejeitar body: { motivo } → marca como rejeitada
Para o dashboard, contar alunos que possuem CPF/email/telefone preenchido agregando por academia. Termos aceitos = alunos com campo termosAceitos=true.

**Test Strategy:**

Verificar contagem de dados pessoais por academia. Criar solicitação de exclusão, listar como pendente, executar e confirmar anonimização dos dados.

## Subtasks

### 138.1. Criar endpoint de dashboard de compliance com agregação

**Status:** pending  
**Dependencies:** None  

GET /admin/compliance/dashboard com contagem de CPF/email/telefone por academia e totais

### 138.2. Criar CRUD de solicitações de exclusão

**Status:** pending  
**Dependencies:** None  

GET listagem + POST executar + POST rejeitar com lógica de anonimização
