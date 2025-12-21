import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Decimal from "decimal.js";
import { select } from "d3-selection";
import {
	formatCoordinate,
	calculateGamma,
	lorentzTransform,
	debounce,
	createScaleSet,
	calculateLightConeAtOrigin,
	createSliderTouchState,
	attachSliderTouchHandlers,
} from "./minkowski-core";

describe("Minkowski Core Utilities", () => {
	describe("formatCoordinate", () => {
		it("formats positive numbers", () => {
			const result = formatCoordinate(new Decimal("1.234"));
			expect(result).toMatch(/1\.2/); // Using formatSignificant with 2 sig figs
		});

		it("formats negative numbers", () => {
			const result = formatCoordinate(new Decimal("-1.234"));
			expect(result).toMatch(/-1\.2/);
		});

		it("formats zero", () => {
			const result = formatCoordinate(new Decimal("0"));
			expect(result).toBe("0");
		});

		it("formats very small numbers", () => {
			const result = formatCoordinate(new Decimal("0.0001"));
			// formatSignificant handles small values
			expect(result).toMatch(/0\.0001|1\.0e-4/i);
		});

		it("formats very large numbers", () => {
			const result = formatCoordinate(new Decimal("100000"));
			// formatSignificant uses comma formatting for large values
			expect(result).toMatch(/100,000|1\.0e\+5/i);
		});
	});

	describe("calculateGamma", () => {
		it("returns 1 for zero velocity", () => {
			expect(calculateGamma(0)).toBe(1);
		});

		it("returns correct gamma for 0.6c", () => {
			// gamma = 1/sqrt(1-0.36) = 1/sqrt(0.64) = 1/0.8 = 1.25
			expect(calculateGamma(0.6)).toBeCloseTo(1.25, 10);
		});

		it("returns correct gamma for 0.8c", () => {
			// gamma = 1/sqrt(1-0.64) = 1/sqrt(0.36) = 1/0.6 = 1.666...
			expect(calculateGamma(0.8)).toBeCloseTo(1.666666667, 5);
		});

		it("returns large gamma for high velocity", () => {
			expect(calculateGamma(0.99)).toBeGreaterThan(7);
		});

		it("returns very large gamma for velocity near c", () => {
			expect(calculateGamma(0.999)).toBeGreaterThan(22);
		});
	});

	describe("lorentzTransform", () => {
		it("returns identity for zero velocity", () => {
			const result = lorentzTransform(5, 3, 0);
			expect(result.ctPrime).toBeCloseTo(5, 10);
			expect(result.xPrime).toBeCloseTo(3, 10);
		});

		it("preserves spacetime interval", () => {
			const ct = 5,
				x = 3,
				beta = 0.5;
			// Spacetime interval: s^2 = (ct)^2 - x^2
			const originalInterval = ct * ct - x * x;

			const result = lorentzTransform(ct, x, beta);
			const transformedInterval = result.ctPrime * result.ctPrime - result.xPrime * result.xPrime;

			expect(transformedInterval).toBeCloseTo(originalInterval, 10);
		});

		it("light-like events remain light-like", () => {
			// Event on light cone: ct = x
			const result = lorentzTransform(1, 1, 0.5);
			// Should still be on light cone: ct' = x'
			expect(Math.abs(result.ctPrime)).toBeCloseTo(Math.abs(result.xPrime), 10);
		});

		it("transforms correctly at 0.6c", () => {
			const ct = 5,
				x = 3,
				beta = 0.6;
			const gamma = calculateGamma(beta);

			// Manual calculation
			const expectedCtPrime = gamma * (ct - beta * x);
			const expectedXPrime = gamma * (x - beta * ct);

			const result = lorentzTransform(ct, x, beta);
			expect(result.ctPrime).toBeCloseTo(expectedCtPrime, 10);
			expect(result.xPrime).toBeCloseTo(expectedXPrime, 10);
		});

		it("handles negative coordinates", () => {
			const result = lorentzTransform(-5, -3, 0.4);
			expect(result.ctPrime).toBeLessThan(0);
			expect(result.xPrime).toBeLessThan(0);
		});
	});

	describe("createScaleSet", () => {
		it("returns scale functions and maxCoord", () => {
			const scales = createScaleSet(10, 900);
			expect(scales).toHaveProperty("xScale");
			expect(scales).toHaveProperty("yScale");
			expect(scales).toHaveProperty("maxCoord");
			expect(scales.maxCoord).toBe(10);
		});

		it("xScale maps 0 to center", () => {
			const scales = createScaleSet(10, 900);
			expect(scales.xScale(0)).toBe(450); // Center at size/2
		});

		it("yScale maps 0 to center", () => {
			const scales = createScaleSet(10, 900);
			expect(scales.yScale(0)).toBe(450);
		});

		it("xScale increases for positive x", () => {
			const scales = createScaleSet(10, 900);
			expect(scales.xScale(5)).toBeGreaterThan(scales.xScale(0));
			expect(scales.xScale(-5)).toBeLessThan(scales.xScale(0));
		});

		it("yScale decreases for positive ct (inverted y-axis)", () => {
			const scales = createScaleSet(10, 900);
			// In spacetime diagrams, positive ct goes up, but SVG y increases downward
			expect(scales.yScale(5)).toBeLessThan(scales.yScale(0));
			expect(scales.yScale(-5)).toBeGreaterThan(scales.yScale(0));
		});

		it("scales maxCoord to edge", () => {
			const scales = createScaleSet(10, 900);
			expect(scales.xScale(10)).toBe(900); // Right edge
			expect(scales.xScale(-10)).toBe(0); // Left edge
			expect(scales.yScale(10)).toBe(0); // Top edge (inverted)
			expect(scales.yScale(-10)).toBe(900); // Bottom edge (inverted)
		});
	});

	describe("debounce", () => {
		it("delays function execution", async () => {
			let callCount = 0;
			const fn = debounce(() => {
				callCount++;
			}, 100);

			fn();
			fn();
			fn();

			expect(callCount).toBe(0);

			await new Promise(resolve => setTimeout(resolve, 150));
			expect(callCount).toBe(1);
		});

		it("cancels previous timeouts", async () => {
			let callCount = 0;
			const fn = debounce(() => {
				callCount++;
			}, 50);

			fn();
			await new Promise(resolve => setTimeout(resolve, 25));
			fn();
			await new Promise(resolve => setTimeout(resolve, 25));
			fn();

			// Still within debounce window
			expect(callCount).toBe(0);

			await new Promise(resolve => setTimeout(resolve, 60));
			expect(callCount).toBe(1); // Only called once
		});

		it("passes arguments correctly", async () => {
			let receivedArgs: any[] = [];
			const fn = debounce((...args: any[]) => {
				receivedArgs = args;
			}, 50);

			fn("hello", 42, true);

			await new Promise(resolve => setTimeout(resolve, 60));
			expect(receivedArgs).toEqual(["hello", 42, true]);
		});
	});

	describe("calculateLightConeAtOrigin", () => {
		it("returns light cone boundaries at 45 degrees from origin", () => {
			const result = calculateLightConeAtOrigin(100, 10);
			// Light cone extends from (x, ct) following the equation ct = ±x
			// At current ct = 100, the cone should extend ±extent in x direction
			expect(result.futureCone.x1).toBe(-10);
			expect(result.futureCone.ct1).toBe(100 - 10);
			expect(result.futureCone.x2).toBe(10);
			expect(result.futureCone.ct2).toBe(100 + 10);

			expect(result.pastCone.x1).toBe(-10);
			expect(result.pastCone.ct1).toBe(100 + 10);
			expect(result.pastCone.x2).toBe(10);
			expect(result.pastCone.ct2).toBe(100 - 10);
		});

		it("handles zero current time", () => {
			const result = calculateLightConeAtOrigin(0, 10);
			expect(result.futureCone.x1).toBe(-10);
			expect(result.futureCone.ct1).toBe(-10);
			expect(result.futureCone.x2).toBe(10);
			expect(result.futureCone.ct2).toBe(10);
		});

		it("handles negative current time", () => {
			const result = calculateLightConeAtOrigin(-50, 10);
			expect(result.futureCone.x1).toBe(-10);
			expect(result.futureCone.ct1).toBe(-50 - 10);
			expect(result.futureCone.x2).toBe(10);
			expect(result.futureCone.ct2).toBe(-50 + 10);
		});
	});

	describe("Touch Event Handling", () => {
		describe("createSliderTouchState", () => {
			it("creates state with isActive false", () => {
				const state = createSliderTouchState();
				expect(state.isActive).toBe(false);
			});

			it("initializes start coordinates to zero", () => {
				const state = createSliderTouchState();
				expect(state.startX).toBe(0);
				expect(state.startY).toBe(0);
			});

			it("creates independent state objects", () => {
				const state1 = createSliderTouchState();
				const state2 = createSliderTouchState();
				state1.isActive = true;
				expect(state2.isActive).toBe(false);
			});
		});

		describe("attachSliderTouchHandlers", () => {
			let container: HTMLDivElement;
			let slider: HTMLInputElement;
			let consoleErrorSpy: any;
			let consoleWarnSpy: any;
			let consoleDebugSpy: any;

			// Helper to create mock Touch object
			const createTouch = (x: number, y: number): Touch => ({
				clientX: x,
				clientY: y,
				identifier: 0,
				pageX: x,
				pageY: y,
				screenX: x,
				screenY: y,
				radiusX: 0,
				radiusY: 0,
				rotationAngle: 0,
				force: 1,
				target: slider,
			});

			// Helper to create mock TouchEvent
			const createTouchEvent = (
				type: string,
				touches: Touch[],
				options: { cancelable?: boolean; bubbles?: boolean } = {}
			): TouchEvent => {
				const event = new Event(type, {
					cancelable: options.cancelable ?? true,
					bubbles: options.bubbles ?? true,
				}) as any;
				event.touches = touches;
				event.changedTouches = touches;
				event.targetTouches = touches;
				return event as TouchEvent;
			};

			beforeEach(() => {
				// Create DOM elements
				container = document.createElement("div");
				slider = document.createElement("input");
				slider.type = "range";
				container.appendChild(slider);
				document.body.appendChild(container);

				// Spy on console methods
				consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
				consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
				consoleDebugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
			});

			afterEach(() => {
				document.body.removeChild(container);
				consoleErrorSpy.mockRestore();
				consoleWarnSpy.mockRestore();
				consoleDebugSpy.mockRestore();
			});

			describe("Gesture Direction Detection", () => {
				it("prevents default for horizontal swipe (slider interaction)", () => {
					const state = createSliderTouchState();
					const selection = select(slider);
					attachSliderTouchHandlers(selection, state);

					// Touchstart at origin
					const touchStart = createTouchEvent("touchstart", [createTouch(100, 100)]);
					slider.dispatchEvent(touchStart);
					expect(state.isActive).toBe(true);

					// Touchmove horizontally (deltaX=50, deltaY=5)
					const touchMove = createTouchEvent("touchmove", [createTouch(150, 105)]);
					const preventDefaultSpy = vi.spyOn(touchMove, "preventDefault");
					slider.dispatchEvent(touchMove);

					expect(preventDefaultSpy).toHaveBeenCalled();
					expect(state.isActive).toBe(true);
				});

				it("allows vertical swipe to scroll (no preventDefault)", () => {
					const state = createSliderTouchState();
					const selection = select(slider);
					attachSliderTouchHandlers(selection, state);

					// Touchstart at origin
					const touchStart = createTouchEvent("touchstart", [createTouch(100, 100)]);
					slider.dispatchEvent(touchStart);
					expect(state.isActive).toBe(true);

					// Touchmove vertically (deltaX=5, deltaY=50)
					const touchMove = createTouchEvent("touchmove", [createTouch(105, 150)]);
					const preventDefaultSpy = vi.spyOn(touchMove, "preventDefault");
					slider.dispatchEvent(touchMove);

					expect(preventDefaultSpy).not.toHaveBeenCalled();
					expect(state.isActive).toBe(false); // Deactivated for scroll
				});

				it("waits for movement above threshold before deciding", () => {
					const state = createSliderTouchState();
					const selection = select(slider);
					attachSliderTouchHandlers(selection, state);

					// Touchstart
					const touchStart = createTouchEvent("touchstart", [createTouch(100, 100)]);
					slider.dispatchEvent(touchStart);

					// Small movement below threshold (9px)
					const touchMove1 = createTouchEvent("touchmove", [createTouch(109, 100)]);
					const preventDefaultSpy1 = vi.spyOn(touchMove1, "preventDefault");
					slider.dispatchEvent(touchMove1);

					// Should not decide yet
					expect(preventDefaultSpy1).not.toHaveBeenCalled();
					expect(state.isActive).toBe(true);
				});

				it("detects horizontal gesture at threshold boundary (11px)", () => {
					const state = createSliderTouchState();
					const selection = select(slider);
					attachSliderTouchHandlers(selection, state);

					const touchStart = createTouchEvent("touchstart", [createTouch(100, 100)]);
					slider.dispatchEvent(touchStart);

					// Movement just above threshold (11px horizontal, 0px vertical)
					const touchMove = createTouchEvent("touchmove", [createTouch(111, 100)]);
					const preventDefaultSpy = vi.spyOn(touchMove, "preventDefault");
					slider.dispatchEvent(touchMove);

					expect(preventDefaultSpy).toHaveBeenCalled();
				});

				it("detects vertical gesture at threshold boundary (11px)", () => {
					const state = createSliderTouchState();
					const selection = select(slider);
					attachSliderTouchHandlers(selection, state);

					const touchStart = createTouchEvent("touchstart", [createTouch(100, 100)]);
					slider.dispatchEvent(touchStart);

					// Movement just above threshold (0px horizontal, 11px vertical)
					const touchMove = createTouchEvent("touchmove", [createTouch(100, 111)]);
					const preventDefaultSpy = vi.spyOn(touchMove, "preventDefault");
					slider.dispatchEvent(touchMove);

					expect(preventDefaultSpy).not.toHaveBeenCalled();
					expect(state.isActive).toBe(false);
				});

				it("handles diagonal movement (uses dominant axis)", () => {
					const state = createSliderTouchState();
					const selection = select(slider);
					attachSliderTouchHandlers(selection, state);

					const touchStart = createTouchEvent("touchstart", [createTouch(100, 100)]);
					slider.dispatchEvent(touchStart);

					// Diagonal: 30px horizontal, 20px vertical (horizontal dominant)
					const touchMove = createTouchEvent("touchmove", [createTouch(130, 120)]);
					const preventDefaultSpy = vi.spyOn(touchMove, "preventDefault");
					slider.dispatchEvent(touchMove);

					expect(preventDefaultSpy).toHaveBeenCalled();
					expect(state.isActive).toBe(true);
				});
			});

			describe("Null Safety", () => {
				it("handles null touches on touchstart with error logging", () => {
					const state = createSliderTouchState();
					const selection = select(slider);
					attachSliderTouchHandlers(selection, state);

					// Create event with null touches
					const touchStart = createTouchEvent("touchstart", []);
					(touchStart as any).touches = null;
					slider.dispatchEvent(touchStart);

					expect(consoleErrorSpy).toHaveBeenCalledWith(
						expect.stringContaining("[Touch Error] TouchEvent.touches missing")
					);
					expect(state.isActive).toBe(false);
				});

				it("handles empty touches array on touchstart", () => {
					const state = createSliderTouchState();
					const selection = select(slider);
					attachSliderTouchHandlers(selection, state);

					const touchStart = createTouchEvent("touchstart", []);
					slider.dispatchEvent(touchStart);

					expect(consoleErrorSpy).toHaveBeenCalled();
					expect(state.isActive).toBe(false);
				});

				it("handles null touches on touchmove with warning", () => {
					const state = createSliderTouchState();
					const selection = select(slider);
					attachSliderTouchHandlers(selection, state);

					// Start touch normally
					const touchStart = createTouchEvent("touchstart", [createTouch(100, 100)]);
					slider.dispatchEvent(touchStart);
					expect(state.isActive).toBe(true);

					// Touch lost during gesture
					const touchMove = createTouchEvent("touchmove", []);
					(touchMove as any).touches = null;
					slider.dispatchEvent(touchMove);

					expect(consoleWarnSpy).toHaveBeenCalledWith(
						expect.stringContaining("[Touch Warning] Touch data lost")
					);
					expect(state.isActive).toBe(false);
				});

				it("ignores touchmove when slider is inactive", () => {
					const state = createSliderTouchState();
					const selection = select(slider);
					attachSliderTouchHandlers(selection, state);

					// Touchmove without touchstart
					const touchMove = createTouchEvent("touchmove", [createTouch(100, 100)]);
					const preventDefaultSpy = vi.spyOn(touchMove, "preventDefault");
					slider.dispatchEvent(touchMove);

					expect(preventDefaultSpy).not.toHaveBeenCalled();
					expect(consoleWarnSpy).not.toHaveBeenCalled();
				});
			});

			describe("State Management Through Touch Lifecycle", () => {
				it("activates on touchstart", () => {
					const state = createSliderTouchState();
					const selection = select(slider);
					attachSliderTouchHandlers(selection, state);

					expect(state.isActive).toBe(false);

					const touchStart = createTouchEvent("touchstart", [createTouch(100, 100)]);
					slider.dispatchEvent(touchStart);

					expect(state.isActive).toBe(true);
				});

				it("captures start coordinates on touchstart", () => {
					const state = createSliderTouchState();
					const selection = select(slider);
					attachSliderTouchHandlers(selection, state);

					const touchStart = createTouchEvent("touchstart", [createTouch(150, 250)]);
					slider.dispatchEvent(touchStart);

					expect(state.startX).toBe(150);
					expect(state.startY).toBe(250);
				});

				it("deactivates on touchend", () => {
					const state = createSliderTouchState();
					const selection = select(slider);
					attachSliderTouchHandlers(selection, state);

					const touchStart = createTouchEvent("touchstart", [createTouch(100, 100)]);
					slider.dispatchEvent(touchStart);
					expect(state.isActive).toBe(true);

					const touchEnd = createTouchEvent("touchend", []);
					slider.dispatchEvent(touchEnd);
					expect(state.isActive).toBe(false);
				});

				it("deactivates on touchcancel with debug logging", () => {
					const state = createSliderTouchState();
					const selection = select(slider);
					attachSliderTouchHandlers(selection, state);

					const touchStart = createTouchEvent("touchstart", [createTouch(100, 100)]);
					slider.dispatchEvent(touchStart);
					expect(state.isActive).toBe(true);

					const touchCancel = createTouchEvent("touchcancel", []);
					slider.dispatchEvent(touchCancel);

					expect(state.isActive).toBe(false);
					expect(consoleDebugSpy).toHaveBeenCalledWith(
						expect.stringContaining("[Touch Debug] Slider gesture cancelled by system")
					);
				});

				it("handles rapid touch start/end cycles", () => {
					const state = createSliderTouchState();
					const selection = select(slider);
					attachSliderTouchHandlers(selection, state);

					// Multiple quick touches
					for (let i = 0; i < 5; i++) {
						const touchStart = createTouchEvent("touchstart", [createTouch(100, 100)]);
						slider.dispatchEvent(touchStart);
						expect(state.isActive).toBe(true);

						const touchEnd = createTouchEvent("touchend", []);
						slider.dispatchEvent(touchEnd);
						expect(state.isActive).toBe(false);
					}
				});

				it("maintains independent state across multiple sliders", () => {
					const state1 = createSliderTouchState();
					const state2 = createSliderTouchState();

					const slider2 = document.createElement("input");
					slider2.type = "range";
					container.appendChild(slider2);

					attachSliderTouchHandlers(select(slider), state1);
					attachSliderTouchHandlers(select(slider2), state2);

					// Activate first slider
					const touchStart1 = createTouchEvent("touchstart", [createTouch(100, 100)]);
					slider.dispatchEvent(touchStart1);

					expect(state1.isActive).toBe(true);
					expect(state2.isActive).toBe(false);

					// Activate second slider
					const touchStart2 = createTouchEvent("touchstart", [createTouch(200, 200)]);
					slider2.dispatchEvent(touchStart2);

					expect(state1.isActive).toBe(true);
					expect(state2.isActive).toBe(true);
				});
			});

			describe("CSS Properties", () => {
				it("sets touch-action: none on slider", () => {
					const state = createSliderTouchState();
					const selection = select(slider);
					attachSliderTouchHandlers(selection, state);

					expect(slider.style.touchAction).toBe("none");
				});
			});

			describe("Method Chaining", () => {
				it("returns selection for method chaining", () => {
					const state = createSliderTouchState();
					const selection = select(slider);
					const result = attachSliderTouchHandlers(selection, state);

					expect(result).toBe(selection);
				});

				it("allows chaining with other D3 methods", () => {
					const state = createSliderTouchState();
					let inputFired = false;

					select(slider)
						.call(sel => attachSliderTouchHandlers(sel, state))
						.on("input", () => {
							inputFired = true;
						});

					const inputEvent = new Event("input");
					slider.dispatchEvent(inputEvent);

					expect(inputFired).toBe(true);
				});
			});
		});
	});
});
