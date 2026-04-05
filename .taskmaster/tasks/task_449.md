# Task ID: 449

**Title:** Consolidar superficies publicas sob o route group (public)

**Status:** done

**Dependencies:** 448 ✓

**Priority:** high

**Description:** Agrupar landing institucional, B2B e acesso de rede dentro de um boundary interno publico sem introduzir /public na URL.

**Details:**

Reorganizar a estrutura fisica para que as experiencias publicas fiquem sob src/app/(public), preservando as URLs finais. Incluir a home publica, a landing B2B e a superficie /acesso. Revisar a necessidade de um layout publico compartilhado para metadata, SEO, analytics e schema.org. Validar que nenhum movimento de filesystem gera prefixo /public/* na navegacao.

**Test Strategy:**

Teste manual: navegar por /, /b2b e /acesso/* apos a reorganizacao e validar que as URLs finais nao mudaram nem ganharam o prefixo /public.
