import { redirect } from "next/navigation";

type StorefrontSearchParams = Promise<Record<string, string | string[] | undefined>>;

function buildSearchParams(
  params: Record<string, string | string[] | undefined>,
): URLSearchParams {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") {
      search.set(key, value);
      continue;
    }

    if (Array.isArray(value)) {
      for (const entry of value) {
        search.append(key, entry);
      }
    }
  }

  return search;
}

export async function redirectStorefrontJourney(
  pathname: string,
  searchParams: StorefrontSearchParams,
): Promise<never> {
  const resolved = await searchParams;
  const search = buildSearchParams(resolved).toString();

  redirect(search ? `${pathname}?${search}` : pathname);
}
