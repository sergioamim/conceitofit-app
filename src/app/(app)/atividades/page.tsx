"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Power } from "lucide-react";
import {
  createAtividadeApi,
  deleteAtividadeApi,
  listAtividadesApi,
  toggleAtividadeApi,
  updateAtividadeApi,
} from "@/lib/api/administrativo";
import { getActiveTenantIdFromSession } from "@/lib/api/session";
import type { Atividade, CategoriaAtividade } from "@/lib/types";
import { useTenantContext } from "@/hooks/use-session-context";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { AtividadeModal, type AtividadeForm } from "@/components/shared/atividade-modal";
import { ActivityIconChip } from "@/components/shared/activity-icon-chip";

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
  const tenantContext = useTenantContext();
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [categoria, setCategoria] =
    useState<CategoriaAtividade | "TODAS">("TODAS");
  const [apenasAtivas, setApenasAtivas] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Atividade | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const tenantId = tenantContext.tenantId || getActiveTenantIdFromSession() || "";

  const load = useCallback(async () => {
    if (!tenantId) {
      setAtividades([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await listAtividadesApi({
        tenantId,
        apenasAtivas: apenasAtivas ? true : undefined,
        categoria: categoria === "TODAS" ? undefined : categoria,
      });
      setAtividades(
        Array.isArray(data)
          ? data.filter((item): item is Atividade => Boolean(item && item.id))
          : []
      );
    } catch (loadError) {
      setAtividades([]);
      setError(normalizeErrorMessage(loadError) || "Falha ao carregar atividades.");
    } finally {
      setLoading(false);
    }
  }, [apenasAtivas, categoria, tenantId]);

  useEffect(() => {
    setReady(true);
    void load();
  }, [load]);

  const filtered = atividades;

  async function handleSave(data: AtividadeForm, id?: string) {
    if (!tenantId) return;
    if (id) {
      await updateAtividadeApi({
        tenantId,
        id,
        data: {
          ...data,
          ativo: editing?.ativo ?? true,
        },
      });
    } else {
      await createAtividadeApi({
        tenantId,
        data,
      });
    }
    setModalOpen(false);
    setEditing(undefined);
    await load();
  }

  async function handleToggle(id: string) {
    if (!tenantId) return;
    await toggleAtividadeApi({
      tenantId,
      id,
    });
    await load();
  }

  async function handleDelete(id: string) {
    if (!tenantId) return;
    if (!confirm("Remover esta atividade?")) return;
    await deleteAtividadeApi({
      tenantId,
      id,
    });
    await load();
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
        <Button onClick={() => setModalOpen(true)} disabled={!ready}>
          <Plus className="size-4" />
          Nova Atividade
        </Button>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

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
        {loading ? (
          <div className="col-span-3 rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            Carregando atividades...
          </div>
        ) : null}
        {!loading && filtered.length === 0 && (
          <div className="col-span-3 rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            Nenhuma atividade encontrada
          </div>
        )}
        {!loading && filtered.map((a) => (
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
                aria-label={`Editar atividade ${a.nome || "sem nome"}`}
                title={`Editar atividade ${a.nome || "sem nome"}`}
                className="rounded-md border border-border bg-secondary px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <Pencil className="size-3" />
              </button>
              <button
                onClick={() => handleToggle(a.id)}
                aria-label={`${a.ativo ? "Desativar" : "Ativar"} atividade ${a.nome || "sem nome"}`}
                title={`${a.ativo ? "Desativar" : "Ativar"} atividade ${a.nome || "sem nome"}`}
                className="rounded-md border border-border bg-secondary px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <Power className="size-3" />
              </button>
              <button
                onClick={() => handleDelete(a.id)}
                aria-label={`Remover atividade ${a.nome || "sem nome"}`}
                title={`Remover atividade ${a.nome || "sem nome"}`}
                className="rounded-md border border-gym-danger/40 bg-gym-danger/10 px-2 py-1 text-xs text-gym-danger hover:border-gym-danger/70"
              >
                <Trash2 className="size-3" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <ActivityIconChip icone={a.icone} cor={a.cor} />
              <div>
                <p className="text-sm font-semibold">{a.nome || "Sem nome"}</p>
                <p className="text-xs text-muted-foreground">
                  {CATEGORIA_LABEL[a.categoria] ?? a.categoria}
                </p>
              </div>
            </div>
            {a.descricao && (
              <p className="mt-3 text-xs text-muted-foreground">
                {a.descricao}
              </p>
            )}
            <div className="mt-4 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
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
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 font-semibold",
                    a.permiteCheckin
                      ? "bg-gym-accent/15 text-gym-accent"
                      : "bg-secondary text-muted-foreground"
                  )}
                >
                  {a.permiteCheckin ? (a.checkinObrigatorio ? "Check-in obrigatório" : "Check-in permitido") : "Sem check-in"}
                </span>
              </div>
              <span className="text-muted-foreground">Cor {a.cor ?? "#3de8a0"}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
