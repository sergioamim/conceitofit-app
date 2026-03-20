# Task ID: 72

**Title:** Integrar permissões multiunidade e flags operacionais do colaborador

**Status:** done

**Dependencies:** 70, 71

**Priority:** high

**Description:** Refletir no frontend a distinção entre role/membership e flags operacionais locais como catraca e fora do horário.

**Details:**

A UI precisa deixar claro o que é perfil de acesso por unidade e o que é toggle operacional da ficha do colaborador, sem misturar as duas coisas na experiência.

Subtasks:
- 72.1 Distinguir visualmente acesso ao sistema e flags locais
- 72.2 Exibir memberships em outras unidades
- 72.3 Tratar bloqueio, inativação e desligamento
- 72.4 Aplicar guardas e mascaramento por sensibilidade

**Test Strategy:**

Cobrir cenários de colaborador sem acesso, com acesso em uma unidade e com memberships adicionais, além de bloqueios por permissão do operador atual.
