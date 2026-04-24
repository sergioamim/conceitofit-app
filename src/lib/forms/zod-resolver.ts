import { zodResolver as baseZodResolver } from "@hookform/resolvers/zod";
import type { FieldValues, Resolver } from "react-hook-form";

/**
 * Wrapper de compatibilidade do `zodResolver` para o upgrade
 * `@hookform/resolvers` 3.x → 5.x.
 *
 * A assinatura nova é `zodResolver<Input, Context, Output>(schema)` e retorna
 * `Resolver<Input, Context, Output>`. Em schemas com `.default()`,
 * `.coerce()` ou `.transform()`, `Output` difere de `Input` e isso choca com
 * a forma antiga `useForm<T>({ resolver: zodResolver(schema) })` — que
 * assumia `Input === Output`.
 *
 * Este wrapper força o return para `Resolver<T, unknown, T>`, preservando o
 * contrato legado sem precisar editar 60+ forms. Em runtime é idêntico ao
 * `zodResolver` original, apenas elimina o ruído de tipo na migração.
 *
 * Para novos forms que usem `.transform()` ou saída tipada, importe o
 * `zodResolver` diretamente de `@hookform/resolvers/zod`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function zodResolver<T extends FieldValues>(schema: any): Resolver<T, unknown, T> {
  return baseZodResolver(schema) as unknown as Resolver<T, unknown, T>;
}
