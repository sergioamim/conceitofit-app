"use client";

/**
 * AG-7.9 — Sheet drawer para configuração dinâmica de agregador.
 *
 * Renderiza form a partir do `/schema` (campos + flags), com write-only
 * lifecycle de secrets. Create vs Edit decidem comportamento:
 *   - create: POST /{tipo}; se backend devolver `webhookSecret` (gerado pelo
 *     sistema), abre Dialog one-time reveal APÓS fechar o sheet.
 *   - edit: PUT /{tipo} com campos não-sensíveis. Se admin digitar novo
 *     access_token, dispara rotate-token adicional.
 *
 * Ambos disparam `test-connection` automaticamente após success e mostram
 * o resultado em toast + região aria-live do sheet.
 */

import { useCallback, useMemo, useState } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useToast } from "@/components/ui/use-toast";
import type {
  AgregadorConfigResponse,
  AgregadorSchemaEntry,
  AgregadorTipo,
} from "@/lib/api/agregadores-admin";
import {
  useCreateAgregadorConfig,
  useRotateAgregadorToken,
  useRotateAgregadorWebhookSecret,
  useTestAgregadorConnection,
  useUpdateAgregadorConfig,
} from "@/lib/query/use-agregadores-admin";
import { AgregadorSecretRevealDialog } from "./agregador-secret-reveal-dialog";
import { AgregadorFlagField } from "./agregador-flag-field";
import { AgregadorWebhookBlock } from "./agregador-webhook-block";
import {
  type AgregadorConfigFormValues,
  buildDefaults,
  buildWebhookUrl,
  buildZodSchema,
  fieldLabel,
  snakeToCamel,
  splitFormValues,
} from "./agregador-config-schema";

export interface AgregadorConfigSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  schema: AgregadorSchemaEntry;
  /** Se definido, sheet abre em modo edit; se undefined, modo create. */
  config?: AgregadorConfigResponse;
}

interface PendingSecretReveal {
  title: string;
  description: string;
  secret: string | null;
  webhookUrl?: string | null;
  warning?: string | null;
}

export function AgregadorConfigSheet(props: AgregadorConfigSheetProps) {
  // Remonta o form do zero quando abre → garante defaults limpos e evita
  // cascata de setStates em useEffect. `key` inclui tenant/config p/
  // diferenciar edit de diferentes configs. Quando fechado, sempre
  // renderiza o Sheet vazio para manter a animação de saída.
  const mountKey = `${props.schema.tipo}:${props.config?.tenantId ?? ""}:${props.config?.updatedAt ?? ""}`;
  return (
    <AgregadorConfigSheetInner
      key={`${mountKey}:${props.open ? "open" : "closed"}`}
      {...props}
    />
  );
}

function AgregadorConfigSheetInner({
  open,
  onOpenChange,
  tenantId,
  schema,
  config,
}: AgregadorConfigSheetProps) {
  const mode: "create" | "edit" = config ? "edit" : "create";
  const tipo: AgregadorTipo = schema.tipo;
  const { toast } = useToast();

  const [showAccessToken, setShowAccessToken] = useState(false);
  const [pendingReveal, setPendingReveal] =
    useState<PendingSecretReveal | null>(null);
  const [testStatusMessage, setTestStatusMessage] = useState<string | null>(
    null,
  );

  const createMutation = useCreateAgregadorConfig(tenantId);
  const updateMutation = useUpdateAgregadorConfig(tenantId);
  const rotateTokenMutation = useRotateAgregadorToken(tenantId);
  const rotateWebhookMutation = useRotateAgregadorWebhookSecret(tenantId);
  const testMutation = useTestAgregadorConnection();

  const zodSchema = useMemo(
    () => buildZodSchema(schema, mode),
    [schema, mode],
  );

  const form = useForm<AgregadorConfigFormValues>({
    resolver: zodResolver(
      zodSchema,
    ) as unknown as Resolver<AgregadorConfigFormValues>,
    mode: "onBlur",
    defaultValues: buildDefaults(schema, config),
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = form;

  const webhookUrl = buildWebhookUrl(schema);
  const submitting =
    createMutation.isPending ||
    updateMutation.isPending ||
    rotateTokenMutation.isPending;

  const runTestConnection = useCallback(async () => {
    setTestStatusMessage("Testando conexão...");
    try {
      const result = await testMutation.mutateAsync({ tipo, tenantId });
      const message = result.success
        ? `Conexão OK${result.message ? ` — ${result.message}` : ""}`
        : `Falha na conexão${result.message ? ` — ${result.message}` : ""}`;
      setTestStatusMessage(message);
      toast({
        title: result.success ? "Conexão OK" : "Falha na conexão",
        description: result.message || result.status || undefined,
        variant: result.success ? "default" : "destructive",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setTestStatusMessage(`Falha: ${message}`);
      toast({
        title: "Falha no teste de conexão",
        description: message,
        variant: "destructive",
      });
    }
  }, [testMutation, tipo, tenantId, toast]);

  const onSubmit = useCallback(
    async (values: AgregadorConfigFormValues) => {
      const { externalGymId, siteId, enabled, accessToken, flags } =
        splitFormValues(values, schema);
      try {
        if (mode === "create") {
          if (!accessToken) {
            toast({
              title: "Access Token obrigatório",
              description: "Informe o token recebido do parceiro.",
              variant: "destructive",
            });
            return;
          }
          const result = await createMutation.mutateAsync({
            tipo,
            payload: {
              tenantId,
              accessToken,
              externalGymId,
              siteId,
              enabled: enabled ?? true,
              flags,
            },
          });
          toast({
            title: "Configuração criada",
            description: `${schema.nome} habilitado para o tenant.`,
          });
          if (result.webhookSecret) {
            setPendingReveal({
              title: "Webhook secret gerado",
              description:
                "O sistema gerou automaticamente o webhook_secret. Copie agora — não será exibido novamente.",
              secret: result.webhookSecret,
              webhookUrl: result.webhookUrl ?? webhookUrl,
              warning: result.warning,
            });
          }
          onOpenChange(false);
          void runTestConnection();
          return;
        }

        await updateMutation.mutateAsync({
          tipo,
          payload: { tenantId, externalGymId, siteId, enabled, flags },
        });
        if (accessToken) {
          await rotateTokenMutation.mutateAsync({
            tipo,
            newAccessToken: accessToken,
          });
          toast({
            title: "Configuração e token atualizados",
            description: "Access Token rotacionado com sucesso.",
          });
        } else {
          toast({
            title: "Configuração atualizada",
            description: `${schema.nome} — campos não-sensíveis salvos.`,
          });
        }
        onOpenChange(false);
        void runTestConnection();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro desconhecido";
        toast({
          title: "Falha ao salvar configuração",
          description: message,
          variant: "destructive",
        });
      }
    },
    [
      createMutation,
      updateMutation,
      rotateTokenMutation,
      mode,
      schema,
      tipo,
      tenantId,
      toast,
      onOpenChange,
      runTestConnection,
      webhookUrl,
    ],
  );

  const handleRotateWebhookSecret = useCallback(async () => {
    try {
      const result = await rotateWebhookMutation.mutateAsync({ tipo });
      setPendingReveal({
        title: "Novo webhook secret gerado",
        description:
          "Copie este valor agora. Ele não será exibido novamente.",
        secret: result.webhookSecret ?? null,
        webhookUrl: result.webhookUrl ?? webhookUrl,
        warning: result.warning,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      toast({
        title: "Falha ao rotacionar webhook secret",
        description: message,
        variant: "destructive",
      });
    }
  }, [rotateWebhookMutation, tipo, webhookUrl, toast]);

  const uniqueSimpleFields = useMemo(() => {
    const simpleNonSecretFields = [
      ...schema.camposRequeridos,
      ...schema.camposOpcionais,
    ].filter((k) => k !== "access_token" && k !== "webhook_secret");
    return Array.from(new Set(simpleNonSecretFields));
  }, [schema.camposRequeridos, schema.camposOpcionais]);

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(next) => {
          if (!submitting) onOpenChange(next);
        }}
      >
        <SheetContent
          side="right"
          className="flex w-full flex-col overflow-y-auto sm:max-w-lg"
          data-testid={`agregador-config-sheet-${tipo}`}
        >
          <SheetHeader>
            <SheetTitle>
              {mode === "create"
                ? `Configurar ${schema.nome}`
                : `Editar ${schema.nome}`}
            </SheetTitle>
            <SheetDescription>
              {mode === "create"
                ? "Cadastre as credenciais e flags do parceiro para este tenant."
                : "Altere campos não-sensíveis. Para rotacionar secrets, use os botões dedicados."}
            </SheetDescription>
          </SheetHeader>

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="flex flex-1 flex-col gap-5 px-4 pb-4"
            data-testid="agregador-config-form"
          >
            {uniqueSimpleFields.map((rawKey) => {
              const camelKey = snakeToCamel(rawKey);
              const required = schema.camposRequeridos.includes(rawKey);
              const errMsg = (
                errors as Record<string, { message?: string } | undefined>
              )[camelKey]?.message;
              return (
                <div className="space-y-1.5" key={rawKey}>
                  <Label htmlFor={`agregador-field-${rawKey}`}>
                    {fieldLabel(rawKey)}
                    {required ? (
                      <span className="text-destructive"> *</span>
                    ) : null}
                  </Label>
                  <Input
                    id={`agregador-field-${rawKey}`}
                    autoComplete="off"
                    aria-invalid={errMsg ? true : undefined}
                    data-testid={`agregador-field-${rawKey}`}
                    {...register(camelKey)}
                  />
                  {errMsg ? (
                    <p className="text-xs text-destructive" role="alert">
                      {errMsg}
                    </p>
                  ) : null}
                </div>
              );
            })}

            <div className="space-y-1.5">
              <Label htmlFor="agregador-field-access-token">
                Access Token
                {mode === "create" ? (
                  <span className="text-destructive"> *</span>
                ) : null}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="agregador-field-access-token"
                  type={showAccessToken ? "text" : "password"}
                  autoComplete="off"
                  placeholder={
                    mode === "create"
                      ? "token recebido do parceiro"
                      : "•••• preencha APENAS para rotacionar"
                  }
                  aria-invalid={errors.accessToken ? true : undefined}
                  data-testid="agregador-field-access-token"
                  {...register("accessToken")}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAccessToken((v) => !v)}
                  aria-label={
                    showAccessToken ? "Ocultar token" : "Mostrar token"
                  }
                >
                  {showAccessToken ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </Button>
              </div>
              {errors.accessToken?.message ? (
                <p className="text-xs text-destructive" role="alert">
                  {String(errors.accessToken.message)}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {mode === "edit"
                    ? "Deixe em branco para manter o token atual. Preencher dispara rotação."
                    : "Nunca retorna em GET. Só aparece aqui uma vez."}
                </p>
              )}
            </div>

            <div className="flex items-start gap-3">
              <Controller
                control={control}
                name="enabled"
                render={({ field }) => (
                  <Checkbox
                    id="agregador-field-enabled"
                    checked={Boolean(field.value)}
                    onCheckedChange={(v) => field.onChange(v === true)}
                    data-testid="agregador-field-enabled"
                  />
                )}
              />
              <div>
                <Label
                  htmlFor="agregador-field-enabled"
                  className="cursor-pointer"
                >
                  Habilitado
                </Label>
                <p className="text-xs text-muted-foreground">
                  Quando desmarcado, webhooks são aceitos mas ignorados.
                </p>
              </div>
            </div>

            {schema.flags.length > 0 ? (
              <fieldset className="space-y-3 rounded-lg border px-3 py-3">
                <legend className="px-1 text-xs font-semibold uppercase text-muted-foreground">
                  Flags
                </legend>
                {schema.flags.map((flag) => (
                  <AgregadorFlagField
                    key={flag.key}
                    flag={flag}
                    control={control}
                    register={register}
                  />
                ))}
              </fieldset>
            ) : null}

            {webhookUrl ? (
              <AgregadorWebhookBlock
                webhookUrl={webhookUrl}
                mode={mode}
                rotatePending={rotateWebhookMutation.isPending}
                onRotate={handleRotateWebhookSecret}
              />
            ) : null}

            <p
              aria-live="polite"
              role="status"
              className="min-h-[1.25rem] text-xs text-muted-foreground"
              data-testid="agregador-config-test-status"
            >
              {testStatusMessage}
            </p>

            <SheetFooter className="mt-auto flex-row justify-end gap-2 p-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                data-testid="agregador-config-submit"
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Salvando...
                  </>
                ) : mode === "create" ? (
                  "Criar configuração"
                ) : (
                  "Salvar alterações"
                )}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <AgregadorSecretRevealDialog
        open={pendingReveal !== null}
        onOpenChange={(next) => {
          if (!next) setPendingReveal(null);
        }}
        secret={pendingReveal?.secret ?? null}
        title={pendingReveal?.title}
        description={pendingReveal?.description}
        webhookUrl={pendingReveal?.webhookUrl ?? undefined}
        warning={pendingReveal?.warning ?? undefined}
      />
    </>
  );
}
