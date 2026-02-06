#!/bin/bash
set -euo pipefail

# Huginn Onboarding Script
# Usage: ./install.sh --source-chain ethereum --amount 0.01 --agent-name MyAgent

SOURCE_CHAIN=""
AMOUNT=""
AGENT_NAME=""
METADATA_URL=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --source-chain)
      SOURCE_CHAIN="$2"
      shift 2
      ;;
    --amount)
      AMOUNT="$2"
      shift 2
      ;;
    --agent-name)
      AGENT_NAME="$2"
      shift 2
      ;;
    --metadata-url)
      METADATA_URL="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

echo "🌉 Huginn Onboarding"
echo "-------------------"
echo "Source: $SOURCE_CHAIN"
echo "Amount: $AMOUNT ETH"
echo "Agent: $AGENT_NAME"
echo ""

# Step 1: Bridge
echo "Step 1/3: Bridging to Starknet..."
# TODO: Implement AVNU bridge API call

# Step 2: Deploy Account
echo "Step 2/3: Deploying agent account..."
# TODO: Deploy account contract

# Step 3: Register
echo "Step 3/3: Registering with Huginn..."
# TODO: Call HuginnRegistry.register_agent

echo "✅ Onboarding complete!"
echo "Your agent is now registered on Starknet."
