# Task ID: 181

**Title:** Extrair status helpers para lib/domain eliminando magic strings

**Status:** done

**Dependencies:** None

**Priority:** medium

**Description:** 196 ocorrências de status === 'PENDENTE' e similares espalhadas em 55 arquivos. Frágil e propenso a erros.

**Details:**

Criar src/lib/domain/status-helpers.ts com funções: isPagamentoPendente(p), isPagamentoPago(p), isAlunoAtivo(a), isMatriculaAtiva(m), isProspectConvertido(p), etc. Cada helper recebe o objeto ou status string e retorna boolean. Substituir as comparações diretas mais comuns (PENDENTE, PAGO, ATIVO, VENCIDO) — começar pelos 25 usos de PENDENTE. Exportar também conjuntos: STATUS_PENDENTES = ['PENDENTE', 'VENCIDO'].

**Test Strategy:**

Testes unitários para cada helper. grep direto por status strings mais comuns mostra redução significativa.
