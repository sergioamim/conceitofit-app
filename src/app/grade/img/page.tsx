import { redirect } from "next/navigation";

export default async function GradeImgPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  const suffix = params?.date ? `?date=${params.date}` : "";
  redirect(`/grade/mural${suffix}`);
}
