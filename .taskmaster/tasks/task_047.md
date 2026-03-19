# Task ID: 47

**Title:** Implementar modal de exclusão com justificativa

**Status:** done

**Dependencies:** None

**Priority:** medium

**Description:** Criar o modal de confirmação no detalhe do cliente com campo obrigatório e contador de caracteres.

**Details:**

Em src/app/(app)/clientes/[id]/page.tsx, adicionar estado para open/justificativa/erro/loading e renderizar Dialog com nome do cliente, alerta de irreversibilidade, textarea obrigatório, contador (ex.: `${justificativa.length}/500`), botões Cancelar e Excluir cliente. Botão confirm disabled quando justificativa.trim() vazio. Pseudo-código: const [excluirOpen, setExcluirOpen] = useState(false); disabled = excluindo || !justificativa.trim().

**Test Strategy:**

Teste manual: abrir modal, validar contador, bloqueio de envio sem justificativa e reset ao fechar.
