// D3 imports for new implementation
// @ts-expect-error - Imports will be used in subsequent tasks
import { select, Selection } from 'd3-selection';
// @ts-expect-error - Imports will be used in subsequent tasks
import { scaleLinear } from 'd3-scale';
// @ts-expect-error - Imports will be used in subsequent tasks
import { transition } from 'd3-transition';
// @ts-expect-error - Imports will be used in subsequent tasks
import { easeCubicInOut } from 'd3-ease';
// @ts-expect-error - Imports will be used in subsequent tasks
import { timer, Timer } from 'd3-timer';
// @ts-expect-error - Imports will be used in subsequent tasks
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

const COLORS = {
    cyan: '#00d9ff',
    green: '#00ff9f',
    amber: '#ffaa00',
    white: '#e8f1f5',
    gray: 'rgba(232, 241, 245, 0.2)',
};

export function drawMinkowskiDiagram(canvas: HTMLCanvasElement, data: MinkowskiData): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size (responsive) - get actual display size and set canvas resolution
    const rect = canvas.getBoundingClientRect();
    const displayWidth = rect.width;
    const size = Math.min(900, displayWidth || 900);

    // Set canvas resolution to match display size for crisp rendering
    canvas.width = size;
    canvas.height = size;

    const centerX = size / 2;
    const centerY = size / 2;

    // Convert km to light-seconds for consistent units (c*t has same units as x/c)
    const c = 299792.458; // km/s
    const ct = data.time * c; // Convert time to distance units (km)
    const x = data.distance;
    const beta = data.velocity;

    // Lorentz factor
    const gamma = 1 / Math.sqrt(1 - beta * beta);

    // Transformed coordinates
    const ctPrime = gamma * (ct - beta * x);
    const xPrime = gamma * (x - beta * ct);

    // Calculate scale to fit all coordinates with 20% padding for labels
    const maxCoord = Math.max(Math.abs(ct), Math.abs(x), Math.abs(ctPrime), Math.abs(xPrime)) * 1.2;
    const scale = (size / 2) / maxCoord;

    // Helper function to convert spacetime coords to canvas coords
    const toCanvas = (xCoord: number, ctCoord: number): [number, number] => {
        return [
            centerX + xCoord * scale,
            centerY - ctCoord * scale  // Invert Y for standard orientation
        ];
    };

    // Clear canvas
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, size, size);

    // Set font
    ctx.font = '13px "IBM Plex Mono", monospace';

    const extent = maxCoord;

    // Draw light cone from origin with shaded causal regions
    ctx.strokeStyle = COLORS.amber + '60';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    // Shade the interior of the light cone to show causally connected region
    if (ct !== 0 || x !== 0) {
        ctx.fillStyle = COLORS.amber + '15'; // Very subtle shading
        ctx.beginPath();
        const [lc1, lc1y] = toCanvas(-extent, -extent);
        const [lc2, lc2y] = toCanvas(extent, extent);
        const [lc3, lc3y] = toCanvas(extent, -extent);
        const [lc4, lc4y] = toCanvas(-extent, extent);
        // Draw future light cone
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(lc2, lc2y);
        ctx.lineTo(lc4, lc4y);
        ctx.closePath();
        ctx.fill();
        // Draw past light cone
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(lc1, lc1y);
        ctx.lineTo(lc3, lc3y);
        ctx.closePath();
        ctx.fill();
    }

    // Draw light cone lines
    ctx.strokeStyle = COLORS.amber + '60';
    ctx.beginPath();
    const [lcX1, lcY1] = toCanvas(-extent, -extent);
    const [lcX2, lcY2] = toCanvas(extent, extent);
    ctx.moveTo(lcX1, lcY1);
    ctx.lineTo(lcX2, lcY2);
    ctx.stroke();

    ctx.beginPath();
    const [lcX3, lcY3] = toCanvas(-extent, extent);
    const [lcX4, lcY4] = toCanvas(extent, -extent);
    ctx.moveTo(lcX3, lcY3);
    ctx.lineTo(lcX4, lcY4);
    ctx.stroke();

    // Draw light cone at the event (if not at origin)
    if (ct !== 0 || x !== 0) {
        // Light cone through event point
        ctx.beginPath();
        const [evlcX1, evlcY1] = toCanvas(x - extent, ct - extent);
        const [evlcX2, evlcY2] = toCanvas(x + extent, ct + extent);
        ctx.moveTo(evlcX1, evlcY1);
        ctx.lineTo(evlcX2, evlcY2);
        ctx.stroke();

        ctx.beginPath();
        const [evlcX3, evlcY3] = toCanvas(x - extent, ct + extent);
        const [evlcX4, evlcY4] = toCanvas(x + extent, ct - extent);
        ctx.moveTo(evlcX3, evlcY3);
        ctx.lineTo(evlcX4, evlcY4);
        ctx.stroke();
    }

    ctx.setLineDash([]);

    // Draw original frame axes (orthogonal)
    ctx.strokeStyle = COLORS.cyan;
    ctx.fillStyle = COLORS.cyan;
    ctx.lineWidth = 3;

    // ct axis (vertical)
    ctx.beginPath();
    const [ctX1, ctY1] = toCanvas(0, -extent);
    const [ctX2, ctY2] = toCanvas(0, extent);
    ctx.moveTo(ctX1, ctY1);
    ctx.lineTo(ctX2, ctY2);
    ctx.stroke();
    drawArrow(ctx, ctX2, ctY2, 0, -1);

    // x axis (horizontal)
    ctx.beginPath();
    const [xX1, xY1] = toCanvas(-extent, 0);
    const [xX2, xY2] = toCanvas(extent, 0);
    ctx.moveTo(xX1, xY1);
    ctx.lineTo(xX2, xY2);
    ctx.stroke();
    drawArrow(ctx, xX2, xY2, 1, 0);

    // Note: Axis labels removed - legend now identifies the frames

    // Draw transformed frame axes (tilted)
    ctx.strokeStyle = COLORS.green;
    ctx.fillStyle = COLORS.green;
    ctx.lineWidth = 3;

    const angle = Math.atan(beta);
    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);

    // ct' axis (tilted)
    ctx.beginPath();
    const ctPrimeLength = extent / cosAngle;
    const [ctpX1, ctpY1] = toCanvas(-ctPrimeLength * sinAngle, -ctPrimeLength * cosAngle);
    const [ctpX2, ctpY2] = toCanvas(ctPrimeLength * sinAngle, ctPrimeLength * cosAngle);
    ctx.moveTo(ctpX1, ctpY1);
    ctx.lineTo(ctpX2, ctpY2);
    ctx.stroke();
    drawArrow(ctx, ctpX2, ctpY2, sinAngle, cosAngle);

    // x' axis (tilted opposite direction)
    ctx.beginPath();
    const xPrimeLength = extent / cosAngle;
    const [xpX1, xpY1] = toCanvas(-xPrimeLength * cosAngle, -xPrimeLength * sinAngle);
    const [xpX2, xpY2] = toCanvas(xPrimeLength * cosAngle, xPrimeLength * sinAngle);
    ctx.moveTo(xpX1, xpY1);
    ctx.lineTo(xpX2, xpY2);
    ctx.stroke();
    drawArrow(ctx, xpX2, xpY2, cosAngle, sinAngle);

    // Note: Transformed axis labels removed - legend now identifies the frames

    // Draw simultaneity and position lines if event is not at origin
    if (ct !== 0 || x !== 0) {
        ctx.setLineDash([3, 3]);
        ctx.lineWidth = 1.5;

        // Original frame: horizontal line through event (line of simultaneity)
        ctx.strokeStyle = COLORS.cyan + '50'; // Semi-transparent
        ctx.beginPath();
        const [simX1, simY1] = toCanvas(-extent, ct);
        const [simX2, simY2] = toCanvas(extent, ct);
        ctx.moveTo(simX1, simY1);
        ctx.lineTo(simX2, simY2);
        ctx.stroke();

        // Original frame: vertical line through event (line of constant position)
        ctx.beginPath();
        const [posX1, posY1] = toCanvas(x, -extent);
        const [posX2, posY2] = toCanvas(x, extent);
        ctx.moveTo(posX1, posY1);
        ctx.lineTo(posX2, posY2);
        ctx.stroke();

        // Transformed frame: tilted simultaneity line (parallel to x' axis through event)
        ctx.strokeStyle = COLORS.green + '50'; // Semi-transparent
        ctx.beginPath();
        // Points on line parallel to x' axis through (x, ct)
        const simLength = extent / cosAngle;
        const [simPX1, simPY1] = toCanvas(x - simLength * cosAngle, ct - simLength * sinAngle);
        const [simPX2, simPY2] = toCanvas(x + simLength * cosAngle, ct + simLength * sinAngle);
        ctx.moveTo(simPX1, simPY1);
        ctx.lineTo(simPX2, simPY2);
        ctx.stroke();

        // Transformed frame: tilted position line (parallel to ct' axis through event)
        ctx.beginPath();
        // Points on line parallel to ct' axis through (x, ct)
        const posPrimeLength = extent / cosAngle;
        const [posPX1, posPY1] = toCanvas(x - posPrimeLength * sinAngle, ct - posPrimeLength * cosAngle);
        const [posPX2, posPY2] = toCanvas(x + posPrimeLength * sinAngle, ct + posPrimeLength * cosAngle);
        ctx.moveTo(posPX1, posPY1);
        ctx.lineTo(posPX2, posPY2);
        ctx.stroke();

        ctx.setLineDash([]);
    }

    // Draw interval line
    if (ct !== 0 || x !== 0) {
        ctx.strokeStyle = COLORS.white;
        ctx.lineWidth = 3;
        ctx.beginPath();
        const [eventX, eventY] = toCanvas(x, ct);
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(eventX, eventY);
        ctx.stroke();
    }

    // Draw events - LARGER
    // Origin
    ctx.fillStyle = COLORS.white;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
    ctx.fill();

    // Event 2 (color-coded by interval type)
    const [eventX, eventY] = toCanvas(x, ct);
    if (data.intervalType === 'timelike') {
        ctx.fillStyle = COLORS.cyan;
    } else if (data.intervalType === 'spacelike') {
        ctx.fillStyle = COLORS.amber;
    } else {
        ctx.fillStyle = COLORS.white;
    }
    ctx.beginPath();
    ctx.arc(eventX, eventY, 8, 0, 2 * Math.PI);
    ctx.fill();

    // Draw causal relationship indicator
    if (ct !== 0 || x !== 0) {
        const causalY = size - 35;
        ctx.font = 'bold 15px "IBM Plex Mono", monospace';

        if (data.intervalType === 'timelike') {
            ctx.fillStyle = COLORS.cyan;
            ctx.fillText('✓ CAUSALLY CONNECTED', 15, causalY);
            ctx.font = '13px "IBM Plex Mono", monospace';
            ctx.fillText('(Event inside light cone)', 15, causalY + 18);
        } else if (data.intervalType === 'spacelike') {
            ctx.fillStyle = COLORS.amber;
            ctx.fillText('✗ NOT CAUSALLY CONNECTED', 15, causalY);
            ctx.font = '13px "IBM Plex Mono", monospace';
            ctx.fillText('(Event outside light cone)', 15, causalY + 18);
        } else {
            ctx.fillStyle = COLORS.white;
            ctx.fillText('⚡ ON LIGHT CONE', 15, causalY);
            ctx.font = '13px "IBM Plex Mono", monospace';
            ctx.fillText('(Connected by light signal)', 15, causalY + 18);
        }
    }

    // Draw coordinate labels
    ctx.font = '12px "IBM Plex Mono", monospace';

    // Origin label
    ctx.fillStyle = COLORS.white;
    ctx.fillText('Origin', centerX + 10, centerY - 10);

    // Event labels with better formatting
    const ctLabel = formatCoordinate(ct);
    const xLabel = formatCoordinate(x);
    const ctPrimeLabel = formatCoordinate(ctPrime);
    const xPrimeLabel = formatCoordinate(xPrime);

    // Background for labels
    const labelX = eventX + 12;
    const labelY1 = eventY - 25;
    const labelY2 = eventY - 8;

    // Original frame label
    ctx.fillStyle = COLORS.cyan;
    ctx.fillText(`(ct=${ctLabel}, x=${xLabel})`, labelX, labelY1);

    // Transformed frame label
    ctx.fillStyle = COLORS.green;
    ctx.fillText(`(ct'=${ctPrimeLabel}, x'=${xPrimeLabel})`, labelX, labelY2);
}

function drawArrow(ctx: CanvasRenderingContext2D, x: number, y: number, dx: number, dy: number): void {
    const arrowLength = 10;
    const arrowWidth = 5;

    ctx.save();
    ctx.translate(x, y);
    const angle = Math.atan2(-dy, dx);
    ctx.rotate(angle);

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-arrowLength, -arrowWidth);
    ctx.lineTo(-arrowLength, arrowWidth);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

function formatCoordinate(value: number): string {
    if (Math.abs(value) < 0.001 || Math.abs(value) > 10000) {
        return value.toExponential(2);
    }
    return value.toFixed(2);
}

// ============================================================================
// D3 Implementation (New) - Being progressively added
// ============================================================================

// Speed of light constant
const C = 299792.458; // km/s

/**
 * Debounce helper for resize events
 */
// @ts-expect-error - Will be used in subsequent tasks
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
// @ts-expect-error - Will be used in subsequent tasks
function formatCoordinateD3(value: number): string {
    if (Math.abs(value) < 0.001 || Math.abs(value) > 10000) {
        return value.toExponential(2);
    }
    return value.toFixed(2);
}

/**
 * Create coordinate scales for spacetime diagram
 */
// @ts-expect-error - Will be used in subsequent tasks
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
