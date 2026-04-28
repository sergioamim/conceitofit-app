---
name: academia-frontend-form-guard
description: Use ao criar, refatorar ou revisar formulários no academia-app. Garante react-hook-form + zod, tratamento consistente de loading/erro/sucesso, segurança de hidratação SSR e exige confirmação de que o backend também valida o payload quando houver integração HTTP.
---

# Academia Frontend Form Guard

Use este skill quando a tarefa envolver:

- formulários novos ou refatorados em `academia-app`
- inputs, selects, wizards, dialogs de submit
- validação de dados antes de chamar API
- revisão de UX de erro, loading e estados de submit
- integração com endpoints consumidos por formulário

## Leitura mínima

Antes de editar, leia:

1. `AGENTS.md`
2. `src/lib/forms/README.md`
3. `src/lib/forms/zod-resolver.ts`
4. `src/lib/utils/api-error.ts`
5. `src/lib/api/http.ts`

Se a tela for SSR/App Router, releia também a seção `Next.js / React: Hydration Safety` do `AGENTS.md`.

## Regras obrigatórias

### 1. Padrão de formulário

- Use `react-hook-form`.
- Use `zod` + `zodResolver`.
- Co-localize o schema com o formulário ou domínio.
- Prefira tipos derivados do schema (`z.infer`, `z.input`, `z.output`) em vez de interfaces duplicadas.
- Não use `useState` campo a campo, salvo justificativa técnica explícita.

### 2. Estados de UX obrigatórios

Todo formulário deve tratar, de forma explícita:

- `loading` inicial, quando depende de carga remota
- `saving/submitting`
- `error` de submit
- `success` ou confirmação de conclusão, quando aplicável
- `disabled` durante submit e quando houver pré-condição faltando

Não esconda falhas silenciosamente.

### 3. Tratamento de erro

- Para erros de API, normalize com `normalizeErrorMessage`.
- Se o fluxo usar toast, banner inline ou erro por campo, mantenha consistência com o resto da área.
- Preserve erros de backend com `fieldErrors` quando existirem; não troque tudo por mensagem genérica sem necessidade.
- Mensagens do schema devem ser a fonte primária para erro local de validação.

### 4. Segurança de hidratação

Em UI SSR/hidratável:

- não usar `Date.now()`, `Math.random()`, `new Date()`, `crypto.randomUUID()` ou browser APIs no render inicial
- não criar árvore Radix diferente entre SSR e primeiro render do cliente
- se algo depender de browser, renderize fallback estável até `mount`

### 5. Contrato com backend

Validação de frontend nunca basta sozinha.

Se o formulário:

- cria novo payload
- muda shape de request
- altera semântica de campos
- passa a depender de novo erro por campo

então você deve confirmar que o backend também valida isso.

Regra prática:

1. encontre o endpoint/adapter em `src/lib/api/*`
2. confirme o repositório dono do contrato
3. se o dono for `academia-java`, leia ou ative o skill `academia-backend-validation-guard`
4. se a validação backend não existir, implemente ou registre blocker/follow-up explicitamente

Não aceite fluxo onde o frontend barra erro mas o backend aceitaria payload inválido.

## Checklist de implementação

- schema `zod` criado/ajustado
- `useForm` com `zodResolver`
- mensagens de erro locais legíveis
- loading/saving/error tratados
- submit protegido contra repetição
- fallback estável para SSR quando necessário
- endpoint e contrato revisados
- validação backend confirmada quando houver integração HTTP

## Checklist de validação antes de concluir

- rodar `npm run lint`
- rodar `npm run typecheck`
- rodar teste focado do form/schema quando a mudança justificar
- se houver integração com backend alterada, mencionar explicitamente se a validação server-side foi confirmada ou implementada

## Saída esperada

Ao finalizar a tarefa, explicite:

- se houve formulário novo/refatorado
- como erro/loading/sucesso foram tratados
- qual endpoint/backend foi afetado
- se a validação backend já existia, foi adicionada, ou ficou como pendência
