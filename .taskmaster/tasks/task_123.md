# Task ID: 123

**Title:** Implementar theme toggle (dark/light mode)

**Status:** done

**Dependencies:** None

**Priority:** low

**Description:** Adicionar suporte a tema claro além do dark atual, com toggle na sidebar e persistência da preferência do usuário. Instalar next-themes e adaptar as CSS variables do globals.css para suportar ambos os temas.

**Details:**

Instalar next-themes. Configurar ThemeProvider no root layout com attribute="class", defaultTheme="dark" e storageKey para persistência. Criar CSS variables para light mode em globals.css (inverter surfaces, borders, text colors mantendo o gym-accent como identidade). Adicionar botão de toggle (Sun/Moon icons) na sidebar, próximo ao perfil do usuário. Revisar componentes que usam classes hardcoded de cor (ex: bg-card, text-foreground) para garantir que respondem ao tema. Não alterar o dark theme atual — apenas adicionar a alternativa light.

**Test Strategy:**

Alternar entre dark e light em várias páginas (dashboard, vendas, clientes, administrativo). Verificar que cores, contraste e legibilidade estão adequados em ambos. Recarregar a página e confirmar que a preferência persiste. Testar em mobile.

## Subtasks

### 123.1. Instalar next-themes e configurar ThemeProvider

**Status:** done  
**Dependencies:** None  

Instalar next-themes, adicionar ThemeProvider no root layout com attribute=class, defaultTheme=dark e storageKey.

### 123.2. Criar CSS variables para light mode

**Status:** done  
**Dependencies:** 123.1  

Adicionar variantes light em globals.css invertendo surfaces, borders e text colors. Manter gym-accent como identidade em ambos os temas.

### 123.3. Adicionar toggle na sidebar e validar componentes

**Status:** done  
**Dependencies:** 123.2  

Criar botão Sun/Moon na sidebar. Revisar componentes com cores hardcoded para garantir resposta ao tema. Testar ambos os modos.
