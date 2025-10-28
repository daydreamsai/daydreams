import { beforeEach, vi, type Mock } from "vitest";

// Global test setup
beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks();

  // Reset any environment variables that might affect tests
  vi.unstubAllEnvs();

  // Reset console spies if they exist
  if (vi.isMockFunction(console.log)) {
    (console.log as Mock).mockClear();
  }
  if (vi.isMockFunction(console.error)) {
    (console.error as Mock).mockClear();
  }
  if (vi.isMockFunction(console.warn)) {
    (console.warn as Mock).mockClear();
  }
});

// Extend expect with custom matchers if needed
// expect.extend({ ... });
