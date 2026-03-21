# Task ID: 64

**Title:** Alinhar tipos, estado de sessao e vocabulário para `subdominio` de rede

**Status:** done

**Dependencies:** 62 ✓, 63 ✓

**Priority:** medium

**Description:** Atualizar tipos e estado do frontend para usar `subdominio` como identificador canônico da academia.

**Details:**

O frontend ainda pode ter referências a `slug` ou suposições de tenant no modelo de academia/sessão. Esta task consolida `subdominio` como campo oficial em tipos, stores, bootstrap e UI.

**Test Strategy:**

Validar tipagem compilando as superfícies de auth/bootstrap e revisar renderização sem referências legadas a `slug` ou tenant no login.

## Subtasks

### 64.1. Atualizar tipos compartilhados de auth e academia

**Status:** done  
**Dependencies:** None  

Refletir `subdominio` nos tipos consumidos pelo frontend.

**Details:**

Revisar `src/lib/types.ts`, schemas, DTOs locais e contratos de bootstrap/academia para usar `subdominio` em vez de `slug` quando o campo representar a rede.

### 64.2. Revisar stores e session bootstrap

**Status:** done  
**Dependencies:** 64.1  

Garantir que a sessão carregue e preserve a rede corretamente.

**Details:**

Verificar stores, context providers e leitura de bootstrap para manter o `subdominio` da rede disponível quando necessário, sem misturá-lo ao tenant ativo.

### 64.3. Trocar terminologia legada na UI

**Status:** done  
**Dependencies:** 64.1  

Remover o termo `slug` das superfícies relacionadas a rede.

**Details:**

Ajustar labels, mensagens internas e comentários que ainda usem `slug` para o contexto de academia/rede, mantendo a terminologia consistente com o backend.
