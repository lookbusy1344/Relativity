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
