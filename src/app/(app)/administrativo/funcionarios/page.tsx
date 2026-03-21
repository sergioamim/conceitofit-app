"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { CargoModal } from "@/components/shared/cargo-modal";
import { DataTableRowActions } from "@/components/shared/data-table-row-actions";
import {
  buildQuickCreateColaboradorPayload,
  filterColaboradores,
  type ColaboradorFlagFiltro,
  type ColaboradorListFilters,
  type ColaboradorQuickCreateDraft,
} from "@/lib/administrativo-colaboradores";
import { quickCreateColaboradorFormSchema } from "@/lib/forms/administrativo-schemas";
import {
  createCargoApi,
  createFuncionarioApi,
  deleteCargoApi,
  deleteFuncionarioApi,
  listCargosApi,
  listFuncionariosApi,
  toggleCargoApi,
  toggleFuncionarioApi,
  updateCargoApi,
  updateFuncionarioApi,
} from "@/lib/api/administrativo";
import { listPerfisApi } from "@/lib/api/rbac";
import { useAuthAccess, useTenantContext } from "@/hooks/use-session-context";
import type {
  Cargo,
  Funcionario,
  FuncionarioHorario,
  FuncionarioStatusAcesso,
  FuncionarioStatusOperacional,
  FuncionarioTipoContratacao,
  RbacPerfil,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

const STATUS_OPERACIONAL_OPTIONS: Array<{ value: FuncionarioStatusOperacional | "TODOS"; label: string }> = [
  { value: "TODOS", label: "Todos os status" },
  { value: "ATIVO", label: "Ativo" },
  { value: "BLOQUEADO", label: "Bloqueado" },
  { value: "INATIVO", label: "Inativo" },
  { value: "DESLIGADO", label: "Desligado" },
];

const STATUS_ACESSO_OPTIONS: Array<{ value: FuncionarioStatusAcesso | "TODOS"; label: string }> = [
  { value: "TODOS", label: "Qualquer acesso" },
  { value: "SEM_ACESSO", label: "Sem acesso" },
  { value: "ATIVO", label: "Acesso ativo" },
  { value: "CONVITE_PENDENTE", label: "Convite pendente" },
  { value: "PRIMEIRO_ACESSO", label: "Primeiro acesso" },
  { value: "BLOQUEADO", label: "Bloqueado" },
];

const FLAG_OPTIONS: Array<{ value: ColaboradorFlagFiltro; label: string }> = [
  { value: "TODOS", label: "Todas as flags" },
  { value: "AULAS", label: "Ministra aulas" },
  { value: "CATRACA", label: "Opera catraca" },
  { value: "FORA_HORARIO", label: "Fora do horário" },
  { value: "TECLADO", label: "Teclado de acesso" },
  { value: "COORDENADOR", label: "Coordenação" },
];

const DEFAULT_FILTERS: ColaboradorListFilters = {
  query: "",
  statusOperacional: "TODOS",
  statusAcesso: "TODOS",
  cargoId: "",
  unidadeId: "",
  flag: "TODOS",
};

const DEFAULT_QUICK_CREATE: ColaboradorQuickCreateDraft = {
  nome: "",
  emailProfissional: "",
  celular: "",
  cargoId: "",
  cargo: "",
  podeMinistrarAulas: false,
  permiteCatraca: false,
  permiteForaHorario: false,
  utilizaTecladoAcesso: false,
  coordenador: false,
  criarAcessoSistema: true,
  provisionamentoAcesso: "CONVITE",
  tenantIds: [],
  tenantBaseId: "",
  perfilAcessoInicialId: "",
  observacoes: "",
};

const FALLBACK_PERFIS: RbacPerfil[] = [
  { id: "perfil-admin-fallback", tenantId: "fallback", roleName: "ADMIN", displayName: "Administrador", active: true },
  { id: "perfil-gerente-fallback", tenantId: "fallback", roleName: "GERENTE", displayName: "Gerente", active: true },
  { id: "perfil-atendente-fallback", tenantId: "fallback", roleName: "ATENDENTE", displayName: "Atendente", active: true },
];

const TAB_OPTIONS = [
  { value: "cadastro", label: "Cadastro" },
  { value: "contratacao", label: "Contratação" },
  { value: "permissoes", label: "Permissões" },
  { value: "horario", label: "Horário" },
  { value: "informacoes", label: "Informações" },
  { value: "notificacoes", label: "Notificações" },
] as const;

const DIAS_SEMANA: Array<FuncionarioHorario["diaSemana"]> = ["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"];

function cloneEditableFuncionario(input: Funcionario): Funcionario {
  return {
    ...input,
    statusOperacional: input.statusOperacional ?? (input.ativo ? "ATIVO" : "INATIVO"),
    statusAcesso: input.statusAcesso ?? (input.possuiAcessoSistema ? "ATIVO" : "SEM_ACESSO"),
    tenantBaseId: input.tenantBaseId ?? input.memberships?.find((item) => item.defaultTenant)?.tenantId,
    tenantBaseNome: input.tenantBaseNome ?? input.memberships?.find((item) => item.defaultTenant)?.tenantNome,
    memberships: [...(input.memberships ?? [])],
    endereco: {
      cep: input.endereco?.cep ?? "",
      logradouro: input.endereco?.logradouro ?? "",
      numero: input.endereco?.numero ?? "",
      complemento: input.endereco?.complemento ?? "",
      bairro: input.endereco?.bairro ?? "",
      cidade: input.endereco?.cidade ?? "",
      estado: input.endereco?.estado ?? "",
      pais: input.endereco?.pais ?? "Brasil",
    },
    emergencia: {
      nomeResponsavel: input.emergencia?.nomeResponsavel ?? "",
      telefoneResponsavel: input.emergencia?.telefoneResponsavel ?? "",
      convenioMedico: input.emergencia?.convenioMedico ?? "",
      hospitalPreferencia: input.emergencia?.hospitalPreferencia ?? "",
      alergias: input.emergencia?.alergias ?? "",
      observacoes: input.emergencia?.observacoes ?? "",
    },
    contratacao: {
      tipo: input.contratacao?.tipo,
      dataAdmissao: input.contratacao?.dataAdmissao ?? "",
      dataDemissao: input.contratacao?.dataDemissao ?? "",
      cargoContratual: input.contratacao?.cargoContratual ?? "",
      salarioAtual: input.contratacao?.salarioAtual,
      banco: input.contratacao?.banco ?? "",
      agencia: input.contratacao?.agencia ?? "",
      conta: input.contratacao?.conta ?? "",
      pixTipo: input.contratacao?.pixTipo,
      pixValor: input.contratacao?.pixValor ?? "",
      observacoes: input.contratacao?.observacoes ?? "",
    },
    horarios:
      input.horarios?.length
        ? input.horarios.map((item) => ({ ...item }))
        : DIAS_SEMANA.map((dia) => ({
            diaSemana: dia,
            horaInicio: "09:00",
            horaFim: "18:00",
            permiteForaHorario: false,
            ativo: dia !== "SAB" && dia !== "DOM",
          })),
    notificacoes: {
      email: input.notificacoes?.email ?? true,
      whatsapp: input.notificacoes?.whatsapp ?? false,
      pendenciasOperacionais: input.notificacoes?.pendenciasOperacionais ?? true,
      escala: input.notificacoes?.escala ?? false,
    },
    observacoes: input.observacoes ?? "",
    informacoesInternas: input.informacoesInternas ?? "",
    emailProfissional: input.emailProfissional ?? "",
    emailPessoal: input.emailPessoal ?? "",
    celular: input.celular ?? "",
    telefone: input.telefone ?? "",
    cpf: input.cpf ?? "",
    rg: input.rg ?? "",
    apelido: input.apelido ?? "",
    nomeRegistro: input.nomeRegistro ?? "",
    dataNascimento: input.dataNascimento ?? "",
  };
}

function statusTone(status?: FuncionarioStatusOperacional | FuncionarioStatusAcesso) {
  if (status === "ATIVO") return "bg-gym-teal/15 text-gym-teal";
  if (status === "CONVITE_PENDENTE" || status === "PRIMEIRO_ACESSO") return "bg-gym-warning/15 text-gym-warning";
  if (status === "BLOQUEADO" || status === "DESLIGADO") return "bg-gym-danger/15 text-gym-danger";
  return "bg-secondary text-muted-foreground";
}

function maskSensitive(value: string | number | undefined, canView: boolean) {
  if (canView) return value || "—";
  return "Protegido";
}

export default function FuncionariosPage() {
  const tenantContext = useTenantContext();
  const access = useAuthAccess();
  const canViewSensitiveData = access.canAccessElevatedModules;

  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [perfis, setPerfis] = useState<RbacPerfil[]>([]);
  const [filters, setFilters] = useState<ColaboradorListFilters>(DEFAULT_FILTERS);
  const [selectedId, setSelectedId] = useState("");
  const [profileTab, setProfileTab] = useState<(typeof TAB_OPTIONS)[number]["value"]>("cadastro");
  const [editor, setEditor] = useState<Funcionario | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cargosModalOpen, setCargosModalOpen] = useState(false);
  const [cargoFormOpen, setCargoFormOpen] = useState(false);
  const [editingCargo, setEditingCargo] = useState<Cargo | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const quickCreateForm = useForm<ColaboradorQuickCreateDraft>({
    resolver: zodResolver(quickCreateColaboradorFormSchema),
    defaultValues: DEFAULT_QUICK_CREATE,
  });
  const quickCreate = useWatch({ control: quickCreateForm.control }) ?? DEFAULT_QUICK_CREATE;

  const tenantOptions = useMemo(
    () => tenantContext.availableTenants.filter((tenant) => tenant.ativo !== false),
    [tenantContext.availableTenants]
  );

  const activePerfis = useMemo(
    () => perfis.filter((perfil) => perfil.active && perfil.roleName.trim().toUpperCase() !== "CUSTOMER"),
    [perfis]
  );

  const selectedColaborador = useMemo(
    () => funcionarios.find((item) => item.id === selectedId) ?? null,
    [funcionarios, selectedId]
  );

  const filteredFuncionarios = useMemo(
    () => filterColaboradores(funcionarios, filters),
    [filters, funcionarios]
  );

  const stats = useMemo(() => {
    const ativos = funcionarios.filter((item) => item.statusOperacional === "ATIVO").length;
    const comAcesso = funcionarios.filter((item) => item.possuiAcessoSistema).length;
    const multiunidade = funcionarios.filter((item) => (item.memberships?.length ?? 0) > 1).length;
    const operacaoCritica = funcionarios.filter(
      (item) => item.permiteCatraca || item.permiteForaHorario || item.utilizaTecladoAcesso
    ).length;
    return { ativos, comAcesso, multiunidade, operacaoCritica };
  }, [funcionarios]);

  const possibleExistingUser = useMemo(() => {
    const email = quickCreate.emailProfissional.trim().toLowerCase();
    if (!email) return null;
    return funcionarios.find((item) => (item.emailProfissional ?? "").trim().toLowerCase() === email) ?? null;
  }, [funcionarios, quickCreate.emailProfissional]);

  const tenantContextLabel = hasMounted ? (tenantContext.tenantName || "Unidade ativa") : "Carregando contexto";
  const networkContextLabel = hasMounted ? tenantContext.networkName : "";

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const upsertFuncionario = useCallback((saved: Funcionario) => {
    setFuncionarios((current) => {
      const exists = current.some((item) => item.id === saved.id);
      if (!exists) return [saved, ...current];
      return current.map((item) => (item.id === saved.id ? saved : item));
    });
    setSelectedId(saved.id);
    setEditor(cloneEditableFuncionario(saved));
  }, []);

  const loadWorkspace = useCallback(async () => {
    if (!tenantContext.tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const [funcsResult, cargosResult, perfisResult] = await Promise.allSettled([
        listFuncionariosApi(false),
        listCargosApi(false),
        listPerfisApi({
          tenantId: tenantContext.tenantId,
          includeInactive: false,
          page: 0,
          size: 100,
        }),
      ]);
      const funcs = funcsResult.status === "fulfilled" ? funcsResult.value : [];
      const cargosData = cargosResult.status === "fulfilled" ? cargosResult.value : [];
      const perfisData =
        perfisResult.status === "fulfilled"
          ? perfisResult.value.items
          : FALLBACK_PERFIS.map((perfil) => ({ ...perfil, tenantId: tenantContext.tenantId }));

      setFuncionarios(funcs);
      setCargos(cargosData);
      setPerfis(perfisData);
      setSelectedId((current) => current || funcs[0]?.id || "");

      if (funcsResult.status === "rejected") {
        setError(normalizeErrorMessage(funcsResult.reason));
      } else if (cargosResult.status === "rejected") {
        setError(normalizeErrorMessage(cargosResult.reason));
      }
    } catch (loadError) {
      setError(normalizeErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [tenantContext.tenantId]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  useEffect(() => {
    if (!selectedColaborador) {
      setEditor(null);
      return;
    }
    setEditor(cloneEditableFuncionario(selectedColaborador));
  }, [selectedColaborador]);

  useEffect(() => {
    const currentTenantIds = quickCreateForm.getValues("tenantIds");
    const currentTenantBaseId = quickCreateForm.getValues("tenantBaseId");

    if (currentTenantIds.length === 0 && tenantContext.tenantId) {
      quickCreateForm.setValue("tenantIds", [tenantContext.tenantId], { shouldDirty: false });
    }
    if (!currentTenantBaseId && tenantContext.tenantId) {
      quickCreateForm.setValue("tenantBaseId", tenantContext.tenantId, { shouldDirty: false });
    }
  }, [createOpen, quickCreateForm, tenantContext.tenantId]);

  async function handleSaveCargo(data: Omit<Cargo, "id" | "tenantId">, id?: string) {
    setSaving(true);
    setError(null);
    try {
      if (id) {
        await updateCargoApi(id, data);
      } else {
        await createCargoApi({ nome: data.nome });
      }
      setCargoFormOpen(false);
      setEditingCargo(null);
      setSuccess("Catálogo de cargos atualizado.");
      await loadWorkspace();
    } catch (saveError) {
      setError(normalizeErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleCargo(id: string) {
    setSaving(true);
    setError(null);
    try {
      await toggleCargoApi(id);
      await loadWorkspace();
    } catch (toggleError) {
      setError(normalizeErrorMessage(toggleError));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteCargo(id: string) {
    if (!confirm("Remover este cargo?")) return;
    setSaving(true);
    setError(null);
    try {
      await deleteCargoApi(id);
      await loadWorkspace();
    } catch (deleteError) {
      setError(normalizeErrorMessage(deleteError));
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateColaborador(values: ColaboradorQuickCreateDraft) {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = buildQuickCreateColaboradorPayload({
        draft: values,
        cargos,
        perfis: activePerfis,
        availableTenants: tenantOptions,
        currentTenantId: tenantContext.tenantId,
      });
      const created = await createFuncionarioApi(payload);
      upsertFuncionario(created);
      setCreateOpen(false);
      quickCreateForm.reset(DEFAULT_QUICK_CREATE);
      setSuccess("Colaborador criado e pronto para continuidade do onboarding.");
    } catch (createError) {
      setError(normalizeErrorMessage(createError));
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveProfile() {
    if (!editor) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const saved = await updateFuncionarioApi(editor.id, editor);
      upsertFuncionario(saved);
      setSuccess("Ficha do colaborador atualizada.");
    } catch (saveError) {
      setError(normalizeErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleColaborador(id: string) {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const saved = await toggleFuncionarioApi(id);
      upsertFuncionario(saved);
      setSuccess(saved.ativo ? "Colaborador reativado." : "Colaborador inativado.");
    } catch (toggleError) {
      setError(normalizeErrorMessage(toggleError));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteColaborador(id: string) {
    if (!confirm("Remover este colaborador?")) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await deleteFuncionarioApi(id);
      setFuncionarios((current) => current.filter((item) => item.id !== id));
      setSelectedId("");
      setEditor(null);
      setSuccess("Colaborador removido.");
    } catch (deleteError) {
      setError(normalizeErrorMessage(deleteError));
    } finally {
      setSaving(false);
    }
  }

  if (!hasMounted) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          Carregando base operacional de colaboradores...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {cargoFormOpen ? (
        <CargoModal
          open={cargoFormOpen}
          onClose={() => {
            setCargoFormOpen(false);
            setEditingCargo(null);
          }}
          onSave={handleSaveCargo}
          initial={editingCargo}
        />
      ) : null}

      <Dialog
        open={createOpen}
        onOpenChange={(nextOpen) => {
          setCreateOpen(nextOpen);
          if (!nextOpen) {
            quickCreateForm.reset(DEFAULT_QUICK_CREATE);
          }
        }}
      >
        <DialogContent className="border-border bg-card sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold">Novo colaborador</DialogTitle>
          </DialogHeader>

          <form className="grid gap-4 md:grid-cols-2" onSubmit={quickCreateForm.handleSubmit(handleCreateColaborador)}>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nome *</label>
              <Input
                aria-label="Nome do colaborador"
                {...quickCreateForm.register("nome")}
                className="border-border bg-secondary"
                placeholder="Carla Operações"
              />
              {quickCreateForm.formState.errors.nome ? <p className="text-xs text-gym-danger">{quickCreateForm.formState.errors.nome.message}</p> : null}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Contato principal</label>
              <Input
                aria-label="Contato principal do colaborador"
                {...quickCreateForm.register("celular")}
                className="border-border bg-secondary"
                placeholder="(21) 99999-9999"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">E-mail profissional</label>
              <Input
                aria-label="E-mail profissional do colaborador"
                type="email"
                {...quickCreateForm.register("emailProfissional")}
                className="border-border bg-secondary"
                placeholder="carla@academia.local"
              />
              {quickCreateForm.formState.errors.emailProfissional ? <p className="text-xs text-gym-danger">{quickCreateForm.formState.errors.emailProfissional.message}</p> : null}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Cargo</label>
              <div className="flex items-center gap-2">
                <Controller
                  control={quickCreateForm.control}
                  name="cargoId"
                  render={({ field }) => (
                    <Select value={field.value || "__none__"} onValueChange={(value) => field.onChange(value === "__none__" ? "" : value)}>
                      <SelectTrigger aria-label="Cargo do colaborador" className="border-border bg-secondary">
                        <SelectValue placeholder="Selecione um cargo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Sem cargo</SelectItem>
                        {cargos.filter((cargo) => cargo.ativo).map((cargo) => (
                          <SelectItem key={cargo.id} value={cargo.id}>
                            {cargo.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="border-border"
                  onClick={() => {
                    setEditingCargo(null);
                    setCargoFormOpen(true);
                  }}
                >
                  Novo cargo
                </Button>
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Flags operacionais</label>
              <div className="grid gap-2 rounded-2xl border border-border bg-secondary/30 p-3 md:grid-cols-2">
                {[
                  ["Atua em aulas", quickCreate.podeMinistrarAulas, "podeMinistrarAulas"],
                  ["Opera catraca", quickCreate.permiteCatraca, "permiteCatraca"],
                  ["Permite fora do horário", quickCreate.permiteForaHorario, "permiteForaHorario"],
                  ["Usa teclado de acesso", quickCreate.utilizaTecladoAcesso, "utilizaTecladoAcesso"],
                  ["Responsável por coordenação", quickCreate.coordenador, "coordenador"],
                ].map(([label, checked, key]) => (
                  <label key={String(key)} className="flex items-center gap-2 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={Boolean(checked)}
                      onChange={(event) => quickCreateForm.setValue(String(key) as keyof ColaboradorQuickCreateDraft, event.target.checked as never, { shouldDirty: true })}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center justify-between rounded-2xl border border-border bg-secondary/30 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Criar acesso ao sistema</p>
                  <p className="text-xs text-muted-foreground">
                    Separado das flags operacionais: define identidade, convite e memberships iniciais.
                  </p>
                </div>
                <input
                  aria-label="Criar acesso ao sistema"
                  type="checkbox"
                  checked={quickCreate.criarAcessoSistema}
                  onChange={(event) => {
                    quickCreateForm.setValue("criarAcessoSistema", event.target.checked, { shouldDirty: true });
                    quickCreateForm.setValue(
                      "provisionamentoAcesso",
                      event.target.checked ? quickCreate.provisionamentoAcesso : "SEM_ACESSO",
                      { shouldDirty: true }
                    );
                  }}
                />
              </div>
            </div>

            {quickCreate.criarAcessoSistema ? (
              <>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Provisionamento</label>
                  <Controller
                    control={quickCreateForm.control}
                    name="provisionamentoAcesso"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={(value) => field.onChange(value as ColaboradorQuickCreateDraft["provisionamentoAcesso"])}>
                        <SelectTrigger aria-label="Provisionamento de acesso" className="border-border bg-secondary">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CONVITE">Enviar convite</SelectItem>
                          <SelectItem value="REUTILIZAR_USUARIO">Vincular usuário existente</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {quickCreateForm.formState.errors.perfilAcessoInicialId ? <p className="text-xs text-gym-danger">{quickCreateForm.formState.errors.perfilAcessoInicialId.message}</p> : null}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Perfil inicial</label>
                  <Controller
                    control={quickCreateForm.control}
                    name="perfilAcessoInicialId"
                    render={({ field }) => (
                      <Select value={field.value || "__none__"} onValueChange={(value) => field.onChange(value === "__none__" ? "" : value)}>
                        <SelectTrigger aria-label="Perfil inicial de acesso" className="border-border bg-secondary">
                          <SelectValue placeholder="Selecione um perfil" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Selecione</SelectItem>
                          {activePerfis.map((perfil) => (
                            <SelectItem key={perfil.id} value={perfil.id}>
                              {perfil.displayName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Unidades iniciais</label>
                  <div className="grid gap-2 rounded-2xl border border-border bg-secondary/30 p-3 md:grid-cols-2">
                    {tenantOptions.map((tenant) => (
                      <label key={tenant.id} className="flex items-start gap-2 rounded-xl border border-border/70 px-3 py-2 text-sm">
                        <input
                          type="checkbox"
                          checked={quickCreate.tenantIds.includes(tenant.id)}
                          onChange={(event) => {
                            const tenantIds = event.target.checked
                              ? [...new Set([...quickCreate.tenantIds, tenant.id])]
                              : quickCreate.tenantIds.filter((item) => item !== tenant.id);
                            quickCreateForm.setValue("tenantIds", tenantIds, { shouldDirty: true });
                            quickCreateForm.setValue(
                              "tenantBaseId",
                              quickCreate.tenantBaseId === tenant.id && !event.target.checked
                                ? tenantIds[0] ?? ""
                                : quickCreate.tenantBaseId,
                              { shouldDirty: true }
                            );
                          }}
                        />
                        <span>
                          <span className="block font-medium text-foreground">{tenant.nome}</span>
                          <span className="block text-xs text-muted-foreground">{tenant.subdomain ?? tenant.id}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                  {quickCreateForm.formState.errors.tenantIds ? <p className="text-xs text-gym-danger">{quickCreateForm.formState.errors.tenantIds.message}</p> : null}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Unidade base</label>
                  <Controller
                    control={quickCreateForm.control}
                    name="tenantBaseId"
                    render={({ field }) => (
                      <Select value={field.value || "__none__"} onValueChange={(value) => field.onChange(value === "__none__" ? "" : value)}>
                        <SelectTrigger aria-label="Unidade base do colaborador" className="border-border bg-secondary">
                          <SelectValue placeholder="Selecione a unidade base" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Selecione</SelectItem>
                          {tenantOptions
                            .filter((tenant) => quickCreate.tenantIds.includes(tenant.id))
                            .map((tenant) => (
                              <SelectItem key={tenant.id} value={tenant.id}>
                                {tenant.nome}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {quickCreateForm.formState.errors.tenantBaseId ? <p className="text-xs text-gym-danger">{quickCreateForm.formState.errors.tenantBaseId.message}</p> : null}
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground md:col-span-2">
                Este colaborador será criado sem usuário por tempo indeterminado. Você poderá provisionar o acesso depois na aba
                <span className="font-medium text-foreground"> Permissões</span>.
              </div>
            )}

            {possibleExistingUser && quickCreate.criarAcessoSistema ? (
              <div className="rounded-2xl border border-gym-warning/30 bg-gym-warning/10 px-4 py-3 text-sm text-gym-warning md:col-span-2">
                Já existe um colaborador com este e-mail. Use <span className="font-medium">Vincular usuário existente</span> se a intenção
                for reaproveitar a identidade.
              </div>
            ) : null}

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Observações iniciais</label>
              <Textarea
                aria-label="Observações do novo colaborador"
                {...quickCreateForm.register("observacoes")}
                className="min-h-24 border-border bg-secondary"
                placeholder="Contexto do onboarding, turno de entrada, pendências ou recados internos."
              />
            </div>

            <div className="flex justify-end gap-2 md:col-span-2">
              <Button type="button" variant="outline" className="border-border" onClick={() => setCreateOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Criando..." : "Criar colaborador"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={cargosModalOpen} onOpenChange={setCargosModalOpen}>
        <DialogContent className="border-border bg-card sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold">Catálogo de cargos</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  setEditingCargo(null);
                  setCargoFormOpen(true);
                }}
              >
                Novo cargo
              </Button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary">
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Cargo</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {cargos.map((cargo) => (
                    <tr key={cargo.id} className="transition-colors hover:bg-secondary/40">
                      <td className="px-4 py-3 text-sm">{cargo.nome}</td>
                      <td className="px-4 py-3 text-sm">
                        <Badge className={cn("border-0", cargo.ativo ? "bg-gym-teal/15 text-gym-teal" : "bg-secondary text-muted-foreground")}>
                          {cargo.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <DataTableRowActions
                          actions={[
                            {
                              label: "Editar",
                              kind: "edit",
                              onClick: () => {
                                setEditingCargo(cargo);
                                setCargoFormOpen(true);
                              },
                            },
                            {
                              label: cargo.ativo ? "Desativar" : "Ativar",
                              kind: "toggle",
                              onClick: () => {
                                void handleToggleCargo(cargo.id);
                              },
                            },
                            {
                              label: "Remover",
                              kind: "delete",
                              onClick: () => {
                                void handleDeleteCargo(cargo.id);
                              },
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <section className="overflow-hidden rounded-[28px] border border-border bg-card">
        <div className="relative overflow-hidden border-b border-border px-6 py-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(61,232,160,0.16),transparent_46%),radial-gradient(circle_at_bottom_right,rgba(255,214,51,0.12),transparent_42%)]" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-secondary/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Colaboradores
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold tracking-tight">Trilha operacional de equipe e acesso</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Cadastre, acompanhe e governe colaboradores sem misturar flags operacionais locais com identidade de acesso.
                </p>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <Card className="border-border/70 bg-background/60 backdrop-blur">
                <CardContent className="p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Ativos</p>
                  <p className="mt-2 font-display text-2xl font-bold">{stats.ativos}</p>
                </CardContent>
              </Card>
              <Card className="border-border/70 bg-background/60 backdrop-blur">
                <CardContent className="p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Com acesso</p>
                  <p className="mt-2 font-display text-2xl font-bold">{stats.comAcesso}</p>
                </CardContent>
              </Card>
              <Card className="border-border/70 bg-background/60 backdrop-blur">
                <CardContent className="p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Multiunidade</p>
                  <p className="mt-2 font-display text-2xl font-bold">{stats.multiunidade}</p>
                </CardContent>
              </Card>
              <Card className="border-border/70 bg-background/60 backdrop-blur">
                <CardContent className="p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Operação crítica</p>
                  <p className="mt-2 font-display text-2xl font-bold">{stats.operacaoCritica}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl text-sm text-muted-foreground">
            Unidade ativa:
            <span className="ml-2 font-medium text-foreground">{tenantContextLabel}</span>
            {networkContextLabel ? (
              <>
                <span className="mx-2 text-border">•</span>
                Rede: <span className="ml-1 font-medium text-foreground">{networkContextLabel}</span>
              </>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="border-border" onClick={() => setCargosModalOpen(true)}>
              Cargos
            </Button>
            <Button onClick={() => setCreateOpen(true)}>Novo colaborador</Button>
          </div>
        </div>
      </section>

      {access.loading || tenantContext.loading || loading ? (
        <div className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          Carregando base operacional de colaboradores...
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-gym-danger/30 bg-gym-danger/10 px-4 py-3 text-sm text-gym-danger">{error}</div>
      ) : null}

      {success ? (
        <div className="rounded-2xl border border-gym-teal/30 bg-gym-teal/10 px-4 py-3 text-sm text-gym-teal">{success}</div>
      ) : null}

      {!canViewSensitiveData ? (
        <div className="rounded-2xl border border-gym-warning/30 bg-gym-warning/10 px-4 py-3 text-sm text-gym-warning">
          Dados sensíveis de contratação e observações internas estão mascarados no seu contexto atual.
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1.4fr]">
        <Card className="border-border bg-card">
          <CardHeader className="space-y-4">
            <div>
              <CardTitle className="font-display text-xl">Base de colaboradores</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Listagem operacional, filtros por acesso e visão de unidades para o rollout do backend novo.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Input
                aria-label="Buscar colaborador"
                value={filters.query}
                onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
                className="border-border bg-secondary"
                placeholder="Buscar por nome, cargo, e-mail ou unidade"
              />

              <Select
                value={filters.statusOperacional}
                onValueChange={(value) =>
                  setFilters((current) => ({
                    ...current,
                    statusOperacional: value as ColaboradorListFilters["statusOperacional"],
                  }))
                }
              >
                <SelectTrigger aria-label="Filtrar por status operacional" className="border-border bg-secondary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPERACIONAL_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.statusAcesso}
                onValueChange={(value) =>
                  setFilters((current) => ({
                    ...current,
                    statusAcesso: value as ColaboradorListFilters["statusAcesso"],
                  }))
                }
              >
                <SelectTrigger aria-label="Filtrar por status de acesso" className="border-border bg-secondary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_ACESSO_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.cargoId || "__all__"}
                onValueChange={(value) => setFilters((current) => ({ ...current, cargoId: value === "__all__" ? "" : value }))}
              >
                <SelectTrigger aria-label="Filtrar por cargo" className="border-border bg-secondary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos os cargos</SelectItem>
                  {cargos.map((cargo) => (
                    <SelectItem key={cargo.id} value={cargo.id}>
                      {cargo.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.unidadeId || "__all__"}
                onValueChange={(value) => setFilters((current) => ({ ...current, unidadeId: value === "__all__" ? "" : value }))}
              >
                <SelectTrigger aria-label="Filtrar por unidade" className="border-border bg-secondary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todas as unidades</SelectItem>
                  {tenantOptions.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.flag}
                onValueChange={(value) => setFilters((current) => ({ ...current, flag: value as ColaboradorFlagFiltro }))}
              >
                <SelectTrigger aria-label="Filtrar por flag operacional" className="border-border bg-secondary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FLAG_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                className="border-border"
                onClick={() => setFilters(DEFAULT_FILTERS)}
              >
                Limpar filtros
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            {filteredFuncionarios.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                Nenhum colaborador encontrado para a combinação atual de filtros.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFuncionarios.map((funcionario) => (
                  <div
                    key={funcionario.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedId(funcionario.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedId(funcionario.id);
                      }
                    }}
                    className={cn(
                      "w-full rounded-2xl border p-4 text-left transition-all",
                      selectedId === funcionario.id
                        ? "border-gym-accent bg-gym-accent/5 shadow-[0_0_0_1px_rgba(61,232,160,0.15)]"
                        : "border-border bg-secondary/20 hover:bg-secondary/40"
                    )}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-display text-lg font-semibold">{funcionario.nome}</p>
                          <Badge className={cn("border-0", statusTone(funcionario.statusOperacional))}>
                            {funcionario.statusOperacional ?? "ATIVO"}
                          </Badge>
                          <Badge className={cn("border-0", statusTone(funcionario.statusAcesso))}>
                            {funcionario.statusAcesso ?? "SEM_ACESSO"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {funcionario.cargo ?? "Sem cargo definido"}
                          {funcionario.emailProfissional ? ` • ${funcionario.emailProfissional}` : ""}
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {funcionario.podeMinistrarAulas ? <Badge variant="outline">Aulas</Badge> : null}
                          {funcionario.permiteCatraca ? <Badge variant="outline">Catraca</Badge> : null}
                          {funcionario.permiteForaHorario ? <Badge variant="outline">Fora do horário</Badge> : null}
                          {funcionario.utilizaTecladoAcesso ? <Badge variant="outline">Teclado</Badge> : null}
                          {funcionario.coordenador ? <Badge variant="outline">Coordenação</Badge> : null}
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 lg:items-end">
                        <div className="text-right text-xs text-muted-foreground">
                          <p>Unidade base</p>
                          <p className="font-medium text-foreground">{funcionario.tenantBaseNome ?? tenantContextLabel}</p>
                          <p className="mt-1">{funcionario.memberships?.length ?? 0} memberships</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <DataTableRowActions
                            actions={[
                              {
                                label: "Abrir perfil",
                                kind: "view",
                                onClick: () => setSelectedId(funcionario.id),
                              },
                              {
                                label: funcionario.ativo ? "Desativar" : "Ativar",
                                kind: "toggle",
                                onClick: () => {
                                  void handleToggleColaborador(funcionario.id);
                                },
                              },
                              {
                                label: "Remover",
                                kind: "delete",
                                onClick: () => {
                                  void handleDeleteColaborador(funcionario.id);
                                },
                              },
                            ]}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle className="font-display text-xl">Perfil completo do colaborador</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Cadastro, contratação, permissões, horário e comunicação em um único workspace operacional.
                </p>
              </div>
              {editor ? (
                <div className="flex items-center gap-2">
                  <Badge className={cn("border-0", statusTone(editor.statusOperacional))}>{editor.statusOperacional}</Badge>
                  <Badge className={cn("border-0", statusTone(editor.statusAcesso))}>{editor.statusAcesso}</Badge>
                </div>
              ) : null}
            </div>
          </CardHeader>

          <CardContent>
            {!editor ? (
              <div className="rounded-2xl border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
                Selecione um colaborador para abrir a ficha operacional completa.
              </div>
            ) : (
              <Tabs value={profileTab} onValueChange={(value) => setProfileTab(value as typeof profileTab)} className="space-y-4">
                <TabsList className="grid h-auto grid-cols-2 gap-1 rounded-2xl bg-secondary/50 p-1 md:grid-cols-6">
                  {TAB_OPTIONS.map((tab) => (
                    <TabsTrigger key={tab.value} value={tab.value} className="rounded-xl">
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <div className="mb-4 rounded-2xl border border-border bg-secondary/20 px-4 py-3">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-display text-xl font-semibold">{editor.nome}</p>
                      <p className="text-sm text-muted-foreground">
                        {editor.cargo ?? "Sem cargo definido"}
                        {editor.emailProfissional ? ` • ${editor.emailProfissional}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>Origem: <span className="font-medium text-foreground">{editor.origemCadastro ?? "MANUAL"}</span></span>
                      <span>Base: <span className="font-medium text-foreground">{editor.tenantBaseNome ?? tenantContextLabel}</span></span>
                    </div>
                  </div>
                </div>

                <TabsContent value="cadastro" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nome completo</label>
                      <Input aria-label="Nome completo" value={editor.nome} onChange={(event) => setEditor((current) => current ? { ...current, nome: event.target.value } : current)} className="border-border bg-secondary" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nome de registro</label>
                      <Input aria-label="Nome de registro" value={editor.nomeRegistro ?? ""} onChange={(event) => setEditor((current) => current ? { ...current, nomeRegistro: event.target.value } : current)} className="border-border bg-secondary" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Apelido</label>
                      <Input value={editor.apelido ?? ""} onChange={(event) => setEditor((current) => current ? { ...current, apelido: event.target.value } : current)} className="border-border bg-secondary" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Data de nascimento</label>
                      <Input type="date" value={editor.dataNascimento ?? ""} onChange={(event) => setEditor((current) => current ? { ...current, dataNascimento: event.target.value } : current)} className="border-border bg-secondary" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">CPF</label>
                      <Input value={editor.cpf ?? ""} onChange={(event) => setEditor((current) => current ? { ...current, cpf: event.target.value } : current)} className="border-border bg-secondary" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">RG</label>
                      <Input value={editor.rg ?? ""} onChange={(event) => setEditor((current) => current ? { ...current, rg: event.target.value } : current)} className="border-border bg-secondary" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">E-mail profissional</label>
                      <Input value={editor.emailProfissional ?? ""} onChange={(event) => setEditor((current) => current ? { ...current, emailProfissional: event.target.value } : current)} className="border-border bg-secondary" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">E-mail pessoal</label>
                      <Input value={editor.emailPessoal ?? ""} onChange={(event) => setEditor((current) => current ? { ...current, emailPessoal: event.target.value } : current)} className="border-border bg-secondary" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Celular</label>
                      <Input value={editor.celular ?? ""} onChange={(event) => setEditor((current) => current ? { ...current, celular: event.target.value } : current)} className="border-border bg-secondary" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Telefone</label>
                      <Input value={editor.telefone ?? ""} onChange={(event) => setEditor((current) => current ? { ...current, telefone: event.target.value } : current)} className="border-border bg-secondary" />
                    </div>
                  </div>

                  <Separator />

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">CEP</label>
                      <Input value={editor.endereco?.cep ?? ""} onChange={(event) => setEditor((current) => current ? { ...current, endereco: { ...current.endereco, cep: event.target.value } } : current)} className="border-border bg-secondary" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Logradouro</label>
                      <Input value={editor.endereco?.logradouro ?? ""} onChange={(event) => setEditor((current) => current ? { ...current, endereco: { ...current.endereco, logradouro: event.target.value } } : current)} className="border-border bg-secondary" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Número</label>
                      <Input value={editor.endereco?.numero ?? ""} onChange={(event) => setEditor((current) => current ? { ...current, endereco: { ...current.endereco, numero: event.target.value } } : current)} className="border-border bg-secondary" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Bairro</label>
                      <Input value={editor.endereco?.bairro ?? ""} onChange={(event) => setEditor((current) => current ? { ...current, endereco: { ...current.endereco, bairro: event.target.value } } : current)} className="border-border bg-secondary" />
                    </div>
                  </div>

                  <Separator />

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Contato de emergência</label>
                      <Input value={editor.emergencia?.nomeResponsavel ?? ""} onChange={(event) => setEditor((current) => current ? { ...current, emergencia: { ...current.emergencia, nomeResponsavel: event.target.value } } : current)} className="border-border bg-secondary" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Telefone de emergência</label>
                      <Input value={editor.emergencia?.telefoneResponsavel ?? ""} onChange={(event) => setEditor((current) => current ? { ...current, emergencia: { ...current.emergencia, telefoneResponsavel: event.target.value } } : current)} className="border-border bg-secondary" />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="contratacao" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Tipo de contratação</label>
                      <Select
                        value={editor.contratacao?.tipo || "__none__"}
                        onValueChange={(value) =>
                          setEditor((current) =>
                            current
                              ? {
                                  ...current,
                                  contratacao: {
                                    ...current.contratacao,
                                    tipo: value === "__none__" ? undefined : value as FuncionarioTipoContratacao,
                                  },
                                }
                              : current
                          )
                        }
                      >
                        <SelectTrigger className="border-border bg-secondary">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Não definido</SelectItem>
                          {["CLT", "PJ", "ESTAGIO", "AUTONOMO", "HORISTA", "OUTRO"].map((option) => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Cargo contratual</label>
                      <Input value={editor.contratacao?.cargoContratual ?? ""} onChange={(event) => setEditor((current) => current ? { ...current, contratacao: { ...current.contratacao, cargoContratual: event.target.value } } : current)} className="border-border bg-secondary" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Data de admissão</label>
                      <Input type="date" value={editor.contratacao?.dataAdmissao ?? ""} onChange={(event) => setEditor((current) => current ? { ...current, contratacao: { ...current.contratacao, dataAdmissao: event.target.value } } : current)} className="border-border bg-secondary" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Data de desligamento</label>
                      <Input type="date" value={editor.contratacao?.dataDemissao ?? ""} onChange={(event) => setEditor((current) => current ? { ...current, contratacao: { ...current.contratacao, dataDemissao: event.target.value } } : current)} className="border-border bg-secondary" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Salário atual</label>
                      <Input
                        value={String(maskSensitive(editor.contratacao?.salarioAtual, canViewSensitiveData))}
                        onChange={(event) =>
                          setEditor((current) =>
                            current && canViewSensitiveData
                              ? {
                                  ...current,
                                  contratacao: {
                                    ...current.contratacao,
                                    salarioAtual: Number(event.target.value.replace(",", ".")) || undefined,
                                  },
                                }
                              : current
                          )
                        }
                        disabled={!canViewSensitiveData}
                        className="border-border bg-secondary"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Banco / agência / conta</label>
                      <Input
                        value={
                          canViewSensitiveData
                            ? [editor.contratacao?.banco, editor.contratacao?.agencia, editor.contratacao?.conta].filter(Boolean).join(" • ")
                            : String(maskSensitive(editor.contratacao?.banco, false))
                        }
                        onChange={(event) => {
                          if (!canViewSensitiveData) return;
                          const [banco = "", agencia = "", conta = ""] = event.target.value.split("•").map((item) => item.trim());
                          setEditor((current) =>
                            current
                              ? {
                                  ...current,
                                  contratacao: {
                                    ...current.contratacao,
                                    banco,
                                    agencia,
                                    conta,
                                  },
                                }
                              : current
                          );
                        }}
                        disabled={!canViewSensitiveData}
                        className="border-border bg-secondary"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="permissoes" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card className="border-border bg-secondary/20">
                      <CardHeader>
                        <CardTitle className="text-base">Identidade e acesso</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Acesso ao sistema</span>
                          <input
                            type="checkbox"
                            checked={editor.possuiAcessoSistema ?? false}
                            onChange={(event) =>
                              setEditor((current) => current ? { ...current, possuiAcessoSistema: event.target.checked } : current)
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Bloquear acesso</span>
                          <input
                            type="checkbox"
                            checked={editor.bloqueiaAcessoSistema ?? false}
                            onChange={(event) =>
                              setEditor((current) =>
                                current
                                  ? {
                                      ...current,
                                      bloqueiaAcessoSistema: event.target.checked,
                                      statusAcesso: event.target.checked ? "BLOQUEADO" : current.statusAcesso,
                                    }
                                  : current
                              )
                            }
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status operacional</label>
                          <Select
                            value={editor.statusOperacional ?? "ATIVO"}
                            onValueChange={(value) =>
                              setEditor((current) => current ? { ...current, statusOperacional: value as FuncionarioStatusOperacional } : current)
                            }
                          >
                            <SelectTrigger className="border-border bg-secondary">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPERACIONAL_OPTIONS.filter((option) => option.value !== "TODOS").map((option) => (
                                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status de acesso</label>
                          <Select
                            value={editor.statusAcesso ?? "SEM_ACESSO"}
                            onValueChange={(value) =>
                              setEditor((current) => current ? { ...current, statusAcesso: value as FuncionarioStatusAcesso } : current)
                            }
                          >
                            <SelectTrigger className="border-border bg-secondary">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_ACESSO_OPTIONS.filter((option) => option.value !== "TODOS").map((option) => (
                                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-border bg-secondary/20">
                      <CardHeader>
                        <CardTitle className="text-base">Flags locais</CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-3">
                        {[
                          ["Ministra aulas", editor.podeMinistrarAulas, "podeMinistrarAulas"],
                          ["Opera catraca", editor.permiteCatraca ?? false, "permiteCatraca"],
                          ["Fora do horário", editor.permiteForaHorario ?? false, "permiteForaHorario"],
                          ["Teclado de acesso", editor.utilizaTecladoAcesso ?? false, "utilizaTecladoAcesso"],
                          ["Coordenação", editor.coordenador ?? false, "coordenador"],
                        ].map(([label, checked, key]) => (
                          <label key={String(key)} className="flex items-center justify-between gap-3 rounded-xl border border-border/70 px-3 py-2 text-sm">
                            <span>{label}</span>
                            <input
                              type="checkbox"
                              checked={Boolean(checked)}
                              onChange={(event) =>
                                setEditor((current) => current ? { ...current, [String(key)]: event.target.checked } : current)
                              }
                            />
                          </label>
                        ))}
                      </CardContent>
                    </Card>
                  </div>

                  <div className="rounded-2xl border border-border bg-secondary/20 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground">Memberships por unidade</p>
                        <p className="text-sm text-muted-foreground">Acesso por unidade separado das flags locais do colaborador.</p>
                      </div>
                      <Badge variant="outline">{editor.memberships?.length ?? 0} vínculos</Badge>
                    </div>
                    <div className="mt-3 grid gap-2">
                      {(editor.memberships?.length ?? 0) === 0 ? (
                        <p className="text-sm text-muted-foreground">Nenhum membership configurado no momento.</p>
                      ) : (
                        editor.memberships?.map((membership) => (
                          <div key={`${membership.tenantId}-${membership.roleName ?? membership.roleDisplayName ?? "membership"}`} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 px-3 py-2 text-sm">
                            <div>
                              <p className="font-medium text-foreground">{membership.tenantNome}</p>
                              <p className="text-xs text-muted-foreground">{membership.roleDisplayName ?? membership.roleName ?? "Sem role definida"}</p>
                            </div>
                            <div className="flex gap-2">
                              {membership.defaultTenant ? <Badge variant="outline">Base</Badge> : null}
                              <Badge className={cn("border-0", membership.active === false ? "bg-secondary text-muted-foreground" : "bg-gym-teal/15 text-gym-teal")}>
                                {membership.active === false ? "Inativo" : "Ativo"}
                              </Badge>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="horario" className="space-y-4">
                  <div className="space-y-3 rounded-2xl border border-border bg-secondary/20 p-4">
                    <div>
                      <p className="font-semibold text-foreground">Jornada operacional</p>
                      <p className="text-sm text-muted-foreground">
                        Use esta aba para distinguir agenda de trabalho da permissão global de operar fora do horário.
                      </p>
                    </div>
                    {editor.horarios?.map((horario, index) => (
                      <div key={`${horario.diaSemana}-${index}`} className="grid gap-3 rounded-xl border border-border/70 px-3 py-3 md:grid-cols-[90px_1fr_1fr_auto_auto] md:items-center">
                        <div className="font-semibold text-foreground">{horario.diaSemana}</div>
                        <Input
                          type="time"
                          value={horario.horaInicio ?? ""}
                          onChange={(event) =>
                            setEditor((current) =>
                              current
                                ? {
                                    ...current,
                                    horarios: current.horarios?.map((item, itemIndex) =>
                                      itemIndex === index ? { ...item, horaInicio: event.target.value } : item
                                    ),
                                  }
                                : current
                            )
                          }
                          className="border-border bg-secondary"
                        />
                        <Input
                          type="time"
                          value={horario.horaFim ?? ""}
                          onChange={(event) =>
                            setEditor((current) =>
                              current
                                ? {
                                    ...current,
                                    horarios: current.horarios?.map((item, itemIndex) =>
                                      itemIndex === index ? { ...item, horaFim: event.target.value } : item
                                    ),
                                  }
                                : current
                            )
                          }
                          className="border-border bg-secondary"
                        />
                        <label className="flex items-center gap-2 text-sm text-muted-foreground">
                          <input
                            type="checkbox"
                            checked={horario.ativo ?? false}
                            onChange={(event) =>
                              setEditor((current) =>
                                current
                                  ? {
                                      ...current,
                                      horarios: current.horarios?.map((item, itemIndex) =>
                                        itemIndex === index ? { ...item, ativo: event.target.checked } : item
                                      ),
                                    }
                                  : current
                              )
                            }
                          />
                          Ativo
                        </label>
                        <label className="flex items-center gap-2 text-sm text-muted-foreground">
                          <input
                            type="checkbox"
                            checked={horario.permiteForaHorario ?? false}
                            onChange={(event) =>
                              setEditor((current) =>
                                current
                                  ? {
                                      ...current,
                                      horarios: current.horarios?.map((item, itemIndex) =>
                                        itemIndex === index ? { ...item, permiteForaHorario: event.target.checked } : item
                                      ),
                                    }
                                  : current
                              )
                            }
                          />
                          Extra
                        </label>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="informacoes" className="space-y-4">
                  <div className="grid gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Observações operacionais</label>
                      <Textarea value={editor.observacoes ?? ""} onChange={(event) => setEditor((current) => current ? { ...current, observacoes: event.target.value } : current)} className="min-h-28 border-border bg-secondary" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Informações internas</label>
                      <Textarea
                        value={canViewSensitiveData ? editor.informacoesInternas ?? "" : String(maskSensitive(editor.informacoesInternas, false))}
                        onChange={(event) => setEditor((current) => current && canViewSensitiveData ? { ...current, informacoesInternas: event.target.value } : current)}
                        disabled={!canViewSensitiveData}
                        className="min-h-28 border-border bg-secondary"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="notificacoes" className="space-y-4">
                  <div className="grid gap-3 rounded-2xl border border-border bg-secondary/20 p-4">
                    {[
                      ["Notificar por e-mail", editor.notificacoes?.email ?? false, "email"],
                      ["Notificar por WhatsApp", editor.notificacoes?.whatsapp ?? false, "whatsapp"],
                      ["Avisos de pendências operacionais", editor.notificacoes?.pendenciasOperacionais ?? false, "pendenciasOperacionais"],
                      ["Atualizações de escala", editor.notificacoes?.escala ?? false, "escala"],
                    ].map(([label, checked, key]) => (
                      <label key={String(key)} className="flex items-center justify-between rounded-xl border border-border/70 px-3 py-3 text-sm">
                        <span>{label}</span>
                        <input
                          type="checkbox"
                          checked={Boolean(checked)}
                          onChange={(event) =>
                            setEditor((current) =>
                              current
                                ? {
                                    ...current,
                                    notificacoes: {
                                      ...current.notificacoes,
                                      [String(key)]: event.target.checked,
                                    },
                                  }
                                : current
                            )
                          }
                        />
                      </label>
                    ))}
                  </div>
                </TabsContent>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-border"
                    onClick={() => selectedColaborador && setEditor(cloneEditableFuncionario(selectedColaborador))}
                  >
                    Descartar alterações
                  </Button>
                  <Button type="button" onClick={() => void handleSaveProfile()} disabled={saving}>
                    {saving ? "Salvando..." : "Salvar ficha"}
                  </Button>
                </div>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
