// ---------------------------------------------------------------------------
// Storage API — upload, presigned URLs e exclusao de arquivos
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UploadResponse {
  url: string;
  key: string;
  bucket: string;
  contentType: string;
  size: number;
}

export interface ImagemUploadResponse {
  url: string;
  key: string;
  bucket: string;
}

export interface PresignedUrlResponse {
  url: string;
  expiresInMinutes: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Executa um fetch multipart (FormData) contra o backend proxy.
 * NAO define Content-Type manualmente — o browser injeta
 * `multipart/form-data; boundary=...` automaticamente.
 */
async function multipartFetch<T>(
  path: string,
  formData: FormData,
): Promise<T> {
  const res = await fetch(`/backend${path}`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Storage upload falhou (${res.status}): ${text || res.statusText}`,
    );
  }

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// POST /api/v1/storage/upload (multipart/form-data)
// ---------------------------------------------------------------------------

export async function uploadFileApi(input: {
  file: File;
  key: string;
  tenantId: string;
  bucket?: string;
}): Promise<UploadResponse> {
  const form = new FormData();
  form.append("file", input.file);
  form.append("key", input.key);
  form.append("tenantId", input.tenantId);
  if (input.bucket) form.append("bucket", input.bucket);

  return multipartFetch<UploadResponse>("/api/v1/storage/upload", form);
}

// ---------------------------------------------------------------------------
// POST /api/v1/storage/imagens (multipart/form-data)
// Max 10 MB, apenas jpeg/png/webp
// ---------------------------------------------------------------------------

export async function uploadImagemApi(input: {
  file: File;
  key: string;
  tenantId: string;
  bucket?: string;
}): Promise<ImagemUploadResponse> {
  const form = new FormData();
  form.append("file", input.file);
  form.append("key", input.key);
  form.append("tenantId", input.tenantId);
  if (input.bucket) form.append("bucket", input.bucket);

  return multipartFetch<ImagemUploadResponse>(
    "/api/v1/storage/imagens",
    form,
  );
}

// ---------------------------------------------------------------------------
// GET /api/v1/storage/presigned/{bucket}/{key}?durationMinutes=N&tenantId=X
// ---------------------------------------------------------------------------

export async function getPresignedUrlApi(input: {
  bucket: string;
  key: string;
  tenantId: string;
  durationMinutes?: number;
}): Promise<PresignedUrlResponse> {
  const params = new URLSearchParams({ tenantId: input.tenantId });
  if (input.durationMinutes != null) {
    params.set("durationMinutes", String(input.durationMinutes));
  }

  const url = `/backend/api/v1/storage/presigned/${encodeURIComponent(input.bucket)}/${input.key}?${params.toString()}`;

  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Presigned URL falhou (${res.status}): ${text || res.statusText}`,
    );
  }

  return res.json() as Promise<PresignedUrlResponse>;
}

// ---------------------------------------------------------------------------
// DELETE /api/v1/storage/{bucket}/{key}?tenantId=X
// ---------------------------------------------------------------------------

export async function deleteStorageFileApi(input: {
  bucket: string;
  key: string;
  tenantId: string;
}): Promise<void> {
  const params = new URLSearchParams({ tenantId: input.tenantId });
  const url = `/backend/api/v1/storage/${encodeURIComponent(input.bucket)}/${input.key}?${params.toString()}`;

  const res = await fetch(url, {
    method: "DELETE",
    credentials: "include",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Delete storage falhou (${res.status}): ${text || res.statusText}`,
    );
  }
}
