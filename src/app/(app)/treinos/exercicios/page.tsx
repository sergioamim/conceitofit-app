"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Search } from "lucide-react";
import { ExercicioModal } from "@/components/shared/exercicio-modal";
import { PaginatedTable } from "@/components/shared/paginated-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { listExercicios, createExercicio } from "@/lib/mock/services";
import type { Exercicio } from "@/lib/types";

export default function ExerciciosPage() {
  const [exercicios, setExercicios] = useState<Exercicio[]>([]);
  const [busca, setBusca] = useState("");
  const [apenasAtivos, setApenasAtivos] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);

  const load = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const list = await listExercicios(apenasAtivos ? { apenasAtivos: true } : {});
      setExercicios(list);
    } catch (error) {
      console.error("[exercicios] Falha ao carregar.", error);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [apenasAtivos]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return exercicios;
    return exercicios.filter((item) => {
      const nome = item.nome.toLowerCase();
      const grupo = (item.grupoMuscular ?? "").toLowerCase();
      const equipamento = (item.equipamento ?? "").toLowerCase();
      return nome.includes(termo) || grupo.includes(termo) || equipamento.includes(termo);
    });
  }, [busca, exercicios]);

  async function handleSaveExercicio(payload: Parameters<typeof createExercicio>[0]) {
    await createExercicio({
      nome: payload.nome,
      grupoMuscular: payload.grupoMuscular,
      equipamento: payload.equipamento,
      descricao: payload.descricao,
    });
    setModalOpen(false);
    await load();
  }

  return (
    <div className="space-y-6">
      <ExercicioModal
        key={modalOpen ? "exercicio-open" : "exercicio-closed"}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveExercicio}
      />

      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Exercícios</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cadastre e gerencie exercícios com grupos musculares e equipamentos.
        </p>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="size-4" />
          Novo exercício
        </Button>
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="space-y-2">
          <CardTitle className="font-display text-lg">Lista de exercícios</CardTitle>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-1.5">
              <button
                onClick={() => setApenasAtivos(false)}
                className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  !apenasAtivos
                    ? "border-gym-accent bg-gym-accent/10 text-gym-accent"
                    : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setApenasAtivos(true)}
                className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  apenasAtivos
                    ? "border-gym-accent bg-gym-accent/10 text-gym-accent"
                    : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                }`}
              >
                Apenas ativos
              </button>
            </div>
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                className="w-full bg-secondary border-border pl-8"
                placeholder="Buscar exercício, grupo muscular ou equipamento"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <PaginatedTable<Exercicio>
            columns={[
              { label: "Nome" },
              { label: "Grupo muscular" },
              { label: "Equipamento" },
              { label: "Observação" },
            ]}
            items={filtrados}
            emptyText={loading ? "Carregando..." : "Nenhum exercício encontrado"}
            total={filtrados.length}
            page={0}
            pageSize={filtrados.length || 1}
            showPagination={false}
            getRowKey={(item) => item.id}
            renderCells={(item) => (
              <>
                <td className="px-4 py-3 text-sm font-medium">{item.nome}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{item.grupoMuscular ?? "-"}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{item.equipamento ?? "-"}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{item.descricao ?? "-"}</td>
              </>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}
