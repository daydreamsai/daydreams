#!/bin/bash
# Skill Release Script with Versioning & Signing
# Usage: ./release.sh v1.0.0

set -euo pipefail

VERSION=$1
SKILL_PATH="packages/starknet/skills/onboard"

if [[ ! $VERSION =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Error: Version must be in format v1.2.3"
  exit 1
fi

echo "📦 Releasing Huginn Onboarding Skill $VERSION"

# 1. Create versioned directory
VERSIONED_DIR="${SKILL_PATH}/releases/${VERSION}"
mkdir -p "$VERSIONED_DIR"

# 2. Copy files
cp "${SKILL_PATH}/SKILL.md" "${VERSIONED_DIR}/"
cp "${SKILL_PATH}/install.sh" "${VERSIONED_DIR}/"

# 3. Create manifest
cat > "${VERSIONED_DIR}/manifest.json" << EOF
{
  "name": "huginn-onboard",
  "version": "${VERSION}",
  "author": "welttowelt",
  "released": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "chain": "starknet",
  "files": [
    "SKILL.md",
    "install.sh"
  ],
  "checksums": {
    "SKILL.md": "$(shasum -a 256 ${SKILL_PATH}/SKILL.md | cut -d' ' -f1)",
    "install.sh": "$(shasum -a 256 ${SKILL_PATH}/install.sh | cut -d' ' -f1)"
  }
}
EOF

# 4. Sign release (using GPG or cosign)
if command -v gpg &> /dev/null; then
  echo "Signing with GPG..."
  tar -czf "${VERSIONED_DIR}.tar.gz" -C "$(dirname $VERSIONED_DIR)" "$(basename $VERSIONED_DIR)"
  gpg --detach-sign --armor "${VERSIONED_DIR}.tar.gz"
  echo "✅ Signature created: ${VERSIONED_DIR}.tar.gz.asc"
else
  echo "⚠️  GPG not found. Skipping signature."
fi

# 5. Create latest symlink
ln -sf "$VERSION" "${SKILL_PATH}/releases/latest"

echo "✅ Released $VERSION"
echo "Verify: curl https://raw.githubusercontent.com/welttowelt/daydreams/main/${VERSIONED_DIR}/SKILL.md"
