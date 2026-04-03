import type { GlobalAdminReviewBoard } from "@/lib/types";
import { apiRequest } from "@/lib/api/http";
import type { RawReviewBoard } from "./_shared";
import { normalizeReviewItem } from "./_shared";

export async function getGlobalAdminReviewBoardApi(): Promise<GlobalAdminReviewBoard> {
  const response = await apiRequest<RawReviewBoard>({
    path: "/api/v1/admin/seguranca/reviews",
  });
  return {
    pendingReviews: [...(response.pendingReviews ?? []), ...(response.revisoesPendentes ?? [])].map(normalizeReviewItem),
    expiringExceptions: [...(response.expiringExceptions ?? []), ...(response.excecoesExpirando ?? [])].map(normalizeReviewItem),
    recentChanges: [...(response.recentChanges ?? []), ...(response.mudancasRecentes ?? [])].map(normalizeReviewItem),
    broadAccess: [...(response.broadAccess ?? []), ...(response.acessosAmplos ?? [])].map(normalizeReviewItem),
    orphanProfiles: [...(response.orphanProfiles ?? []), ...(response.perfisSemDono ?? [])].map(normalizeReviewItem),
  };
}
