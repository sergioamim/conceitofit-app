# Smoke Test BE↔FE — Matriz endpoint → status

**Data:** 2026-04-10
**Gerado por:** `scripts/smoke-test-be-fe.mjs` (Task #552)
**Modo:** dry-run (sem chamadas HTTP)

## Sumário

- Total de endpoints extraídos (via AST): `403`
- Apenas GET estáticos executáveis: `100`
- Paths dinâmicos (com path params): `204` — reportados mas não executados
- Endpoints em módulos fantasmas (ADR-001): `35` — pulados
- Endpoints em módulos parciais: `20`

## Como rodar

```bash
# Listagem sem bater no backend (dry-run)
node scripts/smoke-test-be-fe.mjs --dry-run --out=docs/SMOKE_TEST_BE_FE_MATRIX.md

# Execução real contra staging
BACKEND_PROXY_TARGET=https://staging.example.com \
SMOKE_TENANT_ID=550e8400-... \
SMOKE_AUTH_TOKEN=eyJhbGciOi... \
  node scripts/smoke-test-be-fe.mjs --out=docs/SMOKE_TEST_BE_FE_MATRIX.md

# Subset por filtro (regex sobre o path)
node scripts/smoke-test-be-fe.mjs --filter=dashboard
```

## Exit criteria para as Waves de execução

Antes de iniciar qualquer task das Waves 1-4, rodar este script com filtro dos endpoints da wave e garantir:

- **Nenhum endpoint da wave em `🔥 5xx` ou `💥 network`**
- **Nenhum endpoint da wave em `❌ 404`** (exceto se conhecido como módulo fantasma)
- **`🔒 auth`** aceitável se o token de teste não tiver escopo suficiente — revalidar com escopo pleno

## Matriz completa

| Status | Método | Path | Arquivo | Tempo (ms) | Nota |
| --- | --- | --- | --- | ---: | --- |
| ⏸️ skipped | GET | `/api/v1/administrativo/atividades` | `administrativo.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/administrativo/atividades` | `administrativo.ts` | - |  |
| ⏸️ skipped | GET | `/api/v1/administrativo/atividades-grade` | `administrativo.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/administrativo/atividades-grade` | `administrativo.ts` | - |  |
| ⏸️ skipped | PUT | `/api/v1/administrativo/atividades-grade/{param}` | `administrativo.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | DELETE | `/api/v1/administrativo/atividades-grade/{param}` | `administrativo.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | POST | `/api/v1/administrativo/atividades-grade/{param}/ocorrencias` | `administrativo.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | PATCH | `/api/v1/administrativo/atividades-grade/{param}/toggle` | `administrativo.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | PUT | `/api/v1/administrativo/atividades/{param}` | `administrativo.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | DELETE | `/api/v1/administrativo/atividades/{param}` | `administrativo.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | PATCH | `/api/v1/administrativo/atividades/{param}/toggle` | `administrativo.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | GET | `/api/v1/administrativo/cargos` | `administrativo.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/administrativo/cargos` | `administrativo.ts` | - |  |
| ⏸️ skipped | PUT | `/api/v1/administrativo/cargos/{param}` | `administrativo.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | DELETE | `/api/v1/administrativo/cargos/{param}` | `administrativo.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | PATCH | `/api/v1/administrativo/cargos/{param}/toggle` | `administrativo.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | GET | `/api/v1/administrativo/funcionarios` | `administrativo.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/administrativo/funcionarios` | `administrativo.ts` | - |  |
| ⏸️ skipped | PUT | `/api/v1/administrativo/funcionarios/{param}` | `administrativo.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | DELETE | `/api/v1/administrativo/funcionarios/{param}` | `administrativo.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | PATCH | `/api/v1/administrativo/funcionarios/{param}/toggle` | `administrativo.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | GET | `/api/v1/administrativo/salas` | `administrativo.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/administrativo/salas` | `administrativo.ts` | - |  |
| ⏸️ skipped | PUT | `/api/v1/administrativo/salas/{param}` | `administrativo.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | DELETE | `/api/v1/administrativo/salas/{param}` | `administrativo.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | PATCH | `/api/v1/administrativo/salas/{param}/toggle` | `administrativo.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | GET | `/api/v1/comercial/alunos` | `alunos.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/comercial/alunos` | `alunos.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/comercial/alunos-com-matricula` | `alunos.ts` | - |  |
| ⏸️ skipped | GET | `/api/v1/comercial/alunos/{param}` | `alunos.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | PUT | `/api/v1/comercial/alunos/{param}` | `alunos.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | DELETE | `/api/v1/comercial/alunos/{param}` | `alunos.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | PATCH | `/api/v1/comercial/alunos/{param}/status` | `alunos.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | GET | `/api/v1/comercial/clientes/{param}/contexto-operacional` | `alunos.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | POST | `/api/v1/comercial/clientes/{param}/migrar-unidade` | `alunos.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | GET | `/api/v1/app-cliente/campanhas` | `app-cliente.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/app-cliente/campanhas/{param}/lida` | `app-cliente.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | GET | `/api/v1/app-cliente/carteirinha-digital` | `app-cliente.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/app-cliente/carteirinha-digital/rotacionar` | `app-cliente.ts` | - |  |
| ⏸️ skipped | GET | `/api/v1/app-cliente/cobrancas` | `app-cliente.ts` | - |  |
| ⏸️ skipped | GET | `/api/v1/app-cliente/cobrancas/{param}` | `app-cliente.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | POST | `/api/v1/app-cliente/cobrancas/{param}/segunda-via` | `app-cliente.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | GET | `/api/v1/app-cliente/contexto` | `app-cliente.ts` | - |  |
| ⏸️ skipped | GET | `/api/v1/app-cliente/contratos` | `app-cliente.ts` | - |  |
| ⏸️ skipped | GET | `/api/v1/app-cliente/contratos/{param}` | `app-cliente.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | POST | `/api/v1/app-cliente/contratos/{param}/assinaturas` | `app-cliente.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | POST | `/api/v1/app-cliente/contratos/{param}/otp` | `app-cliente.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | GET | `/api/v1/app-cliente/contratos/{param}/pdf` | `app-cliente.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | GET | `/api/v1/app-cliente/financeiro/inadimplencia` | `app-cliente.ts` | - |  |
| ⏸️ skipped | GET | `/api/v1/app-cliente/home-snapshot` | `app-cliente.ts` | - |  |
| ⏸️ skipped | GET | `/api/v1/app-cliente/loja/catalogo` | `app-cliente.ts` | - |  |
| ⏸️ skipped | GET | `/api/v1/app-cliente/loja/pedidos` | `app-cliente.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/app-cliente/loja/pedidos` | `app-cliente.ts` | - |  |
| ⏸️ skipped | GET | `/api/v1/app-cliente/loja/pedidos/{param}` | `app-cliente.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | POST | `/api/v1/app-cliente/notificacoes/device-token` | `app-cliente.ts` | - |  |
| ⏸️ skipped | DELETE | `/api/v1/app-cliente/notificacoes/device-token` | `app-cliente.ts` | - |  |
| ⏸️ skipped | GET | `/api/v1/app-cliente/portabilidade` | `app-cliente.ts` | - |  |
| ⏸️ skipped | GET | `/api/v1/app-cliente/referral` | `app-cliente.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/app-cliente/referral` | `app-cliente.ts` | - |  |
| ⏸️ skipped | GET | `/api/v1/app-cliente/rewards` | `app-cliente.ts` | - |  |
| ⏸️ skipped | POST | `{param}/classificar-intencao` | `atendimento-ai.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | POST | `{param}/proxima-acao` | `atendimento-ai.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | POST | `{param}/resumir` | `atendimento-ai.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | POST | `{param}/sugerir-resposta` | `atendimento-ai.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | POST | `{param}/sugerir-roteamento` | `atendimento-ai.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | POST | `/api/v1/admin/auth/login` | `auth.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/auth/change-password` | `auth.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/auth/context/tenant` | `auth.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/auth/context/tenant` | `auth.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/auth/first-access` | `auth.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/auth/forgot-password` | `auth.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/auth/login` | `auth.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/auth/logout` | `auth.ts` | - |  |
| ⏸️ skipped | GET | `/api/v1/auth/me` | `auth.ts` | - |  |
| ⏸️ skipped | GET | `/api/v1/auth/rede-contexto` | `auth.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/auth/refresh` | `auth.ts` | - |  |
| ⏸️ skipped | GET | `/api/v1/administrativo/convenios` | `beneficios.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/administrativo/convenios` | `beneficios.ts` | - |  |
| ⏸️ skipped | PUT | `/api/v1/administrativo/convenios/{param}` | `beneficios.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | DELETE | `/api/v1/administrativo/convenios/{param}` | `beneficios.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | PATCH | `/api/v1/administrativo/convenios/{param}/toggle` | `beneficios.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | GET | `/api/v1/administrativo/vouchers` | `beneficios.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/administrativo/vouchers` | `beneficios.ts` | - |  |
| ⏸️ skipped | PUT | `/api/v1/administrativo/vouchers/{param}` | `beneficios.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | GET | `/api/v1/administrativo/vouchers/{param}/codigos` | `beneficios.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | PATCH | `/api/v1/administrativo/vouchers/{param}/toggle` | `beneficios.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | GET | `/api/v1/administrativo/vouchers/usage-counts` | `beneficios.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/comercial/vouchers/validar` | `beneficios.ts` | - |  |
| ⏸️ skipped | GET | `/api/v1/bi/inadimplencia` | `bi.ts` | - |  |
| ⏸️ skipped | GET | `/api/v1/bi/receita` | `bi.ts` | - |  |
| ⏸️ skipped | GET | `/api/v1/bi/retencao` | `bi.ts` | - |  |
| 🚫 phantom | GET | `/api/v1/billing/assinaturas` | `billing.ts` | - | módulo fantasma (ADR-001) |
| 🚫 phantom | POST | `/api/v1/billing/assinaturas` | `billing.ts` | - | módulo fantasma (ADR-001) |
| 🚫 phantom | GET | `/api/v1/billing/assinaturas/{param}` | `billing.ts` | - | path dinâmico (skip runtime) |
| 🚫 phantom | PATCH | `/api/v1/billing/assinaturas/{param}/cancelar` | `billing.ts` | - | path dinâmico (skip runtime) |
| 🚫 phantom | GET | `/api/v1/billing/config` | `billing.ts` | - | módulo fantasma (ADR-001) |
| 🚫 phantom | PUT | `/api/v1/billing/config` | `billing.ts` | - | módulo fantasma (ADR-001) |
| 🚫 phantom | POST | `/api/v1/billing/config/test` | `billing.ts` | - | módulo fantasma (ADR-001) |
| ⏸️ skipped | GET | `/api/v1/bot/prompt` | `bot.ts` | - |  |
| ⏸️ skipped | GET | `/api/v1/bot/prompt/template` | `bot.ts` | - |  |
| ⏸️ skipped | GET | `/api/v1/comercial/alunos/{param}/cartoes` | `cartoes.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | POST | `/api/v1/comercial/alunos/{param}/cartoes` | `cartoes.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | GET | `/api/v1/comercial/bandeiras-cartao` | `cartoes.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/comercial/bandeiras-cartao` | `cartoes.ts` | - |  |
| ⏸️ skipped | PUT | `/api/v1/comercial/bandeiras-cartao/{param}` | `cartoes.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | DELETE | `/api/v1/comercial/bandeiras-cartao/{param}` | `cartoes.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | PATCH | `/api/v1/comercial/bandeiras-cartao/{param}/toggle` | `cartoes.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | DELETE | `/api/v1/comercial/cartoes/{param}` | `cartoes.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | PATCH | `/api/v1/comercial/cartoes/{param}/padrao` | `cartoes.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | GET | `/api/v1/gerencial/catraca/acessos/dashboard` | `catraca.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/integracoes/catraca/credenciais` | `catraca.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/integracoes/catraca/faces/sync` | `catraca.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/integracoes/catraca/ws/commands/grant` | `catraca.ts` | - |  |
| ⏸️ skipped | GET | `/api/v1/integracoes/catraca/ws/status` | `catraca.ts` | - |  |
| ⏸️ skipped | GET | `/api/v1/integracoes/catraca/ws/status/{param}` | `catraca.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | GET | `/api/v1/comercial/planos` | `comercial-catalogo.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/comercial/planos` | `comercial-catalogo.ts` | - |  |
| ⏸️ skipped | GET | `/api/v1/comercial/planos/{param}` | `comercial-catalogo.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | PUT | `/api/v1/comercial/planos/{param}` | `comercial-catalogo.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | DELETE | `/api/v1/comercial/planos/{param}` | `comercial-catalogo.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | PATCH | `/api/v1/comercial/planos/{param}/toggle-ativo` | `comercial-catalogo.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | PATCH | `/api/v1/comercial/planos/{param}/toggle-destaque` | `comercial-catalogo.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | GET | `/api/v1/comercial/produtos` | `comercial-catalogo.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/comercial/produtos` | `comercial-catalogo.ts` | - |  |
| ⏸️ skipped | PUT | `/api/v1/comercial/produtos/{param}` | `comercial-catalogo.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | DELETE | `/api/v1/comercial/produtos/{param}` | `comercial-catalogo.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | PATCH | `/api/v1/comercial/produtos/{param}/toggle` | `comercial-catalogo.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | GET | `/api/v1/comercial/servicos` | `comercial-catalogo.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/comercial/servicos` | `comercial-catalogo.ts` | - |  |
| ⏸️ skipped | PUT | `/api/v1/comercial/servicos/{param}` | `comercial-catalogo.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | DELETE | `/api/v1/comercial/servicos/{param}` | `comercial-catalogo.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | PATCH | `/api/v1/comercial/servicos/{param}/toggle` | `comercial-catalogo.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | GET | `/api/v1/gerencial/financeiro/conciliacao-bancaria/dashboard` | `conciliacao-bancaria.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/gerencial/financeiro/conciliacao-bancaria/importar-ofx` | `conciliacao-bancaria.ts` | - |  |
| ⏸️ skipped | GET | `/api/v1/gerencial/financeiro/conciliacao-bancaria/linhas` | `conciliacao-bancaria.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/gerencial/financeiro/conciliacao-bancaria/linhas` | `conciliacao-bancaria.ts` | - |  |
| ⏸️ skipped | PATCH | `/api/v1/gerencial/financeiro/conciliacao-bancaria/linhas/{param}/conciliar` | `conciliacao-bancaria.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | PATCH | `/api/v1/gerencial/financeiro/conciliacao-bancaria/linhas/{param}/ignorar` | `conciliacao-bancaria.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | GET | `/api/v1/gerencial/financeiro/contas-bancarias` | `contas-bancarias.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/gerencial/financeiro/contas-bancarias` | `contas-bancarias.ts` | - |  |
| ⏸️ skipped | PUT | `/api/v1/gerencial/financeiro/contas-bancarias/{param}` | `contas-bancarias.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | PATCH | `/api/v1/gerencial/financeiro/contas-bancarias/{param}/toggle` | `contas-bancarias.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | GET | `/api/v1/gerencial/financeiro/contas-receber` | `contas-receber.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/gerencial/financeiro/contas-receber` | `contas-receber.ts` | - |  |
| ⏸️ skipped | PUT | `/api/v1/gerencial/financeiro/contas-receber/{param}` | `contas-receber.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | PATCH | `/api/v1/gerencial/financeiro/contas-receber/{param}/cancelar` | `contas-receber.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | PATCH | `/api/v1/gerencial/financeiro/contas-receber/{param}/receber` | `contas-receber.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | GET | `/api/v1/academia` | `contexto-unidades.ts` | - |  |
| ⏸️ skipped | GET | `/api/v1/academia` | `contexto-unidades.ts` | - |  |
| ⏸️ skipped | PUT | `/api/v1/academia` | `contexto-unidades.ts` | - |  |
| ⏸️ skipped | GET | `/api/v1/app/bootstrap` | `contexto-unidades.ts` | - |  |
| ⏸️ skipped | GET | `/api/v1/context/horarios-funcionamento` | `contexto-unidades.ts` | - |  |
| ⏸️ skipped | PUT | `/api/v1/context/horarios-funcionamento` | `contexto-unidades.ts` | - |  |
| ⏸️ skipped | GET | `/api/v1/context/tenant-atual` | `contexto-unidades.ts` | - |  |
| ⏸️ skipped | PUT | `/api/v1/context/tenant-atual` | `contexto-unidades.ts` | - |  |
| ⏸️ skipped | GET | `/api/v1/context/unidade-ativa` | `contexto-unidades.ts` | - |  |
| ⏸️ skipped | PUT | `/api/v1/context/unidade-ativa/{param}` | `contexto-unidades.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | GET | `/api/v1/unidades` | `contexto-unidades.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/unidades` | `contexto-unidades.ts` | - |  |
| ⏸️ skipped | PUT | `/api/v1/unidades/{param}` | `contexto-unidades.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | DELETE | `/api/v1/unidades/{param}` | `contexto-unidades.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | PATCH | `/api/v1/unidades/{param}/toggle` | `contexto-unidades.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | GET | `/api/v1/conversas` | `conversas.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/conversas` | `conversas.ts` | - |  |
| ⏸️ skipped | GET | `/api/v1/conversas/{param}` | `conversas.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | PATCH | `/api/v1/conversas/{param}` | `conversas.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | POST | `/api/v1/conversas/{param}/mensagens` | `conversas.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | PATCH | `/api/v1/conversas/{param}/owner` | `conversas.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | PATCH | `/api/v1/conversas/{param}/queue` | `conversas.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | POST | `/api/v1/conversas/{param}/tarefas` | `conversas.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | GET | `/api/v1/conversas/{param}/thread` | `conversas.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | PATCH | `/api/v1/conversas/{param}/unidade` | `conversas.ts` | - | path dinâmico (skip runtime) |
| 🚫 phantom | GET | `/api/v1/crm/cadencias/escalation-rules` | `crm-cadencias.ts` | - | módulo fantasma (ADR-001) |
| 🚫 phantom | POST | `/api/v1/crm/cadencias/escalation-rules` | `crm-cadencias.ts` | - | módulo fantasma (ADR-001) |
| 🚫 phantom | PUT | `/api/v1/crm/cadencias/escalation-rules/{param}` | `crm-cadencias.ts` | - | path dinâmico (skip runtime) |
| 🚫 phantom | DELETE | `/api/v1/crm/cadencias/escalation-rules/{param}` | `crm-cadencias.ts` | - | path dinâmico (skip runtime) |
| 🚫 phantom | GET | `/api/v1/crm/cadencias/execucoes` | `crm-cadencias.ts` | - | módulo fantasma (ADR-001) |
| 🚫 phantom | GET | `/api/v1/crm/cadencias/execucoes/{param}` | `crm-cadencias.ts` | - | path dinâmico (skip runtime) |
| 🚫 phantom | POST | `/api/v1/crm/cadencias/execucoes/{param}/cancelar` | `crm-cadencias.ts` | - | path dinâmico (skip runtime) |
| 🚫 phantom | POST | `/api/v1/crm/cadencias/process-overdue` | `crm-cadencias.ts` | - | módulo fantasma (ADR-001) |
| 🚫 phantom | POST | `/api/v1/crm/cadencias/trigger` | `crm-cadencias.ts` | - | módulo fantasma (ADR-001) |
| ⏸️ skipped | GET | `/api/v1/academia/prospects` | `crm.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/academia/prospects` | `crm.ts` | - |  |
| ⏸️ skipped | GET | `/api/v1/academia/prospects/{param}` | `crm.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | PUT | `/api/v1/academia/prospects/{param}` | `crm.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | DELETE | `/api/v1/academia/prospects/{param}` | `crm.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | POST | `/api/v1/academia/prospects/{param}/perdido` | `crm.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | PATCH | `/api/v1/academia/prospects/{param}/status` | `crm.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | GET | `/api/v1/academia/prospects/check-duplicate` | `crm.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/academia/prospects/converter` | `crm.ts` | - |  |
| ⏸️ skipped | GET | `/api/v1/crm/atividades` | `crm.ts` | - |  |
| ⏸️ skipped | GET | `/api/v1/crm/automacoes` | `crm.ts` | - |  |
| ⏸️ skipped | PUT | `/api/v1/crm/automacoes/{param}` | `crm.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | GET | `/api/v1/crm/cadencias` | `crm.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/crm/cadencias` | `crm.ts` | - |  |
| ⏸️ skipped | PUT | `/api/v1/crm/cadencias/{param}` | `crm.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | GET | `/api/v1/crm/campanhas` | `crm.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/crm/campanhas` | `crm.ts` | - |  |
| ⏸️ skipped | PUT | `/api/v1/crm/campanhas/{param}` | `crm.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | POST | `/api/v1/crm/campanhas/{param}/disparar` | `crm.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | PATCH | `/api/v1/crm/campanhas/{param}/encerrar` | `crm.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | GET | `/api/v1/crm/dashboard/retencao` | `crm.ts` | - |  |
| ⏸️ skipped | GET | `/api/v1/crm/pipeline-stages` | `crm.ts` | - |  |
| ⏸️ skipped | GET | `/api/v1/crm/playbooks` | `crm.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/crm/playbooks` | `crm.ts` | - |  |
| ⏸️ skipped | PUT | `/api/v1/crm/playbooks/{param}` | `crm.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | PATCH | `/api/v1/crm/prospect-agendamentos/{param}/status` | `crm.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | GET | `/api/v1/crm/prospects/{param}/agendamentos` | `crm.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | POST | `/api/v1/crm/prospects/{param}/agendamentos` | `crm.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | GET | `/api/v1/crm/prospects/{param}/mensagens` | `crm.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | POST | `/api/v1/crm/prospects/{param}/mensagens` | `crm.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | GET | `/api/v1/crm/tarefas` | `crm.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/crm/tarefas` | `crm.ts` | - |  |
| ⏸️ skipped | PUT | `/api/v1/crm/tarefas/{param}` | `crm.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | GET | `/api/v1/academia/dashboard` | `dashboard.ts` | - |  |
| ⏸️ skipped | GET | `/api/v1/financeiro/dunning/dashboard` | `dunning.ts` | - |  |
| ⏸️ skipped | GET | `/api/v1/financeiro/dunning/intervencao` | `dunning.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/financeiro/dunning/intervencao/{param}/gerar-link-pagamento` | `dunning.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | POST | `/api/v1/financeiro/dunning/intervencao/{param}/regularizar` | `dunning.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | POST | `/api/v1/financeiro/dunning/intervencao/{param}/suspender` | `dunning.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | POST | `/api/v1/financeiro/dunning/intervencao/{param}/tentar-outro-gateway` | `dunning.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | POST | `/api/v1/financeiro/dunning/intervencao/lote/regularizar` | `dunning.ts` | - |  |
| ⏸️ skipped | GET | `/api/v1/financeiro/dunning/templates` | `dunning.ts` | - |  |
| ⏸️ skipped | PUT | `/api/v1/financeiro/dunning/templates/{param}/{param}` | `dunning.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | GET | `{param}/campanhas` | `fidelizacao.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | POST | `{param}/campanhas` | `fidelizacao.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | PUT | `{param}/campanhas/{param}` | `fidelizacao.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | GET | `{param}/indicacoes` | `fidelizacao.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | POST | `{param}/indicacoes` | `fidelizacao.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | POST | `{param}/indicacoes/{param}/converter` | `fidelizacao.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | GET | `{param}/saldos` | `fidelizacao.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | GET | `{param}/saldos/{param}` | `fidelizacao.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | POST | `{param}/saldos/{param}/resgates` | `fidelizacao.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | GET | `/api/v1/gerencial/financeiro/contas-pagar` | `financeiro-gerencial.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/gerencial/financeiro/contas-pagar` | `financeiro-gerencial.ts` | - |  |
| ⏸️ skipped | PUT | `/api/v1/gerencial/financeiro/contas-pagar/{param}` | `financeiro-gerencial.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | PATCH | `/api/v1/gerencial/financeiro/contas-pagar/{param}/cancelar` | `financeiro-gerencial.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | PATCH | `/api/v1/gerencial/financeiro/contas-pagar/{param}/pagar` | `financeiro-gerencial.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | POST | `/api/v1/gerencial/financeiro/contas-pagar/recorrencia/gerar` | `financeiro-gerencial.ts` | - |  |
| ⏸️ skipped | GET | `/api/v1/gerencial/financeiro/dre` | `financeiro-gerencial.ts` | - |  |
| ⏸️ skipped | GET | `/api/v1/gerencial/financeiro/dre/projecao` | `financeiro-gerencial.ts` | - |  |
| ⏸️ skipped | GET | `/api/v1/gerencial/financeiro/regras-recorrencia` | `financeiro-gerencial.ts` | - |  |
| ⏸️ skipped | PATCH | `/api/v1/gerencial/financeiro/regras-recorrencia/{param}/cancelar` | `financeiro-gerencial.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | PATCH | `/api/v1/gerencial/financeiro/regras-recorrencia/{param}/pausar` | `financeiro-gerencial.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | PATCH | `/api/v1/gerencial/financeiro/regras-recorrencia/{param}/retomar` | `financeiro-gerencial.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | GET | `/api/v1/administrativo/integracoes-operacionais` | `financeiro-operacional.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/administrativo/integracoes-operacionais/{param}/reprocessar` | `financeiro-operacional.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | GET | `/api/v1/administrativo/nfse/configuracao-atual` | `financeiro-operacional.ts` | - |  |
| ⏸️ skipped | PUT | `/api/v1/administrativo/nfse/configuracao-atual` | `financeiro-operacional.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/administrativo/nfse/configuracao-atual/validar` | `financeiro-operacional.ts` | - |  |
| ⏸️ skipped | GET | `/api/v1/gerencial/agregadores/transacoes` | `financeiro-operacional.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/gerencial/agregadores/transacoes/{param}/reprocessar` | `financeiro-operacional.ts` | - | path dinâmico (skip runtime) |
| ⚠️ partial | GET | `/api/v1/financial/accounts` | `financial.ts` | - |  |
| ⚠️ partial | POST | `/api/v1/financial/accounts` | `financial.ts` | - |  |
| ⚠️ partial | GET | `/api/v1/financial/accounts/{param}` | `financial.ts` | - | path dinâmico (skip runtime) |
| ⚠️ partial | PUT | `/api/v1/financial/accounts/{param}` | `financial.ts` | - | path dinâmico (skip runtime) |
| ⚠️ partial | GET | `/api/v1/financial/ledgers` | `financial.ts` | - |  |
| ⚠️ partial | POST | `/api/v1/financial/ledgers` | `financial.ts` | - |  |
| ⚠️ partial | GET | `/api/v1/financial/ledgers/{param}` | `financial.ts` | - | path dinâmico (skip runtime) |
| ⚠️ partial | PATCH | `/api/v1/financial/ledgers/{param}/close` | `financial.ts` | - | path dinâmico (skip runtime) |
| ⚠️ partial | POST | `/api/v1/financial/ledgers/{param}/entries` | `financial.ts` | - | path dinâmico (skip runtime) |
| ⚠️ partial | GET | `/api/v1/financial/monitoring/high-frequency/{param}` | `financial.ts` | - | path dinâmico (skip runtime) |
| ⚠️ partial | GET | `/api/v1/financial/monitoring/high-value/{param}` | `financial.ts` | - | path dinâmico (skip runtime) |
| ⚠️ partial | GET | `/api/v1/financial/monitoring/suspicious-transactions` | `financial.ts` | - |  |
| ⚠️ partial | GET | `/api/v1/financial/monitoring/unusual-patterns/{param}` | `financial.ts` | - | path dinâmico (skip runtime) |
| ⚠️ partial | GET | `/api/v1/financial/transactions` | `financial.ts` | - |  |
| ⚠️ partial | POST | `/api/v1/financial/transactions` | `financial.ts` | - |  |
| ⚠️ partial | GET | `/api/v1/financial/transactions/{param}` | `financial.ts` | - | path dinâmico (skip runtime) |
| ⚠️ partial | PATCH | `/api/v1/financial/transactions/{param}/cancel` | `financial.ts` | - | path dinâmico (skip runtime) |
| ⚠️ partial | PATCH | `/api/v1/financial/transactions/{param}/confirm` | `financial.ts` | - | path dinâmico (skip runtime) |
| ⚠️ partial | POST | `/api/v1/financial/transactions/{param}/reverse` | `financial.ts` | - | path dinâmico (skip runtime) |
| ⚠️ partial | GET | `/api/v1/relatorios/fluxo-caixa` | `financial.ts` | - |  |
| ⏸️ skipped | GET | `/api/v1/gerencial/financeiro/formas-pagamento` | `formas-pagamento.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/gerencial/financeiro/formas-pagamento` | `formas-pagamento.ts` | - |  |
| ⏸️ skipped | PUT | `/api/v1/gerencial/financeiro/formas-pagamento/{param}` | `formas-pagamento.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | DELETE | `/api/v1/gerencial/financeiro/formas-pagamento/{param}` | `formas-pagamento.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | PATCH | `/api/v1/gerencial/financeiro/formas-pagamento/{param}/toggle` | `formas-pagamento.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | GET | `/api/v1/gerencial/financeiro/formas-pagamento/labels` | `formas-pagamento.ts` | - |  |
| ⏸️ skipped | GET | `/api/v1/grade/mural/{param}` | `grade-mural.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | POST | `/api/v1/admin/integracoes/importacao-terceiros/evo/p0/pacote` | `importacao-evo.ts` | - |  |
| ⏸️ skipped | GET | `/api/v1/admin/integracoes/importacao-terceiros/evo/p0/pacote/{param}` | `importacao-evo.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | POST | `/api/v1/admin/integracoes/importacao-terceiros/evo/p0/pacote/{param}/job` | `importacao-evo.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | POST | `/api/v1/admin/integracoes/importacao-terceiros/evo/p0/upload` | `importacao-evo.ts` | - |  |
| ⏸️ skipped | GET | `/api/v1/admin/integracoes/importacao-terceiros/jobs/{param}` | `importacao-evo.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | GET | `/api/v1/admin/integracoes/importacao-terceiros/jobs/{param}/p0` | `importacao-evo.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | GET | `/api/v1/admin/integracoes/importacao-terceiros/jobs/{param}/rejeicoes` | `importacao-evo.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | GET | `/api/v1/admin/integracoes/importacao-terceiros/jobs/{param}/rejeicoes` | `importacao-evo.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | POST | `/api/v1/integracoes/agregadores/{param}/booking/classes/publicar` | `integracoes-agregadores.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | POST | `/api/v1/integracoes/agregadores/{param}/booking/slots/publicar` | `integracoes-agregadores.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | GET | `/api/v1/integracoes/agregadores/{param}/status` | `integracoes-agregadores.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | POST | `/api/v1/integracoes/agregadores/{param}/validate` | `integracoes-agregadores.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | POST | `/api/v1/integracoes/agregadores/{param}/webhooks/{param}/reprocessar` | `integracoes-agregadores.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | GET | `/api/v1/gerencial/financeiro/maquininhas` | `maquininhas.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/gerencial/financeiro/maquininhas` | `maquininhas.ts` | - |  |
| ⏸️ skipped | PUT | `/api/v1/gerencial/financeiro/maquininhas/{param}` | `maquininhas.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | PATCH | `/api/v1/gerencial/financeiro/maquininhas/{param}/toggle` | `maquininhas.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | POST | `/api/v1/comercial/matriculas` | `matriculas.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/comercial/matriculas/{param}/cancelar` | `matriculas.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | POST | `/api/v1/comercial/matriculas/{param}/contrato/assinar` | `matriculas.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | POST | `/api/v1/comercial/matriculas/{param}/renovar` | `matriculas.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | GET | `/api/v1/comercial/matriculas/dashboard-mensal` | `matriculas.ts` | - |  |
| ⏸️ skipped | GET | `/api/v1/nfse/resumo` | `nfse.ts` | - |  |
| ⏸️ skipped | GET | `/api/v1/nfse/solicitacoes` | `nfse.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/nfse/solicitacoes/{param}/cancelar` | `nfse.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | GET | `/api/v1/nfse/solicitacoes/{param}/eventos` | `nfse.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | POST | `/api/v1/nfse/solicitacoes/{param}/retry` | `nfse.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | GET | `/api/v1/notificacoes/eventos` | `notificacoes.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/notificacoes/outbox/{param}/reenviar` | `notificacoes.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | GET | `/api/v1/notificacoes/preferencias` | `notificacoes.ts` | - |  |
| ⏸️ skipped | PUT | `/api/v1/notificacoes/preferencias` | `notificacoes.ts` | - |  |
| ⏸️ skipped | GET | `/api/v1/retencao/nps/campanhas` | `nps.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/retencao/nps/campanhas` | `nps.ts` | - |  |
| ⏸️ skipped | PUT | `/api/v1/retencao/nps/campanhas/{param}` | `nps.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | POST | `/api/v1/retencao/nps/campanhas/{param}/disparar` | `nps.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | GET | `/api/v1/retencao/nps/dashboard` | `nps.ts` | - |  |
| ⏸️ skipped | GET | `/api/v1/retencao/nps/envios` | `nps.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/retencao/nps/envios/{param}/responder` | `nps.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | GET | `/api/v1/onboarding/status` | `onboarding-api.ts` | - |  |
| ⏸️ skipped | GET | `/api/v1/comercial/pagamentos` | `pagamentos.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/comercial/pagamentos/{param}/nfse` | `pagamentos.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | POST | `/api/v1/comercial/pagamentos/{param}/receber` | `pagamentos.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | POST | `/api/v1/comercial/pagamentos/nfse/lote` | `pagamentos.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/integracoes/pix/cobrancas` | `pix.ts` | - |  |
| ⏸️ skipped | GET | `/api/v1/integracoes/pix/cobrancas/{param}` | `pix.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | DELETE | `/api/v1/integracoes/pix/cobrancas/{param}` | `pix.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | POST | `/api/v1/integracoes/pix/devolucao` | `pix.ts` | - |  |
| ⏸️ skipped | GET | `/api/v1/comercial/alunos/{param}/presencas` | `presencas.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | GET | `/api/v1/auth/auditoria/permissoes` | `rbac.ts` | - |  |
| ⏸️ skipped | GET | `/api/v1/auth/features` | `rbac.ts` | - |  |
| ⏸️ skipped | PUT | `/api/v1/auth/features/{param}` | `rbac.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | GET | `/api/v1/auth/features/grants` | `rbac.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/auth/features/grants` | `rbac.ts` | - |  |
| ⏸️ skipped | GET | `/api/v1/auth/perfis` | `rbac.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/auth/perfis` | `rbac.ts` | - |  |
| ⏸️ skipped | PUT | `/api/v1/auth/perfis/{param}` | `rbac.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | DELETE | `/api/v1/auth/perfis/{param}` | `rbac.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | GET | `/api/v1/auth/users` | `rbac.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/auth/users` | `rbac.ts` | - |  |
| ⏸️ skipped | GET | `/api/v1/auth/users/{param}/perfis` | `rbac.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | PUT | `/api/v1/auth/users/{param}/perfis/{param}` | `rbac.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | DELETE | `/api/v1/auth/users/{param}/perfis/{param}` | `rbac.ts` | - | path dinâmico (skip runtime) |
| 🚫 phantom | GET | `/api/v1/agenda/aulas/reservas` | `reservas.ts` | - | módulo fantasma (ADR-001) |
| 🚫 phantom | POST | `/api/v1/agenda/aulas/reservas` | `reservas.ts` | - | módulo fantasma (ADR-001) |
| 🚫 phantom | POST | `/api/v1/agenda/aulas/reservas/{param}/cancelar` | `reservas.ts` | - | path dinâmico (skip runtime) |
| 🚫 phantom | POST | `/api/v1/agenda/aulas/reservas/{param}/checkin` | `reservas.ts` | - | path dinâmico (skip runtime) |
| 🚫 phantom | GET | `/api/v1/agenda/aulas/sessoes` | `reservas.ts` | - | módulo fantasma (ADR-001) |
| 🚫 phantom | GET | `/api/v1/agenda/aulas/sessoes/{param}/ocupacao` | `reservas.ts` | - | path dinâmico (skip runtime) |
| 🚫 phantom | POST | `/api/v1/agenda/aulas/sessoes/{param}/promover-waitlist` | `reservas.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | GET | `/api/v1/storefront/theme` | `storefront-theme.ts` | - |  |
| ⏸️ skipped | PUT | `/api/v1/storefront/theme` | `storefront-theme.ts` | - |  |
| ⏸️ skipped | GET | `/api/v1/gerencial/financeiro/tipos-conta-pagar` | `tipos-conta.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/gerencial/financeiro/tipos-conta-pagar` | `tipos-conta.ts` | - |  |
| ⏸️ skipped | PUT | `/api/v1/gerencial/financeiro/tipos-conta-pagar/{param}` | `tipos-conta.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | PATCH | `/api/v1/gerencial/financeiro/tipos-conta-pagar/{param}/toggle` | `tipos-conta.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | GET | `/api/v1/exercicios` | `treinos.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/exercicios` | `treinos.ts` | - |  |
| ⏸️ skipped | PUT | `/api/v1/exercicios/{param}` | `treinos.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | DELETE | `/api/v1/exercicios/{param}` | `treinos.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | PATCH | `/api/v1/exercicios/{param}/toggle` | `treinos.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | GET | `/api/v1/grupos-musculares` | `treinos.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/grupos-musculares` | `treinos.ts` | - |  |
| ⏸️ skipped | PUT | `/api/v1/grupos-musculares/{param}` | `treinos.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | PATCH | `/api/v1/grupos-musculares/{param}/toggle` | `treinos.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | GET | `/api/v1/treinos` | `treinos.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/treinos` | `treinos.ts` | - |  |
| ⏸️ skipped | GET | `/api/v1/treinos/{param}` | `treinos.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | PUT | `/api/v1/treinos/{param}` | `treinos.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | POST | `/api/v1/treinos/{param}/duplicar-template` | `treinos.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | POST | `/api/v1/treinos/{param}/encerrar-ciclo` | `treinos.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | POST | `/api/v1/treinos/{param}/encerrar-ciclo` | `treinos.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | POST | `/api/v1/treinos/{param}/execucoes` | `treinos.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | GET | `/api/v1/treinos/{param}/prescricao` | `treinos.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | POST | `/api/v1/treinos/{param}/prescricao` | `treinos.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | PATCH | `/api/v1/treinos/{param}/renovar` | `treinos.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | POST | `/api/v1/treinos/{param}/revisar` | `treinos.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | GET | `/api/v1/treinos/aderencia` | `treinos.ts` | - |  |
| ⏸️ skipped | GET | `/api/v1/treinos/templates` | `treinos.ts` | - |  |
| ⏸️ skipped | GET | `/api/v1/comercial/vendas` | `vendas.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/comercial/vendas` | `vendas.ts` | - |  |
| ⏸️ skipped | GET | `/api/v1/comercial/vendas/{param}` | `vendas.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | GET | `/api/v1/visitantes` | `visitantes.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/visitantes` | `visitantes.ts` | - |  |
| ⏸️ skipped | DELETE | `/api/v1/visitantes/{param}` | `visitantes.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | POST | `/api/v1/visitantes/entrada` | `visitantes.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/visitantes/validar` | `visitantes.ts` | - |  |
| ⏸️ skipped | GET | `/api/v1/whatsapp/credentials` | `whatsapp-credentials.ts` | - |  |
| ⏸️ skipped | POST | `/api/v1/whatsapp/credentials` | `whatsapp-credentials.ts` | - |  |
| ⏸️ skipped | PUT | `/api/v1/whatsapp/credentials/{param}` | `whatsapp-credentials.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | DELETE | `/api/v1/whatsapp/credentials/{param}` | `whatsapp-credentials.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | GET | `/api/v1/whatsapp/credentials/{param}/health` | `whatsapp-credentials.ts` | - | path dinâmico (skip runtime) |
| ⏸️ skipped | POST | `/api/v1/whatsapp/credentials/{param}/refresh-token` | `whatsapp-credentials.ts` | - | path dinâmico (skip runtime) |
| 🚫 phantom | GET | `/api/v1/whatsapp/config` | `whatsapp.ts` | - | módulo fantasma (ADR-001) |
| 🚫 phantom | PUT | `/api/v1/whatsapp/config` | `whatsapp.ts` | - | módulo fantasma (ADR-001) |
| 🚫 phantom | POST | `/api/v1/whatsapp/config/test` | `whatsapp.ts` | - | módulo fantasma (ADR-001) |
| 🚫 phantom | GET | `/api/v1/whatsapp/logs` | `whatsapp.ts` | - | módulo fantasma (ADR-001) |
| 🚫 phantom | POST | `/api/v1/whatsapp/send` | `whatsapp.ts` | - | módulo fantasma (ADR-001) |
| 🚫 phantom | GET | `/api/v1/whatsapp/stats` | `whatsapp.ts` | - | módulo fantasma (ADR-001) |
| 🚫 phantom | GET | `/api/v1/whatsapp/status/{param}` | `whatsapp.ts` | - | path dinâmico (skip runtime) |
| 🚫 phantom | GET | `/api/v1/whatsapp/templates` | `whatsapp.ts` | - | módulo fantasma (ADR-001) |
| 🚫 phantom | POST | `/api/v1/whatsapp/templates` | `whatsapp.ts` | - | módulo fantasma (ADR-001) |
| 🚫 phantom | PUT | `/api/v1/whatsapp/templates/{param}` | `whatsapp.ts` | - | path dinâmico (skip runtime) |
| 🚫 phantom | DELETE | `/api/v1/whatsapp/templates/{param}` | `whatsapp.ts` | - | path dinâmico (skip runtime) |
| 🚫 phantom | POST | `/api/v1/whatsapp/webhook/register` | `whatsapp.ts` | - | módulo fantasma (ADR-001) |

---

_Gerado automaticamente. Não editar manualmente — rodar o script para atualizar._
