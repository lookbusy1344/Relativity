# Twin Paradox Minkowski Diagram Design

**Date:** 2025-11-25
**Status:** Approved

## Overview

Replace the basic Chart.js spacetime worldline on the Twin Paradox tab with a comprehensive Minkowski diagram using D3.js. The diagram will show dual reference frames (outbound and inbound), light cones at key events, and simultaneity lines to illustrate the resolution of the twin paradox.

## Architecture

### Module Structure

Refactor existing Minkowski code into three modules:

**minkowski-core.ts** - Shared D3 infrastructure:
- Scale calculation and coordinate transformations
- SVG setup and layer management
- Axis rendering (standard and Lorentz-transformed)
- Grid rendering
- Light cone rendering
- Tooltip system
- Common types and utilities

**minkowski-single.ts** - Spacetime tab (refactored existing):
- Single moving frame visualization
- Event point plotting
- Interval visualization
- Current controller interface

**minkowski-twins.ts** - Twin Paradox tab (new):
- V-shaped worldline rendering
- Dual moving frame axes
- Light cones at departure, turnaround, arrival
- Simultaneity lines with frame jump visualization

## Physics Model

### Key Events

1. **Departure** (ct=0, x=0): Both twins at origin
2. **Turnaround** (ct=γτ/2, x=vγτ/2): Traveling twin reaches maximum distance
3. **Arrival** (ct=γτ, x=0): Traveling twin returns to origin

Where:
- τ = proper time (traveling twin's clock)
- v = velocity as fraction of c
- γ = Lorentz factor = 1/√(1-v²)

### Reference Frames

Three coordinate systems displayed:

1. **Earth frame** (ct, x): Stationary frame, cyan axes
2. **Outbound frame** (ct₁', x₁'): Moving at +v, green axes
3. **Inbound frame** (ct₂', x₂'): Moving at -v, amber axes

## Visual Design

### Worldlines

- **Earth twin**: Vertical line from (0,0) to (0, γτ) in cyan (#00d9ff)
- **Traveling twin**: V-shaped path in white (#e8f1f5)
  - Outbound segment: slope = v
  - Inbound segment: slope = -v
  - Sharp corner at turnaround event

### Light Cones

Rendered at key events as 45° diagonals (dashed amber lines):
- Departure: Future light cone
- Turnaround: Past and future light cones
- Arrival: Past light cone

### Simultaneity Lines

Lines showing "now" in each reference frame:

- **Earth frame**: Horizontal lines (constant ct) in cyan
- **Outbound frame**: Lines parallel to x₁' axis in green
- **Inbound frame**: Lines parallel to x₂' axis in amber

### Simultaneity Jump

At turnaround, visualize the discontinuity in traveling twin's simultaneity:
- Show both outbound and inbound simultaneity lines meeting at turnaround
- Highlight the jump with annotation
- Display Δct_jump = 2γβ²τ/2

## Implementation

### Core Module API

```typescript
// Scale & Transform
export function createScaleSet(maxCoord: number, size: number): ScaleSet;
export function lorentzTransform(ct: number, x: number, beta: number):
    { ctPrime: number; xPrime: number };
export function calculateGamma(beta: number): number;

// SVG Setup
export function setupSVG(container: HTMLElement, size?: number):
    Selection<SVGSVGElement>;
export function createLayerGroups(svg: Selection<SVGSVGElement>): LayerGroups;

// Rendering
export function renderStandardAxes(group: Selection, scales: ScaleSet,
    labels: AxisLabels): void;
export function renderTransformedAxes(group: Selection, scales: ScaleSet,
    beta: number, labels: AxisLabels, color: string): void;
export function renderLightCone(group: Selection, scales: ScaleSet,
    ct: number, x: number, extent: number): void;
export function renderGrid(group: Selection, scales: ScaleSet,
    maxCoord: number): void;

// Tooltip
export function createTooltip(container: HTMLElement): TooltipController;
```

### Twin Paradox Input Data

```typescript
interface TwinParadoxMinkowskiInput {
    velocityC: number;        // Velocity as fraction of c
    properTimeYears: number;  // Proper time in years
    earthTimeYears: number;   // Coordinate time in years
    distanceLY: number;       // One-way distance in light years
    gamma: number;            // Lorentz factor
}
```

### Controller Interface

Both implementations return:

```typescript
interface MinkowskiController {
    update(data: MinkowskiData): void;
    destroy(): void;
    resize(): void;
}
```

## Integration Points

### Event Handlers (eventHandlers.ts)

Update `createTwinParadoxHandler` to:
1. Calculate Minkowski data from physics results
2. Call `drawTwinParadoxMinkowski` instead of Chart.js update
3. Store controller for cleanup and updates

### Main (main.ts)

1. Import `drawTwinParadoxMinkowski` from minkowski-twins
2. Add controller storage similar to existing Minkowski state
3. Wire up initialization and resize handlers

### HTML (index.html)

Replace:
```html
<canvas id="twinsSpacetimeChart"></canvas>
```

With:
```html
<div id="twinsMinkowskiContainer"></div>
```

### Cleanup

Remove obsolete Chart.js code:
- Remove `twinsSpacetimeChart` rendering from charts.ts
- Remove spacetime worldline data generation from dataGeneration.ts
- Update chart registry

## Color Palette

Consistent with existing design:
- Cyan (#00d9ff): Earth frame, primary elements
- Green (#00ff9f): Outbound frame
- Amber (#ffaa00): Inbound frame, light cones
- White (#e8f1f5): Worldlines, text
- Dark backgrounds: rgba(0,0,0,0.3-0.6)

## Responsive Design

- SVG scales to container width
- Debounced resize handler (250ms)
- Maintains aspect ratio
- Touch-friendly on mobile

## Success Criteria

1. Minkowski diagram renders on Twin Paradox tab
2. Shows all three reference frames with proper Lorentz transformations
3. Displays light cones at key events
4. Simultaneity lines illustrate frame-dependent "now"
5. Visualizes simultaneity jump at turnaround
6. Existing Spacetime tab continues working unchanged
7. Responsive across all viewport sizes
8. No performance degradation
