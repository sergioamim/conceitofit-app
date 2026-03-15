# Task ID: 13

**Title:** Migrar recebimentos auxiliares, ajustes e importações financeiras para API real

**Status:** done

**Dependencies:** 1 ✓, 7 ✓, 10 ✓

**Priority:** high

**Description:** Substituir helpers locais de recebimentos/ajustes/importações por contratos reais do backend e alinhar as telas financeiras ao fluxo canônico.

**Details:**

Cobrir createRecebimentoAvulso, importarPagamentosEmLote, ajustarPagamento e quaisquer variações experimentais de contas a receber/pagamentos; alinhar páginas de recebimentos, pagamentos e importações financeiras ao backend; explicitar gaps de contrato que ainda impedem a remoção total do código local.

**Test Strategy:**

No test strategy provided.

## Subtasks

### 13.1. Inventariar helpers locais de recebimentos e ajustes

**Status:** done  
**Dependencies:** None  

Mapear funções locais ligadas a recebimentos auxiliares, ajustes e importações financeiras.

**Details:**

Revisar /src/lib/mock/services.ts e as telas financeiras para localizar createRecebimentoAvulso, importarPagamentosEmLote, ajustarPagamento e fluxos experimentais ainda sem contrato real consolidado.

### 13.2. Alinhar contratos reais de contas a receber e pagamentos

**Status:** done  
**Dependencies:** None  

Conectar os fluxos financeiros auxiliares aos endpoints reais já existentes.

**Details:**

Revisar /src/lib/api/contas-receber.ts, /src/lib/api/pagamentos.ts e a OpenAPI para mapear o que já pode substituir código local e quais payloads precisam de normalização adicional.

### 13.3. Migrar telas de recebimentos, pagamentos e ajustes

**Status:** done  
**Dependencies:** None  

Refatorar as superfícies financeiras auxiliares para usar API real.

**Details:**

Substituir os caminhos locais das páginas de recebimentos/pagamentos por clients reais, garantindo paginação, totais, filtros e atualização consistente do cache em memória.

### 13.4. Migrar importações e ajustes financeiros em lote

**Status:** done  
**Dependencies:** None  

Concluir a trilha de importação/ajuste de pagamentos sem depender de lógica local.

**Details:**

Usar endpoint real quando existir; se faltar contrato específico para importação em lote ou ajuste operacional, isolar o gap, remover heurísticas locais e preparar prompt técnico para o backend.

### 13.5. Remover caminhos experimentais e duplicados

**Status:** done  
**Dependencies:** None  

Reduzir superfícies paralelas que ainda mantêm comportamento legado no financeiro.

**Details:**

Eliminar ou consolidar variantes experimentais de contas a receber/recebimentos para que a UI passe a operar em um único fluxo suportado por backend real.

### 13.6. Validar cenários e registrar gaps restantes do backend

**Status:** done  
**Dependencies:** None  

Fechar a migração com checklist de validação e pendências objetivas.

**Details:**

Executar build/tipagem, revisar fluxos principais e produzir handoff para qualquer endpoint ainda faltante no backend antes da remoção final do legado.
