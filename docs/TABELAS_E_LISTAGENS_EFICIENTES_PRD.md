# PRD: Tabelas e Listagens de Alta Performance (UX)

## 1. Contexto e Problema
O sistema de gestão lida com grandes volumes de clientes, matrículas e vendas. Atualmente, a navegação entre páginas e a aplicação de filtros não é persistente na URL, o que dificulta o compartilhamento de visões específicas. Além disso, a falta de feedbacks visuais durante o carregamento (Skeletons) e a ausência de ações em massa (Bulk Actions) tornam o trabalho repetitivo mais lento.

## 2. Objetivos
- **Sincronização:** Manter o estado da tabela (filtros, busca, página) sempre refletido na URL.
- **Feedback Visual:** Eliminar "Layout Shifts" e textos de carregamento estáticos por Skeletons animados.
- **Produtividade:** Permitir que o usuário realize ações em múltiplos registros simultaneamente.

## 3. Funcionalidades Detalhadas

### 3.1. Sincronização de Estado via URL (URL State)
- Implementar um hook (ex: `useTableState`) que sincroniza automaticamente os parâmetros de busca, filtros de status e paginação com os `searchParams` do Next.js.
- **Benefício:** O usuário pode dar "Back/Forward" no navegador sem perder o filtro, e pode copiar o link da página e enviar para outro colaborador com a mesma visão.

### 3.2. Skeleton Screens para Tabelas
- Criar componentes de Skeleton específicos para o `PaginatedTable`.
- Substituir o "Carregando..." por linhas pulsantes que mimetizam a estrutura da tabela real.
- **Benefício:** Redução da percepção de latência e melhoria no Cumulative Layout Shift (CLS).

### 3.3. Bulk Actions (Ações em Massa)
- Adicionar suporte a checkboxes na `PaginatedTable`.
- Implementar uma barra de ações flutuante (Floating Action Bar) que aparece quando um ou mais itens são selecionados.
- Ações iniciais sugeridas: "Exportar Selecionados", "Alterar Status em Massa", "Enviar Notificação".

## 4. Requisitos Técnicos
- **Frontend:** Next.js `useSearchParams`, `usePathname`, Tailwind v4 (animações de pulso).
- **Abstração:** As melhorias devem ser feitas no componente base `PaginatedTable` para que todas as telas (Clientes, Vendas, Planos) herdem os benefícios.

## 5. Plano de Execução
1. **Fase 1:** Implementar Skeletons para Tabelas e Listagens.
2. **Fase 2:** Criar o Hook de Sincronização de URL e aplicar na tela de Clientes.
3. **Fase 3:** Evoluir a `PaginatedTable` para suportar seleção de linhas e Barra de Ações.
