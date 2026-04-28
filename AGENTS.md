#    AGENTS.md

Este arquivo define guardrails para agentes de IA neste repositório.

## Idioma e estilo
- Responder e documentar em pt-BR, salvo pedido explícito diferente.
- Antes de editar, manter consistência com os padrões já existentes do projeto.

## Formulários
- Por padrão, todo formulário novo ou refatorado deve usar `react-hook-form`.
- Para validação de esquema, o padrão do repositório passa a ser `zod` com `@hookform/resolvers/zod`.
- Preferir schemas co-localizados por formulário ou domínio, com tipos inferidos via `z.infer`, evitando duplicar interfaces manuais quando o schema já for a fonte de verdade.
- Evitar formulários controlados manualmente com `useState` campo a campo, exceto quando houver justificativa técnica clara e documentada na resposta.
- Ao alterar formulários existentes, preferir convergir para `react-hook-form` em vez de introduzir um segundo padrão.
- Ao alterar formulários existentes, preferir convergir para `react-hook-form` + `zodResolver` em vez de manter validações ad hoc em handlers, helpers soltos ou estado local por campo.
- Para tarefas de frontend que criem ou refatorem formulários, preferir ativar o skill local `academia-frontend-form-guard` em `.codex/skills/academia-frontend-form-guard/SKILL.md`.
- Validação no frontend nunca substitui validação de entrada no backend. Se o formulário introduzir ou alterar payload/semântica de API, revisar também o guardrail backend correspondente no repositório `academia-java`.

## Next.js / React: Hydration Safety
- Nunca usar `Date.now()`, `Math.random()`, `new Date()`, `crypto.randomUUID()`, UUIDs aleatórios ou qualquer valor mutável durante `render`, `useMemo` de primeiro render, `useState(initializer)` SSR-compartilhado ou JSX que participa da hidratação.
- Nunca formatar datas no `render` com locale/timezone implícito quando o valor puder ser renderizado no servidor e no cliente. Se a formatação depender do navegador:
  - renderize placeholder estável no SSR; ou
  - faça a formatação só após mount; ou
  - use valor já serializado do backend.
- Não usar `typeof window !== "undefined"` para trocar trechos de JSX entre SSR e primeiro render do cliente. Se o conteúdo depender de browser:
  - use `useEffect` para hidratar estado; e
  - enquanto não montar, renderize fallback estável.
- `localStorage`, `sessionStorage`, `window`, `document`, `matchMedia`, viewport, tempo atual e extensões do browser só podem influenciar UI após mount.
- Para componentes Radix (`Tabs`, `Select`, `Dialog`, etc.), manter a árvore idêntica entre SSR e primeiro render do cliente. Não condicionar `TabsTrigger`, `TabsContent`, `SelectItem` ou similares com dados só do cliente.
- Se uma área inteira depender de estado do browser, proteger o bloco inteiro com flag de mount; não proteger nós internos de forma assimétrica.

## Checklist obrigatório antes de concluir mudanças em UI SSR
- Procurar no arquivo alterado por:
  - `Date.now(`
  - `Math.random(`
  - `new Date(`
  - `typeof window`
  - `localStorage`
  - `sessionStorage`
  - `crypto.randomUUID`
- Se houver `Tabs`, `Select`, `Accordion`, `Dialog` ou componentes com IDs gerados, verificar se a quantidade/ordem dos nós é a mesma no SSR e no primeiro render do cliente.
- Se houver dados client-only, garantir fallback estável antes do mount.

## Regra prática
- Valores dinâmicos de tempo/aleatoriedade:
  - permitidos em handlers, efeitos, polling e ações de submit.
  - proibidos no render inicial hidratável.

## Preferência de implementação
- Para placeholders, labels temporais e aliases sugeridos, preferir texto estável no render.
- Se precisar enriquecer a UI com contexto do cliente, fazer isso depois do mount ou no momento da ação do usuário.

---

<!-- AIOX-MANAGED SECTIONS -->
<!-- These sections are managed by AIOX. Edit content between markers carefully. -->
<!-- Your custom content above will be preserved during updates. -->

<!-- AIOX-MANAGED-START: core -->
## Core Rules

1. Siga a Constitution em `.aiox-core/constitution.md`
2. Priorize `CLI First -> Observability Second -> UI Third`
3. Trabalhe por stories em `docs/stories/`
4. Nao invente requisitos fora dos artefatos existentes
<!-- AIOX-MANAGED-END: core -->

<!-- AIOX-MANAGED-START: quality -->
## Quality Gates

- Rode `npm run lint`
- Rode `npm run typecheck`
- Rode `npm test`
- Atualize checklist e file list da story antes de concluir
<!-- AIOX-MANAGED-END: quality -->

<!-- AIOX-MANAGED-START: codebase -->
## Project Map

- Core framework: `.aiox-core/`
- CLI entrypoints: `bin/`
- Shared packages: `packages/`
- Tests: `tests/`
- Docs: `docs/`
<!-- AIOX-MANAGED-END: codebase -->

<!-- AIOX-MANAGED-START: commands -->
## Common Commands

- `npm run sync:ide`
- `npm run sync:ide:check`
- `npm run sync:skills:codex`
- `npm run sync:skills:codex:global` (opcional; neste repo o padrao e local-first)
- `npm run validate:structure`
- `npm run validate:agents`
<!-- AIOX-MANAGED-END: commands -->

<!-- AIOX-MANAGED-START: shortcuts -->
## Agent Shortcuts

Preferencia de ativacao no Codex CLI:
1. Use `/skills` e selecione `aiox-<agent-id>` vindo de `.codex/skills` (ex.: `aiox-architect`)
2. Se preferir, use os atalhos abaixo (`@architect`, `/architect`, etc.)

Interprete os atalhos abaixo carregando o arquivo correspondente em `.aiox-core/development/agents/` (fallback: `.codex/agents/`), renderize o greeting via `generate-greeting.js` e assuma a persona ate `*exit`:

- `@architect`, `/architect`, `/architect.md` -> `.aiox-core/development/agents/architect.md`
- `@dev`, `/dev`, `/dev.md` -> `.aiox-core/development/agents/dev.md`
- `@qa`, `/qa`, `/qa.md` -> `.aiox-core/development/agents/qa.md`
- `@pm`, `/pm`, `/pm.md` -> `.aiox-core/development/agents/pm.md`
- `@po`, `/po`, `/po.md` -> `.aiox-core/development/agents/po.md`
- `@sm`, `/sm`, `/sm.md` -> `.aiox-core/development/agents/sm.md`
- `@analyst`, `/analyst`, `/analyst.md` -> `.aiox-core/development/agents/analyst.md`
- `@devops`, `/devops`, `/devops.md` -> `.aiox-core/development/agents/devops.md`
- `@data-engineer`, `/data-engineer`, `/data-engineer.md` -> `.aiox-core/development/agents/data-engineer.md`
- `@ux-design-expert`, `/ux-design-expert`, `/ux-design-expert.md` -> `.aiox-core/development/agents/ux-design-expert.md`
- `@squad-creator`, `/squad-creator`, `/squad-creator.md` -> `.aiox-core/development/agents/squad-creator.md`
- `@aiox-master`, `/aiox-master`, `/aiox-master.md` -> `.aiox-core/development/agents/aiox-master.md`
<!-- AIOX-MANAGED-END: shortcuts -->
