# Task ID: 455

**Title:** Fechar testes, documentacao e rollout da nova taxonomia de rotas

**Status:** done

**Dependencies:** 450 ✓, 451 ✓, 452 ✓, 453 ✓, 454 ✓

**Priority:** medium

**Description:** Atualizar documentacao, cobrir as novas superficies com smoke tests e consolidar o plano de rollout e rollback.

**Details:**

Atualizar docs de estrutura e navegacao do frontend para refletir a nova taxonomia de rotas. Criar ou ajustar uma matriz de testes cobrindo /, /b2b, /adesao, /storefront, /login, /dashboard e /admin, incluindo rewrites por subdominio e not-found do storefront. Revisar analytics, monitoramento e logs para nao misturar trafego publico e operacional. Registrar um checklist simples de rollout e rollback.

**Test Strategy:**

Validacao final: executar a matriz de smoke das superficies publica, auth, portal, backoffice e subdominio do storefront; revisar documentacao e checklist de rollout antes de concluir a trilha.
