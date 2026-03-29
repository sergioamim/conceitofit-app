import {
  Activity,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  ClipboardList,
  CreditCard,
  DollarSign,
  HandCoins,
  Kanban,
  LayoutDashboard,
  LineChart,
  ListTree,
  Megaphone,
  Palette,
  Settings,
  ShoppingCart,
  ShieldCheck,
  Dumbbell,
  UserPlus,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

export const mainNavItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/prospects", label: "Prospects", icon: UserPlus },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/matriculas", label: "Contratos", icon: ClipboardList },
  { href: "/planos", label: "Planos", icon: CreditCard },
  { href: "/vendas", label: "Vendas", icon: ShoppingCart },
  { href: "/pagamentos", label: "Pagamentos", icon: DollarSign },
];

export const atividadeItems: NavItem[] = [
  { href: "/atividades", label: "Atividades", icon: Activity },
  { href: "/administrativo/atividades-grade", label: "Atividades - Grade", icon: Settings },
  { href: "/grade", label: "Grade", icon: CalendarDays },
  { href: "/reservas", label: "Reservas", icon: CalendarDays },
];

export const treinoItems: NavItem[] = [
  { href: "/treinos", label: "Treinos", icon: CalendarDays, exact: true },
  { href: "/treinos/atribuidos", label: "Treinos Atribuídos", icon: ClipboardList },
  { href: "/treinos/exercicios", label: "Exercícios", icon: Dumbbell },
  { href: "/treinos/grupos-musculares", label: "Grupos Musculares", icon: ListTree },
];

export const crmItems: NavItem[] = [
  { href: "/crm", label: "Workspace CRM", icon: BriefcaseBusiness, exact: true },
  { href: "/crm/prospects-kanban", label: "Funil de Vendas", icon: Kanban },
  { href: "/crm/tarefas", label: "Tarefas Comerciais", icon: ClipboardList },
  { href: "/crm/playbooks", label: "Playbooks e Cadências", icon: ListTree },
  { href: "/crm/campanhas", label: "Campanhas", icon: Megaphone },
];

export const segurancaItems: NavItem[] = [
  { href: "/seguranca/rbac", label: "Perfis e Funcionalidades", icon: ShieldCheck },
  { href: "/seguranca/acesso-unidade", label: "Usuários e Acessos", icon: ShieldCheck },
];

export const administrativoItems: NavItem[] = [
  { href: "/administrativo/conciliacao-bancaria", label: "Conciliação Bancária", icon: Settings },
  { href: "/administrativo/formas-pagamento", label: "Formas de Pagamento", icon: Settings },
  { href: "/administrativo/bandeiras", label: "Bandeiras de Cartão", icon: Settings },
  { href: "/administrativo/contas-bancarias", label: "Contas Bancárias", icon: Settings },
  { href: "/administrativo/nfse", label: "NFSe e Fiscal", icon: Settings },
  { href: "/administrativo/integracoes", label: "Monitoramento de Integrações", icon: Settings },
  { href: "/administrativo/maquininhas", label: "Maquininhas", icon: Settings },
  { href: "/administrativo/catraca-status", label: "Status de Conexões", icon: Settings },
  { href: "/administrativo/unidades", label: "Unidades", icon: Settings },
  { href: "/administrativo/academia", label: "Academia", icon: Settings },
  { href: "/administrativo/academia/storefront", label: "Tema da Storefront", icon: Palette },
  { href: "/administrativo/funcionarios", label: "Colaboradores", icon: Settings },
  { href: "/administrativo/salas", label: "Salas", icon: Settings },
  { href: "/administrativo/horarios", label: "Horários", icon: Settings },
  { href: "/administrativo/convenios", label: "Convênios", icon: Settings },
  { href: "/administrativo/produtos", label: "Produtos", icon: Settings },
  { href: "/administrativo/servicos", label: "Serviços", icon: Settings },
  { href: "/administrativo/tipos-conta", label: "Tipos de Conta", icon: Settings },
  { href: "/administrativo/vouchers", label: "Vouchers", icon: Settings },
  { href: "/administrativo/ia", label: "Integração com IA", icon: Settings },
];

export const gerencialItems: NavItem[] = [
  { href: "/gerencial/bi", label: "BI Operacional", icon: LineChart },
  { href: "/gerencial/bi/rede", label: "Visão de Rede", icon: LineChart },
  { href: "/gerencial/agregadores", label: "Agregadores", icon: CreditCard },
  { href: "/gerencial/contas-a-receber", label: "Contas a Receber", icon: HandCoins },
  { href: "/gerencial/contas-a-pagar", label: "Contas a Pagar", icon: DollarSign },
  { href: "/gerencial/catraca-acessos", label: "Acessos Catraca", icon: ClipboardList },
  { href: "/gerencial/dre", label: "DRE", icon: LineChart },
  { href: "/gerencial/recebimentos", label: "Recebimentos", icon: HandCoins },
  { href: "/gerencial/contabilidade", label: "Contabilidade", icon: BookOpen },
];

export const allNavItems: NavItem[] = [
  ...mainNavItems,
  ...atividadeItems,
  ...treinoItems,
  ...crmItems,
  ...segurancaItems,
  ...administrativoItems,
  ...gerencialItems,
];
