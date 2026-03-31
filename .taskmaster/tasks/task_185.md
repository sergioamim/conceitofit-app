# Task ID: 185

**Title:** Quebrar páginas com mais de 1000 linhas em componentes menores

**Status:** done

**Dependencies:** 179 ✓, 180 ✓

**Priority:** low

**Description:** 14 páginas excedem 1000 linhas misturando lógica de negócio e apresentação.

**Details:**

Páginas alvo (após importacao-evo-p0 que tem task própria): clientes/[id] (1476 linhas), seguranca/usuarios/[id] (1208), seguranca/rbac (1113), treinos (1042), admin/unidades (950), admin/seguranca/usuarios (942). Para cada: extrair hooks de workspace, separar modais em arquivo próprio, criar componentes de seção. Meta: nenhuma page.tsx > 400 linhas.

**Test Strategy:**

Funcionalidades existentes continuam operando. Navegação e interação sem regressão. Cada page.tsx < 400 linhas.
