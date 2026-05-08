import { Chart, registerables } from "chart.js";
import "../bootstrap-types";
import { initializeFromURL, setupURLSync } from "../urlState";
import { createAppState, createTrackedEventListenerRegistry } from "./state";
import { wireHelpModals } from "./helpModals";
import { wireCalculatorHandlers } from "./calculatorWiring";

// Register Chart.js components
Chart.register(...registerables);

export function bootstrapApp(): void {
	const { chartRegistry, minkowskiState, twinsMinkowskiState, simultaneityState } =
		createAppState();
	const eventListenerRegistry = createTrackedEventListenerRegistry();
	const { entries: eventHandlers } = eventListenerRegistry;

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

	// Initialize Bootstrap tooltips
	const bs = window.bootstrap;
	if (bs) {
		document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
			new bs.Tooltip(el);
		});
	}

	// Initialize from URL parameters and set up bidirectional sync
	initializeFromURL();
	const cleanupURLSync = setupURLSync();

	// Cleanup function to remove all event listeners
	const cleanup = () => {
		// Remove all tracked event listeners
		eventHandlers.forEach(({ element, event, handler }) => {
			element.removeEventListener(event, handler);
		});

		// Cleanup URL sync listeners
		cleanupURLSync();

		// Destroy chart controllers
		minkowskiState.controller?.destroy();
		twinsMinkowskiState.controller?.destroy();
		simultaneityState.controller?.destroy();
	};

	// Register cleanup on page unload
	addEventListener(window, "beforeunload", cleanup);
}
