import { describe, it, expect, beforeEach, vi } from "vitest";
import {
	createLorentzHandler,
	createRapidityFromVelocityHandler,
	createVelocityFromRapidityHandler,
	createAddVelocitiesHandler,
	createPionAccelTimeHandler,
	createPionFuelFractionHandler,
	createFlipBurnHandler,
	createTwinParadoxHandler,
	createPositionVelocitySliderHandler,
	initializePositionVelocitySlider,
	sliderToDistance,
	distanceToSlider,
} from "./eventHandlers";
import { clearBody } from "../test-utils/dom-helpers";

describe("Event Handler Factories", () => {
	beforeEach(() => {
		clearBody();
	});

	describe("createLorentzHandler", () => {
		it("creates a function", () => {
			const getInput = vi.fn(() => null);
			const getResult = vi.fn(() => null);
			const handler = createLorentzHandler(getInput, getResult);
			expect(typeof handler).toBe("function");
		});

		it("returns early if input is missing", () => {
			const getInput = vi.fn(() => null);
			const getResult = vi.fn(() => document.createElement("span"));
			const handler = createLorentzHandler(getInput, getResult);

			handler();

			expect(getInput).toHaveBeenCalled();
			expect(getResult).toHaveBeenCalled();
		});

		it("returns early if result is missing", () => {
			const input = document.createElement("input");
			const getInput = vi.fn(() => input);
			const getResult = vi.fn(() => null);
			const handler = createLorentzHandler(getInput, getResult);

			handler();

			expect(getInput).toHaveBeenCalled();
			expect(getResult).toHaveBeenCalled();
		});

		it("calculates gamma factor for valid velocity", () => {
			const input = document.createElement("input");
			input.value = "180000000"; // 0.6c in m/s
			const result = document.createElement("span");
			document.body.appendChild(result);

			const getInput = vi.fn(() => input);
			const getResult = vi.fn(() => result);
			const handler = createLorentzHandler(getInput, getResult);

			handler();

			// gamma at 0.6c = 1 / sqrt(1 - 0.36) = 1 / sqrt(0.64) = 1.25
			expect(result.textContent).toContain("1.25");
		});

		it("handles zero velocity", () => {
			const input = document.createElement("input");
			input.value = "0";
			const result = document.createElement("span");
			document.body.appendChild(result);

			const getInput = vi.fn(() => input);
			const getResult = vi.fn(() => result);
			const handler = createLorentzHandler(getInput, getResult);

			handler();

			// gamma at 0c = 1
			expect(result.textContent).toBe("1");
		});
	});

	describe("createRapidityFromVelocityHandler", () => {
		it("creates a function", () => {
			const getInput = vi.fn(() => null);
			const getResult = vi.fn(() => null);
			const handler = createRapidityFromVelocityHandler(getInput, getResult);
			expect(typeof handler).toBe("function");
		});

		it("calculates rapidity for valid velocity", () => {
			const input = document.createElement("input");
			input.value = "149896229"; // 0.5c in m/s
			const result = document.createElement("span");
			document.body.appendChild(result);

			const getInput = vi.fn(() => input);
			const getResult = vi.fn(() => result);
			const handler = createRapidityFromVelocityHandler(getInput, getResult);

			handler();

			// rapidity = atanh(0.5) ≈ 0.549
			expect(result.textContent).toMatch(/0\.54/);
		});

		it("handles zero velocity", () => {
			const input = document.createElement("input");
			input.value = "0";
			const result = document.createElement("span");
			document.body.appendChild(result);

			const getInput = vi.fn(() => input);
			const getResult = vi.fn(() => result);
			const handler = createRapidityFromVelocityHandler(getInput, getResult);

			handler();

			// rapidity at 0c = 0
			expect(result.textContent).toBe("0");
		});
	});

	describe("createVelocityFromRapidityHandler", () => {
		it("creates a function", () => {
			const getInput = vi.fn(() => null);
			const getResult = vi.fn(() => null);
			const handler = createVelocityFromRapidityHandler(getInput, getResult);
			expect(typeof handler).toBe("function");
		});

		it("calculates velocity for valid rapidity", () => {
			const input = document.createElement("input");
			input.value = "0.549"; // rapidity for v=0.5c
			const result = document.createElement("span");
			document.body.appendChild(result);

			const getInput = vi.fn(() => input);
			const getResult = vi.fn(() => result);
			const handler = createVelocityFromRapidityHandler(getInput, getResult);

			handler();

			// Should have units m/s
			expect(result.textContent).toContain("m/s");
			// velocity = tanh(0.549) ≈ 0.5c ≈ 149,896,229 m/s
			expect(result.textContent).toMatch(/149,\d{3},\d{3}/);
		});
	});

	describe("createAddVelocitiesHandler", () => {
		it("creates a function", () => {
			const getV1 = vi.fn(() => null);
			const getV2 = vi.fn(() => null);
			const getResult = vi.fn(() => null);
			const handler = createAddVelocitiesHandler(getV1, getV2, getResult);
			expect(typeof handler).toBe("function");
		});

		it("returns early if any input is missing", () => {
			const v1Input = document.createElement("input");
			const getV1 = vi.fn(() => v1Input);
			const getV2 = vi.fn(() => null);
			const getResult = vi.fn(() => document.createElement("span"));
			const handler = createAddVelocitiesHandler(getV1, getV2, getResult);

			handler();

			expect(getV1).toHaveBeenCalled();
			expect(getV2).toHaveBeenCalled();
			expect(getResult).toHaveBeenCalled();
		});

		it("adds velocities relativistically", () => {
			const v1Input = document.createElement("input");
			v1Input.value = "0.5";
			const v2Input = document.createElement("input");
			v2Input.value = "0.5";
			const result = document.createElement("span");
			document.body.appendChild(result);

			const getV1 = vi.fn(() => v1Input);
			const getV2 = vi.fn(() => v2Input);
			const getResult = vi.fn(() => result);
			const handler = createAddVelocitiesHandler(getV1, getV2, getResult);

			handler();

			// Relativistic addition: (0.5c + 0.5c) / (1 + 0.5*0.5) = 1c / 1.25 = 0.8c
			expect(result.textContent).toContain("0.8");
			expect(result.textContent).toContain("c");
		});
	});

	describe("createPionAccelTimeHandler", () => {
		it("creates a function", () => {
			const getFuelMass = vi.fn(() => null);
			const getDryMass = vi.fn(() => null);
			const getEfficiency = vi.fn(() => null);
			const getResult = vi.fn(() => null);
			const handler = createPionAccelTimeHandler(getFuelMass, getDryMass, getEfficiency, getResult);
			expect(typeof handler).toBe("function");
		});

		it("calculates acceleration time for valid inputs", () => {
			const fuelMassInput = document.createElement("input");
			fuelMassInput.value = "1000";
			const dryMassInput = document.createElement("input");
			dryMassInput.value = "500";
			const efficiencyInput = document.createElement("input");
			efficiencyInput.value = "0.85";
			const result = document.createElement("span");
			document.body.appendChild(result);

			const getFuelMass = vi.fn(() => fuelMassInput);
			const getDryMass = vi.fn(() => dryMassInput);
			const getEfficiency = vi.fn(() => efficiencyInput);
			const getResult = vi.fn(() => result);
			const handler = createPionAccelTimeHandler(getFuelMass, getDryMass, getEfficiency, getResult);

			handler();

			// Should return a result with units "days"
			expect(result.textContent).toContain("days");
			// Should be a positive number
			expect(result.textContent).toMatch(/\d+/);
		});

		it("handles invalid efficiency", () => {
			const fuelMassInput = document.createElement("input");
			fuelMassInput.value = "1000";
			const dryMassInput = document.createElement("input");
			dryMassInput.value = "500";
			const efficiencyInput = document.createElement("input");
			efficiencyInput.value = "1.5"; // Invalid: > 1.0
			const result = document.createElement("span");
			document.body.appendChild(result);

			const getFuelMass = vi.fn(() => fuelMassInput);
			const getDryMass = vi.fn(() => dryMassInput);
			const getEfficiency = vi.fn(() => efficiencyInput);
			const getResult = vi.fn(() => result);
			const handler = createPionAccelTimeHandler(getFuelMass, getDryMass, getEfficiency, getResult);

			handler();

			// Should show error message
			expect(result.textContent).toContain("Efficiency must be between");
		});
	});

	describe("createPionFuelFractionHandler", () => {
		it("creates a function", () => {
			const getAccel = vi.fn(() => null);
			const getThrustTime = vi.fn(() => null);
			const getEfficiency = vi.fn(() => null);
			const getDryMass = vi.fn(() => null);
			const getResultFraction = vi.fn(() => null);
			const getResultMass = vi.fn(() => null);
			const handler = createPionFuelFractionHandler(
				getAccel,
				getThrustTime,
				getEfficiency,
				getDryMass,
				getResultFraction,
				getResultMass
			);
			expect(typeof handler).toBe("function");
		});

		it("calculates fuel fraction for valid inputs", () => {
			const accelInput = document.createElement("input");
			accelInput.value = "1";
			const thrustTimeInput = document.createElement("input");
			thrustTimeInput.value = "365";
			const efficiencyInput = document.createElement("input");
			efficiencyInput.value = "0.85";
			const dryMassInput = document.createElement("input");
			dryMassInput.value = "1000";
			const resultFraction = document.createElement("span");
			const resultMass = document.createElement("span");
			document.body.appendChild(resultFraction);
			document.body.appendChild(resultMass);

			const getAccel = vi.fn(() => accelInput);
			const getThrustTime = vi.fn(() => thrustTimeInput);
			const getEfficiency = vi.fn(() => efficiencyInput);
			const getDryMass = vi.fn(() => dryMassInput);
			const getResultFraction = vi.fn(() => resultFraction);
			const getResultMass = vi.fn(() => resultMass);
			const handler = createPionFuelFractionHandler(
				getAccel,
				getThrustTime,
				getEfficiency,
				getDryMass,
				getResultFraction,
				getResultMass
			);

			handler();

			// Should return fuel fraction with % units
			expect(resultFraction.textContent).toContain("%");
			// Should return fuel mass (some unit)
			expect(resultMass.textContent).toMatch(/\d+/);
		});

		it("handles invalid acceleration", () => {
			const accelInput = document.createElement("input");
			accelInput.value = "150"; // Invalid: > 100
			const thrustTimeInput = document.createElement("input");
			thrustTimeInput.value = "365";
			const efficiencyInput = document.createElement("input");
			efficiencyInput.value = "0.85";
			const dryMassInput = document.createElement("input");
			dryMassInput.value = "1000";
			const resultFraction = document.createElement("span");
			const resultMass = document.createElement("span");
			document.body.appendChild(resultFraction);
			document.body.appendChild(resultMass);

			const getAccel = vi.fn(() => accelInput);
			const getThrustTime = vi.fn(() => thrustTimeInput);
			const getEfficiency = vi.fn(() => efficiencyInput);
			const getDryMass = vi.fn(() => dryMassInput);
			const getResultFraction = vi.fn(() => resultFraction);
			const getResultMass = vi.fn(() => resultMass);
			const handler = createPionFuelFractionHandler(
				getAccel,
				getThrustTime,
				getEfficiency,
				getDryMass,
				getResultFraction,
				getResultMass
			);

			handler();

			// Should show error message
			expect(resultFraction.textContent).toContain("Acceleration must be between");
			expect(resultMass.textContent).toBe("-");
		});
	});

	describe("createFlipBurnHandler", () => {
		it("formats star count without double tilde for large values", async () => {
			// Setup DOM elements
			const accelInput = document.createElement("input");
			accelInput.value = "1"; // 1g
			const distanceInput = document.createElement("input");
			distanceInput.value = "30000"; // 30000 light years
			const dryMassInput = document.createElement("input");
			dryMassInput.value = "78000";
			const efficiencyInput = document.createElement("input");
			efficiencyInput.value = "0.85";

			const resultFlipStars = document.createElement("span");
			const resultFlipGalaxyFraction = document.createElement("span");

			document.body.appendChild(resultFlipStars);
			document.body.appendChild(resultFlipGalaxyFraction);

			const getAccel = vi.fn(() => accelInput);
			const getDistance = vi.fn(() => distanceInput);
			const getDryMass = vi.fn(() => dryMassInput);
			const getEfficiency = vi.fn(() => efficiencyInput);
			const getResults = vi.fn(() => [
				null,
				null,
				null,
				null,
				null,
				null,
				null,
				null,
				resultFlipStars,
				resultFlipGalaxyFraction,
			]);
			const chartRegistry = { current: new Map() };

			const handler = createFlipBurnHandler(
				getAccel,
				getDistance,
				getDryMass,
				getEfficiency,
				getResults,
				chartRegistry
			);

			// Execute handler
			handler();

			// Wait for async requestAnimationFrame to complete
			await new Promise(resolve => setTimeout(resolve, 10));

			// Verify star count doesn't have double tilde
			const starText = resultFlipStars.textContent;
			expect(starText).toBeTruthy();
			expect(starText).toMatch(/^~/); // Should start with single ~
			expect(starText).not.toMatch(/^~~/); // Should NOT start with ~~

			// Should be a formatted number like "~99,770,180,100"
			expect(starText).toMatch(/^~[\d,]+$/);
		});

		it("formats small star counts with tilde", async () => {
			const accelInput = document.createElement("input");
			accelInput.value = "1";
			const distanceInput = document.createElement("input");
			distanceInput.value = "10"; // Very close - should be < 1000 stars
			const dryMassInput = document.createElement("input");
			dryMassInput.value = "78000";
			const efficiencyInput = document.createElement("input");
			efficiencyInput.value = "0.85";

			const resultFlipStars = document.createElement("span");
			const resultFlipGalaxyFraction = document.createElement("span");

			document.body.appendChild(resultFlipStars);
			document.body.appendChild(resultFlipGalaxyFraction);

			const getAccel = vi.fn(() => accelInput);
			const getDistance = vi.fn(() => distanceInput);
			const getDryMass = vi.fn(() => dryMassInput);
			const getEfficiency = vi.fn(() => efficiencyInput);
			const getResults = vi.fn(() => [
				null,
				null,
				null,
				null,
				null,
				null,
				null,
				null,
				resultFlipStars,
				resultFlipGalaxyFraction,
			]);
			const chartRegistry = { current: new Map() };

			const handler = createFlipBurnHandler(
				getAccel,
				getDistance,
				getDryMass,
				getEfficiency,
				getResults,
				chartRegistry
			);

			handler();
			await new Promise(resolve => setTimeout(resolve, 10));

			const starText = resultFlipStars.textContent;
			expect(starText).toBeTruthy();
			// Small counts (< 1000) should also have tilde prefix
			expect(starText).toMatch(/^~\d+$/);
		});
	});

	describe("createTwinParadoxHandler", () => {
		it("accepts velocities up to but not reaching 1.0", async () => {
			// Setup DOM elements
			const velocityInput = document.createElement("input");
			velocityInput.value = "0.9999999999999"; // High precision velocity < 1.0
			const timeInput = document.createElement("input");
			timeInput.value = "4";

			const resultTwins1 = document.createElement("span");
			const resultTwins2 = document.createElement("span");
			const resultTwins3 = document.createElement("span");
			const resultTwins4 = document.createElement("span");
			const resultTwins5 = document.createElement("span");
			const resultTwins6 = document.createElement("span");
			const resultTwins7 = document.createElement("span");

			document.body.appendChild(resultTwins1);
			document.body.appendChild(resultTwins2);
			document.body.appendChild(resultTwins3);
			document.body.appendChild(resultTwins4);
			document.body.appendChild(resultTwins5);
			document.body.appendChild(resultTwins6);
			document.body.appendChild(resultTwins7);

			const getVelocity = vi.fn(() => velocityInput);
			const getTime = vi.fn(() => timeInput);
			const getResults = vi.fn(() => [
				resultTwins1,
				resultTwins2,
				resultTwins3,
				resultTwins4,
				resultTwins5,
				resultTwins6,
				resultTwins7,
			]);
			const chartRegistry = { current: new Map() };

			const handler = createTwinParadoxHandler(getVelocity, getTime, getResults, chartRegistry);

			// Execute handler
			handler();

			// Wait for async requestAnimationFrame to complete
			await new Promise(resolve => setTimeout(resolve, 10));

			// Verify the velocity was NOT clamped (should remain 0.9999999999999)
			expect(velocityInput.value).toBe("0.9999999999999");

			// Verify calculations completed (results should be populated, not "Working...")
			expect(resultTwins1.textContent).not.toBe("Working...");
			expect(resultTwins1.textContent).toMatch(/\d+/); // Should contain numbers
			expect(resultTwins1.textContent).toContain("yrs"); // Should have units
		});

		it("clamps velocities at exactly 1.0 to below 1.0", async () => {
			const velocityInput = document.createElement("input");
			velocityInput.value = "1.0"; // Exactly 1.0c
			const timeInput = document.createElement("input");
			timeInput.value = "4";

			const resultTwins1 = document.createElement("span");
			document.body.appendChild(resultTwins1);

			const getVelocity = vi.fn(() => velocityInput);
			const getTime = vi.fn(() => timeInput);
			const getResults = vi.fn(() => [resultTwins1, null, null, null, null, null, null, null]);
			const chartRegistry = { current: new Map() };

			const handler = createTwinParadoxHandler(getVelocity, getTime, getResults, chartRegistry);

			handler();
			await new Promise(resolve => setTimeout(resolve, 10));

			// Should be clamped to a value < 1.0
			const clampedValue = parseFloat(velocityInput.value);
			expect(clampedValue).toBeLessThan(1.0);
		});

		it("calculates and displays rapidity for given velocity", async () => {
			// Setup DOM elements
			const velocityInput = document.createElement("input");
			velocityInput.value = "0.8"; // 0.8c
			const timeInput = document.createElement("input");
			timeInput.value = "4";

			const resultTwins1 = document.createElement("span");
			const resultTwins2 = document.createElement("span");
			const resultTwins3 = document.createElement("span");
			const resultTwins4 = document.createElement("span");
			const resultTwins5 = document.createElement("span");
			const resultTwins6 = document.createElement("span");
			const resultTwins7 = document.createElement("span");
			const resultTwins8 = document.createElement("span"); // Rapidity result

			document.body.appendChild(resultTwins1);
			document.body.appendChild(resultTwins2);
			document.body.appendChild(resultTwins3);
			document.body.appendChild(resultTwins4);
			document.body.appendChild(resultTwins5);
			document.body.appendChild(resultTwins6);
			document.body.appendChild(resultTwins7);
			document.body.appendChild(resultTwins8);

			const getVelocity = vi.fn(() => velocityInput);
			const getTime = vi.fn(() => timeInput);
			const getResults = vi.fn(() => [
				resultTwins1,
				resultTwins2,
				resultTwins3,
				resultTwins4,
				resultTwins5,
				resultTwins6,
				resultTwins7,
				resultTwins8,
			]);
			const chartRegistry = { current: new Map() };

			const handler = createTwinParadoxHandler(getVelocity, getTime, getResults, chartRegistry);

			// Execute handler
			handler();

			// Wait for async requestAnimationFrame to complete
			await new Promise(resolve => setTimeout(resolve, 10));

			// Verify rapidity is calculated and displayed
			// For v = 0.8c, rapidity = atanh(0.8) ≈ 1.0986
			// With formatSignificant(r, "0", 2): skip zeros after decimal, take 2 digits = "1.098"
			expect(resultTwins8.textContent).toBeTruthy();
			expect(resultTwins8.textContent).toMatch(/1\.098/); // Should show "1.098"
		});
	});

	describe("createPositionVelocitySliderHandler", () => {
		it("creates a function", () => {
			const getSlider = vi.fn(() => null);
			const getValueDisplay = vi.fn(() => null);
			const chartRegistry = { current: new Map() };
			const handler = createPositionVelocitySliderHandler(
				"testChart",
				getSlider,
				getValueDisplay,
				chartRegistry
			);
			expect(typeof handler).toBe("function");
		});

		it("updates chart x-axis max using power scale", () => {
			// Create mock chart with x-axis scale
			const mockChart = {
				options: {
					scales: {
						x: {
							max: 10.0,
						},
					},
				},
				update: vi.fn(),
			};

			const slider = document.createElement("input");
			slider.type = "range";
			slider.dataset.maxDistance = "100"; // Max distance in light years
			slider.value = "50"; // 50% on the slider
			const valueDisplay = document.createElement("span");
			document.body.appendChild(valueDisplay);

			const getSlider = vi.fn(() => slider);
			const getValueDisplay = vi.fn(() => valueDisplay);
			const chartRegistry = { current: new Map([["testChart", mockChart as any]]) };

			const handler = createPositionVelocitySliderHandler(
				"testChart",
				getSlider,
				getValueDisplay,
				chartRegistry
			);

			handler();

			// 50% with adaptive power scale (maxDistance=100 → exponent≈2.5) = 100 * 0.5^2.5 ≈ 17.7 ly
			expect(mockChart.options.scales.x.max).toBeGreaterThan(15);
			expect(mockChart.options.scales.x.max).toBeLessThan(20);
			// Verify chart.update was called with 'none' for instant response
			expect(mockChart.update).toHaveBeenCalledWith("none");
			// Verify display value was updated (17.68 rounds to 17.7)
			expect(valueDisplay.textContent).toMatch(/17\.\d+ ly/);
		});

		it("handles slider at 100% (max distance)", () => {
			const mockChart = {
				options: {
					scales: {
						x: {
							max: 10.0,
						},
					},
				},
				update: vi.fn(),
			};

			const slider = document.createElement("input");
			slider.dataset.maxDistance = "6700"; // Max distance in light years
			slider.value = "100"; // 100% = max
			const valueDisplay = document.createElement("span");
			document.body.appendChild(valueDisplay);

			const getSlider = vi.fn(() => slider);
			const getValueDisplay = vi.fn(() => valueDisplay);
			const chartRegistry = { current: new Map([["testChart", mockChart as any]]) };

			const handler = createPositionVelocitySliderHandler(
				"testChart",
				getSlider,
				getValueDisplay,
				chartRegistry
			);

			handler();

			expect(mockChart.options.scales.x.max).toBe(6700);
			expect(valueDisplay.textContent).toBe("6700.0 ly");
		});

		it("returns early if slider is missing", () => {
			const mockChart = {
				options: {
					scales: {
						x: {
							max: 10.0,
						},
					},
				},
				update: vi.fn(),
			};

			const getSlider = vi.fn(() => null);
			const getValueDisplay = vi.fn(() => document.createElement("span"));
			const chartRegistry = { current: new Map([["testChart", mockChart as any]]) };

			const handler = createPositionVelocitySliderHandler(
				"testChart",
				getSlider,
				getValueDisplay,
				chartRegistry
			);

			handler();

			expect(mockChart.update).not.toHaveBeenCalled();
		});

		it("returns early if value display is missing", () => {
			const mockChart = {
				options: {
					scales: {
						x: {
							max: 10.0,
						},
					},
				},
				update: vi.fn(),
			};

			const slider = document.createElement("input");
			slider.value = "5.0";
			const getSlider = vi.fn(() => slider);
			const getValueDisplay = vi.fn(() => null);
			const chartRegistry = { current: new Map([["testChart", mockChart as any]]) };

			const handler = createPositionVelocitySliderHandler(
				"testChart",
				getSlider,
				getValueDisplay,
				chartRegistry
			);

			handler();

			expect(mockChart.update).not.toHaveBeenCalled();
		});
	});

	describe("initializePositionVelocitySlider", () => {
		it("uses percentage scale (0-100) for slider values", () => {
			// Create mock chart with max value of 4 ly
			const mockChart = {
				data: {
					datasets: [
						{
							data: [
								{ x: 0, y: 0 },
								{ x: 2, y: 0.5 },
								{ x: 4, y: 0.8 },
							],
						},
					],
				},
			};

			const chartRegistry = { current: new Map([["testChart", mockChart as any]]) };

			// Create slider and value display in DOM
			const slider = document.createElement("input");
			slider.id = "testSlider";
			slider.type = "range";
			document.body.appendChild(slider);

			const valueDisplay = document.createElement("span");
			valueDisplay.id = "testValue";
			document.body.appendChild(valueDisplay);

			// Call the function
			initializePositionVelocitySlider("testChart", "testSlider", "testValue", chartRegistry);

			// Slider uses percentage scale 0-100
			expect(slider.min).toBe("0");
			expect(slider.max).toBe("100");
			expect(slider.step).toBe("0.5"); // 0.5% steps
			expect(slider.value).toBe("100"); // Starts at max
			// Max distance stored in data attribute
			expect(slider.dataset.maxDistance).toBe("4");
			expect(valueDisplay.textContent).toBe("4.0 ly");
		});

		it("stores max distance in data attribute for power scale conversion", () => {
			// Create mock chart with max value of 100 ly
			const mockChart = {
				data: {
					datasets: [
						{
							data: [
								{ x: 0, y: 0 },
								{ x: 50, y: 0.5 },
								{ x: 100, y: 0.99 },
							],
						},
					],
				},
			};

			const chartRegistry = { current: new Map([["testChart", mockChart as any]]) };

			const slider = document.createElement("input");
			slider.id = "testSlider2";
			slider.type = "range";
			document.body.appendChild(slider);

			const valueDisplay = document.createElement("span");
			valueDisplay.id = "testValue2";
			document.body.appendChild(valueDisplay);

			initializePositionVelocitySlider("testChart", "testSlider2", "testValue2", chartRegistry);

			// Max distance stored in data attribute
			expect(slider.dataset.maxDistance).toBe("100");
			expect(slider.max).toBe("100"); // percentage max
		});

		it("handles very large values with power scale for fine control at start", () => {
			// Create mock chart with max value of 6700 ly
			const mockChart = {
				data: {
					datasets: [
						{
							data: [
								{ x: 0, y: 0 },
								{ x: 3350, y: 0.5 },
								{ x: 6700, y: 0.99 },
							],
						},
					],
				},
			};

			const chartRegistry = { current: new Map([["testChart", mockChart as any]]) };

			const slider = document.createElement("input");
			slider.id = "testSlider4";
			slider.type = "range";
			document.body.appendChild(slider);

			const valueDisplay = document.createElement("span");
			valueDisplay.id = "testValue4";
			document.body.appendChild(valueDisplay);

			initializePositionVelocitySlider("testChart", "testSlider4", "testValue4", chartRegistry);

			// Slider uses percentage scale, max distance in data attribute
			expect(slider.max).toBe("100");
			expect(slider.dataset.maxDistance).toBe("6700");
			expect(valueDisplay.textContent).toBe("6700.0 ly");
		});

		it("returns early if chart is missing", () => {
			const chartRegistry = { current: new Map() };

			const slider = document.createElement("input");
			slider.id = "testSlider5";
			document.body.appendChild(slider);

			const valueDisplay = document.createElement("span");
			valueDisplay.id = "testValue5";
			document.body.appendChild(valueDisplay);

			// Should not throw
			initializePositionVelocitySlider(
				"nonExistentChart",
				"testSlider5",
				"testValue5",
				chartRegistry
			);

			// Slider should remain unchanged
			expect(slider.step).toBe("");
		});
	});

	describe("sliderToDistance and distanceToSlider", () => {
		it("sliderToDistance and distanceToSlider are inverses for various max distances", () => {
			const testCases = [1, 10, 100, 1000, 6700]; // Range of max distances
			const testPercentages = [0, 10, 25, 50, 75, 100];

			for (const maxDistance of testCases) {
				for (const pct of testPercentages) {
					const distance = sliderToDistance(pct, maxDistance);
					const backToPercent = distanceToSlider(distance, maxDistance);
					expect(backToPercent).toBeCloseTo(pct, 5);
				}
			}
		});

		it("uses lower exponent for small max distances (more even distribution)", () => {
			// For small max distance (1 ly), exponent is 1.5
			// 50% should give more than 25% of range (which exponent 2 would give)
			const smallMax = 1;
			const distAt50Pct = sliderToDistance(50, smallMax);
			// With exponent 1.5: 1 * 0.5^1.5 ≈ 0.354
			expect(distAt50Pct).toBeGreaterThan(0.3);
			expect(distAt50Pct).toBeLessThan(0.4);
		});

		it("uses higher exponent for large max distances (fine control at start)", () => {
			// For large max distance (6700 ly), exponent is 3
			// 50% should give only 12.5% of range
			const largeMax = 6700;
			const distAt50Pct = sliderToDistance(50, largeMax);
			// With exponent 3: 6700 * 0.5^3 = 837.5
			expect(distAt50Pct).toBeGreaterThan(800);
			expect(distAt50Pct).toBeLessThan(900);
		});

		it("gives fine resolution at small distances for large ranges", () => {
			// For 6700 ly max (exponent 3), first few percent should map to small distances
			const maxDistance = 6700;

			// 1% should be much less than 67 ly (which linear would give)
			const distAt1Pct = sliderToDistance(1, maxDistance);
			expect(distAt1Pct).toBeLessThan(1); // Should be ~0.067 ly

			// 10% should be small
			const distAt10Pct = sliderToDistance(10, maxDistance);
			expect(distAt10Pct).toBeLessThan(10); // Should be ~6.7 ly
		});

		it("gives better distribution for small ranges", () => {
			// For 1 ly max (exponent 1.5), distribution should be more even
			const maxDistance = 1;

			// 10% should give meaningful portion of range
			const distAt10Pct = sliderToDistance(10, maxDistance);
			// With exponent 1.5: 1 * 0.1^1.5 ≈ 0.032
			expect(distAt10Pct).toBeGreaterThan(0.02);
			expect(distAt10Pct).toBeLessThan(0.05);
		});
	});
});
