import {
  Activity,
  BarChart3,
  Building2,
  CreditCard,
  FileText,
  Globe,
  LayoutDashboard,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  Upload,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type BackofficeNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export type BackofficeNavGroup = {
  title: string;
  items: BackofficeNavItem[];
};

export const backofficeNavGroups: BackofficeNavGroup[] = [
  {
    title: "Geral",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/busca", label: "Busca Global", icon: Search },
      { href: "/admin/bi", label: "BI Executivo", icon: BarChart3 },
    ],
  },
  {
    title: "Operacional",
    items: [
      { href: "/admin/operacional/saude", label: "Saúde Operacional", icon: Activity },
      { href: "/admin/operacional/alertas", label: "Alertas Operacionais", icon: Activity },
      { href: "/admin/academias", label: "Academias", icon: Building2 },
      { href: "/admin/unidades", label: "Unidades", icon: Building2 },
    ],
  },
  {
    title: "Financeiro",
    items: [
      { href: "/admin/financeiro", label: "Financeiro B2B", icon: Wallet },
      { href: "/admin/financeiro/planos", label: "Planos da Plataforma", icon: Wallet },
      { href: "/admin/financeiro/contratos", label: "Contratos da Plataforma", icon: FileText },
      { href: "/admin/financeiro/cobrancas", label: "Cobranças da Plataforma", icon: Wallet },
      { href: "/admin/financeiro/gateways", label: "Gateways de Pagamento", icon: CreditCard },
    ],
  },
  {
    title: "Segurança",
    items: [
      { href: "/admin/seguranca", label: "Segurança", icon: ShieldCheck },
      { href: "/admin/compliance", label: "Compliance LGPD", icon: Shield },
      { href: "/admin/audit-log", label: "Audit Log", icon: FileText },
    ],
  },
  {
    title: "Configuração",
    items: [
      { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
      { href: "/admin/importacao-evo", label: "Importação EVO", icon: Upload },
    ],
  },
];

export const allBackofficeNavItems: BackofficeNavItem[] = backofficeNavGroups.flatMap(
  (group) => group.items
);
