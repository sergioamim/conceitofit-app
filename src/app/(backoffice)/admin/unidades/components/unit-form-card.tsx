"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getUnidadeOnboardingStrategyLabel } from "@/backoffice/lib/onboarding";
import { UnidadesWorkspace, UnitForm } from "../hooks/use-unidades-workspace";
import { UnidadeOnboardingStrategy } from "@/lib/types";

interface UnitFormCardProps {
  workspace: UnidadesWorkspace;
}

export function UnitFormCard({ workspace }: UnitFormCardProps) {
  const {
    saving,
    editing,
    selectedAcademiaId,
    form,
    setForm,
    academiasOrdenadas,
    selectedAcademia,
    eligiblePreview,
    resetForm,
    handleSelectAcademia,
    handleSubmit,
  } = workspace;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-base">
            {editing ? "Editar unidade" : "Cadastrar nova unidade"}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {selectedAcademia
              ? `Contexto atual: ${selectedAcademia.nome}.`
              : "Selecione uma academia para começar."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedAcademia ? (
            <Button asChild variant="outline" className="border-border">
              <Link href={`/admin/academias/${selectedAcademia.id}`}>Abrir academia</Link>
            </Button>
          ) : null}
          <Button
            variant="outline"
            className="border-border"
            onClick={() => resetForm(selectedAcademiaId)}
            disabled={saving || !selectedAcademiaId}
          >
            Nova unidade nesta academia
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        {selectedAcademia ? (
          <div className="rounded-xl border border-border bg-secondary/30 px-4 py-3 text-sm md:col-span-2">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium">
                  {eligiblePreview.loading
                    ? "Consultando política de novas unidades..."
                    : eligiblePreview.total > 0
                      ? `${eligiblePreview.total} usuário(s) receberão acesso automático nas novas unidades desta academia.`
                      : "Nenhum usuário está elegível para propagação automática nesta academia."}
                </p>
                {eligiblePreview.items.length > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Preview: {eligiblePreview.items.map((item) => item.fullName || item.name).join(", ")}.
                  </p>
                ) : null}
              </div>
              <Button asChild size="sm" variant="outline" className="border-border">
                <Link href={`/admin/seguranca/usuarios?academiaId=${selectedAcademia.id}&eligible=1`}>
                  Abrir segurança
                </Link>
              </Button>
            </div>
          </div>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="backoffice-unidade-nome">Nome da unidade *</Label>
          <Input
            id="backoffice-unidade-nome"
            value={form.nome}
            onChange={(event) => setForm((current) => ({ ...current, nome: event.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Academia *</Label>
          <Select
            value={form.academiaId}
            onValueChange={handleSelectAcademia}
          >
            <SelectTrigger aria-label="Academia da unidade" className="w-full">
              <SelectValue placeholder="Selecione a academia" />
            </SelectTrigger>
            <SelectContent>
              {academiasOrdenadas.map((academia) => (
                <SelectItem key={academia.id} value={academia.id}>
                  {academia.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="backoffice-unidade-razao">Razão social</Label>
          <Input
            id="backoffice-unidade-razao"
            value={form.razaoSocial}
            onChange={(event) => setForm((current) => ({ ...current, razaoSocial: event.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="backoffice-unidade-documento">Documento *</Label>
          <Input
            id="backoffice-unidade-documento"
            value={form.documento}
            onChange={(event) => setForm((current) => ({ ...current, documento: event.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="backoffice-unidade-group">Grupo da academia</Label>
          <Input
            id="backoffice-unidade-group"
            value={form.groupId}
            readOnly
            disabled
          />
          <p className="text-xs text-muted-foreground">Derivado automaticamente da academia selecionada.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="backoffice-unidade-subdomain">Subdomínio</Label>
          <Input
            id="backoffice-unidade-subdomain"
            value={form.subdomain}
            onChange={(event) => setForm((current) => ({ ...current, subdomain: event.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="backoffice-unidade-email">E-mail *</Label>
          <Input
            id="backoffice-unidade-email"
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="backoffice-unidade-telefone">Telefone</Label>
          <Input
            id="backoffice-unidade-telefone"
            value={form.telefone}
            onChange={(event) => setForm((current) => ({ ...current, telefone: event.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label>Modo do cupom</Label>
          <Select
            value={form.cupomPrintMode}
            onValueChange={(value) =>
              setForm((current) => ({ ...current, cupomPrintMode: value as UnitForm["cupomPrintMode"] }))
            }
          >
            <SelectTrigger aria-label="Modo do cupom" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="80MM">80mm</SelectItem>
              <SelectItem value="58MM">58mm</SelectItem>
              <SelectItem value="CUSTOM">Customizado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="backoffice-unidade-cupom-width">Largura custom (mm)</Label>
          <Input
            id="backoffice-unidade-cupom-width"
            type="number"
            min={40}
            max={120}
            value={form.cupomCustomWidthMm}
            onChange={(event) => setForm((current) => ({ ...current, cupomCustomWidthMm: event.target.value }))}
            disabled={form.cupomPrintMode !== "CUSTOM"}
          />
        </div>

        <div className="space-y-2">
          <Label>Estratégia inicial *</Label>
          <Select
            value={form.onboardingStrategy}
            onValueChange={(value) =>
              setForm((current) => ({ ...current, onboardingStrategy: value as UnidadeOnboardingStrategy }))
            }
          >
            <SelectTrigger aria-label="Estratégia inicial da unidade" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CARGA_INICIAL">Carregar dados iniciais</SelectItem>
              <SelectItem value="IMPORTAR_DEPOIS">Importar depois</SelectItem>
              <SelectItem value="PREPARAR_ETL">Preparar ETL agora</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="backoffice-unidade-evo-filial">ID Filial EVO</Label>
          <Input
            id="backoffice-unidade-evo-filial"
            inputMode="numeric"
            placeholder="123"
            value={form.evoFilialId}
            onChange={(event) => setForm((current) => ({ ...current, evoFilialId: event.target.value }))}
          />
          <p className="text-xs text-muted-foreground">
            Estratégia atual: {getUnidadeOnboardingStrategyLabel(form.onboardingStrategy)}.
          </p>
        </div>

        <div className="md:col-span-2 flex flex-wrap justify-end gap-2">
          {editing ? (
            <Button variant="outline" className="border-border" onClick={() => resetForm(selectedAcademiaId)} disabled={saving}>
              Cancelar edição
            </Button>
          ) : null}
          <Button onClick={handleSubmit} disabled={saving || !form.academiaId}>
            {saving ? "Salvando..." : editing ? "Salvar unidade" : "Criar unidade"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
