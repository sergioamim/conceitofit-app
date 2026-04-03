# Task ID: 410

**Title:** Mapear impacto da sessão única contextualizada no backoffice e dashboard

**Status:** done

**Dependencies:** None

**Priority:** high

**Description:** Analisar onde o frontend assume tokens distintos e listar ajustes necessários para o token enriquecido com contexto.

**Details:**

Escopo: identificar guardas, hooks e fluxos que diferenciam sessão administrativa vs operacional e mapear onde o `activeTenantId` e `redeId` precisam ser respeitados. Incluir `src/app/(backoffice)`, `src/app/(portal)` e a camada de sessão em `src/lib/api/session.ts`.

**Test Strategy:**

Revisão manual das áreas tocadas e checklist dos pontos de impacto mapeados.
