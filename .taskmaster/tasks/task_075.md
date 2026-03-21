# Task ID: 75

**Title:** Exibir resumo ETL de colaboradores por bloco importado

**Status:** done

**Dependencies:** 74 ✓

**Priority:** high

**Description:** Mostrar no frontend o resultado detalhado da importação de colaboradores enriquecida.

**Details:**

Após a execução do job, o backoffice deve apresentar resumo separado para ficha principal, funções/cargos, tipos operacionais, horários, contratação e perfil legado reconciliado, em vez de tratar “funcionários” como um bloco único opaco.

**Test Strategy:**

Cobrir renderização do resumo pós-job com cenários completos, parciais e com rejeições.

## Subtasks

### 75.1. Definir contratos de resumo ETL de colaboradores

**Status:** done  
**Dependencies:** None  

Preparar a camada tipada para os novos contadores e blocos.

**Details:**

Ajustar types/clients da tela ETL para consumir contadores e métricas detalhadas do bloco de colaboradores quando o backend os expuser.

### 75.2. Renderizar cards/blocos de resultado por domínio

**Status:** done  
**Dependencies:** 75.1  

Exibir importação de colaboradores com granularidade útil.

**Details:**

Criar UI para separar o resultado em cadastro principal, funções, tipos, horários, contratação e perfil legado, com totais de processados, criados, atualizados e rejeitados.

### 75.3. Sinalizar importação parcial com clareza

**Status:** done  
**Dependencies:** 75.1, 75.2  

Evitar leitura enganosa do sucesso do job.

**Details:**

Mostrar alertas quando o colaborador foi importado sem horários, sem função resolvida ou sem reconciliação de perfil legado.

### 75.4. Conectar navegação para rejeições e diagnóstico

**Status:** done  
**Dependencies:** 75.2, 75.3  

Facilitar troubleshooting do operador.

**Details:**

Adicionar links/ações para abrir rejeições específicas de colaboradores e seus subblocos diretamente da visão de resumo.
