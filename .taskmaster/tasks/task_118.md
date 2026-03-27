# Task ID: 118

**Title:** Refatorar treino-v2-editor.tsx (2.190 linhas)

**Status:** done

**Dependencies:** None

**Priority:** medium

**Description:** Extrair o editor de treinos V2 (src/components/treinos/treino-v2-editor.tsx, 2.190 linhas) em componentes menores: formulário principal, seletor de exercícios, preview do treino, gerenciador de séries e validação.

**Details:**

O componente concentra formulário de treino, busca e seleção de exercícios, configuração de séries/repetições/carga, reordenação drag-and-drop, preview formatado e validação. Separar em componentes dedicados em src/components/treinos/editor/ (ex: treino-form.tsx, exercicio-selector.tsx, serie-config.tsx, treino-preview.tsx). Manter estado compartilhado via props drilling ou context local do editor. Meta: nenhum componente resultante com mais de 400 linhas.

**Test Strategy:**

Criar e editar um treino completo com múltiplos exercícios e séries. Verificar reordenação, validação e preview. Confirmar comportamento idêntico ao anterior.

## Subtasks

### 118.1. Extrair formulário principal do treino

**Status:** done  
**Dependencies:** None  

Mover campos de nome, tipo, descrição e configurações gerais para src/components/treinos/editor/treino-form.tsx

### 118.2. Extrair seletor/busca de exercícios

**Status:** done  
**Dependencies:** None  

Separar busca, filtragem e adição de exercícios ao treino para src/components/treinos/editor/exercicio-selector.tsx

### 118.3. Extrair configuração de séries por exercício

**Status:** done  
**Dependencies:** 118.2  

Mover UI de séries/repetições/carga/descanso para src/components/treinos/editor/serie-config.tsx

### 118.4. Extrair preview e validação final

**Status:** done  
**Dependencies:** 118.1, 118.3  

Separar preview formatado do treino e validação para src/components/treinos/editor/treino-preview.tsx. Orquestrar no editor principal reduzido.
