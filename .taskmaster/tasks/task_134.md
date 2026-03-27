# Task ID: 134

**Title:** Backoffice: feature flags operacional por academia

**Status:** done

**Dependencies:** None

**Priority:** low

**Description:** Expandir o catálogo de funcionalidades existente (/admin/seguranca/funcionalidades) com toggles operacionais por academia: ativar/desativar features específicas para cada academia, com override global e propagação para unidades.

**Details:**

Atualizar src/app/(backoffice)/admin/seguranca/funcionalidades/page.tsx ou criar sub-página /admin/configuracoes/feature-flags/page.tsx com: (1) Tabela matriz: features (linhas) x academias (colunas) com toggles; (2) Override global: ativar/desativar feature para todas as academias; (3) Override por academia: toggle individual; (4) Indicador visual de propagação (academia → unidades). Criar endpoints toggleFeatureForAcademia, getFeatureFlagsMatrix em src/lib/api/admin-config.ts. Adicionar tipo FeatureFlagMatrix em types.ts.

**Test Strategy:**

Ativar feature para uma academia e verificar que propaga para suas unidades. Desativar globalmente e confirmar que todas desligam.

## Subtasks

### 134.1. Criar tipos e API client para feature flags

**Status:** done  
**Dependencies:** None  

FeatureFlagMatrix em types.ts e endpoints em admin-config.ts

### 134.2. Criar página/matriz de feature flags por academia

**Status:** done  
**Dependencies:** 134.1  

Tabela com toggles por academia, override global e indicador de propagação
