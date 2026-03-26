# Task 088: Skeleton Loading Components para Tabelas e Listagens

## Objetivo
Melhorar a percepção de performance e eliminar o "Layout Shift" durante o carregamento de dados.

## Subtarefas
- [ ] Criar o componente base `Skeleton` em `src/components/ui/` (se ainda não existir via Shadcn).
- [ ] Implementar o componente `TableSkeleton` em `src/components/shared/` que imita a estrutura de linhas do `PaginatedTable`.
- [ ] Integrar o `TableSkeleton` no componente `PaginatedTable` via prop `isLoading`.
- [ ] Criar Skeletons específicos para o Dashboard e Cards de estatísticas.
- [ ] Substituir o texto "Carregando clientes..." pelo `TableSkeleton` na página de Clientes.

## Definição de Pronto (DoP)
- Skeletons têm animação suave (pulse).
- A tabela mantém sua estrutura visual enquanto os dados são carregados.
- Transição suave entre o estado de carga e o estado de dados prontos.
