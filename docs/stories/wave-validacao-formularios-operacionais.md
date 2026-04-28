# Wave - Validacao de Formularios no Web Operacional e Publico

## Objetivo

Aplicar uma camada consistente de validacao no `academia-app` para orientar o usuario, impedir submit evidente de dado ruim e espelhar a politica canonica do backend.

Esta wave nao substitui o backend. O objetivo do web e:

- bloquear erros obvios antes do submit;
- reduzir retrabalho operacional;
- apresentar mensagens claras por campo;
- convergir formularios hoje inconsistentes.

## Repo dono da regra

- dono da semantica: `academia-java`
- consumidor desta story: `academia-app`

## Formularios prioritarios

### Wave A - cliente

1. `NovoClienteWizard`
2. `ClienteEditForm`
3. conversao de prospect para cliente

### Wave B - publico/comercial

4. adesao publica - trial
5. adesao publica - cadastro
6. adesao publica - checkout
7. prospect inline / modal

### Wave C - administrativo

8. funcionario
9. visitante
10. outros formularios de cadastro com identidade pessoal

## Gaps confirmados no frontend

- schemas semelhantes, mas duplicados e com regras diferentes;
- validacao de nome ainda superficial;
- telefone e campos numericos dependem demais da mascara;
- wizard de cliente envia `dataNascimento` fallback artificial quando o campo esta vazio;
- mensagens de erro ainda nao estao padronizadas para create/update.

## Politica de UX a seguir

### Nome

- obrigatorio;
- minimo 3 caracteres uteis;
- deve conter letra;
- rejeitar nome apenas com numeros/simbolos;
- aceitar acentos, espacos, apostrofo e hifen.

### Data de nascimento

- obrigatoria nos fluxos de cadastro de cliente;
- deve ser inferior a hoje;
- nunca preencher automatico para "passar" no submit.

### Campos numericos

- CPF, telefone, CEP e equivalentes:
  - mascarar quando fizer sentido;
  - validar valor saneado;
  - nao deixar letra passar como input final valido.

### CPF

- obrigatorio quando nao houver passaporte nem responsavel;
- validar formato no schema;
- se possivel, espelhar regra de digito verificador antes do submit.

### Passaporte e responsavel

- manter regra condicional ja existente, mas endurecer nome/telefone/email/cpf do responsavel externo.

## Estrategia tecnica recomendada

1. Extrair helpers de validacao reutilizaveis em `src/lib/forms/`.
2. Parar de duplicar regex/rules em cada form.
3. Reaproveitar a mesma policy em:
   - wizard de cliente
   - edicao de cliente
   - prospect converter
   - public signup schemas
   - funcionario schemas
4. Mapear `ProblemDetail` do backend para erro por campo sempre que houver correspondencia clara.

## Formularios alvo na primeira entrega

### Cliente

- [ ] `src/components/shared/novo-cliente-wizard/wizard-types.tsx`
- [ ] `src/components/shared/novo-cliente-wizard/use-cliente-wizard-state.ts`
- [ ] `src/components/shared/cliente-edit-form.tsx`
- [ ] `src/app/(portal)/prospects/[id]/converter/page.tsx`

### Publico

- [ ] `src/lib/forms/public-journey-schemas`
- [ ] `src/app/(public)/adesao/trial/page.tsx`
- [ ] `src/app/(public)/adesao/cadastro/page.tsx`
- [ ] `src/app/(public)/adesao/checkout/page.tsx`

### Administrativo complementar

- [ ] `src/components/administrativo/funcionarios/funcionario-form-page.tsx`
- [ ] `src/app/(portal)/administrativo/visitantes/visitantes-content.tsx`

## Cobertura QA esperada

### Unit

- schemas de cliente:
  - nome invalido
  - data futura
  - telefone com letra
  - CPF obrigatorio condicional
- schemas publicos:
  - nome invalido
  - nascimento invalido
  - documento/telefone invalidos

### E2E

- cadastro operacional bloqueia data futura;
- cadastro operacional bloqueia nome absurdo;
- cadastro operacional nao injeta mais data fake;
- fluxo publico bloqueia os mesmos erros minimos.

## Criticos de aceite

- frontend e backend passam a falar a mesma lingua nos campos criticos;
- nenhum form prioritario envia fallback artificial de nascimento;
- erros de dado ruim aparecem no campo, nao apenas em toast generico;
- formularios equivalentes deixam de divergir em regra basica.

## Riscos

- medio: alguns testes existentes precisarão ser atualizados porque hoje aceitam payload permissivo;
- medio: formularios publicos podem depender de mensagens mais brandas;
- baixo: nao ha impacto arquitetural relevante se a policy for extraida corretamente.

## Follow-up planejado

- segunda wave para auditar formularios nao cobertos por `react-hook-form + zod`;
- catalogar formularios que ainda usam validacao manual/ad hoc e convergir gradualmente;
- avaliar compartilhamento de normalizadores entre app publico e area autenticada.
