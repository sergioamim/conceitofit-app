# Task ID: 191

**Title:** Dividir types.ts (2450 linhas) em módulos por domínio

**Status:** done

**Dependencies:** []

**Priority:** low

**Description:** src/lib/shared/types.ts é mega-arquivo com todos os tipos do projeto. Dividir por domínio para melhor navegação.

**Details:**

Criar: types/aluno.ts, types/plano.ts, types/pagamento.ts, types/matricula.ts, types/prospect.ts, types/tenant.ts, types/venda.ts, types/comum.ts (enums e tipos base). Manter types.ts como barrel re-exportando tudo (backward compatible). Mover cada grupo de tipos para seu arquivo. Não quebrar nenhum import existente.

**Subtasks:**

- [x] Criar estrutura de pastas para tipos
- [x] Mover tipos por domínio para novos arquivos
- [x] Atualizar types.ts para re-exportar tudo

**Test Strategy:**

Build OK. Nenhum import quebrado. types.ts < 100 linhas (apenas re-exports). Cada arquivo de domínio < 400 linhas.
