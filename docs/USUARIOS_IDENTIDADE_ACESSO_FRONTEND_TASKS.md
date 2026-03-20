# Plano de Frontend - Usuario Canonico, Login Multi Identificador e Escopo Amplo

## 1. Objetivo

Planejar a evolucao do frontend para operar sobre `Usuario` como identidade canonica, desacoplando a UX de `Cliente/Aluno` e `Funcionario`, e preparando:

- cadastro de usuario independente;
- vinculos opcionais;
- login por email ou CPF no app;
- leitura de escopos `TENANT`, `ACADEMIA`, `REDE` e `GLOBAL`;
- governanca visual para acessos amplos.

## 2. Premissas

- a sessao continua centrada em `AuthUser`, nao em aluno ou funcionario;
- a seguranca global recente em `/admin/seguranca` e a base correta para evoluir a leitura de usuarios;
- frontend deve conviver com backend legado durante rollout;
- login do backoffice continua preferindo email;
- login do app deve aceitar email ou CPF quando o backend expuser o contrato.

## 3. Tasks de Frontend

### Task F1 - Formalizar o modelo de Usuario no frontend

**Objetivo**
Introduzir tipos e mapeadores de `Usuario` independentes de `Aluno` e `Funcionario`.

**Escopo**
- evoluir `src/lib/types.ts` com tipos de usuario canonico;
- introduzir tipos para:
  - `UserLoginIdentifier`;
  - `UserDomainLink`;
  - `UserScope`;
  - `UserKind`;
- manter compatibilidade com `AuthUser`, `RbacUser` e seguranca global;
- evitar quebrar contratos existentes de clientes e funcionarios.

**Subtasks**
- F1.1 Mapear tipos atuais de sessao, RBAC e seguranca que ja representam usuario.
- F1.2 Definir tipos canônicos de identidade e identificadores de login.
- F1.3 Criar adaptadores temporarios para compatibilizar respostas legadas.
- F1.4 Cobrir normalizacao com testes unitarios.

### Task F2 - Evoluir a sessao para identidade independente de dominio

**Objetivo**
Fazer o frontend ler sessao, bootstrap e contexto sem assumir que o usuario e cliente ou funcionario.

**Escopo**
- revisar `src/lib/api/auth.ts`;
- revisar `src/lib/api/contexto-unidades.ts`;
- revisar `src/hooks/use-session-context.tsx`;
- suportar metadados de escopo amplo e tipo de usuario;
- preparar flags para login multi-identificador.

**Subtasks**
- F2.1 Adicionar campos opcionais de identidade canônica no bootstrap.
- F2.2 Expor no contexto flags como `isHumanUser`, `hasGlobalScope`, `hasNetworkScope`.
- F2.3 Preservar fallback legado quando backend ainda nao enviar os novos campos.
- F2.4 Cobrir comportamento de sessao com testes unitarios.

### Task F3 - Criar a superficie de cadastro e detalhe de Usuario

**Objetivo**
Permitir cadastrar e gerenciar usuario sem exigir vinculo imediato com aluno ou funcionario.

**Escopo**
- criar area administrativa/backoffice de usuarios;
- permitir criar usuario com nome, status e identificadores;
- permitir editar dados basicos;
- permitir visualizar vinculos de dominio e escopos;
- manter linguagem de negocio e auditoria visivel.

**Subtasks**
- F3.1 Criar listagem de usuarios canonicos.
- F3.2 Criar formulario de criacao/edicao de usuario.
- F3.3 Exibir identificadores de login e status de verificacao.
- F3.4 Exibir vinculos com cliente/aluno e funcionario como blocos separados.
- F3.5 Cobrir estados de loading, vazio e erro.

### Task F4 - Implementar UX de vinculos opcionais com Cliente e Funcionario

**Objetivo**
Separar claramente identidade de acesso dos vinculos de dominio.

**Escopo**
- permitir vincular usuario a aluno;
- permitir vincular usuario a funcionario;
- permitir desfazer vinculos com confirmacao e auditoria;
- mostrar quando um usuario nao tem qualquer vinculo de dominio.

**Subtasks**
- F4.1 Criar bloco `Vinculos de dominio` no detalhe do usuario.
- F4.2 Implementar selecao/busca de aluno para vinculo.
- F4.3 Implementar selecao/busca de funcionario para vinculo.
- F4.4 Exibir impacto funcional desses vinculos sem sugerir que geram permissao.
- F4.5 Cobrir fluxos com testes de interface.

### Task F5 - Evoluir a seguranca para escopos amplos explicitos

**Objetivo**
Fazer a UI de seguranca trabalhar nativamente com `TENANT`, `ACADEMIA`, `REDE` e `GLOBAL`.

**Escopo**
- evoluir `/admin/seguranca`;
- destacar acessos amplos;
- exibir origem do escopo;
- diferenciar acesso local de acesso sistemico;
- preparar governanca de usuarios corporativos e de sistema.

**Subtasks**
- F5.1 Evoluir tipos e badges de escopo.
- F5.2 Destacar `REDE` e `GLOBAL` na lista e no detalhe.
- F5.3 Exibir motivo/origem para acessos amplos.
- F5.4 Incluir filtros por tipo de escopo e risco.
- F5.5 Cobrir leitura de escopo amplo com testes.

### Task F6 - Preparar o frontend para login por email ou CPF no app

**Objetivo**
Permitir autenticacao multi-identificador no canal app, sem mudar a identidade canonica.

**Escopo**
- evoluir tela de login publica/app;
- permitir que o campo aceite email ou CPF;
- normalizar input no frontend;
- manter copy e validacao adequadas;
- preservar compatibilidade com login atual por email.

**Subtasks**
- F6.1 Revisar tela e formulario de login.
- F6.2 Criar validador de identificador de login.
- F6.3 Ajustar placeholders, erros e ajuda contextual.
- F6.4 Adaptar analytics e eventos de auth.
- F6.5 Cobrir com testes E2E de login.

### Task F7 - Introduzir governanca visual de identificadores de login

**Objetivo**
Exibir e gerenciar email e CPF como identificadores de autenticacao, nao como identidade principal.

**Escopo**
- bloco de identificadores no detalhe do usuario;
- indicar qual e o principal por canal;
- indicar status de verificacao;
- indicar dado mascarado quando sensivel;
- permitir adicao/remocao futura sob feature flag.

**Subtasks**
- F7.1 Criar componente de listagem de identificadores.
- F7.2 Implementar mascaramento seguro para CPF.
- F7.3 Exibir verificacao e ultimo uso quando houver.
- F7.4 Preparar CTA para gestao futura dos identificadores.

### Task F8 - Tratar usuarios humanos vs service accounts na UX

**Objetivo**
Nao misturar conta humana com conta tecnica.

**Escopo**
- preparar tipagem e filtros visuais para `HUMANO` e `SERVICE_ACCOUNT`;
- esconder fluxos de app para contas tecnicas;
- destacar risco e governanca de contas sistemicas.

**Subtasks**
- F8.1 Adicionar badge e filtro por tipo.
- F8.2 Ajustar copy de detalhes e de sessoes.
- F8.3 Preparar empty states e warnings para contas tecnicas.

### Task F9 - Regressao e rollout controlado

**Objetivo**
Liberar a nova modelagem sem quebrar clientes, funcionarios e seguranca existente.

**Escopo**
- feature flags;
- fallbacks de contrato;
- cobertura de regressao;
- smoke de backoffice e login.

**Subtasks**
- F9.1 Introduzir feature flags para cadastro canonico e login multi-identificador.
- F9.2 Garantir fallback quando backend ainda nao enviar novos campos.
- F9.3 Cobrir regressao de sessao, seguranca e login.
- F9.4 Documentar matriz de rollout por canal.

## 4. Ordem recomendada

1. F1 - modelo canônico no frontend.
2. F2 - sessao e bootstrap.
3. F5 - escopos amplos na seguranca.
4. F3 - cadastro e detalhe de usuario.
5. F4 - vinculos opcionais.
6. F7 - identificadores de login.
7. F6 - login por email ou CPF no app.
8. F8 - contas tecnicas.
9. F9 - rollout e regressao.

## 5. Riscos de frontend

- telas que ainda assumem `usuario interno = funcionario`;
- fluxos do app que ainda assumem `login = aluno`;
- contrato parcial durante rollout;
- risco de expor CPF sem mascaramento adequado;
- ambiguidade de UX entre conta humana e conta tecnica.

## 6. Criterios de aceite do frontend

- frontend consegue representar `Usuario` sem vinculo de dominio;
- frontend consegue mostrar vinculos opcionais sem atribuir permissao automaticamente;
- seguranca diferencia escopos amplos;
- app aceita email ou CPF no mesmo fluxo visual;
- sessao continua consistente em tenant context e backoffice;
- rollout pode ser feito gradualmente por feature flag.

