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

		it("hides position slider when reset is called after pausing", () => {
			const controller = createSimultaneityDiagram(container);

			// Pause the animation first
			const buttons = Array.from(document.querySelectorAll("button"));
			const pauseButton = buttons.find(btn => btn.textContent?.includes("Pause"));
			pauseButton?.click();

			// Position slider should be visible
			const positionSliderContainer = document.querySelector(
				".simultaneity-position-slider-container"
			) as HTMLDivElement;
			expect(positionSliderContainer?.style.display).not.toBe("none");

			// Reset the diagram
			controller.reset();

			// Position slider should be hidden again
			expect(positionSliderContainer?.style.display).toBe("none");

			controller.destroy();
		});
	});

	describe("Light Cone Coverage at High Velocities", () => {
		it("light cone extends far enough at high velocities (0.7c)", () => {
			const controller = createSimultaneityDiagram(container);

			// Enable light cone
			const buttons = Array.from(document.querySelectorAll("button"));
			const lightConeButton = buttons.find(btn => btn.textContent?.includes("Light cone"));
			lightConeButton?.click();

			// Set high velocity (0.7c)
			const velocitySlider = document.getElementById("simVelocitySlider") as HTMLInputElement;
			expect(velocitySlider).toBeDefined();
			velocitySlider.value = "0.7";
			velocitySlider.dispatchEvent(new Event("input", { bubbles: true }));

			// Pause animation to get stable light cone position
			const pauseButton = buttons.find(btn => btn.textContent?.includes("Pause"));
			pauseButton?.click();

			// Find light cone polygons
			const lightConeLayer = container.querySelector(".light-cone-layer") as SVGGElement;
			const polygons = lightConeLayer.querySelectorAll("polygon.cone-fill");

			// At least one polygon should exist (future or past cone)
			expect(polygons.length).toBeGreaterThan(0);

			// Get SVG dimensions from container
			const svg = container.querySelector("svg") as SVGSVGElement;
			const svgRect = svg.getBoundingClientRect();

			// Check that at least one polygon has points that extend across the diagram
			// At high velocities, the light cone should be visible and extend significantly
			let hasExtendedCone = false;
			polygons.forEach(polygon => {
				const points = polygon.getAttribute("points");
				if (points) {
					// Parse points and check if they span a significant portion of the diagram
					const coords = points
						.trim()
						.split(/\s+/)
						.map(pair => pair.split(",").map(Number));
					const xCoords = coords.map(c => c[0]);
					const yCoords = coords.map(c => c[1]);
					const xRange = Math.max(...xCoords) - Math.min(...xCoords);
					const yRange = Math.max(...yCoords) - Math.min(...yCoords);

					// Light cone should span at least 50% of the diagram width
					if (xRange > svgRect.width * 0.5 && yRange > svgRect.height * 0.5) {
						hasExtendedCone = true;
					}
				}
			});

			expect(hasExtendedCone).toBe(true);

			controller.destroy();
		});

		it("light cone extends far enough at very high velocities (0.9c)", () => {
			const controller = createSimultaneityDiagram(container);

			// Enable light cone
			const buttons = Array.from(document.querySelectorAll("button"));
			const lightConeButton = buttons.find(btn => btn.textContent?.includes("Light cone"));
			lightConeButton?.click();

			// Set very high velocity (0.9c)
			const velocitySlider = document.getElementById("simVelocitySlider") as HTMLInputElement;
			expect(velocitySlider).toBeDefined();
			velocitySlider.value = "0.9";
			velocitySlider.dispatchEvent(new Event("input", { bubbles: true }));

			// Pause animation
			const pauseButton = buttons.find(btn => btn.textContent?.includes("Pause"));
			pauseButton?.click();

			// Find light cone polygons
			const lightConeLayer = container.querySelector(".light-cone-layer") as SVGGElement;
			const polygons = lightConeLayer.querySelectorAll("polygon.cone-fill");

			expect(polygons.length).toBeGreaterThan(0);

			// Verify light cone extends significantly
			let hasExtendedCone = false;
			polygons.forEach(polygon => {
				const points = polygon.getAttribute("points");
				if (points) {
					const coords = points
						.trim()
						.split(/\s+/)
						.map(pair => pair.split(",").map(Number));
					const xCoords = coords.map(c => c[0]);
					const yCoords = coords.map(c => c[1]);
					const xRange = Math.max(...xCoords) - Math.min(...xCoords);
					const yRange = Math.max(...yCoords) - Math.min(...yCoords);

					// At 0.9c, cone should span most of the diagram
					const svg = container.querySelector("svg") as SVGSVGElement;
					const svgRect = svg.getBoundingClientRect();
					if (xRange > svgRect.width * 0.6 && yRange > svgRect.height * 0.6) {
						hasExtendedCone = true;
					}
				}
			});

			expect(hasExtendedCone).toBe(true);

			controller.destroy();
		});
	});
});
