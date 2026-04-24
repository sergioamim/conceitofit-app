# Voucher válido para compra online (storefront B2C) — PRD

**Status:** proposto (2026-04-24) — implementação pendente.
**Autor:** decisão do CEO em sessão 2026-04-24 após conclusão da
Phase 3 do convênio.
**Depende de:** nenhuma implementação. Entity `VoucherEntity` já existe.
**Prioridade:** média-alta. Destrava campanhas de aquisição B2C —
sem cupom, o storefront hoje cobra preço cheio.

---

## Contexto

O storefront público (`/adesao/*`) é o canal de **aquisição B2C** — o
cliente final acessa sem login, escolhe plano e paga. Hoje, esse
canal **não suporta desconto de nenhum tipo**. Operadores fazem
campanhas tipo "BOASVINDAS20" divulgando fora (Instagram, Google Ads,
e-mail marketing) e os clientes chegam no checkout, digitam o código…
e descobrem que o campo não existe.

Isso gera:

- **Atrito alto** no primeiro contato do cliente com a academia.
- **Vazamento de conversão** — cliente desiste achando que o código
  é fake ou que a academia não honra.
- **Desalinhamento operacional** — marketing cria campanha, sistema
  não entrega.

Por outro lado, dois tipos de desconto existem no sistema:

| Instrumento | Uso | Onde aplica |
|---|---|---|
| **Convênio** | Parceria contínua (Unimed, empresas) | `/vendas/nova` (presencial) |
| **Voucher / cupom** | Código promocional pontual | `/vendas/nova` (presencial), via flag `usarNaVenda` |

## Decisões de produto — ancoradas

Registradas aqui pra virar parte da constituição do módulo:

### D1 — Storefront NÃO usa convênio, só cupom

- Convênio é **ato contínuo de parceria** — pressupõe cadastro do
  aluno, identificação, às vezes carteirinha. Incompatível com o
  modelo "anônimo até pagar" do storefront.
- Cupom é **ato pontual e público** — cliente digita o código,
  sistema aplica. Fits com o anônimo.

Esta decisão é **permanente**. Se um parceiro quiser entregar desconto
B2C, gere um voucher com código (pode ser fixo tipo `UNIMED30`).

### D2 — Flags `usarNaVenda` e `usarOnline` são independentes

Cada voucher escolhe:

- Só **presencial** (`usarNaVenda=true, usarOnline=false`) — típico
  de retenção no balcão, não deve vazar no site.
- Só **online** (`usarNaVenda=false, usarOnline=true`) — campanha de
  aquisição sem risco de um operador aplicar descuidado.
- **Ambos** (`usarNaVenda=true, usarOnline=true`) — uso geral.
- **Nenhum dos dois** (default) — voucher existe mas não é ofertado
  em lugar nenhum (útil pra testes e pra criar antes de ativar).

### D3 — Erro genérico contra brute-force

O endpoint público **nunca distingue** "código inexistente", "expirado",
"esgotado", "fora do escopo". Resposta única: `"Cupom inválido"`. Isso
evita que um atacante consiga enumerar códigos válidos mesmo sem saber
o valor do desconto.

### D4 — CAPTCHA mandatório no checkout

A v1 já entrega com **CAPTCHA no formulário do checkout** (não opcional).
Configuração:

- Provedor: **Cloudflare Turnstile** (free, sem rastreio invasivo) ou
  **hCaptcha** como fallback. Decisão técnica fica com @architect.
- Disparado **no submit do "Aplicar cupom"** — não bloqueia visualizar
  o plano nem o checkout em si.
- Token validado no backend antes de qualquer query no banco —
  CAPTCHA inválido retorna 403 sem nem chegar perto do voucher.
- Se cliente já validou CAPTCHA na sessão (cookie ou token de 5 min),
  pode aplicar múltiplos cupons sem desafio repetido.

Rate limit do D3 continua valendo **em camada anterior** ao CAPTCHA —
defesa em profundidade. CAPTCHA bloqueia ataque automatizado, rate
limit bloqueia humano persistente.

### D5 — Consumo do código só na finalização do pagamento

"Aplicar cupom" no checkout é apenas **validação visual com preview**.
Nada é gasto, nada é travado. Se o cliente desiste, o código continua
disponível para outro cliente. O **consumo real** (incrementar
`usado=true` em `voucher_codigo`, decrementar `quantidade` em vouchers
limitados) ocorre **quando o pagamento é confirmado** — mesmo
validador, mesma regra, mas dentro da transação que cria o `Pagamento`
e o `Contrato`.

Implicação importante: o `usarOnline=true` do voucher é checado
**duas vezes** — no preview (Wave 2) e no commit (reusa o validador
existente da venda presencial, estendido pra reconhecer a flag).

### D6 — `umaVezPorCliente` é responsabilidade do backend

A validação rigorosa de "este cliente já usou esse cupom" só pode
acontecer **quando o cliente está identificado**, ou seja, na criação
do `Contrato` na confirmação do pagamento. No preview do checkout,
o cliente é anônimo — o FE **não tenta** validar essa regra.

Fluxo:

1. Cliente anônimo aplica cupom → preview mostra desconto.
2. Cliente preenche dados (nome, CPF, email) e clica "Pagar".
3. Backend, dentro da transação de criação do Pagamento:
   - Identifica/cria o `Cliente` por CPF ou email.
   - Roda validador completo do voucher (inclui
     `umaVezPorCliente` se o flag estiver ligado).
   - Se reprovado, **rejeita o pagamento** com 422
     `"Cupom inválido para este cliente"` (mensagem clara aqui — o
     cliente já não é anônimo, brute-force não se aplica).
   - Se aprovado, debita o código e segue.

Janela aceita: cliente pode ver desconto no preview e descobrir no
commit que já usou. UX não-ideal mas tolerável na v1 — caso raro
(quem quer comprar 2x do mesmo plano com mesmo cupom?). Se virar
problema, otimização de v2: opcional flag de email no preview pra
checar contra histórico antes do commit.

## Problema

Cliente quer digitar `BOASVINDAS20` no checkout público e ver R$ 30 de
desconto no plano de R$ 150. Hoje não dá.

## Objetivo

Entregar 2 capacidades:

1. **Voucher ganha flag `usarOnline: boolean`** (default `false`). Ao
   editar no admin, operador escolhe se vale online.
2. **Checkout público (`/adesao/checkout`) aceita código** — endpoint
   anônimo valida, calcula desconto, atualiza preview. Se código
   inválido, mensagem genérica.

## Modelo de dados

### Migration (`modulo-academia/src/main/resources/db/migration/`)

```sql
-- V2026MMDDHHMM__voucher_usar_online.sql

ALTER TABLE voucher
    ADD COLUMN usar_online boolean NOT NULL DEFAULT false;

-- Voucher existente mantém usar_online=false (compat zero-breakage).
-- Se um operador quiser habilitar, edita manualmente.
```

### VoucherEntity

```java
@Column(nullable = false)
public boolean usarOnline = false;
```

### DTOs (`BeneficiosController`)

`VoucherBaseRequest` ganha `boolean usarOnline()`.
`VoucherResponse` ganha `boolean usarOnline`.
`applyVoucherBase` copia o campo da request pra entity.

## Backend — endpoint público

### Novo endpoint

```
POST /api/v1/public/vouchers/validar
Content-Type: application/json
(sem auth — sem X-Context-Id, sem Authorization)

{
  "codigo": "BOASVINDAS20",
  "tenantSlug": "academia-exemplo",    // resolvido pelo path do storefront
  "planoId": "uuid-do-plano",
  "captchaToken": "..."                // obrigatório — Turnstile/hCaptcha
}
```

CAPTCHA inválido → **403 antes de qualquer lookup** (`"Falha de
verificação de segurança"`). Se o token foi gerado nessa sessão e tem
TTL não-expirado (servidor mantém cache de 5 min), pode pular o
verify externo e aceitar o token cached — economiza chamada ao
provedor.

**Resposta sucesso (200)**:
```json
{
  "valido": true,
  "tipoDesconto": "PERCENTUAL",
  "descontoPercentual": 20,
  "descontoValor": null
}
```

**Resposta erro (422)**:
```json
{
  "valido": false,
  "mensagem": "Cupom inválido"
}
```

Ou 429 quando rate-limited.

### Validações do lado do backend (antes de responder)

Todas retornam o mesmo 422 `"Cupom inválido"` — nunca detalhe:

1. Código existe e está ativo? (`voucher.ativo = true`)
2. `usarOnline = true`?
3. Dentro do período? (`periodoInicio <= hoje <= periodoFim`)
4. Há códigos restantes? (check contra `voucher_codigo.usado`)
5. Plano está no `planoIds` do voucher (ou `planoIds` vazio = todos)?
6. Aplicar no contexto `CHECKOUT` ou `VENDA`? (verificar
   `voucher.aplicarEm` inclui `"CHECKOUT"` — enum já existe)
7. Voucher é `UNICO` ou `ALEATORIO` — consumo ocorre só na
   finalização da compra (não aqui).

### Rate limiting

Implementar com bucket por IP (Redis ou in-memory se projeto não tem
Redis). Janela deslizante:

- **10 tentativas por minuto** → se excede, 429 com
  `"Muitas tentativas, tente em alguns minutos"`.
- **Bloqueio de 10 min** após 3 janelas consecutivas de 10 tentativas
  com código inválido (ataque óbvio).
- Tentativas válidas (que retornam 200) zeram o contador.

Log com `INFO` para tentativas válidas, `WARN` para bloqueios:
```
voucher_public_validate ip=1.2.3.4 resultado=INVALIDO codigo_hash=abc123
voucher_public_validate_blocked ip=1.2.3.4 total_tentativas=30
```

## Frontend

### Admin — modal de voucher

Seção "Onde o voucher pode ser usado":

```
Disponibilidade
  [ ] Permitir aplicação na venda presencial
  [ ] Válido para compra online (storefront)
```

Default: ambos desmarcados. Ao menos um precisa estar marcado pro
botão Salvar liberar (regra nova de UX, não de schema — schema permite
ambos falsos, mas FE guia).

Aplicar tanto em `novo-voucher-modal.tsx` quanto em
`editar-voucher-modal.tsx`.

### Admin — listagem de vouchers

Coluna nova "Canais": badge(s) `Presencial` / `Online` / ambos / `—`
(nenhum marcado).

### Storefront — `/adesao/checkout`

Novo campo abaixo do plano selecionado:

```
┌─────────────────────────────────────────────────┐
│ Cupom (opcional)                                │
│ [ BOASVINDAS20       ]  [ Aplicar ]             │
│ ✓ 20% de desconto aplicado                      │
└─────────────────────────────────────────────────┘
```

Estados:
- Idle — input vazio, botão disabled
- Loading — "Validando…"
- Sucesso — input readonly + badge verde + "Remover"
- Erro — input ainda editável + erro em vermelho "Cupom inválido"
- Rate-limited — "Aguarde alguns minutos antes de tentar novamente"

Integração: nova função `validarVoucherPublicoApi(...)` em
`src/lib/api/` chama o endpoint público. `getPublicPlanQuote`
passa a aceitar `cupom?: { percent?: number, valor?: number }` pra
recalcular.

### Tipo `Voucher` (`src/lib/shared/types/`)

Adicionar `usarOnline: boolean` no type `Voucher`.

## Regras críticas de aplicação

1. **Consumo do código só acontece no checkout final** (D5) —
   validar no input mostra preview, sem gastar. Se cliente desistir,
   código continua disponível.
2. **Mesmo validador no preview e no commit** — evita inconsistência
   "valida no preview, falha no submit". Caso especial: o commit
   roda validações adicionais (`umaVezPorCliente` — D6) que não
   podem rodar no preview.
3. **`umaVezPorCliente` validado SOMENTE no backend, no commit** (D6)
   — FE nunca tenta. Se reprova no commit, retorna mensagem
   específica (cliente já não é anônimo).
4. **Cupom percentual respeita valor mínimo de R$ 0** — desconto
   maior que o plano → limita ao valor do plano (regra Phase 2 do
   convênio, aproveitar).
5. **Sem acumulação com "convenio"** — storefront não tem convênio
   (D1), então não há conflito. Regra pra garantir:
   `getPublicPlanQuote` não recebe convênio como parâmetro nunca.
6. **Recálculo backend é fonte da verdade** — o desconto exibido no
   FE é informativo. No commit do pagamento, o backend recalcula a
   partir do `voucher.id` e ignora valores enviados pelo cliente.
   Defesa contra fraude (cliente DevTools tentando aumentar `%`).

## Plano de corte (waves)

- **Wave 1 (backend schema + DTO)**: migration + entity + DTO
  + modal do admin exibindo o campo `usarOnline`. Admin cria voucher
  marcado como online sem nada funcionar ainda no storefront. Baixo
  risco.
- **Wave 2 (endpoint público + rate limit + validação no commit)**:
  - `POST /api/v1/public/vouchers/validar` com validação, rate limit
    e logs hashados.
  - Estender o validador interno usado no commit da venda para
    reconhecer `usarOnline=true` quando origem é storefront.
  - **Sem CAPTCHA ainda** — validação humana via curl. Nenhum FE
    consome.
- **Wave 3 (CAPTCHA backend + storefront FE)**:
  - Integração com Cloudflare Turnstile no backend (verify endpoint
    + cache de tokens válidos por 5 min).
  - Campo de cupom no `/adesao/checkout` + Turnstile widget no
    submit do "Aplicar".
  - `getPublicPlanQuote` aceita cupom + preview visual.
  - **Este é o commit que muda produção B2C** — feature flag
    `voucher.online.enabled` recomendada pra rollback rápido.
- **Wave 4 (listagem + analytics)**: coluna "Canais" no admin +
  evento `voucher.online.applied` no Mixpanel/GA + dashboard de
  brute-force (tentativas/IP, top códigos digitados).
- **Wave 5 (consumo no commit)**: garantir que o validador rodando
  no commit do pagamento (já existente) reconhece `usarOnline` e
  trata `umaVezPorCliente` corretamente. Já é parte da Wave 2 mas
  separado aqui pra QA confirmar end-to-end com cliente real.

Waves 1–2 são 100% backend. Wave 3 é única com risco prod B2C.
CAPTCHA agora é parte do escopo principal (D4) — não é mais wave
opcional.

## Segurança — checklist obrigatório antes de Wave 2

- [ ] Endpoint fora da cadeia JWT do Spring Security
  (`PermitAll` no `SecurityFilterChain`).
- [ ] Nenhum campo sensível na resposta (só `valido`,
  `tipoDesconto`, `desconto*`; nunca `id`, `nome`, `observacoes`).
- [ ] Rate limit por IP tanto no filter Spring quanto num `@Aspect`
  ao redor do controller (defense in depth).
- [ ] Header `X-Forwarded-For` honrado atrás do load balancer pra
  não todo mundo ver como "mesmo IP".
- [ ] Logs não devem logar o código em texto pleno — só hash
  (`SHA-256` dos primeiros 8 chars já é suficiente pra correlação
  sem expor o código).
- [ ] Teste de carga: 1000 requisições/segundo com códigos inválidos
  não derruba o serviço.
- [ ] Teste de enumeração: tentar 500 códigos de 6 chars na marra
  não deve retornar nenhum `valido=true` (assumindo nenhum desses
  códigos é real).

### Antes de Wave 3 (CAPTCHA + FE)

- [ ] Conta Cloudflare Turnstile criada (sitekey + secret) ou hCaptcha
  como fallback. Secret no vault, nunca em código.
- [ ] Endpoint backend de verify-captcha funciona com token válido
  (200) e rejeita inválido (403) sem nem tocar no validador de voucher.
- [ ] Cache server-side de tokens válidos por 5 min (libera múltiplos
  cupons na mesma sessão sem repetir desafio).
- [ ] Widget Turnstile integrado no Next.js sem quebrar SSR (script
  carregado client-only).
- [ ] Mensagem clara para usuário em caso de CAPTCHA falhar (idioma:
  pt-BR).
- [ ] Acessibilidade: Turnstile tem modo non-interactive na maioria
  dos casos; testar com leitor de tela.

## Testes críticos

### Backend
- Validação ok: voucher ativo + online + plano válido + CAPTCHA ok
  → 200 com dados.
- Voucher existe mas `usarOnline=false` → 422 genérico.
- Voucher expirado → 422 genérico (não vaza "expirou").
- Voucher ativo mas plano errado → 422 genérico.
- CAPTCHA inválido → 403 antes de qualquer lookup.
- CAPTCHA ausente → 400 "captchaToken obrigatório".
- 11ª tentativa no mesmo minuto → 429.
- 3 bursts de 10 tentativas inválidas → bloqueio de 10 min.
- Endpoint sem auth aceita request sem token.
- Endpoint com auth não quebra (headers ignorados).
- Token CAPTCHA reusado dentro de 5 min na mesma sessão (mesmo IP+UA)
  → aceito sem chamar Turnstile.
- Token CAPTCHA reusado por IP diferente → 403.

### Backend — commit do pagamento (Wave 5)
- Cupom `usarOnline=true` aplicado e venda concluída → código consumido
  (`voucher_codigo.usado=true` ou `quantidade--`).
- Cupom com `umaVezPorCliente=true`, mesmo cliente tenta segunda
  venda → 422 com mensagem específica "Cupom já usado por este cliente".
- Cupom expirou entre o preview e o commit → 422 "Cupom inválido".
- Cliente alterou `desconto` no payload → backend ignora, recalcula
  do `voucher.id`.

### FE
- Aplicar cupom válido → preview atualiza.
- Aplicar cupom inválido → erro exibido, input mantém foco.
- Remover cupom → total volta ao original.
- Rate-limited → mensagem específica sem quebrar a tela.
- Network failure → erro genérico, botão retry.

### Integração
- Voucher com `usarNaVenda=true, usarOnline=false` aparece em
  `/vendas/nova` mas não é aceito em `/adesao/checkout`.
- Inverso também: `usarOnline=true, usarNaVenda=false` aparece só no
  storefront.

## Fora de escopo

- **Cupom por plano específico no storefront** — já existe no schema
  (`voucher.planoIds`), só consumir.
- **Cupom de valor fixo em R$** — já existe no schema
  (`voucher.descontoValorFixo`), só consumir.
- **Cupom com geolocalização** (só cidade X) — outro PRD.
- **A/B test de cupom** (diferentes códigos com diferentes %s pro
  mesmo pool de clientes) — outro PRD.
- **Avisar no preview "você já usou este cupom"** — exigiria
  identificar cliente antes do pagamento via email/CPF, mais
  complexidade que vale na v1. V2 opcional.
- **Stacking de múltiplos cupons** — apenas 1 por venda no storefront.

## Impacto colateral

- `getPublicPlanQuote(plano, parcelas)` passa a aceitar opcionalmente
  `cupom` — retrocompat ok (`cupom?`).
- `public/services.ts` ganha função nova de validação pública.
- Modal de voucher do admin ganha 1 checkbox.
- Listagem de vouchers no admin ganha 1 coluna.
- Nenhuma tela presencial (`/vendas/nova`, wizard) é afetada —
  comportamento idêntico ao Phase 2.

## Métricas pós-release

- **Conversão no checkout B2C com/sem cupom** — esperamos ↑ com cupom.
- **% de cupons gerados com `usarOnline=true`** — quanto o operador
  adota a nova flag.
- **Taxa de tentativa inválida** — sinal de brute-force ou de código
  "meio certo" em campanhas mal divulgadas (typo).
- **Top 10 códigos digitados inválidos** — pode indicar campanha
  errada ("promocao" em vez do código real).
- **Tempo entre aplicar cupom e finalizar pagamento** — se >10min,
  cliente está duvidando e abandonando.

## Riscos

| Risco | Severidade | Mitigação |
|---|---|---|
| Brute-force enumera códigos válidos | Alta | CAPTCHA (D4) + erro genérico (D3) + rate limit + logs hashados |
| Desconto calculado no FE diverge do backend (fraude) | Alta | Recalcular no commit final da venda; ignorar valores enviados pelo cliente |
| Cliente usa cupom 2x no preview, falha no commit | Baixa | UX aceita na v1 (D6); raro; mensagem clara no commit |
| Cupom aplicado em campanha errada | Média | Preview visual claro + teste manual pré-campanha |
| Operador esquece de marcar `usarOnline` | Baixa | Copy do modal explicita o impacto |
| Rate limit bloqueia operador admin testando | Baixa | Endpoint admin separado mantém sem rate limit |
| Turnstile down derruba checkout B2C | Média | Feature flag desliga CAPTCHA em emergência; fallback hCaptcha |
| Token CAPTCHA reusado entre clientes | Baixa | Cache server-side com fingerprint (IP + UA) e TTL curto (5 min) |

## Dependências para execução

- Infra de rate limit — se não houver Redis no projeto, usar Bucket4j
  em memória (aceitável pra 1-2 pods).
- Feature flag `voucher.online.enabled` no toggle do projeto.
- **Cloudflare Turnstile** (preferência) ou hCaptcha — conta criada,
  sitekey em env var pública (`NEXT_PUBLIC_TURNSTILE_SITE_KEY`),
  secret em vault (`TURNSTILE_SECRET_KEY`).
- Evento analytics (Mixpanel ou similar) — reusar infra existente.

## Aprovação

Este PRD precisa de:

- [x] OK do CEO (escopo + decisões D1/D2/D3/D4/D5/D6) — confirmado
  em sessão 2026-04-24
- [ ] Review de @architect (endpoint público, rate limit design,
  integração Turnstile)
- [ ] Review de @data-engineer (migration + índice em `voucher.codigo`)
- [ ] Review de @qa (checklist de segurança + casos de teste)

Só depois de tudo: @sm drafta story e vai pro ciclo SDC.

## Histórico de revisão

- 2026-04-24 — versão inicial criada após Phase 3 do convênio.
- 2026-04-24 — D4 (CAPTCHA mandatório), D5 (consumo no commit) e D6
  (`umaVezPorCliente` no backend) confirmadas pelo CEO. Wave 5 antiga
  (CAPTCHA opcional) reorganizada — CAPTCHA virou parte da Wave 3.
