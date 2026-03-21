# Task ID: 59

**Title:** Implementar a UX multiunidade do cliente orientada por contrato

**Status:** done

**Dependencies:** 57 ✓

**Priority:** high

**Description:** Fazer o app do cliente operar com tenant ativo elegível, e não com troca livre de unidade.

**Details:**

A experiência do cliente dentro da rede precisa respeitar a elegibilidade definida pelo contrato. Esta task fecha os fluxos em que o app precisa escolher, trocar ou bloquear a unidade ativa conforme os contratos vigentes, sempre mantendo a unidade-base estrutural separada da sessão.

**Test Strategy:**

Cobrir cenários de um tenant, vários tenants elegíveis, bloqueio total e troca manual de tenant ativo com testes funcionais.

## Subtasks

### 59.1. Modelar no frontend a lista de unidades elegíveis e seus motivos de bloqueio

**Status:** done  
**Dependencies:** None  

Consumir a decisão de elegibilidade do backend sem heurística local.

**Details:**

Criar tipagens e estados para representar unidades disponíveis, unidade ativa, unidade-base e motivos pelos quais uma unidade pode estar indisponível ao cliente.

### 59.2. Criar a UX de escolha e troca de unidade ativa quando houver múltiplas elegíveis

**Status:** done  
**Dependencies:** 59.1  

Permitir ao cliente mudar de contexto apenas dentro das opções autorizadas.

**Details:**

Desenhar o seletor ou fluxo de troca de unidade ativa para cenários multiunidade, com mensagens claras de disponibilidade e impacto da troca.

### 59.3. Tratar o caso de unidade única elegível com entrada direta e sem atrito

**Status:** done  
**Dependencies:** 59.1  

Evitar complexidade visual quando o contrato só libera uma unidade.

**Details:**

Garantir que clientes com apenas uma unidade elegível caiam direto no tenant ativo correto, sem seletor redundante.

### 59.4. Implementar o estado bloqueado para cliente autenticado sem elegibilidade operacional

**Status:** done  
**Dependencies:** 59.1  

Dar ao usuário uma saída clara quando a rede autentica, mas nenhum contrato permite operar.

**Details:**

Criar uma tela ou estado de bloqueio explicando ausência de contrato vigente, unidade não elegível ou impossibilidade temporária de uso.

### 59.5. Reconciliar as páginas operacionais do app com o tenant ativo elegível

**Status:** done  
**Dependencies:** 59.2, 59.3, 59.4  

Fazer home, reservas, financeiro e identidade respeitarem o contexto resolvido.

**Details:**

Ajustar leituras e ações do app para sempre usar o tenant ativo da sessão validado pelo contrato, atualizando caches e chamadas dependentes.

### 59.6. Cobrir a jornada multiunidade do cliente com regressão funcional

**Status:** done  
**Dependencies:** 59.2, 59.3, 59.4, 59.5  

Garantir estabilidade na combinação contrato + tenant ativo.

**Details:**

Adicionar testes para cliente com uma unidade, várias unidades, troca de contexto, estado bloqueado e persistência da unidade ativa entre telas.
