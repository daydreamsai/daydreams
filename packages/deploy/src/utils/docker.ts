import type { DockerConfig } from "../types.js";
import fs from "fs/promises";
import path from "path";

export async function generateDockerfile(config: DockerConfig): Promise<string> {
  const { baseImage, workDir, port, entryFile, packageManager, healthCheckUrl, disableHealthcheck } = config;

  let installCommand = "npm ci --production";
  let lockFile = "package-lock.json";
  let runCommand = "node";

  switch (packageManager) {
    case "pnpm":
      installCommand = "pnpm install --frozen-lockfile --prod";
      lockFile = "pnpm-lock.yaml";
      break;
    case "bun":
      installCommand = "bun install";
      lockFile = "bun.lockb";
      runCommand = "bun";
      break;
    case "yarn":
      installCommand = "yarn install --frozen-lockfile --production";
      lockFile = "yarn.lock";
      break;
  }

  const dockerfile = `# Build stage
FROM ${baseImage} AS builder

WORKDIR ${workDir}

# Copy package files
COPY package.json ./
${(() => {
  if (packageManager === "bun") {
    // Bun doesn't always need a lock file
    return "";
  } else if (packageManager === "pnpm") {
    return "COPY pnpm-lock.yaml ./ 2>/dev/null || true";
  } else if (packageManager === "yarn") {
    return "COPY yarn.lock ./ 2>/dev/null || true";
  } else {
    return "COPY package-lock.json ./ 2>/dev/null || true";
  }
})()}

# Install dependencies
RUN ${installCommand}

# Copy source code
COPY . .

# Build if needed (TypeScript compilation)
RUN if [ -f "tsconfig.json" ]; then \
    ${packageManager === "bun" ? "bunx" : "npx"} tsc || true; \
  fi

# Production stage
FROM ${baseImage} AS production

WORKDIR ${workDir}

# Copy built application from builder
COPY --from=builder ${workDir} .

# Expose port
EXPOSE ${port}

# Set environment to production
ENV NODE_ENV=production

${(() => {
  if (disableHealthcheck) return "";
  const url = healthCheckUrl || `http://localhost:${port}/health`;
  return `# Health check\nHEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\\n+  CMD node -e \"require('http').get('${url}', (r) => process.exit(r.statusCode === 200 ? 0 : 1))\" || exit 1`;
})()}

# Run the application
CMD ["${runCommand}", "${entryFile}"]
`;

  return dockerfile;
}

export async function detectPackageManager(projectPath: string): Promise<DockerConfig["packageManager"]> {
  const files = await fs.readdir(projectPath);
  
  // Check for lock files first
  if (files.includes("bun.lockb")) return "bun";
  if (files.includes("pnpm-lock.yaml")) return "pnpm";
  if (files.includes("yarn.lock")) return "yarn";
  if (files.includes("package-lock.json")) return "npm";
  
  // If no lock file, check package.json for packageManager field or scripts
  try {
    const packageJsonPath = path.join(projectPath, "package.json");
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf-8"));
    
    // Check packageManager field
    if (packageJson.packageManager) {
      if (packageJson.packageManager.includes("bun")) return "bun";
      if (packageJson.packageManager.includes("pnpm")) return "pnpm";
      if (packageJson.packageManager.includes("yarn")) return "yarn";
      if (packageJson.packageManager.includes("npm")) return "npm";
    }
    
    // Check scripts for bun usage
    if (packageJson.scripts) {
      const scriptsStr = JSON.stringify(packageJson.scripts);
      if (scriptsStr.includes("bun run") || scriptsStr.includes("bun ")) return "bun";
    }
  } catch (error) {
    // Ignore if can't read package.json
  }
  
  return "npm";
}

export async function writeDockerfile(projectPath: string, content: string): Promise<void> {
  const dockerfilePath = path.join(projectPath, "Dockerfile.daydreams");
  await fs.writeFile(dockerfilePath, content);
}

export async function createDockerignore(projectPath: string): Promise<void> {
  const dockerignoreContent = `node_modules
.git
.gitignore
*.md
.env
.env.*
dist
build
coverage
.vscode
.idea
*.log
.DS_Store
Dockerfile*
.dockerignore
`;

  const dockerignorePath = path.join(projectPath, ".dockerignore");
  await fs.writeFile(dockerignorePath, dockerignoreContent);
}
