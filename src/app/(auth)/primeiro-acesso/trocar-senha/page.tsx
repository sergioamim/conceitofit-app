import { ForcedPasswordChangeFlow } from "@/components/auth/forced-password-change-flow";

export default async function ForcedPasswordChangePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return <ForcedPasswordChangeFlow nextPath={next} />;
}
