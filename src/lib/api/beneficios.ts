import type { Convenio, Voucher, VoucherCodigo } from "@/lib/types";
import { apiRequest } from "./http";

const toNumber = (value: unknown, fallback = 0): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const toArray = <T>(value: T[] | null | undefined): T[] => value ?? [];

export async function listConveniosApi(apenasAtivos?: boolean): Promise<Convenio[]> {
  const response = await apiRequest<Array<Convenio & { descontoPercentual: number | string }>>({
    path: "/api/v1/administrativo/convenios",
    query: { apenasAtivos: apenasAtivos ?? false },
  });
  return response.map((item) => ({
    ...item,
    descontoPercentual: toNumber(item.descontoPercentual, 0),
    planoIds: toArray(item.planoIds),
  }));
}

export async function createConvenioApi(
  data: Omit<Convenio, "id">
): Promise<Convenio> {
  return apiRequest<Convenio>({
    path: "/api/v1/administrativo/convenios",
    method: "POST",
    body: data,
  });
}

export async function updateConvenioApi(id: string, data: Partial<Convenio>): Promise<Convenio> {
  return apiRequest<Convenio>({
    path: `/api/v1/administrativo/convenios/${id}`,
    method: "PUT",
    body: data,
  });
}

export async function toggleConvenioApi(id: string): Promise<Convenio> {
  return apiRequest<Convenio>({
    path: `/api/v1/administrativo/convenios/${id}/toggle`,
    method: "PATCH",
  });
}

export async function deleteConvenioApi(id: string): Promise<void> {
  await apiRequest<void>({
    path: `/api/v1/administrativo/convenios/${id}`,
    method: "DELETE",
  });
}

export async function listVouchersApi(): Promise<Voucher[]> {
  return apiRequest<Voucher[]>({
    path: "/api/v1/administrativo/vouchers",
  });
}

export async function createVoucherApi(
  payload: Record<string, unknown>
): Promise<Voucher> {
  return apiRequest<Voucher>({
    path: "/api/v1/administrativo/vouchers",
    method: "POST",
    body: payload,
  });
}

export async function updateVoucherApi(id: string, payload: Record<string, unknown>): Promise<Voucher> {
  return apiRequest<Voucher>({
    path: `/api/v1/administrativo/vouchers/${id}`,
    method: "PUT",
    body: payload,
  });
}

export async function toggleVoucherApi(id: string): Promise<Voucher> {
  return apiRequest<Voucher>({
    path: `/api/v1/administrativo/vouchers/${id}/toggle`,
    method: "PATCH",
  });
}

export async function listVoucherCodigosApi(voucherId: string): Promise<VoucherCodigo[]> {
  return apiRequest<VoucherCodigo[]>({
    path: `/api/v1/administrativo/vouchers/${voucherId}/codigos`,
  });
}

export async function listVoucherUsageCountsApi(): Promise<Record<string, number>> {
  return apiRequest<Record<string, number>>({
    path: "/api/v1/administrativo/vouchers/usage-counts",
  });
}
