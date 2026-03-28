# Claude Code Instructions

## Task Master AI Instructions
**Import Task Master's development workflow commands and guidelines, treat as if import is in the main CLAUDE.md file.**
@./.taskmaster/CLAUDE.md

## Regras de commit com Task Master

Ao finalizar uma task ou alterar status no Task Master, **sempre incluir `.taskmaster/tasks/tasks.json` no commit**.
Isso garante que o status das tasks persista entre sessões do Claude Code.

```bash
# Exemplo: ao commitar uma task finalizada
git add src/... .taskmaster/tasks/tasks.json
git commit -m "feat: descricao da task (Task XXX)"
```

Se o commit for exclusivamente de status de tasks (sem código), usar:
```bash
git add .taskmaster/tasks/tasks.json
git commit -m "chore(tasks): atualizar status das tasks"
```
