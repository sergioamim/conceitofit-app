# Task ID: 21

**Title:** Construir editor unificado de treino e template

**Status:** done

**Dependencies:** 19, 20

**Priority:** high

**Description:** Implementar a nova tela-base de montagem para `Treino Padrao` e `Treino atribuido`, concentrando no editor a complexidade operacional do modulo.

**Details:**

O editor unificado deve reaproveitar a mesma estrutura para template e treino atribuido, com blocos/series em abas, grade central densa, edicao inline, tecnicas especiais, exportacao e acoes operacionais no topo. O shell precisa assumir como metadados canonicos `nome`, `frequencia semanal`, `total de semanas`, categoria, status e toggle de versao simplificada.

**Test Strategy:**

Validar cenarios de criacao, edicao, reorder, tecnicas especiais, salvar/exportar e consistencia entre template e treino atribuido no editor unificado.

## Subtasks

### 21.1. Criar shell do editor unificado para template e treino atribuido

**Status:** done  
**Dependencies:** None  

Montar a espinha dorsal da experiencia.

**Details:**

Implementar cabeçalho com nome, autor/responsável, ações de salvar/exportar/imprimir/fechar, metadados obrigatorios do template e o layout base compartilhado entre template e treino atribuido.

### 21.2. Implementar blocos e series em abas com CRUD e reorder

**Status:** done  
**Dependencies:** 21.1  

Dar estrutura real ao treino.

**Details:**

Permitir criar, editar, duplicar, remover e reordenar blocos/séries nomeados como abas horizontais (`A`, `B`, `C`, `+`), mantendo o bloco ativo, o drag handle e os estados coerentes.

### 21.3. Implementar grade central com edicao inline por exercicio

**Status:** done  
**Dependencies:** 21.1, 21.2  

Reproduzir a experiencia operacional densa das referencias.

**Details:**

Construir a grade de itens de exercício com edição inline de séries, objetivo, carga, unidade, intervalo, regulagem e observações, incluindo reorder da lista e suporte a campos migrados invalidos para revisao tecnica.

### 21.4. Implementar tecnicas especiais e composicoes por linha

**Status:** done  
**Dependencies:** 21.3  

Fechar os comportamentos mais caracteristicos do editor.

**Details:**

Adicionar suporte a `conjugado`, `progressivo`, `drop-set` e `replicar serie`, com indicacao visual na própria linha, composicoes coerentes e validacoes compativeis com snapshot/publicacao.

### 21.5. Implementar salvar, exportar, imprimir e estados do editor

**Status:** done  
**Dependencies:** 21.3, 21.4  

Concluir a experiencia funcional da montagem.

**Details:**

Finalizar ações de salvar rascunho, enviar para revisao, publicar quando permitido, exportar/imprimir e refletir corretamente os estados de edição, validação e saída do editor.
