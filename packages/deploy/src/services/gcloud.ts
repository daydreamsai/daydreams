import { ServicesClient } from "@google-cloud/run";
import { CloudBuildClient } from "@google-cloud/cloudbuild";
import { DNS } from "@google-cloud/dns";
import { Storage } from "@google-cloud/storage";
import type { DeployConfig, AgentDeployment } from "../types.js";
import chalk from "chalk";

export class GCloudService {
  private run: ServicesClient;
  private build: CloudBuildClient;
  private dns: DNS;
  private storage: Storage;

  constructor(projectId: string) {
    this.run = new ServicesClient({
      projectId,
    });
    this.build = new CloudBuildClient({
      projectId,
    });
    this.dns = new DNS({
      projectId,
    });
    this.storage = new Storage({
      projectId,
    });
  }

  async deployToCloudRun(
    config: DeployConfig,
    imageUrl: string
  ): Promise<AgentDeployment> {
    const serviceName = `agent-${config.name}`;
    const customDomain = `${config.name}.${config.domain}`;
    const parent = `projects/${config.project}/locations/${config.region}`;
    const servicePath = `${parent}/services/${serviceName}`;

    // Prepare environment variables; ensure PORT reflects config.port
    const baseEnv = await this.loadEnvVars(config.env);
    const envMap = new Map<string, string>(baseEnv.map((e) => [e.name, e.value]));
    if (!envMap.has("NODE_ENV")) envMap.set("NODE_ENV", "production");
    envMap.set("PORT", String(parseInt(config.port)));
    const finalEnv = Array.from(envMap.entries()).map(([name, value]) => ({ name, value }));

    // Add inline env vars
    if (config.vars) {
      for (const v of config.vars) envMap.set(v.name, v.value);
    }
    // Build env list, including secret refs
    const secretEnv = (config.secrets || []).map((s) => ({
      name: s.name,
      valueSource: { secretKeyRef: { secret: s.secret, version: s.version || "latest" } },
    }));
    const finalEnv = [
      ...Array.from(envMap.entries()).map(([name, value]) => ({ name, value })),
      ...secretEnv,
    ];

    // Build the service configuration for Cloud Run v2 API
    const serviceConfig: any = {
      name: servicePath,
      template: {
        containerConcurrency: typeof config.concurrency === "number" ? config.concurrency : undefined,
        scaling: {
          maxInstanceCount: parseInt(config.maxInstances),
          minInstanceCount: parseInt(config.minInstances),
        },
        timeout: {
          seconds: parseInt(config.timeout),
        },
        containers: [
          {
            image: imageUrl,
            ports: [
              {
                containerPort: parseInt(config.port),
              },
            ],
            resources: {
              limits: {
                memory: config.memory,
                cpu: config.cpu || "1",
              },
            },
            env: finalEnv,
          },
        ],
        annotations: config.cpuBoost ? { "run.googleapis.com/cpu-throttling": "false" } : undefined,
      },
      ingress: "INGRESS_TRAFFIC_ALL",
    };

    try {
      // Try to update existing service first
      const [operation] = await this.run.updateService({
        service: serviceConfig,
        allowMissing: true, // Create if doesn't exist
      });

      // Wait for deployment to complete
      await this.waitForOperation(operation);
    } catch (error) {
      // If update fails, try creating a new service
      const [operation] = await this.run.createService({
        parent,
        serviceId: serviceName,
        service: serviceConfig,
      });

      await this.waitForOperation(operation);
    }

    // Get service details
    const [service] = await this.run.getService({
      name: servicePath,
    });

    const url = service.uri || "";

    // Make service publicly accessible (no auth required)
    if (!config.dryRun) {
      await this.makeServicePublic(serviceName, config.region, config.project);
    }

    // Set up custom domain mapping (only if provided)
    if (!config.dryRun && config.domain) {
      await this.setupDomainMapping(
        serviceName,
        config.name,
        config.domain,
        config.region,
        config.project
      );
    }

    return {
      name: config.name,
      url,
      customDomain: config.domain ? customDomain : undefined,
      service: serviceName,
      region: config.region,
      project: config.project,
      image: imageUrl,
      status: "READY",
      createdAt: service.createTime ? new Date(service.createTime as any) : new Date(),
      updatedAt: service.updateTime ? new Date(service.updateTime as any) : new Date(),
      config: {
        memory: config.memory,
        maxInstances: parseInt(config.maxInstances),
        minInstances: parseInt(config.minInstances),
        port: parseInt(config.port),
        timeout: parseInt(config.timeout),
      },
    };
  }

  async buildContainer(
    projectPath: string,
    agentName: string,
    projectId: string,
    region: string,
    registry?: string
  ): Promise<string> {
    // Prefer provided registry or default to Artifact Registry
    // Default repo: <region>-docker.pkg.dev/<projectId>/daydreams/agent-<name>
    const repoBase = registry || `${region}-docker.pkg.dev/${projectId}/daydreams/agent-${agentName}`;
    const imageName = repoBase;
    const tag = `${Date.now()}`;
    const imageUrl = `${imageName}:${tag}`;

    // Create build configuration
    const buildConfig = {
      source: {
        storageSource: {
          bucket: `${projectId}-daydreams-builds`,
          object: `${agentName}-${tag}.tar.gz`,
        },
      },
      steps: [
        {
          name: "gcr.io/cloud-builders/docker",
          args: ["build", "-t", imageUrl, "-f", "Dockerfile.daydreams", "."],
        },
        {
          name: "gcr.io/cloud-builders/docker",
          args: ["push", imageUrl],
        },
      ],
      images: [imageUrl],
      options: {
        logging: "CLOUD_LOGGING_ONLY" as const,
      },
    };

    // Ensure Artifact Registry repository exists if using default
    if (!registry) {
      await this.ensureArtifactRegistry(projectId, region).catch(() => {});
    }

    // Upload source code to GCS
    await this.uploadSourceToGCS(projectPath, projectId, agentName, tag);

    // Start build
    const [operation] = await this.build.createBuild({
      projectId,
      build: buildConfig,
    });

    // Wait for build to complete
    await this.waitForBuildOperation(operation);

    return imageUrl;
  }

  private async ensureArtifactRegistry(projectId: string, region: string) {
    try {
      const { exec } = await import("child_process");
      const { promisify } = await import("util");
      const execAsync = promisify(exec);
      // Create repo 'daydreams' if it does not exist
      const cmd = `gcloud artifacts repositories create daydreams --repository-format=docker --location=${region} --project=${projectId}`;
      await execAsync(cmd);
      console.log(chalk.gray(`✓ Artifact Registry repo ensured`));
    } catch (error) {
      const msg = String((error as any)?.stderr || (error as any)?.stdout || "");
      if (msg.toLowerCase().includes("already exists") || msg.includes("409")) {
        // Already exists; ok
        return;
      }
      // Ignore other errors here; Cloud Build/push will surface issues
    }
  }

  private async uploadSourceToGCS(
    projectPath: string,
    projectId: string,
    agentName: string,
    tag: string
  ): Promise<void> {
    const bucketName = `${projectId}-daydreams-builds`;
    const fileName = `${agentName}-${tag}.tar.gz`;

    // Ensure bucket exists
    const bucket = this.storage.bucket(bucketName);
    const [exists] = await bucket.exists();
    if (!exists) {
      await this.storage.createBucket(bucketName, {
        location: "US",
        storageClass: "STANDARD",
      });
    }

    // Create tar archive and upload (exclude common ignored paths + .dockerignore)
    const tar = await import("tar");
    const fs = await import("fs/promises");
    const path = await import("path");
    let ignores: string[] = [];
    try {
      const dockerignorePath = path.join(projectPath, ".dockerignore");
      const content = await fs.readFile(dockerignorePath, "utf-8");
      ignores = content
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith("#"));
    } catch {}
    const ignoreDirs = [
      "node_modules/",
      ".git/",
      "dist/",
      "build/",
      "coverage/",
      ".vscode/",
      ".idea/",
    ];
    const ignoreFiles = [/\.log$/i, /^Dockerfile/i, /^\.dockerignore$/i, /^\.DS_Store$/];
    const stream = tar.create(
      {
        gzip: true,
        cwd: projectPath,
        filter: (p: string) => {
          const pathLower = p.toLowerCase();
          if (ignoreDirs.some((d) => pathLower.includes(d))) return false;
          const base = p.split("/").pop() || p;
          if (ignoreFiles.some((re) => re.test(base))) return false;
          // crude .dockerignore matching: treat entries as prefixes or basename matches
          for (const rule of ignores) {
            if (rule.endsWith("/")) {
              if (p.startsWith(rule) || p.includes(`/${rule}`)) return false;
            } else {
              if (p === rule || base === rule) return false;
            }
          }
          return true;
        },
      },
      ["."]
    );

    const file = bucket.file(fileName);
    await new Promise((resolve, reject) => {
      stream
        .pipe(file.createWriteStream())
        .on("error", reject)
        .on("finish", resolve);
    });
  }

  private async makeServicePublic(
    serviceName: string,
    region: string,
    projectId: string
  ): Promise<void> {
    try {
      const resource = `projects/${projectId}/locations/${region}/services/${serviceName}`;
      // Fetch existing policy, merge binding, and set with etag
      const [existing] = await this.run.getIamPolicy({ resource });
      const bindings = existing.bindings || [];
      const invoker = bindings.find((b: any) => b.role === "roles/run.invoker");
      if (invoker) {
        const members = new Set(invoker.members || []);
        members.add("allUsers");
        invoker.members = Array.from(members);
      } else {
        bindings.push({ role: "roles/run.invoker", members: ["allUsers"] });
      }
      await this.run.setIamPolicy({
        resource,
        policy: { ...existing, bindings },
      });

      console.log(chalk.green(`✓ Service made publicly accessible`));
    } catch (error) {
      console.log(chalk.yellow(`⚠ Could not make service public automatically`));
      console.log(chalk.gray(`  Run this command to make it public:`));
      console.log(
        chalk.gray(
          `  gcloud run services add-iam-policy-binding ${serviceName} --region=${region} --member="allUsers" --role="roles/run.invoker"`
        )
      );
    }
  }

  private async setupDomainMapping(
    serviceName: string,
    agentName: string,
    domain: string,
    region: string,
    projectId: string
  ): Promise<void> {
    try {
      // Try to create domain mapping via gcloud command
      const { exec } = await import("child_process");
      const { promisify } = await import("util");
      const execAsync = promisify(exec);

      const command = `gcloud run domain-mappings create --service=${serviceName} --domain=${agentName}.${domain} --region=${region} --project=${projectId}`;
      
      console.log(chalk.gray(`Creating domain mapping...`));
      await execAsync(command);
      console.log(chalk.green(`✓ Domain mapping created: ${agentName}.${domain}`));
    } catch (error) {
      const err = error as any;
      const msg = String(err?.stderr || err?.stdout || err?.message || "").toLowerCase();
      if (msg.includes("already exists") || msg.includes("already-exists") || msg.includes("409")) {
        console.log(chalk.gray(`✓ Domain mapping already exists: ${agentName}.${domain}`));
        return;
      }
      // Fallback to manual instructions
      console.log(chalk.yellow(`\n⚠ Domain mapping needs manual setup:`));
      console.log(chalk.gray(`  Run this command to complete setup:`));
      console.log(
        chalk.gray(
          `  gcloud run domain-mappings create --service=${serviceName} --domain=${agentName}.${domain} --region=${region}`
        )
      );
    }
  }

  private async loadEnvVars(
    envFile?: string
  ): Promise<Array<{ name: string; value: string }>> {
    const envVars: Array<{ name: string; value: string }> = [];

    if (envFile) {
      const { config } = await import("dotenv");
      const result = config({ path: envFile });

      if (result.parsed) {
        for (const [name, value] of Object.entries(result.parsed)) {
          envVars.push({ name, value });
        }
      }
    }

    // Add default environment variables (PORT is set later based on config)
    envVars.push({ name: "NODE_ENV", value: "production" });

    return envVars;
  }

  private async waitForOperation(operation: any): Promise<void> {
    // Wait for long-running operation to complete
    if (operation && operation.promise) {
      await operation.promise();
    } else {
      // Fallback delay if operation doesn't have promise
      return new Promise((resolve) => {
        setTimeout(resolve, 5000);
      });
    }
  }

  private async waitForBuildOperation(operation: any): Promise<void> {
    // Wait for Cloud Build operation
    if (operation && operation.promise) {
      await operation.promise();
    } else {
      return new Promise((resolve) => {
        setTimeout(resolve, 10000);
      });
    }
  }

  async listDeployments(
    projectId: string,
    region: string
  ): Promise<AgentDeployment[]> {
    const parent = `projects/${projectId}/locations/${region}`;
    const deployments: AgentDeployment[] = [];

    // Use async iterator for pagination
    const servicesIterable = this.run.listServicesAsync({
      parent,
    });

    for await (const service of servicesIterable) {
      const serviceName = service.name?.split("/").pop() || "";
      if (serviceName.startsWith("agent-")) {
        const name = serviceName.replace("agent-", "");
        const container = service.template?.containers?.[0];

        deployments.push({
          name,
          url: service.uri || "",
          // customDomain depends on deployment config; omit here
          service: serviceName,
          region,
          project: projectId,
          image: container?.image || "",
          status: service.reconciling ? "DEPLOYING" : "READY",
          createdAt: service.createTime ? new Date(service.createTime as any) : new Date(),
          updatedAt: service.updateTime ? new Date(service.updateTime as any) : new Date(),
          config: {
            memory: container?.resources?.limits?.memory || "256Mi",
            maxInstances: service.template?.scaling?.maxInstanceCount || 100,
            minInstances: service.template?.scaling?.minInstanceCount || 0,
            port: container?.ports?.[0]?.containerPort || 8080,
            timeout: typeof service.template?.timeout?.seconds === 'number' 
              ? service.template.timeout.seconds 
              : 60,
          },
        });
      }
    }

    return deployments;
  }

  async deleteDeployment(
    name: string,
    projectId: string,
    region: string,
    domain?: string
  ): Promise<void> {
    const serviceName = `agent-${name}`;
    const servicePath = `projects/${projectId}/locations/${region}/services/${serviceName}`;

    const [operation] = await this.run.deleteService({
      name: servicePath,
    });

    await this.waitForOperation(operation);

    // Attempt to delete domain mapping if provided
    if (domain) {
      try {
        const { exec } = await import("child_process");
        const { promisify } = await import("util");
        const execAsync = promisify(exec);
        const cmd = `gcloud run domain-mappings delete --domain=${name}.${domain} --region=${region} --project=${projectId} --quiet`;
        await execAsync(cmd);
        console.log(chalk.gray(`✓ Domain mapping removed: ${name}.${domain}`));
      } catch (error) {
        const msg = String((error as any)?.stderr || (error as any)?.stdout || (error as any)?.message || "").toLowerCase();
        if (msg.includes("not found") || msg.includes("404")) {
          console.log(chalk.gray(`Domain mapping not found: ${name}.${domain}`));
        } else {
          console.log(chalk.yellow(`Could not remove domain mapping automatically for ${name}.${domain}`));
          console.log(chalk.gray(`  Try: gcloud run domain-mappings delete --domain=${name}.${domain} --region=${region} --project=${projectId}`));
        }
      }
    }
  }
}
