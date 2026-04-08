"use client";

import { useMemo, useState } from "react";
import { 
  CalendarDays, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  Users, 
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { getBusinessTodayDate, getBusinessTodayIso } from "@/lib/business-date";
import type { AulaSessao, ReservaAula, DiaSemana } from "@/lib/types";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { 
  useAulasAgenda, 
  useMinhasReservas, 
  useReservarAula, 
  useCancelarReserva 
} from "@/lib/query/use-portal-aluno";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { formatDayDate, toIsoDate, addDays, startOfWeek } from "@/lib/utils/date";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";

const DIA_ORDER: DiaSemana[] = ["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"];
const DIA_LABEL: Record<DiaSemana, string> = {
  SEG: "Segunda",
  TER: "Terça",
  QUA: "Quarta",
  QUI: "Quinta",
  SEX: "Sexta",
  SAB: "Sábado",
  DOM: "Domingo",
};

export function MinhasAulasClient() {
  const { tenantId, userId, tenantResolved } = useTenantContext();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(getBusinessTodayDate()));
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const dateFrom = useMemo(() => toIsoDate(weekStart), [weekStart]);
  const dateTo = useMemo(() => toIsoDate(addDays(weekStart, 6)), [weekStart]);

  const { 
    data: aulas = [], 
    isLoading: loadingAulas,
    isError: isErrorAulas 
  } = useAulasAgenda({
    tenantId,
    tenantResolved,
    dateFrom,
    dateTo
  });

  const { 
    data: reservas = [], 
    isLoading: loadingReservas 
  } = useMinhasReservas({
    tenantId,
    tenantResolved,
    userId
  });

  const reservarMutation = useReservarAula();
  const cancelarMutation = useCancelarReserva();

  const todayIso = getBusinessTodayIso(new Date());

  const aulasByDay = useMemo(() => {
    const grouped: Record<string, AulaSessao[]> = {};
    aulas.forEach(aula => {
      if (!grouped[aula.data]) grouped[aula.data] = [];
      grouped[aula.data].push(aula);
    });
    return grouped;
  }, [aulas]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, idx) => {
      const date = addDays(weekStart, idx);
      const iso = toIsoDate(date);
      return {
        dia: DIA_ORDER[idx],
        date,
        isoDate: iso,
        isToday: iso === todayIso
      };
    });
  }, [weekStart, todayIso]);

  const handleReservar = (aula: AulaSessao) => {
    if (!tenantId || !userId) return;
    
    confirm(`Deseja reservar a aula de ${aula.atividadeNome}?`, async () => {
      await reservarMutation.mutateAsync({
        tenantId,
        alunoId: userId,
        atividadeGradeId: aula.atividadeGradeId!,
        data: aula.data
      });
    });
  };

  const handleCancelar = (reserva: ReservaAula) => {
    if (!tenantId) return;
    
    confirm(`Deseja cancelar sua reserva para ${reserva.atividadeNome}?`, async () => {
      await cancelarMutation.mutateAsync({
        tenantId,
        id: reserva.id
      });
    });
  };

  const isPending = reservarMutation.isPending || cancelarMutation.isPending;

  return (
    <div className="space-y-8 py-6">
      {ConfirmDialog}
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
              <CalendarDays className="size-5 text-primary" />
            </div>
            <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5">Grade Semanal</Badge>
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Minhas Aulas</h1>
          <p className="mt-1 text-muted-foreground font-medium">Reserve seu lugar nas atividades da semana.</p>
        </motion.div>

        <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-xl border border-border/40 backdrop-blur-sm">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" onClick={() => setWeekStart(d => addDays(d, -7))}>
            <ChevronLeft size={18} />
          </Button>
          <div className="px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground min-w-[180px] text-center">
            {formatDayDate(weekDays[0].date)} - {formatDayDate(weekDays[6].date)}
          </div>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" onClick={() => setWeekStart(d => addDays(d, 7))}>
            <ChevronRight size={18} />
          </Button>
        </div>
      </div>

      <div className="space-y-10">
        {weekDays.map((day, dayIdx) => {
          const dayAulas = aulasByDay[day.isoDate] ?? [];
          if (dayAulas.length === 0 && !day.isToday) return null;

          return (
            <section key={day.isoDate} className="space-y-4">
              <div className="flex items-center gap-3 px-1">
                <h2 className={cn(
                  "font-display text-xl font-bold tracking-tight",
                  day.isToday ? "text-primary" : "text-foreground"
                )}>
                  {DIA_LABEL[day.dia]}, {day.date.getDate()} de {day.date.toLocaleDateString("pt-BR", { month: "long" })}
                </h2>
                {day.isToday && (
                  <Badge className="bg-primary text-primary-foreground font-bold text-[10px] uppercase tracking-widest">Hoje</Badge>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {loadingAulas ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted/20 border border-border/40" />
                  ))
                ) : dayAulas.length === 0 ? (
                  <div className="md:col-span-2 rounded-2xl border-2 border-dashed border-border/60 p-8 text-center bg-muted/5">
                    <p className="text-sm text-muted-foreground font-medium">Nenhuma aula programada para este dia.</p>
                  </div>
                ) : (
                  dayAulas.map((aula, i) => {
                    const minhaReserva = reservas.find(r => r.sessaoId === aula.id && r.status !== "CANCELADA");
                    const isBooked = !!minhaReserva;
                    const isWaitlist = minhaReserva?.status === "LISTA_ESPERA";
                    
                    return (
                      <motion.div
                        key={aula.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={cn(
                          "glass-card group relative rounded-2xl border border-border/40 p-5 transition-all hover:shadow-xl hover:shadow-primary/5",
                          isBooked && "border-primary/30 bg-primary/[0.02]"
                        )}
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-3 flex-1">
                            <div className="space-y-1">
                              <h3 className="font-bold text-lg leading-tight tracking-tight group-hover:text-primary transition-colors">
                                {aula.atividadeNome}
                              </h3>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                                <span className="flex items-center gap-1">
                                  <Clock size={14} className="text-primary/60" />
                                  {aula.horaInicio} - {aula.horaFim}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin size={14} className="text-primary/60" />
                                  {aula.salaNome || aula.local || "Unidade"}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {isBooked ? (
                                <Badge className={cn(
                                  "font-bold text-[10px] uppercase tracking-widest",
                                  isWaitlist ? "bg-amber-500 text-amber-950" : "bg-gym-teal text-gym-teal-foreground"
                                )}>
                                  {isWaitlist ? `Em espera (#${minhaReserva.posicaoListaEspera})` : "Confirmada"}
                                </Badge>
                              ) : (
                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                  <Users size={12} />
                                  {aula.vagasDisponiveis > 0 
                                    ? `${aula.vagasDisponiveis} vagas livres`
                                    : aula.listaEsperaHabilitada 
                                      ? `${aula.waitlistTotal} em espera`
                                      : "Aula lotada"
                                  }
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0 flex flex-col gap-2">
                            {isBooked ? (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="rounded-xl border-gym-danger/30 text-gym-danger hover:bg-gym-danger/10 font-bold h-9"
                                onClick={() => handleCancelar(minhaReserva)}
                                disabled={isPending}
                              >
                                Cancelar
                              </Button>
                            ) : (
                              <Button 
                                size="sm" 
                                className="rounded-xl font-bold h-9 shadow-lg shadow-primary/10"
                                onClick={() => handleReservar(aula)}
                                disabled={isPending || (aula.vagasDisponiveis <= 0 && !aula.listaEsperaHabilitada)}
                              >
                                {aula.vagasDisponiveis > 0 ? "Reservar" : "Entrar em Espera"}
                              </Button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </section>
          );
        })}
      </div>

      <div className="glass-card rounded-2xl border border-border/40 p-5 flex items-start gap-4 bg-muted/5">
        <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
          <AlertTriangle size={20} />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold tracking-tight text-foreground">Informações de Reserva</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            As reservas podem ser feitas com até 7 dias de antecedência. 
            Em caso de desistência, cancele com pelo menos 1 hora de antecedência para liberar a vaga para outro aluno.
          </p>
        </div>
      </div>
    </div>
  );
}
