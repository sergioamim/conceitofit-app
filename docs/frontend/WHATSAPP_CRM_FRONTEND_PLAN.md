# Plano de Implementação Frontend — WhatsApp CRM Operacional + IA

**Data:** 2026-04-07  
**Status:** Rascunho para aprovação  
**Backend PRD:** `academia-java/docs/exec-plan-whatsapp-crm-operacional-ia.md`  
**OpenAPI:** `academia-java/modulo-app/src/main/resources/static/openapi.yaml`

---

## 📋 Índice

1. [Análise Exploratória](#1-análise-exploratória)
2. [Mapeamento de Páginas/Telas](#2-mapeamento-de-páginasteas)
3. [Componentes Reutilizáveis](#3-componentes-reutilizáveis)
4. [Mudanças em Código Existente](#4-mudanças-em-código-existente)
5. [Integrações Especiais](#5-integrações-especiais)
6. [Estados e Loading](#6-estados-e-loading)
7. [Acessibilidade e UX](#7-acessibilidade-e-ux)
8. [Lista de Tasks](#8-lista-de-tasks)
9. [Arquitetura de Componentes](#9-arquitetura-de-componentes)
10. [Riscos e Atenções](#10-riscos-e-atenções)

---

## 1. Análise Exploratória

### 1.1 Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Framework | **Next.js 16.1.6** (App Router com Server/Client Components) |
| React | **19.2.3** |
| TypeScript | **5.x** |
| Styling | **Tailwind CSS v4** + `tw-animate-css` |
| Componentes UI | **shadcn/ui** (base Radix UI) |
| Animações | **Framer Motion** |
| State/Server Data | **@tanstack/react-query v5.95.2** |
| Forms | **react-hook-form v7.72.0** + **zod v4.3.6** + `@hookform/resolvers` |
| Ícones | **lucide-react** |
| HTTP Client | **`fetch()` nativo** (wrapper custom em `src/lib/api/http.ts`) |
| Auth | Session-based com cookies + tokens (JWT) |
| Tema | `next-themes` (dark mode default) |
| Testes Unitários | **Vitest** + Happy DOM |
| E2E | **Playwright** |
| Monitoring | **Sentry** + OpenTelemetry |
| Rich Text | **TipTap** (editor) |

### 1.2 Gerenciamento de Estado

- **@tanstack/react-query** para server state (queries, mutations, invalidation)
- **React Context** para tenant context (`TenantContextProvider`)
- **Session management** via cookies (`src/lib/api/session.ts`)
- **Sem Redux/Zustand** — o projeto usa exclusivamente React Query + Context

### 1.3 Sistema de Design

Base **shadcn/ui** com componentes existentes em `src/components/ui/`:
- `button`, `dialog`, `input`, `select`, `tabs`, `badge`, `card`, `checkbox`, `table`, `sheet`, `skeleton`, `tooltip`, `label`, `separator`, `textarea`, `alert-dialog`

Componentes compartilhados em `src/components/shared/`:
- `paginated-table`, `table-filters`, `export-menu`, `status-badge`, `phone-input`, `masked-input`
- `prospect-modal`, `prospect-detail-modal`, `cliente-edit-form`, `novo-cliente-wizard`

Layout em `src/components/layout/`:
- `sidebar`, `app-topbar`, `bottom-nav`, `app-content-shell`, `command-palette`, `active-tenant-selector`

### 1.4 Cliente HTTP

**Padrão:** função `apiRequest<T>()` em `src/lib/api/http.ts`
```ts
apiRequest<T>({
  path: string,
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  query?: Record<string, string | number | boolean | undefined>,
  body?: unknown,
  headers?: Record<string, string>,
})
```

- Injeção automática de `Authorization` header
- Injeção automática de `X-Context-Id` (tenantId ativo) para rotas scropadas
- CSRF token (Double Submit Cookie)
- Token refresh automático em 401
- Retry com rotação de token

### 1.5 Autenticação

- **JWT** armazenado em cookies
- **Session management** centralizado em `src/lib/api/session.ts`
- **Multi-tenant** via `TenantContextProvider` (`src/lib/tenant/hooks/use-session-context.tsx`)
- **`X-Context-Id`** injetado automaticamente no `apiRequest` baseado no tenant ativo da sessão
- **`useTenantContext()`** hook para acessar `tenantId`, `tenantResolved`, lista de tenants

### 1.6 Páginas Existentes Relacionadas

| Rota | Propósito |
|------|-----------|
| `/prospects` | Lista de prospects (legado) |
| `/crm` | Workspace CRM (novo) |
| `/crm/prospects-kanban` | Funil de vendas (kanban) |
| `/crm/tarefas` | Tarefas comerciais |
| `/crm/campanhas` | Campanhas |
| `/crm/playbooks` | Playbooks CRM |
| `/clientes` | Base de alunos |
| `/admin/whatsapp` | Configuração WhatsApp (backoffice — templates, logs, config) |

### 1.7 Padrões de Código

- **Arquivos de API:** `src/lib/api/{dominio}.ts` — funções puras chamando `apiRequest`
- **React Query hooks:** `src/lib/query/use-{dominio}.ts` — `useQuery`/`useMutation` wrappers
- **Query keys:** centralizadas em `src/lib/query/keys.ts`
- **Types:** `src/lib/shared/types/{dominio}.ts`
- **Schemas:** `src/lib/forms/{dominio}-schemas.ts` (zod)
- **Páginas:** `(portal)/{rota}/page.tsx` com lazy load via `dynamic()` quando > 500 LOC
- **Componentes de página:** `(portal)/{rota}/{conteúdo}.tsx`
- **Nav items:** `src/lib/tenant/nav-items-v2.ts`

### 1.8 Internacionalização

- **pt-BR** hardcoded (sem i18n library)

### 1.9 Testes

- **Unitários:** Vitest + Happy DOM (`npm run test`)
- **E2E:** Playwright (`npm run e2e`)
- **Cobertura:** scripts customizados de coverage

### 1.10 WhatsApp Existente (V1)

Já existe infraestrutura WhatsApp no frontend:
- **API client:** `src/lib/api/whatsapp.ts` — CRUD de templates, logs, config, stats
- **React Query hooks:** `src/lib/query/use-whatsapp.ts`
- **Types:** `src/lib/shared/types/whatsapp.ts` — `WhatsAppConfig`, `WhatsAppTemplate`, `WhatsAppMessageLog`
- **Admin page:** `src/app/(backoffice)/admin/whatsapp/page.tsx` — gestão de templates e logs
- **Webhook route:** `src/app/api/whatsapp/webhook/route.ts` — proxy para backend

**⚠️ Importante:** O WhatsApp existente é para **templates e logs de mensagens outbound**. O novo WhatsApp CRM (conversas, inbox, mensagens bidirecionais, credenciais WABA) é um **sistema diferente** que coexistirá. Os tipos e APIs atuais **não** cobrem os novos contratos do OpenAPI.

---

## 2. Mapeamento de Páginas/Telas

### 2.1 Inbox de Conversas — `/atendimento/inbox`

**Propósito:** Página principal de atendimento — listar e gerenciar conversas WhatsApp em tempo real.

**Dados consumidos:**
- `GET /api/v1/conversas` — lista conversas (paginado, filtros)
- `GET /api/v1/conversas/stream` — SSE para updates em tempo real

**Estado remoto:**
- Lista de conversas (React Query)
- Filtros: unidade, status, fila, responsável, período, busca (URL search params)
- SSE connection state (conectado/desconectado/reconectando)

**Estado local:**
- Conversa selecionada
- Sidebar colapsada/expandida (mobile)
- Filtros abertos/fechados

**Componentes principais:**
- `ConversationList` — lista lateral de conversas
- `ConversationFilters` — filtros avançados
- `InboxLayout` — layout split (sidebar + conteúdo)
- `StatusBadge` — badge de status da conversa
- `QueueSelector` — seletor de fila
- `OwnerAssign` — atribuição de responsável
- `EmptyInboxState` — estado vazio quando não há conversas

**Permissões:** `ATENDIMENTO_INBOX` (role a definir)

---

### 2.2 Detalhe da Conversa — `/atendimento/inbox/{id}`

**Propósito:** Thread de mensagens + contexto completo do contato.

**Dados consumidos:**
- `GET /api/v1/conversas/{id}` — detalhe + contexto
- `GET /api/v1/conversas/{id}/thread` — mensagens da conversa (paginado)
- `POST /api/v1/conversas/{id}/mensagens` — enviar mensagem
- `PATCH /api/v1/conversas/{id}/status` — mudar status
- `PATCH /api/v1/conversas/{id}/owner` — atribuir responsável
- `PATCH /api/v1/conversas/{id}/queue` — mudar fila
- `PATCH /api/v1/conversas/{id}/unidade` — mudar unidade
- `POST /api/v1/conversas/{id}/tarefas` — criar tarefa

**Estado remoto:**
- Thread de mensagens (React Query com paginação cursor/offset)
- Contexto operacional (aluno/prospect/pendências)
- SSE updates (novas mensagens na conversa)

**Estado local:**
- Texto do input de mensagem
- Mídia selecionada para envio
- Templates rápidos disponíveis
- Tarefa sendo criada (dialog)
- Scroll position do thread

**Componentes principais:**
- `MessageThread` — thread de mensagens com scroll + paginação
- `MessageInput` — input de envio (texto, mídia, template)
- `MessageBubble` — bolha individual (inbound/outbound)
- `ContactCard` — card de info do contato
- `ConversationHeader` — header com ações (status, owner, fila)
- `AiSummaryPanel` — resumo IA da conversa (futuro V1c)
- `TaskCreateDialog` — criação de tarefa vinculada
- `MediaPreview` — preview de mídia (imagem, áudio, documento)

**Permissões:** `ATENDIMENTO_INBOX`

---

### 2.3 Admin WhatsApp (Credenciais) — `/admin/whatsapp/credenciais`

**Propósito:** Gestão de credenciais WABA (WhatsApp Business API).

**Dados consumidos:**
- `GET /api/v1/whatsapp/credentials` — lista por tenant
- `POST /api/v1/whatsapp/credentials` — criar
- `PUT /api/v1/whatsapp/credentials/{id}` — atualizar
- `DELETE /api/v1/whatsapp/credentials/{id}` — remover
- `GET /api/v1/whatsapp/credentials/{id}/health` — health check
- `POST /api/v1/whatsapp/credentials/{id}/refresh-token` — renovar token

**Estado remoto:** Lista de credenciais (React Query)

**Estado local:** Form de criação/edição, dialog de confirmação de delete

**Componentes principais:**
- `WhatsAppCredentialForm` — form de credencial
- `CredentialHealthBadge` — badge de saúde da credencial
- `CredentialList` — tabela de credenciais
- `TokenExpiryAlert` — alerta de token próximo de expirar

**Permissões:** `ADMIN_WHATSAPP` (backoffice role)

**Nota:** Reutilizar a página existente `/admin/whatsapp` adicionando uma nova tab "Credenciais" ou criar página dedicada.

---

### 2.4 Admin Playbooks (Extendido) — `/crm/playbooks` (existente)

**Propósito:** Configuração de automações/playbooks de WhatsApp.

**Status:** **Já existe** em `/crm/playbooks`. Precisa ser **estendido** para:
- Suportar triggers de WhatsApp (`CONVERSA_ABERTA`, `MENSAGEM_RECEBIDA`, `SEM_RESPOSTA`)
- Mostrar execuções vinculadas a conversas
- Adicionar passos de "enviar mensagem WhatsApp"

**Dados adicionais consumidos:**
- `GET /api/v1/crm/playbooks/{id}/execucoes` — lista execuções

---

### 2.5 Dashboard WhatsApp — `/atendimento/dashboard` (nova)

**Propósito:** Métricas e monitoramento do canal WhatsApp.

**Dados consumidos:**
- `GET /api/v1/conversas` (agregado por status)
- `GET /api/v1/whatsapp/credentials` (health)
- `GET /api/v1/whatsapp/stats` (existente)

**Componentes principais:**
- `WhatsAppMetricCard` — card de métrica
- `ConversationVolumeChart` — gráfico de volume
- `ResponseTimeChart` — gráfico de tempo de resposta
- `CredentialHealthSummary` — resumo de saúde das credenciais

**Permissões:** `ATENDIMENTO_DASHBOARD`

---

### 2.6 Avanço de Stage Prospect — `/prospects/{id}` (modificada)

**Propósito:** Permitir avançar stage do prospect a partir da conversa.

**Dados consumidos:**
- `PATCH /api/v1/academia/prospects-legado/{id}/stage` — avançar stage
  - Params: `tenantId`, `novoStatus`, `conversationId`

**Componentes:** Adicionar botão "Avançar Stage" no contexto da conversa.

---

## 3. Componentes Reutilizáveis

### 3.1 Novos Componentes a Criar

| Componente | Caminho Sugerido | Descrição |
|-----------|-----------------|-----------|
| `ConversationList` | `src/components/atendimento/conversation-list.tsx` | Lista lateral de conversas com avatar, preview, timestamp, badge de não lidas |
| `ConversationFilters` | `src/components/atendimento/conversation-filters.tsx` | Filtros: unidade, status, fila, owner, período, busca textual |
| `InboxLayout` | `src/components/atendimento/inbox-layout.tsx` | Layout split: sidebar (lista) + main (thread/detalhe) |
| `MessageThread` | `src/components/atendimento/message-thread.tsx` | Thread de mensagens com scroll infinito, paginação "load more", auto-scroll para nova msg |
| `MessageInput` | `src/components/atendimento/message-input.tsx` | Input de texto + envio de mídia + templates rápidos + envio com Enter |
| `MessageBubble` | `src/components/atendimento/message-bubble.tsx` | Bolha individual: inbound (esquerda) / outbound (direita), com timestamp e status |
| `MessageMediaPreview` | `src/components/atendimento/message-media-preview.tsx` | Preview de imagem, player de áudio, download de documento |
| `ContactCard` | `src/components/atendimento/contact-card.tsx` | Card com dados do contato: nome, telefone, vínculo aluno/prospect, pendências |
| `ConversationHeader` | `src/components/atendimento/conversation-header.tsx` | Header com nome do contato, status badge, ações rápidas (owner, fila, unidade) |
| `StatusBadge` | `src/components/atendimento/status-badge.tsx` | Badge colorido: ABERTA, EM_ATENDIMENTO, PENDENTE, ENCERRADA, SPAM, BLOQUEADA |
| `QueueSelector` | `src/components/atendimento/queue-selector.tsx` | Select/dropdown para mudar fila da conversa |
| `OwnerAssign` | `src/components/atendimento/owner-assign.tsx` | Atribuir responsável (busca de usuários) |
| `UnitSelector` | `src/components/atendimento/unit-selector.tsx` | Reatribuir conversa para outra unidade |
| `WhatsAppCredentialForm` | `src/components/admin/whatsapp-credential-form.tsx` | Formulário de criação/edição de credencial WABA |
| `CredentialHealthBadge` | `src/components/admin/credential-health-badge.tsx` | Badge de saúde: VERIFIED, EXPIRED, PENDING, REJECTED |
| `TokenExpiryAlert` | `src/components/admin/token-expiry-alert.tsx` | Banner de alerta para tokens próximos de expirar |
| `WhatsAppMetricCard` | `src/components/atendimento/metric-card.tsx` | Card de métrica (total conversas, tempo resposta, taxa de resolução) |
| `AiSummaryPanel` | `src/components/atendimento/ai-summary-panel.tsx` | Painel com resumo IA da conversa (V1c) |
| `TaskCreateDialog` | `src/components/atendimento/task-create-dialog.tsx` | Dialog para criar tarefa vinculada à conversa |
| `SSEConnectionProvider` | `src/lib/sse/sse-provider.tsx` | Provider React para gerenciar conexão SSE |
| `EmptyInboxState` | `src/components/atendimento/empty-inbox-state.tsx` | Estado vazio ilustrativo para inbox sem conversas |
| `RealTimeIndicator` | `src/components/atendimento/realtime-indicator.tsx` | Indicador de conexão real-time (SSE conectado/polling) |
| `TypingIndicator` | `src/components/atendimento/typing-indicator.tsx` | Indicador de digitação (futuro) |

### 3.2 Componentes Existentes Reutilizáveis

| Componente | Caminho | Uso |
|-----------|---------|-----|
| `PaginatedTable` | `src/components/shared/paginated-table.tsx` | Tabelas de credenciais |
| `TableFilters` | `src/components/shared/table-filters.tsx` | Filtros de conversas/credenciais |
| `StatusBadge` | `src/components/shared/status-badge.tsx` | Referência para status badges |
| `Button` | `src/components/ui/button.tsx` | Botões em geral |
| `Dialog` | `src/components/ui/dialog.tsx` | Diálogos (tarefa, credencial) |
| `Select` | `src/components/ui/select.tsx` | Selects (fila, owner, unidade) |
| `Badge` | `src/components/ui/badge.tsx` | Badges (status, tipo) |
| `Card` | `src/components/ui/card.tsx` | Cards (contact card, métricas) |
| `Tabs` | `src/components/ui/tabs.tsx` | Tabs (admin WhatsApp) |
| `Skeleton` | `src/components/ui/skeleton.tsx` | Loading skeletons |
| `Textarea` | `src/components/ui/textarea.tsx` | Input de mensagem |
| `Input` | `src/components/ui/input.tsx` | Inputs de texto |
| `useToast` | `src/components/ui/use-toast.ts` | Toasts de feedback |
| `Sidebar` | `src/components/layout/sidebar.tsx` | Navegação principal |

---

## 4. Mudanças em Código Existente

### 4.1 Novos Tipos TypeScript

**Arquivo:** `src/lib/shared/types/whatsapp-crm.ts` (novo)

```ts
// Status de conversa
export type ConversationStatus = 'ABERTA' | 'PENDENTE' | 'EM_ATENDIMENTO' | 'ENCERRADA' | 'SPAM' | 'BLOQUEADA';

// Direção da mensagem
export type MessageDirection = 'INBOUND' | 'OUTBOUND';

// Tipo de conteúdo
export type MessageContentType = 'TEXTO' | 'IMAGEM' | 'AUDIO' | 'DOCUMENTO' | 'VIDEO' | 'LOCALIZACAO' | 'CONTATO' | 'TEMPLATE';

// Status de entrega
export type MessageDeliveryStatus = 'PENDENTE' | 'ENTREGUE' | 'LIDO' | 'FALHOU' | 'NAO_ENTREGUE';

// Status de onboarding da credencial
export type WhatsAppOnboardingStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';
export type WhatsAppOnboardingStep = 'CREATED' | 'PHONE_REGISTERED' | 'VERIFIED' | 'TEMPLATES_APPROVED';
export type WhatsAppMode = 'UNIT_NUMBER' | 'NETWORK_SHARED_NUMBER';

// Modelos principais
export interface Conversation {
  id: string;
  tenantId: string;
  academiaId: string | null;
  unidadeId: string | null;
  contactId: string;
  prospectId: string | null;
  alunoId: string | null;
  status: ConversationStatus;
  queue: string | null;
  ownerUserId: string | null;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  aiSummary: string | null;
  aiIntent: string | null;
  aiIntentConfidence: number | null;
  openedAt: string;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  contatoNome: string;
  contatoTelefone: string;
}

export interface Message {
  id: string;
  conversationId: string;
  direction: MessageDirection;
  contentType: MessageContentType;
  content: string | null;
  mediaUrl: string | null;
  deliveryStatus: MessageDeliveryStatus;
  isAutomated: boolean;
  createdAt: string;
}

export interface ContactContext {
  id: string;
  tenantId: string;
  phoneNumber: string;
  phoneNumberNormalized: string;
  nome: string;
  origem: 'WHATSAPP_INBOUND' | 'CADASTRO_MANUAL' | 'IMPORTACAO' | 'FORMULARIO_WEB';
  consentimentoWhatsApp: boolean;
  consentimentoAt: boolean;
  consentimentoConteudo: boolean;
  alunoId: string | null;
  prospectId: string | null;
  obsFinais: string | null;
}

export interface WhatsAppCredential {
  id: string;
  tenantId: string;
  academiaId: string | null;
  unidadeId: string | null;
  businessAccountId: string;
  wabaId: string;
  phoneId: string;
  phoneNumber: string;
  mode: WhatsAppMode;
  accessTokenExpiresAt: string;
  onboardingStatus: WhatsAppOnboardingStatus;
  onboardingStep: WhatsAppOnboardingStep;
  lastHealthCheckAt: string | null;
  tokenExpiringSoon: boolean;
  tokenExpired: boolean;
}

export interface ConversationFilter {
  unidadeId?: string;
  status?: ConversationStatus;
  queue?: string;
  ownerUserId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface SSEEvent {
  type: 'nova_mensagem' | 'conversa_atualizada' | 'conversa_encerrada';
  data: unknown;
}
```

### 4.2 Novos API Clients

**Arquivo:** `src/lib/api/conversas.ts` (novo)

Funções a criar:
- `listConversasApi({ tenantId, filters, page, size })`
- `getConversaDetailApi({ tenantId, id })`
- `createConversaApi({ tenantId, data })`
- `updateConversaStatusApi({ tenantId, id, status })`
- `assignConversaOwnerApi({ tenantId, id, ownerUserId })`
- `moveConversaQueueApi({ tenantId, id, queue })`
- `reattribuirConversaUnidadeApi({ tenantId, id, unidadeId })`
- `getConversaThreadApi({ tenantId, id, page, size })`
- `sendMessageApi({ tenantId, conversationId, content, mediaFile, idempotencyKey })`
- `createConversaTaskApi({ tenantId, conversationId, data })`

**Arquivo:** `src/lib/api/whatsapp-credentials.ts` (novo)

Funções a criar:
- `listCredentialsApi({ tenantId })`
- `createCredentialApi({ tenantId, data })`
- `updateCredentialApi({ tenantId, id, data })`
- `deleteCredentialApi({ tenantId, id })`
- `checkCredentialHealthApi({ tenantId, id })`
- `refreshCredentialTokenApi({ tenantId, id })`

### 4.3 Novos React Query Hooks

**Arquivo:** `src/lib/query/use-conversas.ts` (novo)

Hooks:
- `useConversas({ tenantId, filters, page, size })`
- `useConversaDetail({ tenantId, id })`
- `useConversaThread({ tenantId, id, page, size })`
- `useSendMessage()` — mutation com idempotência
- `useUpdateConversaStatus()` — mutation
- `useAssignConversaOwner()` — mutation
- `useMoveConversaQueue()` — mutation
- `useReattribuirConversaUnidade()` — mutation
- `useCreateConversaTask()` — mutation

**Arquivo:** `src/lib/query/use-whatsapp-credentials.ts` (novo)

Hooks:
- `useWhatsAppCredentials({ tenantId })`
- `useCreateWhatsAppCredential()` — mutation
- `useUpdateWhatsAppCredential()` — mutation
- `useDeleteWhatsAppCredential()` — mutation
- `useCredentialHealth({ tenantId, id, enabled })` — query com polling
- `useRefreshCredentialToken()` — mutation

**Arquivo:** `src/lib/query/keys.ts` — adicionar:

```ts
conversas: {
  all: (tenantId: string) => ["conversas", tenantId] as const,
  list: (tenantId: string, filters: Record<string, unknown>, page: number) =>
    ["conversas", "list", tenantId, filters, page] as const,
  detail: (tenantId: string, id: string) =>
    ["conversas", "detail", tenantId, id] as const,
  thread: (tenantId: string, id: string, page: number) =>
    ["conversas", "thread", tenantId, id, page] as const,
},
credentials: {
  all: (tenantId: string) => ["whatsapp", "credentials", tenantId] as const,
  health: (tenantId: string, id: string) =>
    ["whatsapp", "credentials", "health", tenantId, id] as const,
},
```

### 4.4 Mudanças na Sidebar/Navegação

**Arquivo:** `src/lib/tenant/nav-items-v2.ts`

Adicionar novo item ao grupo **Operação** (ou criar grupo dedicado "Atendimento"):

```ts
// Opção 1: Adicionar ao operationGroup
{ href: "/atendimento/inbox", label: "Atendimento", icon: MessageSquare, description: "Inbox WhatsApp" },

// Opção 2: Criar grupo dedicado
export const atendimentoGroup: NavGroupV2 = {
  label: "Atendimento",
  icon: MessageSquare,
  items: [
    { href: "/atendimento/inbox", label: "Inbox", icon: MessageSquare },
    { href: "/atendimento/dashboard", label: "Dashboard", icon: LayoutDashboard },
  ]
};
```

**Recomendação:** Opção 1 — adicionar ao `operationGroup` para não fragmentar demais a nav.

### 4.5 Modificações em Páginas Existentes

| Página | Modificação |
|--------|------------|
| `/admin/whatsapp/page.tsx` | Adicionar tab "Credenciais" com `CredentialList` |
| `/crm/playbooks/page.tsx` | Estender para mostrar triggers de WhatsApp |
| `/prospects/[id]/page.tsx` | Adicionar botão "Avançar Stage" vinculado a conversa |
| `src/lib/api/whatsapp.ts` | Manter como está (templates/logs outbound) — novo arquivo separado para conversas |

---

## 5. Integrações Especiais

### 5.1 SSE (Server-Sent Events)

**Implementação sugerida:**

```ts
// src/lib/sse/sse-provider.tsx
"use client";

import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";

type SSEEventHandler = (event: string, data: unknown) => void;

interface SSEContextType {
  isConnected: boolean;
  subscribe: (handler: SSEEventHandler) => () => void;
}

const SSEContext = createContext<SSEContextType | null>(null);

export function SSEConnectionProvider({ children, tenantId }: { children: React.ReactNode; tenantId: string }) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const handlersRef = useRef<Set<SSEEventHandler>>(new Set());
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!tenantId) return;

    const es = new EventSource(`/api/v1/conversas/stream?tenantId=${tenantId}`, {
      withCredentials: true,
    });

    es.onopen = () => setIsConnected(true);
    es.onerror = () => {
      setIsConnected(false);
      es.close();
      // Reconnect after 3s
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    };

    es.addEventListener("nova_mensagem", (e) => {
      const data = JSON.parse(e.data);
      handlersRef.current.forEach(h => h("nova_mensagem", data));
    });

    es.addEventListener("conversa_atualizada", (e) => {
      const data = JSON.parse(e.data);
      handlersRef.current.forEach(h => h("conversa_atualizada", data));
    });

    es.addEventListener("conversa_encerrada", (e) => {
      const data = JSON.parse(e.data);
      handlersRef.current.forEach(h => h("conversa_encerrada", data));
    });

    eventSourceRef.current = es;
  }, [tenantId]);

  useEffect(() => {
    connect();
    return () => {
      eventSourceRef.current?.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [connect]);

  const subscribe = useCallback((handler: SSEEventHandler) => {
    handlersRef.current.add(handler);
    return () => { handlersRef.current.delete(handler); };
  }, []);

  return (
    <SSEContext.Provider value={{ isConnected, subscribe }}>
      {children}
    </SSEContext.Provider>
  );
}

export function useSSE() {
  const ctx = useContext(SSEContext);
  if (!ctx) throw new Error("useSSE must be used within SSEConnectionProvider");
  return ctx;
}
```

**Fallback Polling:** Se SSE não suportado (detectar via `typeof EventSource === "undefined"`), usar polling de 15s via React Query `refetchInterval: 15_000`.

**Integração com React Query:** Nos handlers SSE, invalidar queries relevantes:
```ts
subscribe((event, data) => {
  if (event === "nova_mensagem") {
    queryClient.invalidateQueries({ queryKey: queryKeys.conversas.detail(tenantId, data.conversationId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.conversas.thread(tenantId, data.conversationId, 0) });
    queryClient.invalidateQueries({ queryKey: queryKeys.conversas.list(tenantId, {}, 0) });
  }
});
```

### 5.2 Idempotência no Envio de Mensagens

```ts
// src/lib/utils/idempotency.ts
export function generateIdempotencyKey(): string {
  return crypto.randomUUID();
}

// No apiRequest:
const idempotencyKey = generateIdempotencyKey();
await apiRequest({
  path: `/api/v1/conversas/${conversationId}/mensagens`,
  method: "POST",
  body: { content, contentType },
  headers: { "X-Idempotency-Key": idempotencyKey },
});
```

**Importante:** O `apiRequest` existente aceita `headers` customizados. Usar esse campo para injetar `X-Idempotency-Key`.

**Dedupe no frontend:** Manter um `Set<string>` de keys em uso durante o envio. Se o usuário clicar duas vezes rápido, a segunda chamada usa a mesma key.

### 5.3 Multi-Tenant

O `tenantId` é resolvido automaticamente pelo `apiRequest` via `X-Context-Id` para rotas scropadas. Para rotas que exigem `tenantId` explícito como query param:

```ts
const { tenantId } = useTenantContext();
await listConversasApi({ tenantId: tenantId!, filters, page });
```

### 5.4 X-Context-Id Header

O wrapper `apiRequest` em `http.ts` **já injeta automaticamente** `X-Context-Id` baseado no tenant ativo da sessão para rotas scropadas (incluindo `/api/v1/crm/*`, `/api/v1/comercial/*`). Para as novas rotas de atendimento (`/api/v1/conversas/*`), será necessário adicionar o pattern ao `CONTEXT_SCOPED_OPERATIONAL_PATTERNS` em `http.ts`:

```ts
const CONTEXT_SCOPED_OPERATIONAL_PATTERNS = [
  // ... existentes
  /^\/api\/v1\/conversas(?:\/|$)/,
  /^\/api\/v1\/whatsapp\/credentials(?:\/|$)/,
];
```

### 5.5 Paginação

O projeto usa paginação via query params (`page`, `size`) com componente `PaginatedTable`. O backend de conversas retorna paginação offset-based. Para o thread de mensagens, pode ser necessário paginação por cursor ("load more" no topo). Implementar:

- **Conversas list:** offset-based com `PaginatedTable` existente
- **Thread de mensagens:** cursor-based com botão "Carregar mensagens anteriores" no topo

### 5.6 Filtros

Usar o componente existente `TableFilters` de `src/components/shared/table-filters.tsx`. Configurar filtros:

```ts
const CONVERSATION_FILTER_CONFIGS: FilterConfig[] = [
  { type: "text", key: "busca", label: "Buscar", placeholder: "Nome ou telefone..." },
  { type: "select", key: "status", label: "Status", options: [
    { value: "ABERTA", label: "Aberta" },
    { value: "EM_ATENDIMENTO", label: "Em atendimento" },
    { value: "PENDENTE", label: "Pendente" },
    { value: "ENCERRADA", label: "Encerrada" },
  ]},
  { type: "select", key: "queue", label: "Fila", options: [...] },
  { type: "select", key: "ownerUserId", label: "Responsável", options: [...] },
  { type: "date-range", key: "periodo", label: "Período" },
];
```

---

## 6. Estados e Loading

### 6.1 Inbox de Conversas

| Estado | Implementação |
|--------|--------------|
| Loading inicial | Skeleton via `Skeleton` shadcn na lista lateral |
| Erro | Toast com `useToast` + retry button |
| Vazio | `EmptyInboxState` com ilustração + CTA |
| SSE desconectado | `RealTimeIndicator` com tentativa de reconexão |
| Filtro sem resultado | Inline message "Nenhuma conversa encontrada" |
| Refetch | SSE invalida queries automaticamente; fallback polling 15s |

### 6.2 Detalhe da Conversa

| Estado | Implementação |
|--------|--------------|
| Loading thread | Skeleton de bolhas |
| Erro ao carregar | Toast + retry |
| Envio em progresso | Botão "Enviar" desabilitado + spinner |
| Envio com erro | Toast + mensagem inline "Falha ao enviar — tente novamente" |
| Thread vazio | "Nenhuma mensagem nesta conversa ainda" |
| Mensagens novas via SSE | Auto-scroll para baixo + badge "↓ Nova mensagem" se scrolled up |
| Carregando mais msgs (paginação) | Spinner no topo do thread |

### 6.3 Admin Credenciais

| Estado | Implementação |
|--------|--------------|
| Loading | Skeleton na tabela |
| Erro | Toast |
| Vazio | "Nenhuma credencial configurada" + CTA |
| Health check em progresso | Loading spinner no badge |
| Token expirando | Banner amarelo no topo da página |

---

## 7. Acessibilidade e UX

### 7.1 Navegação por Teclado no Inbox

- **Tab order:** Lista de conversas (sidebar) → ações (status, owner, fila) → thread → input de mensagem → botão enviar
- **Atalhos de teclado:**
  - `Enter` no input: enviar mensagem
  - `Shift+Enter`: nova linha no input
  - `ArrowUp/Down`: navegar entre conversas na lista
  - `Escape`: fechar dialogs
  - `/`: focar busca de conversas
- `aria-label` em todos os botões de ação
- `role="log"` no thread de mensagens com `aria-live="polite"`
- `role="status"` para indicadores de envio

### 7.2 Indicadores Visuais

- **Mensagens não lidas:** Badge numérico na lista lateral + fundo destacado na conversa
- **Mensagem sendo enviada:** Bubble com spinner e opacidade reduzida
- **SSE conectado:** Ponto verde pulsante no header do inbox
- **SSE desconectado:** Ponto amarelo + tooltip "Reconectando..."

### 7.3 Notificações

- **Novas mensagens (SSE):** Toast com preview da mensagem + som opcional (Web Audio API beep curto)
- **Conversa encerrada:** Toast informativo
- **Token expirando:** Banner persistente até renovação

### 7.4 Timestamps Relativos

Usar `date-fns` (já disponível):
```ts
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

formatDistanceToNow(new Date(message.createdAt), { addSuffix: true, locale: ptBR });
// "há 2 minutos"
```

### 7.5 Formatação de Mídia

- **Imagem:** Thumbnail clicável que abre modal de preview
- **Áudio:** Player HTML `<audio>` com controles básicos
- **Documento:** Ícone + link de download
- **Localização:** Link para Google Maps
- **Contato:** Card com nome + telefone

---

## 8. Lista de Tasks

### Task 001: Adicionar tipos TypeScript para WhatsApp CRM

**Descrição:** Criar `src/lib/shared/types/whatsapp-crm.ts` com todos os tipos do novo domínio: `Conversation`, `Message`, `ContactContext`, `WhatsAppCredential`, enums de status/direção/tipo, e tipos de filtro/SSE.

**Dependências:** Nenhuma  
**Prioridade:** HIGH  
**Complexidade:** 2  
**Arquivos:** `src/lib/shared/types/whatsapp-crm.ts`, `src/lib/shared/types/index.ts` (export)

---

### Task 002: Criar API client para conversas

**Descrição:** Criar `src/lib/api/conversas.ts` com todas as funções de chamada à API de conversas e mensagens (`listConversasApi`, `getConversaDetailApi`, `getConversaThreadApi`, `sendMessageApi`, `updateConversaStatusApi`, etc). Incluir suporte a `X-Idempotency-Key` no `sendMessageApi`.

**Dependências:** Task 001  
**Prioridade:** HIGH  
**Complexidade:** 3  
**Arquivos:** `src/lib/api/conversas.ts`

---

### Task 003: Criar API client para credenciais WhatsApp

**Descrição:** Criar `src/lib/api/whatsapp-credentials.ts` com funções CRUD + health check + refresh token.

**Dependências:** Task 001  
**Prioridade:** HIGH  
**Complexidade:** 2  
**Arquivos:** `src/lib/api/whatsapp-credentials.ts`

---

### Task 004: Adicionar rotas ao contexto scropado do HTTP client

**Descrição:** Adicionar `/api/v1/conversas/*` e `/api/v1/whatsapp/credentials/*` ao array `CONTEXT_SCOPED_OPERATIONAL_PATTERNS` em `src/lib/api/http.ts` para que `X-Context-Id` seja injetado automaticamente.

**Dependências:** Task 002, Task 003  
**Prioridade:** HIGH  
**Complexidade:** 1  
**Arquivos:** `src/lib/api/http.ts`

---

### Task 005: Adicionar query keys para conversas e credenciais

**Descrição:** Adicionar entries `conversas` e `credentials` em `src/lib/query/keys.ts`.

**Dependências:** Task 001  
**Prioridade:** HIGH  
**Complexidade:** 1  
**Arquivos:** `src/lib/query/keys.ts`

---

### Task 006: Criar React Query hooks para conversas

**Descrição:** Criar `src/lib/query/use-conversas.ts` com hooks: `useConversas`, `useConversaDetail`, `useConversaThread`, `useSendMessage`, `useUpdateConversaStatus`, `useAssignConversaOwner`, `useMoveConversaQueue`, `useReattribuirConversaUnidade`, `useCreateConversaTask`.

**Dependências:** Task 002, Task 005  
**Prioridade:** HIGH  
**Complexidade:** 4  
**Arquivos:** `src/lib/query/use-conversas.ts`

---

### Task 007: Criar React Query hooks para credenciais

**Descrição:** Criar `src/lib/query/use-whatsapp-credentials.ts` com hooks: `useWhatsAppCredentials`, `useCreateWhatsAppCredential`, `useUpdateWhatsAppCredential`, `useDeleteWhatsAppCredential`, `useCredentialHealth`, `useRefreshCredentialToken`.

**Dependências:** Task 003, Task 005  
**Prioridade:** HIGH  
**Complexidade:** 3  
**Arquivos:** `src/lib/query/use-whatsapp-credentials.ts`

---

### Task 008: Criar provider SSE

**Descrição:** Criar `src/lib/sse/sse-provider.tsx` com `SSEConnectionProvider` e hook `useSSE`. Implementar reconexão automática com backoff exponencial. Adicionar fallback polling de 15s quando SSE não disponível.

**Dependências:** Nenhuma  
**Prioridade:** HIGH  
**Complexidade:** 4  
**Arquivos:** `src/lib/sse/sse-provider.tsx`, `src/lib/sse/index.ts`

---

### Task 009: Integrar SSE com React Query invalidation

**Descrição:** Criar hook `useSSEConversasSync` que ouve eventos SSE e invalida as queries de conversas/thread correspondentes.

**Dependências:** Task 006, Task 008  
**Prioridade:** HIGH  
**Complexidade:** 3  
**Arquivos:** `src/lib/hooks/use-sse-conversas-sync.ts`

---

### Task 010: Criar componentes de UI base do atendimento

**Descrição:** Criar os componentes fundamentais: `StatusBadge`, `MessageBubble`, `MessageMediaPreview`, `EmptyInboxState`, `RealTimeIndicator`, `TypingIndicator`.

**Dependências:** Task 001  
**Prioridade:** HIGH  
**Complexidade:** 3  
**Arquivos:**
- `src/components/atendimento/status-badge.tsx`
- `src/components/atendimento/message-bubble.tsx`
- `src/components/atendimento/message-media-preview.tsx`
- `src/components/atendimento/empty-inbox-state.tsx`
- `src/components/atendimento/realtime-indicator.tsx`
- `src/components/atendimento/typing-indicator.tsx`

---

### Task 011: Criar componente ConversationList

**Descrição:** Criar lista lateral de conversas com avatar, preview da última mensagem, timestamp relativo, badge de status, indicador de não lidas. Suporte a seleção e destaque da conversa ativa.

**Dependências:** Task 001, Task 010  
**Prioridade:** HIGH  
**Complexidade:** 3  
**Arquivos:** `src/components/atendimento/conversation-list.tsx`

---

### Task 012: Criar componente ConversationFilters

**Descrição:** Criar filtros de conversas usando `TableFilters` existente. Suporte a busca textual, status, fila, owner, período.

**Dependências:** Task 001  
**Prioridade:** MEDIUM  
**Complexidade:** 2  
**Arquivos:** `src/components/atendimento/conversation-filters.tsx`

---

### Task 013: Criar componente InboxLayout

**Descrição:** Layout split-screen: sidebar com lista de conversas (colapsável em mobile) + área principal (thread ou estado vazio). Usar `framer-motion` para transições.

**Dependências:** Task 011  
**Prioridade:** HIGH  
**Complexidade:** 3  
**Arquivos:** `src/components/atendimento/inbox-layout.tsx`

---

### Task 014: Criar componente MessageThread

**Descrição:** Thread de mensagens com scroll, paginação "load more" no topo, auto-scroll para novas mensagens via SSE, agrupamento por data.

**Dependências:** Task 001, Task 010  
**Prioridade:** HIGH  
**Complexidade:** 4  
**Arquivos:** `src/components/atendimento/message-thread.tsx`

---

### Task 015: Criar componente MessageInput

**Descrição:** Input de envio de mensagens com: textarea auto-resize, botão enviar, suporte a anexos (mídia), templates rápidos, idempotência no envio, debounce de duplo-clique.

**Dependências:** Task 002, Task 010  
**Prioridade:** HIGH  
**Complexidade:** 4  
**Arquivos:** `src/components/atendimento/message-input.tsx`

---

### Task 016: Criar componente ContactCard

**Descrição:** Card com informações do contato: nome, telefone, origem, vínculo aluno/prospect, consentimentos, pendências financeiras, últimas conversas.

**Dependências:** Task 001  
**Prioridade:** MEDIUM  
**Complexidade:** 3  
**Arquivos:** `src/components/atendimento/contact-card.tsx`

---

### Task 017: Criar componente ConversationHeader

**Descrição:** Header da conversa com nome do contato, status badge clicável, ações rápidas (atribuir owner, mudar fila, mudar unidade, encerrar).

**Dependências:** Task 001, Task 010  
**Prioridade:** HIGH  
**Complexidade:** 3  
**Arquivos:** `src/components/atendimento/conversation-header.tsx`

---

### Task 018: Criar componentes de ação da conversa

**Descrição:** Criar `QueueSelector`, `OwnerAssign`, `UnitSelector`, `TaskCreateDialog`.

**Dependências:** Task 001  
**Prioridade:** MEDIUM  
**Complexidade:** 3  
**Arquivos:**
- `src/components/atendimento/queue-selector.tsx`
- `src/components/atendimento/owner-assign.tsx`
- `src/components/atendimento/unit-selector.tsx`
- `src/components/atendimento/task-create-dialog.tsx`

---

### Task 019: Criar página Inbox — `/atendimento/inbox`

**Descrição:** Criar página principal do inbox integrando todos os componentes: `InboxLayout`, `ConversationList`, `ConversationFilters`. Conectar com React Query e SSE. Gerenciar estado de seleção de conversa. Roteamento para `/atendimento/inbox/{id}`.

**Dependências:** Tasks 006, 008, 009, 011, 012, 013  
**Prioridade:** HIGH  
**Complexidade:** 5  
**Arquivos:**
- `src/app/(portal)/atendimento/inbox/page.tsx`
- `src/app/(portal)/atendimento/inbox/inbox-content.tsx`

---

### Task 020: Criar página Detalhe da Conversa — `/atendimento/inbox/[id]`

**Descrição:** Criar página de detalhe com `ConversationHeader`, `MessageThread`, `MessageInput`, `ContactCard`. Integrar SSE para updates em tempo real.

**Dependências:** Tasks 006, 008, 009, 014, 015, 016, 017, 018, 019  
**Prioridade:** HIGH  
**Complexidade:** 5  
**Arquivos:**
- `src/app/(portal)/atendimento/inbox/[id]/page.tsx`
- `src/app/(portal)/atendimento/inbox/[id]/conversation-detail.tsx`

---

### Task 021: Adicionar navegação "Atendimento" na sidebar

**Descrição:** Adicionar item "Atendimento" ao `operationGroup` em `src/lib/tenant/nav-items-v2.ts` apontando para `/atendimento/inbox`.

**Dependências:** Task 019  
**Prioridade:** HIGH  
**Complexidade:** 1  
**Arquivos:** `src/lib/tenant/nav-items-v2.ts`

---

### Task 022: Criar componentes de admin de credenciais

**Descrição:** Criar `WhatsAppCredentialForm`, `CredentialHealthBadge`, `TokenExpiryAlert`, `CredentialList`.

**Dependências:** Tasks 001, 007  
**Prioridade:** MEDIUM  
**Complexidade:** 3  
**Arquivos:**
- `src/components/admin/whatsapp-credential-form.tsx`
- `src/components/admin/credential-health-badge.tsx`
- `src/components/admin/token-expiry-alert.tsx`
- `src/components/admin/credential-list.tsx`

---

### Task 023: Adicionar tab "Credenciais" na página Admin WhatsApp

**Descrição:** Estender `src/app/(backoffice)/admin/whatsapp/page.tsx` com nova tab "Credenciais" usando `CredentialList` e `WhatsAppCredentialForm`.

**Dependências:** Task 022  
**Prioridade:** MEDIUM  
**Complexidade:** 3  
**Arquivos:** `src/app/(backoffice)/admin/whatsapp/page.tsx`

---

### Task 024: Estender playbooks com triggers WhatsApp

**Descrição:** Estender página `/crm/playbooks` para mostrar e configurar triggers de WhatsApp (`CONVERSA_ABERTA`, `MENSAGEM_RECEBIDA`, `SEM_RESPOSTA`). Adicionar link para execuções vinculadas a conversas.

**Dependências:** Task 001 (para novos tipos de trigger)  
**Prioridade:** MEDIUM  
**Complexidade:** 4  
**Arquivos:** `src/app/(portal)/crm/playbooks/playbooks-content.tsx`

---

### Task 025: Integrar avanço de stage prospect com conversa

**Descrição:** Criar hook `useAvancarStageProspect` consumindo `PATCH /api/v1/academia/prospects-legado/{id}/stage`. Adicionar botão "Avançar Stage" no `ContactCard` quando o contato é um prospect.

**Dependências:** Task 001  
**Prioridade:** LOW  
**Complexidade:** 2  
**Arquivos:** `src/lib/query/use-prospects.ts` (estender), `src/components/atendimento/contact-card.tsx`

---

### Task 026: Criar página Dashboard WhatsApp — `/atendimento/dashboard`

**Descrição:** Dashboard com métricas de WhatsApp: total de conversas por status, volume de mensagens, tempo médio de resposta, saúde das credenciais. Usar cards + gráficos simples.

**Dependências:** Tasks 006, 007  
**Prioridade:** LOW  
**Complexidade:** 3  
**Arquivos:**
- `src/app/(portal)/atendimento/dashboard/page.tsx`
- `src/components/atendimento/metric-card.tsx`

---

### Task 027: Adicionar utilitário de idempotência

**Descrição:** Criar `src/lib/utils/idempotency.ts` com `generateIdempotencyKey()` e `IdempotencyKeyStore` para deduplicação no frontend.

**Dependências:** Nenhuma  
**Prioridade:** HIGH  
**Complexidade:** 1  
**Arquivos:** `src/lib/utils/idempotency.ts`

---

### Task 028: Criar schemas Zod para formulários de atendimento

**Descrição:** Criar `src/lib/forms/atendimento-schemas.ts` com schemas Zod para: enviar mensagem, criar tarefa, criar/editar credencial, filtrar conversas.

**Dependências:** Task 001  
**Prioridade:** HIGH  
**Complexidade:** 2  
**Arquivos:** `src/lib/forms/atendimento-schemas.ts`

---

### Task 029: Adicionar utilitário de formatação de timestamps relativos

**Descrição:** Criar `src/lib/utils/time-format.ts` com `formatRelativeTime(date)` que retorna strings como "há 2 minutos" usando `date-fns` com locale pt-BR.

**Dependências:** Nenhuma  
**Prioridade:** MEDIUM  
**Complexidade:** 1  
**Arquivos:** `src/lib/utils/time-format.ts`

---

### Task 030: Configurar testes unitários dos componentes de atendimento

**Descrição:** Criar testes Vitest para componentes críticos: `MessageBubble`, `StatusBadge`, `MessageInput` (validação de envio), `ConversationList` (seleção).

**Dependências:** Tasks 010, 011, 014, 015  
**Prioridade:** MEDIUM  
**Complexidade:** 3  
**Arquivos:** `src/components/atendimento/*.test.tsx`

---

### Task 031: Criar E2E test — Fluxo completo de inbox

**Descrição:** Teste Playwright cobrindo: abrir inbox → selecionar conversa → ver thread → enviar mensagem → verificar envio → receber mensagem via SSE.

**Dependências:** Task 020  
**Prioridade:** MEDIUM  
**Complexidade:** 4  
**Arquivos:** `tests/e2e/atendimento-inbox.spec.ts`

---

### Task 032: Criar utilitário de notificação sonora

**Descrição:** Criar `src/lib/utils/notification-sound.ts` com `playNewMessageSound()` usando Web Audio API (beep curto, sem arquivos externos).

**Dependências:** Nenhuma  
**Prioridade:** LOW  
**Complexidade:** 1  
**Arquivos:** `src/lib/utils/notification-sound.ts`

---

## 9. Arquitetura de Componentes

### 9.1 Diagrama Textual

```
TenantContextProvider
└── SSEConnectionProvider (tenantId)
    └── InboxLayout
        ├── ConversationList (useConversas)
        │   └── [ConversationItem] × N
        │       ├── StatusBadge
        │       └── timestamp relativo
        │
        ├── InboxMain
        │   ├── EmptyInboxState (se nenhuma conversa)
        │   │
        │   └── ConversationDetail (se conversa selecionada)
        │       ├── ConversationHeader
        │       │   ├── StatusBadge
        │       │   ├── QueueSelector
        │       │   ├── OwnerAssign
        │       │   └── UnitSelector
        │       │
        │       ├── ContactCard (side panel)
        │       │   ├── Dados do contato
        │       │   ├── Vínculo aluno/prospect
        │       │   └── Botão "Avançar Stage" (se prospect)
        │       │
        │       ├── MessageThread (useConversaThread)
        │       │   └── [MessageBubble] × N
        │       │       ├── MessageMediaPreview
        │       │       └── timestamp relativo
        │       │
        │       └── MessageInput (useSendMessage)
        │           ├── Templates rápidos
        │           └── Anexar mídia
        │
        └── RealTimeIndicator
```

### 9.2 Fluxo de Dados

```
SSE Event "nova_mensagem"
  └→ useSSEConversasSync handler
      └→ queryClient.invalidateQueries(conversas.detail)
      └→ queryClient.invalidateQueries(conversas.thread)
      └→ queryClient.invalidateQueries(conversas.list)
          └→ Re-render automático via React Query
              └→ MessageThread append nova mensagem
              └→ ConversationList atualiza preview
              └→ Notification sound + toast

Envio de mensagem
  └→ MessageInput onSubmit
      └→ generateIdempotencyKey()
      └→ useSendMessage.mutate({ content, headers: { X-Idempotency-Key } })
          └→ Optimistic update: append bubble "pending"
          └→ API POST /api/v1/conversas/{id}/mensagens
              └→ Sucesso: invalidate thread → bubble confirmada
              └→ Erro: toast + marcar bubble como falha
```

### 9.3 Relação de Arquivos por Camada

```
src/
├── lib/
│   ├── shared/types/
│   │   └── whatsapp-crm.ts          # Tipos TypeScript
│   ├── api/
│   │   ├── conversas.ts             # API client conversas
│   │   ├── whatsapp-credentials.ts  # API client credenciais
│   │   └── http.ts                  # (modificação: patterns)
│   ├── query/
│   │   ├── keys.ts                  # (modificação: novas keys)
│   │   ├── use-conversas.ts         # Hooks React Query conversas
│   │   └── use-whatsapp-credentials.ts  # Hooks React Query credenciais
│   ├── sse/
│   │   ├── sse-provider.tsx         # Provider SSE
│   │   └── index.ts
│   ├── hooks/
│   │   └── use-sse-conversas-sync.ts # Sync SSE → React Query
│   ├── forms/
│   │   └── atendimento-schemas.ts   # Schemas Zod
│   └── utils/
│       ├── idempotency.ts           # Geração de idempotency keys
│       ├── time-format.ts           # Timestamps relativos
│       └── notification-sound.ts    # Som de notificação
│
├── components/
│   ├── atendimento/
│   │   ├── status-badge.tsx
│   │   ├── message-bubble.tsx
│   │   ├── message-media-preview.tsx
│   │   ├── empty-inbox-state.tsx
│   │   ├── realtime-indicator.tsx
│   │   ├── typing-indicator.tsx
│   │   ├── conversation-list.tsx
│   │   ├── conversation-filters.tsx
│   │   ├── inbox-layout.tsx
│   │   ├── message-thread.tsx
│   │   ├── message-input.tsx
│   │   ├── contact-card.tsx
│   │   ├── conversation-header.tsx
│   │   ├── queue-selector.tsx
│   │   ├── owner-assign.tsx
│   │   ├── unit-selector.tsx
│   │   ├── task-create-dialog.tsx
│   │   └── metric-card.tsx
│   └── admin/
│       ├── whatsapp-credential-form.tsx
│       ├── credential-health-badge.tsx
│       ├── token-expiry-alert.tsx
│       └── credential-list.tsx
│
├── app/(portal)/
│   └── atendimento/
│       ├── inbox/
│       │   ├── page.tsx
│       │   ├── inbox-content.tsx
│       │   └── [id]/
│       │       ├── page.tsx
│       │       └── conversation-detail.tsx
│       └── dashboard/
│           └── page.tsx
│
└── lib/tenant/
    └── nav-items-v2.ts              # (modificação: add "Atendimento")
```

---

## 10. Riscos e Atenções

### 10.1 Riscos Técnicos

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| **SSE não suportado em alguns browsers** | Fallback necessário | Implementar polling de 15s como fallback; detectar com `typeof EventSource` |
| **Race condition SSE + React Query** | Dados duplicados ou out of sync | Invalidar queries no handler SSE antes de aplicar dados otimistas |
| **Idempotency key perdida em refresh de página** | Mensagem duplicada se usuário recarrega durante envio | Armazenar keys em `sessionStorage` por 30s |
| **Thread de mensagens muito longo** | Performance de renderização | Virtualização (windowing) para threads > 200 msgs; paginação "load more" |
| **Múltiplas abas do inbox abertas** | SSE connections duplicadas | Usar `BroadcastChannel` para eleger uma aba como "ativa" ou compartilhar conexão |
| **Token JWT expirando durante uso do inbox** | Perda de conexão SSE + falhas de API | Token refresh já implementado no `apiRequest`; SSE reconecta automaticamente |
| **CORS com SSE** | Conexão bloqueada | Verificar que o backend envia headers CORS adequados para `text/event-stream` |
| **Media upload sem endpoint definido** | Envio de imagens/áudios não funciona | Confirmar com backend se `POST /mensagens` suporta multipart/form-data ou se media é enviada via URL |

### 10.2 Decisões de Design Pendentes

1. **Grupo de navegação:** Colocar "Atendimento" em `operationGroup` ou criar grupo dedicado?
   - *Recomendação:* `operationGroup` para consistência com o resto do portal.

2. **Rota do inbox:** `/atendimento/inbox` ou `/atendimento`?
   - *Recomendação:* `/atendimento/inbox` para permitir `/atendimento/dashboard` e futuras rotas sob `/atendimento`.

3. **Optimistic updates no envio de mensagens:** Aplicar bubble imediatamente ou esperar confirmação do servidor?
   - *Recomendação:* Optimistic com estado "pending" (spinner na bolha). Se falhar, mostrar erro inline com botão "Reenviar".

4. **Paginação do thread:** Offset-based (como o resto do app) ou cursor-based?
   - *Recomendação:* Seguir o que o backend expõe no OpenAPI. Se for offset-based, usar botão "Carregar mais" no topo.

5. **Som de notificação:** Usar arquivo de áudio ou gerar beep programaticamente?
   - *Recomendação:* Web Audio API beep para não adicionar assets ao bundle.

6. **Layout do inbox em mobile:** Sidebar overlay ou drawer?
   - *Recomendação:* Drawer (sheet) que ocupa tela inteira ao selecionar conversa; botão voltar para retornar à lista.

### 10.3 Dependências do Backend — ✅ TODAS RESOLVIDAS

**Documento completo:** `docs/frontend/CONFIRMACOES_BACKEND_RESOLVIDAS.md`

| # | Pergunta | Resolução |
|---|----------|-----------|
| 1 | OpenAPI atualizada | ✅ Criado `docs/api/openapi-atendimento-whatsapp.yaml` |
| 2 | Formato de paginação | ✅ Offset-based com Spring `Page<>` |
| 3 | SSE endpoint | ✅ Eventos nomeados: nova_mensagem, conversa_atualizada, etc. |
| 4 | Upload de mídia | ✅ URL-based via S3 (usar StorageController existente) |
| 5 | Autenticação SSE | ✅ Cookies automáticos + tenantId como query param |
| 6 | Lista de filas/usuários | ✅ Filas = strings livres; Usuários = endpoint existente |
| 7 | Permissões/RBAC | ✅ Sem restrição de role por enquanto |

### 10.4 Ajustes no Plano

Com base nas resoluções:

1. **Task 015 (MessageInput):** Adicionar step de upload S3 antes de enviar mídia
2. **Task 008 (SSE Provider):** Usar apenas `tenantId` na query string (cookies automáticos)
3. **Task 018 (OwnerAssign):** Usar endpoint existente de usuários ou input livre

### 10.5 Ordem Recomendada de Implementação

```
Sprint 1: Fundação (Tasks 001-009)
  → Tipos, API clients, hooks, SSE provider, query keys

Sprint 2: Componentes Base (Tasks 010-018)
  → UI components do atendimento

Sprint 3: Páginas (Tasks 019-021, 027-029)
  → Inbox + Detalhe + Nav + Utils

Sprint 4: Admin + Extras (Tasks 022-026, 030-032)
  → Credenciais, Dashboard, Testes, Som
```

---

## Apêndice A: Referências de Arquivos Existentes

| Caminho | Conteúdo |
|---------|----------|
| `src/lib/api/http.ts` | HTTP client base (`apiRequest`) |
| `src/lib/api/session.ts` | Session management |
| `src/lib/api/whatsapp.ts` | API WhatsApp existente (templates/logs) |
| `src/lib/query/use-whatsapp.ts` | Hooks WhatsApp existentes |
| `src/lib/query/keys.ts` | Query keys centralizadas |
| `src/lib/shared/types/whatsapp.ts` | Tipos WhatsApp existentes |
| `src/lib/tenant/nav-items-v2.ts` | Navegação do portal |
| `src/lib/tenant/hooks/use-session-context.tsx` | Tenant context |
| `src/components/layout/sidebar.tsx` | Sidebar principal |
| `src/components/shared/paginated-table.tsx` | Tabela paginada |
| `src/components/shared/table-filters.tsx` | Filtros de tabela |
| `src/app/(backoffice)/admin/whatsapp/page.tsx` | Admin WhatsApp existente |
| `src/app/(portal)/crm/playbooks/page.tsx` | Playbooks CRM |
| `src/app/(portal)/layout.tsx` | Layout do portal |

## Apêndice B: Endpoints do Backend (OpenAPI)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/v1/conversas` | Lista conversas |
| `GET` | `/api/v1/conversas/{id}` | Detalhe + contexto |
| `POST` | `/api/v1/conversas` | Criar conversa |
| `PATCH` | `/api/v1/conversas/{id}/status` | Mudar status |
| `PATCH` | `/api/v1/conversas/{id}/owner` | Atribuir responsável |
| `PATCH` | `/api/v1/conversas/{id}/queue` | Mudar fila |
| `PATCH` | `/api/v1/conversas/{id}/unidade` | Mudar unidade |
| `GET` | `/api/v1/conversas/{id}/thread` | Thread (paginado) |
| `GET` | `/api/v1/conversas/stream` | SSE |
| `POST` | `/api/v1/conversas/{id}/mensagens` | Enviar mensagem |
| `POST` | `/api/v1/conversas/{id}/tarefas` | Criar tarefa |
| `GET` | `/api/v1/whatsapp/credentials` | Lista credenciais |
| `POST` | `/api/v1/whatsapp/credentials` | Criar credencial |
| `PUT` | `/api/v1/whatsapp/credentials/{id}` | Atualizar credencial |
| `DELETE` | `/api/v1/whatsapp/credentials/{id}` | Remover credencial |
| `GET` | `/api/v1/whatsapp/credentials/{id}/health` | Health check |
| `POST` | `/api/v1/whatsapp/credentials/{id}/refresh-token` | Renovar token |
| `GET` | `/api/v1/crm/playbooks` | Lista playbooks |
| `POST` | `/api/v1/crm/playbooks` | Criar playbook |
| `PUT` | `/api/v1/crm/playbooks/{id}` | Atualizar playbook |
| `DELETE` | `/api/v1/crm/playbooks/{id}` | Remover playbook |
| `GET` | `/api/v1/crm/playbooks/{id}/execucoes` | Lista execuções |
| `PATCH` | `/api/v1/academia/prospects-legado/{id}/stage` | Avançar stage |
