# Task ID: 88

**Title:** Skeleton Loading Components para Tabelas e Listagens

**Status:** done

**Dependencies:** 87 ✓

**Priority:** medium

**Description:** Melhorar a percepção de performance e eliminar o Layout Shift durante o carregamento de dados.

**Details:**

Criar o componente base Skeleton em src/components/ui/. Implementar o componente TableSkeleton em src/components/shared/ que imita a estrutura de linhas do PaginatedTable. Integrar o TableSkeleton no componente PaginatedTable via prop isLoading. Substituir o texto Carregando clientes... pelo TableSkeleton na página de Clientes.

**Test Strategy:**

Skeletons têm animação suave (pulse). A tabela mantém sua estrutura visual enquanto os dados são carregados. Transição suave entre o estado de carga e o estado de dados prontos.
