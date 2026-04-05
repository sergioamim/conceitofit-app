# Task ID: 426

**Title:** Corrigir timeout no teste E2E 'super user volta ao backoffice após visualizar uma unidade'

**Status:** done

**Dependencies:** 350 ✓, 338 ✓

**Priority:** high

**Description:** Investigar e corrigir o timeout no teste Playwright 'super user volta ao backoffice após visualizar uma unidade' em 'backoffice-entrar-como-academia.spec.ts', causado por um seletor de botão incorreto ou falha no fluxo de retorno.

**Details:**

O teste `tests/e2e/backoffice-entrar-como-academia.spec.ts` falha no cenário 'super user volta ao backoffice após visualizar uma unidade' devido a um timeout de 120s, especificamente ao tentar localizar o botão 'Voltar ao backoffice'.

1.  **Análise do Componente `impersonation-banner.tsx`:**
    *   Localizar o arquivo `src/components/impersonation-banner.tsx`. Usar as ferramentas de análise de código para inspecionar o texto exato do botão ou link que permite ao super usuário encerrar a personificação e retornar ao backoffice. O texto pode ser 'Encerrar impersonação' ou outra variação.

2.  **Atualização do Teste Playwright:**
    *   No arquivo `tests/e2e/backoffice-entrar-como-academia.spec.ts`, identificar o seletor Playwright que busca pelo botão 'Voltar ao backoffice'.
    *   Atualizar o seletor para usar o texto correto identificado no `impersonation-banner.tsx` (por exemplo, `page.getByRole('button', { name: 'Encerrar impersonação' })`). Certificar-se de que o tipo de elemento (botão, link) e o nome acessível são corretamente especificados.

3.  **Verificação do Fluxo de Retorno ao Backoffice:**
    *   Confirmar que o fluxo de retorno ao backoffice funciona corretamente após clicar no botão de despersonificação.
    *   Observar as requisições de rede feitas durante o processo de encerramento da personificação. Isso pode incluir chamadas para deslogar a sessão de personificação (ex: `DELETE /api/v1/auth/impersonate`) ou para buscar informações do usuário (`GET /api/v1/auth/user`) após o retorno.

4.  **Verificação de Mocks de API:**
    *   Se o fluxo de retorno envolver chamadas de API que não estão sendo corretamente mockadas, adicionar ou ajustar os mocks necessários nos arquivos de stubbing (por exemplo, `tests/e2e/support/backend-only-stubs.ts` ou arquivos relacionados) para garantir que o ambiente de teste replique o comportamento esperado da API.

**Test Strategy:**

1.  Executar o teste Playwright específico `npx playwright test tests/e2e/backoffice-entrar-como-academia.spec.ts --grep "super user volta ao backoffice após visualizar uma unidade"` em modo `headed` para depuração visual e observação do fluxo.
2.  Verificar se o teste passa sem falhas após a aplicação das correções.
3.  Garantir que o fluxo completo de personificação e despersonificação, incluindo a navegação de volta ao backoffice, funcione corretamente na aplicação em ambiente de desenvolvimento ou staging, testando manualmente como um super usuário.
