"use client";

import { ArrowRight, Building2, MapPinned } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SuggestionInput, type SuggestionOption } from "@/components/shared/suggestion-input";
import { cn } from "@/lib/utils";

type CampoMapeamentoUnidadeProps = {
  idFilialLabel?: string;
  idFilialValue?: string;
  onIdFilialChange?: (value: string) => void;
  showIdFilial?: boolean;
  academiaNome: string;
  unidadeNome: string;
  academiaId: string;
  academiaOptions: SuggestionOption[];
  unidadesOptions: SuggestionOption[];
  loadingAcademias?: boolean;
  onAcademiaNomeChange: (value: string) => void;
  onUnidadeNomeChange: (value: string) => void;
  onAcademiaSelect: (option: SuggestionOption) => void;
  onUnidadeSelect: (option: SuggestionOption) => void;
  className?: string;
};

export function MapeamentoAcademiaUnidadeSelector({
  idFilialLabel = "ID Filial EVO",
  idFilialValue = "",
  onIdFilialChange,
  showIdFilial = false,
  academiaNome,
  unidadeNome,
  academiaId,
  academiaOptions,
  unidadesOptions,
  loadingAcademias = false,
  onAcademiaNomeChange,
  onUnidadeNomeChange,
  onAcademiaSelect,
  onUnidadeSelect,
  className,
}: CampoMapeamentoUnidadeProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        <span className="rounded-full border border-gym-accent/30 bg-gym-accent/10 px-2 py-1 text-[10px] text-gym-accent">
          Fluxo
        </span>
        <span>Academia</span>
        <ArrowRight className="size-3" />
        <span>Unidade</span>
      </div>

      <div
        className={cn(
          "grid grid-cols-1 gap-3",
          showIdFilial ? "xl:grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)_auto_minmax(0,1fr)]" : "xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]",
        )}
      >
        {showIdFilial && onIdFilialChange ? (
          <div className="space-y-2 rounded-xl border border-border bg-muted/10 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              <span className="rounded-full border border-border px-2 py-0.5 text-[10px]">0</span>
              <span>{idFilialLabel}</span>
            </div>
            <Label>{idFilialLabel}</Label>
            <Input
              type="number"
              placeholder="123"
              value={idFilialValue}
              onChange={(e) => onIdFilialChange(e.target.value)}
            />
          </div>
        ) : null}

        <div className="space-y-3 rounded-xl border border-border bg-muted/10 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <span className="rounded-full border border-gym-accent/30 bg-gym-accent/10 px-2 py-0.5 text-[10px] text-gym-accent">
              1
            </span>
            <Building2 className="size-3.5" />
            <span>Academia</span>
          </div>
          <div className="space-y-2">
            <Label>Nome da Academia</Label>
            <SuggestionInput
              value={academiaNome}
              onValueChange={onAcademiaNomeChange}
              onSelect={onAcademiaSelect}
              options={academiaOptions}
              minCharsToSearch={0}
              showAllOnFocus
              placeholder="Pesquise por nome da academia"
              emptyText={loadingAcademias ? "Carregando academias..." : "Nenhuma academia encontrada"}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Primeiro selecione a academia para carregar apenas as unidades vinculadas a ela.
          </p>
        </div>

        <div className="hidden items-center justify-center xl:flex">
          <div className="rounded-full border border-border bg-background p-2 text-muted-foreground">
            <ArrowRight className="size-4" />
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-border bg-muted/10 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <span className="rounded-full border border-gym-accent/30 bg-gym-accent/10 px-2 py-0.5 text-[10px] text-gym-accent">
              2
            </span>
            <MapPinned className="size-3.5" />
            <span>Unidade</span>
          </div>
          <div className="space-y-2">
            <Label>Unidade</Label>
            <SuggestionInput
              value={unidadeNome}
              onValueChange={onUnidadeNomeChange}
              onSelect={onUnidadeSelect}
              options={unidadesOptions}
              minCharsToSearch={0}
              showAllOnFocus
              placeholder={academiaId ? "Pesquise a unidade" : "Selecione uma academia"}
              emptyText={
                academiaId
                  ? "Nenhuma unidade encontrada para esta academia"
                  : "Selecione uma academia para listar unidades"
              }
            />
          </div>
          <p className="text-xs text-muted-foreground">
            A unidade escolhida passa a ser o destino único do pacote, da importação e das fotos.
          </p>
        </div>
      </div>
    </div>
  );
}
