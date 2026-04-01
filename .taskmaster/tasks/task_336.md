# Task ID: 336

**Title:** Executar reruns direcionados, consolidar residuos e documentar a nova linha de base Playwright

**Status:** done

**Dependencies:** 330 ✓, 331 ✓, 332 ✓, 333 ✓, 334 ✓, 335 ✓

**Priority:** medium

**Description:** Fechar o ciclo do relatorio atual com reruns por grupo, lista clara de residuos e atualizacao da referencia operacional da suite E2E.

**Details:**

Esta task depende de 330, 331, 332, 333, 334 e 335.

Escopo obrigatorio:
1. Reexecutar as suites por agrupamento de causa-raiz, nao somente o comando global, para confirmar que as correcoes realmente eliminaram cada familia de falha.
2. Consolidar um resumo final por bucket: autenticacao app, autenticacao backoffice, auth-rede/storefront, adesao publica, loading financeiro/operacional, demo e residuos funcionais isolados.
3. Abrir follow-ups apenas para falhas remanescentes que ja nao sejam mais problemas de fixture, auth ou mocks minimos.
4. Atualizar a documentacao interna necessaria para o time entender como semear sessao e quais contratos minimos cada shell espera.
5. Regenerar os arquivos do Taskmaster ao final e garantir que o backlog reflita corretamente o estado desta campanha de estabilizacao.

Criterio de aceite: o time deve conseguir olhar o backlog e saber exatamente quais grupos foram estabilizados, quais ainda restam e qual comando reproduz cada bucket.

**Test Strategy:**

Executar reruns por bucket apos as correcoes, comparar o resultado com o relatório inicial e atualizar Taskmaster/documentacao com o estado final desta campanha de estabilizacao.

## Subtasks

### 336.1. Definir matriz de rerun por bucket de causa-raiz

**Status:** done  
**Dependencies:** None  

Separar comandos e suites sentinela por autenticacao app, backoffice, auth-rede, adesao, loading e demo.

**Details:**

A matriz precisa permitir reproduzir rapidamente cada familia de falha sem depender do run global completo.

### 336.2. Executar reruns e consolidar resultados finais

**Status:** done  
**Dependencies:** 336.1  

Rodar os grupos corrigidos e registrar o que passou, o que evoluiu e o que ainda resta.

**Details:**

Produzir um resumo claro por bucket, incluindo diferenças entre falha de fixture resolvida e falha funcional residual.

### 336.3. Abrir follow-ups apenas para residuos reais

**Status:** done  
**Dependencies:** 336.2  

Transformar remanescentes em backlog de bugs funcionais quando eles nao forem mais problemas de base E2E.

**Details:**

Evitar novos itens genéricos: cada resíduo deve apontar spec, modulo, causa provável e estratégia de reprodução.

### 336.4. Atualizar documentacao e regenerar arquivos do Taskmaster

**Status:** done  
**Dependencies:** 336.2, 336.3  

Fechar a campanha com referencia operacional e arquivos consistentes para outras IAs.

**Details:**

Atualizar a documentação necessária para semeadura de sessão/mocks mínimos e garantir que tasks.json e arquivos markdown do Taskmaster reflitam o estado final.
