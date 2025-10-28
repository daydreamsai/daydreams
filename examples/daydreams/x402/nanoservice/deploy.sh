#!/bin/bash

# AI Assistant Nanoservice Deployment Script
# Deploys the x402 payment-enabled AI assistant to Google Cloud Run

set -e

# Configuration
SERVICE_NAME="ai-assistant"
PROJECT_ID="${GCP_PROJECT_ID:-daydreams-labs-staging}"
REGION="${GCP_REGION:-us-central1}"
ENV_FILE=".env.production"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Deploying AI Assistant Nanoservice${NC}"
echo "Service: $SERVICE_NAME"
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo ""

# Check for required environment variables
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}⚠️  Creating .env.production file${NC}"
    cat > $ENV_FILE << EOF
# x402 Payment Configuration
FACILITATOR_URL=https://facilitator.x402.rs
ADDRESS=${ADDRESS:-0xb308ed39d67D0d4BAe5BC2FAEF60c66BBb6AE429}
NETWORK=${NETWORK:-base-sepolia}

PRIVATE_KEY=${PRIVATE_KEY}
EOF
    echo -e "${YELLOW}Please edit .env.production with your API keys before deploying${NC}"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    bun install
fi

# # Check if daydreams-deploy is installed
# if ! command -v daydreams-deploy &> /dev/null; then
#     echo -e "${YELLOW}📦 Installing @daydreamsai/deploy CLI...${NC}"
#     cd ../../../packages/deploy
#     pnpm install
#     pnpm run build
#     pnpm link --global
#     cd -
# fi

# Prepare standalone package.json for deployment
echo -e "${YELLOW}📦 Preparing deployment package...${NC}"
node prepare-deploy.js

# Deploy the service
echo -e "${GREEN}🔨 Building and deploying to Cloud Run...${NC}"

bun run /Users/os/Documents/code/dojo/daydreams/packages/deploy/bin/daydreams-deploy deploy \
  --name "$SERVICE_NAME" \
  --project "$PROJECT_ID" \
  --region "$REGION" \
  --file "server.ts" \
  --env "$ENV_FILE" \
  --memory "512Mi" \
  --max-instances "10" \
  --min-instances "0" \
  --port "4021" \
  --timeout "30" \
  --domain "agent.daydreams.systems"

# Display success message
echo ""
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo ""
echo "Your AI Assistant service is now available at:"
echo -e "${GREEN}  https://${SERVICE_NAME}.agent.daydreams.systems${NC}"
echo ""
echo "API Endpoints:"
echo "  GET  / - Service info (free)"
echo "  GET  /health - Health check (free)"
echo "  POST /assistant - AI assistant (\$0.01 per request)"
echo ""
echo "Test your deployment:"
echo -e "${YELLOW}curl https://${SERVICE_NAME}.agent.daydreams.systems/health${NC}"
echo ""
echo "Make a paid request (requires x402 client):"
echo -e "${YELLOW}bun run client.ts --url https://${SERVICE_NAME}.agent.daydreams.systems${NC}"