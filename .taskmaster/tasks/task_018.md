# Task ID: 18

**Title:** Integrar politica de novas unidades ao administrativo e onboarding

**Status:** done

**Dependencies:** 10 ✓, 17 ✓

**Priority:** medium

**Description:** Exibir e operar a elegibilidade de usuarios para novas unidades, alem de refletir acesso herdado/manual nas telas de seguranca e de unidades.

**Details:**

O backend vai passar a formalizar a politica de quem recebe acesso automaticamente quando uma nova unidade e criada. O frontend precisa refletir isso no backoffice global de seguranca e nos fluxos ja existentes de cadastro/onboarding de unidade, sem misturar essa visao com as telas contextuais por tenant.

**Test Strategy:**

Executar `npm run lint` e testes do backoffice cobrindo unidade nova, origem do acesso e integracao entre seguranca e onboarding.

## Subtasks

### 18.1. Mapear onde a politica de novas unidades impacta o backoffice atual

**Status:** done  
**Dependencies:** None  

Identificar os pontos de UX em unidades, onboarding e seguranca que precisam refletir a nova regra.

**Details:**

Auditar `/admin/unidades`, `/admin/importacao-evo-p0` e as novas telas de `/admin/seguranca` para definir onde a elegibilidade de novas unidades deve ser visivel e editavel.

### 18.2. Exibir origem do acesso e elegibilidade no detalhe do usuario

**Status:** done  
**Dependencies:** 18.1  

Dar clareza ao superusuario sobre acesso herdado, manual e futuro.

**Details:**

Adicionar badges, secoes ou blocos informativos no detalhe do usuario para mostrar se o acesso a cada unidade e manual, propagado ou derivado de perfil, e se o usuario recebe acesso automatico em novas unidades.

### 18.3. Permitir editar a politica de novas unidades no backoffice de seguranca

**Status:** done  
**Dependencies:** 18.2  

Transformar a regra de propagacao em configuracao administrativa operavel.

**Details:**

Adicionar controles na tela de seguranca para ativar ou desativar a elegibilidade do usuario a novas unidades, com feedback claro e alinhamento ao contrato do backend.

### 18.4. Conectar a politica ao fluxo de cadastro e onboarding de unidade

**Status:** done  
**Dependencies:** 18.1, 18.3  

Fechar a ponta em que a unidade e criada e os acessos herdados aparecem na operacao.

**Details:**

Atualizar `/admin/unidades` e os pontos de onboarding para indicar que certos usuarios receberao acesso automatico na unidade nova e, quando aplicavel, permitir navegar para a trilha de seguranca apos a criacao.

### 18.5. Validar navegacao cruzada e consistencia do backoffice global

**Status:** done  
**Dependencies:** 18.2, 18.3, 18.4  

Garantir que seguranca, unidades e onboarding formem um fluxo administrativo coerente.

**Details:**

Cobrir em testes e checklist manual o caminho de criar unidade, visualizar acessos herdados, editar elegibilidade e voltar para a gestao global sem regressao de permissao ou contexto.
