// Twin Paradox Minkowski Diagram - Shows dual reference frames and simultaneity jump
import Decimal from 'decimal.js';
import { select, Selection } from 'd3-selection';
import 'd3-transition';
import { easeCubicInOut } from 'd3-ease';
import { timer } from 'd3-timer';
import { COLORS as D3_COLORS } from './minkowski-colors';
import type { BaseController, ScaleSet, AnimationController } from './minkowski-types';
import {
    C,
    debounce,
    createScaleSet,
    setupSVG,
    createAxisDefinitions,
    createLayerGroups,
    renderStandardAxes,
    renderTransformedAxes,
    createTooltip
} from './minkowski-core';
import * as rl from '../relativity_lib';

/**
 * Format velocity in m/s using Decimal.js precision
 */
function formatVelocityMs(velocityC: number): string {
    const velocityMs = rl.c.mul(velocityC); // c is in m/s
    return rl.formatSignificant(velocityMs, "9", 2);
}

export interface TwinParadoxMinkowskiData {
    velocityC: number;        // Velocity as fraction of c
    properTimeYears: number;  // Proper time in years
    earthTimeYears: number;   // Coordinate time in years
    distanceLY: number;       // One-way distance in light years
    gamma: number;            // Lorentz factor
    // Decimal versions for display formatting
    velocityCDecimal: Decimal;
    properTimeYearsDecimal: Decimal;
    earthTimeYearsDecimal: Decimal;
    distanceLYDecimal: Decimal;
    gammaDecimal: Decimal;
}

/**
 * Controller for Twin Paradox Minkowski diagram with velocity slider
 */
export interface TwinParadoxController extends BaseController {
    update(data: TwinParadoxMinkowskiData): void;
    updateSlider(velocityC: number): void;
}

/**
 * Calculate key events in spacetime for Twin Paradox
 */
function calculateEvents(data: TwinParadoxMinkowskiData): {
    departure: { ct: number; x: number };
    turnaround: { ct: number; x: number };
    arrival: { ct: number; x: number };
    maxCoord: number;
} {
    // Convert to SI units (km and km for ct)
    const earthTimeSec = data.earthTimeYears * 365.25 * 24 * 3600;
    const distanceKm = data.distanceLY * 9.4607e12; // Light years to km

    // Key events
    const departure = { ct: 0, x: 0 };
    const turnaround = {
        ct: (earthTimeSec / 2) * C,  // Convert to ct in km
        x: distanceKm
    };
    const arrival = {
        ct: earthTimeSec * C,
        x: 0
    };

    // Calculate extent with padding - include all events
    const maxCoord = Math.max(
        Math.abs(turnaround.ct),
        Math.abs(turnaround.x),
        Math.abs(arrival.ct),
        Math.abs(arrival.x)
    ) * 1.3;

    return { departure, turnaround, arrival, maxCoord };
}

/**
 * Render the V-shaped worldline for traveling twin
 */
function renderWorldline(
    svg: Selection<SVGSVGElement, unknown, null, undefined>,
    scales: ScaleSet,
    departure: { ct: number; x: number },
    turnaround: { ct: number; x: number },
    arrival: { ct: number; x: number },
    withTransition: boolean
): void {
    const worldlinesGroup = svg.select('g.worldlines');

    // Earth twin's worldline (vertical line at x=0)
    const earthPath = [
        { x: departure.x, y: departure.ct },
        { x: arrival.x, y: arrival.ct }
    ];

    const earthLine = worldlinesGroup.selectAll('line.earth-worldline')
        .data([earthPath])
        .join('line')
        .attr('class', 'earth-worldline')
        .attr('stroke', D3_COLORS.electricBlue)
        .attr('stroke-width', 3);

    if (withTransition) {
        earthLine.transition().duration(600).ease(easeCubicInOut)
            .attr('x1', d => scales.xScale(d[0].x))
            .attr('y1', d => scales.yScale(d[0].y))
            .attr('x2', d => scales.xScale(d[1].x))
            .attr('y2', d => scales.yScale(d[1].y));
    } else {
        earthLine
            .attr('x1', d => scales.xScale(d[0].x))
            .attr('y1', d => scales.yScale(d[0].y))
            .attr('x2', d => scales.xScale(d[1].x))
            .attr('y2', d => scales.yScale(d[1].y));
    }

    // Traveling twin's worldline (V-shape)
    const travelPath = [departure, turnaround, arrival];
    const pathString = travelPath.map((p, i) =>
        `${i === 0 ? 'M' : 'L'} ${scales.xScale(p.x)},${scales.yScale(p.ct)}`
    ).join(' ');

    const travelLine = worldlinesGroup.selectAll('path.travel-worldline')
        .data([pathString])
        .join('path')
        .attr('class', 'travel-worldline')
        .attr('stroke', D3_COLORS.plasmaWhite)
        .attr('stroke-width', 4)
        .attr('fill', 'none');

    if (withTransition) {
        travelLine.transition().duration(600).ease(easeCubicInOut)
            .attr('d', d => d);
    } else {
        travelLine.attr('d', d => d);
    }
}

/**
 * Render simultaneity lines for all three reference frames
 */
function renderSimultaneityLines(
    svg: Selection<SVGSVGElement, unknown, null, undefined>,
    scales: ScaleSet,
    turnaround: { ct: number; x: number },
    beta: number,
    extent: number
): void {
    const simGroup = svg.select('g.simultaneity-lines');
    const angle = Math.atan(beta);
    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);
    const simLength = extent / cosAngle;

    const lineData = [
        // Earth frame simultaneity at turnaround (horizontal)
        {
            x1: -extent,
            y1: turnaround.ct,
            x2: extent,
            y2: turnaround.ct,
            color: D3_COLORS.electricBlue,
            class: 'sim-earth',
            label: 'Earth simultaneity'
        },
        // Outbound frame simultaneity at turnaround (tilted positive slope)
        {
            x1: turnaround.x - simLength * cosAngle,
            y1: turnaround.ct - simLength * sinAngle,
            x2: turnaround.x + simLength * cosAngle,
            y2: turnaround.ct + simLength * sinAngle,
            color: D3_COLORS.quantumGreen,
            class: 'sim-outbound',
            label: 'Outbound simultaneity'
        },
        // Inbound frame simultaneity at turnaround (tilted negative slope)
        {
            x1: turnaround.x - simLength * cosAngle,
            y1: turnaround.ct + simLength * sinAngle,
            x2: turnaround.x + simLength * cosAngle,
            y2: turnaround.ct - simLength * sinAngle,
            color: D3_COLORS.photonGold,
            class: 'sim-inbound',
            label: 'Inbound simultaneity'
        }
    ];

    simGroup.selectAll('line.simultaneity')
        .data(lineData)
        .join('line')
        .attr('class', d => `simultaneity ${d.class}`)
        .attr('data-label', d => d.label)
        .attr('stroke', d => `${d.color}${D3_COLORS.simultaneity}`)
        .attr('stroke-width', 2)
        .attr('x1', d => scales.xScale(d.x1))
        .attr('y1', d => scales.yScale(d.y1))
        .attr('x2', d => scales.xScale(d.x2))
        .attr('y2', d => scales.yScale(d.y2))
        .style('cursor', 'pointer');
}

/**
 * Render event markers at key points
 */
function renderEvents(
    svg: Selection<SVGSVGElement, unknown, null, undefined>,
    scales: ScaleSet,
    departure: { ct: number; x: number },
    turnaround: { ct: number; x: number },
    arrival: { ct: number; x: number }
): void {
    const eventsGroup = svg.select('g.events');

    const eventData = [
        { x: departure.x, y: departure.ct, label: 'Departure', color: D3_COLORS.plasmaWhite },
        { x: turnaround.x, y: turnaround.ct, label: 'Turnaround', color: D3_COLORS.photonGold },
        { x: arrival.x, y: arrival.ct, label: 'Arrival', color: D3_COLORS.plasmaWhite }
    ];

    eventsGroup.selectAll('circle.event')
        .data(eventData)
        .join('circle')
        .attr('class', 'event')
        .attr('data-label', d => d.label)
        .attr('cx', d => scales.xScale(d.x))
        .attr('cy', d => scales.yScale(d.y))
        .attr('r', 7)
        .attr('fill', d => d.color)
        .attr('stroke', 'rgba(0, 0, 0, 0.5)')
        .attr('stroke-width', 2)
        .style('cursor', 'pointer');
}

/**
 * Render labels for events and coordinate info
 */
function renderLabels(
    svg: Selection<SVGSVGElement, unknown, null, undefined>,
    scales: ScaleSet,
    data: TwinParadoxMinkowskiData,
    departure: { ct: number; x: number },
    turnaround: { ct: number; x: number },
    arrival: { ct: number; x: number },
    size: number
): void {
    const labelsGroup = svg.select('g.labels');

    // Event labels
    const eventLabels = [
        { text: 'Departure', x: departure.x, y: departure.ct, dx: -60, dy: 15 },
        { text: 'Turnaround', x: turnaround.x, y: turnaround.ct, dx: 10, dy: -15 },
        { text: 'Arrival', x: arrival.x, y: arrival.ct, dx: -50, dy: -15 }
    ];

    labelsGroup.selectAll('text.event-label')
        .data(eventLabels)
        .join('text')
        .attr('class', 'event-label label')
        .attr('x', d => scales.xScale(d.x) + d.dx)
        .attr('y', d => scales.yScale(d.y) + d.dy)
        .attr('fill', D3_COLORS.plasmaWhite)
        .attr('text-anchor', 'start')
        .text(d => d.text);

    // Frame info (bottom right)
    const infoData = [
        { text: `Velocity: ${formatVelocityMs(data.velocityC)} m/s`, y: size - 75, color: D3_COLORS.plasmaWhite },
        { text: `γ = ${rl.formatSignificant(data.gammaDecimal, "0", 3)}`, y: size - 60, color: D3_COLORS.plasmaWhite },
        { text: `Proper time: ${data.properTimeYears.toFixed(2)} years`, y: size - 45, color: D3_COLORS.quantumGreen },
        { text: `Earth time: ${data.earthTimeYears.toFixed(2)} years`, y: size - 30, color: D3_COLORS.electricBlue }
    ];

    labelsGroup.selectAll('text.info-label')
        .data(infoData)
        .join('text')
        .attr('class', 'info-label header')
        .attr('x', size - 15)
        .attr('y', d => d.y)
        .attr('text-anchor', 'end')
        .attr('fill', d => d.color)
        .text(d => d.text);

    // Legend for simultaneity jump (top right)
    const ageDifference = data.earthTimeYears - data.properTimeYears;
    labelsGroup.selectAll('text.legend')
        .data([{ text: `Age difference: ${ageDifference.toFixed(2)} years` }])
        .join('text')
        .attr('class', 'legend header')
        .attr('x', size - 15)
        .attr('y', 25)
        .attr('text-anchor', 'end')
        .attr('fill', D3_COLORS.photonGold)
        .text(d => d.text);
}

/**
 * Render legend explaining diagram elements (below the SVG)
 */
function renderLegend(container: HTMLElement): void {
    // Remove existing legend if present
    select(container).select('.twins-legend').remove();

    // Create legend container
    const legend = select(container)
        .append('div')
        .attr('class', 'twins-legend')
        .style('margin-top', '1rem')
        .style('padding', '1rem')
        .style('background', 'rgba(0, 0, 0, 0.5)')
        .style('border', '1px solid rgba(0, 217, 255, 0.2)');

    // Legend title
    legend.append('div')
        .style('font-family', "'IBM Plex Mono', monospace")
        .style('font-weight', 'bold')
        .style('font-size', '12px')
        .style('color', '#e8f1f5')
        .style('margin-bottom', '0.5rem')
        .text('LEGEND');

    // Legend grid
    const grid = legend.append('div')
        .style('display', 'grid')
        .style('grid-template-columns', 'repeat(auto-fit, minmax(200px, 1fr))')
        .style('gap', '0.5rem')
        .style('font-family', "'IBM Plex Mono', monospace")
        .style('font-size', '11px');

    // Legend items
    const legendItems = [
        { color: '#00d9ff', text: 'Earth frame (ct, x)', type: 'solid' },
        { color: '#00ff9f', text: 'Outbound frame (ct₁\', x₁\')', type: 'solid' },
        { color: '#ffaa00', text: 'Inbound frame (ct₂\', x₂\')', type: 'solid' },
        { color: '#e8f1f5', text: 'Traveling twin worldline', type: 'solid-thick' },
        { color: '#00d9ff', text: 'Earth twin (stationary)', type: 'solid' },
        { color: '#ffaa00', text: 'Light cones (c)', type: 'dashed' },
        { color: 'rgba(0, 217, 255, 0.5)', text: 'Simultaneity lines', type: 'solid' },
        { color: '#e8f1f5', text: 'Departure/Arrival events', type: 'circle' },
        { color: '#ffaa00', text: 'Turnaround event', type: 'circle' }
    ];

    legendItems.forEach(item => {
        const itemDiv = grid.append('div')
            .style('display', 'flex')
            .style('align-items', 'center')
            .style('gap', '0.5rem');

        // Visual indicator
        const indicator = itemDiv.append('div')
            .style('flex-shrink', '0');

        if (item.type === 'solid' || item.type === 'solid-thick') {
            indicator
                .style('width', '35px')
                .style('height', item.type === 'solid-thick' ? '4px' : '3px')
                .style('background', item.color);
        } else if (item.type === 'dashed') {
            indicator
                .style('width', '35px')
                .style('height', '2px')
                .style('background-image', `repeating-linear-gradient(90deg, ${item.color} 0px, ${item.color} 5px, transparent 5px, transparent 10px)`);
        } else if (item.type === 'circle') {
            indicator
                .style('width', '12px')
                .style('height', '12px')
                .style('border-radius', '50%')
                .style('background', item.color)
                .style('border', '2px solid rgba(0, 0, 0, 0.5)');
        }

        // Label
        itemDiv.append('span')
            .style('color', '#e8f1f5')
            .text(item.text);
    });
}

/**
 * Setup tooltips for Twin Paradox diagram
 */
function setupTooltips(
    svg: Selection<SVGSVGElement, unknown, null, undefined>,
    container: HTMLElement
): void {
    const tooltip = createTooltip(container);

    // Axis tooltips
    svg.selectAll('g.axes line').on('mouseenter', function(event: MouseEvent) {
        const axis = (this as SVGLineElement).getAttribute('data-axis');
        const axisName = axis === 'ct' ? 'ct axis - Earth Frame (time)' :
                        axis === 'x' ? 'x axis - Earth Frame (space)' :
                        axis === 'ct₁\'' ? 'ct₁\' axis - Outbound Frame (time)' :
                        axis === 'x₁\'' ? 'x₁\' axis - Outbound Frame (space)' :
                        axis === 'ct₂\'' ? 'ct₂\' axis - Inbound Frame (time)' :
                        'x₂\' axis - Inbound Frame (space)';

        tooltip.show(axisName, event.clientX + 10, event.clientY + 10);
    }).on('mouseleave', () => {
        tooltip.hide();
    });

    // Event tooltips
    svg.selectAll('g.events circle').on('mouseenter', function(event: MouseEvent) {
        const label = (this as SVGCircleElement).getAttribute('data-label');
        tooltip.show(label || '', event.clientX + 10, event.clientY + 10);
    }).on('mouseleave', () => {
        tooltip.hide();
    });

    // Simultaneity line tooltips
    svg.selectAll('g.simultaneity-lines line').on('mouseenter', function(event: MouseEvent) {
        const label = (this as SVGLineElement).getAttribute('data-label');
        tooltip.show(label || '', event.clientX + 10, event.clientY + 10);
    }).on('mouseleave', () => {
        tooltip.hide();
    });

    // Light cone tooltips
    svg.selectAll('g.light-cones line').on('mouseenter', function(event: MouseEvent) {
        tooltip.show('Light cone boundary (c)', event.clientX + 10, event.clientY + 10);
    }).on('mouseleave', () => {
        tooltip.hide();
    });
}

/**
 * Start animation showing the journey along the worldline
 * Animates a marker along the path with light cone at current position
 */
function startJourneyAnimation(
    svg: Selection<SVGSVGElement, unknown, null, undefined>,
    scales: ScaleSet,
    data: TwinParadoxMinkowskiData,
    departure: { ct: number; x: number },
    turnaround: { ct: number; x: number },
    arrival: { ct: number; x: number },
    _onUpdate: () => void
): AnimationController {
    const LOOP_DURATION = 12000; // 12 seconds for complete journey
    let startTime = Date.now();
    let isPaused = false;
    let totalPausedTime = 0;
    let pauseStartTime = 0;
    let manualPosition: number | null = null;

    // Create animated marker group
    const animatedGroup = svg.append('g').attr('class', 'animated-journey');

    const updateFrame = (t: number) => {
        // t goes from 0 to 1
        // First half (0-0.5): outbound journey from departure to turnaround
        // Second half (0.5-1.0): return journey from turnaround to arrival
        let currentPos: { ct: number; x: number };
        let properTime: number;

        if (t < 0.5) {
            // Outbound: interpolate between departure and turnaround
            const segmentT = t * 2; // 0 to 1 within this segment
            currentPos = {
                ct: departure.ct + (turnaround.ct - departure.ct) * segmentT,
                x: departure.x + (turnaround.x - departure.x) * segmentT
            };
            properTime = data.properTimeYears * segmentT / 2;
        } else {
            // Inbound: interpolate between turnaround and arrival
            const segmentT = (t - 0.5) * 2; // 0 to 1 within this segment
            currentPos = {
                ct: turnaround.ct + (arrival.ct - turnaround.ct) * segmentT,
                x: turnaround.x + (arrival.x - turnaround.x) * segmentT
            };
            properTime = data.properTimeYears * (0.5 + segmentT / 2);
        }

        const earthTime = (currentPos.ct / C) / (365.25 * 24 * 3600);

        // Clear previous animated elements
        animatedGroup.selectAll('*').remove();

        // Draw light cone at current position
        const extent = scales.maxCoord;
        const largeExtent = extent * 2;

        // Light cone fill polygons (future and past)
        const coneFillData = [
            { points: [[currentPos.x, currentPos.ct], [currentPos.x + largeExtent, currentPos.ct + largeExtent], [currentPos.x + largeExtent, currentPos.ct - largeExtent]], class: 'future' },
            { points: [[currentPos.x, currentPos.ct], [currentPos.x - largeExtent, currentPos.ct - largeExtent], [currentPos.x - largeExtent, currentPos.ct + largeExtent]], class: 'past' }
        ];

        animatedGroup.selectAll('polygon.cone-fill')
            .data(coneFillData)
            .join('polygon')
            .attr('class', 'cone-fill')
            .attr('points', d => d.points.map(p =>
                `${scales.xScale(p[0])},${scales.yScale(p[1])}`
            ).join(' '))
            .attr('fill', `${D3_COLORS.electricBlue}${D3_COLORS.lightConeFill}`)
            .attr('stroke', 'none');

        // Light cone boundary lines
        const coneExtent = Math.min(extent, currentPos.ct); // Don't extend before t=0

        animatedGroup.append('line')
            .attr('x1', scales.xScale(currentPos.x - coneExtent))
            .attr('y1', scales.yScale(currentPos.ct - coneExtent))
            .attr('x2', scales.xScale(currentPos.x + coneExtent))
            .attr('y2', scales.yScale(currentPos.ct + coneExtent))
            .attr('stroke', `${D3_COLORS.photonGold}80`)
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '8,4');

        animatedGroup.append('line')
            .attr('x1', scales.xScale(currentPos.x - coneExtent))
            .attr('y1', scales.yScale(currentPos.ct + coneExtent))
            .attr('x2', scales.xScale(currentPos.x + coneExtent))
            .attr('y2', scales.yScale(currentPos.ct - coneExtent))
            .attr('stroke', `${D3_COLORS.photonGold}80`)
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '8,4');

        // Draw position marker
        animatedGroup.append('circle')
            .attr('cx', scales.xScale(currentPos.x))
            .attr('cy', scales.yScale(currentPos.ct))
            .attr('r', 10)
            .attr('fill', D3_COLORS.quantumGreen)
            .attr('stroke', D3_COLORS.plasmaWhite)
            .attr('stroke-width', 3)
            .style('filter', 'drop-shadow(0 0 8px ' + D3_COLORS.quantumGreen + ')');

        // Update time labels at bottom right
        svg.select('g.labels').selectAll('text.info-label')
            .filter((_, i) => i === 2)
            .text(`Proper time: ${properTime.toFixed(2)} years`);

        svg.select('g.labels').selectAll('text.info-label')
            .filter((_, i) => i === 3)
            .text(`Earth time: ${earthTime.toFixed(2)} years`);
    };

    const animationTimer = timer(() => {
        if (isPaused || manualPosition !== null) return;

        const elapsed = Date.now() - startTime - totalPausedTime;
        const t = (elapsed % LOOP_DURATION) / LOOP_DURATION;
        updateFrame(t);
    });

    return {
        pause() {
            if (!isPaused) {
                isPaused = true;
                pauseStartTime = Date.now();
            }
        },
        play() {
            if (isPaused) {
                totalPausedTime += Date.now() - pauseStartTime;
                isPaused = false;
                manualPosition = null;
            }
        },
        stop() {
            animationTimer.stop();
            animatedGroup.remove();
        },
        setPosition(t: number) {
            manualPosition = t;
            updateFrame(t);
        }
    };
}

/**
 * Main function: Draw Twin Paradox Minkowski diagram
 */
export function drawTwinParadoxMinkowski(
    container: HTMLElement,
    data: TwinParadoxMinkowskiData,
    onVelocityChange?: (velocityC: number) => void
): TwinParadoxController {
    const size = 900;
    const beta = data.velocityC;
    let isSliderUpdate = false;

    // Calculate key events
    let events = calculateEvents(data);
    let scales = createScaleSet(events.maxCoord, size);

    // Setup SVG
    const svg = setupSVG(container, size);
    createAxisDefinitions(svg);
    createLayerGroups(svg);

    // Initial render
    renderStandardAxes(svg, scales, { ctLabel: 'ct (Earth)', xLabel: 'x' });

    // Render outbound frame axes (green)
    renderTransformedAxes(
        svg, scales, beta,
        { ctLabel: 'ct₁\'', xLabel: 'x₁\'' },
        D3_COLORS.quantumGreen,
        'url(#arrowGreen)',
        'axis-outbound'
    );

    // Render inbound frame axes (amber) - negative velocity, centered at turnaround
    renderTransformedAxes(
        svg, scales, -beta,
        { ctLabel: 'ct₂\'', xLabel: 'x₂\'' },
        D3_COLORS.photonGold,
        'url(#arrowAmber)',
        'axis-inbound',
        events.turnaround
    );

    // Render simultaneity lines
    renderSimultaneityLines(svg, scales, events.turnaround, beta, events.maxCoord);

    // Render worldlines
    renderWorldline(svg, scales, events.departure, events.turnaround, events.arrival, false);

    // Render events
    renderEvents(svg, scales, events.departure, events.turnaround, events.arrival);

    // Render labels
    renderLabels(svg, scales, data, events.departure, events.turnaround, events.arrival, size);

    // Render legend (below SVG)
    renderLegend(container);

    // Setup tooltips
    setupTooltips(svg, container);

    // Create animation controls container (bottom-middle of diagram)
    const controlContainer = select(container)
        .append('div')
        .attr('class', 'minkowski-controls')
        .style('position', 'absolute')
        .style('bottom', '220px')
        .style('left', '50%')
        .style('transform', 'translateX(-50%)')
        .style('display', 'flex')
        .style('flex-direction', 'column')
        .style('align-items', 'center')
        .style('gap', '8px')
        .style('z-index', '1000');

    // Create toggle button for play/pause
    const toggleButton = controlContainer
        .append('button')
        .attr('class', 'minkowski-toggle-button')
        .text('Toggle Animation')
        .style('padding', '8px 16px')
        .style('background', D3_COLORS.tooltipBg)
        .style('border', `1px solid ${D3_COLORS.tooltipBorder}`)
        .style('color', D3_COLORS.plasmaWhite)
        .style('font-family', "'IBM Plex Mono', monospace")
        .style('font-size', '12px')
        .style('cursor', 'pointer')
        .style('border-radius', '4px')
        .style('box-shadow', `0 0 10px ${D3_COLORS.tooltipBorder}60`)
        .style('transition', 'all 200ms')
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

    // Create slider for manual position control (hidden initially)
    const sliderContainer = controlContainer
        .append('div')
        .style('display', 'none')
        .style('align-items', 'center')
        .style('gap', '8px');

    sliderContainer.append('label')
        .style('color', D3_COLORS.quantumGreen)
        .style('font-family', "'IBM Plex Mono', monospace")
        .style('font-size', '11px')
        .text('Position:');

    sliderContainer
        .append('input')
        .attr('type', 'range')
        .attr('min', '0')
        .attr('max', '50')
        .attr('value', '0')
        .style('width', '200px')
        .style('cursor', 'pointer')
        .on('input', function() {
            const value = parseFloat((this as HTMLInputElement).value) / 50;
            animation.setPosition(value);
        });

    // Start journey animation
    let animation = startJourneyAnimation(svg, scales, data, events.departure, events.turnaround, events.arrival, () => {
        // Animation update callback (currently unused)
    });
    let isPlaying = true;

    // Add click handler for toggle button
    toggleButton.on('click', () => {
        if (isPlaying) {
            animation.pause();
            isPlaying = false;
            sliderContainer.style('display', 'flex');
        } else {
            animation.play();
            isPlaying = true;
            sliderContainer.style('display', 'none');
        }
    });

    // Create velocity slider control (top of diagram, below title)
    const velocitySliderContainer = select(container)
        .append('div')
        .attr('class', 'minkowski-velocity-slider')
        .style('position', 'absolute')
        .style('top', '50px')
        .style('left', '20px')
        .style('display', 'flex')
        .style('align-items', 'center')
        .style('gap', '8px')
        .style('padding', '8px 12px')
        .style('background', D3_COLORS.tooltipBg)
        .style('border', `1px solid ${D3_COLORS.tooltipBorder}`)
        .style('border-radius', '4px')
        .style('box-shadow', `0 0 10px ${D3_COLORS.tooltipBorder}60`)
        .style('z-index', '1000');

    // Value display
    const velocityValueDisplay = velocitySliderContainer.append('span')
        .attr('class', 'velocity-value-display')
        .style('color', D3_COLORS.plasmaWhite)
        .style('font-family', "'IBM Plex Mono', monospace")
        .style('font-size', '11px')
        .style('font-weight', '600')
        .style('min-width', '120px')
        .style('text-align', 'right')
        .text(`${formatVelocityMs(data.velocityC)} m/s`);

    // Slider input
    const velocitySlider = velocitySliderContainer
        .append('input')
        .attr('type', 'range')
        .attr('min', '0.001')
        .attr('max', '0.999')
        .attr('step', '0.05')
        .attr('value', data.velocityC.toString())
        .attr('class', 'velocity-slider-input')
        .style('width', '200px')
        .style('cursor', 'pointer')
        .on('input', function() {
            const newVelocityC = parseFloat((this as HTMLInputElement).value);
            velocityValueDisplay.text(`${formatVelocityMs(newVelocityC)} m/s`);
            if (onVelocityChange) {
                isSliderUpdate = true;
                onVelocityChange(newVelocityC);
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
        events = calculateEvents(data);
        scales = createScaleSet(events.maxCoord, size);

        // Re-render everything
        svg.select('g.axes').selectAll('*').remove();
        svg.select('g.light-cones').selectAll('*').remove();
        svg.select('g.simultaneity-lines').selectAll('*').remove();
        svg.select('g.worldlines').selectAll('*').remove();
        svg.select('g.events').selectAll('*').remove();
        svg.select('g.labels').selectAll('*').remove();

        renderStandardAxes(svg, scales, { ctLabel: 'ct (Earth)', xLabel: 'x' });
        renderTransformedAxes(svg, scales, beta, { ctLabel: 'ct₁\'', xLabel: 'x₁\'' },
            D3_COLORS.quantumGreen, 'url(#arrowGreen)', 'axis-outbound');
        renderTransformedAxes(svg, scales, -beta, { ctLabel: 'ct₂\'', xLabel: 'x₂\'' },
            D3_COLORS.photonGold, 'url(#arrowAmber)', 'axis-inbound', events.turnaround);
        renderSimultaneityLines(svg, scales, events.turnaround, beta, events.maxCoord);
        renderWorldline(svg, scales, events.departure, events.turnaround, events.arrival, false);
        renderEvents(svg, scales, events.departure, events.turnaround, events.arrival);
        renderLabels(svg, scales, data, events.departure, events.turnaround, events.arrival, size);
        renderLegend(container);
        setupTooltips(svg, container);
    }, 150);

    window.addEventListener('resize', resizeHandler);

    // Public controller API
    const controller: TwinParadoxController = {
        update(newData: TwinParadoxMinkowskiData) {
            const twinsData = newData;
            // Re-calculate and re-render with new data
            events = calculateEvents(twinsData);
            scales = createScaleSet(events.maxCoord, size);

            // Stop old animation and start new one with updated data
            const wasPlaying = isPlaying;
            animation.stop();
            animation = startJourneyAnimation(svg, scales, twinsData, events.departure, events.turnaround, events.arrival, () => {
                // Animation update callback (currently unused)
            });
            if (!wasPlaying) {
                animation.pause();
                isPlaying = false;
                sliderContainer.style('display', 'flex');
            }

            // Clear and re-render
            svg.select('g.axes').selectAll('*').remove();
            svg.select('g.light-cones').selectAll('*').remove();
            svg.select('g.simultaneity-lines').selectAll('*').remove();
            svg.select('g.worldlines').selectAll('*').remove();
            svg.select('g.events').selectAll('*').remove();
            svg.select('g.labels').selectAll('*').remove();

            const beta = twinsData.velocityC;
            renderStandardAxes(svg, scales, { ctLabel: 'ct (Earth)', xLabel: 'x' });
            renderTransformedAxes(svg, scales, beta, { ctLabel: 'ct₁\'', xLabel: 'x₁\'' },
                D3_COLORS.quantumGreen, 'url(#arrowGreen)', 'axis-outbound');
            renderTransformedAxes(svg, scales, -beta, { ctLabel: 'ct₂\'', xLabel: 'x₂\'' },
                D3_COLORS.photonGold, 'url(#arrowAmber)', 'axis-inbound', events.turnaround);
            renderSimultaneityLines(svg, scales, events.turnaround, beta, events.maxCoord);
            renderWorldline(svg, scales, events.departure, events.turnaround, events.arrival, true);
            renderEvents(svg, scales, events.departure, events.turnaround, events.arrival);
            renderLabels(svg, scales, twinsData, events.departure, events.turnaround, events.arrival, size);
            renderLegend(container);
            setupTooltips(svg, container);

            // Update velocity slider to match new data (unless update came from slider)
            if (!isSliderUpdate) {
                velocitySlider.property('value', twinsData.velocityC);
                velocityValueDisplay.text(`${formatVelocityMs(twinsData.velocityC)} m/s`);
            }
            isSliderUpdate = false;
        },

        updateSlider(velocityC: number) {
            velocitySlider.property('value', velocityC);
            velocityValueDisplay.text(`${formatVelocityMs(velocityC)} m/s`);
        },

        pause() {
            animation.pause();
            isPlaying = false;
        },

        play() {
            animation.play();
            isPlaying = true;
        },

        destroy() {
            animation.stop();
            window.removeEventListener('resize', resizeHandler);
            document.removeEventListener('visibilitychange', visibilityChangeHandler);
            select(container).selectAll('*').remove();
        }
    };

    return controller;
}
