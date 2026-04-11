import {
  Activity,
  AlertTriangle,
  BarChart3,
  Building2,
  CreditCard,
  Eye,
  FileText,
  Globe,
  LayoutDashboard,
  LineChart,
  MessageSquare,
  Rocket,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  Upload,
  Users,
  Wallet,
  Zap,
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
  /** Se true, o item só aparece na command palette, não no sidebar. */
  paletteOnly?: boolean;
};

export type NavGroup = {
  label: string;
  icon: LucideIcon;
  items: NavItem[];
};

// ---------------------------------------------------------------------------
// Grupos do backoffice admin global
// ---------------------------------------------------------------------------

/** 1. Monitoramento & BI — visão geral da plataforma */
export const monitorGroup: NavGroup = {
  label: "Monitoramento",
  icon: Eye,
  items: [
    { href: "/admin", label: "Dashboard Admin", icon: LayoutDashboard },
    { href: "/admin/saas", label: "Métricas SaaS", icon: LineChart, description: "MRR, Churn, ARPU" },
    { href: "/admin/bi", label: "BI Executivo", icon: BarChart3 },
    { href: "/admin/operacional/saude", label: "Saúde do Sistema", icon: Activity },
    { href: "/admin/operacional/alertas", label: "Alertas Ativos", icon: AlertTriangle },
  ],
};

/** 2. Ecossistema — gestão de clientes B2B (academias e unidades) */
export const ecosystemGroup: NavGroup = {
  label: "Ecossistema",
  icon: Globe,
  items: [
    { href: "/admin/academias", label: "Academias", icon: Building2 },
    { href: "/admin/unidades", label: "Unidades", icon: Building2 },
    { href: "/admin/onboarding/provisionar", label: "Novo Provisionamento", icon: Rocket },
    { href: "/admin/leads", label: "Leads B2B", icon: Users },
    { href: "/admin/busca", label: "Busca Global", icon: Search },
  ],
};

/** 3. Financeiro SaaS — faturamento da plataforma */
export const billingGroup: NavGroup = {
  label: "Financeiro SaaS",
  icon: Wallet,
  items: [
    { href: "/admin/financeiro", label: "Resumo Financeiro", icon: Wallet },
    { href: "/admin/financeiro/planos", label: "Planos Plataforma", icon: CreditCard },
    { href: "/admin/financeiro/contratos", label: "Contratos B2B", icon: FileText },
    { href: "/admin/financeiro/cobrancas", label: "Cobranças SaaS", icon: Wallet },
    { href: "/admin/financeiro/gateways", label: "Gateways", icon: CreditCard },
  ],
};

/** 4. Governança & Engenharia */
export const governanceGroup: NavGroup = {
  label: "Governança",
  icon: ShieldCheck,
  items: [
    { href: "/admin/seguranca", label: "Central de Segurança", icon: ShieldCheck },
    { href: "/admin/seguranca/funcionalidades", label: "Feature Flags", icon: Zap },
    { href: "/admin/compliance", label: "Compliance LGPD", icon: Shield, paletteOnly: true },
    { href: "/admin/audit-log", label: "Audit Log", icon: FileText, paletteOnly: true },
  ],
};

/** 5. Configurações & Ferramentas */
export const configGroup: NavGroup = {
  label: "Configurações",
  icon: Settings,
  items: [
    { href: "/admin/configuracoes", label: "Ajustes Gerais", icon: Settings },
    { href: "/admin/whatsapp", label: "WhatsApp API", icon: MessageSquare },
    { href: "/admin/importacao-evo", label: "Importação EVO", icon: Upload },
  ],
};

// ---------------------------------------------------------------------------
// Agregadores
// ---------------------------------------------------------------------------

export const adminGroups: NavGroup[] = [
  monitorGroup,
  ecosystemGroup,
  billingGroup,
  governanceGroup,
  configGroup,
];

export const allAdminNavItems: NavItem[] = adminGroups.flatMap((g) => g.items);
