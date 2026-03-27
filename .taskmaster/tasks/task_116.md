# Task ID: 116

**Title:** Componentizar importacao-evo-p0/page.tsx (4.776 linhas)

**Status:** done

**Dependencies:** None

**Priority:** high

**Description:** Refatorar o maior arquivo do projeto (src/app/(backoffice)/admin/importacao-evo-p0/page.tsx com 4.776 linhas) em componentes menores e bem delimitados. Separar em módulos lógicos: upload de arquivo, mapeamento de colunas, validação de dados, preview de importação e execução/resultado.

**Details:**

O arquivo concentra todo o fluxo de importação de dados do sistema EVO legado em uma única page.tsx. Identificar os blocos funcionais (upload CSV/Excel, mapeamento de campos fonte→destino, validação com feedback por linha, preview dos dados prontos para importar, execução com progresso e resumo de resultado) e extrair cada um para um componente dedicado em src/components/backoffice/importacao-evo/. Manter o estado compartilhado via props ou context local. Preservar o comportamento atual sem alterar lógica de negócio. Meta: nenhum componente resultante com mais de 500 linhas.

**Test Strategy:**

Percorrer o fluxo completo de importação EVO: upload de arquivo, mapeamento, validação, preview e execução. Conferir que o comportamento é idêntico ao anterior. Verificar que nenhum arquivo resultante excede 500 linhas.

## Subtasks

### 116.1. Extrair componente de upload de arquivo CSV/Excel

**Status:** done  
**Dependencies:** None  

Mover lógica de seleção, parsing e preview inicial do arquivo para src/components/backoffice/importacao-evo/upload-step.tsx

### 116.2. Extrair componente de mapeamento de colunas

**Status:** done  
**Dependencies:** 116.1  

Separar UI de mapeamento fonte→destino com drag/select para src/components/backoffice/importacao-evo/mapping-step.tsx

### 116.3. Extrair componente de validação com feedback por linha

**Status:** done  
**Dependencies:** 116.2  

Mover validação de dados e exibição de erros/warnings por linha para src/components/backoffice/importacao-evo/validation-step.tsx

### 116.4. Extrair componente de preview dos dados mapeados

**Status:** done  
**Dependencies:** 116.3  

Separar tabela de preview com dados prontos para importação para src/components/backoffice/importacao-evo/preview-step.tsx

### 116.5. Extrair componente de execução e resumo de resultado

**Status:** done  
**Dependencies:** 116.4  

Mover barra de progresso, execução da importação e resumo final para src/components/backoffice/importacao-evo/execution-step.tsx. Orquestrar steps na page.tsx reduzida.
