# Decimal.js Preservation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Preserve Decimal.js precision throughout visualization pipeline by storing both number (for rendering) and Decimal (for display) values.

**Architecture:** Update all chart data structures to include Decimal properties alongside number properties. Modify data generation to calculate Decimal first, derive number via `.toNumber()`. Update display code to format from Decimal properties, eliminating precision-recovery via `ensure()`.

**Tech Stack:** TypeScript, Decimal.js, D3.js, Chart.js

---

## Task 1: Update ChartDataPoint Type Definitions

**Files:**
- Modify: `src/charts/dataGeneration.ts:1-10`

**Step 1: Import Decimal type**

Add import at top of file after existing imports:

```typescript
import Decimal from 'decimal.js';
```

**Step 2: Update ChartDataPoint type**

Replace the existing `ChartDataPoint` type:

```typescript
// Before
export type ChartDataPoint = { x: number; y: number };

// After
export type ChartDataPoint = {
    x: number;
    y: number;
    xDecimal: Decimal;
    yDecimal: Decimal;
};
```

**Step 3: Update ChartDataPointWithVelocity type**

Replace the existing `ChartDataPointWithVelocity` type:

```typescript
// Before
export type ChartDataPointWithVelocity = { x: number; y: number; velocity: number };

// After
export type ChartDataPointWithVelocity = {
    x: number;
    y: number;
    velocity: number;
    xDecimal: Decimal;
    yDecimal: Decimal;
    velocityDecimal: Decimal;
};
```

**Step 4: Run type check to see compilation errors**

Run: `npx tsc --noEmit 2>&1 | head -50`

Expected: Multiple TypeScript errors in data generation functions showing missing Decimal properties

**Step 5: Commit type definition changes**

```bash
git add src/charts/dataGeneration.ts
git commit -m "Add Decimal properties to chart data types

Update ChartDataPoint and ChartDataPointWithVelocity to store both
number (for rendering) and Decimal (for display formatting) values."
```

---

## Task 2: Update MinkowskiData Type Definition

**Files:**
- Modify: `src/charts/minkowski-types.ts:1-15`

**Step 1: Import Decimal type**

Add import at top of file:

```typescript
import Decimal from 'decimal.js';
```

**Step 2: Update MinkowskiData interface**

Add Decimal properties to the interface:

```typescript
export interface MinkowskiData {
    time: number;           // Time coordinate in seconds
    distance: number;       // Distance coordinate in km
    velocity: number;       // Relative velocity as fraction of c
    deltaTPrime: number;    // Transformed time coordinate
    deltaXPrime: number;    // Transformed distance coordinate
    // Decimal versions for display formatting
    timeDecimal: Decimal;
    distanceDecimal: Decimal;
    velocityDecimal: Decimal;
    deltaTPrimeDecimal: Decimal;
    deltaXPrimeDecimal: Decimal;
}
```

**Step 3: Commit MinkowskiData changes**

```bash
git add src/charts/minkowski-types.ts
git commit -m "Add Decimal properties to MinkowskiData interface"
```

---

## Task 3: Update TwinParadoxMinkowskiData Type Definition

**Files:**
- Modify: `src/charts/minkowski-twins.ts:29-35`

**Step 1: Update TwinParadoxMinkowskiData interface**

Add Decimal properties to the interface (Decimal is already imported):

```typescript
export interface TwinParadoxMinkowskiData {
    velocityC: number;        // Velocity as fraction of c
    properTimeYears: number;  // Proper time in years
    earthTimeYears: number;   // Coordinate time in years
    distanceLY: number;       // One-way distance in light years
    gamma: number;            // Lorentz factor
    // Decimal versions for display formatting
    velocityCDecimal: Decimal;
    properTimeYearsDecimal: Decimal;
    earthTimeYearsDecimal: Decimal;
    distanceLYDecimal: Decimal;
    gammaDecimal: Decimal;
}
```

**Step 2: Commit TwinParadoxMinkowskiData changes**

```bash
git add src/charts/minkowski-twins.ts
git commit -m "Add Decimal properties to TwinParadoxMinkowskiData interface"
```

---

## Task 4: Update SimultaneityEventData Type Definition

**Files:**
- Modify: `src/charts/simultaneityState.ts:1-10`

**Step 1: Import Decimal type**

Add import at top of file:

```typescript
import Decimal from 'decimal.js';
```

**Step 2: Update SimultaneityEventData interface**

Add Decimal properties:

```typescript
export interface SimultaneityEventData {
    ct: number;
    x: number;
    ctDecimal: Decimal;
    xDecimal: Decimal;
}
```

**Step 3: Commit SimultaneityEventData changes**

```bash
git add src/charts/simultaneityState.ts
git commit -m "Add Decimal properties to SimultaneityEventData interface"
```

---

## Task 5: Update generateAccelChartData - Velocity Data

**Files:**
- Modify: `src/charts/dataGeneration.ts:44-75`

**Step 1: Update velocity calculation and data push**

Find the velocity calculation block (around line 48-64) and update:

```typescript
// Before
const velocity = rl.relativisticVelocity(accel, tau);
const velocityC = parseFloat(velocity.div(rl.c).toString());
// ... other calculations ...
properTimeVelocity.push({ x: tauDays, y: velocityC });
coordTimeVelocity.push({ x: tDays, y: velocityC });

// After
const tauDecimal = rl.ensure(tau);
const tauDaysDecimal = tauDecimal.div(rl.ensure(60 * 60 * 24));
const tauDays = tauDaysDecimal.toNumber();

const velocity = rl.relativisticVelocity(accel, tauDecimal);
const velocityCDecimal = velocity.div(rl.c);
const velocityC = velocityCDecimal.toNumber();

// ... other calculations ...

const t = rl.coordinateTime(accel, tauDecimal);
const tDaysDecimal = t.div(rl.ensure(60 * 60 * 24));
const tDays = tDaysDecimal.toNumber();

properTimeVelocity.push({
    x: tauDays,
    y: velocityC,
    xDecimal: tauDaysDecimal,
    yDecimal: velocityCDecimal
});

coordTimeVelocity.push({
    x: tDays,
    y: velocityC,
    xDecimal: tDaysDecimal,
    yDecimal: velocityCDecimal
});
```

**Step 2: Run type check**

Run: `npx tsc --noEmit 2>&1 | grep "dataGeneration.ts" | head -20`

Expected: Fewer errors for properTimeVelocity and coordTimeVelocity

**Step 3: Commit velocity data changes**

```bash
git add src/charts/dataGeneration.ts
git commit -m "Update velocity data generation to include Decimal properties"
```

---

## Task 6: Update generateAccelChartData - Rapidity and Time Dilation

**Files:**
- Modify: `src/charts/dataGeneration.ts:50-70`

**Step 1: Update rapidity calculation**

```typescript
// Add after velocity calculations
const rapidityDecimal = rl.rapidityFromVelocity(velocity);
const rapidity = rapidityDecimal.toNumber();

properTimeRapidity.push({
    x: tauDays,
    y: rapidity,
    xDecimal: tauDaysDecimal,
    yDecimal: rapidityDecimal
});

coordTimeRapidity.push({
    x: tDays,
    y: rapidity,
    xDecimal: tDaysDecimal,
    yDecimal: rapidityDecimal
});
```

**Step 2: Update time dilation calculation**

```typescript
const lorentz = rl.lorentzFactor(velocity);
const timeDilationDecimal = rl.one.div(lorentz);
const timeDilation = timeDilationDecimal.toNumber();

properTimeTimeDilation.push({
    x: tauDays,
    y: timeDilation,
    xDecimal: tauDaysDecimal,
    yDecimal: timeDilationDecimal
});

coordTimeTimeDilation.push({
    x: tDays,
    y: timeDilation,
    xDecimal: tDaysDecimal,
    yDecimal: timeDilationDecimal
});
```

**Step 3: Commit rapidity and time dilation changes**

```bash
git add src/charts/dataGeneration.ts
git commit -m "Update rapidity and time dilation data to include Decimal properties"
```

---

## Task 7: Update generateAccelChartData - Mass Remaining

**Files:**
- Modify: `src/charts/dataGeneration.ts:58-74`

**Step 1: Update mass remaining calculations**

```typescript
// Calculate mass remaining as percentage for all nozzle efficiencies
const fuelPercents = rl.pionRocketFuelFractionsMultiple(tauDecimal, accel, [0.7, 0.75, 0.8, 0.85]);
const [massRemaining70Decimal, massRemaining75Decimal, massRemaining80Decimal, massRemaining85Decimal] =
    fuelPercents.map(fp => rl.ensure(100).minus(fp));

const [massRemaining70, massRemaining75, massRemaining80, massRemaining85] =
    [massRemaining70Decimal, massRemaining75Decimal, massRemaining80Decimal, massRemaining85Decimal]
        .map(d => d.toNumber());

properTimeMassRemaining40.push({
    x: tauDays,
    y: massRemaining70,
    xDecimal: tauDaysDecimal,
    yDecimal: massRemaining70Decimal
});

properTimeMassRemaining50.push({
    x: tauDays,
    y: massRemaining75,
    xDecimal: tauDaysDecimal,
    yDecimal: massRemaining75Decimal
});

properTimeMassRemaining60.push({
    x: tauDays,
    y: massRemaining80,
    xDecimal: tauDaysDecimal,
    yDecimal: massRemaining80Decimal
});

properTimeMassRemaining70.push({
    x: tauDays,
    y: massRemaining85,
    xDecimal: tauDaysDecimal,
    yDecimal: massRemaining85Decimal
});
```

**Step 2: Commit mass remaining changes**

```bash
git add src/charts/dataGeneration.ts
git commit -m "Update mass remaining data to include Decimal properties"
```

---

## Task 8: Update generateAccelChartData - Position/Spacetime Data

**Files:**
- Modify: `src/charts/dataGeneration.ts:75-84`

**Step 1: Update distance and spacetime worldline calculations**

```typescript
// Calculate distance for phase space plots
const distance = rl.relativisticDistance(accel, tauDecimal);
const distanceLyDecimal = distance.div(rl.lightYear);
const distanceLy = distanceLyDecimal.toNumber();

// Position-velocity phase space
positionVelocity.push({
    x: distanceLy,
    y: velocityC,
    xDecimal: distanceLyDecimal,
    yDecimal: velocityCDecimal
});

// Spacetime worldline (coord time vs distance) with velocity for gradient
const tYearsDecimal = tDaysDecimal.div(rl.ensure(365.25));
const tYears = tYearsDecimal.toNumber();

spacetimeWorldline.push({
    x: tYears,
    y: distanceLy,
    velocity: velocityC,
    xDecimal: tYearsDecimal,
    yDecimal: distanceLyDecimal,
    velocityDecimal: velocityCDecimal
});
```

**Step 2: Run type check**

Run: `npx tsc --noEmit 2>&1 | grep "generateAccelChartData"`

Expected: No errors for generateAccelChartData

**Step 3: Commit position/spacetime data changes**

```bash
git add src/charts/dataGeneration.ts
git commit -m "Update position and spacetime data to include Decimal properties"
```

---

## Task 9: Update generateFlipBurnChartData - Acceleration Phase

**Files:**
- Modify: `src/charts/dataGeneration.ts:140-181`

**Step 1: Update acceleration phase loop**

Inside the acceleration phase loop (for i = 0 to numPointsPerPhase):

```typescript
const tau = halfProperTimeSeconds.mul(i / numPointsPerPhase);
const tauYearsDecimal = tau.div(rl.secondsPerYear);
const tauYears = tauYearsDecimal.toNumber();

const velocity = rl.relativisticVelocity(accel, tau);
const velocityCDecimal = velocity.div(rl.c);
const velocityC = velocityCDecimal.toNumber();

const rapidityDecimal = rl.rapidityFromVelocity(velocity);
const rapidity = rapidityDecimal.toNumber();

const lorentz = rl.lorentzFactor(velocity);
const timeDilationDecimal = rl.one.div(lorentz);
const timeDilation = timeDilationDecimal.toNumber();

properTimeVelocity.push({
    x: tauYears,
    y: velocityC,
    xDecimal: tauYearsDecimal,
    yDecimal: velocityCDecimal
});

const t = rl.coordinateTime(accel, tau);
const tYearsDecimal = t.div(rl.secondsPerYear);
const tYears = tYearsDecimal.toNumber();

coordTimeVelocity.push({
    x: tYears,
    y: velocityC,
    xDecimal: tYearsDecimal,
    yDecimal: velocityCDecimal
});

properTimeRapidity.push({
    x: tauYears,
    y: rapidity,
    xDecimal: tauYearsDecimal,
    yDecimal: rapidityDecimal
});

coordTimeRapidity.push({
    x: tYears,
    y: rapidity,
    xDecimal: tYearsDecimal,
    yDecimal: rapidityDecimal
});

properTimeLorentz.push({
    x: tauYears,
    y: timeDilation,
    xDecimal: tauYearsDecimal,
    yDecimal: timeDilationDecimal
});

coordTimeLorentz.push({
    x: tYears,
    y: timeDilation,
    xDecimal: tYearsDecimal,
    yDecimal: timeDilationDecimal
});
```

**Step 2: Update mass remaining in acceleration phase**

```typescript
const fuelPercents = rl.pionRocketFuelFractionsMultiple(tau, accel, [0.7, 0.75, 0.8, 0.85]);
const [massRemaining70Decimal, massRemaining75Decimal, massRemaining80Decimal, massRemaining85Decimal] =
    fuelPercents.map(fp => rl.ensure(100).minus(fp));

const [massRemaining70, massRemaining75, massRemaining80, massRemaining85] =
    [massRemaining70Decimal, massRemaining75Decimal, massRemaining80Decimal, massRemaining85Decimal]
        .map(d => d.toNumber());

properTimeMassRemaining40.push({
    x: tauYears,
    y: massRemaining70,
    xDecimal: tauYearsDecimal,
    yDecimal: massRemaining70Decimal
});

// ... similar for 50, 60, 70
```

**Step 3: Commit acceleration phase changes**

```bash
git add src/charts/dataGeneration.ts
git commit -m "Update flip-burn acceleration phase to include Decimal properties"
```

---

## Task 10: Update generateFlipBurnChartData - Distance/Worldline Data

**Files:**
- Modify: `src/charts/dataGeneration.ts:172-181`

**Step 1: Update distance and spacetime worldline in acceleration phase**

```typescript
// Calculate distance traveled so far
const distance = rl.relativisticDistance(accel, tau);
const distanceLyDecimal = distance.div(rl.lightYear);
const distanceLy = distanceLyDecimal.toNumber();

// Position-velocity phase space (acceleration phase)
positionVelocityAccel.push({
    x: distanceLy,
    y: velocityC,
    xDecimal: distanceLyDecimal,
    yDecimal: velocityCDecimal
});

// Spacetime worldline with velocity for gradient
spacetimeWorldline.push({
    x: tYears,
    y: distanceLy,
    velocity: velocityC,
    xDecimal: tYearsDecimal,
    yDecimal: distanceLyDecimal,
    velocityDecimal: velocityCDecimal
});
```

**Step 2: Commit distance/worldline changes**

```bash
git add src/charts/dataGeneration.ts
git commit -m "Update flip-burn distance data to include Decimal properties"
```

---

## Task 11: Update generateFlipBurnChartData - Deceleration Phase

**Files:**
- Modify: `src/charts/dataGeneration.ts:185-232`

**Step 2: Update deceleration phase loop**

Similar pattern to acceleration phase but with deceleration calculations. Apply the same Decimal-first pattern to all data pushes in the deceleration loop.

**Step 3: Commit deceleration phase changes**

```bash
git add src/charts/dataGeneration.ts
git commit -m "Update flip-burn deceleration phase to include Decimal properties"
```

---

## Task 12: Update generateTwinParadoxChartData Function

**Files:**
- Modify: `src/charts/dataGeneration.ts:299-372`

**Step 1: Update calculations to use Decimals**

This function currently uses plain number arithmetic. Update to calculate key values as Decimals:

```typescript
const velocityDecimal = rl.c.mul(velocityC);
const gammaDecimal = rl.lorentzFactor(velocityDecimal);
const gamma = gammaDecimal.toNumber();

// For each data point
const tauDecimal = rl.ensure((i / numPoints) * properTimeYears);
const tau = tauDecimal.toNumber();

const earthTimeDecimal = tauDecimal.mul(gammaDecimal);
const earthTime = earthTimeDecimal.toNumber();

velocityProfile.push({
    x: tau,
    y: velocityC,
    xDecimal: tauDecimal,
    yDecimal: rl.ensure(velocityC)  // Already a fraction of c
});

// ... and so on for all data arrays
```

**Step 2: Commit twin paradox changes**

```bash
git add src/charts/dataGeneration.ts
git commit -m "Update twin paradox data generation to include Decimal properties"
```

---

## Task 13: Update Minkowski Diagram Display Labels

**Files:**
- Modify: `src/charts/minkowski.ts:629,919,1073,1156`

**Step 1: Update velocity label at line 629**

```typescript
// Before
.text(d => `Moving frame ${rl.formatSignificant(rl.ensure(d.beta), "9", 2)}c`);

// After
.text(d => `Moving frame ${rl.formatSignificant(d.betaDecimal, "9", 2)}c`);
```

**Note:** This will cause a TypeScript error because `d` (of type `MinkowskiData`) doesn't have a `betaDecimal` property. We need to update the data passed to this function. That requires tracing back to where this data is created.

**Step 2: Find where MinkowskiData is created**

Search for where `renderLabels` is called and trace back to data source. The data comes from the caller of `drawMinkowskiDiagramD3`, which receives `MinkowskiData` from the UI layer.

**Step 3: Update renderLabels to accept beta as parameter**

For now, we can pass beta as a separate parameter:

```typescript
// In renderLabels function signature
function renderLabels(
    labelGroup: Selection<SVGGElement, MinkowskiData, null, undefined>,
    data: MinkowskiData,
    size: number,
    betaDecimal: Decimal  // Add this parameter
): void {
    // ...
    .text(d => `Moving frame ${rl.formatSignificant(betaDecimal, "9", 2)}c`);
}
```

**Step 4: Defer full fix**

This requires updating the MinkowskiData creation in the UI layer. For now, calculate betaDecimal from the data:

```typescript
.text(d => `Moving frame ${rl.formatSignificant(d.velocityDecimal, "9", 2)}c`);
```

Since `velocityDecimal` is already stored in `MinkowskiData`.

**Step 5: Update all velocity labels in minkowski.ts**

Replace the 4 occurrences:
- Line 629: `d.betaDecimal` → use `d.velocityDecimal`
- Line 919: `currentBeta` → calculate `currentBetaDecimal`
- Line 1073: `data.velocity` → use `data.velocityDecimal`
- Line 1156: `data.velocity` → use `data.velocityDecimal`

For line 919, calculate Decimal version:
```typescript
const currentBetaDecimal = rl.ensure(currentBeta);
svg.select('.velocity-label')
    .text(`Moving frame ${rl.formatSignificant(currentBetaDecimal, "9", 2)}c`);
```

**Step 6: Commit minkowski diagram label changes**

```bash
git add src/charts/minkowski.ts
git commit -m "Update Minkowski diagram labels to use Decimal formatting"
```

---

## Task 14: Update Simultaneity Diagram Display Labels

**Files:**
- Modify: `src/charts/simultaneity.ts:318,670,886,936,1013`

**Step 1: Update velocity labels**

Replace all 5 occurrences:

```typescript
// Before (line 318, 670, 886, 936, 1013)
rl.formatSignificant(rl.ensure(state.velocity), "9", 2)
rl.formatSignificant(rl.ensure(velocity), "9", 2)

// After
rl.formatSignificant(rl.ensure(state.velocity), "9", 2)  // Calculate Decimal from state
rl.formatSignificant(rl.ensure(velocity), "9", 2)  // Calculate Decimal from parameter
```

**Note:** For simultaneity, the state velocity is a plain number. We need to add `velocityDecimal` to the state object or calculate on the fly.

**Step 2: Add velocityDecimal to simultaneity state**

In `simultaneityState.ts`, update the state interface:

```typescript
interface State {
    velocity: number;
    velocityDecimal: Decimal;
    gamma: number;
    events: InternalEvent[];
}
```

**Step 3: Update state initialization**

When velocity is set, also set velocityDecimal:

```typescript
function updateVelocity(velocity: number): void {
    state.velocity = velocity;
    state.velocityDecimal = rl.ensure(velocity);
    state.gamma = calculateGamma(velocity);
    // ...
}
```

**Step 4: Update formatSignificant calls**

```typescript
.text(`v = ${rl.formatSignificant(state.velocityDecimal, "9", 2)}c`);
velocityLabel.text(`${rl.formatSignificant(velocityDecimal, "9", 2)}c`);
```

**Step 5: Commit simultaneity label changes**

```bash
git add src/charts/simultaneity.ts src/charts/simultaneityState.ts
git commit -m "Update simultaneity diagram labels to use Decimal formatting"
```

---

## Task 15: Update Twin Paradox Diagram Display Labels

**Files:**
- Modify: `src/charts/minkowski-twins.ts:271`

**Step 1: Update gamma label**

```typescript
// Before
{ text: `γ = ${rl.formatSignificant(rl.ensure(data.gamma), "0", 3)}`, y: size - 60, color: D3_COLORS.plasmaWhite },

// After
{ text: `γ = ${rl.formatSignificant(data.gammaDecimal, "0", 3)}`, y: size - 60, color: D3_COLORS.plasmaWhite },
```

**Step 2: Commit twin paradox label changes**

```bash
git add src/charts/minkowski-twins.ts
git commit -m "Update twin paradox gamma label to use Decimal formatting"
```

---

## Task 16: Verify TypeScript Compilation

**Step 1: Run full type check**

Run: `npx tsc --noEmit`

Expected: No errors (all type issues resolved)

**Step 2: If errors remain, fix them**

Review any remaining errors and fix by ensuring:
- All data structures have both number and Decimal properties
- All data generation populates both properties
- All display code uses Decimal properties for formatting

**Step 3: Verify dev server runs**

Check: Dev server should be running without errors

---

## Task 17: Visual Verification

**Step 1: Test high-velocity scenarios**

In the browser at http://localhost:5174/:
1. Go to "Constant Acceleration" tab
2. Set duration to 365 days
3. Observe velocity label should show "0.9999c" or similar, NOT "1.00c"

**Step 2: Test Lorentz factor display**

In "Twin Paradox" tab:
1. Set velocity to 0.999c
2. Gamma should display with proper precision (e.g., "22.366") not rounded

**Step 3: Test simultaneity labels**

In "Relativity of Simultaneity" tab:
1. Adjust velocity slider to 0.95c
2. Verify velocity label shows full precision

**Step 4: Document verification**

Create verification notes in this file documenting:
- Which labels were checked
- What precision was observed
- Any issues found

---

## Task 18: Final Commit and Cleanup

**Step 1: Review all changes**

Run: `git log --oneline -20`

Expected: ~15-18 commits for the implementation

**Step 2: Create final summary commit if needed**

If any small fixes were made during verification:

```bash
git add .
git commit -m "Final cleanup and verification for Decimal preservation"
```

**Step 3: Update plan status**

Mark this plan as completed in `docs/plans/2025-11-29-decimal-preservation-implementation.md`

---

## Completion Checklist

- [ ] All type definitions updated with Decimal properties
- [ ] All data generation functions updated
- [ ] All display labels updated to use Decimal formatting
- [ ] TypeScript compilation passes
- [ ] Dev server runs without errors
- [ ] Visual verification passed for high-velocity scenarios
- [ ] All changes committed

## Notes for Executor

**Common Issues:**
1. **Forgetting to import Decimal** - Add `import Decimal from 'decimal.js';` to any file using Decimal type
2. **Using .toString() instead of .toNumber()** - Always use `.toNumber()` for number conversion
3. **Passing number to formatSignificant** - Must pass Decimal, not number

**Performance Note:**
Decimal storage adds minimal overhead. The bottleneck remains D3 rendering, not data storage.

**Testing Strategy:**
Focus visual testing on boundary cases:
- Velocities > 0.99c (approaching c)
- Lorentz factors at high velocity (should show high precision)
- Low velocities near 0 (should show leading zeros appropriately)
