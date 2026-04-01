# Task ID: 309

**Title:** Atualizar script de cobertura e gates para nova meta

**Status:** done

**Dependencies:** 301 ✓, 302 ✓, 303 ✓, 304 ✓, 305 ✓, 306 ✓, 308 ✓

**Priority:** high

**Description:** Ajustar os thresholds de cobertura no script `playwright-coverage.mjs` para refletir a nova meta de 60% e atualizar a documentação de cobertura.

**Details:**

Após a cobertura de linhas atingir aproximadamente 55-60%, editar `scripts/playwright-coverage.mjs` para atualizar o `thresholds.lines` de 17.54% para 60% (ou o valor aproximado atingido). Atualizar o arquivo `docs/TEST_COVERAGE_CORE.md` com o novo snapshot de cobertura e as métricas. Criar ou atualizar `docs/TEST_COVERAGE_GOVERNANCE.md` com a documentação da cobertura por grupo de módulos (e.g., E2E, Unitário). Pseudo-código: `// scripts/playwright-coverage.mjs 
 const thresholds = { 
   lines: 60, // Atualizar este valor 
   statements: 60, 
   branches: 60, 
   functions: 60 
 };`

**Test Strategy:**

Executar o comando `npm run coverage:report` e verificar que o pipeline de CI/CD (se configurado) não falha devido a novos gates de cobertura. Validar que os arquivos de documentação (`docs/TEST_COVERAGE_CORE.md` e `docs/TEST_COVERAGE_GOVERNANCE.md`) foram atualizados com as informações corretas e refletem a nova meta e o status da cobertura.
