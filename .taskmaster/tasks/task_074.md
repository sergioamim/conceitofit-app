# Task ID: 74

**Title:** Evoluir tela ETL para malha enriquecida de colaboradores EVO

**Status:** pending

**Dependencies:** 10

**Priority:** high

**Description:** Adaptar a UI de importação ETL para refletir que colaboradores agora dependem de múltiplos arquivos EVO além de `FUNCIONARIOS.csv`.

**Details:**

A tela de importação deve reconhecer e comunicar os arquivos auxiliares de colaboradores (`FUNCIONARIOS_FUNCOES.csv`, `FUNCIONARIOS_FUNCOES_EXERCIDAS.csv`, `FUNCIONARIOS_TIPOS.csv`, `TIPOS_FUNCIONARIOS.csv`, `FUNCIONARIOS_HORARIOS.csv`, `PERMISSOES.csv`), explicando o papel de cada bloco no resultado final da importação.

Subtasks:
- 74.1 Atualizar catálogo de arquivos reconhecidos para colaboradores
- 74.2 Agrupar arquivos por bloco funcional de colaboradores
- 74.3 Explicar dependências e impacto da ausência de arquivos
- 74.4 Atualizar seleção/upload para a malha auxiliar

**Test Strategy:**

Cobrir análise de pacote, seleção/upload e exibição de blocos auxiliares com testes da tela ETL.
