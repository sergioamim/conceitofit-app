import type {
  Atividade,
  Aluno,
  Plano,
  FormaPagamento,
  Prospect,
  Matricula,
  Pagamento,
} from "../types";

const TENANT_ID = "550e8400-e29b-41d4-a716-446655440000";

interface Store {
  atividades: Atividade[];
  planos: Plano[];
  formasPagamento: FormaPagamento[];
  prospects: Prospect[];
  alunos: Aluno[];
  matriculas: Matricula[];
  pagamentos: Pagamento[];
}

function makeInitialStore(): Store {
  const atividades: Atividade[] = [
    { id: "atv-001", tenantId: TENANT_ID, nome: "Musculação", categoria: "MUSCULACAO", icone: "💪", cor: "#FF5733", ativo: true },
    { id: "atv-002", tenantId: TENANT_ID, nome: "Spinning", categoria: "CARDIO", icone: "🚴", cor: "#33A1FF", ativo: true },
    { id: "atv-003", tenantId: TENANT_ID, nome: "Yoga", categoria: "COLETIVA", icone: "🧘", cor: "#9B59B6", ativo: true },
    { id: "atv-004", tenantId: TENANT_ID, nome: "Muay Thai", categoria: "LUTA", icone: "🥊", cor: "#E74C3C", ativo: true },
    { id: "atv-005", tenantId: TENANT_ID, nome: "Funcional", categoria: "COLETIVA", icone: "🏋️", cor: "#2ECC71", ativo: true },
    { id: "atv-006", tenantId: TENANT_ID, nome: "Natação", categoria: "AQUATICA", icone: "🏊", cor: "#3498DB", ativo: true },
    { id: "atv-007", tenantId: TENANT_ID, nome: "Pilates", categoria: "COLETIVA", icone: "🤸", cor: "#F39C12", ativo: true },
  ];

  const planos: Plano[] = [
    {
      id: "pln-001",
      tenantId: TENANT_ID,
      nome: "Mensal Básico",
      tipo: "MENSAL",
      valor: 99.90,
      valorMatricula: 50.00,
      duracaoDias: 30,
      destaque: false,
      ativo: true,
      beneficios: ["Acesso à musculação", "Uso de vestiários", "Wi-Fi gratuito"],
    },
    {
      id: "pln-002",
      tenantId: TENANT_ID,
      nome: "Mensal Completo",
      tipo: "MENSAL",
      valor: 149.90,
      valorMatricula: 50.00,
      duracaoDias: 30,
      destaque: true,
      ativo: true,
      beneficios: ["Acesso completo", "Todas as aulas coletivas", "Toalha inclusa", "Armário exclusivo"],
    },
    {
      id: "pln-003",
      tenantId: TENANT_ID,
      nome: "Trimestral",
      tipo: "TRIMESTRAL",
      valor: 399.90,
      valorMatricula: 0,
      duracaoDias: 90,
      destaque: false,
      ativo: true,
      beneficios: ["Acesso completo", "Todas as aulas", "Personal trainer 1x/semana", "Avaliação física"],
    },
    {
      id: "pln-004",
      tenantId: TENANT_ID,
      nome: "Anual VIP",
      tipo: "ANUAL",
      valor: 999.90,
      valorMatricula: 0,
      duracaoDias: 365,
      destaque: false,
      ativo: true,
      beneficios: ["Acesso completo", "Todas as aulas", "Personal trainer ilimitado", "Avaliação física mensal", "Nutricionista"],
    },
  ];

  const formasPagamento: FormaPagamento[] = [
    { id: "fp-001", tenantId: TENANT_ID, nome: "Dinheiro", tipo: "DINHEIRO", taxaPercentual: 0, parcelasMax: 1, ativo: true },
    { id: "fp-002", tenantId: TENANT_ID, nome: "PIX", tipo: "PIX", taxaPercentual: 0, parcelasMax: 1, ativo: true },
    { id: "fp-003", tenantId: TENANT_ID, nome: "Cartão de Crédito", tipo: "CARTAO_CREDITO", taxaPercentual: 2.99, parcelasMax: 12, ativo: true },
    { id: "fp-004", tenantId: TENANT_ID, nome: "Cartão de Débito", tipo: "CARTAO_DEBITO", taxaPercentual: 1.5, parcelasMax: 1, ativo: true },
    { id: "fp-005", tenantId: TENANT_ID, nome: "Boleto", tipo: "BOLETO", taxaPercentual: 0, parcelasMax: 1, ativo: true },
  ];

  const prospects: Prospect[] = [
    { id: "pr-001", tenantId: TENANT_ID, nome: "Maria Silva", telefone: "(11) 99988-7766", email: "maria@email.com", origem: "INSTAGRAM", status: "NOVO", createdAt: "2026-02-18T10:00:00" },
    { id: "pr-002", tenantId: TENANT_ID, nome: "João Santos", telefone: "(11) 98877-6655", origem: "VISITA_PRESENCIAL", status: "AGENDOU_VISITA", createdAt: "2026-02-17T14:30:00" },
    { id: "pr-003", tenantId: TENANT_ID, nome: "Ana Costa", telefone: "(11) 97766-5544", email: "ana@email.com", origem: "INDICACAO", status: "VISITOU", createdAt: "2026-02-15T09:00:00" },
    { id: "pr-004", tenantId: TENANT_ID, nome: "Pedro Alves", telefone: "(11) 96655-4433", origem: "WHATSAPP", status: "EM_CONTATO", createdAt: "2026-02-10T11:00:00" },
  ];

  const alunos: Aluno[] = [
    {
      id: "al-001",
      tenantId: TENANT_ID,
      nome: "Carlos Oliveira",
      email: "carlos@email.com",
      telefone: "(11) 98765-4321",
      cpf: "987.654.321-00",
      dataNascimento: "1990-05-15",
      sexo: "M",
      status: "ATIVO",
      createdAt: "2025-09-01T10:00:00",
    },
    {
      id: "al-002",
      tenantId: TENANT_ID,
      nome: "Fernanda Lima",
      email: "fernanda@email.com",
      telefone: "(11) 97654-3210",
      cpf: "456.789.123-00",
      dataNascimento: "1995-08-20",
      sexo: "F",
      status: "ATIVO",
      createdAt: "2025-11-15T10:00:00",
    },
    {
      id: "al-003",
      tenantId: TENANT_ID,
      nome: "Roberto Santos",
      email: "roberto@email.com",
      telefone: "(11) 96543-2109",
      cpf: "123.456.789-00",
      dataNascimento: "1988-03-10",
      sexo: "M",
      status: "BLOQUEADO",
      createdAt: "2025-06-01T10:00:00",
    },
  ];

  const matriculas: Matricula[] = [
    {
      id: "mt-001",
      tenantId: TENANT_ID,
      alunoId: "al-001",
      planoId: "pln-002",
      dataInicio: "2026-02-01",
      dataFim: "2026-02-28",
      valorPago: 149.90,
      valorMatricula: 0,
      desconto: 0,
      formaPagamento: "PIX",
      status: "ATIVA",
      renovacaoAutomatica: false,
      createdAt: "2026-02-01T10:00:00",
    },
    {
      id: "mt-002",
      tenantId: TENANT_ID,
      alunoId: "al-002",
      planoId: "pln-003",
      dataInicio: "2025-12-01",
      dataFim: "2026-02-28",
      valorPago: 399.90,
      valorMatricula: 0,
      desconto: 0,
      formaPagamento: "CARTAO_CREDITO",
      status: "ATIVA",
      renovacaoAutomatica: false,
      createdAt: "2025-12-01T10:00:00",
    },
    {
      id: "mt-003",
      tenantId: TENANT_ID,
      alunoId: "al-003",
      planoId: "pln-001",
      dataInicio: "2026-01-01",
      dataFim: "2026-01-31",
      valorPago: 99.90,
      valorMatricula: 50,
      desconto: 0,
      formaPagamento: "DINHEIRO",
      status: "VENCIDA",
      renovacaoAutomatica: false,
      createdAt: "2026-01-01T10:00:00",
    },
  ];

  const pagamentos: Pagamento[] = [
    {
      id: "pg-001",
      tenantId: TENANT_ID,
      alunoId: "al-001",
      matriculaId: "mt-001",
      tipo: "MENSALIDADE",
      descricao: "Mensalidade Fevereiro 2026 – Mensal Completo",
      valor: 149.90,
      desconto: 0,
      valorFinal: 149.90,
      dataVencimento: "2026-02-05",
      dataPagamento: "2026-02-04",
      formaPagamento: "PIX",
      status: "PAGO",
      createdAt: "2026-02-01T10:00:00",
    },
    {
      id: "pg-002",
      tenantId: TENANT_ID,
      alunoId: "al-002",
      matriculaId: "mt-002",
      tipo: "MENSALIDADE",
      descricao: "Trimestral Dez/2025–Fev/2026",
      valor: 399.90,
      desconto: 0,
      valorFinal: 399.90,
      dataVencimento: "2025-12-05",
      dataPagamento: "2025-12-04",
      formaPagamento: "CARTAO_CREDITO",
      status: "PAGO",
      createdAt: "2025-12-01T10:00:00",
    },
    {
      id: "pg-003",
      tenantId: TENANT_ID,
      alunoId: "al-003",
      matriculaId: "mt-003",
      tipo: "MENSALIDADE",
      descricao: "Mensalidade Janeiro 2026 – Mensal Básico",
      valor: 99.90,
      desconto: 0,
      valorFinal: 99.90,
      dataVencimento: "2026-01-05",
      status: "VENCIDO",
      createdAt: "2026-01-01T10:00:00",
    },
    {
      id: "pg-004",
      tenantId: TENANT_ID,
      alunoId: "al-001",
      matriculaId: "mt-001",
      tipo: "MATRICULA",
      descricao: "Taxa de matrícula – Mensal Completo",
      valor: 50,
      desconto: 0,
      valorFinal: 50,
      dataVencimento: "2026-01-31",
      status: "PENDENTE",
      createdAt: "2026-01-15T10:00:00",
    },
  ];

  return { atividades, planos, formasPagamento, prospects, alunos, matriculas, pagamentos };
}

let store: Store = makeInitialStore();

export const TENANT_ID_DEFAULT = TENANT_ID;

export function getStore(): Readonly<Store> {
  return store;
}

export function setStore(updater: (prev: Store) => Store): void {
  store = updater(store);
}

export function resetStore(): void {
  store = makeInitialStore();
}
