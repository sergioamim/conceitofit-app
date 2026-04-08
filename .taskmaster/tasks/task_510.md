# Task ID: 510

**Title:** Componentes de admin de credenciais WhatsApp (form, health badge, alert, list)

**Status:** pending

**Dependencies:** 486, 492, 496, 497

**Priority:** medium

**Description:** Criar componentes para gestão de credenciais WABA: formulário, health badge, alerta de token expirando e lista de credenciais.

**Details:**

Criar em `src/components/admin/`:

**`whatsapp-credential-form.tsx`** — `WhatsAppCredentialForm({ credential?, onSave, onCancel })`:
- Form com react-hook-form + zodResolver (`whatsappCredentialSchema`).
- Campos: businessAccountId, wabaId, phoneId, phoneNumber, mode (select), accessToken, accessTokenExpiresAt (datetime picker), webhookVerifyToken (opcional).
- Campos opcionais: academiaId, unidadeId (selects).
- Modo create vs edit (se `credential` prop fornecida, preencher form).
- Botões: Cancelar, Salvar.
- Toast de feedback.

**`credential-health-badge.tsx`** — `CredentialHealthBadge({ credential })`:
- Badge colorido por `onboardingStatus`: VERIFIED (green), PENDING (yellow), REJECTED (red), EXPIRED (gray).
- Tooltip com detalhes: `tokenExpired`, `tokenExpiringSoon`, `lastHealthCheckAt`.
- Se `tokenExpiringSoon`: ícone de alerta amarelo.
- Se `tokenExpired`: ícone de erro vermelho.

**`token-expiry-alert.tsx`** — `TokenExpiryAlert({ credentials })`:
- Banner amarelo no topo da página quando 1+ credenciais com `tokenExpiringSoon` ou `tokenExpired`.
- Mensagem: "X credenciais com token expirando/expirado. [Renovar agora]".
- Botão "Renovar agora" → chamar `refreshCredentialToken` para cada credencial afetada.

**`credential-list.tsx`** — `CredentialList({ credentials, isLoading, onEdit, onDelete, onHealthCheck })`:
- Tabela usando `PaginatedTable` existente.
- Colunas: Phone Number, Mode, Onboarding Status, Token Status, Last Health Check, Ações.
- Ações: Editar, Health Check, Renovar Token, Deletar (com confirmação).
- `CredentialHealthBadge` em cada linha.

**Test Strategy:**

Teste unitário: form com dados válidos → verificar submit. Form com dados inválidos → verificar erros. Health badge com todos os 4 statuses. Alert aparece/desaparece conforme props.
