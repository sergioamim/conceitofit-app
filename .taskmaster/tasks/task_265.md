# Task ID: 265

**Title:** Adicionar testes de acessibilidade automatizados

**Status:** done

**Dependencies:** 262 ✓

**Priority:** low

**Description:** Zero testes de acessibilidade. 177 aria-* existem mas não são validados automaticamente.

**Details:**

Integrar axe-core nos testes de componente via @axe-core/react ou vitest-axe. Adicionar check de a11y no CI. Priorizar: formulários, tabelas, modais, navegação. Lighthouse já roda no CI — adicionar threshold de accessibility > 90.

**Test Strategy:**

axe-core roda em CI sem critical violations. Lighthouse accessibility > 90.

## Subtasks

### 265.1. Instalar e configurar vitest-axe

**Status:** pending  
**Dependencies:** None  

Adicionar a dependência vitest-axe ao projeto e integrá-lo ao ambiente de testes existente configurado em tests/setup.ts, para que os matchers de acessibilidade estejam disponíveis globalmente ou por importação fácil nos testes de componentes.

**Details:**

Instalar 'vitest-axe' como devDependency. Editar 'tests/setup.ts' para importar 'vitest-axe/extend-expect' e/ou configurar a função 'configureAxe' para uso padrão. Assegurar que a configuração inicial do axe-core seja compatível com a suíte de testes existente (vitest, happy-dom, @testing-library/react).

### 265.2. Implementar testes de acessibilidade em componentes críticos

**Status:** pending  
**Dependencies:** 265.1  

Desenvolver testes unitários de acessibilidade para componentes chave da aplicação, focando inicialmente em formulários, modais, tabelas e elementos de navegação, utilizando as funcionalidades do vitest-axe para detectar violações.

**Details:**

Identificar os principais componentes em 'tests/components/' que se enquadram nas categorias de formulários, modais, tabelas e navegação. Adicionar novos arquivos de teste ou estender testes existentes para incluir 'expect(container).toHaveNoViolations()' para cada componente, garantindo que não haja violações de acessibilidade conforme as diretrizes do axe-core.

### 265.3. Adicionar validação de acessibilidade no CI com axe

**Status:** pending  
**Dependencies:** 265.1, 265.2  

Criar um novo passo ou um novo workflow de CI que execute os testes de acessibilidade automatizados com axe-core, garantindo que novas violações não sejam introduzidas no codebase em futuras submissões.

**Details:**

Analisar os workflows existentes em '.github/workflows/'. Adicionar um novo job ou um novo passo em um job existente que execute 'npm test' ou 'vitest' para rodar os testes de acessibilidade. Configurar para que o CI falhe se houver violações de acessibilidade detectadas pelo axe-core nos testes de componentes.

### 265.4. Configurar threshold de acessibilidade do Lighthouse no CI

**Status:** pending  
**Dependencies:** None  

Ajustar a configuração do Lighthouse no workflow de CI existente para que a pontuação de acessibilidade deva ser superior a 90 para que o build seja considerado bem-sucedido, elevando o padrão de qualidade.

**Details:**

Editar o arquivo '.github/workflows/lighthouse.yml'. Localizar a etapa que executa o Lighthouse (ex: 'actions/lighthouse') e adicionar ou modificar a configuração do threshold de acessibilidade para '> 90' ou '> 0.90', dependendo da sintaxe da ação de Lighthouse utilizada, na seção de 'audits' ou 'performance.accessibility'.
