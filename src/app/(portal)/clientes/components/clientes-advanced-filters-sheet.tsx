"use client";

import { useEffect, useState } from "react";
import { Controller, type Control, useForm } from "react-hook-form";
import { Filter } from "lucide-react";
import { zodResolver } from "@/lib/forms/zod-resolver";
import {
  clienteAdvancedFiltersSchema,
  clienteAdvancedFormValuesToQueryParams,
  getDefaultClienteAdvancedFilterValues,
  type ClienteAdvancedFiltersFormValues,
} from "@/lib/tenant/comercial/clientes-filters";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface ClientesAdvancedFiltersSheetProps {
  values: ClienteAdvancedFiltersFormValues;
  activeCount: number;
  onApply: (params: Record<string, string | null>) => void;
}

type SelectOption = {
  value: string;
  label: string;
};

const FINANCEIRO_OPTIONS: SelectOption[] = [
  { value: "TODOS", label: "Todos" },
  { value: "COM_PENDENCIA", label: "Com pendência" },
  { value: "SEM_PENDENCIA", label: "Sem pendência" },
];

const AGREGADOR_OPTIONS: SelectOption[] = [
  { value: "TODOS", label: "Todos" },
  { value: "COM_AGREGADOR", label: "Com agregador" },
  { value: "WELLHUB", label: "Wellhub" },
  { value: "TOTALPASS", label: "TotalPass" },
];

const RESPONSAVEL_OPTIONS: SelectOption[] = [
  { value: "TODOS", label: "Todos" },
  { value: "COM_RESPONSAVEL", label: "Com responsável" },
  { value: "SEM_RESPONSAVEL", label: "Sem responsável" },
];

const ACESSO_OPTIONS: SelectOption[] = [
  { value: "TODOS", label: "Todos" },
  { value: "BLOQUEADO", label: "Bloqueado" },
  { value: "LIBERADO", label: "Liberado" },
];

export function ClientesAdvancedFiltersSheet({
  values,
  activeCount,
  onApply,
}: ClientesAdvancedFiltersSheetProps) {
  const [open, setOpen] = useState(false);
  const form = useForm<ClienteAdvancedFiltersFormValues>({
    resolver: zodResolver(clienteAdvancedFiltersSchema),
    defaultValues: values,
  });

  useEffect(() => {
    form.reset(values);
  }, [form, values]);

  function handleSubmit(nextValues: ClienteAdvancedFiltersFormValues) {
    onApply(clienteAdvancedFormValuesToQueryParams(nextValues));
    setOpen(false);
  }

  function handleClear() {
    const defaults = getDefaultClienteAdvancedFilterValues();
    form.reset(defaults);
    onApply(clienteAdvancedFormValuesToQueryParams(defaults));
    setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative h-10 w-10 rounded-xl border-border bg-secondary"
          aria-label="Abrir filtros avançados"
        >
          <Filter className="size-4" />
          {activeCount > 0 ? (
            <span className="absolute -right-1.5 -top-1.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-gym-accent px-1 text-[10px] font-bold text-white">
              {activeCount}
            </span>
          ) : null}
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full border-border bg-card sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Filtros avançados</SheetTitle>
        </SheetHeader>

        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="mt-6 flex h-full flex-col"
        >
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-secondary/40 p-4">
              <p className="text-sm font-semibold text-foreground">
                Situação comercial
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Refinar clientes com pendência, vínculo com agregador e acesso.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FilterSelectField
                control={form.control}
                name="financeiro"
                label="Pendência financeira"
                options={FINANCEIRO_OPTIONS}
              />
              <FilterSelectField
                control={form.control}
                name="agregador"
                label="Agregador"
                options={AGREGADOR_OPTIONS}
              />
              <FilterSelectField
                control={form.control}
                name="responsavel"
                label="Responsável"
                options={RESPONSAVEL_OPTIONS}
              />
              <FilterSelectField
                control={form.control}
                name="acesso"
                label="Acesso"
                options={ACESSO_OPTIONS}
              />
            </div>
          </div>

          <SheetFooter className="mt-auto border-t border-border pt-5 sm:justify-between">
            <Button
              type="button"
              variant="outline"
              className="border-border"
              onClick={handleClear}
            >
              Limpar avançados
            </Button>
            <Button type="submit">Aplicar filtros</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function FilterSelectField({
  control,
  name,
  label,
  options,
}: {
  control: Control<ClienteAdvancedFiltersFormValues>;
  name: keyof ClienteAdvancedFiltersFormValues;
  label: string;
  options: SelectOption[];
}) {
  return (
    <div className="space-y-2 rounded-2xl border border-border/70 bg-card p-3">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger className="border-border bg-secondary/80">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-border bg-card">
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
    </div>
  );
}
