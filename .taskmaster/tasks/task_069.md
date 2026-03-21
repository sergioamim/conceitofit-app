# Task ID: 69

**Title:** Implementar listagem e busca de colaboradores alinhadas ao novo backend

**Status:** done

**Dependencies:** 68 ✓

**Priority:** high

**Description:** Atualizar a listagem administrativa de colaboradores para refletir o novo perfil operacional e os novos filtros.

**Details:**

A listagem deve suportar status operacional, cargo, acesso ao sistema, flags operacionais e futura leitura de contratos/horarios, consumindo a API nova do backend com tipagem forte e estados de loading/erro consistentes.

**Test Strategy:**

Cobrir listagem, filtros, vazios, erro e paginação com testes de componentes ou integração conforme infraestrutura do frontend.

## Subtasks

### 69.1. Atualizar clients e schemas de colaboradores

**Status:** done  
**Dependencies:** None  

Alinhar a camada de consumo do frontend ao novo contrato.

**Details:**

Criar/ajustar `src/lib/api` para suportar listagem, detalhe e mutacoes de colaboradores com os novos campos e enums.

### 69.2. Refatorar tabela/lista de colaboradores

**Status:** done  
**Dependencies:** 69.1  

Exibir dados operacionais relevantes na listagem.

**Details:**

Incluir nome, cargo, status, acesso ao sistema, unidade, telefone/email principal e indicadores operacionais sem poluir a tela.

### 69.3. Adicionar filtros operacionais e de acesso

**Status:** done  
**Dependencies:** 69.1, 69.2  

Permitir localizar colaboradores por estados de trabalho e acesso.

**Details:**

Implementar filtros por status operacional, acesso criado, cargo, permissao de aulas, catraca, bloqueio e busca textual.

### 69.4. Tratar estados vazios, loading e erro

**Status:** done  
**Dependencies:** 69.2, 69.3  

Fechar a UX da listagem em cenarios reais.

**Details:**

Garantir placeholders, erros de API, mensagens de contexto e ações de retry, sem depender de mocks silenciosos.
