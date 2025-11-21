# D3.js Minkowski Diagram Design

**Date:** 2025-11-21
**Status:** Approved
**Author:** Design Session

## Overview

Refactor the Minkowski spacetime diagram from HTML5 Canvas (raster) to D3.js with SVG (vector) for resolution-independent rendering, rich interactivity, and smooth animations. This improves visual quality across all displays and enables educational features like frame transformation animations.

## Goals

1. **Resolution Independence:** SVG scales perfectly on any display density
2. **Interactivity:** Hover/tap tooltips on all elements for educational value
3. **Smooth Animations:** Transitions when values change, auto-play frame interpolation
4. **Mobile-First:** Touch-friendly with responsive design for tablets and phones
5. **Maintainability:** Modular architecture with clear separation of concerns
6. **Performance:** Lightweight bundle using modular D3 imports

## Architecture

### Technology Stack

**D3.js Modular Imports:**
- `d3-selection` - DOM manipulation and data binding
- `d3-scale` - Coordinate transformations
- `d3-transition` - Smooth animations
- `d3-ease` - Easing functions (cubic-in-out, ease-in-out)
- `d3-timer` - Frame animation loop

Bundle impact: ~50-60kb (vs ~300kb for full D3)

### File Structure

```
src/charts/
├── minkowski.ts           # Main implementation
├── minkowski-types.ts     # TypeScript interfaces
└── minkowski-colors.ts    # Color palette constants
```

### Main Function Signature

```typescript
export function drawMinkowskiDiagram(
  container: HTMLElement | SVGSVGElement,
  data: MinkowskiData
): MinkowskiController

interface MinkowskiController {
  update(data: MinkowskiData): void;  // Update with new data
  pause(): void;                       // Pause auto-play animation
  play(): void;                        // Resume auto-play animation
  destroy(): void;                     // Cleanup and remove
}

interface MinkowskiData {
  time: number;           // Time coordinate in seconds
  distance: number;       // Distance coordinate in km
  velocity: number;       // Relative velocity as fraction of c
  deltaTPrime: number;    // Transformed time coordinate
  deltaXPrime: number;    // Transformed distance coordinate
  intervalType: string;   // "timelike", "spacelike", or "lightlike"
}
```

## Visual Design

### Modernized Color Palette

**Primary Colors:**
- **Electric Blue** `#00B4D8` - Original frame axes (ct, x)
- **Quantum Green** `#06FFA5` - Moving frame axes (ct', x')
- **Photon Gold** `#FFB703` - Light cones
- **Plasma White** `#F8F9FA` - Events, labels, interval line

**Interval Type Indicators:**
- **Timelike** `#4CC9F0` - Causally connected (inside light cone)
- **Spacelike** `#FB8500` - Not causally connected (outside light cone)
- **Lightlike** `#FFD60A` - On light cone (light-speed separation)

**Visual Enhancements:**
- Gradient strokes on axes (solid → glow at endpoints)
- Drop shadows on event points for depth
- Glow filters on interactive elements (hover/tap)
- Semi-transparent gradient fills for light cone regions
- Text with subtle dark halos for readability (SVG text-stroke)

**Accessibility:** All color combinations meet WCAG AA contrast ratios.

### SVG Structure

```xml
<svg viewBox="0 0 900 900" preserveAspectRatio="xMidYMid meet">
  <defs>
    <!-- Gradients, filters, markers -->
  </defs>

  <g class="background">
    <!-- Light cone fills -->
  </g>

  <g class="light-cones">
    <!-- Dashed light cone lines -->
  </g>

  <g class="simultaneity-lines">
    <!-- Dashed simultaneity/position lines -->
  </g>

  <g class="axes">
    <!-- Original and moving frame axes -->
  </g>

  <g class="interval">
    <!-- Line from origin to event -->
  </g>

  <g class="events">
    <!-- Origin and event points -->
  </g>

  <g class="labels">
    <!-- Coordinate labels, axis labels -->
  </g>

  <g class="controls">
    <!-- Pause/play button overlay -->
  </g>
</svg>
```

## Interactive Features

### 1. Hover/Tap Tooltips

**Implementation:**
- Desktop: Show on mouseenter, hide on mouseleave
- Mobile: Show on first tap, hide on second tap or tap elsewhere
- Position near cursor/touch point with 10px offset
- Fade in over 200ms, fade out over 150ms
- Auto-hide after 3 seconds on mobile

**Tooltip Content:**

| Element | Tooltip |
|---------|---------|
| Original frame axes | "ct axis - Original Frame (time)" / "x axis - Original Frame (space)" |
| Moving frame axes | "ct' axis - Moving Frame (time)" / "x' axis - Moving Frame (space)" |
| Origin point | "Event 1: Origin (0, 0)" |
| Event point | "Event 2: (ct={value}, x={value})<br>Moving frame: (ct'={value}, x'={value})<br>Interval: {type}" |
| Light cones | "Light cone from origin" / "Light cone from event" |
| Simultaneity lines | "Line of simultaneity - {frame}" / "Line of constant position - {frame}" |

**Styling:**
```css
.minkowski-tooltip {
  position: absolute;
  background: rgba(10, 14, 39, 0.95);
  border: 1px solid #00B4D8;
  padding: 8px 12px;
  border-radius: 4px;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 12px;
  color: #F8F9FA;
  pointer-events: none;
  z-index: 1000;
  box-shadow: 0 0 15px rgba(0, 180, 216, 0.5);
}
```

### 2. Smooth Transitions

When input values change (time, distance, velocity), animate all elements over 600ms using `d3.transition()` with `d3.easeCubicInOut`:

**Animated Properties:**
- Axis rotation angles
- Event point positions
- Simultaneity line positions and angles
- Interval line endpoint
- Light cone positions
- Label positions and content (fade out/in if significantly different)

**Performance:** Use CSS transforms for GPU acceleration where possible.

### 3. Auto-Play Frame Animation

**Concept:** Continuously interpolate between the original frame perspective and the moving frame perspective to help users understand how different observers see the same spacetime events.

**Implementation:**
- 4-second seamless loop using `d3.timer`
- t = 0-2s: Transition from original → moving frame view
- t = 2-4s: Transition from moving → original frame view
- Interpolation parameter: `p = (1 - cos(t * π / 2)) / 2` for smooth ease-in-out

**Visual Interpolation:**
- Axis angles: lerp between orthogonal and tilted
- Coordinate label prominence: cross-fade between (ct, x) and (ct', x')
- Grid line emphasis: fade original/moving frame guides

**Controls:**
- Pause/play button in bottom-right corner (48×48px tap target)
- Semi-transparent background, becomes opaque on hover
- Always visible on mobile, fades to 30% opacity on desktop
- Pauses automatically when tab/window hidden (document.visibilitychange)

## Responsive Design

### Breakpoint Strategy

| Breakpoint | Viewport | Adaptations |
|------------|----------|-------------|
| Desktop | >768px | Full features, standard sizes, all labels |
| Tablet | 480-768px | Larger tap targets, condensed labels |
| Mobile | <480px | Largest tap targets, minimal labels |

### Touch Optimizations

**Tap Targets:**
- Desktop: Event points 8px radius
- Tablet: Event points 12px radius
- Mobile: Event points 16px radius
- All devices: Invisible 20px-wide hit areas around lines/axes

**Touch Event Handling:**
```typescript
// Capture touch events on SVG
svg.on('touchstart', handleTouchStart)
   .on('touchmove', handleTouchMove)
   .on('touchend', handleTouchEnd);

// Prevent default to avoid page scrolling conflicts within diagram
event.preventDefault();

// Long-press (500ms) shows detailed tooltip
```

**Gesture Prevention:**
- Prevent pinch-zoom within SVG (touch-action: none)
- Allow page scrolling outside diagram
- No conflicts with browser back/forward gestures

### Text Scaling

Font sizes via SVG `<style>` block with media queries:

```css
/* Desktop */
text.label { font-size: 13px; }
text.header { font-size: 15px; }

/* Tablet */
@media (max-width: 768px) {
  text.label { font-size: 12px; }
  text.header { font-size: 14px; }
}

/* Mobile */
@media (max-width: 480px) {
  text.label { font-size: 11px; }
  text.header { font-size: 13px; }
  text.secondary { display: none; }
}
```

### Responsive Behavior

**Window Resize:**
- Debounced handler (150ms) to prevent excessive updates
- Update scales and reposition elements (no full rebuild)
- SVG viewBox remains constant (900×900)
- CSS handles physical sizing: `width: 100%; height: auto;`

**Performance Considerations:**
- Transitions use CSS `transform` (GPU-accelerated)
- Maximum 60fps with d3.timer throttling
- Auto-play pauses when tab inactive (document.hidden)
- Tooltip positioning uses requestAnimationFrame
- Lazy initialization of filters/gradients

## Component Implementation

### Core Functions

```typescript
function setupSVG(container: HTMLElement): SVGSVGElement {
  // Create/select SVG with viewBox, append groups
  // Return SVG element
}

function createScales(data: MinkowskiData): ScaleSet {
  // Calculate extent and create x/y scales
  // Return { xScale, yScale, maxCoord }
}

function renderAxes(
  svg: SVGSVGElement,
  scales: ScaleSet,
  data: MinkowskiData
): void {
  // Draw original frame axes (orthogonal)
  // Draw moving frame axes (tilted)
  // Add gradients, arrows, labels
}

function renderLightCones(
  svg: SVGSVGElement,
  scales: ScaleSet,
  data: MinkowskiData
): void {
  // Draw light cone fills (causal regions)
  // Draw dashed light cone lines
  // From origin and through event point
}

function renderSimultaneityLines(
  svg: SVGSVGElement,
  scales: ScaleSet,
  data: MinkowskiData
): void {
  // Original frame: horizontal (simultaneity) + vertical (position)
  // Moving frame: tilted lines parallel to axes
}

function renderEvents(
  svg: SVGSVGElement,
  scales: ScaleSet,
  data: MinkowskiData
): void {
  // Origin point (white)
  // Event point (color-coded by interval type)
  // Interval line connecting them
  // Invisible hit areas for tooltips
}

function renderLabels(
  svg: SVGSVGElement,
  scales: ScaleSet,
  data: MinkowskiData
): void {
  // Coordinate labels for events
  // Causal relationship indicator
  // Format large/small numbers appropriately
}

function setupTooltips(svg: SVGSVGElement): TooltipController {
  // Create tooltip div
  // Attach event listeners to SVG elements
  // Handle desktop hover and mobile tap
  // Return { show, hide, destroy }
}

function startFrameAnimation(
  svg: SVGSVGElement,
  controller: MinkowskiController
): AnimationController {
  // Use d3.timer for 4-second loop
  // Interpolate between frame perspectives
  // Update visual emphasis and labels
  // Return { pause, play, stop }
}

function updateDiagram(
  svg: SVGSVGElement,
  data: MinkowskiData,
  transition: boolean = true
): void {
  // Update scales for new data
  // Transition existing elements to new positions
  // Update labels and colors
}
```

### State Management

Use closure to maintain state:

```typescript
export function drawMinkowskiDiagram(
  container: HTMLElement | SVGSVGElement,
  data: MinkowskiData
): MinkowskiController {

  // Internal state
  let svg: SVGSVGElement;
  let scales: ScaleSet;
  let tooltips: TooltipController;
  let animation: AnimationController;
  let isPlaying = true;

  // Initialize
  svg = setupSVG(container);
  scales = createScales(data);
  renderAll(svg, scales, data);
  tooltips = setupTooltips(svg);
  animation = startFrameAnimation(svg, controller);

  // Setup resize handler
  const resizeHandler = debounce(() => {
    scales = createScales(data);
    updateDiagram(svg, data, false);
  }, 150);

  window.addEventListener('resize', resizeHandler);

  // Public API
  const controller: MinkowskiController = {
    update(newData: MinkowskiData) {
      data = newData;
      scales = createScales(data);
      updateDiagram(svg, data, true);
    },

    pause() {
      isPlaying = false;
      animation.pause();
    },

    play() {
      isPlaying = true;
      animation.play();
    },

    destroy() {
      window.removeEventListener('resize', resizeHandler);
      tooltips.destroy();
      animation.stop();
      svg.remove();
    }
  };

  return controller;
}
```

## Migration Strategy

**Direct Replacement Approach:**

1. Install D3 modules: `yarn add d3-selection d3-scale d3-transition d3-ease d3-timer`
2. Create new implementation in `src/charts/minkowski.ts`
3. Update imports in `src/main.ts` and `src/ui/eventHandlers.ts`
4. Change HTML from `<canvas>` to container `<div>` in `index.html`
5. Remove canvas-specific styles, add SVG styles
6. Test across breakpoints and devices
7. Remove old canvas implementation

**No backward compatibility needed** - direct replacement simplifies the codebase.

## Testing Strategy

**Manual Testing Checklist:**
- [ ] Desktop: All tooltips work on hover
- [ ] Desktop: Smooth transitions when changing inputs
- [ ] Desktop: Auto-play animation loops correctly
- [ ] Desktop: Pause/play button works
- [ ] Tablet: All tap targets are accessible
- [ ] Tablet: Tooltips appear/disappear on tap
- [ ] Mobile: Event points are easily tappable
- [ ] Mobile: Text is readable, secondary labels hidden
- [ ] Mobile: No scroll conflicts with diagram
- [ ] All: Resize window smoothly updates diagram
- [ ] All: Colors meet contrast requirements
- [ ] All: Frame animation is smooth and educational

**Browser Testing:**
- Chrome/Edge (desktop, tablet, mobile)
- Firefox (desktop, tablet, mobile)
- Safari (macOS, iOS)

## Performance Targets

- Initial render: <100ms
- Transition animations: 60fps
- Window resize: <50ms to update
- Bundle size increase: <60kb
- Memory usage: <10MB for diagram instance

## Future Enhancements (Not in Scope)

- Export diagram as PNG/SVG file
- Click on diagram to set event coordinates
- Multiple simultaneous events on one diagram
- 3D spacetime diagram (x, y, ct)
- Custom color themes

## Success Criteria

✅ SVG renders crisply on all displays (retina, 4K, mobile)
✅ Tooltips provide educational context for all elements
✅ Smooth transitions when input values change
✅ Auto-play frame animation helps visualize reference frames
✅ Works perfectly on tablets and phones
✅ Bundle size increase stays under 60kb
✅ Code is more maintainable than canvas implementation

## References

- Current implementation: `src/charts/minkowski.ts` (canvas version)
- D3.js documentation: https://d3js.org/
- SVG specification: https://www.w3.org/TR/SVG2/
- Touch events: https://developer.mozilla.org/en-US/docs/Web/API/Touch_events
