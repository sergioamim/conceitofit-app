# Task ID: 273

**Title:** Migrar recebimentos/page.tsx para TanStack Query

**Status:** done

**Dependencies:** 225 ✓

**Priority:** medium

**Description:** Recebimentos usa useState para listagem com filtros. Página financeira acessada diariamente.

**Details:**

Criar useRecebimentos() hook. Query key: ["recebimentos", tenantId, startDate, endDate].

**Test Strategy:**

Listagem com cache. Filtros por data funcionam. Navegar e voltar preserva dados.

## Subtasks

### 273.1. Definir e Estruturar Query Keys para Recebimentos

**Status:** pending  
**Dependencies:** None  

Criar e documentar a estrutura das query keys a serem utilizadas pelo TanStack Query para a listagem de recebimentos, incluindo tenantId, startDate e endDate.

**Details:**

Determinar o formato exato das chaves, como ["recebimentos", tenantId, startDate, endDate], e onde elas serão definidas ou geradas, possivelmente em um arquivo de constantes ou diretamente no hook, garantindo que sejam reativas aos filtros.

### 273.2. Implementar o Hook useRecebimentos() com TanStack Query

**Status:** pending  
**Dependencies:** 273.1  

Desenvolver um hook customizado useRecebimentos() que encapsule a lógica de fetching de dados da listagem de recebimentos usando TanStack Query, aplicando as query keys definidas e o staleTime de 2 minutos.

**Details:**

O hook deverá receber os parâmetros de filtro (startDate, endDate) e retornar os dados, estado de carregamento e erro. Deverá configurar staleTime: 2 * 60 * 1000 (2 minutos). Integrar com a API de backend para buscar os dados, usando a função de busca apropriada (e.g., fetcher).

### 273.3. Refatorar recebimentos/page.tsx para consumir useRecebimentos()

**Status:** pending  
**Dependencies:** 273.2  

Substituir a lógica atual de fetching de dados baseada em useState e useEffect na página recebimentos/page.tsx pelo novo hook useRecebimentos().

**Details:**

Remover o estado local de dados e carregamento, e integrar as informações fornecidas pelo useRecebimentos() na renderização da página. Adaptar os componentes de filtro de data para passar os valores para o hook, assegurando que as mudanças nos filtros invalidem a query e disparem uma nova busca se necessário.

### 273.4. Exportar Hook e Realizar Testes de Integração da Página

**Status:** pending  
**Dependencies:** 273.3  

Garantir que o hook useRecebimentos() esteja corretamente exportado e disponível para uso. Realizar testes de integração completos na página de recebimentos para validar a migração, incluindo cenários de cache e filtros.

**Details:**

Verificar a exportação pública do hook useRecebimentos() em seu módulo. Executar testes end-to-end ou manuais cobrindo o carregamento inicial da página, a aplicação de filtros de data, a persistência do estado de cache ao navegar e retornar, e o comportamento de recarregamento após o staleTime expirar. Confirmar que a experiência do usuário não foi degradada.
