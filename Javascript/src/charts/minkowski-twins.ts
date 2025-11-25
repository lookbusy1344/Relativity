// Twin Paradox Minkowski Diagram - Shows dual reference frames and simultaneity jump
import { select, Selection } from 'd3-selection';
import 'd3-transition';
import { easeCubicInOut } from 'd3-ease';
import { COLORS as D3_COLORS } from './minkowski-colors';
import type { MinkowskiController, ScaleSet } from './minkowski-types';
import {
    C,
    debounce,
    createScaleSet,
    setupSVG,
    createAxisDefinitions,
    createLayerGroups,
    renderStandardAxes,
    renderTransformedAxes,
    renderLightCone,
    createTooltip
} from './minkowski-core';

export interface TwinParadoxMinkowskiData {
    velocityC: number;        // Velocity as fraction of c
    properTimeYears: number;  // Proper time in years
    earthTimeYears: number;   // Coordinate time in years
    distanceLY: number;       // One-way distance in light years
    gamma: number;            // Lorentz factor
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
        .attr('stroke-width', 3)
        .attr('stroke-dasharray', '5,5');

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
        .attr('stroke-dasharray', '4,4')
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
        { text: `Velocity: ${data.velocityC.toFixed(3)}c`, y: size - 75, color: D3_COLORS.plasmaWhite },
        { text: `γ = ${data.gamma.toFixed(3)}`, y: size - 60, color: D3_COLORS.plasmaWhite },
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

    // Title (top left)
    labelsGroup.selectAll('text.title')
        .data([{ text: 'TWIN PARADOX - Minkowski Diagram' }])
        .join('text')
        .attr('class', 'title header')
        .attr('x', 15)
        .attr('y', 25)
        .attr('fill', D3_COLORS.plasmaWhite)
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
        { color: '#00d9ff', text: 'Earth twin (stationary)', type: 'dashed' },
        { color: '#ffaa00', text: 'Light cones (c)', type: 'dashed' },
        { color: 'rgba(0, 217, 255, 0.5)', text: 'Simultaneity lines', type: 'dashed' },
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
 * Main function: Draw Twin Paradox Minkowski diagram
 */
export function drawTwinParadoxMinkowski(
    container: HTMLElement,
    data: TwinParadoxMinkowskiData
): MinkowskiController {
    const size = 900;
    const beta = data.velocityC;

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

    // Render inbound frame axes (amber) - negative velocity
    renderTransformedAxes(
        svg, scales, -beta,
        { ctLabel: 'ct₂\'', xLabel: 'x₂\'' },
        D3_COLORS.photonGold,
        'url(#arrowAmber)',
        'axis-inbound'
    );

    // Render light cones at key events
    renderLightCone(svg, scales, events.departure.ct, events.departure.x, events.maxCoord, 'cone-departure');
    renderLightCone(svg, scales, events.turnaround.ct, events.turnaround.x, events.maxCoord, 'cone-turnaround');
    renderLightCone(svg, scales, events.arrival.ct, events.arrival.x, events.maxCoord, 'cone-arrival');

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
            D3_COLORS.photonGold, 'url(#arrowAmber)', 'axis-inbound');
        renderLightCone(svg, scales, events.departure.ct, events.departure.x, events.maxCoord, 'cone-departure');
        renderLightCone(svg, scales, events.turnaround.ct, events.turnaround.x, events.maxCoord, 'cone-turnaround');
        renderLightCone(svg, scales, events.arrival.ct, events.arrival.x, events.maxCoord, 'cone-arrival');
        renderSimultaneityLines(svg, scales, events.turnaround, beta, events.maxCoord);
        renderWorldline(svg, scales, events.departure, events.turnaround, events.arrival, false);
        renderEvents(svg, scales, events.departure, events.turnaround, events.arrival);
        renderLabels(svg, scales, data, events.departure, events.turnaround, events.arrival, size);
        renderLegend(container);
        setupTooltips(svg, container);
    }, 150);

    window.addEventListener('resize', resizeHandler);

    // Public controller API
    const controller = {
        update(newData: TwinParadoxMinkowskiData | any) {
            const twinsData = newData as TwinParadoxMinkowskiData;
            // Re-calculate and re-render with new data
            events = calculateEvents(twinsData);
            scales = createScaleSet(events.maxCoord, size);

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
                D3_COLORS.photonGold, 'url(#arrowAmber)', 'axis-inbound');
            renderLightCone(svg, scales, events.departure.ct, events.departure.x, events.maxCoord, 'cone-departure');
            renderLightCone(svg, scales, events.turnaround.ct, events.turnaround.x, events.maxCoord, 'cone-turnaround');
            renderLightCone(svg, scales, events.arrival.ct, events.arrival.x, events.maxCoord, 'cone-arrival');
            renderSimultaneityLines(svg, scales, events.turnaround, beta, events.maxCoord);
            renderWorldline(svg, scales, events.departure, events.turnaround, events.arrival, true);
            renderEvents(svg, scales, events.departure, events.turnaround, events.arrival);
            renderLabels(svg, scales, twinsData, events.departure, events.turnaround, events.arrival, size);
            renderLegend(container);
            setupTooltips(svg, container);
        },

        pause() {
            // No animation in Twin Paradox diagram
        },

        play() {
            // No animation in Twin Paradox diagram
        },

        destroy() {
            window.removeEventListener('resize', resizeHandler);
            select(container).selectAll('*').remove();
        }
    };

    return controller;
}
