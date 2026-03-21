---
name: react-hook-form-default
description: Use esta skill ao criar, refatorar ou revisar formulários React neste projeto. Ela define `react-hook-form` como padrão e evita a introdução de formulários gerenciados manualmente sem justificativa.
---

## Objetivo
Padronizar formulários em React com `react-hook-form` para manter consistência, legibilidade e integração previsível com validação e componentes de UI.

## Regras
- Use `react-hook-form` por padrão em qualquer formulário novo.
- Ao refatorar um formulário existente, prefira migrar o gerenciamento de estado para `react-hook-form`.
- Evite `useState` por campo, `onChange` manual espalhado e lógica de submit acoplada ao JSX quando `react-hook-form` resolver o caso.
- Preserve o padrão de validação já existente no projeto. Se houver schema validation, conecte-a ao `react-hook-form` com o resolvedor apropriado.
- Mantenha compatibilidade com regras de SSR/hidratação do projeto. Valores dependentes do cliente não devem alterar o render inicial hidratável.

## Checklist
1. O formulário usa `useForm` e `handleSubmit`?
2. Os campos estão conectados por `register` ou `Controller` apenas quando necessário?
3. A validação segue o padrão já adotado no módulo?
4. O estado de erro, loading e submit está centralizado no fluxo do `react-hook-form`?
5. Houve introdução de lógica manual de formulário que poderia ser removida?

## Exceção
Se um formulário não puder usar `react-hook-form`, explicite a razão técnica na resposta final e minimize a divergência do padrão.
