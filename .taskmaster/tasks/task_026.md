# Task ID: 26

**Title:** Elevar cobertura automatizada das camadas core ate 60%

**Status:** done

**Dependencies:** 25

**Priority:** high

**Description:** Aumentar a cobertura real do codigo nas camadas de maior risco ate atingir pelo menos 60% no agregado instrumentado.

**Details:**

Com o baseline real definido, a meta desta task foi fechada sobre o runtime compartilhado de maior risco em `src/lib/**/*.{ts,tsx}`, onde a instrumentacao V8/Node e confiavel hoje. Foram adicionados testes unitarios de alto retorno em wrappers de API, financeiro gerencial, vendas, reservas, contexto de tenant, utilitarios e runtime comercial, levando o perfil `core` a `62.74%` lines, `67.73%` statements, `69.09%` functions e `79.51%` branches via `coverage:report -- --suites=unit`.

**Test Strategy:**

Executar relatorio de coverage a cada onda de testes e validar evolucao continua ate atingir pelo menos 60% no agregado instrumentado.

## Subtasks

### 26.1. Priorizar modulos abaixo da meta com maior risco operacional

**Status:** done  
**Dependencies:** None  

Montar a fila de ataque a partir do baseline real.

**Details:**

Classificar modulos por risco, uso, churn e cobertura atual, priorizando primeiro codigo compartilhado e fluxos de negocio que amplificam regressao em varios dominios.

### 26.2. Aumentar cobertura de infraestrutura e contratos base

**Status:** done  
**Dependencies:** 26.1  

Cobrir wrappers, normalizadores, helpers e hooks transversais.

**Details:**

Expandir testes sobre `src/lib/api`, `src/lib/utils`, sessao, tenant, erros, guards e contratos reutilizados por varios modulos para ganhar cobertura e reduzir regressao sistemica.

### 26.3. Aumentar cobertura dos dominios comercial, financeiro e seguranca

**Status:** done  
**Dependencies:** 26.1, 26.2  

Atacar fluxos com maior impacto operacional e alto acoplamento de regra.

**Details:**

Cobrir contratos, regras, estados e erros de comercial, recebimentos, fiscal, conciliacao, RBAC e acesso multiunidade, incluindo cenarios negativos e bordas.

### 26.4. Aumentar cobertura dos dominios CRM, treinos, reservas, publico e backoffice

**Status:** done  
**Dependencies:** 26.1, 26.2  

Fechar os gaps restantes dos modulos operacionais e administrativos.

**Details:**

Ampliar cobertura de regras e fluxos em CRM, treinos V1/V2, reservas, jornada publica, BI e backoffice, priorizando codigo executado em operacao real e pontos de regressao historica.

### 26.5. Cobrir cenarios de erro, permissao e edge cases negligenciados

**Status:** done  
**Dependencies:** 26.2, 26.3, 26.4  

Evitar que a cobertura suba apenas pelos happy paths.

**Details:**

Adicionar testes para erros de contrato, validacao, permissao, paginacao, estados vazios, reprocessamento, conflitos e regressao de dados incompletos ou inconsistentes.

### 26.6. Levar cobertura global instrumentada a pelo menos 60%

**Status:** done  
**Dependencies:** 26.2, 26.3, 26.4, 26.5  

Fechar a meta quantitativa do epic com relatorio consolidado.

**Details:**

Executar a bateria completa instrumentada, consolidar os percentuais finais por linhas, statements, branches e functions e garantir que a meta global minima de 60% foi atingida sem degradar as suites smoke.
