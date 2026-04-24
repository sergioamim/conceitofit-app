"use client";

import { useCallback, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@/lib/forms/zod-resolver";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  whatsappCredentialSchema,
  type WhatsAppCredentialFormValues,
} from "@/lib/forms/atendimento-schemas";
import type { WhatsAppCredentialResponse } from "@/lib/shared/types/whatsapp-crm";

interface WhatsAppCredentialFormProps {
  credential?: WhatsAppCredentialResponse | null;
  tenantId: string;
  onSave: (values: WhatsAppCredentialFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function WhatsAppCredentialForm({
  credential,
  tenantId,
  onSave,
  onCancel,
  isSubmitting,
}: WhatsAppCredentialFormProps) {
  const isEdit = !!credential;

  const form = useForm<WhatsAppCredentialFormValues>({
    resolver: zodResolver(whatsappCredentialSchema),
    defaultValues: {
      businessAccountId: "",
      wabaId: "",
      phoneId: "",
      phoneNumber: "",
      mode: "UNIT_NUMBER",
      accessToken: "",
      accessTokenExpiresAt: "",
      tenantId,
      academiaId: undefined,
      unidadeId: undefined,
      webhookVerifyToken: "",
    },
  });

  useEffect(() => {
    if (credential) {
      form.reset({
        businessAccountId: credential.businessAccountId,
        wabaId: credential.wabaId,
        phoneId: credential.phoneId,
        phoneNumber: credential.phoneNumber,
        mode: credential.mode,
        accessToken: "",
        accessTokenExpiresAt: credential.accessTokenExpiresAt,
        tenantId: credential.tenantId,
        academiaId: credential.academiaId ?? undefined,
        unidadeId: credential.unidadeId ?? undefined,
        webhookVerifyToken: credential.webhookVerifyToken ?? "",
      });
    }
  }, [credential, form]);

  const handleValidSubmit = useCallback(
    (values: WhatsAppCredentialFormValues) => {
      onSave(values);
    },
    [onSave],
  );

  return (
    <form
      onSubmit={form.handleSubmit(handleValidSubmit)}
      className="space-y-4"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="cred-baid">Business Account ID *</Label>
          <Input id="cred-baid" {...form.register("businessAccountId")} />
          {form.formState.errors.businessAccountId && (
            <p className="text-xs text-gym-danger">
              {form.formState.errors.businessAccountId.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="cred-waba">WABA ID *</Label>
          <Input id="cred-waba" {...form.register("wabaId")} />
          {form.formState.errors.wabaId && (
            <p className="text-xs text-gym-danger">
              {form.formState.errors.wabaId.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="cred-phoneid">Phone ID *</Label>
          <Input id="cred-phoneid" {...form.register("phoneId")} />
          {form.formState.errors.phoneId && (
            <p className="text-xs text-gym-danger">
              {form.formState.errors.phoneId.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="cred-phone">Número de Telefone *</Label>
          <Input
            id="cred-phone"
            placeholder="+5511999999999"
            {...form.register("phoneNumber")}
          />
          {form.formState.errors.phoneNumber && (
            <p className="text-xs text-gym-danger">
              {form.formState.errors.phoneNumber.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Modo *</Label>
          <Controller
            control={form.control}
            name="mode"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UNIT_NUMBER">Número por unidade</SelectItem>
                  <SelectItem value="NETWORK_SHARED_NUMBER">
                    Número compartilhado (rede)
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cred-expires">Expiração do Token *</Label>
          <Input
            id="cred-expires"
            type="datetime-local"
            {...form.register("accessTokenExpiresAt")}
          />
          {form.formState.errors.accessTokenExpiresAt && (
            <p className="text-xs text-gym-danger">
              {form.formState.errors.accessTokenExpiresAt.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cred-token">
          Access Token *{isEdit ? " (deixe vazio para manter o atual)" : ""}
        </Label>
        <Input
          id="cred-token"
          type="password"
          {...form.register("accessToken")}
          placeholder={isEdit ? "••••••••" : ""}
        />
        {form.formState.errors.accessToken && (
          <p className="text-xs text-gym-danger">
            {form.formState.errors.accessToken.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="cred-webhook">Webhook Verify Token (opcional)</Label>
        <Input id="cred-webhook" {...form.register("webhookVerifyToken")} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : isEdit ? "Salvar" : "Criar"}
        </Button>
      </div>
    </form>
  );
}
