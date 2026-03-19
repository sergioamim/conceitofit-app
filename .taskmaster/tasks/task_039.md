# Task ID: 39

**Title:** Estruturar ocorrências avulsas para atividades sob demanda

**Status:** done

**Dependencies:** 38 ✓

**Priority:** high

**Description:** Fechar o modelo funcional e técnico para que atividades `SOB_DEMANDA` virem catálogo de ocorrências avulsas, com fluxo administrativo claro e alinhado ao backend.

**Details:**

Hoje o frontend diferencia `PREVIAMENTE` e `SOB_DEMANDA` na grade, mas só o modo recorrente possui um fluxo operacional completo. A aplicação precisa separar com clareza modalidade, recorrência e sessão concreta, permitindo que grades `SOB_DEMANDA` gerem ocorrências manuais para datas específicas sem poluir a grade semanal nem depender de comportamento implícito do backend.

**Test Strategy:**

Cobrir a trilha com testes de integração/E2E do fluxo administrativo de criação de ocorrência sob demanda e sua aparição em reservas, além de validar que a grade semanal continua exibindo apenas ocorrências recorrentes `PREVIAMENTE`.

## Subtasks

### 39.1. Fechar o modelo funcional de `SOB_DEMANDA` no frontend

**Status:** done  
**Dependencies:** None  

Documentar e refletir no backlog que `SOB_DEMANDA` não significa uso único, e sim catálogo para gerar ocorrências avulsas.

**Details:**

Usar `docs/ATIVIDADES_SOB_DEMANDA_OCORRENCIAS_PRD.md` para consolidar o modelo de produto nas superfícies afetadas (`/administrativo/atividades-grade`, `/grade`, `/reservas`) e remover ambiguidades entre recorrência fixa, evento esporádico e sessão concreta.

### 39.2. Desenhar a superfície administrativa de criação de ocorrência

**Status:** done  
**Dependencies:** 39.1  

Definir a ação e a UX para transformar uma grade `SOB_DEMANDA` em sessão concreta.

**Details:**

Projetar CTA, modal/formulário e estados de sucesso/erro para `Criar ocorrência`, incluindo data, hora, capacidade, local, instrutor e herança de configurações operacionais. Revisar onde essa ação vive melhor: na linha da grade, em drawer dedicado ou em tela de ocorrências.

### 39.3. Alinhar clients, types e contrato HTTP com o backend

**Status:** done  
**Dependencies:** 39.2  

Preparar a camada frontend para o endpoint de criação/listagem de ocorrências sob demanda.

**Details:**

Atualizar `src/lib/types.ts`, `src/lib/api/reservas.ts`, `src/lib/api/administrativo.ts` e superfícies consumidoras para suportar sessões avulsas ligadas a grades `SOB_DEMANDA`, preservando compatibilidade com o fluxo atual de reservas e com sessões recorrentes.

### 39.4. Integrar grade, agenda e reservas ao fluxo de ocorrência avulsa

**Status:** done  
**Dependencies:** 39.3  

Conectar a criação da ocorrência ao consumo em agenda e reservas.

**Details:**

Fazer com que a ocorrência criada apareça em `/reservas` e nas demais superfícies de agenda publicáveis, mantendo a matriz semanal de `/grade` restrita a `PREVIAMENTE`. Revisar listagem, filtros e feedback visual para evitar que itens `SOB_DEMANDA` pareçam cadastros incompletos.

### 39.5. Validar regressão e fechar alinhamento documental com backend

**Status:** done  
**Dependencies:** 39.4  

Fechar testes e a trilha de alinhamento entre frontend e backend.

**Details:**

Adicionar cobertura de testes para criação da ocorrência e consumo em reservas, e registrar o contrato esperado para o backend com critérios de aceite compartilhados. Garantir consistência entre PRD, backlog e prompt de handoff para o repositório Java.
