# Task ID: 329

**Title:** Padronizar mocks minimos de bootstrap, contexto e autorizacao para E2E

**Status:** done

**Dependencies:** 327 ✓

**Priority:** high

**Description:** Criar um contrato minimo e consistente de mocks para auth/me, app/bootstrap, unidade ativa e endpoints de contexto usados pelos layouts e sidebars.

**Details:**

Esta task depende da 327 e deve atacar a segunda causa-raiz do relatório: specs que ate entram autenticadas, mas recebem payloads incompletos para os providers e guardas atuais.

Escopo obrigatorio:
1. Inventariar quais requests de bootstrap/contexto cada shell faz hoje antes da tela especifica carregar.
2. Definir respostas minimas compartilhadas para: /api/v1/auth/me, /api/v1/app/bootstrap, /api/v1/context/unidade-ativa, PUT de troca de unidade, /api/v1/academia e endpoints auxiliares que sidebars/topbars consultam cedo.
3. Garantir que os mocks tragam campos consistentes entre si: tenant ativo, tenant base, availableTenants, availableScopes, broadAccess, capabilities e dados da academia/rede quando o shell precisar disso.
4. Eliminar fallbacks genericos perigosos que respondem 200 {} e mascaram falta de contrato, substituindo-os por payloads realistas ou por falha explicita quando o endpoint nao tiver sido coberto.
5. Documentar no detalhe da task quais modulos podem reaproveitar esse pacote de mocks e quais exigem complementos proprios de dominio.

Fora de escopo: corrigir assertivas de tela. O objetivo aqui e estabilizar o handshake entre teste e runtime compartilhado.

**Test Strategy:**

Rodar sentinelas do app e do backoffice com mocks compartilhados, validando que auth/me, app/bootstrap, contexto e academia entregam payloads consistentes e suficientes para o shell subir.

## Subtasks

### 329.1. Mapear requests minimos de cada shell protegido

**Status:** done  
**Dependencies:** None  

Levantar todas as chamadas feitas antes da tela especifica carregar.

**Details:**

Cobrir auth/me, app/bootstrap, contexto de unidade, academia/rede e qualquer request acionada por sidebar/topbar no primeiro paint do shell.

### 329.2. Criar pacote compartilhado de mocks minimos

**Status:** done  
**Dependencies:** 329.1  

Padronizar respostas coerentes para autenticacao, bootstrap e contexto.

**Details:**

Garantir alinhamento entre tenant ativo, tenant base, availableTenants, scopes, broadAccess, capabilities e dados de academia/rede nas respostas compartilhadas.

### 329.3. Eliminar fallbacks 200 vazio que mascaram contrato faltante

**Status:** done  
**Dependencies:** 329.2  

Substituir respostas genericas por payload realista ou erro explicito.

**Details:**

Remover a pratica de responder 200 {} para endpoints desconhecidos quando isso esconder problema de contrato e produzir falso positivo ou loading infinito.

### 329.4. Validar consistencia dos mocks contra providers e guardas atuais

**Status:** done  
**Dependencies:** 329.2, 329.3  

Confirmar que useAuthAccess, TenantContext e layouts protegidos aceitam o contrato compartilhado.

**Details:**

Executar smoke nas rotas sentinela e ajustar os payloads minimos ate que providers e guardas deixem de cair em estados intermediarios inconsistentes.
