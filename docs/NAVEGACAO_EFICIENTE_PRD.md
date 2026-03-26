# PRD: Navegação Eficiente e Redução de Carga Cognitiva

## 1. Contexto e Problema
A aplicação "Academia App" cresceu em funcionalidades, resultando em uma Sidebar com mais de 40 itens. Isso gera "Paralisia de Escolha" (Lei de Hick), onde o usuário leva mais tempo para encontrar o que precisa em uma lista longa.

## 2. Objetivos
- **Velocidade:** Permitir navegação instantânea via teclado.
- **Personalização:** Permitir que o usuário defina o que é importante para o seu fluxo.
- **Ergonomia Mobile:** Melhorar a acessibilidade de itens críticos em telas pequenas.

## 3. Funcionalidades Detalhadas

### 3.1. Command Palette (CMD + K)
Um modal global acionado por teclado que permite:
- Buscar páginas pelo nome (ex: "Planos", "Vendas", "Cadastro").
- Buscar clientes rapidamente (integrado com backend).
- Alternar entre unidades (tenant switcher rápido).
- **Tech Stack:** `cmdk` (componente Command do Shadcn).

### 3.2. Favoritos e Acessos Recentes
- **Favoritos:** Botão "Estrela" na sidebar ou no cabeçalho da página para fixar o item no topo da Sidebar.
- **Recentes:** Uma seção dinâmica "Vistos recentemente" com os últimos 5 links acessados (persistido em LocalStorage).
- **Backend:** Necessário salvar `user_favorites` no perfil do usuário para persistência cross-device.

### 3.3. Bottom Navigation (Mobile)
- Exclusivo para telas `< 768px`.
- Itens fixos na parte inferior: `Dashboard`, `Clientes`, `Vendas`, `Check-in (Check)`, `Perfil`.
- Substitui o uso constante do menu hambúrguer para ações triviais.

## 4. Requisitos Técnicos
- **Frontend:** Next.js 16, Tailwind v4, `cmdk`.
- **Backend:** API para salvar/recuperar preferências do usuário (Favoritos).

## 5. Plano de Execução (Milestones)
1. **Fase 1:** Command Palette de Navegação (Frontend-only).
2. **Fase 2:** Implementação de Favoritos e Recentes (Storage Local).
3. **Fase 3:** Bottom Nav Mobile.
4. **Fase 4:** Integração Backend para persistência de Favoritos e busca global de dados.
