# Task ID: 496

**Title:** Schemas Zod para formulários de atendimento

**Status:** pending

**Dependencies:** 486

**Priority:** high

**Description:** Criar `src/lib/forms/atendimento-schemas.ts` com schemas Zod para enviar mensagem, criar tarefa, criar/editar credencial e filtrar conversas.

**Details:**

Criar `src/lib/forms/atendimento-schemas.ts` exportando:

- `enviarMensagemSchema` — `content` (string min 1, max 4096), `contentType` (enum, default TEXTO), `mediaUrl` (url opcional), `templateName` (string opcional), `templateVariables` (array string opcional). Inferir `EnviarMensagemFormValues`.
- `criarTarefaSchema` — `titulo` (string min 1, max 160), `descricao` (string opcional max 1000), `responsavel` (string uuid opcional), `prioridade` (enum BAIXA/MEDIA/ALTA, default MEDIA), `prazoEm` (datetime opcional). Inferir `CriarTarefaFormValues`.
- `criarConversaSchema` — `contactId` (uuid), `tenantId` (uuid), `academiaId` (uuid opcional), `unidadeId` (uuid opcional), `prospectId` (uuid opcional), `alunoId` (uuid opcional), `queue` (string opcional), `ownerUserId` (uuid opcional). Inferir `CriarConversaFormValues`.
- `conversaFiltersSchema` — `busca` (string opcional), `status` (enum opcional), `queue` (string opcional), `ownerUserId` (uuid opcional), `unidadeId` (uuid opcional), `periodoInicio` (datetime opcional), `periodoFim` (datetime opcional). Inferir `ConversaFiltersFormValues`.
- `whatsappCredentialSchema` — `businessAccountId` (string min 1), `wabaId` (string min 1), `phoneId` (string min 1), `phoneNumber` (string min 8), `mode` (enum UNIT_NUMBER/NETWORK_SHARED_NUMBER), `accessToken` (string min 1), `accessTokenExpiresAt` (datetime), `tenantId` (uuid), `academiaId` (uuid opcional), `unidadeId` (uuid opcional), `webhookVerifyToken` (string opcional). Inferir `WhatsAppCredentialFormValues`.

Usar `zod` v4 (padrão do projeto). Usar `@hookform/resolvers/zod` nos formulários.

**Test Strategy:**

Testes unitários para cada schema: validar dados válidos e inválidos (campos obrigatórios faltando, formatos errados, strings vazias).
