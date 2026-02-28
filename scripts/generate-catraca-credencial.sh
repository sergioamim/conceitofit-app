#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Uso:
  bash scripts/generate-catraca-credencial.sh

Variáveis de ambiente:
  BACKEND_URL               URL do backend (default: http://localhost:8080)
  EMAIL                     e-mail de login (default: admin@academia.local)
  PASSWORD                  senha de login (default: 12345678)
  INTEGRATION_ADMIN_TOKEN ou NEXT_PUBLIC_INTEGRATION_ADMIN_TOKEN
                           token de admin (obrigatório)
  TENANT_ID                 opcional; se não informado, usa o primeiro disponível em /api/v1/auth/me
  TENANT_NAME               opcional; filtra tenants por nome (quando TENANT_ID não informado)

Exemplo:
  INTEGRATION_ADMIN_TOKEN=XPTO_LTDA \
  EMAIL=admin@academia.local \
  PASSWORD=12345678 \
  TENANT_ID=00000000-0000-0000-0000-000000000000 \
  bash scripts/generate-catraca-credencial.sh
USAGE
}

BACKEND_URL="${BACKEND_URL:-http://localhost:8080}"
EMAIL="${EMAIL:-admin@academia.local}"
PASSWORD="${PASSWORD:-12345678}"
INTEGRATION_ADMIN_TOKEN="${INTEGRATION_ADMIN_TOKEN:-${NEXT_PUBLIC_INTEGRATION_ADMIN_TOKEN:-XPTO_LTDA:}}"
INTEGRATION_ADMIN_TOKEN="${INTEGRATION_ADMIN_TOKEN:-}"
TENANT_ID="${TENANT_ID:-25851485-1f5a-4d18-9d2c-3ac11f60a6da}"
TENANT_NAME="${TENANT_NAME:-}"
DRY_RUN="${DRY_RUN:-0}"

if ! command -v jq >/dev/null 2>&1; then
  echo "jq não encontrado. Instale: brew install jq"
  exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "curl não encontrado."
  exit 1
fi

if [ -z "$INTEGRATION_ADMIN_TOKEN" ]; then
  echo "INTEGRATION_ADMIN_TOKEN não definido."
  echo "Defina: export INTEGRATION_ADMIN_TOKEN=... ou NEXT_PUBLIC_INTEGRATION_ADMIN_TOKEN=..."
  echo "ou: INTEGRATION_ADMIN_TOKEN=... bash scripts/generate-catraca-credencial.sh"
  exit 1
fi

login_payload=$(cat <<JSON
{"email":"$EMAIL","password":"$PASSWORD"}
JSON
)

tmp_login=$(mktemp)
tmp_me=$(mktemp)
tmp_cred=$(mktemp)
trap 'rm -f "$tmp_login" "$tmp_me" "$tmp_cred"' EXIT

echo "🔐 Fazendo login em $BACKEND_URL/api/v1/auth/login..."

http_status_login=$(curl -sS -o "$tmp_login" -w "%{http_code}" -X POST "$BACKEND_URL/api/v1/auth/login" \
  -H 'Content-Type: application/json' \
  -d "$login_payload")

jq -e '.message // empty' "$tmp_login" >/dev/null 2>&1 || true

if [ "$http_status_login" != "200" ]; then
  echo "❌ Falha no login (HTTP $http_status_login)"
  jq . "$tmp_login"
  exit 1
fi

jwt=$(jq -r '.accessToken // .token // .data.token // empty' "$tmp_login")

if [ -z "$jwt" ] || [ "$jwt" = "null" ]; then
  echo "❌ Não encontrei token no retorno do login."
  jq . "$tmp_login"
  exit 1
fi

echo "✅ Login OK"

http_status_me=$(curl -sS -o "$tmp_me" -w "%{http_code}" \
  "$BACKEND_URL/api/v1/auth/me" \
  -H "Authorization: Bearer $jwt")

if [ "$http_status_me" != "200" ]; then
  echo "❌ Falha ao obter contexto do usuário (HTTP $http_status_me)"
  jq . "$tmp_me"
  exit 1
fi

if [ -z "$TENANT_ID" ] || [ "$TENANT_ID" = "" ]; then
  echo "\n👤 Tenants disponíveis no contexto atual:"
  jq -r '.availableTenants[]? | "\(.id) | \(.nome // "(sem nome)")"' "$tmp_me"

  if [ -n "$TENANT_NAME" ]; then
    TENANT_ID="$(jq -r --arg name "$TENANT_NAME" '.availableTenants[]? | select((.nome // "")|ascii_downcase == ($name|ascii_downcase)) | .id' "$tmp_me" | head -n1)"
    if [ -n "$TENANT_ID" ]; then
      echo "🎯 TENANT_ID selecionado por nome: $TENANT_ID"
    fi
  fi

  if [ -z "$TENANT_ID" ]; then
    TENANT_ID="$(jq -r '.availableTenants[0].id // empty' "$tmp_me")"
  fi

  if [ -z "$TENANT_ID" ]; then
    echo "Não foi possível inferir tenantId em /api/v1/auth/me."
    exit 1
  fi
  echo "⚠️ TENANT_ID não informado. Usando o primeiro disponível: $TENANT_ID"
fi

echo "\n🏢 Gerando credencial para tenant: $TENANT_ID"

payload=$(cat <<JSON
{"tenantId":"$TENANT_ID"}
JSON
)

cat <<EOF

🧾 Curl equivalente (sem segredos):
curl -X POST "$BACKEND_URL/api/v1/integracoes/catraca/credenciais" \\
  -H "Authorization: Bearer <SEU_JWT>" \\
  -H "X-Admin-Token: <SEU_TOKEN_ADMIN>" \\
  -H "Content-Type: application/json" \\
  -d '$payload'
EOF

if [ "$DRY_RUN" = "1" ]; then
  echo "\nDRY_RUN=1: apenas exibiu o comando equivalente."
  exit 0
fi

http_status_cred=$(curl -sS -o "$tmp_cred" -w "%{http_code}" -X POST "$BACKEND_URL/api/v1/integracoes/catraca/credenciais" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $jwt" \
  -H "X-Admin-Token: $INTEGRATION_ADMIN_TOKEN" \
  -d "$payload")

if [ "$http_status_cred" -ge 200 ] && [ "$http_status_cred" -lt 300 ]; then
  echo "\n✅ Credencial gerada com sucesso"
  jq . "$tmp_cred"
  echo
  echo "💾 Campos úteis:"
  echo "keyId: $(jq -r '.keyId // "n/a"' "$tmp_cred")"
  echo "secret: $(jq -r '.secret // "n/a"' "$tmp_cred")"
  echo "bearerPlain: $(jq -r '.bearerPlain // "n/a"' "$tmp_cred")"
  echo "bearerBase64: $(jq -r '.bearerBase64 // "n/a"' "$tmp_cred")"
  exit 0
fi

echo "\n❌ Falha ao gerar credencial (HTTP $http_status_cred)"
jq . "$tmp_cred"
exit 1
