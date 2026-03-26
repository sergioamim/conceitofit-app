# Task ID: 106

**Title:** Unificar regras comerciais de plano/desconto/convênio (dry-run)

**Status:** done

**Dependencies:** None

**Priority:** high

**Description:** Centralizar o cálculo e a prévia (dry-run) de planos, descontos e convênios para que Nova Venda, Wizard de Cliente e Modal de Matrícula usem o mesmo motor e mantenham consistência de valores e contexto comercial.

**Details:**

Criar um módulo único de regras em `src/lib/comercial/plano-dry-run.ts` (ou expandir `src/lib/comercial/plano-flow.ts`) que exponha funções puras para: (1) normalizar parcelas de anuidade conforme `plano.parcelasMaxAnuidade`, (2) filtrar convênios aplicáveis ao plano, (3) gerar itens via `buildPlanoVendaItems`, (4) calcular `subtotal`, `descontos` (manual, percentual/cupom e convênio), `descontoTotal`, `total` e (5) compor um objeto `planoContexto` pronto para o `createVendaService` (planoId, dataInicio, descontoPlano, motivoDesconto, renovacaoAutomatica, convenioId). Em `src/app/(app)/vendas/nova/page.tsx`, substituir `conveniosPlano`, `descontoCupom`, `descontoConvenioPlano`, `descontoTotal` e `total` pelo retorno do dry-run; usar a normalização de parcelas e repassar o percentual do cupom para o helper; no submit, consumir `planoContexto` e `descontoTotal` do helper. Em `src/components/shared/novo-cliente-wizard.tsx`, usar o dry-run no Step 3 para o resumo e no submit para alinhar o desconto enviado com o mesmo cálculo (incluindo matrícula/anuidade quando aplicável), mantendo o schema Zod co-localizado. Em `src/components/shared/nova-matricula-modal.tsx`, trocar o cálculo manual por dry-run, reutilizando filtro de convênios e normalização de parcelas, e usar os valores calculados no payload (`descontoTotal`, `total` e `planoContexto`). Garantir que o módulo seja livre de side-effects e não use `Date` no render; toda data usada deve ser recebida por parâmetro para manter hidratação estável.

**Test Strategy:**

Criar testes unitários para o helper de dry-run cobrindo: plano com matrícula/anuidade, convênio com desconto percentual, desconto manual e percentual combinado, e normalização de parcelas acima do máximo. Validar manualmente: (1) Nova Venda com plano + convênio + cupom atualiza totais e payload corretamente; (2) Wizard de Cliente exibe total coerente e cria matrícula com o desconto esperado; (3) Modal de Matrícula recalcula descontos ao trocar plano/convênio e respeita parcelas máximas; (4) nenhum fluxo quebra a hidratação com datas dinâmicas no render.

## Subtasks

### 106.1. Criar módulo único de dry-run comercial

**Status:** done  
**Dependencies:** None  

Implementar um helper puro para calcular parcelas, convênios, itens e totais de plano.

**Details:**

Criar `src/lib/comercial/plano-dry-run.ts` (ou estender `src/lib/comercial/plano-flow.ts`) reutilizando `buildPlanoVendaItems` e tipos de `src/lib/types.ts`. Expor funções puras para normalizar parcelas pela `parcelasMaxAnuidade`, filtrar convênios aplicáveis, calcular `subtotal`, descontos (manual, percentual/cupom e convênio), `descontoTotal`, `total` e montar `planoContexto` (planoId, dataInicio, descontoPlano, motivoDesconto, renovacaoAutomatica, convenioId). Receber datas por parâmetro e evitar `Date`/side-effects.

### 106.2. Refatorar Nova Venda para consumir dry-run

**Status:** done  
**Dependencies:** 106.1  

Substituir cálculos locais e conveniosPlano por resultados do helper central.

**Details:**

Em `src/app/(app)/vendas/nova/page.tsx` (e, se necessário, `src/hooks/use-commercial-flow.ts`), usar o dry-run para gerar `conveniosPlano`, descontos, `descontoTotal` e `total`. Normalizar parcelas via helper e repassar o percentual do cupom para o cálculo. No submit, usar `planoContexto` e `descontoTotal` vindos do dry-run para manter o payload consistente com o novo motor.

### 106.3. Refatorar NovoClienteWizard usando o dry-run

**Status:** done  
**Dependencies:** 106.1  

Alinhar resumo e submit do Step 3 ao motor único de descontos.

**Details:**

Em `src/components/shared/novo-cliente-wizard.tsx`, aplicar o dry-run no Step 3 para exibir subtotal, descontos e total considerando matrícula/anuidade quando aplicável. No submit, usar `descontoTotal` e `planoContexto` calculados para manter consistência. Manter o schema Zod co-localizado no arquivo e continuar usando `react-hook-form` + `zodResolver`.

### 106.4. Refatorar NovaMatriculaModal para usar dry-run

**Status:** done  
**Dependencies:** 106.1  

Trocar o cálculo manual por resultados do helper central no modal de matrícula.

**Details:**

Em `src/components/shared/nova-matricula-modal.tsx`, substituir o cálculo de convênio, subtotal, descontoTotal e total pelo dry-run. Reutilizar o filtro de convênios e normalização de parcelas do helper, e atualizar o payload para usar `descontoTotal`, `total` e `planoContexto` calculados. Manter o formulário com `react-hook-form` sem efeitos colaterais.
