# Task ID: 83

**Title:** Reestruturar colaboradores para fluxo em páginas próprias

**Status:** done

**Dependencies:** 73 ✓, 82 ✓

**Priority:** high

**Description:** Substituir o fluxo atual de criação/edição de colaboradores via modal por páginas próprias, com listagem em datatable tradicional e formulários organizados em abas.

**Details:**

A tela atual de `src/app/(app)/administrativo/funcionarios/page.tsx` mistura listagem, criação rápida em modal e edição inline com densidade alta, o que já causa overflow visual e piora a navegação. Reestruturar o módulo para seguir um fluxo mais estável: a listagem principal deve focar em busca, filtros, métricas e uma tabela paginável tradicional; a ação de “Novo colaborador” deve levar para uma rota própria (ex.: `/administrativo/funcionarios/novo`); a edição deve ocorrer em rota dedicada (ex.: `/administrativo/funcionarios/[id]`), com cabeçalho claro e tabs para agrupar cadastro, contratação, permissões, horários, informações complementares e notificações; a listagem deve abrir a ficha do colaborador ao clicar na linha/ação de editar, evitando modal gigante para dados extensos; o fluxo deve preservar o comportamento já existente de catálogos auxiliares, permissões, dados sensíveis e compatibilidade com multiunidade. Ao implementar, priorizar extração de componentes compartilháveis para ficha/listagem sem duplicar regras de normalização ou payload. A nova navegação deve manter segurança de hidratação, responsividade e rotas previsíveis para deep-link direto na ficha.

**Test Strategy:**

Cobrir com testes unitários e E2E a navegação da listagem para `novo` e `edição`, abertura correta das abas, persistência de formulário, carregamento do colaborador por rota e remoção do fluxo modal antigo. Validar também que a tabela continua funcional com filtros, seleção e ações de catálogo.

## Subtasks

### 83.1. Redesenhar a listagem de colaboradores como workspace de tabela

**Status:** done  
**Dependencies:** None  

Refatorar a tela principal para priorizar métricas, filtros e um datatable tradicional, removendo a dependência do modal de criação para o fluxo primário.

**Details:**

Refatorar a tela principal para priorizar métricas, filtros e um datatable tradicional, removendo a dependência do modal de criação para o fluxo primário.

### 83.2. Criar rota própria para novo colaborador

**Status:** done  
**Dependencies:** 83.1  

Implementar uma página dedicada para criação de colaborador, com formulário estruturado em tabs e CTA claro de salvar/cancelar.

**Details:**

Implementar uma página dedicada para criação de colaborador, com formulário estruturado em tabs e CTA claro de salvar/cancelar.

### 83.3. Criar rota própria para edição de colaborador

**Status:** done  
**Dependencies:** 83.1  

Implementar a ficha por rota com carregamento do colaborador por `id`, tabs de navegação e ações de atualização sem depender da listagem inline.

**Details:**

Implementar a ficha por rota com carregamento do colaborador por `id`, tabs de navegação e ações de atualização sem depender da listagem inline.

### 83.4. Extrair componentes compartilhados da ficha e remover o modal gigante

**Status:** done  
**Dependencies:** 83.2, 83.3  

Extrair shell, seções e tabs reaproveitáveis para `novo`/`edição`, eliminando o modal atual e reduzindo acoplamento entre listagem e formulário.

**Details:**

Extrair shell, seções e tabs reaproveitáveis para `novo`/`edição`, eliminando o modal atual e reduzindo acoplamento entre listagem e formulário.

### 83.5. Atualizar cobertura e navegação operacional

**Status:** done  
**Dependencies:** 83.2, 83.3, 83.4  

Atualizar testes e fluxos E2E/unitários para validar navegação, carregamento por rota, salvamento e regressões visuais/operacionais do módulo.

**Details:**

Atualizar testes e fluxos E2E/unitários para validar navegação, carregamento por rota, salvamento e regressões visuais/operacionais do módulo.
