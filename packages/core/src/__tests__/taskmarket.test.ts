import { describe, expect, it } from "vitest";
import {
  computeRampedWorkerDreamsBonus,
  evaluateRequesterSettlementRisk,
  getWalletAgeDays,
  getWalletAgeRampMultiplier,
  reconcileTaskMarketBoard,
} from "../taskmarket";

describe("TaskMarket reconciliation and wallet-age ramp (#701)", () => {
  it("applies the exact anti-Sybil wallet-age ramp schedule", () => {
    expect(getWalletAgeRampMultiplier(0)).toBe(0);
    expect(getWalletAgeRampMultiplier(13.9)).toBe(0);
    expect(getWalletAgeRampMultiplier(14)).toBe(0.25);
    expect(getWalletAgeRampMultiplier(27.9)).toBe(0.25);
    expect(getWalletAgeRampMultiplier(28)).toBe(0.5);
    expect(getWalletAgeRampMultiplier(55.9)).toBe(0.5);
    expect(getWalletAgeRampMultiplier(56)).toBe(1);
    expect(getWalletAgeRampMultiplier(120)).toBe(1);
  });

  it("scales estimatedWorkerDreamsBonus by wallet age ramp and optional spot rate", () => {
    const task = {
      estimatedWorkerDreamsBonus: "104100000000000000000", // 104.1 DREAMS
      estimatedWorkerUsdBonusValue: "300000", // $0.30 (policy rate: 347 DREAMS/USDC)
    };

    const newWallet = computeRampedWorkerDreamsBonus(task, 5);
    expect(newWallet.walletRampMultiplier).toBe(0);
    expect(newWallet.effectiveDreamsBonus).toBe("0");
    expect(newWallet.effectivePolicyUsdBonusMicro).toBe("0");

    const threeWeekWallet = computeRampedWorkerDreamsBonus(task, 21);
    expect(threeWeekWallet.walletRampMultiplier).toBe(0.25);
    expect(threeWeekWallet.effectiveDreamsBonus).toBe("26025000000000000000");
    expect(threeWalletUsd(threeWeekWallet)).toBe("75000");

    const matureWallet = computeRampedWorkerDreamsBonus(task, 60, 0.002202);
    expect(matureWallet.walletRampMultiplier).toBe(1);
    expect(matureWallet.effectiveDreamsBonus).toBe("104100000000000000000");
    expect(matureWallet.effectivePolicyUsdBonusMicro).toBe("300000");
    expect(matureWallet.effectiveSpotUsdBonusMicro).toBe("229228");
  });

  it("reconciles status=open and phase=active sweeps without duplicates and isolates awaiting_settlement", () => {
    const statusOpenSweep = [
      { id: "t1", status: "open" as const },
      { id: "t2", status: "open" as const },
    ];
    const phaseActiveSweep = [
      { id: "t2", status: "open" as const, phase: "active" as const },
      { id: "t3", status: "pending_approval" as const, phase: "active" as const },
      { id: "t4", status: "in_progress" as const, phase: "active" as const },
    ];
    const phaseAwaitingSweep = [
      { id: "t5", status: "in_progress" as const, phase: "awaiting_settlement" as const },
    ];

    const reconciled = reconcileTaskMarketBoard([
      statusOpenSweep,
      phaseActiveSweep,
      phaseAwaitingSweep,
    ]);

    expect(reconciled.liveTasks.map((t) => t.id)).toEqual(["t1", "t2", "t3", "t4"]);
    expect(reconciled.awaitingSettlementTasks.map((t) => t.id)).toEqual(["t5"]);
    expect(reconciled.allMergedTasks).toHaveLength(5);
  });

  it("evaluates requester counterparty settlement risk from /api/requester/<address>/stats", () => {
    const neverPaid = evaluateRequesterSettlementRisk({
      completedCount: 0,
      expiredNoActionCount: 4,
      cancelledAfterSubmissionsCount: 1,
      selfAwardCount: 0,
    });
    expect(neverPaid.hasEverPaidWorker).toBe(false);
    expect(neverPaid.isHighAbandonmentRisk).toBe(true);
    expect(neverPaid.abandonmentRate).toBe(1);

    const reliableRequester = evaluateRequesterSettlementRisk({
      completedCount: 10,
      expiredNoActionCount: 1,
      cancelledAfterSubmissionsCount: 0,
      selfAwardCount: 0,
    });
    expect(reliableRequester.hasEverPaidWorker).toBe(true);
    expect(reliableRequester.isHighAbandonmentRisk).toBe(false);
    expect(reliableRequester.settlementRate).toBeCloseTo(10 / 11, 5);
  });

  it("computes wallet age in days accurately", () => {
    const now = Date.UTC(2026, 9, 28);
    const twoWeeksAgo = now - 14 * 86_400_000;
    expect(getWalletAgeDays(twoWeeksAgo, now)).toBe(14);
  });
});

function threeWalletUsd(r: { effectivePolicyUsdBonusMicro: string }) {
  return r.effectivePolicyUsdBonusMicro;
}
