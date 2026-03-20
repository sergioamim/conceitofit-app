# Task ID: 77

**Title:** Ajustar tela ETL para deixar de marcar arquivos auxiliares de colaboradores como ausentes

**Status:** done

**Dependencies:** 74, 75, 76

**Priority:** high

**Description:** Sincronizar a UI de importação com o novo catálogo backend de arquivos auxiliares de colaboradores.

**Details:**

Depois que o backend passar a reconhecer os CSVs auxiliares de colaboradores, a tela ETL deve mostrar presença real desses arquivos no ZIP, refletir os blocos auxiliares corretamente e exibir resumo/rejeições alinhados ao novo contrato.

Subtasks:
- 77.1 Consumir o catálogo atualizado de arquivos na análise do pacote
- 77.2 Atualizar cards e mensagens da malha de colaboradores
- 77.3 Sincronizar resumo e rejeições com o contrato expandido
- 77.4 Cobrir a regressão visual da ETL de colaboradores

**Test Strategy:**

Validar análise de pacote, cards de presença/ausência e resumo pós-job com os novos blocos de colaboradores.
