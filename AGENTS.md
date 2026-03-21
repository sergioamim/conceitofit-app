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
