# Task ID: 425

**Title:** Corrigir falha no teste E2E 'cobre cargos e funcionários da unidade' em admin-unidade-base-equipe.spec.ts

**Status:** done

**Dependencies:** 342 ✓

**Priority:** high

**Description:** Investigar e corrigir a falha no teste Playwright 'cobre cargos e funcionários da unidade' em admin-unidade-base-equipe.spec.ts, onde o elemento 'Nome de registro' não é encontrado ao esperar o valor 'Lúcia Souza Registro 000002'.

**Details:**

1.  **Reprodução da Falha:** Executar o teste `tests/e2e/admin-unidade-base-equipe.spec.ts` com o Playwright para confirmar a falha específica no teste 'cobre cargos e funcionários da unidade'.
2.  **Análise do Seletor Playwright:** O teste utiliza `getByRole('textbox', { name: 'Nome de registro' })`. Este seletor busca um elemento de entrada de texto com um nome acessível 'Nome de registro'. O nome acessível pode ser fornecido por um `<label>` associado, um `aria-label` ou `aria-labelledby`.
3.  **Investigação em `src/components/funcionario/funcionario-form-page.tsx`:**
    *   Examinar o código-fonte do componente `src/components/funcionario/funcionario-form-page.tsx` para localizar o `input` ou `textarea` que representa o campo 'Nome de registro'.
    *   Verificar se existe um elemento `<label>` associado corretamente ao `input` usando os atributos `htmlFor` e `id` (ex: `<label htmlFor="nomeRegistro">Nome de registro</label><input id="nomeRegistro" ... />`).
    *   Na ausência de um `label` diretamente associado, verificar se o atributo `aria-label="Nome de registro"` ou `aria-labelledby` está presente e configurado corretamente no elemento `input`.
    *   Confirmar que o campo está preparado para receber o valor 'Lúcia Souza Registro 000002' e que não há conflitos ou sobreposições de elementos.
4.  **Verificação de Timing:** Se a estrutura do DOM e os atributos de acessibilidade estiverem corretos, investigar se o problema é de timing. O campo pode não estar totalmente carregado, visível ou interativo no momento em que o teste tenta acessá-lo. Pode ser necessário adicionar uma espera explícita com `page.waitForSelector()` ou `locator.waitFor()` antes da interação.
5.  **Ajuste do Componente ou Teste:** Implementar as correções necessárias, seja ajustando a acessibilidade do campo em `funcionario-form-page.tsx` (preferencialmente) ou refinando o seletor/estratégia de espera no teste `admin-unidade-base-equipe.spec.ts` para garantir que o Playwright consiga encontrar e interagir com o elemento corretamente.

**Test Strategy:**

1.  Executar o teste específico `npx playwright test tests/e2e/admin-unidade-base-equipe.spec.ts --grep "cobre cargos e funcionários da unidade"` em modo `headed` para depuração visual e observação do fluxo.
2.  Verificar se o teste passa sem falhas após a aplicação das correções.
3.  Garantir que a funcionalidade manual de adicionar/editar funcionários na interface de gerenciamento de unidades (Admin > Unidades > [Editar Unidade] > Equipe > [Adicionar/Editar Funcionário]) continua funcionando corretamente e que o campo 'Nome de registro' é preenchível e salvo.
