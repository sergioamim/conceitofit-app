import type {
  Atividade,
  Aluno,
  Plano,
  FormaPagamento,
  Prospect,
  Matricula,
  Pagamento,
  ContaPagar,
  TipoContaPagar,
  RegraRecorrenciaContaPagar,
  Funcionario,
  Servico,
  BandeiraCartao,
  CartaoCliente,
  Presenca,
  AtividadeGrade,
  DiaSemana,
  Tenant,
  HorarioFuncionamento,
  Convenio,
  Voucher,
  VoucherCodigo,
  ProspectMensagem,
  ProspectAgendamento,
  Sala,
  Cargo,
  Produto,
  Venda,
  Academia,
  CampanhaCRM,
  TenantThemePreset,
} from "../types";

const TENANT_ID = "550e8400-e29b-41d4-a716-446655440000";
const TENANT_ID_S1 = "550e8400-e29b-41d4-a716-446655440001";
const TENANT_ID_S3 = "550e8400-e29b-41d4-a716-446655440002";
const PRIMARY_TENANT_ID = TENANT_ID_S1;

interface Store {
  academias: Academia[];
  tenant: Tenant;
  tenants: Tenant[];
  currentTenantId: string;
  horarios: HorarioFuncionamento[];
  convenios: Convenio[];
  produtos: Produto[];
  servicos: Servico[];
  vendas: Venda[];
  bandeirasCartao: BandeiraCartao[];
  cartoesCliente: CartaoCliente[];
  atividades: Atividade[];
  cargos: Cargo[];
  salas: Sala[];
  atividadeGrades: AtividadeGrade[];
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
  contasPagar: ContaPagar[];
  tiposContaPagar: TipoContaPagar[];
  regrasRecorrenciaContaPagar: RegraRecorrenciaContaPagar[];
  vouchers: Voucher[];
  voucherCodigos: VoucherCodigo[];
  campanhasCrm: CampanhaCRM[];
}

function migrateTenantId(id: string | undefined): string | undefined {
  if (!id) return id;
  return id === TENANT_ID ? TENANT_ID_S1 : id;
}

function mapTenantItems<T extends { tenantId: string }>(items: T[]): T[] {
  return items.map((item) => ({ ...item, tenantId: migrateTenantId(item.tenantId) ?? item.tenantId }));
}

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of items) {
    if (!map.has(item.id)) map.set(item.id, item);
  }
  return Array.from(map.values());
}

function normalizeTenantConfiguracoes(tenant: Tenant): Tenant {
  const modo = tenant.configuracoes?.impressaoCupom?.modo ?? "80MM";
  const larguraRaw = Number(tenant.configuracoes?.impressaoCupom?.larguraCustomMm ?? 80);
  const larguraCustomMm = Number.isFinite(larguraRaw)
    ? Math.min(120, Math.max(40, larguraRaw))
    : 80;
  return {
    ...tenant,
    configuracoes: {
      ...tenant.configuracoes,
      impressaoCupom: {
        modo,
        larguraCustomMm,
      },
    },
  };
}

const DIA_SEMANA_VALUES: DiaSemana[] = ["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"];

function isDiaSemana(value: string): value is DiaSemana {
  return DIA_SEMANA_VALUES.includes(value as DiaSemana);
}

function applyLegacyTenantMigration(input: Store): Store {
  const tenants = dedupeById(
    input.tenants
      .filter((tenant) => tenant.id !== TENANT_ID)
      .map((tenant) => ({
        ...tenant,
        id: migrateTenantId(tenant.id) ?? tenant.id,
        groupId: migrateTenantId(tenant.groupId),
        academiaId: migrateTenantId(tenant.academiaId),
      }))
  );

  const tenant = tenants.find((t) => t.id === migrateTenantId(input.tenant.id))
    ?? tenants.find((t) => t.id === PRIMARY_TENANT_ID)
    ?? input.tenant;

  const result: Store = {
    ...input,
    tenant,
    tenants,
    currentTenantId: migrateTenantId(input.currentTenantId) ?? PRIMARY_TENANT_ID,
    produtos: mapTenantItems(input.produtos),
    servicos: mapTenantItems(input.servicos),
    vendas: mapTenantItems(input.vendas),
    atividades: mapTenantItems(input.atividades),
    cargos: mapTenantItems(input.cargos),
    salas: mapTenantItems(input.salas),
    atividadeGrades: mapTenantItems(input.atividadeGrades),
    planos: mapTenantItems(input.planos),
    formasPagamento: mapTenantItems(input.formasPagamento),
    prospects: mapTenantItems(input.prospects),
    alunos: mapTenantItems(input.alunos),
    matriculas: mapTenantItems(input.matriculas),
    pagamentos: mapTenantItems(input.pagamentos),
    contasPagar: mapTenantItems(input.contasPagar),
    tiposContaPagar: mapTenantItems(input.tiposContaPagar),
    regrasRecorrenciaContaPagar: mapTenantItems(input.regrasRecorrenciaContaPagar),
    campanhasCrm: mapTenantItems(input.campanhasCrm),
    vouchers: input.vouchers.map((voucher) => ({
      ...voucher,
      tenantId: migrateTenantId(voucher.tenantId),
    })),
  };
  return result;
}

function makeInitialStore(): Store {
  const academia: Academia = {
    id: "acd-sergio-amim",
    nome: "Academia Sergio Amim",
    razaoSocial: "Academia Sergio Amim LTDA",
    documento: "12.345.678/0001-90",
    email: "contato@sergioamim.com.br",
    telefone: "(11) 99999-0000",
    ativo: true,
    endereco: {
      cep: "01000-000",
      logradouro: "Av. Paulista",
      numero: "1000",
      bairro: "Bela Vista",
      cidade: "São Paulo",
      estado: "SP",
    },
    branding: {
      appName: "Conceito Fit",
      themePreset: "CONCEITO_DARK",
      useCustomColors: false,
    },
  };

  const atividades: Atividade[] = [
    { id: "atv-001", tenantId: TENANT_ID, nome: "Musculação", categoria: "MUSCULACAO", icone: "💪", cor: "#FF5733", permiteCheckin: true, checkinObrigatorio: false, ativo: true },
    { id: "atv-002", tenantId: TENANT_ID, nome: "Spinning", categoria: "CARDIO", icone: "🚴", cor: "#33A1FF", permiteCheckin: true, checkinObrigatorio: true, ativo: true },
    { id: "atv-003", tenantId: TENANT_ID, nome: "Yoga", categoria: "COLETIVA", icone: "🧘", cor: "#9B59B6", permiteCheckin: true, checkinObrigatorio: false, ativo: true },
    { id: "atv-004", tenantId: TENANT_ID, nome: "Muay Thai", categoria: "LUTA", icone: "🥊", cor: "#E74C3C", permiteCheckin: true, checkinObrigatorio: true, ativo: true },
    { id: "atv-005", tenantId: TENANT_ID, nome: "Funcional", categoria: "COLETIVA", icone: "🏋️", cor: "#2ECC71", permiteCheckin: true, checkinObrigatorio: false, ativo: true },
    { id: "atv-006", tenantId: TENANT_ID, nome: "Natação", categoria: "AQUATICA", icone: "🏊", cor: "#3498DB", permiteCheckin: true, checkinObrigatorio: true, ativo: true },
    { id: "atv-007", tenantId: TENANT_ID, nome: "Pilates", categoria: "COLETIVA", icone: "🤸", cor: "#F39C12", permiteCheckin: true, checkinObrigatorio: false, ativo: true },
    { id: "atv-s1-001", tenantId: TENANT_ID_S1, nome: "Musculação", categoria: "MUSCULACAO", icone: "💪", cor: "#ef4444", permiteCheckin: true, checkinObrigatorio: false, ativo: true },
    { id: "atv-s1-002", tenantId: TENANT_ID_S1, nome: "Spinning", categoria: "CARDIO", icone: "🚴", cor: "#0ea5e9", permiteCheckin: true, checkinObrigatorio: true, ativo: true },
    { id: "atv-s3-001", tenantId: TENANT_ID_S3, nome: "Musculação", categoria: "MUSCULACAO", icone: "🏋️", cor: "#22c55e", permiteCheckin: true, checkinObrigatorio: false, ativo: true },
    { id: "atv-s3-002", tenantId: TENANT_ID_S3, nome: "Ritmos", categoria: "COLETIVA", icone: "💃", cor: "#f59e0b", permiteCheckin: true, checkinObrigatorio: false, ativo: true },
  ];

  const salas: Sala[] = [
    { id: "sal-001", tenantId: TENANT_ID, nome: "Sala Bike 1", descricao: "Estúdio Spinning", capacidadePadrao: 20, ativo: true },
    { id: "sal-002", tenantId: TENANT_ID, nome: "Sala Zen", descricao: "Atividades de bem-estar", capacidadePadrao: 15, ativo: true },
    { id: "sal-003", tenantId: TENANT_ID, nome: "Dojo 1", descricao: "Lutas", capacidadePadrao: 24, ativo: true },
    { id: "sal-s1-001", tenantId: TENANT_ID_S1, nome: "Sala S1 Cardio", descricao: "Unidade Mananciais", capacidadePadrao: 18, ativo: true },
    { id: "sal-s1-002", tenantId: TENANT_ID_S1, nome: "Sala S1 Funcional", descricao: "Unidade Mananciais", capacidadePadrao: 22, ativo: true },
    { id: "sal-s3-001", tenantId: TENANT_ID_S3, nome: "Sala S3 Training", descricao: "Unidade Pechincha", capacidadePadrao: 20, ativo: true },
    { id: "sal-s3-002", tenantId: TENANT_ID_S3, nome: "Studio S3", descricao: "Unidade Pechincha", capacidadePadrao: 16, ativo: true },
  ];

  const cargos: Cargo[] = [
    { id: "crg-001", tenantId: TENANT_ID, nome: "Administrador", ativo: true },
    { id: "crg-002", tenantId: TENANT_ID, nome: "Consultor Comercial", ativo: true },
    { id: "crg-003", tenantId: TENANT_ID, nome: "Instrutor", ativo: true },
    { id: "crg-s1-001", tenantId: TENANT_ID_S1, nome: "Administrador", ativo: true },
    { id: "crg-s1-002", tenantId: TENANT_ID_S1, nome: "Consultor Comercial", ativo: true },
    { id: "crg-s1-003", tenantId: TENANT_ID_S1, nome: "Instrutor", ativo: true },
    { id: "crg-s3-001", tenantId: TENANT_ID_S3, nome: "Administrador", ativo: true },
    { id: "crg-s3-002", tenantId: TENANT_ID_S3, nome: "Consultor Comercial", ativo: true },
    { id: "crg-s3-003", tenantId: TENANT_ID_S3, nome: "Instrutor", ativo: true },
  ];

  const tenant: Tenant = {
    id: TENANT_ID_S1,
    academiaId: academia.id,
    nome: "MANANCIAIS - S1",
    razaoSocial: "Academia Sergio Amim Mananciais LTDA",
    documento: "12.345.678/0001-91",
    groupId: "GRP-SERGIO-AMIM",
    subdomain: "mananciais-s1",
    email: "contato@mananciais-s1.com.br",
    telefone: "(11) 98888-1122",
    ativo: true,
    endereco: {
      cep: "04567-000",
      logradouro: "Rua das Flores",
      numero: "120",
      bairro: "Vila Nova",
      cidade: "São Paulo",
      estado: "SP",
    },
    configuracoes: {
      impressaoCupom: {
        modo: "80MM",
        larguraCustomMm: 80,
      },
    },
  };
  const tenants: Tenant[] = [
    tenant,
    {
      id: TENANT_ID_S3,
      academiaId: academia.id,
      nome: "PECHINCHA - S3",
      razaoSocial: "Academia Sergio Amim Pechincha LTDA",
      documento: "12.345.678/0001-92",
      groupId: "GRP-SERGIO-AMIM",
      subdomain: "pechincha-s3",
      email: "contato@pechincha-s3.com.br",
      telefone: "(11) 97777-3344",
      ativo: true,
      endereco: {
        cep: "01400-000",
        logradouro: "Alameda Central",
        numero: "500",
        bairro: "Jardins",
        cidade: "São Paulo",
        estado: "SP",
      },
      configuracoes: {
        impressaoCupom: {
          modo: "80MM",
          larguraCustomMm: 80,
        },
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

  const atividadeGrades: AtividadeGrade[] = [
    {
      id: "agr-001",
      tenantId: TENANT_ID,
      atividadeId: "atv-002",
      diasSemana: ["SEG", "QUA"],
      definicaoHorario: "PREVIAMENTE",
      horaInicio: "07:00",
      horaFim: "08:00",
      capacidade: 20,
      checkinLiberadoMinutosAntes: 60,
      duracaoMinutos: 60,
      grupoAtividades: "Cardio",
      publico: "Adulto",
      dificuldade: 3,
      acessoClientes: "TODOS_CLIENTES",
      permiteReserva: true,
      limitarVagasAgregadores: false,
      exibirWellhub: true,
      permitirSaidaAntesInicio: false,
      permitirEscolherNumeroVaga: false,
      exibirNoAppCliente: true,
      exibirNoAutoatendimento: true,
      exibirNoWodTv: false,
      finalizarAtividadeAutomaticamente: true,
      desabilitarListaEspera: false,
      salaId: "sal-001",
      funcionarioId: "fn-002",
      local: "Sala Bike 1",
      instrutor: "Larissa Costa",
      ativo: true,
    },
    {
      id: "agr-002",
      tenantId: TENANT_ID,
      atividadeId: "atv-003",
      diasSemana: ["TER", "QUI"],
      definicaoHorario: "PREVIAMENTE",
      horaInicio: "19:00",
      horaFim: "20:00",
      capacidade: 15,
      checkinLiberadoMinutosAntes: 45,
      duracaoMinutos: 60,
      grupoAtividades: "Bem-estar",
      publico: "Todos",
      dificuldade: 2,
      acessoClientes: "APENAS_COM_CONTRATO_OU_SERVICO",
      permiteReserva: true,
      limitarVagasAgregadores: false,
      exibirWellhub: false,
      permitirSaidaAntesInicio: true,
      permitirEscolherNumeroVaga: false,
      exibirNoAppCliente: true,
      exibirNoAutoatendimento: true,
      exibirNoWodTv: false,
      finalizarAtividadeAutomaticamente: true,
      desabilitarListaEspera: false,
      salaId: "sal-002",
      funcionarioId: "fn-002",
      local: "Sala Zen",
      instrutor: "Bruno Silva",
      ativo: true,
    },
    {
      id: "agr-s1-001",
      tenantId: TENANT_ID_S1,
      atividadeId: "atv-s1-002",
      diasSemana: ["SEG", "QUA", "SEX"],
      definicaoHorario: "PREVIAMENTE",
      horaInicio: "06:30",
      horaFim: "07:20",
      capacidade: 18,
      checkinLiberadoMinutosAntes: 45,
      duracaoMinutos: 50,
      grupoAtividades: "Cardio",
      publico: "Adulto",
      dificuldade: 3,
      acessoClientes: "TODOS_CLIENTES",
      permiteReserva: true,
      limitarVagasAgregadores: false,
      exibirWellhub: true,
      permitirSaidaAntesInicio: false,
      permitirEscolherNumeroVaga: false,
      exibirNoAppCliente: true,
      exibirNoAutoatendimento: true,
      exibirNoWodTv: false,
      finalizarAtividadeAutomaticamente: true,
      desabilitarListaEspera: false,
      salaId: "sal-s1-001",
      funcionarioId: "fn-s1-002",
      local: "Sala S1 Cardio",
      instrutor: "Priscila Gomes",
      ativo: true,
    },
    {
      id: "agr-s3-001",
      tenantId: TENANT_ID_S3,
      atividadeId: "atv-s3-002",
      diasSemana: ["TER", "QUI"],
      definicaoHorario: "PREVIAMENTE",
      horaInicio: "19:00",
      horaFim: "19:50",
      capacidade: 16,
      checkinLiberadoMinutosAntes: 30,
      duracaoMinutos: 50,
      grupoAtividades: "Coletivas",
      publico: "Todos",
      dificuldade: 2,
      acessoClientes: "TODOS_CLIENTES",
      permiteReserva: true,
      limitarVagasAgregadores: false,
      exibirWellhub: false,
      permitirSaidaAntesInicio: true,
      permitirEscolherNumeroVaga: false,
      exibirNoAppCliente: true,
      exibirNoAutoatendimento: true,
      exibirNoWodTv: false,
      finalizarAtividadeAutomaticamente: true,
      desabilitarListaEspera: false,
      salaId: "sal-s3-002",
      funcionarioId: "fn-s3-002",
      local: "Studio S3",
      instrutor: "Leandro Dias",
      ativo: true,
    },
  ];

  const servicos: Servico[] = [
    {
      id: "srv-001",
      tenantId: TENANT_ID,
      nome: "Avaliação física",
      sku: "SRV-AVAL-001",
      categoria: "Avaliação",
      descricao: "Avaliação inicial completa",
      sessoes: 1,
      duracaoMinutos: 50,
      validadeDias: 30,
      valor: 120,
      custo: 40,
      comissaoPercentual: 8,
      aliquotaImpostoPercentual: 4,
      permiteDesconto: true,
      tipoCobranca: "UNICO",
      agendavel: true,
      permiteAcessoCatraca: false,
      permiteVoucher: true,
      ativo: true,
    },
    {
      id: "srv-002",
      tenantId: TENANT_ID,
      nome: "Bioimpedância",
      sku: "SRV-BIO-002",
      categoria: "Avaliação",
      descricao: "Avaliação de composição corporal",
      sessoes: 1,
      duracaoMinutos: 30,
      validadeDias: 30,
      valor: 80,
      custo: 22,
      comissaoPercentual: 6,
      aliquotaImpostoPercentual: 4,
      permiteDesconto: true,
      tipoCobranca: "UNICO",
      agendavel: true,
      permiteAcessoCatraca: false,
      permiteVoucher: true,
      ativo: true,
    },
    {
      id: "srv-003",
      tenantId: TENANT_ID,
      nome: "Aula com personal",
      sku: "SRV-PERS-003",
      categoria: "Personal",
      descricao: "Acompanhamento individual",
      sessoes: 10,
      duracaoMinutos: 60,
      validadeDias: 90,
      valor: 450,
      custo: 180,
      comissaoPercentual: 12,
      aliquotaImpostoPercentual: 6,
      permiteDesconto: true,
      tipoCobranca: "UNICO",
      agendavel: true,
      permiteAcessoCatraca: true,
      permiteVoucher: true,
      ativo: true,
    },
    {
      id: "srv-s1-001",
      tenantId: TENANT_ID_S1,
      nome: "Avaliação física S1",
      sku: "SRV-S1-AVAL",
      categoria: "Avaliação",
      sessoes: 1,
      duracaoMinutos: 45,
      validadeDias: 30,
      valor: 110,
      custo: 38,
      comissaoPercentual: 8,
      aliquotaImpostoPercentual: 4,
      permiteDesconto: true,
      tipoCobranca: "UNICO",
      agendavel: true,
      permiteAcessoCatraca: false,
      permiteVoucher: true,
      ativo: true,
    },
    {
      id: "srv-s3-001",
      tenantId: TENANT_ID_S3,
      nome: "Avaliação física S3",
      sku: "SRV-S3-AVAL",
      categoria: "Avaliação",
      sessoes: 1,
      duracaoMinutos: 45,
      validadeDias: 30,
      valor: 115,
      custo: 40,
      comissaoPercentual: 8,
      aliquotaImpostoPercentual: 4,
      permiteDesconto: true,
      tipoCobranca: "UNICO",
      agendavel: true,
      permiteAcessoCatraca: false,
      permiteVoucher: true,
      ativo: true,
    },
  ];

  const produtos: Produto[] = [
    {
      id: "prd-001",
      tenantId: TENANT_ID,
      nome: "Whey Protein 900g",
      sku: "PRD-WHEY-900",
      codigoBarras: "7890000000011",
      categoria: "Suplementos",
      marca: "FitLabs",
      unidadeMedida: "UN",
      descricao: "Proteína concentrada sabor baunilha",
      valorVenda: 149.9,
      custo: 95,
      comissaoPercentual: 5,
      aliquotaImpostoPercentual: 8,
      controlaEstoque: true,
      estoqueAtual: 22,
      estoqueMinimo: 5,
      permiteDesconto: true,
      permiteVoucher: false,
      ativo: true,
    },
    {
      id: "prd-002",
      tenantId: TENANT_ID,
      nome: "Luvas de treino",
      sku: "PRD-LUVA-TRN",
      codigoBarras: "7890000000028",
      categoria: "Acessórios",
      marca: "StrongGear",
      unidadeMedida: "UN",
      valorVenda: 59.9,
      custo: 28,
      comissaoPercentual: 4,
      aliquotaImpostoPercentual: 6,
      controlaEstoque: true,
      estoqueAtual: 34,
      estoqueMinimo: 8,
      permiteDesconto: true,
      permiteVoucher: true,
      ativo: true,
    },
    {
      id: "prd-003",
      tenantId: TENANT_ID,
      nome: "Creatina Monohidratada 300g",
      sku: "PRD-CREA-300",
      codigoBarras: "7890000000035",
      categoria: "Suplementos",
      marca: "FitLabs",
      unidadeMedida: "UN",
      descricao: "Creatina pura para ganho de força e performance",
      valorVenda: 99.9,
      custo: 61,
      comissaoPercentual: 5,
      aliquotaImpostoPercentual: 8,
      controlaEstoque: true,
      estoqueAtual: 26,
      estoqueMinimo: 6,
      permiteDesconto: true,
      permiteVoucher: false,
      ativo: true,
    },
    {
      id: "prd-004",
      tenantId: TENANT_ID,
      nome: "Shaker 700ml",
      sku: "PRD-SHAKER-700",
      codigoBarras: "7890000000042",
      categoria: "Acessórios",
      marca: "StrongGear",
      unidadeMedida: "UN",
      valorVenda: 39.9,
      custo: 16,
      comissaoPercentual: 4,
      aliquotaImpostoPercentual: 6,
      controlaEstoque: true,
      estoqueAtual: 40,
      estoqueMinimo: 10,
      permiteDesconto: true,
      permiteVoucher: true,
      ativo: true,
    },
    {
      id: "prd-005",
      tenantId: TENANT_ID,
      nome: "Toalha Fitness",
      sku: "PRD-TOALHA-01",
      codigoBarras: "7890000000059",
      categoria: "Acessórios",
      marca: "FitManager",
      unidadeMedida: "UN",
      valorVenda: 29.9,
      custo: 12,
      comissaoPercentual: 3,
      aliquotaImpostoPercentual: 6,
      controlaEstoque: true,
      estoqueAtual: 55,
      estoqueMinimo: 12,
      permiteDesconto: true,
      permiteVoucher: true,
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
      escopo: "UNIDADE",
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
      escopo: "UNIDADE",
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
      escopo: "UNIDADE",
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
    {
      id: "vch-grp-001",
      groupId: "GRP-SERGIO-AMIM",
      escopo: "GRUPO",
      tipo: "DESCONTO",
      nome: "Rede Fit 10%",
      periodoInicio: "2026-01-01",
      prazoDeterminado: false,
      ilimitado: true,
      codigoTipo: "UNICO",
      usarNaVenda: true,
      planoIds: [],
      umaVezPorCliente: true,
      aplicarEm: ["CONTRATO", "ANUIDADE"],
      ativo: true,
    },
  ];

  const campanhasCrm: CampanhaCRM[] = [
    {
      id: "cmp-s1-001",
      tenantId: TENANT_ID_S1,
      nome: "Reativação 90 dias",
      descricao: "Campanha focada em clientes evadidos com incentivo de retorno.",
      publicoAlvo: "EVADIDOS_ULTIMOS_3_MESES",
      canais: ["WHATSAPP", "EMAIL"],
      voucherId: "vch-s1-reativa-001",
      dataInicio: "2026-02-01",
      status: "ATIVA",
      disparosRealizados: 1,
      ultimaExecucao: "2026-02-20T10:00:00",
      dataCriacao: "2026-02-01T09:00:00",
    },
    {
      id: "cmp-s3-001",
      tenantId: TENANT_ID_S3,
      nome: "Prospects quentes da semana",
      descricao: "Contato rápido com prospects em aberto para agendamento de visita.",
      publicoAlvo: "PROSPECTS_EM_ABERTO",
      canais: ["WHATSAPP", "LIGACAO"],
      dataInicio: "2026-02-10",
      status: "RASCUNHO",
      disparosRealizados: 0,
      dataCriacao: "2026-02-10T11:00:00",
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
    // vch-grp-001 · UNICO · global rede
    { id: "vcod-008", voucherId: "vch-grp-001", codigo: "REDEFIT10", usado: false },
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
      cobraAnuidade: true,
      valorAnuidade: 120,
      parcelasMaxAnuidade: 3,
      duracaoDias: 30,
      permiteRenovacaoAutomatica: true,
      permiteCobrancaRecorrente: true,
      diaCobrancaPadrao: 5,
      contratoAssinatura: "AMBAS",
      contratoEnviarAutomaticoEmail: true,
      contratoTemplateHtml: `
        <h1 style="text-align:center">CONTRATO DE PRESTAÇÃO DE SERVIÇOS FITNESS</h1>
        <p><strong>Contratante:</strong> {{NOME_CLIENTE}} - CPF {{CPF_CLIENTE}}</p>
        <p><strong>Contratada:</strong> {{RAZAO_SOCIAL_UNIDADE}} - CNPJ {{CNPJ_UNIDADE}}</p>
        <p>Plano contratado: <strong>{{NOME_PLANO}}</strong> no valor de <strong>{{VALOR_PLANO}}</strong>.</p>
        <p>Data da assinatura: {{DATA_ASSINATURA}}.</p>
        <p>Declaro ciência das regras de utilização, vigência e cobrança do plano.</p>
        <br/><br/>
        <p>__________________________________________</p>
        <p>Assinatura do cliente</p>
      `,
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
      cobraAnuidade: true,
      valorAnuidade: 180,
      parcelasMaxAnuidade: 6,
      duracaoDias: 30,
      permiteRenovacaoAutomatica: true,
      permiteCobrancaRecorrente: true,
      diaCobrancaPadrao: 5,
      contratoAssinatura: "DIGITAL",
      contratoEnviarAutomaticoEmail: true,
      contratoTemplateHtml: `
        <h2>Termo de adesão - {{NOME_PLANO}}</h2>
        <p>Eu, {{NOME_CLIENTE}}, CPF {{CPF_CLIENTE}}, aderindo ao plano {{NOME_PLANO}}, no valor de {{VALOR_PLANO}}.</p>
        <p>Unidade: {{NOME_UNIDADE}} - {{RAZAO_SOCIAL_UNIDADE}} (CNPJ {{CNPJ_UNIDADE}}).</p>
        <p>Declaro estar de acordo com as regras de uso, cancelamento e renovação.</p>
        <p>Assinatura digital em {{DATA_ASSINATURA}}.</p>
      `,
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
      cobraAnuidade: false,
      duracaoDias: 90,
      permiteRenovacaoAutomatica: true,
      permiteCobrancaRecorrente: false,
      contratoAssinatura: "PRESENCIAL",
      contratoEnviarAutomaticoEmail: false,
      contratoTemplateHtml: `
        <h2>Contrato de plano {{NOME_PLANO}}</h2>
        <p>Cliente: {{NOME_CLIENTE}} - CPF {{CPF_CLIENTE}}</p>
        <p>Empresa: {{RAZAO_SOCIAL_UNIDADE}} - CNPJ {{CNPJ_UNIDADE}}</p>
        <p>Valor: {{VALOR_PLANO}}</p>
        <p>Data: {{DATA_ASSINATURA}}</p>
      `,
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
      cobraAnuidade: false,
      duracaoDias: 365,
      permiteRenovacaoAutomatica: true,
      permiteCobrancaRecorrente: false,
      contratoAssinatura: "AMBAS",
      contratoEnviarAutomaticoEmail: false,
      contratoTemplateHtml: `
        <h2>Contrato Anual VIP</h2>
        <p>CONTRATANTE: {{NOME_CLIENTE}} (CPF {{CPF_CLIENTE}})</p>
        <p>CONTRATADA: {{RAZAO_SOCIAL_UNIDADE}} - CNPJ {{CNPJ_UNIDADE}}</p>
        <p>Plano: {{NOME_PLANO}} | Valor: {{VALOR_PLANO}}</p>
        <p>Assinatura em {{DATA_ASSINATURA}}</p>
      `,
      destaque: false,
      ativo: true,
      atividades: ["atv-001", "atv-002", "atv-003", "atv-004", "atv-005", "atv-006", "atv-007"],
      beneficios: ["Acesso completo", "Todas as aulas", "Personal trainer ilimitado", "Avaliação física mensal", "Nutricionista"],
    },
    {
      id: "pln-s1-001",
      tenantId: TENANT_ID_S1,
      nome: "Mensal S1",
      tipo: "MENSAL",
      valor: 129.9,
      valorMatricula: 40,
      cobraAnuidade: true,
      valorAnuidade: 150,
      parcelasMaxAnuidade: 5,
      duracaoDias: 30,
      permiteRenovacaoAutomatica: true,
      permiteCobrancaRecorrente: true,
      diaCobrancaPadrao: 5,
      contratoAssinatura: "AMBAS",
      contratoEnviarAutomaticoEmail: true,
      contratoTemplateHtml: `
        <h2>Contrato {{NOME_PLANO}} - Unidade {{NOME_UNIDADE}}</h2>
        <p>Cliente: {{NOME_CLIENTE}} (CPF {{CPF_CLIENTE}})</p>
        <p>Valor contratado: {{VALOR_PLANO}}</p>
        <p>Empresa: {{RAZAO_SOCIAL_UNIDADE}} - CNPJ {{CNPJ_UNIDADE}}</p>
        <p>Data: {{DATA_ASSINATURA}}</p>
      `,
      destaque: true,
      ativo: true,
      atividades: ["atv-s1-001", "atv-s1-002"],
      beneficios: ["Acesso completo S1", "Aulas coletivas S1"],
    },
    {
      id: "pln-s3-001",
      tenantId: TENANT_ID_S3,
      nome: "Mensal S3",
      tipo: "MENSAL",
      valor: 119.9,
      valorMatricula: 35,
      cobraAnuidade: true,
      valorAnuidade: 130,
      parcelasMaxAnuidade: 4,
      duracaoDias: 30,
      permiteRenovacaoAutomatica: true,
      permiteCobrancaRecorrente: true,
      diaCobrancaPadrao: 5,
      contratoAssinatura: "AMBAS",
      contratoEnviarAutomaticoEmail: true,
      contratoTemplateHtml: `
        <h2>Contrato {{NOME_PLANO}}</h2>
        <p>Cliente: {{NOME_CLIENTE}} - CPF {{CPF_CLIENTE}}</p>
        <p>Valor: {{VALOR_PLANO}}</p>
        <p>Contratada: {{RAZAO_SOCIAL_UNIDADE}} (CNPJ {{CNPJ_UNIDADE}})</p>
        <p>Assinatura em {{DATA_ASSINATURA}}</p>
      `,
      destaque: true,
      ativo: true,
      atividades: ["atv-s3-001", "atv-s3-002"],
      beneficios: ["Acesso completo S3", "Aulas coletivas S3"],
    },
  ];

  const formasPagamento: FormaPagamento[] = [
    { id: "fp-001", tenantId: TENANT_ID, nome: "Dinheiro", tipo: "DINHEIRO", taxaPercentual: 0, parcelasMax: 1, ativo: true, emitirAutomaticamente: false },
    { id: "fp-002", tenantId: TENANT_ID, nome: "PIX", tipo: "PIX", taxaPercentual: 0, parcelasMax: 1, ativo: true, emitirAutomaticamente: false },
    { id: "fp-003", tenantId: TENANT_ID, nome: "Cartão de Crédito", tipo: "CARTAO_CREDITO", taxaPercentual: 2.99, parcelasMax: 12, ativo: true, emitirAutomaticamente: false },
    { id: "fp-004", tenantId: TENANT_ID, nome: "Cartão de Débito", tipo: "CARTAO_DEBITO", taxaPercentual: 1.5, parcelasMax: 1, ativo: true, emitirAutomaticamente: false },
    { id: "fp-005", tenantId: TENANT_ID, nome: "Boleto", tipo: "BOLETO", taxaPercentual: 0, parcelasMax: 1, ativo: true, emitirAutomaticamente: false },
    { id: "fp-s1-001", tenantId: TENANT_ID_S1, nome: "Dinheiro", tipo: "DINHEIRO", taxaPercentual: 0, parcelasMax: 1, ativo: true, emitirAutomaticamente: false },
    { id: "fp-s1-002", tenantId: TENANT_ID_S1, nome: "PIX", tipo: "PIX", taxaPercentual: 0, parcelasMax: 1, ativo: true, emitirAutomaticamente: false },
    { id: "fp-s1-003", tenantId: TENANT_ID_S1, nome: "Cartão de Crédito", tipo: "CARTAO_CREDITO", taxaPercentual: 2.99, parcelasMax: 12, ativo: true, emitirAutomaticamente: false },
    { id: "fp-s3-001", tenantId: TENANT_ID_S3, nome: "Dinheiro", tipo: "DINHEIRO", taxaPercentual: 0, parcelasMax: 1, ativo: true, emitirAutomaticamente: false },
    { id: "fp-s3-002", tenantId: TENANT_ID_S3, nome: "PIX", tipo: "PIX", taxaPercentual: 0, parcelasMax: 1, ativo: true, emitirAutomaticamente: false },
    { id: "fp-s3-003", tenantId: TENANT_ID_S3, nome: "Cartão de Crédito", tipo: "CARTAO_CREDITO", taxaPercentual: 2.99, parcelasMax: 12, ativo: true, emitirAutomaticamente: false },
  ];

  const funcionarios = [
    { id: "fn-001", nome: "Sergio Amim", cargoId: "crg-001", cargo: "Administrador", podeMinistrarAulas: false, ativo: true },
    { id: "fn-002", nome: "Larissa Costa", cargoId: "crg-003", cargo: "Instrutor", podeMinistrarAulas: true, ativo: true },
    { id: "fn-003", nome: "Bruno Silva", cargoId: "crg-002", cargo: "Consultor Comercial", podeMinistrarAulas: false, ativo: true },
    { id: "fn-s1-001", nome: "Rafaela Nunes", cargoId: "crg-s1-001", cargo: "Administrador", podeMinistrarAulas: false, ativo: true },
    { id: "fn-s1-002", nome: "Priscila Gomes", cargoId: "crg-s1-003", cargo: "Instrutor", podeMinistrarAulas: true, ativo: true },
    { id: "fn-s1-003", nome: "Diego Paes", cargoId: "crg-s1-002", cargo: "Consultor Comercial", podeMinistrarAulas: false, ativo: true },
    { id: "fn-s3-001", nome: "Mauro Freitas", cargoId: "crg-s3-001", cargo: "Administrador", podeMinistrarAulas: false, ativo: true },
    { id: "fn-s3-002", nome: "Leandro Dias", cargoId: "crg-s3-003", cargo: "Instrutor", podeMinistrarAulas: true, ativo: true },
    { id: "fn-s3-003", nome: "Julia Santos", cargoId: "crg-s3-002", cargo: "Consultor Comercial", podeMinistrarAulas: false, ativo: true },
  ];

  const vendas: Venda[] = [];

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
    {
      id: "pr-s1-001",
      tenantId: TENANT_ID_S1,
      responsavelId: "fn-s1-003",
      nome: "Clara Matos",
      telefone: "(21) 99811-4422",
      origem: "WHATSAPP",
      status: "AGENDOU_VISITA",
      dataCriacao: "2026-02-19T10:00:00",
      statusLog: [
        { status: "NOVO", data: "2026-02-19T10:00:00" },
        { status: "AGENDOU_VISITA", data: "2026-02-19T12:00:00" },
      ],
    },
    {
      id: "pr-s3-001",
      tenantId: TENANT_ID_S3,
      responsavelId: "fn-s3-003",
      nome: "Mateus Castro",
      telefone: "(21) 99722-1133",
      origem: "INSTAGRAM",
      status: "EM_CONTATO",
      dataCriacao: "2026-02-18T09:00:00",
      statusLog: [
        { status: "NOVO", data: "2026-02-18T09:00:00" },
        { status: "EM_CONTATO", data: "2026-02-18T10:20:00" },
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
    {
      id: "al-s1-001",
      tenantId: TENANT_ID_S1,
      nome: "Bianca Rocha",
      email: "bianca.s1@email.com",
      telefone: "(21) 98811-1020",
      cpf: "321.654.987-00",
      dataNascimento: "1993-04-12",
      sexo: "F",
      status: "ATIVO",
      dataCadastro: "2026-01-20T10:00:00",
    },
    {
      id: "al-s3-001",
      tenantId: TENANT_ID_S3,
      nome: "Thiago Prado",
      email: "thiago.s3@email.com",
      telefone: "(21) 97744-8899",
      cpf: "741.852.963-00",
      dataNascimento: "1991-09-25",
      sexo: "M",
      status: "ATIVO",
      dataCadastro: "2026-01-10T10:00:00",
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
    {
      id: "mt-s1-001",
      tenantId: TENANT_ID_S1,
      alunoId: "al-s1-001",
      planoId: "pln-s1-001",
      dataInicio: "2026-02-01",
      dataFim: "2026-03-02",
      valorPago: 129.9,
      valorMatricula: 40,
      desconto: 0,
      formaPagamento: "PIX",
      status: "ATIVA",
      renovacaoAutomatica: true,
      dataCriacao: "2026-02-01T09:00:00",
    },
    {
      id: "mt-s3-001",
      tenantId: TENANT_ID_S3,
      alunoId: "al-s3-001",
      planoId: "pln-s3-001",
      dataInicio: "2026-02-05",
      dataFim: "2026-03-06",
      valorPago: 119.9,
      valorMatricula: 35,
      desconto: 0,
      formaPagamento: "CARTAO_CREDITO",
      status: "ATIVA",
      renovacaoAutomatica: true,
      dataCriacao: "2026-02-05T10:00:00",
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
    {
      id: "pg-s1-001",
      tenantId: TENANT_ID_S1,
      alunoId: "al-s1-001",
      matriculaId: "mt-s1-001",
      tipo: "MENSALIDADE",
      descricao: "Mensalidade Fevereiro 2026 – Mensal S1",
      valor: 129.9,
      desconto: 0,
      valorFinal: 129.9,
      dataVencimento: "2026-02-05",
      dataPagamento: "2026-02-04",
      formaPagamento: "PIX",
      status: "PAGO",
      dataCriacao: "2026-02-01T09:00:00",
    },
    {
      id: "pg-s3-001",
      tenantId: TENANT_ID_S3,
      alunoId: "al-s3-001",
      matriculaId: "mt-s3-001",
      tipo: "MENSALIDADE",
      descricao: "Mensalidade Fevereiro 2026 – Mensal S3",
      valor: 119.9,
      desconto: 0,
      valorFinal: 119.9,
      dataVencimento: "2026-02-08",
      dataPagamento: "2026-02-07",
      formaPagamento: "CARTAO_CREDITO",
      status: "PAGO",
      dataCriacao: "2026-02-05T10:00:00",
    },
  ];

  const tiposContaPagar: TipoContaPagar[] = [
    {
      id: "tcp-s1-luz",
      tenantId: TENANT_ID_S1,
      nome: "Conta de Luz",
      categoriaOperacional: "UTILIDADES",
      grupoDre: "DESPESA_OPERACIONAL",
      centroCustoPadrao: "Operacional",
      ativo: true,
    },
    {
      id: "tcp-s1-aluguel",
      tenantId: TENANT_ID_S1,
      nome: "Aluguel",
      categoriaOperacional: "ALUGUEL",
      grupoDre: "DESPESA_OPERACIONAL",
      centroCustoPadrao: "Infraestrutura",
      ativo: true,
    },
    {
      id: "tcp-s1-folha",
      tenantId: TENANT_ID_S1,
      nome: "Folha de Pagamento",
      categoriaOperacional: "FOLHA",
      grupoDre: "DESPESA_OPERACIONAL",
      centroCustoPadrao: "Pessoal",
      ativo: true,
    },
    {
      id: "tcp-s1-internet",
      tenantId: TENANT_ID_S1,
      nome: "Internet",
      categoriaOperacional: "UTILIDADES",
      grupoDre: "DESPESA_OPERACIONAL",
      centroCustoPadrao: "Operacional",
      ativo: true,
    },
    {
      id: "tcp-s1-manutencao",
      tenantId: TENANT_ID_S1,
      nome: "Manutenção",
      categoriaOperacional: "MANUTENCAO",
      grupoDre: "DESPESA_OPERACIONAL",
      centroCustoPadrao: "Operacional",
      ativo: true,
    },
    {
      id: "tcp-s1-impostos",
      tenantId: TENANT_ID_S1,
      nome: "Impostos e Taxas",
      categoriaOperacional: "IMPOSTOS",
      grupoDre: "IMPOSTOS",
      centroCustoPadrao: "Fiscal",
      ativo: true,
    },
    {
      id: "tcp-s1-taxa-bancaria",
      tenantId: TENANT_ID_S1,
      nome: "Taxas Bancárias",
      categoriaOperacional: "OUTROS",
      grupoDre: "DESPESA_FINANCEIRA",
      centroCustoPadrao: "Financeiro",
      ativo: true,
    },
    {
      id: "tcp-s1-marketing",
      tenantId: TENANT_ID_S1,
      nome: "Marketing de Performance",
      categoriaOperacional: "MARKETING",
      grupoDre: "DESPESA_OPERACIONAL",
      centroCustoPadrao: "Comercial",
      ativo: true,
    },
    {
      id: "tcp-s1-limpeza",
      tenantId: TENANT_ID_S1,
      nome: "Limpeza e Higienização",
      categoriaOperacional: "UTILIDADES",
      grupoDre: "DESPESA_OPERACIONAL",
      centroCustoPadrao: "Operacional",
      ativo: true,
    },
    {
      id: "tcp-s3-luz",
      tenantId: TENANT_ID_S3,
      nome: "Conta de Luz",
      categoriaOperacional: "UTILIDADES",
      grupoDre: "DESPESA_OPERACIONAL",
      centroCustoPadrao: "Operacional",
      ativo: true,
    },
    {
      id: "tcp-s3-aluguel",
      tenantId: TENANT_ID_S3,
      nome: "Aluguel",
      categoriaOperacional: "ALUGUEL",
      grupoDre: "DESPESA_OPERACIONAL",
      centroCustoPadrao: "Infraestrutura",
      ativo: true,
    },
    {
      id: "tcp-s3-folha",
      tenantId: TENANT_ID_S3,
      nome: "Folha de Pagamento",
      categoriaOperacional: "FOLHA",
      grupoDre: "DESPESA_OPERACIONAL",
      centroCustoPadrao: "Pessoal",
      ativo: true,
    },
    {
      id: "tcp-s3-internet",
      tenantId: TENANT_ID_S3,
      nome: "Internet",
      categoriaOperacional: "UTILIDADES",
      grupoDre: "DESPESA_OPERACIONAL",
      centroCustoPadrao: "Operacional",
      ativo: true,
    },
    {
      id: "tcp-s3-manutencao",
      tenantId: TENANT_ID_S3,
      nome: "Manutenção",
      categoriaOperacional: "MANUTENCAO",
      grupoDre: "DESPESA_OPERACIONAL",
      centroCustoPadrao: "Operacional",
      ativo: true,
    },
    {
      id: "tcp-s3-impostos",
      tenantId: TENANT_ID_S3,
      nome: "Impostos e Taxas",
      categoriaOperacional: "IMPOSTOS",
      grupoDre: "IMPOSTOS",
      centroCustoPadrao: "Fiscal",
      ativo: true,
    },
    {
      id: "tcp-s3-taxa-bancaria",
      tenantId: TENANT_ID_S3,
      nome: "Taxas Bancárias",
      categoriaOperacional: "OUTROS",
      grupoDre: "DESPESA_FINANCEIRA",
      centroCustoPadrao: "Financeiro",
      ativo: true,
    },
    {
      id: "tcp-s3-marketing",
      tenantId: TENANT_ID_S3,
      nome: "Marketing de Performance",
      categoriaOperacional: "MARKETING",
      grupoDre: "DESPESA_OPERACIONAL",
      centroCustoPadrao: "Comercial",
      ativo: true,
    },
    {
      id: "tcp-s3-limpeza",
      tenantId: TENANT_ID_S3,
      nome: "Limpeza e Higienização",
      categoriaOperacional: "UTILIDADES",
      grupoDre: "DESPESA_OPERACIONAL",
      centroCustoPadrao: "Operacional",
      ativo: true,
    },
  ];

  const regrasRecorrenciaContaPagar: RegraRecorrenciaContaPagar[] = [
    {
      id: "rrcp-s1-luz",
      tenantId: TENANT_ID_S1,
      tipoContaId: "tcp-s1-luz",
      fornecedor: "Enel Energia",
      descricao: "Conta de energia elétrica",
      categoriaOperacional: "UTILIDADES",
      grupoDre: "DESPESA_OPERACIONAL",
      centroCusto: "Operacional",
      valorOriginal: 1240.45,
      desconto: 0,
      jurosMulta: 0,
      recorrencia: "MENSAL",
      diaDoMes: 22,
      dataInicial: "2026-02-22",
      termino: "SEM_FIM",
      criarLancamentoInicial: true,
      timezone: "America/Sao_Paulo",
      status: "ATIVA",
      ultimaGeracaoEm: "2026-02-05T10:00:00",
      dataCriacao: "2026-02-05T10:00:00",
    },
  ];

  const contasPagar: ContaPagar[] = [
    {
      id: "cp-s1-001",
      tenantId: TENANT_ID_S1,
      tipoContaId: "tcp-s1-aluguel",
      fornecedor: "Imobiliária Vila Nova",
      documentoFornecedor: "11.222.333/0001-44",
      descricao: "Aluguel da unidade - fevereiro/2026",
      categoria: "ALUGUEL",
      grupoDre: "DESPESA_OPERACIONAL",
      centroCusto: "Infraestrutura",
      regime: "FIXA",
      competencia: "2026-02-01",
      dataEmissao: "2026-01-25",
      dataVencimento: "2026-02-10",
      dataPagamento: "2026-02-08",
      valorOriginal: 8200,
      desconto: 0,
      jurosMulta: 0,
      valorPago: 8200,
      formaPagamento: "PIX",
      status: "PAGA",
      origemLancamento: "MANUAL",
      observacoes: "Contrato 24 meses",
      dataCriacao: "2026-01-25T09:00:00",
    },
    {
      id: "cp-s1-002",
      tenantId: TENANT_ID_S1,
      tipoContaId: "tcp-s1-luz",
      fornecedor: "Enel Energia",
      descricao: "Conta de energia elétrica",
      categoria: "UTILIDADES",
      grupoDre: "DESPESA_OPERACIONAL",
      centroCusto: "Operacional",
      regime: "FIXA",
      competencia: "2026-02-01",
      dataEmissao: "2026-02-05",
      dataVencimento: "2026-02-22",
      valorOriginal: 1240.45,
      desconto: 0,
      jurosMulta: 0,
      status: "PENDENTE",
      regraRecorrenciaId: "rrcp-s1-luz",
      origemLancamento: "RECORRENTE",
      dataCriacao: "2026-02-05T10:00:00",
    },
    {
      id: "cp-s1-003",
      tenantId: TENANT_ID_S1,
      tipoContaId: "tcp-s1-folha",
      fornecedor: "Staff RH",
      descricao: "Folha de pagamento - instrutores",
      categoria: "FOLHA",
      grupoDre: "DESPESA_OPERACIONAL",
      centroCusto: "Pessoal",
      regime: "FIXA",
      competencia: "2026-02-01",
      dataEmissao: "2026-02-01",
      dataVencimento: "2026-02-07",
      dataPagamento: "2026-02-07",
      valorOriginal: 18850,
      desconto: 0,
      jurosMulta: 0,
      valorPago: 18850,
      formaPagamento: "RECORRENTE",
      status: "PAGA",
      origemLancamento: "MANUAL",
      dataCriacao: "2026-02-01T09:15:00",
    },
    {
      id: "cp-s1-004",
      tenantId: TENANT_ID_S1,
      fornecedor: "Meta Ads",
      descricao: "Campanha de captação de leads",
      categoria: "MARKETING",
      grupoDre: "DESPESA_OPERACIONAL",
      centroCusto: "Comercial",
      regime: "AVULSA",
      competencia: "2026-02-01",
      dataEmissao: "2026-02-12",
      dataVencimento: "2026-02-20",
      valorOriginal: 980,
      desconto: 0,
      jurosMulta: 0,
      status: "PENDENTE",
      origemLancamento: "MANUAL",
      dataCriacao: "2026-02-12T11:40:00",
    },
    {
      id: "cp-s1-005",
      tenantId: TENANT_ID_S1,
      tipoContaId: "tcp-s1-internet",
      fornecedor: "Vivo Empresas",
      descricao: "Link dedicado de internet - fevereiro/2026",
      categoria: "UTILIDADES",
      grupoDre: "DESPESA_OPERACIONAL",
      centroCusto: "Operacional",
      regime: "FIXA",
      competencia: "2026-02-01",
      dataEmissao: "2026-02-01",
      dataVencimento: "2026-02-15",
      dataPagamento: "2026-02-15",
      valorOriginal: 489.9,
      desconto: 0,
      jurosMulta: 0,
      valorPago: 489.9,
      formaPagamento: "PIX",
      status: "PAGA",
      origemLancamento: "MANUAL",
      dataCriacao: "2026-02-01T08:20:00",
    },
    {
      id: "cp-s1-006",
      tenantId: TENANT_ID_S1,
      tipoContaId: "tcp-s1-impostos",
      fornecedor: "Prefeitura Municipal",
      descricao: "ISS sobre serviços - competência fevereiro/2026",
      categoria: "IMPOSTOS",
      grupoDre: "IMPOSTOS",
      centroCusto: "Fiscal",
      regime: "FIXA",
      competencia: "2026-02-01",
      dataEmissao: "2026-02-18",
      dataVencimento: "2026-02-20",
      valorOriginal: 1320,
      desconto: 0,
      jurosMulta: 0,
      status: "PENDENTE",
      origemLancamento: "MANUAL",
      dataCriacao: "2026-02-18T09:00:00",
    },
    {
      id: "cp-s1-007",
      tenantId: TENANT_ID_S1,
      tipoContaId: "tcp-s1-taxa-bancaria",
      fornecedor: "Banco Fit S.A.",
      descricao: "Taxas de adquirência e manutenção de conta",
      categoria: "OUTROS",
      grupoDre: "DESPESA_FINANCEIRA",
      centroCusto: "Financeiro",
      regime: "FIXA",
      competencia: "2026-02-01",
      dataEmissao: "2026-02-21",
      dataVencimento: "2026-02-25",
      valorOriginal: 210.35,
      desconto: 0,
      jurosMulta: 0,
      status: "PENDENTE",
      origemLancamento: "MANUAL",
      dataCriacao: "2026-02-21T10:10:00",
    },
    {
      id: "cp-s1-008",
      tenantId: TENANT_ID_S1,
      tipoContaId: "tcp-s1-limpeza",
      fornecedor: "Higieniza SP",
      descricao: "Materiais e serviço de limpeza",
      categoria: "UTILIDADES",
      grupoDre: "DESPESA_OPERACIONAL",
      centroCusto: "Operacional",
      regime: "AVULSA",
      competencia: "2026-02-01",
      dataEmissao: "2026-02-05",
      dataVencimento: "2026-02-14",
      valorOriginal: 380,
      desconto: 0,
      jurosMulta: 0,
      status: "CANCELADA",
      origemLancamento: "MANUAL",
      observacoes: "Duplicidade de lançamento",
      dataCriacao: "2026-02-05T15:20:00",
      dataAtualizacao: "2026-02-06T10:00:00",
    },
    {
      id: "cp-s3-001",
      tenantId: TENANT_ID_S3,
      tipoContaId: "tcp-s3-aluguel",
      fornecedor: "Imobiliária Central",
      descricao: "Aluguel da unidade - fevereiro/2026",
      categoria: "ALUGUEL",
      grupoDre: "DESPESA_OPERACIONAL",
      centroCusto: "Infraestrutura",
      regime: "FIXA",
      competencia: "2026-02-01",
      dataEmissao: "2026-01-25",
      dataVencimento: "2026-02-10",
      dataPagamento: "2026-02-09",
      valorOriginal: 6800,
      desconto: 0,
      jurosMulta: 0,
      valorPago: 6800,
      formaPagamento: "PIX",
      status: "PAGA",
      origemLancamento: "MANUAL",
      dataCriacao: "2026-01-25T09:00:00",
    },
    {
      id: "cp-s3-002",
      tenantId: TENANT_ID_S3,
      tipoContaId: "tcp-s3-manutencao",
      fornecedor: "Aquafit Equipamentos",
      descricao: "Manutenção esteiras e bikes",
      categoria: "MANUTENCAO",
      grupoDre: "DESPESA_OPERACIONAL",
      centroCusto: "Operacional",
      regime: "AVULSA",
      competencia: "2026-02-01",
      dataEmissao: "2026-02-03",
      dataVencimento: "2026-02-18",
      valorOriginal: 2450,
      desconto: 0,
      jurosMulta: 0,
      status: "PENDENTE",
      origemLancamento: "MANUAL",
      dataCriacao: "2026-02-03T14:20:00",
    },
    {
      id: "cp-s3-003",
      tenantId: TENANT_ID_S3,
      tipoContaId: "tcp-s3-luz",
      fornecedor: "Light Energia",
      descricao: "Conta de energia elétrica - fevereiro/2026",
      categoria: "UTILIDADES",
      grupoDre: "DESPESA_OPERACIONAL",
      centroCusto: "Operacional",
      regime: "FIXA",
      competencia: "2026-02-01",
      dataEmissao: "2026-02-06",
      dataVencimento: "2026-02-21",
      dataPagamento: "2026-02-21",
      valorOriginal: 1188.72,
      desconto: 0,
      jurosMulta: 0,
      valorPago: 1188.72,
      formaPagamento: "PIX",
      status: "PAGA",
      origemLancamento: "MANUAL",
      dataCriacao: "2026-02-06T09:00:00",
    },
    {
      id: "cp-s3-004",
      tenantId: TENANT_ID_S3,
      tipoContaId: "tcp-s3-internet",
      fornecedor: "Claro Empresas",
      descricao: "Internet e telefonia - fevereiro/2026",
      categoria: "UTILIDADES",
      grupoDre: "DESPESA_OPERACIONAL",
      centroCusto: "Operacional",
      regime: "FIXA",
      competencia: "2026-02-01",
      dataEmissao: "2026-02-10",
      dataVencimento: "2026-02-24",
      valorOriginal: 429.9,
      desconto: 0,
      jurosMulta: 0,
      status: "PENDENTE",
      origemLancamento: "MANUAL",
      dataCriacao: "2026-02-10T11:40:00",
    },
    {
      id: "cp-s3-005",
      tenantId: TENANT_ID_S3,
      tipoContaId: "tcp-s3-impostos",
      fornecedor: "Secretaria da Fazenda",
      descricao: "Tributos federais (Simples Nacional)",
      categoria: "IMPOSTOS",
      grupoDre: "IMPOSTOS",
      centroCusto: "Fiscal",
      regime: "FIXA",
      competencia: "2026-02-01",
      dataEmissao: "2026-02-12",
      dataVencimento: "2026-02-20",
      valorOriginal: 1650,
      desconto: 0,
      jurosMulta: 0,
      status: "PENDENTE",
      origemLancamento: "MANUAL",
      dataCriacao: "2026-02-12T13:30:00",
    },
    {
      id: "cp-s3-006",
      tenantId: TENANT_ID_S3,
      tipoContaId: "tcp-s3-marketing",
      fornecedor: "Meta Ads",
      descricao: "Campanha de aquisição local - março/2026",
      categoria: "MARKETING",
      grupoDre: "DESPESA_OPERACIONAL",
      centroCusto: "Comercial",
      regime: "AVULSA",
      competencia: "2026-03-01",
      dataEmissao: "2026-02-23",
      dataVencimento: "2026-03-05",
      valorOriginal: 900,
      desconto: 50,
      jurosMulta: 0,
      status: "PENDENTE",
      origemLancamento: "MANUAL",
      dataCriacao: "2026-02-23T08:40:00",
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

  const nomesBase = [
    "Lucas", "Mariana", "Gustavo", "Patricia", "Rafael", "Camila", "Diego", "Aline", "Vitor", "Beatriz",
    "Henrique", "Juliana", "Thiago", "Larissa", "Felipe", "Isabela", "Andre", "Renata", "Caio", "Amanda",
  ];
  const sobrenomesBase = [
    "Souza", "Oliveira", "Pereira", "Costa", "Rodrigues", "Almeida", "Nunes", "Lima", "Carvalho", "Araujo",
  ];

  for (let i = 1; i <= 50; i += 1) {
    const tenantId = i <= 35 ? TENANT_ID_S1 : TENANT_ID_S3;
    const isS1 = tenantId === TENANT_ID_S1;
    const nome = `${nomesBase[i % nomesBase.length]} ${sobrenomesBase[i % sobrenomesBase.length]} ${i}`;
    const alunoId = `al-demo-${String(i).padStart(3, "0")}`;
    const cpf = `${String(100 + i).padStart(3, "0")}.${String(200 + i).padStart(3, "0")}.${String(300 + i).padStart(3, "0")}-${String(i % 99).padStart(2, "0")}`;
    const sexo = i % 3 === 0 ? "OUTRO" : i % 2 === 0 ? "F" : "M";
    const dataCadastro = `2026-01-${String((i % 28) + 1).padStart(2, "0")}T10:00:00`;
    alunos.push({
      id: alunoId,
      tenantId,
      nome,
      email: `aluno${i}@conceitofit.com`,
      telefone: `(11) 9${String(70000000 + i).slice(-8)}`,
      cpf,
      dataNascimento: `19${80 + (i % 20)}-${String(((i % 12) + 1)).padStart(2, "0")}-${String(((i % 28) + 1)).padStart(2, "0")}`,
      sexo: sexo as Aluno["sexo"],
      status: "ATIVO",
      dataCadastro,
    });

    if (i <= 40) {
      const matriculaId = `mt-demo-${String(i).padStart(3, "0")}`;
      const planoId = isS1 ? "pln-s1-001" : "pln-s3-001";
      const inicio = `2026-02-${String((i % 26) + 1).padStart(2, "0")}`;
      const fim = `2026-03-${String((i % 26) + 1).padStart(2, "0")}`;
      matriculas.push({
        id: matriculaId,
        tenantId,
        alunoId,
        planoId,
        dataInicio: inicio,
        dataFim: fim,
        valorPago: isS1 ? 129.9 : 119.9,
        valorMatricula: isS1 ? 40 : 35,
        desconto: i % 5 === 0 ? 10 : 0,
        formaPagamento: i % 2 === 0 ? "PIX" : "CARTAO_CREDITO",
        status: "ATIVA",
        renovacaoAutomatica: true,
        dataCriacao: `${inicio}T09:00:00`,
      });
      pagamentos.push({
        id: `pg-demo-${String(i).padStart(3, "0")}`,
        tenantId,
        alunoId,
        matriculaId,
        tipo: "MENSALIDADE",
        descricao: `Mensalidade ${isS1 ? "S1" : "S3"} – ${nome}`,
        valor: isS1 ? 129.9 : 119.9,
        desconto: i % 5 === 0 ? 10 : 0,
        valorFinal: (isS1 ? 129.9 : 119.9) - (i % 5 === 0 ? 10 : 0),
        dataVencimento: inicio,
        dataPagamento: i % 7 === 0 ? undefined : `${inicio}`,
        formaPagamento: i % 2 === 0 ? "PIX" : "CARTAO_CREDITO",
        status: i % 7 === 0 ? "PENDENTE" : "PAGO",
        dataCriacao: `${inicio}T09:10:00`,
      });
    }

    if (i <= 24) {
      vendas.push({
        id: `vd-demo-${String(i).padStart(3, "0")}`,
        tenantId,
        tipo: i % 6 === 0 ? "PRODUTO" : i % 5 === 0 ? "SERVICO" : "PLANO",
        clienteId: alunoId,
        clienteNome: nome,
        status: "FECHADA",
        itens: [
          {
            id: `vdi-demo-${String(i).padStart(3, "0")}`,
            tipo: i % 6 === 0 ? "PRODUTO" : i % 5 === 0 ? "SERVICO" : "PLANO",
            referenciaId: isS1 ? (i % 6 === 0 ? "prd-001" : i % 5 === 0 ? "srv-s1-001" : "pln-s1-001") : (i % 6 === 0 ? "prd-001" : i % 5 === 0 ? "srv-s3-001" : "pln-s3-001"),
            descricao: i % 6 === 0 ? "Whey Protein 900g" : i % 5 === 0 ? "Avaliação física" : "Plano mensal",
            quantidade: 1,
            valorUnitario: i % 6 === 0 ? 149.9 : i % 5 === 0 ? 110 : isS1 ? 129.9 : 119.9,
            desconto: i % 8 === 0 ? 10 : 0,
            valorTotal: (i % 6 === 0 ? 149.9 : i % 5 === 0 ? 110 : isS1 ? 129.9 : 119.9) - (i % 8 === 0 ? 10 : 0),
          },
        ],
        subtotal: i % 6 === 0 ? 149.9 : i % 5 === 0 ? 110 : isS1 ? 129.9 : 119.9,
        descontoTotal: i % 8 === 0 ? 10 : 0,
        acrescimoTotal: 0,
        total: (i % 6 === 0 ? 149.9 : i % 5 === 0 ? 110 : isS1 ? 129.9 : 119.9) - (i % 8 === 0 ? 10 : 0),
        pagamento: {
          formaPagamento: i % 2 === 0 ? "PIX" : "CARTAO_CREDITO",
          valorPago: (i % 6 === 0 ? 149.9 : i % 5 === 0 ? 110 : isS1 ? 129.9 : 119.9) - (i % 8 === 0 ? 10 : 0),
        },
        dataCriacao: `2026-02-${String((i % 28) + 1).padStart(2, "0")}T12:00:00`,
      });
    }
  }

  for (let i = 1; i <= 20; i += 1) {
    const tenantId = i <= 14 ? TENANT_ID_S1 : TENANT_ID_S3;
    const nome = `${nomesBase[(i + 3) % nomesBase.length]} ${sobrenomesBase[(i + 2) % sobrenomesBase.length]} Prospect ${i}`;
    const origem = i % 4 === 0 ? "VISITA_PRESENCIAL" : i % 3 === 0 ? "INSTAGRAM" : i % 2 === 0 ? "SITE" : "WHATSAPP";
    const status = i % 6 === 0 ? "VISITOU" : i % 5 === 0 ? "EM_CONTATO" : i % 4 === 0 ? "AGENDOU_VISITA" : "NOVO";
    prospects.push({
      id: `pr-demo-${String(i).padStart(3, "0")}`,
      tenantId,
      responsavelId: tenantId === TENANT_ID_S1 ? "fn-s1-003" : "fn-s3-003",
      nome,
      telefone: `(21) 9${String(60000000 + i).slice(-8)}`,
      email: `prospect${i}@lead.com`,
      origem: origem as Prospect["origem"],
      status: status as Prospect["status"],
      dataCriacao: `2026-02-${String((i % 25) + 1).padStart(2, "0")}T08:00:00`,
      statusLog: [{ status: "NOVO", data: `2026-02-${String((i % 25) + 1).padStart(2, "0")}T08:00:00` }],
    });
  }

  return applyLegacyTenantMigration({
    academias: [academia],
    tenant,
    tenants,
    currentTenantId: PRIMARY_TENANT_ID,
    horarios,
    convenios,
    produtos,
    servicos,
    bandeirasCartao,
    cartoesCliente,
    atividades,
    cargos,
    salas,
    atividadeGrades,
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
    contasPagar,
    tiposContaPagar,
    regrasRecorrenciaContaPagar,
    vendas,
    vouchers,
    voucherCodigos,
    campanhasCrm,
  });
}

let store: Store = makeInitialStore();

export const TENANT_ID_DEFAULT = PRIMARY_TENANT_ID;

export function getStore(): Readonly<Store> {
  return store;
}

export function setStore(updater: (prev: Store) => Store): void {
  const prev = store;
  let nextRaw: Store;
  try {
    nextRaw = updater(prev);
  } catch (error) {
    console.error("Erro ao atualizar store", error);
    return;
  }
  if (!nextRaw) return;
  if (nextRaw === prev) return;
  const next = normalizeStore(nextRaw);
  store = next;
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

function mergeById<T extends { id: string }>(
  current: T[] | undefined,
  seeded: T[]
): T[] {
  const map = new Map<string, T>();
  for (const item of current ?? []) {
    map.set(item.id, item);
  }
  for (const item of seeded) {
    if (!map.has(item.id)) {
      map.set(item.id, item);
    }
  }
  return Array.from(map.values());
}

function normalizeStore(data: Store): Store {
  const defaults = makeInitialStore();
  const defaultAcademiaId = defaults.academias[0]?.id ?? "acd-default";
  const canonicalTenants: Record<string, Partial<Tenant>> = {
    "550e8400-e29b-41d4-a716-446655440001": {
      nome: "MANANCIAIS - S1",
      groupId: "GRP-SERGIO-AMIM",
      subdomain: "mananciais-s1",
      email: "contato@mananciais-s1.com.br",
      ativo: true,
    },
    "550e8400-e29b-41d4-a716-446655440002": {
      nome: "PECHINCHA - S3",
      groupId: "GRP-SERGIO-AMIM",
      subdomain: "pechincha-s3",
      email: "contato@pechincha-s3.com.br",
      ativo: true,
    },
  };

  const normalizedTenants = mergeById(
    data.tenants ?? (data.tenant ? [data.tenant] : []),
    defaults.tenants
  ).map((t) => ({
    ...(canonicalTenants[t.id] ?? {}),
    ...t,
    academiaId: t.academiaId ?? t.groupId ?? defaultAcademiaId,
    groupId: t.groupId ?? t.academiaId ?? defaultAcademiaId,
    ativo: t.ativo ?? true,
  })).map(normalizeTenantConfiguracoes);

  const normalizedAcademias: Academia[] = mergeById(
    data.academias,
    defaults.academias
  ).map((a) => ({
    ...a,
    ativo: a.ativo ?? true,
    branding: {
      themePreset: "CONCEITO_DARK" as TenantThemePreset,
      useCustomColors: false,
      ...(defaults.academias.find((x) => x.id === a.id)?.branding ?? {}),
      ...(a.branding ?? {}),
    },
  }));

  const normalizedTenant = normalizeTenantConfiguracoes({
    ...({
      id: PRIMARY_TENANT_ID,
      nome: "MANANCIAIS - S1",
      groupId: "GRP-SERGIO-AMIM",
      ativo: true,
    } as Tenant),
    ...(canonicalTenants[(data.tenant ?? { id: PRIMARY_TENANT_ID }).id] ?? {}),
    ...(data.tenant ?? {}),
    academiaId:
      (data.tenant ?? {}).academiaId ??
      (data.tenant ?? {}).groupId ??
      defaultAcademiaId,
    groupId:
      (data.tenant ?? {}).groupId ??
      (data.tenant ?? {}).academiaId ??
      defaultAcademiaId,
    ativo: (data.tenant ?? {}).ativo ?? true,
  });

  const result: Store = {
    ...data,
    academias: normalizedAcademias,
    tenant: normalizedTenant,
    tenants: normalizedTenants,
    currentTenantId: data.currentTenantId ?? data.tenant?.id ?? PRIMARY_TENANT_ID,
    horarios: (data.horarios && data.horarios.length > 0) ? data.horarios : defaults.horarios,
    convenios: (data.convenios && data.convenios.length > 0) ? data.convenios : defaults.convenios,
    produtos: mergeById((data.produtos && data.produtos.length > 0) ? data.produtos : undefined, defaults.produtos).map((p) => ({
      ...p,
      valorVenda: (p as unknown as { valorVenda?: number; valor?: number }).valorVenda ?? (p as unknown as { valor?: number }).valor ?? 0,
      unidadeMedida: (p as unknown as { unidadeMedida?: Produto["unidadeMedida"] }).unidadeMedida ?? "UN",
      controlaEstoque: (p as unknown as { controlaEstoque?: boolean }).controlaEstoque ?? true,
      estoqueAtual: (p as unknown as { estoqueAtual?: number }).estoqueAtual ?? 0,
      permiteDesconto: (p as unknown as { permiteDesconto?: boolean }).permiteDesconto ?? true,
      permiteVoucher: (p as unknown as { permiteVoucher?: boolean }).permiteVoucher ?? false,
    })),
    servicos: mergeById(data.servicos, defaults.servicos).map((s) => ({
      ...s,
      sku: (s as unknown as { sku?: string }).sku ?? undefined,
      categoria: (s as unknown as { categoria?: string }).categoria ?? undefined,
      duracaoMinutos: (s as unknown as { duracaoMinutos?: number }).duracaoMinutos ?? undefined,
      validadeDias: (s as unknown as { validadeDias?: number }).validadeDias ?? undefined,
      custo: (s as unknown as { custo?: number }).custo ?? undefined,
      comissaoPercentual: (s as unknown as { comissaoPercentual?: number }).comissaoPercentual ?? undefined,
      aliquotaImpostoPercentual: (s as unknown as { aliquotaImpostoPercentual?: number }).aliquotaImpostoPercentual ?? undefined,
      permiteDesconto: (s as unknown as { permiteDesconto?: boolean }).permiteDesconto ?? true,
      tipoCobranca: (s as unknown as { tipoCobranca?: "UNICO" | "RECORRENTE" }).tipoCobranca ?? "UNICO",
      recorrenciaDias: (s as unknown as { recorrenciaDias?: number }).recorrenciaDias ?? undefined,
      permiteAcessoCatraca: (s as unknown as { permiteAcessoCatraca?: boolean }).permiteAcessoCatraca ?? false,
      permiteVoucher: (s as unknown as { permiteVoucher?: boolean }).permiteVoucher ?? false,
    })),
    bandeirasCartao: mergeById(data.bandeirasCartao, defaults.bandeirasCartao),
    cartoesCliente: mergeById(data.cartoesCliente, defaults.cartoesCliente),
    salas: mergeById(data.salas, defaults.salas),
    cargos: mergeById(data.cargos, defaults.cargos),
    funcionarios: mergeById(data.funcionarios, defaults.funcionarios).map((f) => {
      const raw = f as unknown as { cargoId?: string; cargo?: string; podeMinistrarAulas?: boolean };
      return {
        ...f,
        cargoId: raw.cargoId,
        podeMinistrarAulas: raw.podeMinistrarAulas ?? false,
      };
    }),
    presencas: mergeById(data.presencas, defaults.presencas),
    prospectMensagens: mergeById(data.prospectMensagens, defaults.prospectMensagens),
    prospectAgendamentos: mergeById(data.prospectAgendamentos, defaults.prospectAgendamentos),
    prospects: mergeById(data.prospects, defaults.prospects).map((p) => ({
      ...p,
      dataCriacao: (p as unknown as { createdAt?: string }).createdAt ?? p.dataCriacao,
      dataUltimoContato: p.dataUltimoContato,
      motivoPerda: p.motivoPerda,
      statusLog: p.statusLog ?? [
        { status: p.status, data: (p as unknown as { createdAt?: string }).createdAt ?? p.dataCriacao },
      ],
    })),
    alunos: mergeById(data.alunos, defaults.alunos).map((a) => ({
      ...a,
      status: (a.status as string) === "BLOQUEADO" ? "INATIVO" : a.status,
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
    matriculas: mergeById(data.matriculas, defaults.matriculas).map((m) => ({
      ...m,
      dataCriacao: (m as unknown as { createdAt?: string }).createdAt ?? m.dataCriacao,
      dataAtualizacao: m.dataAtualizacao,
    })),
    vouchers: mergeById(data.vouchers, defaults.vouchers).map((v) => {
      const raw = v as unknown as Record<string, unknown>;
      const tenantId = v.tenantId;
      const tenantGroupId = tenantId
        ? (normalizedTenants.find((t) => t.id === tenantId)?.groupId ?? normalizedTenant.groupId)
        : normalizedTenant.groupId;
      const escopo = (v as unknown as { escopo?: "UNIDADE" | "GRUPO" }).escopo
        ?? (tenantId ? "UNIDADE" : "GRUPO");
      return {
        ...v,
        escopo,
        groupId: v.groupId ?? (escopo === "GRUPO" ? tenantGroupId : undefined),
        tenantId: escopo === "GRUPO" ? undefined : tenantId,
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
    voucherCodigos: mergeById(data.voucherCodigos, defaults.voucherCodigos),
    campanhasCrm: mergeById(data.campanhasCrm, defaults.campanhasCrm).map((c) => ({
      ...c,
      canais: Array.isArray(c.canais) ? c.canais : ["WHATSAPP"],
      disparosRealizados: c.disparosRealizados ?? 0,
      dataCriacao: c.dataCriacao ?? new Date().toISOString().slice(0, 19),
      dataAtualizacao: c.dataAtualizacao,
    })),
    pagamentos: mergeById(data.pagamentos, defaults.pagamentos).map((p) => ({
      ...p,
      dataCriacao: (p as unknown as { createdAt?: string }).createdAt ?? p.dataCriacao,
    })),
    tiposContaPagar: mergeById(data.tiposContaPagar, defaults.tiposContaPagar).map((tipo) => ({
      ...tipo,
      ativo: tipo.ativo ?? true,
      grupoDre: tipo.grupoDre ?? "DESPESA_OPERACIONAL",
    })),
    regrasRecorrenciaContaPagar: mergeById(
      data.regrasRecorrenciaContaPagar,
      defaults.regrasRecorrenciaContaPagar
    ).map((regra) => ({
      ...regra,
      status: regra.status ?? "ATIVA",
      recorrencia: regra.recorrencia ?? "MENSAL",
      termino: regra.termino ?? "SEM_FIM",
      criarLancamentoInicial: regra.criarLancamentoInicial ?? true,
      timezone: regra.timezone ?? "America/Sao_Paulo",
      dataCriacao: regra.dataCriacao ?? new Date().toISOString().slice(0, 19),
      dataAtualizacao: regra.dataAtualizacao,
    })),
    contasPagar: mergeById(data.contasPagar, defaults.contasPagar).map((c) => ({
      ...c,
      regime: c.regime ?? "AVULSA",
      desconto: Number(c.desconto ?? 0),
      jurosMulta: Number(c.jurosMulta ?? 0),
      grupoDre: c.grupoDre ?? "DESPESA_OPERACIONAL",
      valorPago: c.valorPago,
      status: c.status ?? "PENDENTE",
      origemLancamento: c.origemLancamento ?? (c.regraRecorrenciaId ? "RECORRENTE" : "MANUAL"),
      geradaAutomaticamente: c.geradaAutomaticamente ?? false,
      dataCriacao: c.dataCriacao ?? new Date().toISOString().slice(0, 19),
      dataAtualizacao: c.dataAtualizacao,
    })),
    vendas: mergeById(data.vendas, defaults.vendas),
    atividades: mergeById(data.atividades, defaults.atividades).map((a) => ({
      ...a,
      permiteCheckin: (a as unknown as { permiteCheckin?: boolean }).permiteCheckin ?? true,
      checkinObrigatorio:
        (a as unknown as { checkinObrigatorio?: boolean }).checkinObrigatorio ?? false,
    })),
    atividadeGrades: mergeById(data.atividadeGrades, defaults.atividadeGrades).map((g) => {
      const legacy = g as unknown as { diaSemana?: "SEG" | "TER" | "QUA" | "QUI" | "SEX" | "SAB" | "DOM" };
      const diasSemanaRaw: DiaSemana[] = Array.isArray((g as AtividadeGrade).diasSemana) && (g as AtividadeGrade).diasSemana.length > 0
        ? (g as AtividadeGrade).diasSemana.filter((dia): dia is DiaSemana => isDiaSemana(String(dia)))
        : legacy.diaSemana
          ? [legacy.diaSemana]
          : ["SEG"];
      const diasSemana: DiaSemana[] = diasSemanaRaw.length > 0 ? diasSemanaRaw : ["SEG"];
      return {
        ...g,
        diasSemana,
        funcionarioId: (g as unknown as { funcionarioId?: string }).funcionarioId,
        definicaoHorario: (g as unknown as { definicaoHorario?: "PREVIAMENTE" | "SOB_DEMANDA" }).definicaoHorario ?? "PREVIAMENTE",
        checkinLiberadoMinutosAntes: (g as unknown as { checkinLiberadoMinutosAntes?: number }).checkinLiberadoMinutosAntes ?? 60,
        duracaoMinutos: (g as unknown as { duracaoMinutos?: number }).duracaoMinutos ?? 60,
        acessoClientes: (g as unknown as { acessoClientes?: "TODOS_CLIENTES" | "APENAS_COM_CONTRATO_OU_SERVICO" }).acessoClientes ?? "TODOS_CLIENTES",
        permiteReserva: (g as unknown as { permiteReserva?: boolean }).permiteReserva ?? true,
        limitarVagasAgregadores: (g as unknown as { limitarVagasAgregadores?: boolean }).limitarVagasAgregadores ?? false,
        exibirWellhub: (g as unknown as { exibirWellhub?: boolean }).exibirWellhub ?? false,
        permitirSaidaAntesInicio: (g as unknown as { permitirSaidaAntesInicio?: boolean }).permitirSaidaAntesInicio ?? false,
        permitirEscolherNumeroVaga: (g as unknown as { permitirEscolherNumeroVaga?: boolean }).permitirEscolherNumeroVaga ?? false,
        exibirNoAppCliente: (g as unknown as { exibirNoAppCliente?: boolean }).exibirNoAppCliente ?? true,
        exibirNoAutoatendimento: (g as unknown as { exibirNoAutoatendimento?: boolean }).exibirNoAutoatendimento ?? false,
        exibirNoWodTv: (g as unknown as { exibirNoWodTv?: boolean }).exibirNoWodTv ?? false,
        finalizarAtividadeAutomaticamente: (g as unknown as { finalizarAtividadeAutomaticamente?: boolean }).finalizarAtividadeAutomaticamente ?? true,
        desabilitarListaEspera: (g as unknown as { desabilitarListaEspera?: boolean }).desabilitarListaEspera ?? false,
      };
    }),
    planos: mergeById(data.planos, defaults.planos).map((p) => ({
      ...p,
      cobraAnuidade: (p as unknown as { cobraAnuidade?: boolean }).cobraAnuidade ?? false,
      valorAnuidade: (p as unknown as { valorAnuidade?: number }).valorAnuidade,
      parcelasMaxAnuidade: (p as unknown as { parcelasMaxAnuidade?: number }).parcelasMaxAnuidade ?? 1,
      permiteRenovacaoAutomatica: p.tipo === "AVULSO" ? false : (p as unknown as { permiteRenovacaoAutomatica?: boolean }).permiteRenovacaoAutomatica ?? true,
      permiteCobrancaRecorrente: p.tipo === "AVULSO" ? false : (p as unknown as { permiteCobrancaRecorrente?: boolean }).permiteCobrancaRecorrente ?? false,
      diaCobrancaPadrao: (p as unknown as { diaCobrancaPadrao?: number }).diaCobrancaPadrao,
      contratoTemplateHtml: (p as unknown as { contratoTemplateHtml?: string }).contratoTemplateHtml ?? "",
      contratoAssinatura: (p as unknown as { contratoAssinatura?: Plano["contratoAssinatura"] }).contratoAssinatura ?? "AMBAS",
      contratoEnviarAutomaticoEmail: (p as unknown as { contratoEnviarAutomaticoEmail?: boolean }).contratoEnviarAutomaticoEmail ?? false,
    })),
  };

  return applyLegacyTenantMigration(result);
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
  if (loaded) {
    store = loaded;
    persistStore(store);
  } else persistStore(store);
}
