# Task ID: 81

**Title:** Adotar Zod como padrão de schema para formulários

**Status:** done

**Dependencies:** 79 ✓

**Priority:** high

**Description:** Introduzir `zod` e `@hookform/resolvers` como padrão oficial de validação de schemas para os formulários baseados em `react-hook-form`.

**Details:**

Adicionar `zod` e `@hookform/resolvers` como dependências diretas do frontend, alinhar a documentação/guardrails do repositório e preparar a infraestrutura mínima para uso consistente do `zodResolver` em formulários novos e refatorados. Mapear um padrão de organização para schemas de formulário, mensagens de erro e tipos inferidos, evitando drift entre interface TypeScript e regras de validação. Definir helpers ou convenções leves apenas onde fizer sentido, sem introduzir abstrações genéricas que escondam o schema real do formulário.

**Test Strategy:**

Validar que as dependências foram adicionadas corretamente, que o projeto continua compilando/lintando e que existe ao menos uma cobertura unitária simples exercitando um schema `zod` integrado ao `react-hook-form`.

## Subtasks

### 81.1. Adicionar dependências e consolidar a diretriz no repositório

**Status:** done  
**Dependencies:** None  

Adicionar `zod` e `@hookform/resolvers` ao projeto e atualizar os guardrails/documentação para explicitar o uso de `react-hook-form` + `zodResolver`.

**Details:**

Adicionar `zod` e `@hookform/resolvers` ao projeto e atualizar os guardrails/documentação para explicitar o uso de `react-hook-form` + `zodResolver`.

### 81.2. Definir convenção de organização dos schemas

**Status:** done  
**Dependencies:** 81.1  

Documentar onde os schemas devem ficar, como nomear `schema/input/output` e quando usar `z.infer` em vez de tipos manuais.

**Details:**

Documentar onde os schemas devem ficar, como nomear `schema/input/output` e quando usar `z.infer` em vez de tipos manuais.

### 81.3. Criar um exemplo-base validado no frontend

**Status:** done  
**Dependencies:** 81.1  

Adicionar um exemplo ou helper mínimo no código para servir de referência de integração entre `react-hook-form`, `zodResolver` e mensagens de erro.

**Details:**

Adicionar um exemplo ou helper mínimo no código para servir de referência de integração entre `react-hook-form`, `zodResolver` e mensagens de erro.
