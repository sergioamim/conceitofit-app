# Task ID: 51

**Title:** Implementar as telas de Usuários e acessos com resumo de acesso efetivo

**Status:** pending

**Dependencies:** 50

**Priority:** high

**Description:** Entregar a principal superfície operacional da nova segurança, centrada em pessoas, escopos, perfis e risco.

**Details:**

A nova experiência precisa começar pela operação diária: listar pessoas, filtrar por escopo e risco, abrir o detalhe do usuário e enxergar claramente acesso direto, herdado ou global, perfil principal, perfis adicionais, exceções e revisão. Esta task cobre clients, estado de tela, detalhe e fluxo de concessão com escolha explícita de escopo e perfil.

**Test Strategy:**

Cobrir estados de lista, detalhe, filtros e fluxo de concessão com testes de integração e E2E em cima do contrato novo.

## Subtasks

### 51.1. Preparar types e API clients de acesso efetivo por usuário

**Status:** pending  
**Dependencies:** None

Consumir o novo resumo canônico de segurança do backend.

**Details:**

Atualizar `src/lib/types.ts` e clients da área de segurança para suportar escopo, origem do acesso, perfil principal, perfis adicionais, exceções, risco e justificativas.

### 51.2. Construir a tela Usuários e acessos com filtros de negócio e risco

**Status:** pending  
**Dependencies:** 51.1

Fazer a listagem responder rápido quem é a pessoa, onde atua e qual o nível de risco.

**Details:**

Implementar a nova listagem com busca, filtros por unidade, academia, perfil, exceção, acesso amplo e revisão, usando linguagem de negócio e indicadores claros de risco.

### 51.3. Redesenhar o detalhe do usuário com blocos de resumo, escopos, perfis e exceções

**Status:** pending  
**Dependencies:** 51.1

Separar governança, operação e auditoria na página de detalhe.

**Details:**

Reorganizar o detalhe para trabalhar com `Resumo efetivo`, `Escopos e acessos`, `Perfis`, `Exceções`, `Política de novas unidades` e `Auditoria e revisões`, com clareza sobre origem e impacto do acesso.

### 51.4. Implementar o fluxo de conceder acesso com escolha explícita de escopo e perfil

**Status:** pending  
**Dependencies:** 51.2, 51.3

Remover o perfil implícito da experiência principal.

**Details:**

Criar o fluxo curto de concessão com escolha de escopo, tipo de acesso quando aplicável, perfil padronizado e preview do impacto antes de confirmar.

### 51.5. Cobrir listagem, detalhe e concessão com testes de regressão

**Status:** pending  
**Dependencies:** 51.4

Blindar a nova superfície central de operação da segurança.

**Details:**

Adicionar testes de integração e E2E para a lista, detalhe do usuário, filtros, estados de risco e fluxo de conceder acesso, incluindo cenários de acesso amplo e exceções visíveis.
