# Task ID: 69

**Title:** Implementar listagem e busca de colaboradores alinhadas ao novo backend

**Status:** done

**Dependencies:** 68

**Priority:** high

**Description:** Atualizar a listagem administrativa de colaboradores para refletir o novo perfil operacional e os novos filtros.

**Details:**

A listagem deve suportar status operacional, cargo, acesso ao sistema, flags operacionais e futura leitura de contratos/horarios, consumindo a API nova do backend com tipagem forte e estados de loading/erro consistentes.

Subtasks:
- 69.1 Atualizar clients e schemas de colaboradores
- 69.2 Refatorar tabela/lista de colaboradores
- 69.3 Adicionar filtros operacionais e de acesso
- 69.4 Tratar estados vazios, loading e erro

**Test Strategy:**

Cobrir listagem, filtros, vazios, erro e paginação com testes de componentes ou integração conforme infraestrutura do frontend.
