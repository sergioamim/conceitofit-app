# Task ID: 279

**Title:** Migrar billing-config para TanStack Query

**Status:** done

**Dependencies:** 225 ✓

**Priority:** low

**Description:** billing-config-content.tsx usa useState para config, loading, saving, testing.

**Details:**

Criar useBillingConfig() com useQuery para load + useMutation para save e test. Já tem react-hook-form.

**Test Strategy:**

Config carrega com cache. Salvar invalida. Testar conexão funciona.

## Subtasks

### 279.1. Definir Query Keys e Tipagem do Config de Faturamento

**Status:** pending  
**Dependencies:** None  

Criar ou identificar o local adequado para definir as chaves de query (query keys) para o `billing-config` seguindo o padrão da aplicação e definir as interfaces de tipagem para os dados de configuração de faturamento.

**Details:**

Criar `QUERY_KEYS.BILLING_CONFIG` no arquivo de chaves de query (e.g., `src/constants/queryKeys.ts` ou similar). Definir interfaces TypeScript para a estrutura dos dados de configuração de faturamento (e.g., `BillingConfig` e `BillingConfigFormValues`) se ainda não existirem, garantindo compatibilidade com o backend e `react-hook-form`.

### 279.2. Implementar Hook useBillingConfig com TanStack Query

**Status:** pending  
**Dependencies:** 279.1  

Desenvolver o hook `useBillingConfig` que utilizará `useQuery` para carregar a configuração de faturamento, e `useMutation` para as operações de salvar (save) e testar a conexão (test).

**Details:**

Criar `src/hooks/useBillingConfig.ts`. Dentro deste hook: Usar `useQuery` com a chave definida em #1 para buscar os dados de configuração de faturamento, configurando `staleTime: 5 * 60 * 1000` (5 minutos). Usar `useMutation` para a função de salvar (`saveBillingConfig`), que invalidará o cache da query de `billing-config` após o sucesso. Usar `useMutation` para a função de testar a conexão (`testBillingConnection`). Garantir tratamento de loading, error e sucesso para todas as operações.

### 279.3. Refatorar billing-config-content.tsx para usar useBillingConfig

**Status:** pending  
**Dependencies:** 279.2  

Atualizar o componente `billing-config-content.tsx` para consumir o novo hook `useBillingConfig`, removendo os estados locais (`useState`) e a lógica de carregamento/salvamento/teste manual, substituindo-os pelas funcionalidades providas pelo TanStack Query.

**Details:**

Abrir `src/modules/billing/components/billing-config-content.tsx`. Substituir os `useState` de `config`, `loading`, `saving`, `testing` pelos estados e funções retornados por `useBillingConfig`. Integrar as funções `mutate` de `saveBillingConfig` e `testBillingConnection` com os handlers de submissão do `react-hook-form`. Manter a integração existente com `react-hook-form` e `zodResolver`. Remover imports de API diretos, se aplicável, em favor do hook.

### 279.4. Exportar e Testar End-to-End da Configuração de Faturamento

**Status:** pending  
**Dependencies:** 279.3  

Garantir que o `useBillingConfig` e os componentes relacionados estejam corretamente exportados, e realizar testes end-to-end para validar o fluxo completo de gerenciamento da configuração de faturamento.

**Details:**

Verificar se o `useBillingConfig` está exportado de um `index.ts` adequado para ser reutilizável (se for um requisito de arquitetura). Executar testes end-to-end (se existirem ou criá-los para este fluxo) ou testes manuais abrangentes para: Carregamento inicial da configuração. Submissão bem-sucedida de novas configurações. Comportamento do cache ao navegar para fora e voltar. Tratamento de erros durante o salvamento. Funcionalidade de 'Testar Conexão' com cenários de sucesso e falha.
