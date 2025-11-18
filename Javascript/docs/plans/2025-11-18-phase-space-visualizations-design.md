# Phase Space Visualizations Design

**Date:** 2025-11-18
**Focus:** Visual beauty and educational value
**Scope:** Add phase space diagrams to Constant Acceleration and Flip-and-Burn tabs

## Overview

Add two visually striking phase space diagrams to complement the existing time-series graphs:
1. **Position-Velocity Phase Portrait** - Beautiful loop/teardrop shapes showing trajectory through phase space
2. **Spacetime Worldline Diagram** - Classic Minkowski visualization with light cone boundaries

## Visual Design Philosophy

**Priority: Visual interest and beauty**
- Elegant curves and symmetry (especially flip-and-burn loop)
- Velocity-based color gradients (cyan → green → amber)
- Match existing cyberpunk aesthetic
- Educational clarity through beautiful visualization

## Chart 1: Position-Velocity Phase Portrait

### Description
Shows the coupled evolution of position and velocity, creating elegant trajectories:
- **Constant Acceleration:** Asymptotic curve approaching c
- **Flip-and-Burn:** Symmetric teardrop/loop from origin back to axis

### Configuration
- **Type:** Line chart with gradient fill
- **X-axis:** Distance (light years), linear scale
- **Y-axis:** Velocity (fraction of c), range 0 to 1.0
- **Data source:** Pairs of (relativisticDistance, relativisticVelocity) at each time step

### Visual Enhancements
- Color gradient along path: electric cyan (low v) → scientific green (mid) → amber (near c)
- Semi-transparent filled area under curve
- Directional indicators showing time progression
- For flip-and-burn: visually distinguish acceleration vs deceleration phases

### Educational Value
- Makes acceleration/deceleration symmetry visually obvious
- Shows how much distance is needed to reach various velocities
- Beautiful closed loop for flip-and-burn demonstrates energy conservation

## Chart 2: Spacetime Worldline Diagram

### Description
Classic Minkowski diagram showing the spacecraft's path through spacetime:
- Worldline curves as velocity increases
- Stays within light cone boundaries
- Time dilation visible in worldline curvature

### Configuration
- **Type:** Line chart with reference lines
- **X-axis:** Coordinate time (years) - Earth time
- **Y-axis:** Distance (light years)
- **Data source:** Pairs of (coordinateTime, relativisticDistance) at each proper time step

### Visual Enhancements
- Worldline in electric cyan with glow effect
- Light cone boundaries: subtle 45° reference lines (y = ±c×x)
- Background grid at 1 light year intervals
- Optional: gradient coloring based on instantaneous velocity

### Educational Value
- Shows relativistic speed limit (worldline stays within cone)
- Visualizes time dilation (deviation from straight line)
- For flip-and-burn: S-curve or parabolic trajectory shows symmetric journey

## Technical Implementation

### Data Generation

Add to `src/charts/dataGeneration.ts`:

**For `generateAccelChartData`:**
```typescript
properTimePositionVelocity: ChartDataPoint[]  // {x: distance_ly, y: velocity_c}
coordTimeDistance: ChartDataPoint[]           // {x: coord_time_years, y: distance_ly}
```

**For `generateFlipBurnChartData`:**
```typescript
properTimePositionVelocity: ChartDataPoint[]  // Creates the loop
coordTimeDistance: ChartDataPoint[]           // Creates the S-curve
```

### Data Calculation

All required data already computed in physics library:
- `relativisticDistance(accel, tau)` - position
- `relativisticVelocity(accel, tau)` - velocity
- `coordinateTime(accel, tau)` - Earth time

Loop through time steps (already done), collect new coordinate pairs.

### Chart Integration

**Update `src/charts/charts.ts`:**
- Add `updatePositionVelocityChart()` function
- Add `updateSpacetimeChart()` function
- Integrate into `updateAccelCharts()` and `updateFlipBurnCharts()`

**Update `index.html`:**
- Add canvas elements for 4 new charts (2 per tab)
- Position after existing charts
- Same container styling and responsive design
- Add "Learn more" notebook links

### Visual Styling

Match existing cyberpunk theme:
- Background: `rgba(0, 0, 0, 0.3)` panels
- Border: `1px solid rgba(0, 217, 255, 0.2)`
- Chart.js gradient fills using existing color variables:
  - `--electric-cyan: #00d9ff`
  - `--scientific-green: #00ff9f`
  - `--amber-alert: #ffaa00`

### Chart.js Configuration

**Position-Velocity:**
- Gradient stroke based on velocity values
- Point radius: 0 (smooth line)
- Tension: 0.4 (smooth curves)
- Fill: gradient from line to x-axis

**Spacetime:**
- Reference lines plugin for light cone
- Aspect ratio maintained (equal spacing for c)
- Grid showing simultaneity

## UI Placement

### Constant Acceleration Tab
1. Existing: Velocity over Time
2. Existing: Time Dilation Factor
3. Existing: Rapidity over Time
4. Existing: Ship mass over time
5. **NEW: Position-Velocity Phase Portrait**
6. **NEW: Spacetime Worldline**

### Flip-and-Burn Tab
1. Existing: Velocity over Time
2. Existing: Time Dilation Factor
3. Existing: Rapidity over Time
4. Existing: Ship mass over time
5. **NEW: Position-Velocity Phase Portrait**
6. **NEW: Spacetime Worldline**

## Edge Cases

- **Very short durations:** Graphs remain meaningful, just smaller scale
- **Very long durations:** Automatic axis scaling handles large ranges
- **Near-light-speed:** Color saturation peaks, numerical precision maintained via Decimal.js
- **Mobile display:** Responsive sizing, may stack or reduce detail on small screens

## Success Criteria

1. Charts render beautifully with smooth gradients
2. Flip-and-burn creates elegant symmetric loop in position-velocity
3. Spacetime worldline stays within light cone
4. Performance remains smooth (100 data points per chart)
5. Matches existing UI aesthetic seamlessly
6. Educational value clear from visual inspection

## Summary

**Adding 4 charts total:**
- 2 on Constant Acceleration tab
- 2 on Flip-and-Burn tab

**Key benefits:**
- Visually striking phase space representations
- Complements existing time-series data
- Emphasizes symmetry and relativistic constraints
- Educational and beautiful
