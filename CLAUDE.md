# Claude Code Instructions

## Idioma e estilo
- Responder e documentar em pt-BR, salvo pedido explícito diferente.
- Antes de editar, manter consistência com os padrões já existentes do projeto.

## Formulários
- Todo formulário novo ou refatorado deve usar `react-hook-form` + `zod` com `@hookform/resolvers/zod`.
- Schemas co-localizados por formulário/domínio, tipos inferidos via `z.infer` (não duplicar interfaces manuais).
- Evitar formulários controlados manualmente com `useState` campo a campo.
- Ao alterar formulários existentes, convergir para `react-hook-form` + `zodResolver`.

## Next.js / React: Hydration Safety
- **Nunca** usar `Date.now()`, `Math.random()`, `new Date()`, `crypto.randomUUID()` ou valores mutáveis durante render, `useMemo` de primeiro render, `useState(initializer)` SSR-compartilhado ou JSX que participa da hidratação.
- Não formatar datas no render com locale/timezone implícito quando o valor puder ser SSR+client. Usar: placeholder estável no SSR, formatação só após mount, ou valor já serializado do backend.
- Não usar `typeof window !== "undefined"` para trocar JSX entre SSR e primeiro render. Usar `useEffect` para hidratar estado com fallback estável.
- `localStorage`, `sessionStorage`, `window`, `document`, `matchMedia`, viewport, tempo atual → só após mount.
- Componentes Radix (`Tabs`, `Select`, `Dialog`): manter árvore idêntica SSR/client. Não condicionar nós internos com dados client-only.

### Checklist antes de concluir mudanças em UI SSR
- Procurar: `Date.now(`, `Math.random(`, `new Date(`, `typeof window`, `localStorage`, `sessionStorage`, `crypto.randomUUID`
- Verificar nós Radix (mesma quantidade/ordem SSR vs client)
- Dados client-only → garantir fallback estável antes do mount

### Regra prática
- Valores dinâmicos (tempo/aleatoriedade): permitidos em handlers, efeitos, polling e submit. **Proibidos no render inicial hidratável.**

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
