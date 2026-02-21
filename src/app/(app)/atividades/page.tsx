"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Power } from "lucide-react";
import {
  listAtividades,
  createAtividade,
  updateAtividade,
  toggleAtividade,
  deleteAtividade,
} from "@/lib/mock/services";
import type { Atividade, CategoriaAtividade } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { AtividadeModal, type AtividadeForm } from "@/components/shared/atividade-modal";

const CATEGORIA_LABEL: Record<CategoriaAtividade, string> = {
  MUSCULACAO: "Musculação",
  CARDIO: "Cardio",
  COLETIVA: "Coletiva",
  LUTA: "Luta",
  AQUATICA: "Aquática",
  OUTRA: "Outra",
};

const CATEGORIA_OPTIONS: { value: CategoriaAtividade | "TODAS"; label: string }[] =
  [
    { value: "TODAS", label: "Todas" },
    { value: "MUSCULACAO", label: "Musculação" },
    { value: "CARDIO", label: "Cardio" },
    { value: "COLETIVA", label: "Coletiva" },
    { value: "LUTA", label: "Luta" },
    { value: "AQUATICA", label: "Aquática" },
    { value: "OUTRA", label: "Outra" },
  ];

export default function AtividadesPage() {
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [categoria, setCategoria] =
    useState<CategoriaAtividade | "TODAS">("TODAS");
  const [apenasAtivas, setApenasAtivas] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Atividade | undefined>(undefined);

  async function load() {
    const data = await listAtividades();
    setAtividades(data);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  const filtered = atividades.filter((a) => {
    const matchCategoria = categoria === "TODAS" || a.categoria === categoria;
    const matchAtivas = !apenasAtivas || a.ativo;
    return matchCategoria && matchAtivas;
  });

  async function handleSave(data: AtividadeForm, id?: string) {
    if (id) {
      await updateAtividade(id, data);
    } else {
      await createAtividade(data);
    }
    setModalOpen(false);
    setEditing(undefined);
    load();
  }

  async function handleToggle(id: string) {
    await toggleAtividade(id);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover esta atividade?")) return;
    await deleteAtividade(id);
    load();
  }

  return (
    <div className="space-y-6">
      <AtividadeModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(undefined);
        }}
        onSave={handleSave}
        initial={editing}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Atividades
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Modalidades disponíveis na academia
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="size-4" />
          Nova Atividade
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex gap-1.5">
          <button
            onClick={() => setApenasAtivas(false)}
            className={cn(
              "rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors",
              !apenasAtivas
                ? "border-gym-accent bg-gym-accent/10 text-gym-accent"
                : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
            )}
          >
            Todas
          </button>
          <button
            onClick={() => setApenasAtivas(true)}
            className={cn(
              "rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors",
              apenasAtivas
                ? "border-gym-accent bg-gym-accent/10 text-gym-accent"
                : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
            )}
          >
            Apenas ativas
          </button>
        </div>
        <div className="ml-auto w-48">
          <Select
            value={categoria}
            onValueChange={(v) => setCategoria(v as CategoriaAtividade | "TODAS")}
          >
            <SelectTrigger className="w-full bg-secondary border-border text-sm">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {CATEGORIA_OPTIONS.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {filtered.length === 0 && (
          <div className="col-span-3 rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            Nenhuma atividade encontrada
          </div>
        )}
        {filtered.map((a) => (
          <div
            key={a.id}
            className={cn(
              "group relative overflow-hidden rounded-xl border bg-card p-4 transition-all",
              a.ativo ? "border-border" : "border-border/60 opacity-70"
            )}
          >
            <div className="absolute right-3 top-3 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={() => {
                  setEditing(a);
                  setModalOpen(true);
                }}
                className="rounded-md border border-border bg-secondary px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <Pencil className="size-3" />
              </button>
              <button
                onClick={() => handleToggle(a.id)}
                className="rounded-md border border-border bg-secondary px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <Power className="size-3" />
              </button>
              <button
                onClick={() => handleDelete(a.id)}
                className="rounded-md border border-gym-danger/40 bg-gym-danger/10 px-2 py-1 text-xs text-gym-danger hover:border-gym-danger/70"
              >
                <Trash2 className="size-3" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="flex size-11 items-center justify-center rounded-lg text-xl"
                style={{ backgroundColor: (a.cor ?? "#3de8a0") + "22" }}
              >
                <span>{a.icone ?? "🏋️"}</span>
              </div>
              <div>
                <p className="text-sm font-semibold">{a.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {CATEGORIA_LABEL[a.categoria]}
                </p>
              </div>
            </div>
            {a.descricao && (
              <p className="mt-3 text-xs text-muted-foreground">
                {a.descricao}
              </p>
            )}
            <div className="mt-4 flex items-center justify-between text-xs">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 font-semibold",
                  a.ativo
                    ? "bg-gym-teal/15 text-gym-teal"
                    : "bg-secondary text-muted-foreground"
                )}
              >
                {a.ativo ? "Ativa" : "Inativa"}
              </span>
              <span className="text-muted-foreground">
                Cor {a.cor ?? "#3de8a0"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
