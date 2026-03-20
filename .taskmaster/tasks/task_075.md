# Task ID: 75

**Title:** Exibir resumo ETL de colaboradores por bloco importado

**Status:** done

**Dependencies:** 74

**Priority:** high

**Description:** Mostrar no frontend o resultado detalhado da importação de colaboradores enriquecida.

**Details:**

Após a execução do job, o backoffice deve apresentar resumo separado para ficha principal, funções/cargos, tipos operacionais, horários, contratação e perfil legado reconciliado, em vez de tratar “funcionários” como um bloco único opaco.

Subtasks:
- 75.1 Definir contratos de resumo ETL de colaboradores
- 75.2 Renderizar cards/blocos de resultado por domínio
- 75.3 Sinalizar importação parcial com clareza
- 75.4 Conectar navegação para rejeições e diagnóstico

**Test Strategy:**

Cobrir renderização do resumo pós-job com cenários completos, parciais e com rejeições.
