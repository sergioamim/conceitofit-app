# Task ID: 68

**Title:** Estruturar experiencia de colaboradores no backoffice administrativo

**Status:** done

**Dependencies:** None

**Priority:** high

**Description:** Preparar a trilha de colaboradores para o novo modelo operacional do backend, sem copiar a interface do EVO.

**Details:**

Usar como referencia o PRD backend `academia-java/docs/prd-colaboradores-identidade-acesso.md` e o execplan `academia-java/docs/execplans/evoluir-colaboradores-identidade-acesso.md` para desenhar a experiencia administrativa de colaboradores no web, com foco em operacao, onboarding de acesso e manutencao da ficha completa.

**Test Strategy:**

Validar navegacao, renderizacao e estados de permissao das novas superficies com testes de componentes e smoke tests do backoffice.

## Subtasks

### 68.1. Auditar telas atuais de colaboradores e pontos de entrada

**Status:** done  
**Dependencies:** None  

Mapear o que ja existe no frontend para cadastro/listagem de colaboradores.

**Details:**

Inventariar rotas, componentes, services e tipos atuais relacionados a colaboradores/funcionarios, identificando lacunas frente ao novo contrato do backend.

### 68.2. Definir shell e navegacao do modulo de colaboradores

**Status:** done  
**Dependencies:** 68.1  

Fechar a arquitetura de navegação da area administrativa de colaboradores.

**Details:**

Especificar listagem, cadastro rapido, perfil detalhado e navegacao por abas, mantendo coerencia com o backoffice atual e sem reproduzir tela a tela do EVO.

### 68.3. Planejar estados e guardas de permissao

**Status:** done  
**Dependencies:** 68.1, 68.2  

Garantir acesso correto às superficies novas.

**Details:**

Definir quais perfis podem listar, criar, editar, conceder acesso, alterar contratacao e visualizar dados sensiveis de salario/conta bancaria.

### 68.4. Fechar modelo visual do perfil do colaborador

**Status:** done  
**Dependencies:** 68.2, 68.3  

Estruturar a ficha detalhada em blocos operacionais claros.

**Details:**

Desenhar a organizacao por abas ou secoes para cadastro, contratacao, permissoes, horario, informacoes internas e notificacoes, com foco em densidade boa e manutencao pratica.
