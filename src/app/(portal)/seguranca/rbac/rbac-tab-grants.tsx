import { useState } from "react";
import { Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableCell } from "@/components/ui/table";
import { PaginatedTable } from "@/components/shared/paginated-table";
import { SecuritySectionFeedback, SecurityEmptyState } from "@/components/security/security-feedback";
import type { RbacFeature, RbacGrant, RbacPerfil, RbacPermission } from "@/lib/types";
import type { UseFormReturn } from "react-hook-form";

export type GrantFormState = {
  id?: string;
  roleName: string;
  featureKey: string;
  permission: RbacPermission;
  allowed: boolean;
};

const GRANT_PERMISSION_OPTIONS: RbacPermission[] = ["VIEW", "EDIT", "MANAGE"];

type RbacTabGrantsProps = {
  grantForm: UseFormReturn<GrantFormState>;
  grantFormValues: GrantFormState;
  features: RbacFeature[];
  grants: RbacGrant[];
  activePerfis: RbacPerfil[];
  grantsLoading: boolean;
  grantActionLoading: boolean;
  grantsError: string | null;
  isActionLoading: boolean;
  tenantName: string;
  onSubmitGrant: (values: GrantFormState) => Promise<void>;
  onSubmitFeatureConfig: (featureKey: string, enabled: boolean, rollout: string) => Promise<void>;
};

const grantColumns = [
  { label: "Perfil", className: "w-52" },
  { label: "Funcionalidade", className: "w-52" },
  { label: "Permissão", className: "w-28" },
  { label: "Permitido", className: "w-24" },
  { label: "Atualizado", className: "w-36" },
];

export function RbacTabGrants({
  grantForm,
  grantFormValues,
  features,
  grants,
  activePerfis,
  grantsLoading,
  grantActionLoading,
  grantsError,
  isActionLoading,
  tenantName,
  onSubmitGrant,
  onSubmitFeatureConfig,
}: RbacTabGrantsProps) {
  return (
    <section className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Funcionalidades da plataforma</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {features.length === 0 ? (
              <SecurityEmptyState text="Nenhuma funcionalidade definida." />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {features.map((feature) => (
                  <FeatureToggleRow
                    key={`${feature.featureKey}-${feature.enabled}-${feature.rollout}`}
                    feature={feature}
                    isSaving={grantActionLoading || isActionLoading}
                    onSave={(enabled, rollout) => onSubmitFeatureConfig(feature.featureKey, enabled, rollout)}
                  />
                ))}
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              Feito em: {tenantName}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display">Permissões detalhadas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="grid gap-3 md:grid-cols-5" onSubmit={grantForm.handleSubmit(onSubmitGrant)}>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Perfil</label>
              <Controller
                control={grantForm.control}
                name="roleName"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Selecione o perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      {activePerfis.map((perfil) => (
                        <SelectItem key={perfil.id} value={perfil.roleName}>
                          {perfil.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Funcionalidade</label>
              <Controller
                control={grantForm.control}
                name="featureKey"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Selecione a feature" />
                    </SelectTrigger>
                    <SelectContent>
                      {features.map((feature) => (
                        <SelectItem key={feature.featureKey} value={feature.featureKey}>
                          {feature.featureKey}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Permissão</label>
              <Controller
                control={grantForm.control}
                name="permission"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={(value) => field.onChange(value as RbacPermission)}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GRANT_PERMISSION_OPTIONS.map((permission) => (
                        <SelectItem key={permission} value={permission}>
                          {permission}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Permite</label>
              <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={grantFormValues.allowed}
                  onChange={(event) => grantForm.setValue("allowed", event.target.checked, { shouldDirty: true })}
                />
                Sim
              </label>
            </div>

            <div className="flex items-end md:col-span-5 md:justify-end">
              <Button type="submit" disabled={grantActionLoading}>
                Salvar Grant
              </Button>
            </div>
          </form>

          <SecuritySectionFeedback loading={grantsLoading || grantActionLoading} error={grantsError} />

          <PaginatedTable
            columns={grantColumns}
            items={grants}
            getRowKey={(grant) => `${grant.roleName}-${grant.featureKey}-${grant.permission}`}
            emptyText="Nenhum grant cadastrado."
            renderCells={(grant) => (
              <>
                <TableCell className="px-3 py-2 font-mono text-xs">{grant.roleName}</TableCell>
                <TableCell className="px-3 py-2">{grant.featureKey}</TableCell>
                <TableCell className="px-3 py-2">{grant.permission}</TableCell>
                <TableCell className="px-3 py-2">{grant.allowed ? "SIM" : "NÃO"}</TableCell>
                <TableCell className="px-3 py-2 text-muted-foreground">{"—"}</TableCell>
              </>
            )}
            showPagination={false}
          />
        </CardContent>
      </Card>
    </section>
  );
}

function FeatureToggleRow({
  feature,
  isSaving,
  onSave,
}: {
  feature: {
    featureKey: string;
    enabled: boolean;
    rollout: number;
  };
  isSaving: boolean;
  onSave: (enabled: boolean, rollout: string) => void;
}) {
  const [enabled, setEnabled] = useState(feature.enabled);
  const [rollout, setRollout] = useState(String(feature.rollout));

  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-3">
      <div className="space-y-2">
        <p className="text-sm font-semibold">{feature.featureKey}</p>
        <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
          Habilitada
        </label>
        <div className="flex gap-2">
          <Input
            value={rollout}
            onChange={(event) => setRollout(event.target.value)}
            className="bg-card border-border"
            aria-label={`Rollout da feature ${feature.featureKey}`}
          />
          <Button
            size="sm"
            onClick={() => onSave(enabled, rollout)}
            disabled={isSaving}
          >
            Salvar
          </Button>
        </div>
      </div>
    </div>
  );
}
