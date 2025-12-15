/**
 * Clears the document body using safe DOM methods (no innerHTML)
 */
export function clearBody(): void {
	while (document.body.firstChild) {
		document.body.removeChild(document.body.firstChild);
	}
}

/**
 * Creates mock DOM elements for calculator tests using safe DOM methods
 */
export function createMockCalculatorDOM(
	inputIds: string[] = [],
	resultIds: string[] = [],
	buttonIds: string[] = [],
	canvasIds: string[] = []
): void {
	const container = document.createElement("div");
	container.id = "test-container";

	inputIds.forEach(id => {
		const input = document.createElement("input");
		input.id = id;
		input.type = "text";
		container.appendChild(input);
	});

	resultIds.forEach(id => {
		const span = document.createElement("span");
		span.id = id;
		container.appendChild(span);
	});

	buttonIds.forEach(id => {
		const button = document.createElement("button");
		button.id = id;
		container.appendChild(button);
	});

	canvasIds.forEach(id => {
		const canvas = document.createElement("canvas");
		canvas.id = id;
		container.appendChild(canvas);
	});

	document.body.appendChild(container);
}

/**
 * Sets the value of an input element
 */
export function setInputValue(id: string, value: string): void {
	const input = document.getElementById(id) as HTMLInputElement;
	if (!input) throw new Error(`Input #${id} not found`);
	input.value = value;
	input.dispatchEvent(new Event("input", { bubbles: true }));
}

/**
 * Gets the text content of a result span
 */
export function getResultText(id: string): string {
	const span = document.getElementById(id);
	if (!span) throw new Error(`Result span #${id} not found`);
	return span.textContent || "";
}

/**
 * Triggers a click event on a button
 */
export function clickButton(id: string): void {
	const button = document.getElementById(id) as HTMLButtonElement;
	if (!button) throw new Error(`Button #${id} not found`);
	button.click();
}

/**
 * Waits for requestAnimationFrame and setTimeout to settle
 */
export function waitForUpdate(): Promise<void> {
	return new Promise(resolve => {
		requestAnimationFrame(() => {
			setTimeout(resolve, 0);
		});
	});
}
