"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Search } from "lucide-react";
import { ExercicioModal } from "@/components/shared/exercicio-modal";
import { TreinoModal, type TreinoForm } from "@/components/shared/treino-modal";
import { PaginatedTable } from "@/components/shared/paginated-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createExercicio,
  createTreino,
  listAlunos,
  listAtividades,
  listExercicios,
  listFuncionarios,
  listTreinos,
} from "@/lib/mock/services";
import { getStore } from "@/lib/mock/store";
import type { Aluno, Atividade, Exercicio, Funcionario, Treino } from "@/lib/types";

const PAGE_SIZE = 20;

function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString("pt-BR");
}

function diasParaVencer(dataVencimento: string): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const vencimento = new Date(`${dataVencimento}T00:00:00`);
  if (Number.isNaN(vencimento.getTime())) return Number.NaN;
  return Math.floor((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

export default function TreinosPage() {
  const tenantRef = useRef<string>(getStore().currentTenantId || getStore().tenant?.id || "");
  const [tenantId, setTenantId] = useState(() => tenantRef.current);
  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [exercicios, setExercicios] = useState<Exercicio[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [apenasAtivosTreino, setApenasAtivosTreino] = useState(true);
  const [apenasAtivosExercicio, setApenasAtivosExercicio] = useState(true);
  const [buscaTreino, setBuscaTreino] = useState("");
  const [buscaExercicio, setBuscaExercicio] = useState("");
  const [page, setPage] = useState(0);
  const [modalTreinoOpen, setModalTreinoOpen] = useState(false);
  const [modalExercicioOpen, setModalExercicioOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const instrutores = useMemo(
    () => funcionarios.filter((funcionario) => funcionario.ativo && funcionario.podeMinistrarAulas),
    [funcionarios]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [treinosList, exerciciosList, alunosList, atividadesList, funcionariosList] =
        await Promise.all([
          listTreinos({
            apenasAtivas: apenasAtivosTreino,
          }),
          listExercicios(apenasAtivosExercicio ? { apenasAtivos: true } : {}),
          listAlunos(),
          listAtividades({ apenasAtivas: true }),
          listFuncionarios({ apenasAtivos: true }),
        ]);

      setTreinos(treinosList);
      setExercicios(exerciciosList);
      setAlunos(alunosList);
      setAtividades(atividadesList);
      setFuncionarios(funcionariosList);
    } catch (error) {
      console.error("[treinos] Falha ao carregar dados.", error);
    } finally {
      setLoading(false);
    }
  }, [apenasAtivosTreino, apenasAtivosExercicio]);

  const syncTenantChange = useCallback(() => {
    const current = getStore().currentTenantId || getStore().tenant?.id || "";
    if (!current || current === tenantRef.current) return;
    tenantRef.current = current;
    setTenantId(current);
    setPage(0);
    setTreinos([]);
    setExercicios([]);
    setAlunos([]);
    setAtividades([]);
    setFuncionarios([]);
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
    void loadData();
  }, [loadData, tenantId]);

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

  const atividadeOptions = useMemo(
    () =>
      atividades.map((atividade) => ({
        id: atividade.id,
        nome: atividade.nome,
      })),
    [atividades],
  );

  const funcionarioOptions = useMemo(
    () =>
      instrutores.map((funcionario) => ({
        id: funcionario.id,
        nome: funcionario.nome,
      })),
    [instrutores],
  );

  const treinosFiltrados = useMemo(() => {
    const termo = buscaTreino.trim().toLowerCase();
    if (!termo) return treinos;
    return treinos.filter((treino) => {
      const aluno = treino.alunoNome.toLowerCase();
      const atividade = (treino.atividadeNome ?? "").toLowerCase();
      const professor = (treino.funcionarioNome ?? "").toLowerCase();
      const observacoes = (treino.observacoes ?? "").toLowerCase();
      return (
        aluno.includes(termo) ||
        atividade.includes(termo) ||
        professor.includes(termo) ||
        observacoes.includes(termo)
      );
    });
  }, [buscaTreino, treinos]);

  const totalPages = Math.max(1, Math.ceil(treinosFiltrados.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageItems = treinosFiltrados.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  const exerciciosFiltrados = useMemo(() => {
    const termo = buscaExercicio.trim().toLowerCase();
    if (!termo) return exercicios;
    return exercicios.filter((exercicio) => {
      const nome = exercicio.nome.toLowerCase();
      const grupo = (exercicio.grupoMuscular ?? "").toLowerCase();
      const equipamento = (exercicio.equipamento ?? "").toLowerCase();
      return (
        nome.includes(termo) ||
        grupo.includes(termo) ||
        equipamento.includes(termo)
      );
    });
  }, [buscaExercicio, exercicios]);

  const hasNextPage = safePage < totalPages - 1;

  async function handleNovoTreino(data: TreinoForm) {
    await createTreino({
      alunoId: data.alunoId,
      alunoNome: data.alunoNome,
      atividadeId: data.atividadeId,
      atividadeNome: data.atividadeNome,
      funcionarioId: data.funcionarioId,
      funcionarioNome: data.funcionarioNome,
      vencimento: data.vencimento,
      observacoes: data.observacoes,
      ativo: data.ativo,
    });
    setModalTreinoOpen(false);
    await loadData();
    setPage(0);
  }

  async function handleNovoExercicio(payload: Parameters<typeof createExercicio>[0]) {
    await createExercicio({
      nome: payload.nome,
      grupoMuscular: payload.grupoMuscular,
      equipamento: payload.equipamento,
      descricao: payload.descricao,
    });
    setModalExercicioOpen(false);
    await loadData();
  }

  const title = tenantId ? "Treinos" : "Treinos por unidade";

  return (
    <div className="space-y-6">
      <TreinoModal
        key={modalTreinoOpen ? "treino-open" : "treino-closed"}
        open={modalTreinoOpen}
        onClose={() => setModalTreinoOpen(false)}
        clientes={clienteOptions}
        atividades={atividadeOptions}
        funcionarios={funcionarioOptions}
        onSave={handleNovoTreino}
      />
      <ExercicioModal
        key={modalExercicioOpen ? "exercicio-open" : "exercicio-closed"}
        open={modalExercicioOpen}
        onClose={() => setModalExercicioOpen(false)}
        onSave={handleNovoExercicio}
      />

      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {tenantId ? "Gerencie treinos por unidade ativa" : "Selecione uma unidade para visualizar os treinos"}
        </p>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button onClick={() => setModalExercicioOpen(true)} variant="secondary">
          <Plus className="size-4" />
          Novo exercício
        </Button>
        <Button onClick={() => setModalTreinoOpen(true)}>
          <Plus className="size-4" />
          Novo treino
        </Button>
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="space-y-2">
          <CardTitle className="font-display text-lg">Treinos</CardTitle>
          <div className="flex items-center gap-3">
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
            <div className="relative ml-auto w-full max-w-[340px]">
              <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={buscaTreino}
                onChange={(event) => {
                  setBuscaTreino(event.target.value);
                  setPage(0);
                }}
                className="w-full bg-secondary border-border pl-8"
                placeholder="Buscar por cliente, atividade ou professor"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <PaginatedTable<Treino>
            columns={[
              { label: "Cliente" },
              { label: "Atividade" },
              { label: "Professor" },
              { label: "Vencimento" },
              { label: "Observações" },
            ]}
            items={pageItems}
            emptyText={loading ? "Carregando..." : "Nenhum treino encontrado"}
            total={treinosFiltrados.length}
            page={safePage}
            pageSize={PAGE_SIZE}
            hasNext={hasNextPage}
            onNext={() => setPage((current) => (current >= totalPages - 1 ? current : current + 1))}
            onPrevious={() => setPage((current) => Math.max(0, current - 1))}
            getRowKey={(treino) => treino.id}
            renderCells={(treino) => {
              const dias = diasParaVencer(treino.vencimento);
              const precisaUrgencia = dias >= 0 && dias < 7;
              return (
                <>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium">{treino.alunoNome}</p>
                  </td>
                  <td className="px-4 py-3 text-sm">{treino.atividadeNome ?? "-"}</td>
                  <td className="px-4 py-3 text-sm">{treino.funcionarioNome ?? "-"}</td>
                  <td className="px-4 py-3 text-sm">
                    <p>{formatDate(treino.vencimento)}</p>
                    {precisaUrgencia && (
                      <p className="mt-1 text-xs text-gym-warning">
                        Faltam menos de 7 dias para vencer
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{treino.observacoes ?? "-"}</td>
                </>
              );
            }}
          />
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader className="space-y-2">
          <CardTitle className="font-display text-lg">Exercícios</CardTitle>
          <div className="flex gap-1.5">
            <button
              onClick={() => {
                setApenasAtivosExercicio(false);
              }}
              className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                !apenasAtivosExercicio
                  ? "border-gym-accent bg-gym-accent/10 text-gym-accent"
                  : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => {
                setApenasAtivosExercicio(true);
              }}
              className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                apenasAtivosExercicio
                  ? "border-gym-accent bg-gym-accent/10 text-gym-accent"
                  : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
              }`}
            >
              Apenas ativos
            </button>
          </div>
          <div className="relative mt-2 w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={buscaExercicio}
              onChange={(event) => setBuscaExercicio(event.target.value)}
              className="w-full bg-secondary border-border pl-8"
              placeholder="Buscar exercício, grupo muscular ou equipamento"
            />
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
            items={exerciciosFiltrados}
            emptyText="Nenhum exercício encontrado"
            total={exerciciosFiltrados.length}
            page={0}
            pageSize={exerciciosFiltrados.length || 1}
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
