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
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type BackofficeNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Tags de busca (sinonimos) para a command palette */
  searchTags?: string[];
  /** Se true, item aparece apenas na command palette, nao na sidebar */
  paletteOnly?: boolean;
};

export type BackofficeNavGroup = {
  title: string;
  items: BackofficeNavItem[];
};

export const backofficeNavGroups: BackofficeNavGroup[] = [
  {
    title: "Geral",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard, searchTags: ["home", "inicio", "painel", "visao geral", "resumo"] },
      { href: "/admin/saas", label: "Metricas SaaS", icon: LineChart, searchTags: ["mrr", "churn", "arpu", "receita", "kpi", "indicadores"] },
      { href: "/admin/busca", label: "Busca Global", icon: Search, searchTags: ["pesquisar", "search", "encontrar", "localizar"] },
      { href: "/admin/bi", label: "BI Executivo", icon: BarChart3, searchTags: ["business intelligence", "relatorios", "analytics", "graficos", "dados"] },
    ],
  },
  {
    title: "Comercial",
    items: [
      { href: "/admin/leads", label: "Leads B2B", icon: Users, searchTags: ["prospectos", "prospects", "vendas", "comercial", "pipeline", "funil"] },
    ],
  },
  {
    title: "Operacional",
    items: [
      { href: "/admin/operacional/saude", label: "Saude Operacional", icon: Activity, searchTags: ["health", "status", "monitoramento", "uptime", "sistema"] },
      { href: "/admin/operacional/alertas", label: "Alertas Operacionais", icon: AlertTriangle, searchTags: ["notificacoes", "avisos", "incidentes", "problemas", "warnings"] },
      { href: "/admin/academias", label: "Academias", icon: Building2, searchTags: ["tenants", "clientes", "unidades", "gyms", "lista academias"] },
      { href: "/admin/onboarding/provisionar", label: "Provisionar Academia", icon: Rocket, searchTags: ["nova academia", "criar academia", "setup", "ativar", "onboarding"] },
      { href: "/admin/unidades", label: "Unidades", icon: Building2, searchTags: ["filiais", "locais", "branches", "sedes"] },
      { href: "/admin/entrar-como-academia", label: "Entrar como Academia", icon: Building2, searchTags: ["impersonar", "impersonate", "simular", "acessar como", "trocar tenant"], paletteOnly: true },
    ],
  },
  {
    title: "Financeiro",
    items: [
      { href: "/admin/financeiro", label: "Financeiro B2B", icon: Wallet, searchTags: ["billing", "faturamento", "receita", "pagamentos", "financas"] },
      { href: "/admin/financeiro/planos", label: "Planos da Plataforma", icon: Wallet, searchTags: ["assinatura", "subscription", "pricing", "precos", "pacotes"] },
      { href: "/admin/financeiro/contratos", label: "Contratos da Plataforma", icon: FileText, searchTags: ["agreements", "termos", "vigencia", "renovacao"] },
      { href: "/admin/financeiro/cobrancas", label: "Cobrancas da Plataforma", icon: Wallet, searchTags: ["billing", "fatura", "invoice", "boleto", "pagamento", "inadimplencia"] },
      { href: "/admin/financeiro/gateways", label: "Gateways de Pagamento", icon: CreditCard, searchTags: ["stripe", "pix", "cartao", "meio de pagamento", "processador"] },
    ],
  },
  {
    title: "Seguranca",
    items: [
      { href: "/admin/seguranca", label: "Seguranca", icon: ShieldCheck, searchTags: ["security", "protecao", "acesso", "permissoes"] },
      { href: "/admin/seguranca/usuarios", label: "Usuarios do Backoffice", icon: UserCog, searchTags: ["admins", "operadores", "contas", "gerenciar usuarios"], paletteOnly: true },
      { href: "/admin/seguranca/perfis", label: "Perfis de Acesso", icon: Key, searchTags: ["roles", "papeis", "niveis", "permissoes", "rbac"], paletteOnly: true },
      { href: "/admin/seguranca/funcionalidades", label: "Funcionalidades", icon: Zap, searchTags: ["features", "recursos", "modulos", "capacidades", "feature flags"], paletteOnly: true },
      { href: "/admin/seguranca/catalogo", label: "Catalogo de Permissoes", icon: BookOpen, searchTags: ["permissions", "acl", "lista permissoes", "catalogo"], paletteOnly: true },
      { href: "/admin/seguranca/revisoes", label: "Revisoes de Acesso", icon: ListChecks, searchTags: ["audit", "review", "verificacao", "conformidade"], paletteOnly: true },
      { href: "/admin/compliance", label: "Compliance LGPD", icon: Shield, searchTags: ["privacidade", "dados pessoais", "gdpr", "protecao dados", "regulamentacao"] },
      { href: "/admin/audit-log", label: "Audit Log", icon: FileText, searchTags: ["historico", "log", "registro", "rastreamento", "auditoria", "trilha"] },
    ],
  },
  {
    title: "Comunicacao",
    items: [
      { href: "/admin/whatsapp", label: "WhatsApp", icon: MessageSquare, searchTags: ["mensagens", "chat", "comunicacao", "notificacao", "zap"] },
    ],
  },
  {
    title: "Configuracao",
    items: [
      { href: "/admin/configuracoes", label: "Configuracoes", icon: Settings, searchTags: ["settings", "preferencias", "ajustes", "parametros", "opcoes"] },
      { href: "/admin/importacao-evo", label: "Importacao EVO", icon: Upload, searchTags: ["migrar", "importar", "evo", "dados", "csv", "upload"] },
      { href: "/admin/importacao-evo-p0", label: "Importacao EVO P0", icon: Upload, searchTags: ["migrar", "importar", "evo", "pacote", "p0", "upload"], paletteOnly: true },
    ],
  },
];

/** Todos os itens de navegacao (sidebar + palette-only) */
export const allBackofficeNavItems: BackofficeNavItem[] = backofficeNavGroups.flatMap(
  (group) => group.items,
);

/** Apenas grupos/itens visiveis na sidebar (exclui palette-only) */
export const sidebarBackofficeNavGroups: BackofficeNavGroup[] = backofficeNavGroups.map(
  (group) => ({
    ...group,
    items: group.items.filter((item) => !item.paletteOnly),
  }),
);
