# Task ID: 305

**Title:** Testes unitários — src/lib/tenant/financeiro/recebimentos.ts

**Status:** done

**Dependencies:** None

**Priority:** medium

**Description:** Adicionar testes unitários para as funções de cálculo de resumo financeiro, agrupamento e filtros no módulo `financeiro/recebimentos.ts`.

**Details:**

Criar o arquivo `tests/unit/financeiro-recebimentos-full.spec.ts`. Implementar testes para: 1. Cálculos de resumo financeiro (total recebido, pendente, atrasado). 2. Agrupamento de recebimentos por forma de pagamento. 3. Aplicação de filtros por período e status. 4. Cenários de borda: listas vazias, valores negativos, datas inválidas, dados inconsistentes. Pseudo-código: `describe('recebimentos calculations', () => {
   it('should calculate total received correctly', () => {
     const payments = [{ amount: 100, status: 'paid' }, { amount: 50, status: 'pending' }];
     expect(calculateTotalReceived(payments)).toBe(100);
   });
   it('should filter payments by status', () => {
     const payments = [{ status: 'paid' }, { status: 'pending' }];
     expect(filterPaymentsByStatus(payments, 'paid').length).toBe(1);
   });
 });`

**Test Strategy:**

Executar os testes unitários. Validar a precisão dos cálculos financeiros e a correta aplicação dos filtros e agrupamentos. Assegurar que o módulo `financeiro/recebimentos.ts` atinja alta cobertura, especialmente para lógica de negócios crítica.
