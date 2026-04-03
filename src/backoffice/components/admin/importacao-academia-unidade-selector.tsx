"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SuggestionInput, type SuggestionOption } from "@/components/shared/suggestion-input";

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
    <div className={className}>
      <div className={showIdFilial ? "grid grid-cols-1 gap-3 md:grid-cols-4" : "grid grid-cols-1 gap-3 md:grid-cols-3"}>
        {showIdFilial && onIdFilialChange ? (
          <div className="space-y-2">
            <Label>{idFilialLabel}</Label>
            <Input
              type="number"
              placeholder="123"
              value={idFilialValue}
              onChange={(e) => onIdFilialChange(e.target.value)}
            />
          </div>
        ) : null}
        <div className="space-y-2">
          <Label>Nome da Academia</Label>
          <SuggestionInput
            value={academiaNome}
            onValueChange={onAcademiaNomeChange}
            onSelect={onAcademiaSelect}
            options={academiaOptions}
            minCharsToSearch={0}
            placeholder="Pesquise por nome da academia"
            emptyText={loadingAcademias ? "Carregando academias..." : "Nenhuma academia encontrada"}
          />
        </div>
        <div className="space-y-2">
          <Label>Unidade</Label>
          <SuggestionInput
            value={unidadeNome}
            onValueChange={onUnidadeNomeChange}
            onSelect={onUnidadeSelect}
            options={unidadesOptions}
            minCharsToSearch={0}
            placeholder={academiaId ? "Pesquise a unidade" : "Selecione uma academia"}
            emptyText={
              academiaId
                ? "Nenhuma unidade encontrada para esta academia"
                : "Selecione uma academia para listar unidades"
            }
          />
        </div>
      </div>
    </div>
  );
}
