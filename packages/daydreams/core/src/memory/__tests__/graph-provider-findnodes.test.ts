import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { InMemoryGraphProvider } from "../providers/in-memory";

describe("InMemoryGraphProvider findNodes filters", () => {
  let provider: InMemoryGraphProvider;

  beforeAll(async () => {
    provider = new InMemoryGraphProvider();
    await provider.initialize();

    await provider.addNode({
      id: "n1",
      type: "person",
      properties: { role: "dev", team: "alpha" },
      labels: ["employee", "engineering"],
    });
    await provider.addNode({
      id: "n2",
      type: "person",
      properties: { role: "dev", team: "beta" },
      labels: ["employee"],
    });
    await provider.addNode({
      id: "n3",
      type: "tool",
      properties: { role: "ci", team: "platform" },
      labels: ["infra"],
    });
  });

  afterAll(async () => {
    await provider.close();
  });

  it("filters by type and labels intersection", async () => {
    const res = await provider.findNodes({
      type: "person",
      labels: ["employee"],
    });
    const ids = new Set(res.map((n) => n.id));
    expect(ids.has("n1")).toBe(true);
    expect(ids.has("n2")).toBe(true);
    expect(ids.has("n3")).toBe(false);
  });

  it("filters by properties equality", async () => {
    const res = await provider.findNodes({
      properties: { role: "dev", team: "alpha" },
    });
    expect(res.length).toBe(1);
    expect(res[0].id).toBe("n1");
  });
});
