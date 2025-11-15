# Refactor main.ts Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor the 1117-line main.ts into 5 focused modules to eliminate duplication and improve testability.

**Architecture:** Extract DOM utilities, pure data generation functions, functional chart management, and event handler factories. Main.ts becomes thin initialization glue (~50 lines).

**Tech Stack:** TypeScript, Chart.js, Decimal.js, Vite

---

## Task 1: Create DOM Utilities Module

**Files:**
- Create: `src/ui/domUtils.ts`

**Step 1: Create directory structure**

```bash
mkdir -p src/ui
```

**Step 2: Create domUtils.ts with element getters**

File: `src/ui/domUtils.ts`

```typescript
/**
 * DOM utility functions for type-safe element access and result display
 */

export function setElement(e: HTMLElement, value: string, units: string): void {
    if (units === "" || value === "-") {
        // no units
        e.textContent = value;
        e.setAttribute('title', value);
    } else {
        // units specified - display value with units
        e.textContent = `${value} ${units}`;
        e.setAttribute('title', `${value} ${units}`);
    }
}

export function getInputElement(id: string): HTMLInputElement | null {
    return document.getElementById(id) as HTMLInputElement | null;
}

export function getCanvasElement(id: string): HTMLCanvasElement | null {
    return document.getElementById(id) as HTMLCanvasElement | null;
}

export function getResultElement(id: string): HTMLElement | null {
    return document.getElementById(id);
}

export function getButtonElement(id: string): HTMLElement | null {
    return document.getElementById(id);
}
```

**Step 3: Verify TypeScript compilation**

Run: `yarn type-check`
Expected: No errors

**Step 4: Commit**

```bash
git add src/ui/domUtils.ts
git commit -m "feat: add DOM utilities module"
```

---

## Task 2: Create Data Generation Module

**Files:**
- Create: `src/charts/dataGeneration.ts`

**Step 1: Create charts directory**

```bash
mkdir -p src/charts
```

**Step 2: Create dataGeneration.ts with types and acceleration data function**

File: `src/charts/dataGeneration.ts`

```typescript
/**
 * Pure functions for generating chart-ready data from physics calculations
 * Converts Decimal.js results to numbers for Chart.js compatibility
 */

import * as rl from '../relativity_lib';

export type ChartDataPoint = { x: number; y: number };

export function generateAccelChartData(
    accelG: number,
    durationDays: number
): {
    properTimeVelocity: ChartDataPoint[];
    coordTimeVelocity: ChartDataPoint[];
    properTimeRapidity: ChartDataPoint[];
    coordTimeRapidity: ChartDataPoint[];
    properTimeTimeDilation: ChartDataPoint[];
    coordTimeTimeDilation: ChartDataPoint[];
} {
    const accel = rl.g.mul(accelG);
    const durationSeconds = durationDays * 60 * 60 * 24;
    const numPoints = 100;

    const properTimeVelocity: ChartDataPoint[] = [];
    const coordTimeVelocity: ChartDataPoint[] = [];
    const properTimeRapidity: ChartDataPoint[] = [];
    const coordTimeRapidity: ChartDataPoint[] = [];
    const properTimeTimeDilation: ChartDataPoint[] = [];
    const coordTimeTimeDilation: ChartDataPoint[] = [];

    for (let i = 0; i <= numPoints; i++) {
        const tau = (i / numPoints) * durationSeconds;
        const tauDays = tau / (60 * 60 * 24);

        const velocity = rl.relativisticVelocity(accel, tau);
        const velocityC = parseFloat(velocity.div(rl.c).toString());
        const rapidity = rl.rapidityFromVelocity(velocity);
        const rapidityValue = parseFloat(rapidity.toString());
        const lorentz = rl.lorentzFactor(velocity);
        const timeDilation = parseFloat(rl.one.div(lorentz).toString());

        const t = rl.coordinateTime(accel, tau);
        const tDays = parseFloat(t.div(rl.ensure(60 * 60 * 24)).toString());

        properTimeVelocity.push({ x: tauDays, y: velocityC });
        coordTimeVelocity.push({ x: tDays, y: velocityC });
        properTimeRapidity.push({ x: tauDays, y: rapidityValue });
        coordTimeRapidity.push({ x: tDays, y: rapidityValue });
        properTimeTimeDilation.push({ x: tauDays, y: timeDilation });
        coordTimeTimeDilation.push({ x: tDays, y: timeDilation });
    }

    return {
        properTimeVelocity,
        coordTimeVelocity,
        properTimeRapidity,
        coordTimeRapidity,
        properTimeTimeDilation,
        coordTimeTimeDilation
    };
}
```

**Step 3: Add flip-and-burn data generation**

Add to `src/charts/dataGeneration.ts`:

```typescript
export function generateFlipBurnChartData(
    distanceLightYears: number
): {
    properTimeVelocity: ChartDataPoint[];
    coordTimeVelocity: ChartDataPoint[];
    properTimeRapidity: ChartDataPoint[];
    coordTimeRapidity: ChartDataPoint[];
    properTimeLorentz: ChartDataPoint[];
    coordTimeLorentz: ChartDataPoint[];
} {
    const m = rl.ensure(distanceLightYears).mul(rl.lightYear);
    const res = rl.flipAndBurn(rl.g, m);
    const halfProperTimeSeconds = res.properTime.div(2);
    const numPointsPerPhase = 50;

    const properTimeVelocity: ChartDataPoint[] = [];
    const coordTimeVelocity: ChartDataPoint[] = [];
    const properTimeRapidity: ChartDataPoint[] = [];
    const coordTimeRapidity: ChartDataPoint[] = [];
    const properTimeLorentz: ChartDataPoint[] = [];
    const coordTimeLorentz: ChartDataPoint[] = [];

    // Acceleration phase (0 to half proper time)
    for (let i = 0; i <= numPointsPerPhase; i++) {
        const tau = halfProperTimeSeconds.mul(i / numPointsPerPhase);
        const tauYears = parseFloat(tau.div(rl.secondsPerYear).toString());

        const velocity = rl.relativisticVelocity(rl.g, tau);
        const velocityC = parseFloat(velocity.div(rl.c).toString());
        const rapidity = rl.rapidityFromVelocity(velocity);
        const rapidityValue = parseFloat(rapidity.toString());
        const lorentz = rl.lorentzFactor(velocity);
        const timeDilation = parseFloat(rl.one.div(lorentz).toString());

        properTimeVelocity.push({ x: tauYears, y: velocityC });

        const t = rl.coordinateTime(rl.g, tau);
        const tYears = parseFloat(t.div(rl.secondsPerYear).toString());
        coordTimeVelocity.push({ x: tYears, y: velocityC });

        properTimeRapidity.push({ x: tauYears, y: rapidityValue });
        coordTimeRapidity.push({ x: tYears, y: rapidityValue });
        properTimeLorentz.push({ x: tauYears, y: timeDilation });
        coordTimeLorentz.push({ x: tYears, y: timeDilation });
    }

    // Deceleration phase - mirror the acceleration phase
    for (let i = numPointsPerPhase - 1; i >= 0; i--) {
        const tauAccel = halfProperTimeSeconds.mul(i / numPointsPerPhase);
        const tauDecel = res.properTime.sub(tauAccel);
        const tauYears = parseFloat(tauDecel.div(rl.secondsPerYear).toString());

        const velocity = rl.relativisticVelocity(rl.g, tauAccel);
        const velocityC = parseFloat(velocity.div(rl.c).toString());
        const rapidity = rl.rapidityFromVelocity(velocity);
        const rapidityValue = parseFloat(rapidity.toString());
        const lorentz = rl.lorentzFactor(velocity);
        const timeDilation = parseFloat(rl.one.div(lorentz).toString());

        properTimeVelocity.push({ x: tauYears, y: velocityC });

        const tAccel = rl.coordinateTime(rl.g, tauAccel);
        const tDecel = res.coordTime.sub(tAccel);
        const tYears = parseFloat(tDecel.div(rl.secondsPerYear).toString());
        coordTimeVelocity.push({ x: tYears, y: velocityC });

        properTimeRapidity.push({ x: tauYears, y: rapidityValue });
        coordTimeRapidity.push({ x: tYears, y: rapidityValue });
        properTimeLorentz.push({ x: tauYears, y: timeDilation });
        coordTimeLorentz.push({ x: tYears, y: timeDilation });
    }

    return {
        properTimeVelocity,
        coordTimeVelocity,
        properTimeRapidity,
        coordTimeRapidity,
        properTimeLorentz,
        coordTimeLorentz
    };
}
```

**Step 4: Add visualization data generation**

Add to `src/charts/dataGeneration.ts`:

```typescript
export function generateVisualizationChartData(
    accelG: number,
    durationDays: number
): {
    timePoints: number[];
    velocityC: number[];
    distanceLy: number[];
    rapidity: number[];
    timeDilation: number[];
} {
    const accel = rl.g.mul(accelG);
    const durationSeconds = durationDays * 60 * 60 * 24;
    const numPoints = 100;

    const timePoints: number[] = [];
    const velocityC: number[] = [];
    const distanceLy: number[] = [];
    const rapidity: number[] = [];
    const timeDilation: number[] = [];

    for (let i = 0; i <= numPoints; i++) {
        const tau = (i / numPoints) * durationSeconds;
        const timeDays = tau / (60 * 60 * 24);

        const velocity = rl.relativisticVelocity(accel, tau);
        const velocityCValue = parseFloat(velocity.div(rl.c).toString());
        const distance = rl.relativisticDistance(accel, tau);
        const distanceLyValue = parseFloat(distance.div(rl.lightYear).toString());
        const rapidityValue = parseFloat(rl.rapidityFromVelocity(velocity).toString());
        const lorentz = rl.lorentzFactor(velocity);
        const timeDilationValue = parseFloat(rl.one.div(lorentz).toString());

        timePoints.push(timeDays);
        velocityC.push(velocityCValue);
        distanceLy.push(distanceLyValue);
        rapidity.push(rapidityValue);
        timeDilation.push(timeDilationValue);
    }

    return {
        timePoints,
        velocityC,
        distanceLy,
        rapidity,
        timeDilation
    };
}
```

**Step 5: Verify TypeScript compilation**

Run: `yarn type-check`
Expected: No errors

**Step 6: Commit**

```bash
git add src/charts/dataGeneration.ts
git commit -m "feat: add chart data generation module"
```

---

## Task 3: Create Chart Management Module

**Files:**
- Create: `src/charts/charts.ts`

**Step 1: Create charts.ts with types and config factory**

File: `src/charts/charts.ts`

```typescript
/**
 * Functional chart management with Chart.js
 * Provides configuration factories and lifecycle management
 */

import { Chart, ChartConfiguration, ChartOptions } from 'chart.js';
import type { ChartDataPoint } from './dataGeneration';

export type ChartRegistry = Map<string, Chart>;

export type ChartStyleConfig = {
    primaryColor: string;
    secondaryColor: string;
    xAxisLabel: string;
    yAxisLabel: string;
    yMax?: number;
    yMin?: number;
    y1AxisLabel?: string;
    y1Max?: number;
};

function createChartOptions(config: ChartStyleConfig): ChartOptions {
    const baseOptions: ChartOptions = {
        responsive: true,
        plugins: {
            legend: {
                display: true,
                labels: {
                    color: '#e8f1f5',
                    font: { family: 'IBM Plex Mono', size: 12 }
                }
            },
            title: { display: false }
        },
        scales: {
            x: {
                type: 'linear',
                title: {
                    display: true,
                    text: config.xAxisLabel,
                    color: '#00d9ff',
                    font: { family: 'IBM Plex Mono', size: 11, weight: '600' }
                },
                ticks: {
                    maxTicksLimit: 10,
                    color: '#e8f1f5',
                    font: { family: 'IBM Plex Mono' }
                },
                grid: {
                    color: 'rgba(0, 217, 255, 0.15)'
                }
            },
            y: {
                title: {
                    display: true,
                    text: config.yAxisLabel,
                    color: '#00d9ff',
                    font: { family: 'IBM Plex Mono', size: 11, weight: '600' }
                },
                beginAtZero: config.yMin === undefined,
                max: config.yMax,
                min: config.yMin,
                ticks: {
                    color: '#e8f1f5',
                    font: { family: 'IBM Plex Mono' }
                },
                grid: {
                    color: 'rgba(0, 217, 255, 0.15)'
                }
            }
        }
    };

    // Add second y-axis if configured
    if (config.y1AxisLabel && baseOptions.scales) {
        baseOptions.scales.y1 = {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
                display: true,
                text: config.y1AxisLabel,
                color: '#00d9ff',
                font: { family: 'IBM Plex Mono', size: 11, weight: '600' }
            },
            beginAtZero: true,
            max: config.y1Max,
            ticks: {
                color: '#e8f1f5',
                font: { family: 'IBM Plex Mono' }
            },
            grid: {
                drawOnChartArea: false
            }
        };
    }

    return baseOptions;
}
```

**Step 2: Add chart lifecycle functions**

Add to `src/charts/charts.ts`:

```typescript
export function updateChart(
    registry: ChartRegistry,
    canvasId: string,
    datasets: any[],
    config: ChartStyleConfig
): ChartRegistry {
    const newRegistry = new Map(registry);

    // Destroy old chart if exists
    newRegistry.get(canvasId)?.destroy();

    // Create new chart
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
        const chart = new Chart(ctx, {
            type: 'line',
            data: { datasets },
            options: createChartOptions(config)
        });
        newRegistry.set(canvasId, chart);
    }

    return newRegistry;
}

export function destroyAll(registry: ChartRegistry): ChartRegistry {
    registry.forEach(chart => chart.destroy());
    return new Map();
}
```

**Step 3: Add acceleration charts update function**

Add to `src/charts/charts.ts`:

```typescript
import type { generateAccelChartData, generateFlipBurnChartData, generateVisualizationChartData } from './dataGeneration';

export function updateAccelCharts(
    registry: ChartRegistry,
    data: ReturnType<typeof generateAccelChartData>
): ChartRegistry {
    let newRegistry = registry;

    // Velocity Chart
    newRegistry = updateChart(
        newRegistry,
        'accelVelocityChart',
        [{
            label: 'Velocity vs Proper Time',
            data: data.properTimeVelocity,
            borderColor: '#00d9ff',
            backgroundColor: 'rgba(0, 217, 255, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0
        }, {
            label: 'Velocity vs Coordinate Time',
            data: data.coordTimeVelocity,
            borderColor: '#00ff9f',
            backgroundColor: 'rgba(0, 255, 159, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0
        }],
        {
            primaryColor: '#00d9ff',
            secondaryColor: '#00ff9f',
            xAxisLabel: 'Time (days)',
            yAxisLabel: 'Velocity (fraction of c)'
        }
    );

    // Lorentz/Time Dilation Chart
    newRegistry = updateChart(
        newRegistry,
        'accelLorentzChart',
        [{
            label: 'Time Dilation vs Proper Time (1/γ)',
            data: data.properTimeTimeDilation,
            borderColor: '#00d9ff',
            backgroundColor: 'rgba(0, 217, 255, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0
        }, {
            label: 'Time Dilation vs Coordinate Time (1/γ)',
            data: data.coordTimeTimeDilation,
            borderColor: '#00ff9f',
            backgroundColor: 'rgba(0, 255, 159, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0
        }],
        {
            primaryColor: '#00d9ff',
            secondaryColor: '#00ff9f',
            xAxisLabel: 'Time (days)',
            yAxisLabel: 'Time Rate (1 = normal)',
            yMax: 1
        }
    );

    // Rapidity Chart
    newRegistry = updateChart(
        newRegistry,
        'accelRapidityChart',
        [{
            label: 'Rapidity vs Proper Time',
            data: data.properTimeRapidity,
            borderColor: '#00d9ff',
            backgroundColor: 'rgba(0, 217, 255, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0
        }, {
            label: 'Rapidity vs Coordinate Time',
            data: data.coordTimeRapidity,
            borderColor: '#00ff9f',
            backgroundColor: 'rgba(0, 255, 159, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0
        }],
        {
            primaryColor: '#00d9ff',
            secondaryColor: '#00ff9f',
            xAxisLabel: 'Time (days)',
            yAxisLabel: 'Rapidity'
        }
    );

    return newRegistry;
}
```

**Step 4: Add flip-burn charts update function**

Add to `src/charts/charts.ts`:

```typescript
export function updateFlipBurnCharts(
    registry: ChartRegistry,
    data: ReturnType<typeof generateFlipBurnChartData>
): ChartRegistry {
    let newRegistry = registry;

    // Velocity Chart
    newRegistry = updateChart(
        newRegistry,
        'flipVelocityChart',
        [{
            label: 'Velocity vs Proper Time',
            data: data.properTimeVelocity,
            borderColor: '#00d9ff',
            backgroundColor: 'rgba(0, 217, 255, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0
        }, {
            label: 'Velocity vs Coordinate Time',
            data: data.coordTimeVelocity,
            borderColor: '#00ff9f',
            backgroundColor: 'rgba(0, 255, 159, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0
        }],
        {
            primaryColor: '#00d9ff',
            secondaryColor: '#00ff9f',
            xAxisLabel: 'Time (years)',
            yAxisLabel: 'Velocity (fraction of c)'
        }
    );

    // Time Dilation / Lorentz Chart
    newRegistry = updateChart(
        newRegistry,
        'flipLorentzChart',
        [{
            label: 'Time Dilation vs Proper Time (1/γ)',
            data: data.properTimeLorentz,
            borderColor: '#00d9ff',
            backgroundColor: 'rgba(0, 217, 255, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0
        }, {
            label: 'Time Dilation vs Coordinate Time (1/γ)',
            data: data.coordTimeLorentz,
            borderColor: '#00ff9f',
            backgroundColor: 'rgba(0, 255, 159, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0
        }],
        {
            primaryColor: '#00d9ff',
            secondaryColor: '#00ff9f',
            xAxisLabel: 'Time (years)',
            yAxisLabel: 'Time Rate (1 = normal)',
            yMax: 1
        }
    );

    // Rapidity Chart
    newRegistry = updateChart(
        newRegistry,
        'flipRapidityChart',
        [{
            label: 'Rapidity vs Proper Time',
            data: data.properTimeRapidity,
            borderColor: '#00d9ff',
            backgroundColor: 'rgba(0, 217, 255, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0
        }, {
            label: 'Rapidity vs Coordinate Time',
            data: data.coordTimeRapidity,
            borderColor: '#00ff9f',
            backgroundColor: 'rgba(0, 255, 159, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0
        }],
        {
            primaryColor: '#00d9ff',
            secondaryColor: '#00ff9f',
            xAxisLabel: 'Time (years)',
            yAxisLabel: 'Rapidity'
        }
    );

    return newRegistry;
}
```

**Step 5: Add visualization charts update function**

Add to `src/charts/charts.ts`:

```typescript
export function updateVisualizationCharts(
    registry: ChartRegistry,
    data: ReturnType<typeof generateVisualizationChartData>
): ChartRegistry {
    let newRegistry = registry;

    // Velocity Chart
    newRegistry = updateChart(
        newRegistry,
        'velocityChart',
        [{
            label: 'Velocity (fraction of c)',
            data: data.timePoints.map((x, i) => ({ x, y: data.velocityC[i] })),
            borderColor: '#00d9ff',
            backgroundColor: 'rgba(0, 217, 255, 0.15)',
            borderWidth: 2,
            fill: true,
            tension: 0.4
        }],
        {
            primaryColor: '#00d9ff',
            secondaryColor: '#00d9ff',
            xAxisLabel: 'Proper Time (days)',
            yAxisLabel: 'Velocity (c)',
            yMax: 1
        }
    );

    // Distance Chart
    newRegistry = updateChart(
        newRegistry,
        'distanceChart',
        [{
            label: 'Distance (light years)',
            data: data.timePoints.map((x, i) => ({ x, y: data.distanceLy[i] })),
            borderColor: '#00ff9f',
            backgroundColor: 'rgba(0, 255, 159, 0.15)',
            borderWidth: 2,
            fill: true,
            tension: 0.4
        }],
        {
            primaryColor: '#00d9ff',
            secondaryColor: '#00ff9f',
            xAxisLabel: 'Proper Time (days)',
            yAxisLabel: 'Distance (ly)'
        }
    );

    // Rapidity Chart
    newRegistry = updateChart(
        newRegistry,
        'rapidityChart',
        [{
            label: 'Rapidity',
            data: data.timePoints.map((x, i) => ({ x, y: data.rapidity[i] })),
            borderColor: '#ffaa00',
            backgroundColor: 'rgba(255, 170, 0, 0.15)',
            borderWidth: 2,
            fill: true,
            tension: 0.4
        }],
        {
            primaryColor: '#ffaa00',
            secondaryColor: '#ffaa00',
            xAxisLabel: 'Proper Time (days)',
            yAxisLabel: 'Rapidity'
        }
    );

    // Time Dilation & Length Contraction Chart
    const timeDilationData = data.timePoints.map((x, i) => ({ x, y: data.timeDilation[i] }));
    newRegistry = updateChart(
        newRegistry,
        'lorentzChart',
        [{
            label: 'Time Dilation (1/γ)',
            data: timeDilationData,
            borderColor: '#00ff9f',
            backgroundColor: 'rgba(0, 255, 159, 0.15)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            yAxisID: 'y'
        }, {
            label: 'Length Contraction (1/γ)',
            data: timeDilationData,
            borderColor: '#ffaa00',
            backgroundColor: 'rgba(255, 170, 0, 0.1)',
            borderWidth: 2,
            fill: false,
            tension: 0.4,
            borderDash: [5, 5],
            yAxisID: 'y1'
        }],
        {
            primaryColor: '#00d9ff',
            secondaryColor: '#00ff9f',
            xAxisLabel: 'Proper Time (days)',
            yAxisLabel: 'Time Rate (1 = normal)',
            yMax: 1,
            y1AxisLabel: 'Length (1 = no contraction)',
            y1Max: 1
        }
    );

    return newRegistry;
}
```

**Step 6: Verify TypeScript compilation**

Run: `yarn type-check`
Expected: No errors

**Step 7: Commit**

```bash
git add src/charts/charts.ts
git commit -m "feat: add chart management module"
```

---

## Task 4: Create Event Handlers Module

**Files:**
- Create: `src/ui/eventHandlers.ts`

**Step 1: Create eventHandlers.ts with simple handler factories**

File: `src/ui/eventHandlers.ts`

```typescript
/**
 * Event handler factory functions
 * Coordinate between DOM, physics, data generation, and charts
 */

import * as rl from '../relativity_lib';
import { setElement } from './domUtils';
import { generateAccelChartData, generateFlipBurnChartData, generateVisualizationChartData } from '../charts/dataGeneration';
import { updateAccelCharts, updateFlipBurnCharts, updateVisualizationCharts, type ChartRegistry } from '../charts/charts';

export function createLorentzHandler(
    getInput: () => HTMLInputElement | null,
    getResult: () => HTMLElement | null
): () => void {
    return () => {
        const input = getInput();
        const result = getResult();
        if (!input || !result) return;

        const vel = rl.checkVelocity(input.value ?? 0);
        const lorentz = rl.lorentzFactor(vel);
        setElement(result, rl.formatSignificant(lorentz, "0", 3), "");
    };
}

export function createRapidityFromVelocityHandler(
    getInput: () => HTMLInputElement | null,
    getResult: () => HTMLElement | null
): () => void {
    return () => {
        const input = getInput();
        const result = getResult();
        if (!input || !result) return;

        const rapidity = rl.rapidityFromVelocity(input.value ?? 0);
        setElement(result, rl.formatSignificant(rapidity, "0", 3), "");
    };
}

export function createVelocityFromRapidityHandler(
    getInput: () => HTMLInputElement | null,
    getResult: () => HTMLElement | null
): () => void {
    return () => {
        const input = getInput();
        const result = getResult();
        if (!input || !result) return;

        const velocity = rl.velocityFromRapidity(input.value ?? 0);
        setElement(result, rl.formatSignificant(velocity, "9", 3), "m/s");
    };
}

export function createAddVelocitiesHandler(
    getV1Input: () => HTMLInputElement | null,
    getV2Input: () => HTMLInputElement | null,
    getResult: () => HTMLElement | null
): () => void {
    return () => {
        const v1Input = getV1Input();
        const v2Input = getV2Input();
        const result = getResult();
        if (!v1Input || !v2Input || !result) return;

        const v1 = rl.ensure(v1Input.value ?? 0);
        const v2 = rl.ensure(v2Input.value ?? 0);
        const added = rl.addVelocitiesC(v1, v2);

        setElement(result, rl.formatSignificant(added, "9", 3), "c");
    };
}
```

**Step 2: Add acceleration handler with chart updates**

Add to `src/ui/eventHandlers.ts`:

```typescript
export function createAccelHandler(
    getInput: () => HTMLInputElement | null,
    getResults: () => (HTMLElement | null)[],
    chartRegistry: { current: ChartRegistry }
): () => void {
    return () => {
        const input = getInput();
        const [resultA1, resultA2, resultA1b, resultA2b] = getResults();
        if (!input) return;

        const accel = rl.g;
        const secs = rl.ensure(input.value ?? 0).mul(60 * 60 * 24);

        const relVel = rl.relativisticVelocity(accel, secs);
        const relDist = rl.relativisticDistance(accel, secs);
        const relVelC = relVel.div(rl.c);
        const relDistC = relDist.div(rl.lightYear);

        if (resultA1) setElement(resultA1, rl.formatSignificant(relVel, "9", 3), "m/s");
        if (resultA2) setElement(resultA2, rl.formatSignificant(relDist, "9", 3), "m");
        if (resultA1b) setElement(resultA1b, rl.formatSignificant(relVelC, "9", 3), "c");
        if (resultA2b) setElement(resultA2b, rl.formatSignificant(relDistC, "0", 3), "ly");

        // Update charts
        const durationDays = parseFloat(input.value ?? '365');
        const data = generateAccelChartData(1, durationDays);
        chartRegistry.current = updateAccelCharts(chartRegistry.current, data);
    };
}
```

**Step 3: Add flip-and-burn handler**

Add to `src/ui/eventHandlers.ts`:

```typescript
export function createFlipBurnHandler(
    getInput: () => HTMLInputElement | null,
    getResults: () => (HTMLElement | null)[],
    chartRegistry: { current: ChartRegistry }
): () => void {
    return () => {
        const input = getInput();
        const [resultFlip1, resultFlip2, resultFlip3, resultFlip4, resultFlip5, resultFlip6] = getResults();
        if (!input) return;

        const distanceLightYears = parseFloat(input.value ?? '0');
        const m = rl.ensure(distanceLightYears).mul(rl.lightYear);
        const res = rl.flipAndBurn(rl.g, m);
        const properTime = res.properTime.div(rl.secondsPerYear);
        const coordTime = res.coordTime.div(rl.secondsPerYear);
        const peak = res.peakVelocity.div(rl.c);
        const lorentz = res.lorentzFactor;
        const metre = rl.formatSignificant(rl.one.div(lorentz), "0", 2);
        const sec = rl.formatSignificant(rl.one.mul(lorentz), "0", 2);

        if (resultFlip1) setElement(resultFlip1, rl.formatSignificant(properTime, "0", 2), "yrs");
        if (resultFlip2) setElement(resultFlip2, rl.formatSignificant(peak, "9", 2), "c");
        if (resultFlip4) setElement(resultFlip4, rl.formatSignificant(coordTime, "0", 2), "yrs");
        if (resultFlip3) setElement(resultFlip3, rl.formatSignificant(lorentz, "0", 2), "");
        if (resultFlip5) setElement(resultFlip5, `1m becomes ${metre}m`, "");
        if (resultFlip6) setElement(resultFlip6, `1s becomes ${sec}s`, "");

        // Update charts
        const data = generateFlipBurnChartData(distanceLightYears);
        chartRegistry.current = updateFlipBurnCharts(chartRegistry.current, data);
    };
}
```

**Step 4: Add visualization graph update handler**

Add to `src/ui/eventHandlers.ts`:

```typescript
export function createGraphUpdateHandler(
    getAccelInput: () => HTMLInputElement | null,
    getDurationInput: () => HTMLInputElement | null,
    chartRegistry: { current: ChartRegistry }
): () => void {
    return () => {
        const accelInput = getAccelInput();
        const durationInput = getDurationInput();
        if (!accelInput || !durationInput) return;

        const accelG = parseFloat(accelInput.value ?? '1');
        const durationDays = parseFloat(durationInput.value ?? '365');

        const data = generateVisualizationChartData(accelG, durationDays);
        chartRegistry.current = updateVisualizationCharts(chartRegistry.current, data);
    };
}
```

**Step 5: Verify TypeScript compilation**

Run: `yarn type-check`
Expected: No errors

**Step 6: Commit**

```bash
git add src/ui/eventHandlers.ts
git commit -m "feat: add event handler factories"
```

---

## Task 5: Refactor main.ts to Use New Modules

**Files:**
- Modify: `src/main.ts`

**Step 1: Replace main.ts with refactored version**

File: `src/main.ts` (replace entire contents)

```typescript
import * as rl from './relativity_lib';
import { Chart, registerables } from 'chart.js';
import { getInputElement, getButtonElement, getResultElement } from './ui/domUtils';
import {
    createLorentzHandler,
    createRapidityFromVelocityHandler,
    createVelocityFromRapidityHandler,
    createAccelHandler,
    createFlipBurnHandler,
    createAddVelocitiesHandler,
    createGraphUpdateHandler
} from './ui/eventHandlers';
import { generateVisualizationChartData } from './charts/dataGeneration';
import { updateVisualizationCharts, type ChartRegistry } from './charts/charts';

// Register Chart.js components
Chart.register(...registerables);

document.addEventListener('DOMContentLoaded', () => {
    const chartRegistry: { current: ChartRegistry } = { current: new Map() };

    // Lorentz factor from velocity
    getButtonElement('lorentzButton')?.addEventListener('click',
        createLorentzHandler(
            () => getInputElement('lorentzInput'),
            () => getResultElement('resultLorentz')
        )
    );

    // Rapidity from velocity
    getButtonElement('velocityButton')?.addEventListener('click',
        createRapidityFromVelocityHandler(
            () => getInputElement('velocityInput'),
            () => getResultElement('resultVelocity')
        )
    );

    // Velocity from rapidity
    getButtonElement('rapidityButton')?.addEventListener('click',
        createVelocityFromRapidityHandler(
            () => getInputElement('rapidityInput'),
            () => getResultElement('resultRapidity')
        )
    );

    // Constant acceleration
    getButtonElement('aButton')?.addEventListener('click',
        createAccelHandler(
            () => getInputElement('aInput'),
            () => [
                getResultElement('resultA1'),
                getResultElement('resultA2'),
                getResultElement('resultA1b'),
                getResultElement('resultA2b')
            ],
            chartRegistry
        )
    );

    // Flip-and-burn
    getButtonElement('flipButton')?.addEventListener('click',
        createFlipBurnHandler(
            () => getInputElement('flipInput'),
            () => [
                getResultElement('resultFlip1'),
                getResultElement('resultFlip2'),
                getResultElement('resultFlip3'),
                getResultElement('resultFlip4'),
                getResultElement('resultFlip5'),
                getResultElement('resultFlip6')
            ],
            chartRegistry
        )
    );

    // Add velocities
    getButtonElement('addButton')?.addEventListener('click',
        createAddVelocitiesHandler(
            () => getInputElement('v1Input'),
            () => getInputElement('v2Input'),
            () => getResultElement('resultAdd')
        )
    );

    // Visualization graphs
    const graphUpdateHandler = createGraphUpdateHandler(
        () => getInputElement('graphAccelInput'),
        () => getInputElement('graphDurationInput'),
        chartRegistry
    );

    getButtonElement('graphUpdateButton')?.addEventListener('click', graphUpdateHandler);

    // Initialize visualization graphs on page load
    setTimeout(() => {
        const data = generateVisualizationChartData(1, 365);
        chartRegistry.current = updateVisualizationCharts(chartRegistry.current, data);
    }, 100);
});
```

**Step 2: Verify TypeScript compilation**

Run: `yarn type-check`
Expected: No errors

**Step 3: Test in browser**

Run: `yarn dev`
Open: http://localhost:5173
Test each calculator section:
- Lorentz factor calculation
- Rapidity conversions
- Constant acceleration with charts
- Flip-and-burn with charts
- Velocity addition
- Visualization graphs tab

Expected: All features work identically to before refactoring

**Step 4: Commit**

```bash
git add src/main.ts
git commit -m "refactor: modularize main.ts into focused modules

- Extract DOM utilities to src/ui/domUtils.ts
- Extract data generation to src/charts/dataGeneration.ts
- Extract chart management to src/charts/charts.ts
- Extract event handlers to src/ui/eventHandlers.ts
- Reduce main.ts from 1117 lines to ~100 lines
- Maintain functional style with immutable transformations
- Improve testability by separating pure functions from DOM"
```

---

## Task 6: Final Verification and Cleanup

**Step 1: Run full type check**

Run: `yarn type-check`
Expected: No TypeScript errors

**Step 2: Run build**

Run: `yarn build`
Expected: Successful production build

**Step 3: Test production build**

Run: `yarn preview`
Test all calculator features in production build
Expected: All features work correctly

**Step 4: Check bundle size**

Check: `dist/` folder size
Note: Should be similar to pre-refactor size (no significant increase)

**Step 5: Final commit if needed**

If any adjustments were made during testing:
```bash
git add .
git commit -m "fix: final adjustments after testing"
```

---

## Success Criteria

- ✅ TypeScript compilation with no errors
- ✅ All calculator features work identically to original
- ✅ Charts render and update correctly
- ✅ Production build succeeds
- ✅ Code is organized into 5 focused modules
- ✅ main.ts reduced from 1117 lines to ~100 lines
- ✅ Pure functions separated for testability
- ✅ Chart configuration DRY'd up (no duplication)

## Notes

- Keep `src/relativity_lib.ts` unchanged as specified
- Maintain functional style throughout
- Use immutable Map transformations for chart registry
- All physics calculations remain in relativity_lib.ts
- New modules only handle UI coordination and chart rendering
