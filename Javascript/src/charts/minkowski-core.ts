// Core D3-based Minkowski diagram functions - shared between implementations
import { select, Selection } from 'd3-selection';
import { COLORS as D3_COLORS } from './minkowski-colors';
import type { ScaleSet, TooltipController } from './minkowski-types';

// Speed of light constant
export const C = 299792.458; // km/s

/**
 * Debounce helper for resize events
 */
export function debounce<T extends (...args: any[]) => any>(
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
export function formatCoordinate(value: number): string {
    if (Math.abs(value) < 0.001 || Math.abs(value) > 10000) {
        return value.toExponential(2);
    }
    return value.toFixed(2);
}

/**
 * Calculate Lorentz factor (gamma)
 */
export function calculateGamma(beta: number): number {
    return 1 / Math.sqrt(1 - beta * beta);
}

/**
 * Perform Lorentz transformation
 */
export function lorentzTransform(
    ct: number,
    x: number,
    beta: number
): { ctPrime: number; xPrime: number } {
    const gamma = calculateGamma(beta);
    return {
        ctPrime: gamma * (ct - beta * x),
        xPrime: gamma * (x - beta * ct)
    };
}

/**
 * Create coordinate scales for spacetime diagram
 * @param maxCoord Maximum coordinate value for scaling
 * @param size Canvas size in pixels
 */
export function createScaleSet(maxCoord: number, size: number): ScaleSet {
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
 * Setup SVG element with proper structure and definitions
 */
export function setupSVG(
    container: HTMLElement,
    size: number = 900
): Selection<SVGSVGElement, unknown, null, undefined> {
    const padding = 10; // Padding to prevent arrow markers from being clipped

    // Remove existing SVG if present
    select(container).select('svg').remove();

    // Create new SVG with viewBox
    const svg = select(container)
        .append('svg')
        .attr('viewBox', `${-padding} ${-padding} ${size + 2 * padding} ${size + 2 * padding}`)
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
            text.label { font-size: 11px; }
            text.header { font-size: 13px; font-weight: bold; }
            text.secondary { font-size: 10px; }

            @media (max-width: 768px) {
                text.label { font-size: 10px; }
                text.header { font-size: 12px; }
            }

            @media (max-width: 480px) {
                text.label { font-size: 10px; }
                text.header { font-size: 11px; }
                text.secondary { display: none; }
            }
        `);

    return svg;
}

/**
 * Create gradient and marker definitions for axes
 */
export function createAxisDefinitions(svg: Selection<SVGSVGElement, unknown, null, undefined>): void {
    const defs = svg.select('defs');

    // Gradient for blue axes
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

    // Gradient for green axes
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

    // Gradient for amber axes
    defs.append('linearGradient')
        .attr('id', 'axisGradientAmber')
        .attr('x1', '0%').attr('y1', '0%')
        .attr('x2', '0%').attr('y2', '100%')
        .selectAll('stop')
        .data([
            { offset: '0%', color: D3_COLORS.photonGold, opacity: 0.3 },
            { offset: '50%', color: D3_COLORS.photonGold, opacity: 1 },
            { offset: '100%', color: D3_COLORS.photonGold, opacity: 0.3 }
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

    // Arrow markers for different colored axes
    const markerColors = [
        { id: 'arrowBlue', color: D3_COLORS.electricBlue },
        { id: 'arrowGreen', color: D3_COLORS.quantumGreen },
        { id: 'arrowAmber', color: D3_COLORS.photonGold }
    ];

    markerColors.forEach(({ id, color }) => {
        defs.append('marker')
            .attr('id', id)
            .attr('viewBox', '0 0 10 10')
            .attr('refX', '5').attr('refY', '5')
            .attr('markerWidth', '6').attr('markerHeight', '6')
            .attr('orient', 'auto-start-reverse')
            .append('path')
            .attr('d', 'M 0 0 L 10 5 L 0 10 z')
            .attr('fill', color);
    });
}

/**
 * Create standard layer groups for Minkowski diagram
 */
export function createLayerGroups(svg: Selection<SVGSVGElement, unknown, null, undefined>): void {
    svg.append('g').attr('class', 'background');
    svg.append('g').attr('class', 'light-cones');
    svg.append('g').attr('class', 'simultaneity-lines');
    svg.append('g').attr('class', 'axes');
    svg.append('g').attr('class', 'worldlines');
    svg.append('g').attr('class', 'events');
    svg.append('g').attr('class', 'labels');
}

/**
 * Render standard orthogonal axes (ct, x)
 */
export function renderStandardAxes(
    svg: Selection<SVGSVGElement, unknown, null, undefined>,
    scales: ScaleSet,
    labels: { ctLabel: string; xLabel: string } = { ctLabel: 'ct', xLabel: 'x' }
): void {
    const extent = scales.maxCoord;
    const axesGroup = svg.select('g.axes');

    const axesData = [
        { x1: 0, y1: -extent, x2: 0, y2: extent, axis: labels.ctLabel },
        { x1: -extent, y1: 0, x2: extent, y2: 0, axis: labels.xLabel }
    ];

    axesGroup.selectAll('line.axis-standard')
        .data(axesData)
        .join('line')
        .attr('class', 'axis-standard')
        .attr('data-axis', d => d.axis)
        .attr('stroke', D3_COLORS.electricBlue)
        .attr('stroke-width', 3)
        .attr('marker-start', 'url(#arrowBlue)')
        .attr('marker-end', 'url(#arrowBlue)')
        .attr('x1', d => scales.xScale(d.x1))
        .attr('y1', d => scales.yScale(d.y1))
        .attr('x2', d => scales.xScale(d.x2))
        .attr('y2', d => scales.yScale(d.y2))
        .style('cursor', 'pointer');
}

/**
 * Render Lorentz-transformed axes (ct', x') at given velocity
 */
export function renderTransformedAxes(
    svg: Selection<SVGSVGElement, unknown, null, undefined>,
    scales: ScaleSet,
    beta: number,
    labels: { ctLabel: string; xLabel: string },
    color: string,
    markerUrl: string,
    cssClass: string,
    origin: { x: number; ct: number } = { x: 0, ct: 0 }
): void {
    const extent = scales.maxCoord;
    const angle = Math.atan(beta);
    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);

    const axesGroup = svg.select('g.axes');

    // Calculate axis lengths
    const ctPrimeLength = extent / cosAngle;
    const xPrimeLength = extent / cosAngle;

    const axesData = [
        {
            x1: origin.x + (-ctPrimeLength * sinAngle),
            y1: origin.ct + (-ctPrimeLength * cosAngle),
            x2: origin.x + (ctPrimeLength * sinAngle),
            y2: origin.ct + (ctPrimeLength * cosAngle),
            axis: labels.ctLabel
        },
        {
            x1: origin.x + (-xPrimeLength * cosAngle),
            y1: origin.ct + (-xPrimeLength * sinAngle),
            x2: origin.x + (xPrimeLength * cosAngle),
            y2: origin.ct + (xPrimeLength * sinAngle),
            axis: labels.xLabel
        }
    ];

    axesGroup.selectAll(`line.${cssClass}`)
        .data(axesData)
        .join('line')
        .attr('class', cssClass)
        .attr('data-axis', d => d.axis)
        .attr('stroke', color)
        .attr('stroke-width', 3)
        .attr('marker-start', markerUrl)
        .attr('marker-end', markerUrl)
        .attr('x1', d => scales.xScale(d.x1))
        .attr('y1', d => scales.yScale(d.y1))
        .attr('x2', d => scales.xScale(d.x2))
        .attr('y2', d => scales.yScale(d.y2))
        .style('cursor', 'pointer');
}

/**
 * Render light cone from a point
 */
export function renderLightCone(
    svg: Selection<SVGSVGElement, unknown, null, undefined>,
    scales: ScaleSet,
    ct: number,
    x: number,
    extent: number,
    cssClass: string = 'light-cone'
): void {
    const lightConesGroup = svg.select('g.light-cones');
    const largeExtent = extent * 2;

    const lineData = [
        { x1: x - largeExtent, y1: ct - largeExtent, x2: x + largeExtent, y2: ct + largeExtent },
        { x1: x - largeExtent, y1: ct + largeExtent, x2: x + largeExtent, y2: ct - largeExtent }
    ];

    lightConesGroup.selectAll(`line.${cssClass}`)
        .data(lineData)
        .join('line')
        .attr('class', cssClass)
        .attr('stroke', `${D3_COLORS.photonGold}${D3_COLORS.dashedLine}`)
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5')
        .attr('x1', d => scales.xScale(d.x1))
        .attr('y1', d => scales.yScale(d.y1))
        .attr('x2', d => scales.xScale(d.x2))
        .attr('y2', d => scales.yScale(d.y2))
        .style('cursor', 'pointer');
}

/**
 * Render background grid
 */
export function renderGrid(
    svg: Selection<SVGSVGElement, unknown, null, undefined>,
    scales: ScaleSet
): void {
    const backgroundGroup = svg.select('g.background');
    const maxCoord = scales.maxCoord;
    const gridSpacing = Math.pow(10, Math.floor(Math.log10(maxCoord / 5)));

    const gridLines: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];

    // Vertical grid lines
    for (let x = -maxCoord; x <= maxCoord; x += gridSpacing) {
        if (Math.abs(x) > 0.01) { // Skip origin
            gridLines.push({ x1: x, y1: -maxCoord, x2: x, y2: maxCoord });
        }
    }

    // Horizontal grid lines
    for (let ct = -maxCoord; ct <= maxCoord; ct += gridSpacing) {
        if (Math.abs(ct) > 0.01) { // Skip origin
            gridLines.push({ x1: -maxCoord, y1: ct, x2: maxCoord, y2: ct });
        }
    }

    backgroundGroup.selectAll('line.grid')
        .data(gridLines)
        .join('line')
        .attr('class', 'grid')
        .attr('stroke', `${D3_COLORS.electricBlue}15`)
        .attr('stroke-width', 1)
        .attr('x1', d => scales.xScale(d.x1))
        .attr('y1', d => scales.yScale(d.y1))
        .attr('x2', d => scales.xScale(d.x2))
        .attr('y2', d => scales.yScale(d.y2));
}

/**
 * Create tooltip system for Minkowski diagram
 */
export function createTooltip(container: HTMLElement): TooltipController {
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
            tooltip.remove();
        },
        reattach() {
            // To be implemented by specific diagram types
        }
    };
}
