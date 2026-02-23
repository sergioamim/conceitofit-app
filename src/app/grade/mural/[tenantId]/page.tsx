import { GradeWeekMuralBoard } from "@/components/grade/grade-week-mural-board";

export default async function GradeMuralByTenantPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenantId: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const [{ tenantId }, query] = await Promise.all([params, searchParams]);
  return <GradeWeekMuralBoard tenantId={tenantId} date={query?.date} />;
}
