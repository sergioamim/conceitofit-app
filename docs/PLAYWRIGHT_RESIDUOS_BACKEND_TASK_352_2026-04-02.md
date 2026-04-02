# Task 352: investigação de resíduos de backend expostos por testes Playwright

## Objetivo

Consolidar, a partir dos artefatos de Playwright e das baselines recentes, quais interações com backend representam:

- resíduo real a corrigir no `academia-java`;
- detalhe de contrato a clarificar no frontend;
- ruído operacional do harness de teste, sem defeito de produto associado.

## Fontes revisadas

- `docs/Playwright_Report_2026-04-02_Revalidation.md`
- `docs/E2E_PLAYWRIGHT_FINAL_BASELINE_2026-04-01.md`
- `docs/PLAYWRIGHT_STABILIZATION_BASELINE_2026-04-01.md`
- `tests/e2e/comercial-smoke-real.spec.ts`
- `tests/e2e/adesao-publica.spec.ts`
- `tests/e2e/auth-rede.spec.ts`
- `tests/e2e/onboarding-fluxo-completo.spec.ts`
- `tests/e2e/support/backend-only-stubs.ts`
- `tests/e2e/support/auth-session.ts`
- `test-results/comercial-smoke-real-Smoke-1f3c3-endente-e-recebe-a-cobrança-chromium/*`
- `test-results/adesao-publica-Jornada-púb-33357-ratual-e-conclui-assinatura-chromium/*`
- `test-results/auth-rede-acesso-por-rede--a6bc2-de-e-segue-para-o-dashboard-chromium/*`
- `test-results/onboarding-fluxo-completo--197d5-conclui-o-checklist-inicial-chromium/*`

## Critério de classificação

- `Resíduo real de backend`: comportamento aceito pela aplicação de teste, mas inconsistente com a leitura posterior, contrato esperado ou superfície pública desejada.
- `Clarificação frontend/contrato`: interação que pode ser legítima, porém precisa de decisão explícita de arquitetura, escopo público ou padronização de contrato.
- `Ruído operacional`: evidência ligada ao ambiente de execução, relatório local ou bootstrap de teste, sem sinal forte de defeito de produto.

## Resumo executivo

1. O único resíduo claramente reproduzível com dono primário em backend continua sendo o pós-conversão do smoke comercial real: o backend aceita a conversão do prospect, mas aluno, matrícula e pagamento não ficam legíveis de forma consistente logo em seguida.
2. A jornada pública de adesão continua acessando endpoints típicos de shell protegido para compor catálogo e contexto. Isso não apareceu como falha funcional, mas merece hardening e formalização de contrato porque a superfície é pública.
3. O contrato de auth por rede está coerente com a baseline recente: `X-Rede-Identifier` é o canal canônico de contexto. Esse ponto serve mais como referência para julgar outros fluxos do que como bug.
4. `localhost:9323` e o erro de build em `src/lib/api/session.ts` são relevantes para triagem, mas não configuram resíduo de backend: o primeiro é operacional, o segundo é um bloqueador de frontend/build.

## Matriz consolidada

| ID | Classificação | Endpoint / interação | Contexto | Dono principal | Prioridade |
| --- | --- | --- | --- | --- | --- |
| R1 | Resíduo real de backend | `POST /api/v1/crm/prospects/converter` seguido por leituras em `GET /api/v1/comercial/alunos`, `GET /api/v1/comercial/alunos/{id}/matriculas` e `GET /api/v1/comercial/pagamentos` | `tests/e2e/comercial-smoke-real.spec.ts` | Backend | Alta |
| C1 | Clarificação frontend/contrato | `GET /api/v1/context/unidade-ativa`, `GET /api/v1/academia`, `GET /api/v1/comercial/planos`, `GET /api/v1/gerencial/financeiro/formas-pagamento` em jornada pública | `tests/e2e/adesao-publica.spec.ts` | Frontend + Backend | Média |
| C2 | Clarificação de contrato canônico | `X-Rede-Identifier` em `GET /api/v1/auth/rede-contexto`, `POST /api/v1/auth/login`, `POST /api/v1/auth/forgot-password`, `POST /api/v1/auth/first-access` | `tests/e2e/auth-rede.spec.ts` | Frontend | Baixa |
| C3 | Débito controlado de contrato | `POST /api/v1/comercial/planos?tenantId=...` após login e troca de senha no onboarding | `tests/e2e/onboarding-fluxo-completo.spec.ts` | Frontend + Backend | Baixa |
| O1 | Ruído operacional | referências a `localhost:9323` | relatório antigo revalidado na task 348 | Operacional | Baixa |
| O2 | Bloqueador fora do escopo backend | erro de build em `src/lib/api/session.ts` | reruns de `adesao-publica.spec.ts` e `comercial-fluxo.spec.ts` | Frontend | Alta |

## Itens detalhados

### R1. Pós-conversão comercial não fica legível de forma consistente

- Endpoint principal:
  - `POST /api/v1/crm/prospects/converter?tenantId={tenantId}`
- Leituras imediatamente dependentes:
  - `GET /api/v1/comercial/alunos?tenantId={tenantId}&search={cpf}&page=0&size=5&envelope=true`
  - `GET /api/v1/comercial/alunos/{alunoId}/matriculas?tenantId={tenantId}&page=0&size=10`
  - `GET /api/v1/comercial/pagamentos?tenantId={tenantId}&alunoId={alunoId}&page=0&size=20`
- Método HTTP:
  - `POST` para conversão
  - `GET` para confirmação dos artefatos
- Payload relevante:

```json
{
  "prospectId": "<id>",
  "cpf": "<cpf>",
  "dataNascimento": "1993-07-15",
  "sexo": "M",
  "planoId": "<planoId>",
  "dataInicio": "2026-04-01",
  "formaPagamento": "PIX"
}
```

- Contexto do teste:
  - `tests/e2e/comercial-smoke-real.spec.ts` usa backend real via `APIRequestContext`, autentica operador, cria prospect, promove o prospect até estado conversível, converte e tenta reabrir os artefatos criados.
- Evidência:
  - o spec registra explicitamente `"[smoke-real] conversao aceita pelo backend; buscando artefatos criados"` em `tests/e2e/comercial-smoke-real.spec.ts:262`;
  - a falha final é `Conversao concluida, mas aluno/matricula/pagamento nao ficaram legiveis...` em `tests/e2e/comercial-smoke-real.spec.ts:341`;
  - o snapshot do erro mostra o shell operacional carregado e o prospect aparecendo na interface, sem confirmação dos artefatos finais em `test-results/comercial-smoke-real-Smoke-1f3c3-endente-e-recebe-a-cobrança-chromium/error-context.md`;
  - evidência visual adicional disponível em `test-results/comercial-smoke-real-Smoke-1f3c3-endente-e-recebe-a-cobrança-chromium/test-failed-1.png` e `test-results/comercial-smoke-real-Smoke-1f3c3-endente-e-recebe-a-cobrança-chromium/video.webm`.
- Problema potencial:
  - o write-path aparenta sucesso, mas o read-path imediato não encontra os artefatos esperados de forma estável;
  - isso aponta para inconsistência transacional, indexação assíncrona, atraso de projeção, ou divergência entre comando de conversão e endpoints de leitura.
- Ação proposta:
  - backend: revisar garantias transacionais da conversão e o momento em que aluno, matrícula e pagamento passam a integrar as consultas de leitura;
  - backend: confirmar se a consistência esperada é síncrona; se não for, formalizar resposta assíncrona ou polling contratual;
  - frontend: não há evidência de bug primário aqui, porque o próprio smoke usa o backend diretamente e a leitura falha depois do `200/201`.

### C1. Jornada pública usa endpoints típicos de shell protegido

- Endpoints observados:
  - `GET /api/v1/unidades`
  - `GET /api/v1/context/unidade-ativa`
  - `GET /api/v1/academia`
  - `GET /api/v1/comercial/planos`
  - `GET /api/v1/gerencial/financeiro/formas-pagamento`
  - além dos endpoints públicos canônicos em `/api/v1/publico/adesao/*`
- Método HTTP:
  - `GET` nas leituras de contexto e catálogo;
  - `POST` nos passos públicos de trial, cadastro, checkout, OTP, assinatura e confirmação de pagamento.
- Contexto do teste:
  - `tests/e2e/adesao-publica.spec.ts` captura requests do navegador e exige explicitamente essas chamadas nas linhas `79` a `85`.
- Payload/resposta relevante:
  - não há body nas leituras `GET`;
  - os mocks públicos em `tests/e2e/support/backend-only-stubs.ts` devolvem dados mínimos de tenant, academia, catálogo e formas de pagamento para compor a jornada.
- Evidência:
  - `tests/e2e/adesao-publica.spec.ts:79-85` e `:138-143`;
  - o bucket estabilizado da task 333 continua descrito em `docs/PLAYWRIGHT_STABILIZATION_BASELINE_2026-04-01.md:67-71`;
  - o snapshot atual só mostra a tela em loading, sem evidência de resposta sensível vazada, em `test-results/adesao-publica-Jornada-púb-33357-ratual-e-conclui-assinatura-chromium/error-context.md`;
  - evidência visual adicional disponível em `test-results/adesao-publica-Jornada-púb-33357-ratual-e-conclui-assinatura-chromium/test-failed-1.png` e `test-results/adesao-publica-Jornada-púb-33357-ratual-e-conclui-assinatura-chromium/video.webm`.
- Problema potencial:
  - numa jornada pública, `context/unidade-ativa` e `academia` soam como endpoints de shell autenticado;
  - `formas-pagamento` e `planos` podem ser válidos como catálogo público, mas precisam de contrato explícito para evitar exposição acidental de atributos internos.
- Ação proposta:
  - frontend: documentar que a jornada pública depende dessas leituras como catálogo/control-plane, ou migrar para endpoints públicos dedicados;
  - backend: revisar se esses `GET`s já filtram campos internos e se aceitam acesso não autenticado de forma intencional;
  - prioridade média porque não há falha funcional reproduzida, mas há acoplamento público a endpoints com semântica de app autenticado.

### C2. Auth por rede confirma o contrato canônico por header

- Endpoints observados:
  - `GET /api/v1/auth/rede-contexto`
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/forgot-password`
  - `POST /api/v1/auth/first-access`
- Método HTTP:
  - `GET` para resolução de contexto da rede
  - `POST` para login e fluxos de credencial
- Payload relevante:

```json
{
  "identifier": "ana@qa.local",
  "password": "12345678",
  "channel": "APP"
}
```

- Header relevante:
  - `X-Rede-Identifier: rede-norte`
- Contexto do teste:
  - `tests/e2e/auth-rede.spec.ts` declara o contrato atual nas linhas `15-19` e captura `x-rede-identifier` nas linhas `40-46`.
- Evidência:
  - `docs/PLAYWRIGHT_STABILIZATION_BASELINE_2026-04-01.md:57-66`;
  - `tests/e2e/auth-rede.spec.ts:15-19`, `:45-46`, `:76-80`, `:114-118`, `:128-132`;
  - evidência visual adicional disponível em `test-results/auth-rede-acesso-por-rede--a6bc2-de-e-segue-para-o-dashboard-chromium/test-failed-1.png` e `test-results/auth-rede-acesso-por-rede--a6bc2-de-e-segue-para-o-dashboard-chromium/video.webm`.
- Problema potencial:
  - não é um resíduo; é a régua contratual a ser aplicada nos fluxos de rede;
  - qualquer fluxo novo que envie `tenantId` ou outro seletor legado para autenticação por rede tende a nascer desalinhado.
- Ação proposta:
  - frontend: tratar esse contrato como canônico e evitar introduzir body/query legados onde a resolução por rede já está definida por host/rota/header;
  - backend: nenhuma ação corretiva indicada por este artefato.

### C3. Onboarding ainda cria plano operacional com `tenantId` em query

- Endpoint observado:
  - `POST /api/v1/comercial/planos?tenantId={activeTenantId}`
- Método HTTP:
  - `POST`
- Payload relevante:

```json
{
  "nome": "Plano Start QA",
  "tipo": "MENSAL",
  "duracaoDias": 30,
  "valor": 149.9,
  "valorMatricula": 0
}
```

- Contexto do teste:
  - após `POST /api/v1/admin/onboarding/provision`, o spec faz login do administrador provisionado com `fetch("/api/v1/auth/login")`, semeia sessão E2E e conclui o checklist criando o primeiro plano por `fetch` no browser.
- Evidência:
  - `tests/e2e/onboarding-fluxo-completo.spec.ts:71-80`, `:102-121`, `:183-201`;
  - o snapshot do erro para este bucket para em `Validando contexto do primeiro acesso...`, sem mostrar falha do endpoint de plano em si, em `test-results/onboarding-fluxo-completo--197d5-conclui-o-checklist-inicial-chromium/error-context.md`;
  - evidência visual adicional disponível em `test-results/onboarding-fluxo-completo--197d5-conclui-o-checklist-inicial-chromium/test-failed-1.png` e `test-results/onboarding-fluxo-completo--197d5-conclui-o-checklist-inicial-chromium/video.webm`.
- Problema potencial:
  - não há indício de quebra de backend neste endpoint;
  - o ponto aqui é a manutenção de um contrato query-based (`tenantId`) em fluxo operacional que depende de sessão recém-provisionada e bootstrap manual do teste.
- Ação proposta:
  - frontend: manter como contrato atual de unidade, mas documentar explicitamente que onboarding pós-login opera em contexto de tenant ativo e não em contexto de rede;
  - backend: sem urgência de mudança, salvo decisão arquitetural futura de uniformizar seleção de contexto.

### O1. `localhost:9323` não é bug de produto

- Interação observada:
  - referências ao host `localhost:9323`
- Contexto:
  - relatório antigo revalidado na task 348
- Evidência:
  - `docs/Playwright_Report_2026-04-02_Revalidation.md:14-16` e `:70-72`
- Conclusão:
  - o host pertence ao `playwright show-report`;
  - sem artefato persistido no repositório, isso fica classificado como referência operacional obsoleta.

### O2. Erro de build em `src/lib/api/session.ts` bloqueia reruns, mas não é resíduo de backend

- Interação observada:
  - falha de compilação do app antes da jornada funcional
- Contexto:
  - reruns de `tests/e2e/adesao-publica.spec.ts` e `tests/e2e/comercial-fluxo.spec.ts`
- Evidência:
  - `docs/Playwright_Report_2026-04-02_Revalidation.md:42-45`, `:52-55`, `:73-74`, `:79-98`
- Conclusão:
  - a dupla declaração de `ACCESS_TOKEN_COOKIE_KEY` é um bloqueador real de frontend/build;
  - ela não deve contaminar a análise de resíduos de backend.

## Recomendações priorizadas

1. Backend, alta: investigar a consistência do fluxo `prospect -> cliente -> matrícula -> pagamento` após `POST /api/v1/crm/prospects/converter`.
2. Frontend + backend, média: decidir se a jornada pública continuará usando `context/unidade-ativa`, `academia`, `planos` e `formas-pagamento` como endpoints públicos indiretos ou se será migrada para uma superfície pública dedicada.
3. Frontend, baixa: reforçar nas suites e na documentação que auth por rede usa `X-Rede-Identifier` como contrato canônico.
4. Frontend, baixa: documentar no onboarding que o primeiro plano é criado em contexto de tenant operacional ativo, ainda baseado em `tenantId` na query.

## Conclusão

A análise dos artefatos revisados não mostrou uma coleção ampla de resíduos de backend. O cenário com problema concreto e reproduzível continua concentrado no smoke comercial com backend real, após a conversão do prospect. Os demais pontos observados são, em sua maioria, questões de superfície contratual e de clareza entre jornada pública, autenticação por rede e bootstrap de sessão E2E.
