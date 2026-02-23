import type { Atividade, ModoAssinaturaContrato, Plano, TipoPlano } from "@/lib/types";

export interface PlanoFormValues {
  nome: string;
  descricao: string;
  tipo: TipoPlano;
  duracaoDias: string;
  valor: string;
  valorMatricula: string;
  cobraAnuidade: boolean;
  valorAnuidade: string;
  parcelasMaxAnuidade: string;
  permiteRenovacaoAutomatica: boolean;
  permiteCobrancaRecorrente: boolean;
  diaCobrancaPadrao: string;
  contratoTemplateHtml: string;
  contratoAssinatura: ModoAssinaturaContrato;
  contratoEnviarAutomaticoEmail: boolean;
  atividades: string[];
  beneficios: string[];
  destaque: boolean;
  ordem: string;
}

export const TIPO_PLANO_LABEL: Record<TipoPlano, string> = {
  MENSAL: "Mensal",
  TRIMESTRAL: "Trimestral",
  SEMESTRAL: "Semestral",
  ANUAL: "Anual",
  AVULSO: "Avulso",
};

export function getDefaultPlanoFormValues(): PlanoFormValues {
  return {
    nome: "",
    descricao: "",
    tipo: "MENSAL",
    duracaoDias: "30",
    valor: "",
    valorMatricula: "0",
    cobraAnuidade: false,
    valorAnuidade: "0",
    parcelasMaxAnuidade: "1",
    permiteRenovacaoAutomatica: true,
    permiteCobrancaRecorrente: false,
    diaCobrancaPadrao: "",
    contratoTemplateHtml: "",
    contratoAssinatura: "AMBAS",
    contratoEnviarAutomaticoEmail: false,
    atividades: [],
    beneficios: [],
    destaque: false,
    ordem: "",
  };
}

export function planoToFormValues(plano: Plano): PlanoFormValues {
  return {
    nome: plano.nome,
    descricao: plano.descricao ?? "",
    tipo: plano.tipo,
    duracaoDias: String(plano.duracaoDias),
    valor: String(plano.valor),
    valorMatricula: String(plano.valorMatricula ?? 0),
    cobraAnuidade: plano.cobraAnuidade ?? false,
    valorAnuidade: String(plano.valorAnuidade ?? 0),
    parcelasMaxAnuidade: String(plano.parcelasMaxAnuidade ?? 1),
    permiteRenovacaoAutomatica: plano.permiteRenovacaoAutomatica,
    permiteCobrancaRecorrente: plano.permiteCobrancaRecorrente,
    diaCobrancaPadrao: plano.diaCobrancaPadrao ? String(plano.diaCobrancaPadrao) : "",
    contratoTemplateHtml: plano.contratoTemplateHtml ?? "",
    contratoAssinatura: plano.contratoAssinatura ?? "AMBAS",
    contratoEnviarAutomaticoEmail: plano.contratoEnviarAutomaticoEmail ?? false,
    atividades: plano.atividades ?? [],
    beneficios: plano.beneficios ?? [],
    destaque: plano.destaque,
    ordem: plano.ordem ? String(plano.ordem) : "",
  };
}

export function buildPlanoPayload(values: PlanoFormValues): Omit<Plano, "id" | "tenantId" | "ativo"> {
  return {
    nome: values.nome,
    descricao: values.descricao || undefined,
    tipo: values.tipo,
    duracaoDias: parseInt(values.duracaoDias, 10) || 0,
    valor: parseFloat(values.valor) || 0,
    valorMatricula: parseFloat(values.valorMatricula) || 0,
    cobraAnuidade: values.cobraAnuidade,
    valorAnuidade: values.cobraAnuidade ? parseFloat(values.valorAnuidade) || 0 : undefined,
    parcelasMaxAnuidade: values.cobraAnuidade ? Math.max(1, parseInt(values.parcelasMaxAnuidade, 10) || 1) : undefined,
    permiteRenovacaoAutomatica: values.tipo === "AVULSO" ? false : values.permiteRenovacaoAutomatica,
    permiteCobrancaRecorrente: values.tipo === "AVULSO" ? false : values.permiteCobrancaRecorrente,
    diaCobrancaPadrao:
      values.tipo === "AVULSO" || !values.permiteCobrancaRecorrente
        ? undefined
        : Math.min(28, Math.max(1, parseInt(values.diaCobrancaPadrao, 10) || 1)),
    contratoTemplateHtml: values.contratoTemplateHtml.trim() || undefined,
    contratoAssinatura: values.contratoAssinatura,
    contratoEnviarAutomaticoEmail: values.contratoEnviarAutomaticoEmail,
    atividades: values.atividades,
    beneficios: values.beneficios,
    destaque: values.destaque,
    ordem: values.ordem ? parseInt(values.ordem, 10) : undefined,
  };
}

export function isPlanoFormValid(values: PlanoFormValues) {
  return Boolean(values.nome && values.valor && values.duracaoDias);
}

export function filterAtividadesSelecionadas(atividades: Atividade[], selecionadas: string[]) {
  const ids = new Set(atividades.map((atividade) => atividade.id));
  return selecionadas.filter((id) => ids.has(id));
}
