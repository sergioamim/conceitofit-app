# Task ID: 298

**Title:** Criar E2E spec — CRM avançado (campanhas, playbooks, tarefas)

**Status:** done

**Dependencies:** 297 ✓

**Priority:** high

**Description:** Desenvolver um novo spec E2E para cobrir as funcionalidades avançadas de CRM, incluindo campanhas, playbooks, tarefas e o Kanban de prospects.

**Details:**

Criar o arquivo `tests/e2e/crm-avancado.spec.ts`. Implementar testes para: 1. Listagem, criação e ativação/pausa de campanhas de CRM. 2. Listagem e criação de playbooks/cadências. 3. Listagem e conclusão de tarefas de CRM. 4. Testar a funcionalidade de drag & drop de cards de prospects entre colunas no Kanban. Mockar as APIs `listCampanhasApi`, `createCampanhaApi`, `listPlaybooksApi`, `listCrmTasksApi` via `page.route`. Pseudo-código: `test('CRM Kanban drag and drop', async ({ page }) => {
   await page.goto('/crm/kanban');
   const prospectCard = page.locator('[data-testid="prospect-card-1"]');
   const targetColumn = page.locator('[data-testid="qualificado-column"]');
   await prospectCard.dragAndDrop(targetColumn);
   await expect(targetColumn.locator('[data-testid="prospect-card-1"]')).toBeVisible();
 });`

**Test Strategy:**

Executar o spec `crm-avancado.spec.ts`. Verificar a criação e gerenciamento de campanhas e playbooks, a conclusão de tarefas e, crucialmente, o comportamento do drag & drop no Kanban. Utilizar mocks para simular as respostas da API e diferentes estados.
