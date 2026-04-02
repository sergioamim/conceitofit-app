"use client";

import { Controller, type UseFormReturn } from "react-hook-form";
import { MaskedInput } from "@/components/shared/masked-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Academia, GlobalAdminNewUnitsPolicyScope, Tenant } from "@/lib/types";
import type { CreateGlobalUserForm } from "./usuarios-types";

type UsuariosCreateFormProps = {
  createUserForm: UseFormReturn<CreateGlobalUserForm>;
  academias: Academia[];
  unidades: Tenant[];
  createAcademiaUnits: Tenant[];
  creatingUser: boolean;
  createFeedback: string | null;
  createError: string | null;
  onSubmit: (values: CreateGlobalUserForm) => void;
  toggleCreateTenant: (tenantId: string) => void;
  loadingCatalog: boolean;
  createForm: CreateGlobalUserForm;
  onResetForm: () => void;
};

export function UsuariosCreateForm({
  createUserForm,
  academias,
  createAcademiaUnits,
  creatingUser,
  createFeedback,
  createError,
  onSubmit,
  toggleCreateTenant,
  loadingCatalog,
  createForm,
  onResetForm,
}: UsuariosCreateFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Criar usuário na segurança global</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Esta superfície pode criar acesso global, por rede ou multiunidade. Fora daqui, a criação deve ficar restrita à rede corrente da academia.
        </p>

        <form className="grid gap-4 lg:grid-cols-2" onSubmit={createUserForm.handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="global-user-name">Nome completo</Label>
            <Input
              id="global-user-name"
              {...createUserForm.register("name")}
              placeholder="Ana Operações"
            />
            {createUserForm.formState.errors.name ? (
              <p className="text-xs text-gym-danger">{createUserForm.formState.errors.name.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="global-user-email">E-mail principal</Label>
            <Input
              id="global-user-email"
              type="email"
              {...createUserForm.register("email")}
              placeholder="ana@qa.local"
            />
            {createUserForm.formState.errors.email ? (
              <p className="text-xs text-gym-danger">{createUserForm.formState.errors.email.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="global-user-cpf">CPF</Label>
            <Controller
              control={createUserForm.control}
              name="cpf"
              render={({ field }) => (
                <MaskedInput
                  id="global-user-cpf"
                  mask="cpf"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  placeholder="111.222.333-44"
                />
              )}
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo de usuário</Label>
            <Controller
              control={createUserForm.control}
              name="userKind"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger aria-label="Tipo de usuário global">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COLABORADOR">Colaborador</SelectItem>
                    <SelectItem value="SUPORTE">Suporte</SelectItem>
                    <SelectItem value="PRESTADOR">Prestador</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label>Escopo inicial</Label>
            <Controller
              control={createUserForm.control}
              name="scopeType"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    const nextScope = value as CreateGlobalUserForm["scopeType"];
                    field.onChange(nextScope);
                    createUserForm.setValue("broadAccess", nextScope === "GLOBAL" ? createForm.broadAccess : false, { shouldDirty: true });
                    createUserForm.setValue("eligibleForNewUnits", nextScope === "REDE" ? createForm.eligibleForNewUnits : false, { shouldDirty: true });
                    createUserForm.setValue("academiaId", nextScope === "GLOBAL" ? "" : createForm.academiaId, { shouldDirty: true });
                    createUserForm.setValue("tenantIds", nextScope === "GLOBAL" ? [] : createForm.tenantIds, { shouldDirty: true });
                    createUserForm.setValue("defaultTenantId", nextScope === "GLOBAL" ? "" : createForm.defaultTenantId, { shouldDirty: true });
                  }}
                >
                  <SelectTrigger aria-label="Escopo inicial global">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UNIDADE">Unidade</SelectItem>
                    <SelectItem value="REDE">Rede</SelectItem>
                    <SelectItem value="GLOBAL">Global</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label>Academia de referência</Label>
            <Controller
              control={createUserForm.control}
              name="academiaId"
              render={({ field }) => (
                <Select
                  value={field.value || "__none__"}
                  onValueChange={(value) => {
                    field.onChange(value === "__none__" ? "" : value);
                    createUserForm.setValue("tenantIds", [], { shouldDirty: true });
                    createUserForm.setValue("defaultTenantId", "", { shouldDirty: true });
                  }}
                  disabled={createForm.scopeType === "GLOBAL"}
                >
                  <SelectTrigger aria-label="Academia de referência global">
                    <SelectValue placeholder="Selecione a academia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Selecione</SelectItem>
                    {academias.map((academia) => (
                      <SelectItem key={academia.id} value={academia.id}>
                        {academia.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {createForm.scopeType !== "GLOBAL" ? (
            <div className="space-y-2 lg:col-span-2">
              <Label>Unidades iniciais</Label>
              <div className="grid gap-2 rounded-lg border border-border p-3 md:grid-cols-2">
                {createAcademiaUnits.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Selecione uma academia para liberar as unidades.</p>
                ) : (
                  createAcademiaUnits.map((tenant) => (
                    <label key={tenant.id} className="flex items-start gap-2 rounded-md border border-border/60 px-3 py-2 text-sm">
                      <input
                        type="checkbox"
                        checked={createForm.tenantIds.includes(tenant.id)}
                        onChange={() => toggleCreateTenant(tenant.id)}
                      />
                      <span>
                        <span className="block font-medium text-foreground">{tenant.nome}</span>
                        <span className="block text-xs text-muted-foreground">
                          {academias.find((academia) => academia.id === (tenant.academiaId ?? tenant.groupId))?.nome ?? "Academia"}
                        </span>
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>
          ) : null}

          {createForm.scopeType !== "GLOBAL" ? (
            <div className="space-y-2">
              <Label>Unidade base</Label>
              <Select
                value={createForm.defaultTenantId || "__none__"}
                onValueChange={(value) => createUserForm.setValue("defaultTenantId", value === "__none__" ? "" : value, { shouldDirty: true })}
              >
                <SelectTrigger aria-label="Unidade base global">
                  <SelectValue placeholder="Selecione a unidade base" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Selecione</SelectItem>
                  {createAcademiaUnits
                    .filter((tenant) => createForm.tenantIds.includes(tenant.id))
                    .map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.nome}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {createForm.scopeType === "GLOBAL" ? (
            <label className="flex items-start gap-2 rounded-lg border border-border p-3 text-sm">
              <input
                type="checkbox"
                checked={createForm.broadAccess}
                onChange={(event) => createUserForm.setValue("broadAccess", event.target.checked, { shouldDirty: true })}
              />
              <span>
                <span className="block font-medium text-foreground">Marcar como acesso amplo</span>
                <span className="block text-xs text-muted-foreground">Sinaliza alçada alta já na criação global.</span>
              </span>
            </label>
          ) : null}

          {createForm.scopeType === "REDE" ? (
            <>
              <label className="flex items-start gap-2 rounded-lg border border-border p-3 text-sm">
                <input
                  type="checkbox"
                  checked={createForm.eligibleForNewUnits}
                  onChange={(event) => createUserForm.setValue("eligibleForNewUnits", event.target.checked, { shouldDirty: true })}
                />
                <span>
                  <span className="block font-medium text-foreground">Propagar para novas unidades</span>
                  <span className="block text-xs text-muted-foreground">Disponível apenas para criação em escopo de rede.</span>
                </span>
              </label>

              {createForm.eligibleForNewUnits ? (
                <div className="space-y-2">
                  <Label>Política inicial</Label>
                  <Select
                    value={createForm.policyScope}
                    onValueChange={(value) => createUserForm.setValue("policyScope", value as GlobalAdminNewUnitsPolicyScope, { shouldDirty: true })}
                  >
                    <SelectTrigger aria-label="Política inicial global">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACADEMIA_ATUAL">Mesma academia</SelectItem>
                      <SelectItem value="REDE">Rede inteira</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
            </>
          ) : null}

          {createError ? <p className="text-sm text-gym-danger lg:col-span-2">{createError}</p> : null}
          {createFeedback ? <p className="text-sm text-gym-teal lg:col-span-2">{createFeedback}</p> : null}

          <div className="flex gap-2 lg:col-span-2">
            <Button type="submit" disabled={creatingUser || loadingCatalog}>
              {creatingUser ? "Criando..." : "Criar usuário"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-border"
              onClick={onResetForm}
            >
              Limpar formulário
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
