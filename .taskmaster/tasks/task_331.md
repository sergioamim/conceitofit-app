# Task ID: 331

**Title:** Recuperar suites do backoffice global que hoje redirecionam para /admin-login

**Status:** done

**Dependencies:** 327 ✓, 328 ✓, 329 ✓

**Priority:** high

**Description:** Fazer voltar a passar as specs de /admin/** que hoje caem no login administrativo ou ficam presas em validacao de permissao.

**Details:**

Esta task depende de 327, 328 e 329. Ela cobre o bucket adminLogin do relatório.

Escopo obrigatorio:
1. Reexecutar como sentinelas: tests/e2e/backoffice-seguranca.spec.ts, tests/e2e/backoffice-configuracoes.spec.ts, tests/e2e/backoffice-impersonation.spec.ts, tests/e2e/admin-backoffice-coverage.spec.ts, tests/e2e/admin-backoffice-global-crud.spec.ts e tests/e2e/onboarding-fluxo-completo.spec.ts.
2. Validar o contrato esperado por useAuthAccess e pelo shell do backoffice em src/app/(backoffice)/admin/layout.tsx.
3. Garantir que usuarios elevados recebam canAccessElevatedModules e demais metadados de acesso coerentes com o cenario testado.
4. Corrigir divergencias entre seeds de tenant operacionais e o modo plataforma/backoffice quando elas estiverem disparando bloqueios indevidos.
5. Listar claramente quais falhas remanescentes sao de RBAC/backoffice real e nao mais de boot/auth.

Criterio de aceite: nenhuma spec de /admin/** deve cair em /admin-login por ausencia de contrato de sessao ou bootstrap incompleto.

**Test Strategy:**

Reexecutar as sentinelas de /admin/** e garantir que nenhuma caia em /admin-login; falhas residuais devem estar relacionadas a RBAC, dados de modulo ou comportamento funcional do backoffice.

## Subtasks

### 331.1. Reproduzir o bucket adminLogin com sentinelas do backoffice

**Status:** pending  
**Dependencies:** None  

Executar as suites principais de seguranca, configuracoes, impersonation, coverage e onboarding.

**Details:**

Usar esse conjunto para confirmar rapidamente se a sessao do backoffice e reconhecida e se o modo plataforma sobe sem bloqueio indevido.

### 331.2. Alinhar contrato de acesso elevado do backoffice

**Status:** pending  
**Dependencies:** 331.1  

Garantir canAccessElevatedModules e metadados correlatos nas respostas mockadas.

**Details:**

Validar o contrato exigido por useAuthAccess e pelo layout src/app/(backoffice)/admin/layout.tsx para usuarios elevados e demais perfis administrativos.

### 331.3. Estabilizar suites prioritarias de /admin/**

**Status:** done  
**Dependencies:** 331.2  

Remover regressões de auth/boot nas rotas administrativas mais representativas.

**Details:**

Cobrir seguranca, configuracoes, impersonation, CRUD global e onboarding sem depender de seeds operacionais incoerentes com o modo plataforma.

### 331.4. Separar residuos reais de RBAC ou dominio

**Status:** pending  
**Dependencies:** 331.2, 331.3  

Registrar quais falhas remanescentes ja nao sao mais problema de login administrativo.

**Details:**

Documentar no detalhe da task qualquer falha que persista por regra de negocio, permissao ou dados de modulo para evitar regressao de escopo.
