# Task ID: 484

**Title:** Code splitting agressivo com dynamic imports para páginas pesadas

**Status:** pending

**Dependencies:** None

**Priority:** medium

**Description:** Adicionar dynamic imports (next/dynamic) para páginas e componentes pesados do portal, reduzindo bundle inicial.

**Details:**

Identificar e aplicar dynamic imports em: (1) Treino V2 Editor (978 LOC) — carregar sob demanda, (2) CRM Playbooks (806 LOC) — carregar sob demanda, (3) Importação EVO (815 LOC) — carregar sob demanda, (4) Grade de aulas — carregar sob demanda, (5) Componentes de modal pesados — lazy load, (6) Chart/BI components — lazy load. Configurar loading states com skeleton consistent. Manter componentes críticos (dashboard, sidebar) no bundle inicial.

**Test Strategy:**

Lighthouse CI compara bundle size antes/depois. Teste E2E: páginas com dynamic import carregam corretamente com loading skeleton. Verificar que funcionalidade não é afetada.
