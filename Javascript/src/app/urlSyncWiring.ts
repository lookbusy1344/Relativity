import { setupURLSync } from "../urlState";
import type { AppState, TrackedEventListenerRegistry } from "./state";

export interface UrlSyncWiringDeps {
	state: Pick<AppState, "minkowskiState" | "twinsMinkowskiState" | "simultaneityState">;
	eventListenerRegistry: TrackedEventListenerRegistry;
	addEventListener(
		element: Element | Window | null,
		event: string,
		handler: EventListener | EventListenerObject
	): void;
}

export function wireUrlSync(deps: UrlSyncWiringDeps): void {
	const cleanupURLSync = setupURLSync();

	const cleanup = () => {
		deps.eventListenerRegistry.entries.forEach(({ element, event, handler }) => {
			element.removeEventListener(event, handler);
		});

		cleanupURLSync();

		deps.state.minkowskiState.controller?.destroy();
		deps.state.twinsMinkowskiState.controller?.destroy();
		deps.state.simultaneityState.controller?.destroy();
	};

	deps.addEventListener(window, "beforeunload", cleanup);
}
