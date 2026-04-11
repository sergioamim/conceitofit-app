import {
  Activity,
  AlertTriangle,
  BriefcaseBusiness,
  CalendarDays,
  ClipboardList,
  CreditCard,
  DollarSign,
  Kanban,
  LayoutDashboard,
  LineChart,
  Megaphone,
  MessageSquare,
  MessageSquareHeart,
  QrCode,
  Settings,
  ShieldAlert,
  ShoppingCart,
  Users,
  TrendingUp,
  ShieldCheck,
  Target,
  Layers,
  Wallet,
  BookOpen,
  HandCoins,
  Dumbbell,
  UserPlus,
  Gift
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItemV2 = {
  href: string;
  label: string;
  icon: LucideIcon;
  description?: string;
  exact?: boolean;
};

export type NavGroupV2 = {
  label: string;
  icon: LucideIcon;
  items: NavItemV2[];
};

// 1. Crescimento & Vendas (Aquisição e Marketing)
export const growthGroup: NavGroupV2 = {
  label: "Crescimento",
  icon: Target,
  items: [
    { href: "/prospects", label: "Prospects", icon: UserPlus, description: "Gestão de leads" },
    { href: "/crm", label: "Workspace CRM", icon: BriefcaseBusiness },
    { href: "/crm/prospects-kanban", label: "Funil de Vendas", icon: Kanban },
    { href: "/crm/tarefas", label: "Tarefas Comerciais", icon: ClipboardList },
    { href: "/vendas/nova", label: "Nova Venda", icon: ShoppingCart },
    { href: "/crm/campanhas", label: "Campanhas", icon: Megaphone },
    { href: "/crm/retencao", label: "Retenção", icon: ShieldAlert, description: "Dashboard de retenção" },
    { href: "/retencao/nps", label: "NPS", icon: MessageSquareHeart, description: "Pesquisa relacional" },
    { href: "/administrativo/vouchers", label: "Vouchers", icon: CreditCard },
    { href: "/comercial/fidelizacao", label: "Fidelização", icon: Gift, description: "Indicações e recompensas" },
  ]
};

// 2. Operação (Frequência, Treino e Retenção)
export const operationGroup: NavGroupV2 = {
  label: "Operação",
  icon: Layers,
  items: [
    { href: "/atendimento/inbox", label: "Atendimento", icon: MessageSquare, description: "Inbox WhatsApp" },
    { href: "/clientes", label: "Clientes", icon: Users, description: "Base de alunos" },
    { href: "/matriculas", label: "Contratos", icon: ClipboardList },
    { href: "/grade", label: "Grade de Aulas", icon: CalendarDays },
    { href: "/reservas", label: "Reservas", icon: CalendarDays },
    { href: "/treinos", label: "Treinos", icon: Dumbbell },
    { href: "/treinos/atribuidos", label: "Atribuições", icon: Activity },
    { href: "/treinos/exercicios", label: "Exercícios", icon: Activity },
    { href: "/atividades", label: "Atividades", icon: Activity },
  ]
};

// 3. Financeiro (Gestão de Caixa e Fiscal)
export const financeGroup: NavGroupV2 = {
  label: "Financeiro",
  icon: Wallet,
  items: [
    { href: "/pagamentos", label: "Recebimentos", icon: DollarSign },
    { href: "/financeiro/pix", label: "PIX", icon: QrCode, description: "Cobranças PIX com QR Code" },
    { href: "/gerencial/recebimentos", label: "Baixas Bancárias", icon: HandCoins },
    { href: "/gerencial/contas-a-receber", label: "Contas a Receber", icon: TrendingUp },
    { href: "/gerencial/contas-a-pagar", label: "Contas a Pagar", icon: DollarSign },
    { href: "/administrativo/nfse", label: "Fiscal & NFSe", icon: Settings },
    { href: "/administrativo/billing", label: "Faturamento Recorrente", icon: CreditCard },
    { href: "/administrativo/billing/dashboard", label: "Dashboard Cobranças", icon: CreditCard, description: "MRR, churn e inadimplência" },
    { href: "/gerencial/contabilidade", label: "Contabilidade", icon: BookOpen },
    { href: "/financeiro/dunning", label: "Cobranca", icon: AlertTriangle, description: "Dunning e inadimplencia" },
  ]
};

// 4. Estratégico & Configurações (BI e Ajustes)
export const strategyGroup: NavGroupV2 = {
  label: "Estratégico",
  icon: LineChart,
  items: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/gerencial/bi", label: "BI Operacional", icon: LineChart, exact: true },
    { href: "/gerencial/bi/receita", label: "BI Receita", icon: TrendingUp },
    { href: "/gerencial/bi/retencao-cohort", label: "BI Retencao Cohort", icon: Users },
    { href: "/gerencial/bi/inadimplencia", label: "BI Inadimplencia", icon: AlertTriangle },
    { href: "/gerencial/dre", label: "DRE Mensal", icon: TrendingUp },
    { href: "/administrativo/academia", label: "Dados da Academia", icon: Settings },
    { href: "/administrativo/unidades", label: "Unidades", icon: Settings },
    { href: "/seguranca/rbac", label: "Controle de Acesso", icon: ShieldCheck },
    { href: "/administrativo/ia", label: "Inteligência Artificial", icon: Settings },
  ]
};

export const allGroupsV2 = [growthGroup, operationGroup, financeGroup, strategyGroup];
