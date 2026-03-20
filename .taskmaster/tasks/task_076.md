# Task ID: 76

**Title:** Tratar rejeições ETL de colaboradores com foco em funções, horários e perfil legado

**Status:** pending

**Dependencies:** 74, 75

**Priority:** medium

**Description:** Aprimorar o diagnóstico de falhas de importação de colaboradores no frontend administrativo.

**Details:**

A tela ETL deve deixar claro se a rejeição ocorreu na ficha principal do colaborador, no vínculo de função/tipo, no horário semanal ou na reconciliação de perfil legado, com payload útil para correção operacional.

Subtasks:
- 76.1 Classificar rejeições por subdomínio de colaboradores
- 76.2 Exibir payloads e mensagens acionáveis
- 76.3 Preparar UX para reprocesso seletivo

**Test Strategy:**

Cobrir a visualização de rejeições com diferentes origens de erro e ações de reprocesso quando existentes.
