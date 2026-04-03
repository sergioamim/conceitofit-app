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

## Skills e Plugins Disponíveis

Skills e plugins instalados globalmente (`~/.claude/plugins/`) devem ser usados proativamente. A fonte de verdade é o diretório de plugins — não duplicar skills aqui, apenas referenciar quando usar cada uma.

### Uso obrigatório (invocar automaticamente)

| Skill | Quando usar |
|-------|-------------|
| `simplify` | Após concluir qualquer implementação de código significativa (>50 linhas alteradas). Revisar reuso, qualidade e eficiência. |
| `next-best-practices` | Ao criar ou modificar file conventions, RSC boundaries, data patterns, metadata, route handlers, image/font optimization. |
| `next-cache-components` | Ao trabalhar com PPR, `use cache`, `cacheLife`, `cacheTag`, `updateTag` no Next.js 16. |
| `neon-postgres` | Ao trabalhar com qualquer coisa relacionada a Neon, Postgres, migrations ou conexões de banco. |
| `code-review` | Antes de marcar uma task como done, executar code review automatizado no diff. |

### Uso sob demanda (invocar quando solicitado ou relevante)

| Skill | Quando usar |
|-------|-------------|
| `tm:*` (Task Master) | Gerenciamento de tasks — já documentado em `.taskmaster/CLAUDE.md`. |
| `claude-api` | Quando o código importar `anthropic`, `@anthropic-ai/sdk` ou `claude_agent_sdk`. |
| `anthropic-skills:pdf` | Qualquer operação com arquivos PDF. |
| `anthropic-skills:xlsx` | Qualquer operação com planilhas. |
| `anthropic-skills:pptx` | Qualquer operação com apresentações. |
| `anthropic-skills:docx` | Qualquer operação com documentos Word. |
| `anthropic-skills:schedule` | Criar tarefas agendadas ou triggers remotos. |
| `anthropic-skills:skill-creator` | Criar, editar ou testar skills customizadas. |
| `loop` | Quando o usuário pedir polling, execução recorrente ou monitoramento contínuo. |
| `schedule` | Quando o usuário quiser agendar agentes remotos ou cron jobs. |

### Plugins globais disponíveis (referência)

Fonte: `~/.claude/plugins/marketplaces/claude-plugins-official/plugins/`

- **feature-dev** — Workflow de feature com agents de exploração, arquitetura e review.
- **code-simplifier** — Agent que simplifica código para clareza e manutenibilidade.
- **hookify** — Criar hooks para prevenir comportamentos indesejados.
- **playground** — Criar playgrounds HTML interativos single-file.
- **plugin-dev** — Toolkit para criar plugins, skills, commands, hooks e MCP.
- **mcp-server-dev** — Skills para construir MCP servers.
- **claude-md-management** — Auditar e melhorar CLAUDE.md files.
- **claude-code-setup** — Analisar codebases e recomendar automações.
- **pr-review-toolkit** — Review de PRs com agentes especializados.
- **security-guidance** — Alertas de segurança ao editar arquivos.
- **math-olympiad** — Resolver problemas de competição matemática.

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
