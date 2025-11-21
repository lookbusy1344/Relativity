# Spacetime Interval Calculator with Minkowski Diagram

**Date:** 2025-11-21
**Status:** Approved

## Overview

Add a new "Spacetime" tab to the relativity calculator featuring the spacetime interval calculator (currently in "Calc" tab) with an accompanying Minkowski diagram visualization showing dual reference frames.

## Objectives

1. Create dedicated tab for spacetime interval calculations
2. Add visual Minkowski diagram showing both reference frames overlaid
3. Remove spacetime calculator from "Calc" tab
4. Provide educational visualization of Lorentz transformations

## Architecture

### New Tab Structure

- Add fifth tab "Spacetime" to existing calculator nav-tabs
- Move existing spacetime interval calculator from "Calc" tab
- Add Minkowski diagram canvas below numerical results
- Maintain existing input/output structure

### Component Organization

```
index.html
  └─ New "Spacetime" tab
     ├─ Spacetime Interval Calculator (moved from Calc)
     │  ├─ Inputs: time (s), distance (km), velocity (fraction of c)
     │  ├─ Outputs: interval squared, type, Δt', Δx'
     │  └─ Calculate button
     └─ Minkowski Diagram Canvas
        └─ Visual representation of spacetime interval

src/charts/minkowski.ts (new)
  └─ drawMinkowskiDiagram(canvas, data)
     ├─ Coordinate transformation logic
     ├─ Axis rendering (both frames)
     ├─ Event plotting
     └─ Label rendering

src/ui/eventHandlers.ts
  └─ Update createSpacetimeIntervalHandler
     └─ Add diagram update call
```

## Minkowski Diagram Specification

### Coordinate Systems

**Original Frame (unprimed):**
- ct axis: Vertical, cyan color
- x axis: Horizontal, cyan color
- Orthogonal (perpendicular)

**Transformed Frame (primed):**
- ct' axis: Tilted, green color
- x' axis: Tilted, green color
- Angle: θ = atan(β) where β = v/c
- Lorentz transformation applied

### Visual Elements

**Drawing Order:**
1. Grid lines (optional, light gray)
2. Light cone lines (45° diagonals, amber, dashed)
3. Original axes (ct, x) - cyan, solid
4. Transformed axes (ct', x') - green, solid, tilted
5. Interval line - white, connects origin to event
6. Events - filled circles
7. Coordinate labels - text boxes

**Events:**
- Origin (0, 0): White circle
- Event 2: Color-coded by interval type
  - Timelike (s² > 0): Cyan
  - Spacelike (s² < 0): Amber
  - Lightlike (s² ≈ 0): White

**Axes:**
- Line width: 2px
- Arrow heads at ends
- Labels: "ct", "x", "ct'", "x'"
- Axis range: Auto-scaled based on event coordinates

**Light Cones:**
- 45° diagonal lines through origin
- Amber color (--amber-alert)
- Dashed line style
- Line width: 2px

**Coordinate Labels:**
Each event displays:
- Original frame: (ct, x)
- Transformed frame: (ct', x')
- Position: Near event point, offset to avoid overlap
- Font: IBM Plex Mono
- Size: Responsive (scales with canvas)

### Coordinate Transformations

Lorentz transformation from unprimed to primed frame:
```
γ = 1 / √(1 - β²)
ct' = γ(ct - βx)
x' = γ(x - βct)
```

Tilt angle for transformed axes:
```
θ = atan(β)
```

### Canvas Rendering

**Dimensions:**
- Desktop: 600x600px
- Tablet: 500x500px
- Mobile: 400x400px
- Aspect ratio: 1:1 (square)

**Scaling:**
- Center origin at canvas midpoint
- Calculate scale: `scale = canvasSize / (2 * maxCoordinate * 1.2)`
- 20% padding to prevent edge clipping
- maxCoordinate = max(|ct|, |x|, |ct'|, |x'|)

**Coordinate Mapping:**
```javascript
canvasX = centerX + (x * scale)
canvasY = centerY - (ct * scale)  // Invert Y for standard orientation
```

## Data Flow

```
User Input (Δt, Δx, β)
  ↓
Calculate button clicked
  ↓
Event handler: createSpacetimeIntervalHandler()
  ↓
Call relativity_lib functions
  ├─ Calculate interval squared
  ├─ Determine interval type
  └─ Compute Lorentz transformation (Δt', Δx')
  ↓
Update numerical results (existing)
  ├─ resultSpacetimeSquared
  ├─ resultSpacetimeType
  ├─ resultSpacetimeDeltaT
  └─ resultSpacetimeDeltaX
  ↓
NEW: Call drawMinkowskiDiagram()
  ├─ Pass: time, distance, velocity, transformed coords
  └─ Render diagram on canvas
```

## Edge Cases

### Zero Interval (Lightlike)
- Both events at origin or aligned on light cone
- Draw axes and light cones
- Skip interval line if events coincide
- Label as "Lightlike"

### Extreme Velocities (β → 1)
- Transformed axes approach light cone (nearly parallel)
- Increase canvas margins
- Clamp angle calculations to prevent overflow
- Labels may need repositioning

### Very Small/Large Values
- Use scientific notation when |value| < 0.001 or > 10000
- Auto-scale canvas to accommodate range
- Maintain readability of labels

### Negative Coordinates
- Fully supported
- Axes extend in all four quadrants
- Origin remains centered
- Past light cone (negative ct) supported

### Invalid Velocity (|β| ≥ 1)
- Should be prevented by existing validation
- Fallback: Display error message on canvas
- "Invalid velocity: must be < c"

## Styling

**Colors (from CSS variables):**
- Original frame axes: `--electric-cyan` (#00d9ff)
- Transformed frame axes: `--scientific-green` (#00ff9f)
- Light cones: `--amber-alert` (#ffaa00)
- Interval line: `--soft-white` (#e8f1f5)
- Background: `rgba(0, 0, 0, 0.3)`
- Border: `1px solid rgba(0, 217, 255, 0.2)`

**Typography:**
- Labels: `font-family: 'IBM Plex Mono', monospace`
- Coordinates: `font-weight: 500`
- Size scales with canvas dimensions

**Container:**
- Match existing chart containers
- Padding: 1rem
- Dark background with cyan border
- Drop shadow consistent with theme

## Implementation Notes

### Files to Modify

1. **index.html**
   - Add new tab button in nav-tabs (line ~748)
   - Create new tab-pane content area
   - Move spacetime calculator section from Calc tab (lines 1151-1193)
   - Add canvas element with container styling
   - Remove spacetime section from Calc tab

2. **src/charts/minkowski.ts** (new file)
   - Export `drawMinkowskiDiagram(canvas: HTMLCanvasElement, data: MinkowskiData)`
   - Interface: MinkowskiData { time, distance, velocity, deltaTPrime, deltaXPrime }
   - Implement coordinate transformations
   - Implement rendering logic

3. **src/ui/eventHandlers.ts**
   - Update `createSpacetimeIntervalHandler`
   - Add canvas retrieval
   - Call drawMinkowskiDiagram after updating numerical results

4. **src/main.ts**
   - No changes required (event handler already wired)

### Testing Strategy

User will perform manual testing with:
- Default values (t=2s, x=299792.458km, β=0.5)
- Timelike intervals (s² > 0)
- Spacelike intervals (s² < 0)
- Lightlike intervals (s² ≈ 0)
- Extreme velocities (β=0.9, β=0.99)
- Negative coordinates
- Responsive behavior (mobile viewport)

Verify:
- Numerical results match diagram coordinates
- Axes are correctly oriented and labeled
- Light cones at 45°
- Transformed axes tilted by correct angle
- Color coding accurate
- Responsive scaling works

## Success Criteria

1. New "Spacetime" tab appears in navigation
2. Spacetime interval calculator moved from "Calc" tab
3. Minkowski diagram renders below calculator
4. Diagram shows both coordinate systems overlaid
5. Events plotted correctly in both frames
6. Light cones visible at 45°
7. Coordinate labels accurate in both frames
8. Color coding reflects interval type
9. Responsive on mobile/tablet/desktop
10. Original "Calc" tab no longer contains spacetime calculator

## Future Enhancements (Not in Scope)

- Interactive event dragging
- Animation of frame transformations
- Multiple events support
- 3D spacetime visualization
- Worldline traces
