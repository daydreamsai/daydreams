import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Hoisted mocks to avoid initialization order issues
const gcloudMocks = vi.hoisted(() => ({
  buildContainer: vi.fn(),
  deployToCloudRun: vi.fn(),
  deleteDeployment: vi.fn(),
  listDeployments: vi.fn(),
}));

const dockerMocks = vi.hoisted(() => ({
  writeDockerfile: vi.fn(),
  createDockerignore: vi.fn(),
  detectPackageManager: vi.fn().mockResolvedValue("npm"),
  generateDockerfile: vi.fn().mockResolvedValue("# dockerfile"),
}));

// Mocks
vi.mock("ora", () => ({
  default: () => ({ start: vi.fn(), stop: vi.fn(), succeed: vi.fn(), fail: vi.fn() }),
}));

vi.mock("prompts", () => ({
  default: vi.fn().mockResolvedValue({ name: "", project: "" }),
}));

vi.mock("fs/promises", () => ({
  default: { access: vi.fn().mockResolvedValue(undefined), unlink: vi.fn().mockResolvedValue(undefined) },
  access: vi.fn().mockResolvedValue(undefined),
  unlink: vi.fn().mockResolvedValue(undefined),
}));

// child_process used by logsCommand
vi.mock("child_process", () => ({
  exec: (cmd: string, cb: (err: any, stdout: string, stderr: string) => void) => {
    cb(null, "log line", "");
    return {} as any;
  },
  spawn: vi.fn(),
}));

// Mock Google Cloud service and docker utils
vi.mock("../services/gcloud", () => ({
  GCloudService: class {
    constructor(_projectId: string) {}
    buildContainer = gcloudMocks.buildContainer;
    deployToCloudRun = gcloudMocks.deployToCloudRun;
    deleteDeployment = gcloudMocks.deleteDeployment;
    listDeployments = gcloudMocks.listDeployments;
  },
}));

vi.mock("../utils/docker", () => ({
  writeDockerfile: dockerMocks.writeDockerfile,
  createDockerignore: dockerMocks.createDockerignore,
  detectPackageManager: dockerMocks.detectPackageManager,
  generateDockerfile: dockerMocks.generateDockerfile,
}));

import { deployCommand } from "../commands/deploy";
import { listCommand } from "../commands/list";
import { deleteCommand } from "../commands/delete";
import { logsCommand } from "../commands/logs";

describe("CLI commands", () => {
  beforeEach(() => {
    vi.stubEnv("DEBUG", "");
    gcloudMocks.buildContainer.mockReset();
    gcloudMocks.deployToCloudRun.mockReset();
    gcloudMocks.deleteDeployment.mockReset();
    gcloudMocks.listDeployments.mockReset();
    dockerMocks.writeDockerfile.mockReset();
    dockerMocks.createDockerignore.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("deployCommand honors dryRun and avoids side effects", async () => {
    await deployCommand({
      name: "alpha",
      project: "proj",
      dryRun: true,
      file: "server.ts",
    });

    expect(dockerMocks.detectPackageManager).not.toHaveBeenCalled();
    expect(dockerMocks.writeDockerfile).not.toHaveBeenCalled();
    expect(gcloudMocks.buildContainer).not.toHaveBeenCalled();
    expect(gcloudMocks.deployToCloudRun).not.toHaveBeenCalled();
  });

  it("deployCommand writes docker config and skips build with noBuild", async () => {
    await deployCommand({
      name: "alpha",
      project: "proj",
      region: "us-central1",
      noBuild: true,
      file: "server.ts",
    });

    expect(dockerMocks.detectPackageManager).toHaveBeenCalled();
    expect(dockerMocks.generateDockerfile).toHaveBeenCalled();
    expect(dockerMocks.writeDockerfile).toHaveBeenCalled();
    expect(dockerMocks.createDockerignore).toHaveBeenCalled();
    expect(gcloudMocks.buildContainer).not.toHaveBeenCalled();
    expect(gcloudMocks.deployToCloudRun).not.toHaveBeenCalled();
  });

  it("listCommand prints deployments", async () => {
    gcloudMocks.listDeployments.mockResolvedValueOnce([
      {
        name: "alpha",
        url: "https://alpha.run/app",
        customDomain: "alpha.agent.daydreams.systems",
        service: "agent-alpha",
        region: "us-central1",
        project: "proj",
        image: "img",
        status: "READY",
        createdAt: new Date(),
        updatedAt: new Date(),
        config: { memory: "256Mi", maxInstances: 10, minInstances: 0, port: 8080, timeout: 60 },
      },
    ]);

    await listCommand({ project: "proj", region: "us-central1" });
    expect(gcloudMocks.listDeployments).toHaveBeenCalledWith("proj", "us-central1");
  });

  it("deleteCommand deletes without prompt when --yes", async () => {
    await deleteCommand("alpha", { project: "proj", region: "us-central1", yes: true });
    expect(gcloudMocks.deleteDeployment).toHaveBeenCalledWith("alpha", "proj", "us-central1");
  });

  it("logsCommand prints one-time logs via gcloud", async () => {
    await logsCommand("alpha", { project: "proj", region: "us-central1", lines: 5 });
    // If no throw, the mocked exec succeeded and printed logs
    expect(true).toBe(true);
  });
});
