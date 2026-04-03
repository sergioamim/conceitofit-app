import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getGlobalSecurityOverview,
  listEligibleNewUnitAdminsPreview,
  getGlobalSecurityReviewBoard,
} from "@/backoffice/lib/seguranca";
import type {
  GlobalAdminSecurityOverview,
  GlobalAdminUserSummary,
  GlobalAdminReviewBoard,
  RbacPaginatedResult,
} from "@/lib/types";
import { queryKeys } from "@/lib/query/keys";

export function useAdminSecurityOverview() {
  return useQuery<GlobalAdminSecurityOverview>({
    queryKey: queryKeys.admin.seguranca.overview(),
    queryFn: () => getGlobalSecurityOverview(),
  });
}

export function useAdminSecurityEligiblePreview(size = 5) {
  return useQuery<RbacPaginatedResult<GlobalAdminUserSummary>>({
    queryKey: queryKeys.admin.seguranca.eligiblePreview(),
    queryFn: () => listEligibleNewUnitAdminsPreview({ size }),
  });
}

export function useAdminSecurityReviewBoard() {
  return useQuery<GlobalAdminReviewBoard>({
    queryKey: queryKeys.admin.seguranca.reviewBoard(),
    queryFn: () => getGlobalSecurityReviewBoard(),
  });
}

export function useInvalidateAdminSeguranca() {
  const qc = useQueryClient();
  return () => void qc.invalidateQueries({ queryKey: queryKeys.admin.seguranca.all() });
}
