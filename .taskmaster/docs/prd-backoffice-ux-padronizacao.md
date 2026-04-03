# PRD: Padronização UX do Backoffice

## Contexto

O backoffice administrativo cresceu para 30+ páginas, mas carece de consistência:
- Páginas usam tabelas HTML raw, componentes customizados isolados ou PaginatedTable — sem padrão
- Seleção de Academia/Rede usa Select, lista de botões ou cards — não escala para centenas de academias
- Layout desktop-only sem responsividade
- Filtros implementados ad-hoc por página

O sistema já possui componentes padronizados (`PaginatedTable`, `SuggestionInput`, `CrudModal`) que devem ser adotados universalmente.

## Premissas de Escala
- Centenas de academias, milhares de unidades
- Nunca usar Select/ComboBox para Academia/Rede/Unidade — sempre SuggestionInput com busca async
- Todas as listagens devem usar PaginatedTable, exceto a tela de Planos (layout de cards permitido)
- Matrizes de permissões (Perfis, Funcionalidades) são exceções legítimas

---

## FASE 1 — Componentes Base e Infraestrutura

### Task: Adicionar tipo "suggestion" ao FormFieldConfig do CrudModal
- **Prioridade:** alta
- **Complexidade:** média (3-4h)
- **Dependências:** nenhuma
- **Paralelismo:** pode rodar em paralelo com qualquer outra task da Fase 1
- **Descrição:** O CrudModal (`src/components/shared/crud-modal.tsx`) usa `FormFieldConfig` com tipos `text`, `number`, `select`, `textarea`, `date`, `checkbox`. Adicionar tipo `"suggestion"` que renderiza `SuggestionInput` em vez de `<Select>`. Deve aceitar `onFocusOpen` (async loader) e `options` (SuggestionOption[]). Atualizar `autoSchemaFromFields` para gerar schema Zod correto para campos suggestion (string obrigatória representando o ID selecionado). Incluir testes unitários.

### Task: Criar componente TableFilters padronizado
- **Prioridade:** alta
- **Complexidade:** alta (6-8h)
- **Dependências:** nenhuma
- **Paralelismo:** pode rodar em paralelo com qualquer outra task da Fase 1
- **Descrição:** Criar `src/components/shared/table-filters.tsx` — componente declarativo de filtros para uso acima de PaginatedTable. Aceita array de `FilterConfig` com tipos: `text` (busca textual), `suggestion` (SuggestionInput para entidades), `select` (para enums pequenos fixos como status), `date-range` (período), `status-badge` (filtro por status com badges visuais). Deve sincronizar estado com URL search params via `useSearchParams` para deep-linking. Incluir botão "Limpar filtros". Renderizar inline em row flexbox responsivo. Emitir evento `onFiltersChange` com objeto de filtros ativos. Deve ser SSR-safe (sem valores dinâmicos no render inicial). Incluir testes unitários.

### Task: Criar hooks de busca async para Academia e Unidade (SuggestionInput)
- **Prioridade:** alta
- **Complexidade:** baixa (2-3h)
- **Dependências:** nenhuma
- **Paralelismo:** pode rodar em paralelo com qualquer outra task da Fase 1
- **Descrição:** Criar `src/backoffice/lib/use-academia-suggestion.ts` e `src/backoffice/lib/use-unidade-suggestion.ts` — hooks que retornam `{ options, onFocusOpen, isLoading }` compatíveis com SuggestionInput. `useAcademiaSuggestion` busca academias via API do backoffice (endpoint de listagem existente). `useUnidadeSuggestion(academiaId?)` busca unidades filtradas opcionalmente por academia. Ambos mapeiam resultado para `SuggestionOption[]` (id, label, searchText). Usar TanStack Query internamente. Caps de 50 resultados por busca.

---

## FASE 2 — Migrar Seleção de Academia/Rede para SuggestionInput

### Task: Migrar seleção de academia na página de BI para SuggestionInput
- **Prioridade:** alta
- **Complexidade:** baixa (1-2h)
- **Dependências:** hooks de busca async Academia
- **Paralelismo:** pode rodar em paralelo com outras migrações da Fase 2
- **Descrição:** Em `/admin/bi` (page.tsx), substituir o `<Select>` de academia por `SuggestionInput` usando `useAcademiaSuggestion`. Manter comportamento de filtro de dados ao selecionar.

### Task: Redesenhar página "Entrar como Academia" com SuggestionInput
- **Prioridade:** alta
- **Complexidade:** média (3-4h)
- **Dependências:** hooks de busca async Academia
- **Paralelismo:** pode rodar em paralelo com outras migrações da Fase 2
- **Descrição:** A página `/admin/entrar-como-academia` exibe grid de cards com todas as academias — não escala para centenas. Redesenhar para: (1) SuggestionInput proeminente no topo para buscar academia, (2) Seção "Acessos recentes" mostrando as 5 últimas academias acessadas (persistir em localStorage, ler após mount), (3) Ao selecionar academia, exibir unidades disponíveis com SuggestionInput secundário ou lista curta, (4) Botão "Entrar" para executar a ação de impersonation. Manter auditoria existente. SSR-safe.

### Task: Migrar filtro de academia na página WhatsApp para SuggestionInput
- **Prioridade:** média
- **Complexidade:** baixa (1-2h)
- **Dependências:** hooks de busca async Academia
- **Paralelismo:** pode rodar em paralelo com outras migrações da Fase 2
- **Descrição:** Em `/admin/whatsapp` (page.tsx), substituir o `<Select>` de filtro de academia por `SuggestionInput` usando `useAcademiaSuggestion`. Manter lógica de filtragem existente.

### Task: Migrar filtros de academia em Segurança/Usuários para SuggestionInput
- **Prioridade:** média
- **Complexidade:** média (2-3h)
- **Dependências:** hooks de busca async Academia
- **Paralelismo:** pode rodar em paralelo com outras migrações da Fase 2
- **Descrição:** Em `/admin/seguranca/usuarios` (page.tsx), substituir todos os `<Select>` de academia nos filtros por `SuggestionInput` usando `useAcademiaSuggestion`. A página tem componente customizado `UsuariosTable` que será substituído na Fase 3. Aqui focar apenas nos filtros.

### Task: Migrar campos de academia em CrudModal de Cobranças e Contratos para suggestion
- **Prioridade:** média
- **Complexidade:** baixa (2-3h)
- **Dependências:** tipo "suggestion" no CrudModal, hooks de busca async Academia
- **Paralelismo:** pode rodar em paralelo com outras migrações da Fase 2
- **Descrição:** Em `/admin/financeiro/cobrancas` e `/admin/financeiro/contratos`, os CrudModals de criação/edição usam `<Select>` para campo de academia. Migrar esses campos para o novo tipo `"suggestion"` do FormFieldConfig, usando `onFocusOpen` do `useAcademiaSuggestion`. Garantir que validação Zod funcione (campo obrigatório, ID válido).

---

## FASE 3 — Migrar Tabelas para PaginatedTable

### Task: Migrar tabela de Compliance para PaginatedTable
- **Prioridade:** média
- **Complexidade:** média (3-4h)
- **Dependências:** TableFilters (para filtros inline)
- **Paralelismo:** pode rodar em paralelo com outras migrações da Fase 3
- **Descrição:** Em `/admin/seguranca/compliance` (page.tsx), substituir tabela HTML `<table>` por PaginatedTable. Definir colunas: regra, categoria, status (com StatusBadge), última verificação, ações. Adicionar TableFilters com filtro por status e busca textual. Implementar paginação server-side via API existente.

### Task: Migrar tabelas de Alertas Operacionais para PaginatedTable
- **Prioridade:** média
- **Complexidade:** média (3-4h)
- **Dependências:** TableFilters
- **Paralelismo:** pode rodar em paralelo com outras migrações da Fase 3
- **Descrição:** Em `/admin/operacional/alertas` (page.tsx), substituir tabela HTML raw por PaginatedTable. Colunas: tipo, severidade (com badge colorido), academia, mensagem, data/hora, ações (resolver/silenciar). Adicionar TableFilters com filtro por severidade, academia (SuggestionInput), e período.

### Task: Migrar tabelas de WhatsApp para PaginatedTable
- **Prioridade:** média
- **Complexidade:** média (4-5h)
- **Dependências:** TableFilters, migração SuggestionInput do WhatsApp (Fase 2)
- **Paralelismo:** pode rodar em paralelo com outras migrações da Fase 3 (exceto WhatsApp Fase 2)
- **Descrição:** Em `/admin/whatsapp` (page.tsx), substituir tabelas HTML raw por PaginatedTable. A página tem duas seções tabulares: (1) canais/instâncias e (2) mensagens recentes. Cada uma deve virar PaginatedTable independente com colunas tipadas. Adicionar TableFilters integrado.

### Task: Migrar UsuariosTable customizado para PaginatedTable
- **Prioridade:** média
- **Complexidade:** alta (5-6h)
- **Dependências:** TableFilters, migração SuggestionInput de Segurança/Usuários (Fase 2)
- **Paralelismo:** pode rodar em paralelo com outras migrações da Fase 3 (exceto Seg/Usuarios Fase 2)
- **Descrição:** Em `/admin/seguranca/usuarios`, substituir o componente customizado `UsuariosTable` por PaginatedTable. Colunas: nome, email, academia(s), perfil, status, último acesso, ações. Eliminar o componente customizado. Usar TableFilters com: busca textual, academia (SuggestionInput), perfil (Select — enum pequeno), status (Select). Implementar seleção múltipla e bulk actions (desativar, alterar perfil).

### Task: Redesenhar página de Unidades com PaginatedTable e SuggestionInput
- **Prioridade:** alta
- **Complexidade:** alta (6-8h)
- **Dependências:** hooks de busca async Academia e Unidade, TableFilters
- **Paralelismo:** pode rodar em paralelo com outras migrações da Fase 3
- **Descrição:** Em `/admin/unidades`, substituir o layout de sidebar com lista de botões de academias (`UnitsTableCard`) por: (1) SuggestionInput para selecionar academia no topo, (2) PaginatedTable para listar unidades da academia selecionada com colunas: nome, CNPJ, cidade/UF, status, alunos ativos, ações. Se nenhuma academia selecionada, mostrar todas as unidades com coluna "Academia" visível. Adicionar TableFilters com busca textual, status, cidade. Eliminar componente `UnitsTableCard`.

### Task: Migrar tabela de transações do Dashboard Financeiro para PaginatedTable
- **Prioridade:** baixa
- **Complexidade:** média (3-4h)
- **Dependências:** TableFilters
- **Paralelismo:** pode rodar em paralelo com outras migrações da Fase 3
- **Descrição:** Em `/admin/financeiro` (dashboard), manter cards de KPI no topo. Substituir apenas a seção de transações recentes (tabela raw) por PaginatedTable com colunas: data, academia, tipo, valor, status. Adicionar filtros inline.

### Task: Migrar tabela de Saúde Operacional para PaginatedTable
- **Prioridade:** baixa
- **Complexidade:** média (3-4h)
- **Dependências:** TableFilters
- **Paralelismo:** pode rodar em paralelo com outras migrações da Fase 3
- **Descrição:** Em `/admin/operacional/saude`, manter cards de status no topo. Substituir tabelas de detalhamento (métricas por academia) por PaginatedTable. Colunas: academia, score de saúde, alunos ativos, taxa de churn, última sincronização, ações. Adicionar TableFilters com busca e filtro por score range.

---

## FASE 4 — Layout Responsivo do Backoffice

### Task: Implementar sidebar colapsável no layout do backoffice
- **Prioridade:** média
- **Complexidade:** alta (6-8h)
- **Dependências:** nenhuma da Fase 1-3 (pode começar em paralelo)
- **Paralelismo:** task independente
- **Descrição:** Em `src/app/(backoffice)/admin/layout.tsx`, a sidebar é fixa `w-72` sem responsividade. Implementar: (1) Toggle manual para colapsar a sidebar a `w-16` (apenas ícones), (2) Auto-collapse em breakpoints `< lg` (1024px), (3) Em `< md` (768px), sidebar como Drawer overlay com botão hamburger no header, (4) Persistir preferência de colapsado em localStorage (ler após mount — SSR-safe), (5) Animação suave com transition (respeitar prefers-reduced-motion), (6) Tooltips nos ícones quando colapsada. Manter command palette (Cmd+K) e breadcrumbs funcionando em ambos os estados.

### Task: Melhorar command palette com indexação completa de rotas do backoffice
- **Prioridade:** baixa
- **Complexidade:** média (3-4h)
- **Dependências:** nenhuma
- **Paralelismo:** pode rodar em paralelo com sidebar colapsável
- **Descrição:** A command palette (Cmd+K) do backoffice já existe mas precisa indexar todas as rotas administrativas. Garantir que cada página do `/admin/*` tenha entrada no comando com: título legível, ícone, atalho de teclado se aplicável, e tags de busca (sinônimos). Adicionar seção "Ações rápidas" (criar academia, novo lead, etc.) além de navegação. Adicionar seção "Acessos recentes" no topo.
