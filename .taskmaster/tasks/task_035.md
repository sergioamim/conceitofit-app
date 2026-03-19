# Task ID: 35

**Title:** Adaptar tela administrativa de NFSe aos novos campos fiscais da reforma tributaria

**Status:** done

**Dependencies:** None

**Priority:** high

**Description:** Atualizar a tela `/administrativo/nfse` para suportar os novos campos obrigatorios da reforma tributaria e alinhar o formulario ao contrato fiscal real do backend.

**Details:**

A tela atual de NFSe do frontend trabalha com um contrato administrativo proprio, centrado em prefeitura, inscricao municipal, CNAE, serie RPS e regime tributario. A adaptacao precisa incorporar os novos campos fiscais obrigatorios, revisar validacoes, checklist, tipagem e estados de UX sem depender de JSONs livres ou placeholders ambiguos.

**Test Strategy:**

Cobrir o adapter e a tela com testes unitarios/componentes para validacao, serializacao e renderizacao dos novos campos, incluindo estados de erro retornados pelo backend fiscal.

## Subtasks

### 35.1. Fechar contrato alvo e lacunas da tela atual

**Status:** done  
**Dependencies:** None  

Comparar o contrato atual do frontend com o novo contrato fiscal do backend e consolidar os gaps funcionais.

**Details:**

Revisar `src/lib/types.ts`, `src/lib/api/admin-financeiro.ts` e `src/app/(app)/administrativo/nfse/page.tsx`, mapeando o que precisa entrar, sair ou ser renomeado para acomodar `codigoTributacaoNacional`, `codigoNbs`, `classificacaoTributaria`, `consumidorFinal` e `indicadorOperacao`.

### 35.2. Atualizar tipos, normalizadores e adapter da configuracao NFSe

**Status:** done  
**Dependencies:** 35.1  

Levar os novos campos fiscais para a camada de tipos e API client do frontend.

**Details:**

Atualizar `NfseConfiguracao`, enums auxiliares, normalizadores, defaults e serializacao em `src/lib/types.ts`, `src/lib/admin-financeiro.ts` e `src/lib/api/admin-financeiro.ts`, mantendo compatibilidade transitória com respostas parciais durante o rollout.

### 35.3. Refatorar formulario e checklist da pagina administrativo/nfse

**Status:** done  
**Dependencies:** 35.2  

Ajustar a UI para editar e validar os novos campos obrigatorios da reforma tributaria.

**Details:**

Atualizar `src/app/(app)/administrativo/nfse/page.tsx` para incluir os novos campos, revisar labels/ajuda contextual, checklist fiscal, feedback de erro e ordem de preenchimento, preservando hidratação estável e sem regressão visual no formulário existente.

### 35.4. Ajustar estados de loading, validação e erro para contrato fiscal novo

**Status:** done  
**Dependencies:** 35.3  

Tratar corretamente bloqueios locais e mensagens acionaveis vindas do backend.

**Details:**

Garantir que a tela apresente erro claro para configuracao incompleta, sucesso de validacao, fallback seguro quando o backend ainda nao devolver todos os campos e mensagens coerentes para operadores administrativos.

### 35.5. Cobrir adapter e pagina com testes

**Status:** done  
**Dependencies:** 35.4  

Fechar a trilha de confianca da configuracao fiscal no frontend.

**Details:**

Criar/atualizar testes para os normalizadores e para a pagina de NFSe, cobrindo renderizacao dos novos campos, validacao local e tratamento de respostas de erro do backend fiscal.
