# Task ID: 37

**Title:** Fechar rollout, documentação e cobertura E2E do frontend para NFSe da reforma tributaria

**Status:** done

**Dependencies:** 35 ✓, 36 ✓

**Priority:** medium

**Description:** Consolidar a adaptação fiscal de NFSe no frontend com documentação, evidência de teste e estratégia de rollout visual/operacional.

**Details:**

Depois de atualizar a configuração e os fluxos de emissão, o frontend precisa fechar a trilha pública e operacional: documentação de uso da tela fiscal, testes E2E ou smoke relevantes, alinhamento com o backend e checklist de rollout para operadores administrativos.

**Test Strategy:**

Executar cobertura de regressão nas páginas impactadas e registrar evidência mínima de funcionamento para configuração fiscal e emissão de NFSe, priorizando cenários administrativos críticos.

## Subtasks

### 37.1. Atualizar documentação operacional do frontend fiscal

**Status:** done  
**Dependencies:** None  

Documentar o novo fluxo de preenchimento e validação fiscal no backoffice web.

**Details:**

Registrar onde os operadores encontram os novos campos, como o frontend se comporta quando a unidade nao esta pronta para emitir NFSe e quais mensagens/estados devem ser esperados nas telas administrativas e de pagamentos.

### 37.2. Adicionar ou ampliar smoke/E2E das telas impactadas

**Status:** done  
**Dependencies:** 37.1  

Cobrir os caminhos mais críticos do fluxo fiscal no navegador.

**Details:**

Criar ou ampliar cenarios de smoke/E2E para `/administrativo/nfse` e os fluxos de emissao de NFSe em pagamentos, com mocks/fixtures estáveis e sem depender de ambiente fiscal real.

### 37.3. Alinhar inventario de contratos frontend x backend

**Status:** done  
**Dependencies:** 37.2  

Registrar os endpoints e payloads efetivamente usados pelo frontend apos a adaptacao.

**Details:**

Atualizar a documentacao interna do frontend sobre os endpoints de configuracao e emissao NFSe, destacando qualquer compatibilidade transitória e o ponto de remocao de fallbacks antigos.

### 37.4. Registrar critérios de aceite e riscos residuais do rollout

**Status:** done  
**Dependencies:** 37.3  

Fechar a trilha com critérios observáveis e riscos conhecidos do frontend fiscal.

**Details:**

Consolidar evidências esperadas de aceite visual/funcional, riscos de contrato parcial durante rollout e pontos futuros como overrides por servico/plano ou enriquecimento de UX fiscal.
