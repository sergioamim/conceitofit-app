"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Search } from "lucide-react";
import { TreinoModal, type TreinoForm } from "@/components/shared/treino-modal";
import { PaginatedTable } from "@/components/shared/paginated-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createTreino, listAlunos, listExercicios, listTreinos } from "@/lib/mock/services";
import { getStore } from "@/lib/mock/store";
import type { Aluno, Exercicio, Treino } from "@/lib/types";

const PAGE_SIZE = 20;

function formatDate(value?: string): string {
  if (!value) return "-";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR");
}

export default function TreinosPage() {
  const tenantRef = useRef<string>(getStore().currentTenantId || getStore().tenant?.id || "");
  const [tenantId, setTenantId] = useState(() => tenantRef.current);
  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [treinosTotal, setTreinosTotal] = useState<number | undefined>(undefined);
  const [treinosHasNext, setTreinosHasNext] = useState(false);
  const [treinosSize, setTreinosSize] = useState(PAGE_SIZE);
  const [exercicios, setExercicios] = useState<Exercicio[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [apenasAtivosTreino, setApenasAtivosTreino] = useState(true);
  const [buscaTreino, setBuscaTreino] = useState("");
  const [filtroClienteId, setFiltroClienteId] = useState("");
  const [page, setPage] = useState(0);
  const [modalTreinoOpen, setModalTreinoOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formOptionsLoading, setFormOptionsLoading] = useState(false);
  const [formOptionsReady, setFormOptionsReady] = useState(false);

  const loadTreinos = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const response = await listTreinos({
        apenasAtivas: apenasAtivosTreino,
        page,
        size: PAGE_SIZE,
        search: buscaTreino,
        clienteId: filtroClienteId || undefined,
      });
      setTreinos(response.items);
      setTreinosTotal(response.total);
      setTreinosHasNext(response.hasNext);
      setTreinosSize(response.size);
    } catch (error) {
      console.error("[treinos] Falha ao carregar treinos.", error);
    } finally {
      setLoading(false);
    }
  }, [apenasAtivosTreino, buscaTreino, filtroClienteId, page, tenantId]);

  const loadFormOptions = useCallback(async () => {
    if (formOptionsReady || formOptionsLoading) return;
    setFormOptionsLoading(true);
    try {
      const [alunosList, exerciciosList] = await Promise.all([
        listAlunos(),
        listExercicios({ apenasAtivos: true }),
      ]);
      setAlunos(alunosList);
      setExercicios(exerciciosList);
      setFormOptionsReady(true);
    } catch (error) {
      console.error("[treinos] Falha ao carregar opções do formulário.", error);
    } finally {
      setFormOptionsLoading(false);
    }
  }, [formOptionsLoading, formOptionsReady]);

  const syncTenantChange = useCallback(() => {
    const current = getStore().currentTenantId || getStore().tenant?.id || "";
    if (!current || current === tenantRef.current) return;
    tenantRef.current = current;
    setTenantId(current);
    setPage(0);
    setTreinos([]);
    setTreinosTotal(undefined);
    setTreinosHasNext(false);
    setTreinosSize(PAGE_SIZE);
    setAlunos([]);
    setExercicios([]);
    setFormOptionsReady(false);
  }, []);

  useEffect(() => {
    syncTenantChange();
    function handleTenantUpdate() {
      syncTenantChange();
    }
    window.addEventListener("academia-store-updated", handleTenantUpdate);
    return () => window.removeEventListener("academia-store-updated", handleTenantUpdate);
  }, [syncTenantChange]);

  useEffect(() => {
    if (!tenantId) return;
    void loadTreinos();
  }, [loadTreinos, tenantId]);

  useEffect(() => {
    if (modalTreinoOpen) {
      void loadFormOptions();
    }
  }, [loadFormOptions, modalTreinoOpen]);

  const clienteOptions = useMemo(
    () =>
      alunos.map((aluno) => ({
        id: aluno.id,
        nome: aluno.nome,
        cpf: aluno.cpf,
        email: aluno.email,
      })),
    [alunos],
  );

  const clienteFiltroOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const treino of treinos) {
      if (treino.alunoNome && treino.alunoId) {
        map.set(treino.alunoId, treino.alunoNome);
      }
    }
    return Array.from(map.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([id, nome]) => ({ id, nome }));
  }, [treinos]);

  async function handleNovoTreino(data: TreinoForm) {
    await createTreino({
      alunoId: data.alunoId,
      alunoNome: data.alunoNome,
      nome: data.nome,
      divisao: data.divisao,
      metaSessoesSemana: data.metaSessoesSemana,
      dataInicio: data.dataInicio,
      dataFim: data.dataFim,
      observacoes: data.observacoes,
      ativo: data.ativo,
      itens: data.itens.map((item) => ({
        id: "",
        treinoId: "",
        exercicioId: item.exercicioId,
        ordem: item.ordem,
        series: item.series,
        repeticoesMin: item.repeticoesMin,
        repeticoesMax: item.repeticoesMax,
        intervaloSegundos: item.intervaloSegundos,
        tempoExecucaoSegundos: item.tempoExecucaoSegundos,
        cargaSugerida: item.cargaSugerida,
        observacao: item.observacao,
        diasSemana: item.diasSemana,
        ativo: true,
      })),
    });
    setModalTreinoOpen(false);
    setPage(0);
    await loadTreinos();
  }

  const title = tenantId ? "Treinos" : "Treinos por unidade";

  return (
    <div className="space-y-6">
      <TreinoModal
        key={modalTreinoOpen ? "treino-open" : "treino-closed"}
        open={modalTreinoOpen}
        onClose={() => setModalTreinoOpen(false)}
        clientes={clienteOptions}
        exercicios={exercicios.map((ex) => ({ id: ex.id, nome: ex.nome, grupoMuscular: ex.grupoMuscular }))}
        onSave={handleNovoTreino}
      />

      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Monte, edite e atribua treinos para os alunos da unidade.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1.5">
            <button
              onClick={() => {
                setApenasAtivosTreino(false);
                setPage(0);
              }}
              className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                !apenasAtivosTreino
                  ? "border-gym-accent bg-gym-accent/10 text-gym-accent"
                  : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => {
                setApenasAtivosTreino(true);
                setPage(0);
              }}
              className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                apenasAtivosTreino
                  ? "border-gym-accent bg-gym-accent/10 text-gym-accent"
                  : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
              }`}
            >
              Apenas ativos
            </button>
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={buscaTreino}
              onChange={(event) => {
                setBuscaTreino(event.target.value);
                setPage(0);
              }}
              className="w-full bg-secondary border-border pl-8"
              placeholder="Buscar por cliente ou professor"
            />
          </div>
          <div className="relative w-full max-w-xs">
            <SelectFiltroCliente
              options={clienteFiltroOptions}
              value={filtroClienteId}
              onChange={(value) => {
                setFiltroClienteId(value);
                setPage(0);
              }}
            />
          </div>
        </div>

        <Button onClick={() => setModalTreinoOpen(true)}>
          <Plus className="size-4" />
          Novo treino
        </Button>
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="space-y-2">
          <CardTitle className="font-display text-lg">Treinos</CardTitle>
        </CardHeader>
        <CardContent>
          <PaginatedTable<Treino>
            columns={[
              { label: "Cliente" },
              { label: "Divisão" },
              { label: "Professor" },
              { label: "Validade" },
              { label: "Meta/sem" },
            ]}
            items={treinos}
            emptyText={loading ? "Carregando..." : "Nenhum treino encontrado"}
            total={treinosTotal ?? treinos.length}
            page={page}
            pageSize={treinosSize}
            hasNext={treinosHasNext}
            onNext={() => {
              if (treinosHasNext) setPage((current) => current + 1);
            }}
            onPrevious={() => setPage((current) => Math.max(0, current - 1))}
            getRowKey={(treino) => treino.id}
            renderCells={(treino) => {
              const validade = treino.dataFim ?? treino.vencimento ?? "";
              return (
                <>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium">{treino.alunoNome}</p>
                  </td>
                  <td className="px-4 py-3 text-sm">{treino.divisao ?? "-"}</td>
                  <td className="px-4 py-3 text-sm">{treino.funcionarioNome ?? "-"}</td>
                  <td className="px-4 py-3 text-sm">{formatDate(validade)}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {treino.metaSessoesSemana ?? "-"}
                  </td>
                </>
              );
            }}
          />
        </CardContent>
      </Card>

      <Card className="border-dashed border-border bg-card/50">
        <CardHeader>
          <CardTitle className="font-display text-lg">Templates de treino (em breve)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Vamos disponibilizar uma lista de templates para reaproveitar estruturas de treino e atribuir aos alunos rapidamente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function SelectFiltroCliente({
  options,
  value,
  onChange,
}: {
  options: Array<{ id: string; nome: string }>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm"
    >
      <option value="">Todos os clientes</option>
      {options.map((opt) => (
        <option key={opt.id} value={opt.id}>
          {opt.nome}
        </option>
      ))}
    </select>
  );
}
