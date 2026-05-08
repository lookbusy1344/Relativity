import { updateURL } from "./update";

export function setupURLSync(): () => void {
	let debounceTimer: number | undefined;
	const handlers = new Map<Element, Map<string, EventListener>>();

	const addHandler = (element: Element, event: string, handler: EventListener) => {
		element.addEventListener(event, handler);
		if (!handlers.has(element)) {
			handlers.set(element, new Map());
		}
		handlers.get(element)!.set(event, handler);
	};

	const radioInputs = document.querySelectorAll('input[type="radio"]');
	radioInputs.forEach(input => {
		const radioHandler = () => {
			clearTimeout(debounceTimer);
			debounceTimer = window.setTimeout(() => {
				updateURL();
			}, 150);
		};
		addHandler(input, "change", radioHandler);
	});

	const allInputs = document.querySelectorAll('input[type="number"], input[type="range"]');
	allInputs.forEach(input => {
		const inputHandler = () => {
			clearTimeout(debounceTimer);
			debounceTimer = window.setTimeout(() => {
				updateURL();
			}, 500);
		};
		addHandler(input, "input", inputHandler);

		const changeHandler = () => {
			clearTimeout(debounceTimer);
			debounceTimer = window.setTimeout(() => {
				updateURL();
			}, 150);
		};
		addHandler(input, "change", changeHandler);
	});

	const tabButtons = document.querySelectorAll('[data-bs-toggle="tab"]');
	tabButtons.forEach(button => {
		const tabHandler = () => {
			updateURL();
		};
		addHandler(button, "shown.bs.tab", tabHandler);
	});

	const calcButtons = document.querySelectorAll(".btn-calculate");
	calcButtons.forEach(button => {
		const clickHandler = () => {
			setTimeout(() => {
				updateURL();
			}, 200);
		};
		addHandler(button, "click", clickHandler);
	});

	return () => {
		clearTimeout(debounceTimer);
		handlers.forEach((eventMap, element) => {
			eventMap.forEach((handler, event) => {
				element.removeEventListener(event, handler);
			});
		});
		handlers.clear();
	};
}
