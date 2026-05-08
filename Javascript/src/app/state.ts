import type { ChartRegistry } from "../charts/charts";
import type { MinkowskiData, MinkowskiDiagramController } from "../charts/minkowski";
import type { TwinParadoxMinkowskiData, TwinParadoxController } from "../charts/minkowski-twins";
import type { SimultaneityController } from "../charts/simultaneity";

export interface AppState {
	chartRegistry: { current: ChartRegistry };
	minkowskiState: {
		lastData: MinkowskiData | null;
		controller: MinkowskiDiagramController | null;
	};
	twinsMinkowskiState: {
		lastData: TwinParadoxMinkowskiData | null;
		controller: TwinParadoxController | null;
	};
	simultaneityState: {
		controller: SimultaneityController | null;
	};
}

export interface TrackedEventListenerEntry {
	element: Element | Window;
	event: string;
	handler: EventListener | EventListenerObject;
}

export interface TrackedEventListenerRegistry {
	entries: TrackedEventListenerEntry[];
	addEventListener(
		element: Element | Window | null,
		event: string,
		handler: EventListener | EventListenerObject
	): void;
}

export function createAppState(): AppState {
	return {
		chartRegistry: { current: new Map() as ChartRegistry },
		minkowskiState: {
			lastData: null,
			controller: null,
		},
		twinsMinkowskiState: {
			lastData: null,
			controller: null,
		},
		simultaneityState: {
			controller: null,
		},
	};
}

export function createTrackedEventListenerRegistry(): TrackedEventListenerRegistry {
	const entries: TrackedEventListenerEntry[] = [];

	return {
		entries,
		addEventListener(element, event, handler) {
			if (!element) return;
			element.addEventListener(event, handler);
			entries.push({ element, event, handler });
		},
	};
}
