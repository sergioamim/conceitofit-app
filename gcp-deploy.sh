#!/bin/bash

# Script de Deploy para Google Cloud Run (Frontend Next.js)
# Uso: ./gcp-deploy.sh <project_id>

PROJECT_ID=$1

if [ -z "$PROJECT_ID" ]; then
    echo "Erro: Forneça o Project ID do Google Cloud."
    echo "Uso: ./gcp-deploy.sh meu-projeto-123"
    exit 1
fi

SERVICE_NAME="academia-frontend"
REGION="us-central1"
REPO_NAME="academia-repo"
IMAGE_NAME="frontend"

echo "🚀 Iniciando deploy do Frontend para o Google Cloud Run..."

# 1. Habilitar APIs (se necessário)
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com

# 2. Criar repositório no Artifact Registry se não existir
gcloud artifacts repositories describe $REPO_NAME --location=$REGION > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "📦 Criando repositório $REPO_NAME..."
    gcloud artifacts repositories create $REPO_NAME --repository-format=docker --location=$REGION
fi

# 3. Build da imagem via Cloud Build (economiza banda local)
echo "🏗️ Construindo imagem no Cloud Build..."
IMAGE_TAG="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/$IMAGE_NAME:latest"
gcloud builds submit --tag $IMAGE_TAG .

# 4. Deploy no Cloud Run
echo "🚀 Fazendo deploy no Cloud Run..."
# NOTA: O BACKEND_PROXY_TARGET deve ser a URL do seu backend Java
# Altere após o primeiro deploy do backend.
gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_TAG \
    --region $REGION \
    --platform managed \
    --allow-unauthenticated \
    --set-env-vars="BACKEND_PROXY_TARGET=PENDENTE"

echo "✅ Deploy concluído!"
echo "🔗 Acesse o serviço em: $(gcloud run services describe $SERVICE_NAME --region $REGION --format='value(status.url)')"
echo "⚠️ Lembre-se de atualizar o BACKEND_PROXY_TARGET via painel do Google ou comando gcloud."
