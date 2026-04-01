# Task ID: 276

**Title:** Migrar CRM campanhas para TanStack Query

**Status:** done

**Dependencies:** 225 ✓

**Priority:** low

**Description:** Campanhas usa useState para listagem, criação e disparo.

**Details:**

Criar useCrmCampanhas() hook. Mutations para criar/disparar/encerrar.

**Test Strategy:**

Listagem com cache. Disparar campanha invalida lista.

## Subtasks

### 276.1. Definir e Implementar Query Keys para Campanhas

**Status:** done  
**Dependencies:** None  

Estabelecer uma estrutura clara e consistente de query keys para todas as operações relacionadas a campanhas de CRM (listagem, detalhes, etc.) no TanStack Query. Isso inclui a definição do array base e a composição para cenários específicos, como listar todas as campanhas ou uma campanha específica.

**Details:**

Criar uma constante, por exemplo, `CRM_CAMPAIGNS_KEYS = ['crm', 'campanhas']`, em um arquivo dedicado de `queryKeys` ou diretamente no hook. Assegurar que as chaves sejam descritivas, reutilizáveis e sigam as convenções existentes do projeto para TanStack Query. Exemplo: `CRM_CAMPAIGNS_KEYS.all` para listar, `CRM_CAMPAIGNS_KEYS.detail(id)` para detalhes.

### 276.2. Desenvolver Hook `useCrmCampanhas` e Mutations CRUD

**Status:** done  
**Dependencies:** 276.1  

Criar o hook customizado `useCrmCampanhas` para buscar e gerenciar o estado da lista de campanhas, e implementar as mutations necessárias para criar, disparar e encerrar campanhas, utilizando o TanStack Query para gerenciamento de dados assíncronos e cache.

**Details:**

No diretório `hooks/` ou similar, criar `useCrmCampanhas.ts`. Implementar `useQuery` para buscar a lista de campanhas usando `queryKey: CRM_CAMPAIGNS_KEYS.all` e definir `staleTime: 2 * 60 * 1000` (2 minutos). Implementar `useMutation` para `criarCampanha`, `dispararCampanha` e `encerrarCampanha`. Após cada mutação bem-sucedida, garantir a invalidação do cache relevante com `queryClient.invalidateQueries(CRM_CAMPAIGNS_KEYS.all)` para forçar a revalidação da lista.

### 276.3. Refatorar `campanhas/page.tsx` para usar `useCrmCampanhas`

**Status:** done  
**Dependencies:** 276.2  

Adaptar o componente de página `campanhas/page.tsx` para consumir os dados da lista de campanhas e executar as ações de criação, disparo e encerramento através do hook `useCrmCampanhas` e suas mutations, removendo o uso de `useState` e lógica manual de fetching.

**Details:**

Abrir o arquivo `campanhas/page.tsx`. Substituir as chamadas de API e o gerenciamento de estado local (`useState`) para campanhas pela integração com `useCrmCampanhas`. Conectar os formulários e botões de ação existentes (criar, disparar, encerrar) às respectivas funções de `mutate` fornecidas pelas mutations. Garantir a correta exibição de estados de loading, erro e dados para uma experiência de usuário fluida.

### 276.4. Finalizar Exportações e Adicionar Testes de Integração/E2E

**Status:** done  
**Dependencies:** 276.3  

Garantir que o novo hook `useCrmCampanhas` seja exportado adequadamente para reusabilidade e desenvolver testes de integração ou end-to-end para validar o fluxo completo de gerenciamento de campanhas com a nova implementação de TanStack Query, confirmando o cache e as invalidações.

**Details:**

Confirmar que `useCrmCampanhas` é exportado em um arquivo `index.ts` ou similar no diretório de hooks. Criar um teste E2E (e.g., com Cypress ou Playwright) que simule um usuário navegando até a página de campanhas, verificando o carregamento inicial dos dados, criando uma nova campanha e validando que a lista é atualizada. O teste deve também verificar se o cache está sendo respeitado e invalidado corretamente, e que o `staleTime` de 2 minutos funciona.
