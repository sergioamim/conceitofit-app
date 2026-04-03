import { redirectStorefrontJourney } from "../redirect-to-public-journey";

/**
 * Proxy page: rende a jornada /adesao/cadastro existente usando o tenantRef
 * do subdomínio da storefront. Evita duplicar a lógica do form.
 *
 * O middleware do storefront injeta x-tenant-id no header; aqui apenas
 * preservamos a query string recebida e redirecionamos no servidor
 * para a jornada canônica em /adesao/cadastro.
 */

export default async function StorefrontCadastroPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return redirectStorefrontJourney("/adesao/cadastro", searchParams);
}
