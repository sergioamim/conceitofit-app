# Task ID: 20

**Title:** Entregar listagem operacional de Treino Padrao

**Status:** done

**Dependencies:** 19

**Priority:** high

**Description:** Construir a nova listagem enxuta de `Treino Padrao`, com busca, tabela paginada e acoes operacionais coerentes com as referencias.

**Details:**

A V1 da listagem deve ser administrativa e rapida, sem inflar a tela com filtros avancados. O foco e localizar templates, criar novos e disparar rapidamente as acoes principais de editar, abrir montagem, atribuir e excluir/arquivar. A listagem so deve mostrar `Treino Padrao`, usar ordenacao padrao por recencia e expor quick filter de revisao apenas quando houver backlog tecnico.

**Test Strategy:**

Executar testes de UI e navegacao cobrindo busca, paginação, ações por linha, loading, erro e estados vazios na listagem de templates.

## Subtasks

### 20.1. Desenhar a UX enxuta da listagem de Treino Padrao

**Status:** done  
**Dependencies:** None  

Traduzir a referencia visual em uma tela administrativa objetiva.

**Details:**

Definir cabeçalho com `Treino Padrao`, busca principal, link `Saiba mais`, CTA `Criar treino padrao` e tabela simples com colunas `Nome do treino`, `Criado por` e `Acoes`, preservando contador de resultados e superficie limpa sem filtros avancados na area principal.

### 20.2. Implementar busca, tabela e paginacao server-side

**Status:** done  
**Dependencies:** 20.1  

Fechar a base operacional da listagem.

**Details:**

Implementar a consulta de templates com busca por nome ou professor, paginação server-side, contador de resultados e ordenacao padrao por recencia, garantindo que a API da tela retorne apenas templates e nunca treinos atribuidos.

### 20.3. Adicionar acoes por linha e tooltips obrigatorios

**Status:** done  
**Dependencies:** 20.2  

Garantir que a operacao principal esteja disponivel sem abrir a edicao completa.

**Details:**

Adicionar ações de `Editar treino`, `Abrir montagem`, `Atribuir treino` e `Excluir/arquivar`, com tooltips explicitos e sem ambiguidades visuais.

### 20.4. Conectar navegacao, permissao e atalhos do modulo

**Status:** done  
**Dependencies:** 20.2, 20.3  

Integrar a listagem ao fluxo geral de treinos.

**Details:**

Garantir que a tela respeite permissões por perfil, navegue corretamente para o editor e os fluxos de atribuição, e preserve o contexto de unidade/professor quando aplicável.

### 20.5. Cobrir loading, empty state, erro e regressao da listagem

**Status:** done  
**Dependencies:** 20.3, 20.4  

Estabilizar a tela antes de avançar para o editor.

**Details:**

Adicionar cobertura para estados vazios, erros de carregamento, paginação, busca e quick filter de revisao quando aplicavel, incluindo testes automatizados e checklist de regressão visual/funcional.
