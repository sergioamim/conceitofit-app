# Task ID: 71

**Title:** Construir perfil completo do colaborador com abas operacionais

**Status:** done

**Dependencies:** 68 ✓, 69 ✓, 70 ✓

**Priority:** high

**Description:** Entregar a ficha detalhada do colaborador com blocos de cadastro, contratação, permissões, horário, informações e notificações.

**Details:**

O perfil detalhado deve organizar os dados de forma clara e operacional, permitindo edição progressiva de cadastro, endereço, documentos, emergência, contratação/salário/conta bancária, horários, permissões e notas internas.

**Test Strategy:**

Validar renderização por abas, edição de blocos, persistência incremental e controle de permissões para dados sensíveis.

## Subtasks

### 71.1. Implementar aba Cadastro

**Status:** done  
**Dependencies:** None  

Cobrir dados pessoais, contato, endereço e documentos básicos.

**Details:**

Construir os formulários da aba de cadastro com persistência alinhada ao modelo operacional do backend.

### 71.2. Implementar aba Contratação

**Status:** done  
**Dependencies:** 71.1  

Tratar salário, conta bancária e dados contratuais na fase 1.

**Details:**

Criar a superfície de contratação com admissão, demissão, tipo de contratação, salário, conta bancária/PIX e documentos profissionais relevantes.

### 71.3. Implementar aba Permissões

**Status:** done  
**Dependencies:** 71.1  

Exibir e editar o onboarding de acesso e memberships.

**Details:**

Permitir visualizar se existe usuário, perfil atual, status de convite, memberships por unidade e ações de bloqueio/reativação conforme o contrato do backend.

### 71.4. Implementar aba Horário

**Status:** done  
**Dependencies:** 71.2  

Tratar jornada semanal e previsibilidade operacional.

**Details:**

Adicionar edição de horários por dia da semana, estados vazios e mensagens explicando o impacto futuro em previsibilidade de folha.

### 71.5. Implementar abas Informações e Notificações

**Status:** done  
**Dependencies:** 71.1, 71.3  

Cobrir notas internas e preferências operacionais complementares.

**Details:**

Entregar superfície de anotações internas, observações e preferências de notificações expostas pelo backend.
