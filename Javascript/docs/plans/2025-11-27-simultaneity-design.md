# Relativity of Simultaneity Interactive Visualization Design

**Date:** 2025-11-27
**Status:** Approved

## Overview

Create an interactive demonstration of relativity of simultaneity showing how events simultaneous in one reference frame are not simultaneous in another. Users place events on a Minkowski diagram, then adjust velocity to see how temporal relationships change. Pre-loaded with Einstein's classic train example.

## Architecture

### Module Structure

**simultaneity.ts** - New module in `src/charts/`:
- Event placement/removal logic (max 4 events)
- Reference event selection and management
- Simultaneity line rendering and animation
- Temporal relationship calculation
- Color-coded event visualization
- Smooth D3 transitions between reference frames
- Click interaction handling

**Reuses existing infrastructure:**
- `minkowski-core.ts` - Scales, SVG setup, axes, grid, tooltips
- `minkowski-types.ts` - Base controller interface
- `minkowski-colors.ts` - Color palette constants

### Integration Points

**index.html:**
- New tab "Simultaneity" in navigation
- Controls: velocity slider, Reset button, Clear All button
- Coordinate display panel
- SVG container for diagram

**eventHandlers.ts:**
- New handler for velocity slider updates
- Debounced to prevent excessive re-renders

**main.ts:**
- Controller storage and lifecycle management
- Initialization on tab activation
- Cleanup on navigation away

## Data Model

### Event Structure

```typescript
interface SimultaneityEvent {
    id: string;              // "A", "B", "C", "D"
    ct: number;              // Time coordinate (km)
    x: number;               // Space coordinate (km)
    isReference: boolean;    // Reference event flag
    temporalOrder: 'future' | 'past' | 'simultaneous';
}
```

### Controller State

```typescript
interface SimultaneityState {
    events: SimultaneityEvent[];
    velocity: number;                   // Fraction of c
    gamma: number;                      // Lorentz factor
    referenceEventId: string | null;
}
```

### Preset Data: Einstein's Train Example

Two symmetric events representing lightning strikes:
- Event A (rear): ct = 2s × c ≈ 599,584.916 km, x = -300,000 km
- Event B (front): ct = 2s × c ≈ 599,584.916 km, x = +300,000 km

Both simultaneous in stationary frame (same ct coordinate). Separation = 600,000 km (2 light-seconds).

## Physics Model

### Temporal Ordering Calculation

For each event relative to reference event:

```
γ = 1 / √(1 - β²)

ct'_event = γ(ct_event - β·x_event)
ct'_ref = γ(ct_ref - β·x_ref)

Δct' = ct'_event - ct'_ref

If |Δct'| < 0.01 km: simultaneous
If Δct' > 0: future
If Δct' < 0: past
```

### Simultaneity Line

Line through reference event in moving frame:
- Slope = β (velocity as fraction of c)
- Angle = arctan(β)
- In moving frame, this is a horizontal line (constant ct')
- Rotates smoothly as velocity changes

## Visual Design

### Event Rendering

- **Circle markers** (radius 8px) with labels "A", "B", "C", "D"
- **Reference event**: Cyan border (#00d9ff), pulsing glow animation
- **Future events**: Green fill (#00ff9f) with glow
- **Past events**: Amber fill (#ffaa00) with glow
- **Simultaneous events**: White fill (#e8f1f5) with glow
- **Hover**: Tooltip showing coordinates in both frames
- **Placement**: Scale-in animation with ripple effect
- **Removal**: Scale-out with fade
- **Color transitions**: 500ms smooth transitions when order changes

### Simultaneity Line

- Dashed cyan line through reference event
- Semi-transparent gradient band (15px wide) centered on line
- Glow effect matching reference color
- Rotation animation: 300ms with elastic easing
- Brief ghost trail (200ms fade) showing previous position

### Reference Frame Axes

- **Initial state**: Horizontal (x) and vertical (ct) axes
- **Transformation**: Axes tilt smoothly as velocity changes
- ct' axis slope = 1/β (tilts toward future light cone)
- x' axis slope = β (tilts toward spatial axis)
- **Animation**: Elastic easing, 300ms duration
- **Labels**: "ct'", "x'" with current velocity displayed
- **Grid**: Fades to 50% during transition, brightens when settled

### Coordinate Display

Floating result grid showing selected event's coordinates:
- Rest frame: (ct, x)
- Moving frame: (ct', x')
- Numbers animate when changing
- Highlight changed values

### Light Cones (Optional)

Future and past light cones through reference event:
- Dashed amber lines at ±45° angles
- Helps visualize causal structure
- Subtle, doesn't overpower main visualization

## UI Controls

### Layout

```html
<div class="calc-section">
  <!-- Header with link -->

  <!-- Controls row -->
  <div class="input-group-custom">
    <div style="flex: 2;">
      <input type="range" id="simVelocitySlider"
             min="-0.9" max="0.9" step="0.01" value="0">
      <span id="simVelocityValue">v = 0.00c</span>
    </div>
    <button id="simResetButton">Reset</button>
    <button id="simClearButton">Clear All</button>
  </div>

  <!-- Instructions -->
  <div class="result-box">
    Click to place/remove events (max 4). First event is reference.
  </div>

  <!-- Coordinate display -->
  <div class="result-grid" id="simCoordinateDisplay"></div>

  <!-- SVG diagram -->
  <div id="simultaneityContainer"></div>
</div>
```

### Control Behavior

**Velocity Slider:**
- Range: -0.9c to +0.9c (step 0.01)
- Snaps to v=0 when within 0.05c
- Live value display updates continuously
- Triggers smooth animation of axes and simultaneity line

**Reset Button:**
- Restores Einstein train example (events A and B)
- Resets velocity to 0
- Smooth transition

**Clear All Button:**
- Removes all events
- Blank canvas for exploration
- Velocity unchanged

## Interaction Model

### Event Placement

1. User clicks empty space on diagram
2. Check if under limit (4 events)
3. Convert click coordinates to spacetime coordinates
4. Create new event with next available label
5. If first event, mark as reference
6. Animate event appearance (scale-in + ripple)
7. Calculate temporal ordering for all events
8. Update display

### Event Removal

1. User clicks on existing event
2. Detect click within event radius (~15px tolerance)
3. Animate event disappearance (scale-out + fade)
4. Remove from state
5. If removed event was reference, make first remaining event new reference
6. Recalculate temporal ordering
7. Update display

### Velocity Change

1. User drags slider
2. Update velocity value display
3. Recalculate gamma
4. For each event, recalculate temporal ordering
5. Trigger smooth D3 transitions:
   - Axis rotation (300ms, elastic easing)
   - Simultaneity line rotation (300ms, elastic easing)
   - Event color changes (500ms, smooth)
   - Grid fade/brighten
6. Update coordinate display

## Implementation Details

### Core Functions

```typescript
export function createSimultaneityDiagram(
    container: HTMLElement
): SimultaneityController

function calculateTemporalOrder(
    eventCt: number,
    eventX: number,
    refCt: number,
    refX: number,
    beta: number
): 'future' | 'past' | 'simultaneous'

function handleDiagramClick(event: MouseEvent): void

function updateVelocity(newVelocity: number): void

function renderEvents(): void

function renderSimultaneityLine(): void

function renderAxes(): void

function updateCoordinateDisplay(eventId: string): void
```

### Animation Choreography

Velocity change triggers coordinated animations:
1. Grid fades to 50% opacity (100ms)
2. Axes and simultaneity line rotate together (300ms, elastic easing)
3. Grid brightens back to 100% (100ms)
4. Event colors transition (500ms, overlapping with rotation)
5. Coordinate numbers count/animate to new values

All transitions use D3's `.transition()` with named transitions to prevent conflicts.

## Color Palette

Consistent with existing design:
- **Cyan (#00d9ff)**: Reference event, original frame axes
- **Green (#00ff9f)**: Future events, transformed axes
- **Amber (#ffaa00)**: Past events, light cones
- **White (#e8f1f5)**: Simultaneous events, labels
- **Backgrounds**: rgba(0,0,0,0.3-0.6)

## Responsive Design

- SVG scales to container width via viewBox
- Maintains square aspect ratio
- Event interaction radius scales appropriately
- Touch-friendly hit targets on mobile (min 44px)
- Debounced resize handler (250ms)
- Text labels remain readable at all sizes

## Success Criteria

1. Tab renders with Einstein train example pre-loaded
2. Velocity slider smoothly animates reference frame transformation
3. Users can place up to 4 events by clicking
4. Users can remove events by clicking on them
5. First event automatically becomes reference
6. Temporal ordering (future/past/simultaneous) updates correctly
7. Event colors reflect temporal relationships and transition smoothly
8. Simultaneity line rotates with reference frame
9. Reset button restores train example
10. Clear All button removes all events
11. Coordinate display shows transformed coordinates
12. All animations are smooth and performant
13. Responsive across all viewport sizes
14. Visual polish matches existing tab quality

## Educational Value

This visualization demonstrates:
- Events simultaneous in one frame aren't in another
- Simultaneity is relative, not absolute
- Temporal ordering can change between frames (for spacelike-separated events)
- The geometry of spacetime (Minkowski diagram)
- How Lorentz transformations affect coordinates
- The train paradox resolution
