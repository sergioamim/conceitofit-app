# Guia de tipografia

Este app usa tres familias tipograficas no runtime web:

- `font-sans`: IBM Plex Sans. Deve ser a fonte padrao para texto de produto, tabelas, filtros, formularios, dialogs, labels, menus e conteudo operacional.
- `font-display`: Space Grotesk. Deve ficar restrita a titulos de pagina, titulos de secoes principais, nomes de cards de destaque e numeros grandes de KPI.
- `font-mono`: Geist Mono. Deve ser usada para CPF, CNPJ, IDs, codigos, tokens, chaves, horarios tabulares, valores em tabelas e recibos tecnicos.

## Regra pratica

Em telas operacionais similares, como clientes, contratos, pagamentos, financeiro, administrativo e backoffice, nao use `font-display` para labels pequenos, `DialogTitle`, celulas de tabela, nomes em listas compactas ou subtitulos internos de formulario. Esses elementos devem herdar `font-sans`.

Use `font-display` quando o texto cria hierarquia visual real:

- `h1` da pagina.
- `h2` de uma secao principal.
- KPI grande.
- Nome principal de uma entidade em header.

## Excecoes

- Storefront, paginas publicas e experiencias de marketing podem usar `font-display` com mais liberdade, desde que continuem usando as familias globais.
- Monitor/catraca e telas ambientais podem ter tratamento visual proprio.
- SVGs, wireframes e prototipos HTML legados nao definem padrao para o runtime Next.js.

## Guardrail automatizado

O teste `tests/unit/typography-guardrail.test.ts` bloqueia os casos mais comuns de regressao em areas operacionais:

- `font-display text-xs`, `font-display text-sm`, `font-display text-base`.
- `font-display text-[10px]` ate `font-display text-[16px]`.
- `DialogTitle` e `SheetTitle` com `font-display`.

Se uma tela precisar de excecao real, documente o motivo e adicione o arquivo na allowlist do teste.
