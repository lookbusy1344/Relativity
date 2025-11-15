# Refactoring main.ts - Design Document

Date: 2025-11-15

## Overview

Refactor the 1117-line main.ts into logical modules to reduce duplication, improve testability, and organize code by concern.

## Goals

1. **Reduce duplication (DRY)** - Extract repeated Chart.js configuration, styling, and lifecycle patterns
2. **Logical separation** - Organize by feature area (chart management, event handlers, DOM utils)
3. **Testability** - Isolate business logic from DOM manipulation to enable unit testing

## Module Structure

### src/ui/domUtils.ts
- DOM element selection and caching
- `setElement()` utility for displaying results with units
- Type-safe element getters that handle null checks
- Minimal interface - keeps DOM concerns isolated

**Key functions:**
```typescript
export function setElement(e: HTMLElement, value: string, units: string): void
export function getInputElement(id: string): HTMLInputElement | null
export function getCanvasElement(id: string): HTMLCanvasElement | null
export function getResultElement(id: string): HTMLElement | null
export function getButtonElement(id: string): HTMLElement | null
```

### src/charts/dataGeneration.ts
- Pure functions: physics parameters → chart-ready data points
- Converts Decimal calculations to parseFloat for Chart.js compatibility
- Zero DOM interaction - fully testable
- Functions for each chart type: accel, flip-burn, visualization

**Key functions:**
```typescript
type ChartDataPoint = { x: number; y: number };

export function generateAccelChartData(accelG: number, durationDays: number): {
  properTimeVelocity: ChartDataPoint[];
  coordTimeVelocity: ChartDataPoint[];
  properTimeRapidity: ChartDataPoint[];
  coordTimeRapidity: ChartDataPoint[];
  properTimeTimeDilation: ChartDataPoint[];
  coordTimeTimeDilation: ChartDataPoint[];
}

export function generateFlipBurnChartData(distanceLightYears: number): {
  properTimeVelocity: ChartDataPoint[];
  coordTimeVelocity: ChartDataPoint[];
  properTimeRapidity: ChartDataPoint[];
  coordTimeRapidity: ChartDataPoint[];
  properTimeLorentz: ChartDataPoint[];
  coordTimeLorentz: ChartDataPoint[];
}

export function generateVisualizationChartData(accelG: number, durationDays: number): {
  velocityC: ChartDataPoint[];
  distanceLy: ChartDataPoint[];
  rapidity: ChartDataPoint[];
  timeDilation: ChartDataPoint[];
}
```

### src/charts/charts.ts
- Chart.js configuration factory functions - DRYs up repeated styling
- Functional chart lifecycle management with immutable Map transformations
- Higher-order functions for updating chart families (accel, flip-burn, visualization)

**Key types and functions:**
```typescript
type ChartRegistry = Map<string, Chart>;

type ChartStyleConfig = {
  primaryColor: string;
  secondaryColor: string;
  xAxisLabel: string;
  yAxisLabel: string;
  yMax?: number;
};

function createChartOptions(config: ChartStyleConfig): ChartOptions

export function updateChart(
  registry: ChartRegistry,
  canvasId: string,
  datasets: Dataset[],
  config: ChartStyleConfig
): ChartRegistry

export function updateAccelCharts(
  registry: ChartRegistry,
  data: ReturnType<typeof generateAccelChartData>
): ChartRegistry

export function updateFlipBurnCharts(
  registry: ChartRegistry,
  data: ReturnType<typeof generateFlipBurnChartData>
): ChartRegistry

export function updateVisualizationCharts(
  registry: ChartRegistry,
  data: ReturnType<typeof generateVisualizationChartData>
): ChartRegistry

export function destroyAll(registry: ChartRegistry): ChartRegistry
```

### src/ui/eventHandlers.ts
- Event handler factory functions
- Coordinate between DOM, physics library, data generation, and chart updates
- Keep handlers thin - delegate to pure functions where possible

**Pattern:**
```typescript
export function createLorentzHandler(
  getInput: () => HTMLInputElement | null,
  getResult: () => HTMLElement | null
): () => void

export function createAccelHandler(
  getInput: () => HTMLInputElement | null,
  getResults: () => HTMLElement[],
  chartRegistry: { current: ChartRegistry }
): () => void

// Similar factories for flip-burn, velocity addition, etc.
```

### src/main.ts (slimmed)
- DOMContentLoaded initialization (~50 lines)
- Wires modules together
- Creates handlers and attaches to DOM events
- Initializes default chart state

## Implementation Strategy

1. Create new module files with extracted code
2. Keep main.ts working throughout - incremental refactoring
3. Test after each module extraction
4. Maintain functional style with immutable data structures where possible

## Benefits

- **From 1117 lines → ~50 lines** in main.ts
- **Testability**: Pure functions in dataGeneration.ts can be unit tested
- **DRY**: Chart configuration defined once, reused 10+ times
- **Maintainability**: Clear separation of concerns - DOM, physics, charts, events
- **Functional style**: Immutable Map transformations for chart registry, pure data generation

## Trade-offs

- More files to navigate (5 modules vs 1 file)
- Slightly more boilerplate for handler factories
- ChartRegistry threading through updates (functional style over mutable class)

The benefits in testability, clarity, and maintainability outweigh the navigation overhead.
