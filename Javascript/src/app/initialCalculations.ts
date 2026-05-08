import { initializeFromURL } from "../urlState";

export function runInitialCalculations(): void {
	const bs = window.bootstrap;
	if (bs) {
		document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
			new bs.Tooltip(el);
		});
	}

	initializeFromURL();
}
