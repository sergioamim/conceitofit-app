# Task ID: 86

**Title:** Criar bottom navigation mobile para atalhos críticos

**Status:** done

**Dependencies:** 85 ✓

**Priority:** medium

**Description:** Introduzir uma navegação inferior em telas pequenas com atalhos fixos para os fluxos mais usados do app.

**Details:**

Adicionar uma bottom navigation exclusiva para telas `< 768px`, com atalhos para Dashboard, Clientes, Vendas, Check-in e Perfil, complementando a sidebar atual e reduzindo dependência do menu hambúrguer para ações triviais. A solução deve respeitar o layout existente, estados ativos/inativos, tenant atual e coexistir com a command palette e os favoritos sem quebrar responsividade.

**Test Strategy:**

Cobrir com testes E2E responsivos e unitários a renderização apenas em mobile, destaque de rota ativa, navegação entre atalhos e convivência correta com a sidebar/overlay do menu principal.
