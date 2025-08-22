# FCT Period Reconstruction Flow

## Overview

This document describes the deterministic algorithm for reconstructing historical FCT (Facet Compute Token) periods by walking backwards through blockchain state. The system accurately identifies every period, including complex cases where multiple periods complete within a single block.

## Core Concepts

### FCT Issuance Rules

- **Period Duration**: Maximum 500 blocks OR until target FCT amount is minted
- **Rate Adjustment**:
  - **Over-issuance** (hit target): Rate decreases by `max(blocks_elapsed / 500, 0.25)`
  - **Under-issuance** (timeout): Rate increases by `min(target / minted, 4)`
- **Mid-Block Completion**: Periods can end mid-transaction, with remaining FCT starting the next period
- **Deterministic**: All period details can be calculated from blockchain state

### Key Insight

Since FCT issuance is deterministic, we can reconstruct the complete period history by analyzing:

- **Total FCT minted** in each block (`totalMinted` differences)
- **Period boundaries** (`periodStartBlock` from contract state)
- **Target amounts** (constant until halvings occur)

## The Backwards Walking Algorithm

### Starting Point

- **currentPeriodStartBlock**: The start block of the period being analyzed
- **target**: The FCT target amount for periods (78.3k FCT currently)

### Core Loop Structure

For each iteration of the backwards walk:

#### 1. **Current Period Handling**

- First iteration: Current period already exists (ongoing)
- Subsequent iterations: Skip (periods created in step 3)

#### 2. **Sandwiched Period Detection & Creation**

**Get Block States:**

```typescript
blockBeforeCurrentPeriodStart = getState(currentPeriodStartBlock - 1);
currentPeriodStartBlockState = getState(currentPeriodStartBlock);
minedInCurrentPeriodStartBlock =
  currentState.totalMinted - prevState.totalMinted;
```

**Analyze Previous Block's Period:**

```typescript
blockBeforePeriodStart = blockBeforeCurrentPeriodStart.periodStartBlock;
blockBeforePeriodMinted = blockBeforeCurrentPeriodStart.periodMinted;
blockBeforePeriodBlocksElapsed =
  currentPeriodStartBlock - blockBeforePeriodStart;
blockBeforePeriodFctNeeded = target - blockBeforePeriodMinted;
```

**Calculate Sandwiched Periods:**

```typescript
if (blockBeforePeriodBlocksElapsed >= 500) {
  // Timeout case: previous period already complete
  sandwhichedPeriods = floor(
    (minedInCurrentPeriodStartBlock - currentPeriodMinted) / target
  );
} else {
  // Non-timeout case: previous period might complete in current block
  sandwhichedPeriods = floor(
    (minedInCurrentPeriodStartBlock -
      (currentPeriodMinted + blockBeforePeriodFctNeeded)) /
      target
  );
}
```

**Create Sandwiched Periods:**

- **Count**: `sandwhichedPeriods` complete periods in `currentPeriodStartBlock`
- **Properties**: `periodStart = periodEnd = currentPeriodStartBlock`, `minted = target`
- **Rate Calculation**: Uses actual FCT adjustment formulas:
  - **First sandwiched period**: Applies rate adjustment from previous block's period
    - If previous period timed out: `rate = prevRate * min(target / minted, 4)`
    - If previous period hit target: `rate = prevRate * max(blocks_elapsed / 500, 0.25)`
  - **Subsequent sandwiched periods**: Each hits target in 1 block, so `rate = prevRate * 0.25`
- **Ordering**: Created in chronological order, then added to main array in reverse

#### 3. **Previous Period Creation**

**Determine Previous Period End Condition:**

```typescript
if (blockBeforePeriodBlocksElapsed >= 500) {
  // Sub-case A: Ended by timeout
  minted = blockBeforePeriodMinted;
  reason = "under";
  periodEnd = currentPeriodStartBlock - 1;
} else if (blockBeforePeriodFctNeeded > 0) {
  // Sub-case B: Ended by hitting target in currentPeriodStartBlock
  minted = target;
  reason = "over";
  periodEnd = currentPeriodStartBlock;
} else {
  // Sub-case C: Ended by hitting target before currentPeriodStartBlock
  minted = target;
  reason = "over";
  periodEnd = currentPeriodStartBlock - 1;
}
```

**Create Previous Period:**

- **Properties**: `periodStart = blockBeforePeriodStart`, calculated `periodEnd`, determined `minted`
- **Rate**: Retrieved from `blockBeforePeriodStart` blockchain state

#### 4. **Rate Change Calculation (Inline)**

Before adding each new period to the main array:

```typescript
if (periods.length > 0) {
  lastPeriod = periods[periods.length - 1];
  lastPeriod.rateChangePct =
    ((newPeriodRate - lastPeriod.rate) / lastPeriod.rate) * 100;
}
// Then add the new period
periods.push(newPeriod);
```

**For Sandwiched Periods:**

1. Create all sandwiched periods in chronological order (oldest to newest)
2. Reverse the array to match backwards walk order (newest to oldest)
3. Add each period individually, updating rate changes as we go

#### 5. **Continue Walking**

```typescript
currentPeriodStartBlock = blockBeforePeriodStart;
// Repeat with new currentPeriodStartBlock
```

## Complex Scenarios

### Multi-Period Blocks

When `minedInCurrentPeriodStartBlock > target`:

**Example: Block 1828792**

- **79.6k FCT mined** (> 78.3k target)
- **Previous period completion**: ~78.3k FCT used to complete previous period
- **Sandwiched period**: Remaining ~1.3k FCT started and completed new period
- **Result**: Two periods with same start block (1828792)

### Rate Adjustment Cascades

Multiple sandwiched periods in one block:

1. **First sandwiched**: Rate calculated using FCT adjustment formula from previous period
   - Timeout case: `rate = prevRate * min(target / minted, 4)`
   - Target hit case: `rate = prevRate * max(blocks_elapsed / 500, 0.25)`
2. **Subsequent sandwiched**: Each hits target in 1 block, so `rate = prevRate * 0.25`
3. **Continuing period**: Starts with final adjusted rate from blockchain state

### Timeout vs Target Completion

**Timeout (500 blocks):**

- Period lasted full duration
- Minted amount = `periodMinted` from blockchain
- Rate increases for next period

**Target Hit (<500 blocks):**

- Period completed early
- Minted amount = `target` (exact)
- Rate decreases for next period

## Data Structures

### Period Interface

```typescript
interface Period {
  periodNumber: number;
  periodStart: bigint; // When period started
  periodEnd: bigint | null; // When period ended (null for current)
  blocksLasted: number; // Duration in blocks
  minted: bigint; // FCT minted in this period
  target: bigint; // FCT target for this period
  mintedPercent: number; // Percentage of target achieved
  reason: "over" | "under" | "current"; // How period ended
  rate: bigint; // FCT/ETH rate active during period
  rateChangePct?: number; // Rate change to next period (calculated inline)
  halvingLevel: number; // Halving level (for future use)
  totalSupply: bigint; // Total FCT supply at period end
  isActive: boolean; // True for current period
}
```

## Implementation Benefits

### Deterministic Reconstruction

- **No heuristics**: Pure calculation based on blockchain state
- **Complete coverage**: Every period identified and reconstructed
- **Accurate timing**: Precise period boundaries and durations

### Performance Optimized

- **Efficient walking**: Only fetches necessary block states
- **Inline calculations**: Rate changes computed during creation
- **Minimal API calls**: Optimized blockchain state retrieval

### UI Integration

- **Unified interface**: Single hook provides complete period list
- **Real-time updates**: Current period updates every 30 seconds
- **Visual indicators**: Rate change arrows and percentages
- **Chronological display**: Newest to oldest period sequence

## Key Formulas

### Sandwiched Period Detection

```typescript
// Timeout case (previous period already complete)
sandwhichedPeriods = floor((minedInBlock - currentPeriodMinted) / target);

// Non-timeout case (previous period might complete in current block)
sandwhichedPeriods = floor(
  (minedInBlock - (currentPeriodMinted + prevPeriodNeeded)) / target
);
```

### Rate Change Calculation

```typescript
rateChangePct =
  ((nextPeriodRate - currentPeriodRate) / currentPeriodRate) * 100;
```

### Period Duration

```typescript
blocksLasted = periodEnd - periodStart + 1;
```

## Error Handling

- **Missing blockchain data**: Graceful fallback and loop termination
- **Invalid calculations**: Negative sandwiched periods clamped to 0
- **Rate edge cases**: Zero rate handling in percentage calculations
- **Boundary conditions**: Safety checks for block number validity

## Future Enhancements

### Halving Support

- **Dynamic targets**: Calculate different targets based on total supply
- **Halving detection**: Identify when supply crosses halving thresholds
- **Target progression**: Track target reductions through halvings

### Advanced Rate Modeling

- **Multi-period rate modeling**: Handle complex cascading rate adjustments
- **Rate prediction**: Forecast future rate adjustments based on current period performance
- **Historical analysis**: Identify rate adjustment patterns and period completion trends

---

_This implementation successfully replaces complex heuristic-based period detection with a deterministic, mathematically precise reconstruction algorithm._
