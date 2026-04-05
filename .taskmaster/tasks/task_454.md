# Task ID: 454

**Title:** Transformar / em landing institucional do SaaS com transicao segura para usuarios autenticados

**Status:** done

**Dependencies:** 449 ✓

**Priority:** medium

**Description:** Substituir o redirect bruto da home por uma landing institucional, definindo o comportamento ideal para usuarios autenticados.

**Details:**

Trocar o redirect atual de src/app/page.tsx por uma home institucional focada em descoberta, captacao e auto-venda do produto. Integrar CTAs para demo, login e jornada comercial, preservando metadata, Open Graph, canonical e schema.org. Definir explicitamente se usuarios autenticados continuam vendo a landing ou se recebem redirect controlado para o portal, evitando regressao na entrada operacional.

**Test Strategy:**

Teste manual: abrir / deslogado e logado, validar a estrategia definida para cada caso, revisar SEO basico da home e CTAs para demo e login.
