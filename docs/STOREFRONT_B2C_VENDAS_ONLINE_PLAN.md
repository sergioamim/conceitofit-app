# Storefront B2C — Vendas Online (Plano de Escopo)

**Data:** 2026-04-26  
**Persona:** `@po`  
**Repo dono da frente:** `academia-app`  
**Repo fornecedor de contrato e regra:** `academia-java`  
**Escopo deste artefato:** planejamento de produto e entrega. Nao cobre layout/discovery visual.

---

## 1. Resumo executivo

Hoje o ecossistema ja possui uma **jornada publica de adesao parcialmente funcional** e um **backend com endpoints publicos de adesao e storefront**, mas a frente "Storefront B2C / Vendas online" ainda **nao pode ser considerada implementada** porque a vitrine publica nao fecha o loop comercial.

O problema principal nao e "falta de checkout do zero". O que falta e conectar de forma canonica:

1. **vitrine publica -> catalogo real de planos**;
2. **catalogo/storefront -> jornada publica de adesao**;
3. **jornada publica -> contratos publicos reais, sem dependencia de endpoints operacionais**;
4. **checkout publico -> regras comerciais B2C faltantes**, com destaque para elegibilidade de plano para venda online e cupom online; CAPTCHA fica como endurecimento opcional posterior.

Conclusao de produto: o MVP de vendas online deve focar em **fechar a contratacao digital ponta a ponta**, aproveitando o que ja existe de adesao/checkout, em vez de abrir um projeto novo de UX.

---

## 2. Diagnostico: o que ja existe vs. o que falta

### 2.1 O que ja existe

#### `academia-app`

- Existe jornada publica em `/adesao/*` com rotas de:
  - landing/planos;
  - trial;
  - cadastro;
  - checkout;
  - pendencias.
- Existe fluxo de CTA para adesao a partir de componentes de storefront, como `StorefrontPlanos`.
- Existem proxies/rotas de storefront que redirecionam para a jornada publica canonica.
- Existe suite E2E cobrindo a jornada publica de adesao com trial, cadastro, checkout, assinatura e confirmacao de pagamento.

Arquivos-evidencia:

- `src/app/(public)/adesao/page.tsx`
- `src/app/(public)/adesao/cadastro/page.tsx`
- `src/app/(public)/adesao/checkout/page.tsx`
- `src/app/(public)/adesao/pendencias/page.tsx`
- `tests/e2e/adesao-publica.spec.ts`

#### `academia-java`

- Ja existe contrato publico de adesao:
  - `GET /api/v1/publico/adesao/catalogo`
  - `POST /api/v1/publico/adesao/trials`
  - `POST /api/v1/publico/adesao/cadastros`
  - `POST /api/v1/publico/adesao/{id}/checkout`
  - `POST /api/v1/publico/adesao/{id}/contrato/otp`
  - `POST /api/v1/publico/adesao/{id}/contrato/assinaturas`
  - `POST /api/v1/publico/adesao/{id}/pagamento/confirmacao`
  - `GET /api/v1/publico/adesao/{id}` e pendencias.
- Ja existe contrato publico de storefront:
  - overview;
  - theme;
  - planos por academia;
  - atividades;
  - unidade detalhada;
  - sitemap/seo.

Arquivos-evidencia:

- `modulo-app/src/main/java/fit/conceito/app/application/controller/AdesaoPublicaController.java`
- `modulo-app/src/main/java/fit/conceito/app/application/controller/storefront/StorefrontPublicController.java`
- `modulo-app/src/main/java/fit/conceito/app/application/service/AdesaoDigitalPublicaService.java`
- `modulo-app/src/main/java/fit/conceito/app/application/service/storefront/StorefrontPublicService.java`

#### Artefatos de produto ja documentados

- Theme/branding da storefront: material documentado.
- Cupom B2C com CAPTCHA: PRD aprovado em **2026-04-24**.
- A decisao deste plano, em **2026-04-26**, e tratar CAPTCHA como etapa final opcional, nao como bloqueio do MVP comercial.

Arquivo-evidencia:

- `docs/VOUCHER_ONLINE_STOREFRONT_PRD.md`

### 2.2 O que falta para considerar "vendas online" implementadas

#### Gap A — A vitrine principal ainda nao exibe planos reais

Hoje a storefront por slug ainda faz:

- `const planos: Plano[] = []`

na pagina principal, impedindo a vitrine de mostrar ofertas e disparar compra a partir do caminho principal de SEO/storefront.

Arquivo-evidencia:

- `src/app/(public)/storefront/[academiaSlug]/page.tsx`

Observacao: a storefront raiz tambem nao fecha esse carregamento de planos. O adapter `getStorefrontPlanos()` existe, mas nao esta sendo usado na pagina principal.

Arquivo-evidencia:

- `src/app/(public)/storefront/page.tsx`
- `src/lib/public/storefront-api.ts`

#### Gap B — A jornada publica ainda monta contexto via endpoints operacionais

O contexto server-side da jornada publica ainda busca:

- `/api/v1/unidades`
- `/api/v1/context/unidade-ativa/{tenantId}`
- `/api/v1/academia`
- `/api/v1/comercial/planos`
- `/api/v1/gerencial/financeiro/formas-pagamento`

Isso indica que a jornada publica ainda nao esta ancorada apenas na superficie publica canonicamente pensada para B2C.

Arquivo-evidencia:

- `src/lib/public/server-services.ts`

Implicacao de produto:

- mesmo existindo checkout publico no backend, a jornada ainda depende de contratos que nao sao a fundacao ideal para um canal anonimo B2C;
- isso aumenta risco de regressao, auth/context drift e comportamento diferente entre demo/mocks e producao real.

#### Gap C — Falta fechar o contrato canonico entre storefront e adesao

O frontend ja usa deep link por slug de plano em:

- `src/app/(public)/storefront/plano/[slug]/page.tsx`

Mas nao foi localizada no backend uma rota publica equivalente para resolver plano por slug dentro de `/api/v1/publico/adesao/*`. Isso aponta um gap de contrato ou um adapter incompleto.

Implicacao de produto:

- SEO/link direto de plano pode nao fechar corretamente;
- o funil pode depender demais de `planId` tecnico ou de contexto previo de tenant.

#### Gap D — Falta elegibilidade explicita de plano para venda online

Nem todo plano ativo deve necessariamente aparecer ou ser contratavel no canal B2C. O planejamento atual ainda nao explicita uma configuracao do tipo:

- `permitirVendaOnline`;
- `disponivelNoStorefront`;
- ou regra equivalente no contrato publico.

Implicacao de produto:

- plano ativo no operacional pode vazar indevidamente para o canal publico;
- a storefront pode exibir ofertas que a operacao nao quer vender online;
- o CTA de compra pode levar o usuario para um checkout de um plano que deveria ser apenas interno/presencial.

#### Gap E — Cupom online aprovado ainda nao esta integrado ao checkout B2C

O checkout publico atual nao mostra capacidade de:

- aplicar cupom;
- recalcular preview publico do total;
- reenviar validacao do cupom no commit da compra.

Como esse PRD ja foi aprovado em **2026-04-24**, ele deve entrar como evolucao funcional do canal B2C, mas sem bloquear o MVP comercial nem a primeira onda tecnica de wiring da vitrine.

#### Gap F — Validacao atual privilegia mocks da jornada, nao fechamento real storefront -> compra

Ja existem testes E2E da adesao publica, mas o principal funil comercial a partir da storefront ainda nao aparece como trilha validada ponta a ponta no estado observado.

Implicacao:

- o produto ainda nao tem evidência forte de que "entrou pela vitrine, escolheu plano, contratou online" esteja verde no backend real.

---

## 3. Definicao de pronto para "vendas online implementadas"

Para considerar a frente implementada, o usuario anonimo deve conseguir:

1. entrar na storefront publica por slug/subdominio;
2. visualizar planos reais da academia/unidade elegiveis para venda online;
3. selecionar um plano valido;
4. seguir para cadastro e checkout sem depender de superficie operacional interna;
5. concluir contratacao com contrato e pagamento dentro do fluxo publico;
6. acompanhar pendencias/status da adesao;
7. opcionalmente aplicar cupom online valido;
8. opcionalmente endurecer a aplicacao de cupom com CAPTCHA, se o canal exigir isso depois.

Se qualquer um desses pontos falhar no caminho principal da storefront, a frente ainda deve ser tratada como parcial.

---

## 4. Proposta de escopo MVP

## 4.1 MVP recomendado

### Objetivo do MVP

Fechar o loop de compra B2C saindo da storefront publica e chegando a uma adesao concluida, usando contratos publicos canonicos e sem redesenho da jornada.

### Itens dentro do MVP

1. **Carregar planos reais na storefront**
   - slug e subdominio;
   - apenas planos elegiveis para venda online;
   - cards com CTA funcional para adesao.

2. **Canonizar a passagem storefront -> adesao**
   - tenant/plano selecionado;
   - links deep linkaveis;
   - fallback consistente quando nao houver plano/unidade.

3. **Remover dependencia estrutural de endpoints operacionais na jornada publica**
   - trocar a base de catalogo/tenant/plano para contratos publicos;
   - deixar o canal B2C operando como superficie publica de verdade.

4. **Fechar o checkout publico atual como compra online**
   - criar/atualizar adesao;
   - iniciar checkout;
   - assinar contrato;
   - confirmar pagamento;
   - refletir status e pendencias.

5. **Introduzir regra explicita de elegibilidade de plano para venda online**
   - plano ativo nao implica plano vendavel no B2C;
   - storefront e checkout devem respeitar o mesmo filtro canonico.

6. **Acoplar cupom online no checkout**
   - sem redesenho de layout, usando a tela de checkout existente;
   - CAPTCHA fica fora do MVP e como etapa opcional posterior.

7. **Observabilidade e validacao minima da trilha principal**
   - smoke/E2E da trilha:
     - storefront -> plano -> cadastro -> checkout -> pendencias -> conclusao.

## 4.2 Fora de escopo do MVP

- redesign visual da storefront;
- discovery visual com Claude design;
- A/B testing, CRO avancado e otimização de landing;
- carrinho multi-item;
- cross-sell, upsell e bundles;
- login/area do aluno integrada no mesmo funil;
- recuperacao de checkout abandonado;
- wallet, recorrencia avancada e antifraude sofisticado;
- convenios no storefront B2C;
- marketplace/agregadores externos;
- analytics de atribuicao/UTM como requisito de release.

---

## 5. Dependencias entre `academia-app` e `academia-java`

## 5.1 Ownership

- `academia-app`
  - dono da experiencia publica;
  - roteamento, copy, estados, CTA, SSR/storefront;
  - orquestracao do funil B2C.

- `academia-java`
  - dono do contrato HTTP publico;
  - regra de negocio comercial;
  - resolucao de tenant/plano/storefront;
  - contrato, pagamento, pendencias;
  - validacao e consumo do cupom online.

## 5.2 Dependencias concretas do MVP

### Onda 1 — vitrine e catalogo

- `academia-app` depende de `academia-java` para:
  - `/api/v1/publico/storefront/{academiaSlug}/planos`
  - `/api/v1/publico/storefront/{academiaSlug}/unidades/{tenantId}`
  - estabilidade do shape dos planos publicos;
  - sinalizacao canonica de elegibilidade do plano para venda online.

### Onda 2 — jornada publica canonica

- `academia-app` depende de `academia-java` para:
  - contrato publico suficiente para montar catalogo/unidade/plano sem usar endpoints operacionais;
  - definicao de quais meios de pagamento sao publicamente elegiveis no B2C.

Observacao de produto:

- hoje a jornada publica consome formas de pagamento de endpoint operacional; isso pede decisao de contrato:
  - expor no catalogo publico;
  - expor endpoint publico proprio;
  - ou assumir subset fixo de meios aceitos no MVP.

### Onda 3 — deep link e consistencia de plano

- `academia-app` depende de `academia-java` para confirmar a estrategia oficial de resolucao de plano:
  - por `planId`;
  - por `slug`;
  - por `academiaSlug + planoSlug`;
  - com ou sem unidade no path/query.

### Onda 4 — cupom online sem CAPTCHA

- `academia-app` depende de `academia-java` para:
  - endpoint publico de preview/validacao do cupom;
  - validacao final do cupom no commit da compra;
  - tratamento de erros anonimos vs identificados;
  - compatibilidade com a regra de elegibilidade do plano.

### Onda 5 — CAPTCHA opcional como endurecimento

- `academia-app` depende de `academia-java` para:
  - integracao opcional com CAPTCHA;
  - estrategia de enablement por feature flag ou configuracao;
  - rate limit e observabilidade complementares.

## 5.3 Riscos transversais

- drift entre DTO de storefront e mapeamento local do frontend;
- manter a jornada publica apoiada em superficie operacional e quebrar anonimizacao do canal;
- link por slug de plano divergir do contrato real;
- plano ativo vazar no B2C sem elegibilidade explicita para venda online;
- validar cupom no preview, mas nao revalidar corretamente no commit;
- considerar a vitrine pronta sem prova E2E da trilha comercial principal.

---

## 6. Backlog fatiado em ondas entregaveis

## Onda 0 — Alinhamento de contrato e regra de pronto

### Story B2C-00 — Fechar contrato-alvo do canal publico

**Objetivo:** consolidar o contrato minimo para que storefront e adesao usem superficie publica canonica.

**Entregas:**

- matriz de endpoints publicos usados no MVP;
- decisao sobre meios de pagamento no B2C;
- decisao sobre resolucao de plano por slug;
- decisao sobre a configuracao canonica de elegibilidade de plano para venda online;
- checklist de compatibilidade `academia-app` x `academia-java`.

**Dependencia principal:** `academia-java`.

---

## Onda 1 — Vitrine vendavel

### Story B2C-01 — Popular planos na storefront principal

**Objetivo:** fazer a home da storefront por slug/subdominio exibir planos reais.

**Entregas:**

- usar endpoint publico de planos;
- respeitar filtro de elegibilidade para venda online;
- renderizar cards ordenados/destaques;
- CTA para adesao com tenant/plano corretos;
- estados vazios/erro coerentes.

### Story B2C-02 — Garantir unidade/plano como caminho de compra

**Objetivo:** permitir compra tanto pela home quanto pela pagina da unidade/plano.

**Entregas:**

- deep links consistentes;
- fallback de single-unit vs multiunit;
- protecao contra acesso direto a plano nao elegivel para venda online;
- links canonicos sem depender de navegacao previa.

**Saida de negocio da Onda 1:**

- a vitrine finalmente passa a vender, e nao apenas apresentar branding.

---

## Onda 2 — Jornada publica canonica

### Story B2C-03 — Migrar contexto da adesao para contratos publicos

**Objetivo:** remover dependencia estrutural da jornada publica de endpoints operacionais.

**Entregas:**

- contexto de tenant/plano/catalogo orientado a `/api/v1/publico/*`;
- reducao de acoplamento com `context/unidade-ativa`, `comercial/planos`, `formas-pagamento` operacionais;
- regra clara e unica de quais planos podem ou nao ser vendidos online;
- estrategia clara para meios de pagamento publicos.

### Story B2C-04 — Validar trilha anonima ponta a ponta

**Objetivo:** garantir que usuario sem sessao consiga sair da vitrine e abrir checkout sem auth/context hacks.

**Entregas:**

- smoke/E2E cobrindo o caminho real;
- manejo de erros de tenant/plano inexistente;
- comportamento consistente em slug e subdominio.

**Saida de negocio da Onda 2:**

- canal B2C passa a operar sobre contratos publicos coerentes.

---

## Onda 3 — Fechamento comercial do checkout

### Story B2C-05 — Formalizar definicao de compra concluida

**Objetivo:** estabilizar a semantica de status para o funil B2C.

**Entregas:**

- estados claros de:
  - checkout iniciado;
  - aguardando assinatura;
  - aguardando pagamento;
  - concluida;
  - falha/cancelada.

### Story B2C-06 — Evidencia de venda online real

**Objetivo:** provar que o canal gera uma adesao contratada e paga a partir da storefront.

**Entregas:**

- trilha automatizada ou smoke documentado com backend real;
- checklist de evidencias minimas para release.

**Saida de negocio da Onda 3:**

- ja e legitimo marcar "vendas online" como implementado, mesmo sem cupom online.

---

## Onda 4 — Cupom online sem CAPTCHA

### Story B2C-07 — Preview de cupom no checkout publico

**Objetivo:** permitir aplicacao de cupom online no checkout.

**Entregas:**

- campo de cupom no checkout existente;
- preview de desconto;
- mensagens genericas para invalidacao anonima.

### Story B2C-08 — Validacao definitiva do cupom no commit

**Objetivo:** garantir consistencia entre preview e efetivacao do desconto.

**Entregas:**

- revalidacao no backend na confirmacao da compra;
- suporte a `usarOnline`;
- tratamento de `umaVezPorCliente`;
- logs basicos de validacao.

**Saida de negocio da Onda 4:**

- storefront B2C apta para campanhas de aquisicao com cupom.

---

## Onda 5 — CAPTCHA opcional como endurecimento

### Story B2C-09 — Introduzir CAPTCHA opcional no fluxo de cupom

**Objetivo:** endurecer o fluxo de aplicacao de cupom apenas se houver necessidade operacional real.

**Entregas:**

- CAPTCHA no submit de aplicar cupom;
- feature flag ou configuracao para ligar/desligar;
- rate limit complementar;
- observabilidade de tentativas bloqueadas.

**Saida de negocio da Onda 5:**

- o canal ganha endurecimento adicional sem ter bloqueado a entrada do MVP.

---

## 7. Criterios de aceite de alto nivel

## 7.1 Aceite do MVP de vendas online

Considerar o MVP aceito quando:

1. a storefront publica por slug ou subdominio exibe planos reais;
2. apenas planos elegiveis para venda online aparecem como compraveis;
3. cada plano elegivel permite iniciar a adesao sem depender de navegacao interna improvisada;
4. a jornada publica funciona para usuario anonimo usando contratos publicos definidos para o canal;
5. cadastro, checkout, contrato, pagamento e pendencias funcionam como fluxo unico de contratacao;
6. existe validacao automatizada ou smoke documentado do caminho storefront -> compra;
7. erros de tenant/plano/storefront indisponivel possuem tratamento claro.

## 7.2 Aceite adicional da onda de cupom online

1. usuario aplica cupom no checkout publico;
2. preview recalcula o total corretamente;
3. backend revalida o cupom no commit da compra;
4. falhas anonimas usam mensagem generica;
5. falhas identificadas no commit usam mensagem adequada ao cliente.

## 7.3 Aceite adicional da onda opcional de CAPTCHA

1. CAPTCHA pode ser ligado sem redesenhar o checkout;
2. quando ligado, protege o submit de aplicacao de cupom;
3. quando desligado, o fluxo de cupom continua funcional;
4. existe observabilidade minima para bloqueios e abuso.

---

## 8. Precisamos de telas adicionais para planejar?

**Resposta curta: nao.**

Para planejamento, o material atual e suficiente porque:

- a jornada publica `/adesao/*` ja existe;
- a storefront ja tem as superfícies principais;
- o problema agora e de **escopo, contrato, wiring e criterios**, nao de discovery visual.

### Quando pedir tela adicional faria sentido

So valeria pedir tela adicional se o time decidir explicitamente:

- mudar a arquitetura do checkout para multi-step diferente do atual;
- introduzir um componente novo de cupom com comportamento fora do checkout atual;
- introduzir UX separada para configurar ou explicar elegibilidade de plano online no canal publico;
- criar uma pagina nova de "pedido/compra concluida" distinta da tela de pendencias/status.

No estado atual, isso **nao e pre-requisito para planejar**.

---

## 9. Recomendacao de sequenciamento

Sequencia recomendada:

1. Onda 0
2. Onda 1
3. Onda 2
4. Onda 3
5. Onda 4
6. Onda 5

Motivo:

- primeiro tornar a vitrine vendavel;
- depois canonizar a base publica;
- depois fechar cupom online;
- e por ultimo decidir se vale endurecer com CAPTCHA.

Isso reduz risco de gastar energia em endurecimento/antifraude antes de o canal principal de compra estar realmente fechado.

---

## 10. Registro transversal

- **Repo dono:** `academia-app`
- **Repo consumidor/fornecedor de contrato:** `academia-java`
- **Risco de quebra:** medio-alto, por tocar superficie publica, contrato B2C e acoplamento atual a endpoints operacionais
- **Validacao executada para este planejamento:** leitura de contexto do workspace, `AGENTS.md`, indices de IA, implementacao atual de storefront/adesao no frontend, controllers/servicos publicos do backend, PRD do voucher online e testes E2E da jornada publica
- **Follow-up pendente:** fechar com o time de backend a matriz de contrato publico minima da Onda 0, principalmente meios de pagamento publicos, resolucao de plano por slug e configuracao de elegibilidade de plano para venda online
