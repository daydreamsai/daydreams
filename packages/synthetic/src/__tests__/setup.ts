// Test setup file for global configuration

// Suppress console.log during tests unless explicitly needed
const originalConsoleLog = console.log;
console.log = (...args: any[]) => {
  if (process.env.VERBOSE_TESTS) {
    originalConsoleLog(...args);
  }
};

export {};
