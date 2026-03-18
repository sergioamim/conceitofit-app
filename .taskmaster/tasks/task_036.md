# Task ID: 36

**Title:** Adaptar fluxos de emissao e exibicao de NFSe ao novo bloqueio fiscal

**Status:** done

**Dependencies:** 35

**Priority:** high

**Description:** Atualizar os fluxos de pagamentos e consultas de NFSe no frontend para refletir os novos bloqueios e mensagens da reforma tributaria.

**Details:**

A emissao de NFSe por pagamento e as superficies que mostram status fiscal precisam refletir o novo comportamento do backend: emissao bloqueada quando a unidade nao estiver configurada com os campos obrigatorios e mensagens mais especificas de validacao fiscal.

**Test Strategy:**

Cobrir fluxos de emissao individual e lote com mocks de sucesso, validacao fiscal e ambiente sem suporte, validando UX de erro, reload e estados do documento fiscal.

## Subtasks

### 36.1. Mapear superficies impactadas por emissao e consulta de NFSe

**Status:** done  
**Dependencies:** None

Levantar telas e componentes que dependem do status ou da acao de emissao fiscal.

**Details:**

Mapear `src/app/(app)/pagamentos/page.tsx`, `src/app/(app)/pagamentos/emitir-em-lote/page.tsx`, `src/app/(app)/clientes/[id]/page.tsx` e utilitarios relacionados, identificando pontos de erro/sucesso e textos que precisam mudar com o novo contrato fiscal.

### 36.2. Atualizar client de pagamentos para novas respostas e erros fiscais

**Status:** done  
**Dependencies:** 36.1

Ajustar o adapter de emissao de NFSe por pagamento para o novo comportamento do backend.

**Details:**

Revisar `src/lib/api/pagamentos.ts` para tratar corretamente erros de validacao fiscal, mensagens de configuracao incompleta e possiveis mudancas de payload/status code sem mascarar falhas reais como 'backend nao expoe'.

### 36.3. Ajustar UX de emissao individual e em lote

**Status:** done  
**Dependencies:** 36.2

Refletir o novo bloqueio fiscal nas telas operacionais de pagamentos.

**Details:**

Atualizar CTAs, toasts, modais e mensagens nas telas de pagamentos para orientar o operador quando a configuracao fiscal da unidade estiver incompleta ou quando a emissao falhar por falta dos novos campos obrigatorios.

### 36.4. Revisar exibição de status fiscal em cliente e recebimentos

**Status:** done  
**Dependencies:** 36.3

Garantir consistencia de exibição de NFSe emitida, pendente e bloqueada.

**Details:**

Alinhar badges, labels, filtros e textos nas telas que listam pagamentos/NFSe para diferenciar pendencia operacional de bloqueio por configuracao tributaria, sem inferencias frágeis no cliente.

### 36.5. Cobrir fluxos operacionais de NFSe com testes do frontend

**Status:** done  
**Dependencies:** 36.4

Fechar cobertura dos cenarios de emissao e falha fiscal no frontend.

**Details:**

Adicionar testes para emissao individual/em lote, mensagem de erro por configuracao fiscal pendente e manutencao do estado exibido apos resposta do backend.
