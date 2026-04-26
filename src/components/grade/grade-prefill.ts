import type { AtividadeGrade, DiaSemana } from "@/lib/types";

export function timeToMin(time: string): number {
  const [hh, mm] = time.split(":").map(Number);
  return (hh || 0) * 60 + (mm || 0);
}

export function minToTime(total: number): string {
  const safe = Math.max(0, total);
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}

/**
 * Constrói um AtividadeGrade pré-preenchido (id="") pra usar no modal de criação
 * quando o usuário arrasta da paleta do compositor pro canvas.
 */
export function buildPrefillGrade(
  atividadeId: string,
  dia: DiaSemana,
  horaInicio: string,
): AtividadeGrade {
  const fim = timeToMin(horaInicio) + 60;
  return {
    id: "",
    tenantId: "",
    atividadeId,
    diasSemana: [dia],
    definicaoHorario: "PREVIAMENTE",
    horaInicio,
    horaFim: minToTime(fim),
    capacidade: 20,
    duracaoMinutos: 60,
    checkinLiberadoMinutosAntes: 60,
    acessoClientes: "TODOS_CLIENTES",
    permiteReserva: true,
    limitarVagasAgregadores: false,
    exibirWellhub: false,
    permitirSaidaAntesInicio: false,
    permitirEscolherNumeroVaga: false,
    exibirNoAppCliente: true,
    exibirNoAutoatendimento: false,
    exibirNoWodTv: false,
    finalizarAtividadeAutomaticamente: true,
    desabilitarListaEspera: false,
    ativo: true,
  };
}
