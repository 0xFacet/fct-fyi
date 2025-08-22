import { useQuery } from "@tanstack/react-query";
import { readContract } from "@wagmi/core";
import { wagmiConfig } from "@/config/wagmi";
import { L1_BLOCK_ADDRESS, FCT_DETAILS_ABI } from "@/constants/fct";
import { FctDetails, getHalvingLevel } from "@/utils/fct-calculations";

export interface Period {
  periodNumber: number;
  periodStart: bigint;
  periodEnd: bigint | null; // null for current period
  blocksLasted: number;
  minted: bigint;
  target: bigint;
  mintedPercent: number;
  reason: "over" | "under" | "current"; // 'current' for ongoing period
  rate: bigint; // The rate that was active during this period
  rateChangePct?: number; // Rate change from this period to the next (calculated after)
  halvingLevel: number;
  totalSupply: bigint;
  isActive: boolean; // true for current period
}

// Helper function to get block state
async function getBlockState(blockNumber: bigint): Promise<FctDetails | null> {
  if (blockNumber <= 0n) return null;
  try {
    return (await readContract(wagmiConfig, {
      address: L1_BLOCK_ADDRESS,
      abi: FCT_DETAILS_ABI,
      functionName: "fctDetails",
      blockNumber,
    })) as FctDetails;
  } catch (error) {
    console.error(`Failed to fetch block ${blockNumber}:`, error);
    return null;
  }
}

// Get current FCT details
async function getCurrentFctDetails(): Promise<FctDetails | null> {
  try {
    return (await readContract(wagmiConfig, {
      address: L1_BLOCK_ADDRESS,
      abi: FCT_DETAILS_ABI,
      functionName: "fctDetails",
    })) as FctDetails;
  } catch (error) {
    console.error("Failed to fetch current FCT details:", error);
    return null;
  }
}

// Get current block number
async function getCurrentBlockNumber(): Promise<bigint> {
  try {
    const { publicClient } = await import("@/config/wagmi");
    return await publicClient.getBlockNumber();
  } catch (error) {
    console.error("Failed to fetch current block number:", error);
    return 0n;
  }
}

async function fetchAllPeriods(periodsToFetch: number): Promise<Period[]> {
  const periods: Period[] = [];

  // Get current state
  const currentDetails = await getCurrentFctDetails();
  if (!currentDetails) return [];

  // Get current block number from the blockchain
  const currentBlockNumber = await getCurrentBlockNumber();
  const target = currentDetails.initialTargetPerPeriod;

  // Add current period first
  const blocksElapsed =
    currentBlockNumber > currentDetails.periodStartBlock
      ? currentBlockNumber - currentDetails.periodStartBlock
      : 0n;

  const currentPeriod: Period = {
    periodNumber: 1,
    periodStart: currentDetails.periodStartBlock,
    periodEnd: null, // Still ongoing
    blocksLasted: Number(blocksElapsed),
    minted: currentDetails.periodMinted,
    target,
    mintedPercent:
      target > 0n ? Number((currentDetails.periodMinted * 100n) / target) : 0,
    reason: "current",
    rate: currentDetails.mintRate,
    rateChangePct: undefined, // No rate change for current period
    halvingLevel: getHalvingLevel(
      currentDetails.totalMinted,
      currentDetails.maxSupply
    ),

    totalSupply: currentDetails.totalMinted,
    isActive: true,
  };

  periods.push(currentPeriod);

  // Now fetch historical periods
  let currentPeriodStart = currentDetails.periodStartBlock;
  let periodsFound = 1; // Already have current period

  while (periodsFound < periodsToFetch && currentPeriodStart > 1n) {
    // 1) If first iteration: create period for current period
    if (periodsFound === 1) {
      // Current period is already added before the loop, so skip this
    }

    // Step 1: Get Block States
    const blockBeforeCurrentPeriodStart = await getBlockState(
      currentPeriodStart - 1n
    );
    const currentPeriodStartBlockState = await getBlockState(
      currentPeriodStart
    );

    if (!blockBeforeCurrentPeriodStart || !currentPeriodStartBlockState) break;

    const minedInCurrentPeriodStartBlock =
      currentPeriodStartBlockState.totalMinted -
      blockBeforeCurrentPeriodStart.totalMinted;

    // Step 2: Analyze the Period That Was Active in Block Before Current Period Start
    const blockBeforePeriodStart =
      blockBeforeCurrentPeriodStart.periodStartBlock;
    const blockBeforePeriodMinted = blockBeforeCurrentPeriodStart.periodMinted;
    const blockBeforePeriodBlocksElapsed = Number(
      currentPeriodStart - blockBeforePeriodStart
    );
    const blockBeforePeriodFctNeeded = target - blockBeforePeriodMinted;

    // Step 3: Determine What Is The Actual Previous Period
    const sandwhichedPeriodsRaw =
      blockBeforePeriodBlocksElapsed >= 500
        ? Math.floor(
            Number(
              minedInCurrentPeriodStartBlock -
                currentPeriodStartBlockState.periodMinted
            ) / Number(target)
          )
        : Math.floor(
            Number(
              minedInCurrentPeriodStartBlock -
                (currentPeriodStartBlockState.periodMinted +
                  blockBeforePeriodFctNeeded)
            ) / Number(target)
          );

    const sandwhichedPeriods = Math.max(0, sandwhichedPeriodsRaw);

    // 2) Create periods for each sandwiched period in the current period's start block
    if (sandwhichedPeriods > 0) {
      // Calculate the rate for the first sandwiched period using FCT adjustment rules
      const prevBlockPeriodStartState = await getBlockState(
        blockBeforePeriodStart
      );
      const prevBlockPeriodRate = prevBlockPeriodStartState
        ? prevBlockPeriodStartState.mintRate
        : blockBeforeCurrentPeriodStart.mintRate;

      // Apply FCT rate adjustment formula based on how the previous block's period ended
      let firstSandwichedRate: bigint;

      if (blockBeforePeriodBlocksElapsed >= 500) {
        // Previous period timed out - rate increases by min(target / minted, 4)
        const adjustmentFactor = Math.min(
          Number(target) / Number(blockBeforePeriodMinted),
          4
        );
        firstSandwichedRate =
          (prevBlockPeriodRate * BigInt(Math.floor(adjustmentFactor * 1000))) /
          1000n;
      } else {
        // Previous period hit target - rate decreases by max(blocks_elapsed / 500, 0.25)
        const adjustmentFactor = Math.max(
          blockBeforePeriodBlocksElapsed / 500,
          0.25
        );
        firstSandwichedRate =
          (prevBlockPeriodRate * BigInt(Math.floor(adjustmentFactor * 1000))) /
          1000n;
      }

      let currentSandwichRate = firstSandwichedRate;
      const sandwichedPeriodsArray = [];

      // Create sandwiched periods in chronological order (order they were created in the block)
      for (let i = 0; i < sandwhichedPeriods; i++) {
        // Each sandwiched period hits target in 1 block, so rate decreases by max(1/500, 0.25) = 0.25
        const rateAfterSandwich = (currentSandwichRate * 250n) / 1000n; // 0.25x rate decrease

        sandwichedPeriodsArray.push({
          periodNumber: 0, // Will be assigned later
          periodStart: currentPeriodStart,
          periodEnd: currentPeriodStart,
          blocksLasted: 1,
          minted: target,
          target,
          mintedPercent: 100,
          reason: "over" as const,
          rate: currentSandwichRate,
          rateChangePct: undefined, // Will be set when added to main array
          halvingLevel: 0,
          totalSupply: currentPeriodStartBlockState.totalMinted,
          isActive: false,
        });

        currentSandwichRate = rateAfterSandwich;
        periodsFound++;
        if (periodsFound >= periodsToFetch) break;
      }

      // Add sandwiched periods in reverse order (newest first for backwards walk)
      sandwichedPeriodsArray.reverse().forEach((sandwichedPeriod) => {
        // Update rate change for the last period added (if any)
        if (periods.length > 0) {
          const lastPeriod = periods[periods.length - 1];
          if (!lastPeriod.isActive) {
            lastPeriod.rateChangePct =
              sandwichedPeriod.rate === 0n
                ? 0
                : Number(
                    ((lastPeriod.rate - sandwichedPeriod.rate) * 10000n) /
                      sandwichedPeriod.rate
                  ) / 100;
          }
        }

        // Add this sandwiched period
        periods.push(sandwichedPeriod);
      });
    }

    // 3) Create period for the prev period (blockBeforePeriod)

    let minted: bigint;
    let reason: "over" | "under";
    let periodEnd: bigint;

    if (blockBeforePeriodBlocksElapsed >= 500) {
      // Block before period ended by timeout
      minted = blockBeforePeriodMinted;
      reason = "under";
      periodEnd = currentPeriodStart - 1n;
    } else if (blockBeforePeriodFctNeeded > 0) {
      // Block before period ended by hitting target in currentPeriodStartBlock
      minted = target;
      reason = "over";
      periodEnd = currentPeriodStart;
    } else {
      // Block before period ended by hitting target before currentPeriodStartBlock
      minted = target;
      reason = "over";
      periodEnd = currentPeriodStart - 1n;
    }

    // Get the rate that was active at the START of this period
    const blockBeforePeriodStartState = await getBlockState(
      blockBeforePeriodStart
    );
    const periodActiveRate = blockBeforePeriodStartState
      ? blockBeforePeriodStartState.mintRate
      : blockBeforeCurrentPeriodStart.mintRate;

    // Update rate change for the last period added (if any)
    if (periods.length > 0) {
      const lastPeriod = periods[periods.length - 1];
      if (!lastPeriod.isActive) {
        lastPeriod.rateChangePct =
          periodActiveRate === 0n
            ? 0
            : Number(
                ((lastPeriod.rate - periodActiveRate) * 10000n) /
                  periodActiveRate
              ) / 100;
      }
    }

    periods.push({
      periodNumber: periodsFound + 1,
      periodStart: blockBeforePeriodStart,
      periodEnd: periodEnd,
      blocksLasted: Number(periodEnd - blockBeforePeriodStart + 1n),
      minted,
      target,
      mintedPercent: target > 0n ? Number((minted * 100n) / target) : 0,
      reason,
      rate: periodActiveRate,
      rateChangePct: undefined, // Will be set when next period is added
      halvingLevel: 0,
      totalSupply: blockBeforeCurrentPeriodStart.totalMinted,
      isActive: false,
    });

    // Step 4: Continue Walking Backwards
    currentPeriodStart = blockBeforePeriodStart;

    periodsFound++;
  }

  // Assign period numbers (current period should be #1, then historical in reverse chronological order)
  periods.forEach((p, i) => {
    p.periodNumber = i + 1;
  });

  return periods;
}

export function useHistoricalPeriods(periodsToFetch = 10) {
  return useQuery<Period[]>({
    queryKey: ["allPeriods", periodsToFetch],
    queryFn: () => fetchAllPeriods(periodsToFetch),
    staleTime: 30 * 1000, // 30 seconds for current period updates
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // Update every 30 seconds for current period
  });
}
