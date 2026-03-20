# Criação de Usuários Administrativos

## Superfícies

- Segurança global: [usuarios/page.tsx](/Users/sergioamim/dev/pessoal/academia-app/src/app/(backoffice)/admin/seguranca/usuarios/page.tsx)
  - Pode criar usuário com escopo `UNIDADE`, `REDE` ou `GLOBAL`.
  - Pode iniciar memberships em múltiplas unidades.
  - Pode marcar propagação para novas unidades quando o escopo inicial for de rede.
- Admin da academia: [page.tsx](/Users/sergioamim/dev/pessoal/academia-app/src/app/(app)/seguranca/rbac/page.tsx)
  - Cria usuário apenas para a rede corrente.
  - Só permite selecionar unidades disponíveis no contexto atual.
  - Não expõe escopo global, broad access nem criação em outras redes.

## Contratos

- Criação global usa `POST /api/v1/admin/seguranca/usuarios`.
- Criação da academia usa `POST /api/v1/auth/users` com `tenantId` da unidade ativa e payload restrito à rede atual.
- Os dois fluxos aceitam identificadores de login explícitos (`E-mail` e `CPF`) e mantêm `Usuario` independente de `Cliente` ou `Funcionario`.

## Guardrails

- A validação compartilhada fica em [security-user-create.ts](/Users/sergioamim/dev/pessoal/academia-app/src/lib/security-user-create.ts).
- A superfície da academia rejeita tenants e perfis fora do conjunto permitido pelo contexto carregado.
- A superfície global exige academia e unidades iniciais para escopos não globais.
- Propagação para novas unidades só pode nascer em escopo de rede.

## QA

- Segurança global:
  - criar usuário de rede com duas unidades e unidade base definida;
  - validar que o usuário aparece na listagem e mantém recorte de governança;
  - bloquear submit quando faltar academia ou unidade para escopo não global.
- Admin da academia:
  - criar usuário com uma ou mais unidades da rede atual;
  - validar perfis iniciais vinculados após criação;
  - garantir que não existe opção de escopo global nem de outra rede.
