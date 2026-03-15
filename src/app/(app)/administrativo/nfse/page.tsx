"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, RefreshCw, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  getNfseConfiguracaoAtualApi,
  salvarNfseConfiguracaoAtualApi,
  validarNfseConfiguracaoAtualApi,
} from "@/lib/api/admin-financeiro";
import { buildNfseChecklist, NFSE_STATUS_LABEL } from "@/lib/admin-financeiro";
import { useAuthAccess, useTenantContext } from "@/hooks/use-session-context";
import type { NfseAmbiente, NfseConfiguracao, NfseProvider, NfseRegimeTributario } from "@/lib/types";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

const AMBIENTE_OPTIONS: Array<{ value: NfseAmbiente; label: string }> = [
  { value: "HOMOLOGACAO", label: "Homologação" },
  { value: "PRODUCAO", label: "Produção" },
];

const PROVEDOR_OPTIONS: Array<{ value: NfseProvider; label: string }> = [
  { value: "GINFES", label: "GINFES" },
  { value: "ABRASF", label: "ABRASF" },
  { value: "BETHA", label: "Betha" },
  { value: "ISSNET", label: "ISSNet" },
  { value: "IPM", label: "IPM" },
];

const REGIME_OPTIONS: Array<{ value: NfseRegimeTributario; label: string }> = [
  { value: "SIMPLES_NACIONAL", label: "Simples Nacional" },
  { value: "LUCRO_PRESUMIDO", label: "Lucro Presumido" },
  { value: "LUCRO_REAL", label: "Lucro Real" },
];

function getStatusClass(status: NfseConfiguracao["status"]) {
  if (status === "CONFIGURADA") return "bg-gym-teal/15 text-gym-teal border-gym-teal/25";
  if (status === "ERRO") return "bg-gym-danger/10 text-gym-danger border-gym-danger/25";
  return "bg-gym-warning/10 text-gym-warning border-gym-warning/25";
}

function formatDateTime(value?: string) {
  if (!value) return "Ainda não executado";
  return new Date(value).toLocaleString("pt-BR");
}

export default function AdministrativoNfsePage() {
  const access = useAuthAccess();
  const { tenantId, tenantName, tenantResolved, loading: tenantLoading } = useTenantContext();
  const [form, setForm] = useState<NfseConfiguracao | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!tenantId || !access.canAccessElevatedModules) return;
    setLoading(true);
    setError(null);
    try {
      setForm(await getNfseConfiguracaoAtualApi({ tenantId }));
    } catch (loadError) {
      setError(normalizeErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [access.canAccessElevatedModules, tenantId]);

  useEffect(() => {
    if (!access.loading && tenantResolved) {
      void load();
    }
  }, [access.loading, load, tenantResolved]);

  const checklist = useMemo(() => buildNfseChecklist(form ?? {}), [form]);

  async function handleSave() {
    if (!tenantId || !form) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const saved = await salvarNfseConfiguracaoAtualApi(form);
      setForm(saved);
      setSuccess("Configuração fiscal atualizada.");
    } catch (saveError) {
      setError(normalizeErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function handleValidate() {
    if (!tenantId) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const validated = await validarNfseConfiguracaoAtualApi({ tenantId });
      setForm(validated);
      setSuccess("Configuração validada com sucesso.");
    } catch (validationError) {
      setError(normalizeErrorMessage(validationError));
      void load();
    } finally {
      setSaving(false);
    }
  }

  const accessDenied = !access.loading && !access.canAccessElevatedModules;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Administrativo</p>
          <h1 className="font-display text-2xl font-bold tracking-tight">NFSe e Fiscal</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Emissor fiscal da unidade ativa:{" "}
            <span className="font-medium text-foreground">
              {tenantResolved ? tenantName : "Carregando..."}
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-border" onClick={() => void load()} disabled={loading || saving || accessDenied}>
            <RefreshCw className="mr-2 size-4" />
            Atualizar
          </Button>
          <Button onClick={handleValidate} disabled={saving || loading || accessDenied || !tenantId}>
            Validar configuração
          </Button>
        </div>
      </div>

      {accessDenied ? (
        <div className="rounded-xl border border-gym-danger/30 bg-gym-danger/10 p-4 text-sm text-gym-danger">
          Apenas usuários com permissão elevada podem alterar configurações fiscais.
        </div>
      ) : null}

      {(error || success) && (
        <div
          className={`rounded-md border px-4 py-3 text-sm ${
            error
              ? "border-gym-danger/30 bg-gym-danger/10 text-gym-danger"
              : "border-gym-teal/30 bg-gym-teal/10 text-gym-teal"
          }`}
        >
          {error ?? success}
        </div>
      )}

      {form ? (
        <>
          <div className="grid gap-4 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</p>
              <span className={`mt-3 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClass(form.status)}`}>
                {NFSE_STATUS_LABEL[form.status]}
              </span>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Última validação</p>
              <p className="mt-3 text-sm font-medium text-foreground">{formatDateTime(form.ultimaValidacaoEm)}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Última sincronização</p>
              <p className="mt-3 text-sm font-medium text-foreground">{formatDateTime(form.ultimaSincronizacaoEm)}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Emissão automática</p>
              <p className="mt-3 text-sm font-medium text-foreground">{form.emissaoAutomatica ? "Ativa" : "Manual"}</p>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Prefeitura *</label>
                  <Input
                    value={form.prefeitura}
                    onChange={(event) => setForm((prev) => (prev ? { ...prev, prefeitura: event.target.value } : prev))}
                    className="border-border bg-secondary"
                    placeholder="Ex.: Rio de Janeiro"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Inscrição municipal *</label>
                  <Input
                    value={form.inscricaoMunicipal}
                    onChange={(event) => setForm((prev) => (prev ? { ...prev, inscricaoMunicipal: event.target.value } : prev))}
                    className="border-border bg-secondary"
                    placeholder="Número municipal"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">CNAE principal *</label>
                  <Input
                    value={form.cnaePrincipal}
                    onChange={(event) => setForm((prev) => (prev ? { ...prev, cnaePrincipal: event.target.value } : prev))}
                    className="border-border bg-secondary"
                    placeholder="Ex.: 9313-1/00"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Série RPS *</label>
                  <Input
                    value={form.serieRps}
                    onChange={(event) => setForm((prev) => (prev ? { ...prev, serieRps: event.target.value } : prev))}
                    className="border-border bg-secondary"
                    placeholder="Ex.: S1"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ambiente</label>
                  <Select
                    value={form.ambiente}
                    onValueChange={(value) => setForm((prev) => (prev ? { ...prev, ambiente: value as NfseAmbiente } : prev))}
                  >
                    <SelectTrigger className="w-full border-border bg-secondary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-border bg-card">
                      {AMBIENTE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Provedor</label>
                  <Select
                    value={form.provedor}
                    onValueChange={(value) => setForm((prev) => (prev ? { ...prev, provedor: value as NfseProvider } : prev))}
                  >
                    <SelectTrigger className="w-full border-border bg-secondary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-border bg-card">
                      {PROVEDOR_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Regime tributário</label>
                  <Select
                    value={form.regimeTributario}
                    onValueChange={(value) =>
                      setForm((prev) => (prev ? { ...prev, regimeTributario: value as NfseRegimeTributario } : prev))
                    }
                  >
                    <SelectTrigger className="w-full border-border bg-secondary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-border bg-card">
                      {REGIME_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Emissão</label>
                  <Select
                    value={form.emissaoAutomatica ? "AUTOMATICA" : "MANUAL"}
                    onValueChange={(value) =>
                      setForm((prev) => (prev ? { ...prev, emissaoAutomatica: value === "AUTOMATICA" } : prev))
                    }
                  >
                    <SelectTrigger className="w-full border-border bg-secondary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-border bg-card">
                      <SelectItem value="AUTOMATICA">Automática</SelectItem>
                      <SelectItem value="MANUAL">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Lote inicial *</label>
                  <Input
                    type="number"
                    min={1}
                    value={String(form.loteInicial)}
                    onChange={(event) => setForm((prev) => (prev ? { ...prev, loteInicial: Number(event.target.value) } : prev))}
                    className="border-border bg-secondary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Alíquota padrão *</label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={String(form.aliquotaPadrao)}
                    onChange={(event) =>
                      setForm((prev) => (prev ? { ...prev, aliquotaPadrao: Number(event.target.value) } : prev))
                    }
                    className="border-border bg-secondary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Certificado</label>
                  <Input
                    value={form.certificadoAlias ?? ""}
                    onChange={(event) => setForm((prev) => (prev ? { ...prev, certificadoAlias: event.target.value } : prev))}
                    className="border-border bg-secondary"
                    placeholder="Alias do certificado A1"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Webhook fiscal</label>
                  <Input
                    value={form.webhookFiscalUrl ?? ""}
                    onChange={(event) => setForm((prev) => (prev ? { ...prev, webhookFiscalUrl: event.target.value } : prev))}
                    className="border-border bg-secondary"
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cópia do financeiro</label>
                  <Input
                    value={form.emailCopiaFinanceiro ?? ""}
                    onChange={(event) =>
                      setForm((prev) => (prev ? { ...prev, emailCopiaFinanceiro: event.target.value } : prev))
                    }
                    className="border-border bg-secondary"
                    placeholder="fiscal@empresa.com.br"
                  />
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Button onClick={handleSave} disabled={saving || loading || tenantLoading || accessDenied}>
                  {saving ? "Salvando..." : "Salvar configuração"}
                </Button>
                <Button variant="outline" className="border-border" onClick={() => void load()} disabled={saving || loading}>
                  Recarregar dados
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-gym-teal" />
                  <h2 className="font-display text-lg font-bold">Checklist fiscal</h2>
                </div>
                <div className="mt-4 space-y-3">
                  {checklist.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                      <span className="text-sm text-foreground">{item.label}</span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          item.done ? "bg-gym-teal/15 text-gym-teal" : "bg-gym-warning/15 text-gym-warning"
                        }`}
                      >
                        {item.done ? "OK" : "Pendente"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="size-4 text-gym-warning" />
                  <h2 className="font-display text-lg font-bold">Observações</h2>
                </div>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <li>Valide o ambiente antes de mover o emissor para produção.</li>
                  <li>Mantenha certificado e webhook fiscal alinhados ao tenant ativo.</li>
                  <li>Pagamentos recebidos sem NFSe emitida aparecerão em Recebimentos.</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          {loading ? "Carregando configuração fiscal..." : "Nenhuma configuração fiscal encontrada."}
        </div>
      )}
    </div>
  );
}
