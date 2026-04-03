import { useQuery } from "@tanstack/react-query";
import { listAuditLogsApi, type ListAuditLogsInput } from "@/backoffice/api/admin-audit";
import type { AuditLogEntry, PaginatedResult } from "@/lib/types";
import { queryKeys } from "@/lib/query/keys";

export function useAdminAuditLog(input: ListAuditLogsInput = {}) {
  return useQuery<PaginatedResult<AuditLogEntry>>({
    queryKey: queryKeys.admin.auditLog.list(input as Record<string, unknown>),
    queryFn: () => listAuditLogsApi(input),
  });
}
