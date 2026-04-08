# Task ID: 486

**Title:** Tipos TypeScript para WhatsApp CRM (Atendimento)

**Status:** done

**Dependencies:** None

**Priority:** high

**Description:** Criar arquivo de tipos TypeScript com todos os contratos do novo domínio de atendimento: Conversation, Message, ContactContext, WhatsAppCredential, enums de status/direção/tipo/conteúdo, e tipos de filtro/SSE baseados no OpenAPI oficial do backend.

**Details:**

Criar `src/lib/shared/types/whatsapp-crm.ts` exportando:
- Enums: `ConversationStatus` (ABERTA, PENDENTE, EM_ATENDIMENTO, ENCERRADA, SPAM, BLOQUEADA), `MessageDirection` (INBOUND, OUTBOUND), `MessageContentType` (TEXTO, IMAGEM, AUDIO, DOCUMENTO, VIDEO, LOCALIZACAO, CONTATO, TEMPLATE), `MessageDeliveryStatus` (PENDENTE, ENTREGUE, LIDO, FALHOU, NAO_ENTREGUE), `WhatsAppOnboardingStatus` (PENDING, VERIFIED, REJECTED, EXPIRED), `WhatsAppOnboardingStep` (CREATED, PHONE_REGISTERED, VERIFIED, TEMPLATES_APPROVED), `WhatsAppMode` (UNIT_NUMBER, NETWORK_SHARED_NUMBER).
- Interface `ConversaResponse` (mapeada do OpenAPI `ConversaResponse`): id, tenantId, academiaId, unidadeId, contactId, prospectId, alunoId, status, queue, ownerUserId, lastMessagePreview, lastMessageAt, aiSummary, aiIntent, aiIntentConfidence, openedAt, closedAt, createdAt, updatedAt, contatoNome, contatoTelefone.
- Interface `MensagemResponse` (mapeada do OpenAPI `MensagemResponse`): id, conversationId, direction, contentType, content, mediaUrl, deliveryStatus, isAutomated, createdAt.
- Interface `WhatsAppCredentialResponse` (mapeada do OpenAPI `WhatsAppCredentialResponse`): id, tenantId, academiaId, unidadeId, businessAccountId, wabaId, phoneId, phoneNumber, mode, accessTokenExpiresAt, webhookVerifyToken, onboardingStatus, onboardingStep, lastHealthCheckAt, createdAt, updatedAt, tokenExpiringSoon, tokenExpired.
- Interface `WhatsAppCredentialRequest` (mapeada do OpenAPI `WhatsAppCredentialRequest`): tenantId, academiaId, unidadeId, businessAccountId, wabaId, phoneId, phoneNumber, mode, accessToken, accessTokenExpiresAt, webhookVerifyToken, onboardingStatus, onboardingStep.
- Interface `CriarConversaRequest`: tenantId, academiaId, unidadeId, contactId, prospectId, alunoId, queue, ownerUserId.
- Interface `EnviarMensagemRequest`: content, contentType (default TEXTO), mediaUrl, templateName, templateVariables (array de string).
- Interface `CriarTarefaConversaRequest`: tenantId, titulo (max 160), descricao, responsavel, status, prioridade (BAIXA, MEDIA, ALTA), prazoEm.
- Interface `ConversaPageResponse`: content (array ConversaResponse), totalPages, totalElements, last, size, number, first, numberOfElements, empty.
- Interface `MensagemPageResponse`: content (array MensagemResponse), totalPages, totalElements, last, size, number, first, numberOfElements, empty.
- Interface `ConversaFilters`: unidadeId?, status?, queue?, ownerUserId?, periodoInicio?, periodoFim?, busca?, page?, size?.
- Interface `SSEEvent`: type ('connected' | 'nova_mensagem' | 'conversa_atualizada' | 'conversa_encerrada' | 'heartbeat'), data: unknown.
- Reexportar em `src/lib/shared/types/index.ts` se o arquivo existir.

**Test Strategy:**

Compilação TypeScript limpa (sem erros de tipo). Verificar que todos os tipos são consistentes com o OpenAPI (`openapi-atendimento-whatsapp.yaml`). Teste unitário simples: instanciar objetos com os tipos e verificar que os enums aceitam apenas valores válidos.
