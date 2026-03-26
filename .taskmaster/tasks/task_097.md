# Task ID: 97

**Title:** Estruturar tratamento de erro e observabilidade dos boundaries

**Status:** done

**Dependencies:** 95 ✓

**Priority:** high

**Description:** Evoluir os error boundaries para consumirem erros tipados do projeto e entregarem recuperação, contexto técnico e mensagem consistente.

**Details:**

Aproveitar a infraestrutura criada na task 95 para conectar `ErrorState` ao shape real de `ApiRequestError`, reutilizar formatadores compartilhados, enriquecer diagnósticos úteis para suporte e alinhar os estados de erro global, operacional e `not-found`. Esta tarefa pode rodar em paralelo com 96 e 98.

**Test Strategy:**

Validar cenários de erro global e do shell operacional, cobrindo `ApiRequestError`, erro genérico e navegação para 404; conferir mensagens, `reset()` e exposição controlada de contexto técnico.

## Subtasks

### 97.1. Auditar shape real de erros HTTP e mensagens compartilhadas

**Status:** done  
**Dependencies:** None  

Mapear quais dados técnicos já existem e podem ser exibidos ou logados com segurança.

**Details:**

Revisar `src/lib/api/http.ts`, `src/lib/utils/api-error.ts` e usos existentes de `ApiRequestError` para definir uma política de exibição/log que aproveite `status`, `path`, `contextId`, `fieldErrors` e mensagens normalizadas.

### 97.2. Refatorar ErrorState para usar erros estruturados

**Status:** done  
**Dependencies:** 97.1  

Substituir heurísticas frágeis por leitura tipada e reaproveitamento de helpers compartilhados.

**Details:**

Atualizar `ErrorState` para identificar corretamente `ApiRequestError`, renderizar mensagem amigável com fallback seguro e expor metadados úteis apenas quando fizer sentido para suporte/diagnóstico.

### 97.3. Alinhar boundaries globais, shell operacional e estado 404

**Status:** done  
**Dependencies:** 97.2  

Garantir consistência de recuperação e linguagem entre as superfícies de erro.

**Details:**

Revisar `src/app/error.tsx`, `src/app/(app)/error.tsx` e `src/app/not-found.tsx` para manter comportamento consistente de CTA, isolamento visual e contexto técnico, sem expor detalhes indevidos ao usuário final.
