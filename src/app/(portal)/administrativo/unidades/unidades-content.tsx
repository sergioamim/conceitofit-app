"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@/lib/forms/zod-resolver";
import { formatDateTimeBR } from "@/lib/formatters";
import { useQueryClient } from "@tanstack/react-query";
import {
  createUnidadeApi,
  deleteUnidadeApi,
  listUnidadesApi,
  toggleUnidadeApi,
  updateUnidadeApi,
} from "@/lib/api/contexto-unidades";
import type { Tenant } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Copy, Check, KeyRound } from "lucide-react";
import { PhoneInput } from "@/components/shared/phone-input";
import { DataTableRowActions } from "@/components/shared/data-table-row-actions";
import { useToast } from "@/components/ui/use-toast";
import { applyApiFieldErrors, buildFormApiErrorMessage } from "@/lib/forms/api-form-errors";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import type { CatracaCredentialResponse } from "@/lib/api/catraca";
import { useAuthAccess, useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { gerarCatracaCredencialAction, hasServerAdminToken } from "./actions";
import { PageError } from "@/components/shared/page-error";
import { useAdminCrud } from "@/lib/query/use-admin-crud";
import {
  buildUnidadeFormValues,
  buildUnidadePayload,
  EMPTY_UNIDADE_FORM_VALUES,
  mapUnidadeFieldError,
  type UnidadeFormValues,
  unidadeFormSchema,
} from "./unidade-form";

type CopyButtonProps = {
  label: string;
  value: string;
};

function CopyButton({ label, value }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  function handleCopy() {
    navigator.clipboard
      .writeText(value)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {
        toast({
          title: "Falha ao copiar",
          description: `Não foi possível copiar ${label.toLowerCase()}.`,
          variant: "destructive",
        });
      });
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded p-1.5 text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary"
      title={`Copiar ${label.toLowerCase()}`}
    >
      {copied ? <Check className="size-3.5 text-gym-teal" /> : <Copy className="size-3.5" />}
    </button>
  );
}

// Sentinel tenantId for global (non-tenant-scoped) unidades API
const GLOBAL_TENANT_KEY = "__global__";

export function UnidadesContent() {
  const access = useAuthAccess();
  const tenantContext = useTenantContext();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [currentTenantId, setCurrentTenantId] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmCredencialOpen, setConfirmCredencialOpen] = useState(false);
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [modalTab, setModalTab] = useState<"DADOS" | "CONFIG">("DADOS");
  const [credentialLoading, setCredentialLoading] = useState(false);
  const [credentialResult, setCredentialResult] = useState<CatracaCredentialResponse | null>(null);
  const [credentialError, setCredentialError] = useState("");
  const [credentialSuccess, setCredentialSuccess] = useState("");
  const [manualCatracaAdminToken, setManualCatracaAdminToken] = useState("");
  const [hasConfiguredCatracaTokenFromEnv, setHasConfiguredCatracaTokenFromEnv] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    reset,
    clearErrors,
    setError: setFieldError,
    watch,
    formState: { errors },
  } = useForm<UnidadeFormValues>({
    resolver: zodResolver(unidadeFormSchema),
    mode: "onChange",
    defaultValues: EMPTY_UNIDADE_FORM_VALUES,
  });

  const { items: rows, isLoading: loading, error: loadError, refetch, create, update, toggle } = useAdminCrud<
    Tenant,
    Omit<Tenant, "id">,
    Partial<Tenant>
  >({
    domain: "unidades",
    tenantId: GLOBAL_TENANT_KEY,
    enabled: true,
    listFn: () => listUnidadesApi(),
    createFn: (_tid, data) => createUnidadeApi(data),
    updateFn: (_tid, id, data) => updateUnidadeApi(id, data),
    toggleFn: (_tid, id) => toggleUnidadeApi(id),
  });

  const tenantSelecionado = rows.find((tenant) => tenant.id === currentTenantId);
  const tenantDisplay = tenantSelecionado?.nome || tenantSelecionado?.id || "Nenhuma unidade selecionada";
  const cupomPrintMode = watch("cupomPrintMode");

  useEffect(() => {
    setCurrentTenantId(tenantContext.tenantId);
  }, [tenantContext.tenantId]);

  useEffect(() => {
    void hasServerAdminToken().then(setHasConfiguredCatracaTokenFromEnv);
  }, []);

  function closeCatracaModal() {
    setConfirmCredencialOpen(false);
  }

  function resetModalState(nextValues: UnidadeFormValues = EMPTY_UNIDADE_FORM_VALUES) {
    setError("");
    clearErrors();
    reset(nextValues);
    setModalTab("DADOS");
  }

  function handleModalOpenChange(open: boolean) {
    setModalOpen(open);
    if (!open) {
      setEditing(null);
      resetModalState();
    }
  }

  async function handleGenerateCatraca() {
    if (!currentTenantId) {
      setCredentialError("Selecione uma unidade para gerar credencial.");
      return;
    }
    setCredentialLoading(true);
    setCredentialError("");
    setCredentialSuccess("");
    try {
      const result = await gerarCatracaCredencialAction({
        tenantId: currentTenantId,
        manualToken: manualCatracaAdminToken.trim() || undefined,
      });
      if (result.error) {
        setCredentialError(result.error);
      } else if (result.data) {
        setCredentialSuccess(credentialResult ? "Credencial regenerada, atualize o Tray." : "Credencial gerada. Atualize o Tray.");
        setCredentialResult(result.data);
        setConfirmCredencialOpen(false);
      }
    } catch (err) {
      setCredentialError(normalizeErrorMessage(err));
    } finally {
      setCredentialLoading(false);
    }
  }

  const sorted = useMemo(
    () =>
      [...rows].sort((a, b) => {
        if (a.id === currentTenantId) return -1;
        if (b.id === currentTenantId) return 1;
        return a.nome.localeCompare(b.nome);
      }),
    [rows, currentTenantId]
  );

  function openCreate() {
    setEditing(null);
    resetModalState();
    setModalOpen(true);
  }

  function openEdit(item: Tenant) {
    setEditing(item);
    resetModalState(buildUnidadeFormValues(item));
    setModalOpen(true);
  }

  async function handleSave(values: UnidadeFormValues) {
    setSaving(true);
    setError("");
    try {
      const payload = buildUnidadePayload(values);

      if (editing) {
        await update!.mutateAsync({ id: editing.id, data: payload });
      } else {
        await create!.mutateAsync({ ...payload, ativo: true } as Omit<Tenant, "id">);
      }
      handleModalOpenChange(false);
    } catch (saveError) {
      const { appliedFields } = applyApiFieldErrors(saveError, setFieldError, {
        mapField: mapUnidadeFieldError,
      });
      if (appliedFields.includes("configuracoes.impressaoCupom.larguraCustomMm")) {
        setModalTab("CONFIG");
      } else if (appliedFields.length > 0) {
        setModalTab("DADOS");
      }
      setError(buildFormApiErrorMessage(saveError, {
        appliedFields,
        fallbackMessage: "Revise os campos destacados e tente novamente.",
      }));
    } finally {
      setSaving(false);
    }
  }

  async function handleSetCurrent(id: string) {
    await tenantContext.setTenant(id);
    setCurrentTenantId(id);
    await refetch();
  }

  async function handleToggle(id: string) {
    await toggle!.mutateAsync(id);
  }

  async function handleDelete(id: string) {
    try {
      await deleteUnidadeApi(id);
      await queryClient.invalidateQueries({ queryKey: ["admin", "unidades"] });
    } catch (e) {
      toast({
        title: "Falha ao remover unidade",
        description: normalizeErrorMessage(e) || "Não foi possível remover a unidade.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="space-y-6">
      <Dialog open={modalOpen} onOpenChange={handleModalOpenChange}>
        <DialogContent className="border-border bg-card sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editing ? "Editar unidade" : "Nova unidade"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmit(handleSave, (formErrors) => {
              if (formErrors.cupomCustomWidthMm) {
                setModalTab("CONFIG");
              } else {
                setModalTab("DADOS");
              }
              setError("Revise os campos destacados e tente novamente.");
            })}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-secondary/30 p-1">
              <button
                type="button"
                className={`cursor-pointer rounded-md px-3 py-2 text-sm font-medium ${modalTab === "DADOS" ? "bg-card text-foreground" : "text-muted-foreground"}`}
                onClick={() => setModalTab("DADOS")}
              >
                Dados da unidade
              </button>
              <button
                type="button"
                className={`cursor-pointer rounded-md px-3 py-2 text-sm font-medium ${modalTab === "CONFIG" ? "bg-card text-foreground" : "text-muted-foreground"}`}
                onClick={() => setModalTab("CONFIG")}
              >
                Configurações
              </button>
            </div>

            {modalTab === "DADOS" ? (
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="unidade-nome" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nome *</label>
                  <Input id="unidade-nome" {...register("nome")} aria-invalid={errors.nome ? "true" : "false"} className="border-border bg-secondary" />
                  {errors.nome ? <p className="text-xs text-gym-danger">{errors.nome.message}</p> : null}
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="unidade-razao-social" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Razão social</label>
                  <Input id="unidade-razao-social" {...register("razaoSocial")} className="border-border bg-secondary" />
                  {errors.razaoSocial ? <p className="text-xs text-gym-danger">{errors.razaoSocial.message}</p> : null}
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="unidade-documento" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Documento (CNPJ)</label>
                  <Input id="unidade-documento" {...register("documento")} aria-invalid={errors.documento ? "true" : "false"} className="border-border bg-secondary" />
                  {errors.documento ? <p className="text-xs text-gym-danger">{errors.documento.message}</p> : null}
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="unidade-group-id" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Grupo *</label>
                  <Input id="unidade-group-id" {...register("groupId")} aria-invalid={errors.groupId ? "true" : "false"} className="border-border bg-secondary" />
                  {errors.groupId ? <p className="text-xs text-gym-danger">{errors.groupId.message}</p> : null}
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="unidade-subdomain" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Subdomínio</label>
                  <Input id="unidade-subdomain" {...register("subdomain")} aria-invalid={errors.subdomain ? "true" : "false"} className="border-border bg-secondary" />
                  {errors.subdomain ? <p className="text-xs text-gym-danger">{errors.subdomain.message}</p> : null}
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="unidade-email" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">E-mail</label>
                  <Input id="unidade-email" type="email" {...register("email")} aria-invalid={errors.email ? "true" : "false"} className="border-border bg-secondary" />
                  {errors.email ? <p className="text-xs text-gym-danger">{errors.email.message}</p> : null}
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="unidade-telefone" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Telefone</label>
                  <Controller
                    control={control}
                    name="telefone"
                    render={({ field }) => (
                      <PhoneInput
                        id="unidade-telefone"
                        value={field.value}
                        onChange={field.onChange}
                        aria-invalid={errors.telefone ? "true" : "false"}
                        className="border-border bg-secondary"
                      />
                    )}
                  />
                  {errors.telefone ? <p className="text-xs text-gym-danger">{errors.telefone.message}</p> : null}
                </div>
              </div>
            ) : (
              <div className="space-y-4 rounded-lg border border-border bg-secondary/20 p-4">
                <div>
                  <p className="text-sm font-semibold">Impressão de cupom de venda</p>
                  <p className="text-xs text-muted-foreground">
                    Define o tamanho padrão para recibo em impressora térmica desta unidade.
                  </p>
                </div>

                <Controller
                  control={control}
                  name="cupomPrintMode"
                  render={({ field }) => (
                    <div className="grid gap-2 md:grid-cols-3">
                      {[
                        { value: "80MM", label: "80mm (padrão)" },
                        { value: "58MM", label: "58mm" },
                        { value: "CUSTOM", label: "Customizado" },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => field.onChange(option.value)}
                          className={`cursor-pointer rounded-md border px-3 py-2 text-sm ${
                            field.value === option.value
                              ? "border-gym-accent bg-gym-accent/10 text-foreground"
                              : "border-border bg-card text-muted-foreground"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                />

                {cupomPrintMode === "CUSTOM" && (
                  <div className="space-y-1.5 md:max-w-xs">
                    <label htmlFor="unidade-cupom-custom-width" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Largura custom (mm)</label>
                    <Input
                      id="unidade-cupom-custom-width"
                      type="number"
                      min={40}
                      max={120}
                      {...register("cupomCustomWidthMm")}
                      aria-invalid={errors.cupomCustomWidthMm ? "true" : "false"}
                      className="border-border bg-card"
                    />
                    {errors.cupomCustomWidthMm ? (
                      <p className="text-xs text-gym-danger">{errors.cupomCustomWidthMm.message}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Faixa sugerida: 40mm a 120mm</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {error ? <p className="text-sm text-gym-danger">{error}</p> : null}

            <DialogFooter>
              <Button type="button" variant="outline" className="border-border" onClick={() => handleModalOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {confirmCredencialOpen && (
        <Dialog open onOpenChange={closeCatracaModal}>
          <DialogContent className="border-border bg-card sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">Gerar credencial do Tray</DialogTitle>
              <DialogDescription>
                Isto vai gerar um novo secret. Atualize o System Tray com o token gerado.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-border"
                onClick={closeCatracaModal}
                disabled={credentialLoading}
              >
                Cancelar
              </Button>
              <Button type="button" onClick={() => void handleGenerateCatraca()} disabled={credentialLoading}>
                {credentialLoading ? "Gerando..." : "Gerar credencial"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold">
              <KeyRound className="size-4" />
              Catraca / System Tray
            </p>
            <p className="text-xs text-muted-foreground">Tenant selecionado: <span className="font-semibold text-foreground">{tenantDisplay}</span></p>
          </div>
          <Button
            onClick={() => setConfirmCredencialOpen(true)}
            disabled={
              access.loading ||
              !access.canAccessElevatedModules ||
              !currentTenantId ||
              !(manualCatracaAdminToken.trim() || hasConfiguredCatracaTokenFromEnv)
            }
          >
            Gerar credencial do Tray
          </Button>
        </div>

        {!hasConfiguredCatracaTokenFromEnv ? (
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              X-Admin-Token (temporário nesta sessão)
            </label>
            <Input
              type="password"
              value={manualCatracaAdminToken}
              onChange={(event) => setManualCatracaAdminToken(event.target.value)}
              placeholder="Cole o token de integração"
              className="w-full border-border bg-secondary md:max-w-lg"
            />
            <p className="text-xs text-muted-foreground">
              Informe aqui o token enquanto não houver configuração de ambiente.
            </p>
          </div>
        ) : null}

        {access.loading ? (
          <p className="text-xs text-muted-foreground">Validando permissão...</p>
        ) : !access.canAccessElevatedModules ? (
          <p className="text-xs text-gym-danger">Acesso negado. Apenas usuários com permissão alta podem gerar a credencial.</p>
        ) : null}

        {credentialError ? <p className="text-sm text-gym-danger">{credentialError}</p> : null}
        {credentialSuccess ? <p className="text-sm text-gym-teal">{credentialSuccess}</p> : null}

        {credentialResult ? (
          <div className="space-y-2">
            <div className="grid gap-2 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">keyId</label>
                <div className="flex items-center gap-2">
                  <Input value={credentialResult.keyId} readOnly className="bg-secondary border-border" />
                  <CopyButton label="keyId" value={credentialResult.keyId} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Secret</label>
                <div className="flex items-center gap-2">
                  <Input value={credentialResult.secret} readOnly className="bg-secondary border-border" />
                  <CopyButton label="secret" value={credentialResult.secret} />
                </div>
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">bearerPlain</label>
                <div className="flex items-center gap-2">
                  <Input value={credentialResult.bearerPlain} readOnly className="bg-secondary border-border" />
                  <CopyButton label="bearerPlain" value={credentialResult.bearerPlain} />
                </div>
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">bearerBase64</label>
                <div className="flex items-center gap-2">
                  <Input value={credentialResult.bearerBase64} readOnly className="bg-secondary border-border" />
                  <CopyButton label="bearerBase64" value={credentialResult.bearerBase64} />
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Emitida em: {formatDateTimeBR(credentialResult.createdAt)}</p>
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Unidades</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cadastro e gestão das unidades da academia.
          </p>
        </div>
        <Button onClick={openCreate}>Nova unidade</Button>
      </div>

      <PageError error={loadError} onRetry={refetch} />

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary">
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Unidade</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Grupo</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Contato</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  Carregando unidades...
                </td>
              </tr>
            ) : null}
            {!loading && sorted.map((row) => {
              const isCurrent = row.id === currentTenantId;
              return (
                <tr key={row.id} className="transition-colors hover:bg-secondary/40">
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold">{row.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.razaoSocial || "Sem razão social"}{row.documento ? ` · ${row.documento}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">{row.subdomain ? `${row.subdomain}` : "Sem subdomínio"}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{row.groupId || "—"}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    <p>{row.email || "Sem e-mail"}</p>
                    <p>{row.telefone || "Sem telefone"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${row.ativo === false ? "bg-muted text-muted-foreground" : "bg-gym-teal/15 text-gym-teal"}`}>
                        {row.ativo === false ? "Inativa" : "Ativa"}
                      </span>
                      {isCurrent ? (
                        <span className="inline-flex w-fit items-center rounded-full bg-gym-accent/15 px-2.5 py-0.5 text-[11px] font-semibold text-gym-accent">
                          Unidade ativa
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <DataTableRowActions
                      actions={[
                        ...(!isCurrent && row.ativo !== false
                          ? [
                              {
                                label: "Ativar contexto",
                                kind: "open" as const,
                                onClick: () => handleSetCurrent(row.id),
                              },
                            ]
                          : []),
                        {
                          label: "Editar",
                          kind: "edit" as const,
                          onClick: () => openEdit(row),
                        },
                        {
                          label: row.ativo === false ? "Ativar" : "Desativar",
                          kind: "toggle" as const,
                          disabled: isCurrent,
                          onClick: () => handleToggle(row.id),
                        },
                        {
                          label: "Remover",
                          kind: "delete" as const,
                          disabled: isCurrent,
                          onClick: () => handleDelete(row.id),
                        },
                      ]}
                    />
                  </td>
                </tr>
              );
            })}
            {!loading && sorted.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  Nenhuma unidade cadastrada
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
