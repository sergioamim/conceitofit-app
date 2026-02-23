import { redirect } from "next/navigation";

export default async function GradeImgByTenantPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenantId: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const [{ tenantId }, query] = await Promise.all([params, searchParams]);
  const suffix = query?.date ? `?date=${query.date}` : "";
  redirect(`/grade/mural/${tenantId}${suffix}`);
}
