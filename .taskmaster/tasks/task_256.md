# Task ID: 256

**Title:** Quebrar god hook use-cliente-workspace.ts (777 LOC)

**Status:** done

**Dependencies:** 251 ✓

**Priority:** medium

**Description:** Workspace do perfil de cliente (/clientes/[id]) concentra 777 LOC com estado, fetching, handlers de exclusão, migração, suspensão, cartões, etc.

**Details:**

Extrair hooks por responsabilidade: useClienteData, useClienteExclusao, useClienteMigracao, useClienteSuspensao, useClienteCartoes. O workspace compõe os hooks extraídos.

**Test Strategy:**

Perfil do cliente funciona identicamente. Hooks extraídos testáveis.
