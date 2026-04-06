# Task ID: 474

**Title:** Runbook de incidentes e alertas operacionais

**Status:** pending

**Dependencies:** 471, 473

**Priority:** medium

**Description:** Criar runbook documentado para incidentes comuns e configurar alertas proativos no Sentry.

**Details:**

Documentar em docs/RUNBOOK_INCIDENTES.md: (1) Erro 500 em produção — como investigar no Sentry, (2) Backend indisponível — como verificar e escalar, (3) Sessão inválida em massa — como diagnosticar e mitigar, (4) Tenant data leak — procedimento de emergência, (5) Degradação de performance — como identificar no Sentry. Configurar alertas no Sentry: (a) >10 errors/hour em uma página, (b) >50% de error rate em um endpoint, (c) LCP >4s em qualquer página, (d) Crash de JS em >5% de sessions.

**Test Strategy:**

Revisão manual do runbook por tech lead. Simulação de incidente para validar procedimento.
