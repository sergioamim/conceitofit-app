"use client";

import { UploadCloud } from "lucide-react";
import { MapeamentoAcademiaUnidadeSelector } from "@/backoffice/components/admin/importacao-academia-unidade-selector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { EvoImportPageState } from "../hooks/useEvoImportPage";

export function EvoUploadTab({ state }: { state: EvoImportPageState }) {
  const {
    dryRun, setDryRun, maxRejeicoes, setMaxRejeicoes,
    csvJobAlias, setCsvJobAlias, aliasSugestaoCsv,
    mapeamentos, setMapeamentos,
    academiaOptions, getUnidadesOptions, loadingMapeamento,
    handleAcademiaNomeChange, handleUnidadeNomeChange,
    handleSelecionarAcademia, handleSelecionarUnidade,
    files, setFile, csvUploadGroups,
    submitting, handleSubmit,
  } = state;

  return (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configuração do Lote</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap gap-4">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={dryRun}
                    onChange={(e) => setDryRun(e.target.checked)}
                    className="accent-gym-accent"
                  />
                  Modo de simulação (Apenas validar, não salvar)
                </Label>
                <div className="w-48 space-y-2">
                  <Label htmlFor="maxRejeicoes">Limite de Rejeições (Abortar)</Label>
                  <Input
                    id="maxRejeicoes"
                    type="number"
                    min={0}
                    max={10000}
                    value={maxRejeicoes}
                    onChange={(e) => setMaxRejeicoes(Number(e.target.value))}
                  />
                </div>
                <div className="min-w-72 flex-1 space-y-2">
                  <Label htmlFor="csvJobAlias">Nome de identificação deste lote</Label>
                  <Input
                    id="csvJobAlias"
                    value={csvJobAlias}
                    onChange={(e) => setCsvJobAlias(e.target.value)}
                    placeholder={aliasSugestaoCsv}
                  />
                  <p className="text-xs text-muted-foreground">
                    Nome livre para facilitar a busca deste lote no histórico.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold">Mapeamento de filiais (EVO → unidade)</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setMapeamentos((prev) => [
                        ...prev,
                        { idFilialEvo: "", tenantId: "", academiaId: "", academiaNome: "", unidadeNome: "" },
                      ])
                    }
                  >
                    Adicionar
                  </Button>
                </div>
                <div className="space-y-3">
                  {mapeamentos.map((m, idx) => (
                    <MapeamentoAcademiaUnidadeSelector
                      key={idx}
                      showIdFilial
                      idFilialLabel="ID Filial EVO"
                      idFilialValue={m.idFilialEvo}
                      onIdFilialChange={(value) =>
                        setMapeamentos((prev) => prev.map((row, i) => (i === idx ? { ...row, idFilialEvo: value } : row)))
                      }
                      academiaNome={m.academiaNome}
                      unidadeNome={m.unidadeNome}
                      academiaId={m.academiaId}
                      academiaOptions={academiaOptions}
                      unidadesOptions={getUnidadesOptions(m.academiaId)}
                      loadingAcademias={loadingMapeamento}
                      onAcademiaNomeChange={(value) => handleAcademiaNomeChange(idx, value)}
                      onUnidadeNomeChange={(value) => handleUnidadeNomeChange(idx, value)}
                      onAcademiaSelect={(option) => handleSelecionarAcademia(idx, option)}
                      onUnidadeSelect={(option) => handleSelecionarUnidade(idx, option)}
                    />
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <p className="text-sm font-semibold">Uploads (CSV)</p>
                <div className="space-y-4">
                  {csvUploadGroups.map((group) => (
                    <div key={group.key} className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold">{group.label}</p>
                        <p className="text-xs text-muted-foreground">{group.description}</p>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        {group.files.map(({ key, label, field }) => (
                          <label
                            key={field}
                            className={cn(
                              "flex cursor-pointer items-center justify-between rounded-md border border-dashed px-3 py-2 text-sm hover:border-gym-accent",
                              files[key] ? "border-gym-accent/80 bg-gym-accent/5" : "border-border"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <UploadCloud className="size-4 text-muted-foreground" />
                              <div className="flex flex-col">
                                <span className="font-medium">{label}</span>
                                <span className="text-xs text-muted-foreground">
                                  {files[key]?.name ?? "Selecione um arquivo CSV"}
                                </span>
                              </div>
                            </div>
                            <Input
                              type="file"
                              accept=".csv,text/csv"
                              className="hidden"
                              onChange={(e) => setFile(key, e.target.files?.[0] ?? null)}
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting ? "Enviando..." : "Iniciar importação"}
                </Button>
              </div>
            </CardContent>
          </Card>
  );
}
