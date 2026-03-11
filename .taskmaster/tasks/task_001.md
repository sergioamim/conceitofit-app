# Task ID: 1

**Title:** Alinhar contrato HTTP e camada de consumo da API

**Status:** done

**Dependencies:** None

**Priority:** high

**Description:** Revisar clients, services, schemas e tratamento de erro para refletir a API real no web.

**Details:**

Inclui normalizacao de fetchers, contratos tipados, estados de erro e consumo consistente do backend.

**Test Strategy:**

No test strategy provided.

## Subtasks

### 1.1. Auditar clientes e serviços em src/lib/api

**Status:** done  
**Dependencies:** None  

Mapear clientes, services e schemas atuais e comparar com a API real.

**Details:**

Inspecionar todos os módulos em `src/lib/api/*`, identificar endpoints, contratos tipados, normalizações de fetchers e discrepâncias com a API real para priorizar ajustes.

### 1.2. Revisar e ajustar wrapper HTTP central

**Status:** done  
**Dependencies:** 1.1  

Alinhar o comportamento de `src/lib/api/http.ts` ao contrato real.

**Details:**

Rever interceptores, headers, tratamento de erros, retries e normalização de respostas/erros no wrapper; garantir consistência com as especificações e padrões do backend.

### 1.3. Alinhar contratos com guia de integração

**Status:** done  
**Dependencies:** 1.1, 1.2  

Atualizar contratos tipados conforme `docs/FRONTEND_INTEGRATION_GUIDE.json`.

**Details:**

Comparar esquemas e payloads documentados no guia; ajustar types, parsers e validações nos clients/services para refletir o contrato oficial.

### 1.4. Refatorar fallbacks e mocks de serviços

**Status:** done  
**Dependencies:** 1.2, 1.3  

Rever e padronizar fallbacks em `src/lib/mock/services.ts`.

**Details:**

Atualizar mocks para aderirem aos contratos reais, remover inconsistências e garantir que os fallbacks reproduzam estados de erro e respostas esperadas.

### 1.5. Ajustar páginas consumidoras e adicionar testes

**Status:** done  
**Dependencies:** 1.2, 1.3, 1.4  

Atualizar páginas que consomem serviços e criar testes e2e/integração.

**Details:**

Revisar páginas e hooks que usam os services, corrigir estados de loading/erro; adicionar ou atualizar testes em `tests/e2e` e integração conforme fluxos críticos.
