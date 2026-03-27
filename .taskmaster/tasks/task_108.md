# Task ID: 108

**Title:** Convergir domínio de contratos entre matrícula e venda

**Status:** done

**Dependencies:** 106 ✓

**Priority:** high

**Description:** Alinhar terminologia e fluxo funcional para que vendas de plano sejam tratadas como contratos/assinaturas em toda a camada de API, serviços e UI, eliminando discrepâncias entre Matrícula e Venda.

**Details:**

- Mapear `Matricula` e `Venda` em `src/lib/types.ts` e criar um tipo/normalizador `Contrato` (novo módulo `src/lib/comercial/contratos.ts` ou alias em `types.ts`) que represente a contratação de plano, incluindo `contratoStatus`, `dataInicioContrato` e vínculo com `origemVendaId`/`matriculaId`.
- Estender `src/lib/api/matriculas.ts` para aceitar `origemVendaId` (se presente no backend) e criar wrappers `listContratos*`/`createContrato*` em `src/lib/comercial/runtime.ts` que apontem para as APIs de matrícula, mantendo compatibilidade com `listMatriculas*`.
- Reutilizar e/ou unificar os resolvedores de status de contrato em `src/lib/comercial/plano-flow.ts` e `resolveVendaFluxoStatusFromApi` para que contratos vindos de venda e matrícula tenham a mesma regra de `StatusFluxoComercial`.
- Padronizar copy e rótulos: ajustar `src/lib/nav-items.ts`, `src/components/shared/cliente-tabs.tsx`, `src/app/(app)/clientes/[id]/page.tsx`, `src/app/(app)/matriculas/page.tsx`, `src/app/(app)/vendas/page.tsx`, `src/app/(app)/vendas/nova/page.tsx`, `src/components/shared/nova-matricula-modal.tsx` e `src/components/shared/sale-receipt-modal.tsx` para usar “Contrato/Assinatura” em vendas de plano e “Venda” para itens avulsos, mantendo badges com `STATUS_CONTRATO_LABEL` e `STATUS_FLUXO_COMERCIAL_LABEL`.
- Se o modal de contratação for mexido, migrar para `react-hook-form` + `zodResolver` com schema co-localizado e tipos via `z.infer`, evitando validações ad hoc.
- Ao calcular itens/valores de plano, utilizar o motor unificado do Task 106 (`src/lib/comercial/plano-dry-run.ts` ou `plano-flow.ts`) para que venda e contrato compartilhem a mesma regra de cálculo.
- Garantir segurança de hidratação (sem `new Date()`/`Math.random()` no render) nos componentes ajustados.

**Test Strategy:**

- Atualizar testes unitários existentes em `tests/unit/comercial-runtime.spec.ts` e `tests/unit/vendas-api.spec.ts` (ou criar novos) para cobrir os novos helpers de contrato e o mapeamento entre venda/contrato.
- Rodar smoke manual nas rotas `/matriculas`, `/vendas`, `/vendas/nova` e detalhe de cliente (`/clientes/[id]`), validando rótulos “Contrato/Assinatura”, badges e criação de venda de plano com vínculo de contrato.
- Se houver E2E, ajustar/rodar `tests/e2e/app-multiunidade-contrato.spec.ts` para garantir que a terminologia de contrato permanece consistente após as mudanças.

## Subtasks

### 108.1. Modelar Contrato e normalizar Matricula/Venda

**Status:** pending  
**Dependencies:** None  

Criar o tipo/normalizador de Contrato e alinhar dados de matrícula e venda.

**Details:**

Atualizar `src/lib/types.ts` para incluir o tipo/alias `Contrato` com `contratoStatus`, `dataInicioContrato`, `origemVendaId` e `matriculaId`. Criar módulo `src/lib/comercial/contratos.ts` com funções de normalização a partir de `Matricula`/`Venda`. Estender `src/lib/api/matriculas.ts` para aceitar/normalizar `origemVendaId` e expor no `normalizeMatriculaApiResponse`, mantendo compatibilidade com os campos atuais.

### 108.2. Unificar serviços e regras de status comercial

**Status:** pending  
**Dependencies:** 108.1  

Padronizar wrappers de contrato e regra única de status de fluxo.

**Details:**

Adicionar wrappers `listContratos*`/`createContrato*` em `src/lib/comercial/runtime.ts` apontando para as APIs de matrícula, mantendo `listMatriculas*` intacto. Unificar `resolveVendaFluxoStatusFromApi` com `resolveFluxoComercialStatus` em `src/lib/comercial/plano-flow.ts`, garantindo regra única para vendas e matrículas. Alinhar cálculo de itens/valores de plano usando o motor unificado em `plano-flow.ts` (ou módulo novo da task 106) dentro do fluxo de venda/contratação.

### 108.3. Padronizar UI e copy para Contrato/Assinatura

**Status:** pending  
**Dependencies:** 108.1, 108.2  

Trocar rótulos e ajustes de UI para refletir contratos de plano.

**Details:**

Atualizar textos e labels em `src/lib/nav-items.ts`, `src/components/shared/cliente-tabs.tsx`, páginas de `clientes/[id]`, `matriculas`, `vendas`, `vendas/nova`, além de `src/components/shared/nova-matricula-modal.tsx` e `src/components/shared/sale-receipt-modal.tsx` para usar “Contrato/Assinatura” para planos e “Venda” para itens avulsos, mantendo badges `STATUS_CONTRATO_LABEL`/`STATUS_FLUXO_COMERCIAL_LABEL`. Verificar segurança de hidratação nos componentes ajustados (evitar `new Date()`/`Math.random()` no render). Se o modal de contratação for alterado, migrar validação para `react-hook-form` + `zodResolver` com schema co-localizado e `z.infer`.
