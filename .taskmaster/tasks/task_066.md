# Task ID: 66

**Title:** Fechar testes, documentação e handoff do login por subdominio de rede

**Status:** done

**Dependencies:** 63 ✓, 64 ✓, 65 ✓

**Priority:** medium

**Description:** Concluir a trilha com cobertura automatizada e documentação operacional para o frontend.

**Details:**

Depois dos ajustes de rota, clients e UX, o frontend precisa deixar claro como acessar localmente por `/app/[rede]/login` e `[rede].localhost`, além de registrar o contrato com `X-Rede-Identifier` para reduzir regressões.

**Test Strategy:**

Executar testes de integração/Playwright cobrindo login por rota e host, e revisar a documentação local de desenvolvimento.

## Subtasks

### 66.1. Adicionar testes do fluxo por rota e por host

**Status:** done  
**Dependencies:** None  

Cobrir os dois formatos de entrada local.

**Details:**

Criar ou atualizar testes para `http://localhost:3001/app/sergioamim/login` e `http://sergioamim.localhost:3001/login`, verificando o envio do header correto e o comportamento da UI.

### 66.2. Documentar setup local do login por rede

**Status:** done  
**Dependencies:** 66.1  

Registrar como o time deve usar e testar o novo fluxo.

**Details:**

Atualizar docs/readme/frontend com os links canônicos locais, o papel do `subdominio` da academia e o contrato esperado com `X-Rede-Identifier`.

### 66.3. Fechar handoff com backend e QA

**Status:** done  
**Dependencies:** 66.1, 66.2  

Consolidar critérios de aceite e dependências externas.

**Details:**

Registrar os critérios mínimos: login sem tenant, uso de `subdominio`, suporte a `/app/[rede]/login` e `[rede].localhost`, além de observações para QA e rollout.
