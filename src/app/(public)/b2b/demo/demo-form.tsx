"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@/lib/forms/zod-resolver";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import {
  demoAccountFormSchema,
  type DemoAccountFormValues,
} from "@/lib/public/demo-account-schema";
import { createDemoAccount } from "@/lib/public/demo-account-api";
import { saveAuthSession } from "@/lib/api/session";

export function DemoForm() {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const {
    register,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<DemoAccountFormValues>({
    resolver: zodResolver(demoAccountFormSchema),
    defaultValues: {
      nome: "",
      email: "",
      senha: "",
    },
  });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearErrors();
    setApiError(null);
    const formData = new FormData(event.currentTarget);
    const submittedValues = {
      nome: String(formData.get("nome") ?? ""),
      email: String(formData.get("email") ?? ""),
      senha: String(formData.get("senha") ?? ""),
    };
    const normalizedValues = {
      nome: submittedValues.nome.trim(),
      email: submittedValues.email.trim(),
      senha: submittedValues.senha,
    };
    const nomeCheck = demoAccountFormSchema.shape.nome.safeParse(
      normalizedValues.nome,
    );
    const emailCheck = demoAccountFormSchema.shape.email.safeParse(
      normalizedValues.email,
    );
    const senhaCheck = demoAccountFormSchema.shape.senha.safeParse(
      normalizedValues.senha,
    );
    const hasErrors =
      !nomeCheck.success || !emailCheck.success || !senhaCheck.success;
    if (hasErrors) {
      if (!nomeCheck.success) {
        setError("nome", {
          type: "manual",
          message: nomeCheck.error.issues[0]?.message ?? "Informe seu nome.",
        });
      }
      if (!emailCheck.success) {
        setError("email", {
          type: "manual",
          message:
            emailCheck.error.issues[0]?.message ?? "Informe um e-mail valido.",
        });
      }
      if (!senhaCheck.success) {
        setError("senha", {
          type: "manual",
          message:
            senhaCheck.error.issues[0]?.message ??
            "A senha deve ter no minimo 6 caracteres.",
        });
      }
      return;
    }
    try {
      setIsSubmitting(true);
      const response = await createDemoAccount(normalizedValues);

      // Save auth session from the demo account response
      saveAuthSession({
        token: response.token,
        refreshToken: response.refreshToken,
        type: response.type ?? "Bearer",
        expiresIn: response.expiresIn,
        userId: response.userId,
        userKind: response.userKind ?? "OPERADOR",
        displayName: response.displayName ?? normalizedValues.nome,
        networkId: response.redeId,
        networkSubdomain: response.redeSubdominio ?? response.redeSlug,
        networkSlug: response.redeSlug,
        networkName: response.redeNome,
        activeTenantId: response.activeTenantId,
        baseTenantId: response.tenantBaseId,
        availableTenants: response.availableTenants ?? [],
        availableScopes: (response.availableScopes ?? []).filter(
          (s): s is "UNIDADE" | "REDE" | "GLOBAL" =>
            s === "UNIDADE" || s === "REDE" || s === "GLOBAL",
        ),
        broadAccess: response.broadAccess,
      });

      // Redirect to dashboard with demo flag
      router.push("/dashboard?demo=1");
    } catch (err) {
      setApiError(
        err instanceof Error ? err.message : "Erro inesperado. Tente novamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      data-testid="demo-form"
      data-hydrated={hydrated ? "true" : "false"}
      noValidate
      className="w-full space-y-4 text-left"
    >
      {apiError && (
        <div className="rounded-lg border border-gym-danger/30 bg-gym-danger/5 px-4 py-3 text-sm text-gym-danger">
          {apiError}
        </div>
      )}

      {/* Nome */}
      <div>
        <label htmlFor="demo-nome" className="mb-1 block text-sm font-medium">
          Nome
        </label>
        <input
          id="demo-nome"
          type="text"
          autoComplete="name"
          {...register("nome")}
          className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-gym-accent"
          placeholder="Seu nome"
        />
        {errors.nome && (
          <p className="mt-1 text-xs text-gym-danger">{errors.nome.message}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="demo-email" className="mb-1 block text-sm font-medium">
          E-mail
        </label>
        <input
          id="demo-email"
          type="email"
          autoComplete="email"
          {...register("email")}
          className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-gym-accent"
          placeholder="voce@email.com"
        />
        {errors.email && (
          <p className="mt-1 text-xs text-gym-danger">{errors.email.message}</p>
        )}
      </div>

      {/* Senha */}
      <div>
        <label htmlFor="demo-senha" className="mb-1 block text-sm font-medium">
          Senha
        </label>
        <div className="relative">
          <input
            id="demo-senha"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            {...register("senha")}
            className="h-10 w-full rounded-lg border border-border bg-background px-3 pr-10 text-sm outline-none transition-colors focus:border-gym-accent"
            placeholder="Minimo 6 caracteres"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            tabIndex={-1}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.senha && (
          <p className="mt-1 text-xs text-gym-danger">{errors.senha.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gym-accent font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Criando conta...
          </>
        ) : (
          "Criar conta demo gratuita"
        )}
      </button>

      <p className="text-center text-xs text-muted-foreground">
        Sem cartao de credito. Sua conta demo expira em 7 dias.
      </p>
    </form>
  );
}
