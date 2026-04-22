"use client";

/**
 * AG-7.9 — Renderer de uma flag individual do schema de agregador.
 *
 * Extraído do sheet para manter o componente principal sob o limite de
 * linhas. Suporta os tipos `boolean`, `enum`, `string` e `number`.
 */
import { Controller, type Control, type UseFormRegister } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AgregadorSchemaFlag } from "@/lib/api/agregadores-admin";
import type { AgregadorConfigFormValues } from "./agregador-config-schema";

export interface AgregadorFlagFieldProps {
  flag: AgregadorSchemaFlag;
  control: Control<AgregadorConfigFormValues>;
  register: UseFormRegister<AgregadorConfigFormValues>;
}

export function AgregadorFlagField({
  flag,
  control,
  register,
}: AgregadorFlagFieldProps) {
  const fieldId = `agregador-flag-${flag.key}`;
  const label = flag.label ?? flag.key;

  if (flag.type === "boolean") {
    return (
      <div className="flex items-start gap-3">
        <Controller
          control={control}
          name={flag.key}
          render={({ field }) => (
            <Checkbox
              id={fieldId}
              checked={Boolean(field.value)}
              onCheckedChange={(v) => field.onChange(v === true)}
              data-testid={fieldId}
            />
          )}
        />
        <Label htmlFor={fieldId} className="cursor-pointer">
          {label}
        </Label>
      </div>
    );
  }

  if (flag.type === "enum") {
    const options = flag.options ?? [];
    return (
      <div className="space-y-1.5">
        <Label htmlFor={fieldId}>{label}</Label>
        <Controller
          control={control}
          name={flag.key}
          render={({ field }) => (
            <Select
              value={typeof field.value === "string" ? field.value : ""}
              onValueChange={field.onChange}
            >
              <SelectTrigger
                id={fieldId}
                className="w-full"
                data-testid={fieldId}
              >
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {options.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={fieldId}>{label}</Label>
      <Input
        id={fieldId}
        type={flag.type === "number" ? "number" : "text"}
        autoComplete="off"
        data-testid={fieldId}
        {...register(flag.key)}
      />
    </div>
  );
}
