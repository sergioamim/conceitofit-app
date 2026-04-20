import type { Aluno } from "@/lib/shared/types";

/**
 * Heurística determinística de Risco de Evasão (Perfil v3 — Wave 3, AC3.5-3.9).
 *
 * Sem ML. Sem endpoint novo. Calcula um score 0-100 a partir de sinais
 * observáveis já presentes no payload de `useClienteWorkspace`. Fórmula
 * versionada abaixo; mudanças exigem PR com justificativa e atualização
 * dos testes em `tests/unit/risco-evasao.test.ts`.
 *
 * Fatores habilitados nesta versão:
 *   +50  Cliente suspenso
 *   +40  Contrato vencido
 *   +30  Frequência mensal < 3 treinos
 *   +25  Última visita > 10 dias
 *   +20  Pendência financeira ativa
 *   +10  Contrato vence em <= 14 dias
 *   -15  Frequência mensal >= 12 treinos
 *
 * Fatores desabilitados (omitidos conforme AC3.8 — dado ausente):
 *   Avaliação física vencida (+10)
 *   NPS <= 6 (+5)
 *   NPS >= 9 (-15)
 *
 * Estado "sem dados suficientes" é retornado quando menos de 2 fatores
 * puderam ser avaliados.
 */
export const RISCO_VERSION = "v1.0-2026-04-20";

export type RiscoLabel = "Baixo" | "Médio" | "Alto";

export type FatorSinal = "positivo" | "negativo";

export interface FatorRisco {
  key: string;
  label: string;
  peso: number;
  sinal: FatorSinal;
}

export interface RiscoEvasao {
  score: number; // 0-100
  label: RiscoLabel;
  fatores: FatorRisco[]; // somente os que aplicaram, ordenados por peso decrescente
  temDadosSuficientes: boolean;
  version: string;
}

interface Pagamento {
  status: string;
  dataVencimento: string;
  valor?: number;
}

interface Presenca {
  data: string;
}

export interface RiscoEvasaoInput {
  aluno: Aluno;
  suspenso: boolean;
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
  return Math.floor((to.getTime() - from.getTime()) / 86400000);
}

function labelFor(score: number): RiscoLabel {
  if (score >= 70) return "Alto";
  if (score >= 40) return "Médio";
  return "Baixo";
}

function countTreinosNoMes(presencas: Presenca[], referencia: Date): number {
  const ano = referencia.getFullYear();
  const mes = referencia.getMonth();
  return presencas.filter((p) => {
    const d = parseLocalDate(p.data);
    return d.getFullYear() === ano && d.getMonth() === mes;
  }).length;
}

export function computeRiscoEvasao(input: RiscoEvasaoInput): RiscoEvasao {
  const hoje = input.hoje ?? new Date();
  const fatores: FatorRisco[] = [];

  // Cliente INATIVO ou CANCELADO: não calcula risco, retorna baixo sem fatores.
  if (input.aluno.status === "INATIVO" || input.aluno.status === "CANCELADO") {
    return {
      score: 0,
      label: "Baixo",
      fatores: [],
      temDadosSuficientes: false,
      version: RISCO_VERSION,
    };
  }

  // Fator: suspenso
  if (input.suspenso || input.aluno.status === "SUSPENSO") {
    fatores.push({ key: "suspenso", label: "Cliente suspenso", peso: 50, sinal: "negativo" });
  }

  // Fator: contrato vencido ou vencendo
  if (input.planoAtivo?.dataFim) {
    const fim = parseLocalDate(input.planoAtivo.dataFim);
    const dias = daysBetween(hoje, fim);
    if (dias < 0) {
      fatores.push({ key: "contrato-vencido", label: "Contrato vencido", peso: 40, sinal: "negativo" });
    } else if (dias <= 14) {
      fatores.push({
        key: "contrato-vence-logo",
        label: `Contrato vence em ${dias} dia${dias !== 1 ? "s" : ""}`,
        peso: 10,
        sinal: "negativo",
      });
    }
  }

  // Fator: pendência financeira ativa
  if (input.pendenteFinanceiro) {
    const vencidos = input.pagamentos.filter((p) => p.status === "VENCIDO").length;
    fatores.push({
      key: "pendencia",
      label: vencidos > 0
        ? `${vencidos} boleto${vencidos > 1 ? "s" : ""} vencido${vencidos > 1 ? "s" : ""}`
        : "Pendência financeira ativa",
      peso: 20,
      sinal: "negativo",
    });
  }

  // Fator: frequência mensal
  const treinosMes = countTreinosNoMes(input.presencas, hoje);
  if (treinosMes < 3) {
    fatores.push({
      key: "frequencia-baixa",
      label: `Apenas ${treinosMes} treino${treinosMes !== 1 ? "s" : ""} no mês`,
      peso: 30,
      sinal: "negativo",
    });
  } else if (treinosMes >= 12) {
    fatores.push({
      key: "frequencia-alta",
      label: `${treinosMes} treinos no mês`,
      peso: 15,
      sinal: "positivo",
    });
  }

  // Fator: dias desde última visita
  if (input.presencas.length > 0) {
    const ultima = input.presencas.reduce((latest, p) =>
      parseLocalDate(p.data) > parseLocalDate(latest.data) ? p : latest
    );
    const diasSemVisita = daysBetween(parseLocalDate(ultima.data), hoje);
    if (diasSemVisita > 10) {
      fatores.push({
        key: "sem-visita-recente",
        label: `Sem visita há ${diasSemVisita} dias`,
        peso: 25,
        sinal: "negativo",
      });
    }
  }

  // Score: soma positivos - soma negativos, clamp 0-100
  const somaNegativa = fatores
    .filter((f) => f.sinal === "negativo")
    .reduce((acc, f) => acc + f.peso, 0);
  const somaPositiva = fatores
    .filter((f) => f.sinal === "positivo")
    .reduce((acc, f) => acc + f.peso, 0);
  const score = Math.max(0, Math.min(100, somaNegativa - somaPositiva));

  // Ordena fatores por peso decrescente (mais impactante primeiro).
  fatores.sort((a, b) => b.peso - a.peso);

  return {
    score,
    label: labelFor(score),
    fatores,
    temDadosSuficientes: fatores.length >= 2,
    version: RISCO_VERSION,
  };
}

/**
 * Tendência semanal do score de risco ao longo das últimas 7 semanas,
 * usando frequência semanal como proxy (único fator com histórico local).
 * Se não houver presenças suficientes para cobrir a janela, retorna `null`
 * e o consumidor deve ocultar o sparkline (AC3.5).
 */
export function computeTendenciaRisco(input: {
  presencas: Presenca[];
  hoje?: Date;
}): number[] | null {
  const hoje = input.hoje ?? new Date();
  const semanas: number[] = [];

  for (let s = 6; s >= 0; s -= 1) {
    const fimSemana = new Date(hoje);
    fimSemana.setDate(fimSemana.getDate() - s * 7);
    const inicioSemana = new Date(fimSemana);
    inicioSemana.setDate(inicioSemana.getDate() - 6);

    const presencasSemana = input.presencas.filter((p) => {
      const d = parseLocalDate(p.data);
      return d >= inicioSemana && d <= fimSemana;
    }).length;

    // Proxy: 0 treinos/semana → score 60; 3+ treinos/semana → score 20.
    const score = Math.max(20, 60 - presencasSemana * 12);
    semanas.push(score);
  }

  // Se todas as semanas têm 0 presenças, não há sinal suficiente.
  const totalPresencas = input.presencas.length;
  if (totalPresencas === 0) return null;

  return semanas;
}
