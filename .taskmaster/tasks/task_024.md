# Task ID: 24

**Title:** Fechar revisao, publicacao e operacao pos-atribuicao de Treinos V2

**Status:** done

**Dependencies:** 21, 23

**Priority:** medium

**Description:** Concluir a governanca operacional do modulo com revisao/publicacao de templates, visao de treinos atribuidos e rastreabilidade completa da origem e da versao.

**Details:**

Depois de listagem, editor, biblioteca e atribuicao, falta consolidar a camada de governanca: status de template, fila de revisão, operação sobre treinos atribuídos e indicadores que permitam acompanhar quem recebeu qual versão. Exportar treino de cliente como template e importar do ADM Geral continuam fora do P0 e nao devem poluir esta task.

**Test Strategy:**

Executar testes cobrindo revisão/publicação, gestão de treinos atribuídos, rastreabilidade de versão/origem e navegação ponta a ponta entre template, atribuição e operação pós-atribuição.

## Subtasks

### 24.1. Implementar status e ciclo de vida de templates

**Status:** done  
**Dependencies:** None  

Formalizar a governanca dos templates.

**Details:**

Adicionar estados de `rascunho`, `em revisao`, `publicado` e `arquivado`, com guardas e ações coerentes para cada perfil e bloqueio de publicacao para templates invalidos ou com migracao nao revisada.

### 24.2. Expor fila e indicadores de revisao na operacao

**Status:** done  
**Dependencies:** 24.1  

Dar visibilidade ao trabalho tecnico pendente.

**Details:**

Exibir badges, filtros e indicadores para templates que precisam revisão, facilitando a atuação do coordenador técnico antes da publicação e integrando o quick filter da listagem.

### 24.3. Implementar listagem e gestao de treinos atribuidos

**Status:** done  
**Dependencies:** 24.1  

Fechar a visao operacional apos a atribuicao.

**Details:**

Criar a tela/listagem de treinos atribuídos com filtros por cliente, professor, status, vigência, origem e unidade, além de ações como abrir, editar, encerrar, duplicar e reatribuir, sempre separada da listagem de templates.

### 24.4. Implementar rastreabilidade de origem, versao e atribuicoes

**Status:** done  
**Dependencies:** 24.2, 24.3  

Tornar a auditoria do modulo legivel para operacao e gestao.

**Details:**

Exibir claramente template de origem, versão aplicada, snapshot vinculado, histórico de atribuições e contagem de clientes impactados por template.

### 24.5. Fechar testes end-to-end e documentacao operacional do modulo

**Status:** done  
**Dependencies:** 24.2, 24.3, 24.4  

Concluir a entrega com previsibilidade operacional.

**Details:**

Adicionar cobertura automatizada e documentação operacional para a trilha completa de Treinos V2, da criação do template à gestão do treino atribuído.
