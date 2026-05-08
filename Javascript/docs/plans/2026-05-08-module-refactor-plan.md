# Module Refactor Plan

**Date:** 2026-05-08
**Status:** Proposed
**Goal:** Split large UI, chart, and application orchestration modules into smaller cohesive blocks without changing runtime behaviour.

---

## Constraints

- Do **not** refactor `src/relativity_lib.ts`. Treat it as stable public physics infrastructure.
- Keep external behaviour unchanged. This is a structural refactor, not a feature pass.
- Preserve the current public import surface during the migration where practical. Use barrel files or re-export shims so consumers can move gradually.
- Run checks after every meaningful slice:
  ```bash
  gtimeout 300 pnpm test:run
  gtimeout 300 pnpm type-check
  gtimeout 300 pnpm format:check
  gtimeout 300 pnpm lint
  gtimeout 300 pnpm build
  ```
- Prefer extraction with tests over rewrites. Move code first, then improve names and boundaries once tests prove equivalence.
- Do not delete or weaken tests. If a test blocks extraction because it depends on implementation detail, add a behavioural test first, then update the implementation-detail assertion.

---

## Current Hotspots

| File                            | Lines | Issue                                                                                                                                         |
| ------------------------------- | ----: | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/charts/minkowski.ts`       |  1393 | Rendering, interaction, tooltip, animation, scale setup, and controller lifecycle are coupled in one file.                                    |
| `src/ui/eventHandlers.ts`       |  1363 | Calculator handlers, chart slider handlers, validation/clamping, formatting, and shared chart mode state live together.                       |
| `src/charts/simultaneity.ts`    |  1292 | Domain state, diagram rendering, interaction handling, URL sync, animation, and presets are coupled.                                          |
| `src/charts/minkowski-twins.ts` |  1046 | Twin-paradox geometry, rendering, controls, tooltips, legend, and animation are coupled.                                                      |
| `src/charts/charts.ts`          |   977 | Generic Chart.js utilities and calculator-specific chart orchestration live together.                                                         |
| `src/urlState.ts`               |   681 | Tab config, calculator config, URL parsing, URL writing, pending slider application, and event binding live together.                         |
| `src/main.ts`                   |   618 | DOM bootstrapping, state containers, handler wiring, chart wiring, resize handling, URL sync, and initial calculation sequence live together. |
| `src/charts/dataGeneration.ts`  |   612 | Multiple independent data-generation families share one file.                                                                                 |

The main problem is not correctness. Current tests, type-check, lint, format, and build pass. The risk is change friction: large files hide unrelated concerns, make small changes difficult to review, and encourage cross-cutting edits.

---

## Target Shape

### UI

Create calculator-focused handler modules:

```text
src/ui/handlers/
  basicRelativityHandlers.ts
  accelerationHandlers.ts
  flipBurnHandlers.ts
  twinParadoxHandlers.ts
  pionHandlers.ts
  spacetimeHandlers.ts
  warpDriveHandlers.ts
  chartSliderHandlers.ts
  chartTimeMode.ts
  index.ts
```

Keep `src/ui/eventHandlers.ts` initially as a compatibility barrel:

```typescript
export * from "./handlers";
```

Longer term, imports can move to specific modules where useful, but the first pass should avoid changing every caller and test at once.

### Charts

Split Chart.js orchestration from shared primitives:

```text
src/charts/chartjs/
  chartTypes.ts
  chartOptions.ts
  datasets.ts
  lifecycle.ts
  accelCharts.ts
  flipBurnCharts.ts
  visualizationCharts.ts
  twinParadoxCharts.ts
  positionVelocityCharts.ts
  index.ts
```

Keep `src/charts/charts.ts` as a compatibility barrel during the migration.

Split data generation by calculator family:

```text
src/charts/data/
  accelerationData.ts
  flipBurnData.ts
  visualizationData.ts
  twinParadoxData.ts
  types.ts
  index.ts
```

Keep `src/charts/dataGeneration.ts` as a compatibility barrel.

### D3 Minkowski Diagrams

Extract rendering pieces while keeping current public entry points:

```text
src/charts/minkowski/
  scales.ts
  svg.ts
  lightCones.ts
  axes.ts
  simultaneityLines.ts
  events.ts
  labels.ts
  tooltips.ts
  animation.ts
  controller.ts
  index.ts
```

Keep `src/charts/minkowski.ts` as a compatibility barrel exporting `drawMinkowskiDiagramD3`, `setupSVG`, and public types.

Twin paradox diagram:

```text
src/charts/minkowski-twins/
  geometry.ts
  worldlines.ts
  simultaneityLines.ts
  events.ts
  labels.ts
  legend.ts
  tooltips.ts
  animation.ts
  controller.ts
  index.ts
```

Keep `src/charts/minkowski-twins.ts` as a compatibility barrel.

Simultaneity diagram:

```text
src/charts/simultaneity/
  constants.ts
  trainExample.ts
  temporalOrder.ts
  rendering.ts
  interactions.ts
  animation.ts
  controls.ts
  controller.ts
  index.ts
```

Keep `src/charts/simultaneity.ts` as a compatibility barrel.

### URL State

Split configuration, parsing, writing, and binding:

```text
src/urlState/
  config.ts
  defaults.ts
  initialize.ts
  update.ts
  sliders.ts
  sync.ts
  index.ts
```

Keep `src/urlState.ts` as a compatibility barrel.

### Application Bootstrap

Move bootstrapping into explicit setup modules:

```text
src/app/
  state.ts
  domAccessors.ts
  helpModals.ts
  calculatorWiring.ts
  chartWiring.ts
  minkowskiWiring.ts
  urlSyncWiring.ts
  resizeWiring.ts
  initialCalculations.ts
  bootstrap.ts
```

Then reduce `src/main.ts` to:

```typescript
import { bootstrapApp } from "./app/bootstrap";
import "./bootstrap-types";

document.addEventListener("DOMContentLoaded", bootstrapApp);
```

---

## Phase 0: Pre-Flight

1. Confirm clean worktree:
   ```bash
   git status --short
   ```
2. Capture baseline:
   ```bash
   gtimeout 300 pnpm test:run
   gtimeout 300 pnpm type-check
   gtimeout 300 pnpm format:check
   gtimeout 300 pnpm lint
   gtimeout 300 pnpm build
   ```
3. Record current file sizes:
   ```bash
   wc -l src/main.ts src/ui/eventHandlers.ts src/charts/charts.ts src/charts/minkowski.ts src/charts/minkowski-twins.ts src/charts/simultaneity.ts src/urlState.ts src/charts/dataGeneration.ts
   ```
4. Agree that commits should be small and reviewable. Recommended commit shape:
   - `refactor(ui): split event handler modules`
   - `refactor(charts): split chartjs orchestration`
   - `refactor(charts): split minkowski renderer`
   - `refactor(app): extract bootstrap wiring`

---

## Phase 1: Low-Risk Pure Extractions

Start with modules that have clear exported functions and minimal DOM coupling.

### Task 1.1: Split `dataGeneration.ts`

Move each exported generator to a family-specific file:

- `generateAccelChartData` -> `src/charts/data/accelerationData.ts`
- `generateFlipBurnChartData` -> `src/charts/data/flipBurnData.ts`
- `generateVisualizationChartData` -> `src/charts/data/visualizationData.ts`
- `generateTwinParadoxChartData` -> `src/charts/data/twinParadoxData.ts`

Create `src/charts/data/index.ts` exporting all four functions. Replace `src/charts/dataGeneration.ts` with a compatibility barrel.

Verification:

```bash
gtimeout 300 pnpm vitest run src/charts/dataGeneration.test.ts
gtimeout 300 pnpm type-check
```

### Task 1.2: Split Chart Time Mode and Slider Math

Extract from `src/ui/eventHandlers.ts`:

- `chartTimeModes`, `createChartTimeModeHandler`, `getChartTimeModes`, `setChartTimeMode` -> `src/ui/handlers/chartTimeMode.ts`
- `createMassChartSliderHandler`, `initializeMassChartSlider`, `sliderToDistance`, `distanceToSlider`, `createPositionVelocitySliderHandler`, `initializePositionVelocitySlider` -> `src/ui/handlers/chartSliderHandlers.ts`

Keep `src/ui/eventHandlers.ts` exporting these names.

Verification:

```bash
gtimeout 300 pnpm vitest run src/ui/eventHandlers.test.ts -t "chart|slider|distance"
gtimeout 300 pnpm vitest run src/urlState.test.ts
gtimeout 300 pnpm type-check
```

Reasoning: `urlState.ts` imports `distanceToSlider` from `eventHandlers.ts`. Keeping the barrel avoids a cross-module migration in the same task.

---

## Phase 2: Split UI Handler Families

Extract calculator handlers by product area. Each extraction should be a separate commit unless it is trivial.

### Task 2.1: Basic Relativity and Warp Drive

Move these handlers:

- `createLorentzHandler`
- `createRapidityFromVelocityHandler`
- `createVelocityFromRapidityHandler`
- `createAddVelocitiesHandler`
- `createWarpDriveHandler`

Target:

```text
src/ui/handlers/basicRelativityHandlers.ts
src/ui/handlers/warpDriveHandlers.ts
```

Verification:

```bash
gtimeout 300 pnpm vitest run src/ui/eventHandlers.test.ts -t "Lorentz|Rapidity|Velocity|Warp|velocities"
gtimeout 300 pnpm type-check
```

### Task 2.2: Acceleration and Flip-Burn

Move:

- `createAccelHandler`
- `createFlipBurnHandler`

Target:

```text
src/ui/handlers/accelerationHandlers.ts
src/ui/handlers/flipBurnHandlers.ts
```

If shared clamp rules or formatting helpers emerge, extract to:

```text
src/ui/handlers/inputClamping.ts
src/ui/handlers/resultFormatting.ts
```

Do not over-generalize prematurely. Only extract helpers used by both handlers after the move is complete and tests pass.

Verification:

```bash
gtimeout 300 pnpm vitest run src/ui/eventHandlers.test.ts -t "accel|Acceleration|flip|Flip"
gtimeout 300 pnpm type-check
```

### Task 2.3: Twin Paradox, Pion, and Spacetime

Move:

- `createTwinParadoxHandler`
- `createGraphUpdateHandler`
- `createPionAccelTimeHandler`
- `createPionFuelFractionHandler`
- `createSpacetimeIntervalHandler`

Target:

```text
src/ui/handlers/twinParadoxHandlers.ts
src/ui/handlers/pionHandlers.ts
src/ui/handlers/spacetimeHandlers.ts
```

Verification:

```bash
gtimeout 300 pnpm vitest run src/ui/eventHandlers.test.ts
gtimeout 300 pnpm type-check
gtimeout 300 pnpm lint
```

Exit criteria for Phase 2:

- `src/ui/eventHandlers.ts` is a small barrel only.
- No calculator handler module exceeds roughly 400 lines.
- Existing `eventHandlers.test.ts` remains passing. It can continue importing from `eventHandlers.ts` for compatibility.

---

## Phase 3: Split Chart.js Orchestration

### Task 3.1: Extract Shared Chart Primitives

Move shared types and helpers:

- `ChartRegistry`, style/config types -> `src/charts/chartjs/chartTypes.ts`
- `createChartOptions` -> `src/charts/chartjs/chartOptions.ts`
- dataset helpers -> `src/charts/chartjs/datasets.ts`
- `updateChart`, `destroyAll` -> `src/charts/chartjs/lifecycle.ts`

Keep `src/charts/charts.ts` exporting current public names.

Verification:

```bash
gtimeout 300 pnpm type-check
gtimeout 300 pnpm lint
```

### Task 3.2: Extract Calculator-Specific Chart Updaters

Move:

- `updateAccelCharts` -> `src/charts/chartjs/accelCharts.ts`
- `updateFlipBurnCharts` -> `src/charts/chartjs/flipBurnCharts.ts`
- `updateVisualizationCharts` -> `src/charts/chartjs/visualizationCharts.ts`
- `updateTwinParadoxCharts` -> `src/charts/chartjs/twinParadoxCharts.ts`
- position/velocity chart builders -> `src/charts/chartjs/positionVelocityCharts.ts`

Verification:

```bash
gtimeout 300 pnpm vitest run src/charts/dataGeneration.test.ts src/ui/eventHandlers.test.ts
gtimeout 300 pnpm type-check
gtimeout 300 pnpm build
```

Exit criteria for Phase 3:

- `src/charts/charts.ts` is a compatibility barrel.
- Chart.js implementation files have clear ownership and no circular imports.

---

## Phase 4: Split D3 Diagram Modules

This is the highest-risk part because it has dense DOM and D3 behaviour. Prefer one diagram family at a time.

### Task 4.1: Split Standard Minkowski Diagram

Move internal pieces from `src/charts/minkowski.ts`:

- `createScales`, `setupSVG` -> `src/charts/minkowski/scales.ts` and `svg.ts`
- `renderLightCones` -> `lightCones.ts`
- `renderAxes` -> `axes.ts`
- `renderSimultaneityLines` -> `simultaneityLines.ts`
- `renderEvents` -> `events.ts`
- `renderLabels` -> `labels.ts`
- `setupTooltips` -> `tooltips.ts`
- `startFrameAnimation` -> `animation.ts`
- `drawMinkowskiDiagramD3` controller assembly -> `controller.ts`

Keep `src/charts/minkowski.ts` as:

```typescript
export * from "./minkowski";
```

If TypeScript module resolution conflicts between `minkowski.ts` and `minkowski/index.ts`, use a distinct folder name such as `minkowski-diagram/` and re-export from `minkowski.ts`.

Verification:

```bash
gtimeout 300 pnpm vitest run src/charts/minkowski-core.test.ts
gtimeout 300 pnpm type-check
gtimeout 300 pnpm build
```

Manual check recommended after this task:

```bash
gtimeout 300 pnpm dev
```

Then inspect the Minkowski tab in-browser.

### Task 4.2: Split Twin-Paradox Minkowski Diagram

Move internal pieces from `src/charts/minkowski-twins.ts`:

- event/geometry calculation -> `geometry.ts`
- `renderWorldline` -> `worldlines.ts`
- `renderSimultaneityLines` -> `simultaneityLines.ts`
- `renderEvents` -> `events.ts`
- `renderLabels` -> `labels.ts`
- `renderLegend` -> `legend.ts`
- `setupTooltips` -> `tooltips.ts`
- `startJourneyAnimation` -> `animation.ts`
- `drawTwinParadoxMinkowski` assembly -> `controller.ts`

Verification:

```bash
gtimeout 300 pnpm vitest run src/ui/eventHandlers.test.ts -t "Twin"
gtimeout 300 pnpm type-check
gtimeout 300 pnpm build
```

### Task 4.3: Split Simultaneity Diagram

Move internal pieces from `src/charts/simultaneity.ts`:

- constants -> `constants.ts`
- `createTrainExample`, state sync helpers -> `trainExample.ts`
- `calculateTemporalOrder`, `getEventColor` -> `temporalOrder.ts`
- rendering functions -> `rendering.ts`
- pointer/click/slider interactions -> `interactions.ts`
- timeline/playback logic -> `animation.ts`
- UI controls and labels -> `controls.ts`
- `createSimultaneityDiagram` assembly -> `controller.ts`

Verification:

```bash
gtimeout 300 pnpm vitest run src/charts/simultaneity.test.ts src/charts/simultaneityState.test.ts src/urlState.test.ts
gtimeout 300 pnpm type-check
gtimeout 300 pnpm build
```

Exit criteria for Phase 4:

- Each D3 diagram has a small public entry point and separately testable geometry/state helpers.
- Existing public imports continue working.
- No D3 rendering module imports UI event handler modules.

---

## Phase 5: Split URL State

### Task 5.1: Extract URL Config and Defaults

Move:

- `TAB_CONFIGS` -> `src/urlState/config.ts`
- `CALC_CONFIGS` -> `src/urlState/config.ts`
- `getDefaultValue`, `isValidNumber`, `getActiveTab` -> `src/urlState/defaults.ts`

Keep exports private unless tests need direct access. Prefer testing through `initializeFromURL` and `updateURL`.

Verification:

```bash
gtimeout 300 pnpm vitest run src/urlState.test.ts
gtimeout 300 pnpm type-check
```

### Task 5.2: Extract Initialize, Update, Slider, and Sync Flows

Move:

- `initializeFromURL`, `initializeCalcFromURL`, `initializeSimultaneityFromURL` -> `initialize.ts`
- `updateURL`, `updateCalcURL`, `updateSimultaneityURL` -> `update.ts`
- `applyPendingSliderValue`, `applyPendingDistanceSliderValue` -> `sliders.ts`
- `setupURLSync` -> `sync.ts`

Keep `src/urlState.ts` as a compatibility barrel.

Verification:

```bash
gtimeout 300 pnpm vitest run src/urlState.test.ts src/charts/simultaneityState.test.ts
gtimeout 300 pnpm type-check
gtimeout 300 pnpm lint
```

Exit criteria for Phase 5:

- URL state modules are organized by lifecycle stage.
- Circular dependency with UI slider math is removed if practical by moving `distanceToSlider` into a neutral utility module, for example `src/ui/sliderMath.ts`.

---

## Phase 6: Split Application Bootstrap

### Task 6.1: Extract App State and DOM Accessors

Create:

```text
src/app/state.ts
src/app/domAccessors.ts
```

Move chart registry, Minkowski state, twin state, simultaneity state, and event listener tracking into explicit factories.

Suggested shape:

```typescript
export function createAppState(): AppState;
export function createTrackedEventListenerRegistry(): TrackedEventListeners;
```

Verification:

```bash
gtimeout 300 pnpm type-check
gtimeout 300 pnpm build
```

### Task 6.2: Extract Wiring Modules

Create:

```text
src/app/helpModals.ts
src/app/calculatorWiring.ts
src/app/chartWiring.ts
src/app/minkowskiWiring.ts
src/app/urlSyncWiring.ts
src/app/resizeWiring.ts
src/app/initialCalculations.ts
```

Each module should expose one setup function that receives explicit dependencies instead of importing mutable app state.

Example:

```typescript
export function wireCalculatorHandlers(deps: CalculatorWiringDeps): void;
```

Verification:

```bash
gtimeout 300 pnpm test:run
gtimeout 300 pnpm type-check
gtimeout 300 pnpm lint
gtimeout 300 pnpm build
```

### Task 6.3: Reduce `main.ts`

Create `src/app/bootstrap.ts` with `bootstrapApp()`. Reduce `src/main.ts` to imports plus the `DOMContentLoaded` listener.

Verification:

```bash
gtimeout 300 pnpm test:run
gtimeout 300 pnpm type-check
gtimeout 300 pnpm format:check
gtimeout 300 pnpm lint
gtimeout 300 pnpm build
```

Exit criteria for Phase 6:

- `src/main.ts` is under 50 lines.
- Bootstrap ordering is explicit and covered by at least smoke-level tests where feasible.
- No wiring module reaches into unrelated module-level mutable state.

---

## Phase 7: Test Rebalancing

Once compatibility barrels exist, tests can be moved closer to their modules.

Recommended split:

```text
src/ui/handlers/basicRelativityHandlers.test.ts
src/ui/handlers/chartSliderHandlers.test.ts
src/ui/handlers/accelerationHandlers.test.ts
src/charts/chartjs/lifecycle.test.ts
src/urlState/initialize.test.ts
src/urlState/update.test.ts
```

Keep broader integration tests where they add value. Do not mechanically split tests just to match source files.

Priorities:

1. Add focused tests around extracted pure helpers such as slider math, URL default handling, and D3 geometry calculations.
2. Reduce timer-heavy UI tests by isolating async scheduling behind injectable scheduling helpers where practical.
3. Preserve existing behavioural coverage before deleting or moving assertions.

Verification:

```bash
gtimeout 300 pnpm test:run
```

Target: keep the suite reliable and ideally reduce wall-clock time from roughly 32 seconds.

---

## Dependency Rules After Refactor

Use these rules to avoid recreating the same large-module coupling:

- `src/relativity_lib.ts` can be imported by feature modules, but must not import UI/chart modules.
- `src/charts/data/*` can import `relativity_lib.ts`; it should not import DOM, Chart.js instances, or D3 selections.
- `src/charts/chartjs/*` can import Chart.js and data types; it should not import UI handler factories.
- `src/ui/handlers/*` can coordinate DOM, physics, data generation, and chart update APIs.
- `src/app/*` owns bootstrapping and wiring. Feature modules should not import `src/app/*`.
- URL state should depend on stable DOM IDs/config and neutral utilities, not on large UI handler barrels.

If a proposed extraction creates circular imports, stop and introduce a neutral module for shared types/config rather than working around the cycle.

---

## Definition of Done

- `src/relativity_lib.ts` is unchanged except for incidental import formatting if absolutely unavoidable. Prefer no diff.
- `src/main.ts`, `src/ui/eventHandlers.ts`, `src/charts/charts.ts`, `src/charts/minkowski.ts`, `src/charts/minkowski-twins.ts`, `src/charts/simultaneity.ts`, `src/urlState.ts`, and `src/charts/dataGeneration.ts` are either small compatibility barrels or substantially smaller cohesive modules.
- Public behaviour is unchanged.
- All checks pass:
  ```bash
  gtimeout 300 pnpm test:run
  gtimeout 300 pnpm type-check
  gtimeout 300 pnpm format:check
  gtimeout 300 pnpm lint
  gtimeout 300 pnpm build
  ```
- No file created by the refactor becomes a new dumping ground. As a guideline, keep new implementation files under 400 lines unless there is a specific reason.
- The README or developer docs are updated only if import paths or development workflows visible to contributors change.

---

## Suggested Implementation Order

1. `dataGeneration.ts`
2. UI chart slider/time-mode helpers
3. UI calculator handler families
4. Chart.js orchestration
5. Standard Minkowski D3 diagram
6. Twin-paradox D3 diagram
7. Simultaneity D3 diagram
8. URL state
9. Application bootstrap
10. Test rebalancing

This order starts with low-risk pure functions, then moves through progressively more coupled DOM/D3 wiring. It keeps compatibility barrels in place until the end so each phase can be reviewed independently.
