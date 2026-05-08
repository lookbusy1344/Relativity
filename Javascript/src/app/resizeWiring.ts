import type { ChartRegistry } from "../charts/charts";
import type { MinkowskiData, MinkowskiDiagramController } from "../charts/minkowski";
import type { TwinParadoxMinkowskiData, TwinParadoxController } from "../charts/minkowski-twins";

export interface ResizeWiringState {
	minkowskiState: {
		lastData: MinkowskiData | null;
		controller: MinkowskiDiagramController | null;
	};
	twinsMinkowskiState: {
		lastData: TwinParadoxMinkowskiData | null;
		controller: TwinParadoxController | null;
	};
}

export interface ResizeWiringDeps {
	chartRegistry: { current: ChartRegistry };
	state: ResizeWiringState;
	addEventListener(
		element: Element | Window | null,
		event: string,
		handler: EventListener | EventListenerObject
	): void;
}

export function wireResizeHandling(deps: ResizeWiringDeps): void {
	const { chartRegistry, state } = deps;
	const addEventListener = (
		element: Element | Window | null,
		event: string,
		handler: EventListener | EventListenerObject
	): void => {
		deps.addEventListener(element, event, handler);
	};

	let resizeTimeout: number | undefined;
	let lastInnerWidth = window.innerWidth;
	const handleResize = () => {
		if (window.innerWidth === lastInnerWidth) return;
		lastInnerWidth = window.innerWidth;

		clearTimeout(resizeTimeout);
		resizeTimeout = window.setTimeout(() => {
			chartRegistry.current.forEach(chart => {
				chart.resize();
			});

			if (state.minkowskiState.controller && state.minkowskiState.lastData) {
				state.minkowskiState.controller.update(state.minkowskiState.lastData);
			}

			if (state.twinsMinkowskiState.controller && state.twinsMinkowskiState.lastData) {
				state.twinsMinkowskiState.controller.update(state.twinsMinkowskiState.lastData);
			}
		}, 700);
	};

	addEventListener(window, "resize", handleResize);
	addEventListener(window, "orientationchange", handleResize);
	addEventListener(window, "beforeunload", () => {
		clearTimeout(resizeTimeout);
	});
}
