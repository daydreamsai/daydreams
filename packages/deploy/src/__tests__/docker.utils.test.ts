import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("fs/promises", () => {
  const readdir = vi.fn();
  const readFile = vi.fn();
  const writeFile = vi.fn();
  // Provide both named and default to satisfy different import styles
  const api = { readdir, readFile, writeFile } as any;
  return { default: api, ...api };
});

import * as fs from "fs/promises";
import path from "path";
import {
  generateDockerfile,
  detectPackageManager,
  writeDockerfile,
  createDockerignore,
} from "../utils/docker";

describe("docker utils", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("generates a Dockerfile for npm by default", async () => {
    const content = await generateDockerfile({
      baseImage: "node:20-slim",
      workDir: "/app",
      port: 8080,
      entryFile: "server.js",
      packageManager: "npm",
    });
    expect(content).toContain("FROM node:20-slim AS builder");
    expect(content).toContain("WORKDIR /app");
    expect(content).toContain("EXPOSE 8080");
    expect(content).toContain("CMD [\"node\", \"server.js\"]");
    expect(content).toContain("COPY package-lock.json ./ 2>/dev/null || true");
    expect(content).toContain("RUN npm ci --production");
  });

  it("generates a Dockerfile for pnpm", async () => {
    const content = await generateDockerfile({
      baseImage: "node:20-slim",
      workDir: "/app",
      port: 3000,
      entryFile: "index.js",
      packageManager: "pnpm",
    });
    expect(content).toContain("COPY pnpm-lock.yaml ./ 2>/dev/null || true");
    expect(content).toContain("RUN pnpm install --frozen-lockfile --prod");
  });

  it("generates a Dockerfile for yarn", async () => {
    const content = await generateDockerfile({
      baseImage: "node:20-slim",
      workDir: "/app",
      port: 3000,
      entryFile: "index.js",
      packageManager: "yarn",
    });
    expect(content).toContain("COPY yarn.lock ./ 2>/dev/null || true");
    expect(content).toContain("RUN yarn install --frozen-lockfile --production");
  });

  it("generates a Dockerfile for bun", async () => {
    const content = await generateDockerfile({
      baseImage: "oven/bun:latest",
      workDir: "/app",
      port: 3000,
      entryFile: "index.ts",
      packageManager: "bun",
    });
    expect(content).not.toContain("COPY bun.lockb");
    expect(content).toContain("RUN bun install");
    expect(content).toContain("CMD [\"bun\", \"index.ts\"]");
  });

  it("includes custom health URL when provided", async () => {
    const content = await generateDockerfile({
      baseImage: "node:20-slim",
      workDir: "/app",
      port: 8080,
      entryFile: "server.js",
      packageManager: "npm",
      healthCheckUrl: "http://localhost:8080/status",
    });
    expect(content).toContain("HEALTHCHECK");
    expect(content).toContain("http://localhost:8080/status");
  });

  it("omits healthcheck when disabled", async () => {
    const content = await generateDockerfile({
      baseImage: "node:20-slim",
      workDir: "/app",
      port: 8080,
      entryFile: "server.js",
      packageManager: "npm",
      disableHealthcheck: true,
    });
    expect(content).not.toContain("HEALTHCHECK");
  });

  it("detects package manager by lock files", async () => {
    (fs.readdir as any).mockResolvedValue(["pnpm-lock.yaml", "package.json"]);
    const mgr = await detectPackageManager("/project");
    expect(mgr).toBe("pnpm");
  });

  it("falls back to package.json packageManager field", async () => {
    (fs.readdir as any).mockResolvedValue(["package.json"]);
    (fs.readFile as any).mockResolvedValue(
      JSON.stringify({ packageManager: "yarn@4.0.0" })
    );
    const mgr = await detectPackageManager("/project");
    expect(mgr).toBe("yarn");
  });

  it("writes Dockerfile.daydreams to project root", async () => {
    const content = "# dockerfile";
    await writeDockerfile("/repo", content);
    expect(fs.writeFile).toHaveBeenCalledWith(
      path.join("/repo", "Dockerfile.daydreams"),
      content
    );
  });

  it("creates .dockerignore with defaults", async () => {
    await createDockerignore("/repo");
    const [filePath, data] = (fs.writeFile as any).mock.calls[0];
    expect(filePath).toBe(path.join("/repo", ".dockerignore"));
    expect(String(data)).toContain("node_modules");
    expect(String(data)).toContain(".env");
  });
});
