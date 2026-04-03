# Task ID: 340

**Title:** Revalidação e Análise de Regressões no Report Playwright

**Status:** done

**Dependencies:** 339 ✓

**Priority:** high

**Description:** Rerrodar buckets específicos do Playwright que ainda mostram falhas após a conclusão das tasks 338 e 339, visando diferenciar falhas 'stale' de regressões reais e estabelecer uma lista canônica de resíduos pendentes.

**Details:**

1.  Garantir que as Tasks 338 e 339 (Corrigir boundary server/client em /admin/importacao-evo) estejam concluídas e seus merges integrados na branch principal (e.g., `main`).
2.  Identificar os comandos Playwright para executar os buckets específicos: `demo-account`, `auth-rede`, `adesao-publica`, `dashboard`, `admin-backoffice-coverage`, `admin-backoffice-global-crud`. Estes podem ser acionados via tags Playwright (e.g., `npx playwright test --grep '@demo-account'`) ou especificando paths para os arquivos de teste (e.g., `npx playwright test tests/e2e/demo-account/`).
3.  Executar os testes no ambiente de CI/CD para garantir consistência e um ambiente limpo. Se necessário, rodar localmente para depuração inicial.
4.  Analisar o `playwright-report` gerado (`playwright-report/index.html`), focando exclusivamente nos resultados dos buckets re-executados.
5.  Para cada falha: a) Verificar se a falha é uma regressão real causada por mudanças recentes ou b) se é uma falha 'stale' (preexistente e ainda não endereçada por outras tasks). Consultar o histórico de falhas do CI, se disponível.
6.  Documentar as regressões reais identificadas, abrindo novas tasks/bugs conforme necessário para cada uma.
7.  Compilar e registrar a lista final de testes que *ainda* permanecem falhos e são considerados resíduos a serem corrigidos, distinguindo-os das falhas 'stale' que não são objeto desta revalidação.

**Test Strategy:**

1.  O sucesso da task não é a passagem de todos os testes, mas sim a clareza do relatório de falhas.
2.  O resultado final esperado é um documento (e.g., um Gist, arquivo Markdown ou comentário detalhado na task) que contenha:
    a.  Um resumo da re-execução dos testes para os buckets especificados (pass/fail count).
    b.  Uma análise detalhada das falhas, categorizando-as em: corrigidas (agora passando), novas regressões, e falhas 'stale' (preexistentes).
    c.  Uma lista canônica e clara das falhas que são consideradas 'regressões reais' ou bugs persistentes que demandam atenção futura.
    d.  Links para os `playwright-report` gerados após a revalidação como evidência.
