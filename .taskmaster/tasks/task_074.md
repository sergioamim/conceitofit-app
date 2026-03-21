# Task ID: 74

**Title:** Evoluir tela ETL para malha enriquecida de colaboradores EVO

**Status:** done

**Dependencies:** 10 ✓

**Priority:** high

**Description:** Adaptar a UI de importação ETL para refletir que colaboradores agora dependem de múltiplos arquivos EVO além de `FUNCIONARIOS.csv`.

**Details:**

A tela de importação deve reconhecer e comunicar os arquivos auxiliares de colaboradores (`FUNCIONARIOS_FUNCOES.csv`, `FUNCIONARIOS_FUNCOES_EXERCIDAS.csv`, `FUNCIONARIOS_TIPOS.csv`, `TIPOS_FUNCIONARIOS.csv`, `FUNCIONARIOS_HORARIOS.csv`, `PERMISSOES.csv`), explicando o papel de cada bloco no resultado final da importação.

**Test Strategy:**

Cobrir análise de pacote, seleção/upload e exibição de blocos auxiliares com testes da tela ETL.

## Subtasks

### 74.1. Atualizar catálogo de arquivos reconhecidos para colaboradores

**Status:** done  
**Dependencies:** None  

Exibir os arquivos auxiliares de colaboradores na análise do pacote.

**Details:**

Ajustar a camada de UI da análise do ZIP para identificar e rotular arquivos de funções, tipos, horários e permissões legadas de colaboradores.

### 74.2. Agrupar arquivos por bloco funcional de colaboradores

**Status:** done  
**Dependencies:** 74.1  

Evitar exibir uma lista solta de CSVs sem contexto.

**Details:**

Organizar a visualização em blocos como cadastro principal, cargos/funções, tipos operacionais, horários e perfil legado reconciliado.

### 74.3. Explicar dependências e impacto da ausência de arquivos

**Status:** done  
**Dependencies:** 74.1, 74.2  

Ajudar o operador a entender o que será importado parcialmente.

**Details:**

Exibir mensagens como “sem horários”, “sem tipos operacionais” ou “perfil legado sem reconciliação”, evitando falsa impressão de importação completa.

### 74.4. Atualizar seleção/upload para a malha auxiliar

**Status:** done  
**Dependencies:** 74.1, 74.2, 74.3  

Permitir envio coerente dos arquivos auxiliares quando o fluxo não vier via ZIP completo.

**Details:**

Adequar o formulário de upload avulso/multipart para contemplar os CSVs auxiliares de colaboradores quando o backend expuser essa capacidade.
