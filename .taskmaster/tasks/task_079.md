# Task ID: 79

**Title:** Migrar formularios selecionados para react-hook-form

**Status:** pending

**Dependencies:** None

**Priority:** medium

**Description:** Consolidar a migracao dos formularios mais aderentes ao react-hook-form em um epico unico, com uma subtask por formulario ou modal relevante.

**Details:**

Cobrir formularios de autenticacao, jornada publica, operacionais e modais CRUD que hoje usam `useState` e validacao manual. O objetivo e padronizar registro de campos, validacao, reset, submit assincrono e integracao com componentes como `Select`, `SuggestionInput` e editores ricos sem regressao funcional nem risco de hydration.

**Test Strategy:**

Validar cada subtask com verificacao do submit, mensagens de erro, reset entre abrir/fechar ou criar/editar, e cobertura manual ou automatizada conforme criticidade do fluxo. Ao final do epico, revisar os componentes alterados para garantir que a integracao com `react-hook-form` permaneceu consistente nos patterns do projeto.

## Subtasks

### 79.1. Migrar formulario de acesso por rede para react-hook-form

**Status:** pending  
**Dependencies:** None  

Substituir o gerenciamento manual de estado e validacao do login, recuperacao e primeiro acesso em `src/components/auth/network-access-flow.tsx` por react-hook-form.

**Details:**

Aplicar react-hook-form nos campos identificador e senha, usar `Controller` nos componentes `Select` quando necessario, centralizar erros de submit e preservar a etapa de escolha de tenant com comportamento equivalente ao atual.

### 79.2. Migrar formulario de login legado para react-hook-form

**Status:** pending  
**Dependencies:** None  

Substituir o gerenciamento manual de estado do login legado em `src/components/auth/legacy-login-flow.tsx` por react-hook-form.

**Details:**

Usar react-hook-form para usuario e senha, manter a etapa de unidade prioritaria com integracao limpa ao fluxo atual e evitar regressao na navegacao pos-login.

### 79.3. Migrar formulario de cadastro publico para react-hook-form

**Status:** pending  
**Dependencies:** None  

Refatorar o formulario de pre-cadastro em `src/app/(public)/adesao/cadastro/page.tsx` para react-hook-form.

**Details:**

Mapear validacoes hoje feitas por `validateSignupDraft` para erros do form, integrar select de plano, preservar `persistDraft` e manter SSR e hydration estaveis no primeiro render.

### 79.4. Migrar formulario de trial publico para react-hook-form

**Status:** pending  
**Dependencies:** None  

Refatorar o formulario de trial em `src/app/(public)/adesao/trial/page.tsx` para react-hook-form.

**Details:**

Substituir `form` e `formErrors` manuais por registro de campos, mensagens de erro por campo e submit assincrono com reset parcial conforme resultado do envio.

### 79.5. Migrar formulario de checkout publico para react-hook-form

**Status:** pending  
**Dependencies:** None  

Refatorar o fechamento digital em `src/app/(public)/adesao/checkout/page.tsx` para react-hook-form.

**Details:**

Cobrir plano, forma de pagamento, parcelas, observacoes, flags de aceite e renovacao automatica, mantendo a montagem do payload `PublicCheckoutInput` e as regras condicionais atuais.

### 79.6. Migrar formulario de plano para react-hook-form

**Status:** pending  
**Dependencies:** None  

Refatorar `src/components/planos/plano-form.tsx` para react-hook-form.

**Details:**

Usar `watch`, `setValue`, `Controller` e `useFieldArray` para beneficios e atividades, preservando as abas, regras condicionais de tipo de plano e integracao com `RichTextEditor`.

### 79.7. Migrar formulario de criacao de usuario por unidade para react-hook-form

**Status:** pending  
**Dependencies:** None  

Refatorar o formulario Criar usuario da rede atual em `src/app/(app)/seguranca/acesso-unidade/page.tsx` para react-hook-form.

**Details:**

Cobrir nome, email, cpf e perfis iniciais com validacao integrada a `validateAcademiaUserCreateDraft`, mantendo a dependencia do tenant efetivo e o fluxo assincrono de criacao.

### 79.8. Migrar formulario de concessao de acesso por unidade para react-hook-form

**Status:** pending  
**Dependencies:** None  

Refatorar o formulario Conceder acesso operacional em `src/app/(app)/seguranca/acesso-unidade/page.tsx` para react-hook-form.

**Details:**

Integrar tenant, `SuggestionInput` e submissao com perfil padrao sem perder a busca sob demanda de usuarios nem a exibicao de mensagens globais de erro e sucesso.

### 79.9. Migrar modal de produto para react-hook-form

**Status:** pending  
**Dependencies:** None  

Refatorar `src/components/shared/produto-modal.tsx` para usar react-hook-form.

**Details:**

Substituir estado agregado manual por `defaultValues` e `reset`, tratar parsers numericos no submit e usar `Controller` no `Select` de unidade de medida e nos toggles dependentes de estoque.

### 79.10. Migrar modal de cargo para react-hook-form

**Status:** pending  
**Dependencies:** None  

Refatorar `src/components/shared/cargo-modal.tsx` para react-hook-form.

**Details:**

Cobrir nome e ativo com reset correto entre criar e editar e submit padronizado.

### 79.11. Migrar modal de funcionario para react-hook-form

**Status:** pending  
**Dependencies:** None  

Refatorar `src/components/shared/funcionario-modal.tsx` para react-hook-form.

**Details:**

Cobrir nome, cargo, ativo e `podeMinistrarAulas`, usando `Controller` para `Select` e reset consistente quando `initial` ou `open` mudar.

### 79.12. Migrar modal de convenio para react-hook-form

**Status:** pending  
**Dependencies:** None  

Refatorar `src/components/shared/convenio-modal.tsx` para react-hook-form.

**Details:**

Modelar nome, desconto, ativo, observacoes e `planoIds`, usando `watch` e `setValue` para multi-selecao de planos elegiveis.

### 79.13. Migrar modal de servico para react-hook-form

**Status:** pending  
**Dependencies:** None  

Refatorar `src/components/shared/servico-modal.tsx` para react-hook-form.

**Details:**

Cobrir campos numericos, flags booleanas e regras condicionais de tipo de cobranca recorrente, reduzindo parsing e reset manuais.

### 79.14. Migrar modal de exercicio para react-hook-form

**Status:** pending  
**Dependencies:** None  

Refatorar `src/components/shared/exercicio-modal.tsx` para react-hook-form.

**Details:**

Cobrir nome, grupo muscular, equipamento, video, unidade, descricao e ativo, com reset confiavel entre criacao e edicao.

### 79.15. Migrar modal legado de plano para react-hook-form

**Status:** pending  
**Dependencies:** None  

Refatorar `src/components/shared/plano-modal.tsx` para react-hook-form.

**Details:**

Modelar campos do plano, beneficios e atividades com `watch` e `useFieldArray`, preservando regras condicionais e fluxo de criar e editar.

### 79.16. Migrar modal de sala para react-hook-form

**Status:** pending  
**Dependencies:** None  

Refatorar `src/components/shared/sala-modal.tsx` para react-hook-form.

**Details:**

Substituir o estado manual do modal por form controlado com reset consistente e validacao de campos obrigatorios.

### 79.17. Migrar modal de forma de pagamento para react-hook-form

**Status:** pending  
**Dependencies:** None  

Refatorar `src/components/shared/forma-pagamento-modal.tsx` para react-hook-form.

**Details:**

Padronizar validacao, reset e submit do CRUD de forma de pagamento sem alterar o comportamento funcional.

### 79.18. Migrar modal de bandeira de cartao para react-hook-form

**Status:** pending  
**Dependencies:** None  

Refatorar `src/components/shared/bandeira-cartao-modal.tsx` para react-hook-form.

**Details:**

Cobrir criacao e edicao de bandeira com campos registrados e submit padronizado.

### 79.19. Migrar modal de novo voucher para react-hook-form

**Status:** pending  
**Dependencies:** None  

Refatorar `src/components/shared/novo-voucher-modal.tsx` para react-hook-form.

**Details:**

Cobrir regras condicionais de periodo, quantidade, flags e codigo customizado usando `watch` e `Controller`, reduzindo a quantidade de estados locais.

### 79.20. Migrar modal de edicao de voucher para react-hook-form

**Status:** pending  
**Dependencies:** None  

Refatorar `src/components/shared/editar-voucher-modal.tsx` para react-hook-form.

**Details:**

Aplicar a mesma base do novo voucher para fluxo de edicao, com `reset` por `initial` e validacao consistente.

### 79.21. Migrar modal de novo cartao para react-hook-form

**Status:** pending  
**Dependencies:** None  

Refatorar `src/components/shared/novo-cartao-modal.tsx` para react-hook-form.

**Details:**

Integrar mascaras e validacoes de numero, validade, CPF e bandeira dentro do fluxo do form, mantendo deteccao visual da bandeira e mensagens de erro.

### 79.22. Migrar modal de nova matricula para react-hook-form

**Status:** pending  
**Dependencies:** None  

Refatorar `src/components/shared/nova-matricula-modal.tsx` para react-hook-form.

**Details:**

Cobrir aluno, plano, data, desconto, renovacao, parcelas e flags de pagamento com validacao e regras condicionais centralizadas.

### 79.23. Migrar modal de recebimento de pagamento para react-hook-form

**Status:** pending  
**Dependencies:** None  

Refatorar `src/components/shared/receber-pagamento-modal.tsx` para react-hook-form.

**Details:**

Substituir controle manual de data e observacoes por form registrado, preservando submit e feedback atuais.

### 79.24. Migrar formulario de tarefas CRM para react-hook-form

**Status:** pending  
**Dependencies:** None  

Refatorar o formulario principal de `src/app/(app)/crm/tarefas/page.tsx` para react-hook-form.

**Details:**

Cobrir criacao e edicao de tarefa, campos de vencimento, selects e textarea, mantendo `resetForm`, filtros independentes e tratamento de erros do backend.

### 79.25. Migrar formulario de criacao de usuario global para react-hook-form

**Status:** pending  
**Dependencies:** None  

Refatorar o formulario de criacao em `src/app/(backoffice)/admin/seguranca/usuarios/page.tsx` para react-hook-form.

**Details:**

Cobrir escopo, academia, tenants, perfil inicial e flags globais com `watch` e `Controller`, reduzindo o estado manual `createForm` e facilitando validacao.

### 79.26. Migrar formularios de RBAC para react-hook-form

**Status:** pending  
**Dependencies:** None  

Refatorar os formularios operacionais de `src/app/(app)/seguranca/rbac/page.tsx` para react-hook-form.

**Details:**

Separar cada fluxo de atribuicao e concessao em forms independentes com validacao e submit padronizados, mantendo a logica de carregamento atual.

### 79.27. Migrar formulario de criacao de colaborador administrativo para react-hook-form

**Status:** pending  
**Dependencies:** None  

Refatorar o formulario de criacao em `src/app/(app)/administrativo/funcionarios/page.tsx` para react-hook-form.

**Details:**

Substituir o estado manual do formulario de colaborador por react-hook-form, com integracao limpa aos modais auxiliares e validacoes existentes.
