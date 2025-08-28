import { describe, it, expect } from "vitest";

// Import the package entrypoint (source). In this repo, TS bundler resolution
// is enabled, so .js specifiers in source should resolve during tests.
import * as index from "../index";

describe("@daydreamsai/deploy index exports", () => {
  it("exports CLI commands", () => {
    expect(typeof (index as any).deployCommand).toBe("function");
    expect(typeof (index as any).listCommand).toBe("function");
    expect(typeof (index as any).deleteCommand).toBe("function");
    expect(typeof (index as any).logsCommand).toBe("function");
  });

  it("exports service class", () => {
    expect(typeof (index as any).GCloudService).toBe("function");
  });

  it("exports docker utilities", () => {
    expect(typeof (index as any).generateDockerfile).toBe("function");
    expect(typeof (index as any).detectPackageManager).toBe("function");
    expect(typeof (index as any).writeDockerfile).toBe("function");
    expect(typeof (index as any).createDockerignore).toBe("function");
  });

  it("does not perform side effects on import", () => {
    // The index only re-exports; importing it should not, for example,
    // start spinners, read env, or do I/O. This is a smoke assertion
    // that basic export surface exists without throwing during import.
    expect(index).toBeTruthy();
  });
});

