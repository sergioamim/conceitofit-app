# Task ID: 480

**Title:** Frontend: API client e tipos para WhatsApp

**Status:** pending

**Dependencies:** 479

**Priority:** high

**Description:** Criar API client TypeScript para WhatsApp e expandir hooks de cadências CRM para envio real.

**Details:**

Expandir src/lib/api/whatsapp.ts (atual 49 LOC) com: sendWhatsAppMessage(), getWhatsAppStatus(), getWhatsAppTemplates(). Tipos Zod para request/response. Integrar com cadências CRM: quando cadência dispara ação 'WHATSAPP', chamar sendWhatsAppMessage ao invés de apenas registrar intenção. Atualizar useCrmCadences hook para suportar envio real.

**Test Strategy:**

Testes unitários do API client expandido. Testes de integração do hook de cadências com mock de WhatsApp.
