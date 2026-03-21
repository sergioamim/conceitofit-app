# Task ID: 77

**Title:** Ajustar tela ETL para deixar de marcar arquivos auxiliares de colaboradores como ausentes

**Status:** done

**Dependencies:** 74 ✓, 75 ✓, 76 ✓

**Priority:** high

**Description:** Sincronizar a UI de importação com o novo catálogo backend de arquivos auxiliares de colaboradores.

**Details:**

Depois que o backend passar a reconhecer os CSVs auxiliares de colaboradores, a tela ETL deve mostrar presença real desses arquivos no ZIP, refletir os blocos auxiliares corretamente e exibir resumo/rejeições alinhados ao novo contrato.

**Test Strategy:**

Validar análise de pacote, cards de presença/ausência e resumo pós-job com os novos blocos de colaboradores.

## Subtasks

### 77.1. Consumir o catálogo atualizado de arquivos na análise do pacote

**Status:** done  
**Dependencies:** None  

Parar de marcar como ausentes arquivos que o backend passou a reconhecer.

**Details:**

Ajustar o parser/UI da análise do upload para usar o retorno atualizado do backend para funções, tipos, horários e permissões legadas de colaboradores.

### 77.2. Atualizar cards e mensagens da malha de colaboradores

**Status:** done  
**Dependencies:** 77.1  

Refletir corretamente presença, ausência e dependências dos novos arquivos.

**Details:**

Revisar o bloco visual de colaboradores na ETL para mostrar status real por arquivo e por agrupamento funcional.

### 77.3. Sincronizar resumo e rejeições com o contrato expandido

**Status:** done  
**Dependencies:** 77.1, 77.2  

Exibir os novos blocos de resultado da importação de colaboradores.

**Details:**

Ajustar a tela de histórico/detalhe do job para exibir resultados e rejeições de funções, tipos, horários e perfil legado quando o backend os retornar.

### 77.4. Cobrir a regressão visual da ETL de colaboradores

**Status:** done  
**Dependencies:** 77.1, 77.2, 77.3  

Garantir que a UI não volte a acusar falso ausente.

**Details:**

Adicionar testes da análise do pacote e do resumo do job com exemplos contendo os arquivos auxiliares reais de colaboradores.
