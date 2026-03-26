# Task ID: 98

**Title:** Consolidar política de motion com reduced motion e custo controlado

**Status:** done

**Dependencies:** 94 ✓

**Priority:** high

**Description:** Transformar motion em uma camada compartilhada do projeto, com fallback consistente para `prefers-reduced-motion` e sem dependência espalhada sem propósito claro.

**Details:**

Revisar o que restou da task 94, decidir a política padrão de motion do app, centralizar timings/curvas/opt-out para movimento reduzido e remover efeitos redundantes ou caros que não entregam valor proporcional. Esta tarefa pode rodar em paralelo com 96 e 97.

**Test Strategy:**

Validar navegação, feedback tátil e overlays com motion habilitado e com `prefers-reduced-motion`; confirmar consistência visual e ausência de regressões de UX ou bundle desnecessário.

## Subtasks

### 98.1. Inventariar animações atuais e definir a matriz de motion do app

**Status:** done  
**Dependencies:** None  

Separar animações estruturais, táteis e cosméticas para decidir o que permanece.

**Details:**

Mapear `StatusBadge`, botões, palette, sidebar e quaisquer resquícios de `template.tsx`, classificando cada animação por valor de UX, custo de manutenção e necessidade de fallback para movimento reduzido.

### 98.2. Criar camada compartilhada de motion e reduced motion

**Status:** done  
**Dependencies:** 98.1  

Centralizar helpers, variantes ou hooks usados pelas animações permitidas.

**Details:**

Implementar uma camada reutilizável para motion com tokens de duração/easing e suporte automático a `prefers-reduced-motion`, evitando decisões isoladas dentro de cada componente.

### 98.3. Migrar componentes animados para a política consolidada

**Status:** done  
**Dependencies:** 98.2  

Aplicar a camada shared apenas onde o movimento agrega valor real.

**Details:**

Refatorar os componentes que hoje animam por CSS solto ou `framer-motion` direto para usar a política shared, removendo código redundante e limpando dependências/arquivos que não sustentem um caso de uso claro.
