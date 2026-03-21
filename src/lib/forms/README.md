# Formulários com Zod

Convenção do projeto para formulários baseados em `react-hook-form`:

- O schema deve ficar no mesmo domínio funcional do formulário ou em `src/lib/forms` quando houver reaproveitamento real entre tela, serviço e testes.
- Nomeie explicitamente `algumFormularioSchema`, `AlgumFormularioInput` e `AlgumFormularioOutput` quando o schema for exportado.
- Para o tipo do formulário, prefira `z.input<typeof algumFormularioSchema>` quando a UI ainda trabalha com strings/brutos do input.
- Para payloads normalizados, prefira `z.output<typeof algumFormularioSchema>` quando houver transformação/coerção no schema.
- `z.infer` continua aceitável quando input e output forem idênticos e o tipo não for exportado para fora do arquivo.
- Mensagens de erro do schema devem ser a fonte primária da UX; validações adicionais no submit só devem existir para regras dependentes de contexto externo ou compatibilidade de payload.
