/**
 * TaskMarket reconciliation, wallet-age DREAMS bonus ramp, and requester
 * counterparty risk helpers (#701).
 */

export const TASKMARKET_PHASES = [
  "active",
  "awaiting_settlement",
  "settled",
  "cancelled",
] as const;

export type TaskMarketPhase = (typeof TASKMARKET_PHASES)[number] | (string & {});

export const TASKMARKET_STATUSES = [
  "open",
  "pending_approval",
  "in_progress",
  "completed",
  "cancelled",
  "expired",
] as const;

export type TaskMarketStatus = (typeof TASKMARKET_STATUSES)[number] | (string & {});

export interface TaskMarketTask {
  id: string;
  status?: TaskMarketStatus;
  phase?: TaskMarketPhase;
  requesterAddress?: string;
  bountyUsdc?: string;
  submissionsCount?: number;
  estimatedWorkerDreamsBonus?: string;
  estimatedWorkerUsdBonusValue?: string;
  dreamsPerUsdc?: number;
}

export interface RampedDreamsBonusResult {
  rawDreamsBonus: bigint;
  rawUsdBonusMicro: bigint;
  walletRampMultiplier: 0 | 0.25 | 0.5 | 1;
  effectiveDreamsBonus: string;
  effectivePolicyUsdBonusMicro: string;
  effectiveSpotUsdBonusMicro?: string;
}

export interface RequesterCounterpartyStats {
  completedCount: number;
  expiredNoActionCount: number;
  cancelledAfterSubmissionsCount: number;
  selfAwardCount: number;
}

export interface RequesterRiskAssessment {
  hasEverPaidWorker: boolean;
  settlementRate: number;
  abandonmentRate: number;
  isHighAbandonmentRisk: boolean;
}

const MS_PER_DAY = 86_400_000;

/**
 * Returns the anti-Sybil wallet-age reward multiplier defined by TaskMarket:
 * - under 2 weeks (< 14 days): 0% (0)
 * - 2 to 4 weeks (14..27.99 days): 25% (0.25)
 * - 4 to 8 weeks (28..55.99 days): 50% (0.5)
 * - 8 weeks or more (>= 56 days): 100% (1)
 */
export function getWalletAgeRampMultiplier(
  walletAgeDays: number
): 0 | 0.25 | 0.5 | 1 {
  if (!Number.isFinite(walletAgeDays) || walletAgeDays < 14) {
    return 0;
  }
  if (walletAgeDays < 28) {
    return 0.25;
  }
  if (walletAgeDays < 56) {
    return 0.5;
  }
  return 1;
}

/**
 * Computes wallet age in days from a creation timestamp (ms or ISO string)
 * relative to `nowMs`.
 */
export function getWalletAgeDays(
  walletCreatedAt: number | string | Date,
  nowMs: number = Date.now()
): number {
  const createdMs =
    typeof walletCreatedAt === "number"
      ? walletCreatedAt
      : new Date(walletCreatedAt).getTime();
  if (!Number.isFinite(createdMs) || createdMs > nowMs) {
    return 0;
  }
  return (nowMs - createdMs) / MS_PER_DAY;
}

/**
 * Applies the wallet-age ramp multiplier to a task's advertised
 * `estimatedWorkerDreamsBonus` and `estimatedWorkerUsdBonusValue` so newly
 * onboarded agent wallets are not shown unramped 100% figures (#701).
 */
export function computeRampedWorkerDreamsBonus(
  task: Pick<
    TaskMarketTask,
    "estimatedWorkerDreamsBonus" | "estimatedWorkerUsdBonusValue"
  >,
  walletAgeDays: number,
  spotUsdPerDreams?: number
): RampedDreamsBonusResult {
  const rawDreamsBonus = BigInt(task.estimatedWorkerDreamsBonus ?? "0");
  const rawUsdBonusMicro = BigInt(task.estimatedWorkerUsdBonusValue ?? "0");
  const multiplier = getWalletAgeRampMultiplier(walletAgeDays);
  const bps = BigInt(Math.round(multiplier * 10_000));

  const effectiveDreams = (rawDreamsBonus * bps) / 10_000n;
  const effectivePolicyUsd = (rawUsdBonusMicro * bps) / 10_000n;

  const result: RampedDreamsBonusResult = {
    rawDreamsBonus,
    rawUsdBonusMicro,
    walletRampMultiplier: multiplier,
    effectiveDreamsBonus: effectiveDreams.toString(),
    effectivePolicyUsdBonusMicro: effectivePolicyUsd.toString(),
  };

  if (
    typeof spotUsdPerDreams === "number" &&
    Number.isFinite(spotUsdPerDreams) &&
    spotUsdPerDreams >= 0
  ) {
    // Convert 18-decimal DREAMS wei to 6-decimal USDC micro units using spot rate
    const spotMicroPerDream = BigInt(Math.round(spotUsdPerDreams * 1_000_000));
    const spotUsdMicro =
      (effectiveDreams * spotMicroPerDream) / 1_000_000_000_000_000_000n;
    result.effectiveSpotUsdBonusMicro = spotUsdMicro.toString();
  }

  return result;
}

/**
 * Reconciles TaskMarket task lists across both `status` and `phase` axes (#701).
 *
 * Walking `GET /api/tasks?status=open` alone under-reports active tasks ~4x
 * because live work also sits under `phase=active` or `status=pending_approval`.
 * This helper merges tasks by `id` and filters out terminal/stuck states unless
 * requested.
 */
export function reconcileTaskMarketBoard(
  taskBatches: ReadonlyArray<ReadonlyArray<TaskMarketTask>>,
  options: { includeAwaitingSettlement?: boolean } = {}
): {
  liveTasks: TaskMarketTask[];
  awaitingSettlementTasks: TaskMarketTask[];
  allMergedTasks: TaskMarketTask[];
} {
  const byId = new Map<string, TaskMarketTask>();

  for (const batch of taskBatches) {
    for (const task of batch) {
      if (!task?.id) continue;
      const existing = byId.get(task.id);
      byId.set(task.id, existing ? { ...existing, ...task } : { ...task });
    }
  }

  const allMergedTasks = Array.from(byId.values());
  const awaitingSettlementTasks = allMergedTasks.filter(
    (t) => t.phase === "awaiting_settlement"
  );

  const liveTasks = allMergedTasks.filter((t) => {
    if (t.phase === "settled" || t.phase === "cancelled") return false;
    if (t.status === "completed" || t.status === "cancelled" || t.status === "expired") {
      return false;
    }
    if (t.phase === "awaiting_settlement") {
      return Boolean(options.includeAwaitingSettlement);
    }
    return (
      t.phase === "active" ||
      t.status === "open" ||
      t.status === "pending_approval" ||
      t.status === "in_progress"
    );
  });

  return {
    liveTasks,
    awaitingSettlementTasks,
    allMergedTasks,
  };
}

/**
 * Evaluates requester counterparty risk from `GET /api/requester/<address>/stats`
 * before an agent spends x402 submission fees (#701).
 */
export function evaluateRequesterSettlementRisk(
  stats: RequesterCounterpartyStats
): RequesterRiskAssessment {
  const completed = Math.max(0, stats.completedCount || 0);
  const expired = Math.max(0, stats.expiredNoActionCount || 0);
  const cancelledAfterSub = Math.max(0, stats.cancelledAfterSubmissionsCount || 0);
  const selfAward = Math.max(0, stats.selfAwardCount || 0);

  const externalCompleted = Math.max(0, completed - selfAward);
  const totalResolvedOrExpired = completed + expired + cancelledAfterSub;

  const settlementRate =
    totalResolvedOrExpired > 0 ? externalCompleted / totalResolvedOrExpired : 0;
  const abandonmentRate =
    totalResolvedOrExpired > 0
      ? (expired + cancelledAfterSub) / totalResolvedOrExpired
      : 0;

  const hasEverPaidWorker = externalCompleted > 0;
  const isHighAbandonmentRisk =
    !hasEverPaidWorker || abandonmentRate >= 0.5;

  return {
    hasEverPaidWorker,
    settlementRate,
    abandonmentRate,
    isHighAbandonmentRisk,
  };
}
