export type GlobalSecuritySection = {
  href: string;
  label: string;
  description: string;
};

export const GLOBAL_SECURITY_SECTIONS: GlobalSecuritySection[] = [
  {
    href: "/admin/seguranca",
    label: "Visão geral",
    description: "Resumo operacional, rollout e riscos da segurança global.",
  },
  // Wave 5 do plano de migração legacy → RBAC v2: hrefs apontam para UI nova
  // (`/admin/gestao-acessos/*`). Páginas legadas viram redirects 308.
  // `funcionalidades` e `revisoes` permanecem no legado (não são RBAC).
  {
    href: "/admin/gestao-acessos/usuarios",
    label: "Usuários e acessos",
    description: "Quem tem acesso, onde atua e quais alertas exigem ação.",
  },
  {
    href: "/admin/gestao-acessos/papeis",
    label: "Perfis padronizados",
    description: "Papéis reutilizáveis e o que cada um deveria representar.",
  },
  {
    href: "/admin/seguranca/funcionalidades",
    label: "Funcionalidades",
    description: "Catálogo do que pode ser liberado e rollout por capacidade.",
  },
  {
    href: "/admin/seguranca/revisoes",
    label: "Revisões e auditoria",
    description: "Filas de revisão, exceções vencendo e trilha recente de mudanças.",
  },
  {
    href: "/admin/gestao-acessos/permissoes",
    label: "Catálogo de permissões",
    description: "Capacidades granulares do RBAC v2 e como compor papéis customizados.",
  },
];

export const GLOBAL_SECURITY_LEGACY_LINKS: Array<{ href: string; label: string }> = [];

export function isGlobalSecurityIaEnabled() {
  return process.env.NEXT_PUBLIC_FEATURE_SECURITY_IA !== "false";
}

