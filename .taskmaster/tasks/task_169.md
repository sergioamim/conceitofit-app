# Task ID: 169

**Title:** Persistir tasks.json nos commits de tasks

**Status:** done

**Dependencies:** None

**Priority:** medium

**Description:** Mudancas de status no Task Master nao sao commitadas automaticamente, revertendo entre sessoes.

**Details:**

Documentar no CLAUDE.md que ao finalizar tasks deve-se incluir .taskmaster/tasks/tasks.json no commit. Avaliar criar script npm que faca auto-stage do tasks.json.

**Test Strategy:**

Apos fechar task e commitar, status persiste em nova sessao.
