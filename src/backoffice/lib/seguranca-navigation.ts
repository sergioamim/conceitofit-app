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
  {
    href: "/admin/seguranca/usuarios",
    label: "Usuários e acessos",
    description: "Quem tem acesso, onde atua e quais alertas exigem ação.",
  },
  {
    href: "/admin/seguranca/perfis",
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
    href: "/admin/seguranca/catalogo",
    label: "Segurança avançada",
    description: "Catálogo de funcionalidades, perfis-padrão versionados e gestão de exceções.",
  },
];

export const GLOBAL_SECURITY_LEGACY_LINKS: Array<{ href: string; label: string }> = [];

export function isGlobalSecurityIaEnabled() {
  return process.env.NEXT_PUBLIC_FEATURE_SECURITY_IA !== "false";
}

