"use client";

import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@/lib/forms/zod-resolver";
import { formatDate } from "@/lib/formatters";
import { listVouchersApi } from "@/lib/api/beneficios";
import { normalizeCapabilityError } from "@/lib/api/backend-capability";
import { getBusinessTodayIso } from "@/lib/business-date";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import {
  useCrmCampanhas,
  useCreateCrmCampanha,
  useUpdateCrmCampanha,
  useDispararCrmCampanha,
  useEncerrarCrmCampanha,
} from "@/lib/query/use-crm-campanhas";
import type {
  CampanhaCRM,
  CampanhaCanal,
  CampanhaPublicoAlvo,
  CampanhaStatus,
  Voucher,
} from "@/lib/types";
import { applyApiFieldErrors, buildFormApiErrorMessage } from "@/lib/forms/api-form-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  campanhaFormSchema,
  campanhaToFormValues,
  createCampanhaFormDefaults,
  type CampanhaFormValues,
} from "./campanha-form-schema";

const PUBLICO_OPTIONS: Array<{ value: CampanhaPublicoAlvo; label: string; help: string }> = [
  { value: "EVADIDOS_ULTIMOS_3_MESES", label: "Evadidos últimos 3 meses", help: "Alunos inativos/cancelados com última matrícula encerrada em até 90 dias." },
  { value: "PROSPECTS_EM_ABERTO", label: "Prospects em aberto", help: "Leads que ainda não converteram e não foram perdidos." },
  { value: "ALUNOS_INATIVOS", label: "Alunos inativos", help: "Alunos com status inativo, cancelado ou suspenso." },
];

const CANAIS: Array<{ value: CampanhaCanal; label: string }> = [
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "EMAIL", label: "E-mail" },
  { value: "SMS", label: "SMS" },
  { value: "LIGACAO", label: "Ligação" },
];

function statusStyle(status: CampanhaStatus): string {
  if (status === "ATIVA") return "bg-gym-teal/15 text-gym-teal";
  if (status === "ENCERRADA") return "bg-muted text-muted-foreground";
  return "bg-gym-warning/15 text-gym-warning";
}

export default function CampanhasCrmPage() {
  const tenantContext = useTenantContext();
  const tenantId = tenantContext.tenantId ?? "";
  const [statusFilter, setStatusFilter] = useState<"TODAS" | CampanhaStatus>("TODAS");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CampanhaCRM | null>(null);
  const [error, setError] = useState("");
  const [modalError, setModalError] = useState("");
  const [writeUnavailable, setWriteUnavailable] = useState(false);

  const form = useForm<CampanhaFormValues>({
    resolver: zodResolver(campanhaFormSchema),
    mode: "onTouched",
    defaultValues: createCampanhaFormDefaults(getBusinessTodayIso()),
  });

  const watchedPublicoAlvo = useWatch({ control: form.control, name: "publicoAlvo" });
  const watchedCanais = useWatch({ control: form.control, name: "canais" }) ?? [];
  const watchedVoucherId = useWatch({ control: form.control, name: "voucherId" });
  const watchedStatus = useWatch({ control: form.control, name: "status" });

  const {
    data: rows = [],
    isLoading: loading,
    isError: queryError,
    error: queryErrorObj,
  } = useCrmCampanhas({
    tenantId: tenantId || undefined,
    tenantResolved: Boolean(tenantId),
    status: statusFilter === "TODAS" ? undefined : statusFilter,
  });

  const createMutation = useCreateCrmCampanha();
  const updateMutation = useUpdateCrmCampanha();
  const dispararMutation = useDispararCrmCampanha();
  const encerrarMutation = useEncerrarCrmCampanha();

  const { data: vouchers = [] } = useQuery<Voucher[]>({
    queryKey: ["crm-campanhas-vouchers"],
    queryFn: async () => {
      try {
        const result = await listVouchersApi();
        return result.filter((v) => v.ativo && (v.usarNaVenda || v.tipo.toUpperCase().includes("DESCONTO")));
      } catch {
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const summary = useMemo(() => {
    const total = rows.length;
    const ativas = rows.filter((r) => r.status === "ATIVA").length;
    const rascunho = rows.filter((r) => r.status === "RASCUNHO").length;
    const disparos = rows.reduce((sum, r) => sum + (r.disparosRealizados ?? 0), 0);
    return { total, ativas, rascunho, disparos };
  }, [rows]);

  const queryCapabilityMessage = useMemo(() => {
    if (!queryError || !queryErrorObj) return "";
    return normalizeCapabilityError(queryErrorObj, "Falha ao carregar campanhas CRM.");
  }, [queryError, queryErrorObj]);

  const campaignsUnavailable = queryCapabilityMessage.startsWith("Backend ainda não expõe");
  const pageError = !campaignsUnavailable && queryCapabilityMessage ? queryCapabilityMessage : error;

  const saving = createMutation.isPending || updateMutation.isPending;

  const resetModalState = useCallback(() => {
    setEditing(null);
    setModalError("");
    form.reset(createCampanhaFormDefaults(getBusinessTodayIso()));
  }, [form]);

  const handleModalOpenChange = useCallback((open: boolean) => {
    setModalOpen(open);
    if (!open) {
      resetModalState();
    }
  }, [resetModalState]);

  function openCreate() {
    if (campaignsUnavailable || writeUnavailable) return;
    setError("");
    resetModalState();
    setModalOpen(true);
  }

  function openEdit(row: CampanhaCRM) {
    if (campaignsUnavailable || writeUnavailable) return;
    setError("");
    setModalError("");
    setEditing(row);
    form.reset(campanhaToFormValues(row));
    setModalOpen(true);
  }

  function toggleCanal(canal: CampanhaCanal) {
    const next = watchedCanais.includes(canal)
      ? watchedCanais.filter((item) => item !== canal)
      : [...watchedCanais, canal];
    form.setValue("canais", next, { shouldDirty: true, shouldValidate: true });
  }

  const handleSave = form.handleSubmit(async (values) => {
    if (!tenantId || campaignsUnavailable || writeUnavailable) return;

    setModalError("");
    form.clearErrors();

    try {
      const payload = {
        nome: values.nome.trim(),
        descricao: values.descricao.trim() || undefined,
        publicoAlvo: values.publicoAlvo,
        canais: values.canais,
        voucherId: values.voucherId === "none" ? undefined : values.voucherId,
        dataInicio: values.dataInicio,
        dataFim: values.dataFim.trim() || undefined,
        status: values.status,
      };

      if (editing) {
        await updateMutation.mutateAsync({ tenantId, id: editing.id, data: payload });
      } else {
        await createMutation.mutateAsync({ tenantId, data: payload });
      }

      setModalOpen(false);
      resetModalState();
    } catch (submitError) {
      const appliedFields = applyApiFieldErrors(submitError, form.setError).appliedFields;
      const fallbackMessage = normalizeCapabilityError(
        submitError,
        editing ? "Falha ao salvar campanha CRM." : "Falha ao criar campanha CRM.",
      );
      const message = buildFormApiErrorMessage(submitError, {
        appliedFields,
        fallbackMessage,
      });
      if (message) {
        setModalError(message);
        if (message.startsWith("Backend ainda não expõe")) {
          setWriteUnavailable(true);
        }
      }
    }
  });

  async function handleDisparar(id: string) {
    if (!tenantId || campaignsUnavailable || writeUnavailable) return;
    try {
      setError("");
      await dispararMutation.mutateAsync({ tenantId, id });
    } catch (submitError) {
      const message = normalizeCapabilityError(submitError, "Falha ao disparar campanha CRM.");
      setError(message);
      if (message.startsWith("Backend ainda não expõe")) {
        setWriteUnavailable(true);
      }
    }
  }

  async function handleEncerrar(id: string) {
    if (!tenantId || campaignsUnavailable || writeUnavailable) return;
    try {
      setError("");
      await encerrarMutation.mutateAsync({ tenantId, id });
    } catch (submitError) {
      const message = normalizeCapabilityError(submitError, "Falha ao encerrar campanha CRM.");
      setError(message);
      if (message.startsWith("Backend ainda não expõe")) {
        setWriteUnavailable(true);
      }
    }
  }

  return (
    <div className="space-y-6">
      <Dialog open={modalOpen} onOpenChange={handleModalOpenChange}>
        <DialogContent className="border-border bg-card sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editing ? "Editar campanha CRM" : "Nova campanha CRM"}
            </DialogTitle>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSave}>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nome *</label>
                <Input
                  {...form.register("nome")}
                  className="border-border bg-secondary"
                />
                {form.formState.errors.nome ? (
                  <p className="text-xs text-gym-danger">{form.formState.errors.nome.message}</p>
                ) : null}
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Descrição</label>
                <Input
                  {...form.register("descricao")}
                  className="border-border bg-secondary"
                />
                {form.formState.errors.descricao ? (
                  <p className="text-xs text-gym-danger">{form.formState.errors.descricao.message}</p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Público alvo</label>
                <Select
                  value={watchedPublicoAlvo}
                  onValueChange={(value) => form.setValue("publicoAlvo", value as CampanhaPublicoAlvo, { shouldDirty: true, shouldValidate: true })}
                >
                  <SelectTrigger className="border-border bg-secondary"><SelectValue /></SelectTrigger>
                  <SelectContent className="border-border bg-card">
                    {PUBLICO_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {PUBLICO_OPTIONS.find((option) => option.value === watchedPublicoAlvo)?.help}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Voucher da campanha</label>
                <Select
                  value={watchedVoucherId}
                  onValueChange={(value) => form.setValue("voucherId", value, { shouldDirty: true, shouldValidate: true })}
                >
                  <SelectTrigger className="border-border bg-secondary"><SelectValue /></SelectTrigger>
                  <SelectContent className="border-border bg-card">
                    <SelectItem value="none">Sem voucher</SelectItem>
                    {vouchers.map((voucher) => (
                      <SelectItem key={voucher.id} value={voucher.id}>
                        {voucher.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Data início</label>
                <Input
                  type="date"
                  {...form.register("dataInicio")}
                  className="border-border bg-secondary"
                />
                {form.formState.errors.dataInicio ? (
                  <p className="text-xs text-gym-danger">{form.formState.errors.dataInicio.message}</p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Data fim</label>
                <Input
                  type="date"
                  {...form.register("dataFim")}
                  className="border-border bg-secondary"
                />
                {form.formState.errors.dataFim ? (
                  <p className="text-xs text-gym-danger">{form.formState.errors.dataFim.message}</p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</label>
                <Select
                  value={watchedStatus}
                  onValueChange={(value) => form.setValue("status", value as CampanhaStatus, { shouldDirty: true, shouldValidate: true })}
                >
                  <SelectTrigger className="border-border bg-secondary"><SelectValue /></SelectTrigger>
                  <SelectContent className="border-border bg-card">
                    <SelectItem value="RASCUNHO">Rascunho</SelectItem>
                    <SelectItem value="ATIVA">Ativa</SelectItem>
                    <SelectItem value="ENCERRADA">Encerrada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Canais de divulgação</label>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  {CANAIS.map((canal) => {
                    const selected = watchedCanais.includes(canal.value);
                    return (
                      <button
                        key={canal.value}
                        type="button"
                        onClick={() => toggleCanal(canal.value)}
                        className={`cursor-pointer rounded-md border px-3 py-2 text-sm ${
                          selected
                            ? "border-gym-accent bg-gym-accent/10 text-foreground"
                            : "border-border bg-secondary/30 text-muted-foreground"
                        }`}
                      >
                        {canal.label}
                      </button>
                    );
                  })}
                </div>
                {form.formState.errors.canais ? (
                  <p className="text-xs text-gym-danger">{form.formState.errors.canais.message}</p>
                ) : null}
              </div>
            </div>

            {modalError ? <p className="text-sm text-gym-danger">{modalError}</p> : null}

            <DialogFooter>
              <Button variant="outline" className="border-border" onClick={() => handleModalOpenChange(false)} type="button">
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Salvando..." : "Salvar campanha"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Campanhas CRM</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Planejamento de campanhas com público alvo, voucher e canais de comunicação da unidade{" "}
            <span className="font-semibold text-foreground">{tenantContext.tenantName ?? "atual"}</span>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "TODAS" | CampanhaStatus)}>
            <SelectTrigger className="w-[170px] border-border bg-secondary"><SelectValue /></SelectTrigger>
            <SelectContent className="border-border bg-card">
              <SelectItem value="TODAS">Todas</SelectItem>
              <SelectItem value="RASCUNHO">Rascunho</SelectItem>
              <SelectItem value="ATIVA">Ativa</SelectItem>
              <SelectItem value="ENCERRADA">Encerrada</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={openCreate} disabled={campaignsUnavailable || writeUnavailable}>
            Nova campanha
          </Button>
        </div>
      </div>

      {pageError ? (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {pageError}
        </div>
      ) : null}
      {campaignsUnavailable ? (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Este ambiente ainda não expõe campanhas CRM no backend. O módulo permanece visível, mas em modo somente leitura.
        </div>
      ) : null}
      {writeUnavailable && !campaignsUnavailable ? (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          O backend atual permite leitura das campanhas, mas ainda não expõe mutações auditáveis para este ambiente.
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-3"><p className="text-[11px] uppercase tracking-wider text-muted-foreground">Campanhas</p><p className="mt-1 text-2xl font-bold">{summary.total}</p></div>
        <div className="rounded-lg border border-border bg-card p-3"><p className="text-[11px] uppercase tracking-wider text-muted-foreground">Ativas</p><p className="mt-1 text-2xl font-bold text-gym-teal">{summary.ativas}</p></div>
        <div className="rounded-lg border border-border bg-card p-3"><p className="text-[11px] uppercase tracking-wider text-muted-foreground">Rascunho</p><p className="mt-1 text-2xl font-bold text-gym-warning">{summary.rascunho}</p></div>
        <div className="rounded-lg border border-border bg-card p-3"><p className="text-[11px] uppercase tracking-wider text-muted-foreground">Disparos</p><p className="mt-1 text-2xl font-bold">{summary.disparos}</p></div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary">
              <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Campanha</th>
              <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Público / Canais</th>
              <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Voucher</th>
              <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
              <th scope="col" className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  Carregando campanhas CRM...
                </td>
              </tr>
            ) : null}
            {rows.map((row) => (
              <tr key={row.id} className="transition-colors hover:bg-secondary/30">
                <td className="px-4 py-3">
                  <p className="text-sm font-semibold">{row.nome}</p>
                  <p className="text-xs text-muted-foreground">{row.descricao || "Sem descrição"}</p>
                  <p className="text-xs text-muted-foreground">Início: {formatDate(row.dataInicio)}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm">{PUBLICO_OPTIONS.find((item) => item.value === row.publicoAlvo)?.label}</p>
                  <p className="text-xs text-muted-foreground">{row.canais.join(" · ")}</p>
                  <p className="text-xs text-muted-foreground">Audiência estimada: {row.audienceEstimado ?? 0}</p>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {row.voucherId ? vouchers.find((v) => v.id === row.voucherId)?.nome ?? "Voucher removido" : "Sem voucher"}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusStyle(row.status)}`}>
                    {row.status}
                  </span>
                  <p className="mt-1 text-xs text-muted-foreground">Disparos: {row.disparosRealizados}</p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-border"
                      disabled={campaignsUnavailable || writeUnavailable}
                      onClick={() => openEdit(row)}
                    >
                      Editar
                    </Button>
                    {row.status !== "ENCERRADA" && (
                      <Button size="sm" disabled={campaignsUnavailable || writeUnavailable} onClick={() => handleDisparar(row.id)}>
                        Disparar
                      </Button>
                    )}
                    {row.status === "ATIVA" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-border"
                        disabled={campaignsUnavailable || writeUnavailable}
                        onClick={() => handleEncerrar(row.id)}
                      >
                        Encerrar
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  Nenhuma campanha encontrada
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
