# Task ID: 201

**Title:** Integrar catálogo de funcionalidades e perfis-padrão no RBAC

**Status:** pending

**Dependencies:** None

**Priority:** low

**Description:** O backend tem 9 endpoints de segurança avançada (catálogo de funcionalidades, perfis-padrão com versionamento, revisões, exceções) não integrados.

**Details:**

Expandir a página de RBAC (/seguranca/rbac) ou criar sub-páginas: 1) Tab/página de catálogo de funcionalidades (GET/POST/PUT /admin/seguranca/catalogo-funcionalidades). 2) Tab de perfis-padrão com versionamento (GET /perfis-padrao, GET /{key}/versoes, POST). 3) Tab de revisões de segurança (GET /admin/seguranca/revisoes). 4) Gestão de exceções (POST /excecoes, PUT /excecoes/{id}/revisao). Atualizar src/lib/api/rbac.ts ou criar admin-seguranca-avancada.ts.

**Test Strategy:**

Catálogo lista funcionalidades. Perfis-padrão com versões visíveis. Exceções criáveis/revisáveis.
