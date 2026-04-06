# Task ID: 481

**Title:** Frontend: Página admin WhatsApp com configuração e monitoramento

**Status:** pending

**Dependencies:** 480

**Priority:** medium

**Description:** Completar /admin/whatsapp/page.tsx (715 LOC) com configuração real de provider, templates e monitoramento de envios.

**Details:**

A página atual existe mas pode estar sem backend real. Completar com: (1) Configuração do provider (API key, phone number ID), (2) CRUD de templates de mensagem, (3) Monitoramento de envios (enviados, entregues, lidos, falhas), (4) Teste de envio (enviar mensagem de teste), (5) Split do componente em sub-componentes se >500 LOC. Hydration safety: dados de monitoramento vêm do backend.

**Test Strategy:**

Teste E2E: configurar provider → criar template → enviar mensagem de teste → monitorar status. Teste unitário dos sub-componentes.
