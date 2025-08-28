import { describe, it, expect, vi } from "vitest";

// Advanced mock for @google-cloud/run to capture inputs
const runCalls = vi.hoisted(() => ({
  updateServiceArg: null as any,
  setIamPolicyArg: null as any,
}));

vi.mock("@google-cloud/run", () => {
  class ServicesClientMock {
    listServicesAsync() {
      return (async function* () {
        yield {
          name: "projects/proj/locations/us-central1/services/agent-foo",
          uri: "https://foo.run",
          template: {
            containers: [
              { image: "img:tag", ports: [{ containerPort: 8080 }], resources: { limits: { memory: "512Mi" } } },
            ],
            scaling: { maxInstanceCount: 5, minInstanceCount: 1 },
            timeout: { seconds: 120 },
          },
          reconciling: false,
          createTime: new Date().toISOString(),
          updateTime: new Date().toISOString(),
        } as any;
      })();
    }
    deleteService() {
      return Promise.resolve([{ promise: () => Promise.resolve() }]);
    }
    getIamPolicy() {
      return Promise.resolve([{ bindings: [{ role: "roles/other", members: ["user:foo@example.com"] }], etag: "etag-1" }]);
    }
    setIamPolicy(arg: any) {
      runCalls.setIamPolicyArg = arg;
      return Promise.resolve();
    }
    updateService(arg: any) {
      runCalls.updateServiceArg = arg;
      return Promise.resolve([{ promise: () => Promise.resolve() }]);
    }
    createService(arg: any) {
      runCalls.updateServiceArg = arg; // treat similarly for tests
      return Promise.resolve([{ promise: () => Promise.resolve() }]);
    }
    getService() {
      return Promise.resolve([{ uri: "https://foo.run", createTime: new Date().toISOString(), updateTime: new Date().toISOString() }]);
    }
  }
  return { ServicesClient: ServicesClientMock };
});

// Other GCP libs not needed in these tests, but stub to avoid import errors
vi.mock("@google-cloud/cloudbuild", () => ({ CloudBuildClient: class { createBuild() { return Promise.resolve([{ promise: () => Promise.resolve() }]); } } }));
vi.mock("@google-cloud/dns", () => ({ DNS: class {} }));
// Capture tar filter during upload; pipe immediately finishes
const tarOptions = vi.hoisted(() => ({ filter: null as any }));
vi.mock("tar", () => ({
  create: (opts: any) => {
    tarOptions.filter = opts?.filter;
    return {
      pipe: (dest: any) => {
        // simulate async finish
        setTimeout(() => dest.emit && dest.emit("finish"), 0);
        return dest;
      },
    } as any;
  },
}));

vi.mock("@google-cloud/storage", () => ({
  Storage: class {
    bucket() {
      return {
        exists: () => Promise.resolve([true]),
        file: () => ({ createWriteStream: () => ({ on: function (evt: string, cb: any) { if (evt === "finish") setTimeout(cb, 0); return this; } }) }),
      } as any;
    }
  },
}));

import { GCloudService } from "../services/gcloud";

describe("GCloudService basic mapping", () => {
  it("lists deployments and maps fields", async () => {
    const svc = new GCloudService("proj");
    const list = await svc.listDeployments("proj", "us-central1");
    expect(list).toHaveLength(1);
    const d = list[0];
    expect(d.name).toBe("foo");
    expect(d.url).toBe("https://foo.run");
    expect(d.region).toBe("us-central1");
    expect(d.project).toBe("proj");
    expect(d.status).toBe("READY");
    expect(d.config.memory).toBe("512Mi");
    expect(d.config.port).toBe(8080);
    expect(d.config.timeout).toBe(120);
    expect(d.customDomain).toBeUndefined();
  });

  it("deletes a deployment without throwing", async () => {
    const svc = new GCloudService("proj");
    await expect(svc.deleteDeployment("foo", "proj", "us-central1")).resolves.toBeUndefined();
  });
});

describe("GCloudService deploy configuration", () => {
  it("sets PORT, vars, secrets, cpu/concurrency, and merges IAM", async () => {
    const svc = new GCloudService("proj");
    const cfg: any = {
      name: "foo",
      file: "server.js",
      project: "proj",
      region: "us-central1",
      memory: "256Mi",
      maxInstances: "3",
      minInstances: "1",
      port: "9090",
      timeout: "60",
      noBuild: true,
      dryRun: false,
      vars: [{ name: "X", value: "1" }],
      secrets: [{ name: "Y", secret: "sec", version: "1" }],
      cpu: "2",
      concurrency: 80,
      cpuBoost: true,
    };
    await svc.deployToCloudRun(cfg, "img:tag");
    const arg = runCalls.updateServiceArg;
    expect(arg?.service?.template?.containers?.[0]?.env).toEqual(
      expect.arrayContaining([
        { name: "PORT", value: "9090" },
        { name: "X", value: "1" },
        { name: "Y", valueSource: { secretKeyRef: { secret: "sec", version: "1" } } },
      ])
    );
    expect(arg.service.template.containers[0].resources.limits.cpu).toBe("2");
    expect(arg.service.template.containerConcurrency).toBe(80);
    expect(arg.service.template.annotations["run.googleapis.com/cpu-throttling"]).toBe("false");

    // IAM merge should add allUsers to roles/run.invoker without dropping others
    expect(runCalls.setIamPolicyArg.policy.bindings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ role: "roles/other" }),
        expect.objectContaining({ role: "roles/run.invoker", members: expect.arrayContaining(["allUsers"]) }),
      ])
    );
  });

  it("skips domain mapping and customDomain when domain is omitted", async () => {
    const svc = new GCloudService("proj");
    const cfg: any = {
      name: "bar",
      file: "server.js",
      project: "proj",
      region: "us-central1",
      memory: "256Mi",
      maxInstances: "1",
      minInstances: "0",
      port: "8080",
      timeout: "60",
      dryRun: false,
      noBuild: true,
    };
    const res = await svc.deployToCloudRun(cfg, "img:tag");
    expect(res.customDomain).toBeUndefined();
  });
});

describe("uploadSourceToGCS ignore rules", () => {
  it("filters out ignored paths and dockerignore entries", async () => {
    const svc: any = new GCloudService("proj");
    // Create a fake .dockerignore content via mocking fs
    vi.doMock("fs/promises", () => ({
      readFile: vi.fn().mockResolvedValue("ignored.txt\nlogs/\n"),
    }));
    const path = await import("path");
    const fs = await import("fs/promises");
    // Call private method directly
    await svc["uploadSourceToGCS"]("/project", "proj", "foo", "123");
    // exercise filter on some paths
    const filter = (await import("tar")).default ? (tarOptions as any).filter : tarOptions.filter;
    expect(filter("node_modules/pkg/index.js")).toBe(false);
    expect(filter(".git/config")).toBe(false);
    expect(filter("dist/app.js")).toBe(false);
    expect(filter("logs/app.log")).toBe(false);
    expect(filter("ignored.txt")).toBe(false);
    expect(filter("src/index.ts")).toBe(true);
  });
});
