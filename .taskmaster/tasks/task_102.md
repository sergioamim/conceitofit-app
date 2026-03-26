# Task ID: 102

**Title:** Criar CrudModal genérico e refatorar modais simples de CRUD

**Status:** done

**Dependencies:** 100 ✓

**Priority:** medium

**Description:** Implementar um componente genérico `CrudModal<T>` para reduzir duplicação de modais de CRUD e migrar os modais simples (sala, bandeira de cartão, forma de pagamento e convênio) para essa nova base, mantendo o comportamento atual e validações essenciais.

**Details:**

Criar `src/components/shared/crud-modal.tsx` com `"use client"` e estrutura base usando `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle` e `DialogFooter` (padrão visto em `src/components/shared/sala-modal.tsx` e `src/components/shared/bandeira-cartao-modal.tsx`). O componente deve receber `open`, `onClose`, `onSave(data, id?)`, `initial`, `title` e `fields: FormFieldConfig[]` (incluir `name`, `label`, `type`, `required`, `options` para select, `placeholder`, `min`/`max` para number) e montar o formulário com `react-hook-form` (`useForm`) e `useEffect` para `reset` quando `initial`/`open` mudarem, replicando o comportamento atual desses modais. Definir `FormFieldConfig` em `src/lib/types.ts` (ou local no `crud-modal.tsx` se preferir escopo local) e exportá-lo para reutilização. Para aderir ao padrão do repositório, incluir validação com `zod`/`zodResolver`: construir um schema mínimo baseado em `fields` (ex.: `requiredTrimmedString` de `src/lib/forms/zod-helpers.ts` para campos obrigatórios) e permitir um override opcional (prop `schema`) para casos que já possuem schema próprio, como `convenioFormSchema` em `src/lib/forms/administrativo-schemas.ts`. Implementar renderização dos tipos: `text`/`number` com `Input` (`src/components/ui/input.tsx`), `textarea` com `Textarea` (`src/components/ui/textarea.tsx`), `select` com `Select`/`SelectItem` (`src/components/ui/select.tsx`) via `Controller`, `checkbox` com `input` simples ou `Checkbox` (`src/components/ui/checkbox.tsx`) mantendo layout semelhante aos modais atuais, e `currency` usando os formatters da task 100 (ex.: util em `src/lib/formatters` quando disponível), garantindo que o valor salvo seja numérico e formatado apenas para exibição. Adicionar suporte opcional a `contentClassName`/`size` para manter diferenças de largura (`sm:max-w-sm` em sala e `sm:max-w-lg` nos demais) e um slot opcional (`children`/`renderAfterFields`) com `FormProvider` para permitir conteúdo adicional; isso é necessário para preservar a nota condicional de `tipo` em `src/components/shared/forma-pagamento-modal.tsx` e o seletor de planos em `src/components/shared/convenio-modal.tsx` usando `useFormContext`/`useWatch`. Refatorar `src/components/shared/sala-modal.tsx`, `src/components/shared/bandeira-cartao-modal.tsx`, `src/components/shared/forma-pagamento-modal.tsx` e `src/components/shared/convenio-modal.tsx` para usarem `CrudModal` e `FormFieldConfig`, mantendo a lógica de transformação de dados (trim, parse de número/currency, campos opcionais) dentro do `onSave` do wrapper e preservando mensagens auxiliares/seleção de planos via slot. Não refatorar `src/components/shared/novo-cliente-wizard.tsx` nem `src/components/planos/plano-form.tsx`. Opcionalmente exportar `CrudModal` em `src/components/shared/modals/index.ts` para uso futuro.

**Test Strategy:**

Validar manualmente os quatro modais refatorados: abrir cada modal em modo criação e edição e confirmar que `initial` preenche os campos e que `reset` ocorre ao reabrir. Conferir validação de obrigatórios (ex.: nome em sala/bandeira/forma/convênio) e mensagens de erro; checar selects (tipo de pagamento) e checkboxes (ativo, emissão automática) persistindo corretamente. Para `forma-pagamento`, verificar que o aviso de recorrente continua aparecendo quando `tipo` é `RECORRENTE`. Para `convênio`, confirmar seleção de planos e persistência em `planoIds`. Para campos `currency`, validar máscara/formatter e conversão para número no `onSave`. Conferir que o layout e tamanhos do `DialogContent` permanecem consistentes com os modais atuais.

## Subtasks

### 102.1. Definir FormFieldConfig e renderer de campos do CrudModal

**Status:** done  
**Dependencies:** None  

Criar o tipo de configuração de campos e o mapeamento de renderização para os inputs suportados.

**Details:**

Adicionar `FormFieldConfig` em `src/lib/types.ts` (ou no próprio `crud-modal.tsx` se preferir escopo local) com `name`, `label`, `type`, `required`, `options`, `placeholder`, `min`, `max`. Implementar um renderer interno que saiba montar `Input`, `Textarea`, `Select` (com `Controller`), `Checkbox` e `currency`, incluindo labels e mensagens de erro, mantendo o layout usado nos modais atuais.

### 102.2. Implementar o componente CrudModal base com react-hook-form + zod

**Status:** done  
**Dependencies:** 102.1  

Criar `CrudModal<T>` com layout padrão de Dialog e integração com react-hook-form e zodResolver.

**Details:**

Criar `src/components/shared/crud-modal.tsx` com `"use client"`, estrutura `Dialog`/`DialogContent`/`DialogHeader`/`DialogTitle`/`DialogFooter`, props `open`, `onClose`, `onSave`, `initial`, `title`, `fields`, `schema`, `contentClassName`/`size`, `children`/`renderAfterFields`. Usar `useForm` + `FormProvider`, `useEffect` para `reset` ao mudar `initial`/`open`, construir schema mínimo via `requiredTrimmedString` quando `schema` não for informado, e ligar `zodResolver`. Integrar o renderer do subtask 1 e opcionalmente exportar em `src/components/shared/modals/index.ts`.

### 102.3. Refatorar SalaModal para usar CrudModal

**Status:** done  
**Dependencies:** 102.2  

Migrar `sala-modal.tsx` para `CrudModal` mantendo comportamento de criação/edição e transformações atuais.

**Details:**

Substituir `useForm` local por `CrudModal`, montar `fields` com `nome`, `descricao`, `capacidadePadrao` e `ativo`, preservar `sm:max-w-sm` via `size`/`contentClassName`. Manter o `onSave` com trim e parse para número e os defaults/validações obrigatórias equivalentes.

### 102.4. Refatorar BandeiraCartaoModal para usar CrudModal

**Status:** done  
**Dependencies:** 102.2  

Migrar `bandeira-cartao-modal.tsx` para `CrudModal` mantendo taxa/dias/ativo e validações.

**Details:**

Montar `fields` com `nome`, `taxaPercentual`, `diasRepasse`, `ativo` e layout similar (grid), usar `sm:max-w-lg`. Preservar `onSave` com trims e parse numérico, além de mensagens de erro de nome.

### 102.5. Refatorar FormaPagamentoModal para usar CrudModal

**Status:** done  
**Dependencies:** 102.2  

Migrar `forma-pagamento-modal.tsx` para `CrudModal` preservando seleção de tipo e texto condicional.

**Details:**

Criar `fields` para `nome`, `tipo`, `taxaPercentual`, `parcelasMax`, `emitirAutomaticamente`, `instrucoes`, `ativo` usando `Select` e checkboxes. Usar `children`/`renderAfterFields` com `useWatch` via `useFormContext` para a nota quando `tipo === "RECORRENTE"`. Manter `onSave` com trims e parse numérico.

### 102.6. Refatorar ConvenioModal para usar CrudModal

**Status:** done  
**Dependencies:** 102.2  

Migrar `convenio-modal.tsx` para `CrudModal` preservando schema e seleção de planos.

**Details:**

Usar `CrudModal` com `schema={convenioFormSchema}` e `fields` para `nome`, `descontoPercentual`, `ativo`, `observacoes`. Manter seletor de planos dentro do slot usando `useFormContext`/`useWatch` para `planoIds`, preservando `togglePlano`. Garantir `onSave` com trims e parse numérico e `sm:max-w-lg`.
