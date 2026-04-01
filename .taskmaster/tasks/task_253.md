# Task ID: 253

**Title:** Migrar /prospects para TanStack Query

**Status:** done

**Dependencies:** 225 ✓

**Priority:** high

**Description:** Prospects usa useState para listagem e mutations manuais. Migrar para useQuery/useMutation.

**Details:**

Criar useProspects() e useUpdateProspect()/useCreateProspect() hooks com TanStack Query. Query key: ["prospects", tenantId, filters]. Invalidar cache em create/update/status change.

**Test Strategy:**

Listagem com cache. Criar prospect invalida lista. Mudar status invalida corretamente.
