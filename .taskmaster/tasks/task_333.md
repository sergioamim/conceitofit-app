# Task ID: 333

**Title:** Corrigir jornada publica de adesao com mocks aderentes ao runtime atual

**Status:** done

**Dependencies:** 327, 329

**Priority:** high

**Description:** Atualizar os testes de adesao publica para refletirem corretamente os endpoints, estados de carregamento e transicoes reais do fluxo publico.

**Details:**

Esta task depende de 327 e 329.

Escopo obrigatorio:
1. Auditar tests/e2e/adesao-publica.spec.ts e installPublicJourneyApiMocks em tests/e2e/support/backend-only-stubs.ts.
2. Mapear todas as requests reais disparadas pelas telas /adesao/trial, /adesao/cadastro, /adesao/checkout e /adesao/pendencias.
3. Garantir que os mocks devolvam payloads completos para branding, tenant, catalogo, checkout, pendencias e confirmacao final.
4. Resolver o caso que fica preso em 'Carregando jornada publica...' e validar que o fluxo de checkout + assinatura + pagamento percorre os estados esperados sem depender de navegacao antiga.
5. Manter separacao clara entre dados de catalogo, dados da jornada e efeitos do checkout para evitar novos mocks monoliticos dificeis de manter.

Criterio de aceite: a suite de adesao publica precisa ser novamente um sentinel confiavel do fluxo publico, sem waits artificiais para mascarar falta de contrato.

**Test Strategy:**

Reexecutar adesao-publica.spec.ts completo e confirmar que trial, cadastro, checkout e pendencias percorrem os estados esperados sem ficar presos em carregamento.

## Subtasks

### 333.1. Mapear requests reais da jornada publica por etapa

**Status:** done  
**Dependencies:** None  

Levantar o que cada tela de adesao consulta antes e depois de navegar.

**Details:**

Cobrir /adesao/trial, /adesao/cadastro, /adesao/checkout e /adesao/pendencias, incluindo branding, tenant, catalogo, checkout e pendencias.

### 333.2. Atualizar mocks de branding, tenant e catalogo

**Status:** done  
**Dependencies:** 333.1  

Garantir payloads completos para a jornada publica subir sem fallback quebrado.

**Details:**

Revisar installPublicJourneyApiMocks para refletir o shape atual esperado pelas telas e pelos componentes de catalogo/resumo.

### 333.3. Corrigir transicoes de checkout, assinatura e pagamento

**Status:** done  
**Dependencies:** 333.1, 333.2  

Alinhar respostas de checkout e pendencias aos estados usados pelo frontend atual.

**Details:**

Validar criacao de venda/checkout, pendencia de assinatura, assinatura concluida e marcacao de pagamento como recebido sem depender de navegacao ou endpoints antigos.

### 333.4. Revalidar trial e fluxo completo de conclusao

**Status:** done  
**Dependencies:** 333.2, 333.3  

Garantir que os dois testes da suite voltem a ser sentinelas confiaveis do fluxo publico.

**Details:**

Reexecutar os cenarios do trial e da adesao completa e registrar qualquer dependencia residual de mock que ainda precise ser separada por dominio.
