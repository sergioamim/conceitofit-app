# Task 448 — Taxonomia congelada de rotas publicas, auth, portal e backoffice

## Objetivo

Congelar a leitura atual da arvore de rotas do App Router e registrar a estrutura alvo para as tasks seguintes de reorganizacao, sem alterar comportamento do produto nesta etapa.

## Fontes de verdade usadas

- `src/app/page.tsx`
- `src/proxy.ts`
- `src/app/login/page.tsx`
- `src/app/admin-login/page.tsx`
- `src/app/acesso/[redeSlug]/page.tsx`
- `src/app/app/[networkSubdomain]/page.tsx`
- `src/app/(app)/layout.tsx`
- `src/app/(backoffice)/layout.tsx`
- `src/app/(backoffice)/admin/layout.tsx`
- `src/app/(aluno)/layout.tsx`
- `src/app/(public)/adesao/page.tsx`
- `src/app/storefront/page.tsx`
- `src/app/storefront/[academiaSlug]/layout.tsx`
- `src/app/storefront/[academiaSlug]/page.tsx`
- `src/app/storefront/adesao/cadastro/page.tsx`
- `src/app/storefront/adesao/checkout/page.tsx`
- `src/app/storefront/adesao/trial/page.tsx`
- `src/app/storefront-not-found/page.tsx`

## Fatos observados no codigo

### 1. Entrada raiz

- A rota `/` hoje nao e landing institucional. `src/app/page.tsx` faz `redirect("/dashboard")`.
- Isso significa que a homepage publica SaaS ainda nao esta materializada no App Router atual.

### 2. Auth de rede

- `src/app/login/page.tsx` decide entre dois fluxos:
  - `NetworkAccessFlow` quando consegue resolver `redeIdentifier` pela query ou pelo host/subdominio.
  - `LegacyLoginFlow` quando nao existe contexto de rede.
- `src/app/acesso/[redeSlug]/page.tsx` nao implementa login proprio. Ela redireciona para `buildNetworkAccessHref("login", ...)`.
- `src/app/app/[networkSubdomain]/page.tsx` tambem nao implementa login proprio. Ela redireciona para o mesmo `buildNetworkAccessHref("login", ...)`.
- O grupo `/acesso/[redeSlug]` ja expoe superfice localizada em portugues:
  - `/acesso/[redeSlug]/autenticacao`
  - `/acesso/[redeSlug]/primeiro-acesso`
  - `/acesso/[redeSlug]/recuperar-senha`
- O grupo `/app/[networkSubdomain]` expoe equivalentes legados em ingles:
  - `/app/[networkSubdomain]/login`
  - `/app/[networkSubdomain]/first-access`
  - `/app/[networkSubdomain]/forgot-password`

### 3. Portal operacional autenticado

- O grupo `src/app/(app)` concentra o shell autenticado operacional.
- `src/app/(app)/layout.tsx`:
  - sobe `TenantContextProvider`;
  - aplica gate de sessao e redireciona para `buildLoginHref(...)`;
  - monta sidebar, topbar, command palette, banners e `BottomNav`.
- Rotas operacionais observadas dentro de `(app)` incluem:
  - `/dashboard`
  - `/clientes`
  - `/crm`
  - `/planos`
  - `/vendas`
  - `/reservas`
  - `/grade`
  - `/atividades`
  - `/matriculas`
  - `/pagamentos`
  - `/alunos`
  - `/prospects`
  - `/treinos`

### 4. Backoffice global autenticado

- O grupo `src/app/(backoffice)` contem a superfice administrativa global.
- `src/app/(backoffice)/layout.tsx` e um shell leve com `Suspense`.
- O shell principal do backoffice esta em `src/app/(backoffice)/admin/layout.tsx`.
- A area global fica exposta sob prefixo `/admin`, com exemplos:
  - `/admin`
  - `/admin/academias`
  - `/admin/unidades`
  - `/admin/seguranca`
  - `/admin/importacao-evo`
  - `/admin/entrar-como-academia`
- `src/app/admin-login/page.tsx` e um login separado para esta superfice global e redireciona para `/admin`.

### 5. Portal do aluno autenticado

- O grupo `src/app/(aluno)` e uma superfice autenticada distinta, com shell proprio em `src/app/(aluno)/layout.tsx`.
- Rotas observadas:
  - `/check-in`
  - `/meu-perfil`
  - `/meus-pagamentos`
  - `/meus-treinos`
  - `/minhas-aulas`

### 6. Publico institucional e jornada de adesao

- O grupo `src/app/(public)` contem superfices publicas explicitas.
- A jornada publica canonica de adesao hoje esta em:
  - `/adesao`
  - `/adesao/cadastro`
  - `/adesao/checkout`
  - `/adesao/pendencias`
  - `/adesao/trial`
- `src/app/(public)/adesao/page.tsx` carrega `getPublicJourneyContextServer` e `listPublicTenantsServer`.
- O grupo publico tambem contem B2B:
  - `/b2b`
  - `/b2b/demo`

### 7. Storefront

- `src/proxy.ts` reescreve subdominios validos para `/storefront/${academiaSlug}`.
- Se o subdominio nao existir, o proxy reescreve para `/storefront-not-found`.
- O grupo `src/app/storefront` implementa a superfice de marketing/brand da academia:
  - `/storefront`
  - `/storefront/[academiaSlug]`
  - `/storefront/[academiaSlug]/unidades/[tenantId]`
  - `/storefront/plano/[slug]`
  - `/storefront/unidade/[tenantId]`
- `src/app/storefront/page.tsx` resolve tenant via headers para suportar acesso por subdominio.
- `src/app/storefront/[academiaSlug]/page.tsx` suporta acesso explicito por slug no path.
- `src/app/storefront/[academiaSlug]/layout.tsx` aplica branding/tema da academia.

### 8. Storefront e adesao compartilham a mesma jornada

- Existem rotas sob `src/app/storefront/adesao/*`, mas elas sao apenas proxies client-side.
- Os arquivos:
  - `src/app/storefront/adesao/cadastro/page.tsx`
  - `src/app/storefront/adesao/checkout/page.tsx`
  - `src/app/storefront/adesao/trial/page.tsx`
  redirecionam o navegador para as rotas canonicas `/adesao/*`.
- Portanto, a regra observada hoje e:
  - `storefront/*` gera descoberta e CTA publico;
  - `/adesao/*` e a jornada transacional canonica.

## Inferencia operacional consolidada

- `(app)` funciona hoje como o portal operacional principal da academia.
- `(backoffice)` funciona como a administracao global SaaS.
- `(aluno)` ja e um bounded surface separado e nao deve ser misturado ao portal operacional comum.
- `/acesso/[redeSlug]` ja tem semantica mais forte e vocabulario mais aderente ao produto que `/app/[networkSubdomain]`.
- A compatibilidade de `/app/[networkSubdomain]` deve ser preservada durante a reorganizacao, mas como casca legada.

## Estrutura alvo congelada para as proximas tasks

### Superficies alvo

- `/`
  - alvo: landing institucional SaaS.
- `(public)`
  - alvo: paginas publicas institucionais e de aquisicao.
- `(auth)`
  - alvo: autentificacao e recuperacao de acesso orientadas por rede.
- `(portal)`
  - alvo: shell operacional autenticado da unidade/rede; hoje vive em `(app)`.
- `(backoffice)`
  - alvo: shell global administrativo; ja existe com este nome.
- `(aluno)`
  - alvo: shell autenticado do aluno; manter separado.
- `storefront`
  - alvo: descoberta publica branded por subdominio ou slug.

### Decisoes congeladas

- `/` deve deixar de redirecionar para `/dashboard` quando a landing institucional for implementada.
- `/acesso/[redeSlug]` e a entrada canonica de auth por rede.
- `/app/[networkSubdomain]` permanece como camada de compatibilidade legada.
- `storefront` e `adesao` sao superfices publicas irmas:
  - `storefront`: descoberta e branding.
  - `adesao`: conversao transacional.
- `(app)` deve ser tratado como candidato direto a renomeacao para `(portal)` nas tasks seguintes.

## Matriz de compatibilidade

| Superficie atual | Papel observado | URL canonica alvo | Compatibilidade |
| --- | --- | --- | --- |
| `/` | entrada raiz que hoje manda para portal | `/` landing SaaS | mudar comportamento em task futura |
| `/login` | resolvedor de login sem ou com contexto de rede | manter como resolvedor tecnico | manter |
| `/admin-login` | login do backoffice global | `/admin-login` | manter |
| `/acesso/[redeSlug]` | entrada canonica por rede | `/acesso/[redeSlug]` | manter e fortalecer |
| `/acesso/[redeSlug]/autenticacao` | login de rede em portugues | `/acesso/[redeSlug]/autenticacao` | manter |
| `/acesso/[redeSlug]/primeiro-acesso` | primeiro acesso | `/acesso/[redeSlug]/primeiro-acesso` | manter |
| `/acesso/[redeSlug]/recuperar-senha` | recuperacao de senha | `/acesso/[redeSlug]/recuperar-senha` | manter |
| `/app/[networkSubdomain]` | indice legado de login por subdominio | `/acesso/[redeSlug]` | manter com redirect/bridge |
| `/app/[networkSubdomain]/login` | login legado em ingles | `/acesso/[redeSlug]/autenticacao` | manter com compatibilidade |
| `/app/[networkSubdomain]/first-access` | primeiro acesso legado | `/acesso/[redeSlug]/primeiro-acesso` | manter com compatibilidade |
| `/app/[networkSubdomain]/forgot-password` | reset legado | `/acesso/[redeSlug]/recuperar-senha` | manter com compatibilidade |
| `src/app/(app)/*` | portal operacional autenticado | `src/app/(portal)/*` | renomear grupo, sem trocar URLs publicas agora |
| `/dashboard` e afins | portal operacional | `/dashboard` e afins | manter URL; trocar so agrupamento interno |
| `/admin/*` | backoffice global | `/admin/*` | manter |
| `src/app/(aluno)/*` | portal do aluno | mesmas URLs atuais | manter |
| `/adesao/*` | jornada publica transacional | `/adesao/*` | manter como canonica |
| `/storefront/[academiaSlug]` | descoberta publica por slug | `/storefront/[academiaSlug]` | manter |
| `subdominio -> /storefront/[academiaSlug]` | descoberta publica branded via proxy | subdominio atual | manter |
| `/storefront/adesao/*` | proxies de compatibilidade para adesao | `/adesao/*` | manter como bridge ou eliminar depois |

## Fronteiras importantes

### Publico vs autenticado

- `src/app/(public)` e `src/app/storefront` nao dependem de sessao autenticada para renderizar a jornada principal.
- `src/app/(app)`, `src/app/(backoffice)/admin` e `src/app/(aluno)` aplicam controle de sessao no shell.

### Contexto de rede vs contexto global

- Auth por rede usa `buildNetworkAccessHref(...)` e resolve subdominio/rede.
- Backoffice global usa `admin-login` e destino `/admin`.
- Nao ha evidencia no codigo de que `/admin-login` deva convergir para `/acesso/[redeSlug]`.

### Descoberta vs conversao

- `storefront` descobre academia, plano e unidade.
- `adesao` executa cadastro, trial, checkout e pendencias.
- Os proxies `storefront/adesao/*` existem justamente para nao duplicar a logica transacional.

## Impacto esperado nas proximas tasks

- Task de landing institucional: trocar o redirect de `/`.
- Task de auth canonica: migrar chamadas e links para priorizar `/acesso/[redeSlug]`.
- Task de reorganizacao interna: renomear `(app)` para `(portal)` sem quebra de URL.
- Task de limpeza legado: decidir se `/app/[networkSubdomain]` segue como redirect permanente ou se fica escondido apenas para compatibilidade.
- Task de storefront: manter CTA apontando para `/adesao/*` como superficie transacional canonica.

## Lacunas conhecidas

- Nao existe ainda landing SaaS implementada para `/`; ha apenas a decisao alvo.
- A task nao define estrategia de SEO/canonical completa para coexistencia entre `/storefront/[academiaSlug]` e subdominio branded.
- A task tambem nao fecha ainda o destino final de rotas top-level publicas como `/status`, `/monitor/*` e `/grade/*`; elas permanecem fora desta taxonomia congelada por nao se encaixarem nos quatro eixos principais desta iniciativa.
