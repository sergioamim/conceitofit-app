"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  extractAlunosFromListResponse,
  listAlunosApi,
} from "@/lib/api/alunos";
import { listAtividadesApi } from "@/lib/api/administrativo";
import { listMatriculasApi } from "@/lib/api/matriculas";
import {
  cancelarReservaAulaApi,
  getAulaOcupacaoApi,
  listAulasAgendaApi,
  listReservasAulaApi,
  promoverReservaWaitlistApi,
  registrarCheckinAulaApi,
  reservarAulaApi,
} from "@/lib/api/reservas";
import { addDaysToIsoDate, getBusinessTodayIso } from "@/lib/business-date";
import type {
  Aluno,
  Atividade,
  AulaOcupacao,
  AulaSessao,
  Matricula,
  ReservaAula,
} from "@/lib/types";
import { RESERVA_AULA_STATUS_LABEL } from "@/lib/aulas/reservas";
import { useTenantContext } from "@/hooks/use-session-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const RESERVAS_DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
});

function formatDate(value: string): string {
  return RESERVAS_DATE_FORMATTER.format(new Date(`${value}T12:00:00`));
}

function sessionLabel(session: AulaSessao): string {
  const occurrenceLabel = session.origemTipo === "OCORRENCIA_AVULSA" ? " · Ocorrência" : "";
  return `${session.atividadeNome}${occurrenceLabel} · ${formatDate(session.data)} · ${session.horaInicio}`;
}

function badgeClass(status: ReservaAula["status"]): string {
  if (status === "CHECKIN") return "bg-emerald-500/15 text-emerald-300";
  if (status === "CONFIRMADA") return "bg-sky-500/15 text-sky-300";
  if (status === "LISTA_ESPERA") return "bg-amber-500/15 text-amber-300";
  return "bg-muted text-muted-foreground";
}

export default function ReservasPage() {
  const tenantContext = useTenantContext();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [atividadeId, setAtividadeId] = useState("TODAS");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [sessions, setSessions] = useState<AulaSessao[]>([]);
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [matriculas, setMatriculas] = useState<(Matricula & { aluno?: Aluno })[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [selectedOccupancy, setSelectedOccupancy] = useState<AulaOcupacao | null>(null);
  const [backofficeAlunoId, setBackofficeAlunoId] = useState("");
  const [portalAlunoId, setPortalAlunoId] = useState("");

  const load = useCallback(async () => {
    if (!dateFrom || !dateTo) {
      return;
    }
    if (!tenantContext.tenantId) {
      setSessions([]);
      setAtividades([]);
      setAlunos([]);
      setMatriculas([]);
      setSelectedSessionId("");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [sessionRows, atividadeRows, alunoRows, matriculaRows] = await Promise.all([
        listAulasAgendaApi({
          tenantId: tenantContext.tenantId,
          dateFrom,
          dateTo,
        }),
        listAtividadesApi({ tenantId: tenantContext.tenantId, apenasAtivas: true }),
        listAlunosApi({ tenantId: tenantContext.tenantId, status: "ATIVO", page: 0, size: 200 }),
        listMatriculasApi({ tenantId: tenantContext.tenantId, status: "ATIVA" }),
      ]);
      const alunosRows = extractAlunosFromListResponse(alunoRows);

      const filteredSessions = atividadeId === "TODAS"
        ? sessionRows
        : sessionRows.filter((session) => session.atividadeId === atividadeId);

      setSessions(filteredSessions);
      setAtividades(atividadeRows);
      setAlunos(alunosRows);
      setMatriculas(matriculaRows);
      setBackofficeAlunoId((current) => current || alunosRows[0]?.id || "");
      setPortalAlunoId((current) => current || alunosRows[0]?.id || "");
      setSelectedSessionId((current) => {
        if (current && filteredSessions.some((session) => session.id === current)) {
          return current;
        }
        return filteredSessions[0]?.id ?? "";
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Falha ao carregar agenda de reservas.");
    } finally {
      setLoading(false);
    }
  }, [atividadeId, dateFrom, dateTo, tenantContext.tenantId]);

  const loadOccupancy = useCallback(async (sessaoId: string) => {
    if (!sessaoId || !tenantContext.tenantId) {
      setSelectedOccupancy(null);
      return;
    }
    const occupancy = await getAulaOcupacaoApi({
      tenantId: tenantContext.tenantId,
      sessaoId,
    });
    setSelectedOccupancy(occupancy);
  }, [tenantContext.tenantId]);

  useEffect(() => {
    const today = getBusinessTodayIso();
    setDateFrom((current) => current || today);
    setDateTo((current) => current || addDaysToIsoDate(today, 6));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadOccupancy(selectedSessionId);
  }, [loadOccupancy, selectedSessionId]);

  const selectedSession = useMemo(
    () => sessions.find((session) => session.id === selectedSessionId) ?? null,
    [selectedSessionId, sessions]
  );

  const activeMatriculasByAluno = useMemo(
    () => new Set(matriculas.map((matricula) => matricula.alunoId)),
    [matriculas]
  );

  const summary = useMemo(() => {
    return {
      sessoes: sessions.length,
      ocorrencias: sessions.filter((session) => session.origemTipo === "OCORRENCIA_AVULSA").length,
      vagasOcupadas: sessions.reduce((total, session) => total + session.vagasOcupadas, 0),
      vagasDisponiveis: sessions.reduce((total, session) => total + session.vagasDisponiveis, 0),
      waitlist: sessions.reduce((total, session) => total + session.waitlistTotal, 0),
    };
  }, [sessions]);

  const [portalReservationRows, setPortalReservationRows] = useState<ReservaAula[]>([]);

  useEffect(() => {
    let mounted = true;
    async function syncPortalReservations() {
      if (!tenantContext.tenantId || !portalAlunoId) {
        setPortalReservationRows([]);
        return;
      }
      const rows = await listReservasAulaApi({
        tenantId: tenantContext.tenantId,
        alunoId: portalAlunoId,
      });
      if (mounted) {
        setPortalReservationRows(rows.filter((row) => row.status !== "CANCELADA"));
      }
    }
    syncPortalReservations();
    return () => {
      mounted = false;
    };
  }, [portalAlunoId, sessions, tenantContext.tenantId]);

  async function refreshAll(nextSessionId?: string) {
    await load();
    const targetSessionId = nextSessionId ?? selectedSessionId;
    if (targetSessionId) {
      await loadOccupancy(targetSessionId);
    }
  }

  async function handleBackofficeReserve() {
    if (!selectedSession || !backofficeAlunoId || !tenantContext.tenantId) return;
    setSaving(true);
    setError("");
    setFeedback("");
    try {
      const reserva = await reservarAulaApi({
        tenantId: tenantContext.tenantId,
        data: {
          atividadeGradeId: selectedSession.atividadeGradeId,
          data: selectedSession.data,
          alunoId: backofficeAlunoId,
          origem: "BACKOFFICE",
        },
      });
      setFeedback(
        reserva.status === "LISTA_ESPERA"
          ? "Aluno incluído na lista de espera."
          : "Reserva criada com sucesso."
      );
      await refreshAll(selectedSession.id);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Falha ao reservar aula.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel(id: string) {
    if (!tenantContext.tenantId) return;
    setSaving(true);
    setError("");
    setFeedback("");
    try {
      await cancelarReservaAulaApi({
        tenantId: tenantContext.tenantId,
        id,
      });
      setFeedback("Reserva cancelada.");
      await refreshAll();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Falha ao cancelar reserva.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePromoteWaitlist() {
    if (!selectedSession || !tenantContext.tenantId) return;
    setSaving(true);
    setError("");
    setFeedback("");
    try {
      const promoted = await promoverReservaWaitlistApi({
        tenantId: tenantContext.tenantId,
        sessaoId: selectedSession.id,
      });
      setFeedback(promoted ? "Primeira reserva da waitlist promovida." : "Não havia reservas em espera.");
      await refreshAll(selectedSession.id);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Falha ao promover waitlist.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCheckin(id: string) {
    if (!tenantContext.tenantId) return;
    setSaving(true);
    setError("");
    setFeedback("");
    try {
      await registrarCheckinAulaApi({
        tenantId: tenantContext.tenantId,
        id,
      });
      setFeedback("Check-in registrado.");
      await refreshAll();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Falha ao registrar check-in.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePortalAction(session: AulaSessao) {
    if (!tenantContext.tenantId) return;
    setSaving(true);
    setError("");
    setFeedback("");
    try {
      const currentReservation = portalReservationRows.find(
        (row) => row.sessaoId === session.id && row.status !== "CANCELADA"
      );
      if (currentReservation) {
        await cancelarReservaAulaApi({
          tenantId: tenantContext.tenantId,
          id: currentReservation.id,
        });
        setFeedback("Reserva do portal cancelada.");
      } else {
        const reserva = await reservarAulaApi({
          tenantId: tenantContext.tenantId,
          data: {
            atividadeGradeId: session.atividadeGradeId,
            data: session.data,
            alunoId: portalAlunoId,
            origem: "PORTAL_CLIENTE",
          },
        });
        setFeedback(
          reserva.status === "LISTA_ESPERA"
            ? "Aluno entrou na lista de espera pelo portal."
            : "Reserva realizada pelo portal."
        );
      }
      await refreshAll(session.id);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Falha ao executar ação do portal.");
    } finally {
      setSaving(false);
    }
  }

  function getPortalReason(session: AulaSessao): string | null {
    if (!portalAlunoId) return "Selecione um aluno.";
    if (!session.exibirNoAppCliente) return "Oculta no portal do cliente.";
    if (!session.permiteReserva) return "Reserva desabilitada para esta aula.";
    if (!session.permiteCheckin && session.checkinObrigatorio) {
      return "Configuração inválida de check-in para esta aula.";
    }
    if (session.acessoClientes === "APENAS_COM_CONTRATO_OU_SERVICO" && !activeMatriculasByAluno.has(portalAlunoId)) {
      return "Contrato ativo obrigatório para reservar.";
    }
    return null;
  }

  const portalSessions = sessions.filter((session) => session.exibirNoAppCliente);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Agenda operacional
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight">Reservas, vagas e aulas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Operação e portal da unidade{" "}
            <span className="font-semibold text-foreground">{tenantContext.tenantName ?? "atual"}</span>.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="reservas-date-from">De</Label>
            <Input
              id="reservas-date-from"
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              className="border-border bg-secondary"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reservas-date-to">Até</Label>
            <Input
              id="reservas-date-to"
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              className="border-border bg-secondary"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reservas-atividade">Atividade</Label>
            <select
              id="reservas-atividade"
              value={atividadeId}
              onChange={(event) => setAtividadeId(event.target.value)}
              className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 text-sm"
            >
              <option value="TODAS">Todas</option>
              {atividades.map((atividade) => (
                <option key={atividade.id} value={atividade.id}>
                  {atividade.nome}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error ? (
        <Card className="border-rose-500/40 bg-rose-500/10">
          <CardContent className="px-6 py-4 text-sm text-rose-100">{error}</CardContent>
        </Card>
      ) : null}
      {feedback ? (
        <Card className="border-emerald-500/40 bg-emerald-500/10">
          <CardContent className="px-6 py-4 text-sm text-emerald-100">{feedback}</CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/70 bg-card/80">
          <CardContent className="px-4 py-4">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Sessões</p>
            <p className="mt-2 font-display text-2xl text-sky-300">{summary.sessoes}</p>
            {summary.ocorrencias > 0 ? (
              <p className="mt-1 text-xs text-muted-foreground">{summary.ocorrencias} ocorrência(s) avulsa(s)</p>
            ) : null}
          </CardContent>
        </Card>
        <Card className="border-border/70 bg-card/80">
          <CardContent className="px-4 py-4">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Vagas ocupadas</p>
            <p className="mt-2 font-display text-2xl text-amber-300">{summary.vagasOcupadas}</p>
          </CardContent>
        </Card>
        <Card className="border-border/70 bg-card/80">
          <CardContent className="px-4 py-4">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Disponíveis</p>
            <p className="mt-2 font-display text-2xl text-emerald-300">{summary.vagasDisponiveis}</p>
          </CardContent>
        </Card>
        <Card className="border-border/70 bg-card/80">
          <CardContent className="px-4 py-4">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Waitlist</p>
            <p className="mt-2 font-display text-2xl text-rose-300">{summary.waitlist}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="operacao" className="space-y-4">
        <TabsList>
          <TabsTrigger value="operacao">Operação</TabsTrigger>
          <TabsTrigger value="portal">Portal do cliente</TabsTrigger>
        </TabsList>

        <TabsContent value="operacao" className="space-y-4">
          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.25fr]">
            <Card className="border-border/70 bg-card/80">
              <CardHeader>
                <CardTitle>Turmas no período</CardTitle>
                <CardDescription>Selecione uma sessão para acompanhar ocupação, lista de espera e check-in.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading ? (
                  <div className="rounded-xl border border-dashed border-border/70 px-4 py-10 text-center text-sm text-muted-foreground">
                    Carregando agenda operacional...
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border/70 px-4 py-10 text-center text-sm text-muted-foreground">
                    Nenhuma sessão encontrada para o período.
                  </div>
                ) : (
                  sessions.map((session) => {
                    const active = session.id === selectedSessionId;
                    return (
                      <button
                        key={session.id}
                        type="button"
                        onClick={() => setSelectedSessionId(session.id)}
                        className={`w-full rounded-xl border p-4 text-left transition-colors ${
                          active
                            ? "border-gym-accent bg-gym-accent/10"
                            : "border-border/70 bg-secondary/20 hover:border-foreground/25"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold">{session.atividadeNome}</p>
                              {session.origemTipo === "OCORRENCIA_AVULSA" ? (
                                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
                                  Ocorrência
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {formatDate(session.data)} · {session.horaInicio} - {session.horaFim}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {session.salaNome ?? session.local ?? "Sem sala"} · {session.instrutorNome ?? "Sem instrutor"}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                              session.vagasDisponiveis === 0
                                ? "bg-rose-500/15 text-rose-300"
                                : "bg-emerald-500/15 text-emerald-300"
                            }`}
                          >
                            {session.vagasOcupadas}/{session.capacidade}
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                          <span className="rounded-full bg-secondary px-2 py-0.5">
                            {session.waitlistTotal} em espera
                          </span>
                          <span className="rounded-full bg-secondary px-2 py-0.5">
                            {session.vagasDisponiveis} vaga(s) disponível(is)
                          </span>
                          <span className="rounded-full bg-secondary px-2 py-0.5">
                            {session.permiteCheckin
                              ? session.checkinObrigatorio
                                ? "Check-in obrigatório"
                                : "Check-in opcional"
                              : "Sem check-in"}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card className="border-border/70 bg-card/80">
                <CardHeader>
                  <CardTitle>Operação da sessão</CardTitle>
                  <CardDescription>
                    {selectedSession ? sessionLabel(selectedSession) : "Selecione uma turma para carregar a ocupação."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!selectedSession ? (
                    <div className="rounded-xl border border-dashed border-border/70 px-4 py-10 text-center text-sm text-muted-foreground">
                      Nenhuma sessão selecionada.
                    </div>
                  ) : (
                    <>
                      {selectedSession.origemTipo === "OCORRENCIA_AVULSA" ? (
                        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                          Sessão criada manualmente a partir de uma grade sob demanda.
                        </div>
                      ) : null}
                      <div className="grid gap-3 md:grid-cols-3">
                        <div className="rounded-xl border border-border/70 bg-secondary/20 p-4">
                          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Confirmadas</p>
                          <p className="mt-2 font-display text-2xl text-sky-300">
                            {selectedOccupancy?.confirmadas.length ?? 0}
                          </p>
                        </div>
                        <div className="rounded-xl border border-border/70 bg-secondary/20 p-4">
                          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Lista de espera</p>
                          <p className="mt-2 font-display text-2xl text-amber-300">
                            {selectedOccupancy?.waitlist.length ?? 0}
                          </p>
                        </div>
                        <div className="rounded-xl border border-border/70 bg-secondary/20 p-4">
                          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Check-ins</p>
                          <p className="mt-2 font-display text-2xl text-emerald-300">
                            {selectedOccupancy?.checkinsRealizados ?? 0}
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                        <div className="space-y-1.5">
                          <Label htmlFor="backoffice-aluno">Reservar para aluno</Label>
                          <select
                            id="backoffice-aluno"
                            value={backofficeAlunoId}
                            onChange={(event) => setBackofficeAlunoId(event.target.value)}
                            className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 text-sm"
                          >
                            <option value="">Selecione</option>
                            {alunos.map((aluno) => (
                              <option key={aluno.id} value={aluno.id}>
                                {aluno.nome}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-end gap-2">
                          <Button type="button" onClick={handleBackofficeReserve} disabled={saving || !backofficeAlunoId}>
                            Reservar vaga
                          </Button>
                          <Button type="button" variant="outline" onClick={handlePromoteWaitlist} disabled={saving}>
                            Promover waitlist
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {selectedSession ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  <Card className="border-border/70 bg-card/80">
                    <CardHeader>
                      <CardTitle>Reservas confirmadas</CardTitle>
                      <CardDescription>Check-in rápido e cancelamento operacional.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {(selectedOccupancy?.confirmadas.length ?? 0) === 0 ? (
                        <div className="rounded-xl border border-dashed border-border/70 px-4 py-8 text-center text-sm text-muted-foreground">
                          Nenhuma reserva confirmada nesta sessão.
                        </div>
                      ) : (
                        selectedOccupancy?.confirmadas.map((row) => (
                          <div key={row.id} className="rounded-xl border border-border/70 bg-secondary/20 p-4">
                            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-semibold">{row.alunoNome}</p>
                                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${badgeClass(row.status)}`}>
                                    {RESERVA_AULA_STATUS_LABEL[row.status]}
                                  </span>
                                </div>
                                <p className="mt-1 text-sm text-muted-foreground">
                                  {row.origem === "BACKOFFICE" ? "Criada no backoffice" : "Criada pelo portal"}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button type="button" variant="outline" onClick={() => handleCancel(row.id)} disabled={saving || row.status === "CHECKIN"}>
                                  Cancelar
                                </Button>
                                <Button
                                  type="button"
                                  onClick={() => handleCheckin(row.id)}
                                  disabled={
                                    saving
                                    || row.status === "CHECKIN"
                                    || !selectedSession.permiteCheckin
                                  }
                                >
                                  {!selectedSession.permiteCheckin
                                    ? "Check-in indisponível"
                                    : row.status === "CHECKIN"
                                      ? "Check-in OK"
                                      : "Registrar check-in"}
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-border/70 bg-card/80">
                    <CardHeader>
                      <CardTitle>Lista de espera</CardTitle>
                      <CardDescription>Promoção manual e cancelamento das reservas em fila.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {(selectedOccupancy?.waitlist.length ?? 0) === 0 ? (
                        <div className="rounded-xl border border-dashed border-border/70 px-4 py-8 text-center text-sm text-muted-foreground">
                          Não há alunos na lista de espera.
                        </div>
                      ) : (
                        selectedOccupancy?.waitlist.map((row) => (
                          <div key={row.id} className="rounded-xl border border-border/70 bg-secondary/20 p-4">
                            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-semibold">{row.alunoNome}</p>
                                  <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
                                    Posição {row.posicaoListaEspera}
                                  </span>
                                </div>
                                <p className="mt-1 text-sm text-muted-foreground">
                                  {row.origem === "BACKOFFICE" ? "Incluído pelo backoffice" : "Incluído pelo portal"}
                                </p>
                              </div>
                              <Button type="button" variant="outline" onClick={() => handleCancel(row.id)} disabled={saving}>
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>
              ) : null}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="portal" className="space-y-4">
          <Card className="border-border/70 bg-card/80">
            <CardHeader>
              <CardTitle>Prévia do portal do cliente</CardTitle>
              <CardDescription>
                Simule a jornada de reserva e cancelamento com as mesmas regras de exposição e contrato.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-[minmax(0,280px)_1fr]">
                <div className="space-y-1.5">
                  <Label htmlFor="portal-aluno">Aluno do portal</Label>
                  <select
                    id="portal-aluno"
                    value={portalAlunoId}
                    onChange={(event) => setPortalAlunoId(event.target.value)}
                    className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 text-sm"
                  >
                    <option value="">Selecione</option>
                    {alunos.map((aluno) => (
                      <option key={aluno.id} value={aluno.id}>
                        {aluno.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="rounded-xl border border-border/70 bg-secondary/20 px-4 py-3 text-sm text-muted-foreground">
                  {portalAlunoId && activeMatriculasByAluno.has(portalAlunoId)
                    ? "Aluno com contrato ativo apto para aulas restritas."
                    : "Aluno sem contrato ativo: aulas restritas ficam bloqueadas no portal."}
                </div>
              </div>

              {(portalSessions.length === 0 && !loading) ? (
                <div className="rounded-xl border border-dashed border-border/70 px-4 py-10 text-center text-sm text-muted-foreground">
                  Nenhuma aula exposta no portal para o período selecionado.
                </div>
              ) : (
                <div className="grid gap-3 xl:grid-cols-2">
                  {portalSessions.map((session) => {
                    const currentReservation = portalReservationRows.find(
                      (row) => row.sessaoId === session.id && row.status !== "CANCELADA"
                    );
                    const blockReason = getPortalReason(session);
                    const actionDisabled = saving || !portalAlunoId || (!!blockReason && !currentReservation);
                    const actionLabel = currentReservation
                      ? currentReservation.status === "LISTA_ESPERA"
                        ? "Sair da waitlist"
                        : currentReservation.status === "CHECKIN"
                        ? "Presença confirmada"
                        : "Cancelar reserva"
                      : session.vagasDisponiveis > 0
                      ? "Reservar"
                      : session.listaEsperaHabilitada
                      ? "Entrar na waitlist"
                      : "Aula lotada";
                    return (
                      <div key={session.id} className="rounded-xl border border-border/70 bg-secondary/20 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold">{session.atividadeNome}</p>
                              {session.origemTipo === "OCORRENCIA_AVULSA" ? (
                                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
                                  Ocorrência
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {formatDate(session.data)} · {session.horaInicio} - {session.horaFim}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {session.salaNome ?? session.local ?? "Sem sala"} · {session.instrutorNome ?? "Sem instrutor"}
                            </p>
                          </div>
                          <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
                            {session.vagasOcupadas}/{session.capacidade}
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                          <span className="rounded-full bg-secondary px-2 py-0.5">
                            {session.vagasDisponiveis} vaga(s)
                          </span>
                          <span className="rounded-full bg-secondary px-2 py-0.5">
                            {session.waitlistTotal} em espera
                          </span>
                          {currentReservation ? (
                            <span className={`rounded-full px-2 py-0.5 font-semibold ${badgeClass(currentReservation.status)}`}>
                              {RESERVA_AULA_STATUS_LABEL[currentReservation.status]}
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div className="text-sm text-muted-foreground">
                            {blockReason ?? (currentReservation?.status === "LISTA_ESPERA"
                              ? `Posição atual: ${currentReservation.posicaoListaEspera ?? 1}`
                              : "Reserva liberada para este aluno.")}
                          </div>
                          <Button
                            type="button"
                            variant={currentReservation ? "outline" : "default"}
                            onClick={() => handlePortalAction(session)}
                            disabled={actionDisabled || currentReservation?.status === "CHECKIN"}
                          >
                            {actionLabel}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
