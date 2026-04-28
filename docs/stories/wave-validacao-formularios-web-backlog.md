# Backlog Executavel - Validacao de Formularios Web

## Objetivo

Transformar a wave de validacao do web em stories executaveis por modulo, com foco em:

- feedback inline antes do submit;
- reaproveitamento de schemas/helpers;
- eliminacao de `window.alert`, `window.confirm` e `window.prompt` nos fluxos cobertos;
- alinhamento estrito com o backend canonico.

Story guarda-chuva relacionada:

- [wave-validacao-formularios-sistema.md](./wave-validacao-formularios-sistema.md)

## Repo consumidor

- consumidor principal: `academia-app`
- dono da semantica: `academia-java`

## Recorte executivo imediato

- [WFV-001 - Form foundation: field errors, resolver padrao e guardrail anti-primitives nativas](./WFV-001-form-foundation-guardrails.md)
- [WFV-002 - Mapear erro canonico do backend para campo/toast/modal no web](./WFV-002-backend-error-mapping.md)
- [WFV-401A - Backoffice rede: academias, unidades e onboarding](./WFV-401A-backoffice-rede.md)
- [WFV-201A - Catalogo comercial: planos, servicos, produtos e convenios](./WFV-201A-catalogo-comercial.md)

## Stories por wave

### Wave A - Foundation de UX e schema

| ID | Story | Owner | Effort | Status | Depende de |
|---|---|---|---|---|---|
| [WFV-001](./WFV-001-form-foundation-guardrails.md) | Form foundation: field errors, resolver padrao e guardrail anti-primitives nativas | frontend | M | Draft | - |
| [WFV-002](./WFV-002-backend-error-mapping.md) | Mapear erro canonico do backend para campo/toast/modal no web | frontend | S | Draft | WFV-001 |

### Wave B - Identidade pessoal critica

| ID | Story | Owner | Effort | Status | Depende de |
|---|---|---|---|---|---|
| WFV-101 | Cliente novo, editar cliente e prospect com schema unificado | frontend | L | Draft | WFV-001, WFV-002, VF-101 |
| WFV-102 | Adesao publica, perfil do aluno web e conversoes comerciais | frontend | L | Draft | WFV-101, VF-102 |
| WFV-103 | Funcionario e visitante com feedback inline e sem fallback fake | frontend | M | Draft | WFV-001, WFV-002, VF-103 |

### Wave C - Catalogos e administrativo operacional

| ID | Story | Owner | Effort | Status | Depende de |
|---|---|---|---|---|---|
| WFV-201 | Plano, produto, servico, convenio e cargo com schemas padronizados | frontend | M | Draft | WFV-001, WFV-002, VF-201 |
| [WFV-201A](./WFV-201A-catalogo-comercial.md) | Recorte executivo: planos, servicos, produtos e convenios | frontend | M | Draft | WFV-001, WFV-002, VF-201A |
| WFV-202 | Atividade, sala, exercicio, treinos e formularios administrativos correlatos | frontend | L | Draft | WFV-201, VF-202 |

### Wave D - Financeiro e caixa

| ID | Story | Owner | Effort | Status | Depende de |
|---|---|---|---|---|---|
| WFV-301 | Conta a pagar/receber, receber pagamento e justificativas financeiras | frontend | M | Draft | WFV-001, WFV-002, VF-301 |
| WFV-302 | Caixa, cobrancas, cancelamentos e acoes destrutivas com modal do sistema | frontend | L | Draft | WFV-301, VF-302 |

### Wave E - Backoffice, CRM e utilitarios globais

| ID | Story | Owner | Effort | Status | Depende de |
|---|---|---|---|---|---|
| WFV-401 | Onboarding, WhatsApp, gateways, configuracoes e notificacoes globais | frontend | L | Draft | WFV-001, WFV-002, VF-401 |
| [WFV-401A](./WFV-401A-backoffice-rede.md) | Recorte executivo: academias, unidades e onboarding | frontend | M | Draft | WFV-001, WFV-002, VF-401A |
| WFV-402 | Sweep final em `crud-modal`, formularios genericos e remocao residual de primitives nativas | frontend/qa | M | Draft | WFV-101, WFV-102, WFV-103, WFV-201, WFV-202, WFV-301, WFV-302, WFV-401 |

## Detalhamento das stories

### WFV-001 - Form foundation: field errors, resolver padrao e guardrail anti-primitives nativas

**Objetivo**
- consolidar padroes minimos de formulario no web: validacao de campo, exibicao de erro, modo de validacao apropriado e politica de UX sem primitives nativas.

**Acceptance Criteria**
- existe foundation reutilizavel para formularios cobertos;
- helper/guia deixa explicito quando usar erro inline, toast, modal e sheet;
- search nos arquivos tocados nao encontra `window.alert`, `window.confirm` ou `window.prompt`.

### WFV-002 - Mapear erro canonico do backend para campo/toast/modal no web

**Objetivo**
- garantir que o erro vindo do backend nao morra como mensagem generica.

**Acceptance Criteria**
- erros de validacao de campo voltam ao campo quando houver correspondencia clara;
- erros operacionais destrutivos continuam em modal/toast consistente;
- adapter de erro evita drift entre paginas.

### WFV-101 - Cliente novo, editar cliente e prospect com schema unificado

**Objetivo**
- eliminar divergencia entre wizard, edicao e prospect.

**Acceptance Criteria**
- nome, nascimento, telefone, CPF e passaporte usam helper comum;
- data futura e valor fake sao bloqueados antes do submit;
- o wizard nao injeta `dataNascimento` sintetica.

### WFV-102 - Adesao publica, perfil do aluno web e conversoes comerciais

**Objetivo**
- reaplicar a policy de identidade pessoal nas jornadas publicas e no self-service web.

**Acceptance Criteria**
- trial/cadastro/checkout/perfil nao divergem em regra basica;
- validacoes locais aparecem no campo;
- erros de backend continuam mapeados de forma compreensivel.

### WFV-103 - Funcionario e visitante com feedback inline e sem fallback fake

**Objetivo**
- cobrir os formularios administrativos de identidade fora do aluno.

**Acceptance Criteria**
- campos pessoais criticos seguem o mesmo padrao de erro;
- formularios equivalentes reaproveitam schema/helper;
- nao ha alerta nativo para erro/sucesso nesses fluxos.

### WFV-201 - Plano, produto, servico, convenio e cargo com schemas padronizados

**Objetivo**
- padronizar catalogos e remover drift de validacao repetitiva.

**Acceptance Criteria**
- obrigatoriedade, limites e campos numericos ficam centralizados;
- submit nao aceita payload com caracteres indevidos nos campos sensiveis;
- mensagens de erro ficam consistentes.

### WFV-202 - Atividade, sala, exercicio, treinos e formularios administrativos correlatos

**Objetivo**
- cobrir formularios administrativos que hoje espalham regra em modals diversos.

**Acceptance Criteria**
- duracao, capacidade, nomes e campos especificos validam antes do submit;
- modal/formulario usa feedback inline apropriado;
- acoes auxiliares nao usam primitive nativa.

### WFV-301 - Conta a pagar/receber, receber pagamento e justificativas financeiras

**Objetivo**
- elevar a confianca dos formularios financeiros antes de tocar estado sensivel.

**Acceptance Criteria**
- valores, datas e justificativas invalidas sao apontados no campo;
- submit nao depende so do erro do backend para caso obvio;
- componentes financeiros compartilham schema/helper quando cabivel.

### WFV-302 - Caixa, cobrancas, cancelamentos e acoes destrutivas com modal do sistema

**Objetivo**
- fechar os fluxos destrutivos/operacionais com UX padronizada.

**Acceptance Criteria**
- confirmacoes usam modal do sistema;
- feedback de sucesso/erro usa toast/modal coerente;
- nenhum fluxo coberto recai em `alert/confirm/prompt`.

### WFV-401 - Onboarding, WhatsApp, gateways, configuracoes e notificacoes globais

**Objetivo**
- aplicar a mesma governanca nos formularios densos de backoffice global.

**Acceptance Criteria**
- campos de credencial, URL, nome e contato recebem validacao adequada;
- formularios globais mostram erro antes do submit quando a regra for local;
- feedback operacional segue o design system.

### WFV-402 - Sweep final em `crud-modal`, formularios genericos e remocao residual de primitives nativas

**Objetivo**
- fechar o programa removendo divergencias estruturais.

**Acceptance Criteria**
- componentes genericos refletem o padrao novo;
- sobra residual de primitive nativa fica explicitamente justificada ou removida;
- existe checklist de regressao para novos formularios.

## Ordem recomendada de execucao

1. `WFV-001`
2. `WFV-002`
3. `WFV-101`, `WFV-103`
4. `WFV-102`
5. `WFV-201`, `WFV-202`
6. `WFV-301`, `WFV-302`
7. `WFV-401`
8. `WFV-402`

## Regra de QA obrigatoria

Cada story do web deve sair com:

- teste unit/schema do caso invalido principal;
- teste de componente para mensagem inline ou modal/toast quando aplicavel;
- ausencia de `window.alert`, `window.confirm` e `window.prompt` nos arquivos tocados;
- alinhamento com a story backend correspondente quando houver mudanca de contrato de validacao.
