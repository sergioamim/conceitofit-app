"use client";

import { useEffect, useState } from "react";
import { Check, Plus, Pencil, Power, Star, Trash2 } from "lucide-react";
import {
  listPlanos,
  listAtividades,
  createPlano,
  updatePlano,
  togglePlanoAtivo,
  togglePlanoDestaque,
  deletePlano,
} from "@/lib/mock/services";
import type { Plano, Atividade, TipoPlano } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const TIPO_LABEL: Record<TipoPlano, string> = {
  MENSAL: "Mensal",
  TRIMESTRAL: "Trimestral",
  SEMESTRAL: "Semestral",
  ANUAL: "Anual",
  AVULSO: "Avulso",
};

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

interface PlanoForm {
  nome: string;
  descricao: string;
  tipo: TipoPlano;
  duracaoDias: string;
  valor: string;
  valorMatricula: string;
  atividades: string[];
  beneficios: string[];
  destaque: boolean;
  ordem: string;
}

function PlanoModal({
  open,
  onClose,
  onSave,
  atividades,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: PlanoForm, id?: string) => void;
  atividades: Atividade[];
  initial?: Plano;
}) {
  const [form, setForm] = useState<PlanoForm>({
    nome: "",
    descricao: "",
    tipo: "MENSAL",
    duracaoDias: "30",
    valor: "",
    valorMatricula: "0",
    atividades: [],
    beneficios: [],
    destaque: false,
    ordem: "",
  });
  const [beneficioInput, setBeneficioInput] = useState("");

  useEffect(() => {
    if (initial) {
      setForm({
        nome: initial.nome,
        descricao: initial.descricao ?? "",
        tipo: initial.tipo,
        duracaoDias: String(initial.duracaoDias),
        valor: String(initial.valor),
        valorMatricula: String(initial.valorMatricula ?? 0),
        atividades: initial.atividades ?? [],
        beneficios: initial.beneficios ?? [],
        destaque: initial.destaque,
        ordem: initial.ordem ? String(initial.ordem) : "",
      });
    } else {
      setForm({
        nome: "",
        descricao: "",
        tipo: "MENSAL",
        duracaoDias: "30",
        valor: "",
        valorMatricula: "0",
        atividades: [],
        beneficios: [],
        destaque: false,
        ordem: "",
      });
    }
    setBeneficioInput("");
  }, [initial, open]);

  function set<K extends keyof PlanoForm>(key: K, value: PlanoForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleAtividade(id: string) {
    setForm((f) => ({
      ...f,
      atividades: f.atividades.includes(id)
        ? f.atividades.filter((a) => a !== id)
        : [...f.atividades, id],
    }));
  }

  function addBeneficio() {
    if (!beneficioInput.trim()) return;
    setForm((f) => ({
      ...f,
      beneficios: [...f.beneficios, beneficioInput.trim()],
    }));
    setBeneficioInput("");
  }

  function removeBeneficio(idx: number) {
    setForm((f) => ({
      ...f,
      beneficios: f.beneficios.filter((_, i) => i !== idx),
    }));
  }

  function handleSave() {
    if (!form.nome || !form.valor || !form.duracaoDias) return;
    onSave(form, initial?.id);
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">
            {initial ? "Editar Plano" : "Novo Plano"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-5 py-2">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Nome *
              </label>
              <Input
                placeholder="Ex: Mensal Completo"
                value={form.nome}
                onChange={(e) => set("nome", e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Descrição
              </label>
              <Input
                placeholder="Descrição do plano"
                value={form.descricao}
                onChange={(e) => set("descricao", e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Tipo *
                </label>
                <Select
                  value={form.tipo}
                  onValueChange={(v) => set("tipo", v as TipoPlano)}
                >
                  <SelectTrigger className="w-full bg-secondary border-border">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {Object.entries(TIPO_LABEL).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Duração (dias) *
                </label>
                <Input
                  type="number"
                  min={1}
                  value={form.duracaoDias}
                  onChange={(e) => set("duracaoDias", e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Valor (R$) *
                </label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0,00"
                  value={form.valor}
                  onChange={(e) => set("valor", e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Matrícula (R$)
                </label>
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
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Ordem de exibição
              </label>
              <Input
                type="number"
                min={0}
                value={form.ordem}
                onChange={(e) => set("ordem", e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Destaque
              </label>
              <div className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.destaque}
                  onChange={(e) => set("destaque", e.target.checked)}
                />
                <span className="text-muted-foreground">
                  Marcar como recomendado
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-muted-foreground">
                Atividades incluídas
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {atividades.map((a) => {
                  const active = form.atividades.includes(a.id);
                  return (
                    <button
                      key={a.id}
                      onClick={() => toggleAtividade(a.id)}
                      className={cn(
                        "rounded-md border px-2.5 py-2 text-left text-xs transition-colors",
                        active
                          ? "border-gym-accent bg-gym-accent/10 text-gym-accent"
                          : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                      )}
                    >
                      <span className="mr-1">{a.icone ?? "🏋️"}</span>
                      {a.nome}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-muted-foreground">
                Benefícios
              </p>
              <div className="mt-2 flex gap-2">
                <Input
                  placeholder="Adicionar benefício"
                  value={beneficioInput}
                  onChange={(e) => setBeneficioInput(e.target.value)}
                  className="bg-secondary border-border"
                />
                <Button variant="outline" onClick={addBeneficio} className="border-border">
                  Adicionar
                </Button>
              </div>
              <div className="mt-2 space-y-2">
                {form.beneficios.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Nenhum benefício cadastrado
                  </p>
                )}
                {form.beneficios.map((b, i) => (
                  <div
                    key={`${b}-${i}`}
                    className="flex items-center justify-between rounded-md border border-border bg-secondary px-3 py-2 text-xs"
                  >
                    <span>{b}</span>
                    <button
                      onClick={() => removeBeneficio(i)}
                      className="text-gym-danger/80 hover:text-gym-danger"
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-secondary/40 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Preview
              </p>
              <div className="mt-2">
                <p className="font-display text-lg font-bold">
                  {form.nome || "Novo Plano"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {TIPO_LABEL[form.tipo]} · {form.duracaoDias || "0"} dias
                </p>
                <p className="mt-2 font-display text-2xl font-extrabold text-gym-accent">
                  {form.valor ? formatBRL(parseFloat(form.valor)) : "R$ 0,00"}
                </p>
                {form.valorMatricula && parseFloat(form.valorMatricula) > 0 && (
                  <p className="text-xs text-muted-foreground">
                    + {formatBRL(parseFloat(form.valorMatricula))} matrícula
                  </p>
                )}
                {form.beneficios.slice(0, 3).map((b) => (
                  <div
                    key={b}
                    className="mt-1 flex items-center gap-2 text-xs text-muted-foreground"
                  >
                    <Check className="size-3 text-gym-teal" /> {b}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-border">
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!form.nome || !form.valor || !form.duracaoDias}>
            {initial ? "Salvar" : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function PlanosPage() {
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Plano | undefined>(undefined);

  useEffect(() => {
    Promise.all([listPlanos(), listAtividades()]).then(([pls, atv]) => {
      setPlanos(pls);
      setAtividades(atv);
    });
  }, []);

  async function reload() {
    const [pls, atv] = await Promise.all([listPlanos(), listAtividades()]);
    setPlanos(pls);
    setAtividades(atv);
  }

  async function handleSave(data: PlanoForm, id?: string) {
    const payload = {
      nome: data.nome,
      descricao: data.descricao || undefined,
      tipo: data.tipo,
      duracaoDias: parseInt(data.duracaoDias, 10) || 0,
      valor: parseFloat(data.valor) || 0,
      valorMatricula: parseFloat(data.valorMatricula) || 0,
      atividades: data.atividades,
      beneficios: data.beneficios,
      destaque: data.destaque,
      ordem: data.ordem ? parseInt(data.ordem, 10) : undefined,
    };
    if (id) {
      await updatePlano(id, payload);
    } else {
      await createPlano(payload);
    }
    setModalOpen(false);
    setEditing(undefined);
    reload();
  }

  async function handleToggleAtivo(id: string) {
    await togglePlanoAtivo(id);
    reload();
  }

  async function handleToggleDestaque(id: string) {
    await togglePlanoDestaque(id);
    reload();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este plano?")) return;
    await deletePlano(id);
    reload();
  }

  return (
    <div className="space-y-6">
      <PlanoModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(undefined);
        }}
        onSave={handleSave}
        atividades={atividades}
        initial={editing}
      />

      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Planos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Planos disponíveis para matrícula
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {planos.length} planos cadastrados
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="size-4" />
          Novo Plano
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {planos.map((p) => (
          <div
            key={p.id}
            className={cn(
              "relative rounded-xl border p-5 transition-all",
              p.destaque
                ? "border-gym-accent bg-gym-accent/5"
                : "border-border bg-card",
              !p.ativo && "opacity-60"
            )}
          >
            {p.destaque && (
              <span className="absolute -top-2.5 left-4 rounded-full bg-gym-accent px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-background">
                Popular
              </span>
            )}

            <div className="absolute right-3 top-3 flex gap-1.5">
              <button
                onClick={() => {
                  setEditing(p);
                  setModalOpen(true);
                }}
                className="rounded-md border border-border bg-secondary px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <Pencil className="size-3" />
              </button>
              <button
                onClick={() => handleToggleDestaque(p.id)}
                className="rounded-md border border-border bg-secondary px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <Star className="size-3" />
              </button>
              <button
                onClick={() => handleToggleAtivo(p.id)}
                className="rounded-md border border-border bg-secondary px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <Power className="size-3" />
              </button>
            </div>

            <div className="font-display text-lg font-bold">{p.nome}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {TIPO_LABEL[p.tipo]} · {p.duracaoDias} dias
            </div>

            <div className="mt-4">
              <span
                className={cn(
                  "font-display text-3xl font-extrabold",
                  p.destaque ? "text-gym-accent" : "text-foreground"
                )}
              >
                {formatBRL(p.valor)}
              </span>
              <span className="text-xs text-muted-foreground"> / plano</span>
            </div>

            {p.valorMatricula > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                + {formatBRL(p.valorMatricula)} de matrícula
              </p>
            )}

            {p.beneficios && p.beneficios.length > 0 && (
              <ul className="mt-4 space-y-2">
                {p.beneficios.map((b) => (
                  <li
                    key={b}
                    className="flex items-start gap-2 text-xs text-muted-foreground"
                  >
                    <Check className="mt-0.5 size-3 shrink-0 text-gym-teal" />
                    {b}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <span>{p.ativo ? "Ativo" : "Inativo"}</span>
              <button
                onClick={() => handleDelete(p.id)}
                className="text-gym-danger/80 hover:text-gym-danger"
              >
                <Trash2 className="size-3" /> Remover
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary">
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Plano
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Tipo
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Duração
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Valor
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Matrícula
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Destaque
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {planos.map((p) => (
              <tr key={p.id} className="transition-colors hover:bg-secondary/40">
                <td className="px-4 py-3 font-medium text-sm">{p.nome}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {TIPO_LABEL[p.tipo]}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {p.duracaoDias} dias
                </td>
                <td className="px-4 py-3 font-display font-bold text-gym-accent">
                  {formatBRL(p.valor)}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {p.valorMatricula > 0 ? formatBRL(p.valorMatricula) : "—"}
                </td>
                <td className="px-4 py-3">
                  {p.destaque ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gym-accent/15 px-2 py-0.5 text-[11px] font-semibold text-gym-accent">
                      <Check className="size-3" /> Popular
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
