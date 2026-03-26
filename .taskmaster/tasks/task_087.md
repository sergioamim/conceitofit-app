# Task ID: 87

**Title:** Sincronização de Estado de Tabelas via URL (URL State)

**Status:** done

**Dependencies:** 83 ✓

**Priority:** high

**Description:** Garantir que os filtros, busca e paginação de tabelas sejam persistidos na URL para compartilhamento e histórico de navegação.

**Details:**

Criar o custom hook useTableSearchParams em src/hooks/, implementar suporte a parâmetros: q (busca), status (filtro), page (página) e size (tamanho). Refatorar a tela de Clientes para usar este hook. Garantir que o useEffect de carga de dados seja acionado ao mudar qualquer um dos parâmetros da URL.

**Test Strategy:**

Mudar de página atualiza o ?page= na URL. Digitar na busca atualiza o ?q= na URL. Atualizar a página do navegador (F5) mantém os filtros aplicados. Botão Voltar do navegador retorna ao estado de filtro anterior.
