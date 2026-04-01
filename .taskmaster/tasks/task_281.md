# Task ID: 281

**Title:** Migrar BI operacional e BI rede para TanStack Query

**Status:** done

**Dependencies:** 225 ✓

**Priority:** low

**Description:** bi/page.tsx e bi/rede/page.tsx usam useState para snapshot BI. Dados agregados com filtros.

**Details:**

Criar useBiOperacional() e useBiRede() hooks. Query key inclui filtros (scope, tenantId, dateRange, segmento). staleTime 5min.

**Test Strategy:**

BI carrega com cache. Mudar filtros invalida seletivamente. Voltar ao filtro anterior usa cache.

## Subtasks

### 281.1. Definir chaves de consulta e tipos para BI Operacional e BI Rede

**Status:** pending  
**Dependencies:** None  

Criar as interfaces de tipos de dados para o BI operacional e de rede, incluindo os parâmetros de filtro (scope, tenantId, dateRange, segmento), e definir a estrutura das query keys para TanStack Query.

**Details:**

Criar um arquivo em 'src/hooks/bi/types.ts' para definir interfaces como 'BiQueryParams', 'BiOperacionalData', 'BiRedeData'. As chaves de consulta devem ser arrays, por exemplo, '["biOperacional", BiQueryParams]' ou '["biRede", BiQueryParams]'.

### 281.2. Implementar hook `useBiOperacional` para BI Operacional

**Status:** pending  
**Dependencies:** 281.1  

Desenvolver o hook `useBiOperacional` utilizando TanStack Query para buscar e gerenciar os dados do BI operacional, aplicando os filtros necessários e configurando `staleTime` de 5 minutos conforme especificado.

**Details:**

Criar o arquivo 'src/hooks/bi/useBiOperacional.ts'. O hook deve aceitar um objeto de filtros (BiQueryParams) como argumento, construir a query key com base nesses filtros e usar `useQuery` para buscar os dados. Configurar `staleTime: 1000 * 60 * 5` (5 minutos).

### 281.3. Implementar hook `useBiRede` para BI Rede

**Status:** pending  
**Dependencies:** 281.1  

Desenvolver o hook `useBiRede` utilizando TanStack Query para buscar e gerenciar os dados do BI de rede, aplicando os filtros necessários e configurando `staleTime` de 5 minutos.

**Details:**

Criar o arquivo 'src/hooks/bi/useBiRede.ts'. O hook deve aceitar um objeto de filtros (BiQueryParams) como argumento, construir a query key com base nesses filtros e usar `useQuery` para buscar os dados. Configurar `staleTime: 1000 * 60 * 5` (5 minutos).

### 281.4. Refatorar páginas `bi/page.tsx` e `bi/rede/page.tsx` para usar os novos hooks

**Status:** pending  
**Dependencies:** 281.2, 281.3  

Atualizar as páginas `bi/page.tsx` e `bi/rede/page.tsx` para consumir os dados através dos hooks `useBiOperacional` e `useBiRede` respectivamente, removendo a lógica de `useState` para gerenciamento de estado e carregamento de dados.

**Details:**

Em 'bi/page.tsx', substituir a lógica de `useState` e chamadas de API diretas pela invocação do hook `useBiOperacional({ scope, tenantId, dateRange, segmento })`. Em 'bi/rede/page.tsx', fazer o mesmo com `useBiRede({ scope, tenantId, dateRange, segmento })`. Garantir que os dados são exibidos corretamente e os filtros funcionam.
