# Task ID: 4

**Title:** Construir CRM operacional com automacoes

**Status:** done

**Dependencies:** 1, 3

**Priority:** medium

**Description:** Evoluir o frontend para suportar pipeline, tarefas, playbooks, cadencias e follow-up comercial.

**Details:**

Inclui telas de funil, tarefas comerciais, filtros, produtividade e automacoes visiveis ao operador.

**Test Strategy:**

No test strategy provided.

## Subtasks

### 4.1. Definir workspace CRM e modelos de dados base

**Status:** done  
**Dependencies:** None  

Mapear entidades e estados necessários para o CRM operacional.

**Details:**

Especificar modelos para pipeline, etapas, tarefas, playbooks, cadências, follow-up e histórico, alinhando com o contexto multiunidade e permissões.

### 4.2. Expandir API/serviços além de prospects

**Status:** done  
**Dependencies:** 4.1  

Criar endpoints e serviços para novas entidades do CRM.

**Details:**

Atualizar `src/lib/api/crm.ts` com métodos para pipeline, tarefas, playbooks, cadências, automações e histórico, incluindo contratos de dados e tratamento de erros.

### 4.3. Construir telas de pipeline e tarefas comerciais

**Status:** done  
**Dependencies:** 4.1, 4.2  

Adicionar UI para gestão de funil e tarefas.

**Details:**

Implementar páginas e componentes para funil, lista de tarefas e filtros, conectando aos serviços e garantindo estados de carregamento e vazio.

### 4.4. Criar telas de playbooks e cadências

**Status:** done  
**Dependencies:** 4.1, 4.2  

Entregar UI para playbooks e cadências comerciais.

**Details:**

Desenvolver telas para criação/edição de playbooks e cadências, com visualização de etapas e ações, integradas ao backend.

### 4.5. Adicionar automações e histórico de follow-up

**Status:** done  
**Dependencies:** 4.2, 4.3, 4.4  

Exibir automações e trilha de atividades do operador.

**Details:**

Implementar área de automações visíveis ao operador e timeline de histórico, com eventos de tarefas, contatos e mudanças de etapa.

### 4.6. Fechar estados UX e testes de fluxos críticos

**Status:** done  
**Dependencies:** 4.3, 4.4, 4.5  

Finalizar experiência e validar fluxos principais.

**Details:**

Refinar estados de erro/carregamento, empty states e navegação, além de definir e executar testes dos fluxos de funil, tarefas e cadências.
