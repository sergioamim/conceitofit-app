# Task ID: 38

**Title:** Fechar adaptação do frontend ao novo contrato da API de atividades

**Status:** done

**Dependencies:** 1

**Priority:** high

**Description:** Concluir o alinhamento do frontend para a evolução recente da API de atividades, eliminando gaps de request, response e telas dependentes.

**Details:**

Hoje a UI já expõe campos e comportamentos novos de atividades, mas a camada HTTP ainda não envia nem normaliza todo o contrato novo. Esta task fecha o fluxo ponta a ponta para atividades e superfícies consumidoras, evitando fallbacks frágeis e divergência entre o que o usuário edita e o que o backend realmente persiste.

**Test Strategy:**

Cobrir adapter e rotas consumidoras com testes unitários e de integração, validando create, update, listagem e consumo dos campos novos de atividade sem depender de fallback local.

## Subtasks

### 38.1. Mapear contrato novo de atividades e superfícies impactadas

**Status:** done  
**Dependencies:** None

Confirmar os campos efetivos da API e inventariar todas as rotas do frontend que dependem do cadastro de atividades.

**Details:**

Revisar `src/lib/api/administrativo.ts`, `src/lib/types.ts` e as telas consumidoras de `listAtividadesApi`, `createAtividadeApi` e `updateAtividadeApi` para consolidar o contrato atualizado e o impacto em `/atividades`, `/administrativo/atividades`, `/administrativo/atividades-grade`, `/grade`, `/reservas` e fluxos de planos.

### 38.2. Ajustar request e normalização da API de atividades

**Status:** done  
**Dependencies:** 38.1

Enviar e ler corretamente os campos evoluídos do contrato de atividades.

**Details:**

Atualizar `AtividadeApiResponse`, `AtividadeUpsertApiRequest`, `buildAtividadeUpsertApiRequest` e `normalizeAtividadeApiResponse` em `src/lib/api/administrativo.ts` para contemplar campos como `permiteCheckin` e `checkinObrigatorio`, reduzindo dependência de fallback local e preservando compatibilidade de rollout quando necessário.

### 38.3. Revisar telas e fluxos dependentes do cadastro de atividades

**Status:** done  
**Dependencies:** 38.2

Garantir consistência visual e funcional nas rotas que consomem atividades após o ajuste do contrato.

**Details:**

Revisar `src/app/(app)/atividades/page.tsx`, `src/app/(app)/administrativo/atividades-grade/page.tsx`, `src/app/(app)/grade/page.tsx`, `src/app/(app)/reservas/page.tsx`, `src/app/(app)/planos/novo/page.tsx` e `src/app/(app)/planos/[id]/editar/page.tsx` para garantir que a UI reflita os dados do backend sem mascarar inconsistências via fallback.

### 38.4. Cobrir contrato e regressão das rotas de atividades com testes

**Status:** done  
**Dependencies:** 38.3

Fechar a trilha de confiança para o novo contrato de atividades no frontend.

**Details:**

Adicionar ou atualizar testes unitários, integração e E2E para o adapter e para os fluxos críticos de atividades, incluindo CRUD, grade, reservas e uso indireto em planos, com evidência de que os campos novos são persistidos e lidos corretamente.
