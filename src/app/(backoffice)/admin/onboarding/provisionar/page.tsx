"use client";

import { zodResolver } from "@/lib/forms/zod-resolver";
import { Check, Copy, KeyRound, Mail, MessageCircle, ShieldCheck, Sparkles, type LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  provisionAcademiaAdminApi,
  type AdminOnboardingProvisionResult,
} from "@/backoffice/api/admin-onboarding-api";
import {
  adminOnboardingProvisionFormSchema,
  normalizeProvisionPhone,
  type AdminOnboardingProvisionFormValues,
} from "@/lib/forms/admin-onboarding-provision-form";
import {
  applyApiFieldErrors,
  buildFormApiErrorMessage,
} from "@/lib/forms/api-form-errors";
import { formatPhone } from "@/lib/shared/formatters";
import { formatCnpj } from "@/lib/utils/cnpj";
import { PhoneInput } from "@/components/shared/phone-input";

const DEFAULT_VALUES: AdminOnboardingProvisionFormValues = {
  academiaNome: "",
  cnpj: "",
  unidadePrincipalNome: "",
  adminNome: "",
  adminEmail: "",
  telefone: "",
};

type CopyCredentialsButtonProps = {
  text: string;
};

function CopyCredentialsButton({ text }: CopyCredentialsButtonProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: "Credenciais copiadas",
        description: "As credenciais foram copiadas para a área de transferência.",
      });
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast({
        title: "Não foi possível copiar",
        description: "Tente novamente ou copie manualmente os dados exibidos abaixo.",
        variant: "destructive",
      });
    }
  }

  return (
    <Button type="button" variant="outline" className="border-border" onClick={() => void handleCopy()}>
      {copied ? <Check className="mr-2 size-4 text-gym-teal" /> : <Copy className="mr-2 size-4" />}
      {copied ? "Copiado" : "Copiar credenciais"}
    </Button>
  );
}

function buildCredentialsText(
  credentials: AdminOnboardingProvisionResult,
  values: AdminOnboardingProvisionFormValues,
) {
  return [
    `Academia: ${credentials.academiaNome}`,
    `Unidade principal: ${credentials.unidadePrincipalNome}`,
    `Administrador: ${values.adminNome}`,
    `E-mail: ${credentials.adminEmail}`,
    `Senha temporária: ${credentials.temporaryPassword}`,
  ].join("\n");
}

function buildSendCredentialsHref(
  credentials: AdminOnboardingProvisionResult,
  values: AdminOnboardingProvisionFormValues,
) {
  const text = [
    `Olá, ${values.adminNome}!`,
    "",
    `A academia ${credentials.academiaNome} foi provisionada com sucesso.`,
    `Unidade principal: ${credentials.unidadePrincipalNome}`,
    `E-mail de acesso: ${credentials.adminEmail}`,
    `Senha temporária: ${credentials.temporaryPassword}`,
    "",
    "Recomendamos trocar a senha no primeiro acesso.",
  ].join("\n");

  const phone = normalizeProvisionPhone(values.telefone);
  if (phone) {
    return {
      href: `https://wa.me/${phone}?text=${encodeURIComponent(text)}`,
      label: "Abre WhatsApp com a mensagem pronta",
      icon: MessageCircle,
    };
  }

  return {
    href: `mailto:${encodeURIComponent(credentials.adminEmail)}?subject=${encodeURIComponent(
      `Credenciais iniciais da academia ${credentials.academiaNome}`,
    )}&body=${encodeURIComponent(text)}`,
    label: "Abre e-mail com a mensagem pronta",
    icon: Mail,
  };
}

function mapFieldError(
  field: string,
): keyof AdminOnboardingProvisionFormValues | null {
  switch (field) {
    case "nomeAcademia":
    case "academiaNome":
      return "academiaNome";
    case "cnpj":
      return "cnpj";
    case "nomeUnidadePrincipal":
    case "unidadePrincipalNome":
      return "unidadePrincipalNome";
    case "nomeAdministrador":
    case "adminNome":
      return "adminNome";
    case "emailAdministrador":
    case "adminEmail":
    case "email":
      return "adminEmail";
    case "telefone":
    case "telefoneAdministrador":
      return "telefone";
    default:
      return null;
  }
}

export default function AdminProvisionarAcademiaPage() {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [credentials, setCredentials] = useState<AdminOnboardingProvisionResult | null>(null);

  const form = useForm<AdminOnboardingProvisionFormValues>({
    resolver: zodResolver(adminOnboardingProvisionFormSchema),
    mode: "onTouched",
    defaultValues: DEFAULT_VALUES,
  });

  const {
    control,
    handleSubmit,
    register,
    reset,
    setError,
    watch,
    formState: { errors },
  } = form;

  // Manual watch dos required fields para evitar rodar o zodResolver no mount.
  const watchedAcademiaNome = watch("academiaNome");
  const watchedCnpj = watch("cnpj");
  const watchedUnidadePrincipal = watch("unidadePrincipalNome");
  const watchedAdminNome = watch("adminNome");
  const watchedAdminEmail = watch("adminEmail");
  const watchedTelefone = watch("telefone");
  const canSave =
    Boolean(watchedAcademiaNome?.trim()) &&
    Boolean(watchedCnpj?.trim()) &&
    Boolean(watchedUnidadePrincipal?.trim()) &&
    Boolean(watchedAdminNome?.trim()) &&
    Boolean(watchedAdminEmail?.trim()) &&
    Boolean(watchedTelefone?.trim());

  const values = watch();
  const credentialsText = useMemo(
    () => (credentials ? buildCredentialsText(credentials, values) : ""),
    [credentials, values],
  );
  const sendAction = useMemo(
    () => (credentials ? buildSendCredentialsHref(credentials, values) : null),
    [credentials, values],
  );

  async function submitProvision(values: AdminOnboardingProvisionFormValues) {
    setSubmitting(true);
    setSubmitError("");
    setCredentials(null);

    try {
      const result = await provisionAcademiaAdminApi(values);

      if (!result.temporaryPassword) {
        throw new Error(
          "A API respondeu sem senha temporária. Confirme se o backend da task academia-java#369 já está disponível.",
        );
      }

      setCredentials(result);
      toast({
        title: "Academia provisionada",
        description: "As credenciais iniciais já estão prontas para envio ao administrador.",
      });
    } catch (error) {
      const { appliedFields } = applyApiFieldErrors(error, setError, {
        mapField: mapFieldError,
      });
      const message = buildFormApiErrorMessage(error, {
        appliedFields,
        fallbackMessage: "Revise os campos destacados e tente novamente.",
      });
      setSubmitError(message);
      toast({
        title: "Falha ao provisionar academia",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[28px] border border-border bg-card">
        <div className="relative overflow-hidden border-b border-border px-6 py-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(61,232,160,0.16),transparent_44%),radial-gradient(circle_at_bottom_right,rgba(91,141,239,0.16),transparent_40%)]" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-secondary/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Onboarding Global
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold tracking-tight">
                  Provisionar nova academia
                </h1>
                <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                  Cria a academia, registra a unidade principal e devolve o acesso inicial do administrador em um único fluxo operacional.
                </p>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <InfoPill
                icon={Sparkles}
                title="Fluxo único"
                description="Cadastro institucional e credenciais no mesmo submit."
              />
              <InfoPill
                icon={ShieldCheck}
                title="Dependência backend"
                description="Requer o endpoint /api/v1/admin/onboarding/provision ativo."
              />
            </div>
          </div>
        </div>

        <div className="grid gap-6 px-6 py-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-border/70 bg-card/80">
            <CardHeader>
              <CardTitle>Dados para provisionamento</CardTitle>
              <CardDescription>
                Informe os dados mínimos da operação. O formulário valida CNPJ, e-mail e telefone antes de enviar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-5" onSubmit={handleSubmit(submitProvision)}>
                <div className="space-y-1.5">
                  <Label htmlFor="provision-academia-nome">
                    Nome da academia <span className="text-gym-danger">*</span>
                  </Label>
                  <Input
                    id="provision-academia-nome"
                    {...register("academiaNome")}
                    aria-invalid={errors.academiaNome ? "true" : "false"}
                    className="border-border bg-secondary"
                    placeholder="Ex: Academia Conceito Fit Copacabana"
                  />
                  {errors.academiaNome ? (
                    <p className="text-xs text-gym-danger">{errors.academiaNome.message}</p>
                  ) : null}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="provision-cnpj">
                      CNPJ <span className="text-gym-danger">*</span>
                    </Label>
                    <Controller
                      control={control}
                      name="cnpj"
                      render={({ field }) => (
                        <Input
                          id="provision-cnpj"
                          value={field.value}
                          onChange={(event) => field.onChange(formatCnpj(event.target.value))}
                          aria-invalid={errors.cnpj ? "true" : "false"}
                          className="border-border bg-secondary"
                          placeholder="00.000.000/0000-00"
                        />
                      )}
                    />
                    {errors.cnpj ? (
                      <p className="text-xs text-gym-danger">{errors.cnpj.message}</p>
                    ) : null}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="provision-telefone">
                      Telefone <span className="text-gym-danger">*</span>
                    </Label>
                    <Controller
                      control={control}
                      name="telefone"
                      render={({ field }) => (
                        <PhoneInput
                          id="provision-telefone"
                          value={field.value}
                          onChange={field.onChange}
                          aria-invalid={errors.telefone ? "true" : "false"}
                          className="border-border bg-secondary"
                          placeholder="(21) 99999-0000"
                        />
                      )}
                    />
                    {errors.telefone ? (
                      <p className="text-xs text-gym-danger">{errors.telefone.message}</p>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="provision-unidade-principal">
                    Nome da unidade principal <span className="text-gym-danger">*</span>
                  </Label>
                  <Input
                    id="provision-unidade-principal"
                    {...register("unidadePrincipalNome")}
                    aria-invalid={errors.unidadePrincipalNome ? "true" : "false"}
                    className="border-border bg-secondary"
                    placeholder="Ex: Copacabana Matriz"
                  />
                  {errors.unidadePrincipalNome ? (
                    <p className="text-xs text-gym-danger">{errors.unidadePrincipalNome.message}</p>
                  ) : null}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="provision-admin-nome">
                      Nome do administrador <span className="text-gym-danger">*</span>
                    </Label>
                    <Input
                      id="provision-admin-nome"
                      {...register("adminNome")}
                      aria-invalid={errors.adminNome ? "true" : "false"}
                      className="border-border bg-secondary"
                      placeholder="Ex: Mariana Costa"
                    />
                    {errors.adminNome ? (
                      <p className="text-xs text-gym-danger">{errors.adminNome.message}</p>
                    ) : null}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="provision-admin-email">
                      E-mail do administrador <span className="text-gym-danger">*</span>
                    </Label>
                    <Input
                      id="provision-admin-email"
                      type="email"
                      {...register("adminEmail")}
                      aria-invalid={errors.adminEmail ? "true" : "false"}
                      className="border-border bg-secondary"
                      placeholder="mariana@academia.com"
                    />
                    {errors.adminEmail ? (
                      <p className="text-xs text-gym-danger">{errors.adminEmail.message}</p>
                    ) : null}
                  </div>
                </div>

                {submitError ? (
                  <div className="rounded-2xl border border-gym-danger/30 bg-gym-danger/10 px-4 py-3 text-sm text-gym-danger">
                    {submitError}
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-3">
                  <Button type="submit" disabled={submitting || !canSave}>
                    {submitting ? "Provisionando..." : "Provisionar academia"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-border"
                    onClick={() => {
                      reset(DEFAULT_VALUES);
                      setSubmitError("");
                      setCredentials(null);
                    }}
                    disabled={submitting}
                  >
                    Limpar formulário
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-border/70 bg-card/80">
              <CardHeader>
                <CardTitle>Checklist operacional</CardTitle>
                <CardDescription>
                  Fluxo pensado para o time global provisionar uma nova academia sem sair do backoffice.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <StepRow
                  title="1. Validar dados institucionais"
                  description="Nome da academia, CNPJ e unidade principal entram no mesmo payload de provisionamento."
                />
                <StepRow
                  title="2. Criar administrador inicial"
                  description="O e-mail e telefone do responsável já preparam o envio imediato das credenciais."
                />
                <StepRow
                  title="3. Distribuir acesso"
                  description="Depois do sucesso, use o card abaixo para copiar ou abrir o canal de envio com a mensagem pronta."
                />
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/80">
              <CardHeader>
                <CardTitle>Prévia do envio</CardTitle>
                <CardDescription>
                  O botão de envio prioriza WhatsApp quando o telefone estiver preenchido; caso contrário, abre e-mail.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="rounded-2xl border border-border/70 bg-secondary/30 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Administrador</p>
                  <p className="mt-2 text-sm text-foreground">{values.adminNome || "Ainda não informado"}</p>
                  <p className="mt-1">{values.adminEmail || "Sem e-mail informado"}</p>
                  <p className="mt-1">{values.telefone ? formatPhone(values.telefone) : "Sem telefone informado"}</p>
                </div>
                <Textarea
                  readOnly
                  value={
                    credentialsText ||
                    "As credenciais provisionadas aparecerão aqui assim que a API responder com sucesso."
                  }
                  className="min-h-40 border-border bg-secondary font-mono text-xs"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {credentials ? (
        <Card className="border-gym-teal/30 bg-gym-teal/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="size-5 text-gym-teal" />
              Credenciais geradas
            </CardTitle>
            <CardDescription>
              Guarde e compartilhe estes dados apenas com o administrador responsável pela academia provisionada.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <CredentialField
                fieldId="provision-credential-academia"
                label="Academia"
                value={credentials.academiaNome}
              />
              <CredentialField
                fieldId="provision-credential-unidade-principal"
                label="Unidade principal"
                value={credentials.unidadePrincipalNome}
              />
              <CredentialField
                fieldId="provision-credential-admin-email"
                label="E-mail"
                value={credentials.adminEmail}
              />
              <CredentialField
                fieldId="provision-credential-temporary-password"
                label="Senha temporária"
                value={credentials.temporaryPassword}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <CopyCredentialsButton text={credentialsText} />
              {sendAction ? <SendCredentialsButton action={sendAction} /> : null}
            </div>

            <p className="text-xs text-muted-foreground">
              Se o backend devolver um e-mail diferente do informado no formulário, este card sempre prioriza o retorno oficial da API.
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function CredentialField({
  fieldId,
  label,
  value,
}: {
  fieldId: string;
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={fieldId} className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
        {label}
      </Label>
      <Input id={fieldId} value={value} readOnly className="border-border bg-secondary" />
    </div>
  );
}

function InfoPill({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="rounded-full border border-border/70 bg-secondary/60 p-2">
          <Icon className="size-4 text-gym-accent" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}

function SendCredentialsButton({
  action,
}: {
  action: {
    href: string;
    label: string;
    icon: LucideIcon;
  };
}) {
  const Icon = action.icon;

  return (
    <Button type="button" asChild>
      <a href={action.href} target="_blank" rel="noreferrer noopener" aria-label={action.label}>
        <Icon className="mr-2 size-4" />
        Enviar credenciais
      </a>
    </Button>
  );
}

function StepRow({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-secondary/25 p-4">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
