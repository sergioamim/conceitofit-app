# Plano de Backend para o Backoffice (`admin.conceito.fit`)

## 1) Objetivo e escopo
- Fornecer APIs administrativas para operação multi-tenant (redes de academias) sem compartilhar sessão pública.
- Permitir intervenções cross-tenant com segurança (correções, reprocessamentos, ajustes financeiros) e consultas gerenciais.
- Manter compatibilidade com o frontend existente via adapters (`services.ts`) e evoluir com contratos estáveis (OpenAPI fonte de verdade).

### 1.1 Escopo operacional do staff (visão global)
- Staff não opera uma unidade por vez: precisa visão global por rede/academia e capacidade de agir em qualquer tenant sem trocar manualmente o contexto.
- Ações globais esperadas: criar academia/grupo e unidades iniciais, importar dados de sistemas legados, gerar cobranças em massa, dar baixa/estornar pagamentos, bloquear/desbloquear acesso de unidades ou clientes, reprocessar recorrências e sincronizações.
- Para ações cross-tenant, o contrato deve incluir `targetTenantId` explícito e registrar motivo/autorizações no audit log.

## 2) Topologia e deploy
- Serviço `admin-api` separado (mesmo cluster), ingress próprio no host `admin.conceito.fit` com namespace `/admin/*`.
- Builds/artefatos independentes, mas pipeline único pode publicar imagem do app público e do admin na mesma esteira.
- Headers padrão: `X-Context-Id` para rastrear sessão/operação; `tenantId` obrigatório em chamadas transacionais; para cross-tenant exigir `targetTenantId` explícito.
- Suporte a feature flags específicas do painel para ativar operações perigosas gradualmente.

## 3) Autenticação, autorização e segurança
- OIDC/SAML com MFA obrigatório para staff; cookies limitados ao subdomínio admin (`SameSite=Strict` ou `Lax`), tempo de sessão curto com refresh token rotacionado.
- RBAC/ABAC sugerido:
  - `support`: leitura ampla + ações de correção low-risk.
  - `finance`: ações em cobrança, baixa, reabertura de faturas.
  - `ops`: operações técnicas (reprocessar recorrências, migrações de tenant).
  - `auditor`: leitura/auditoria somente leitura.
- “Break-glass” para ações cross-tenant ou destrutivas: exigir motivo, ticket de referência, dupla confirmação e, opcionalmente, aprovação de segundo operador.
- Rate limit separado para rotas admin; IP allowlist opcional para rotas críticas (billing, destrutivas).

## 4) Auditoria e rastreabilidade
- Log estruturado de ação: `userId`, `role`, `tenantId`, `targetTenantId`, entidade, operação, diffs (hash ou snapshot), `X-Context-Id`, timestamp, origem IP/User-Agent.
- Persistir em tabela própria (`audit_log`) com retenção > 180 dias e busca indexada por entidade/tenant.
- Emitir eventos para um tópico `admin.audit` para replicação em data lake/warehouse.

## 5) Dados e consultas
- Escrita no primário; leitura pesada via read-replica transacional (contagem de clientes, sanity checks) para não pressionar o primário.
- Para BI/gerencial: ETL/ELT contínuo para warehouse (camadas bronze/silver/gold) com catálogo de KPIs (clientes ativos, churn, MRR, inadimplência, tickets resolvidos).
- Exportações controladas: geração assíncrona, link único com expiração, escopo por tenant, mascaramento de dados pessoais quando fora do tenant de origem.

## 6) Contratos e compatibilidade
- OpenAPI versionada; evitar breaking changes — novos campos como opcionais e novos endpoints versionados.
- Adapter de serviços deve espelhar assinaturas de `src/lib/mock/services.ts`; divergências devem ser absorvidas no adapter e documentadas.
- Enums e nomes de campos devem seguir `src/lib/types.ts` para não quebrar UI (case-sensitive).

## 7) Domínios e rotas prioritárias (faseada)
1. **Contexto global**: visão por academia/rede, criação de academia/grupo e unidade inicial, troca de tenant e seleção de `targetTenantId` em ações cross-tenant.
2. **Financeiro/gerencial**: contas a pagar/receber, DRE, formas de pagamento, regras recorrentes, dashboard; geração de cobranças em massa e baixa/estorno.
3. **CRM/Clientes**: prospects, alunos, matrículas, pagamentos; bloqueio/desbloqueio de acesso de clientes por inadimplência ou fraude.
4. **Catálogo/Administrativo**: planos, produtos, serviços, vouchers, atividades/grade, cargos/funcionários.
5. **Imports e migração**: pipelines de importação de dados legados (academia, unidades, clientes, planos, faturas), com staging, validação e replay idempotente.
6. **Operações técnicas**: reprocessar recorrência, rebuild de mural, migrações de tenant.
- Cada grupo deve ter validação de regras críticas no backend (idempotência, estados válidos, validação de tenant).

## 8) Observabilidade
- Métricas por rota: latência, taxa de erro, percentil por role/tenant.
- Tracing com propagação do `X-Context-Id` e IDs de correlação.
- Alertas dedicados para rotas críticas (baixa financeira, reprocessamentos) e para falhas de auditoria.

## 9) Operações perigosas (guardrails)
- Idempotência por `Idempotency-Key` em POST destrutivos/repetíveis.
- Confirmação dupla + motivo obrigatório em:
  - reabrir/estornar cobrança
  - migração de tenant/unidade
  - alteração manual de status de aluno/matrícula
- Importações: processar em lotes assíncronos com dry-run, relatório de erros e bloqueio de reexecução sem nova `Idempotency-Key`.
- Bloqueio/desbloqueio de acesso: exigir motivo, ticket, e opcionalmente aprovação de segundo operador.
- Locks otimistas ou compare-and-swap em registros sensíveis para evitar race em correções.

## 10) Rollout sugerido
1. Provisionar ingress/host, auth (OIDC + MFA) e logging/auditoria mínimo.
2. Entregar fase 1 (Contexto + Financeiro) já protegida por RBAC e audit log.
3. Conectar adapter do frontend admin e validar compatibilidade com `services.ts` em staging.
4. Ativar read-replica e jobs ETL inicial para warehouse; publicar catálogo inicial de métricas.
5. Expandir domínios restantes; habilitar feature flags de operações perigosas gradualmente.
6. Revisão de segurança trimestral + drills de “break-glass”.
