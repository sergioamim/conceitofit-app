# Task ID: 22

**Title:** Evoluir biblioteca de exercicios e drawer de cadastro

**Status:** done

**Dependencies:** 19, 21

**Priority:** high

**Description:** Transformar a biblioteca lateral de exercicios em um componente central do editor, com busca, filtros, insercao rapida e drawer de criacao/edicao.

**Details:**

A biblioteca deve permitir encontrar, criar e reaproveitar exercícios sem sair do contexto da montagem. O drawer lateral deve sustentar o cadastro rico de exercício, incluindo codigo, grupo de exercicios, grupo muscular, tipo, objetivo padrao, unidade de carga, mídia, descrição e disponibilidade no app.

**Test Strategy:**

Executar testes cobrindo busca, filtros, criacao/edicao de exercicio, insercao rapida no treino e validacoes do cadastro no drawer lateral.

## Subtasks

### 22.1. Revisar taxonomia e filtros da biblioteca de exercicios

**Status:** done  
**Dependencies:** None  

Preparar a base de busca e classificacao do catalogo.

**Details:**

Revisar grupos de exercicios, grupos musculares, tipos de exercicio, objetivo padrao, similares e filtros operacionais para garantir uma biblioteca utilizavel no editor.

### 22.2. Implementar painel lateral com busca e insercao rapida

**Status:** done  
**Dependencies:** 22.1  

Conectar o catalogo diretamente a montagem do treino.

**Details:**

Adicionar busca instantanea, listagem lateral, CTA `Novo exercicio` e ação `+` para inserir itens no bloco ativo sem sair do editor.

### 22.3. Implementar drawer de criacao e edicao de exercicio

**Status:** done  
**Dependencies:** 22.1, 22.2  

Permitir gestao do catalogo dentro do fluxo.

**Details:**

Construir o drawer com campos de nome, código, grupo de exercícios, grupo muscular, tipo, objetivo padrao, unidade de carga e descrições, seguindo a lógica das telas de referência.

### 22.4. Suportar midia, descricao rica e flag de exibicao no app

**Status:** done  
**Dependencies:** 22.3  

Enriquecer a qualidade do exercício cadastrado.

**Details:**

Adicionar mídia (`imagem`, `gif`, `video`), editor de descrição, opção de exibição no app do cliente e regras de validação compatíveis com o consumo no app e no snapshot do treino atribuido.

### 22.5. Implementar similares, validacoes e reutilizacao no editor

**Status:** done  
**Dependencies:** 22.3, 22.4  

Fechar o ciclo de catalogo até a montagem.

**Details:**

Exibir exercícios similares, validar cadastros inconsistentes e garantir que um exercício criado/atualizado possa ser reutilizado imediatamente na biblioteca do editor e nos itens ja em montagem.
