# Task ID: 19

**Title:** Definir dominio, contratos e governanca de Treinos V2

**Status:** done

**Dependencies:** None

**Priority:** high

**Description:** Formalizar o dominio funcional de Treinos V2 a partir do PRD consolidado, preparando entidades, contratos e regras de negocio para a implementacao.

**Details:**

Tomar `docs/TREINOS_V2_PRD.md` como fonte de produto e fechar o recorte tecnico do modulo, distinguindo template, treino atribuido, snapshot/versionamento, atribuicao em massa e governanca de revisao/publicacao. O resultado desta task deve deixar backend/frontend alinhados antes da implementacao visual pesada, com artefatos tecnicos em `docs/TREINOS_V2_TECH_SPEC.md`, `src/lib/treinos/v2-domain.ts`, `src/lib/api/treinos-v2.ts` e `src/lib/treinos/v2-backlog.ts`.

**Test Strategy:**

Validar consistencia entre PRD, contratos previstos, permissoes e backlog do modulo; revisar o Task Master e garantir que os criterios de aceite cobrem editor, biblioteca, atribuicao e rastreabilidade.

## Subtasks

### 19.1. Auditar modulo atual de treinos e referencias visuais

**Status:** done  
**Dependencies:** None  

Mapear o que o modulo atual de treinos ja cobre e o que precisa mudar para seguir a experiencia nova.

**Details:**

Comparar as telas atuais do web com as referencias recebidas para listar gaps de listagem, editor, biblioteca de exercicios, tecnicas especiais e atribuicao.

### 19.2. Definir entidades e ciclo de vida de template, treino atribuido e snapshot

**Status:** done  
**Dependencies:** 19.1  

Fechar o modelo conceitual que sustenta a V2.

**Details:**

Especificar claramente `Treino Padrao`, `Treino atribuido`, `Bloco`, `Item de exercicio`, `Snapshot de versao` e `Job de atribuicao em massa`, incluindo estados e transicoes.

### 19.3. Especificar contratos frontend/backend para editor e atribuicao

**Status:** done  
**Dependencies:** 19.2  

Traduzir o dominio em contratos operaveis.

**Details:**

Definir payloads e respostas para listagem de templates, editor unificado, CRUD de exercicios, atribuicao individual, atribuicao em massa, historico e rastreabilidade.

### 19.4. Definir regras de permissao, revisao e publicacao

**Status:** done  
**Dependencies:** 19.2, 19.3  

Garantir governanca do modulo desde o inicio.

**Details:**

Fechar papeis, politicas de publicacao, revisao tecnica, regras de overwrite e limites de quem pode atribuir, revisar, publicar, excluir ou reatribuir treinos.

### 19.5. Validar PRD, contratos e criterios de aceite com o backlog

**Status:** done  
**Dependencies:** 19.3, 19.4  

Concluir a base de planejamento antes da implementacao.

**Details:**

Revisar se os criterios de aceite do PRD cobrem a entrega P0 e garantir que os epicos/subtasks seguintes refletem o recorte final aprovado para a V2.
