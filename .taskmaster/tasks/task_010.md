# Task ID: 10

**Title:** Consolidar importacao ETL e onboarding de unidades no backoffice

**Status:** done

**Dependencies:** 1 ✓, 7 ✓, 9 ✓

**Priority:** medium

**Description:** Completar a tela de importacao e integra-la ao fluxo de criacao de unidade com carga inicial padrao ou importacao futura.

**Details:**

Conectar o `EVO BACKUP` e a trilha EVO P0 ao backoffice real, removendo lookups em mock e exibindo status de onboarding/importacao por unidade.

**Test Strategy:**

No test strategy provided.

## Subtasks

### 10.1. Auditar a tela `/admin/importacao-evo-p0` e seus pontos em mock

**Status:** done  
**Dependencies:** None  

Mapear o que ja usa API real e o que ainda depende de dados simulados.

**Details:**

Revisar `src/app/(backoffice)/admin/importacao-evo-p0/page.tsx` e `src/lib/api/importacao-evo.ts`, destacando onde a tela ainda usa `listAcademias`, `listTenantsGlobal` e `setCurrentTenant` em mock para contexto e historico.

### 10.2. Conectar selecao global de academia/unidade e mapeamento de filial

**Status:** done  
**Dependencies:** 10.1  

Usar o cadastro administrativo real como base do mapeamento ETL.

**Details:**

Integrar a tela de importacao ao cadastro real de academias/unidades, permitindo vincular `ID_FILIAL` da origem EVO com a unidade cadastrada no backoffice.

### 10.3. Fechar fluxo real de upload, analise, job e rejeicoes

**Status:** done  
**Dependencies:** 10.1, 10.2  

Consolidar a trilha principal de ETL no backoffice.

**Details:**

Ajustar upload de pacote, consulta de analise, criacao de job, polling, historico, rejeicoes e reprocessamento para operar com contratos reais e estados de erro padronizados.

### 10.4. Adicionar UX de onboarding na criacao de unidade

**Status:** done  
**Dependencies:** 10.2  

Permitir escolher estrategia inicial ao cadastrar a unidade.

**Details:**

Incluir no fluxo de create/edit de unidade opcoes como `carregar dados iniciais`, `importar depois` e `preparar ETL agora`, alinhadas ao backend administrativo.

### 10.5. Exibir status e historico de onboarding/importacao por unidade

**Status:** done  
**Dependencies:** 10.3, 10.4  

Dar visibilidade operacional ao setup das novas unidades.

**Details:**

Adicionar status, badges, timeline ou cards no backoffice para mostrar se a unidade esta pendente de seed, aguardando importacao, em processamento ou pronta.

### 10.6. Validar erros, permissoes e testes da trilha ETL

**Status:** done  
**Dependencies:** 10.3, 10.4, 10.5  

Fechar criterios de qualidade para a area administrativa de importacao.

**Details:**

Revisar acessos, mensagens de erro, estados vazios, progresso de job e testes de navegacao para o backoffice de importacao e onboarding.
