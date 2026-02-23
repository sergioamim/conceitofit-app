# Handoff para IA de Backend (Integração natural com o Frontend atual)

## 1) Objetivo
Este documento descreve como o frontend está implementado hoje para que o backend seja desenvolvido com contratos e fluxos compatíveis, reduzindo retrabalho de integração.

## 2) Estado atual do frontend
- Stack: Next.js (App Router) + TypeScript.
- Dados hoje: `mock` em memória/localStorage.
- Camada usada pelas telas: `src/lib/mock/services.ts`.
- Tipos de domínio (fonte de verdade): `src/lib/types.ts`.
- Estado local persistido: `src/lib/mock/store.ts`.
- Eventos de atualização usados no layout/listas: `academia-store-updated` e `storage`.
- Rotas de mural público:
  - HTML semanal por unidade: `/grade/mural/[tenantId]`
  - HTML semanal da unidade ativa: `/grade/mural`
  - Rotas legadas `/grade/img` redirecionam para `/grade/mural`.

Importante: o backend deve permitir migração gradual, mantendo as assinaturas funcionais atuais da camada de serviços.

## 3) Estrutura organizacional (regra principal)
- `Academia` (entidade forte) possui `1..N` `Unidades`.
- `Unidade` = `Tenant` (contexto operacional).
- Quase todos os dados transacionais são por `tenantId`.
- Exceções de escopo de rede:
  - Produtos podem ser compartilhados entre unidades da mesma academia.
  - Voucher pode ser:
    - `UNIDADE` (com `tenantId`)
    - `GRUPO` (global da academia/rede, `tenantId` vazio + `groupId`/`academiaId`)

Referência de regra: `docs/BUSINESS_RULES.md`.

## 4) Modelos e enums que o backend deve espelhar
Use os nomes e valores exatamente como em `src/lib/types.ts`, principalmente:
- Prospect: `OrigemProspect`, `StatusProspect`
- Cliente: `StatusAluno`
- Plano: `TipoPlano`, `ModoAssinaturaContrato`
- Vendas: `TipoVenda`, `StatusVenda`
- Pagamentos: `TipoPagamento`, `StatusPagamento`, `TipoFormaPagamento`
- Voucher: `VoucherEscopo`, `VoucherAplicarEm`
- Campanha CRM: `CampanhaCanal`, `CampanhaPublicoAlvo`, `CampanhaStatus`

Campos críticos recentes:
- `Plano`:
  - `valorMatricula`
  - `cobraAnuidade`, `valorAnuidade`, `parcelasMaxAnuidade`
  - `permiteRenovacaoAutomatica`, `permiteCobrancaRecorrente`, `diaCobrancaPadrao`
  - `contratoTemplateHtml`, `contratoAssinatura`, `contratoEnviarAutomaticoEmail`
- `Tenant`:
  - `academiaId`
  - `configuracoes.impressaoCupom` (`58MM`, `80MM`, `CUSTOM`)
- `AtividadeGrade`:
  - `diasSemana: DiaSemana[]` (múltipla seleção)
  - `checkinLiberadoMinutosAntes`
  - flags de agenda/check-in/reserva

## 5) Rotas de frontend já existentes (consumidor da API)
Páginas principais ativas:
- Dashboard: `/dashboard`
- CRM: `/crm/prospects-kanban`, `/crm/campanhas`
- Clientes: `/clientes`, `/clientes/[id]`
- Vendas: `/vendas/nova`
- Grade semanal interna: `/grade`
- Grade semanal (mural sem menu):
  - `/grade/mural`
  - `/grade/mural/[tenantId]`
- Administrativo:
  - `/administrativo/academia`
  - `/administrativo/unidades`
  - `/administrativo/atividades`
  - `/administrativo/atividades-grade`
  - `/administrativo/funcionarios`, `/administrativo/cargos` (via modal), `/administrativo/salas`
  - `/administrativo/servicos`, `/administrativo/produtos`
  - `/administrativo/planos` (listagem em `/planos`, criação em `/planos/novo`, edição em `/planos/[id]/editar`)
  - `/administrativo/vouchers`, `/administrativo/convenios`, `/administrativo/formas-pagamento`
  - `/administrativo/tipos-conta`
- Gerencial:
  - `/gerencial/contas-a-pagar`
  - `/gerencial/contas-a-receber`
  - `/gerencial/dre`

## 6) Serviços já usados pelo frontend (API-alvo)
O frontend hoje chama funções em `src/lib/mock/services.ts`. O backend deve disponibilizar endpoints que cubram os grupos abaixo:

- Contexto organizacional
  - `listAcademias`, `getCurrentAcademia`, `updateCurrentAcademia`
  - `listTenants`, `getCurrentTenant`, `setCurrentTenant`, `createTenant`, `updateTenantById`, `toggleTenant`
- Dashboard e gerencial
  - `getDashboard(month, year)`, contas a receber, contas a pagar, DRE e agregados financeiros
  - contas a pagar:
    - `listContasPagar` (filtros por status/categoria/período/tipo/grupoDre/origem)
    - `createContaPagar` (suporta recorrência)
    - `updateContaPagar`, `pagarContaPagar`, `cancelarContaPagar`
  - tipos de conta (por unidade):
    - `listTiposContaPagar`, `createTipoContaPagar`, `updateTipoContaPagar`, `toggleTipoContaPagar`
  - regras de recorrência:
    - `listRegrasRecorrenciaContaPagar`
    - `pauseRegraRecorrencia`, `resumeRegraRecorrencia`, `cancelRegraRecorrencia`
    - `triggerGeracaoContasRecorrentes` (operação técnica)
- CRM
  - prospects (CRUD, status, perdido, duplicidade)
  - mensagens/agendamentos do prospect
  - campanhas CRM (CRUD, status, audiência estimada)
- Clientes e ciclo comercial
  - alunos (CRUD + status)
  - matrículas (listagem/renovação/cancelamento/conflitos)
  - pagamentos (listar/receber)
- Comercial
  - `createVenda`, `listVendas`
  - aplicação/validação de vouchers e cupons
- Catálogo administrativo
  - atividades, atividades-grade, planos, serviços, produtos
  - cargos, funcionários, salas
  - convênios, formas de pagamento, bandeiras/cartões
- Configuração operacional
  - horários de funcionamento
  - feriados (cadastro e importação manual por ação explícita)

## 7) Regras de negócio que precisam estar no backend
- Prospect:
  - Fluxo padrão: `NOVO -> AGENDOU_VISITA -> VISITOU -> EM_CONTATO -> CONVERTIDO` (+ `PERDIDO`)
  - `VISITA_PRESENCIAL`: ao evoluir de `NOVO`, ir para `VISITOU`
- Plano:
  - Não remover fisicamente; desativar
  - Contrato por template HTML com placeholders
- Venda:
  - `PLANO` e `SERVICO` exigem cliente identificado
  - `PRODUTO` pode ser sem cliente
  - venda pode ser mista (carrinho)
- Pagamento:
  - vencido impacta status do cliente para `INATIVO`
- Multi-unidade:
  - troca de unidade só entre unidades ativas da mesma academia
- Contas a pagar:
  - cada lançamento deve ter `tipoContaId` válido da unidade
  - `grupoDre` é herdado do tipo de conta no lançamento
  - recorrência suportada:
    - `MENSAL`
    - `INTERVALO_DIAS`
  - término da recorrência:
    - `SEM_FIM`
    - `EM_DATA`
    - `APOS_OCORRENCIAS`
  - no cadastro recorrente, existe opção de criar ou não o lançamento inicial
  - geração recorrente é responsabilidade do backend e deve ser idempotente (regra + competência/período)
- DRE:
  - agrupamento primário por `grupoDre`
  - despesas legadas sem tipo devem cair em fallback `DESPESA_OPERACIONAL`
  - expor contagem/valor de despesas sem tipo para saneamento

## 8) Padrão de integração recomendado (sem quebrar frontend)
### 8.1 Fase 1 (compatibilidade)
- Criar endpoints REST.
- Implementar um `api client` mantendo as mesmas assinaturas de `services.ts`.
- Trocar internamente chamadas do mock por HTTP, sem alterar páginas.

### 8.2 Fase 2 (endurecimento)
- Adicionar paginação real nas listas grandes.
- Mover validações críticas para backend (conflito de matrícula, regras de voucher, status automáticos).
- Adicionar auditoria de mudanças de status e vendas.

### 8.3 Fase 3 (produção)
- Autenticação/JWT + autorização por perfil.
- Observabilidade, idempotência em vendas/pagamentos, retries seguros.

## 9) Contratos técnicos esperados
- IDs: UUID string.
- Datas:
  - `LocalDate`: `YYYY-MM-DD`
  - `LocalDateTime`: `YYYY-MM-DDTHH:mm:ss`
- Moeda: number decimal (frontend formata em BRL).
- Erros HTTP: retornar payload consistente:
  - `code`, `message`, `details?`, `fieldErrors?`
- Filtros de mês/ano em listagens que já usam período no frontend.
- Para mural semanal (`/grade/mural/[tenantId]`), retornar atividades por unidade e dia da semana, com:
  - `horaInicio`, `horaFim`
  - atividade, sala, professor
  - regras de check-in/capacidade

## 10) Tenant no request
O frontend trabalha com “Unidade ativa”.
Recomendação:
- Endpoint para trocar unidade ativa de sessão/token, ou
- Header explícito por request (`X-Tenant-Id`) + validação de acesso.

Também deve existir endpoint para listar unidades disponíveis ao usuário logado.

## 11) Placeholders de contrato (plano)
Backend deve aceitar/armazenar HTML livre e suportar renderização com placeholders:
- `{{NOME_CLIENTE}}`
- `{{CPF_CLIENTE}}`
- `{{NOME_PLANO}}`
- `{{VALOR_PLANO}}`
- `{{NOME_UNIDADE}}`
- `{{RAZAO_SOCIAL_UNIDADE}}`
- `{{CNPJ_UNIDADE}}`
- `{{DATA_ASSINATURA}}`

## 12) Critério de “integração natural”
Será considerado natural quando:
- Não for necessário reescrever telas para consumir backend.
- Assinaturas da camada de serviço continuarem equivalentes.
- Regras de tenant/unidade/academia estiverem consistentes com `docs/BUSINESS_RULES.md`.
- Fluxos de CRM, venda e plano operarem com os mesmos enums e regras de transição do frontend.
- Financeiro gerencial
  - `listContasPagar`, `createContaPagar`, `updateContaPagar`, `pagarContaPagar`, `cancelarContaPagar`
  - `getDreGerencial` (mensal e intervalo customizado)
  - `tipos de conta` e `recorrência de contas a pagar` funcionando com os mesmos contratos do frontend.

## 13) Contrato REST “reverso” e geração de client
Sim. Existe caminho equivalente ao "Swagger reverso": gerar OpenAPI a partir do backend e, depois, gerar o client TypeScript para o frontend.

### Recomendação oficial para este projeto
1. Fonte de verdade do contrato: `openapi.yaml` versionado no backend.
2. Backend publica contrato em endpoint estável (ex.: `/v3/api-docs`).
3. Frontend gera client tipado em pasta dedicada (ex.: `src/lib/api/generated`).
4. `src/lib/mock/services.ts` migra para adaptador HTTP mantendo assinatura pública atual (para não quebrar telas).

### Ferramentas sugeridas
- Geração de OpenAPI no backend:
  - Spring Boot: `springdoc-openapi`
  - NestJS: `@nestjs/swagger`
- Geração de client no frontend:
  - `orval` (boa DX com React/TS)
  - `@openapitools/openapi-generator-cli` (`typescript-fetch` ou `typescript-axios`)
  - `@hey-api/openapi-ts` (client TS leve)

### Fluxo "reverso" na prática
1. Implementar endpoints no backend com anotações OpenAPI.
2. Exportar spec OpenAPI gerada pelo backend.
3. Gerar client TS no frontend.
4. Adaptar `services.ts` para delegar ao client gerado.
5. Executar testes de regressão de tela sem alterar contratos de uso nas páginas.

### Alternativa TypeScript compartilhado (quando backend também for TS)
- `ts-rest` + `zod` para contrato único e export para OpenAPI.
- Útil quando o objetivo é reduzir divergência de tipos entre back e front.

### Limites e cautelas
- "Reverse from frontend only" (inferir API só do TS atual) tende a ser incompleto.
- O robusto é: backend gera/valida OpenAPI e frontend consome client gerado.
- Manter validação em CI com diff de OpenAPI evita quebra de contrato silenciosa.

## 14) Checklist de integração sem quebra do frontend atual
1. Entregar endpoint de contexto da unidade ativa (tenant atual + unidades disponíveis).
2. Entregar endpoints de `tipos de conta` por tenant e recorrência de contas a pagar.
3. Entregar endpoints do mural da grade por tenant/semana atual.
4. Gerar client TS e conectar no `services.ts` mantendo nomes e retorno atuais.
5. Substituir chamadas mock por HTTP gradualmente por domínio (financeiro -> CRM -> vendas).
6. Validar regras críticas: multiunidade, transição de prospect, recorrência financeira, DRE por grupo.
