# Task ID: 286

**Title:** Migrar backoffice admin (20+ páginas) para TanStack Query

**Status:** done

**Dependencies:** 225 ✓

**Priority:** low

**Description:** Páginas do backoffice (academias, audit-log, compliance, segurança, financeiro, operacional, leads, busca, whatsapp) usam useState para server state.

**Details:**

Criar hooks por domínio: useAdminAcademias(), useAdminAuditLog(), useAdminCompliance(), useAdminSeguranca(), useAdminFinanceiro(), useAdminOperacional(). Agrupar por similaridade — muitas seguem padrão list+detail+toggle.

**Test Strategy:**

Todas páginas admin carregam com cache. CRUD funciona. Navegar entre abas preserva dados.

## Subtasks

### 286.1. Adicionar chaves de query admin em src/lib/query/keys.ts

**Status:** done  
**Dependencies:** None  

Estender o arquivo de chaves de query com novas chaves específicas para as entidades do backoffice admin, seguindo o padrão existente para garantir consistência.

**Details:**

Identificar todas as entidades de dados usadas nas páginas administrativas (academias, audit-log, financeiro, segurança, etc.) e criar as chaves de query correspondentes em src/lib/query/keys.ts. Isso inclui chaves para listas, detalhes e possíveis mutações.

### 286.2. Criar useAdminAcademias hook para páginas de Academias

**Status:** done  
**Dependencies:** 286.1  

Desenvolver um hook personalizado (useAdminAcademias) para gerenciar o estado do servidor relacionado às páginas de listagem e detalhes de academias, substituindo o useState/useEffect.

**Details:**

Implementar useAdminAcademias em src/lib/query/admin/use-admin-academias.ts. O hook deve fornecer funções para buscar a lista de academias, detalhes de uma academia específica e possíveis mutações (ativação/desativação). Usar o padrão de TanStack Query já estabelecido em outros hooks.

### 286.3. Criar useAdminAuditLog hook para página de Audit Log

**Status:** done  
**Dependencies:** 286.1  

Desenvolver o hook useAdminAuditLog para gerenciar a paginação e filtragem do log de auditoria no backoffice, substituindo o estado local (useState/useEffect).

**Details:**

Implementar useAdminAuditLog em src/lib/query/admin/use-admin-audit-log.ts. O hook deve suportar busca de logs com paginação, filtros por data, usuário ou ação. Integrar com as APIs existentes para o Audit Log.

### 286.4. Criar useAdminFinanceiro hooks para páginas de Finanças

**Status:** done  
**Dependencies:** 286.1  

Desenvolver hooks específicos (ex: useAdminCobrancas, useAdminContratos, useAdminPlanos) para as diversas páginas do domínio financeiro (dashboard, cobranças, contratos, gateways, planos), unificando a gestão de estado do servidor.

**Details:**

Criar hooks em src/lib/query/admin/ com foco nas 5 páginas de financeiro. Os hooks devem abstrair a lógica de busca e mutação para dados como cobranças, contratos, gateways de pagamento e planos, permitindo a exibição e manipulação desses dados. Agrupar em arquivos como use-admin-financeiro-cobrancas.ts.

### 286.5. Criar useAdminSeguranca hooks para páginas de Segurança

**Status:** done  
**Dependencies:** 286.1  

Implementar hooks (ex: useAdminPerfis, useAdminFuncionalidades) para as páginas de Segurança (overview, catálogo, funcionalidades, perfis, revisões), padronizando a busca e manipulação de dados de controle de acesso.

**Details:**

Desenvolver hooks em src/lib/query/admin/ para as 5 páginas de segurança. Incluir hooks para buscar e gerenciar dados de catálogo de funcionalidades, perfis de acesso e revisões de segurança. Nomear arquivos de forma clara, como use-admin-seguranca-perfis.ts.

### 286.6. Criar useAdminOperacional hooks para páginas Operacionais

**Status:** done  
**Dependencies:** 286.1  

Criar hooks (ex: useAdminAlertas, useAdminSaude) para as páginas de 'Alertas' e 'Saúde do Sistema' do backoffice, centralizando a lógica de busca de dados operacionais.

**Details:**

Implementar os hooks em src/lib/query/admin/use-admin-operacional-alertas.ts e use-admin-operacional-saude.ts. Eles devem fornecer a funcionalidade para buscar e exibir informações sobre alertas do sistema e o status de saúde dos serviços, substituindo as chamadas diretas de API em useEffect.

### 286.7. Criar hooks para as demais páginas administrativas (Leads, Compliance, Busca, BI, Whatsapp, Configurações)

**Status:** done  
**Dependencies:** 286.1  

Desenvolver os hooks de TanStack Query para as páginas administrativas restantes: Leads, Compliance, Busca Global, BI, Whatsapp e Configurações, cobrindo a funcionalidade de busca e gestão de dados para cada domínio.

**Details:**

Criar os seguintes hooks em src/lib/query/admin/: useAdminLeads, useAdminCompliance, useAdminBusca, useAdminBI, useAdminWhatsapp, useAdminConfiguracoes. Cada hook deve encapsular a lógica de busca e manipulação de dados para sua respectiva área, seguindo o padrão dos hooks anteriores.

### 286.8. Migrar componentes das páginas admin para usar os novos hooks do TanStack Query

**Status:** done  
**Dependencies:** 286.2, 286.3, 286.4, 286.5, 286.6, 286.7  

Atualizar os componentes de todas as 20+ páginas do backoffice admin para consumir os novos hooks do TanStack Query, removendo as implementações antigas baseadas em useState e useEffect para fetching de dados.

**Details:**

Iterar por todas as páginas em src/app/(backoffice)/admin/ e substituir as chamadas de API dentro de useEffect por chamadas aos novos hooks (e.g., useAdminAcademias, useAdminFinanceiro). Garantir que os estados de carregamento, erro e dados sejam corretamente mapeados para a UI. As páginas devem exibir os dados corretamente após a migração.
