import {
  Activity,
  AlertTriangle,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  ClipboardList,
  CreditCard,
  DollarSign,
  Dumbbell,
  FileText,
  Gift,
  HandCoins,
  History,
  Kanban,
  KeyRound,
  Layers,
  LayoutDashboard,
  LineChart,
  ListTree,
  Lock,
  MapPin,
  Megaphone,
  MessageSquare,
  MessageSquareHeart,
  Palette,
  QrCode,
  Settings,
  ShieldAlert,
  ShieldCheck,
  ShoppingCart,
  Target,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  description?: string;
  exact?: boolean;
  section?: string;
};

export type NavGroup = {
  label: string;
  icon: LucideIcon;
  items: NavItem[];
};

// ---------------------------------------------------------------------------
// Grupos de navegação
// ---------------------------------------------------------------------------

/**
 * 1. Crescimento & Vendas — Aquisição, CRM, Marketing e Retenção
 */
export const growthGroup: NavGroup = {
  label: "Crescimento",
  icon: Target,
  items: [
    { href: "/prospects", label: "Prospects", icon: UserPlus, description: "Gestão de leads" },
    { href: "/crm", label: "Workspace CRM", icon: BriefcaseBusiness, exact: true },
    { href: "/crm/prospects-kanban", label: "Funil de Vendas", icon: Kanban },
    { href: "/crm/tarefas", label: "Tarefas Comerciais", icon: ClipboardList },
    { href: "/crm/playbooks", label: "Playbooks", icon: ListTree },
    { href: "/crm/cadencias", label: "Cadências", icon: Activity, description: "Motor de cadências" },
    { href: "/crm/campanhas", label: "Campanhas", icon: Megaphone },
    { href: "/crm/retencao", label: "Retenção CRM", icon: ShieldAlert, description: "Dashboard de retenção" },
    { href: "/vendas", label: "Vendas", icon: ShoppingCart, description: "Listagem de vendas" },
    { href: "/retencao/nps", label: "NPS", icon: MessageSquareHeart, description: "Pesquisa relacional" },
    { href: "/administrativo/vouchers", label: "Vouchers", icon: CreditCard },
    { href: "/comercial/fidelizacao", label: "Fidelização", icon: Gift, description: "Indicações e recompensas" },
  ],
};

/**
 * 2. Operação — Clientes, catálogo, aulas, treinos e acesso físico
 */
export const operationGroup: NavGroup = {
  label: "Operação",
  icon: Layers,
  items: [
    { href: "/atendimento/inbox", label: "Atendimento", icon: MessageSquare, description: "Inbox WhatsApp", section: "Operação diária" },
    { href: "/clientes", label: "Clientes", icon: Users, description: "Base de alunos" },
    { href: "/planos", label: "Planos", icon: CreditCard, description: "Catálogo de mensalidades" },
    { href: "/contratos", label: "Contratos", icon: ClipboardList },
    { href: "/administrativo/convenios", label: "Convênios", icon: Settings, section: "Catálogo" },
    { href: "/administrativo/produtos", label: "Produtos", icon: Settings },
    { href: "/administrativo/servicos", label: "Serviços", icon: Settings },
    { href: "/grade", label: "Grade de Aulas", icon: CalendarDays, description: "Agenda semanal das aulas", section: "Aulas" },
    { href: "/reservas", label: "Reservas", icon: CalendarDays, description: "Gestão das reservas de aula" },
    { href: "/administrativo/atividades-grade", label: "Configurar Grade", icon: Settings, description: "Cadastro de horários, capacidade e regras" },
    { href: "/atividades", label: "Atividades", icon: Activity, description: "Modalidades e categorias" },
    { href: "/administrativo/salas", label: "Salas", icon: Settings, description: "Locais usados na grade" },
    { href: "/administrativo/horarios", label: "Horário de Funcionamento", icon: Settings, description: "Abertura da unidade por dia" },
    { href: "/treinos", label: "Treinos", icon: Dumbbell, exact: true, section: "Treinos" },
    { href: "/treinos/atribuidos", label: "Treinos Atribuídos", icon: ClipboardList },
    { href: "/treinos/exercicios", label: "Exercícios", icon: Dumbbell },
    { href: "/administrativo/catraca-status", label: "Integração Catraca", icon: Settings, section: "Acesso físico" },
    { href: "/gerencial/catraca-acessos", label: "Acessos Catraca", icon: ClipboardList },
  ],
};

/**
 * 3. Financeiro — Caixa, fiscal, conciliação e billing
 */
export const financeGroup: NavGroup = {
  label: "Financeiro",
  icon: Wallet,
  items: [
    { href: "/caixa", label: "Meu Caixa", icon: Wallet, description: "Operação diária (PDV)" },
    { href: "/pagamentos", label: "Recebimentos", icon: DollarSign },
    { href: "/financeiro/pix", label: "PIX", icon: QrCode, description: "Cobranças PIX com QR Code" },
    { href: "/gerencial/recebimentos", label: "Baixas Bancárias", icon: HandCoins },
    { href: "/gerencial/contas-a-receber", label: "Contas a Receber", icon: TrendingUp },
    { href: "/gerencial/contas-a-pagar", label: "Contas a Pagar", icon: DollarSign },
    { href: "/administrativo/nfse", label: "Fiscal & NFSe", icon: Settings },
    { href: "/administrativo/billing", label: "Faturamento Recorrente", icon: CreditCard },
    { href: "/administrativo/billing/dashboard", label: "Dashboard Cobranças", icon: CreditCard, description: "MRR, churn e inadimplência" },
    { href: "/financeiro/dunning", label: "Cobrança", icon: AlertTriangle, description: "Dunning e inadimplência" },
    { href: "/administrativo/conciliacao-bancaria", label: "Conciliação Bancária", icon: Settings },
    { href: "/administrativo/contas-bancarias", label: "Contas Bancárias", icon: Settings },
    { href: "/administrativo/formas-pagamento", label: "Formas de Pagamento", icon: Settings },
    { href: "/administrativo/bandeiras", label: "Bandeiras de Cartão", icon: Settings },
    { href: "/administrativo/maquininhas", label: "Maquininhas", icon: Settings },
    { href: "/administrativo/tipos-conta", label: "Tipos de Conta", icon: Settings },
    { href: "/gerencial/agregadores", label: "Agregadores", icon: CreditCard },
    { href: "/gerencial/contabilidade", label: "Contabilidade", icon: BookOpen },
  ],
};

/**
 * 4. Estratégico & Configurações — BI, dashboards e administração
 */
export const strategyGroup: NavGroup = {
  label: "Estratégico",
  icon: LineChart,
  items: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/gerencial/bi", label: "BI Operacional", icon: LineChart, exact: true },
    { href: "/gerencial/bi/receita", label: "BI Receita", icon: TrendingUp },
    { href: "/gerencial/bi/retencao-cohort", label: "BI Retenção Cohort", icon: Users },
    { href: "/gerencial/bi/inadimplencia", label: "BI Inadimplência", icon: AlertTriangle },
    { href: "/gerencial/bi/rede", label: "BI Rede", icon: LineChart },
    { href: "/gerencial/dre", label: "DRE Mensal", icon: TrendingUp },
    { href: "/administrativo/academia", label: "Dados da Academia", icon: Settings },
    { href: "/administrativo/academia/storefront", label: "Tema da Storefront", icon: Palette },
    { href: "/administrativo/unidades", label: "Unidades", icon: MapPin },
    { href: "/administrativo/funcionarios", label: "Colaboradores", icon: Users },
    { href: "/administrativo/integracoes", label: "Integrações", icon: Settings },
    { href: "/administrativo/whatsapp", label: "WhatsApp (admin)", icon: MessageSquare },
    { href: "/administrativo/ia", label: "Inteligência Artificial", icon: Settings },
  ],
};

/**
 * 5. Gestão de Acesso — RBAC v2 (redesign 2026-04-25)
 * Funcionários da rede, papéis, permissões e auditoria.
 */
export const accessManagementGroup: NavGroup = {
  label: "Gestão de Acesso",
  icon: ShieldCheck,
  items: [
    { href: "/gestao-acessos", label: "Visão geral", icon: ShieldCheck, exact: true, description: "KPIs e atividade recente" },
    { href: "/gestao-acessos/usuarios", label: "Usuários", icon: Users, description: "Funcionários da rede" },
    { href: "/gestao-acessos/papeis", label: "Papéis", icon: KeyRound, description: "Conjuntos de permissões" },
    { href: "/gestao-acessos/permissoes", label: "Permissões", icon: FileText, description: "Catálogo granular" },
    { href: "/gestao-acessos/auditoria", label: "Auditoria de Acesso", icon: History, description: "Mudanças de RBAC, política de segurança e convites" },
    { href: "/gestao-acessos/seguranca", label: "Política de Segurança", icon: Lock, description: "Senha e sessões da rede" },
  ],
};

// ---------------------------------------------------------------------------
// Agregadores (consumidos pelo sidebar e command-palette)
// ---------------------------------------------------------------------------

/** Lista ordenada dos 5 grupos de navegação. */
export const allGroups: NavGroup[] = [
  growthGroup,
  operationGroup,
  financeGroup,
  accessManagementGroup,
  strategyGroup,
];

/**
 * Flat list com todos os itens — consumida pelo command-palette para busca
 * global e pelo sidebar para resolução de favoritos.
 */
export const allNavItems: NavItem[] = allGroups.flatMap((group) => group.items);
