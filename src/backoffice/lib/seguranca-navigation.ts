export type GlobalSecuritySection = {
  href: string;
  label: string;
  description: string;
};

// Wave 5 do plano de migração legacy → RBAC v2:
// - `/admin/seguranca` (overview) → redireciona para `/admin/gestao-acessos`
// - `/admin/seguranca/{catalogo,perfis,usuarios}` → redirecionam pra UI nova
// - Únicos sobreviventes neste shell: `funcionalidades` (feature flags) e
//   `revisoes` (review board de governança), que NÃO são RBAC.
//
// Logo, este nav lateral só faz sentido nessas 2 páginas remanescentes.
export const GLOBAL_SECURITY_SECTIONS: GlobalSecuritySection[] = [
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
];

export const GLOBAL_SECURITY_LEGACY_LINKS: Array<{ href: string; label: string }> = [];

export function isGlobalSecurityIaEnabled() {
  return process.env.NEXT_PUBLIC_FEATURE_SECURITY_IA !== "false";
}

