# Task ID: 358

**Title:** Evitar fetch SSR autenticado durante Playwright no app operacional

**Status:** done

**Dependencies:** 349 ✓, 357 ✓

**Priority:** high

**Description:** Desabilitar o bootstrap SSR autenticado em ambiente Playwright para eliminar warnings de token inválido e desacoplar os testes E2E dos cookies mockados no servidor.

**Details:**

Escopo: adicionar um helper server-side para detectar runtime Playwright, propagar esse sinal pelo webServer do Playwright e evitar `serverFetch` autenticado em páginas operacionais que hoje fazem fallback ruidoso para o client. Aplicar ao dashboard e aos loaders administrativos que usam `serverFetch` no SSR. Fora de escopo: mudanças no backend de autenticação ou aceitação de tokens fake. A estratégia é deixar o SSR devolver `initialData` vazio em Playwright, permitindo que o client carregue via mocks do próprio E2E.

**Test Strategy:**

Executar ao menos `tests/e2e/dashboard.spec.ts` em chromium e validar que a página continua funcional sem emitir warnings de `Token ausente ou inválido` no bootstrap SSR. Verificar lint dos arquivos alterados e confirmar que o web server do Playwright sobe com `PLAYWRIGHT_TEST=1`.
