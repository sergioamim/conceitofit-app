# Task ID: 261

**Title:** Automação de cadências no CRM

**Status:** done

**Dependencies:** 260 ✓

**Priority:** medium

**Description:** Pipeline, tarefas e playbooks existem como UI mas sem execução automática de cadências.

**Details:**

Implementar engine de cadências: ao prospect entrar em estágio X, criar tarefas automáticas com prazos. Ao task vencer sem ação, escalar ou mover prospect. Cadências definidas nos playbooks existentes. Backend precisa de scheduler/cron para verificar prazos.

**Test Strategy:**

Prospect novo gera tarefas automáticas conforme playbook. Tarefa vencida escalona.
