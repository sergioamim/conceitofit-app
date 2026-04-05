# Task ID: 435

**Title:** Redesenhar página Entrar como Academia com SuggestionInput e recentes

**Status:** done

**Dependencies:** 433 ✓

**Priority:** high

**Description:** Substituir grid de cards por SuggestionInput proeminente + seção de acessos recentes para escalar com centenas de academias.

**Details:**

A página /admin/entrar-como-academia exibe grid de cards com todas as academias — não escala. Redesenhar para: (1) SuggestionInput proeminente centralizado no topo para buscar academia usando useAcademiaSuggestion, (2) Seção "Acessos recentes" mostrando as 5 últimas academias acessadas — persistir IDs em localStorage, ler após mount via useEffect (SSR-safe), exibir como cards compactos com nome e botão "Entrar", (3) Ao selecionar academia no SuggestionInput, exibir unidades com SuggestionInput secundário (useUnidadeSuggestion) ou lista curta se poucas unidades, (4) Botão "Entrar" para executar impersonation. Manter audit trail existente.

**Test Strategy:**

Teste E2E: navegar para /admin/entrar-como-academia, verificar SuggestionInput presente, buscar academia, selecionar, verificar unidades carregadas, executar "Entrar" e verificar redirect correto.
