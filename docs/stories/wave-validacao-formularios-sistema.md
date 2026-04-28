# Wave - Validacao de Todos os Formularios do Sistema Web

## Objetivo

Planejar a convergencia de **todos os formularios do sistema web** para uma politica unica de validacao, alinhada ao backend canonico.

Backlog executavel desta wave:

- [wave-validacao-formularios-web-backlog.md](./wave-validacao-formularios-web-backlog.md)

Esta wave cobre:

- area operacional autenticada
- backoffice global
- jornada publica
- area do aluno no web

## Repo dono da regra

- dono da semantica: `academia-java`
- consumidor principal desta wave: `academia-app`

## Principios QA para o web

1. O frontend bloqueia erro obvio antes do submit.
2. O frontend nao injeta dado fake para satisfazer regra ausente.
3. Formularios equivalentes devem reaproveitar helpers/schemas.
4. Erro do backend deve voltar para o campo quando houver correspondencia clara.
5. Validacoes devem aparecer no campo antes do submit sempre que a regra puder ser avaliada localmente.
6. `window.alert`, `window.confirm`, `window.prompt` e notificacoes default do browser sao anti-padrao para fluxos do produto.
7. Prioridade e por risco de persistencia ruim, nao por conveniencia visual.

## Inventario de formularios do sistema web

### 1. Auth / acesso / sessao

- `src/components/auth/admin-login-flow.tsx`
- `src/components/auth/forced-password-change-flow.tsx`
- `src/components/auth/network-access-flow.tsx`
- `src/components/layout/command-palette.tsx`

### 2. Clientes / comercial / vendas

- `src/components/shared/novo-cliente-wizard/use-cliente-wizard-state.ts`
- `src/components/shared/novo-cliente-wizard/wizard-types.tsx`
- `src/components/shared/cliente-edit-form.tsx`
- `src/components/shared/prospect-modal.tsx`
- `src/app/(portal)/prospects/[id]/converter/page.tsx`
- `src/app/(portal)/vendas/nova/components/prospect-inline-form.tsx`
- `src/app/(portal)/vendas/nova/components/prospect-inline-form.schema.ts`
- `src/app/(portal)/vendas/nova/components/payment-panel.tsx`
- `src/components/shared/vincular-agregador-modal.tsx`
- `src/components/shared/vincular-agregador-modal.schema.ts`
- `src/app/(portal)/clientes/components/clientes-advanced-filters-sheet.tsx`

### 3. Perfil e area do aluno no web

- `src/app/(cliente)/meu-perfil/editar/page.tsx`
- `src/app/(cliente)/meu-perfil/senha/page.tsx`
- `src/app/(cliente)/indicar/components/indicar-content.tsx`

### 4. Jornada publica

- `src/app/(public)/adesao/trial/page.tsx`
- `src/app/(public)/adesao/cadastro/page.tsx`
- `src/app/(public)/adesao/checkout/page.tsx`
- `src/app/(public)/b2b/demo/demo-form.tsx`
- `src/app/(public)/b2b/lead-form.tsx`
- `src/app/(public)/storefront/experimental/experimental-form.tsx`
- `src/lib/forms/public-journey-schemas.ts`
- `src/lib/public/demo-account-schema.ts`
- `src/lib/public/lead-b2b-schema.ts`

### 5. Administrativo operacional

- `src/components/administrativo/funcionarios/funcionario-form-page.tsx`
- `src/components/shared/cargo-modal.tsx`
- `src/components/shared/atividade-modal.tsx`
- `src/components/shared/convenio-modal.tsx`
- `src/components/shared/produto-modal.tsx`
- `src/components/shared/servico-modal.tsx`
- `src/components/planos/plano-form.tsx`
- `src/components/planos/plano-form-schema.ts`
- `src/app/(portal)/administrativo/visitantes/visitantes-content.tsx`
- `src/app/(portal)/administrativo/academia/storefront/storefront-content.tsx`
- `src/app/(portal)/administrativo/billing/billing-config-content.tsx`
- `src/app/(portal)/administrativo/billing-config/page.tsx`
- `src/lib/tenant/forms/administrativo-schemas.ts`

### 6. Financeiro / caixa / cobrancas

- `src/app/(portal)/caixa/components/abrir-caixa-form.tsx`
- `src/app/(portal)/caixa/components/fechar-caixa-modal.tsx`
- `src/app/(portal)/caixa/components/sangria-modal.tsx`
- `src/app/(portal)/caixa/lib/caixa-schemas.ts`
- `src/components/shared/nova-conta-pagar-modal/nova-conta-pagar-modal.tsx`
- `src/components/shared/nova-conta-pagar-modal/conta-pagar-schema.ts`
- `src/components/shared/editar-conta-pagar-modal.tsx`
- `src/components/shared/pagar-conta-modal.tsx`
- `src/components/shared/receber-pagamento-modal.tsx`
- `src/components/shared/novo-cartao-modal.tsx`
- `src/components/shared/novo-voucher-modal.tsx`
- `src/components/shared/editar-voucher-modal.tsx`
- `src/app/(portal)/clientes/[id]/cliente-credito-dias-modal.schema.ts`
- `src/app/(portal)/clientes/[id]/cliente-editar-contrato-modal.tsx`
- `src/app/(portal)/clientes/[id]/cliente-emitir-credito-dias-modal.tsx`
- `src/app/(portal)/clientes/[id]/cliente-estornar-credito-dias-modal.tsx`

### 7. CRM / atendimento / retencao / notificacao

- `src/components/atendimento/message-input.tsx`
- `src/lib/forms/atendimento-schemas.ts`
- `src/app/(portal)/crm/cadencias/cadencia-editor-drawer.tsx`
- `src/app/(portal)/crm/cadencias/escalation-rule-editor-modal.tsx`
- `src/app/(portal)/crm/tarefas/page.tsx`
- `src/app/(portal)/retencao/nps/campanhas/campanhas-content.tsx`
- `src/app/(portal)/comercial/fidelizacao/fidelizacao-content.tsx`
- `src/app/(backoffice)/admin/notificacoes/emitir/emitir-content.tsx`

### 8. Backoffice global / plataforma

- `src/app/(backoffice)/admin/configuracoes/components/settings-content.tsx`
- `src/app/(backoffice)/admin/onboarding/provisionar/page.tsx`
- `src/app/(backoffice)/admin/entrar-como-academia/components/entrar-content.tsx`
- `src/components/admin/whatsapp-credential-form.tsx`
- `src/app/(backoffice)/admin/whatsapp/whatsapp-provider-config.tsx`
- `src/app/(backoffice)/admin/whatsapp/components/whatsapp-content.tsx`
- `src/components/admin/agregadores/agregador-config-sheet.tsx`
- `src/lib/forms/admin-config-schemas.ts`
- `src/lib/forms/admin-onboarding-provision-form.ts`
- `src/lib/forms/whatsapp-schemas.ts`
- `src/lib/forms/admin-audit-schemas.ts`

### 9. Backoffice financeiro/plataforma

- `src/app/(backoffice)/admin/financeiro/cobrancas/components/cobrancas-content.tsx`
- `src/app/(backoffice)/admin/financeiro/contratos/components/contratos-content.tsx`
- `src/app/(backoffice)/admin/financeiro/gateways/components/gateways-content.tsx`
- `src/app/(backoffice)/admin/financeiro/planos/components/planos-content.tsx`

### 10. Treinos e catalogos relacionados

- `src/components/shared/exercicio-modal.tsx`
- `src/app/(portal)/treinos/[id]/prescricao/page.tsx`

### 11. Utilitarios/schema genericos que entram na governanca

- `src/components/shared/crud-modal.tsx`
- `src/lib/forms/zod-resolver.ts`
- `src/lib/forms/perfil-aluno-schemas.ts`
- `src/lib/forms/storefront-theme-schema.ts`

## Politica base de validacao para formularios com identidade pessoal

### Campos criticos

- nome
- data de nascimento
- telefone
- CPF
- passaporte
- CEP
- email
- campos equivalentes de responsavel

### Regras base

- `nome`:
  - minimo 3 caracteres uteis
  - deve conter letra
  - rejeitar apenas numeros/simbolos
- `dataNascimento`:
  - quando obrigatoria, deve ser `< hoje`
  - nunca usar fallback artificial
- `telefone`:
  - validar valor saneado, nao apenas mascara
- `cpf`:
  - obrigatorio quando nao houver passaporte/responsavel
  - validar formato e, quando viavel, digito verificador no cliente
- `campos numericos`:
  - nao aceitar letra no valor final valido

## Guardrail de UX obrigatorio

### Proibido

- `window.alert`
- `window.confirm`
- `window.prompt`
- notificacao default do browser para feedback operacional comum

### Obrigatorio

- modal/dialog para confirmacoes destrutivas ou decisorias;
- toast/snackbar para feedback de sucesso/erro nao bloqueante;
- mensagens inline/field-level para erro de validacao;
- sheet ou modal do design system quando o fluxo exigir contexto adicional.

### Regra pratica

Se a mesma acao pode ser explicada no layout do sistema, ela **nao** deve usar primitive nativa do browser.

## Programa de execucao por ondas no web

### Onda A - Identidade pessoal critica

- wizard de cliente
- edicao de cliente
- prospect converter
- adesao publica
- perfil do aluno
- funcionario
- visitante
- remocao de browser alerts/prompts/confirms nesses fluxos

### Onda B - Catalogos e cadastros operacionais

- plano
- produto
- servico
- convenio
- cargo
- atividade
- exercicio

### Onda C - Financeiro e caixa

- conta pagar
- receber pagamento
- cartao
- voucher
- credito dias
- caixa

### Onda D - Backoffice e configuracoes

- onboarding/provisionar
- WhatsApp
- gateways
- configuracoes globais
- notificacoes

### Onda E - Formularios de apoio / genericos

- `crud-modal`
- filtros com schema
- formularios de acao com justificativa

## Gaps confirmados no web

- ha duplicacao de schema para dados pessoais;
- validacao de nome ainda e superficial;
- varios formularios confiam demais na mascara;
- wizard de cliente injeta fallback artificial de nascimento;
- formularios equivalentes ainda divergem em mensagens e criterio de bloqueio.

## Cobertura QA obrigatoria

### Unit

- cada schema critico precisa testar:
  - nome invalido
  - data futura
  - telefone com letra
  - CPF condicional
  - exibicao de erro no campo sem depender do submit final

### E2E

- cliente operacional
- adesao publica
- ao menos um formulario administrativo com identidade pessoal
- confirmacoes e erros usando modal/toast do sistema, nao primitive nativa

### Regressao

- o formulario nao pode enviar dado fake para satisfazer backend;
- o erro do backend precisa aparecer de forma inteligivel.
- os fluxos cobertos nao podem abrir `alert/confirm/prompt` nativos.

## Criticos de aceite

- todos os formularios com identidade pessoal entram no inventario e numa onda de execucao;
- nenhum fluxo prioritario permanece com fallback artificial de dados;
- schemas equivalentes passam a reutilizar policy base;
- validacoes locais relevantes aparecem antes do submit final;
- confirmacoes/erros relevantes usam modal, dialog ou toast do sistema;
- o plano de QA deixa claro o que e unit, o que e E2E e o que depende do backend.

## Riscos

- medio: atualizacao em massa de schemas pode quebrar testes existentes;
- medio: alguns componentes legados nao usam o mesmo padrao de form;
- baixo: inventario e plano podem ser executados gradualmente por onda.

## Follow-up obrigatorio

- abrir stories filhas por onda;
- marcar ownership por dominio;
- alinhar consumidores mobile quando a mesma semantica existir no `app-cliente`.
