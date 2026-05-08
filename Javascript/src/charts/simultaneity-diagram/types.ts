import Decimal from "decimal.js";
import type { Selection } from "d3-selection";
import type { BaseController } from "../minkowski-types";

export interface SimultaneityEvent {
	id: string;
	ct: number;
	x: number;
	isReference: boolean;
	temporalOrder: "future" | "past" | "simultaneous";
}

export interface SimultaneityState {
	events: SimultaneityEvent[];
	velocity: number;
	velocityDecimal: Decimal;
	gamma: number;
	referenceEventId: string | null;
	isAnimating: boolean;
	animationProgress: number;
	showLightCone: boolean;
}

export interface LayerGroups {
	grid: Selection<SVGGElement, unknown, null, undefined>;
	axes: Selection<SVGGElement, unknown, null, undefined>;
	lightCone: Selection<SVGGElement, unknown, null, undefined>;
	nowLine: Selection<SVGGElement, unknown, null, undefined>;
	events: Selection<SVGGElement, unknown, null, undefined>;
}

export interface SimultaneityController extends BaseController {
	update(): void;
	updateSlider?(velocity: number): void;
	reset(): void;
	clearAll(): void;
}

export const MAX_EVENTS = 4;
export const EVENT_LABELS = ["A", "B", "C", "D"] as const;
export const EVENT_RADIUS = 8;
export const CLICK_TOLERANCE = 15;
export const TRAIN_EXAMPLE_SCALE = 2 * 299792.458 * 1.3;

export type { ScaleSet } from "../minkowski-types";
