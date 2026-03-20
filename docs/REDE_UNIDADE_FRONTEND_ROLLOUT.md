# Frontend Rede-Unidade

## Objetivo

Consolidar no frontend o modelo contextual por rede com separação explícita entre:

- login por rede;
- unidade-base estrutural;
- unidade ativa operacional;
- elegibilidade contratual multiunidade;
- migração administrativa de unidade-base.

## Contratos consolidados

- `AuthUser.operationalAccess` descreve unidades elegíveis, unidades bloqueadas e mensagem de bloqueio quando o backend expuser esse bloco.
- `TenantContextProvider` mantém `eligibleTenants`, `blockedTenants`, `operationalAccessBlocked` e continua com fallback para o contrato legado quando `operationalAccess` ainda não vier.
- `ClienteOperationalContext` centraliza unidade ativa, unidade-base, aluno resolvido, elegibilidade e bloqueios do cliente.
- `ClienteMigracaoUnidadeResult` registra auditoria, origem, destino e tenant ativo sugerido após a migração estrutural.

## Feature Flags e fallback

- `NEXT_PUBLIC_CONTEXTUAL_NETWORK_ACCESS_ENABLED`
  - `true` por padrão.
  - Se desligada, `buildLoginHref` volta para `/login` mesmo com `networkSlug`.
- `NEXT_PUBLIC_CLIENT_OPERATIONAL_ELIGIBILITY_ENABLED`
  - `true` por padrão.
  - Se desligada, o app volta a operar apenas com o contexto de tenant ativo disponível, sem gate contratual central.
- `NEXT_PUBLIC_CLIENT_MIGRATION_ENABLED`
  - `true` por padrão.
  - Se desligada, a ação `Migrar unidade-base` some da tela de cliente.

## Comportamento esperado

### Login e sessão

- o app prioriza a rota contextual `/acesso/[redeSlug]/autenticacao` quando a flag de acesso por rede estiver ligada;
- clientes com uma única unidade elegível entram direto, sem seletor redundante;
- clientes com múltiplas unidades elegíveis podem trocar apenas dentro das opções liberadas;
- clientes autenticados sem elegibilidade operacional recebem um estado bloqueado central no layout.

### Detalhe de cliente

- o detalhe usa `getClienteOperationalContextService`, com fallback para a descoberta multiunidade antiga quando o endpoint canônico ainda não existir;
- a tela diferencia unidade-base e unidade ativa;
- a migração estrutural fica no menu de ações do cabeçalho, com origem, destino, justificativa, aviso de risco e resumo de auditoria.

## Evidências automatizadas

- unitário:
  - `tests/unit/auth-session-context.spec.ts`
  - `tests/unit/comercial-runtime.spec.ts`
- E2E:
  - `tests/e2e/auth-rede.spec.ts`
  - `tests/e2e/app-multiunidade-contrato.spec.ts`
  - `tests/e2e/clientes-migracao-unidade.spec.ts`

## Critérios de aceite do rollout

- login por rede continua funcional com fallback legível para o login legado;
- o topo da aplicação não oferece troca para unidades não elegíveis;
- o app bloqueia operação de cliente sem contrato elegível, com mensagem rastreável;
- a migração administrativa atualiza detalhe, contexto ativo sugerido e resumo de auditoria sem reload manual;
- contratos legados continuam operando quando bootstrap contextual ou `contexto-operacional` ainda não estiverem disponíveis.

## Backlog residual

- backend ainda pode enriquecer `operationalAccess` com taxonomia de motivos e nomes de tenant mais completos;
- o endpoint canônico `contexto-operacional` ainda convive com fallback heurístico até a adoção integral no backend;
- o estado bloqueado hoje fica concentrado no layout do app e pode ganhar CTA dedicado de suporte/renovação comercial depois.
