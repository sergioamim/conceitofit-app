# Task ID: 135

**Title:** Backoffice: monitoramento de integrações e configurações globais

**Status:** done

**Dependencies:** None

**Priority:** low

**Description:** Criar página /admin/configuracoes com status de integrações externas (gateway de pagamento, NFSe, catraca) e configurações globais do sistema (templates de email, termos de uso, limites).

**Details:**

Criar src/app/(backoffice)/admin/configuracoes/page.tsx com: (1) Status de integrações: cards mostrando uptime, último erro, latência média de cada integração (gateway PIX/boleto, NFSe, catraca WS, EVO import); (2) Configurações globais: templates de email (lista de templates editáveis), termos de uso (editor rich text), limites de API (rate limiting). Criar endpoint getIntegrationStatus e getGlobalConfig em src/lib/api/admin-config.ts. Adicionar tipos IntegrationStatus e GlobalConfig.

**Test Strategy:**

Verificar que integrações mostram status correto. Editar template de email e confirmar persistência.

## Subtasks

### 135.1. Criar tipos e endpoints de integrações e config

**Status:** done  
**Dependencies:** None  

IntegrationStatus, GlobalConfig em types.ts. Endpoints em admin-config.ts

### 135.2. Criar página de status de integrações

**Status:** done  
**Dependencies:** 135.1  

Cards de uptime, último erro, latência por integração

### 135.3. Criar seção de configurações globais editáveis

**Status:** done  
**Dependencies:** 135.1  

Templates de email, termos de uso (rich text), limites de API
