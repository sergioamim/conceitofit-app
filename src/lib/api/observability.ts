import { apiRequest } from "./http";

/**
 * Observabilidade de jobs e handlers async do backend.
 * Endpoint: GET /api/v1/admin/observability/jobs
 */

export interface JobLatency {
  seconds: number;
  millis: number;
}

export interface JobLastError {
  occurredAt: string;
  message: string;
  exceptionType: string;
}

export interface JobStats {
  jobName: string;
  successCount: number;
  failureCount: number;
  latencyP95: JobLatency;
  latencyMax: JobLatency;
  lastRunAt: string | null;
  lastError: JobLastError | null;
}

export interface JobObservabilityResponse {
  jobs: JobStats[];
  snapshotAt: string;
}

export async function listAdminJobMetricsApi(): Promise<JobObservabilityResponse> {
  return apiRequest<JobObservabilityResponse>({
    path: "/api/v1/admin/observability/jobs",
  });
}
