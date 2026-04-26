import {
  Activity,
  AlertTriangle,
  BarChart3,
  BellRing,
  Building2,
  Coins,
  CreditCard,
  Eye,
  FileText,
  Globe,
  History,
  KeyRound,
  LayoutDashboard,
  LineChart,
  Megaphone,
  MessageSquare,
  Package,
  PlugZap,
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
    {
      href: "/admin/caixas",
      label: "Caixas",
      icon: Coins,
      description: "Dashboard, listagem e diferenças (CXO-203)",
    },
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

/** 4. Gestão de Acessos — RBAC v2 (redesign 2026-04-25) */
export const gestaoAcessosGroup: NavGroup = {
  label: "Gestão de Acessos",
  icon: KeyRound,
  items: [
    { href: "/admin/gestao-acessos", label: "Visão geral", icon: ShieldCheck, description: "KPIs e atividade recente" },
    { href: "/admin/gestao-acessos/usuarios", label: "Usuários", icon: Users, description: "Lista de operadores da rede" },
    { href: "/admin/gestao-acessos/papeis", label: "Papéis", icon: KeyRound, description: "Conjuntos de permissões" },
    { href: "/admin/gestao-acessos/permissoes", label: "Permissões", icon: FileText, description: "Catálogo granular" },
    { href: "/admin/gestao-acessos/auditoria", label: "Auditoria de Acesso", icon: History, description: "Mudanças de RBAC, política de segurança e convites" },
    { href: "/admin/gestao-acessos/seguranca", label: "Política de Segurança", icon: Shield, description: "Senha e sessões" },
    { href: "/admin/gestao-acessos/usuarios/convidar", label: "Convidar usuário", icon: Users, paletteOnly: true },
    { href: "/admin/gestao-acessos/perfis", label: "Perfis (legado)", icon: Shield, paletteOnly: true },
    { href: "/admin/gestao-acessos/operadores", label: "Operadores (legado)", icon: Users, paletteOnly: true },
  ],
};

/** 5. Plataforma — gestão SaaS de features, planos e grupos */
export const plataformaGroup: NavGroup = {
  label: "Plataforma",
  icon: Package,
  items: [
    { href: "/admin/plataforma/features", label: "Feature Modules", icon: Zap, description: "Habilitar/desabilitar add-ons por tenant" },
    { href: "/admin/plataforma/planos", label: "Planos SaaS", icon: CreditCard, description: "Gerenciar planos e features incluídas" },
    { href: "/admin/plataforma/grupos", label: "Grupos", icon: Users, description: "Grupos de tenants (beta testers, parceiros)" },
  ],
};

/** 6. Governança & Engenharia */
export const governanceGroup: NavGroup = {
  label: "Governança",
  icon: ShieldCheck,
  items: [
    { href: "/admin/seguranca", label: "Central de Segurança", icon: ShieldCheck },
    {
      href: "/admin/feature-flags",
      label: "Feature Flags",
      icon: Zap,
      description: "Habilitar/desabilitar features por tenant (DB)",
    },
    { href: "/admin/seguranca/usuarios", label: "Usuários", icon: Users },
    { href: "/admin/compliance", label: "Compliance LGPD", icon: Shield },
    { href: "/admin/audit-log", label: "Auditoria Operacional", icon: FileText, description: "Operações em alunos, contratos, pagamentos e impersonação" },
    { href: "/admin/observability/jobs", label: "Jobs & Async", icon: Activity },
  ],
};

/** 7. Notificações — emissão manual e auditoria (Epic 4 Wave 5) */
export const notificacoesGroup: NavGroup = {
  label: "Notificações",
  icon: BellRing,
  items: [
    {
      href: "/admin/notificacoes/emitir",
      label: "Emitir",
      icon: Megaphone,
      description: "Publicar notificação global no inbox",
    },
    {
      href: "/admin/notificacoes/historico",
      label: "Histórico",
      icon: History,
      description: "Auditoria de emissões manuais",
    },
  ],
};

/** 8. Configurações & Ferramentas */
export const configGroup: NavGroup = {
  label: "Configurações",
  icon: Settings,
  items: [
    { href: "/admin/configuracoes", label: "Ajustes Gerais", icon: Settings },
    { href: "/admin/whatsapp", label: "WhatsApp API", icon: MessageSquare },
    {
      href: "/admin/integracoes/agregadores",
      label: "Agregadores",
      icon: PlugZap,
      description: "Wellhub / TotalPass por tenant",
    },
    {
      href: "/admin/integracoes/agregadores/dashboard",
      label: "Dashboard Agregadores",
      icon: BarChart3,
      description: "BI Wellhub / TotalPass — mapa de valores (AG-12)",
    },
    { href: "/admin/importacao-evo", label: "Importação EVO", icon: Upload },
    { href: "/admin/importacao-evo-p0", label: "Importação EVO P0", icon: Upload, description: "Importação com DAG paralelo" },
    { href: "/admin/entrar-como-academia", label: "Acessar Unidade", icon: Building2, paletteOnly: true },
  ],
};

// ---------------------------------------------------------------------------
// Agregadores
// ---------------------------------------------------------------------------

export const adminGroups: NavGroup[] = [
  monitorGroup,
  ecosystemGroup,
  billingGroup,
  gestaoAcessosGroup,
  plataformaGroup,
  governanceGroup,
  notificacoesGroup,
  configGroup,
];

export const allAdminNavItems: NavItem[] = adminGroups.flatMap((g) => g.items);
