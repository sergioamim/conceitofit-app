"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Camera,
  Cpu,
  ImageIcon,
  Network,
  RefreshCw,
  Save,
  ShieldCheck,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  obterAdminCatracaIntegracaoApi,
  salvarAdminCatracaDispositivoApi,
  sincronizarAdminCatracaFacesApi,
  type AdminCatracaDeviceResponse,
  type AdminCatracaSyncFacesResponse,
  type AdminCatracaUpsertDeviceInput,
} from "@/lib/api/catraca";
import { listAcademiasApi, listUnidadesApi } from "@/lib/api/contexto-unidades";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import type { Academia, Tenant } from "@/lib/types";
import { useAuthAccess } from "@/lib/tenant/hooks/use-session-context";
import { PageError } from "@/components/shared/page-error";

type DeviceFormState = AdminCatracaUpsertDeviceInput;

function createEmptyDeviceForm(): DeviceFormState {
  return {
    deviceId: "",
    agentId: "",
    nome: "",
    fabricante: "CONTROL_ID_IDFACE",
    ipLocal: "",
    portaControle: 80,
    portaBiometria: 80,
    maxFaces: 3000,
    reservedFacesStaff: 0,
    ativo: true,
    operationMode: "EMBEDDED_FACE",
    supportsEmbeddedFace: true,
    supportsEdgeFace: false,
    supportsFingerprint: false,
    supportsQrCode: false,
    supportsFaceTemplateSync: true,
  };
}

function createFormFromDevice(device: AdminCatracaDeviceResponse): DeviceFormState {
  return {
    deviceId: device.deviceId,
    agentId: device.agentId ?? "",
    nome: device.nome ?? "",
    fabricante: device.fabricante,
    ipLocal: device.ipLocal ?? "",
    portaControle: device.portaControle,
    portaBiometria: device.portaBiometria,
    maxFaces: device.maxFaces,
    reservedFacesStaff: device.reservedFacesStaff,
    ativo: device.ativo,
    operationMode: device.operationMode,
    supportsEmbeddedFace: device.supportsEmbeddedFace,
    supportsEdgeFace: device.supportsEdgeFace,
    supportsFingerprint: device.supportsFingerprint,
    supportsQrCode: device.supportsQrCode,
    supportsFaceTemplateSync: device.supportsFaceTemplateSync,
  };
}

function toOptionalNumber(value: string): number | undefined {
  const normalized = value.trim();
  if (!normalized) return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function formatMutationError(error: unknown): string {
  return normalizeErrorMessage(error) || "Não foi possível concluir a operação.";
}

export function CatracaStatusContent() {
  const access = useAuthAccess();
  const queryClient = useQueryClient();
  const [selectedAcademiaId, setSelectedAcademiaId] = useState("");
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [deviceForm, setDeviceForm] = useState<DeviceFormState>(createEmptyDeviceForm());
  const [lastSyncResult, setLastSyncResult] = useState<AdminCatracaSyncFacesResponse | null>(null);

  const academiasQuery = useQuery<Academia[]>({
    queryKey: ["admin", "catraca-integracao", "academias"],
    queryFn: () => listAcademiasApi(),
    enabled: access.canAccessElevatedModules && !access.loading,
    staleTime: 5 * 60_000,
  });

  const tenantsQuery = useQuery<Tenant[]>({
    queryKey: ["admin", "catraca-integracao", "tenants"],
    queryFn: () => listUnidadesApi(),
    enabled: access.canAccessElevatedModules && !access.loading,
    staleTime: 5 * 60_000,
  });

  const academias = academiasQuery.data ?? [];
  const tenants = tenantsQuery.data ?? [];

  useEffect(() => {
    if (!selectedAcademiaId && academias.length > 0) {
      setSelectedAcademiaId(academias[0].id);
    }
  }, [academias, selectedAcademiaId]);

  const filteredTenants = useMemo(() => {
    if (!selectedAcademiaId) return tenants;
    return tenants.filter((tenant) => tenant.academiaId === selectedAcademiaId);
  }, [selectedAcademiaId, tenants]);

  useEffect(() => {
    if (!selectedTenantId && filteredTenants.length > 0) {
      setSelectedTenantId(filteredTenants[0].id);
      return;
    }
    if (selectedTenantId && !filteredTenants.some((tenant) => tenant.id === selectedTenantId)) {
      setSelectedTenantId(filteredTenants[0]?.id ?? "");
    }
  }, [filteredTenants, selectedTenantId]);

  const integrationQuery = useQuery({
    queryKey: ["admin", "catraca-integracao", selectedTenantId],
    queryFn: () => obterAdminCatracaIntegracaoApi({ tenantId: selectedTenantId }),
    enabled: access.canAccessElevatedModules && !access.loading && !!selectedTenantId,
    staleTime: 30_000,
  });

  const integration = integrationQuery.data;
  const devices = integration?.devices ?? [];
  const agents = integration?.agents ?? [];

  useEffect(() => {
    if (!selectedTenantId) {
      setSelectedDeviceId("");
      setDeviceForm(createEmptyDeviceForm());
      setLastSyncResult(null);
      return;
    }

    if (devices.length === 0) {
      setSelectedDeviceId("__new__");
      setDeviceForm((current) => ({
        ...createEmptyDeviceForm(),
        agentId: current.agentId,
      }));
      return;
    }

    if (selectedDeviceId === "__new__") {
      return;
    }

    const hasCurrentDevice = devices.some((device) => device.deviceId === selectedDeviceId);
    if (!hasCurrentDevice) {
      const firstDevice = devices[0];
      setSelectedDeviceId(firstDevice.deviceId);
      setDeviceForm(createFormFromDevice(firstDevice));
      return;
    }

    const currentDevice = devices.find((device) => device.deviceId === selectedDeviceId);
    if (currentDevice) {
      setDeviceForm(createFormFromDevice(currentDevice));
    }
  }, [devices, selectedDeviceId, selectedTenantId]);

  const selectedAcademia = academias.find((item) => item.id === selectedAcademiaId);
  const selectedTenant = filteredTenants.find((item) => item.id === selectedTenantId);

  const effectiveCapacityPreview = Math.max(
    0,
    (deviceForm.maxFaces ?? 0) - (deviceForm.reservedFacesStaff ?? 0),
  );
  const capacityGap = integration
    ? Math.max(0, integration.membersWithPhoto - effectiveCapacityPreview)
    : 0;

  const reload = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin", "catraca-integracao", selectedTenantId] }),
      queryClient.invalidateQueries({ queryKey: ["admin", "catraca-integracao", "tenants"] }),
    ]);
  };

  const saveMutation = useMutation({
    mutationFn: (payload: DeviceFormState) =>
      salvarAdminCatracaDispositivoApi({
        tenantId: selectedTenantId,
        data: payload,
      }),
    onSuccess: async (device) => {
      setSelectedDeviceId(device.deviceId);
      setDeviceForm(createFormFromDevice(device));
      await queryClient.invalidateQueries({ queryKey: ["admin", "catraca-integracao", selectedTenantId] });
    },
  });

  const syncMutation = useMutation({
    mutationFn: (payload: { deviceId: string; agentId?: string }) =>
      sincronizarAdminCatracaFacesApi({
        tenantId: selectedTenantId,
        deviceId: payload.deviceId,
        agentId: payload.agentId,
      }),
    onSuccess: async (result) => {
      setLastSyncResult(result);
      await queryClient.invalidateQueries({ queryKey: ["admin", "catraca-integracao", selectedTenantId] });
    },
  });

  const saveDisabled =
    !selectedTenantId
    || !deviceForm.deviceId.trim()
    || !deviceForm.fabricante
    || saveMutation.isPending;

  const syncDisabled =
    !selectedTenantId
    || !deviceForm.deviceId.trim()
    || !deviceForm.agentId?.trim()
    || syncMutation.isPending
    || saveMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Administrativo
          </p>
          <h1 className="font-display text-2xl font-bold tracking-tight">Integração facial da catraca</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Configure a comunicação via gestão de acesso, limite de capacidade do leitor e a sincronização remota de imagens para clientes com contrato ativo.
          </p>
        </div>
        <Button
          onClick={() => void reload()}
          disabled={!access.canAccessElevatedModules || integrationQuery.isFetching}
          variant="outline"
        >
          <RefreshCw className="mr-2 size-4" />
          {integrationQuery.isFetching ? "Atualizando..." : "Atualizar contexto"}
        </Button>
      </div>

      <div className="rounded-2xl border border-border bg-card/80 p-5 shadow-sm">
        <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Academia</p>
                <Select
                  value={selectedAcademiaId}
                  onValueChange={setSelectedAcademiaId}
                  disabled={!access.canAccessElevatedModules || access.loading || academias.length === 0}
                >
                  <SelectTrigger className="bg-secondary/60">
                    <SelectValue placeholder="Selecionar academia" />
                  </SelectTrigger>
                  <SelectContent>
                    {academias.map((academia) => (
                      <SelectItem key={academia.id} value={academia.id}>
                        {academia.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Unidade</p>
                <Select
                  value={selectedTenantId}
                  onValueChange={setSelectedTenantId}
                  disabled={!access.canAccessElevatedModules || access.loading || filteredTenants.length === 0}
                >
                  <SelectTrigger className="bg-secondary/60">
                    <SelectValue placeholder="Selecionar unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredTenants.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-2xl border border-border/80 bg-secondary/25 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{selectedAcademia?.nome ?? "Sem academia"}</Badge>
                <Badge variant="outline">{selectedTenant?.nome ?? "Sem unidade"}</Badge>
                <Badge variant="outline">{selectedTenantId || "Tenant não selecionado"}</Badge>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                A sincronização envia todos os clientes ativos com foto até o limite configurado para o dispositivo. Reservas de staff são descontadas antes do envio.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/80 bg-secondary/20 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Clientes ativos</p>
                <Users className="size-4 text-muted-foreground" />
              </div>
              <p className="mt-3 text-3xl font-semibold">{integration?.activeMembers ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-secondary/20 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Com foto elegível</p>
                <ImageIcon className="size-4 text-muted-foreground" />
              </div>
              <p className="mt-3 text-3xl font-semibold">{integration?.membersWithPhoto ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-secondary/20 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Agentes online</p>
                {(agents.length ?? 0) > 0 ? (
                  <Wifi className="size-4 text-emerald-500" />
                ) : (
                  <WifiOff className="size-4 text-muted-foreground" />
                )}
              </div>
              <p className="mt-3 text-3xl font-semibold">{agents.length}</p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-secondary/20 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Capacidade útil</p>
                <ShieldCheck className="size-4 text-muted-foreground" />
              </div>
              <p className="mt-3 text-3xl font-semibold">{effectiveCapacityPreview}</p>
            </div>
          </div>
        </div>

        {access.loading ? (
          <p className="mt-4 text-xs text-muted-foreground">Validando permissão...</p>
        ) : !access.canAccessElevatedModules ? (
          <p className="mt-4 text-sm text-destructive">
            Acesso negado. Apenas perfis com permissão alta podem configurar a integração da catraca.
          </p>
        ) : null}

        <PageError error={academiasQuery.error || tenantsQuery.error || integrationQuery.error} onRetry={() => void reload()} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-2xl border border-border bg-card/80 p-5 shadow-sm">
          <div className="flex flex-col gap-3 border-b border-border pb-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Dispositivo</p>
              <h2 className="mt-1 text-lg font-semibold">Comunicação com o leitor facial</h2>
            </div>

            <Select
              value={selectedDeviceId}
              onValueChange={(value) => {
                setSelectedDeviceId(value);
                if (value === "__new__") {
                  setDeviceForm(createEmptyDeviceForm());
                }
              }}
              disabled={!selectedTenantId}
            >
              <SelectTrigger className="w-full md:max-w-sm bg-secondary/60">
                <SelectValue placeholder="Selecionar dispositivo" />
              </SelectTrigger>
              <SelectContent>
                {devices.map((device) => (
                  <SelectItem key={device.deviceId} value={device.deviceId}>
                    {device.nome?.trim() || device.deviceId}
                  </SelectItem>
                ))}
                <SelectItem value="__new__">Novo dispositivo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Device ID</label>
              <Input
                value={deviceForm.deviceId}
                onChange={(event) => setDeviceForm((current) => ({ ...current, deviceId: event.target.value }))}
                placeholder="idface-entrada"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Nome operacional</label>
              <Input
                value={deviceForm.nome ?? ""}
                onChange={(event) => setDeviceForm((current) => ({ ...current, nome: event.target.value }))}
                placeholder="Leitor entrada principal"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Fabricante</label>
              <Select
                value={deviceForm.fabricante}
                onValueChange={(value) =>
                  setDeviceForm((current) => ({ ...current, fabricante: value as DeviceFormState["fabricante"] }))
                }
              >
                <SelectTrigger className="bg-secondary/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CONTROL_ID_IDFACE">Control iD iDFace</SelectItem>
                  <SelectItem value="TOLETUS_LITENET2">Toletus LiteNet2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Operation mode</label>
              <Select
                value={deviceForm.operationMode ?? "EMBEDDED_FACE"}
                onValueChange={(value) =>
                  setDeviceForm((current) => ({
                    ...current,
                    operationMode: value as NonNullable<DeviceFormState["operationMode"]>,
                  }))
                }
              >
                <SelectTrigger className="bg-secondary/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMBEDDED_FACE">Face embarcada</SelectItem>
                  <SelectItem value="EDGE_FACE">Face processada na borda</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">IP local</label>
              <Input
                value={deviceForm.ipLocal ?? ""}
                onChange={(event) => setDeviceForm((current) => ({ ...current, ipLocal: event.target.value }))}
                placeholder="192.168.0.25"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Agent ID da gestão de acesso</label>
              <Input
                value={deviceForm.agentId ?? ""}
                onChange={(event) => setDeviceForm((current) => ({ ...current, agentId: event.target.value }))}
                placeholder="agent-idface-entrada"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Porta controle</label>
              <Input
                value={deviceForm.portaControle ?? ""}
                onChange={(event) =>
                  setDeviceForm((current) => ({ ...current, portaControle: toOptionalNumber(event.target.value) }))
                }
                inputMode="numeric"
                placeholder="80"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Porta biometria</label>
              <Input
                value={deviceForm.portaBiometria ?? ""}
                onChange={(event) =>
                  setDeviceForm((current) => ({ ...current, portaBiometria: toOptionalNumber(event.target.value) }))
                }
                inputMode="numeric"
                placeholder="80"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Capacidade máxima de faces</label>
              <Input
                value={deviceForm.maxFaces ?? ""}
                onChange={(event) =>
                  setDeviceForm((current) => ({ ...current, maxFaces: toOptionalNumber(event.target.value) }))
                }
                inputMode="numeric"
                placeholder="3000"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Reserva para equipe</label>
              <Input
                value={deviceForm.reservedFacesStaff ?? ""}
                onChange={(event) =>
                  setDeviceForm((current) => ({
                    ...current,
                    reservedFacesStaff: toOptionalNumber(event.target.value),
                  }))
                }
                inputMode="numeric"
                placeholder="100"
              />
            </div>
          </div>

          <div className="mt-5 grid gap-3 rounded-2xl border border-border/80 bg-secondary/20 p-4 md:grid-cols-2">
            {[
              {
                key: "ativo" as const,
                label: "Dispositivo ativo",
                description: "Habilita este leitor para sincronização e uso operacional.",
              },
              {
                key: "supportsEmbeddedFace" as const,
                label: "Suporta face embarcada",
                description: "Permite envio de imagem para geração biométrica dentro do equipamento.",
              },
              {
                key: "supportsFaceTemplateSync" as const,
                label: "Permite sync de face",
                description: "Habilita o fluxo remoto de preload e invalidação de imagens.",
              },
              {
                key: "supportsEdgeFace" as const,
                label: "Suporta face na borda",
                description: "Usado quando o reconhecimento não fica 100% embarcado no leitor.",
              },
              {
                key: "supportsFingerprint" as const,
                label: "Suporta digital",
                description: "Mantém o dispositivo elegível para cenários mistos.",
              },
              {
                key: "supportsQrCode" as const,
                label: "Suporta QR Code",
                description: "Usado para fallback operacional ou acesso eventual.",
              },
            ].map((item) => (
              <div key={item.key} className="flex items-start justify-between gap-3 rounded-xl border border-border/70 bg-background/70 p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                </div>
                <Switch
                  checked={Boolean(deviceForm[item.key])}
                  onCheckedChange={(checked) =>
                    setDeviceForm((current) => ({ ...current, [item.key]: checked }))
                  }
                />
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-muted-foreground">
              Capacidade útil prevista: <span className="font-semibold text-foreground">{effectiveCapacityPreview}</span>
              {capacityGap > 0 ? (
                <span className="ml-2 text-amber-500">
                  {capacityGap} clientes com foto ficarão fora do lote por limite de capacidade.
                </span>
              ) : null}
            </div>

            <Button onClick={() => saveMutation.mutate(deviceForm)} disabled={saveDisabled}>
              <Save className="mr-2 size-4" />
              {saveMutation.isPending ? "Salvando..." : "Salvar configuração"}
            </Button>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card/80 p-5 shadow-sm">
          <div className="border-b border-border pb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Execução remota</p>
            <h2 className="mt-1 text-lg font-semibold">Sincronização de imagens</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              O comando sai do backoffice, passa pela API administrativa e é entregue ao agente conectado da gestão de acesso.
            </p>
          </div>

          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-border/80 bg-secondary/20 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">Agentes conectados na unidade</p>
                <Network className="size-4 text-muted-foreground" />
              </div>

              {agents.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  Nenhum agente online para esta unidade. Você ainda pode salvar a configuração, mas o sync remoto exige um agent conectado.
                </p>
              ) : (
                <div className="mt-3 space-y-2">
                  {agents.map((agent) => (
                    <div key={agent.agentId} className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/70 p-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{agent.agentId}</p>
                          <Badge variant={agent.awaitingPingAck ? "outline" : "secondary"}>
                            {agent.awaitingPingAck ? `${agent.pendingCommands} pendente(s)` : "pronto"}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {agent.lastCommandStatus
                            ? `${agent.lastCommandStatus}${agent.lastCommandMessage ? ` • ${agent.lastCommandMessage}` : ""}`
                            : "Sem comando recente"}
                        </p>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeviceForm((current) => ({ ...current, agentId: agent.agentId }))}
                      >
                        Usar agent
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border/80 bg-secondary/20 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">Resumo do lote a sincronizar</p>
                <Cpu className="size-4 text-muted-foreground" />
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border/70 bg-background/70 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Membros com foto</p>
                  <p className="mt-2 text-2xl font-semibold">{integration?.membersWithPhoto ?? 0}</p>
                </div>
                <div className="rounded-xl border border-border/70 bg-background/70 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Capacidade útil</p>
                  <p className="mt-2 text-2xl font-semibold">{effectiveCapacityPreview}</p>
                </div>
              </div>
              <Button
                className="mt-4 w-full"
                onClick={() =>
                  syncMutation.mutate({
                    deviceId: deviceForm.deviceId.trim(),
                    agentId: deviceForm.agentId?.trim() || undefined,
                  })
                }
                disabled={syncDisabled}
              >
                <Camera className="mr-2 size-4" />
                {syncMutation.isPending ? "Enfileirando sync..." : "Sincronizar clientes ativos"}
              </Button>
            </div>

            {lastSyncResult ? (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                <p className="text-sm font-semibold text-emerald-300">Sync enfileirado</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/80">Preloads</p>
                    <p className="mt-1 text-xl font-semibold text-emerald-50">{lastSyncResult.queuedPreloads}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/80">Invalidações</p>
                    <p className="mt-1 text-xl font-semibold text-emerald-50">{lastSyncResult.queuedInvalidations}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/80">Ignorados por capacidade</p>
                    <p className="mt-1 text-xl font-semibold text-emerald-50">{lastSyncResult.skippedByCapacity}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/80">Modo</p>
                    <p className="mt-1 text-xl font-semibold text-emerald-50">{lastSyncResult.mode}</p>
                  </div>
                </div>
              </div>
            ) : null}

            {saveMutation.error ? (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {formatMutationError(saveMutation.error)}
              </div>
            ) : null}
            {syncMutation.error ? (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {formatMutationError(syncMutation.error)}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
