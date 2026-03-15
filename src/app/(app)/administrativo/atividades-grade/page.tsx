"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import {
  createAtividadeGradeApi,
  deleteAtividadeGradeApi,
  listAtividadeGradesApi,
  listAtividadesApi,
  listFuncionariosApi,
  listSalasApi,
  toggleAtividadeGradeApi,
  updateAtividadeGradeApi,
} from "@/lib/api/administrativo";
import { getActiveTenantIdFromSession } from "@/lib/api/session";
import type { Atividade, AtividadeGrade, DiaSemana, Funcionario, Sala } from "@/lib/types";
import { useTenantContext } from "@/hooks/use-session-context";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { AtividadeGradeModal, type AtividadeGradeForm } from "@/components/shared/atividade-grade-modal";

const DIA_LABEL: Record<DiaSemana, string> = {
  SEG: "Segunda",
  TER: "Terça",
  QUA: "Quarta",
  QUI: "Quinta",
  SEX: "Sexta",
  SAB: "Sábado",
  DOM: "Domingo",
};

export default function AtividadesGradePage() {
  const tenantContext = useTenantContext();
  const [grades, setGrades] = useState<AtividadeGrade[]>([]);
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AtividadeGrade | null>(null);
  const [filtroAtividade, setFiltroAtividade] = useState<string>("TODAS");
  const [filtroDia, setFiltroDia] = useState<DiaSemana | "TODOS">("TODOS");
  const [apenasAtivas, setApenasAtivas] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const tenantId = tenantContext.tenantId || getActiveTenantIdFromSession() || "";

  const load = useCallback(async () => {
    if (!tenantId) {
      setGrades([]);
      setAtividades([]);
      setSalas([]);
      setFuncionarios([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [g, a, sal, pro] = await Promise.all([
        listAtividadeGradesApi(),
        listAtividadesApi({ tenantId }),
        listSalasApi(),
        listFuncionariosApi(true),
      ]);
      setGrades(g);
      setAtividades(a);
      setSalas(sal);
      setFuncionarios(pro);
    } catch (loadError) {
      setGrades([]);
      setAtividades([]);
      setSalas([]);
      setFuncionarios([]);
      setError(normalizeErrorMessage(loadError) || "Falha ao carregar grade de atividades.");
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    void load();
  }, [load]);

  const atividadeMap = useMemo(() => new Map(atividades.map((a) => [a.id, a])), [atividades]);
  const salaMap = useMemo(() => new Map(salas.map((s) => [s.id, s])), [salas]);
  const funcionarioMap = useMemo(() => new Map(funcionarios.map((f) => [f.id, f])), [funcionarios]);

  const filtered = grades.filter((g) => {
    const matchAtividade = filtroAtividade === "TODAS" || g.atividadeId === filtroAtividade;
    const matchDia = filtroDia === "TODOS" || g.diasSemana.includes(filtroDia);
    const matchAtiva = !apenasAtivas || g.ativo;
    return matchAtividade && matchDia && matchAtiva;
  });

  async function handleSave(data: AtividadeGradeForm, id?: string) {
    const payload = {
      atividadeId: data.atividadeId,
      diasSemana: data.diasSemana,
      definicaoHorario: data.definicaoHorario,
      horaInicio: data.horaInicio,
      horaFim: data.horaFim,
      capacidade: Math.max(1, parseInt(data.capacidade, 10) || 1),
      checkinLiberadoMinutosAntes: Math.max(0, parseInt(data.checkinLiberadoMinutosAntes, 10) || 0),
      duracaoMinutos: Math.max(1, parseInt(data.duracaoMinutos, 10) || 1),
      codigo: data.codigo || undefined,
      grupoAtividades: data.grupoAtividades || undefined,
      publico: data.publico || undefined,
      dificuldade: data.dificuldade ? (parseInt(data.dificuldade, 10) as 1 | 2 | 3 | 4 | 5) : undefined,
      descricaoAgenda: data.descricaoAgenda || undefined,
      acessoClientes: data.acessoClientes,
      permiteReserva: data.permiteReserva,
      limitarVagasAgregadores: data.limitarVagasAgregadores,
      exibirWellhub: data.exibirWellhub,
      permitirSaidaAntesInicio: data.permitirSaidaAntesInicio,
      permitirEscolherNumeroVaga: data.permitirEscolherNumeroVaga,
      exibirNoAppCliente: data.exibirNoAppCliente,
      exibirNoAutoatendimento: data.exibirNoAutoatendimento,
      exibirNoWodTv: data.exibirNoWodTv,
      finalizarAtividadeAutomaticamente: data.finalizarAtividadeAutomaticamente,
      desabilitarListaEspera: data.desabilitarListaEspera,
      salaId: data.salaId || undefined,
      funcionarioId: data.funcionarioId || undefined,
      local: data.salaId ? salaMap.get(data.salaId)?.nome : undefined,
      instrutor: data.funcionarioId ? funcionarioMap.get(data.funcionarioId)?.nome : undefined,
    };

    if (id) await updateAtividadeGradeApi(id, payload);
    else await createAtividadeGradeApi(payload);

    setModalOpen(false);
    setEditing(null);
    await load();
  }

  async function handleToggle(id: string) {
    await toggleAtividadeGradeApi(id);
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este item da grade?")) return;
    await deleteAtividadeGradeApi(id);
    await load();
  }

  return (
    <div className="space-y-6">
      <AtividadeGradeModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
        atividades={atividades}
        salas={salas}
        funcionarios={funcionarios}
        initial={editing}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Atividades - Grade</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cadastro de disponibilidade por atividade. Esses registros serão usados no calendário de atividades.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="size-4" />
          Nova Grade
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
            className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
              !apenasAtivas
                ? "border-gym-accent bg-gym-accent/10 text-gym-accent"
                : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setApenasAtivas(true)}
            className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
              apenasAtivas
                ? "border-gym-accent bg-gym-accent/10 text-gym-accent"
                : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
            }`}
          >
            Apenas ativas
          </button>
        </div>

        <div className="ml-auto grid grid-cols-2 gap-2">
          <div className="w-52">
            <Select value={filtroAtividade} onValueChange={setFiltroAtividade}>
              <SelectTrigger className="w-full bg-secondary border-border text-sm">
                <SelectValue placeholder="Atividade" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="TODAS">Todas atividades</SelectItem>
                {atividades.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-44">
            <Select value={filtroDia} onValueChange={(v) => setFiltroDia(v as DiaSemana | "TODOS")}>
              <SelectTrigger className="w-full bg-secondary border-border text-sm">
                <SelectValue placeholder="Dia" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="TODOS">Todos os dias</SelectItem>
                {Object.entries(DIA_LABEL).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary">
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Atividade</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Dias</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Horário / Tipo</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Capacidade</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Local / Instrutor / Reserva</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  Carregando grade de atividades...
                </td>
              </tr>
            ) : null}
            {!loading && filtered.map((g) => {
              const atividade = atividadeMap.get(g.atividadeId);
              return (
                <tr key={g.id} className="transition-colors hover:bg-secondary/40">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium">{atividade?.nome ?? "Atividade removida"}</p>
                    <p className="text-xs text-muted-foreground">{atividade?.categoria ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {g.diasSemana.map((dia) => DIA_LABEL[dia]).join(", ")}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {g.definicaoHorario === "SOB_DEMANDA"
                      ? "Sob demanda"
                      : `${g.horaInicio} - ${g.horaFim}`}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{g.capacidade}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {g.salaId ? (salaMap.get(g.salaId)?.nome ?? "Sala removida") : (g.local ?? "Sem sala")}
                    {` · `}
                    {g.funcionarioId ? (funcionarioMap.get(g.funcionarioId)?.nome ?? "Funcionário removido") : (g.instrutor ?? "Sem funcionário")}
                    {` · ${g.permiteReserva ? "Reserva habilitada" : "Sem reserva"}`}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      g.ativo ? "bg-gym-teal/15 text-gym-teal" : "bg-muted text-muted-foreground"
                    }`}>
                      {g.ativo ? "Ativa" : "Inativa"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditing(g);
                          setModalOpen(true);
                        }}
                        className="border-border"
                      >
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggle(g.id)}
                        className="border-border"
                      >
                        {g.ativo ? "Desativar" : "Ativar"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(g.id)}
                        className="border-border text-gym-danger hover:text-gym-danger"
                      >
                        Remover
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  Nenhum item de grade encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
