# Task ID: 101

**Title:** Criar useConfirmDialog com AlertDialog e substituir confirm nativo

**Status:** done

**Dependencies:** None

**Priority:** high

**Description:** Implementar um hook reutilizável de confirmação baseado em AlertDialog do shadcn/ui e eliminar o uso de window.confirm nas páginas administrativas e fluxos indicados.

**Details:**

- Adicionar `src/components/ui/alert-dialog.tsx` seguindo o padrão de `src/components/ui/dialog.tsx` (data-slot, `cn`, `Button`) e o layout do shadcn/ui, exportando `AlertDialog`, `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogCancel` e `AlertDialogAction` com import consistente (`radix-ui` vs `@radix-ui/react-alert-dialog`) já usado no projeto.
- Criar `src/hooks/use-confirm-dialog.tsx` (ou `.ts` se optar por `React.createElement`) com `"use client"`, estado controlado e callback em `useRef` para armazenar `onConfirm` sem re-render extra. A API deve expor `{ confirm, ConfirmDialog }`, onde `confirm(message, onConfirm, options?)` aceita opções para `title`, `confirmLabel`, `variant` (incluindo `destructive`) e mantém defaults estáveis no render inicial (sem `Date.now`, `Math.random` ou dependência de `window`).
- `ConfirmDialog` deve renderizar o `AlertDialog` com título/mensagem configuráveis, botão de cancelar padrão e botão de confirmação usando `Button` com variante customizável; se `onConfirm` for async, tratar estado de loading e fechar apenas após resolução.
- Substituir os `confirm()` nativos pelos novos handlers usando o hook e renderizar `<ConfirmDialog />` no JSX da página. Páginas identificadas pelo `rg "confirm"`:
  - `src/app/(app)/administrativo/salas/page.tsx`
  - `src/app/(app)/administrativo/produtos/page.tsx`
  - `src/app/(app)/administrativo/servicos/page.tsx`
  - `src/app/(app)/administrativo/bandeiras/page.tsx`
  - `src/app/(app)/administrativo/convenios/page.tsx`
  - `src/app/(app)/administrativo/formas-pagamento/page.tsx`
  - `src/app/(app)/administrativo/atividades-grade/page.tsx`
  - `src/app/(app)/atividades/page.tsx`
  - `src/app/(app)/prospects/page.tsx`
  - `src/app/(app)/clientes/page.tsx`
  - `src/app/(app)/matriculas/page.tsx`
- Revisar também `src/app/(app)/alunos/page.tsx` e `src/app/(app)/pagamentos/page.tsx` para garantir que qualquer confirmação futura já use o hook, conforme o escopo solicitado.

**Test Strategy:**

- Executar `rg "window\.confirm|confirm\(" src/app` e validar que não há ocorrências após a migração.
- Navegar nas páginas listadas e acionar ações de remoção/cancelamento: o AlertDialog deve abrir com título/mensagem corretos, cancelar não deve executar a ação e confirmar deve disparar o fluxo atual.
- Verificar que o botão de confirmação usa a variante `destructive` nos casos de exclusão e que o foco/teclado (Esc/Enter) funciona sem warnings de hidratação.

## Subtasks

### 101.1. Adicionar componente AlertDialog do shadcn/ui

**Status:** pending  
**Dependencies:** None  

Criar o wrapper de AlertDialog seguindo o padrão atual de UI.

**Details:**

Implementar `src/components/ui/alert-dialog.tsx` baseado em `src/components/ui/dialog.tsx`, usando `cn`, `Button`, data-slot e imports Radix no padrão do projeto.

### 101.2. Implementar hook `useConfirmDialog` reutilizável

**Status:** pending  
**Dependencies:** 101.1  

Criar o hook de confirmação com estado controlado e API estável.

**Details:**

Adicionar `src/hooks/use-confirm-dialog.tsx` com `"use client"`, `confirm(message, onConfirm, options?)`, `ConfirmDialog` renderizando `AlertDialog`, `useRef` para callback e tratamento de async/loading sem valores dinâmicos no render inicial.

### 101.3. Migrar confirmações nas páginas administrativas

**Status:** pending  
**Dependencies:** 101.2  

Substituir `confirm()` nas telas administrativas listadas.

**Details:**

Atualizar `src/app/(app)/administrativo/{salas,produtos,servicos,bandeiras,convenios,formas-pagamento,atividades-grade}/page.tsx` para usar o hook e renderizar `<ConfirmDialog />` no JSX.

### 101.4. Migrar confirmações nas páginas operacionais

**Status:** pending  
**Dependencies:** 101.2  

Substituir confirmações nativas nas telas principais indicadas.

**Details:**

Atualizar `src/app/(app)/{atividades,prospects,clientes,matriculas}/page.tsx` para usar `confirm` do hook e adicionar `<ConfirmDialog />` no JSX.

### 101.5. Revisar alunos/pagamentos e auditar uso de confirm

**Status:** pending  
**Dependencies:** 101.3, 101.4  

Garantir que não existam confirmações nativas remanescentes.

**Details:**

Revisar `src/app/(app)/alunos/page.tsx` e `src/app/(app)/pagamentos/page.tsx` para garantir padrão do hook; rodar busca final por `confirm()`/`window.confirm` e alinhar quaisquer ocorrências.
