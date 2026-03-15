# Task ID: 23

**Title:** Implementar atribuicao individual e em massa de treinos

**Status:** done

**Dependencies:** 19, 20, 21, 22

**Priority:** high

**Description:** Entregar os fluxos de atribuicao a partir de `Treino Padrao`, cobrindo um cliente, varios clientes, snapshot de versao e politicas de conflito.

**Details:**

Esta task fecha o principal ganho operacional da V2: pegar um template pronto e aplicá-lo com segurança a um ou muitos clientes, com rastreabilidade, vigência e controle de overwrite. A atribuicao em massa deve rodar via job assincrono, com lista final de clientes resolvida e resumo terminal por cliente.

**Test Strategy:**

Cobrir cenarios de atribuicao individual e em massa, conflitos com treino ativo, snapshot/versionamento, resumo do resultado e regressao do editor apos atribuir.

## Subtasks

### 23.1. Implementar fluxo de atribuicao para um cliente

**Status:** done  
**Dependencies:** None  

Fechar a acao basica do modulo.

**Details:**

Adicionar modal/drawer para selecionar um cliente, definir vigência, professor responsável, observação, politica de conflito e confirmar a criação do treino atribuído a partir do template com snapshot da versao.

### 23.2. Implementar fluxo de selecao e atribuicao para varios clientes

**Status:** done  
**Dependencies:** 23.1  

Escalar a operacao para lote.

**Details:**

Permitir seleção múltipla manual e por filtros, revisão da lista final e confirmação operacional para aplicar o mesmo template a vários clientes. A aba `Segmento` deve ficar preparada para futuro, mas fora do comportamento funcional P0.

### 23.3. Persistir snapshot e versionamento no momento da atribuicao

**Status:** done  
**Dependencies:** 23.1, 23.2  

Garantir separacao entre origem e instância.

**Details:**

Registrar a versão do template usada, origem da atribuição, snapshot completo do template e vínculo de rastreabilidade para que alterações futuras no template não afetem automaticamente os treinos já atribuídos.

### 23.4. Implementar politicas de conflito e overwrite

**Status:** done  
**Dependencies:** 23.2, 23.3  

Evitar colisão operacional com treinos ativos.

**Details:**

Suportar regras de `manter treino atual`, `substituir treino atual` e `agendar novo`, com feedback claro antes da confirmação e resolucao explicita por cliente no job.

### 23.5. Exibir resumo operacional e historico do resultado da atribuicao

**Status:** done  
**Dependencies:** 23.3, 23.4  

Fechar o fluxo com rastreabilidade e retorno para a operacao.

**Details:**

Apresentar total selecionado, total atribuído, ignorados e motivos, além de manter histórico consultável por template/job/cliente e polling ate estado terminal do job.
