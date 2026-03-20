# Rollout Frontend - Colaboradores

## Objetivo

Entregar a trilha administrativa de colaboradores na rota `/administrativo/funcionarios` com:

- listagem operacional rica;
- cadastro rápido com ou sem acesso ao sistema;
- ficha detalhada por abas;
- distinção explícita entre flags locais e memberships/auth;
- compatibilidade gradual enquanto o backend novo evolui.

## O que a UI já assume

- o colaborador é uma ficha operacional distinta da identidade de acesso;
- acesso ao sistema pode não existir no momento do cadastro;
- memberships por unidade são exibidos separadamente das flags locais;
- dados sensíveis podem ser mascarados quando o operador não tem capacidade elevada.

## Compatibilidade gradual

- `listFuncionariosApi` aceita tanto array simples quanto envelopes ricos (`items`, `content`, `data`, `rows`, `result`, `itens`);
- quando o catálogo de perfis RBAC não estiver disponível, a rota usa perfis fallback locais para não bloquear a operação;
- o shape antigo de `Funcionario` continua aceito, mas agora é enriquecido por normalização progressiva no frontend;
- a navegação administrativa mantém a mesma rota e troca apenas a linguagem visual de `Funcionários` para `Colaboradores`.

## Checklist de QA

1. Abrir `/administrativo/funcionarios` e validar shell, cards-resumo e filtros.
2. Confirmar criação rápida sem acesso ao sistema.
3. Confirmar criação rápida com acesso, perfil inicial e unidade base.
4. Abrir a ficha completa e salvar mudanças em Cadastro, Contratação e Permissões.
5. Validar memberships adicionais e unidade base no painel de Permissões.
6. Confirmar estados `ATIVO`, `INATIVO`, `BLOQUEADO` e `DESLIGADO`.
7. Validar mascaramento de salário/conta bancária para operadores sem acesso elevado.
8. Confirmar fallback visual quando `/api/v1/auth/perfis` não estiver disponível.

## Dependências de backend

- endpoint de colaboradores com campos ricos pode chegar gradualmente;
- catálogo de perfis RBAC idealmente deve responder na unidade ativa;
- para rollout completo, a API deve consolidar status de acesso, memberships e dados sensíveis na mesma leitura.
