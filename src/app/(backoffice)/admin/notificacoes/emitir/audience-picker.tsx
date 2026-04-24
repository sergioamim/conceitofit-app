"use client";

/**
 * AudiencePicker — componente controlado para selecionar o público-alvo
 * de uma emissão manual de notificação global (Epic 4 — Story 4.23).
 *
 * Renderiza o Select principal de audienceTipo e, condicionalmente, os
 * campos dependentes (redeId, tenantId, role, userId). Os valores são
 * gerenciados pelo react-hook-form do consumidor via `control`.
 */

import { useMemo } from "react";
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
  useWatch,
} from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useAdminAcademias,
  useAdminUnidades,
} from "@/backoffice/query/use-admin-academias";
import type {
  NotificacaoAudienceTipo,
  NotificacaoRoleAudience,
} from "@/lib/shared/types/notificacao-inbox";

// ---------------------------------------------------------------------------
// Schema compartilhado de campos que este picker gerencia
// ---------------------------------------------------------------------------

export interface AudiencePickerFormShape {
  audienceTipo: NotificacaoAudienceTipo;
  redeId?: string;
  tenantId?: string;
  role?: NotificacaoRoleAudience;
  userId?: number;
}

const AUDIENCE_OPTIONS: Array<{
  value: NotificacaoAudienceTipo;
  label: string;
  hint: string;
}> = [
  {
    value: "GLOBAL",
    label: "Global (todos os usuários)",
    hint: "Notificação visível a TODOS os usuários do SaaS.",
  },
  {
    value: "REDE",
    label: "Rede / Academia",
    hint: "Todos os usuários de uma rede (academia) específica.",
  },
  {
    value: "TENANT",
    label: "Unidade / Tenant",
    hint: "Todos os usuários de uma unidade (tenant) específica.",
  },
  {
    value: "ROLE",
    label: "Papel em uma unidade",
    hint: "Usuários com um papel específico em uma unidade.",
  },
  {
    value: "USUARIO",
    label: "Usuário individual",
    hint: "Um único usuário identificado por userId.",
  },
];

const ROLE_OPTIONS: Array<{ value: NotificacaoRoleAudience; label: string }> = [
  { value: "ADMIN", label: "ADMIN" },
  { value: "SUPER_ADMIN", label: "SUPER_ADMIN" },
  { value: "GERENTE", label: "GERENTE" },
  { value: "FINANCEIRO", label: "FINANCEIRO" },
  { value: "INSTRUTOR", label: "INSTRUTOR" },
  { value: "RECEPCAO", label: "RECEPCAO" },
  { value: "CUSTOMER", label: "CUSTOMER" },
  { value: "VIEWER", label: "VIEWER" },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface AudiencePickerProps<T extends FieldValues> {
  /** Control do react-hook-form do form container. */
  control: Control<T>;
  /** Se true, desabilita os controles (ex.: durante submit). */
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function AudiencePicker<T extends FieldValues>({
  control,
  disabled,
}: AudiencePickerProps<T>) {
  const audienceTipo = useWatch({
    control,
    name: "audienceTipo" as Path<T>,
  }) as NotificacaoAudienceTipo | undefined;

  const activeOption = useMemo(
    () => AUDIENCE_OPTIONS.find((o) => o.value === audienceTipo),
    [audienceTipo],
  );

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="audienceTipo">
          Público-alvo <span className="text-gym-danger">*</span>
        </Label>
        <Controller
          control={control}
                    name={"audienceTipo" as Path<T>}
          render={({ field }) => (
            <Select
              value={(field.value as string | undefined) ?? undefined}
              onValueChange={(value) => field.onChange(value)}
              disabled={disabled}
            >
              <SelectTrigger id="audienceTipo" aria-label="Público-alvo">
                <SelectValue placeholder="Selecione o escopo" />
              </SelectTrigger>
              <SelectContent>
                {AUDIENCE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {activeOption ? (
          <p className="text-xs text-muted-foreground">{activeOption.hint}</p>
        ) : null}
      </div>

      {audienceTipo === "REDE" ? (
        <RedePicker control={control} disabled={disabled} />
      ) : null}

      {audienceTipo === "TENANT" ? (
        <TenantPicker control={control} disabled={disabled} />
      ) : null}

      {audienceTipo === "ROLE" ? (
        <>
          <TenantPicker control={control} disabled={disabled} />
          <RolePicker control={control} disabled={disabled} />
        </>
      ) : null}

      {audienceTipo === "USUARIO" ? (
        <UserIdPicker control={control} disabled={disabled} />
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-pickers — usam o control já tipado
// ---------------------------------------------------------------------------

function RedePicker<T extends FieldValues>({ control, disabled }: { control: Control<T>; disabled?: boolean }) {
  const { data: academias, isLoading, error } = useAdminAcademias();

  if (isLoading) {
    return (
      <div className="space-y-1.5">
        <Label>
          Rede (academia) <span className="text-gym-danger">*</span>
        </Label>
        <p className="text-xs text-muted-foreground">Carregando academias...</p>
      </div>
    );
  }

  if (error || !academias || academias.length === 0) {
    return (
      <div className="space-y-1.5">
        <Label htmlFor="redeId">
          Rede (academia) — UUID <span className="text-gym-danger">*</span>
        </Label>
        <Controller
          control={control}
                    name={"redeId" as Path<T>}
          render={({ field }) => (
            <Input
              id="redeId"
              placeholder="UUID da academia"
              value={(field.value as string | undefined) ?? ""}
              onChange={(e) => field.onChange(e.target.value || undefined)}
              disabled={disabled}
              autoComplete="off"
            />
          )}
        />
        <p className="text-xs text-muted-foreground">
          Listagem indisponível — informe o UUID diretamente.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor="redeId">
        Rede (academia) <span className="text-gym-danger">*</span>
      </Label>
      <Controller
        control={control}
                name={"redeId" as Path<T>}
        render={({ field }) => (
          <Select
            value={(field.value as string | undefined) ?? undefined}
            onValueChange={(value) => field.onChange(value || undefined)}
            disabled={disabled}
          >
            <SelectTrigger id="redeId" aria-label="Rede">
              <SelectValue placeholder="Selecione uma academia" />
            </SelectTrigger>
            <SelectContent>
              {academias.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      <p className="text-xs text-muted-foreground">
        Todos os usuários vinculados a essa rede receberão a notificação.
      </p>
    </div>
  );
}

function TenantPicker<T extends FieldValues>({ control, disabled }: { control: Control<T>; disabled?: boolean }) {
  const { data: unidades, isLoading, error } = useAdminUnidades();

  if (isLoading) {
    return (
      <div className="space-y-1.5">
        <Label>
          Unidade (tenant) <span className="text-gym-danger">*</span>
        </Label>
        <p className="text-xs text-muted-foreground">Carregando unidades...</p>
      </div>
    );
  }

  if (error || !unidades || unidades.length === 0) {
    return (
      <div className="space-y-1.5">
        <Label htmlFor="tenantId">
          Unidade (tenant) — UUID <span className="text-gym-danger">*</span>
        </Label>
        <Controller
          control={control}
                    name={"tenantId" as Path<T>}
          render={({ field }) => (
            <Input
              id="tenantId"
              placeholder="UUID do tenant"
              value={(field.value as string | undefined) ?? ""}
              onChange={(e) => field.onChange(e.target.value || undefined)}
              disabled={disabled}
              autoComplete="off"
            />
          )}
        />
        <p className="text-xs text-muted-foreground">
          Listagem indisponível — informe o UUID diretamente.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor="tenantId">
        Unidade (tenant) <span className="text-gym-danger">*</span>
      </Label>
      <Controller
        control={control}
                name={"tenantId" as Path<T>}
        render={({ field }) => (
          <Select
            value={(field.value as string | undefined) ?? undefined}
            onValueChange={(value) => field.onChange(value || undefined)}
            disabled={disabled}
          >
            <SelectTrigger id="tenantId" aria-label="Unidade">
              <SelectValue placeholder="Selecione uma unidade" />
            </SelectTrigger>
            <SelectContent>
              {unidades.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.nome}
                  {t.academiaNome ? ` · ${t.academiaNome}` : null}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
    </div>
  );
}

function RolePicker<T extends FieldValues>({ control, disabled }: { control: Control<T>; disabled?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="role">
        Papel (role) <span className="text-gym-danger">*</span>
      </Label>
      <Controller
        control={control}
                name={"role" as Path<T>}
        render={({ field }) => (
          <Select
            value={(field.value as string | undefined) ?? undefined}
            onValueChange={(value) => field.onChange(value || undefined)}
            disabled={disabled}
          >
            <SelectTrigger id="role" aria-label="Papel">
              <SelectValue placeholder="Selecione o papel" />
            </SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      <p className="text-xs text-muted-foreground">
        Somente usuários com este papel na unidade selecionada receberão a notificação.
      </p>
    </div>
  );
}

function UserIdPicker<T extends FieldValues>({ control, disabled }: { control: Control<T>; disabled?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="userId">
        userId <span className="text-gym-danger">*</span>
      </Label>
      <Controller
        control={control}
                name={"userId" as Path<T>}
        render={({ field }) => (
          <Input
            id="userId"
            type="number"
            inputMode="numeric"
            placeholder="Ex.: 1234"
            value={
              typeof field.value === "number" && Number.isFinite(field.value)
                ? String(field.value)
                : ""
            }
            onChange={(e) => {
              const raw = e.target.value;
              if (!raw) {
                field.onChange(undefined);
                return;
              }
              const n = Number(raw);
              field.onChange(Number.isFinite(n) ? n : undefined);
            }}
            disabled={disabled}
            autoComplete="off"
          />
        )}
      />
      <p className="text-xs text-muted-foreground">
        Identificador numérico (BIGINT) do usuário no backend.
      </p>
    </div>
  );
}
