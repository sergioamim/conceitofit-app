import { UUID, LocalDate, LocalDateTime, Endereco, StatusCadastro } from './comum';
import { Aluno, StatusAluno } from './aluno';
import { OrigemProspect } from './prospect';
import { Matricula } from './matricula';
import { Pagamento, GrupoDre, CategoriaContaPagar, DreProjectionScenario } from './pagamento';

export interface TenantOperationalEligibilityReason {
  code: string;
  message: string;
}

export interface TenantOperationalEligibility {
  tenantId: UUID;
  tenantName?: string;
  eligible: boolean;
  defaultTenant?: boolean;
  blockedReasons: TenantOperationalEligibilityReason[];
}

export interface ClienteOperationalContext {
  tenantId: UUID;
  tenantName?: string;
  baseTenantId?: UUID;
  baseTenantName?: string;
  aluno: Aluno;
  eligibleTenants: TenantOperationalEligibility[];
  blockedTenants: TenantOperationalEligibility[];
  blocked: boolean;
  message?: string;
}

export interface ClienteMigracaoUnidadePayload {
  tenantDestinoId: UUID;
  justificativa: string;
  preservarContextoComercial?: boolean;
}

export interface ClienteMigracaoUnidadeResult {
  success: boolean;
  auditId?: string;
  eventType?: string;
  message?: string;
  tenantOrigemId?: UUID;
  tenantOrigemNome?: string;
  tenantDestinoId?: UUID;
  tenantDestinoNome?: string;
  baseTenantIdAnterior?: UUID;
  baseTenantIdAtual?: UUID;
  suggestedActiveTenantId?: UUID;
  preservarContextoComercial?: boolean;
  blockedBy?: any[]; // ClienteExclusaoBlockedBy
  aluno?: Aluno;
}

export interface Tenant {
  id: UUID;
  academiaId?: UUID;
  academiaNome?: string;
  nome: string;
  razaoSocial?: string;
  documento?: string;
  groupId?: string;
  subdomain?: string;
  email?: string;
  telefone?: string;
  ativo?: boolean;
  endereco?: Endereco;
  branding?: TenantBranding;
  configuracoes?: TenantConfiguracoes;
}

export interface Academia {
  id: UUID;
  nome: string;
  razaoSocial?: string;
  documento?: string;
  email?: string;
  telefone?: string;
  endereco?: Endereco;
  branding?: TenantBranding;
  ativo?: boolean;
}

export type UnidadeOnboardingStrategy = "CARGA_INICIAL" | "IMPORTAR_DEPOIS" | "PREPARAR_ETL";
export type UnidadeOnboardingStatus =
  | "PENDENTE_SEED"
  | "AGUARDANDO_IMPORTACAO"
  | "EM_IMPORTACAO"
  | "PRONTA"
  | "ERRO";
export type UnidadeOnboardingOrigem = "SEED" | "CSV" | "PACOTE" | "MANUAL";
export type UnidadeOnboardingEventType =
  | "UNIDADE_CRIADA"
  | "ESTRATEGIA_DEFINIDA"
  | "SEED_AGENDADO"
  | "IMPORTACAO_PREPARADA"
  | "JOB_CRIADO"
  | "JOB_STATUS_ATUALIZADO";

export interface UnidadeOnboardingEvent {
  id: UUID;
  tenantId: UUID;
  type: UnidadeOnboardingEventType;
  titulo: string;
  descricao?: string;
  status?: UnidadeOnboardingStatus;
  origem?: UnidadeOnboardingOrigem;
  jobId?: string;
  criadoEm: LocalDateTime;
}

export interface UnidadeOnboardingState {
  tenantId: UUID;
  academiaId?: UUID;
  estrategia: UnidadeOnboardingStrategy;
  status: UnidadeOnboardingStatus;
  evoFilialId?: string;
  ultimoJobId?: string;
  ultimaOrigem?: UnidadeOnboardingOrigem;
  ultimaMensagem?: string;
  criadoEm: LocalDateTime;
  atualizadoEm: LocalDateTime;
  eventos: UnidadeOnboardingEvent[];
}

export type TenantThemePreset =
  | "CONCEITO_DARK"
  | "AZUL_OCEANO"
  | "VERDE_ENERGIA"
  | "GRAFITE_FIRE"
  | "DRACULA"
  | "AREIA_SOLAR"
  | "NUVEM_CLARA"
  | "ROSA_EDITORIAL"
  | "COBALTO_NOTURNO"
  | "AURORA_BOREAL"
  | "TERRACOTA_SUAVE"
  | "MENTA_MODERNA";

export interface TenantThemeColors {
  accent: string;
  primary: string;
  ring: string;
  secondary: string;
  background: string;
  surface: string;
  border: string;
  foreground: string;
  mutedForeground: string;
  danger: string;
  warning: string;
  teal: string;
}

export interface TenantBranding {
  appName?: string;
  logoUrl?: string;
  themePreset?: TenantThemePreset;
  useCustomColors?: boolean;
  colors?: Partial<TenantThemeColors>;
}

export interface StorefrontTheme {
  id?: string;
  tenantId: string;
  logoUrl?: string;
  faviconUrl?: string;
  heroImageUrl?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  themePreset?: TenantThemePreset;
  useCustomColors?: boolean;
  colors?: Partial<TenantThemeColors>;
  footerText?: string;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    whatsapp?: string;
  };
  updatedAt?: string;
}

export type CupomPrintMode = "58MM" | "80MM" | "CUSTOM";

export interface TenantConfiguracoes {
  impressaoCupom?: {
    modo: CupomPrintMode;
    larguraCustomMm?: number;
  };
}

export interface HorarioFuncionamento {
  dia: "SEG" | "TER" | "QUA" | "QUI" | "SEX" | "SAB" | "DOM";
  abre: string;
  fecha: string;
  fechado?: boolean;
}

/* --- Metrics / Dashboard --- */

export interface DashboardData {
  totalAlunosAtivos: number;
  prospectsNovos: number;
  matriculasDoMes: number;
  receitaDoMes: number;
  prospectsRecentes: any[]; // Prospect
  matriculasVencendo: (Matricula & { aluno?: Aluno; plano?: any })[];
  pagamentosPendentes: (Pagamento & { aluno?: Aluno })[];
  statusAlunoCount: Record<StatusAluno, number>;
  prospectsEmAberto: number;
  followupPendente: number;
  visitasAguardandoRetorno: number;
  prospectsNovosAnterior: number;
  matriculasDoMesAnterior: number;
  receitaDoMesAnterior: number;
  ticketMedio: number;
  ticketMedioAnterior: number;
  pagamentosRecebidosMes: number;
  pagamentosRecebidosMesAnterior: number;
  vendasNovas: number;
  vendasRecorrentes: number;
  inadimplencia: number;
  aReceber: number;
}

export interface MetricasOperacionaisGlobalSerie {
  referencia: string;
  label: string;
  total: number;
}

export interface MetricasOperacionaisGlobalAcademia {
  academiaId?: UUID;
  academiaNome: string;
  unidades: number;
  alunosAtivos: number;
  matriculasAtivas: number;
  vendasMesQuantidade: number;
  vendasMesValor: number;
  ticketMedio: number;
}

export interface MetricasOperacionaisGlobal {
  totalAlunosAtivos: number;
  totalMatriculasAtivas: number;
  vendasMesQuantidade: number;
  vendasMesValor: number;
  ticketMedioGlobal: number;
  novosAlunosMes: number;
  novosAlunosMesAnterior: number;
  tendenciaCrescimentoPercentual: number;
  evolucaoNovosAlunos: MetricasOperacionaisGlobalSerie[];
  distribuicaoAcademias: MetricasOperacionaisGlobalAcademia[];
  generatedAt?: LocalDateTime;
}

export type AcademiaHealthLevel = "SAUDAVEL" | "RISCO" | "CRITICO";
export type AcademiaContractStatus = "ATIVO" | "EM_RISCO" | "SUSPENSO" | "CANCELADO";

export interface AcademiaHealthStatus {
  academiaId?: UUID;
  academiaNome: string;
  unidades: number;
  alunosAtivos: number;
  churnMensal: number;
  inadimplenciaPercentual: number;
  ultimoLoginAdmin?: LocalDateTime;
  statusContrato: AcademiaContractStatus;
  planoContratado?: string;
  alertasRisco: string[];
  healthLevel: AcademiaHealthLevel;
  diasSemLoginAdmin?: number;
}

export interface AcademiasHealthMap {
  items: AcademiaHealthStatus[];
  generatedAt?: LocalDateTime;
}

/* --- Security / RBAC --- */

export type RbacPermission = "VIEW" | "EDIT" | "MANAGE";

export interface RbacPerfil {
  id: UUID;
  tenantId: UUID;
  roleName: string;
  displayName: string;
  description?: string;
  active: boolean;
  createdAt?: LocalDateTime;
  updatedAt?: LocalDateTime;
}

export interface RbacPerfilCreatePayload {
  roleName: string;
  displayName: string;
  description?: string;
  active: boolean;
}

export type RbacPerfilUpdatePayload = Partial<RbacPerfilCreatePayload>;

export interface RbacUser {
  id: UUID;
  tenantId: UUID;
  name: string;
  fullName?: string;
  email: string;
  active?: boolean;
}

export interface SecurityUserLoginIdentifierInput {
  label: string;
  value: string;
}

export interface RbacUserCreatePayload {
  name: string;
  fullName?: string;
  email: string;
  userKind?: string;
  networkId?: UUID;
  networkName?: string;
  networkSubdomain?: string;
  tenantIds: UUID[];
  defaultTenantId?: UUID;
  initialPerfilIds?: UUID[];
  loginIdentifiers?: SecurityUserLoginIdentifierInput[];
}

export interface RbacFeature {
  featureKey: string;
  name?: string;
  enabled: boolean;
  rollout: number;
}

export interface RbacFeatureConfig {
  enabled: boolean;
  rollout: number;
}

export interface RbacGrant {
  id?: UUID;
  tenantId?: UUID;
  roleName: string;
  featureKey: string;
  permission: RbacPermission;
  allowed: boolean;
}

export interface RbacGrantPayload {
  roleName: string;
  featureKey: string;
  permission: RbacPermission;
  allowed: boolean;
}

export type RbacActionFilter = string;
export type RbacResourceTypeFilter = string;

export interface RbacAuditoriaItem {
  id: UUID;
  tenantId: UUID;
  action: string;
  resourceType: string;
  resourceId?: UUID;
  actorId?: UUID;
  actorName?: string;
  actorEmail?: string;
  createdAt: LocalDateTime;
  detalhes?: string;
}

export interface RbacPaginatedResult<T> {
  items: T[];
  page: number;
  size: number;
  hasNext: boolean;
  total?: number;
}

/* --- Global Admin --- */

export type GlobalAdminUserStatus = "ATIVO" | "INATIVO" | "PENDENTE";
export type GlobalAdminScopeType = "UNIDADE" | "REDE" | "GLOBAL";

export type GlobalAdminMembershipOrigin =
  | "MANUAL"
  | "HERDADO_POLITICA"
  | "PERFIL_ADMIN"
  | "IMPORTACAO"
  | "SISTEMA";

export type GlobalAdminNewUnitsPolicyScope = "ACADEMIA_ATUAL" | "REDE";
export type GlobalAdminRiskLevel = "BAIXO" | "MEDIO" | "ALTO" | "CRITICO";
export type GlobalAdminReviewStatus = "EM_DIA" | "PENDENTE" | "VENCIDA";

export interface GlobalAdminAccessException {
  id: UUID;
  title: string;
  scopeLabel?: string;
  justification: string;
  expiresAt?: LocalDateTime;
  createdAt?: LocalDateTime;
  createdBy?: string;
  active: boolean;
}

export interface GlobalAdminRecentChange {
  id: UUID;
  title: string;
  description?: string;
  happenedAt?: LocalDateTime;
  actorName?: string;
  severity?: GlobalAdminRiskLevel;
}

export interface GlobalAdminReviewBoardItem {
  id: UUID;
  userId?: UUID;
  userName: string;
  title: string;
  description?: string;
  severity: GlobalAdminRiskLevel;
  dueAt?: LocalDateTime;
  category:
    | "REVISAO_PENDENTE"
    | "EXCECAO_EXPIRANDO"
    | "MUDANCA_RECENTE"
    | "ACESSO_AMPLO"
    | "PERFIL_SEM_DONO";
}

export interface GlobalAdminReviewBoard {
  pendingReviews: GlobalAdminReviewBoardItem[];
  expiringExceptions: GlobalAdminReviewBoardItem[];
  recentChanges: GlobalAdminReviewBoardItem[];
  broadAccess: GlobalAdminReviewBoardItem[];
  orphanProfiles: GlobalAdminReviewBoardItem[];
}

export interface GlobalAdminUnitRef {
  id: UUID;
  nome: string;
}

export interface GlobalAdminMembershipProfile {
  perfilId: UUID;
  roleName: string;
  displayName: string;
  active: boolean;
  inherited?: boolean;
}

export interface GlobalAdminMembership {
  id: UUID;
  userId: UUID;
  tenantId: UUID;
  tenantName: string;
  networkId?: UUID;
  networkName?: string;
  networkSubdomain?: string;
  networkSlug?: string;
  scopeType?: GlobalAdminScopeType;
  academiaId?: UUID;
  academiaName?: string;
  active: boolean;
  defaultTenant: boolean;
  accessOrigin: GlobalAdminMembershipOrigin;
  inheritedFrom?: string;
  tenantBaseId?: UUID;
  tenantBaseName?: string;
  activeTenantId?: UUID;
  activeTenantName?: string;
  eligibleForNewUnits?: boolean;
  profiles: GlobalAdminMembershipProfile[];
  availableProfiles?: RbacPerfil[];
  riskLevel?: GlobalAdminRiskLevel;
  riskFlags?: string[];
  broadAccess?: boolean;
  reviewStatus?: GlobalAdminReviewStatus;
  nextReviewAt?: LocalDateTime;
  exceptions?: GlobalAdminAccessException[];
  createdAt?: LocalDateTime;
  updatedAt?: LocalDateTime;
}

export interface GlobalAdminNewUnitsPolicy {
  enabled: boolean;
  scope: GlobalAdminNewUnitsPolicyScope;
  academiaIds?: UUID[];
  inherited?: boolean;
  rationale?: string;
  sourceLabel?: string;
  updatedAt?: LocalDateTime;
}

export interface GlobalAdminUserSummary {
  id: UUID;
  name: string;
  fullName?: string;
  email: string;
  userKind?: string;
  networkId?: UUID;
  networkName?: string;
  networkSubdomain?: string;
  networkSlug?: string;
  scopeType?: GlobalAdminScopeType;
  loginIdentifiers?: Array<{
    label: string;
    value: string;
  }>;
  domainLinksSummary?: string[];
  status: GlobalAdminUserStatus;
  active: boolean;
  academias: GlobalAdminUnitRef[];
  membershipsAtivos: number;
  membershipsTotal: number;
  perfis: string[];
  defaultTenantId?: UUID;
  defaultTenantName?: string;
  activeTenantId?: UUID;
  activeTenantName?: string;
  eligibleForNewUnits: boolean;
  broadAccess?: boolean;
  compatibilityMode?: boolean;
  riskLevel?: GlobalAdminRiskLevel;
  riskFlags?: string[];
  exceptionsCount?: number;
  reviewStatus?: GlobalAdminReviewStatus;
  nextReviewAt?: LocalDateTime;
}

export interface GlobalAdminUserDetail extends GlobalAdminUserSummary {
  createdAt?: LocalDateTime;
  lastLoginAt?: LocalDateTime;
  memberships: GlobalAdminMembership[];
  policy: GlobalAdminNewUnitsPolicy;
  exceptions: GlobalAdminAccessException[];
  recentChanges: GlobalAdminRecentChange[];
}

export interface GlobalAdminUserCreatePayload {
  name: string;
  fullName?: string;
  email: string;
  userKind?: string;
  scopeType: GlobalAdminScopeType;
  academiaId?: UUID;
  tenantIds?: UUID[];
  defaultTenantId?: UUID;
  broadAccess?: boolean;
  eligibleForNewUnits?: boolean;
  policyScope?: GlobalAdminNewUnitsPolicyScope;
  loginIdentifiers?: SecurityUserLoginIdentifierInput[];
}

export interface GlobalAdminSecurityOverview {
  totalUsers: number;
  activeMemberships: number;
  defaultUnitsConfigured: number;
  eligibleForNewUnits: number;
  broadAccessUsers?: number;
  expiringExceptions?: number;
  pendingReviews?: number;
  rolloutPercentage?: number;
  compatibilityModeUsers?: number;
}

export type SecurityBusinessScope = "UNIDADE" | "ACADEMIA" | "REDE";

export interface SecurityFeatureCatalogItem {
  featureKey: string;
  moduleKey: string;
  moduleLabel: string;
  capabilityLabel: string;
  businessLabel: string;
  description: string;
  actionLabels: string[];
  permissionLevels: RbacPermission[];
  riskLevel: GlobalAdminRiskLevel;
  scopes: SecurityBusinessScope[];
  requiresAudit: boolean;
  requiresApproval: boolean;
  requiresMfa: boolean;
  dependencies: string[];
  enabled: boolean;
  rollout: number;
  assignedProfiles: string[];
}

export interface SecurityProfileImpactSummary {
  users: number;
  memberships: number;
  academias: number;
  exceptions: number;
  broadAccessUsers: number;
  pendingReviews: number;
}

export interface SecurityProfileMatrixItem extends SecurityFeatureCatalogItem {
  permissions: RbacPermission[];
  impactedUsers: number;
  impactedMemberships: number;
}

export interface SecurityStandardizedProfile {
  id: UUID;
  tenantId: UUID;
  roleName: string;
  displayName: string;
  description?: string;
  active: boolean;
  objective: string;
  recommendedScope: SecurityBusinessScope;
  riskLevel: GlobalAdminRiskLevel;
  modules: string[];
  versionLabel: string;
  lastUpdatedAt?: LocalDateTime;
  featureCount: number;
  criticalFeatureCount: number;
  usersImpacted: number;
  membershipsImpacted: number;
  impact: SecurityProfileImpactSummary;
  matrix: SecurityProfileMatrixItem[];
}

/* --- Catálogo de Funcionalidades (Admin) --- */

export interface CatalogoFuncionalidade {
  id: string;
  featureKey: string;
  moduleKey: string;
  moduleLabel: string;
  capabilityLabel: string;
  businessLabel: string;
  description: string;
  riskLevel: GlobalAdminRiskLevel;
  scopes: SecurityBusinessScope[];
  requiresAudit: boolean;
  requiresApproval: boolean;
  requiresMfa: boolean;
  active: boolean;
  createdAt?: LocalDateTime;
  updatedAt?: LocalDateTime;
}

export interface CatalogoFuncionalidadePayload {
  featureKey: string;
  moduleKey: string;
  moduleLabel: string;
  capabilityLabel: string;
  businessLabel: string;
  description: string;
  riskLevel: GlobalAdminRiskLevel;
  scopes: SecurityBusinessScope[];
  requiresAudit: boolean;
  requiresApproval: boolean;
  requiresMfa: boolean;
  active: boolean;
}

/* --- Perfis Padrão com Versionamento --- */

export interface PerfilPadraoVersao {
  versao: number;
  descricao: string;
  grants: RbacGrantPayload[];
  criadoEm: LocalDateTime;
  criadoPor?: string;
}

export interface PerfilPadrao {
  key: string;
  displayName: string;
  description?: string;
  objective: string;
  recommendedScope: SecurityBusinessScope;
  riskLevel: GlobalAdminRiskLevel;
  active: boolean;
  versaoAtual: number;
  versoes?: PerfilPadraoVersao[];
  createdAt?: LocalDateTime;
  updatedAt?: LocalDateTime;
}

export interface PerfilPadraoCreatePayload {
  key: string;
  displayName: string;
  description?: string;
  objective: string;
  recommendedScope: SecurityBusinessScope;
  riskLevel: GlobalAdminRiskLevel;
  grants: RbacGrantPayload[];
}

/* --- Exceções de Segurança --- */

export type ExcecaoRevisaoDecisao = "APROVADA" | "REJEITADA" | "RENOVADA";

export interface ExcecaoCreatePayload {
  userId: string;
  title: string;
  justification: string;
  expiresAt?: string;
}

export interface ExcecaoRevisaoPayload {
  decisao: ExcecaoRevisaoDecisao;
  comentario: string;
  novaExpiracao?: string;
}

export interface ExcecaoRevisaoResult {
  id: string;
  excecaoId: string;
  decisao: ExcecaoRevisaoDecisao;
  comentario: string;
  revisadoPor?: string;
  revisadoEm?: LocalDateTime;
}

export type FeatureFlagPropagationStatus = "TOTAL" | "PARCIAL" | "PENDENTE";

export interface FeatureFlagMatrixAcademia {
  academiaId: UUID;
  academiaNome: string;
  totalUnits: number;
  activeUnits: number;
}

export interface FeatureFlagMatrixCell {
  academiaId: UUID;
  academiaNome?: string;
  enabled: boolean;
  effectiveEnabled: boolean;
  inheritedFromGlobal: boolean;
  propagationStatus: FeatureFlagPropagationStatus;
  propagatedUnits: number;
  totalUnits: number;
}

export interface FeatureFlagMatrixRow {
  featureKey: string;
  featureLabel: string;
  moduleLabel: string;
  description?: string;
  globalEnabled: boolean;
  globalSource?: "GLOBAL" | "ACADEMIA";
  academias: FeatureFlagMatrixCell[];
}

export interface FeatureFlagMatrix {
  academias: FeatureFlagMatrixAcademia[];
  features: FeatureFlagMatrixRow[];
  updatedAt?: LocalDateTime;
}

/* --- BI --- */

export type BiEscopo = "UNIDADE" | "ACADEMIA";
export type BiSegmento = OrigemProspect | "TODOS";
export type BiKpiKey =
  | "CONVERSAO"
  | "OCUPACAO"
  | "INADIMPLENCIA"
  | "RETENCAO"
  | "RECEITA"
  | "ATIVOS";
export type BiQualityStatus = "OK" | "ATENCAO";

export interface BiKpiDefinition {
  key: BiKpiKey;
  label: string;
  description: string;
  unit: "%" | "currency" | "count";
}

export interface BiResumoOperacional {
  conversaoPct: number;
  ocupacaoPct: number;
  inadimplenciaPct: number;
  retencaoPct: number;
  receita: number;
  ativos: number;
  prospects: number;
  conversoes: number;
  lugaresOcupados: number;
  lugaresDisponiveis: number;
  valorInadimplente: number;
  valorEmAberto: number;
}

export interface BiDeltaOperacional {
  conversaoPct: number;
  ocupacaoPct: number;
  inadimplenciaPct: number;
  retencaoPct: number;
  receita: number;
  ativos: number;
}

export interface BiSeriePonto {
  label: string;
  periodoInicio: LocalDate;
  periodoFim: LocalDate;
  receita: number;
  conversaoPct: number;
  ocupacaoPct: number;
  inadimplenciaPct: number;
  retencaoPct: number;
}

export interface BiBenchmarkTenant {
  tenantId: UUID;
  tenantNome: string;
  academiaId?: UUID;
  academiaNome?: string;
  receita: number;
  ativos: number;
  prospects: number;
  conversoes: number;
  conversaoPct: number;
  ocupacaoPct: number;
  inadimplenciaPct: number;
  retencaoPct: number;
}

export interface BiQualityItem {
  id: string;
  label: string;
  status: BiQualityStatus;
  detail: string;
}

export interface BiOperationalSnapshot {
  scope: BiEscopo;
  startDate: LocalDate;
  endDate: LocalDate;
  academiaId?: UUID;
  academiaNome?: string;
  tenantId?: UUID;
  tenantNome?: string;
  segmento: BiSegmento;
  kpis: BiResumoOperacional;
  deltas: BiDeltaOperacional;
  series: BiSeriePonto[];
  benchmark: BiBenchmarkTenant[];
  quality: BiQualityItem[];
  generatedAt: LocalDateTime;
}

/* --- Alertas e Operacional --- */

export type AlertaOperacionalSeveridade = "INFO" | "WARNING" | "CRITICAL";
export type AlertaOperacionalTipo =
  | "SEM_LOGIN_ADMIN"
  | "SEM_MATRICULAS_ATIVAS"
  | "PICO_CANCELAMENTOS"
  | "CONTRATO_VENCENDO"
  | "INADIMPLENCIA_ALTA"
  | "OUTRO";

export interface AlertaOperacional {
  id?: UUID;
  academiaId?: UUID;
  academiaNome: string;
  unidadeNome?: string;
  tipo: AlertaOperacionalTipo;
  severidade: AlertaOperacionalSeveridade;
  titulo: string;
  descricao: string;
  acaoSugerida: string;
  data: LocalDateTime;
  valorReferencia?: number;
}

export interface AlertasOperacionaisResult {
  items: AlertaOperacional[];
  generatedAt?: LocalDateTime;
}

export type FeatureUsageStatus = "INATIVA" | "ATIVA_SEM_USO" | "EM_USO";
export type FeatureUsageKey = "treinos" | "crm" | "catraca" | "vendasOnline" | "bi";

export interface FeatureUsageIndicator {
  ativa: boolean;
  emUso: boolean;
  status: FeatureUsageStatus;
  ultimoUsoEm?: LocalDateTime;
}

export interface FeatureUsageAcademia {
  academiaId?: UUID;
  academiaNome: string;
  treinos: FeatureUsageIndicator;
  crm: FeatureUsageIndicator;
  catraca: FeatureUsageIndicator;
  vendasOnline: FeatureUsageIndicator;
  bi: FeatureUsageIndicator;
}

export interface FeatureUsageByAcademiaResult {
  items: FeatureUsageAcademia[];
  generatedAt?: LocalDateTime;
}

export type ComplianceTermsStatus = "ACEITO" | "PARCIAL" | "PENDENTE";
export type SolicitacaoExclusaoStatus = "PENDENTE" | "EM_PROCESSAMENTO" | "EXECUTADA" | "REJEITADA";

export interface ComplianceAcademiaResumo {
  academiaId?: UUID;
  academiaNome: string;
  totalAlunos: number;
  alunosComCpf: number;
  alunosComEmail: number;
  alunosComTelefone: number;
  ultimaSolicitacaoExclusao?: LocalDateTime;
  termosAceitos: number;
  termosPendentes: number;
  statusTermos: ComplianceTermsStatus;
  camposSensiveis: string[];
}

export interface SolicitacaoExclusao {
  id: UUID;
  academiaId?: UUID;
  academiaNome: string;
  alunoId?: UUID;
  alunoNome: string;
  email?: string;
  cpf?: string;
  solicitadoEm?: LocalDateTime;
  solicitadoPor?: string;
  motivo?: string;
  status: SolicitacaoExclusaoStatus;
}

export interface ComplianceExposicaoCampo {
  key: string;
  label: string;
  totalAcademias: number;
  academias: string[];
}

export interface ComplianceDashboard {
  totalDadosPessoaisArmazenados: number;
  solicitacoesExclusaoPendentes: number;
  termosAceitos: number;
  termosPendentes: number;
  academias: ComplianceAcademiaResumo[];
  solicitacoesPendentes: SolicitacaoExclusao[];
  exposicaoCamposSensiveis: ComplianceExposicaoCampo[];
  generatedAt?: LocalDateTime;
}
