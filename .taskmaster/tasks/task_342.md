# Task ID: 342

**Title:** Corrigir testes Playwright dos buckets restantes do backoffice global

**Status:** done

**Dependencies:** 338 ✓, 339 ✓, 340 ✓

**Priority:** high

**Description:** Ajustar os testes E2E para os módulos admin-catalogo-crud, admin-unidade-base-equipe, admin-config-api-only, backoffice-global, backoffice-seguranca, backoffice-seguranca-rollout, backoffice-configuracoes, backoffice-impersonation e bi-operacional, garantindo bootstrap do shell /admin, contratos de autorização, mocks e asserts corretos.

**Details:**

1.  **Identificar Testes Afetados:** Revisar os arquivos de teste Playwright em `tests/e2e/` que cobrem as rotas e funcionalidades dos buckets listados: `admin-catalogo-crud`, `admin-unidade-base-equipe`, `admin-config-api-only`, `backoffice-global`, `backoffice-seguranca`, `backoffice-seguranca-rollout`, `backoffice-configuracoes`, `backoffice-impersonation` e `bi-operacional`. A Task 340 deve fornecer um relatório atualizado de falhas para estes.2.  **Bootstrap do Shell /admin:** Assegurar que o carregamento inicial de cada página `admin/*` nos testes esteja correto. Isso inclui a verificação da inicialização do contexto de usuário, unidade e permissões, conforme estabelecido por Tasks anteriores como a Task 3.3.  **Contratos de Autorização:** Para cada rota e chamada de API, verificar se os contratos de autorização (headers, escopos, roles) mockados em `tests/e2e/support/backend-only-stubs.ts` ou mocks similares, correspondem ao que o frontend espera e o backend real exige. Ajustar os stubs para refletir a lógica de autorização atual do sistema.4.  **Mocks Mínimos Aderentes:** Auditar e corrigir os mocks de API para garantir que devolvam dados válidos e minimamente completos para que a UI renderize corretamente e o fluxo de teste possa prosseguir. Focar na completude mínima dos payloads para evitar erros de UI por dados faltantes ou inesperados.5.  **Asserts Alinhados com a UI Atual:** Atualizar os seletores, textos esperados e interações nos testes Playwright para que correspondam à interface de usuário mais recente. Remover asserts de elementos que foram removidos ou alterados e adicionar novos asserts para funcionalidades ou elementos visuais recém-introduzidos.6.  **Gerenciamento de Estado:** Investigar e corrigir quaisquer problemas relacionados ao estado da aplicação (ex: dados em cache, cookies, localStorage) que possam estar causando falhas intermitentes nos testes ou impedindo a reprodução correta de cenários.

**Test Strategy:**

1.  Executar os testes Playwright para cada bucket individualmente após as correções:    *   `npx playwright test tests/e2e/admin-catalogo-crud.spec.ts` (ou o nome do arquivo correspondente)    *   Repetir para `admin-unidade-base-equipe`, `admin-config-api-only`, `backoffice-global`, `backoffice-seguranca`, `backoffice-seguranca-rollout`, `backoffice-configuracoes`, `backoffice-impersonation` e `bi-operacional`.2.  Confirmar que todos os cenários para cada um desses buckets passam consistentemente.3.  Verificar que o bootstrap do shell `/admin` ocorre sem erros visíveis ou de console durante a execução dos testes.4.  Confirmar que a navegação e interações de CRUD (Create, Read, Update, Delete) quando aplicáveis aos buckets funcionam como esperado na UI e são validados pelos asserts do Playwright.5.  Integrar as correções na branch principal e monitorar a CI/CD para regressões futuras, especialmente após a conclusão da Task 340.
