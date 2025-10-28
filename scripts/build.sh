#!/usr/bin/env bash

# Exit on error
set -e

# Parse command line arguments
WATCH_MODE=false

for arg in "$@"; do
  case $arg in
    --watch)
      WATCH_MODE=true
      shift
      ;;
    *)
      # Unknown option
      ;;
  esac
done

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Building packages...${NC}"

# Build core package first
echo -e "${GREEN}Building core package first...${NC}"
if [ "$WATCH_MODE" = true ]; then
  # Run build in watch mode
  (cd "packages/daydreams/core" && bun run build --watch) &
else
  # Run build normally
  (cd "packages/daydreams/core" && bun run build)
fi

# Get all package directories except core
PACKAGES=$(find packages/daydreams -maxdepth 1 -mindepth 1 -type d -not -name "core" | sort)

# Build each remaining package
for package in $PACKAGES; do
  package_name=$(basename "$package")
  
  # Check if package.json exists in this directory
  if [ ! -f "$package/package.json" ]; then
    echo -e "${BLUE}Skipping $package_name (no package.json found)...${NC}"
    continue
  fi
  
  echo -e "${GREEN}Building $package_name...${NC}"
  
  if [ "$WATCH_MODE" = true ]; then
    # Run build in watch mode
    (cd "$package" && bun run build --watch) &
  else
    # Run build normally
    (cd "$package" && bun run build)
  fi
done

# If in watch mode, wait for all background processes
if [ "$WATCH_MODE" = true ]; then
  echo -e "${BLUE}Watching for changes in all packages...${NC}"
  echo -e "${BLUE}Press Ctrl+C to stop watching${NC}"
  wait
else
  echo -e "${GREEN}All packages built successfully!${NC}"
fi
