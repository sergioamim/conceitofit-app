# Task ID: 301

**Title:** Testes unitários — src/lib/tenant/bi/analytics.ts

**Status:** done

**Dependencies:** None

**Priority:** medium

**Description:** Adicionar testes unitários abrangentes para as funções de cálculo e agregação de KPIs no módulo `bi/analytics.ts`.

**Details:**

Criar o arquivo `tests/unit/bi-analytics-full.spec.ts`. Implementar testes para: 1. Funções de agregação de KPIs (ex: calcularAlunosAtivos, calcularReceitaMedia). 2. Cálculos de conversão, ocupação e inadimplência. 3. Funções de formatação de séries temporais. 4. Cenários de borda como dados vazios, valores zero ou períodos sem dados. Utilizar bibliotecas de mock para dependências externas, se houver. Pseudo-código: `describe('analytics calculations', () => {
   it('should calculate active students correctly', () => {
     const data = [{ id: 1, active: true }, { id: 2, active: false }];
     expect(calculateAlunosAtivos(data)).toBe(1);
   });
   it('should handle empty data for KPIs', () => {
     expect(calculateReceitaMedia([])).toBe(0);
   });
 });`

**Test Strategy:**

Executar os testes unitários (`npx playwright test tests/unit/bi-analytics-full.spec.ts --project=unit`). Validar que todos os cenários, incluindo os de borda, são cobertos e que as funções retornam os valores esperados. Verificar a cobertura de linhas do arquivo `analytics.ts` após a execução.
