# Task ID: 105

**Title:** Criar hook de operações CRUD e refatorar páginas administrativas

**Status:** done

**Dependencies:** 100 ✓, 101 ✓

**Priority:** high

**Description:** Implementar o hook `useCrudOperations` para padronizar carregamento, erros e ações CRUD e migrar as páginas administrativas de salas, produtos, serviços, bandeiras, formas de pagamento, convênios e vouchers para usar esse novo padrão.

**Details:**

Criar o hook em `src/hooks/use-crud-operations.ts` com `"use client"`, expondo `items`, `loading`, `error`, `handleSave`, `handleToggle`, `handleDelete` e `reload`, e aceitar `listFn`, `createFn`, `updateFn`, `toggleFn` e `deleteFn` como callbacks opcionais. Implementar `reload` com `useCallback` e um `useRef` para evitar double-fetch (ignorar chamadas concorrentes e/ou a segunda execução do `useEffect` em Strict Mode), sempre limpando `error`, controlando `loading` e tratando falhas com `normalizeErrorMessage` de `src/lib/utils/api-error.ts`. `handleSave` deve decidir entre `createFn` e `updateFn`, aplicar `try/catch` e disparar `reload` ao final; `handleToggle` e `handleDelete` seguem a mesma abordagem e retornam erro amigável se a operação não estiver configurada. Refatorar as páginas `src/app/(app)/administrativo/salas/page.tsx`, `produtos/page.tsx`, `servicos/page.tsx`, `bandeiras/page.tsx`, `formas-pagamento/page.tsx`, `convenios/page.tsx` e `vouchers/page.tsx` para remover `useEffect`/`load` locais e consumir o hook; manter `modalOpen`/`editing` e mover a lógica de toggle pós-criação/edição para wrappers de `createFn`/`updateFn` quando necessário (ex.: salas/produtos/serviços/forma de pagamento). Para `formas-pagamento` e `convenios`, preservar o gating por `tenantId`/`tenantResolved` usando closures no `listFn` e `handleSave`; em `convenios`, usar `Promise.all` no `listFn` para também atualizar `planos` e retornar a lista de convênios. Para `vouchers`, manter `usageCounts` em estado separado e montar o `listFn` com `Promise.all` para atualizar `usageCounts` e retornar `vouchers`; usar `handleSave` para criação via `NovoVoucherModal` e chamar `reload` após salvar no `EditarVoucherModal`. Em `bandeiras`, substituir o estado de erro local pelo `error` do hook e manter o banner existente; nas demais páginas, decidir se o `error` precisa ser exibido conforme padrão atual, sem alterar a UI sem necessidade.

**Test Strategy:**

Abrir cada página administrativa refatorada e confirmar que a lista carrega apenas uma vez no mount (sem dupla chamada em dev/Strict Mode). Validar criação, edição, toggle e remoção em salas, produtos, serviços, bandeiras, formas de pagamento e convênios, garantindo que `reload` atualiza a tabela após cada ação. Em vouchers, criar e alternar status e verificar se `usageCounts` continua sincronizado; testar abertura/fechamento dos modais e o fluxo de edição com recarregamento. Verificar que erros de API exibem mensagens normalizadas no banner (principalmente em bandeiras) e que botões respeitam estados de `loading`/`tenantResolved` como antes.

## Subtasks

### 105.1. Criar hook genérico useCrudOperations com controle de estado

**Status:** done  
**Dependencies:** None  

Implementar o hook base para padronizar carregamento, erros e ações CRUD.

**Details:**

Adicionar `src/hooks/use-crud-operations.ts` com "use client", tipagem genérica `T extends { id: string }`, estados `items`, `loading`, `error`, `reload` com `useCallback` e `useRef` anti double-fetch, e handlers `handleSave`, `handleToggle`, `handleDelete` usando `normalizeErrorMessage` de `src/lib/utils/api-error.ts` e callback opcional de confirmação.

### 105.2. Refatorar página de salas como piloto do hook

**Status:** done  
**Dependencies:** 105.1  

Migrar `salas/page.tsx` para consumir o hook e validar o padrão.

**Details:**

Substituir `useEffect`/`load` locais por `useCrudOperations`, criar wrappers de `createFn`/`updateFn` para aplicar toggle pós-criação/edição quando necessário, manter `modalOpen`/`editing` e usar `handleDelete` com confirmação.

### 105.3. Migrar páginas de produtos e serviços para o hook

**Status:** done  
**Dependencies:** 105.2  

Aplicar o hook nas telas de produtos e serviços mantendo o comportamento atual.

**Details:**

Refatorar `src/app/(app)/administrativo/produtos/page.tsx` e `src/app/(app)/administrativo/servicos/page.tsx` para usar `useCrudOperations`, manter formatação de moeda, wrappers de toggle pós-criação/edição e confirmação de remoção.

### 105.4. Atualizar bandeiras e formas de pagamento com o hook

**Status:** done  
**Dependencies:** 105.3  

Padronizar as telas de bandeiras e formas de pagamento com o novo hook.

**Details:**

Em `bandeiras/page.tsx`, remover estado local de erro e usar `error` do hook mantendo o banner; em `formas-pagamento/page.tsx`, aplicar closures no `listFn` e `handleSave` respeitando `tenantId`/`tenantResolved` e preservar o botão desabilitado.

### 105.5. Refatorar convênios com carga de planos via hook

**Status:** done  
**Dependencies:** 105.4  

Migrar convênios para o hook mantendo dependência de planos e tenant.

**Details:**

Atualizar `src/app/(app)/administrativo/convenios/page.tsx` para usar `useCrudOperations`, definir `listFn` com `Promise.all` para convênios e planos, atualizar `planos` em estado separado e manter gating por `tenantId`/`tenantResolved`.

### 105.6. Migrar vouchers e revisar fluxo de uso/edição

**Status:** done  
**Dependencies:** 105.5  

Aplicar o hook em vouchers mantendo contagens e modais.

**Details:**

Refatorar `src/app/(app)/administrativo/vouchers/page.tsx` para usar `useCrudOperations` com `listFn` via `Promise.all` atualizando `usageCounts`, usar `handleSave` no `NovoVoucherModal`, chamar `reload` após editar no `EditarVoucherModal` e manter toggle via hook.
