# Plano de Backend - Usuario Canonico por Rede, Login Multi Identificador e Contexto Multiunidade

## 1. Objetivo

Preparar o backend para tratar `Usuario` como identidade canonica dentro de uma `Rede`, desacoplando autenticacao e autorizacao de `Cliente` e `Funcionario`, sem perder:

- governanca multi-tenant;
- auditoria;
- RBAC;
- compatibilidade com o frontend atual;
- suporte a login por email ou CPF no contexto da rede;
- contexto operacional de unidade ativa no app.

## 2. Diretriz central

A identidade primaria da plataforma deixa de ser global e passa a ser contextual por `Rede`.

Decisoes estruturais:

- `Grupo` nao entra no core de auth na V1;
- `Rede` e a fronteira canonica de identidade;
- `Unidade` continua sendo tenant operacional;
- `Cliente` continua com `tenantId` estrutural;
- unidade ativa do app vira contexto de sessao;
- troca definitiva da unidade-base do cliente deve ocorrer por servico administrativo explicito: `migrarClienteParaUnidade`.

## 3. Modelo conceitual recomendado

### 3.1 Usuario

Entidade principal de identidade dentro de uma rede.

Campos conceituais:

- `id`;
- `rede_id`;
- `kind` = `HUMAN` ou `SERVICE_ACCOUNT`;
- `name`;
- `status`;
- `audit fields`;
- `created_at`;
- `updated_at`.

Diretriz:

- um mesmo email ou CPF pode existir em redes diferentes como usuarios distintos;
- dentro da mesma rede, o identificador deve ser unico.

### 3.2 Identificadores de login

Tabela recomendada: `user_login_identifiers`

Campos conceituais:

- `id`;
- `user_id`;
- `rede_id`;
- `type` = `EMAIL`, `CPF`;
- `value_normalized`;
- `value_display`;
- `verified`;
- `primary_for_admin`;
- `primary_for_app`;
- `created_at`;
- `updated_at`;
- `deleted_at`, se houver soft delete.

Regras:

- unicidade por `(rede_id, type, value_normalized)`;
- normalizacao obrigatoria;
- CPF protegido e mascarado em saidas administrativas quando necessario.

### 3.3 Escopo de acesso

Escopos canonicos:

- `UNIDADE`;
- `REDE`;
- `GLOBAL`.

Interpretacao:

- `UNIDADE`: acesso local a um tenant;
- `REDE`: acesso amplo dentro da rede inteira;
- `GLOBAL`: acesso total de plataforma, excepcional.

Diretriz de modelagem:

- `UserScopeAccess` deve ser tratado como fonte canônica de acesso;
- `UserTenantMembership` pode permanecer como projeção/materialização operacional e compatível onde ainda for necessario;
- a leitura administrativa deve consolidar tudo em resumo canonico por usuario.

### 3.4 Cliente

`Cliente` continua como entidade de dominio/comercial.

Decisoes relevantes:

- manter `tenantId` em `Cliente`;
- `tenantId` representa unidade-base estrutural;
- nao usar esse campo como unidade ativa de sessao;
- elegibilidade em outras unidades da mesma rede vem de contrato e regra comercial.

### 3.5 ClienteContrato

`ClienteContrato` continua sendo a fonte de verdade para:

- status;
- vencimento;
- validade;
- permissao de operacao multiunidade, quando existir;
- unidade ou conjunto de unidades permitidas, conforme o desenho comercial da rede.

### 3.6 Funcionario

Diretriz atual:

- `Funcionario` nasce em um tenant;
- pode ter vinculos adicionais em outros tenants da mesma rede;
- esses vinculos adicionais devem ser materializados de forma explicita, e nao inferidos a partir de permissao.

Se o modelo crescer, a evolucao natural e ter um cadastro principal de funcionario e uma camada de lotacoes por tenant.

### 3.7 Grupo

`Grupo` deve ser modelado como agregacao gerencial de varias redes, com papel inicial de leitura e consolidacao.

Na V1:

- nao usar `Grupo` como chave primaria de autenticacao;
- nao usar `Grupo` como escopo de autorizacao operacional;
- usar `Grupo` apenas em leituras gerenciais, dashboards e visao superior.

## 4. Regras de negocio

### 4.1 Permissao vem de escopo e perfil

Autorizacao continua vindo de:

- escopo;
- perfil;
- grants do perfil;
- politica;
- excecao auditavel.

`Cliente` e `Funcionario` nao sao fonte de autorizacao.

### 4.2 Login nao define unidade ativa

O login resolve a `Rede` e a identidade. A unidade ativa deve ser resolvida depois, na sessao.

### 4.3 tenantId do Cliente nao e tenant ativo da sessao

`Cliente.tenantId` representa unidade-base estrutural.

A unidade ativa da sessao do app e temporaria e deve ser validada contra o contrato e as regras comerciais do cliente.

### 4.4 Mesmo humano pode existir em redes diferentes como usuarios distintos

A plataforma nao deve tentar unificar identidades entre redes diferentes nesta fase.

### 4.5 Grupo e somente leitura gerencial na V1

Usuarios com visao de grupo podem existir, mas por agregacao de leitura, nao por escopo operacional novo.

## 5. Contratos backend recomendados

## 5.1 Auth

### Login

Recomendacao principal:

- manter o login contextual por rede, preferencialmente resolvida por dominio, subdominio ou slug de rota;
- o request HTTP pode permanecer com payload neutro.

Exemplo principal:

```json
{
  "identifier": "12345678901",
  "password": "******",
  "channel": "APP"
}
```

A `Rede` e resolvida pelo contexto da rota ou host.

Fallback tecnico:

```json
{
  "redeIdentifier": "rede-alpha",
  "identifier": "cliente@exemplo.com",
  "password": "******",
  "channel": "APP"
}
```

Observacao:

- `channel` continua util para politicas por canal;
- `channel` nao deve substituir a resolucao da rede;
- `identifier` substitui o acoplamento do contrato a `email`.

### Recuperacao de senha

Recuperacao precisa ocorrer sempre dentro do contexto da rede.

Isso evita colisao quando o mesmo identificador existir em redes diferentes.

### Me / bootstrap

Os contratos de sessao devem evoluir para expor:

- `userId`;
- `redeId`;
- `userKind`;
- `displayName`;
- `activeTenantId`;
- `availableTenants`;
- `availableScopes`;
- `broadAccess`;
- `tenantBaseId` quando relevante para app-cliente;
- identificadores disponiveis por canal, se necessario.

## 5.2 Usuario canonico

Rotas administrativas sugeridas:

- `GET /api/v1/admin/users`
- `POST /api/v1/admin/users`
- `GET /api/v1/admin/users/{userId}`
- `PATCH /api/v1/admin/users/{userId}`

Toda leitura deve ser contextualizada por `redeId`.

## 5.3 Identificadores de login

Rotas sugeridas:

- `GET /api/v1/admin/users/{userId}/login-identifiers`
- `POST /api/v1/admin/users/{userId}/login-identifiers`
- `PATCH /api/v1/admin/users/{userId}/login-identifiers/{identifierId}`
- `DELETE /api/v1/admin/users/{userId}/login-identifiers/{identifierId}`

## 5.4 Vinculos de dominio

Rotas sugeridas:

- `POST /api/v1/admin/users/{userId}/links/clientes`
- `DELETE /api/v1/admin/users/{userId}/links/clientes/{linkId}`
- `POST /api/v1/admin/users/{userId}/links/funcionarios`
- `DELETE /api/v1/admin/users/{userId}/links/funcionarios/{linkId}`

## 5.5 Escopo e seguranca

As rotas de seguranca devem evoluir para expor leitura canônica de escopo:

- `GET /api/v1/admin/seguranca/usuarios`
- `GET /api/v1/admin/seguranca/usuarios/{userId}`

Campos recomendados adicionais:

- `redeId`;
- `userKind`;
- `domainLinksSummary`;
- `scopeType`;
- `broadAccess`;
- `effectiveProfiles`;
- `riskLevel`;
- `reviewStatus`.

## 5.6 Migracao administrativa de cliente entre unidades

Criar servico e contrato administrativo explicito:

- `migrarClienteParaUnidade`

Sugestao de superficie:

- `POST /api/v1/comercial/clientes/{clienteId}/migrar-unidade`

Payload minimo sugerido:

```json
{
  "tenantDestinoId": "uuid",
  "justificativa": "texto",
  "preservarContextoComercial": true
}
```

Esse fluxo deve ser diferente de:

- trocar tenant ativo na sessao;
- autorizar multiunidade por contrato;
- editar o cliente diretamente sem trilha.

## 6. Persistencia e migracao

### 6.1 Estrategia recomendada

Fazer rollout em camadas:

1. introduzir `user_login_identifiers` com unicidade por rede;
2. preservar contratos antigos enquanto coexistirem;
3. publicar leitura canonica agregada de usuario;
4. evoluir login para `identifier` contextual por rede;
5. explicitar unidade ativa de sessao no app;
6. introduzir o servico `migrarClienteParaUnidade`.

### 6.2 Unicidade

Garantir:

- `EMAIL` unico por rede e por valor normalizado;
- `CPF` unico por rede e por valor normalizado;
- restricoes contra duplicidade de vinculos ativos;
- indices apropriados por `rede_id` e `tenant_id` nas novas estruturas.

### 6.3 Soft delete e auditoria

Se houver remocao de identificador ou vinculo, preferir:

- soft delete;
- ou trilha historica obrigatoria.

## 7. Autorizacao e seguranca

### 7.1 Nao inferir permissao por dominio

Nao autorizar:

- por existir `Funcionario`;
- por existir `Cliente`;
- por existir CPF vinculado.

### 7.2 Escopo `GLOBAL` e sensivel

`GLOBAL` deve exigir controles equivalentes ou superiores aos acessos administrativos mais amplos da plataforma.

### 7.3 Rede e o escopo amplo padrao do produto

A maior parte dos acessos amplos do produto deve acontecer em `REDE`, nao em `GLOBAL`.

### 7.4 Service accounts

Se houver automacao real, usar tipo proprio:

- sem UX de login humano;
- com credenciais e rotacao especificas;
- com auditoria separada.

## 8. Auditoria minima obrigatoria

Auditar:

- criacao de usuario;
- alteracao de status;
- inclusao ou remocao de identificador;
- vinculo ou desvinculo com cliente;
- vinculo ou desvinculo com funcionario;
- concessao ou remocao de escopo de rede ou global;
- mudanca de perfil em escopo amplo;
- execucao do fluxo `migrarClienteParaUnidade`;
- tentativas negadas de autenticacao por identificador.

## 9. Riscos de backend

- acoplamento legado entre auth e funcionario;
- acoplamento legado entre app e cliente;
- duplicidade de usuario na migracao de email + CPF se a rede nao entrar na chave;
- confusao entre `tenantId` estrutural do cliente e tenant ativo de sessao;
- exposicao indevida de CPF em respostas administrativas;
- usar `Grupo` cedo demais como escopo de auth;
- misturar conta tecnica com usuario humano.

## 10. Rollout sugerido

1. Formalizar `Usuario` como identidade canônica por rede.
2. Criar `user_login_identifiers` com unicidade por `rede_id`.
3. Evoluir login para `identifier` contextual por rede.
4. Evoluir bootstrap e sessao para carregar unidade ativa.
5. Preservar `Cliente.tenantId` como unidade-base estrutural.
6. Explicitar que multiunidade vem de contrato e regra comercial.
7. Criar `migrarClienteParaUnidade` como operacao administrativa auditavel.
8. Fechar leituras gerenciais por grupo sem acoplar auth ao grupo.

## 11. Criterios de aceite do backend

- backend cria usuario sem cliente e sem funcionario;
- backend aceita autenticacao por email ou CPF dentro de uma rede;
- backend permite o mesmo identificador em redes diferentes sem colisao;
- backend mantem `tenantId` em `Cliente` como unidade-base estrutural;
- backend expõe unidade ativa de sessao sem confundir com `Cliente.tenantId`;
- backend oferece fluxo auditavel `migrarClienteParaUnidade`;
- backend continua usando escopo e perfil como fonte de autorizacao;
- backend expõe leitura canonica de `UNIDADE`, `REDE` e `GLOBAL`.

## 12. Dependencias recomendadas

- alinhar OpenAPI como fonte de verdade;
- alinhar modulo auth com a trilha recente de seguranca global por escopo;
- revisar migracoes, indices e unicidade por rede;
- adicionar testes de integracao para:
  - login por email em rede;
  - login por CPF em rede;
  - mesmo email em redes diferentes;
  - usuario sem vinculo;
  - usuario com vinculo duplo;
  - escopo `REDE` e `GLOBAL`;
  - conflito de identificadores duplicados dentro da mesma rede;
  - `migrarClienteParaUnidade`.
