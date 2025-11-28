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

/**
 * Base controller interface shared by all diagram types
 */
export interface BaseController {
    pause(): void;      // Pause auto-play animation
    play(): void;       // Resume auto-play animation
    destroy(): void;    // Cleanup and remove
}

/**
 * Controller for standard two-event Minkowski diagram
 */
export interface MinkowskiDiagramController extends BaseController {
    update(data: MinkowskiData): void;
}

/**
 * Kept for backwards compatibility - use MinkowskiDiagramController instead
 * @deprecated
 */
export type MinkowskiController = MinkowskiDiagramController;

export interface ScaleSet {
    xScale: (value: number) => number;
    yScale: (value: number) => number;
    maxCoord: number;
}

export interface TooltipController {
    show(content: string, x: number, y: number): void;
    hide(): void;
    destroy(): void;
    reattach(): void;
}

export interface AnimationController {
    pause(): void;
    play(): void;
    stop(): void;
    setPosition(t: number): void;
}
