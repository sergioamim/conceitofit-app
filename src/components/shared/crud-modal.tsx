"use client";

import { useEffect, useId, type ReactNode } from "react";
import {
  useForm,
  Controller,
  FormProvider,
  type DefaultValues,
  type FieldValues,
  type Path,
} from "react-hook-form";
import { zodResolver } from "@/lib/forms/zod-resolver";
import { z, type ZodTypeAny } from "zod";
import { requiredTrimmedString } from "@/lib/forms/zod-helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  SuggestionInput,
  type SuggestionOption,
} from "@/components/shared/suggestion-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* ---------- FormFieldConfig ---------- */

export type FormFieldConfig = {
  name: string;
  label: string;
  type: "text" | "number" | "textarea" | "select" | "checkbox" | "suggestion";
  required?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: string;
  options?: { value: string; label: string }[];
  /** Extra class on the field wrapper */
  className?: string;
  /** For checkbox: label shown next to the checkbox */
  checkboxLabel?: string;
  /** For checkbox: helper text below */
  helperText?: string;
  /** For suggestion: static options list */
  suggestionOptions?: SuggestionOption[];
  /** For suggestion: campo auxiliar para exibir o label enquanto o valor salvo mantém o id */
  suggestionDisplayField?: string;
  /** For suggestion: async loader called on focus/type to populate options */
  onFocusOpen?: () => Promise<SuggestionOption[]> | void;
};

/* ---------- Props ---------- */

export type CrudModalProps<T extends FieldValues> = {
  open: boolean;
  onClose: () => void;
  onSave: (data: T, id?: string) => void;
  initial?: Partial<T> | null;
  initialId?: string;
  title: string;
  editTitle?: string;
  description?: string;
  editDescription?: string;
  fields: FormFieldConfig[];
  /** Override the auto-built zod schema */
  schema?: ZodTypeAny;
  /** Grid class for the fields container (default: "grid gap-4") */
  fieldsClassName?: string;
  /** DialogContent extra class */
  contentClassName?: string;
  /** Render extra content after the auto-generated fields (receives form context via FormProvider) */
  renderAfterFields?: () => ReactNode;
  /** Submit button labels */
  submitLabel?: string;
  editSubmitLabel?: string;
};

/* ---------- Build minimal zod schema from fields ---------- */

function buildSchemaFromFields(fields: FormFieldConfig[]): ZodTypeAny {
  const shape: Record<string, ZodTypeAny> = {};
  for (const field of fields) {
    if (field.type === "suggestion") {
      shape[field.name] = requiredTrimmedString(`Informe ${field.label.toLowerCase().replace(/\s*\*$/, "")}.`);
    } else if (field.required && (field.type === "text" || field.type === "textarea")) {
      shape[field.name] = requiredTrimmedString(`Informe ${field.label.toLowerCase().replace(/\s*\*$/, "")}.`);
    } else if (field.type === "checkbox") {
      shape[field.name] = z.boolean();
    } else {
      shape[field.name] = z.any();
    }
  }
  return z.object(shape).passthrough();
}

/* ---------- Field renderer ---------- */

function renderField<T extends FieldValues>(
  field: FormFieldConfig,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: ReturnType<typeof useForm<any>>,
  fieldId: string,
  isAutoFocus = false,
) {
  const { register, control, formState: { errors } } = form;
  const fieldPath = field.name as Path<T>;
  const displayFieldPath = field.suggestionDisplayField
    ? (field.suggestionDisplayField as Path<T>)
    : undefined;
  const error = errors[field.name];
  const errorId = `${fieldId}-error`;
  const helperTextId = `${fieldId}-helper`;
  const describedByIds = [
    error ? errorId : null,
    field.helperText ? helperTextId : null,
  ]
    .filter(Boolean)
    .join(" ");

  if (field.type === "checkbox") {
    return (
      <div key={field.name} className={field.className}>
        <label
          htmlFor={fieldId}
          className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
        >
          {field.label}
        </label>
        <div className="flex items-center gap-2 text-sm">
          <input
            id={fieldId}
            type="checkbox"
            autoFocus={isAutoFocus}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={describedByIds || undefined}
            {...register(fieldPath)}
          />
          {field.checkboxLabel ? (
            <label htmlFor={fieldId} className="cursor-pointer text-muted-foreground">
              {field.checkboxLabel}
            </label>
          ) : null}
        </div>
        {field.helperText ? (
          <p id={helperTextId} className="text-[11px] text-muted-foreground">
            {field.helperText}
          </p>
        ) : null}
        {error ? <p id={errorId} className="text-xs text-gym-danger">{String(error.message)}</p> : null}
      </div>
    );
  }

  if (field.type === "suggestion") {
    return (
      <div key={field.name} className={field.className ?? "space-y-1.5"}>
        <label
          htmlFor={fieldId}
          className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
        >
          {field.label}
        </label>
        <Controller
          control={control}
          name={fieldPath}
          render={({ field: controllerField }) => (
            <SuggestionInput
              inputId={fieldId}
              value={
                displayFieldPath
                  ? ((form.watch(displayFieldPath) as string) ?? "")
                  : ((controllerField.value as string) ?? "")
              }
              onValueChange={(value) => {
                if (displayFieldPath) {
                  controllerField.onChange("");
                  form.setValue(displayFieldPath, value as never, {
                    shouldDirty: true,
                    shouldValidate: false,
                  });
                  return;
                }

                controllerField.onChange(value);
              }}
              onSelect={(option) => {
                controllerField.onChange(option.id);
                if (displayFieldPath) {
                  form.setValue(displayFieldPath, option.label as never, {
                    shouldDirty: true,
                    shouldValidate: false,
                  });
                }
              }}
              options={field.suggestionOptions ?? []}
              onFocusOpen={field.onFocusOpen ? () => { field.onFocusOpen!(); } : undefined}
              placeholder={field.placeholder}
            />
          )}
        />
        {field.helperText ? (
          <p id={helperTextId} className="text-[11px] text-muted-foreground">
            {field.helperText}
          </p>
        ) : null}
        {error ? <p id={errorId} className="text-xs text-gym-danger">{String(error.message)}</p> : null}
      </div>
    );
  }

  if (field.type === "select" && field.options) {
    const labelId = `${fieldId}-label`;
    return (
      <div key={field.name} className={field.className ?? "space-y-1.5"}>
        <label
          id={labelId}
          htmlFor={fieldId}
          className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
        >
          {field.label}
        </label>
        <Controller
          control={control}
          name={fieldPath}
          render={({ field: controllerField }) => (
            <Select
              value={controllerField.value as string}
              onValueChange={(value) => controllerField.onChange(value)}
            >
              <SelectTrigger
                id={fieldId}
                autoFocus={isAutoFocus}
                aria-labelledby={labelId}
                aria-describedby={describedByIds || undefined}
                aria-invalid={error ? "true" : "false"}
                className="w-full border-border bg-secondary"
              >
                <SelectValue placeholder={field.placeholder ?? "Selecione"} />
              </SelectTrigger>
              <SelectContent className="border-border bg-card">
                {field.options!.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {field.helperText ? (
          <p id={helperTextId} className="text-[11px] text-muted-foreground">
            {field.helperText}
          </p>
        ) : null}
        {error ? <p id={errorId} className="text-xs text-gym-danger">{String(error.message)}</p> : null}
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <div key={field.name} className={field.className ?? "space-y-1.5"}>
        <label
          htmlFor={fieldId}
          className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
        >
          {field.label}
        </label>
        <Textarea
          id={fieldId}
          autoFocus={isAutoFocus}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={describedByIds || undefined}
          {...register(fieldPath)}
          placeholder={field.placeholder}
          className="border-border bg-secondary"
        />
        {field.helperText ? (
          <p id={helperTextId} className="text-[11px] text-muted-foreground">
            {field.helperText}
          </p>
        ) : null}
        {error ? <p id={errorId} className="text-xs text-gym-danger">{String(error.message)}</p> : null}
      </div>
    );
  }

  // text | number
  return (
    <div key={field.name} className={field.className ?? "space-y-1.5"}>
      <label
        htmlFor={fieldId}
        className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
      >
        {field.label}
      </label>
      <Input
        id={fieldId}
        autoFocus={isAutoFocus}
        type={field.type === "number" ? "number" : "text"}
        min={field.min}
        max={field.max}
        step={field.step}
        placeholder={field.placeholder}
        {...register(fieldPath)}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={describedByIds || undefined}
        className="border-border bg-secondary"
      />
      {field.helperText ? (
        <p id={helperTextId} className="text-[11px] text-muted-foreground">
          {field.helperText}
        </p>
      ) : null}
      {error ? <p id={errorId} className="text-xs text-gym-danger">{String(error.message)}</p> : null}
    </div>
  );
}

/* ---------- CrudModal ---------- */

export function CrudModal<T extends FieldValues>({
  open,
  onClose,
  onSave,
  initial,
  initialId,
  title,
  editTitle,
  description,
  editDescription,
  fields,
  schema,
  fieldsClassName,
  contentClassName,
  renderAfterFields,
  submitLabel,
  editSubmitLabel,
}: CrudModalProps<T>) {
  const isEditing = Boolean(initialId);
  const resolvedSchema = schema ?? buildSchemaFromFields(fields);
  const modalId = useId();
  const titleId = `${modalId}-title`;
  const descriptionId = `${modalId}-description`;
  const resolvedDescription = isEditing ? (editDescription ?? description) : description;

  // Build stable defaults for suggestion fields (always need a string default)
  const suggestionDefaults = fields.reduce<Record<string, string>>((acc, f) => {
    if (f.type === "suggestion") acc[f.name] = "";
    return acc;
  }, {});

  const form = useForm<T>({
    resolver: zodResolver(resolvedSchema),
    mode: "onChange",
    defaultValues: { ...suggestionDefaults, ...(initial ?? {}) } as DefaultValues<T>,
  });

  const { handleSubmit, reset } = form;

  useEffect(() => {
    reset({ ...suggestionDefaults, ...(initial ?? {}) } as DefaultValues<T>);
  }, [initial, open, reset]);

  function onSubmit(values: T) {
    onSave(values, initialId);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent
        className={contentClassName ?? "border-border bg-card sm:max-w-lg"}
        aria-describedby={resolvedDescription ? descriptionId : undefined}
      >
        <DialogHeader>
          <DialogTitle id={titleId} className="text-lg font-bold">
            {isEditing ? (editTitle ?? title) : title}
          </DialogTitle>
          {resolvedDescription ? (
            <DialogDescription id={descriptionId} className="sr-only">
              {resolvedDescription}
            </DialogDescription>
          ) : null}
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className={fieldsClassName ?? "grid gap-4 py-2"}>
              {fields.map((field, index) => renderField<T>(field, form, `${modalId}-${field.name}`, index === 0))}
              {renderAfterFields?.()}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} className="border-border">
                Cancelar
              </Button>
              <Button type="submit">
                {isEditing
                  ? (editSubmitLabel ?? "Salvar")
                  : (submitLabel ?? "Criar")}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
