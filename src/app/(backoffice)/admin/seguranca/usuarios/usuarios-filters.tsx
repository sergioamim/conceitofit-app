"use client";

import type { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Academia, GlobalAdminReviewStatus, Tenant } from "@/lib/types";
import { FILTER_ALL } from "@/lib/shared/constants/filters";
import type { Filters } from "./usuarios-types";

type UsuariosFiltersProps = {
  filters: Filters;
  setFilters: Dispatch<SetStateAction<Filters>>;
  academias: Academia[];
  unidadesFiltradas: Tenant[];
  contextualNetworkNames: string[];
  onApply: () => void;
  onClear: () => void;
  loading: boolean;
};

export function UsuariosFilters({
  filters,
  setFilters,
  academias,
  unidadesFiltradas,
  contextualNetworkNames,
  onApply,
  onClear,
  loading,
}: UsuariosFiltersProps) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros de operação</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3 xl:grid-cols-9">
          <div className="space-y-2 xl:col-span-2">
            <Label htmlFor="security-user-query">Pessoa, e-mail ou CPF</Label>
            <Input
              id="security-user-query"
              placeholder="Buscar por nome, e-mail ou CPF"
              value={filters.query}
              onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Academia</Label>
            <Select
              value={filters.academiaId || "__all__"}
              onValueChange={(value) =>
                setFilters((current) => ({
                  ...current,
                  academiaId: value === "__all__" ? "" : value,
                  tenantId: value === "__all__" ? current.tenantId : "",
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todas</SelectItem>
                {academias.map((academia) => (
                  <SelectItem key={academia.id} value={academia.id}>
                    {academia.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Unidade</Label>
            <Select
              value={filters.tenantId || "__all__"}
              onValueChange={(value) =>
                setFilters((current) => ({ ...current, tenantId: value === "__all__" ? "" : value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todas</SelectItem>
                {unidadesFiltradas.map((tenant) => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={filters.status || "ATIVO"}
              onValueChange={(value) => setFilters((current) => ({ ...current, status: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ATIVO">Ativos</SelectItem>
                <SelectItem value="INATIVO">Inativos</SelectItem>
                <SelectItem value="PENDENTE">Pendentes</SelectItem>
                <SelectItem value={FILTER_ALL}>Todos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="security-user-profile">Papel em uso</Label>
            <Input
              id="security-user-profile"
              placeholder="Administrador"
              value={filters.profile}
              onChange={(event) => setFilters((current) => ({ ...current, profile: event.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Escopo</Label>
            <Select
              value={filters.scopeType || "__all__"}
              onValueChange={(value) =>
                setFilters((current) => ({
                  ...current,
                  scopeType: value === "__all__" ? "" : (value as Filters["scopeType"]),
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos</SelectItem>
                <SelectItem value="UNIDADE">Unidade</SelectItem>
                <SelectItem value="REDE">Rede</SelectItem>
                <SelectItem value="GLOBAL">Global</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Novas unidades</Label>
            <Select
              value={filters.eligibleOnly ? "SIM" : FILTER_ALL}
              onValueChange={(value) => setFilters((current) => ({ ...current, eligibleOnly: value === "SIM" }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FILTER_ALL}>Todos</SelectItem>
                <SelectItem value="SIM">Só com propagação</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Revisão</Label>
            <Select
              value={filters.reviewStatus || "__all__"}
              onValueChange={(value) =>
                setFilters((current) => ({
                  ...current,
                  reviewStatus: value === "__all__" ? "" : (value as GlobalAdminReviewStatus),
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todas</SelectItem>
                <SelectItem value="EM_DIA">Em dia</SelectItem>
                <SelectItem value="PENDENTE">Pendente</SelectItem>
                <SelectItem value="VENCIDA">Vencida</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Acesso amplo</Label>
            <Select
              value={filters.broadAccessOnly ? "SIM" : FILTER_ALL}
              onValueChange={(value) => setFilters((current) => ({ ...current, broadAccessOnly: value === "SIM" }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FILTER_ALL}>Todos</SelectItem>
                <SelectItem value="SIM">Só amplos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Exceções</Label>
            <Select
              value={filters.exceptionsOnly ? "SIM" : FILTER_ALL}
              onValueChange={(value) => setFilters((current) => ({ ...current, exceptionsOnly: value === "SIM" }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FILTER_ALL}>Todos</SelectItem>
                <SelectItem value="SIM">Só com exceção</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 md:col-span-3 xl:col-span-8">
            <Button onClick={onApply} disabled={loading}>
              Aplicar filtros
            </Button>
            <Button variant="outline" className="border-border" onClick={onClear}>
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {contextualNetworkNames.length > 0 ? (
        <Card>
          <CardContent className="flex flex-wrap items-center gap-2 px-6 py-4 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Redes no recorte:</span>
            <span>{contextualNetworkNames.join(" · ")}</span>
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}
