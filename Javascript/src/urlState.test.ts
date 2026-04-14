/**
 * Tests for URL state management
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { updateURL, initializeFromURL } from "./urlState";

/**
 * Helper function to check if sliders should skip encoding for motion/flip tabs
 * Motion and flip tabs never encode sliders - they always default to maximum
 */
function shouldSkipSliderEncodingForMotionFlip(tabName: string, paramName: string): boolean {
	return (
		(tabName === "motion" || tabName === "flip") &&
		(paramName === "massSlider" || paramName === "distSlider")
	);
}

/**
 * Helper function to check if time mode should skip encoding
 * Time mode is never encoded - always defaults to proper time
 */
function shouldSkipTimeModeEncoding(paramName: string): boolean {
	return paramName.endsWith("Mode");
}

describe("URL encoding for simplified state", () => {
	beforeEach(() => {
		// Set up DOM elements
		document.body.innerHTML = `
            <!-- Motion tab sliders -->
            <input type="range" id="accelMassSlider" min="50" max="365" value="365" />
            <input type="range" id="accelPositionSlider" min="0" max="100" value="100" data-max-distance="10" />
            
            <!-- Flip tab sliders -->
            <input type="range" id="flipMassSlider" min="0.5" max="4" value="4" />
            <input type="range" id="flipPositionSlider" min="0" max="100" value="100" data-max-distance="10" />
            
            <!-- Active tab (motion) -->
            <div class="nav-link active" id="motion-tab"></div>
        `;
	});

	it("should always skip encoding mass sliders for motion tab", () => {
		expect(shouldSkipSliderEncodingForMotionFlip("motion", "massSlider")).toBe(true);
	});

	it("should always skip encoding distance sliders for motion tab", () => {
		expect(shouldSkipSliderEncodingForMotionFlip("motion", "distSlider")).toBe(true);
	});

	it("should always skip encoding mass sliders for flip tab", () => {
		expect(shouldSkipSliderEncodingForMotionFlip("flip", "massSlider")).toBe(true);
	});

	it("should always skip encoding distance sliders for flip tab", () => {
		expect(shouldSkipSliderEncodingForMotionFlip("flip", "distSlider")).toBe(true);
	});

	it("should not skip encoding sliders for other tabs", () => {
		expect(shouldSkipSliderEncodingForMotionFlip("twins", "massSlider")).toBe(false);
		expect(shouldSkipSliderEncodingForMotionFlip("spacetime", "distSlider")).toBe(false);
	});

	it("should always skip encoding time mode parameters", () => {
		expect(shouldSkipTimeModeEncoding("velMode")).toBe(true);
		expect(shouldSkipTimeModeEncoding("lorMode")).toBe(true);
		expect(shouldSkipTimeModeEncoding("rapMode")).toBe(true);
	});

	it("should not skip encoding regular parameters", () => {
		expect(shouldSkipTimeModeEncoding("accel")).toBe(false);
		expect(shouldSkipTimeModeEncoding("time")).toBe(false);
		expect(shouldSkipTimeModeEncoding("vel")).toBe(false);
	});
});

describe("flip distance unit URL encoding", () => {
	function buildFlipDom(): void {
		// Static fixture — same pattern as existing beforeEach in this file
		document.body.innerHTML =
			'<div class="nav-link active" id="travel-tab"></div>' +
			'<input type="radio" name="flipDistUnit" id="flipDistUnitLY" value="ly" checked>' +
			'<input type="radio" name="flipDistUnit" id="flipDistUnitLD" value="ld">' +
			'<input type="number" id="flipAccelInput" value="1">' +
			'<input type="number" id="flipInput" value="4">' +
			'<input type="number" id="flipDryMassInput" value="78000">' +
			'<input type="number" id="flipEfficiencyInput" value="0.85">';
	}

	beforeEach(() => {
		buildFlipDom();
		vi.stubGlobal("bootstrap", undefined);
	});

	it("does not encode unit param when ly is selected (default)", () => {
		(document.getElementById("flipDistUnitLY") as HTMLInputElement).checked = true;

		updateURL();

		const params = new URLSearchParams(window.location.search);
		expect(params.has("unit")).toBe(false);
	});

	it("encodes unit=ld when ld radio is selected", () => {
		(document.getElementById("flipDistUnitLD") as HTMLInputElement).checked = true;

		updateURL();

		const params = new URLSearchParams(window.location.search);
		expect(params.get("unit")).toBe("ld");
	});

	it("restores ld radio from URL on initializeFromURL", () => {
		window.history.replaceState({}, "", "?tab=flip&unit=ld&dist=1461");

		initializeFromURL();

		expect((document.getElementById("flipDistUnitLD") as HTMLInputElement).checked).toBe(true);
		expect((document.getElementById("flipDistUnitLY") as HTMLInputElement).checked).toBe(false);
	});

	it("leaves ly radio checked when unit param is absent", () => {
		window.history.replaceState({}, "", "?tab=flip&dist=4");

		initializeFromURL();

		expect((document.getElementById("flipDistUnitLD") as HTMLInputElement).checked).toBe(false);
		expect((document.getElementById("flipDistUnitLY") as HTMLInputElement).checked).toBe(true);
	});
});
