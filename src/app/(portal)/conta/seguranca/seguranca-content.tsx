"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { applyApiFieldErrors, buildFormApiErrorMessage } from "@/lib/forms/api-form-errors";
import { zodResolver } from "@/lib/forms/zod-resolver";
import { changePasswordApi } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
  trocarSenhaSchema,
  type TrocarSenhaFormValues,
} from "@/lib/forms/perfil-aluno-schemas";

export function SegurancaContent() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<TrocarSenhaFormValues>({
    resolver: zodResolver(trocarSenhaSchema),
    defaultValues: {
      senhaAtual: "",
      novaSenha: "",
      confirmarSenha: "",
    },
  });

  async function handleSubmit(values: TrocarSenhaFormValues) {
    setSaving(true);
    setSubmitError(null);
    form.clearErrors();

    try {
      const response = await changePasswordApi({
        currentPassword: values.senhaAtual,
        newPassword: values.novaSenha,
        confirmNewPassword: values.confirmarSenha,
      });
      toast({ title: response.message });
      form.reset();
    } catch (error) {
      const fieldResult = applyApiFieldErrors(error, form.setError, {
        mapField: {
          currentPassword: "senhaAtual",
          senhaAtual: "senhaAtual",
          newPassword: "novaSenha",
          novaSenha: "novaSenha",
          confirmNewPassword: "confirmarSenha",
          confirmarSenha: "confirmarSenha",
          confirmarNovaSenha: "confirmarSenha",
        },
      });
      setSubmitError(buildFormApiErrorMessage(error, {
        appliedFields: fieldResult.appliedFields,
        fallbackMessage: "Não foi possível atualizar a senha.",
      }));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Segurança</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Troque sua senha de acesso
        </p>
      </div>

      <form className="rounded-xl border border-border bg-card p-5" onSubmit={form.handleSubmit(handleSubmit)}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Senha atual</label>
            <Input type="password" {...form.register("senhaAtual")} className="bg-secondary border-border" />
            {form.formState.errors.senhaAtual ? (
              <p className="text-xs text-gym-danger">{form.formState.errors.senhaAtual.message}</p>
            ) : null}
          </div>
          <div />
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nova senha</label>
            <Input type="password" {...form.register("novaSenha")} className="bg-secondary border-border" />
            {form.formState.errors.novaSenha ? (
              <p className="text-xs text-gym-danger">{form.formState.errors.novaSenha.message}</p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Confirmar nova senha</label>
            <Input type="password" {...form.register("confirmarSenha")} className="bg-secondary border-border" />
            {form.formState.errors.confirmarSenha ? (
              <p className="text-xs text-gym-danger">{form.formState.errors.confirmarSenha.message}</p>
            ) : null}
          </div>
        </div>

        {submitError ? (
          <div className="mt-4 rounded-lg border border-gym-danger/30 bg-gym-danger/10 px-3 py-2 text-sm text-gym-danger">
            {submitError}
          </div>
        ) : null}

        <div className="mt-4 flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? "Atualizando..." : "Atualizar senha"}
          </Button>
        </div>
      </form>
    </div>
  );
}
