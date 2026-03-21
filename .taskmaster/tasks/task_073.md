# Task ID: 73

**Title:** Fechar contratos, testes e rollout frontend do modulo de colaboradores

**Status:** done

**Dependencies:** 69 ✓, 70 ✓, 71 ✓, 72 ✓

**Priority:** medium

**Description:** Garantir que a nova trilha de colaboradores fique estável, testada e alinhada ao rollout do backend.

**Details:**

Consolidar tipos, clients, estados, testes e documentação da experiência de colaboradores, cobrindo também a adaptação gradual da UI atual enquanto o backend evolui.

**Test Strategy:**

Executar lint, testes de componentes/integracao aplicáveis e smoke tests das rotas administrativas de colaboradores.

## Subtasks

### 73.1. Consolidar tipos e schemas compartilhados do frontend

**Status:** done  
**Dependencies:** None  

Padronizar o modelo tipado de colaborador na app web.

**Details:**

Revisar tipos, zod schemas e helpers usados nas superfícies de colaboradores para evitar duplicidade e drift de contrato.

### 73.2. Adicionar testes dos fluxos críticos

**Status:** done  
**Dependencies:** 73.1  

Cobrir criação, edição e status do colaborador.

**Details:**

Criar testes para listagem, cadastro sem acesso, cadastro com acesso, edição de contratação e mudanças de estado/permissão.

### 73.3. Planejar compatibilidade com telas atuais

**Status:** done  
**Dependencies:** 73.1, 73.2  

Garantir transição sem quebra para operadores.

**Details:**

Mapear o que permanece da UI atual, o que será substituído e quais adaptadores temporários de contrato/estado são necessários.

### 73.4. Documentar checklist de rollout da UI

**Status:** done  
**Dependencies:** 73.2, 73.3  

Registrar dependências de backend e passos de validação.

**Details:**

Descrever pré-requisitos de API, flags, permissões, smoke tests e ordem de ativação da nova experiência de colaboradores no backoffice.
