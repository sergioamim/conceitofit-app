import type {
  Atividade,
  Aluno,
  Plano,
  FormaPagamento,
  Prospect,
  Matricula,
  Pagamento,
  Funcionario,
  Servico,
  BandeiraCartao,
  CartaoCliente,
  Presenca,
  Tenant,
  HorarioFuncionamento,
  Convenio,
  Voucher,
  VoucherCodigo,
  ProspectMensagem,
  ProspectAgendamento,
} from "../types";

const TENANT_ID = "550e8400-e29b-41d4-a716-446655440000";

interface Store {
  tenant: Tenant;
  tenants: Tenant[];
  currentTenantId: string;
  horarios: HorarioFuncionamento[];
  convenios: Convenio[];
  servicos: Servico[];
  bandeirasCartao: BandeiraCartao[];
  cartoesCliente: CartaoCliente[];
  atividades: Atividade[];
  planos: Plano[];
  formasPagamento: FormaPagamento[];
  funcionarios: Funcionario[];
  presencas: Presenca[];
  prospects: Prospect[];
  prospectMensagens: ProspectMensagem[];
  prospectAgendamentos: ProspectAgendamento[];
  alunos: Aluno[];
  matriculas: Matricula[];
  pagamentos: Pagamento[];
  vouchers: Voucher[];
  voucherCodigos: VoucherCodigo[];
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

  const tenant: Tenant = {
    id: TENANT_ID,
    nome: "Academia Força Total",
    subdomain: "forcatotal",
    email: "contato@forcatotal.com.br",
    telefone: "(11) 99999-0000",
    endereco: {
      cep: "01000-000",
      logradouro: "Av. Paulista",
      numero: "1000",
      bairro: "Bela Vista",
      cidade: "São Paulo",
      estado: "SP",
    },
  };
  const tenants: Tenant[] = [
    tenant,
    {
      id: "550e8400-e29b-41d4-a716-446655440001",
      nome: "Academia Vila Nova",
      subdomain: "vilanova",
      email: "contato@vilanova.com.br",
      telefone: "(11) 98888-1122",
      endereco: {
        cep: "04567-000",
        logradouro: "Rua das Flores",
        numero: "120",
        bairro: "Vila Nova",
        cidade: "São Paulo",
        estado: "SP",
      },
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440002",
      nome: "Academia Jardins",
      subdomain: "jardins",
      email: "contato@jardins.com.br",
      telefone: "(11) 97777-3344",
      endereco: {
        cep: "01400-000",
        logradouro: "Alameda Central",
        numero: "500",
        bairro: "Jardins",
        cidade: "São Paulo",
        estado: "SP",
      },
    },
  ];

  const horarios: HorarioFuncionamento[] = [
    { dia: "SEG", abre: "06:00", fecha: "22:00" },
    { dia: "TER", abre: "06:00", fecha: "22:00" },
    { dia: "QUA", abre: "06:00", fecha: "22:00" },
    { dia: "QUI", abre: "06:00", fecha: "22:00" },
    { dia: "SEX", abre: "06:00", fecha: "22:00" },
    { dia: "SAB", abre: "08:00", fecha: "14:00" },
    { dia: "DOM", abre: "00:00", fecha: "00:00", fechado: true },
  ];

  const servicos: Servico[] = [
    {
      id: "srv-001",
      tenantId: TENANT_ID,
      nome: "Avaliação física",
      descricao: "Avaliação inicial completa",
      sessoes: 1,
      valor: 120,
      agendavel: true,
      ativo: true,
    },
    {
      id: "srv-002",
      tenantId: TENANT_ID,
      nome: "Bioimpedância",
      descricao: "Avaliação de composição corporal",
      sessoes: 1,
      valor: 80,
      agendavel: true,
      ativo: true,
    },
    {
      id: "srv-003",
      tenantId: TENANT_ID,
      nome: "Aula com personal",
      descricao: "Acompanhamento individual",
      sessoes: 10,
      valor: 450,
      agendavel: true,
      ativo: true,
    },
  ];

  const convenios: Convenio[] = [
    { id: "cv-001", nome: "Empresa Alpha", ativo: true, descontoPercentual: 15, planoIds: ["pln-002", "pln-003"] },
    { id: "cv-002", nome: "Sindicato Beta", ativo: true, descontoPercentual: 10 },
    { id: "cv-003", nome: "Convênio Inativo", ativo: false, descontoPercentual: 20, planoIds: ["pln-001"] },
  ];

  const vouchers: Voucher[] = [
    {
      id: "vch-001",
      tenantId: TENANT_ID,
      tipo: "DESCONTO",
      nome: "Voucher Black Friday",
      periodoInicio: "2025-11-01",
      periodoFim: "2025-11-30",
      prazoDeterminado: true,
      quantidade: 50,
      ilimitado: false,
      codigoTipo: "ALEATORIO",
      usarNaVenda: true,
      planoIds: ["pln-001", "pln-002"],
      umaVezPorCliente: true,
      aplicarEm: ["CONTRATO"],
      ativo: true,
    },
    {
      id: "vch-002",
      tenantId: TENANT_ID,
      tipo: "ACESSO",
      nome: "Voucher Amigo",
      periodoInicio: "2025-01-01",
      prazoDeterminado: false,
      ilimitado: true,
      codigoTipo: "UNICO",
      usarNaVenda: false,
      planoIds: [],
      umaVezPorCliente: false,
      aplicarEm: ["CONTRATO", "ANUIDADE"],
      ativo: true,
    },
    {
      id: "vch-003",
      tenantId: TENANT_ID,
      tipo: "SESSAO",
      nome: "Sessão Experimental",
      periodoInicio: "2026-01-01",
      prazoDeterminado: false,
      ilimitado: false,
      quantidade: 20,
      codigoTipo: "UNICO",
      usarNaVenda: true,
      planoIds: ["pln-001"],
      umaVezPorCliente: true,
      aplicarEm: ["CONTRATO"],
      ativo: true,
    },
  ];

  const voucherCodigos: VoucherCodigo[] = [
    // vch-001 · ALEATORIO · 50 qty
    { id: "vcod-001", voucherId: "vch-001", codigo: "BF25A3", usado: true,  usadoPorAlunoId: "al-001", dataUso: "2025-11-02T10:30:00" },
    { id: "vcod-002", voucherId: "vch-001", codigo: "BF7MXQ", usado: true,  usadoPorAlunoId: "al-002", dataUso: "2025-11-05T14:15:00" },
    { id: "vcod-003", voucherId: "vch-001", codigo: "BFQ9ZR", usado: false },
    { id: "vcod-004", voucherId: "vch-001", codigo: "BFW2PL", usado: false },
    // vch-002 · UNICO · ilimitado (each row = one usage of the same code)
    { id: "vcod-005", voucherId: "vch-002", codigo: "AMIGO2025", usado: true,  usadoPorAlunoId: "al-002", dataUso: "2025-03-15T10:00:00" },
    { id: "vcod-006", voucherId: "vch-002", codigo: "AMIGO2025", usado: true,  usadoPorAlunoId: "al-001", dataUso: "2025-04-02T14:30:00" },
    // vch-003 · UNICO · 20 qty · no usages yet
    { id: "vcod-007", voucherId: "vch-003", codigo: "SESSAO2026", usado: false },
  ];

  const bandeirasCartao: BandeiraCartao[] = [
    { id: "bc-001", nome: "Visa", taxaPercentual: 2.9, diasRepasse: 30, ativo: true },
    { id: "bc-002", nome: "Mastercard", taxaPercentual: 2.95, diasRepasse: 30, ativo: true },
    { id: "bc-003", nome: "Elo", taxaPercentual: 3.1, diasRepasse: 30, ativo: true },
  ];

  const cartoesCliente: CartaoCliente[] = [
    { id: "cc-001", alunoId: "al-001", bandeiraId: "bc-001", titular: "Carlos Oliveira", ultimos4: "4321", validade: "12/28", ativo: true, padrao: true },
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
      atividades: ["atv-001"],
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
      atividades: ["atv-001", "atv-002", "atv-005"],
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
      atividades: ["atv-001", "atv-002", "atv-003", "atv-005"],
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
      atividades: ["atv-001", "atv-002", "atv-003", "atv-004", "atv-005", "atv-006", "atv-007"],
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

  const funcionarios = [
    { id: "fn-001", nome: "Sergio Amim", cargo: "Administrador", ativo: true },
    { id: "fn-002", nome: "Larissa Costa", cargo: "Consultora", ativo: true },
    { id: "fn-003", nome: "Bruno Silva", cargo: "Vendas", ativo: true },
  ];

  const prospects: Prospect[] = [
    {
      id: "pr-001",
      tenantId: TENANT_ID,
      responsavelId: "fn-002",
      nome: "Maria Silva",
      telefone: "(11) 99988-7766",
      email: "maria@email.com",
      origem: "INSTAGRAM",
      status: "NOVO",
      dataCriacao: "2026-02-18T10:00:00",
      statusLog: [{ status: "NOVO", data: "2026-02-18T10:00:00" }],
    },
    {
      id: "pr-002",
      tenantId: TENANT_ID,
      responsavelId: "fn-003",
      nome: "João Santos",
      telefone: "(11) 98877-6655",
      origem: "VISITA_PRESENCIAL",
      status: "AGENDOU_VISITA",
      dataCriacao: "2026-02-17T14:30:00",
      dataUltimoContato: "2026-02-18T09:00:00",
      statusLog: [
        { status: "NOVO", data: "2026-02-17T14:30:00" },
        { status: "EM_CONTATO", data: "2026-02-17T16:00:00" },
        { status: "AGENDOU_VISITA", data: "2026-02-18T09:00:00" },
      ],
    },
    {
      id: "pr-003",
      tenantId: TENANT_ID,
      responsavelId: "fn-002",
      nome: "Ana Costa",
      telefone: "(11) 97766-5544",
      email: "ana@email.com",
      origem: "INDICACAO",
      status: "VISITOU",
      dataCriacao: "2026-02-15T09:00:00",
      statusLog: [
        { status: "NOVO", data: "2026-02-15T09:00:00" },
        { status: "EM_CONTATO", data: "2026-02-16T10:00:00" },
        { status: "AGENDOU_VISITA", data: "2026-02-17T11:00:00" },
        { status: "VISITOU", data: "2026-02-18T18:30:00" },
      ],
    },
    {
      id: "pr-004",
      tenantId: TENANT_ID,
      responsavelId: "fn-001",
      nome: "Pedro Alves",
      telefone: "(11) 96655-4433",
      origem: "WHATSAPP",
      status: "EM_CONTATO",
      dataCriacao: "2026-02-10T11:00:00",
      dataUltimoContato: "2026-02-12T11:30:00",
      statusLog: [
        { status: "NOVO", data: "2026-02-10T11:00:00" },
        { status: "EM_CONTATO", data: "2026-02-12T11:30:00" },
      ],
    },
  ];

  const prospectMensagens: ProspectMensagem[] = [
    {
      id: "pm-001",
      prospectId: "pr-001",
      texto: "Olá Maria! Vi que você se interessou pela nossa academia pelo Instagram. Posso te contar mais sobre nossos planos?",
      datahora: "2026-02-18T10:30:00",
      autorNome: "Larissa Costa",
      autorId: "fn-002",
    },
    {
      id: "pm-002",
      prospectId: "pr-002",
      texto: "João, tudo bem? Passando para confirmar a visita agendada para amanhã às 10h.",
      datahora: "2026-02-18T09:15:00",
      autorNome: "Bruno Silva",
      autorId: "fn-003",
    },
    {
      id: "pm-003",
      prospectId: "pr-002",
      texto: "Confirmado! Estarei lá às 10h.",
      datahora: "2026-02-18T09:45:00",
      autorNome: "Bruno Silva",
      autorId: "fn-003",
    },
    {
      id: "pm-004",
      prospectId: "pr-003",
      texto: "Ana, obrigada pela visita hoje! Ficou com alguma dúvida sobre os planos?",
      datahora: "2026-02-18T19:00:00",
      autorNome: "Larissa Costa",
      autorId: "fn-002",
    },
  ];

  const prospectAgendamentos: ProspectAgendamento[] = [
    {
      id: "pa-001",
      prospectId: "pr-002",
      funcionarioId: "fn-003",
      titulo: "Visita à academia",
      data: "2026-02-19",
      hora: "10:00",
      observacoes: "João quer conhecer a área de musculação e spinning.",
      status: "REALIZADO",
    },
    {
      id: "pa-002",
      prospectId: "pr-003",
      funcionarioId: "fn-002",
      titulo: "Apresentação dos planos",
      data: "2026-02-22",
      hora: "14:00",
      status: "AGENDADO",
    },
  ];

  const alunos: Aluno[] = [
    {
      id: "al-001",
      tenantId: TENANT_ID,
      nome: "Carlos Oliveira",
      email: "carlos@email.com",
      telefone: "(11) 98765-4321",
      telefoneSec: "(11) 90000-0000",
      cpf: "987.654.321-00",
      dataNascimento: "1990-05-15",
      sexo: "M",
      status: "ATIVO",
      dataCadastro: "2025-09-01T10:00:00",
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
      dataCadastro: "2025-11-15T10:00:00",
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
      status: "INATIVO",
      dataCadastro: "2025-06-01T10:00:00",
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
      dataCriacao: "2026-02-01T10:00:00",
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
      dataCriacao: "2025-12-01T10:00:00",
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
      dataCriacao: "2026-01-01T10:00:00",
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
      dataCriacao: "2026-02-01T10:00:00",
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
      dataCriacao: "2025-12-01T10:00:00",
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
      dataCriacao: "2026-01-01T10:00:00",
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
      dataCriacao: "2026-01-15T10:00:00",
    },
  ];

  const presencas: Presenca[] = [
    { id: "prc-001", alunoId: "al-001", data: "2026-02-15", horario: "08:10", origem: "CHECKIN" },
    { id: "prc-002", alunoId: "al-001", data: "2026-02-15", horario: "18:40", origem: "AULA", atividade: "Spinning" },
    { id: "prc-003", alunoId: "al-001", data: "2026-02-16", horario: "07:50", origem: "CHECKIN" },
    { id: "prc-004", alunoId: "al-001", data: "2026-02-18", horario: "19:00", origem: "AULA", atividade: "Funcional" },
    { id: "prc-005", alunoId: "al-001", data: "2026-02-20", horario: "06:55", origem: "ACESSO" },
    { id: "prc-006", alunoId: "al-001", data: "2026-02-21", horario: "10:15", origem: "AULA", atividade: "Yoga" },
    { id: "prc-007", alunoId: "al-002", data: "2026-02-14", horario: "09:20", origem: "CHECKIN" },
    { id: "prc-008", alunoId: "al-002", data: "2026-02-17", horario: "18:10", origem: "AULA", atividade: "Pilates" },
    { id: "prc-009", alunoId: "al-002", data: "2026-02-19", horario: "07:30", origem: "ACESSO" },
    { id: "prc-010", alunoId: "al-002", data: "2026-02-21", horario: "19:30", origem: "AULA", atividade: "Muay Thai" },
    { id: "prc-011", alunoId: "al-003", data: "2026-01-20", horario: "08:05", origem: "CHECKIN" },
    { id: "prc-012", alunoId: "al-003", data: "2026-02-01", horario: "18:00", origem: "ACESSO" },
  ];

  return {
    tenant,
    tenants,
    currentTenantId: tenant.id,
    horarios,
    convenios,
    servicos,
    bandeirasCartao,
    cartoesCliente,
    atividades,
    planos,
    formasPagamento,
    funcionarios,
    presencas,
    prospects,
    prospectMensagens,
    prospectAgendamentos,
    alunos,
    matriculas,
    pagamentos,
    vouchers,
    voucherCodigos,
  };
}

let store: Store = makeInitialStore();

export const TENANT_ID_DEFAULT = TENANT_ID;

export function getStore(): Readonly<Store> {
  return store;
}

export function setStore(updater: (prev: Store) => Store): void {
  store = updater(store);
  persistStore(store);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("academia-store-updated"));
  }
}

export function resetStore(): void {
  store = makeInitialStore();
  persistStore(store);
}

const STORAGE_KEY = "academia-mvp-store";

function persistStore(data: Store): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore storage errors
  }
}

function normalizeStore(data: Store): Store {
  return {
    ...data,
    tenant: data.tenant ?? {
      id: TENANT_ID,
      nome: "Academia Força Total",
    },
    tenants: data.tenants ?? (data.tenant ? [data.tenant] : []),
    currentTenantId: data.currentTenantId ?? data.tenant?.id ?? TENANT_ID,
    horarios: data.horarios ?? [],
    convenios: data.convenios ?? [],
    servicos: data.servicos ?? [],
    bandeirasCartao: data.bandeirasCartao ?? [],
    cartoesCliente: data.cartoesCliente ?? [],
    funcionarios: data.funcionarios ?? [],
    presencas: data.presencas ?? [],
    prospectMensagens: data.prospectMensagens ?? [],
    prospectAgendamentos: data.prospectAgendamentos ?? [],
    prospects: data.prospects.map((p) => ({
      ...p,
      dataCriacao: (p as unknown as { createdAt?: string }).createdAt ?? p.dataCriacao,
      dataUltimoContato: p.dataUltimoContato,
      motivoPerda: p.motivoPerda,
      statusLog: p.statusLog ?? [
        { status: p.status, data: (p as unknown as { createdAt?: string }).createdAt ?? p.dataCriacao },
      ],
    })),
    alunos: data.alunos.map((a) => ({
      ...a,
      status: a.status === "BLOQUEADO" ? "INATIVO" : a.status,
      suspensoes: a.suspensoes ?? (a.suspensao ? [{
        motivo: a.suspensao.motivo,
        inicio: a.suspensao.inicio,
        fim: a.suspensao.fim,
        detalhes: a.suspensao.detalhes,
        arquivoBase64: a.suspensao.arquivoBase64,
        dataRegistro: a.dataAtualizacao ?? a.dataCadastro,
      }] : []),
      dataCadastro: (a as unknown as { createdAt?: string }).createdAt ?? a.dataCadastro,
      dataAtualizacao: a.dataAtualizacao,
    })),
    matriculas: data.matriculas.map((m) => ({
      ...m,
      dataCriacao: (m as unknown as { createdAt?: string }).createdAt ?? m.dataCriacao,
      dataAtualizacao: m.dataAtualizacao,
    })),
    vouchers: (data.vouchers ?? []).map((v) => {
      const raw = v as unknown as Record<string, unknown>;
      return {
        ...v,
        periodoInicio: v.periodoInicio ?? (raw.vencimento as string) ?? "2025-01-01",
        periodoFim: v.periodoFim ?? (raw.vencimento as string | undefined),
        prazoDeterminado: v.prazoDeterminado ?? !!raw.vencimento,
        planoIds: v.planoIds ?? [],
        umaVezPorCliente: v.umaVezPorCliente ?? false,
        aplicarEm: Array.isArray(v.aplicarEm)
          ? v.aplicarEm
          : [v.aplicarEm ?? "CONTRATO"],
      };
    }),
    voucherCodigos: data.voucherCodigos ?? [],
    pagamentos: data.pagamentos.map((p) => ({
      ...p,
      dataCriacao: (p as unknown as { createdAt?: string }).createdAt ?? p.dataCriacao,
    })),
  };
}

function loadStore(): Store | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Store;
    return normalizeStore(parsed);
  } catch {
    return null;
  }
}

if (typeof window !== "undefined") {
  const loaded = loadStore();
  if (loaded) store = loaded;
  else persistStore(store);
}
