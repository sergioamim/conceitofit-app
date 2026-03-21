# Task ID: 72

**Title:** Integrar permissões multiunidade e flags operacionais do colaborador

**Status:** done

**Dependencies:** 70 ✓, 71 ✓

**Priority:** high

**Description:** Refletir no frontend a distinção entre role/membership e flags operacionais locais como catraca e fora do horário.

**Details:**

A UI precisa deixar claro o que é perfil de acesso por unidade e o que é toggle operacional da ficha do colaborador, sem misturar as duas coisas na experiência.

**Test Strategy:**

Cobrir cenários de colaborador sem acesso, com acesso em uma unidade e com memberships adicionais, além de bloqueios por permissão do operador atual.

## Subtasks

### 72.1. Distinguir visualmente acesso ao sistema e flags locais

**Status:** done  
**Dependencies:** None  

Evitar confusão semântica na UI.

**Details:**

Separar na interface o que é perfil de acesso/auth e o que é catraca, fora do horário, teclado e ministrar aulas.

### 72.2. Exibir memberships em outras unidades

**Status:** done  
**Dependencies:** 72.1  

Mostrar o alcance multiunidade do colaborador quando existir.

**Details:**

Adicionar leitura e gestão visual dos memberships adicionais retornados pelo backend, com contexto claro da unidade principal.

### 72.3. Tratar bloqueio, inativação e desligamento

**Status:** done  
**Dependencies:** 72.1, 72.2  

Refletir os estados operacionais na UI sem ambiguidade.

**Details:**

Exibir status, ações disponíveis, confirmações e efeitos práticos sobre acesso/login em cada estado do colaborador.

### 72.4. Aplicar guardas e mascaramento por sensibilidade

**Status:** done  
**Dependencies:** 72.1, 72.2, 72.3  

Restringir o que operadores sem permissão podem ver ou editar.

**Details:**

Proteger salario, conta bancaria e operacoes de acesso conforme as permissoes do operador logado e o contrato backend.
