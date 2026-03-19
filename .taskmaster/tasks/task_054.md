# Task ID: 54

**Title:** Desacoplar a aba NFS-e do perfil do cliente da configuração fiscal global

**Status:** done

**Dependencies:** 12 ✓

**Priority:** medium

**Description:** Remover a dependência de configuracao-atual do carregamento inicial de /clientes/[id] e carregar os dados da aba NFS-e somente sob demanda.

**Details:**

Refatorar src/app/(app)/clientes/[id]/page.tsx para que o perfil do cliente não chame GET /api/v1/administrativo/nfse/configuracao-atual no carregamento inicial. A aba NFS-e deve focar na listagem das NFS-e já emitidas e estados fiscais derivados dos pagamentos do cliente, carregando qualquer dado adicional apenas quando o usuário abrir a aba correspondente. Revisar o contrato consumido, estados de loading/erro da aba e cobertura de regressão para evitar chamadas fiscais desnecessárias e 404 incidentais no perfil.

**Test Strategy:**

No test strategy provided.
