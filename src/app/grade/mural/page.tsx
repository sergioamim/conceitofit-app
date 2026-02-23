import { GradeWeekMuralBoard } from "@/components/grade/grade-week-mural-board";

export default async function GradeMuralPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  return <GradeWeekMuralBoard date={params?.date} />;
}
