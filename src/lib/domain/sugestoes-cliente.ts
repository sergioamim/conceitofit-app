import type { Aluno } from "@/lib/shared/types";

export type PrioridadeAcao = "alta" | "media" | "baixa";

export type TipoAcao =
  | "cobrar-pendencia"
  | "reativar-plano"
  | "renovar-plano"
  | "retencao-ativa"
  | "parabens-aniversario"
  | "liberar-acesso"
  | "solicitar-foto";

export interface SugestaoAcao {
  id: string;
  tipo: TipoAcao;
  prioridade: PrioridadeAcao;
  titulo: string;
  descricao: string;
  cta: string;
}

interface Pagamento {
  status: string;
  dataVencimento: string;
  valor?: number;
}

interface Presenca {
  data: string;
}

export interface SugestoesInput {
  aluno: Aluno;
  suspenso: boolean;
  acessoBloqueado: boolean;
  pendenteFinanceiro: boolean;
  planoAtivo?: { dataFim: string } | null;
  pagamentos: Pagamento[];
  presencas: Presenca[];
  hoje?: Date;
}

function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

function formatBRL(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function countTreinosNoMes(presencas: Presenca[], referencia: Date): number {
  const ano = referencia.getFullYear();
  const mes = referencia.getMonth();
  return presencas.filter((p) => {
    const d = parseLocalDate(p.data);
    return d.getFullYear() === ano && d.getMonth() === mes;
  }).length;
}

function diasAteAniversario(dataNascimento: string, hoje: Date): number | null {
  if (!dataNascimento) return null;
  const nasc = parseLocalDate(dataNascimento);
  const proximo = new Date(hoje.getFullYear(), nasc.getMonth(), nasc.getDate());
  if (proximo < new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())) {
    proximo.setFullYear(hoje.getFullYear() + 1);
  }
  return daysBetween(hoje, proximo);
}

const PRIORIDADE_ORDEM: Record<PrioridadeAcao, number> = {
  alta: 0,
  media: 1,
  baixa: 2,
};

/**
 * Calcula sugestões de próximas ações para o cliente a partir dos dados
 * observáveis no workspace. Determinístico, sem ML. Regras documentadas em
 * docs/PERFIL_CLIENTE_V3_ADOCAO_PRD.md §Wave 2 (AC2.3).
 */
export function computeSugestoesCliente(input: SugestoesInput): SugestaoAcao[] {
  const { aluno, suspenso, acessoBloqueado, pendenteFinanceiro, planoAtivo, pagamentos, presencas } = input;
  const hoje = input.hoje ?? new Date();
  const out: SugestaoAcao[] = [];

  // 1. Pendência financeira
  if (pendenteFinanceiro) {
    const vencidos = pagamentos.filter((p) => p.status === "VENCIDO");
    const total = vencidos.reduce((acc, p) => acc + (p.valor ?? 0), 0);
    out.push({
      id: "pendencia",
      tipo: "cobrar-pendencia",
      prioridade: "alta",
      titulo: "Cobrar pendência",
      descricao: total > 0
        ? `${vencidos.length} boleto${vencidos.length > 1 ? "s" : ""} vencido${vencidos.length > 1 ? "s" : ""} · ${formatBRL(total)}`
        : `${vencidos.length} boleto${vencidos.length > 1 ? "s" : ""} vencido${vencidos.length > 1 ? "s" : ""}`,
      cta: "Ver financeiro",
    });
  }

  // 2. Suspenso ou acesso bloqueado
  if (suspenso || aluno.status === "SUSPENSO") {
    out.push({
      id: "reativar",
      tipo: "reativar-plano",
      prioridade: "alta",
      titulo: "Cliente suspenso",
      descricao: "Reative para liberar acesso e retomar cobranças",
      cta: "Reativar",
    });
  } else if (acessoBloqueado) {
    out.push({
      id: "liberar-acesso",
      tipo: "liberar-acesso",
      prioridade: "alta",
      titulo: "Acesso bloqueado",
      descricao: "Cliente está com acesso bloqueado no sistema",
      cta: "Liberar",
    });
  }

  // 3. Contrato vence / vencido
  if (planoAtivo?.dataFim) {
    const fim = parseLocalDate(planoAtivo.dataFim);
    const dias = daysBetween(hoje, fim);
    if (dias < 0) {
      out.push({
        id: "contrato-vencido",
        tipo: "renovar-plano",
        prioridade: "alta",
        titulo: "Contrato vencido",
        descricao: `Venceu há ${-dias} dia${-dias !== 1 ? "s" : ""}`,
        cta: "Renovar",
      });
    } else if (dias <= 14) {
      out.push({
        id: "contrato-vence-logo",
        tipo: "renovar-plano",
        prioridade: "alta",
        titulo: "Renovar contrato",
        descricao: `Vence em ${dias} dia${dias !== 1 ? "s" : ""}`,
        cta: "Renovar",
      });
    } else if (dias <= 30) {
      out.push({
        id: "contrato-vence-30d",
        tipo: "renovar-plano",
        prioridade: "media",
        titulo: "Propor renovação",
        descricao: `Vence em ${dias} dias`,
        cta: "Propor",
      });
    }
  } else if (aluno.status === "ATIVO") {
    out.push({
      id: "sem-contrato",
      tipo: "renovar-plano",
      prioridade: "alta",
      titulo: "Cliente sem contrato ativo",
      descricao: "Ofereça um plano para manter o vínculo",
      cta: "Nova contratação",
    });
  }

  // 4. Retenção ativa por baixa frequência
  if (aluno.status === "ATIVO" && !suspenso && planoAtivo) {
    const treinosNoMes = countTreinosNoMes(presencas, hoje);
    if (treinosNoMes < 4) {
      out.push({
        id: "retencao-frequencia",
        tipo: "retencao-ativa",
        prioridade: "media",
        titulo: "Retenção ativa",
        descricao: `${treinosNoMes} treino${treinosNoMes !== 1 ? "s" : ""} neste mês · abordar via WhatsApp`,
        cta: "WhatsApp",
      });
    }
  }

  // 5. Aniversário nos próximos 30 dias
  const diasAniv = diasAteAniversario(aluno.dataNascimento, hoje);
  if (diasAniv !== null && diasAniv >= 0 && diasAniv <= 30) {
    out.push({
      id: "aniversario",
      tipo: "parabens-aniversario",
      prioridade: "baixa",
      titulo: diasAniv === 0 ? "Aniversário hoje" : `Aniversário em ${diasAniv} dia${diasAniv !== 1 ? "s" : ""}`,
      descricao: "Envie um mimo ou mensagem personalizada",
      cta: "Parabenizar",
    });
  }

  // 6. Cliente sem foto cadastrada
  // Nota: `fotoAptaCatraca` / `fotoMotivoInaptidao` deixaram de existir em
  // `Aluno` após a Task 458; só detectamos ausência total da foto agora.
  if (!aluno.foto) {
    out.push({
      id: "foto",
      tipo: "solicitar-foto",
      prioridade: "media",
      titulo: "Cliente sem foto",
      descricao: "Solicite nova foto para liberar acesso facial",
      cta: "Trocar foto",
    });
  }

  return out.sort((a, b) => PRIORIDADE_ORDEM[a.prioridade] - PRIORIDADE_ORDEM[b.prioridade]);
}
