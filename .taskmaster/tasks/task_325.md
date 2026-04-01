# Task ID: 325

**Title:** Pagina /status publica com saude do sistema

**Status:** done

**Dependencies:** None

**Priority:** medium

**Description:** Pagina simples que mostra status do frontend, backend e banco de dados.

**Details:**

Server component que chama: (1) /api/health do Next.js (frontend ok), (2) GET /api/v1/health/full do backend (banco, storage). Renderiza cards com status UP/DOWN, latencia e timestamp. Sem autenticacao. Visual minimalista, pode ser acessada por qualquer pessoa. Util para suporte ao cliente.

DEPENDÊNCIA CROSS-REPO: Requer backend task academia-java#373 (health check completo) implementada primeiro.

**Test Strategy:**

Pagina carrega e mostra status. Com backend offline mostra DOWN. Sem auth necessario.
