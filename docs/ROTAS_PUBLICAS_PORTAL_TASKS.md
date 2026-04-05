# Plano de Frontend - Reorganizacao de Rotas Publicas, Auth, Portal e Backoffice

## 1. Objetivo

Planejar a reorganizacao do App Router para separar com mais clareza as superficies:

- publicas e institucionais;
- autenticacao;
- portal operacional da academia;
- backoffice global da plataforma;
- experiencia do aluno.

O objetivo principal e reduzir a mistura atual entre rotas publicas e operacionais, abrir espaco para evoluir o storefront e a landing do SaaS, e eliminar ambiguidades como a coexistencia de `src/app/(app)` com a rota real `/app/*`.

## 2. Estrutura alvo

```text
src/app
  (public)
    page.tsx
    b2b/*
    adesao/*
    storefront/*
    acesso/*
  (auth)
    login/*
    admin-login/*
    primeiro-acesso/*
    recuperar-senha/*
  (portal)
    dashboard/*
    vendas/*
    crm/*
    administrativo/*
    gerencial/*
    conta/*
    treinos/*
  (backoffice)
    admin/*
  (aluno)
    meus-treinos/*
    minhas-aulas/*
    meu-perfil/*
```

## 3. Premissas

- a reorganizacao inicial deve preservar URLs publicas e operacionais sempre que possivel;
- `storefront` e `adesao` devem continuar publicos, mas sob o mesmo boundary interno `(public)`;
- `src/app/(app)` deve ser renomeado para `src/app/(portal)` sem alterar as URLs finais;
- a rota canonica de acesso por rede passa a ser `/acesso/[redeSlug]`;
- `src/app/app/[networkSubdomain]` deve virar superficie legada de compatibilidade, nao area principal;
- a home `/` deve ficar reservada para a landing institucional do SaaS, com estrategia de transicao controlada;
- mudancas em proxy, metadata, sitemap e redirects devem ser tratadas como parte da implementacao, nao como ajuste posterior.

## 4. Tasks de implementacao

### Task R1 - Congelar a taxonomia de rotas e a matriz de compatibilidade

**Objetivo**  
Formalizar quais superficies existem, quais sao canonicas e quais entram em compatibilidade temporaria.

**Escopo**
- inventariar rotas atuais em `src/app`;
- classificar cada rota como `public`, `auth`, `portal`, `backoffice` ou `aluno`;
- decidir a URL canonica para acesso por rede;
- documentar rotas legadas que ficarao com redirect;
- registrar o comportamento esperado da home `/`.

**Subtasks**
- R1.1 Mapear as rotas atuais de `src/app/(public)`, `src/app/storefront`, `src/app/acesso` e `src/app/app`.
- R1.2 Definir a matriz `rota atual -> rota canonica -> estrategia de transicao`.
- R1.3 Registrar quais superficies publicas dependem de subdominio, query string e headers.
- R1.4 Validar com o time de produto se `/` passa a ser landing institucional imediatamente ou sob feature flag.

### Task R2 - Criar o boundary interno `(public)` como superficie unica para experiencias publicas

**Objetivo**  
Concentrar as rotas publicas dentro de um route group unico, sem expor `/public` na URL.

**Escopo**
- mover a landing principal para `(public)`;
- manter `b2b`, `adesao`, `storefront` e `acesso` sob o mesmo grupo;
- criar layout ou convencoes compartilhadas para metadata, analytics e SEO publico;
- preservar URLs existentes durante a movimentacao.

**Subtasks**
- R2.1 Mover `src/app/page.tsx` para a superficie publica alvo.
- R2.2 Mover ou reorganizar `src/app/(public)/b2b/*` sob o boundary final.
- R2.3 Mover `src/app/acesso/*` para `src/app/(public)/acesso/*`.
- R2.4 Criar um layout publico compartilhado quando houver reutilizacao real de metadata, schema.org ou tracking.
- R2.5 Validar que nenhuma URL ganhou prefixo artificial como `/public/*`.

### Task R3 - Mover o storefront para dentro de `(public)` preservando rewrite por subdominio

**Objetivo**  
Separar claramente storefront publico da configuracao administrativa do storefront.

**Escopo**
- mover `src/app/storefront/*` para `src/app/(public)/storefront/*`;
- manter `src/app/(app)/administrativo/academia/storefront/*` apenas como area de configuracao;
- revisar `src/proxy.ts` para garantir que os rewrites continuem apontando para a nova arvore;
- revisar loading, metadata, sitemap e paginas de erro relacionadas ao storefront.

**Subtasks**
- R3.1 Mover a arvore fisica do storefront para o route group publico.
- R3.2 Ajustar `src/proxy.ts` e qualquer dependencia de caminho interno.
- R3.3 Revisar `resolve-storefront-headers`, `loading.tsx`, `sitemap.ts` e `storefront-not-found`.
- R3.4 Validar subdominio valido, subdominio invalido e acesso direto por URL.
- R3.5 Confirmar que a configuracao administrativa do storefront continua isolada da experiencia publica.

### Task R4 - Consolidar a jornada publica de adesao e remover duplicacao desnecessaria

**Objetivo**  
Garantir que a adesao digital tenha uma unica implementacao principal e que o storefront apenas a componha de forma consistente.

**Escopo**
- manter `adesao` como jornada publica sob `(public)`;
- revisar paginas-proxy do storefront que apenas redirecionam para `/adesao/*`;
- decidir se o storefront vai redirecionar server-side ou compartilhar componentes em vez de fazer proxy client-side;
- padronizar metadata e comportamento de query strings `tenant` e `plan`.

**Subtasks**
- R4.1 Mapear a duplicacao atual entre `(public)/adesao/*` e `storefront/adesao/*`.
- R4.2 Definir a implementacao canonica da jornada de adesao.
- R4.3 Substituir redirecionamentos client-side por abordagem mais previsivel quando possivel.
- R4.4 Validar fluxos de landing, cadastro, checkout, trial e pendencias.
- R4.5 Garantir que o storefront continue abrindo a adesao com tenant e plano corretos.

### Task R5 - Consolidar o acesso de rede e descontinuar `/app/[networkSubdomain]` como superficie primaria

**Objetivo**  
Eliminar a ambiguidade entre route group `(app)` e rota real `/app/*`.

**Escopo**
- escolher `/acesso/[redeSlug]` como URL canonica de acesso de rede;
- manter `/app/[networkSubdomain]` apenas como compatibilidade temporaria;
- alinhar login, primeiro acesso e recuperacao de senha com a taxonomia final;
- revisar links internos, redirects e comunicacoes que ainda apontam para `/app/*`.

**Subtasks**
- R5.1 Mover ou reorganizar a superficie `src/app/app/*`.
- R5.2 Criar redirects canonicos de `/app/[networkSubdomain]` para `/acesso/[redeSlug]`.
- R5.3 Revisar `buildNetworkAccessHref`, `normalizeNetworkSubdomain` e fluxos correlatos.
- R5.4 Validar login por host, por query e por slug de rede.
- R5.5 Medir impacto em links externos, QA scripts e Playwright.

### Task R6 - Renomear o route group `(app)` para `(portal)` sem alterar URLs

**Objetivo**  
Tornar o filesystem mais claro sem mudar a navegacao do usuario.

**Escopo**
- mover `src/app/(app)/*` para `src/app/(portal)/*`;
- preservar layouts, guards e contexto de sessao;
- revisar referencias em docs, scripts, testes e comentarios que citem `(app)`;
- garantir que o portal operacional siga funcionando com os mesmos caminhos finais.

**Subtasks**
- R6.1 Mover a arvore fisica do route group para `(portal)`.
- R6.2 Validar `layout.tsx`, guards de sessao e componentes de shell.
- R6.3 Atualizar documentacao e referencias internas ao nome antigo.
- R6.4 Revisar imports relativos ou referencias a caminhos fisicos em testes e scripts.
- R6.5 Executar smoke das rotas operacionais mais criticas.

### Task R7 - Reposicionar a home `/` como landing institucional do SaaS

**Objetivo**  
Reservar a home principal para venda, descoberta e captacao do produto.

**Escopo**
- substituir o redirect bruto de `/` para `/dashboard`;
- decidir comportamento para usuario autenticado na home;
- integrar a landing com `b2b`, demo, CTA de login e CTA de storefront quando fizer sentido;
- preservar SEO e analytics da nova entrada publica.

**Subtasks**
- R7.1 Definir se `/` renderiza landing para todos ou se redireciona autenticados.
- R7.2 Criar a pagina institucional canonica do SaaS.
- R7.3 Integrar CTAs para demo, login e jornada comercial.
- R7.4 Revisar metadata, Open Graph, canonical e schema.org da home.
- R7.5 Validar que a home publica nao introduz regressao na entrada operacional do usuario logado.

### Task R8 - Fechar observabilidade, testes e documentacao da nova taxonomia

**Objetivo**  
Encerrar a reorganizacao com evidencia de que as superficies ficaram claras e estaveis.

**Escopo**
- atualizar docs de onboarding e arquitetura de rotas;
- revisar Playwright e smoke tests das superficies publica, portal e backoffice;
- validar redirects, status codes e SEO basico;
- revisar o impacto em analytics, monitoramento e logs.

**Subtasks**
- R8.1 Atualizar a documentacao de estrutura e navegacao do frontend.
- R8.2 Criar uma matriz de testes para `/`, `/b2b`, `/adesao`, `/storefront`, `/login`, `/dashboard` e `/admin`.
- R8.3 Validar rewrites por subdominio e not-found do storefront.
- R8.4 Revisar analytics/eventos para nao misturar publico e portal.
- R8.5 Definir checklist de rollout com rollback simples.

## 5. Ordem recomendada

1. R1 - taxonomia e compatibilidade.
2. R2 - boundary `(public)`.
3. R3 - storefront dentro de `(public)`.
4. R4 - adesao publica sem duplicacao.
5. R5 - consolidacao de `/acesso` e depreciacao de `/app/*`.
6. R6 - renomeacao de `(app)` para `(portal)`.
7. R7 - home institucional.
8. R8 - testes, docs e rollout.

## 6. Paralelizacao sugerida

Depois de R1:

- R2 e R5 podem ser planejadas em paralelo, mas a execucao de R5 depende da decisao final sobre URLs canonicas.
- R3 pode comecar assim que o boundary `(public)` estiver definido.
- R4 pode rodar junto com R3 se a equipe separar ownership entre `storefront` e `adesao`.
- R6 deve vir depois que R5 estabilizar a superficie de acesso para nao misturar duas fontes de ambiguidade.
- R7 deve acontecer quando a taxonomia publica ja estiver consolidada.
- R8 fecha a trilha inteira.

## 7. Riscos principais

- quebrar rewrites de subdominio do storefront;
- manter duplicacao invisivel entre `adesao` publica e `storefront/adesao`;
- introduzir regressao de SEO ao mover metadata e sitemap;
- quebrar deep links antigos para `/app/[networkSubdomain]`;
- misturar comportamento de usuario autenticado e visitante anonimo na nova home;
- atualizar o filesystem sem atualizar docs, testes e scripts relacionados.

## 8. Criterios de aceite

- todas as rotas publicas ficam agrupadas internamente sob `(public)`;
- `storefront` continua publico e funcional, sem depender de area administrativa;
- `adesao` passa a ter implementacao principal unica e previsivel;
- `/app/[networkSubdomain]` deixa de ser a superficie primaria de acesso;
- o antigo `(app)` passa a ser `(portal)` sem mudar URLs operacionais;
- `/` fica reservado para a estrategia institucional do SaaS;
- testes de smoke cobrem publico, auth, portal, backoffice e subdominio do storefront;
- a documentacao deixa clara a taxonomia final de rotas.
