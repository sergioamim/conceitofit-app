# Task ID: 24

**Title:** Fechar revisao, publicacao e operacao pos-atribuicao de Treinos V2

**Status:** done

**Dependencies:** 21 ✓, 23 ✓

**Priority:** medium

**Description:** Concluir a governanca operacional do modulo com revisao/publicacao de templates, visao de treinos atribuidos e rastreabilidade completa da origem e da versao.

**Details:**

Depois de listagem, editor, biblioteca e atribuicao, falta consolidar a camada de governanca: status de template, fila de revisao, operacao sobre treinos atribuidos e indicadores que permitam acompanhar quem recebeu qual versao. Exportar treino de cliente como template e importar do ADM Geral continuam fora do P0 e nao devem poluir esta task.

**Test Strategy:**

Executar testes cobrindo revisao/publicacao, gestao de treinos atribuidos, rastreabilidade de versao/origem e navegacao ponta a ponta entre template, atribuicao e operacao pos-atribuicao.

## Subtasks

### 24.1. Implementar status e ciclo de vida de templates

**Status:** done  
**Dependencies:** None  

Formalizar a governanca dos templates.

**Details:**

Adicionar estados de `rascunho`, `em revisao`, `publicado` e `arquivado`, com guardas e acoes coerentes para cada perfil e bloqueio de publicacao para templates invalidos ou com migracao nao revisada.

### 24.2. Expor fila e indicadores de revisao na operacao

**Status:** done  
**Dependencies:** 24.1  

Dar visibilidade ao trabalho tecnico pendente.

**Details:**

Exibir badges, filtros e indicadores para templates que precisam revisao, facilitando a atuacao do coordenador tecnico antes da publicacao e integrando o quick filter da listagem.

### 24.3. Implementar listagem e gestao de treinos atribuidos

**Status:** done  
**Dependencies:** 24.1  

Fechar a visao operacional apos a atribuicao.

**Details:**

Criar a tela/listagem de treinos atribuidos com filtros por cliente, professor, status, vigencia, origem e unidade, alem de acoes como abrir, editar, encerrar, duplicar e reatribuir, sempre separada da listagem de templates.

### 24.4. Implementar rastreabilidade de origem, versao e atribuicoes

**Status:** done  
**Dependencies:** 24.2, 24.3  

Tornar a auditoria do modulo legivel para operacao e gestao.

**Details:**

Exibir claramente template de origem, versao aplicada, snapshot vinculado, historico de atribuicoes e contagem de clientes impactados por template.

### 24.5. Fechar testes end-to-end e documentacao operacional do modulo

**Status:** done  
**Dependencies:** 24.2, 24.3, 24.4  

Concluir a entrega com previsibilidade operacional.

**Details:**

Adicionar cobertura automatizada e documentacao operacional para a trilha completa de Treinos V2, da criacao do template a gestao do treino atribuido.
