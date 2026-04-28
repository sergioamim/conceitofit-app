"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, RefreshCw, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  getNfseConfiguracaoAtualApi,
  salvarNfseConfiguracaoAtualApi,
  validarNfseConfiguracaoAtualApi,
} from "@/lib/api/financeiro-operacional";
import {
  buildNfseChecklist,
  getNfseBloqueioMensagem,
  NFSE_CLASSIFICACAO_TRIBUTARIA_LABEL,
  NFSE_INDICADOR_OPERACAO_LABEL,
  NFSE_STATUS_LABEL,
  validateNfseConfiguracaoDraft,
} from "@/lib/domain/financeiro";
import { useAuthAccess, useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import type {
  NfseAmbiente,
  NfseClassificacaoTributaria,
  NfseConfiguracao,
  NfseConfiguracaoPayload,
  NfseIndicadorOperacao,
  NfseProvider,
  NfseRegimeTributario,
} from "@/lib/types";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { formatDateTime } from "@/lib/formatters";
import { PageError } from "@/components/shared/page-error";
import { useAdminCrud } from "@/lib/query/use-admin-crud";

const AMBIENTE_OPTIONS: Array<{ value: NfseAmbiente; label: string }> = [
  { value: "HOMOLOGACAO", label: "Homologação" },
  { value: "PRODUCAO", label: "Produção" },
];

// Task #557: alinhado com NfseProvedor.java do BE
const PROVEDOR_OPTIONS: Array<{ value: NfseProvider; label: string }> = [
  { value: "SEFIN_NACIONAL", label: "SEFIN Nacional" },
  { value: "ENOTAS", label: "eNotas" },
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

export function NfseContent() {
  const access = useAuthAccess();
  const { tenantId, tenantName, tenantResolved, loading: tenantLoading } = useTenantContext();

  const {
    items: configItems,
    isLoading: loading,
    error: queryError,
    refetch: load,
  } = useAdminCrud<NfseConfiguracao>({
    domain: "nfse",
    tenantId,
    enabled: tenantResolved && !access.loading && access.canAccessElevatedModules,
    listFn: async (tid) => {
      // Task #556: unidadeId = tenantId (modelo AIOX)
      const config = await getNfseConfiguracaoAtualApi({
        tenantId: tid,
        unidadeId: tid,
      });
      return config ? [config] : [];
    },
  });
  const loadError = queryError ? normalizeErrorMessage(queryError) : null;

  const [form, setForm] = useState<NfseConfiguracao | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Sync query data into local form state when loaded (and not currently saving)
  const loadedConfig = configItems[0] ?? null;
  useEffect(() => {
    if (loadedConfig && !saving) {
      setForm(loadedConfig);
    }
  }, [loadedConfig, saving]);

  const checklist = useMemo(() => buildNfseChecklist(form ?? {}), [form]);
  const localErrors = useMemo(() => validateNfseConfiguracaoDraft(form ?? {}), [form]);
  const bloqueioFiscal = useMemo(() => getNfseBloqueioMensagem(form), [form]);

  async function handleSave() {
    if (!tenantId || !form) return;

    // Task #557: validação específica dos campos obrigatórios do novo
    // DTO NfseConfiguracaoUnidadeRequest (BE).
    const novosErros: string[] = [];
    if (!form.municipioCodigoIbge || form.municipioCodigoIbge.length !== 7) {
      novosErros.push("Informe o código IBGE do município (7 dígitos).");
    }
    if (!form.municipioUf || form.municipioUf.length !== 2) {
      novosErros.push("Informe a UF do município (2 letras).");
    }
    if (!form.endpointBase?.trim()) {
      novosErros.push("Informe o endpoint base do provedor.");
    }

    const firstLocalError = Object.values(localErrors)[0];
    if (firstLocalError) {
      setError(firstLocalError);
      setSuccess(null);
      return;
    }
    if (novosErros.length > 0) {
      setError(novosErros[0]);
      setSuccess(null);
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      // Task #557: monta o payload no formato novo do BE.
      // tenantId = unidadeId no modelo AIOX (1 tenant = 1 unidade).
      const payload: NfseConfiguracaoPayload = {
        id: form.id?.startsWith("nfse-") ? undefined : form.id,
        tenantId: form.tenantId,
        unidadeId: form.unidadeId ?? form.tenantId,
        municipioCodigoIbge: form.municipioCodigoIbge!,
        municipioUf: form.municipioUf!.toUpperCase(),
        provedor: form.provedor,
        ambiente: form.ambiente,
        endpointBase: form.endpointBase!,
        integracaoAtiva: form.integracaoAtiva ?? true,
        simulacao: form.simulacao ?? form.ambiente === "HOMOLOGACAO",
        clienteId: form.clienteId,
        codigoTributacaoNacional: form.codigoTributacaoNacional,
        codigoNbs: form.codigoNbs,
        classificacaoTributaria: String(form.classificacaoTributaria),
        consumidorFinal: form.consumidorFinal,
        indicadorOperacao: form.indicadorOperacao,
        ativo: form.ativo ?? true,
      };
      const saved = await salvarNfseConfiguracaoAtualApi(payload);
      setForm(saved);
      setSuccess("Configuração fiscal atualizada.");
      void load();
    } catch (saveError) {
      setError(normalizeErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function handleValidate() {
    if (!tenantId) return;
    const firstLocalError = Object.values(localErrors)[0];
    if (firstLocalError) {
      setError(firstLocalError);
      setSuccess(null);
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const validated = await validarNfseConfiguracaoAtualApi({ tenantId });
      setForm(validated);
      setSuccess("Configuração validada com sucesso.");
      void load();
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
          <Button
            onClick={handleValidate}
            disabled
            title="Endpoint /validar ainda não implementado no backend (débito residual Task #556/#557)"
          >
            Validar (indisponível)
          </Button>
        </div>
      </div>

      {accessDenied ? (
        <div className="rounded-xl border border-gym-danger/30 bg-gym-danger/10 p-4 text-sm text-gym-danger">
          Apenas usuários com permissão elevada podem alterar configurações fiscais.
        </div>
      ) : null}

      <PageError error={loadError} onRetry={load} />

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
                {NFSE_STATUS_LABEL[form.status ?? "PENDENTE"]}
              </span>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Última validação</p>
              <p className="mt-3 text-sm font-medium text-foreground">{form.ultimaValidacaoEm ? formatDateTime(form.ultimaValidacaoEm) : "Ainda não executado"}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Última sincronização</p>
              <p className="mt-3 text-sm font-medium text-foreground">{form.ultimaSincronizacaoEm ? formatDateTime(form.ultimaSincronizacaoEm) : "Ainda não executado"}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Emissão automática</p>
              <p className="mt-3 text-sm font-medium text-foreground">{form.emissaoAutomatica ? "Ativa" : "Manual"}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {form.consumidorFinal ? "Consumidor final habilitado" : "Consumidor final desabilitado"}
              </p>
            </div>
          </div>

          {/* Task #557: seção nova alinhada com o BE NfseConfiguracaoUnidadeRequest */}
          <div className="rounded-xl border border-gym-teal/30 bg-gym-teal/5 p-5">
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-base font-bold">Integração do provedor</h2>
              <span className="rounded-full bg-gym-teal/15 px-2 py-0.5 text-[10px] font-semibold text-gym-teal">
                Obrigatório
              </span>
            </div>
            <p className="mb-4 text-xs text-muted-foreground">
              Dados que o backend exige para emitir NFS-e contra o provedor real (município, endpoint e credenciais).
            </p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Código IBGE do município *
                </label>
                <Input
                  maxLength={7}
                  value={form.municipioCodigoIbge ?? ""}
                  onChange={(event) =>
                    setForm((prev) =>
                      prev ? { ...prev, municipioCodigoIbge: event.target.value.replace(/\D/g, "") } : prev,
                    )
                  }
                  className="border-border bg-secondary font-mono"
                  placeholder="Ex.: 3304557"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">UF *</label>
                <Input
                  maxLength={2}
                  value={form.municipioUf ?? ""}
                  onChange={(event) =>
                    setForm((prev) =>
                      prev ? { ...prev, municipioUf: event.target.value.toUpperCase().replace(/[^A-Z]/g, "") } : prev,
                    )
                  }
                  className="border-border bg-secondary font-mono"
                  placeholder="Ex.: RJ"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Endpoint base *
                </label>
                <Input
                  value={form.endpointBase ?? ""}
                  onChange={(event) => setForm((prev) => (prev ? { ...prev, endpointBase: event.target.value } : prev))}
                  className="border-border bg-secondary"
                  placeholder="https://nfse.provedor.com.br/api"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cliente ID</label>
                <Input
                  value={form.clienteId ?? ""}
                  onChange={(event) => setForm((prev) => (prev ? { ...prev, clienteId: event.target.value } : prev))}
                  className="border-border bg-secondary"
                  placeholder="Client ID OAuth do provedor"
                />
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary px-3 py-3">
                <input
                  id="integracao-ativa"
                  type="checkbox"
                  checked={form.integracaoAtiva ?? false}
                  onChange={(event) =>
                    setForm((prev) => (prev ? { ...prev, integracaoAtiva: event.target.checked } : prev))
                  }
                  className="size-4 rounded border-border"
                />
                <label htmlFor="integracao-ativa" className="text-xs font-semibold text-foreground">
                  Integração ativa
                </label>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary px-3 py-3">
                <input
                  id="simulacao"
                  type="checkbox"
                  checked={form.simulacao ?? true}
                  onChange={(event) =>
                    setForm((prev) => (prev ? { ...prev, simulacao: event.target.checked } : prev))
                  }
                  className="size-4 rounded border-border"
                />
                <label htmlFor="simulacao" className="text-xs font-semibold text-foreground">
                  Modo simulação (não emite de verdade)
                </label>
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-3">
                <h2 className="text-base font-bold">Tributação e emissão</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Campos com <span className="text-gym-warning">*</span> são obrigatórios no backend. Campos marcados
                  como <span className="italic">(legado)</span> não são persistidos no backend atual — ver Task #557.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Prefeitura <span className="italic text-muted-foreground">(legado)</span>
                  </label>
                  <Input
                    value={form.prefeitura ?? ""}
                    onChange={(event) => setForm((prev) => (prev ? { ...prev, prefeitura: event.target.value } : prev))}
                    className="border-border bg-secondary"
                    placeholder="Ex.: Rio de Janeiro"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Inscrição municipal <span className="italic text-muted-foreground">(legado)</span>
                  </label>
                  <Input
                    value={form.inscricaoMunicipal ?? ""}
                    onChange={(event) => setForm((prev) => (prev ? { ...prev, inscricaoMunicipal: event.target.value } : prev))}
                    className="border-border bg-secondary"
                    placeholder="Número municipal"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    CNAE principal <span className="italic text-muted-foreground">(legado)</span>
                  </label>
                  <Input
                    value={form.cnaePrincipal ?? ""}
                    onChange={(event) => setForm((prev) => (prev ? { ...prev, cnaePrincipal: event.target.value } : prev))}
                    className="border-border bg-secondary"
                    placeholder="Ex.: 9313-1/00"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Tributação nacional *
                  </label>
                  <Input
                    value={form.codigoTributacaoNacional}
                    onChange={(event) =>
                      setForm((prev) => (prev ? { ...prev, codigoTributacaoNacional: event.target.value } : prev))
                    }
                    className="border-border bg-secondary"
                    placeholder="Ex.: 1301"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Código NBS *</label>
                  <Input
                    value={form.codigoNbs}
                    onChange={(event) => setForm((prev) => (prev ? { ...prev, codigoNbs: event.target.value } : prev))}
                    className="border-border bg-secondary"
                    placeholder="Ex.: 1.1301.25.00"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Série RPS <span className="italic text-muted-foreground">(legado)</span>
                  </label>
                  <Input
                    value={form.serieRps ?? ""}
                    onChange={(event) => setForm((prev) => (prev ? { ...prev, serieRps: event.target.value } : prev))}
                    className="border-border bg-secondary"
                    placeholder="Ex.: S1"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Classificação tributária *
                  </label>
                  <Select
                    value={form.classificacaoTributaria}
                    onValueChange={(value) =>
                      setForm((prev) =>
                        prev ? { ...prev, classificacaoTributaria: value as NfseClassificacaoTributaria } : prev
                      )
                    }
                  >
                    <SelectTrigger className="w-full border-border bg-secondary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-border bg-card">
                      {Object.entries(NFSE_CLASSIFICACAO_TRIBUTARIA_LABEL).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Regime tributário <span className="italic text-muted-foreground">(legado)</span>
                  </label>
                  <Select
                    value={form.regimeTributario ?? "SIMPLES_NACIONAL"}
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
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Indicador da operação *
                  </label>
                  <Select
                    value={form.indicadorOperacao}
                    onValueChange={(value) =>
                      setForm((prev) => (prev ? { ...prev, indicadorOperacao: value as NfseIndicadorOperacao } : prev))
                    }
                  >
                    <SelectTrigger className="w-full border-border bg-secondary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-border bg-card">
                      {Object.entries(NFSE_INDICADOR_OPERACAO_LABEL).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Emissão <span className="italic text-muted-foreground">(legado)</span>
                  </label>
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
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Lote inicial <span className="italic text-muted-foreground">(legado)</span>
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={String(form.loteInicial ?? 1)}
                    onChange={(event) => setForm((prev) => (prev ? { ...prev, loteInicial: Number(event.target.value) } : prev))}
                    className="border-border bg-secondary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Alíquota padrão <span className="italic text-muted-foreground">(legado)</span>
                  </label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={String(form.aliquotaPadrao ?? 0)}
                    onChange={(event) =>
                      setForm((prev) => (prev ? { ...prev, aliquotaPadrao: Number(event.target.value) } : prev))
                    }
                    className="border-border bg-secondary"
                  />
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary px-3 py-3">
                  <input
                    id="consumidor-final"
                    type="checkbox"
                    checked={form.consumidorFinal}
                    onChange={(event) =>
                      setForm((prev) => (prev ? { ...prev, consumidorFinal: event.target.checked } : prev))
                    }
                    className="size-4 rounded border-border"
                  />
                  <div>
                    <label
                      htmlFor="consumidor-final"
                      className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      Consumidor final
                    </label>
                    <p className="mt-1 text-sm text-foreground">
                      Marque quando a unidade emitir NFSe no cenário padrão para consumidor final.
                    </p>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Certificado <span className="italic text-muted-foreground">(legado)</span>
                  </label>
                  <Input
                    value={form.certificadoAlias ?? ""}
                    onChange={(event) => setForm((prev) => (prev ? { ...prev, certificadoAlias: event.target.value } : prev))}
                    className="border-border bg-secondary"
                    placeholder="Alias do certificado A1"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Webhook fiscal <span className="italic text-muted-foreground">(legado)</span>
                  </label>
                  <Input
                    value={form.webhookFiscalUrl ?? ""}
                    onChange={(event) => setForm((prev) => (prev ? { ...prev, webhookFiscalUrl: event.target.value } : prev))}
                    className="border-border bg-secondary"
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Cópia do financeiro <span className="italic text-muted-foreground">(legado)</span>
                  </label>
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
                  <h2 className="text-lg font-bold">Checklist fiscal</h2>
                </div>
                {bloqueioFiscal ? (
                  <div className="mt-4 rounded-lg border border-gym-warning/30 bg-gym-warning/10 px-3 py-2 text-sm text-gym-warning">
                    {bloqueioFiscal}
                  </div>
                ) : null}
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
                  <h2 className="text-lg font-bold">Observações</h2>
                </div>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <li>Após alterar tributação, NBS ou operação, valide a configuração antes de emitir NFSe.</li>
                  <li>Webhook fiscal e certificado precisam refletir o provedor ativo da unidade.</li>
                  <li>Pagamentos pagos sem NFSe emitida aparecerão como pendentes ou bloqueados nas telas operacionais.</li>
                  {Object.keys(localErrors).length > 0 ? (
                    <li>Campos obrigatórios pendentes: {Object.values(localErrors).join(" ")}</li>
                  ) : null}
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
