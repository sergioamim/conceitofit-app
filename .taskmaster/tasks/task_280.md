# Task ID: 280

**Title:** Migrar whatsapp admin para TanStack Query

**Status:** done

**Dependencies:** 225 ✓

**Priority:** low

**Description:** whatsapp/page.tsx usa useState para config, templates e logs. 3 domínios num componente.

**Details:**

Criar useWhatsAppConfig(), useWhatsAppTemplates(), useWhatsAppLogs() hooks separados. Mutations para CRUD de templates e save config. IMPORTANTE: logs de mensagem devem usar staleTime:0 + refetchInterval:10s (polling) — NÃO cachear, operador precisa ver estado real em tempo real (ENVIADA→ENTREGUE→LIDA→FALHA).

**Test Strategy:**

Cada aba carrega com cache independente. CRUD templates invalida. Config salva invalida.

## Subtasks

### 280.1. Implementar Hooks de Consulta para Dados do WhatsApp Admin

**Status:** done  
**Dependencies:** None  

Desenvolver os hooks `useWhatsAppConfig()`, `useWhatsAppTemplates()` e `useWhatsAppLogs()` utilizando TanStack Query para buscar dados dos respectivos domínios (configurações, templates, logs) no admin do WhatsApp.

**Details:**

useWhatsAppConfig(): staleTime 10min (config muda raramente). useWhatsAppTemplates(): staleTime 5min (templates mudam pouco). useWhatsAppLogs(): staleTime 0 + refetchInterval 10s (polling) — logs NÃO devem ser cacheados, operador precisa ver status em tempo real.

### 280.2. Desenvolver Hooks de Mutação para CRUD de Templates e Salvar Config

**Status:** done  
**Dependencies:** 280.1  

Criar hooks de mutação como `useCreateTemplate()`, `useUpdateTemplate()`, `useDeleteTemplate()` e `useSaveConfig()` para as operações de escrita nos domínios de templates e configuração do WhatsApp.

**Details:**

Implementar as `mutationFn` para cada operação. Gerenciar o sucesso e erro das mutações. Crucialmente, implementar a lógica de invalidação de cache usando `queryClient.invalidateQueries()` para os `queryKey` relevantes após uma mutação bem-sucedida (ex: uma mutação em template deve invalidar `["whatsapp", "templates"]`).

### 280.3. Refatorar whatsapp/page.tsx para integrar os novos hooks de TanStack Query

**Status:** done  
**Dependencies:** 280.1, 280.2  

Substituir o uso de `useState` e chamadas diretas à API em `whatsapp/page.tsx` pelos hooks de consulta e mutação recém-criados do TanStack Query para gerenciar o estado dos domínios de config, templates e logs.

**Details:**

Remover os estados locais (`useState`) para dados de config, templates e logs. Chamar `useWhatsAppConfig()`, `useWhatsAppTemplates()`, `useWhatsAppLogs()`. Mapear botões de CRUD de templates e formulários de config para chamar as mutações correspondentes. Ajustar o carregamento e tratamento de erros na UI conforme os estados (`isLoading`, `isError`, `data`) fornecidos por TanStack Query.

### 280.4. Adicionar Testes Unitários e de Integração e Otimizar Fluxo de Dados

**Status:** done  
**Dependencies:** 280.1, 280.2, 280.3  

Escrever testes unitários para os hooks de TanStack Query e testes de integração para a página refatorada. Otimizar o fluxo de dados na `page.tsx` e garantir que os novos hooks possam ser reutilizados em outros locais, se necessário.

**Details:**

Criar arquivos de teste para `useWhatsAppConfig`, `useWhatsAppTemplates`, `useWhatsAppLogs` e seus hooks de mutação, utilizando `@testing-library/react-query` se aplicável. Garantir que `whatsapp/page.tsx` lida com estados de carregamento e erro de forma robusta e amigável ao usuário. Revisar a estrutura de pastas e exports para facilitar a reutilização dos hooks. Avaliar o uso de `select` nas queries para otimizações de renderização.
