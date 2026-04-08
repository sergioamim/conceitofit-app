# Task ID: 488

**Title:** API client TypeScript para WhatsApp Credentials

**Status:** done

**Dependencies:** 486

**Priority:** high

**Description:** Criar `src/lib/api/whatsapp-credentials.ts` com funções CRUD + health check + refresh token para credenciais WABA.

**Details:**

Criar `src/lib/api/whatsapp-credentials.ts` exportando:
- `listCredentialsApi({ tenantId })` → `WhatsAppCredentialResponse[]` — GET `/api/v1/whatsapp/credentials?tenantId=X`.
- `createCredentialApi({ tenantId, data })` → `WhatsAppCredentialResponse` — POST `/api/v1/whatsapp/credentials` com body `WhatsAppCredentialRequest`.
- `updateCredentialApi({ tenantId, id, data })` → `WhatsAppCredentialResponse` — PUT `/api/v1/whatsapp/credentials/{id}`.
- `deleteCredentialApi({ tenantId, id })` → void — DELETE `/api/v1/whatsapp/credentials/{id}`.
- `checkCredentialHealthApi({ tenantId, id })` → `{ id, phoneNumber, onboardingStatus, tokenExpired, tokenExpiringSoon, expiresAt, lastHealthCheckAt }` — GET `/api/v1/whatsapp/credentials/{id}/health`.
- `refreshCredentialTokenApi({ tenantId, id })` → `WhatsAppCredentialResponse` — POST `/api/v1/whatsapp/credentials/{id}/refresh-token`.

Usar `apiRequest` de `./http`. Tipar tudo com os tipos da Task 486.

**Test Strategy:**

Testes unitários mockando `apiRequest`, verificando path, method, body de cada função.
