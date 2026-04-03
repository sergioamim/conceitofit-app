import { redirectStorefrontJourney } from "../redirect-to-public-journey";

export default async function StorefrontTrialPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return redirectStorefrontJourney("/adesao/trial", searchParams);
}
