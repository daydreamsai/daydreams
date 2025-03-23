#!/usr/bin/env bash

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Parse command line arguments
VERSION_TYPE="patch"
DRY_RUN=false

print_usage() {
  echo -e "${BLUE}Usage:${NC} $0 [OPTIONS]"
  echo -e "Options:"
  echo -e "  --major         Bump major version (x.0.0)"
  echo -e "  --minor         Bump minor version (0.x.0)"
  echo -e "  --patch         Bump patch version (0.0.x) [default]"
  echo -e "  --dry-run       Run without making any changes"
  echo -e "  --help          Show this help message"
  exit 1
}

for arg in "$@"; do
  case $arg in
    --major)
      VERSION_TYPE="major"
      shift
      ;;
    --minor)
      VERSION_TYPE="minor"
      shift
      ;;
    --patch)
      VERSION_TYPE="patch"
      shift
      ;;
    --pre-release)
      VERSION_TYPE="pre-release"
      shift
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --help)
      print_usage
      ;;
    *)
      # Unknown option
      echo -e "${RED}Unknown option: $arg${NC}"
      print_usage
      ;;
  esac
done

# Check if git working directory is clean
if [[ -n $(git status --porcelain) ]]; then
  echo -e "${RED}Error: Git working directory is not clean.${NC}"
  echo -e "${YELLOW}Please commit or stash your changes before releasing.${NC}"
  exit 1
fi

echo -e "${BLUE}Starting release process...${NC}"

# Build all packages
echo -e "${BLUE}Building all packages...${NC}"
./scripts/build.sh

# Run tests if they exist
echo -e "${BLUE}Running tests...${NC}"
if pnpm run test; then
  echo -e "${GREEN}Tests passed!${NC}"
else
  echo -e "${RED}Tests failed! Aborting release.${NC}"
  exit 1
fi

# Determine publish command based on dry run flag
PUBLISH_CMD="npx lerna publish $VERSION_TYPE --no-private --force-publish"
if [ "$DRY_RUN" = true ]; then
  PUBLISH_CMD="$PUBLISH_CMD --no-push --no-git-tag-version"
  echo -e "${YELLOW}DRY RUN: No changes will be pushed to git or npm${NC}"
fi

# Run lerna publish
echo -e "${BLUE}Publishing packages with lerna...${NC}"
echo -e "${YELLOW}Running: $PUBLISH_CMD${NC}"

if [ "$DRY_RUN" = true ]; then
  eval "$PUBLISH_CMD --yes"
else
  eval "$PUBLISH_CMD"
fi

echo -e "${GREEN}Release process completed!${NC}" 