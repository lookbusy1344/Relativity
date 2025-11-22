// D3 imports for new implementation
import { select, Selection } from 'd3-selection';
import 'd3-transition'; // Enables .transition() method on selections
import { easeCubicInOut } from 'd3-ease';
import { timer } from 'd3-timer';
// Imports will be used in subsequent tasks
import { COLORS as D3_COLORS } from './minkowski-colors';
import type {
    MinkowskiController,
    ScaleSet,
    TooltipController,
    AnimationController
} from './minkowski-types';

export interface MinkowskiData {
    time: number;           // Time coordinate in seconds
    distance: number;       // Distance coordinate in km
    velocity: number;       // Relative velocity as fraction of c
    deltaTPrime: number;    // Transformed time coordinate
    deltaXPrime: number;    // Transformed distance coordinate
    intervalType: string;   // "timelike", "spacelike", or "lightlike"
}

// Re-export types for use in subsequent tasks
export type {
    MinkowskiController,
    ScaleSet,
    TooltipController,
    AnimationController
};

// ============================================================================
// D3 Implementation (New) - Being progressively added
// ============================================================================

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
function formatCoordinateD3(value: number): string {
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

/**
 * Setup or select SVG element with proper structure
 */
export function setupSVG(container: HTMLElement): Selection<SVGSVGElement, unknown, null, undefined> {
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
            { offset: '0%', color: D3_COLORS.electricBlue, opacity: 0.3 },
            { offset: '50%', color: D3_COLORS.electricBlue, opacity: 1 },
            { offset: '100%', color: D3_COLORS.electricBlue, opacity: 0.3 }
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
            { offset: '0%', color: D3_COLORS.quantumGreen, opacity: 0.3 },
            { offset: '50%', color: D3_COLORS.quantumGreen, opacity: 1 },
            { offset: '100%', color: D3_COLORS.quantumGreen, opacity: 0.3 }
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
        .attr('fill', D3_COLORS.electricBlue);

    defs.append('marker')
        .attr('id', 'arrowGreen')
        .attr('viewBox', '0 0 10 10')
        .attr('refX', '5').attr('refY', '5')
        .attr('markerWidth', '6').attr('markerHeight', '6')
        .attr('orient', 'auto-start-reverse')
        .append('path')
        .attr('d', 'M 0 0 L 10 5 L 0 10 z')
        .attr('fill', D3_COLORS.quantumGreen);

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
        .attr('fill', `${D3_COLORS.photonGold}${D3_COLORS.lightConeFill}`)
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
        .attr('data-from', d => d.from)
        .attr('stroke', `${D3_COLORS.photonGold}${D3_COLORS.dashedLine}`)
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5')
        .style('cursor', 'pointer');

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
        { x1: 0, y1: -extent, x2: 0, y2: extent, color: D3_COLORS.electricBlue, frame: 'original', axis: 'ct' },
        { x1: -extent, y1: 0, x2: extent, y2: 0, color: D3_COLORS.electricBlue, frame: 'original', axis: 'x' }
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
            color: D3_COLORS.quantumGreen,
            frame: 'moving',
            axis: 'ct\''
        },
        {
            x1: -xPrimeLength * cosAngle,
            y1: -xPrimeLength * sinAngle,
            x2: xPrimeLength * cosAngle,
            y2: xPrimeLength * sinAngle,
            color: D3_COLORS.quantumGreen,
            frame: 'moving',
            axis: 'x\''
        }
    ];

    const allAxes = [...originalAxes, ...movingAxes];

    const axisLines = axesGroup.selectAll('line')
        .data(allAxes)
        .join('line')
        .attr('class', d => `axis-${d.frame}`)
        .attr('data-axis', d => d.axis)
        .attr('stroke', d => d.color)
        .attr('stroke-width', 3)
        .attr('marker-end', d => d.frame === 'original' ? 'url(#arrowBlue)' : 'url(#arrowGreen)')
        .style('cursor', 'pointer');

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
        { x1: -extent, y1: ct, x2: extent, y2: ct, color: D3_COLORS.electricBlue, frame: 'original', line: 'simultaneity' },
        { x1: x, y1: -extent, x2: x, y2: extent, color: D3_COLORS.electricBlue, frame: 'original', line: 'position' },
        // Moving frame
        {
            x1: x - extent / cosAngle * cosAngle,
            y1: ct - extent / cosAngle * sinAngle,
            x2: x + extent / cosAngle * cosAngle,
            y2: ct + extent / cosAngle * sinAngle,
            color: D3_COLORS.quantumGreen,
            frame: 'moving',
            line: 'simultaneity'
        },
        {
            x1: x - extent / cosAngle * sinAngle,
            y1: ct - extent / cosAngle * cosAngle,
            x2: x + extent / cosAngle * sinAngle,
            y2: ct + extent / cosAngle * cosAngle,
            color: D3_COLORS.quantumGreen,
            frame: 'moving',
            line: 'position'
        }
    ];

    const lines = simGroup.selectAll('line')
        .data(lineData)
        .join('line')
        .attr('class', d => `simultaneity-${d.frame}`)
        .attr('data-line', d => d.line)
        .attr('stroke', d => `${d.color}${D3_COLORS.simultaneity}`)
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
            .attr('stroke', D3_COLORS.plasmaWhite)
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
    let eventColor: string = D3_COLORS.plasmaWhite;
    if (data.intervalType === 'timelike') {
        eventColor = D3_COLORS.timelike;
    } else if (data.intervalType === 'spacelike') {
        eventColor = D3_COLORS.spacelike;
    } else if (data.intervalType === 'lightlike') {
        eventColor = D3_COLORS.lightlike;
    }

    const eventData = [
        { x: 0, y: 0, color: D3_COLORS.plasmaWhite, radius: 8, label: 'Origin' },
        { x: x, y: ct, color: eventColor, radius: 8, label: 'Event' }
    ];

    const events = eventsGroup.selectAll('circle')
        .data(eventData)
        .join('circle')
        .attr('data-label', d => d.label)
        .attr('data-x', d => d.x)
        .attr('data-y', d => d.y)
        .attr('r', d => d.radius)
        .attr('fill', d => d.color)
        .style('cursor', 'pointer');

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

    const labelData: Array<{
        text: string;
        x: number;
        y: number;
        dx: number;
        dy: number;
        color: string;
        class: string;
    }> = [
        {
            text: 'Origin',
            x: 0,
            y: 0,
            dx: 10,
            dy: -10,
            color: D3_COLORS.plasmaWhite,
            class: 'label'
        }
    ];

    if (ct !== 0 || x !== 0) {
        labelData.push({
            text: `(ct=${formatCoordinateD3(ct)}, x=${formatCoordinateD3(x)})`,
            x: x,
            y: ct,
            dx: 12,
            dy: -25,
            color: D3_COLORS.electricBlue,
            class: 'label label-original'
        });
        labelData.push({
            text: `(ct'=${formatCoordinateD3(ctPrime)}, x'=${formatCoordinateD3(xPrime)})`,
            x: x,
            y: ct,
            dx: 12,
            dy: -8,
            color: D3_COLORS.quantumGreen,
            class: 'label label-moving'
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
            elem.attr('fill', D3_COLORS.timelike);
            elem.append('tspan').text('✓ CAUSALLY CONNECTED');
            elem.append('tspan')
                .attr('x', 15)
                .attr('dy', '1.2em')
                .attr('font-size', '13px')
                .attr('font-weight', 'normal')
                .text('(Event inside light cone)');
        } else if (d.type === 'spacelike') {
            elem.attr('fill', D3_COLORS.spacelike);
            elem.append('tspan').text('✗ NOT CAUSALLY CONNECTED');
            elem.append('tspan')
                .attr('x', 15)
                .attr('dy', '1.2em')
                .attr('font-size', '13px')
                .attr('font-weight', 'normal')
                .text('(Event outside light cone)');
        } else {
            elem.attr('fill', D3_COLORS.lightlike);
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
        .style('position', 'fixed')
        .style('background', D3_COLORS.tooltipBg)
        .style('border', `1px solid ${D3_COLORS.tooltipBorder}`)
        .style('padding', '8px 12px')
        .style('border-radius', '4px')
        .style('font-family', "'IBM Plex Mono', monospace")
        .style('font-size', '12px')
        .style('color', D3_COLORS.plasmaWhite)
        .style('pointer-events', 'none')
        .style('opacity', '0')
        .style('z-index', '10000')
        .style('box-shadow', `0 0 15px ${D3_COLORS.tooltipBorder}80`)
        .style('transition', 'opacity 200ms');

    let hideTimeout: number | undefined;

    // Helper function to attach tooltip handlers to axes
    const attachAxisTooltips = () => {
        svg.selectAll('g.axes line').on('mouseenter', function(event: MouseEvent) {
            const axis = (this as SVGLineElement).getAttribute('data-axis');
            const axisName = axis === 'ct' ? 'ct axis - Original Frame (time)' :
                            axis === 'x' ? 'x axis - Original Frame (space)' :
                            axis === 'ct\'' ? 'ct\' axis - Moving Frame (time)' :
                            'x\' axis - Moving Frame (space)';

            tooltip.html(axisName)
                .style('position', 'fixed')
                .style('left', `${event.clientX + 10}px`)
                .style('top', `${event.clientY + 10}px`)
                .style('opacity', '1');
        }).on('mouseleave', () => {
            tooltip.style('opacity', '0');
        });
    };

    // Helper function to attach tooltip handlers to events
    const attachEventTooltips = () => {
        svg.selectAll('g.events circle').on('mouseenter', function(event: MouseEvent) {
            const label = (this as SVGCircleElement).getAttribute('data-label');
            const x = parseFloat((this as SVGCircleElement).getAttribute('data-x') || '0');
            const y = parseFloat((this as SVGCircleElement).getAttribute('data-y') || '0');

            const content = label === 'Origin'
                ? 'Event 1: Origin (0, 0)'
                : `Event 2: (${formatCoordinateD3(y / C)}, ${formatCoordinateD3(x)})`;

            tooltip.html(content)
                .style('position', 'fixed')
                .style('left', `${event.clientX + 10}px`)
                .style('top', `${event.clientY + 10}px`)
                .style('opacity', '1');
        }).on('mouseleave', () => {
            tooltip.style('opacity', '0');
        });
    };

    // Helper function to attach tooltip handlers to light cones
    const attachLightConeTooltips = () => {
        svg.selectAll('g.light-cones line').on('mouseenter', function(event: MouseEvent) {
            const from = (this as SVGLineElement).getAttribute('data-from');
            const content = from === 'origin'
                ? 'Light cone from origin'
                : 'Light cone from event';

            tooltip.html(content)
                .style('position', 'fixed')
                .style('left', `${event.clientX + 10}px`)
                .style('top', `${event.clientY + 10}px`)
                .style('opacity', '1');
        }).on('mouseleave', () => {
            tooltip.style('opacity', '0');
        });
    };

    // Attach initial tooltip handlers
    attachAxisTooltips();
    attachEventTooltips();
    attachLightConeTooltips();

    // Touch support for mobile
    let touchedElement: any = null;

    svg.on('touchstart', function(event) {
        event.preventDefault();
        const touch = event.touches[0];
        const targetElement = event.target as SVGElement;

        if (touchedElement === event.target) {
            // Second tap - hide tooltip
            tooltip.style('opacity', '0');
            touchedElement = null;
        } else {
            // First tap - show tooltip
            touchedElement = event.target;

            let content = '';
            if (targetElement.tagName === 'line' && targetElement.parentElement?.classList.contains('axes')) {
                const axis = (targetElement as SVGLineElement).getAttribute('data-axis');
                content = axis === 'ct' ? 'ct axis - Original Frame (time)' :
                         axis === 'x' ? 'x axis - Original Frame (space)' :
                         axis === 'ct\'' ? 'ct\' axis - Moving Frame (time)' :
                         'x\' axis - Moving Frame (space)';
            } else if (targetElement.tagName === 'circle') {
                const label = (targetElement as SVGCircleElement).getAttribute('data-label');
                const x = parseFloat((targetElement as SVGCircleElement).getAttribute('data-x') || '0');
                const y = parseFloat((targetElement as SVGCircleElement).getAttribute('data-y') || '0');
                content = label === 'Origin'
                    ? 'Event 1: Origin (0, 0)'
                    : `Event 2: (${formatCoordinateD3(y / C)}, ${formatCoordinateD3(x)})`;
            } else if (targetElement.tagName === 'line' && targetElement.parentElement?.classList.contains('light-cones')) {
                const from = (targetElement as SVGLineElement).getAttribute('data-from');
                content = from === 'origin' ? 'Light cone from origin' : 'Light cone from event';
            }

            if (content) {
                tooltip.html(content)
                    .style('position', 'fixed')
                    .style('left', `${touch.clientX + 10}px`)
                    .style('top', `${touch.clientY + 10}px`)
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
        },
        reattach() {
            attachAxisTooltips();
            attachEventTooltips();
            attachLightConeTooltips();
        }
    };
}

/**
 * Start auto-play frame animation
 * Animates moving frame axes between orthogonal and tilted positions
 */
function startFrameAnimation(
    svg: Selection<SVGSVGElement, unknown, null, undefined>,
    scales: ScaleSet,
    data: MinkowskiData,
    _onUpdate: () => void
): AnimationController {
    const LOOP_DURATION = 4000; // 4 seconds total loop
    let startTime = Date.now();
    let isPaused = false;
    let pausedTime = 0;

    const ct = data.time * C;
    const x = data.distance;
    const extent = scales.maxCoord;
    const beta = data.velocity;
    const targetAngle = Math.atan(beta);

    const animationTimer = timer(() => {
        if (isPaused) return;

        const elapsed = Date.now() - startTime - pausedTime;
        const t = (elapsed % LOOP_DURATION) / LOOP_DURATION; // 0 to 1

        // Smooth interpolation: 0-0.5 = orthogonal→tilted, 0.5-1 = tilted→orthogonal
        let p: number;
        if (t < 0.5) {
            // First half: ease into moving frame (0 → 1)
            p = (1 - Math.cos(t * 2 * Math.PI)) / 2;
        } else {
            // Second half: ease back to original frame (1 → 0)
            p = (1 - Math.cos((t - 0.5) * 2 * Math.PI)) / 2;
            p = 1 - p;
        }

        // Interpolate angle from 0 (orthogonal) to targetAngle (tilted)
        const currentAngle = targetAngle * p;
        const cosCurrent = Math.cos(currentAngle);
        const sinCurrent = Math.sin(currentAngle);

        // Animate ct' axis (interpolate between vertical and tilted)
        const ctPrimeLength = extent / (cosCurrent || 0.01); // Avoid division by zero
        svg.selectAll('.axis-moving').filter(function() {
            return (this as SVGLineElement).getAttribute('data-axis') === 'ct\'';
        })
            .attr('x1', scales.xScale(-ctPrimeLength * sinCurrent))
            .attr('y1', scales.yScale(-ctPrimeLength * cosCurrent))
            .attr('x2', scales.xScale(ctPrimeLength * sinCurrent))
            .attr('y2', scales.yScale(ctPrimeLength * cosCurrent));

        // Animate x' axis (interpolate between horizontal and tilted)
        const xPrimeLength = extent / (cosCurrent || 0.01);
        svg.selectAll('.axis-moving').filter(function() {
            return (this as SVGLineElement).getAttribute('data-axis') === 'x\'';
        })
            .attr('x1', scales.xScale(-xPrimeLength * cosCurrent))
            .attr('y1', scales.yScale(-xPrimeLength * sinCurrent))
            .attr('x2', scales.xScale(xPrimeLength * cosCurrent))
            .attr('y2', scales.yScale(xPrimeLength * sinCurrent));

        // Animate moving frame simultaneity lines if event exists
        if (ct !== 0 || x !== 0) {
            const simLength = extent / (cosCurrent || 0.01);

            // Simultaneity line (parallel to x' axis)
            svg.selectAll('.simultaneity-moving').filter(function() {
                return (this as SVGLineElement).getAttribute('data-line') === 'simultaneity';
            })
                .attr('x1', scales.xScale(x - simLength * cosCurrent))
                .attr('y1', scales.yScale(ct - simLength * sinCurrent))
                .attr('x2', scales.xScale(x + simLength * cosCurrent))
                .attr('y2', scales.yScale(ct + simLength * sinCurrent));

            // Position line (parallel to ct' axis)
            svg.selectAll('.simultaneity-moving').filter(function() {
                return (this as SVGLineElement).getAttribute('data-line') === 'position';
            })
                .attr('x1', scales.xScale(x - simLength * sinCurrent))
                .attr('y1', scales.yScale(ct - simLength * cosCurrent))
                .attr('x2', scales.xScale(x + simLength * sinCurrent))
                .attr('y2', scales.yScale(ct + simLength * cosCurrent));
        }
    });

    return {
        pause() {
            isPaused = true;
        },
        play() {
            if (isPaused) {
                pausedTime += Date.now() - startTime;
                isPaused = false;
            }
        },
        stop() {
            animationTimer.stop();
        }
    };
}

/**
 * Main function: Draw Minkowski spacetime diagram (D3 version)
 *
 * @param container - HTML element to render into
 * @param data - Spacetime event data
 * @returns Controller for updates and animation control
 */
export function drawMinkowskiDiagramD3(
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

    // Create animation control button
    const controlButton = select(container)
        .append('button')
        .attr('class', 'minkowski-animation-control')
        .style('position', 'absolute')
        .style('bottom', '10px')
        .style('left', '50%')
        .style('transform', 'translateX(-50%)')
        .style('background', D3_COLORS.tooltipBg)
        .style('border', `1px solid ${D3_COLORS.tooltipBorder}`)
        .style('color', D3_COLORS.plasmaWhite)
        .style('padding', '8px 16px')
        .style('border-radius', '4px')
        .style('font-family', "'IBM Plex Mono', monospace")
        .style('font-size', '12px')
        .style('cursor', 'pointer')
        .style('z-index', '1000')
        .style('box-shadow', `0 0 10px ${D3_COLORS.tooltipBorder}60`)
        .style('transition', 'all 200ms')
        .text('⏸ Pause Animation')
        .on('mouseenter', function() {
            select(this)
                .style('background', D3_COLORS.tooltipBorder)
                .style('box-shadow', `0 0 15px ${D3_COLORS.tooltipBorder}80`);
        })
        .on('mouseleave', function() {
            select(this)
                .style('background', D3_COLORS.tooltipBg)
                .style('box-shadow', `0 0 10px ${D3_COLORS.tooltipBorder}60`);
        });

    // Start auto-play frame animation
    let animation = startFrameAnimation(svg, scales, data, () => {
        // Animation update callback (currently unused)
    });
    let isPlaying = true;

    // Add click handler for control button
    controlButton.on('click', () => {
        if (isPlaying) {
            animation.pause();
            isPlaying = false;
            controlButton.text('▶ Resume Animation');
            // Snap axes and simultaneity lines to their correct final positions
            renderAxes(svg, scales, data, false);
            renderSimultaneityLines(svg, scales, data, false);
            tooltips.reattach();
        } else {
            animation.play();
            isPlaying = true;
            controlButton.text('⏸ Pause Animation');
        }
    });

    // Pause animation when tab is hidden
    const visibilityChangeHandler = () => {
        if (document.hidden) {
            animation.pause();
        } else if (isPlaying) {
            animation.play();
        }
    };
    document.addEventListener('visibilitychange', visibilityChangeHandler);

    // Resize handler
    const resizeHandler = debounce(() => {
        scales = createScales(data, size);
        renderLightCones(svg, scales, data, false);
        renderSimultaneityLines(svg, scales, data, false);
        renderAxes(svg, scales, data, false);
        renderEvents(svg, scales, data, false);
        renderLabels(svg, scales, data, false);

        // Reattach tooltip handlers to re-rendered elements
        tooltips.reattach();
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

            // Reattach tooltip handlers to updated elements
            tooltips.reattach();
        },

        pause() {
            isPlaying = false;
            animation.pause();
            controlButton.text('▶ Resume Animation');
            // Snap axes and simultaneity lines to their correct final positions
            renderAxes(svg, scales, data, false);
            renderSimultaneityLines(svg, scales, data, false);
            tooltips.reattach();
        },

        play() {
            isPlaying = true;
            animation.play();
            controlButton.text('⏸ Pause Animation');
        },

        destroy() {
            window.removeEventListener('resize', resizeHandler);
            document.removeEventListener('visibilitychange', visibilityChangeHandler);
            tooltips.destroy();
            animation.stop();
            controlButton.remove();
            svg.remove();
        }
    };

    return controller;
}
