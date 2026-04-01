# Task ID: 332

**Title:** Corrigir fluxos auth-rede, subdominio e storefront

**Status:** done

**Dependencies:** 327 ✓, 329 ✓

**Priority:** high

**Description:** Alinhar os testes de acesso por rede com o runtime atual de subdominio, headers e resolucao de storefront, removendo 404 e loading eterno nesses cenarios.

**Details:**

Esta task depende de 327 e 329.

Escopo obrigatorio:
1. Revisar tests/e2e/auth-rede.spec.ts ponta a ponta, incluindo buildHostBasedUrl, rotas /app/[rede]/login, forgot-password, first-access e qualquer dependencia de hostname/subdominio.
2. Verificar se os headers e query params usados pelo runtime atual para resolver contexto de rede e storefront batem com os mocks do teste.
3. Corrigir o cenario que cai em 'Storefront nao encontrada' e o cenario que fica em 'Carregando contexto da rede...'.
4. Garantir que o teste cubra tanto o caso feliz quanto a rede invalida sem depender de comportamento antigo da rota.
5. Documentar no detalhe da task qual e o contrato atual aceito pelo frontend para rede: host, slug, header e fallback.

Contrato atual (validado):
- Host/subdominio: /login resolve rede usando x-forwarded-host (ou host).
- Rota canonica: /app/[rede]/(login|forgot-password|first-access).
- Query: /login?redeIdentifier=rede-alvo.
- Header na API: X-Rede-Identifier.

Criterio de aceite: a suite auth-rede deve falhar apenas se houver regressao real de UX ou contrato, e nao por mismatch de infraestrutura local do teste.

**Test Strategy:**

Rodar auth-rede.spec.ts inteiro e confirmar que os cenarios feliz, primeiro acesso, rede invalida e resolucao canonica de links nao falham mais por 404 ou loading infinito.

## Subtasks

### 332.1. Auditar contrato de host, slug e header nos fluxos de rede

**Status:** done  
**Dependencies:** None  

Comparar os utilitarios do teste com o runtime atual de resolucao de contexto.

**Details:**

Revisar buildHostBasedUrl, query params, headers enviados e qualquer dependencia de hostname/subdominio implicita no frontend atual.

### 332.2. Corrigir o caso feliz de autenticacao por rede

**Status:** done  
**Dependencies:** 332.1  

Garantir que login, forgot-password e first-access recebam contexto valido e transitem corretamente.

**Details:**

Ajustar mocks e navigations para que o fluxo principal use o contrato atual e nao dependa de comportamento legado das rotas.

### 332.3. Corrigir rede invalida e storefront nao encontrada

**Status:** done  
**Dependencies:** 332.1  

Tratar de forma deterministica o cenário negativo sem conflitar com o happy path.

**Details:**

Separar claramente quando o teste deve esperar 404 intencional e quando o 404 atual e apenas mismatch de resolucao de storefront.

### 332.4. Documentar o contrato aceito pelo frontend para auth-rede

**Status:** done  
**Dependencies:** 332.2, 332.3  

Deixar host, slug, header e fallback descritos para futuras manutencoes.

**Details:**

Registrar no detalhe da task qual combinacao de host/subdominio/header o runtime atual espera e como os mocks devem representá-la.
