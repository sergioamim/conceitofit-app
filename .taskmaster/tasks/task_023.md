# Task ID: 23

**Title:** Implementar atribuicao individual e em massa de treinos

**Status:** done

**Dependencies:** 19 ✓, 20 ✓, 21 ✓, 22 ✓

**Priority:** high

**Description:** Entregar os fluxos de atribuicao a partir de `Treino Padrao`, cobrindo um cliente, varios clientes, snapshot de versao e politicas de conflito.

**Details:**

Esta task fecha o principal ganho operacional da V2: pegar um template pronto e aplica-lo com seguranca a um ou muitos clientes, com rastreabilidade, vigencia e controle de overwrite. A atribuicao em massa deve rodar via job assincrono, com lista final de clientes resolvida e resumo terminal por cliente.

**Test Strategy:**

Cobrir cenarios de atribuicao individual e em massa, conflitos com treino ativo, snapshot/versionamento, resumo do resultado e regressao do editor apos atribuir.

## Subtasks

### 23.1. Implementar fluxo de atribuicao para um cliente

**Status:** done  
**Dependencies:** None  

Fechar a acao basica do modulo.

**Details:**

Adicionar modal/drawer para selecionar um cliente, definir vigencia, professor responsavel, observacao, politica de conflito e confirmar a criacao do treino atribuido a partir do template com snapshot da versao.

### 23.2. Implementar fluxo de selecao e atribuicao para varios clientes

**Status:** done  
**Dependencies:** 23.1  

Escalar a operacao para lote.

**Details:**

Permitir selecao multipla manual e por filtros, revisao da lista final e confirmacao operacional para aplicar o mesmo template a varios clientes. A aba `Segmento` deve ficar preparada para futuro, mas fora do comportamento funcional P0.

### 23.3. Persistir snapshot e versionamento no momento da atribuicao

**Status:** done  
**Dependencies:** 23.1, 23.2  

Garantir separacao entre origem e instancia.

**Details:**

Registrar a versao do template usada, origem da atribuicao, snapshot completo do template e vinculo de rastreabilidade para que alteracoes futuras no template nao afetem automaticamente os treinos ja atribuidos.

### 23.4. Implementar politicas de conflito e overwrite

**Status:** done  
**Dependencies:** 23.2, 23.3  

Evitar colisao operacional com treinos ativos.

**Details:**

Suportar regras de `manter treino atual`, `substituir treino atual` e `agendar novo`, com feedback claro antes da confirmacao e resolucao explicita por cliente no job.

### 23.5. Exibir resumo operacional e historico do resultado da atribuicao

**Status:** done  
**Dependencies:** 23.3, 23.4  

Fechar o fluxo com rastreabilidade e retorno para a operacao.

**Details:**

Apresentar total selecionado, total atribuido, ignorados e motivos, alem de manter historico consultavel por template/job/cliente e polling ate estado terminal do job.
