# Task ID: 99

**Title:** Refatorar estratégia de foco e acessibilidade por primitives

**Status:** done

**Dependencies:** 93 ✓, 96 ✓, 97 ✓, 98 ✓

**Priority:** high

**Description:** Substituir o foco global agressivo por uma política previsível de foco nos primitives e componentes compartilhados do design system.

**Details:**

Revisar a task 93 para preservar os ganhos de acessibilidade sem depender de `*:focus-visible`, migrando a estratégia para tokens/classes/componentes base, validando navegação por teclado e evitando ring duplicado ou styling conflitante. Esta é a última etapa da proposta e só deve começar após 96, 97 e 98.

**Test Strategy:**

Navegar por teclado nos principais fluxos operacionais, validar contraste e foco visível em `Button`, `Input`, `Select`, `Tabs`, links e componentes Radix, e confirmar ausência de regressões visuais no shell.

## Subtasks

### 99.1. Mapear conflitos entre foco global e primitives existentes

**Status:** done  
**Dependencies:** None  

Identificar onde o foco está duplicado, inconsistente ou difícil de manter.

**Details:**

Levantar conflitos entre `globals.css` e os primitives/shared components (`Button`, `Input`, `Select`, `Tabs`, links de navegação e afins), priorizando os pontos que hoje recebem ring duplo ou offsets inconsistentes.

### 99.2. Definir tokens e utilitários compartilhados para focus ring

**Status:** done  
**Dependencies:** 99.1  

Criar uma convenção única para foco visível e acessível no design system.

**Details:**

Extrair a aparência de foco para classes/tokens reutilizáveis, mantendo o mínimo realmente global e delegando estilo específico aos primitives e componentes compartilhados.

### 99.3. Migrar primitives e remover a regra global agressiva

**Status:** done  
**Dependencies:** 99.2  

Levar a nova política para os componentes-base e simplificar o CSS global.

**Details:**

Atualizar os primitives prioritários e componentes compartilhados para usar a nova convenção de foco, simplificando `globals.css` e preservando skip links e demais recursos de acessibilidade criados antes.
