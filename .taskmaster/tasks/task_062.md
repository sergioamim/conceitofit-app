# Task ID: 62

**Title:** Ajustar roteamento de login por rede usando subdominio canonico

**Status:** done

**Dependencies:** 61

**Priority:** high

**Description:** Preparar o frontend para autenticar por rede/academia via `/app/[rede]/login` e `[rede].localhost`.

**Details:**

O backend agora resolve a rede por `Academia.subdominio`, sem depender de tenant. O frontend precisa tratar `[rede]` como identificador da academia, extrair esse valor da URL/path ou host e parar de inferir tenant no login.

**Test Strategy:**

Validar navegação para `/app/[rede]/login`, resolução do identificador por host/path e ausência de dependência de tenant no fluxo de autenticação.

## Subtasks

### 62.1. Auditar rotas e guardas atuais de login

**Status:** done  
**Dependencies:** None

Mapear onde o frontend ainda assume tenant, slug ou host único no acesso.

**Details:**

Revisar `src/app`, middleware, guards, callbacks de auth e helpers de rota para identificar o ponto de entrada do login e os lugares onde a URL ainda usa tenant ou nomenclatura legada.

### 62.2. Definir rota canonica `/app/[rede]/login`

**Status:** done  
**Dependencies:** 1

Garantir uma rota explícita e estável para login por rede.

**Details:**

Criar ou ajustar a página para que `[rede]` represente o `subdominio` da academia, com fallback de leitura por host quando o acesso vier de `[rede].localhost`.

### 62.3. Normalizar helpers de resolução de rede

**Status:** done  
**Dependencies:** 2

Centralizar a leitura do identificador da rede em um utilitário único.

**Details:**

Evitar lógica duplicada entre página, layout e client HTTP. O helper deve priorizar o parâmetro de rota e cair para o host somente quando necessário.
