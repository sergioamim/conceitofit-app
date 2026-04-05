# Task ID: 451

**Title:** Consolidar jornada publica de adesao e remover duplicacao com storefront

**Status:** done

**Dependencies:** 449 ✓, 450 ✓

**Priority:** high

**Description:** Definir uma implementacao canonica para adesao publica e eliminar paginas proxy desnecessarias no storefront.

**Details:**

Revisar a duplicacao entre src/app/(public)/adesao/* e src/app/storefront/adesao/*, com foco especial nas paginas que hoje apenas redirecionam client-side para /adesao/*. Manter a jornada de adesao sob a superficie publica, preservar tenant e plan na query string e substituir redirecionamentos client-side por abordagem mais previsivel, preferencialmente server-side ou por composicao de componentes compartilhados.

**Test Strategy:**

Teste manual: validar landing, cadastro, checkout, trial e pendencias da jornada publica; validar tambem que o storefront continua abrindo a adesao com tenant e plano corretos.
