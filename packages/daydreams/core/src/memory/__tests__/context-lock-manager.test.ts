import { describe, it, expect } from "vitest";
import { ContextLockManager, contextLockManager } from "..";

describe("ContextLockManager", () => {
  it("sets isLocked during withLock and releases after", async () => {
    const mgr = new ContextLockManager();
    const ctx = "lock-1";
    expect(mgr.isLocked(ctx)).toBe(false);

    let inside = false;
    await mgr.withLock(ctx, async () => {
      inside = true;
      expect(mgr.isLocked(ctx)).toBe(true);
    });

    expect(inside).toBe(true);
    expect(mgr.isLocked(ctx)).toBe(false);
  });

  it("serializes concurrent operations for same context", async () => {
    const ctx = "lock-2";
    const order: string[] = [];

    const p1 = contextLockManager.withLock(ctx, async () => {
      await new Promise((r) => setTimeout(r, 20));
      order.push("first");
    });

    const p2 = contextLockManager.withLock(ctx, async () => {
      order.push("second");
    });

    await Promise.all([p1, p2]);
    expect(order).toEqual(["first", "second"]);
  });
});
