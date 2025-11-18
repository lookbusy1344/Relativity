# Phase Space Visualizations Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add position-velocity phase portraits and spacetime worldline diagrams to Constant Acceleration and Flip-and-Burn tabs for visually beautiful relativistic physics visualization.

**Architecture:** Extend existing data generation pipeline to compute phase space coordinates, add Chart.js configurations for new chart types, integrate into existing chart update flow with velocity-based gradient coloring.

**Tech Stack:** TypeScript, Chart.js, Decimal.js, Vite

---

## Task 1: Add Position-Velocity Data Generation for Constant Acceleration

**Files:**
- Modify: `src/charts/dataGeneration.ts:10-87`

**Step 1: Extend generateAccelChartData return type**

Add new fields to the return type in `src/charts/dataGeneration.ts:13-24`:

```typescript
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
    properTimeMassRemaining40: ChartDataPoint[];
    properTimeMassRemaining50: ChartDataPoint[];
    properTimeMassRemaining60: ChartDataPoint[];
    properTimeMassRemaining70: ChartDataPoint[];
    positionVelocity: ChartDataPoint[];  // NEW: {x: distance_ly, y: velocity_c}
    spacetimeWorldline: ChartDataPoint[];  // NEW: {x: coord_time_years, y: distance_ly}
} {
```

**Step 2: Initialize new data arrays**

After line 38 in `src/charts/dataGeneration.ts`, add:

```typescript
    const positionVelocity: ChartDataPoint[] = [];
    const spacetimeWorldline: ChartDataPoint[] = [];
```

**Step 3: Populate arrays in the main loop**

In the loop starting at line 40, after line 73 (after the mass calculations), add:

```typescript
        // Calculate distance for phase space plots
        const distance = rl.relativisticDistance(accel, tau);
        const distanceLy = parseFloat(distance.div(rl.lightYear).toString());

        // Position-velocity phase space
        positionVelocity.push({ x: distanceLy, y: velocityC });

        // Spacetime worldline (coord time vs distance)
        spacetimeWorldline.push({ x: tDays, y: distanceLy });
```

**Step 4: Return new data**

Update the return statement at line 76 to include:

```typescript
    return {
        properTimeVelocity,
        coordTimeVelocity,
        properTimeRapidity,
        coordTimeRapidity,
        properTimeTimeDilation,
        coordTimeTimeDilation,
        properTimeMassRemaining40,
        properTimeMassRemaining50,
        properTimeMassRemaining60,
        properTimeMassRemaining70,
        positionVelocity,
        spacetimeWorldline
    };
```

**Step 5: Verify TypeScript compilation**

Run: `yarn type-check`
Expected: No errors

**Step 6: Commit**

```bash
git add src/charts/dataGeneration.ts
git commit -m "feat: add position-velocity and spacetime data for constant acceleration"
```

---

## Task 2: Add Position-Velocity Data Generation for Flip-and-Burn

**Files:**
- Modify: `src/charts/dataGeneration.ts:90-212`

**Step 1: Extend generateFlipBurnChartData return type**

Update return type at lines 90-103:

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
    properTimeMassRemaining40: ChartDataPoint[];
    properTimeMassRemaining50: ChartDataPoint[];
    properTimeMassRemaining60: ChartDataPoint[];
    properTimeMassRemaining70: ChartDataPoint[];
    positionVelocity: ChartDataPoint[];  // NEW: creates the loop!
    spacetimeWorldline: ChartDataPoint[];  // NEW: S-curve
} {
```

**Step 2: Initialize new arrays**

After line 118, add:

```typescript
    const positionVelocity: ChartDataPoint[] = [];
    const spacetimeWorldline: ChartDataPoint[] = [];
```

**Step 3: Track cumulative distance**

Before the acceleration phase loop (line 120), add:

```typescript
    let cumulativeDistance = new Decimal(0);
```

**Step 4: Populate arrays in acceleration phase**

In the acceleration loop (starting line 121), after line 155, add:

```typescript
        // Calculate distance traveled so far
        const distance = rl.relativisticDistance(rl.g, tau);
        const distanceLy = parseFloat(distance.div(rl.lightYear).toString());

        // Position-velocity phase space
        positionVelocity.push({ x: distanceLy, y: velocityC });

        // Spacetime worldline
        spacetimeWorldline.push({ x: tYears, y: distanceLy });
```

**Step 5: Populate arrays in deceleration phase**

In the deceleration loop (starting line 159), after line 197, add:

```typescript
        // Distance during deceleration = total - remaining accel distance
        const accelDistance = rl.relativisticDistance(rl.g, tauAccel);
        const totalDistance = rl.ensure(distanceLightYears).mul(rl.lightYear);
        const decelDistance = totalDistance.minus(accelDistance);
        const currentDistance = accelDistance.plus(decelDistance.minus(accelDistance.mul(i / numPointsPerPhase)));
        const currentDistanceLy = parseFloat(currentDistance.div(rl.lightYear).toString());

        // Position-velocity phase space (creates return path of loop)
        positionVelocity.push({ x: currentDistanceLy, y: velocityC });

        // Spacetime worldline
        spacetimeWorldline.push({ x: tYears, y: currentDistanceLy });
```

**Step 6: Return new data**

Update return at line 200:

```typescript
    return {
        properTimeVelocity,
        coordTimeVelocity,
        properTimeRapidity,
        coordTimeRapidity,
        properTimeLorentz,
        coordTimeLorentz,
        properTimeMassRemaining40,
        properTimeMassRemaining50,
        properTimeMassRemaining60,
        properTimeMassRemaining70,
        positionVelocity,
        spacetimeWorldline
    };
```

**Step 7: Verify TypeScript compilation**

Run: `yarn type-check`
Expected: No errors

**Step 8: Commit**

```bash
git add src/charts/dataGeneration.ts
git commit -m "feat: add position-velocity and spacetime data for flip-and-burn"
```

---

## Task 3: Create Position-Velocity Chart Function

**Files:**
- Modify: `src/charts/charts.ts`
- Read: `src/charts/charts.ts:1-200` (to understand existing patterns)

**Step 1: Add position-velocity chart creation function**

Add this function to `src/charts/charts.ts` (after the existing chart functions):

```typescript
function createPositionVelocityChart(
    canvas: HTMLCanvasElement,
    data: { x: number; y: number }[],
    title: string
): Chart {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    // Create velocity-based gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#00d9ff');     // electric cyan at low velocity
    gradient.addColorStop(0.5, '#00ff9f');   // scientific green at mid
    gradient.addColorStop(1, '#ffaa00');     // amber at high velocity

    return new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Trajectory',
                data: data,
                borderColor: gradient,
                backgroundColor: 'rgba(0, 217, 255, 0.1)',
                borderWidth: 3,
                pointRadius: 0,
                tension: 0.4,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 1.5,
            plugins: {
                title: {
                    display: true,
                    text: title,
                    color: '#00ff9f',
                    font: { size: 16, family: 'Orbitron' }
                },
                legend: { display: false }
            },
            scales: {
                x: {
                    type: 'linear',
                    title: {
                        display: true,
                        text: 'Distance (light years)',
                        color: '#00d9ff',
                        font: { size: 14 }
                    },
                    grid: { color: 'rgba(0, 217, 255, 0.1)' },
                    ticks: { color: '#e8f1f5' }
                },
                y: {
                    type: 'linear',
                    min: 0,
                    max: 1,
                    title: {
                        display: true,
                        text: 'Velocity (c)',
                        color: '#00d9ff',
                        font: { size: 14 }
                    },
                    grid: { color: 'rgba(0, 217, 255, 0.1)' },
                    ticks: { color: '#e8f1f5' }
                }
            }
        }
    });
}
```

**Step 2: Verify TypeScript compilation**

Run: `yarn type-check`
Expected: No errors

**Step 3: Commit**

```bash
git add src/charts/charts.ts
git commit -m "feat: add position-velocity chart creation function"
```

---

## Task 4: Create Spacetime Worldline Chart Function

**Files:**
- Modify: `src/charts/charts.ts`

**Step 1: Add spacetime worldline chart creation function**

Add this function to `src/charts/charts.ts`:

```typescript
function createSpacetimeChart(
    canvas: HTMLCanvasElement,
    data: { x: number; y: number }[],
    title: string
): Chart {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    // Find max values for light cone
    const maxTime = Math.max(...data.map(d => d.x));
    const maxDistance = Math.max(...data.map(d => d.y));

    return new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'Worldline',
                    data: data,
                    borderColor: '#00d9ff',
                    backgroundColor: 'rgba(0, 217, 255, 0.1)',
                    borderWidth: 3,
                    pointRadius: 0,
                    tension: 0.4,
                    fill: false
                },
                {
                    label: 'Light Cone',
                    data: [{ x: 0, y: 0 }, { x: maxTime, y: maxTime }],
                    borderColor: 'rgba(255, 170, 0, 0.3)',
                    borderWidth: 1,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 1.5,
            plugins: {
                title: {
                    display: true,
                    text: title,
                    color: '#00ff9f',
                    font: { size: 16, family: 'Orbitron' }
                },
                legend: { display: false }
            },
            scales: {
                x: {
                    type: 'linear',
                    title: {
                        display: true,
                        text: 'Coordinate Time (years)',
                        color: '#00d9ff',
                        font: { size: 14 }
                    },
                    grid: { color: 'rgba(0, 217, 255, 0.1)' },
                    ticks: { color: '#e8f1f5' }
                },
                y: {
                    type: 'linear',
                    title: {
                        display: true,
                        text: 'Distance (light years)',
                        color: '#00d9ff',
                        font: { size: 14 }
                    },
                    grid: { color: 'rgba(0, 217, 255, 0.1)' },
                    ticks: { color: '#e8f1f5' }
                }
            }
        }
    });
}
```

**Step 2: Verify TypeScript compilation**

Run: `yarn type-check`
Expected: No errors

**Step 3: Commit**

```bash
git add src/charts/charts.ts
git commit -m "feat: add spacetime worldline chart creation function"
```

---

## Task 5: Integrate New Charts into Update Functions

**Files:**
- Modify: `src/charts/charts.ts`
- Read existing `updateAccelCharts` and `updateFlipBurnCharts` functions

**Step 1: Add chart IDs to registry**

Find the chart update functions and add new canvas IDs. In `updateAccelCharts`:

```typescript
export function updateAccelCharts(
    registry: ChartRegistry,
    data: ReturnType<typeof generateAccelChartData>
): ChartRegistry {
    // Existing charts...

    // Position-Velocity Phase Portrait
    const posVelCanvas = document.getElementById('accelPositionVelocityChart') as HTMLCanvasElement | null;
    if (posVelCanvas) {
        if (registry.has('accelPositionVelocity')) {
            registry.get('accelPositionVelocity')?.destroy();
        }
        registry.set('accelPositionVelocity',
            createPositionVelocityChart(posVelCanvas, data.positionVelocity, 'Position-Velocity Phase Portrait')
        );
    }

    // Spacetime Worldline
    const spacetimeCanvas = document.getElementById('accelSpacetimeChart') as HTMLCanvasElement | null;
    if (spacetimeCanvas) {
        if (registry.has('accelSpacetime')) {
            registry.get('accelSpacetime')?.destroy();
        }
        registry.set('accelSpacetime',
            createSpacetimeChart(spacetimeCanvas, data.spacetimeWorldline, 'Spacetime Worldline')
        );
    }

    return registry;
}
```

**Step 2: Update flip-burn charts similarly**

In `updateFlipBurnCharts`, add:

```typescript
export function updateFlipBurnCharts(
    registry: ChartRegistry,
    data: ReturnType<typeof generateFlipBurnChartData>
): ChartRegistry {
    // Existing charts...

    // Position-Velocity Phase Portrait
    const posVelCanvas = document.getElementById('flipPositionVelocityChart') as HTMLCanvasElement | null;
    if (posVelCanvas) {
        if (registry.has('flipPositionVelocity')) {
            registry.get('flipPositionVelocity')?.destroy();
        }
        registry.set('flipPositionVelocity',
            createPositionVelocityChart(posVelCanvas, data.positionVelocity, 'Position-Velocity Phase Portrait')
        );
    }

    // Spacetime Worldline
    const spacetimeCanvas = document.getElementById('flipSpacetimeChart') as HTMLCanvasElement | null;
    if (spacetimeCanvas) {
        if (registry.has('flipSpacetime')) {
            registry.get('flipSpacetime')?.destroy();
        }
        registry.set('flipSpacetime',
            createSpacetimeChart(spacetimeCanvas, data.spacetimeWorldline, 'Spacetime Worldline')
        );
    }

    return registry;
}
```

**Step 3: Verify TypeScript compilation**

Run: `yarn type-check`
Expected: No errors

**Step 4: Commit**

```bash
git add src/charts/charts.ts
git commit -m "feat: integrate position-velocity and spacetime charts into update functions"
```

---

## Task 6: Add Canvas Elements to HTML - Constant Acceleration Tab

**Files:**
- Modify: `index.html:781` (after the last chart in Constant Acceleration tab)

**Step 1: Add position-velocity canvas**

After line 780 (end of mass chart), add:

```html
						<div style="margin-top: 1.5rem;">
							<div class="input-label" style="margin-bottom: 0.5rem;">
								Position-Velocity Phase Portrait
								<a href="https://github.com/lookbusy1344/Relativity/blob/main/Python/Solar%20system.ipynb" target="_blank" rel="noopener noreferrer" class="notebook-link">Learn more</a>
							</div>
							<div style="background: rgba(0, 0, 0, 0.3); padding: 1rem; border: 1px solid rgba(0, 217, 255, 0.2);">
								<canvas id="accelPositionVelocityChart"></canvas>
							</div>
						</div>
```

**Step 2: Add spacetime canvas**

Immediately after the previous addition:

```html
						<div style="margin-top: 1.5rem;">
							<div class="input-label" style="margin-bottom: 0.5rem;">
								Spacetime Worldline
								<a href="https://github.com/lookbusy1344/Relativity/blob/main/Python/Spacetime%20interval.ipynb" target="_blank" rel="noopener noreferrer" class="notebook-link">Learn more</a>
							</div>
							<div style="background: rgba(0, 0, 0, 0.3); padding: 1rem; border: 1px solid rgba(0, 217, 255, 0.2);">
								<canvas id="accelSpacetimeChart"></canvas>
							</div>
						</div>
```

**Step 3: Verify HTML structure**

Run: `yarn dev` and navigate to http://localhost:5173
Expected: Dev server starts, page loads without errors

**Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add canvas elements for constant acceleration phase space charts"
```

---

## Task 7: Add Canvas Elements to HTML - Flip-and-Burn Tab

**Files:**
- Modify: `index.html:873` (after the last chart in Flip-and-Burn tab)

**Step 1: Add position-velocity canvas**

After line 873 (end of mass chart in flip-and-burn), add:

```html
					<div style="margin-top: 1.5rem;">
						<div class="input-label" style="margin-bottom: 0.5rem;">
							Position-Velocity Phase Portrait
							<a href="https://github.com/lookbusy1344/Relativity/blob/main/Python/Universe.ipynb" target="_blank" rel="noopener noreferrer" class="notebook-link">Learn more</a>
						</div>
						<div style="background: rgba(0, 0, 0, 0.3); padding: 1rem; border: 1px solid rgba(0, 217, 255, 0.2);">
							<canvas id="flipPositionVelocityChart"></canvas>
						</div>
					</div>
```

**Step 2: Add spacetime canvas**

Immediately after:

```html
					<div style="margin-top: 1.5rem;">
						<div class="input-label" style="margin-bottom: 0.5rem;">
							Spacetime Worldline
							<a href="https://github.com/lookbusy1344/Relativity/blob/main/Python/Spacetime%20interval.ipynb" target="_blank" rel="noopener noreferrer" class="notebook-link">Learn more</a>
						</div>
						<div style="background: rgba(0, 0, 0, 0.3); padding: 1rem; border: 1px solid rgba(0, 217, 255, 0.2);">
							<canvas id="flipSpacetimeChart"></canvas>
						</div>
					</div>
```

**Step 3: Verify page loads**

Check: http://localhost:5173
Expected: All tabs display, no console errors, new chart areas visible (empty until calculate pressed)

**Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add canvas elements for flip-and-burn phase space charts"
```

---

## Task 8: Manual Testing and Visual Verification

**Files:**
- Test: All new charts

**Step 1: Test Constant Acceleration charts**

1. Navigate to http://localhost:5173
2. Go to "Constant Acceleration" tab
3. Enter: 365 days
4. Click "Calculate"

Expected:
- Position-Velocity chart shows smooth curve from (0,0) approaching asymptote at v=1c
- Curve has color gradient: cyan → green → amber
- Spacetime chart shows curved worldline staying below 45° light cone line
- Both charts render smoothly with proper axis labels

**Step 2: Test Flip-and-Burn charts**

1. Go to "Flip and Burn" tab
2. Enter: 4 light years
3. Click "Calculate"

Expected:
- Position-Velocity creates beautiful symmetric loop/teardrop
- Starts at (0,0), rises to peak (~2ly, ~0.95c), returns to (~4ly, 0)
- Spacetime shows S-curve or parabolic trajectory
- Light cone boundary visible

**Step 3: Test different parameters**

Try various inputs to verify charts scale properly:
- Very short: 1 day constant accel
- Very long: 1000 days constant accel
- Near distances: 0.1 light years flip-burn
- Far distances: 100 light years flip-burn

Expected: Charts auto-scale appropriately, no visual glitches

**Step 4: Test mobile responsiveness**

Resize browser to mobile width (<768px)

Expected: Charts resize gracefully, remain readable

**Step 5: Document any issues found**

If issues found, create new tasks to fix them. Otherwise, proceed to final commit.

---

## Task 9: Final Verification and Documentation

**Files:**
- Modify: `README.md` (if exists) or create documentation
- Run: Full type check and build

**Step 1: Run full type check**

Run: `yarn type-check`
Expected: No errors

**Step 2: Run production build**

Run: `yarn build`
Expected: Build succeeds with no errors

**Step 3: Visual QA on production build**

Run: `yarn preview`
Navigate to preview URL
Test: All functionality from Task 8

Expected: Everything works in production build

**Step 4: Final commit**

```bash
git add .
git commit -m "feat: complete phase space visualization implementation

Added two visually striking phase space diagrams to both Constant
Acceleration and Flip-and-Burn tabs:

- Position-Velocity Phase Portrait with velocity-based gradients
- Spacetime Worldline with light cone boundaries

Charts use existing physics calculations, integrate seamlessly with
current UI, and provide beautiful educational visualizations of
relativistic motion."
```

**Step 5: Create summary of changes**

Document what was added:
- 2 new chart types (position-velocity, spacetime)
- 4 total new charts (2 per tab)
- Extended data generation with phase space coordinates
- Maintained existing cyberpunk aesthetic
- All charts responsive and performant

---

## Completion Checklist

- [ ] Position-velocity data generation for constant accel
- [ ] Position-velocity data generation for flip-burn
- [ ] Position-velocity chart creation function
- [ ] Spacetime chart creation function
- [ ] Chart integration into update functions
- [ ] HTML canvas elements for constant accel
- [ ] HTML canvas elements for flip-burn
- [ ] Manual testing completed
- [ ] Type checking passes
- [ ] Production build successful
- [ ] All commits made with clear messages
- [ ] Visual QA confirms beautiful rendering
- [ ] Documentation updated

## Notes

- The flip-and-burn position-velocity creates a loop because velocity returns to zero
- Spacetime worldline always stays within light cone (worldline slope < 45°)
- Velocity gradients make high-speed regions visually distinctive
- Charts complement existing time-series data with phase space perspective
- No external dependencies added - uses existing Chart.js and physics library
