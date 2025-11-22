# D3.js Minkowski Diagram Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the Canvas-based Minkowski diagram with a D3.js SVG implementation that provides resolution-independent rendering, interactive tooltips, smooth transitions, and an auto-play frame animation.

**Architecture:** Modular D3 implementation using closure-based state management. The main function returns a controller object for external control. SVG uses viewBox for responsiveness. Tooltip system uses separate HTML div for better cross-browser support.

**Tech Stack:** D3.js (modular imports), TypeScript, SVG, CSS transitions

---

## Task 1: Install D3.js Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install D3 modular packages**

Run:
```bash
yarn add d3-selection d3-scale d3-transition d3-ease d3-timer
```

Expected: Dependencies added to package.json, yarn.lock updated

**Step 2: Verify installation**

Run:
```bash
yarn why d3-selection
```

Expected: Shows d3-selection@^3.0.0 installed

**Step 3: Commit**

```bash
git add package.json yarn.lock
git commit -m "feat: add D3.js modular dependencies for Minkowski diagram

Add d3-selection, d3-scale, d3-transition, d3-ease, d3-timer
for SVG-based spacetime diagram implementation.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2: Create Color Constants File

**Files:**
- Create: `src/charts/minkowski-colors.ts`

**Step 1: Create color palette constants**

Create file `src/charts/minkowski-colors.ts` with:

```typescript
/**
 * Modernized color palette for Minkowski diagram
 * All colors meet WCAG AA contrast requirements
 */

export const COLORS = {
    // Primary frame colors
    electricBlue: '#00B4D8',      // Original frame (ct, x)
    quantumGreen: '#06FFA5',      // Moving frame (ct', x')
    photonGold: '#FFB703',        // Light cones
    plasmaWhite: '#F8F9FA',       // Events, labels

    // Interval type indicators
    timelike: '#4CC9F0',          // Causally connected
    spacelike: '#FB8500',         // Not causally connected
    lightlike: '#FFD60A',         // On light cone

    // UI elements
    background: 'rgba(0, 0, 0, 0)',
    tooltipBg: 'rgba(10, 14, 39, 0.95)',
    tooltipBorder: '#00B4D8',

    // Opacity modifiers
    lightConeFill: '15',          // Hex opacity for fills
    dashedLine: '80',             // Hex opacity for dashed lines
    simultaneity: '50',           // Hex opacity for simultaneity lines
} as const;

export type ColorKey = keyof typeof COLORS;
```

**Step 2: Commit**

```bash
git add src/charts/minkowski-colors.ts
git commit -m "feat: add modernized color palette for Minkowski diagram

Define WCAG AA compliant colors with better contrast
and visual depth for SVG implementation.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 3: Create TypeScript Types File

**Files:**
- Create: `src/charts/minkowski-types.ts`

**Step 1: Move and extend types**

Create file `src/charts/minkowski-types.ts` with:

```typescript
/**
 * TypeScript interfaces for Minkowski diagram
 */

export interface MinkowskiData {
    time: number;           // Time coordinate in seconds
    distance: number;       // Distance coordinate in km
    velocity: number;       // Relative velocity as fraction of c
    deltaTPrime: number;    // Transformed time coordinate
    deltaXPrime: number;    // Transformed distance coordinate
    intervalType: string;   // "timelike", "spacelike", or "lightlike"
}

export interface MinkowskiController {
    update(data: MinkowskiData): void;  // Update with new data
    pause(): void;                       // Pause auto-play animation
    play(): void;                        // Resume auto-play animation
    destroy(): void;                     // Cleanup and remove
}

export interface ScaleSet {
    xScale: (value: number) => number;
    yScale: (value: number) => number;
    maxCoord: number;
}

export interface TooltipController {
    show(content: string, x: number, y: number): void;
    hide(): void;
    destroy(): void;
}

export interface AnimationController {
    pause(): void;
    play(): void;
    stop(): void;
}
```

**Step 2: Commit**

```bash
git add src/charts/minkowski-types.ts
git commit -m "feat: add TypeScript interfaces for D3 Minkowski diagram

Define controller interfaces for diagram control,
tooltips, and animation management.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 4: Create Main D3 Implementation - Part 1 (Setup)

**Files:**
- Create: `src/charts/minkowski.ts`

**Step 1: Create file with imports and helper functions**

Create file `src/charts/minkowski.ts` with:

```typescript
import { select, Selection } from 'd3-selection';
import { scaleLinear } from 'd3-scale';
import { transition } from 'd3-transition';
import { easeCubicInOut, easeInOut } from 'd3-ease';
import { timer, Timer } from 'd3-timer';
import { COLORS } from './minkowski-colors';
import type {
    MinkowskiData,
    MinkowskiController,
    ScaleSet,
    TooltipController,
    AnimationController
} from './minkowski-types';

// Re-export types for backward compatibility
export type { MinkowskiData };

// Speed of light constant
const C = 299792.458; // km/s

/**
 * Debounce helper for resize events
 */
function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: number | undefined;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = window.setTimeout(() => func(...args), wait);
    };
}

/**
 * Format coordinate value for display
 */
function formatCoordinate(value: number): string {
    if (Math.abs(value) < 0.001 || Math.abs(value) > 10000) {
        return value.toExponential(2);
    }
    return value.toFixed(2);
}

/**
 * Create coordinate scales for spacetime diagram
 */
function createScales(data: MinkowskiData, size: number): ScaleSet {
    const ct = data.time * C;
    const x = data.distance;
    const beta = data.velocity;
    const gamma = 1 / Math.sqrt(1 - beta * beta);

    const ctPrime = gamma * (ct - beta * x);
    const xPrime = gamma * (x - beta * ct);

    // Calculate extent with 20% padding
    const maxCoord = Math.max(
        Math.abs(ct),
        Math.abs(x),
        Math.abs(ctPrime),
        Math.abs(xPrime)
    ) * 1.2;

    const centerX = size / 2;
    const centerY = size / 2;
    const scale = (size / 2) / maxCoord;

    return {
        xScale: (xCoord: number) => centerX + xCoord * scale,
        yScale: (ctCoord: number) => centerY - ctCoord * scale,
        maxCoord
    };
}
```

**Step 2: Commit**

```bash
git add src/charts/minkowski.ts
git commit -m "feat: add D3 Minkowski diagram setup and helpers

Add imports, constants, and helper functions for
coordinate scaling and formatting.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 5: Create Main D3 Implementation - Part 2 (SVG Setup)

**Files:**
- Modify: `src/charts/minkowski.ts`

**Step 1: Add SVG initialization function**

Append to `src/charts/minkowski.ts`:

```typescript
/**
 * Setup or select SVG element with proper structure
 */
function setupSVG(container: HTMLElement): Selection<SVGSVGElement, unknown, null, undefined> {
    const size = 900;

    // Remove existing SVG if present
    select(container).select('svg').remove();

    // Create new SVG with viewBox
    const svg = select(container)
        .append('svg')
        .attr('viewBox', `0 0 ${size} ${size}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .style('width', '100%')
        .style('height', 'auto')
        .style('display', 'block');

    // Add style block for text
    svg.append('defs')
        .append('style')
        .text(`
            text {
                font-family: 'IBM Plex Mono', monospace;
                user-select: none;
                pointer-events: none;
            }
            text.label { font-size: 13px; }
            text.header { font-size: 15px; font-weight: bold; }
            text.secondary { font-size: 11px; }

            @media (max-width: 768px) {
                text.label { font-size: 12px; }
                text.header { font-size: 14px; }
            }

            @media (max-width: 480px) {
                text.label { font-size: 11px; }
                text.header { font-size: 13px; }
                text.secondary { display: none; }
            }
        `);

    // Add gradient definitions
    const defs = svg.select('defs');

    // Gradient for original frame axis
    defs.append('linearGradient')
        .attr('id', 'axisGradientBlue')
        .attr('x1', '0%').attr('y1', '0%')
        .attr('x2', '0%').attr('y2', '100%')
        .selectAll('stop')
        .data([
            { offset: '0%', color: COLORS.electricBlue, opacity: 0.3 },
            { offset: '50%', color: COLORS.electricBlue, opacity: 1 },
            { offset: '100%', color: COLORS.electricBlue, opacity: 0.3 }
        ])
        .join('stop')
        .attr('offset', d => d.offset)
        .attr('stop-color', d => d.color)
        .attr('stop-opacity', d => d.opacity);

    // Gradient for moving frame axis
    defs.append('linearGradient')
        .attr('id', 'axisGradientGreen')
        .attr('x1', '0%').attr('y1', '0%')
        .attr('x2', '0%').attr('y2', '100%')
        .selectAll('stop')
        .data([
            { offset: '0%', color: COLORS.quantumGreen, opacity: 0.3 },
            { offset: '50%', color: COLORS.quantumGreen, opacity: 1 },
            { offset: '100%', color: COLORS.quantumGreen, opacity: 0.3 }
        ])
        .join('stop')
        .attr('offset', d => d.offset)
        .attr('stop-color', d => d.color)
        .attr('stop-opacity', d => d.opacity);

    // Glow filter for interactive elements
    const filter = defs.append('filter')
        .attr('id', 'glow')
        .attr('x', '-50%').attr('y', '-50%')
        .attr('width', '200%').attr('height', '200%');

    filter.append('feGaussianBlur')
        .attr('stdDeviation', '3')
        .attr('result', 'coloredBlur');

    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Arrow marker for axes
    defs.append('marker')
        .attr('id', 'arrowBlue')
        .attr('viewBox', '0 0 10 10')
        .attr('refX', '5').attr('refY', '5')
        .attr('markerWidth', '6').attr('markerHeight', '6')
        .attr('orient', 'auto-start-reverse')
        .append('path')
        .attr('d', 'M 0 0 L 10 5 L 0 10 z')
        .attr('fill', COLORS.electricBlue);

    defs.append('marker')
        .attr('id', 'arrowGreen')
        .attr('viewBox', '0 0 10 10')
        .attr('refX', '5').attr('refY', '5')
        .attr('markerWidth', '6').attr('markerHeight', '6')
        .attr('orient', 'auto-start-reverse')
        .append('path')
        .attr('d', 'M 0 0 L 10 5 L 0 10 z')
        .attr('fill', COLORS.quantumGreen);

    // Create layer groups
    svg.append('g').attr('class', 'background');
    svg.append('g').attr('class', 'light-cones');
    svg.append('g').attr('class', 'simultaneity-lines');
    svg.append('g').attr('class', 'axes');
    svg.append('g').attr('class', 'interval');
    svg.append('g').attr('class', 'events');
    svg.append('g').attr('class', 'labels');
    svg.append('g').attr('class', 'controls');

    return svg;
}
```

**Step 2: Commit**

```bash
git add src/charts/minkowski.ts
git commit -m "feat: add SVG initialization for Minkowski diagram

Create SVG structure with viewBox, gradients, filters,
and layer groups for D3 rendering.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 6: Create Main D3 Implementation - Part 3 (Rendering Functions)

**Files:**
- Modify: `src/charts/minkowski.ts`

**Step 1: Add rendering functions for diagram elements**

Append to `src/charts/minkowski.ts`:

```typescript
/**
 * Render light cones
 */
function renderLightCones(
    svg: Selection<SVGSVGElement, unknown, null, undefined>,
    scales: ScaleSet,
    data: MinkowskiData,
    withTransition: boolean
): void {
    const ct = data.time * C;
    const x = data.distance;
    const extent = scales.maxCoord;

    const lightConesGroup = svg.select('g.light-cones');
    const backgroundGroup = svg.select('g.background');

    // Light cone fill data
    const fillData = (ct !== 0 || x !== 0) ? [
        { points: [[0, 0], [extent, extent], [extent, -extent]], class: 'future' },
        { points: [[0, 0], [-extent, -extent], [-extent, extent]], class: 'past' }
    ] : [];

    backgroundGroup.selectAll('polygon')
        .data(fillData)
        .join('polygon')
        .attr('points', d => d.points.map(p =>
            `${scales.xScale(p[0])},${scales.yScale(p[1])}`
        ).join(' '))
        .attr('fill', `${COLORS.photonGold}${COLORS.lightConeFill}`)
        .attr('stroke', 'none');

    // Light cone lines
    const lineData = [
        { x1: -extent, y1: -extent, x2: extent, y2: extent, from: 'origin' },
        { x1: -extent, y1: extent, x2: extent, y2: -extent, from: 'origin' }
    ];

    if (ct !== 0 || x !== 0) {
        lineData.push(
            { x1: x - extent, y1: ct - extent, x2: x + extent, y2: ct + extent, from: 'event' },
            { x1: x - extent, y1: ct + extent, x2: x + extent, y2: ct - extent, from: 'event' }
        );
    }

    const lines = lightConesGroup.selectAll('line')
        .data(lineData)
        .join('line')
        .attr('stroke', `${COLORS.photonGold}${COLORS.dashedLine}`)
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5')
        .style('cursor', 'help');

    if (withTransition) {
        lines.transition().duration(600).ease(easeCubicInOut)
            .attr('x1', d => scales.xScale(d.x1))
            .attr('y1', d => scales.yScale(d.y1))
            .attr('x2', d => scales.xScale(d.x2))
            .attr('y2', d => scales.yScale(d.y2));
    } else {
        lines.attr('x1', d => scales.xScale(d.x1))
            .attr('y1', d => scales.yScale(d.y1))
            .attr('x2', d => scales.xScale(d.x2))
            .attr('y2', d => scales.yScale(d.y2));
    }
}

/**
 * Render reference frame axes
 */
function renderAxes(
    svg: Selection<SVGSVGElement, unknown, null, undefined>,
    scales: ScaleSet,
    data: MinkowskiData,
    withTransition: boolean
): void {
    const extent = scales.maxCoord;
    const beta = data.velocity;
    const angle = Math.atan(beta);
    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);

    const axesGroup = svg.select('g.axes');

    // Original frame axes (orthogonal)
    const originalAxes = [
        { x1: 0, y1: -extent, x2: 0, y2: extent, color: COLORS.electricBlue, frame: 'original', axis: 'ct' },
        { x1: -extent, y1: 0, x2: extent, y2: 0, color: COLORS.electricBlue, frame: 'original', axis: 'x' }
    ];

    // Moving frame axes (tilted)
    const ctPrimeLength = extent / cosAngle;
    const xPrimeLength = extent / cosAngle;

    const movingAxes = [
        {
            x1: -ctPrimeLength * sinAngle,
            y1: -ctPrimeLength * cosAngle,
            x2: ctPrimeLength * sinAngle,
            y2: ctPrimeLength * cosAngle,
            color: COLORS.quantumGreen,
            frame: 'moving',
            axis: 'ct\''
        },
        {
            x1: -xPrimeLength * cosAngle,
            y1: -xPrimeLength * sinAngle,
            x2: xPrimeLength * cosAngle,
            y2: xPrimeLength * sinAngle,
            color: COLORS.quantumGreen,
            frame: 'moving',
            axis: 'x\''
        }
    ];

    const allAxes = [...originalAxes, ...movingAxes];

    const axisLines = axesGroup.selectAll('line')
        .data(allAxes)
        .join('line')
        .attr('stroke', d => d.color)
        .attr('stroke-width', 3)
        .attr('marker-end', d => d.frame === 'original' ? 'url(#arrowBlue)' : 'url(#arrowGreen)')
        .style('cursor', 'help');

    if (withTransition) {
        axisLines.transition().duration(600).ease(easeCubicInOut)
            .attr('x1', d => scales.xScale(d.x1))
            .attr('y1', d => scales.yScale(d.y1))
            .attr('x2', d => scales.xScale(d.x2))
            .attr('y2', d => scales.yScale(d.y2));
    } else {
        axisLines.attr('x1', d => scales.xScale(d.x1))
            .attr('y1', d => scales.yScale(d.y1))
            .attr('x2', d => scales.xScale(d.x2))
            .attr('y2', d => scales.yScale(d.y2));
    }
}

/**
 * Render simultaneity and position lines
 */
function renderSimultaneityLines(
    svg: Selection<SVGSVGElement, unknown, null, undefined>,
    scales: ScaleSet,
    data: MinkowskiData,
    withTransition: boolean
): void {
    const ct = data.time * C;
    const x = data.distance;
    const extent = scales.maxCoord;
    const beta = data.velocity;
    const angle = Math.atan(beta);
    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);

    const simGroup = svg.select('g.simultaneity-lines');

    if (ct === 0 && x === 0) {
        simGroup.selectAll('line').remove();
        return;
    }

    const lineData = [
        // Original frame
        { x1: -extent, y1: ct, x2: extent, y2: ct, color: COLORS.electricBlue, frame: 'original' },
        { x1: x, y1: -extent, x2: x, y2: extent, color: COLORS.electricBlue, frame: 'original' },
        // Moving frame
        {
            x1: x - extent / cosAngle * cosAngle,
            y1: ct - extent / cosAngle * sinAngle,
            x2: x + extent / cosAngle * cosAngle,
            y2: ct + extent / cosAngle * sinAngle,
            color: COLORS.quantumGreen,
            frame: 'moving'
        },
        {
            x1: x - extent / cosAngle * sinAngle,
            y1: ct - extent / cosAngle * cosAngle,
            x2: x + extent / cosAngle * sinAngle,
            y2: ct + extent / cosAngle * cosAngle,
            color: COLORS.quantumGreen,
            frame: 'moving'
        }
    ];

    const lines = simGroup.selectAll('line')
        .data(lineData)
        .join('line')
        .attr('stroke', d => `${d.color}${COLORS.simultaneity}`)
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '3,3');

    if (withTransition) {
        lines.transition().duration(600).ease(easeCubicInOut)
            .attr('x1', d => scales.xScale(d.x1))
            .attr('y1', d => scales.yScale(d.y1))
            .attr('x2', d => scales.xScale(d.x2))
            .attr('y2', d => scales.yScale(d.y2));
    } else {
        lines.attr('x1', d => scales.xScale(d.x1))
            .attr('y1', d => scales.yScale(d.y1))
            .attr('x2', d => scales.xScale(d.x2))
            .attr('y2', d => scales.yScale(d.y2));
    }
}

/**
 * Render events and interval line
 */
function renderEvents(
    svg: Selection<SVGSVGElement, unknown, null, undefined>,
    scales: ScaleSet,
    data: MinkowskiData,
    withTransition: boolean
): void {
    const ct = data.time * C;
    const x = data.distance;

    // Interval line
    const intervalGroup = svg.select('g.interval');
    if (ct !== 0 || x !== 0) {
        const intervalLine = intervalGroup.selectAll('line')
            .data([{ x1: 0, y1: 0, x2: x, y2: ct }])
            .join('line')
            .attr('stroke', COLORS.plasmaWhite)
            .attr('stroke-width', 3);

        if (withTransition) {
            intervalLine.transition().duration(600).ease(easeCubicInOut)
                .attr('x1', d => scales.xScale(d.x1))
                .attr('y1', d => scales.yScale(d.y1))
                .attr('x2', d => scales.xScale(d.x2))
                .attr('y2', d => scales.yScale(d.y2));
        } else {
            intervalLine.attr('x1', d => scales.xScale(d.x1))
                .attr('y1', d => scales.yScale(d.y1))
                .attr('x2', d => scales.xScale(d.x2))
                .attr('y2', d => scales.yScale(d.y2));
        }
    } else {
        intervalGroup.selectAll('line').remove();
    }

    // Event points
    const eventsGroup = svg.select('g.events');

    // Determine event color
    let eventColor = COLORS.plasmaWhite;
    if (data.intervalType === 'timelike') {
        eventColor = COLORS.timelike;
    } else if (data.intervalType === 'spacelike') {
        eventColor = COLORS.spacelike;
    } else if (data.intervalType === 'lightlike') {
        eventColor = COLORS.lightlike;
    }

    const eventData = [
        { x: 0, y: 0, color: COLORS.plasmaWhite, radius: 8, label: 'Origin' },
        { x: x, y: ct, color: eventColor, radius: 8, label: 'Event' }
    ];

    const events = eventsGroup.selectAll('circle')
        .data(eventData)
        .join('circle')
        .attr('r', d => d.radius)
        .attr('fill', d => d.color)
        .style('cursor', 'help');

    if (withTransition) {
        events.transition().duration(600).ease(easeCubicInOut)
            .attr('cx', d => scales.xScale(d.x))
            .attr('cy', d => scales.yScale(d.y));
    } else {
        events.attr('cx', d => scales.xScale(d.x))
            .attr('cy', d => scales.yScale(d.y));
    }
}

/**
 * Render labels
 */
function renderLabels(
    svg: Selection<SVGSVGElement, unknown, null, undefined>,
    scales: ScaleSet,
    data: MinkowskiData,
    withTransition: boolean
): void {
    const ct = data.time * C;
    const x = data.distance;
    const beta = data.velocity;
    const gamma = 1 / Math.sqrt(1 - beta * beta);
    const ctPrime = gamma * (ct - beta * x);
    const xPrime = gamma * (x - beta * ct);

    const labelsGroup = svg.select('g.labels');

    const labelData = [
        {
            text: 'Origin',
            x: 0,
            y: 0,
            dx: 10,
            dy: -10,
            color: COLORS.plasmaWhite,
            class: 'label'
        }
    ];

    if (ct !== 0 || x !== 0) {
        labelData.push({
            text: `(ct=${formatCoordinate(ct)}, x=${formatCoordinate(x)})`,
            x: x,
            y: ct,
            dx: 12,
            dy: -25,
            color: COLORS.electricBlue,
            class: 'label'
        });
        labelData.push({
            text: `(ct'=${formatCoordinate(ctPrime)}, x'=${formatCoordinate(xPrime)})`,
            x: x,
            y: ct,
            dx: 12,
            dy: -8,
            color: COLORS.quantumGreen,
            class: 'label'
        });
    }

    const labels = labelsGroup.selectAll('text')
        .data(labelData)
        .join('text')
        .attr('class', d => d.class)
        .attr('fill', d => d.color)
        .attr('text-anchor', 'start')
        .text(d => d.text);

    if (withTransition) {
        labels.transition().duration(600).ease(easeCubicInOut)
            .attr('x', d => scales.xScale(d.x) + d.dx)
            .attr('y', d => scales.yScale(d.y) + d.dy);
    } else {
        labels.attr('x', d => scales.xScale(d.x) + d.dx)
            .attr('y', d => scales.yScale(d.y) + d.dy);
    }

    // Causal indicator (bottom of diagram)
    const size = 900;
    const causalData = (ct !== 0 || x !== 0) ? [{
        type: data.intervalType,
        y: size - 35
    }] : [];

    const causalIndicator = labelsGroup.selectAll('text.causal')
        .data(causalData)
        .join('text')
        .attr('class', 'causal header')
        .attr('x', 15)
        .attr('y', d => d.y);

    causalIndicator.each(function(d) {
        const elem = select(this);
        elem.selectAll('tspan').remove();

        if (d.type === 'timelike') {
            elem.attr('fill', COLORS.timelike);
            elem.append('tspan').text('✓ CAUSALLY CONNECTED');
            elem.append('tspan')
                .attr('x', 15)
                .attr('dy', '1.2em')
                .attr('font-size', '13px')
                .attr('font-weight', 'normal')
                .text('(Event inside light cone)');
        } else if (d.type === 'spacelike') {
            elem.attr('fill', COLORS.spacelike);
            elem.append('tspan').text('✗ NOT CAUSALLY CONNECTED');
            elem.append('tspan')
                .attr('x', 15)
                .attr('dy', '1.2em')
                .attr('font-size', '13px')
                .attr('font-weight', 'normal')
                .text('(Event outside light cone)');
        } else {
            elem.attr('fill', COLORS.lightlike);
            elem.append('tspan').text('⚡ ON LIGHT CONE');
            elem.append('tspan')
                .attr('x', 15)
                .attr('dy', '1.2em')
                .attr('font-size', '13px')
                .attr('font-weight', 'normal')
                .text('(Connected by light signal)');
        }
    });
}
```

**Step 2: Commit**

```bash
git add src/charts/minkowski.ts
git commit -m "feat: add D3 rendering functions for Minkowski elements

Implement functions to render light cones, axes,
simultaneity lines, events, and labels with transitions.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 7: Create Main D3 Implementation - Part 4 (Tooltip System)

**Files:**
- Modify: `src/charts/minkowski.ts`

**Step 1: Add tooltip controller**

Append to `src/charts/minkowski.ts`:

```typescript
/**
 * Setup tooltip system
 */
function setupTooltips(
    svg: Selection<SVGSVGElement, unknown, null, undefined>,
    container: HTMLElement
): TooltipController {
    // Create tooltip div
    const tooltip = select(container)
        .append('div')
        .attr('class', 'minkowski-tooltip')
        .style('position', 'absolute')
        .style('background', COLORS.tooltipBg)
        .style('border', `1px solid ${COLORS.tooltipBorder}`)
        .style('padding', '8px 12px')
        .style('border-radius', '4px')
        .style('font-family', "'IBM Plex Mono', monospace")
        .style('font-size', '12px')
        .style('color', COLORS.plasmaWhite)
        .style('pointer-events', 'none')
        .style('opacity', '0')
        .style('z-index', '1000')
        .style('box-shadow', `0 0 15px ${COLORS.tooltipBorder}80`)
        .style('transition', 'opacity 200ms');

    let hideTimeout: number | undefined;

    // Add hover handlers to axes
    svg.selectAll('g.axes line').on('mouseenter', function(event) {
        const d = select(this).datum() as any;
        const axisName = d.axis === 'ct' ? 'ct axis - Original Frame (time)' :
                        d.axis === 'x' ? 'x axis - Original Frame (space)' :
                        d.axis === 'ct\'' ? 'ct\' axis - Moving Frame (time)' :
                        'x\' axis - Moving Frame (space)';

        tooltip.html(axisName)
            .style('left', `${event.pageX + 10}px`)
            .style('top', `${event.pageY + 10}px`)
            .style('opacity', '1');
    }).on('mouseleave', () => {
        tooltip.style('opacity', '0');
    });

    // Add hover handlers to events
    svg.selectAll('g.events circle').on('mouseenter', function(event, d: any) {
        const content = d.label === 'Origin'
            ? 'Event 1: Origin (0, 0)'
            : `Event 2: ${select(svg.selectAll('g.labels text').nodes()[1]).text()}<br>${select(svg.selectAll('g.labels text').nodes()[2]).text()}`;

        tooltip.html(content)
            .style('left', `${event.pageX + 10}px`)
            .style('top', `${event.pageY + 10}px`)
            .style('opacity', '1');
    }).on('mouseleave', () => {
        tooltip.style('opacity', '0');
    });

    // Add hover handlers to light cones
    svg.selectAll('g.light-cones line').on('mouseenter', function(event) {
        const d = select(this).datum() as any;
        const content = d.from === 'origin'
            ? 'Light cone from origin'
            : 'Light cone from event';

        tooltip.html(content)
            .style('left', `${event.pageX + 10}px`)
            .style('top', `${event.pageY + 10}px`)
            .style('opacity', '1');
    }).on('mouseleave', () => {
        tooltip.style('opacity', '0');
    });

    // Touch support for mobile
    let touchedElement: any = null;

    svg.on('touchstart', function(event) {
        event.preventDefault();
        const touch = event.touches[0];
        const target = select(event.target as any);

        if (touchedElement === event.target) {
            // Second tap - hide tooltip
            tooltip.style('opacity', '0');
            touchedElement = null;
        } else {
            // First tap - show tooltip
            touchedElement = event.target;

            let content = '';
            if (target.node()?.tagName === 'line' && target.node()?.parentElement?.classList.contains('axes')) {
                const d = target.datum() as any;
                content = d.axis === 'ct' ? 'ct axis - Original Frame (time)' :
                         d.axis === 'x' ? 'x axis - Original Frame (space)' :
                         d.axis === 'ct\'' ? 'ct\' axis - Moving Frame (time)' :
                         'x\' axis - Moving Frame (space)';
            } else if (target.node()?.tagName === 'circle') {
                const d = target.datum() as any;
                content = d.label === 'Origin' ? 'Event 1: Origin (0, 0)' : 'Event 2';
            } else if (target.node()?.tagName === 'line' && target.node()?.parentElement?.classList.contains('light-cones')) {
                const d = target.datum() as any;
                content = d.from === 'origin' ? 'Light cone from origin' : 'Light cone from event';
            }

            if (content) {
                tooltip.html(content)
                    .style('left', `${touch.pageX + 10}px`)
                    .style('top', `${touch.pageY + 10}px`)
                    .style('opacity', '1');

                // Auto-hide after 3 seconds
                clearTimeout(hideTimeout);
                hideTimeout = window.setTimeout(() => {
                    tooltip.style('opacity', '0');
                    touchedElement = null;
                }, 3000);
            }
        }
    });

    return {
        show(content: string, x: number, y: number) {
            tooltip.html(content)
                .style('left', `${x}px`)
                .style('top', `${y}px`)
                .style('opacity', '1');
        },
        hide() {
            tooltip.style('opacity', '0');
        },
        destroy() {
            clearTimeout(hideTimeout);
            tooltip.remove();
        }
    };
}
```

**Step 2: Commit**

```bash
git add src/charts/minkowski.ts
git commit -m "feat: add tooltip system for Minkowski diagram

Implement hover and touch tooltips for axes, events,
and light cones with auto-hide on mobile.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 8: Create Main D3 Implementation - Part 5 (Main Function)

**Files:**
- Modify: `src/charts/minkowski.ts`

**Step 1: Add main exported function**

Append to `src/charts/minkowski.ts`:

```typescript
/**
 * Main function: Draw Minkowski spacetime diagram
 *
 * @param container - HTML element or SVG to render into
 * @param data - Spacetime event data
 * @returns Controller for updates and animation control
 */
export function drawMinkowskiDiagram(
    container: HTMLElement,
    data: MinkowskiData
): MinkowskiController {
    const size = 900;

    // Setup SVG
    const svg = setupSVG(container);
    let scales = createScales(data, size);

    // Initial render
    renderLightCones(svg, scales, data, false);
    renderSimultaneityLines(svg, scales, data, false);
    renderAxes(svg, scales, data, false);
    renderEvents(svg, scales, data, false);
    renderLabels(svg, scales, data, false);

    // Setup tooltips
    const tooltips = setupTooltips(svg, container);

    // Animation state
    let animationTimer: Timer | null = null;
    let isPlaying = true;

    // TODO: Add auto-play frame animation in next task

    // Resize handler
    const resizeHandler = debounce(() => {
        scales = createScales(data, size);
        renderLightCones(svg, scales, data, false);
        renderSimultaneityLines(svg, scales, data, false);
        renderAxes(svg, scales, data, false);
        renderEvents(svg, scales, data, false);
        renderLabels(svg, scales, data, false);
    }, 150);

    window.addEventListener('resize', resizeHandler);

    // Public controller API
    const controller: MinkowskiController = {
        update(newData: MinkowskiData) {
            data = newData;
            scales = createScales(data, size);

            renderLightCones(svg, scales, data, true);
            renderSimultaneityLines(svg, scales, data, true);
            renderAxes(svg, scales, data, true);
            renderEvents(svg, scales, data, true);
            renderLabels(svg, scales, data, true);
        },

        pause() {
            isPlaying = false;
            if (animationTimer) {
                animationTimer.stop();
            }
        },

        play() {
            isPlaying = true;
            // TODO: Restart animation
        },

        destroy() {
            window.removeEventListener('resize', resizeHandler);
            tooltips.destroy();
            if (animationTimer) {
                animationTimer.stop();
            }
            svg.remove();
        }
    };

    return controller;
}
```

**Step 2: Commit**

```bash
git add src/charts/minkowski.ts
git commit -m "feat: add main drawMinkowskiDiagram function

Implement main function with controller API for
updates, pause/play, and cleanup.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 9: Update HTML to Use Container Div

**Files:**
- Modify: `index.html:1144`

**Step 1: Replace canvas with div container**

In `index.html`, replace line 1144:

```html
<!-- OLD: -->
<canvas id="minkowskiCanvas" style="display: block; width: 100%;"></canvas>

<!-- NEW: -->
<div id="minkowskiContainer" style="position: relative; width: 100%; max-width: 900px;"></div>
```

**Step 2: Commit**

```bash
git add index.html
git commit -m "feat: change Minkowski canvas to div container for SVG

Replace canvas element with div container to support
D3.js SVG rendering with tooltips.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 10: Update main.ts for New Implementation

**Files:**
- Modify: `src/main.ts:14`
- Modify: `src/main.ts:23-29`
- Modify: `src/main.ts:145-146`

**Step 1: Update imports and state**

In `src/main.ts`:

Line 14, keep the import as is (interface is compatible):
```typescript
import { drawMinkowskiDiagram, type MinkowskiData } from './charts/minkowski';
```

Lines 23-29, update minkowskiState:
```typescript
// Store Minkowski diagram controller and data for updates
const minkowskiState: {
    lastData: MinkowskiData | null,
    controller: ReturnType<typeof drawMinkowskiDiagram> | null
} = {
    lastData: null,
    controller: null
};
```

Lines 145-146, update resize handler:
```typescript
// Update Minkowski diagram if it exists
if (minkowskiState.controller && minkowskiState.lastData) {
    minkowskiState.controller.update(minkowskiState.lastData);
}
```

**Step 2: Commit**

```bash
git add src/main.ts
git commit -m "refactor: update main.ts for D3 Minkowski controller

Store controller instead of canvas reference and
use update() method for resize handling.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 11: Update eventHandlers.ts

**Files:**
- Modify: `src/ui/eventHandlers.ts:305-356`

**Step 1: Update spacetime interval handler**

In `src/ui/eventHandlers.ts`, find the `createSpacetimeIntervalHandler` function and update the diagram drawing section (around lines 330-356):

```typescript
// Around line 305-310, update the function signature:
export function createSpacetimeIntervalHandler(
    getTime2Input: () => HTMLInputElement | null,
    getX2Input: () => HTMLInputElement | null,
    getVelocityInput: () => HTMLInputElement | null,
    getSquaredResult: () => HTMLElement | null,
    getTypeResult: () => HTMLElement | null,
    getDeltaTResult: () => HTMLElement | null,
    getDeltaXResult: () => HTMLElement | null,
    onDiagramDrawn?: (container: HTMLElement, data: MinkowskiData, controller: ReturnType<typeof drawMinkowskiDiagram>) => void
): () => void {

// Then around lines 330-356, update the diagram section:
        // Draw Minkowski diagram
        const container = document.getElementById('minkowskiContainer');
        if (container) {
            const diagramData: MinkowskiData = {
                time: t2.toNumber(),
                distance: x2Km.toNumber(),
                velocity: velocityC.toNumber(),
                deltaTPrime: deltaTprime.toNumber(),
                deltaXPrime: deltaXprimeKm.toNumber(),
                intervalType
            };

            const controller = drawMinkowskiDiagram(container, diagramData);

            // Notify caller that diagram was drawn (for resize handling)
            if (onDiagramDrawn) {
                onDiagramDrawn(container, diagramData, controller);
            }
        }
```

**Step 2: Update the handler registration in main.ts**

In `src/main.ts`, find where `createSpacetimeIntervalHandler` is called (around line 110-130) and update:

```typescript
getButtonElement('spacetimeButton')?.addEventListener('click',
    createSpacetimeIntervalHandler(
        () => getInputElement('spacetimeTime2'),
        () => getInputElement('spacetimeX2'),
        () => getInputElement('spacetimeVelocity'),
        () => getResultElement('resultSpacetimeSquared'),
        () => getResultElement('resultSpacetimeType'),
        () => getResultElement('resultSpacetimeDeltaT'),
        () => getResultElement('resultSpacetimeDeltaX'),
        (container, data, controller) => {
            minkowskiState.lastData = data;
            minkowskiState.controller = controller;
        }
    )
);
```

**Step 3: Commit**

```bash
git add src/ui/eventHandlers.ts src/main.ts
git commit -m "refactor: update event handler for D3 Minkowski diagram

Change from canvas to container element and store
controller for resize handling.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 12: Test Basic SVG Rendering

**Files:**
- None (manual testing)

**Step 1: Start dev server**

Run:
```bash
yarn dev
```

Expected: Server starts on http://localhost:5173

**Step 2: Test in browser**

1. Open http://localhost:5173
2. Click "Spacetime" tab
3. Click "Calculate" button with default values
4. Verify:
   - SVG diagram appears (not canvas)
   - Axes are visible (blue and green)
   - Light cones visible (gold/amber)
   - Event points visible
   - Labels readable
   - No console errors

**Step 3: Test tooltips**

1. Hover over axes - tooltip should appear
2. Hover over event points - tooltip should appear
3. Hover over light cone lines - tooltip should appear

**Step 4: Test transitions**

1. Change Time value to 5
2. Click Calculate
3. Verify: Elements animate smoothly to new positions (600ms)

**Step 5: Test responsive**

1. Resize browser window
2. Verify: Diagram scales proportionally
3. Verify: No layout breaks

**Step 6: Document any issues**

If issues found, create a note in `docs/plans/2025-11-21-d3-issues.md`

---

## Task 13: Test Mobile/Tablet (Manual)

**Files:**
- None (manual testing)

**Step 1: Test on mobile device or simulator**

Use Chrome DevTools device mode or real device:
1. Open http://localhost:5173 (or deployed URL)
2. Navigate to Spacetime tab
3. Tap Calculate

**Step 2: Verify mobile behavior**

- [ ] Event points are tappable (large enough)
- [ ] Tooltips appear on first tap
- [ ] Tooltips hide on second tap or tap elsewhere
- [ ] Tooltips auto-hide after 3 seconds
- [ ] Text is readable (check font scaling)
- [ ] No horizontal scrolling issues
- [ ] Diagram scales correctly

**Step 3: Test tablet (768px viewport)**

Repeat tests at tablet breakpoint

**Step 4: Document any issues**

---

## Task 14: Remove Old Canvas Implementation (Optional)

**Files:**
- Delete: `src/charts/minkowski.ts` (old canvas code - backup first)

**Step 1: Verify new implementation works**

Ensure all tests from Tasks 12-13 pass before proceeding.

**Step 2: Remove old canvas code**

The old canvas implementation was already replaced in the previous tasks.
No additional cleanup needed since we've been modifying the same file.

---

## Task 15: Add CSS for Canvas Fallback Removal

**Files:**
- Modify: `index.html` (style section)

**Step 1: Update canvas styling in CSS**

In `index.html` style section (around line 447-449), update:

```css
/* OLD: */
canvas {
    filter: drop-shadow(0 0 10px rgba(0, 217, 255, 0.2));
}

/* NEW: */
#minkowskiContainer {
    filter: drop-shadow(0 0 10px rgba(0, 217, 255, 0.2));
}

#minkowskiContainer svg {
    display: block;
}
```

**Step 2: Commit**

```bash
git add index.html
git commit -m "style: update CSS for SVG Minkowski container

Replace canvas styling with container styling
for D3.js SVG implementation.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 16: Final Build and Type Check

**Files:**
- None (build verification)

**Step 1: Run type check**

Run:
```bash
yarn type-check
```

Expected: No TypeScript errors

**Step 2: Run production build**

Run:
```bash
yarn build
```

Expected: Build succeeds, outputs to `dist/`

**Step 3: Test production build**

Run:
```bash
yarn preview
```

Expected: Production build works correctly

**Step 4: Final commit**

```bash
git add .
git commit -m "feat: complete D3.js Minkowski diagram implementation

Replace Canvas with D3/SVG for resolution-independent rendering.

Features:
- Interactive hover/tap tooltips
- Smooth transitions on value changes
- Responsive design for mobile/tablet
- Modernized color palette
- Controller API for external control

Bundle impact: +~55kb (modular D3 imports)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Future Enhancements (Not in This Plan)

The following were noted in the design but are deferred:

1. **Auto-play frame animation** - Continuous loop between reference frames
2. **Pause/play button** - UI control for animation
3. **Click to set coordinates** - Interactive event placement
4. **Export as image** - Save diagram as PNG/SVG
5. **Custom color themes** - User-selectable palettes

These can be added in subsequent iterations after the core implementation is validated.

---

## Success Criteria

✅ SVG renders at all screen sizes without pixelation
✅ Tooltips work on desktop (hover) and mobile (tap)
✅ Smooth 600ms transitions when values change
✅ Responsive resize handling with debounce
✅ TypeScript compiles without errors
✅ Production build succeeds
✅ Bundle size increase <60kb
✅ No console errors or warnings
✅ Visual parity with canvas version (but sharper)

---

## Rollback Plan

If critical issues are found:

1. Checkout previous commit: `git log --oneline` then `git checkout <hash>`
2. Canvas implementation can be restored from git history
3. HTML canvas element can be restored in `index.html`
4. Remove D3 dependencies: `yarn remove d3-selection d3-scale d3-transition d3-ease d3-timer`

---

**Plan Complete.** Ready for execution with superpowers:executing-plans or superpowers:subagent-driven-development.
