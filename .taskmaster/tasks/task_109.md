# Task ID: 109

**Title:** Migrar validações e transações comerciais para APIs reais

**Status:** pending

**Dependencies:** 106 ✓, 107 ✓, 108

**Priority:** high

**Description:** Substituir as últimas regras mockadas nos fluxos de venda/matrícula por integrações reais de API e ampliar validações assíncronas de CPF/e-mail em cadastros internos e públicos.

**Details:**

- Criar um helper de busca/uniqueness em `src/lib/api/alunos.ts` (ex.: `searchAlunosApi` usando o `search` já suportado por `listAlunosApi`) e expor um serviço em `src/lib/comercial/runtime.ts` (ex.: `checkAlunoDuplicidadeService`) que retorne `{ exists, alunoId? }` para CPF/e-mail, usando `page=0`/`size=1` e tratando `ApiRequestError` com mensagens padronizadas.
- Extrair um hook utilitário de validação assíncrona (ex.: `src/hooks/use-async-field-validation.ts`) que encapsule debounce, cancelamento de requisições antigas via `useRef`, e expose `status`, `message` e `reset`; alinhar o feedback com `FieldAsyncFeedback` (`src/components/shared/field-async-feedback.tsx`).
- Atualizar `src/components/shared/novo-cliente-wizard.tsx` para remover o mock de busca (`listAlunosService` + filtro local) e usar o novo helper de backend para CPF/e-mail, mantendo `react-hook-form` + `zodResolver` e limpando erros com `form.clearErrors` apenas quando o backend confirmar disponibilidade.
- Expandir a validação assíncrona para o fluxo público em `src/app/(public)/adesao/cadastro/page.tsx` (e, se necessário, `src/app/(public)/adesao/checkout/page.tsx`), exibindo `FieldAsyncFeedback` abaixo de CPF/e-mail e bloqueando avanço quando a verificação estiver em `loading` ou `error`.
- Remover o mock de cupom em `src/hooks/use-commercial-flow.ts`: criar uma chamada real de validação (novo método em `src/lib/api/beneficios.ts` ou `src/lib/comercial/runtime.ts`) que retorne percentual/valor e mensagem de elegibilidade; fazer `applyCupom` consumir a resposta real e preencher `voucherCodigo` em `createVendaService`.
- Alinhar os cálculos transacionais com o dry-run centralizado da Task 106: atualizar `use-commercial-flow.ts` e `src/components/shared/nova-matricula-modal.tsx` para usar o resultado do dry-run (subtotal/descontos/total) em vez de cálculo local; garantir que `createVendaService` envie `planoContexto` e `convenioId` conforme o domínio de contratos da Task 108.
- Rever `src/lib/public/services.ts` para usar o mesmo fluxo de contrato/status/calculadora (sem lógica mockada), mantendo `resolveContratoStatusFromPlano` apenas como fallback quando o backend não retornar status explícito.

**Test Strategy:**

- No wizard de cliente (`novo-cliente-wizard`), digitar CPF/e-mail existentes e confirmar feedback “já cadastrado” + bloqueio de submit; digitar novos valores e confirmar status “disponível”.
- Na jornada pública (`/adesao/cadastro`), repetir o mesmo fluxo de CPF/e-mail e garantir que o botão de avançar só habilita quando a validação assíncrona estiver OK.
- Em `/vendas/nova`, aplicar cupom válido e confirmar que o percentual/valor vem do backend; testar cupom inválido e verificar mensagem de erro e total sem desconto.
- Em `/matriculas` (modal de nova matrícula), comparar subtotal/desconto/total com o dry-run e validar que o payload de venda inclui `planoContexto`, `convenioId` e `voucherCodigo` quando aplicável.
- Smoke manual: concluir uma venda e uma matrícula com contrato pendente e validar que o status refletido segue o novo domínio de contrato.

## Subtasks

### 109.1. Criar helper de busca real e hook de validação assíncrona

**Status:** pending  
**Dependencies:** None  

Implementar busca/uniqueness de aluno e padronizar a validação assíncrona de CPF/e-mail.

**Details:**

Adicionar `searchAlunosApi` em `src/lib/api/alunos.ts` usando `listAlunosApi` com `search`, expor `checkAlunoDuplicidadeService` em `src/lib/comercial/runtime.ts` tratando `ApiRequestError`, criar hook `src/hooks/use-async-field-validation.ts` com debounce/cancelamento via `useRef`, e atualizar `src/components/shared/novo-cliente-wizard.tsx` e `src/app/(public)/adesao/cadastro/page.tsx` para usar o hook + `FieldAsyncFeedback`, limpando erros apenas quando o backend confirmar disponibilidade.

### 109.2. Eliminar mocks de cupom e totalizações no fluxo comercial

**Status:** pending  
**Dependencies:** 109.1  

Trocar validações mockadas de cupom e cálculo local por integrações reais e dry-run centralizado.

**Details:**

Criar validação real de cupom em `src/lib/api/beneficios.ts` ou `src/lib/comercial/runtime.ts` e atualizar `src/hooks/use-commercial-flow.ts` para consumir a resposta real e preencher `voucherCodigo` em `createVendaService`; alinhar `use-commercial-flow.ts` e `src/components/shared/nova-matricula-modal.tsx` ao dry-run da Task 106 para subtotal/descontos/total, garantindo envio de `planoContexto` e `convenioId` conforme o domínio de contratos.

### 109.3. Alinhar jornada pública com contratos reais e remover localStorage

**Status:** pending  
**Dependencies:** 109.2  

Atualizar a jornada pública para usar status/contratos reais e eliminar dependência de localStorage.

**Details:**

Revisar `src/lib/public/services.ts` para usar o fluxo real de contrato/status/calculadora, mantendo `resolveContratoStatusFromPlano` como fallback; ajustar `src/lib/public/storage.ts` e `src/lib/public/use-public-journey.ts` para substituir o uso de `localStorage` por estado em memória ou fonte backend compatível com SSR, garantindo consistência nos passos de cadastro/checkout.
