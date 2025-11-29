# Decimal.js Preservation in Visualization Architecture

**Date:** 2025-11-29
**Status:** Approved
**Author:** Design session with user

## Problem Statement

The current architecture loses precision by converting Decimal.js → number → Decimal:

1. Calculate in Decimal.js (high precision)
2. Convert to `number` via `parseFloat()` for charts (loses precision)
3. Convert back to Decimal via `ensure()` for display formatting (can't recover lost precision)

For example, a velocity of 0.999999c gets rounded to 1.00 during the number conversion, then when we try to format it with `formatSignificant`, the precision is already gone.

## Solution Overview

Preserve Decimal.js values throughout the data pipeline by storing both:
- **number** - for D3/Chart.js rendering (scales, positions)
- **Decimal** - for display formatting (labels, tooltips)

### Key Principles

1. **Decimal as source of truth** - Always calculate in Decimal.js first, derive numbers from Decimals
2. **Dual storage** - Every physics value stored as both `value: number` and `valueDecimal: Decimal`
3. **Separation of concerns** - Use numbers for rendering coordinates/scales, Decimals for user-facing text
4. **No precision recovery** - Never call `ensure()` on a number that came from a Decimal

### Scope

All physics values in visualization data structures: velocities, times, distances, gamma, rapidity, mass fractions, etc.

## Data Structure Changes

### Core Chart Data Types

**File:** `src/charts/dataGeneration.ts`

```typescript
// Before
export type ChartDataPoint = { x: number; y: number };
export type ChartDataPointWithVelocity = { x: number; y: number; velocity: number };

// After
export type ChartDataPoint = {
    x: number;
    y: number;
    xDecimal: Decimal;
    yDecimal: Decimal;
};

export type ChartDataPointWithVelocity = {
    x: number;
    y: number;
    velocity: number;
    xDecimal: Decimal;
    yDecimal: Decimal;
    velocityDecimal: Decimal;
};
```

### Minkowski Diagram Data

**File:** `src/charts/minkowski-types.ts`

```typescript
// Before
export interface MinkowskiData {
    time: number;
    distance: number;
    velocity: number;
    deltaTPrime: number;
    deltaXPrime: number;
}

// After
export interface MinkowskiData {
    time: number;
    distance: number;
    velocity: number;
    deltaTPrime: number;
    deltaXPrime: number;
    // Decimal versions for display
    timeDecimal: Decimal;
    distanceDecimal: Decimal;
    velocityDecimal: Decimal;
    deltaTPrimeDecimal: Decimal;
    deltaXPrimeDecimal: Decimal;
}
```

### Twin Paradox Data

**File:** `src/charts/minkowski-twins.ts`

```typescript
// Before
export interface TwinParadoxMinkowskiData {
    velocityC: number;
    properTimeYears: number;
    earthTimeYears: number;
    distanceLY: number;
    gamma: number;
}

// After
export interface TwinParadoxMinkowskiData {
    velocityC: number;
    properTimeYears: number;
    earthTimeYears: number;
    distanceLY: number;
    gamma: number;
    // Decimal versions for display
    velocityCDecimal: Decimal;
    properTimeYearsDecimal: Decimal;
    earthTimeYearsDecimal: Decimal;
    distanceLYDecimal: Decimal;
    gammaDecimal: Decimal;
}
```

### Simultaneity Event Data

**File:** `src/charts/simultaneityState.ts`

```typescript
// Before
export interface SimultaneityEventData {
    ct: number;
    x: number;
}

// After
export interface SimultaneityEventData {
    ct: number;
    x: number;
    ctDecimal: Decimal;
    xDecimal: Decimal;
}
```

## Data Generation Pattern

### Standard Pattern

Calculate in Decimal first, store Decimal, derive number using `.toNumber()`:

```typescript
// Before
const velocity = rl.relativisticVelocity(accel, tau);
const velocityC = parseFloat(velocity.div(rl.c).toString());

properTimeVelocity.push({ x: tauDays, y: velocityC });

// After
const velocity = rl.relativisticVelocity(accel, tau);
const velocityCDecimal = velocity.div(rl.c);
const velocityC = velocityCDecimal.toNumber();

const tauDaysDecimal = rl.ensure(tau).div(rl.ensure(60 * 60 * 24));
const tauDays = tauDaysDecimal.toNumber();

properTimeVelocity.push({
    x: tauDays,
    y: velocityC,
    xDecimal: tauDaysDecimal,
    yDecimal: velocityCDecimal
});
```

### Key Changes

- Every calculated value gets a `Decimal` variable first (with `Decimal` suffix)
- Number is derived using `.toNumber()` (clearer than `parseFloat(.toString())`)
- Both versions pushed into data structures
- No precision loss, no precision recovery attempts

## Display Formatting

### D3/Chart.js Rendering - No Changes

D3 and Chart.js continue to use the number properties for scales, positions, and rendering:

```typescript
// Existing D3 code continues to work unchanged
xScale.domain([0, d3.max(data, d => d.x)]);
svg.selectAll('circle')
    .data(data)
    .attr('cx', d => xScale(d.x))
    .attr('cy', d => yScale(d.y));
```

### Label Formatting - Use Decimal Properties

Replace all `rl.formatSignificant(rl.ensure(numberValue), ...)` with `rl.formatSignificant(decimalValue, ...)`:

```typescript
// Before
.text(d => `Moving frame ${rl.formatSignificant(rl.ensure(d.beta), "9", 2)}c`)
.text(`γ = ${rl.formatSignificant(rl.ensure(data.gamma), "0", 3)}`)
.text(`v = ${rl.formatSignificant(rl.ensure(state.velocity), "9", 2)}c`)

// After
.text(d => `Moving frame ${rl.formatSignificant(d.betaDecimal, "9", 2)}c`)
.text(`γ = ${rl.formatSignificant(data.gammaDecimal, "0", 3)}`)
.text(`v = ${rl.formatSignificant(state.velocityDecimal, "9", 2)}c`)
```

### Benefits

- No `rl.ensure()` wrapper needed - already have Decimals
- Full precision preserved from original calculation
- TypeScript enforces correct usage (will error if we pass a number)
- Cleaner, more readable code

## Migration Strategy

### Phase 1: Update Type Definitions

Update all data structure types to include Decimal properties:

- `src/charts/dataGeneration.ts` - `ChartDataPoint`, `ChartDataPointWithVelocity`
- `src/charts/minkowski-types.ts` - `MinkowskiData`
- `src/charts/minkowski-twins.ts` - `TwinParadoxMinkowskiData`
- `src/charts/simultaneityState.ts` - `SimultaneityEventData`

TypeScript errors will appear everywhere these types are used - this guides the migration.

### Phase 2: Update Data Generation

Update all data generation functions to populate Decimal properties:

- `generateAccelChartData()` in `dataGeneration.ts`
- `generateFlipBurnChartData()` in `dataGeneration.ts`
- `generateVisualizationChartData()` in `dataGeneration.ts`
- `generateTwinParadoxChartData()` in `dataGeneration.ts`

Pattern: For each value, create `valueDecimal` first, then derive `value` using `.toNumber()`.

### Phase 3: Update Display Code

Update all label/tooltip formatting to use Decimal properties:

- `src/charts/minkowski.ts` - velocity labels (4 locations)
- `src/charts/simultaneity.ts` - velocity and separation labels (5+ locations)
- `src/charts/minkowski-twins.ts` - velocity, gamma, time labels
- Any other tooltips or display elements

Replace `rl.formatSignificant(rl.ensure(value), ...)` with `rl.formatSignificant(valueDecimal, ...)`.

### Phase 4: Verification

- TypeScript compilation with no errors
- Visual inspection of labels showing proper precision (e.g., "0.9999c" not "1.00c")
- Dev server runs without errors
- Test high-velocity scenarios (>0.99c) to verify precision display

## Files Affected

### Type Definitions
- `src/charts/dataGeneration.ts`
- `src/charts/minkowski-types.ts`
- `src/charts/minkowski-twins.ts`
- `src/charts/simultaneityState.ts`

### Data Generation
- `src/charts/dataGeneration.ts` (all generation functions)

### Display/Rendering
- `src/charts/minkowski.ts`
- `src/charts/simultaneity.ts`
- `src/charts/minkowski-twins.ts`

### Possibly Affected
- `src/ui/eventHandlers.ts` (verify - may already use Decimals correctly)

## Success Criteria

1. **Type Safety** - All TypeScript compilation errors resolved
2. **Precision Preserved** - Velocities like 0.999999c display with full precision, not rounded to 1.00c
3. **No Breaking Changes** - D3/Chart.js rendering continues to work unchanged
4. **Cleaner Code** - No more `rl.ensure()` calls in display formatting
5. **Performance** - No noticeable performance impact (Decimal storage is negligible)

## Trade-offs Considered

### Memory Usage
- **Impact:** Storing both number and Decimal increases memory per data point
- **Assessment:** Negligible - chart data is typically hundreds of points, Decimal overhead is small
- **Decision:** Acceptable for precision benefits

### Code Complexity
- **Impact:** More properties to manage in data structures
- **Assessment:** Offset by clearer intent and removal of `ensure()` calls
- **Decision:** Net improvement in clarity

### Migration Effort
- **Impact:** Requires touching multiple files in data generation and display layers
- **Assessment:** TypeScript guides the migration, low risk of missing spots
- **Decision:** One-time cost for long-term benefits

## Future Considerations

- Consider adding utility functions if formatting patterns become repetitive
- May want to extend this pattern to other numeric values in the future
- Could create a generic `DecimalValue<T>` type if pattern spreads beyond charts
