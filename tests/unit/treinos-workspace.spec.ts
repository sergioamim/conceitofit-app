import { expect, test } from "@playwright/test";
import {
  assignTreinoTemplate,
  encerrarTreinoWorkspace,
  listTreinoExercicios,
  listTreinoGruposMusculares,
  listTreinoTemplatesWorkspace,
  listTreinosWorkspace,
  registrarExecucaoTreinoWorkspace,
  saveTreinoExercicio,
  saveTreinoGrupoMuscular,
  saveTreinoWorkspace,
  toggleTreinoExercicio,
} from "../../src/lib/tenant/treinos/workspace";

const TENANT_ID = "550e8400-e29b-41d4-a716-446655440001";
const ALUNO_ID = "al-s1-001";
const ALUNO_NOME = "Bianca Rocha";

const envSnapshot = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
  devAutoLogin: process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN,
};

type GrupoRecord = {
  id: string;
  tenantId: string;
  nome: string;
  descricao?: string;
  categoria?: "SUPERIOR" | "INFERIOR" | "CORE" | "FUNCIONAL" | "OUTRO";
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
};

type ExercicioRecord = {
  id: string;
  tenantId: string;
  nome: string;
  grupoMuscularId?: string;
  grupoMuscularNome?: string;
  descricao?: string;
  aparelho?: string;
  videoUrl?: string;
  unidade?: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
};

type TreinoRecord = {
  id: string;
  tenantId: string;
  clienteId?: string;
  clienteNome?: string;
  nome: string;
  objetivo?: string;
  divisao?: string;
  metaSessoesSemana?: number;
  frequenciaPlanejada?: number;
  quantidadePrevista?: number;
  dataInicio?: string;
  dataFim?: string;
  observacoes?: string;
  professorId?: string;
  professorNome?: string;
  status?: "ATIVO" | "ARQUIVADO" | "CANCELADO" | "RASCUNHO";
  tipoTreino?: "PRE_MONTADO" | "CUSTOMIZADO";
  treinoBaseId?: string;
  templateNome?: string;
  ativo: boolean;
  revisaoAtual?: number;
  ultimaRevisaoEm?: string;
  proximaRevisaoEm?: string;
  atribuidoEm?: string;
  encerradoEm?: string;
  renovadoDeTreinoId?: string;
  execucoesPrevistas?: number;
  execucoesConcluidas?: number;
  aderenciaPercentual?: number;
  itens?: Array<{
    id: string;
    treinoId: string;
    exercicioId: string;
    grupoMuscularId?: string;
    grupoMuscularNome?: string;
    exercicioNomeSnapshot?: string;
    ordem: number;
    series: number;
    repeticoes?: number;
    repeticoesMin?: number;
    repeticoesMax?: number;
    carga?: number;
    cargaSugerida?: number;
    intervaloSegundos?: number;
    tempoExecucaoSegundos?: number;
    observacao?: string;
    diaDaSemana?: string[];
    createdAt?: string;
    updatedAt?: string;
  }>;
  revisoes?: Array<{
    id: string;
    treinoId: string;
    tipo: "CRIACAO" | "REVISAO" | "RENOVACAO" | "ENCERRAMENTO" | "ATRIBUICAO";
    titulo: string;
    observacao?: string;
    createdAt: string;
  }>;
  execucoes?: Array<{
    id: string;
    treinoId: string;
    alunoId?: string;
    data: string;
    status: "CONCLUIDA" | "PARCIAL" | "PULADA";
    observacao?: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
};

type TreinoReviewRecord = NonNullable<TreinoRecord["revisoes"]>[number];

function installTreinosFetchMock() {
  const previousFetch = global.fetch;
  let sequence = 10;
  const now = "2026-03-12T09:00:00.000Z";

  const groups: GrupoRecord[] = [
    {
      id: "grp-1",
      tenantId: TENANT_ID,
      nome: "Posterior",
      categoria: "INFERIOR",
      ativo: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const exercises: ExercicioRecord[] = [
    {
      id: "ex-1",
      tenantId: TENANT_ID,
      nome: "Stiff Base",
      grupoMuscularId: "grp-1",
      grupoMuscularNome: "Posterior",
      aparelho: "Barra",
      unidade: "kg",
      ativo: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const treinos: TreinoRecord[] = [
    {
      id: "tpl-1",
      tenantId: TENANT_ID,
      nome: "Template Hipertrofia Base",
      templateNome: "Template Hipertrofia Base",
      objetivo: "Ganhos de força e volume.",
      divisao: "A",
      metaSessoesSemana: 4,
      frequenciaPlanejada: 4,
      quantidadePrevista: 16,
      dataInicio: "2026-03-10",
      dataFim: "2026-04-10",
      observacoes: "Template base da suíte.",
      professorId: "prof-1",
      professorNome: "Paula Lima",
      status: "ATIVO",
      tipoTreino: "PRE_MONTADO",
      ativo: true,
      revisaoAtual: 1,
      proximaRevisaoEm: "2026-03-24",
      itens: [
        {
          id: "item-1",
          treinoId: "tpl-1",
          exercicioId: "ex-1",
          exercicioNomeSnapshot: "Stiff Base",
          grupoMuscularId: "grp-1",
          grupoMuscularNome: "Posterior",
          ordem: 1,
          series: 3,
          repeticoesMin: 8,
          repeticoesMax: 12,
          intervaloSegundos: 45,
          createdAt: now,
          updatedAt: now,
        },
      ],
      revisoes: [
        {
          id: "rev-template-1",
          treinoId: "tpl-1",
          tipo: "CRIACAO",
          titulo: "Template criado",
          observacao: "Carga inicial.",
          createdAt: now,
        },
      ],
      execucoes: [],
      createdAt: now,
      updatedAt: now,
    },
  ];

  function nextId(prefix: string) {
    sequence += 1;
    return `${prefix}-${sequence}`;
  }

  function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }

  function getExerciseName(id: string) {
    return exercises.find((item) => item.id === id)?.nome;
  }

  function createReview(
    treinoId: string,
    tipo: TreinoReviewRecord["tipo"],
    titulo: string,
    observacao?: string
  ) {
    return {
      id: nextId("rev"),
      treinoId,
      tipo,
      titulo,
      observacao,
      createdAt: now,
    };
  }

  function refreshTreinoMetrics(treino: TreinoRecord): TreinoRecord {
    const execucoesConcluidas = (treino.execucoes ?? []).filter((item) => item.status === "CONCLUIDA").length;
    return {
      ...treino,
      revisaoAtual: treino.revisoes?.filter((item) => item.tipo === "REVISAO" || item.tipo === "RENOVACAO").length
        ? (treino.revisoes?.filter((item) => item.tipo === "REVISAO" || item.tipo === "RENOVACAO").length ?? 0) + 1
        : treino.revisaoAtual ?? 1,
      execucoesPrevistas: treino.quantidadePrevista,
      execucoesConcluidas,
      aderenciaPercentual: treino.quantidadePrevista
        ? Math.round((execucoesConcluidas / treino.quantidadePrevista) * 100)
        : 0,
      updatedAt: now,
    };
  }

  global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), "http://localhost");
    const path = url.pathname.startsWith("/backend/") ? url.pathname.slice("/backend".length) : url.pathname;
    const method = init?.method ?? "GET";
    const body = init?.body ? JSON.parse(String(init.body)) as Record<string, unknown> : null;

    if (path === "/api/v1/grupos-musculares" && method === "GET") {
      const ativo = url.searchParams.get("ativo");
      const search = url.searchParams.get("search")?.toLowerCase() ?? "";
      const rows = groups.filter((item) => {
        if (ativo === "true" && !item.ativo) return false;
        if (ativo === "false" && item.ativo) return false;
        if (!search) return true;
        return `${item.nome} ${item.descricao ?? ""}`.toLowerCase().includes(search);
      });
      return json(rows);
    }

    if (path === "/api/v1/grupos-musculares" && method === "POST") {
      const created: GrupoRecord = {
        id: nextId("grp"),
        tenantId: TENANT_ID,
        nome: String(body?.nome ?? ""),
        descricao: body?.descricao ? String(body.descricao) : undefined,
        categoria: (body?.categoria as GrupoRecord["categoria"]) ?? "OUTRO",
        ativo: body?.ativo !== false,
        createdAt: now,
        updatedAt: now,
      };
      groups.unshift(created);
      return json(created);
    }

    if (path.startsWith("/api/v1/grupos-musculares/") && method === "PUT") {
      const id = path.split("/")[4] ?? "";
      const current = groups.find((item) => item.id === id);
      if (!current) return json({ message: "Grupo não encontrado." }, 404);
      Object.assign(current, {
        nome: String(body?.nome ?? current.nome),
        descricao: body?.descricao ? String(body.descricao) : undefined,
        categoria: (body?.categoria as GrupoRecord["categoria"]) ?? current.categoria,
        updatedAt: now,
      });
      return json(current);
    }

    if (path.endsWith("/toggle") && path.startsWith("/api/v1/grupos-musculares/") && method === "PATCH") {
      const id = path.split("/")[4] ?? "";
      const current = groups.find((item) => item.id === id);
      if (!current) return json({ message: "Grupo não encontrado." }, 404);
      current.ativo = !current.ativo;
      current.updatedAt = now;
      return json(current);
    }

    if (path === "/api/v1/exercicios" && method === "GET") {
      const ativo = url.searchParams.get("ativo");
      const search = url.searchParams.get("search")?.toLowerCase() ?? "";
      const rows = exercises.filter((item) => {
        if (ativo === "true" && !item.ativo) return false;
        if (ativo === "false" && item.ativo) return false;
        if (!search) return true;
        return `${item.nome} ${item.grupoMuscularNome ?? ""} ${item.aparelho ?? ""}`.toLowerCase().includes(search);
      });
      return json(rows);
    }

    if (path === "/api/v1/exercicios" && method === "POST") {
      const group = groups.find((item) => item.id === body?.grupoMuscularId);
      const created: ExercicioRecord = {
        id: nextId("ex"),
        tenantId: TENANT_ID,
        nome: String(body?.nome ?? ""),
        descricao: body?.descricao ? String(body.descricao) : undefined,
        grupoMuscularId: body?.grupoMuscularId ? String(body.grupoMuscularId) : undefined,
        grupoMuscularNome: group?.nome ?? (body?.grupoMuscular ? String(body.grupoMuscular) : undefined),
        aparelho: body?.aparelho ? String(body.aparelho) : undefined,
        videoUrl: body?.videoUrl ? String(body.videoUrl) : undefined,
        unidade: body?.unidade ? String(body.unidade) : undefined,
        ativo: body?.ativo !== false,
        createdAt: now,
        updatedAt: now,
      };
      exercises.unshift(created);
      return json(created);
    }

    if (path.startsWith("/api/v1/exercicios/") && method === "PUT") {
      const id = path.split("/")[4] ?? "";
      const current = exercises.find((item) => item.id === id);
      if (!current) return json({ message: "Exercício não encontrado." }, 404);
      const group = groups.find((item) => item.id === body?.grupoMuscularId);
      Object.assign(current, {
        nome: String(body?.nome ?? current.nome),
        descricao: body?.descricao ? String(body.descricao) : undefined,
        grupoMuscularId: body?.grupoMuscularId ? String(body.grupoMuscularId) : undefined,
        grupoMuscularNome: group?.nome ?? (body?.grupoMuscular ? String(body.grupoMuscular) : current.grupoMuscularNome),
        aparelho: body?.aparelho ? String(body.aparelho) : undefined,
        videoUrl: body?.videoUrl ? String(body.videoUrl) : undefined,
        unidade: body?.unidade ? String(body.unidade) : undefined,
        updatedAt: now,
      });
      return json(current);
    }

    if (path.endsWith("/toggle") && path.startsWith("/api/v1/exercicios/") && method === "PATCH") {
      const id = path.split("/")[4] ?? "";
      const current = exercises.find((item) => item.id === id);
      if (!current) return json({ message: "Exercício não encontrado." }, 404);
      current.ativo = !current.ativo;
      current.updatedAt = now;
      return json(current);
    }

    if (path === "/api/v1/treinos" && method === "GET") {
      const tipoTreino = url.searchParams.get("tipoTreino");
      const clienteId = url.searchParams.get("clienteId");
      const search = url.searchParams.get("search")?.toLowerCase() ?? "";
      const items = treinos.filter((item) => {
        if (tipoTreino && item.tipoTreino !== tipoTreino) return false;
        if (clienteId && item.clienteId !== clienteId) return false;
        if (!search) return true;
        return `${item.nome} ${item.templateNome ?? ""} ${item.objetivo ?? ""}`.toLowerCase().includes(search);
      });
      return json({
        items,
        page: 0,
        size: items.length || 1,
        total: items.length,
        hasNext: false,
      });
    }

    if (path === "/api/v1/treinos/templates" && method === "GET") {
      const search = url.searchParams.get("search")?.toLowerCase() ?? "";
      const precisaRevisao = url.searchParams.get("precisaRevisao") === "true";
      const page = Number(url.searchParams.get("page") ?? "0");
      const size = Number(url.searchParams.get("size") ?? "20");
      const source = treinos
        .filter((item) => item.tipoTreino === "PRE_MONTADO")
        .filter((item) => {
          if (precisaRevisao && item.status === "ATIVO") return false;
          if (!search) return true;
          return `${item.nome} ${item.templateNome ?? ""} ${item.professorNome ?? ""}`.toLowerCase().includes(search);
        });

      const items = source.slice(page * size, page * size + size).map((item) => ({
        id: item.id,
        nome: item.templateNome ?? item.nome,
        professorId: item.professorId,
        professorNome: item.professorNome,
        status: item.status === "ATIVO" ? "PUBLICADO" : item.status === "RASCUNHO" ? "EM_REVISAO" : item.status,
        frequenciaSemanal: item.frequenciaPlanejada,
        totalSemanas:
          item.quantidadePrevista && item.frequenciaPlanejada
            ? Math.max(1, Math.ceil(item.quantidadePrevista / item.frequenciaPlanejada))
            : undefined,
        categoria: "Hipertrofia",
        perfilIndicacao: "INTERMEDIARIO",
        versaoTemplate: item.revisaoAtual ?? 1,
        precisaRevisao: item.status !== "ATIVO",
        pendenciasAbertas: item.status !== "ATIVO" ? 1 : 0,
        atualizadoEm: item.updatedAt,
      }));

      return json({
        items,
        page,
        size,
        total: source.length,
        hasNext: (page + 1) * size < source.length,
        totais: {
          totalTemplates: source.length,
          publicados: source.filter((item) => item.status === "ATIVO").length,
          emRevisao: source.filter((item) => item.status === "RASCUNHO").length,
          comPendencias: source.filter((item) => item.status !== "ATIVO").length,
        },
      });
    }

    if (path === "/api/v1/treinos" && method === "POST") {
      const createdId = nextId("trn");
      const created: TreinoRecord = refreshTreinoMetrics({
        id: createdId,
        tenantId: TENANT_ID,
        clienteId: body?.clienteId ? String(body.clienteId) : undefined,
        clienteNome: body?.clienteId === ALUNO_ID ? ALUNO_NOME : undefined,
        nome: String(body?.nome ?? "Treino"),
        objetivo: body?.objetivo ? String(body.objetivo) : undefined,
        divisao: body?.divisao ? String(body.divisao) : undefined,
        metaSessoesSemana: body?.metaSessoesSemana ? Number(body.metaSessoesSemana) : undefined,
        frequenciaPlanejada: body?.frequenciaPlanejada ? Number(body.frequenciaPlanejada) : undefined,
        quantidadePrevista: body?.quantidadePrevista ? Number(body.quantidadePrevista) : undefined,
        dataInicio: body?.dataInicio ? String(body.dataInicio) : undefined,
        dataFim: body?.dataFim ? String(body.dataFim) : undefined,
        observacoes: body?.observacoes ? String(body.observacoes) : undefined,
        professorId: body?.professorId ? String(body.professorId) : undefined,
        status: (body?.status as TreinoRecord["status"]) ?? "ATIVO",
        tipoTreino: (body?.tipoTreino as TreinoRecord["tipoTreino"]) ?? "CUSTOMIZADO",
        treinoBaseId: body?.treinoBaseId ? String(body.treinoBaseId) : undefined,
        templateNome: body?.templateNome ? String(body.templateNome) : undefined,
        ativo: body?.ativo !== false,
        revisaoAtual: 1,
        proximaRevisaoEm: "2026-03-24",
        itens: Array.isArray(body?.itens)
          ? body?.itens.map((item, index) => ({
              id: nextId("item"),
              treinoId: createdId,
              exercicioId: String((item as Record<string, unknown>).exercicioId),
              exercicioNomeSnapshot: getExerciseName(String((item as Record<string, unknown>).exercicioId)),
              grupoMuscularId: exercises.find((entry) => entry.id === String((item as Record<string, unknown>).exercicioId))?.grupoMuscularId,
              grupoMuscularNome: exercises.find((entry) => entry.id === String((item as Record<string, unknown>).exercicioId))?.grupoMuscularNome,
              ordem: Number((item as Record<string, unknown>).ordem ?? index + 1),
              series: Number((item as Record<string, unknown>).series ?? 3),
              repeticoes: (item as Record<string, unknown>).repeticoes ? Number((item as Record<string, unknown>).repeticoes) : undefined,
              repeticoesMin: (item as Record<string, unknown>).repeticoesMin ? Number((item as Record<string, unknown>).repeticoesMin) : undefined,
              repeticoesMax: (item as Record<string, unknown>).repeticoesMax ? Number((item as Record<string, unknown>).repeticoesMax) : undefined,
              carga: (item as Record<string, unknown>).carga ? Number((item as Record<string, unknown>).carga) : undefined,
              cargaSugerida: (item as Record<string, unknown>).cargaSugerida ? Number((item as Record<string, unknown>).cargaSugerida) : undefined,
              intervaloSegundos: (item as Record<string, unknown>).intervaloSegundos ? Number((item as Record<string, unknown>).intervaloSegundos) : undefined,
              tempoExecucaoSegundos: (item as Record<string, unknown>).tempoExecucaoSegundos ? Number((item as Record<string, unknown>).tempoExecucaoSegundos) : undefined,
              observacao: (item as Record<string, unknown>).observacao ? String((item as Record<string, unknown>).observacao) : undefined,
              diaDaSemana: ((item as Record<string, unknown>).diaDaSemana ?? (item as Record<string, unknown>).diasSemana) as string[] | undefined,
              createdAt: now,
              updatedAt: now,
            }))
          : [],
        revisoes: [createReview(createdId, "CRIACAO", "Treino criado", body?.observacoes ? String(body.observacoes) : undefined)],
        execucoes: [],
        createdAt: now,
        updatedAt: now,
      });
      treinos.unshift(created);
      return json(created);
    }

    if (path.startsWith("/api/v1/treinos/") && method === "GET") {
      const id = path.split("/")[4] ?? "";
      const current = treinos.find((item) => item.id === id);
      if (!current) return json({ message: "Treino não encontrado." }, 404);
      return json(current);
    }

    if (path.startsWith("/api/v1/treinos/") && method === "PUT") {
      const id = path.split("/")[4] ?? "";
      const current = treinos.find((item) => item.id === id);
      if (!current) return json({ message: "Treino não encontrado." }, 404);
      Object.assign(current, refreshTreinoMetrics({
        ...current,
        clienteId: body?.clienteId ? String(body.clienteId) : current.clienteId,
        nome: String(body?.nome ?? current.nome),
        objetivo: body?.objetivo ? String(body.objetivo) : current.objetivo,
        divisao: body?.divisao ? String(body.divisao) : current.divisao,
        metaSessoesSemana: body?.metaSessoesSemana ? Number(body.metaSessoesSemana) : current.metaSessoesSemana,
        frequenciaPlanejada: body?.frequenciaPlanejada ? Number(body.frequenciaPlanejada) : current.frequenciaPlanejada,
        quantidadePrevista: body?.quantidadePrevista ? Number(body.quantidadePrevista) : current.quantidadePrevista,
        dataInicio: body?.dataInicio ? String(body.dataInicio) : current.dataInicio,
        dataFim: body?.dataFim ? String(body.dataFim) : current.dataFim,
        observacoes: body?.observacoes ? String(body.observacoes) : current.observacoes,
        status: (body?.status as TreinoRecord["status"]) ?? current.status,
        tipoTreino: (body?.tipoTreino as TreinoRecord["tipoTreino"]) ?? current.tipoTreino,
        treinoBaseId: body?.treinoBaseId ? String(body.treinoBaseId) : current.treinoBaseId,
        templateNome: body?.templateNome ? String(body.templateNome) : current.templateNome,
        ativo: body?.ativo !== false,
      }));
      return json(current);
    }

    if (path.endsWith("/atribuir") && method === "POST") {
      const templateId = path.split("/").at(-2) ?? "";
      const template = treinos.find((item) => item.id === templateId);
      if (!template) return json({ message: "Template não encontrado." }, 404);
      const createdId = nextId("trn");
      const created = refreshTreinoMetrics({
        ...template,
        id: createdId,
        clienteId: String(body?.clienteId ?? ALUNO_ID),
        clienteNome: ALUNO_NOME,
        tipoTreino: "CUSTOMIZADO",
        treinoBaseId: template.id,
        templateNome: template.templateNome ?? template.nome,
        dataInicio: body?.dataInicio ? String(body.dataInicio) : template.dataInicio,
        dataFim: body?.dataFim ? String(body.dataFim) : template.dataFim,
        observacoes: body?.observacoes ? String(body.observacoes) : template.observacoes,
        metaSessoesSemana: body?.metaSessoesSemana ? Number(body.metaSessoesSemana) : template.metaSessoesSemana,
        frequenciaPlanejada: body?.frequenciaSemanal ? Number(body.frequenciaSemanal) : template.frequenciaPlanejada,
        quantidadePrevista:
          body?.totalSemanas && body?.frequenciaSemanal
            ? Number(body.totalSemanas) * Number(body.frequenciaSemanal)
            : template.quantidadePrevista,
        atribuidoEm: now,
        revisoes: [...(template.revisoes ?? []), createReview(createdId, "ATRIBUICAO", "Template atribuído", "Atribuição via API")],
        itens: (template.itens ?? []).map((item) => ({ ...item, id: nextId("item"), treinoId: createdId })),
        execucoes: [],
        createdAt: now,
        updatedAt: now,
      });
      treinos.unshift(created);
      return json(created);
    }

    if (path.endsWith("/duplicar-template") && method === "POST") {
      const templateId = path.split("/")[4] ?? "";
      const template = treinos.find((item) => item.id === templateId);
      if (!template) return json({ message: "Template não encontrado." }, 404);
      const duplicated: TreinoRecord = {
        ...template,
        id: nextId("tpl"),
        nome: `${template.nome} (cópia)`,
        templateNome: `${template.templateNome ?? template.nome} v2`,
        itens: (template.itens ?? []).map((item) => ({ ...item, id: nextId("item"), treinoId: nextId("tpl-shadow") })),
        createdAt: now,
        updatedAt: now,
      };
      treinos.unshift(duplicated);
      return json(duplicated);
    }

    if (path.endsWith("/revisar") && method === "POST") {
      const id = path.split("/")[4] ?? "";
      const current = treinos.find((item) => item.id === id);
      if (!current) return json({ message: "Treino não encontrado." }, 404);
      current.revisoes = [...(current.revisoes ?? []), createReview(id, "REVISAO", "Treino revisado", body?.observacao ? String(body.observacao) : undefined)];
      current.ultimaRevisaoEm = now;
      current.updatedAt = now;
      return json(refreshTreinoMetrics(current));
    }

    if (path.endsWith("/encerrar-ciclo") && method === "POST") {
      const id = path.split("/")[4] ?? "";
      const current = treinos.find((item) => item.id === id);
      if (!current) return json({ message: "Treino não encontrado." }, 404);
      current.ativo = false;
      current.status = "ARQUIVADO";
      current.encerradoEm = now;
      current.revisoes = [...(current.revisoes ?? []), createReview(id, "ENCERRAMENTO", "Treino encerrado", body?.observacao ? String(body.observacao) : undefined)];
      current.updatedAt = now;
      return json(refreshTreinoMetrics(current));
    }

    if (path.endsWith("/renovar") && method === "PATCH") {
      const id = path.split("/")[4] ?? "";
      const current = treinos.find((item) => item.id === id);
      if (!current) return json({ message: "Treino não encontrado." }, 404);
      const createdId = nextId("trn");
      const renewed = refreshTreinoMetrics({
        ...current,
        id: createdId,
        ativo: true,
        status: "ATIVO",
        renovadoDeTreinoId: current.id,
        tipoTreino: "CUSTOMIZADO",
        dataInicio: "2026-03-12",
        dataFim: "2026-04-11",
        revisoes: [...(current.revisoes ?? []), createReview(createdId, "RENOVACAO", "Ciclo renovado", "Renovação via API")],
        itens: (current.itens ?? []).map((item) => ({ ...item, id: nextId("item"), treinoId: createdId })),
        createdAt: now,
        updatedAt: now,
      });
      treinos.unshift(renewed);
      return json(renewed);
    }

    if (path.endsWith("/execucoes") && method === "POST") {
      const id = path.split("/")[4] ?? "";
      const current = treinos.find((item) => item.id === id);
      if (!current) return json({ message: "Treino não encontrado." }, 404);
      current.execucoes = [
        ...(current.execucoes ?? []),
        {
          id: nextId("exe"),
          treinoId: id,
          alunoId: current.clienteId,
          data: "2026-03-12",
          status: (body?.status as "CONCLUIDA" | "PARCIAL" | "PULADA") ?? "CONCLUIDA",
          observacao: body?.observacao ? String(body.observacao) : undefined,
          createdAt: now,
        },
      ];
      current.updatedAt = now;
      return json(refreshTreinoMetrics(current));
    }

    throw new Error(`Unexpected fetch ${method} ${url.pathname}${url.search}`);
  }) as typeof global.fetch;

  return {
    restore() {
      global.fetch = previousFetch;
    },
  };
}

test.describe("treinos workspace", () => {
  test.beforeEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "";
    process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN = "false";
  });

  test.afterEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = envSnapshot.apiBaseUrl;
    process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN = envSnapshot.devAutoLogin;
  });

  test("mantém catálogo canônico de grupos musculares e exercícios", async () => {
    const { restore } = installTreinosFetchMock();
    try {
      const stamp = Date.now();
      const grupo = await saveTreinoGrupoMuscular({
        tenantId: TENANT_ID,
        nome: `Posterior QA ${stamp}`,
        categoria: "INFERIOR",
        descricao: "Grupo criado pela suíte unitária.",
      });

      const grupos = await listTreinoGruposMusculares({ tenantId: TENANT_ID });
      expect(grupos.some((item) => item.id === grupo.id && item.nome.includes(`Posterior QA ${stamp}`))).toBeTruthy();

      const exercicio = await saveTreinoExercicio({
        tenantId: TENANT_ID,
        nome: `Stiff QA ${stamp}`,
        grupoMuscularId: grupo.id,
        equipamento: "Barra",
        unidade: "kg",
        descricao: "Exercício vinculado ao grupo canônico.",
      });

      expect(exercicio.grupoMuscularId).toBe(grupo.id);
      expect(exercicio.grupoMuscularNome).toBe(grupo.nome);

      const toggled = await toggleTreinoExercicio({ tenantId: TENANT_ID, id: exercicio.id });
      expect(toggled.ativo).toBeFalsy();
    } finally {
      restore();
    }
  });

  test("atribui template e recalcula revisão e aderência do ciclo", async () => {
    const { restore } = installTreinosFetchMock();
    try {
      const templates = await listTreinosWorkspace({
        tenantId: TENANT_ID,
        tipoTreino: "PRE_MONTADO",
        page: 0,
        size: 20,
      });
      const template = templates.items[0];

      expect(template).toBeTruthy();

      const assigned = await assignTreinoTemplate({
        tenantId: TENANT_ID,
        templateId: template.id,
        alunoId: ALUNO_ID,
        alunoNome: ALUNO_NOME,
        dataInicio: "2026-03-10",
        dataFim: "2026-04-10",
        metaSessoesSemana: 4,
        frequenciaPlanejada: 4,
        quantidadePrevista: 16,
        observacoes: "Atribuição unitária do template.",
      });

      expect(assigned.tipoTreino).toBe("CUSTOMIZADO");
      expect(assigned.treinoBaseId).toBe(template.id);
      expect(assigned.revisoes?.some((item) => item.tipo === "ATRIBUICAO")).toBeTruthy();

      const executed = await registrarExecucaoTreinoWorkspace({
        tenantId: TENANT_ID,
        id: assigned.id,
        observacao: "Execução integral do treino.",
        status: "CONCLUIDA",
      });
      expect(executed.execucoesConcluidas).toBeGreaterThan(assigned.execucoesConcluidas ?? 0);
      expect((executed.aderenciaPercentual ?? 0) > 0).toBeTruthy();
    } finally {
      restore();
    }
  });

  test("lista templates resumidos pelo endpoint canônico", async () => {
    const { restore } = installTreinosFetchMock();
    try {
      const templates = await listTreinoTemplatesWorkspace({
        tenantId: TENANT_ID,
        page: 0,
        size: 20,
      });

      expect(templates.items).toHaveLength(1);
      expect(templates.items[0].nome).toBe("Template Hipertrofia Base");
      expect(templates.items[0].status).toBe("PUBLICADO");
      expect(templates.items[0].versaoTemplate).toBe(1);
      expect(templates.totais.totalTemplates).toBe(1);
      expect(templates.totais.publicados).toBe(1);
      expect(templates.totais.comPendencias).toBe(0);
    } finally {
      restore();
    }
  });

  test("atribui template pelo nome quando o id não está sincronizado", async () => {
    const { restore } = installTreinosFetchMock();
    try {
      const templates = await listTreinosWorkspace({
        tenantId: TENANT_ID,
        tipoTreino: "PRE_MONTADO",
        page: 0,
        size: 20,
      });
      const template = templates.items[0];

      expect(template).toBeTruthy();

      const assigned = await assignTreinoTemplate({
        tenantId: TENANT_ID,
        templateId: "template-inexistente",
        templateName: template.templateNome ?? template.nome,
        alunoId: ALUNO_ID,
        alunoNome: ALUNO_NOME,
        dataInicio: "2026-03-10",
        dataFim: "2026-04-10",
      });

      expect(assigned.tipoTreino).toBe("CUSTOMIZADO");
      expect(assigned.treinoBaseId).toBe(template.id);
    } finally {
      restore();
    }
  });

  test("encerra e renova um ciclo customizado preservando rastreabilidade", async () => {
    const { restore } = installTreinosFetchMock();
    try {
      const exercicios = await listTreinoExercicios({ tenantId: TENANT_ID, ativo: true });
      const exercicio = exercicios[0];
      const stamp = Date.now();

      expect(exercicio).toBeTruthy();

      const created = await saveTreinoWorkspace({
        tenantId: TENANT_ID,
        alunoId: ALUNO_ID,
        alunoNome: ALUNO_NOME,
        nome: `Treino QA ${stamp}`,
        objetivo: "Validação de encerramento e renovação.",
        divisao: "C",
        metaSessoesSemana: 3,
        frequenciaPlanejada: 3,
        quantidadePrevista: 12,
        dataInicio: "2026-03-01",
        dataFim: "2026-03-31",
        observacoes: "Treino criado pela suíte unitária.",
        tipoTreino: "CUSTOMIZADO",
        ativo: true,
        itens: [
          {
            id: "",
            treinoId: "",
            exercicioId: exercicio.id,
            exercicioNome: exercicio.nome,
            grupoMuscularId: exercicio.grupoMuscularId,
            grupoMuscularNome: exercicio.grupoMuscularNome ?? exercicio.grupoMuscular,
            ordem: 1,
            series: 3,
            repeticoesMin: 10,
            repeticoesMax: 12,
            intervaloSegundos: 45,
          },
        ],
      });

      const encerrado = await encerrarTreinoWorkspace({
        tenantId: TENANT_ID,
        id: created.id,
        observacao: "Ciclo encerrado para renovação.",
      });
      expect(encerrado.ativo).toBeFalsy();
      expect(encerrado.statusCiclo).toBe("ENCERRADO");
    } finally {
      restore();
    }
  });
});
