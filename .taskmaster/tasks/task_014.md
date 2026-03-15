# Task ID: 14

**Title:** Eliminar legado restante de mock/services e store para fechar backend-only

**Status:** done

**Dependencies:** 1 ✓, 3 ✓, 12 ✓, 13 ✓

**Priority:** high

**Description:** Remover o restante do caminho legado baseado em store/localStorage onde o backend real já cobre a operação.

**Details:**

Inventariar exports residuais de src/lib/mock/services.ts, src/lib/mock/store.ts, src/lib/public/services.ts e src/lib/public/storage.ts; migrar o que ainda depende de contrato real; remover leitura direta de store/localStorage das telas; padronizar a aplicação para sessão + API real como única fonte operacional.

**Test Strategy:**

No test strategy provided.

## Subtasks

### 14.1. Inventariar exports residuais e leituras diretas de store/localStorage

**Status:** done  
**Dependencies:** None  

Mapear tudo que ainda depende do legado fora do fluxo principal já migrado.

**Details:**

Auditar /src/lib/mock/services.ts, /src/lib/mock/store.ts, /src/lib/public/services.ts, /src/lib/public/storage.ts e páginas/componentes que ainda leem getStore() ou localStorage como fonte operacional.

### 14.2. Classificar resíduos entre remoção, migração e cache transitório

**Status:** done  
**Dependencies:** None  

Separar claramente o que deve sair, o que precisa virar adapter real e o que pode permanecer apenas como cache em memória.

**Details:**

Criar um mapa por domínio indicando se o código residual é apenas legado morto, se depende de contrato backend ainda ausente ou se permanece apenas como cache auxiliar sem valor de verdade.

### 14.3. Extrair domínios remanescentes para /src/lib/api

**Status:** done  
**Dependencies:** None  

Mover o que ainda restar de operação real para clients dedicados e tipados.

**Details:**

Criar adapters por domínio para as funções ainda concentradas em /src/lib/mock/services.ts e substituir os consumers sem alterar contratos de tela além do necessário.

### 14.4. Remover leitura direta de store nas telas restantes

**Status:** done  
**Dependencies:** None  

Padronizar páginas e componentes para sessão + API como fontes únicas.

**Details:**

Eliminar dependências diretas de getStore/currentTenant/localStorage em páginas e componentes restantes, usando provider de contexto, clients reais e estado local de UI apenas quando necessário.

### 14.5. Eliminar ramos mortos e reduzir o store legado

**Status:** done  
**Dependencies:** None  

Apagar código morto restante de isRealApiEnabled e encolher a store histórica.

**Details:**

Remover branches mortos, helpers sem uso, caminhos duplicados e estruturas do store/mock que não tenham mais papel operacional após a migração.

### 14.6. Validar fechamento backend-only e documentar checklist final

**Status:** done  
**Dependencies:** None  

Concluir a transição com validação técnica e documentação curta de aceite.

**Details:**

Rodar lint/tsc, revisar Task Master, documentar o que ainda depende de backend e registrar o critério final para considerar o frontend totalmente backend-only.
