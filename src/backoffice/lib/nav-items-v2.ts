import {
  Activity,
  AlertTriangle,
  BarChart3,
  BookOpen,
  Building2,
  CreditCard,
  FileText,
  Key,
  LayoutDashboard,
  LineChart,
  ListChecks,
  MessageSquare,
  Rocket,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  Upload,
  UserCog,
  Users,
  Wallet,
  Zap,
  Globe,
  Eye,
  SearchCode
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItemV2 = {
  href: string;
  label: string;
  icon: LucideIcon;
  description?: string;
  paletteOnly?: boolean;
};

export type NavGroupV2 = {
  label: string;
  icon: LucideIcon;
  items: NavItemV2[];
};

// 1. Monitoramento & BI (Visão Geral)
export const monitorGroup: NavGroupV2 = {
  label: "Monitoramento",
  icon: Eye,
  items: [
    { href: "/admin", label: "Dashboard Admin", icon: LayoutDashboard },
    { href: "/admin/saas", label: "Métricas SaaS", icon: LineChart, description: "MRR, Churn, ARPU" },
    { href: "/admin/bi", label: "BI Executivo", icon: BarChart3 },
    { href: "/admin/operacional/saude", label: "Saúde do Sistema", icon: Activity },
    { href: "/admin/operacional/alertas", label: "Alertas Ativos", icon: AlertTriangle },
  ]
};

// 2. Ecossistema (Gestão de Clientes B2B)
export const ecosystemGroup: NavGroupV2 = {
  label: "Ecossistema",
  icon: Globe,
  items: [
    { href: "/admin/academias", label: "Academias", icon: Building2 },
    { href: "/admin/unidades", label: "Unidades", icon: Building2 },
    { href: "/admin/onboarding/provisionar", label: "Novo Provisionamento", icon: Rocket },
    { href: "/admin/leads", label: "Leads B2B", icon: Users },
    { href: "/admin/busca", label: "Busca Global", icon: Search },
  ]
};

// 3. Financeiro (Faturamento da Plataforma)
export const billingGroup: NavGroupV2 = {
  label: "Financeiro SaaS",
  icon: Wallet,
  items: [
    { href: "/admin/financeiro", label: "Resumo Financeiro", icon: Wallet },
    { href: "/admin/financeiro/planos", label: "Planos Plataforma", icon: CreditCard },
    { href: "/admin/financeiro/contratos", label: "Contratos B2B", icon: FileText },
    { href: "/admin/financeiro/cobrancas", label: "Cobranças SaaS", icon: Wallet },
    { href: "/admin/financeiro/gateways", label: "Gateways", icon: CreditCard },
  ]
};

// 4. Governança & Engenharia
export const governanceGroup: NavGroupV2 = {
  label: "Governança",
  icon: ShieldCheck,
  items: [
    { href: "/admin/seguranca", label: "Central de Segurança", icon: ShieldCheck },
    { href: "/admin/seguranca/funcionalidades", label: "Feature Flags", icon: Zap },
    { href: "/admin/compliance", label: "Compliance LGPD", icon: Shield, paletteOnly: true },
    { href: "/admin/audit-log", label: "Audit Log", icon: FileText, paletteOnly: true },
  ]
};

// 5. Configurações & Ferramentas
export const configGroup: NavGroupV2 = {
  label: "Configurações",
  icon: Settings,
  items: [
    { href: "/admin/configuracoes", label: "Ajustes Gerais", icon: Settings },
    { href: "/admin/whatsapp", label: "WhatsApp API", icon: MessageSquare },
    { href: "/admin/importacao-evo", label: "Importação EVO", icon: Upload },
  ]
};

export const adminGroupsV2 = [monitorGroup, ecosystemGroup, billingGroup, governanceGroup, configGroup];

export const allAdminNavItemsV2 = adminGroupsV2.flatMap(g => g.items);
