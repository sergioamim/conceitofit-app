# Task ID: 40

**Title:** Implementar exclusao controlada de cliente no perfil

**Status:** done

**Dependencies:** None

**Priority:** high

**Description:** Adicionar a acao `Excluir cliente` no menu de 3 pontinhos do perfil do cliente com RBAC por perfil Alto, justificativa obrigatoria e auditoria.

**Details:**

O frontend ja possui a superficie do perfil do cliente em `src/components/shared/cliente-header.tsx` e um padrao de acao sensivel com justificativa em `src/app/(app)/clientes/[id]/page.tsx`, mas ainda nao existe uma trilha de exclusao de cliente ponta a ponta. Esta task fecha o recorte funcional e tecnico para expor a acao no menu do perfil, condicionar a UI a uma capability/role confiavel de sessao, abrir modal com justificativa obrigatoria, integrar a camada `api/alunos` e `comercial/runtime` a um endpoint dedicado do backend e tratar retorno auditavel e bloqueios de regra de negocio.

Referencia principal: `docs/EXCLUSAO_CONTROLADA_CLIENTE_PRD.md`.

**Test Strategy:**

Cobrir a trilha com testes de permissao e UX do menu de acoes do cliente, validacao de justificativa obrigatoria, sucesso com redirecionamento para `/clientes` e tratamento de erros `403`, `409` e `422`, alem de smoke no detalhe e na pagina de cartoes que tambem reutiliza o `ClienteHeader`.

## Subtasks

### 40.1. Fechar contrato de permissao para exclusao de cliente

**Status:** done  
**Dependencies:** None

Definir como a sessao expoe o perfil `Alto` ou capability dedicada para a UI e para o backend.

**Details:**

Revisar `src/hooks/use-session-context.tsx`, `src/lib/access-control.ts` e o bootstrap de sessao para substituir a heuristica atual baseada em `ADMIN` por uma sinalizacao confiavel para exclusao de cliente, preferencialmente `canDeleteClient` ou role canonica equivalente.

### 40.2. Desenhar a UX de exclusao no menu de 3 pontinhos

**Status:** done  
**Dependencies:** 40.1

Adicionar a entrada `Excluir cliente` no `ClienteHeader` e desenhar o modal com confirmacao e justificativa obrigatoria.

**Details:**

Evoluir `src/components/shared/cliente-header.tsx` e a tela `src/app/(app)/clientes/[id]/page.tsx` para incluir a nova acao no menu, abrir modal de confirmacao destrutiva, exigir justificativa textual, manter estados de loading/erro e preservar compatibilidade com SSR e com a pagina de cartoes.

### 40.3. Integrar endpoint e service de exclusao de cliente

**Status:** done  
**Dependencies:** 40.1, 40.2

Adicionar o contrato HTTP do frontend para exclusao de cliente com justificativa e retorno auditavel.

**Details:**

Criar client em `src/lib/api/alunos.ts` e service em `src/lib/comercial/runtime.ts` para chamar um endpoint dedicado de exclusao, enviando `tenantId`, `alunoId`, `justificativa` e metadados de origem. Modelar o retorno para suportar `auditId`, `eventType` e payload de bloqueio quando aplicavel.

### 40.4. Tratar auditoria, bloqueios e navegacao pos-exclusao

**Status:** done  
**Dependencies:** 40.3

Garantir feedback correto para sucesso, negacao por permissao e bloqueio por regra de negocio.

**Details:**

Conectar o fluxo da pagina para fechar modal, exibir mensagens consistentes, redirecionar para `/clientes` em caso de sucesso e apresentar erros `403`, `409` e `422` sem mascarar a resposta do backend. Garantir que a trilha de auditoria retornada pelo backend possa ser exibida ou registrada para debugging operacional.

### 40.5. Fechar regressao e alinhamento documental do recorte

**Status:** done  
**Dependencies:** 40.4

Cobrir testes do fluxo e manter PRD, backlog e dependencias de backend sincronizados.

**Details:**

Adicionar testes para visibilidade por permissao, obrigatoriedade da justificativa, sucesso da exclusao e comportamento da tela de cartoes com o `ClienteHeader` atualizado. Registrar no backlog e no PRD as dependencias de backend para RBAC, endpoint e auditoria.
