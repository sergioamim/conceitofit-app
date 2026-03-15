# Task ID: 5

**Title:** Construir reservas, vagas e operacao de aulas

**Status:** done

**Dependencies:** 1 ✓, 3 ✓

**Priority:** medium

**Description:** Criar as telas de backoffice e portal para reservas, lista de espera, ocupacao e check-in de aula.

**Details:**

Abrange agenda operacional, estados da reserva, ocupacao e visoes por atividade e turma.

**Test Strategy:**

No test strategy provided.

## Subtasks

### 5.1. Mapear UX e fluxos de agenda/reservas

**Status:** done  
**Dependencies:** None  

Definir jornadas de usuário para reservas, espera e ocupação.

**Details:**

Levantar requisitos com base na grade existente, desenhar fluxos para portal e backoffice, e especificar estados da reserva e transições.

### 5.2. Projetar modelo de dados e contratos de API

**Status:** done  
**Dependencies:** 5.1  

Especificar entidades e endpoints para booking e waitlist.

**Details:**

Definir schemas para aula, reserva, lista de espera, check-in e ocupação; documentar endpoints CRUD e ações de transição de estado.

### 5.3. Implementar serviços/API de reservas e waitlist

**Status:** done  
**Dependencies:** 5.2  

Construir serviços backend para criação e gestão de reservas.

**Details:**

Criar handlers para reservar, cancelar, promover da waitlist e consultar ocupação; integrar com regras de capacidade e horários.

### 5.4. Criar telas operacionais de reserva e check-in

**Status:** done  
**Dependencies:** 5.1, 5.3  

Desenvolver UI para reservar, cancelar e registrar presença.

**Details:**

Adicionar telas no portal/backoffice com listas por atividade/turma, ações rápidas e painéis de ocupação; integrar com os serviços criados.

### 5.5. Tratar estados, permissões e responsividade

**Status:** done  
**Dependencies:** 5.4  

Garantir consistência de estados e UX em diferentes dispositivos.

**Details:**

Implementar feedback de status, bloqueios por permissão, mensagens de erro/sucesso e ajustes responsivos para agenda operacional.

### 5.6. Adicionar testes de regressão do módulo

**Status:** done  
**Dependencies:** 5.3, 5.4, 5.5  

Cobrir fluxos críticos de reservas e check-in.

**Details:**

Criar testes para criação/cancelamento, promoção da waitlist e check-in, incluindo cenários de capacidade e estados inválidos.
