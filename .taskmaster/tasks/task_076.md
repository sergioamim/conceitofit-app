# Task ID: 76

**Title:** Tratar rejeições ETL de colaboradores com foco em funções, horários e perfil legado

**Status:** done

**Dependencies:** 74 ✓, 75 ✓

**Priority:** medium

**Description:** Aprimorar o diagnóstico de falhas de importação de colaboradores no frontend administrativo.

**Details:**

A tela ETL deve deixar claro se a rejeição ocorreu na ficha principal do colaborador, no vínculo de função/tipo, no horário semanal ou na reconciliação de perfil legado, com payload útil para correção operacional.

**Test Strategy:**

Cobrir a visualização de rejeições com diferentes origens de erro e ações de reprocesso quando existentes.

## Subtasks

### 76.1. Classificar rejeições por subdomínio de colaboradores

**Status:** done  
**Dependencies:** None  

Separar erros de cadastro, função, horário e perfil legado.

**Details:**

Ajustar a tela/lista de rejeições para agrupar e filtrar falhas específicas do domínio de colaboradores.

### 76.2. Exibir payloads e mensagens acionáveis

**Status:** done  
**Dependencies:** 76.1  

Dar contexto suficiente para correção manual.

**Details:**

Mostrar campos relevantes do CSV e mensagens de erro como função não resolvida, horário inválido, tipo inexistente ou perfil legado sem mapeamento.

### 76.3. Preparar UX para reprocesso seletivo

**Status:** done  
**Dependencies:** 76.1, 76.2  

Conectar o troubleshooting ao fluxo de retry do job.

**Details:**

Quando o backend suportar retry granular, permitir selecionar rejeições de colaboradores por bloco e iniciar reprocessamento com feedback claro.
