/**
 * Context Lock Manager - Provides mutex-like locking for context operations
 * Prevents race conditions when multiple operations access the same context simultaneously
 */
export class ContextLockManager {
  private locks = new Map<string, Promise<void>>();
  private lockResolvers = new Map<string, () => void>();

  /**
   * Acquire an exclusive lock for a context
   * @param contextId - The context to lock
   * @returns Promise that resolves when lock is acquired
   */
  async acquireLock(contextId: string): Promise<() => void> {
    // Wait for existing lock to release
    const existingLock = this.locks.get(contextId);
    if (existingLock) {
      await existingLock;
    }

    // Create new lock
    let resolver: () => void;
    const lockPromise = new Promise<void>((resolve) => {
      resolver = resolve;
    });

    this.locks.set(contextId, lockPromise);
    this.lockResolvers.set(contextId, resolver!);

    // Return release function
    return () => {
      const resolver = this.lockResolvers.get(contextId);
      if (resolver) {
        resolver();
        this.locks.delete(contextId);
        this.lockResolvers.delete(contextId);
      }
    };
  }

  /**
   * Execute a function with exclusive context lock
   * @param contextId - Context to lock
   * @param fn - Function to execute while locked
   * @returns Result of the function
   */
  async withLock<T>(contextId: string, fn: () => Promise<T> | T): Promise<T> {
    const release = await this.acquireLock(contextId);
    try {
      return await fn();
    } finally {
      release();
    }
  }

  /**
   * Check if a context is currently locked
   * @param contextId - Context to check
   * @returns true if locked
   */
  isLocked(contextId: string): boolean {
    return this.locks.has(contextId);
  }

  /**
   * Get count of currently locked contexts
   * @returns Number of locked contexts
   */
  getLockedCount(): number {
    return this.locks.size;
  }

  /**
   * Clear all locks (should only be used for cleanup/testing)
   */
  clearAllLocks(): void {
    for (const resolver of this.lockResolvers.values()) {
      resolver();
    }
    this.locks.clear();
    this.lockResolvers.clear();
  }
}

/**
 * Global context lock manager instance
 */
export const contextLockManager = new ContextLockManager();