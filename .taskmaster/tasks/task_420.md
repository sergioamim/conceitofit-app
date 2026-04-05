# Task ID: 420

**Title:** Estabilizar testes E2E Playwright: Erros de rede e timeouts

**Status:** done

**Dependencies:** 111 ✓

**Priority:** high

**Description:** Corrigir a instabilidade da suíte E2E do Playwright causada por erros `net::ERR_ABORTED` e timeouts excessivos, que ocorrem devido à compilação simultânea de rotas pelo dev server do Next.js, impactando aproximadamente 60% das falhas.

**Details:**

O problema central reside na sobrecarga do servidor de desenvolvimento Next.js ao tentar compilar rotas para múltiplos workers do Playwright simultaneamente, resultando em `net::ERR_ABORTED` para `page.goto()` e timeouts. Para solucionar esta questão, seguir as seguintes etapas:

1.  **Configuração do Playwright (`playwright.config.ts`):**
    *   Reduzir o número de workers paralelos. Avaliar as opções:
        *   Definir `fullyParallel: false` para desabilitar a execução totalmente paralela de arquivos de teste.
        *   Especificar um número fixo de workers, por exemplo, `workers: 3` (ou outro número experimentalmente otimizado para o ambiente CI).
    *   **Alternativa para CI:** Considerar configurar `webServer.command` para usar `next build && next start` em vez de `next dev`, garantindo que as rotas já estejam compiladas antes dos testes E2E, reduzindo a carga no dev server.

2.  **Estratégias de Navegação nos Testes (`tests/e2e/**/*.spec.ts`):**
    *   Para os testes mais afetados por `net::ERR_ABORTED` em `page.goto()`:
        *   Adicionar `await page.waitForLoadState('networkidle');` após chamadas críticas de `page.goto()` para garantir que a rede esteja ociosa antes de prosseguir.
        *   Implementar um padrão de retry customizado para `page.goto()` utilizando `test.step` ou um helper, para tentar novamente a navegação em caso de falha de rede inicial. Exemplo:
            ```typescript
            await test.step('Navegar para a página e aguardar', async () => {
              await expect(async () => {
                await page.goto('/caminho/da/rota');
                await page.waitForLoadState('networkidle');
                // Adicionar uma asserção para verificar se a página carregou corretamente
                await expect(page.locator('h1')).toBeVisible();
              }).toPass({ timeout: 10000 }); // Retry por até 10 segundos
            });
            ```
    *   **Aumentar Timeout de Navegação:** Para testes específicos e fluxos mais pesados (conforme listado abaixo), aumentar o `navigationTimeout` no contexto do teste ou na chamada `page.goto()` para um valor maior que o padrão (ex: `page.goto('/caminho', { timeout: 90000 })`).

3.  **Identificação dos Testes Afetados:** Priorizar as mudanças nos seguintes arquivos e seções, conforme o problema descrito:
    *   `admin-catalogo-crud.spec.ts` (linha 5)
    *   `admin-financeiro-operacional-crud.spec.ts` (linhas 5, 54, 102)
    *   `app-multiunidade-contrato.spec.ts` (linha 268)
    *   `comercial-fluxo.spec.ts` (linha 80)
    *   `comercial-smoke-real.spec.ts` (linha 369)
    *   `admin-backoffice-coverage.spec.ts` (timeout de 60s)
    *   `dashboard.spec.ts` (timeout)
    *   `layout-bottom-nav.spec.ts` (timeout)
    *   `operacional-grade-catraca.spec.ts` (timeout)
    *   `onboarding-fluxo-completo.spec.ts` (timeout)

**Test Strategy:**

Após a implementação das mudanças, executar a suíte completa de testes E2E (`npm run test:e2e`). Monitorar de perto a taxa de falhas relacionadas a `net::ERR_ABORTED` e timeouts. Além disso, executar os testes individualmente em diferentes configurações de workers (por exemplo, `npx playwright test --workers=1 tests/e2e/admin-catalogo-crud.spec.ts` e com 3 workers) para validar a estabilidade e a redução dos erros. Verificar o tempo total de execução da suíte para garantir que as otimizações não introduzam atrasos excessivos. A validação final será a ausência ou redução drástica dos erros de rede e timeouts nos buckets de teste.
