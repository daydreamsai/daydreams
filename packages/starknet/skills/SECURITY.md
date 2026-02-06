# Skill Security Model

## Versioning

All skills MUST be versioned using semantic versioning (v1.2.3).

### Usage

```bash
# Install specific version
curl -sSL https://raw.githubusercontent.com/welttowelt/daydreams/main/packages/starknet/skills/onboard/releases/v1.0.0/install.sh | bash

# Always specify version - NEVER use @latest in production
```

## Signature Verification

Each release is signed with GPG.

### Verify Before Execute

```bash
# Download release
curl -O https://.../ huginn-onboard-v1.0.0.tar.gz
curl -O https://.../huginn-onboard-v1.0.0.tar.gz.asc

# Import public key
gpg --recv-keys WELTTOWELT_KEY_ID

# Verify signature
gpg --verify huginn-onboard-v1.0.0.tar.gz.asc huginn-onboard-v1.0.0.tar.gz

# If signature is valid, extract and run
tar -xzf huginn-onboard-v1.0.0.tar.gz
./huginn-onboard-v1.0.0/install.sh
```

## Checksum Verification

Each release includes a `manifest.json` with SHA256 checksums.

```bash
shasum -a 256 -c manifest.json
```

## Security Best Practices

1. **Pin versions** - Never use `@latest` or unversioned URLs
2. **Verify signatures** - Always check GPG signatures before execution
3. **Audit code** - Review SKILL.md and scripts before running
4. **Use sandboxes** - Test in isolated environments first
5. **Report vulnerabilities** - Contact <security@welttowelt.com>

## Supply Chain Security

- All commits are signed
- Releases require 2+ maintainer approval
- CI/CD includes automated security scans
- Dependencies are pinned and verified
