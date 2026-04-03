"use client";

import { useMemo, useState } from "react";
import { z } from "zod";
import { CrudModal, type FormFieldConfig } from "@/components/shared/crud-modal";
import { DataTableRowActions } from "@/components/shared/data-table-row-actions";
import { ListErrorState } from "@/components/shared/list-states";
import { PaginatedTable } from "@/components/shared/paginated-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  createAdminGateway,
  updateAdminGateway,
  ativarAdminGateway,
  desativarAdminGateway,
} from "@/backoffice/api/admin-gateways";
import { useAdminGateways } from "@/backoffice/query";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { requiredTrimmedString } from "@/lib/forms/zod-helpers";
import type { GatewayPagamento, ProvedorGateway } from "@/lib/types";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

type PageSize = 10 | 20 | 50;

type GatewayFormValues = {
  nome: string;
  provedor: ProvedorGateway;
  chaveApi: string;
  ambiente: "SANDBOX" | "PRODUCAO";
  ativo: boolean;
};

const PAGE_SIZES: PageSize[] = [10, 20, 50];

const PROVEDOR_OPTIONS: { value: ProvedorGateway; label: string }[] = [
  { value: "PAGARME", label: "Pagar.me" },
  { value: "STRIPE", label: "Stripe" },
  { value: "MERCADO_PAGO", label: "Mercado Pago" },
  { value: "CIELO_ECOMMERCE", label: "Cielo E-commerce" },
  { value: "ASAAS", label: "Asaas" },
  { value: "OUTRO", label: "Outro" },
];

const AMBIENTE_OPTIONS: { value: "SANDBOX" | "PRODUCAO"; label: string }[] = [
  { value: "SANDBOX", label: "Sandbox" },
  { value: "PRODUCAO", label: "Produção" },
];

const FIELDS: FormFieldConfig[] = [
  { name: "nome", label: "Nome *", type: "text", required: true, placeholder: "Ex.: Gateway Principal", className: "md:col-span-2" },
  { name: "provedor", label: "Provedor *", type: "select", options: PROVEDOR_OPTIONS, className: "space-y-1.5" },
  { name: "chaveApi", label: "Chave da API *", type: "text", required: true, placeholder: "sk_live_...", className: "md:col-span-2" },
  { name: "ambiente", label: "Ambiente *", type: "select", options: AMBIENTE_OPTIONS, className: "space-y-1.5" },
  {
    name: "ativo",
    label: "Status",
    type: "checkbox",
    checkboxLabel: "Gateway ativo para processamento",
    className: "md:col-span-3",
  },
];

const gatewayFormSchema = z.object({
  nome: requiredTrimmedString("Informe o nome do gateway."),
  provedor: z.enum(["PAGARME", "STRIPE", "MERCADO_PAGO", "CIELO_ECOMMERCE", "ASAAS", "OUTRO"], {
    message: "Selecione um provedor.",
  }),
  chaveApi: requiredTrimmedString("Informe a chave da API."),
  ambiente: z.enum(["SANDBOX", "PRODUCAO"]).default("SANDBOX"),
  ativo: z.boolean().default(true),
});

function getProvedorLabel(provedor: ProvedorGateway): string {
  return PROVEDOR_OPTIONS.find((opt) => opt.value === provedor)?.label ?? provedor;
}

function getAmbienteLabel(ambiente: "SANDBOX" | "PRODUCAO"): string {
  return ambiente === "PRODUCAO" ? "Produção" : "Sandbox";
}

function maskApiKey(key: string): string {
  if (key.length <= 8) return "••••••••";
  return `${key.slice(0, 4)}${"•".repeat(Math.min(key.length - 8, 16))}${key.slice(-4)}`;
}

function toFormValues(gateway: GatewayPagamento): GatewayFormValues {
  return {
    nome: gateway.nome,
    provedor: gateway.provedor,
    chaveApi: gateway.chaveApi,
    ambiente: gateway.ambiente,
    ativo: gateway.ativo,
  };
}

function buildPayload(values: GatewayFormValues): Omit<GatewayPagamento, "id" | "criadoEm" | "atualizadoEm"> {
  return {
    nome: values.nome.trim(),
    provedor: values.provedor,
    chaveApi: values.chaveApi.trim(),
    ambiente: values.ambiente,
    ativo: values.ativo,
  };
}

export default function AdminGatewaysPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const gatewaysQuery = useAdminGateways();
  const loading = gatewaysQuery.isLoading;
  const error = gatewaysQuery.error ? normalizeErrorMessage(gatewaysQuery.error) : null;
  const gateways = gatewaysQuery.data ?? [];
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<GatewayPagamento | null>(null);

  const filteredGateways = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return gateways;
    return gateways.filter((gw) =>
      [gw.nome, getProvedorLabel(gw.provedor), getAmbienteLabel(gw.ambiente)]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [gateways, search]);

  const pageItems = useMemo(
    () => filteredGateways.slice(page * pageSize, page * pageSize + pageSize),
    [filteredGateways, page, pageSize],
  );

  const hasNext = (page + 1) * pageSize < filteredGateways.length;
  const totalAtivos = useMemo(() => gateways.filter((gw) => gw.ativo).length, [gateways]);
  const totalProducao = useMemo(() => gateways.filter((gw) => gw.ambiente === "PRODUCAO").length, [gateways]);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(0);
  }

  function handleOpenCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function handleOpenEdit(gateway: GatewayPagamento) {
    setEditing(gateway);
    setModalOpen(true);
  }

  function handleCloseModal() {
    setModalOpen(false);
    setEditing(null);
  }

  async function handleSave(values: GatewayFormValues, id?: string) {
    setSaving(true);
    try {
      const payload = buildPayload(values);
      const saved = id ? await updateAdminGateway(id, payload) : await createAdminGateway(payload);
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.financeiro.gateways() });
      setPage(0);
      handleCloseModal();
      toast({
        title: id ? "Gateway atualizado" : "Gateway criado",
        description: saved.nome,
      });
    } catch (saveError) {
      toast({
        title: "Não foi possível salvar o gateway",
        description: normalizeErrorMessage(saveError),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(gateway: GatewayPagamento) {
    try {
      const toggled = gateway.ativo
        ? await desativarAdminGateway(gateway.id)
        : await ativarAdminGateway(gateway.id);
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.financeiro.gateways() });
      toast({
        title: toggled.ativo ? "Gateway ativado" : "Gateway desativado",
        description: toggled.nome,
      });
    } catch (toggleError) {
      toast({
        title: "Não foi possível alterar o status do gateway",
        description: normalizeErrorMessage(toggleError),
        variant: "destructive",
      });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-gym-accent">Admin &gt; Financeiro &gt; Gateways</p>
        <h1 className="font-display text-3xl font-bold">Gateways de pagamento</h1>
        <p className="text-sm text-muted-foreground">
          Configure os gateways de pagamento utilizados pelas academias para processar cobranças.
        </p>
      </header>

      {error ? <ListErrorState error={error} onRetry={() => void gatewaysQuery.refetch()} /> : null}

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total de gateways</p>
          <p className="mt-2 text-2xl font-bold text-gym-accent">{loading ? "…" : gateways.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ativos</p>
          <p className="mt-2 text-2xl font-bold text-gym-teal">{loading ? "…" : totalAtivos}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Em produção</p>
          <p className="mt-2 text-2xl font-bold text-gym-warning">{loading ? "…" : totalProducao}</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-base">Gestão de gateways</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Cadastre, edite e controle o status dos gateways de pagamento da plataforma.
            </p>
          </div>
          <Button onClick={handleOpenCreate}>Novo gateway</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-72 flex-1">
              <Input
                value={search}
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder="Buscar por nome ou provedor"
              />
            </div>
            <div className="w-full max-w-44">
              <Select
                value={String(pageSize)}
                onValueChange={(value) => {
                  setPageSize(Number(value) as PageSize);
                  setPage(0);
                }}
              >
                <SelectTrigger className="w-full border-border bg-secondary text-xs">
                  <SelectValue placeholder="Itens por página" />
                </SelectTrigger>
                <SelectContent className="border-border bg-card">
                  {PAGE_SIZES.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size} por página
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {search ? (
              <Button variant="outline" size="sm" onClick={() => handleSearchChange("")}>
                Limpar
              </Button>
            ) : null}
          </div>

          <PaginatedTable<GatewayPagamento>
            columns={[
              { label: "Gateway" },
              { label: "Provedor" },
              { label: "Chave da API" },
              { label: "Ambiente" },
              { label: "Status" },
              { label: "Ações", className: "text-right" },
            ]}
            items={pageItems}
            emptyText={loading ? "Carregando gateways..." : "Nenhum gateway encontrado."}
            isLoading={loading}
            getRowKey={(gw) => gw.id}
            page={page}
            pageSize={pageSize}
            total={filteredGateways.length}
            hasNext={hasNext}
            onPrevious={() => setPage((current) => Math.max(0, current - 1))}
            onNext={() => setPage((current) => current + 1)}
            itemLabel="gateways"
            showPagination={filteredGateways.length > pageSize}
            renderCells={(gw) => (
              <>
                <td className="px-4 py-3">
                  <span className="text-sm font-semibold">{gw.nome}</span>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="secondary" className="border-border bg-secondary text-xs">
                    {getProvedorLabel(gw.provedor)}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <code className="rounded bg-secondary px-2 py-1 font-mono text-xs text-muted-foreground">
                    {maskApiKey(gw.chaveApi)}
                  </code>
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant="outline"
                    className={gw.ambiente === "PRODUCAO" ? "border-gym-warning text-gym-warning" : ""}
                  >
                    {getAmbienteLabel(gw.ambiente)}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant={gw.ativo ? "default" : "outline"}
                    className={gw.ativo ? "bg-gym-teal text-white hover:bg-gym-teal/90" : ""}
                  >
                    {gw.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <DataTableRowActions
                      actions={[
                        {
                          kind: "edit",
                          label: "Editar gateway",
                          onClick: () => handleOpenEdit(gw),
                        },
                        {
                          kind: "toggle",
                          label: gw.ativo ? "Desativar gateway" : "Ativar gateway",
                          onClick: () => void handleToggle(gw),
                        },
                      ]}
                    />
                  </div>
                </td>
              </>
            )}
          />
        </CardContent>
      </Card>

      <CrudModal<GatewayFormValues>
        open={modalOpen}
        onClose={handleCloseModal}
        onSave={(values, id) => {
          void handleSave(values, id);
        }}
        initial={editing ? toFormValues(editing) : null}
        initialId={editing?.id}
        title="Novo gateway"
        editTitle="Editar gateway"
        description="Configure o provedor, credenciais e ambiente do gateway."
        editDescription="Atualize as configurações do gateway de pagamento."
        fields={FIELDS}
        schema={gatewayFormSchema}
        fieldsClassName="grid gap-4 py-2 md:grid-cols-3"
        contentClassName="border-border bg-card sm:max-w-3xl"
        submitLabel={saving ? "Criando..." : "Criar gateway"}
        editSubmitLabel={saving ? "Salvando..." : "Salvar gateway"}
      />
    </div>
  );
}
