"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { applyApiFieldErrors, buildFormApiErrorMessage } from "@/lib/forms/api-form-errors";
import { zodResolver } from "@/lib/forms/zod-resolver";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { changePasswordApi } from "@/lib/api/auth";
import {
  trocarSenhaSchema,
  type TrocarSenhaFormValues,
} from "@/lib/forms/perfil-aluno-schemas";

export default function TrocarSenhaPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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
      router.push("/meu-perfil");
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
        fallbackMessage: "Não foi possível alterar a senha.",
      }));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 py-4 pb-20">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0"
          aria-label="Voltar para meu perfil"
          onClick={() => router.push("/meu-perfil")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="font-display text-xl font-bold">Trocar Senha</h1>
      </div>

      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-5"
      >
        {/* Senha atual */}
        <div className="space-y-2">
          <Label htmlFor="senhaAtual">Senha atual</Label>
          <div className="relative">
            <Input
              id="senhaAtual"
              type={showCurrent ? "text" : "password"}
              {...form.register("senhaAtual")}
              className="pr-10"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowCurrent((v) => !v)}
              tabIndex={-1}
            >
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {form.formState.errors.senhaAtual && (
            <p className="text-xs text-gym-danger">{form.formState.errors.senhaAtual.message}</p>
          )}
        </div>

        {/* Nova senha */}
        <div className="space-y-2">
          <Label htmlFor="novaSenha">Nova senha</Label>
          <div className="relative">
            <Input
              id="novaSenha"
              type={showNew ? "text" : "password"}
              {...form.register("novaSenha")}
              className="pr-10"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowNew((v) => !v)}
              tabIndex={-1}
            >
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {form.formState.errors.novaSenha && (
            <p className="text-xs text-gym-danger">{form.formState.errors.novaSenha.message}</p>
          )}
        </div>

        {/* Confirmar senha */}
        <div className="space-y-2">
          <Label htmlFor="confirmarSenha">Confirmar nova senha</Label>
          <div className="relative">
            <Input
              id="confirmarSenha"
              type={showConfirm ? "text" : "password"}
              {...form.register("confirmarSenha")}
              className="pr-10"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowConfirm((v) => !v)}
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {form.formState.errors.confirmarSenha && (
            <p className="text-xs text-gym-danger">{form.formState.errors.confirmarSenha.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full h-12 rounded-2xl font-bold"
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Alterando...
            </>
          ) : (
            "Alterar Senha"
          )}
        </Button>

        {submitError ? (
          <div className="rounded-lg border border-gym-danger/30 bg-gym-danger/10 px-3 py-2 text-sm text-gym-danger">
            {submitError}
          </div>
        ) : null}
      </form>
    </div>
  );
}
