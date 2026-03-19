# Task ID: 50

**Title:** Redesenhar a arquitetura de informação da área de segurança

**Status:** done

**Dependencies:** 37 ✓

**Priority:** high

**Description:** Transformar o PRD revisado em uma IA clara para gestores, separando usuários, acessos, perfis, funcionalidades e revisões.

**Details:**

A área de segurança precisa sair da navegação técnica atual e ganhar uma arquitetura de informação orientada a produto, com visão geral, usuários e acessos, perfis padronizados, catálogo de funcionalidades e revisões/auditoria. Esta task fecha o backbone de navegação, linguagem e estados base para o restante do rollout.

**Test Strategy:**

Validar a IA com testes de navegação e smoke visual, garantindo consistência entre rotas, labels e estados vazios/carregamento.

## Subtasks

### 50.1. Reestruturar a navegação principal da segurança

**Status:** done  
**Dependencies:** None  

Substituir a navegação orientada a termos técnicos por áreas de produto.

**Details:**

Reorganizar a entrada de segurança para trabalhar com `Visão geral`, `Usuários e acessos`, `Perfis padronizados`, `Funcionalidades` e `Revisões e auditoria`, preservando links legados enquanto durar a transição.

### 50.2. Padronizar linguagem de negócio nas superfícies de segurança

**Status:** done  
**Dependencies:** 50.1  

Trocar labels técnicas por termos compreensíveis sem perder rastreabilidade.

**Details:**

Substituir `grant`, `feature`, `roleName` e termos similares por linguagem de produto, mantendo o código técnico apenas em detalhes secundários para auditoria e suporte.

### 50.3. Definir layouts base, estados vazios e resumos textuais da nova área

**Status:** done  
**Dependencies:** 50.1, 50.2  

Dar consistência visual e semântica para todas as páginas de segurança.

**Details:**

Criar padrões de cabeçalho, filtros, cards de resumo, empty states, avisos de risco e blocos de explicação textual que serão reutilizados nas telas de usuários, perfis, catálogo e revisões.

### 50.4. Alinhar tipagem e feature flags para o rollout gradual da segurança

**Status:** done  
**Dependencies:** 50.3  

Permitir convivência controlada entre a IA antiga e a nova.

**Details:**

Preparar constantes, rotas, guards e feature flags para expor as novas superfícies sem quebrar o fluxo atual enquanto o backend ainda evolui.
