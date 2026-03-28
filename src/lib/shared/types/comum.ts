
export type UUID = string;
export type LocalDate = string; // "YYYY-MM-DD"
export type LocalDateTime = string; // "YYYY-MM-DDTHH:mm:ss"

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  size: number;
  total?: number;
  hasNext: boolean;
}

export type Sexo = "M" | "F" | "OUTRO" | "NAO_INFORMADO";

export type ModoAssinaturaContrato = "DIGITAL" | "PRESENCIAL" | "AMBAS";
export type StatusContratoPlano = "SEM_CONTRATO" | "PENDENTE_ASSINATURA" | "ASSINADO";

export type DiaSemana =
  | "SEG"
  | "TER"
  | "QUA"
  | "QUI"
  | "SEX"
  | "SAB"
  | "DOM";

export interface Endereco {
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
}

export interface ContatoEmergencia {
  nome: string;
  telefone: string;
  parentesco?: string;
}

export type StatusCadastro = "ATIVA" | "INATIVA";

/* --- Audit Log --- */

export type AuditLogAction =
  | "CRIOU"
  | "EDITOU"
  | "EXCLUIU"
  | "SUSPENDEU"
  | "ATIVOU"
  | "CANCELOU"
  | "IMPORTOU"
  | "IMPERSONOU"
  | "ENCERROU_IMPERSONACAO";

export type AuditLogEntityType =
  | "ACADEMIA"
  | "UNIDADE"
  | "USUARIO"
  | "CONTRATO"
  | "ALUNO"
  | "MATRICULA"
  | "PAGAMENTO"
  | "PERFIL"
  | "PLANO";

export interface AuditLogEntry {
  id: UUID;
  timestamp: LocalDateTime;
  userId: UUID;
  userName: string;
  action: AuditLogAction;
  entityType: AuditLogEntityType;
  entityId: UUID;
  entityName: string;
  academiaId?: UUID;
  academiaNome?: string;
  tenantId?: UUID;
  tenantNome?: string;
  detalhes?: string;
  ip?: string;
}

/* --- Funcionario --- */

export type FuncionarioStatusOperacional = "ATIVO" | "BLOQUEADO" | "INATIVO" | "DESLIGADO";
export type FuncionarioStatusAcesso = "SEM_ACESSO" | "ATIVO" | "CONVITE_PENDENTE" | "PRIMEIRO_ACESSO" | "BLOQUEADO";
export type FuncionarioOrigemCadastro = "MANUAL" | "IMPORTADO_EVO" | "CONVITE" | "SINCRONIZADO";
export type FuncionarioTipoContratacao = "CLT" | "PJ" | "ESTAGIO" | "AUTONOMO" | "HORISTA" | "OUTRO";
export type FuncionarioProvisionamentoAcesso = "SEM_ACESSO" | "CONVITE" | "REUTILIZAR_USUARIO";

export interface FuncionarioMembership {
  tenantId: UUID;
  tenantNome: string;
  roleName?: string;
  roleDisplayName?: string;
  defaultTenant?: boolean;
  active?: boolean;
  accessOrigin?: "MANUAL" | "HERDADO_POLITICA";
}

export interface FuncionarioEndereco {
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  pais?: string;
}

export interface FuncionarioEmergencia {
  nomeResponsavel?: string;
  telefoneResponsavel?: string;
  convenioMedico?: string;
  hospitalPreferencia?: string;
  alergias?: string;
  observacoes?: string;
}

export interface FuncionarioContratacao {
  tipo?: FuncionarioTipoContratacao;
  dataAdmissao?: string;
  dataDemissao?: string;
  cargoContratual?: string;
  salarioAtual?: number;
  banco?: string;
  agencia?: string;
  conta?: string;
  pixTipo?: "CPF" | "EMAIL" | "TELEFONE" | "ALEATORIA";
  pixValor?: string;
  observacoes?: string;
}

export interface FuncionarioHorario {
  id?: UUID;
  diaSemana: DiaSemana;
  horaInicio?: string;
  horaFim?: string;
  permiteForaHorario?: boolean;
  ativo?: boolean;
}

export interface FuncionarioNotificacoes {
  email?: boolean;
  whatsapp?: boolean;
  pendenciasOperacionais?: boolean;
  escala?: boolean;
}

export interface Funcionario {
  id: UUID;
  tenantId?: UUID;
  usuarioId?: string;
  externalId?: string;
  nome: string;
  nomeRegistro?: string;
  apelido?: string;
  cpf?: string;
  rg?: string;
  dataNascimento?: string;
  cargoId?: UUID;
  cargo?: string;
  emailProfissional?: string;
  emailPessoal?: string;
  celular?: string;
  telefone?: string;
  podeMinistrarAulas: boolean;
  permiteCatraca?: boolean;
  permiteForaHorario?: boolean;
  utilizaTecladoAcesso?: boolean;
  bloqueiaAcessoSistema?: boolean;
  coordenador?: boolean;
  alertaFuncionarios?: boolean;
  statusOperacional?: FuncionarioStatusOperacional;
  statusAcesso?: FuncionarioStatusAcesso;
  origemCadastro?: FuncionarioOrigemCadastro;
  possuiAcessoSistema?: boolean;
  provisionamentoAcesso?: FuncionarioProvisionamentoAcesso;
  tenantBaseId?: UUID;
  tenantBaseNome?: string;
  perfilAcessoInicialId?: string;
  perfilAcessoInicialNome?: string;
  memberships?: FuncionarioMembership[];
  endereco?: FuncionarioEndereco;
  emergencia?: FuncionarioEmergencia;
  contratacao?: FuncionarioContratacao;
  horarios?: FuncionarioHorario[];
  observacoes?: string;
  informacoesInternas?: string;
  notificacoes?: FuncionarioNotificacoes;
  ativo: boolean;
}

export interface Cargo {
  id: UUID;
  tenantId: UUID;
  nome: string;
  ativo: boolean;
}

export interface Sala {
  id: UUID;
  tenantId: UUID;
  nome: string;
  descricao?: string;
  capacidadePadrao?: number;
  ativo: boolean;
}

/* --- Integrações --- */

export type IntegrationHealthStatus = "ONLINE" | "DEGRADED" | "OFFLINE" | "MAINTENANCE";
export type IntegrationHealthKey = "PAYMENTS" | "NFSE" | "CATRACA" | "EVO_IMPORT";

export interface IntegrationStatus {
  integrationKey: IntegrationHealthKey;
  integrationName: string;
  providerLabel: string;
  status: IntegrationHealthStatus;
  uptimePercent: number;
  avgLatencyMs: number;
  pendingCount: number;
  lastCheckAt?: LocalDateTime;
  lastSuccessAt?: LocalDateTime;
  lastErrorMessage?: string;
  lastErrorAt?: LocalDateTime;
  docsHref?: string;
}

export type IntegracaoOperacionalTipo = "NFSE" | "ADQUIRENTE" | "CATRACA" | "WEBHOOK" | "IMPORTACAO";
export type IntegracaoOperacionalStatus = "SAUDAVEL" | "ATENCAO" | "FALHA" | "CONFIGURACAO_PENDENTE";
export type IntegracaoOcorrenciaSeveridade = "INFO" | "WARN" | "ERROR";

export interface IntegracaoOperacionalOcorrencia {
  id: UUID;
  integracaoId: UUID;
  severidade: IntegracaoOcorrenciaSeveridade;
  mensagem: string;
  codigo?: string;
  dataCriacao: LocalDateTime;
}

export interface IntegracaoOperacional {
  id: UUID;
  tenantId: UUID;
  nome: string;
  tipo: IntegracaoOperacionalTipo;
  fornecedor: string;
  status: IntegracaoOperacionalStatus;
  filaPendente: number;
  latenciaMs?: number;
  ultimaExecucaoEm?: LocalDateTime;
  ultimaSucessoEm?: LocalDateTime;
  ultimoErro?: string;
  linkDestino?: string;
  ocorrencias: IntegracaoOperacionalOcorrencia[];
}

/* --- Configuração Global --- */

export interface GlobalConfigEmailTemplate {
  id: string;
  slug: string;
  nome: string;
  assunto: string;
  canal: "EMAIL" | "WHATSAPP" | "SMS";
  ativo: boolean;
  bodyHtml: string;
  variables: string[];
  updatedAt?: LocalDateTime;
}

export interface GlobalConfigApiLimits {
  requestsPerMinute: number;
  burstLimit: number;
  webhookRequestsPerMinute: number;
  adminRequestsPerMinute: number;
}

export interface GlobalConfig {
  emailTemplates: GlobalConfigEmailTemplate[];
  termsOfUseHtml: string;
  termsVersion: string;
  termsUpdatedAt?: LocalDateTime;
  apiLimits: GlobalConfigApiLimits;
  updatedAt?: LocalDateTime;
  updatedBy?: string;
}

/* --- Busca Global --- */

export type GlobalSearchPersonType = "ALUNO" | "FUNCIONARIO" | "ADMIN";

export interface GlobalSearchResult {
  id: UUID;
  tipo: GlobalSearchPersonType;
  nome: string;
  cpf?: string;
  email?: string;
  telefone?: string;
  academiaId?: UUID;
  academiaNome?: string;
  tenantId?: UUID;
  unidadeNome?: string;
  status?: string;
  /** URL relativa para navegar ao detalhe */
  href?: string;
}

export interface GlobalSearchResponse {
  items: GlobalSearchResult[];
  total: number;
  query: string;
}
