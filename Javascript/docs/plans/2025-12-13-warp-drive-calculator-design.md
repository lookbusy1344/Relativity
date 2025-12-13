# Warp Drive Time Travel Calculator - Design Document

**Date:** 2025-12-13
**Feature:** Add FTL time travel calculator to Calc tab
**Reference:** Based on equations in `../Python/ftl_lib.py`

## Overview

Add an interactive calculator demonstrating how FTL travel combined with relativistic boost creates time travel paradoxes through the relativity of simultaneity.

## UI Design

### Location
- Calc tab (conversions tab in index.html)
- Positioned at the top (most novel calculator)
- Before existing Lorentz calculator section

### Input Fields
1. **Distance (light-minutes)**
   - Type: number input
   - Default: 30 (roughly Earth-Mars distance)
   - Range: 0.01 to large values
   - Step: 0.01

2. **Boost velocity (fraction of c)**
   - Type: number input
   - Default: 0.9
   - Range: 0.001 to 0.999
   - Step: 0.01

3. **FTL transit time (minutes)**
   - Type: number input
   - Default: 0 (instantaneous warp)
   - Min: 0
   - Step: 0.1

### Output Display (result-grid)
1. **Time displacement** - Primary result showing "X.X minutes into the past/future"
2. **Simultaneity shift** - The core relativistic effect (light-minutes)
3. **Earth time elapsed** - Total coordinate time (minutes)
4. **Traveler proper time** - Time experienced by traveler (minutes)

### Educational Link
- Link to `../Python/FTL Travel.ipynb` for detailed explanation
- Positioned next to calculator title

## Implementation

### TypeScript Interface
```typescript
export interface IWarpDriveTimeTravel {
    timeDisplacement: Decimal;      // net time travel in seconds (negative = past)
    simultaneityShift: Decimal;      // relativistic effect in seconds
    earthTimeElapsed: Decimal;       // coordinate time in seconds
    travelerTime: Decimal;           // proper time in seconds
}
```

### Core Function
```typescript
warpDriveTimeTravel(
    distanceMeters: NumberInput,     // distance in metres
    boostVelocityC: NumberInput,     // velocity as fraction of c (0-1)
    transitTimeSeconds: NumberInput  // warp time in seconds
): IWarpDriveTimeTravel
```

### Physics Implementation (SI Units)
- **Simultaneity shift:** `Δt = (v × d) / c²`
  - v: boost velocity (m/s) = boostVelocityC × c
  - d: distance (metres)
  - c: speed of light

- **Lorentz factor:** `γ = 1 / sqrt(1 - v²/c²)`
  - Used for time dilation during boost phase

- **Time displacement:** `displacement = transitTime - simultaneityShift`

- **Earth time:** Sum of all phases in Earth frame
  - Outbound warp time
  - Boost duration (time-dilated)
  - Return warp time

- **Traveler time:** Proper time experienced
  - Outbound + boost duration + return

All calculations use Decimal.js for precision (no float arithmetic).

### Unit Conversions (UI Layer)
**Inputs:**
- Light-minutes → metres: multiply by (c × 60)
- Minutes → seconds: multiply by 60
- Velocity already in fraction of c (no conversion)

**Outputs:**
- Seconds → minutes: divide by 60
- Format with appropriate precision using `formatSignificant()`
- Add descriptive text: "X minutes into the past" or "into the future"

## File Modifications

### 1. index.html
- Insert new `calc-section` after line 506 (start of Calc tab)
- Follow existing patterns: `input-group-custom`, `result-grid`
- IDs: `warpDistanceInput`, `warpBoostInput`, `warpTransitInput`, `warpButton`
- Result IDs: `resultWarpDisplacement`, `resultWarpSimultaneity`, `resultWarpEarthTime`, `resultWarpTravelerTime`

### 2. src/relativity_lib.ts
- Add `IWarpDriveTimeTravel` interface
- Add `warpDriveTimeTravel()` function
- Place near twin paradox calculations
- Export both interface and function

### 3. src/ui/domUtils.ts
- Add getters for all input elements
- Add getters for all result elements
- Follow existing naming conventions

### 4. src/ui/eventHandlers.ts
- Add `createWarpDriveHandler()` factory function
- Read inputs, convert to SI units
- Call `warpDriveTimeTravel()`
- Convert results to minutes
- Format and display results
- Handle edge cases (invalid inputs)

### 5. src/main.ts
- Import and wire up `createWarpDriveHandler()`
- Add to initialization after other calculator handlers

### 6. src/urlState.ts (Optional)
- Add URL parameters: `warpDist`, `warpBoost`, `warpTransit`
- Enable deep linking for sharing calculations
- Follow existing parameter patterns

## Testing Approach

### Manual Verification Examples
1. **30 light-minutes, 0.9c boost, instant warp**
   - Should show ~27 minutes into the past

2. **Zero velocity (0c boost)**
   - Should show zero time displacement

3. **Slow warp negates time travel**
   - Large transit time should reduce or reverse displacement

### Edge Cases
- Velocity at extremes (0.001c, 0.999c)
- Very small distances
- Very large transit times
- Zero distance

## Success Criteria
- Calculator displays correct time displacement matching Python implementation
- All outputs use proper unit conversions
- Precision maintained through Decimal.js
- UI matches existing calculator aesthetics
- Link to Jupyter notebook works
- Results are intuitive and educational
