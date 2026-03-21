# Task ID: 65

**Title:** Adaptar UX do login para rede explicita e fallback por host

**Status:** done

**Dependencies:** 62 ✓, 63 ✓, 64 ✓

**Priority:** medium

**Description:** Refinar a experiência do login para comunicar claramente a rede corrente e suportar entrada por rota ou subdomínio.

**Details:**

Além do contrato técnico, a tela precisa mostrar a rede selecionada, lidar com rede inválida e não depender de heurísticas implícitas. O comportamento por `/app/[rede]/login` e `[rede].localhost` deve ser observável ao operador.

**Test Strategy:**

Cobrir cenários de rede válida, rede ausente/inválida e alternância entre entrada por rota e por host com smoke visual ou Playwright.

## Subtasks

### 65.1. Exibir rede corrente na tela de login

**Status:** done  
**Dependencies:** None  

Dar visibilidade ao contexto de academia selecionado.

**Details:**

Renderizar nome/subdomínio da rede atual ou um estado coerente de carregamento/erro, evitando que o usuário faça login sem saber em qual academia está entrando.

### 65.2. Tratar rede inválida ou inexistente

**Status:** done  
**Dependencies:** 65.1  

Evitar falhas silenciosas no acesso por URL errada.

**Details:**

Definir comportamento para `/app/[rede]/login` inválido: mensagem clara, bloqueio do submit e fallback controlado, sem redirecionamentos ambíguos.

### 65.3. Revisar deep links e navegação pós-login

**Status:** done  
**Dependencies:** 65.1, 65.2  

Manter a rede coerente durante entrada e redirecionamento.

**Details:**

Validar callbacks, `returnTo`, redirecionamento após autenticação e compatibilidade com host baseado em subdomínio para evitar perda do contexto da rede.
