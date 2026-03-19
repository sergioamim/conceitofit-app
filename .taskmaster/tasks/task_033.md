# Task ID: 33

**Title:** Migrar Dashboard para endpoint unificado de dados e reduzir round-trips

**Status:** done

**Dependencies:** 32 ✓

**Priority:** high

**Description:** Migrar a tela /dashboard para consumir um endpoint consolidado e reduzir múltiplas chamadas paralelas atuais.

**Details:**

Implementar/validar endpoint unificado, adaptar adapter de dashboard, migrar página para 1 chamada por estado/scope e manter fallback seguro.

**Test Strategy:**

No test strategy provided.

## Subtasks

### 33.1. Validar contrato alvo e alinhamento de campos

**Status:** done  
**Dependencies:** None  

Confirmar contrato da API e regras de cálculo/date window no backend

**Details:**

Fechar contrato canônico para /api/v1/academia/dashboard: required/optional fields, referência temporal e serialização.

### 33.2. Atualizar adapter de dashboard para contrato consolidado (com fallback)

**Status:** done  
**Dependencies:** 33.1  

Ajustar src/lib/api/dashboard.ts para novo contrato sem quebrar legacy

**Details:**

Aceitar wrappers antigos e novos campos de summary/listas; defaults seguros.

### 33.4. Migrar src/app/(app)/dashboard/page.tsx para fetch único

**Status:** done  
**Dependencies:** 33.2  

Trocar listagens paralelas por getDashboardApi

**Details:**

Remover listProspectsApi/listAlunosApi/listMatriculasApi/listPagamentosApi e usar summary do endpoint por scope (CLIENTES/VENDAS/FINANCEIRO).

### 33.5. Criar fallback controlado para ambiente sem endpoint completo

**Status:** done  
**Dependencies:** 33.4  

Evitar quebra quando backend parcial

**Details:**

Aplicar defaults e fallback parcial/legacy, manter UI funcional.

### 33.6. Otimizar carregamento por aba e observabilidade

**Status:** done  
**Dependencies:** 33.4  

Trocar scope por aba sem repetir chamadas desnecessárias

**Details:**

Memoização por referenceDate/scope e evidência de redução de chamadas.

### 33.7. Atualizar tipos e fechar evidência de aceite

**Status:** done  
**Dependencies:** 33.5, 33.6  

Ajustar DashboardData e comprovar redução de chamadas

**Details:**

Validar tipos, mocks e critério de aceite: 1 chamada por combinação.
