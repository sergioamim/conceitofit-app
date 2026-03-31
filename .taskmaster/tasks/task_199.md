# Task ID: 199

**Title:** Criar página admin de gestão de gateways de pagamento

**Status:** done

**Dependencies:** None

**Priority:** low

**Description:** O backend tem 5 endpoints de gateways (GET, POST, PUT, PATCH ativar, PATCH desativar) sem UI no frontend.

**Details:**

Criar src/lib/api/admin-gateways.ts com clients. Criar src/app/(backoffice)/admin/configuracoes/gateways/page.tsx ou adicionar tab em configuracoes. Listar gateways configurados, criar novo, editar, ativar/desativar. Campos típicos: nome, provider (pagarme, stripe, etc), credenciais (mascaradas), status.

**Test Strategy:**

Listar gateways. Criar gateway de teste. Ativar/desativar funciona.
