export interface DeployConfig {
  name: string;
  file: string;
  project: string;
  region: string;
  env?: string;
  vars?: Array<{ name: string; value: string }>;
  secrets?: Array<{ name: string; secret: string; version: string }>;
  memory: string;
  maxInstances: string;
  minInstances: string;
  port: string;
  timeout: string;
  domain?: string;
  registry?: string; // full registry/repo path or image base
  cpu?: string; // e.g., "1", "2"
  concurrency?: number; // containerConcurrency
  cpuBoost?: boolean; // hint to disable throttling (best-effort)
  noBuild?: boolean;
  dryRun?: boolean;
}

export interface AgentDeployment {
  name: string;
  url: string;
  customDomain?: string;
  service: string;
  region: string;
  project: string;
  image: string;
  status: "DEPLOYING" | "READY" | "FAILED";
  createdAt: Date;
  updatedAt: Date;
  config: {
    memory: string;
    maxInstances: number;
    minInstances: number;
    port: number;
    timeout: number;
  };
}

export interface BuildConfig {
  projectPath: string;
  agentName: string;
  entryFile: string;
  projectId: string;
  region: string;
  registry?: string;
}

export interface DockerConfig {
  baseImage: string;
  workDir: string;
  port: number;
  entryFile: string;
  packageManager: "npm" | "pnpm" | "bun" | "yarn";
  healthCheckUrl?: string;
  disableHealthcheck?: boolean;
}
