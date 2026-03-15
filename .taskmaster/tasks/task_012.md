# Task ID: 12

**Title:** Migrar fiscal, agregadores e integrações operacionais para API real

**Status:** done

**Dependencies:** 1 ✓, 7 ✓, 10 ✓

**Priority:** high

**Description:** Concluir a migração backend-only das áreas de NFSe, agregadores e monitoramento operacional, removendo dependências locais restantes.

**Details:**

Cobrir adapters reais para NFSe/configurações/solicitações, agregadores/transações/visitas e integrações operacionais; revisar páginas em src/app/(app)/administrativo/* e src/app/(app)/gerencial/*; remover trechos locais de src/lib/mock/services.ts que ainda existem apenas como fallback histórico. Incluir a identificação dos gaps de backend ainda abertos, especialmente emissão de NFSe por pagamento quando não houver endpoint 1:1 compatível.

**Test Strategy:**

No test strategy provided.

## Subtasks

### 12.1. Auditar contratos reais de NFSe, agregadores e integrações

**Status:** done  
**Dependencies:** None  

Mapear os endpoints já disponíveis no backend e comparar com as telas/serviços que ainda dependem de código local.

**Details:**

Revisar OpenAPI e os consumers em /src/app/(app)/administrativo/*, /src/app/(app)/gerencial/* e /src/lib/mock/services.ts para identificar cobertura real de NFSe, agregadores, visitas, reprocessamentos e integrações operacionais.

### 12.2. Criar ou ajustar clients tipados para fiscal e integrações

**Status:** done  
**Dependencies:** None  

Consolidar adapters em /src/lib/api para NFSe, agregadores e integrações operacionais.

**Details:**

Adicionar ou revisar módulos dedicados em /src/lib/api para configurações de NFSe, solicitações/eventos, agregadores, visitas e integrações operacionais, com normalização de payloads e erros padronizados.

### 12.3. Migrar telas administrativas de NFSe e monitoramento operacional

**Status:** done  
**Dependencies:** None  

Substituir serviços legados das telas fiscais e operacionais por API real.

**Details:**

Refatorar páginas como /administrativo/nfse, /administrativo/integracoes e superfícies correlatas para usar apenas adapters reais, com loading/erro/vazio coerentes e sem fallback local operacional.

### 12.4. Migrar visões gerenciais de agregadores e visitas

**Status:** done  
**Dependencies:** None  

Conectar listas, filtros e painéis gerenciais de agregadores ao backend real.

**Details:**

Fechar consumo de listagens gerenciais, visitas, repasses, conciliação e ações operacionais ligadas a agregadores, removendo dependências locais remanescentes.

### 12.5. Mapear gaps de backend fiscal ainda abertos

**Status:** done  
**Dependencies:** None  

Registrar lacunas contratuais que ainda impedem a remoção total do legado.

**Details:**

Documentar especialmente emissão de NFSe por pagamento, reprocessamentos ou ações operacionais ausentes na OpenAPI, com prompt objetivo para o backend quando faltar endpoint 1:1.

### 12.6. Remover fallbacks locais e validar fluxos fiscais

**Status:** done  
**Dependencies:** None  

Finalizar a migração backend-only das áreas fiscal e de integração.

**Details:**

Eliminar ramos locais em /src/lib/mock/services.ts relacionados a NFSe/agregadores/integrações e validar build, tipagem e cenários principais das telas afetadas.
