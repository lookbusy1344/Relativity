import { Chart, registerables } from "chart.js";
import "../bootstrap-types";
import { createAppState, createTrackedEventListenerRegistry } from "./state";
import { wireHelpModals } from "./helpModals";
import { wireCalculatorHandlers } from "./calculatorWiring";
import { wireResizeHandling } from "./resizeWiring";
import { runInitialCalculations } from "./initialCalculations";
import { wireUrlSync } from "./urlSyncWiring";

// Register Chart.js components
Chart.register(...registerables);

export function bootstrapApp(): void {
	const { chartRegistry, minkowskiState, twinsMinkowskiState, simultaneityState } =
		createAppState();
	const eventListenerRegistry = createTrackedEventListenerRegistry();

	const addEventListener = (
		element: Element | Window | null,
		event: string,
		handler: EventListener | EventListenerObject
	) => {
		eventListenerRegistry.addEventListener(element, event, handler);
	};

	wireHelpModals();
	wireCalculatorHandlers({
		chartRegistry,
		state: {
			minkowskiState,
			twinsMinkowskiState,
			simultaneityState,
		},
		addEventListener,
	});
	wireResizeHandling({
		chartRegistry,
		state: {
			minkowskiState,
			twinsMinkowskiState,
		},
		addEventListener,
	});

	runInitialCalculations();
	wireUrlSync({
		state: {
			minkowskiState,
			twinsMinkowskiState,
			simultaneityState,
		},
		eventListenerRegistry,
		addEventListener,
	});
}
