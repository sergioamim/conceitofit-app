"use client";

import { type FormEvent, useState } from "react";
import type { Atividade, TipoPlano } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichTextEditor } from "@/components/shared/rich-text-editor";
import { cn } from "@/lib/utils";
import {
  type PlanoFormValues,
  TIPO_PLANO_LABEL,
  filterAtividadesSelecionadas,
  getDefaultPlanoFormValues,
  isPlanoFormValid,
} from "@/lib/planos/form";

export function PlanoForm({
  initial,
  atividades,
  onSubmit,
  onCancel,
  submitLabel,
  submitting = false,
}: {
  initial?: PlanoFormValues;
  atividades: Atividade[];
  onSubmit: (values: PlanoFormValues) => Promise<void> | void;
  onCancel: () => void;
  submitLabel: string;
  submitting?: boolean;
}) {
  const [form, setForm] = useState<PlanoFormValues>(initial ?? getDefaultPlanoFormValues());
  const [beneficioInput, setBeneficioInput] = useState("");
  const [activeTab, setActiveTab] = useState<"CONFIG" | "CONTRATO" | "BENEFICIOS">("CONFIG");
  const [contratoEditorMode, setContratoEditorMode] = useState<"VISUAL" | "HTML">("VISUAL");

  function set<K extends keyof PlanoFormValues>(key: K, value: PlanoFormValues[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleAtividade(id: string) {
    setForm((current) => ({
      ...current,
      atividades: current.atividades.includes(id)
        ? current.atividades.filter((atividadeId) => atividadeId !== id)
        : [...current.atividades, id],
    }));
  }

  function addBeneficio() {
    if (!beneficioInput.trim()) return;
    setForm((current) => ({
      ...current,
      beneficios: [...current.beneficios, beneficioInput.trim()],
    }));
    setBeneficioInput("");
  }

  function removeBeneficio(index: number) {
    setForm((current) => ({
      ...current,
      beneficios: current.beneficios.filter((_, i) => i !== index),
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isPlanoFormValid(form) || submitting) return;

    await onSubmit({
      ...form,
      atividades: filterAtividadesSelecionadas(atividades, form.atividades),
    });
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-2">
        <button
          type="button"
          onClick={() => setActiveTab("CONFIG")}
          className={cn(
            "cursor-pointer rounded-md px-3 py-2 text-sm font-medium transition-colors",
            activeTab === "CONFIG"
              ? "bg-gym-accent/15 text-gym-accent"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Configurações
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("CONTRATO")}
          className={cn(
            "cursor-pointer rounded-md px-3 py-2 text-sm font-medium transition-colors",
            activeTab === "CONTRATO"
              ? "bg-gym-accent/15 text-gym-accent"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Contrato
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("BENEFICIOS")}
          className={cn(
            "cursor-pointer rounded-md px-3 py-2 text-sm font-medium transition-colors",
            activeTab === "BENEFICIOS"
              ? "bg-gym-accent/15 text-gym-accent"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Atividades e benefícios
        </button>
      </div>

      {activeTab === "CONFIG" && (
        <>
          <div className="rounded-xl border border-border bg-card p-4 md:p-5">
            <h2 className="font-display text-base font-semibold text-foreground">Dados do plano</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nome *</label>
                <Input
                  value={form.nome}
                  onChange={(e) => set("nome", e.target.value)}
                  placeholder="Ex: Mensal Completo"
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Descrição</label>
                <Input
                  value={form.descricao}
                  onChange={(e) => set("descricao", e.target.value)}
                  placeholder="Descrição do plano"
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Tipo *</label>
                <Select
                  value={form.tipo}
                  onValueChange={(value) => {
                    const tipo = value as TipoPlano;
                    if (tipo === "AVULSO") {
                      setForm((current) => ({
                        ...current,
                        tipo,
                        permiteRenovacaoAutomatica: false,
                        permiteCobrancaRecorrente: false,
                        diaCobrancaPadrao: "",
                      }));
                      return;
                    }
                    set("tipo", tipo);
                  }}
                >
                  <SelectTrigger className="w-full bg-secondary border-border">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {Object.entries(TIPO_PLANO_LABEL).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Duração (dias) *</label>
                <Input
                  type="number"
                  min={1}
                  value={form.duracaoDias}
                  onChange={(e) => set("duracaoDias", e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Valor (R$) *</label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.valor}
                  onChange={(e) => set("valor", e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Matrícula (R$)</label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.valorMatricula}
                  onChange={(e) => set("valorMatricula", e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 md:p-5">
            <h2 className="font-display text-base font-semibold text-foreground">Regras financeiras</h2>
            <div className="mt-4 space-y-4">
              <div className="space-y-3 rounded-md border border-border bg-secondary/40 p-3">
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={form.cobraAnuidade}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        cobraAnuidade: e.target.checked,
                        valorAnuidade: e.target.checked ? current.valorAnuidade : "0",
                        parcelasMaxAnuidade: e.target.checked ? current.parcelasMaxAnuidade : "1",
                      }))
                    }
                  />
                  Cobrar anuidade (a cada 12 meses)
                </label>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Valor anuidade (R$)</label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={form.valorAnuidade}
                      disabled={!form.cobraAnuidade}
                      onChange={(e) => set("valorAnuidade", e.target.value)}
                      className="bg-secondary border-border"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Máx. parcelas anuidade</label>
                    <Input
                      type="number"
                      min={1}
                      max={24}
                      value={form.parcelasMaxAnuidade}
                      disabled={!form.cobraAnuidade}
                      onChange={(e) => set("parcelasMaxAnuidade", e.target.value)}
                      className="bg-secondary border-border"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={form.permiteRenovacaoAutomatica}
                    disabled={form.tipo === "AVULSO"}
                    onChange={(e) => set("permiteRenovacaoAutomatica", e.target.checked)}
                  />
                  Permite renovação automática
                </label>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={form.permiteCobrancaRecorrente}
                    disabled={form.tipo === "AVULSO"}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setForm((current) => ({
                        ...current,
                        permiteCobrancaRecorrente: checked,
                        diaCobrancaPadrao: checked ? current.diaCobrancaPadrao : "",
                      }));
                    }}
                  />
                  Permite cobrança recorrente
                </label>
                <div className="space-y-1.5 md:max-w-60">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Dia padrão de cobrança</label>
                  <Input
                    type="number"
                    min={1}
                    max={28}
                    placeholder="1 a 28"
                    value={form.diaCobrancaPadrao}
                    disabled={!form.permiteCobrancaRecorrente || form.tipo === "AVULSO"}
                    onChange={(e) => set("diaCobrancaPadrao", e.target.value)}
                    className="bg-secondary border-border"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input type="checkbox" checked={form.destaque} onChange={(e) => set("destaque", e.target.checked)} />
                  Exibir plano como destaque
                </label>
                <div className="space-y-1.5 md:max-w-60">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Ordem</label>
                  <Input
                    type="number"
                    value={form.ordem}
                    onChange={(e) => set("ordem", e.target.value)}
                    className="bg-secondary border-border"
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === "CONTRATO" && (
        <div className="rounded-xl border border-border bg-card p-4 md:p-5">
          <h2 className="font-display text-base font-semibold text-foreground">Contrato do plano</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Assinatura</label>
              <Select
                value={form.contratoAssinatura}
                onValueChange={(value) => set("contratoAssinatura", value as PlanoFormValues["contratoAssinatura"])}
              >
                <SelectTrigger className="w-full bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="DIGITAL">Digital</SelectItem>
                  <SelectItem value="PRESENCIAL">Presencial</SelectItem>
                  <SelectItem value="AMBAS">Digital ou presencial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <label className="mt-6 flex items-center gap-2 text-sm text-muted-foreground md:mt-0 md:self-end">
              <input
                type="checkbox"
                checked={form.contratoEnviarAutomaticoEmail}
                onChange={(e) => set("contratoEnviarAutomaticoEmail", e.target.checked)}
              />
              Enviar contrato automaticamente por e-mail após a venda
            </label>
          </div>
          <div className="mt-4 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Template do contrato</label>
              <div className="flex items-center gap-1 rounded-md border border-border bg-secondary/40 p-1">
                <button
                  type="button"
                  onClick={() => setContratoEditorMode("VISUAL")}
                  className={cn(
                    "cursor-pointer rounded px-2 py-1 text-xs font-medium transition-colors",
                    contratoEditorMode === "VISUAL"
                      ? "bg-gym-accent/15 text-gym-accent"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Visual
                </button>
                <button
                  type="button"
                  onClick={() => setContratoEditorMode("HTML")}
                  className={cn(
                    "cursor-pointer rounded px-2 py-1 text-xs font-medium transition-colors",
                    contratoEditorMode === "HTML"
                      ? "bg-gym-accent/15 text-gym-accent"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  HTML
                </button>
              </div>
            </div>
            {contratoEditorMode === "VISUAL" ? (
              <RichTextEditor
                value={form.contratoTemplateHtml}
                onChange={(html) => set("contratoTemplateHtml", html)}
                placeholder="Digite o contrato do plano. Exemplo: Cliente {{NOME_CLIENTE}}..."
              />
            ) : (
              <textarea
                value={form.contratoTemplateHtml}
                onChange={(e) => set("contratoTemplateHtml", e.target.value)}
                placeholder="<h1>Contrato</h1><p>Cliente: {{NOME_CLIENTE}}</p>"
                className="h-56 w-full resize-y rounded-md border border-border bg-secondary p-3 text-sm font-mono outline-none"
              />
            )}
          </div>
          <div className="mt-4 rounded-md border border-border bg-secondary/30 p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Legenda de marcadores do contrato</p>
            <div className="mt-2 grid grid-cols-1 gap-2 text-xs md:grid-cols-2">
              <p><span className="font-mono text-foreground">{`{{NOME_CLIENTE}}`}</span> Nome completo do cliente</p>
              <p><span className="font-mono text-foreground">{`{{CPF_CLIENTE}}`}</span> CPF do cliente</p>
              <p><span className="font-mono text-foreground">{`{{NOME_PLANO}}`}</span> Nome do plano contratado</p>
              <p><span className="font-mono text-foreground">{`{{VALOR_PLANO}}`}</span> Valor do plano</p>
              <p><span className="font-mono text-foreground">{`{{NOME_UNIDADE}}`}</span> Nome da unidade atual</p>
              <p><span className="font-mono text-foreground">{`{{RAZAO_SOCIAL_UNIDADE}}`}</span> Razão social da unidade</p>
              <p><span className="font-mono text-foreground">{`{{CNPJ_UNIDADE}}`}</span> CNPJ da unidade</p>
              <p><span className="font-mono text-foreground">{`{{DATA_ASSINATURA}}`}</span> Data da assinatura</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "BENEFICIOS" && (
        <div className="rounded-xl border border-border bg-card p-4 md:p-5">
          <h2 className="font-display text-base font-semibold text-foreground">Atividades e benefícios</h2>
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Atividades incluídas</p>
              <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-3">
                {atividades.map((atividade) => (
                  <button
                    type="button"
                    key={atividade.id}
                    onClick={() => toggleAtividade(atividade.id)}
                    className={cn(
                      "cursor-pointer rounded-md border px-2.5 py-2 text-left text-xs transition-colors",
                      form.atividades.includes(atividade.id)
                        ? "border-gym-accent bg-gym-accent/10 text-gym-accent"
                        : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                    )}
                  >
                    {atividade.nome}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Benefícios</label>
              <div className="mt-2 flex gap-2">
                <Input
                  value={beneficioInput}
                  onChange={(e) => setBeneficioInput(e.target.value)}
                  placeholder="Adicionar benefício"
                  className="bg-secondary border-border"
                />
                <Button type="button" onClick={addBeneficio}>
                  Adicionar
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {form.beneficios.map((beneficio, index) => (
                  <span
                    key={`${beneficio}-${index}`}
                    className="inline-flex items-center gap-2 rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground"
                  >
                    {beneficio}
                    <button type="button" onClick={() => removeBeneficio(index)} className="cursor-pointer text-muted-foreground/60 hover:text-foreground">
                      x
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="outline" className="border-border" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={!isPlanoFormValid(form) || submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
