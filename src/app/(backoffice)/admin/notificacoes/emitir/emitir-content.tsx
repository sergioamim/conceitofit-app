"use client";

/**
 * Página de emissão manual de notificação global (Epic 4 — Story 4.22).
 *
 * Exclusivo para PLATAFORMA (SaaS admin). O form usa react-hook-form + zod
 * com mode "onTouched" e cálculo manual de `canSave` via `useWatch`, conforme
 * padrão do projeto.
 *
 * Backend: POST /api/v1/notificacoes/admin/emitir (Wave 2).
 */

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Megaphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { emitirNotificacaoApi } from "@/lib/api/notificacoes-inbox";
import { ApiRequestError } from "@/lib/api/http";
import type { EmitirNotificacaoPayload } from "@/lib/shared/types/notificacao-inbox";
import { AudiencePicker } from "./audience-picker";

// ---------------------------------------------------------------------------
// Schema (zod)
// ---------------------------------------------------------------------------

const ROLE_VALUES = [
  "ADMIN",
  "SUPER_ADMIN",
  "GERENTE",
  "FINANCEIRO",
  "INSTRUTOR",
  "RECEPCAO",
  "CUSTOMER",
  "VIEWER",
] as const;

const emitSchema = z
  .object({
    titulo: z
      .string()
      .trim()
      .min(1, "Título é obrigatório")
      .max(200, "Máximo 200 caracteres"),
    mensagem: z
      .string()
      .trim()
      .min(1, "Mensagem é obrigatória")
      .max(1000, "Máximo 1000 caracteres"),
    severidade: z.enum(["INFO", "AVISO", "URGENTE"]),
    audienceTipo: z.enum(["GLOBAL", "REDE", "TENANT", "ROLE", "USUARIO"]),
    redeId: z
      .string()
      .trim()
      .uuid("UUID inválido")
      .optional()
      .or(z.literal("").transform(() => undefined)),
    tenantId: z
      .string()
      .trim()
      .uuid("UUID inválido")
      .optional()
      .or(z.literal("").transform(() => undefined)),
    role: z.enum(ROLE_VALUES).optional(),
    userId: z.coerce.number().int().positive().optional(),
    acaoUrl: z
      .string()
      .trim()
      .max(500, "Máximo 500 caracteres")
      .optional()
      .or(z.literal("").transform(() => undefined)),
    acaoLabel: z
      .string()
      .trim()
      .max(100, "Máximo 100 caracteres")
      .optional()
      .or(z.literal("").transform(() => undefined)),
    requerAcao: z.boolean(),
    ttlDias: z.coerce
      .number()
      .int("Dias inteiros")
      .min(1, "Mínimo 1 dia")
      .max(365, "Máximo 365 dias"),
  })
  .refine(
    (data) => {
      switch (data.audienceTipo) {
        case "GLOBAL":
          return true;
        case "REDE":
          return Boolean(data.redeId);
        case "TENANT":
          return Boolean(data.tenantId);
        case "ROLE":
          return Boolean(data.tenantId) && Boolean(data.role);
        case "USUARIO":
          return typeof data.userId === "number" && data.userId > 0;
        default:
          return false;
      }
    },
    {
      message: "Preencha os campos obrigatórios do público-alvo",
      path: ["audienceTipo"],
    },
  );

type EmitFormInput = z.input<typeof emitSchema>;
type EmitFormData = z.output<typeof emitSchema>;

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function EmitirNotificacaoContent() {
  const router = useRouter();
  const { toast } = useToast();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<EmitFormInput, unknown, EmitFormData>({
    resolver: zodResolver(emitSchema),
    mode: "onTouched",
    defaultValues: {
      titulo: "",
      mensagem: "",
      severidade: "INFO",
      audienceTipo: "GLOBAL",
      redeId: undefined,
      tenantId: undefined,
      role: undefined,
      userId: undefined,
      acaoUrl: undefined,
      acaoLabel: undefined,
      requerAcao: false,
      ttlDias: 30,
    },
  });

  const {
    control,
    register,
    setValue,
    handleSubmit,
    reset,
    formState: { errors },
  } = form;

  // Watches manuais para canSave (nunca confiar em formState.isValid)
  const titulo = useWatch({ control, name: "titulo" }) ?? "";
  const mensagem = useWatch({ control, name: "mensagem" }) ?? "";
  const severidade = useWatch({ control, name: "severidade" });
  const audienceTipo = useWatch({ control, name: "audienceTipo" });
  const redeId = useWatch({ control, name: "redeId" });
  const tenantId = useWatch({ control, name: "tenantId" });
  const role = useWatch({ control, name: "role" });
  const userId = useWatch({ control, name: "userId" });
  const requerAcao = useWatch({ control, name: "requerAcao" });

  const audiencePreenchido = useMemo(() => {
    if (!audienceTipo) return false;
    if (audienceTipo === "GLOBAL") return true;
    if (audienceTipo === "REDE") return Boolean(redeId?.trim());
    if (audienceTipo === "TENANT") return Boolean(tenantId?.trim());
    if (audienceTipo === "ROLE")
      return Boolean(tenantId?.trim()) && Boolean(role);
    if (audienceTipo === "USUARIO")
      return typeof userId === "number" && userId > 0;
    return false;
  }, [audienceTipo, redeId, tenantId, role, userId]);

  const canSave =
    Boolean(titulo?.trim()) &&
    Boolean(mensagem?.trim()) &&
    Boolean(severidade) &&
    audiencePreenchido;

  const mutation = useMutation({
    mutationFn: (payload: EmitirNotificacaoPayload) =>
      emitirNotificacaoApi(payload),
    onSuccess: (result) => {
      toast({
        title: "Notificação emitida",
        description: `evento ${result.eventoId.slice(0, 8)}… publicado.`,
      });
      reset();
      router.push("/admin/notificacoes/historico");
    },
    onError: (err) => {
      const description =
        err instanceof ApiRequestError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Erro desconhecido.";
      setSubmitError(description);
      toast({
        title: "Falha ao emitir notificação",
        description,
        variant: "destructive",
      });
    },
  });

  const onSubmit = useCallback(
    (data: EmitFormData) => {
      setSubmitError(null);
      const payload: EmitirNotificacaoPayload = {
        titulo: data.titulo.trim(),
        mensagem: data.mensagem.trim(),
        severidade: data.severidade,
        audienceTipo: data.audienceTipo,
        redeId: data.audienceTipo === "REDE" ? data.redeId : undefined,
        tenantId:
          data.audienceTipo === "TENANT" || data.audienceTipo === "ROLE"
            ? data.tenantId
            : undefined,
        role: data.audienceTipo === "ROLE" ? data.role : undefined,
        userId: data.audienceTipo === "USUARIO" ? data.userId : undefined,
        acaoUrl: data.acaoUrl?.trim() || undefined,
        acaoLabel: data.acaoLabel?.trim() || undefined,
        requerAcao: Boolean(data.requerAcao),
        ttlDias: data.ttlDias,
      };
      mutation.mutate(payload);
    },
    [mutation],
  );

  const submitting = mutation.isPending;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gym-accent/10 text-gym-accent">
            <Megaphone className="size-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">
              Emitir notificação
            </h1>
            <p className="text-sm text-muted-foreground">
              Publica uma notificação global no inbox dos usuários selecionados.
            </p>
          </div>
        </div>
        <Link
          href="/admin/notificacoes/historico"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3" />
          Ver histórico de emissões
        </Link>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        <Card className="space-y-4 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Conteúdo
          </h2>

          <div className="space-y-1.5">
            <Label htmlFor="titulo">
              Título <span className="text-gym-danger">*</span>
            </Label>
            <Input
              id="titulo"
              type="text"
              maxLength={200}
              autoComplete="off"
              aria-invalid={errors.titulo ? "true" : "false"}
              placeholder="Ex.: Manutenção programada no sistema"
              disabled={submitting}
              {...register("titulo")}
            />
            {errors.titulo ? (
              <p className="text-xs text-gym-danger">{errors.titulo.message}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Máximo 200 caracteres.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mensagem">
              Mensagem <span className="text-gym-danger">*</span>
            </Label>
            <Textarea
              id="mensagem"
              rows={5}
              maxLength={1000}
              aria-invalid={errors.mensagem ? "true" : "false"}
              placeholder="Detalhes da notificação..."
              disabled={submitting}
              {...register("mensagem")}
            />
            {errors.mensagem ? (
              <p className="text-xs text-gym-danger">
                {errors.mensagem.message}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Máximo 1000 caracteres.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="severidade">
              Severidade <span className="text-gym-danger">*</span>
            </Label>
            <Select
              value={severidade ?? "INFO"}
              onValueChange={(value) =>
                setValue("severidade", value as EmitFormData["severidade"], {
                  shouldDirty: true,
                  shouldTouch: true,
                })
              }
              disabled={submitting}
            >
              <SelectTrigger id="severidade" aria-label="Severidade">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INFO">Info</SelectItem>
                <SelectItem value="AVISO">Aviso</SelectItem>
                <SelectItem value="URGENTE">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        <Card className="space-y-4 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Público-alvo
          </h2>
          <AudiencePicker control={control} disabled={submitting} />
          {errors.audienceTipo ? (
            <p className="text-xs text-gym-danger">
              {errors.audienceTipo.message}
            </p>
          ) : null}
        </Card>

        <Card className="space-y-4 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Ação (opcional)
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="acaoUrl">URL de ação</Label>
              <Input
                id="acaoUrl"
                type="text"
                maxLength={500}
                autoComplete="off"
                placeholder="https://..."
                disabled={submitting}
                aria-invalid={errors.acaoUrl ? "true" : "false"}
                {...register("acaoUrl")}
              />
              {errors.acaoUrl ? (
                <p className="text-xs text-gym-danger">
                  {errors.acaoUrl.message}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Relativa ou absoluta — botão de CTA no inbox.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="acaoLabel">Rótulo do botão</Label>
              <Input
                id="acaoLabel"
                type="text"
                maxLength={100}
                autoComplete="off"
                placeholder="Ex.: Ver detalhes"
                disabled={submitting}
                aria-invalid={errors.acaoLabel ? "true" : "false"}
                {...register("acaoLabel")}
              />
              {errors.acaoLabel ? (
                <p className="text-xs text-gym-danger">
                  {errors.acaoLabel.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-lg border border-border/50 p-3">
            <div className="space-y-0.5">
              <Label htmlFor="requerAcao" className="cursor-pointer">
                Requer ação
              </Label>
              <p className="text-xs text-muted-foreground">
                Marca a notificação como bloqueante até o usuário interagir com o CTA.
              </p>
            </div>
            <Switch
              id="requerAcao"
              checked={Boolean(requerAcao)}
              onCheckedChange={(value) =>
                setValue("requerAcao", value, {
                  shouldDirty: true,
                  shouldTouch: true,
                })
              }
              disabled={submitting}
              aria-label="Requer ação"
            />
          </div>
        </Card>

        <Card className="space-y-4 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Expiração
          </h2>

          <div className="space-y-1.5">
            <Label htmlFor="ttlDias">TTL em dias</Label>
            <Input
              id="ttlDias"
              type="number"
              min={1}
              max={365}
              inputMode="numeric"
              disabled={submitting}
              aria-invalid={errors.ttlDias ? "true" : "false"}
              {...register("ttlDias")}
            />
            {errors.ttlDias ? (
              <p className="text-xs text-gym-danger">
                {errors.ttlDias.message}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Período que a notificação permanece visível no inbox (1-365, padrão 30).
              </p>
            )}
          </div>
        </Card>

        {submitError ? (
          <div
            role="alert"
            className="rounded-md border border-gym-danger/40 bg-gym-danger/10 p-3 text-sm text-gym-danger"
          >
            {submitError}
          </div>
        ) : null}

        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={() => reset()}
          >
            Limpar
          </Button>
          <Button type="submit" disabled={submitting || !canSave}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Enviando…
              </>
            ) : (
              <>
                <Megaphone className="mr-2 size-4" />
                Emitir notificação
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
