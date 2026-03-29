# Task ID: 223

**Title:** Criar workflow GitHub Actions para deploy em Cloud Run (CD)

**Status:** pending

**Dependencies:** None

**Priority:** high

**Description:** Automatizar deploy: push na main → build Docker → push Artifact Registry → deploy Cloud Run. Sem deploy manual.

**Details:**

Trigger: push na branch main (após merge). Steps: checkout → build Docker image → push para Artifact Registry → deploy Cloud Run com gcloud. Usar Workload Identity Federation (sem service account keys). Variáveis via Cloud Run secrets. Health check antes de rotear tráfego. Rollback se health check falhar.

**Test Strategy:**

Merge na main deploya automaticamente em < 10min. Rollback funciona se health check falhar.
