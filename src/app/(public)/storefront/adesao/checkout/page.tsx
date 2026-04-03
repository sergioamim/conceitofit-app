import { redirectStorefrontJourney } from "../redirect-to-public-journey";

export default async function StorefrontCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return redirectStorefrontJourney("/adesao/checkout", searchParams);
}
