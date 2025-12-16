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

		it("light cone is hidden by default", () => {
			createSimultaneityDiagram(container);

			// Find the light cone layer in SVG
			const lightConeLayer = container.querySelector(".light-cone-layer") as SVGGElement;
			expect(lightConeLayer).toBeDefined();

			// Should be hidden by default
			const initialDisplay = window.getComputedStyle(lightConeLayer).display;
			expect(initialDisplay).toBe("none");
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

			// Initially hidden (display none)
			const initialDisplay = window.getComputedStyle(lightConeLayer).display;
			expect(initialDisplay).toBe("none");

			// Click to show
			lightConeButton?.click();
			const shownDisplay = window.getComputedStyle(lightConeLayer).display;
			expect(shownDisplay).not.toBe("none");

			// Click to hide again
			lightConeButton?.click();
			const hiddenDisplay = window.getComputedStyle(lightConeLayer).display;
			expect(hiddenDisplay).toBe("none");

			controller.destroy();
		});
	});

	describe("Position Slider", () => {
		it("creates a position slider below velocity slider", () => {
			createSimultaneityDiagram(container);

			// Find position slider by ID
			const positionSlider = document.getElementById("simPositionSlider") as HTMLInputElement;

			expect(positionSlider).toBeDefined();
			expect(positionSlider?.type).toBe("range");
		});

		it("hides position slider when animation is running", () => {
			createSimultaneityDiagram(container);

			// Position slider should be hidden initially (animation starts by default)
			const positionSliderContainer = document.querySelector(
				".simultaneity-position-slider-container"
			) as HTMLDivElement;

			expect(positionSliderContainer).toBeDefined();
			expect(positionSliderContainer?.style.display).toBe("none");
		});

		it("shows position slider when animation is paused", () => {
			const controller = createSimultaneityDiagram(container);

			// Find pause button
			const buttons = Array.from(document.querySelectorAll("button"));
			const pauseButton = buttons.find(btn => btn.textContent?.includes("Pause"));

			expect(pauseButton).toBeDefined();

			// Pause the animation
			pauseButton?.click();

			// Position slider should now be visible
			const positionSliderContainer = document.querySelector(
				".simultaneity-position-slider-container"
			) as HTMLDivElement;

			expect(positionSliderContainer).toBeDefined();
			expect(positionSliderContainer?.style.display).not.toBe("none");

			controller.destroy();
		});

		it("hides position slider when animation resumes after pause", () => {
			const controller = createSimultaneityDiagram(container);

			// Find play/pause button
			const buttons = Array.from(document.querySelectorAll("button"));
			const playPauseButton = buttons.find(btn => btn.textContent?.includes("Pause"));

			expect(playPauseButton).toBeDefined();

			// Pause the animation
			playPauseButton?.click();

			// Position slider should be visible
			const positionSliderContainer = document.querySelector(
				".simultaneity-position-slider-container"
			) as HTMLDivElement;
			expect(positionSliderContainer?.style.display).not.toBe("none");

			// Resume the animation
			playPauseButton?.click();

			// Position slider should be hidden again
			expect(positionSliderContainer?.style.display).toBe("none");

			controller.destroy();
		});

		it("updates now line position when slider is moved", () => {
			const controller = createSimultaneityDiagram(container);

			// Pause the animation first
			const buttons = Array.from(document.querySelectorAll("button"));
			const pauseButton = buttons.find(btn => btn.textContent?.includes("Pause"));
			pauseButton?.click();

			// Find position slider
			const positionSlider = document.getElementById("simPositionSlider") as HTMLInputElement;
			expect(positionSlider).toBeDefined();

			// Get initial now line position
			let nowLine = container.querySelector(".now-line-layer line") as SVGLineElement;
			expect(nowLine).toBeDefined();
			const initialY1 = nowLine.getAttribute("y1");

			// Move slider to different position
			positionSlider.value = "0.5";
			positionSlider.dispatchEvent(new Event("input", { bubbles: true }));

			// Query the DOM again to get the new line element (renderNowLine recreates it)
			nowLine = container.querySelector(".now-line-layer line") as SVGLineElement;
			const newY1 = nowLine.getAttribute("y1");
			expect(newY1).not.toBe(initialY1);

			controller.destroy();
		});
	});
});
