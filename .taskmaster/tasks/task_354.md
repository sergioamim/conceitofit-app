# Task ID: 354

**Title:** Corrigir guards de auth contextualizada, rede e primeiro acesso

**Status:** done

**Dependencies:** 348 ✓, 351 ✓

**Priority:** high

**Description:** Eliminar os estados de loading infinito e travas de guard nos fluxos de login por rede, primeiro acesso e onboarding completo.

**Details:**

Escopo: `tests/e2e/auth-rede.spec.ts`, `tests/e2e/onboarding-fluxo-completo.spec.ts` e fluxos compartilhados de credencial contextualizada. Evidências atuais: `Carregando contexto da rede...` em `test-results/auth-rede-acesso-por-rede--3dc7c-ogin-exigir-primeiro-acesso-chromium/error-context.md` e `Validando contexto do primeiro acesso...` em `test-results/onboarding-fluxo-completo--197d5-conclui-o-checklist-inicial-chromium/error-context.md`. Revisar `src/components/auth/network-access-flow.tsx`, `src/components/auth/forced-password-change-flow.tsx`, bootstrap contextual, timeout/fallback de guard e transições após resolução de contexto. Fora de escopo: reescrever contrato de autenticação do backend. O foco é garantir que a UI sempre avance para formulário, fallback ou erro visível.

**Test Strategy:**

Executar `tests/e2e/auth-rede.spec.ts` e `tests/e2e/onboarding-fluxo-completo.spec.ts` em chromium. Confirmar que os fluxos deixam de parar em estados intermediários de “carregando/validando contexto” e que os redirecionamentos de primeiro acesso convergem.
