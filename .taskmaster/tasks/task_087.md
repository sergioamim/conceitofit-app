# Task 087: Sincronização de Estado de Tabelas via URL (URL State)

## Objetivo
Garantir que os filtros, busca e paginação de tabelas sejam persistidos na URL para compartilhamento e histórico de navegação.

## Subtarefas
- [ ] Criar o custom hook `useTableSearchParams` em `src/hooks/`.
- [ ] Implementar suporte a parâmetros: `q` (busca), `status` (filtro), `page` (página) e `size` (tamanho).
- [ ] Refatorar a tela de `Clientes` (`src/app/(app)/clientes/page.tsx`) para usar este hook.
- [ ] Garantir que o `useEffect` de carga de dados seja acionado ao mudar qualquer um dos parâmetros da URL.
- [ ] Adicionar funcionalidade de "Limpar Filtros" que remove os `searchParams`.

## Definição de Pronto (DoP)
- Mudar de página atualiza o `?page=` na URL.
- Digitar na busca atualiza o `?q=` na URL.
- Atualizar a página do navegador (F5) mantém os filtros aplicados.
- Botão "Voltar" do navegador retorna ao estado de filtro anterior.
