# Task ID: 142

**Title:** Backend: API de configurações e feature flags (/admin/configuracoes)

**Status:** pending

**Dependencies:** None

**Priority:** low

**Description:** Implementar endpoints para feature flags por academia, status de integrações e configurações globais do sistema.

**Details:**

Endpoints:
1. GET /api/v1/admin/configuracoes/feature-flags/matrix → { features: [{ key, label, module }], academias: [{ academiaId, academiaNome, flags: { [featureKey]: boolean } }] }
2. PATCH /api/v1/admin/configuracoes/feature-flags/{featureKey}/global body: { enabled } → toggle global
3. PATCH /api/v1/admin/configuracoes/feature-flags/{featureKey}/academias/{academiaId} body: { enabled } → toggle por academia
4. GET /api/v1/admin/configuracoes/integracoes/status → [{ nome, tipo, uptime, ultimoErro, latenciaMedia, status: ONLINE|DEGRADED|OFFLINE }]
5. GET /api/v1/admin/configuracoes/global → { emailTemplates: [...], termosDeUso: string, rateLimits: { ... } }
6. PUT /api/v1/admin/configuracoes/global → atualizar config global
Feature flags: tabela feature_flag_override com (featureKey, academiaId, enabled). Se não tem override, herda do global. Propagação: academiaId → todas as unidades daquela academia.

**Test Strategy:**

Ativar flag para uma academia, verificar propagação. Toggle global e confirmar override. Verificar status de integrações.

## Subtasks

### 142.1. Criar modelo e CRUD de feature flags com herança

**Status:** pending  
**Dependencies:** None  

Tabela feature_flag_override, endpoints de matrix e toggles global/por academia

### 142.2. Criar endpoint de status de integrações

**Status:** pending  
**Dependencies:** None  

Health check de gateway, NFSe, catraca com uptime e latência

### 142.3. Criar endpoints de configurações globais

**Status:** pending  
**Dependencies:** None  

GET/PUT global config (templates, termos, rate limits)
