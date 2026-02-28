# Cenários E2E de Cadastro de Cliente (Playwright)

## Escopo
Fluxo de cadastro na tela `/clientes` (wizard `NovoClienteWizard`), ambiente `NEXT_PUBLIC_USE_REAL_API=false`.

## Cenários implementados

### Cenário 1 — Cadastro com plano e pagamento (fluxo completo)
- **Given** um usuário autenticado no modo mock.
- **When** abrir o modal `Novo cliente`.
- **And** preencher todos os dados obrigatórios do passo 1.
- **And** avançar com **Venda** e escolher o plano **Mensal Básico**.
- **And** selecionar forma de pagamento **Dinheiro** no passo 3 e concluir.
- **Then** exibir mensagem de sucesso.
- **And** a lista de clientes deve mostrar o novo cliente com status `Ativo`.

### Cenário 2 — Validação de obrigatoriedade do passo 1
- **Given** um usuário autenticado no modo mock.
- **When** abrir o modal `Novo cliente`.
- **And** tentar avançar sem preencher campos obrigatórios.
- **Then** o fluxo não avança para o passo 2.
- **And** os campos do passo 1 continuam visíveis.

### Cenário 3 — Cadastro sem matrícula (finalizar no passo 1)
- **Given** um usuário autenticado no modo mock.
- **When** abrir o modal `Novo cliente`.
- **And** preencher dados obrigatórios.
- **And** clicar em **Finalizar** no passo 1.
- **Then** não aparece sucesso de matrícula.
- **And** o cliente aparece na lista com status `Inativo`.

## Como executar
- Instalar dependência e browsers: `npm install`, `npx playwright install`.
- Rodar suíte E2E: `npm run e2e`.
