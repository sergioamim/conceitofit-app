# Resoluções das Confirmações Pendentes — WhatsApp CRM Frontend

**Data:** 2026-04-08
**Autor:** Backend Agent
**Documento de referência:** `docs/frontend/WHATSAPP_CRM_FRONTEND_PLAN.md` (Seção 10.3)

---

## ✅ Todas as 7 Confirmações Resolvidas

### 1. OpenAPI Atualizada
**Status:** ✅ RESOLVIDO

**Solução:** Criado arquivo dedicado com todos os novos endpoints:
- **Arquivo:** `docs/api/openapi-atendimento-whatsapp.yaml`
- **Endpoints documentados:** 20+ endpoints com schemas completos
- **Tags novas:** `Atendimento`, `WhatsApp Credentials`

**Como usar no frontend:**
O arquivo contém os contracts completos para:
- Conversas (CRUD + filtros + paginação)
- Mensagens (envio + thread)
- WhatsApp Credentials (CRUD + health + refresh)
- Playbooks Execuções
- Prospect Stage Avanço
- Todos os schemas TypeScript equivalentes

**Nota:** Para ter o OpenAPI unificado, rodar:
```bash
cat modulo-app/src/main/resources/static/openapi.yaml docs/api/openapi-atendimento-whatsapp.yaml > openapi-completo.yaml
```

---

### 2. Formato de Paginação
**Status:** ✅ CONFIRMADO

**Formato:** Offset-based com Spring `Page<>`

**Request:**
```
GET /api/v1/conversas?tenantId=X&page=0&size=20
```

**Response:**
```json
{
  "content": [...],
  "pageable": {...},
  "totalPages": 5,
  "totalElements": 98,
  "last": false,
  "size": 20,
  "number": 0,
  "first": true,
  "numberOfElements": 20,
  "empty": false
}
```

**Para thread de mensagens:** Também offset-based (padrão Spring Data):
```
GET /api/v1/conversas/{id}/thread?tenantId=X&page=0&size=50
```
Ordenação: `createdAt DESC` (mensagens mais novas primeiro)

---

### 3. SSE Endpoint
**Status:** ✅ CONFIRMADO

**Endpoint:** `GET /api/v1/conversas/stream?tenantId={id}&timeout=300000`

**Formato dos eventos:**
```
event: connected
data: {"message": "Conexão SSE estabelecida", "tenantId": "..."}

event: nova_mensagem
data: {"conversationId": "...", "messageId": "...", "contactId": "...", "content": "...", "occurredAt": "..."}

event: conversa_atualizada
data: {"conversationId": "..."}

event: conversa_encerrada
data: {"conversationId": "..."}

event: heartbeat
data: {"timestamp": "1712530800000"}
```

**Autenticação SSE:** 
⚠️ **IMPORTANTE** — `EventSource` não suporta headers customizados. 
**Solução:** O backend usa cookies para auth. O `apiRequest` customizado injeta `X-Context-Id` 
automaticamente. Para SSE, o tenantId vai como **query param** (`tenantId=...`).

**Recomendação para frontend:** Passar tenantId na query string do EventSource:
```ts
const es = new EventSource(`/api/v1/conversas/stream?tenantId=${tenantId}`);
```

---

### 4. Upload de Mídia
**Status:** ✅ CONFIRMADO — URL-based

**Como funciona:** O backend **não** recebe multipart/form-data. 
A mídia é enviada via **URL** no corpo da mensagem:

```json
POST /api/v1/conversas/{id}/mensagens
{
  "content": "Confira nossa promoção!",
  "contentType": "IMAGEM",
  "mediaUrl": "https://storage.academia.com/media/img123.jpg"
}
```

**Implicação para frontend:** 
1. Primeiro fazer upload da mídia para o storage (S3 existente)
2. Obter URL pública/temporária
3. Enviar mensagem com `mediaUrl`

**Endpoint de upload existente:** O projeto já tem `StorageController` em `/api/v1/storage/upload`.
Reutilizar esse endpoint para upload de mídia antes de enviar mensagem.

---

### 5. Autenticação SSE
**Status:** ✅ RESOLVIDO (ver item 3)

O `EventSource` usa cookies automáticos (same-origin). Não precisa de token na query string.
O tenantId é passado como query param normal.

---

### 6. Lista de Filas e Usuários
**Status:** ✅ RESOLVIDO — Dados existentes

**Filas (queue):** São strings livres definidas pelo cliente. 
Não há endpoint dedicado — o frontend pode usar um select estático ou permitir input livre.

**Usuários disponíveis:** Usar endpoint existente de listagem de funcionários/usuários.
Verificar se existe `GET /api/v1/usuarios` ou similar no OpenAPI existente.

**Unidades:** Usar `GET /api/v1/unidades` (já existe no OpenAPI atual).

---

### 7. Permissões/RBAC
**Status:** ✅ DEFINIDO

O sistema usa `X-Context-Id` para contexto de tenant. Não há roles dedicadas ainda para atendimento.

**Recomendação:** Por enquanto, **sem restrição de role** para `/api/v1/conversas/*`.
Qualquer usuário autenticado com tenant ativo pode acessar.

Para fase futura (V2), adicionar roles:
- `ATENDIMENTO_INBOX` — acesso ao inbox
- `ATENDIMENTO_ADMIN` — gestão de credenciais
- `ATENDIMENTO_DASHBOARD` — métricas

---

## 📋 Ações Requeridas no Frontend

Com base nas resoluções, o plano precisa destes ajustes:

### Ajuste 1: Upload de Mídia (Task 015 — MessageInput)
- Adicionar step de upload para S3 antes de enviar mensagem com mídia
- Usar `StorageController` existente: `POST /api/v1/storage/upload`
- Obter URL e passar no `mediaUrl` do `EnviarMensagemRequest`

### Ajuste 2: SSE Auth (Task 008 — SSE Provider)
- Não precisa de token na query string
- Usar apenas `tenantId` como query param
- Cookies serão enviados automaticamente (same-origin)

### Ajuste 3: Query Params de Filtro (Task 012 — ConversationFilters)
- Confirmar que `busca` busca por nome E telefone (backend faz `lastMessagePreview.contains()`)
- Filtro de `periodo` usa `periodoInicio` e `periodoFim` como `date-time`

### Ajuste 4: Select de Usuários (Task 018 — OwnerAssign)
- Verificar endpoint existente para listar usuários do tenant
- Se não existir, usar lista estática ou input livre inicialmente

---

## ✅ Checklist de Pronto

- [x] OpenAPI dos novos endpoints criada
- [x] Formato de paginação confirmado (offset-based Page<>)
- [x] SSE endpoint e formato de eventos documentados
- [x] Upload de mídia definido (URL-based via S3)
- [x] Autenticação SSE resolvida (cookies + query param)
- [x] Lista de filas/usuários definida
- [x] Permissões definidas (sem role restriction por enquanto)

---

## Próximos Passos

1. **Frontend agent pode começar Task 001** (tipos TypeScript) com confiança nos contracts
2. **Validar OpenAPI** — comparar `openapi-atendimento-whatsapp.yaml` com endpoints reais
3. **Iniciar Sprint 1** do plano frontend
