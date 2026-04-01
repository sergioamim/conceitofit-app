# Task ID: 269

**Title:** Migrar grade/grade-content.tsx para TanStack Query

**Status:** done

**Dependencies:** 225 ✓

**Priority:** high

**Description:** Grade de atividades usa useState para dados de grade, atividades, salas. Página de alta frequência de acesso.

**Details:**

Criar useGrade() hook. Query key: ["grade", tenantId, weekStart]. Dados de grade mudam pouco — staleTime alto (10min).

**Test Strategy:**

Grade carrega com cache. Trocar semana invalida. Voltar para semana anterior usa cache.

## Subtasks

### 269.1. Definir e Implementar Query Keys para Grade

**Status:** done  
**Dependencies:** None  

Estabelecer as chaves de query padronizadas para a grade de atividades, incluindo tenantId e weekStart para garantir unicidade e granularidade do cache do TanStack Query.

**Details:**

Criar uma função utilitária ou constante para gerar as query keys no formato ["grade", tenantId, weekStart]. Estas chaves serão utilizadas por todos os hooks e chamadas relacionadas aos dados da grade de atividades, garantindo uma gestão de cache consistente.

### 269.2. Criar o Hook useGrade() com TanStack Query

**Status:** done  
**Dependencies:** 269.1  

Desenvolver o hook useGrade() que fará o fetch dos dados da grade de atividades usando TanStack Query, configurando staleTime para 10 minutos e refetchOnWindowFocus como true para otimizar o desempenho.

**Details:**

Implementar o hook useGrade() utilizando useQuery do TanStack Query. A função de fetch deve encapsular a lógica de Promise.all que atualmente busca os dados de grade, atividades, salas e funcionários. Configurar staleTime: 10 * 60 * 1000 (10 minutos) e refetchOnWindowFocus: true para o hook.

### 269.3. Refatorar grade-content.tsx para usar useGrade()

**Status:** done  
**Dependencies:** 269.2  

Substituir o estado local (useState) e a lógica de fetch manual (load()) existente no componente grade/grade-content.tsx pelo recém-criado hook useGrade() do TanStack Query.

**Details:**

Remover as declarações de useState para dados de grade, atividades, salas, funcionários e a função load() de grade-content.tsx. Chamar o hook useGrade() e consumir seus retornos (data, isLoading, isError) para adaptar a renderização do componente, lidando com os estados de carregamento e erro.

### 269.4. Exportar Hook e Executar Testes Finais de Integração

**Status:** done  
**Dependencies:** 269.3  

Garantir que o hook useGrade() esteja devidamente exportado para reuso em outros componentes e executar a estratégia de teste completa para validar a migração e o comportamento do cache.

**Details:**

Adicionar a exportação do useGrade() no arquivo apropriado (e.g., src/hooks/useGrade.ts) para permitir seu uso em outras partes do sistema, se necessário. Validar que a grade carrega com cache, verificar que trocar a semana invalida o cache para a nova semana, e confirmar que voltar para uma semana anterior usa o cache existente para carregamento instantâneo.
