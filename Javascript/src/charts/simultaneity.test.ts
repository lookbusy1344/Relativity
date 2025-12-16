import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createSimultaneityDiagram } from "./simultaneity";
import { clearBody } from "../test-utils/dom-helpers";

describe("Simultaneity Diagram", () => {
	let container: HTMLDivElement;

	beforeEach(() => {
		clearBody();
		container = document.createElement("div");
		container.id = "simultaneity-container";
		document.body.appendChild(container);
	});

	afterEach(() => {
		clearBody();
	});

	describe("Light Cone Toggle Button", () => {
		it("creates a light cone toggle button", () => {
			createSimultaneityDiagram(container);

			// Find button by text content
			const buttons = Array.from(document.querySelectorAll("button"));
			const lightConeButton = buttons.find(btn => btn.textContent?.includes("Light cone"));

			expect(lightConeButton).toBeDefined();
			expect(lightConeButton?.textContent).toContain("Light cone");
		});

		it("toggles light cone visibility when clicked", () => {
			const controller = createSimultaneityDiagram(container);

			// Find the light cone toggle button
			const buttons = Array.from(document.querySelectorAll("button"));
			const lightConeButton = buttons.find(btn => btn.textContent?.includes("Light cone"));

			expect(lightConeButton).toBeDefined();

			// Find the light cone layer in SVG
			const lightConeLayer = container.querySelector(".light-cone-layer") as SVGGElement;
			expect(lightConeLayer).toBeDefined();

			// Initially visible (opacity 1 or display not none)
			const initialDisplay = window.getComputedStyle(lightConeLayer).display;
			expect(initialDisplay).not.toBe("none");

			// Click to hide
			lightConeButton?.click();
			const hiddenDisplay = window.getComputedStyle(lightConeLayer).display;
			expect(hiddenDisplay).toBe("none");

			// Click to show again
			lightConeButton?.click();
			const shownDisplay = window.getComputedStyle(lightConeLayer).display;
			expect(shownDisplay).not.toBe("none");

			controller.destroy();
		});
	});
});
