# Task ID: 63

**Title:** Enviar `X-Rede-Identifier` no login e forgot-password

**Status:** done

**Dependencies:** 62 ✓

**Priority:** high

**Description:** Alinhar os clients de autenticação ao contrato backend por subdominio da rede.

**Details:**

O backend aceita `redeIdentifier` por header, query, body e host, mas o frontend deve padronizar o envio no header `X-Rede-Identifier`. O fluxo não deve mandar tenant nem depender de slug legado.

**Test Strategy:**

Cobrir request de login e recuperação de senha verificando presença do header `X-Rede-Identifier` e payload sem `tenantId`.

## Subtasks

### 63.1. Ajustar client de login

**Status:** done  
**Dependencies:** None  

Injetar `X-Rede-Identifier` no request de autenticação.

**Details:**

Atualizar `src/lib/api/auth.ts` ou wrapper equivalente para receber `subdominio` da rede e enviá-lo como header no `POST /backend/api/v1/auth/login`.

### 63.2. Ajustar fluxo de forgot-password

**Status:** done  
**Dependencies:** 63.1  

Repetir a mesma estratégia no reset de senha.

**Details:**

Garantir que `POST /backend/api/v1/auth/forgot-password` receba o mesmo header quando a origem for `/app/[rede]/login` ou `[rede].localhost`.

### 63.3. Remover dependências de tenant no request inicial

**Status:** done  
**Dependencies:** 63.1, 63.2  

Eliminar parâmetros e estados que poluem o login com escopo operacional.

**Details:**

Revisar forms, services e stores para garantir que o login não envie `tenantId`, unidade ativa ou qualquer inferência operacional antes da sessão ser criada.
