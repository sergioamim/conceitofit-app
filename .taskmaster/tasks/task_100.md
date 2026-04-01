# Task ID: 100

**Title:** Centralizar formatadores de moeda/data/percentual em utilitário compartilhado

**Status:** done

**Dependencies:** None

**Priority:** high

**Description:** Criar um módulo único de formatação em `src/lib/formatters.ts` e substituir as funções locais nas 10 páginas listadas para reduzir duplicação sem alterar o comportamento atual.

**Details:**

Criar `src/lib/formatters.ts` exportando `formatBRL`, `formatCurrency`, `formatDate`, `formatDateTime` e `formatPercent`. Basear `formatCurrency` no padrão já usado em `src/lib/public/services.ts` (usar `toLocaleString("pt-BR", { style: "currency", currency })` com fallback para valores não finitos), e implementar `formatBRL` como wrapper chamando `formatCurrency` com `BRL`. Para `formatPercent`, seguir o padrão de `src/app/(app)/gerencial/bi/page.tsx` (1 casa decimal via `toLocaleString` + sufixo `%`). Para `formatDate`, manter a lógica de `src/app/(app)/pagamentos/page.tsx`/`src/app/(app)/pagamentos/emitir-em-lote/page.tsx` (parse por split `YYYY-MM-DD` com fallback para string original) para evitar mudança de saída. Para `formatDateTime`, replicar o formato de `src/app/(app)/vendas/page.tsx` (dia/mês/ano + hora/minuto). Em seguida, remover as definições locais e importar os utilitários em: `src/app/(app)/planos/page.tsx`, `src/app/(app)/administrativo/produtos/page.tsx`, `src/app/(app)/administrativo/servicos/page.tsx`, `src/app/(app)/pagamentos/page.tsx`, `src/app/(app)/dashboard/page.tsx`, `src/app/(app)/vendas/page.tsx`, `src/app/(app)/vendas/nova/page.tsx`, `src/app/(app)/administrativo/conciliacao-bancaria/page.tsx`, `src/app/(app)/pagamentos/emitir-em-lote/page.tsx`, `src/app/(app)/prospects/[id]/converter/page.tsx`. Garantir que os pontos que já fazem `?? 0` ou `Number(...)` continuem iguais, preservando o comportamento atual de formatação.

**Test Strategy:**

Executar `npm run lint` para garantir que imports e tipagens ficaram corretos. Validar manualmente nas 10 páginas que moedas, datas e horários continuam com o mesmo formato (BRL, dd/mm/aaaa e data/hora), comparando exemplos visíveis antes/depois da mudança.

## Subtasks

### 100.1. Mapear formatadores existentes e padrões de saída

**Status:** done  
**Dependencies:** None  

Levantar as funções locais de moeda/data/percentual e os formatos atuais nas páginas alvo.

**Details:**

Revisar as 10 páginas listadas e os padrões em `src/lib/public/services.ts` e `src/app/(app)/gerencial/bi/page.tsx`, registrando regras de fallback e coerções existentes.

### 100.2. Criar módulo compartilhado `src/lib/formatters.ts`

**Status:** pending  
**Dependencies:** 100.1  

Implementar utilitário centralizado com os cinco formatadores exigidos.

**Details:**

Adicionar `formatCurrency` com fallback para valores não finitos, `formatBRL` como wrapper para BRL, `formatDate` com split `YYYY-MM-DD`, `formatDateTime` com dia/mês/ano e hora/minuto e `formatPercent` com 1 casa decimal + sufixo `%`.

### 100.3. Refatorar páginas comerciais para usar os formatters

**Status:** pending  
**Dependencies:** 100.2  

Substituir formatadores locais em páginas de planos/produtos/serviços/vendas.

**Details:**

Remover funções locais e importar de `src/lib/formatters.ts` em `planos/page.tsx`, `administrativo/produtos/page.tsx`, `administrativo/servicos/page.tsx`, `vendas/page.tsx` e `vendas/nova/page.tsx`, preservando `?? 0` e `Number(...)` existentes.

### 100.4. Refatorar páginas financeiras e de conversão

**Status:** pending  
**Dependencies:** 100.2  

Atualizar páginas financeiras e de prospects para usar utilitário compartilhado.

**Details:**

Aplicar o utilitário em `pagamentos/page.tsx`, `pagamentos/emitir-em-lote/page.tsx`, `dashboard/page.tsx`, `administrativo/conciliacao-bancaria/page.tsx` e `prospects/[id]/converter/page.tsx`, garantindo a mesma formatação atual.

### 100.5. Validar lint e consistência visual dos formatos

**Status:** pending  
**Dependencies:** 100.3, 100.4  

Checar se imports, tipagens e formatos permanecem estáveis após refatoração.

**Details:**

Rodar lint e fazer conferência manual das telas para garantir moedas, datas e percentuais com o mesmo output de antes.
