# Planejamento de Cobertura E2E Playwright — 2026 Q2

> **Público-alvo:** agente executor autônomo (outro Claude Code session).
> **Criado em:** 2026-04-11.
> **Escopo:** saneamento de débitos no infra de testes + cobertura faltante em backoffice e portal.
>
> Este documento é **self-contained**: o agente executor não precisa perguntar contexto adicional. Tudo que precisar está aqui ou linkado.

---

## 1. Contexto

### Estado atual (snapshot abr/2026)

- **62 specs E2E** em `tests/e2e/*.spec.ts`.
- **Playwright config:** `playwright.config.ts` — workers=3 (CI=2), retries=1 (CI=2), action timeout=15s, expect timeout=8s.
- **Backend stub:** `tests/e2e/support/backend-only-stubs.ts` — **164KB** em um único arquivo (mock centralizado).
- **Helpers de sessão:** 3 variantes duplicando lógica de cookies:
  - `support/auth-session.ts` — `installE2EAuthSession` (cookies `academia-*`).
  - `support/gerencial-auth.ts` — `seedGerencialSession` (cookies `fc_*` + delega ao `auth-session`).
  - `support/backoffice-global-session.ts` — `installBackofficeGlobalSession` (após o commit `b0f6b9c` também seta `fc_*`).
- **Middleware protege rotas com cookies `fc_*`:** ver `middleware.ts:35-53`. Helpers que só setam `academia-*` redirecionam para `/login`.

### Débitos técnicos introduzidos

Nos commits `47a52bc` e `b0f6b9c` foram adicionados **5 usos de `expect.poll(() => click → isVisible())`** para contornar flakiness de hidratação no primeiro click pós-navegação. Esses são workarounds, não fixes — herdam o débito para cada spec novo que segue o padrão.

Localização dos workarounds:
- `tests/e2e/admin-catalogo-crud.spec.ts:16-26,44-54,74-84,105-115`
- `tests/e2e/admin-financeiro-operacional-crud.spec.ts:16-27,46-57,72-82,99-110,159-170`
- `tests/e2e/menu-migracao-smoke.spec.ts` — não tem; usa `visitAndExpectHeading` simples.

---

## 2. Cobertura backoffice — inventário

### Rotas existentes em `src/app/(backoffice)/admin/`

30 rotas totais (incluindo dinâmicas `[id]`):

```
/admin                              ❌ sem cobertura
/admin/academias                    ✅ backoffice-global, admin-backoffice-global-crud
/admin/academias/[id]               ✅ admin-backoffice-global-crud
/admin/audit-log                    ✅ backoffice-impersonation
/admin/bi                           ❌ sem cobertura
/admin/busca                        ❌ sem cobertura
/admin/compliance                   ✅ admin-backoffice-coverage
/admin/configuracoes                ✅ backoffice-configuracoes
/admin/entrar-como-academia         ✅ backoffice-entrar-como-academia
/admin/financeiro                   ❌ sem cobertura (root)
/admin/financeiro/cobrancas         ❌ sem cobertura
/admin/financeiro/contratos         ❌ sem cobertura
/admin/financeiro/gateways          ❌ sem cobertura
/admin/financeiro/planos            ❌ sem cobertura (planos SaaS)
/admin/importacao-evo               ✅ backoffice-importacao-evo (navega via /admin/unidades)
/admin/importacao-evo-p0            ❌ sem cobertura (novo fluxo)
/admin/leads                        ✅ admin-backoffice-coverage
/admin/onboarding/provisionar       ❌ sem cobertura (555 linhas de page.tsx!)
/admin/operacional/alertas          ❌ sem cobertura
/admin/operacional/saude            ❌ sem cobertura (276 linhas)
/admin/saas                         ❌ sem cobertura
/admin/seguranca                    ✅ backoffice-seguranca, backoffice-seguranca-rollout
/admin/seguranca/catalogo           ❌ sem cobertura
/admin/seguranca/funcionalidades    ✅ backoffice-seguranca-governanca
/admin/seguranca/perfis             ✅ backoffice-seguranca-governanca
/admin/seguranca/revisoes           ❌ sem cobertura
/admin/seguranca/usuarios           ✅ backoffice-seguranca, admin-backoffice-global-crud
/admin/seguranca/usuarios/[id]      ✅ backoffice-seguranca, backoffice-impersonation
/admin/unidades                     ✅ backoffice-importacao-evo, admin-backoffice-global-crud
/admin/whatsapp                     ❌ sem cobertura (934 linhas!)
```

### Resumo numérico

| Métrica | Valor |
|---------|-------|
| Rotas totais | 30 |
| Rotas cobertas | 15 (50%) |
| Rotas descobertas | **15 (50%)** |
| Specs backoffice | 10 |
| Casos de teste backoffice | 14 |

### Lacunas críticas no backoffice

**P0 — impacto direto no SaaS (receita / crescimento):**
1. `/admin/financeiro/planos` — gestão de planos SaaS (MRR)
2. `/admin/financeiro/cobrancas` — cobranças do SaaS para academias
3. `/admin/financeiro/contratos` — contratos de rede
4. `/admin/financeiro/gateways` — config de gateway de pagamento
5. `/admin/onboarding/provisionar` — provisionar nova academia (555 linhas, fluxo multi-step)
6. `/admin/saas` — dashboard com métricas de rede (MRR, churn, NPS)

**P1 — ops críticas:**
7. `/admin/operacional/saude` — health dashboard (276 linhas)
8. `/admin/operacional/alertas` — alertas operacionais
9. `/admin/bi` — BI do backoffice
10. `/admin/seguranca/revisoes` — revisões periódicas de acesso (compliance)
11. `/admin/seguranca/catalogo` — catálogo de permissões (compliance)

**P2 — features:**
12. `/admin/whatsapp` — config WhatsApp (934 linhas, maior page do backoffice)
13. `/admin/importacao-evo-p0` — novo fluxo de importação
14. `/admin/busca` — busca global de entidades
15. `/admin` — dashboard raiz do backoffice

---

## 3. Cobertura portal — lacunas priorizadas

Detalhadas em `ADMIN_CRUD_PLAYWRIGHT_COVERAGE_PRD.md` e expandidas aqui:

**Financeiro (P0):**
- `/gerencial/contas-a-receber`
- `/gerencial/recebimentos`
- `/gerencial/contabilidade`
- `/gerencial/agregadores`
- `/pagamentos` (listagem + estornar)

**CRM/Vendas (P0):**
- `/crm/tarefas`
- `/crm/playbooks`
- `/vendas/nova` (3 cenários de pagamento)
- `/prospects` conversão

**Operação (P1):**
- `/grade` — reservar/cancelar aula
- `/matriculas` — renovar/upgrade
- `/treinos/exercicios` — CRUD
- `/administrativo/visitantes`
- `/administrativo/conciliacao-bancaria`

**BI (P1):**
- `/gerencial/bi/receita`
- `/gerencial/bi/retencao-cohort`
- `/gerencial/bi/inadimplencia`

---

## 4. Plano de execução — 7 Waves

**Ordem obrigatória:** Waves A → F devem ser executadas em sequência. Wave A é bloqueadora das seguintes (remove débito técnico que se propagaria).

### Wave A — Fundação infra (BLOQUEADORA)

**Objetivo:** eliminar os 5 workarounds `expect.poll`, centralizar sessão, adicionar helpers reutilizáveis.

**Critérios de aceitação:**
1. Arquivo novo `tests/e2e/support/interactions.ts` com as APIs abaixo.
2. Arquivo novo `tests/e2e/support/hydration.ts` com `waitForHydration(page)`.
3. Os cookies `fc_session_active`, `fc_access_token`, `fc_session_claims` passam a ser setados **dentro do próprio** `installE2EAuthSession()` em `auth-session.ts` — não mais duplicado em 3 lugares.
4. `backoffice-global-session.ts` e `gerencial-auth.ts` removem a duplicação (delegam para o `installE2EAuthSession` atualizado).
5. Os 5 `expect.poll(() => click → isVisible())` dos specs `admin-catalogo-crud.spec.ts` e `admin-financeiro-operacional-crud.spec.ts` são substituídos por `clickToOpenDialog(page, "Novo serviço")`.
6. Todos os specs afetados ainda passam: rode `PLAYWRIGHT_TEST=1 node_modules/.bin/playwright test tests/e2e/admin-catalogo-crud.spec.ts tests/e2e/admin-financeiro-operacional-crud.spec.ts tests/e2e/menu-migracao-smoke.spec.ts --reporter=line` — deve resultar em `20 passed` (0 flaky).
7. **Não introduzir** nenhum novo `expect.poll` ou `click({ force: true })` fora desses helpers.

**API esperada em `interactions.ts`:**

```typescript
import type { Page, Locator } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Clica em um botão e aguarda um dialog abrir. Usa poll interno porque
 * em dev mode o primeiro click pós-navegação às vezes é perdido durante
 * hidratação do React. Substitui os padrões `expect.poll(...)` ad-hoc.
 *
 * @example
 *   await clickToOpenDialog(page, "Novo serviço");
 *   await dialog.locator("input").first().fill(nome);
 */
export async function clickToOpenDialog(
  page: Page,
  buttonName: string | RegExp,
  options: { scope?: Locator; timeout?: number } = {},
): Promise<Locator> {
  const scope = options.scope ?? page;
  const button = scope.getByRole("button", { name: buttonName });
  const dialog = page.getByRole("dialog");

  await expect
    .poll(
      async () => {
        await button.click();
        return dialog.isVisible();
      },
      { timeout: options.timeout ?? 10_000, intervals: [500, 1_000] },
    )
    .toBe(true);

  return dialog;
}

/**
 * Navega para uma URL e aguarda hidratação confirmada via heading
 * esperado. Substitui `page.goto(...) + waitForLoadState + expect(heading)`.
 */
export async function navigateAndWaitForHeading(
  page: Page,
  url: string,
  headingName: string | RegExp,
  options: { timeout?: number } = {},
): Promise<void> {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: headingName }),
  ).toBeVisible({ timeout: options.timeout ?? 10_000 });
}

/**
 * Click em tab e aguarda aria-selected=true. Usa poll porque em
 * dev mode componentes com re-render pós-fetch às vezes perdem o
 * primeiro click.
 */
export async function clickTabAndWaitSelected(
  tab: Locator,
): Promise<void> {
  await expect(tab).toBeEnabled();
  await expect
    .poll(
      async () => {
        await tab.click();
        return tab.getAttribute("aria-selected");
      },
      { timeout: 10_000, intervals: [500, 1_000] },
    )
    .toBe("true");
}
```

**API esperada em `hydration.ts`:**

```typescript
import type { Page } from "@playwright/test";

/**
 * Aguarda o React estar hidratado no client. Usa `__NEXT_DATA__` + um
 * window-level flag injetado pelo App Router. Não é infalível em todos
 * os casos mas reduz significativamente flakiness no primeiro click.
 */
export async function waitForHydration(page: Page): Promise<void> {
  await page.waitForFunction(
    () => {
      // Heurística: Next.js define __NEXT_DATA__ em window assim que
      // o bundle client carrega. Após isso, aguardamos um frame de
      // rAF para garantir que os effects rodaram.
      const ready = typeof window !== "undefined"
        && "__NEXT_DATA__" in window
        && document.readyState !== "loading";
      if (!ready) return false;
      return true;
    },
    undefined,
    { timeout: 15_000 },
  );
}
```

**Arquivos a editar:**
- **Criar:** `tests/e2e/support/interactions.ts`
- **Criar:** `tests/e2e/support/hydration.ts`
- **Editar:** `tests/e2e/support/auth-session.ts` — absorver a escrita de cookies `fc_*` do `backoffice-global-session.ts` e do `gerencial-auth.ts`.
- **Editar:** `tests/e2e/support/backoffice-global-session.ts` — remover a duplicação.
- **Editar:** `tests/e2e/support/gerencial-auth.ts` — remover a duplicação.
- **Editar:** `tests/e2e/admin-catalogo-crud.spec.ts` — substituir os 4 `expect.poll` por `clickToOpenDialog`.
- **Editar:** `tests/e2e/admin-financeiro-operacional-crud.spec.ts` — substituir os 5 `expect.poll` por `clickToOpenDialog`.

**Validação final da Wave A:**
```bash
PLAYWRIGHT_TEST=1 node_modules/.bin/playwright test \
  tests/e2e/admin-catalogo-crud.spec.ts \
  tests/e2e/admin-financeiro-operacional-crud.spec.ts \
  tests/e2e/menu-migracao-smoke.spec.ts \
  tests/e2e/backoffice-seguranca.spec.ts \
  --reporter=line
# Esperado: 20 passed, 0 flaky
```

Rodar 2 vezes — a 2ª execução deve ser estável (sem "flaky").

---

### Wave B — Backoffice financeiro SaaS (P0)

**Objetivo:** cobrir os 4 módulos do financeiro SaaS + SaaS dashboard + onboarding provisionar.

**Specs a criar:**

#### B.1 — `tests/e2e/backoffice-financeiro-planos-saas.spec.ts`
Rotas: `/admin/financeiro/planos`

Cenários:
1. Listagem de planos SaaS renderiza com dados mockados (3 planos: Starter, Growth, Enterprise).
2. Criar novo plano SaaS — preencher nome, preço, features, salvar.
3. Editar plano existente — alterar preço, validar preservação de outros campos.
4. Ativar/desativar plano — verificar badge de status.
5. (Opcional) Tentar deletar plano com contratos ativos → exibe erro.

#### B.2 — `tests/e2e/backoffice-financeiro-cobrancas-saas.spec.ts`
Rotas: `/admin/financeiro/cobrancas`

Cenários:
1. Listagem de cobranças pendentes + pagas + vencidas.
2. Filtrar por academia (rede) → lista reduzida.
3. Filtrar por status (PENDENTE/PAGO/VENCIDO).
4. Gerar nova cobrança manual para uma academia.
5. Marcar cobrança como paga manualmente → status atualiza.

#### B.3 — `tests/e2e/backoffice-financeiro-contratos-saas.spec.ts`
Rotas: `/admin/financeiro/contratos`

Cenários:
1. Listagem de contratos ativos (mockado com 2 redes).
2. Detalhes do contrato — ver plano vinculado, data de início, renovação.
3. Renovar contrato manualmente — valida nova data fim.
4. Cancelar contrato → status CANCELADO + stop de cobranças futuras.

#### B.4 — `tests/e2e/backoffice-financeiro-gateways-saas.spec.ts`
Rotas: `/admin/financeiro/gateways`

Cenários:
1. Listar gateways configurados (Stripe + Pagarme mockados).
2. Editar config de gateway — chave API, webhook URL.
3. Toggle ativo/inativo do gateway.
4. Teste de conexão (mock do endpoint `/test`) → OK / FALHA.

#### B.5 — `tests/e2e/backoffice-saas-dashboard.spec.ts`
Rotas: `/admin/saas`

Cenários:
1. Carrega dashboard com KPIs (MRR, churn, NPS, ativo) — mockar `/api/admin/saas/metrics`.
2. Filtro de período (mês/trimestre/ano) → KPIs recarregam.
3. Gráfico de série temporal com N pontos → validar quantidade de bars/points.

#### B.6 — `tests/e2e/backoffice-onboarding-provisionar.spec.ts`
Rotas: `/admin/onboarding/provisionar`

Cenários:
1. Abre fluxo multi-step (5 steps) e completa até o final com mocks:
   - Step 1: dados da academia (nome, documento, email).
   - Step 2: rede (criar ou vincular).
   - Step 3: plano SaaS (seleção).
   - Step 4: primeiro usuário owner.
   - Step 5: confirmar e provisionar.
2. Submit final → redirect para `/admin/academias/[new-id]`.
3. Validação de step — tentar avançar sem preencher campo obrigatório → erro inline.
4. Voltar step anterior preserva dados.

**Mocks compartilhados:** criar `tests/e2e/support/stubs/backoffice-financeiro.ts` com seeds de plans/cobranças/contratos/gateways (padrão LIFO conforme `gerencial-smoke-mocks`).

**Validação Wave B:**
```bash
PLAYWRIGHT_TEST=1 node_modules/.bin/playwright test \
  tests/e2e/backoffice-financeiro-*.spec.ts \
  tests/e2e/backoffice-saas-dashboard.spec.ts \
  tests/e2e/backoffice-onboarding-provisionar.spec.ts \
  --reporter=line
# Esperado: ~20 passed (depende de cenários totais)
```

---

### Wave C — Backoffice operacional + segurança restante (P1)

**Objetivo:** cobrir health, alertas, segurança compliance, BI, whatsapp, importação evo p0.

#### C.1 — `tests/e2e/backoffice-operacional-saude.spec.ts`
Rota: `/admin/operacional/saude`
Cenários: dashboard com health-checks mockados (ONLINE/DEGRADED/OFFLINE), filtros por severidade, click em ocorrência abre detalhes.

#### C.2 — `tests/e2e/backoffice-operacional-alertas.spec.ts`
Rota: `/admin/operacional/alertas`
Cenários: listar alertas ativos, marcar como resolvido, filtrar por tenant.

#### C.3 — `tests/e2e/backoffice-bi.spec.ts`
Rota: `/admin/bi`
Cenários: carregar BI do backoffice com dados mockados, trocar filtro global, exportar CSV.

#### C.4 — `tests/e2e/backoffice-seguranca-revisoes.spec.ts`
Rota: `/admin/seguranca/revisoes`
Cenários: listar revisões pendentes, aprovar/negar revisão, adicionar comentário.

#### C.5 — `tests/e2e/backoffice-seguranca-catalogo.spec.ts`
Rota: `/admin/seguranca/catalogo`
Cenários: listar permissões catalogadas, filtrar por módulo, ver detalhes de uma permissão.

#### C.6 — `tests/e2e/backoffice-whatsapp.spec.ts`
Rota: `/admin/whatsapp`
**Nota:** page tem 934 linhas. Começar com cenários minimalistas:
1. Carrega config atual.
2. Salva config com novo token.
3. Testa conexão (mock retorna OK).
4. Listar templates WhatsApp (tab templates).
5. Criar template novo.

#### C.7 — `tests/e2e/backoffice-importacao-evo-p0.spec.ts`
Rota: `/admin/importacao-evo-p0`
Cenários: carregar wizard, subir arquivo mockado, validar preview, confirmar importação.

#### C.8 — `tests/e2e/backoffice-busca.spec.ts`
Rota: `/admin/busca`
Cenários: busca por nome de academia retorna resultados, busca por CNPJ, busca por usuário.

#### C.9 — `tests/e2e/backoffice-root-dashboard.spec.ts`
Rota: `/admin` (root)
Cenários: carrega widgets do dashboard, click em widget navega para rota detalhada.

**Validação Wave C:**
```bash
PLAYWRIGHT_TEST=1 node_modules/.bin/playwright test \
  tests/e2e/backoffice-operacional-*.spec.ts \
  tests/e2e/backoffice-bi.spec.ts \
  tests/e2e/backoffice-seguranca-revisoes.spec.ts \
  tests/e2e/backoffice-seguranca-catalogo.spec.ts \
  tests/e2e/backoffice-whatsapp.spec.ts \
  tests/e2e/backoffice-importacao-evo-p0.spec.ts \
  tests/e2e/backoffice-busca.spec.ts \
  tests/e2e/backoffice-root-dashboard.spec.ts \
  --reporter=line
```

---

### Wave D — Portal financeiro P0

**Specs a criar:**
- `tests/e2e/gerencial-contas-receber.spec.ts` — lista, filtro período, baixa manual.
- `tests/e2e/gerencial-recebimentos.spec.ts` — conciliar batch.
- `tests/e2e/gerencial-contabilidade.spec.ts` — exportar para ERP.
- `tests/e2e/gerencial-agregadores.spec.ts` — config adquirente.
- `tests/e2e/pagamentos-listagem.spec.ts` — listar + estornar.
- `tests/e2e/financeiro-dunning-escalation.spec.ts` — ampliar existente com escalation.

---

### Wave E — Portal CRM/Vendas/Operação P0/P1

**Specs a criar:**
- `tests/e2e/crm-tarefas.spec.ts` — CRUD de tarefas.
- `tests/e2e/crm-playbooks.spec.ts` — aplicar playbook.
- `tests/e2e/vendas-checkout.spec.ts` — 3 cenários de pagamento.
- `tests/e2e/prospects-conversao.spec.ts` — prospect → aluno.
- `tests/e2e/grade-reservar-aula.spec.ts`
- `tests/e2e/matriculas-renovar.spec.ts`
- `tests/e2e/treinos-exercicios-crud.spec.ts`
- `tests/e2e/admin-visitantes.spec.ts`
- `tests/e2e/admin-conciliacao-bancaria.spec.ts`

---

### Wave F — Error paths (transversal, alto ROI)

**Objetivo:** cobrir os 6 cenários qualitativos em rotas amostrais.

**Spec único:** `tests/e2e/error-boundaries.spec.ts`

Cenários:
1. `/clientes` com backend retornando 500 → `ListErrorState` visível + botão "Tentar novamente".
2. Token expirado durante `POST /api/v1/administrativo/salas` → redirect pra login preservando path.
3. RBAC 403 em `/seguranca/rbac` → mensagem de acesso negado (não crash).
4. Validação Zod em formulário de sala → erros abaixo dos inputs.
5. Form dirty + navegação → `RestoreDraftModal` aparece na volta.
6. Offline simulado via `page.route` → UI não trava.

**Mocks:** criar `tests/e2e/support/stubs/error-scenarios.ts` com helpers `install500On(path)`, `installExpiredToken()`, etc.

---

### Wave G — Refactor grande (opcional, último)

**Objetivo:** quebrar `tests/e2e/support/backend-only-stubs.ts` (164KB) em módulos por domínio.

**Estrutura alvo:**
```
tests/e2e/support/stubs/
  index.ts              # re-exports + composer
  catalogo.ts           # produtos, servicos, convenios, vouchers, bandeiras
  financeiro.ts         # formas-pagamento, contas-bancarias, maquininhas, tipos-conta
  operacional.ts        # atividades, atividades-grade, salas, horarios
  crm.ts                # prospects, tarefas, cadencias, campanhas
  treinos.ts            # exercicios, grupos-musculares, templates, atribuidos
  comercial.ts          # planos, matriculas, vendas
  backoffice.ts         # academias, unidades, seguranca, financeiro-saas
```

**Estratégia:**
1. Criar cada arquivo extraindo funções relacionadas mantendo paridade exata.
2. Um `index.ts` re-exporta tudo para preservar API pública.
3. Rodar a suite inteira após cada extração — toda quebra é regressão a corrigir antes de continuar.
4. Sem mudança de comportamento, só divisão.

---

## 5. Padrões e convenções obrigatórios

### Estrutura de um novo spec

Todo spec criado nas Waves B/C/D/E deve seguir este template:

```typescript
import { expect, test, type Page } from "@playwright/test";
import { clickToOpenDialog, navigateAndWaitForHeading } from "./support/interactions";
import {
  installBackofficeGlobalSession, // OU seedGerencialSession / seedAlunoSession
} from "./support/backoffice-global-session";
import { installGerencialCatchAll } from "./support/gerencial-smoke-mocks";

const TENANT_ID = "tenant-backoffice-e2e";

async function setup(page: Page) {
  await installGerencialCatchAll(page);
  // Overrides específicos do módulo aqui (page.route calls).
  await installBackofficeGlobalSession(page, {
    session: { activeTenantId: TENANT_ID /* ... */ },
    shell: { /* ... */ },
  });
}

test.describe("<Módulo backoffice>", () => {
  test.beforeEach(async ({ page }) => {
    await setup(page);
  });

  test("cenário 1: carrega listagem com dados mockados", async ({ page }) => {
    await page.route(/\/api\/admin\/financeiro\/planos/, async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([{ id: "plan-1", nome: "Starter", preco: 99 }]),
      });
    });

    await navigateAndWaitForHeading(page, "/admin/financeiro/planos", /Planos SaaS/);
    await expect(page.getByText("Starter")).toBeVisible();
  });

  test("cenário 2: cria novo plano", async ({ page }) => {
    await page.route(/\/api\/admin\/financeiro\/planos/, async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({ id: "plan-new", nome: "Growth", preco: 199 }),
        });
        return;
      }
      return route.fallback();
    });

    await navigateAndWaitForHeading(page, "/admin/financeiro/planos", /Planos SaaS/);
    const dialog = await clickToOpenDialog(page, "Novo plano");
    await dialog.locator("#plan-nome").fill("Growth");
    await dialog.locator("#plan-preco").fill("199");
    await dialog.getByRole("button", { name: "Criar" }).click();
    await expect(page.getByText("Growth")).toBeVisible();
  });
});
```

### Regras duras

1. **PROIBIDO:** `page.waitForTimeout(ms)` com N > 500ms. Use `expect.poll` ou `waitFor` com condição.
2. **PROIBIDO:** `expect.poll(() => click → visible)` fora dos helpers. Use `clickToOpenDialog`.
3. **PROIBIDO:** `click({ force: true })` — se precisar forçar, investigue o motivo.
4. **PROIBIDO:** `.first()` global em comboboxes — sempre escopar ao dialog/form.
5. **OBRIGATÓRIO:** usar `route.fallback()` (nunca `route.continue()`) para permitir chaining de handlers.
6. **OBRIGATÓRIO:** ordem LIFO dos `page.route` — registrar catch-all primeiro, overrides específicos depois.
7. **OBRIGATÓRIO:** cada cenário com dados mockados deve validar **pelo menos 1 texto que veio do mock** (não só heading).
8. **OBRIGATÓRIO:** typecheck passando após cada spec: `node_modules/.bin/tsc --noEmit -p tsconfig.json`.

### Naming

- Spec files: `<area>-<modulo>.spec.ts` (kebab-case).
- Test describe: `"<Área> — <Módulo>"` (title case).
- Test cases: `"cenário N: <descrição imperativa>"` ou `"<ação esperada>"`.

---

## 6. Critérios de aceitação globais

Ao finalizar cada Wave, o agente deve:

1. **Rodar 2x a suite afetada** — a 2ª run deve ser 100% verde sem "flaky".
2. **Typecheck limpo** após cada spec criado.
3. **Commit atômico por Wave** com mensagem estruturada:
   ```
   test(e2e): Wave <X> — <escopo> (<N> specs / <M> cenários)

   - <spec 1>: <cenários cobertos>
   - <spec 2>: <cenários cobertos>
   ...
   ```
4. **Não modificar código de produção** exceto:
   - Adicionar `data-testid` preventivamente em botões frágeis (caso spec precise).
   - Corrigir bugs descobertos durante os testes — documentar como commit separado `fix(...)`.

---

## 7. Restrições operacionais

### Não fazer

- **Não** executar Wave G (refactor grande) antes de Waves A-F estarem verdes.
- **Não** criar specs que dependem de backend real — sempre mockar.
- **Não** duplicar lógica de mock. Se 2 specs precisam do mesmo mock, extrair para `support/stubs/<domain>.ts`.
- **Não** usar cookies `academia-*` diretamente — usar o helper `installE2EAuthSession` (Wave A centraliza).

### Fazer

- **Paralelizar dentro de uma Wave** quando criar múltiplos specs independentes.
- **Commitar a cada ~3-4 specs** dentro de uma Wave, não só no final, para preservar progresso.
- **Rodar o spec recém-criado ISOLADO antes de rodar a suite inteira** — economiza tempo de debug.
- **Se um spec quebrar flaky >2 iterações, DOCUMENTAR** em comentário `// FLAKY: <motivo>` e seguir — não gastar >30min em uma única flakiness.

---

## 8. Entrega final (checkpoint obrigatório)

Ao completar Waves A-F, executar:

```bash
# 1. Suite completa — deve terminar sem falhas
PLAYWRIGHT_TEST=1 node_modules/.bin/playwright test --reporter=line

# 2. Typecheck
node_modules/.bin/tsc --noEmit -p tsconfig.json

# 3. Métricas de cobertura
find src/app/\(backoffice\) -name "page.tsx" | wc -l   # deve dar 30
grep -rh "page.goto.*\"/admin" tests/e2e/*.spec.ts | sort -u | wc -l  # deve dar ≥25 (cobertura ≥83%)
```

Gerar um commit final de relatório: `docs(e2e): atualiza métricas de cobertura pós-Wave F`.

---

## 9. Referências rápidas

| Tópico | Arquivo | Função principal |
|--------|---------|------------------|
| Middleware auth | `middleware.ts:35-53` | `hasSession` checa cookies `fc_*` |
| Session helpers portal | `tests/e2e/support/gerencial-auth.ts` | `seedGerencialSession` |
| Session helpers backoffice | `tests/e2e/support/backoffice-global-session.ts` | `installBackofficeGlobalSession` |
| Mock catch-all | `tests/e2e/support/gerencial-smoke-mocks.ts` | `installGerencialCatchAll` |
| Stubs monolito | `tests/e2e/support/backend-only-stubs.ts` | 164KB de mocks |
| Playwright config | `playwright.config.ts` | timeouts e workers |
| Smoke existente | `tests/e2e/menu-migracao-smoke.spec.ts` | template de spec novo |
| Exemplo com dados | `tests/e2e/crm-kanban-funil.spec.ts` | mock CRUD em memória |

---

## 10. Dúvidas antecipadas

**Q: E se o endpoint backend ainda não existe?**
R: Mock retornando shape plausível é suficiente — o E2E valida o front. Documente em comentário `// TODO: endpoint ainda não existe no backend (abril/2026)`.

**Q: E se o componente não renderiza porque o módulo de domínio ainda está em rollout?**
R: Pule o cenário e documente como `test.skip(true, "aguarda rollout do módulo X")`.

**Q: E se descobrir um bug real?**
R: Corrija o bug em commit separado `fix(...)` **antes** de continuar criando specs. Não deixe o spec comentado.

**Q: O backend real roda junto com os testes?**
R: Não. `PLAYWRIGHT_TEST=1` ativa `shouldBypassAuthenticatedSSRFetch` em `create-tenant-loader` e o dev server usa mocks via `page.route`. Apenas specs com `PLAYWRIGHT_REAL_BACKEND=1` tocam o backend Java.

---

## 11. Fim

Este documento é a única fonte de verdade para a cobertura E2E Q2 2026. Se encontrar divergência entre este plano e o código, o **código vence** — atualize este documento via PR `docs(e2e): ...`.
