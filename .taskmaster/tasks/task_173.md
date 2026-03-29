# Task ID: 173

**Title:** Ampliar cobertura de testes unitarios com Testing Library

**Status:** done

**Dependencies:** 164 ✓

**Priority:** low

**Description:** testing-library/react instalada mas subutilizada. Apenas 3 testes unitarios de utilitarios, zero de componentes React.

**Details:**

Criar testes de componentes: StatusBadge (cada status), PlanoSelectorCard (valores, destaque, selecao), DemoBanner (aparece com ?demo=1, dismiss), LeadB2bForm (validacao, sucesso), DemoForm (validacao, toggle senha), PublicJourneyShell (steps, tenant switcher), Formatters (formatBRL, formatDate, formatPercent). Cada componente com 3-5 cenarios.

**Test Strategy:**

npx vitest run passa com todos os novos testes. Cobertura de componentes > 30%.
