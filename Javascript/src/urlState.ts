/**
 * URL State Management for Special Relativity Calculator
 * Handles bidirectional synchronization between URL parameters and calculator inputs
 */

import * as simultaneityState from "./charts/simultaneityState";
import * as rl from "./relativity_lib";
import Decimal from "decimal.js";
import { distanceToSlider } from "./ui/eventHandlers";

// Store pending slider values to apply after chart initialization
// Note: No longer populated for motion/flip tabs, but kept for backward compatibility
let pendingSliderValues: Record<string, number> = {};

// Parameter mapping: clean URL param name -> HTML input element ID
type ParamMap = Record<string, string>;

interface TabConfig {
	name: string;
	params: ParamMap;
	buttonId: string;
	tabId: string; // Bootstrap tab button ID
}

// Tab configurations mapping URL params to input IDs
const TAB_CONFIGS: Record<string, TabConfig> = {
	motion: {
		name: "motion",
		params: {
			accel: "aAccelInput",
			time: "aInput",
			dry: "aDryMassInput",
			eff: "aEfficiencyInput",
		},
		buttonId: "aButton",
		tabId: "motion-tab",
	},
	flip: {
		name: "flip",
		params: {
			accel: "flipAccelInput",
			dist: "flipInput",
			dry: "flipDryMassInput",
			eff: "flipEfficiencyInput",
		},
		buttonId: "flipButton",
		tabId: "travel-tab",
	},
	twins: {
		name: "twins",
		params: {
			vel: "twinsVelocityInput",
			time: "twinsTimeInput",
		},
		buttonId: "twinsButton",
		tabId: "twins-tab",
	},
	spacetime: {
		name: "spacetime",
		params: {
			time: "spacetimeTime2",
			dist: "spacetimeX2",
			vel: "spacetimeVelocity",
		},
		buttonId: "spacetimeButton",
		tabId: "spacetime-tab",
	},
	simultaneity: {
		name: "simultaneity",
		params: {
			vel: "simVelocityInput",
		},
		buttonId: "", // No button, input-driven
		tabId: "simultaneity-tab",
	},
	calc: {
		name: "calc",
		params: {
			// Handled separately - multiple calculators
			calc: "calcType", // Which calculator to use
			vel: "lorentzInput", // Generic param names
			vel1: "v1Input",
			vel2: "v2Input",
			rapidity: "rapidityInput",
			fuel: "pionFuelMassInput",
			dry: "pionDryMassInput",
			eff: "pionEfficiencyInput",
			thrustTime: "fuelFractionTimeInput",
			thrustEff: "fuelFractionEffInput",
			warpDist: "warpDistanceInput",
			warpBoost: "warpBoostInput",
			warpTransit: "warpTransitInput",
			warpDuration: "warpBoostDurationInput",
		},
		buttonId: "", // Determined by calc type
		tabId: "conversions-tab",
	},
};

// Calc sub-calculator mappings
const CALC_CONFIGS: Record<string, { params: string[]; buttonId: string }> = {
	lorentz: { params: ["vel"], buttonId: "lorentzButton" },
	rapidity: { params: ["rapidity"], buttonId: "rapidityButton" },
	velocity: { params: ["vel"], buttonId: "velocityButton" },
	addvel: { params: ["vel1", "vel2"], buttonId: "addButton" },
	pion: { params: ["fuel", "dry", "eff"], buttonId: "pionAccelButton" },
	fuelfrac: { params: ["thrustTime", "thrustEff"], buttonId: "fuelFractionButton" },
	warp: {
		params: ["warpDist", "warpBoost", "warpTransit", "warpDuration"],
		buttonId: "warpButton",
	},
};

/**
 * Get the default value for an input element from its HTML value attribute
 */
function getDefaultValue(inputId: string): string {
	const input = document.getElementById(inputId) as HTMLInputElement;
	return input?.defaultValue || input?.value || "";
}

/**
 * Validate a numeric input value using Decimal.js for precision
 */
function isValidNumber(value: string): boolean {
	if (!value || value.trim() === "") return false;
	try {
		const decimal = new Decimal(value);
		return decimal.isFinite();
	} catch {
		return false;
	}
}

/**
 * Get the currently active tab name
 */
function getActiveTab(): string {
	const activeTab = document.querySelector(".nav-link.active");
	if (!activeTab) return "motion";

	const tabId = activeTab.getAttribute("id");
	if (tabId === "motion-tab") return "motion";
	if (tabId === "travel-tab") return "flip";
	if (tabId === "twins-tab") return "twins";
	if (tabId === "spacetime-tab") return "spacetime";
	if (tabId === "simultaneity-tab") return "simultaneity";
	if (tabId === "conversions-tab") return "calc";

	return "motion";
}

/**
 * Initialize page state from URL parameters on page load
 */
export function initializeFromURL(): void {
	const urlParams = new URLSearchParams(window.location.search);

	// Get tab parameter
	const tabParam = urlParams.get("tab")?.toLowerCase();
	if (!tabParam || !TAB_CONFIGS[tabParam]) {
		// No valid tab in URL, use default behavior
		return;
	}

	const tabConfig = TAB_CONFIGS[tabParam];

	// Activate the specified tab
	const tabButton = document.getElementById(tabConfig.tabId);
	if (tabButton) {
		const tab = new (window as any).bootstrap.Tab(tabButton);
		tab.show();
	}

	// Handle calc tab separately due to multiple calculators
	if (tabParam === "calc") {
		initializeCalcFromURL(urlParams);
		return;
	}

	// Handle simultaneity tab separately due to events
	if (tabParam === "simultaneity") {
		initializeSimultaneityFromURL(urlParams, tabConfig);
		return;
	}

	// Populate input fields from URL params
	let hasValidParams = false;
	for (const [paramName, inputId] of Object.entries(tabConfig.params)) {
		const paramValue = urlParams.get(paramName);

		// Skip chart time mode parameters - always default to proper time
		if (inputId.startsWith("__")) {
			continue;
		}

		// Skip slider parameters for motion and flip tabs - always default to maximum
		if (
			(tabParam === "motion" || tabParam === "flip") &&
			(paramName === "massSlider" || paramName === "distSlider")
		) {
			continue;
		}

		if (paramValue && isValidNumber(paramValue)) {
			const input = document.getElementById(inputId) as HTMLInputElement;
			if (input) {
				input.value = paramValue;
				hasValidParams = true;
			}
		}
	}

	// Trigger calculation if we had valid parameters
	if (hasValidParams && tabConfig.buttonId) {
		// Wait for tab transition and rendering to complete
		setTimeout(() => {
			const calcButton = document.getElementById(tabConfig.buttonId);
			if (calcButton) {
				calcButton.click();
			}
		}, 300);
	}
}

/**
 * Initialize calc tab from URL parameters
 */
function initializeCalcFromURL(urlParams: URLSearchParams): void {
	const tabConfig = TAB_CONFIGS.calc;

	// Try to infer which calculator based on params present
	let calcType = urlParams.get("calc")?.toLowerCase();

	if (!calcType) {
		// Infer calculator from parameters
		if (urlParams.has("vel1") && urlParams.has("vel2")) {
			calcType = "addvel";
		} else if (urlParams.has("rapidity")) {
			calcType = "rapidity";
		} else if (urlParams.has("fuel") || urlParams.has("dry")) {
			calcType = "pion";
		} else if (urlParams.has("thrustTime")) {
			calcType = "fuelfrac";
		} else if (urlParams.has("vel")) {
			// Default to lorentz for single velocity parameter
			calcType = "lorentz";
		}
	}

	if (!calcType || !CALC_CONFIGS[calcType]) return;

	const calcConfig = CALC_CONFIGS[calcType];

	// Populate inputs for this calculator
	let hasValidParams = false;
	for (const paramName of calcConfig.params) {
		const paramValue = urlParams.get(paramName);
		const inputId = tabConfig.params[paramName];

		if (paramValue && inputId && isValidNumber(paramValue)) {
			const input = document.getElementById(inputId) as HTMLInputElement;
			if (input) {
				input.value = paramValue;
				hasValidParams = true;
			}
		}
	}

	// Trigger calculation
	if (hasValidParams) {
		setTimeout(() => {
			const calcButton = document.getElementById(calcConfig.buttonId);
			if (calcButton) {
				calcButton.click();
			}
		}, 300);
	}
}

/**
 * Initialize simultaneity tab from URL parameters
 */
function initializeSimultaneityFromURL(urlParams: URLSearchParams, tabConfig: TabConfig): void {
	// Populate velocity input
	for (const [paramName, inputId] of Object.entries(tabConfig.params)) {
		const paramValue = urlParams.get(paramName);
		if (paramValue && isValidNumber(paramValue)) {
			const input = document.getElementById(inputId) as HTMLInputElement;
			if (input) {
				input.value = paramValue;
			}
		}
	}

	// Parse events from URL
	const eventsParam = urlParams.get("events");
	if (eventsParam) {
		try {
			// Decode events from: ct1,x1;ct2,x2;...
			const eventPairs = eventsParam.split(";");
			const events = eventPairs
				.map(pair => {
					const [ctStr, xStr] = pair.split(",");
					const ctDecimal = rl.ensure(ctStr);
					const xDecimal = rl.ensure(xStr);
					return {
						ct: ctDecimal.toNumber(),
						x: xDecimal.toNumber(),
						ctDecimal,
						xDecimal,
					};
				})
				.filter(e => e.ctDecimal.isFinite() && e.xDecimal.isFinite());

			if (events.length > 0) {
				// Store events in state module for controller to pick up
				simultaneityState.setPendingEvents(events);
			}
		} catch (e) {
			console.error("Failed to parse simultaneity events from URL:", e);
		}
	}
}

/**
 * Update URL to reflect current application state
 */
export function updateURL(): void {
	const activeTab = getActiveTab();
	const tabConfig = TAB_CONFIGS[activeTab];
	if (!tabConfig) return;

	const params = new URLSearchParams();
	params.set("tab", activeTab);

	// Handle calc tab separately
	if (activeTab === "calc") {
		updateCalcURL(params);
	} else if (activeTab === "simultaneity") {
		updateSimultaneityURL(params, tabConfig);
	} else {
		// Add non-default parameters
		for (const [paramName, inputId] of Object.entries(tabConfig.params)) {
			// Skip chart time mode parameters - always default to proper time
			if (inputId.startsWith("__")) {
				continue;
			}

			// Skip slider parameters for motion and flip tabs - always default to maximum
			if (
				(activeTab === "motion" || activeTab === "flip") &&
				(paramName === "massSlider" || paramName === "distSlider")
			) {
				continue;
			}

			const input = document.getElementById(inputId) as HTMLInputElement;
			if (!input) continue;

			const currentValue = input.value;
			const defaultValue = getDefaultValue(inputId);

			// Only include if different from default and valid
			if (currentValue !== defaultValue && isValidNumber(currentValue)) {
				params.set(paramName, currentValue);
			}
		}
	}

	// Update URL without page reload
	const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
	window.history.replaceState({}, "", newUrl);
}

/**
 * Update URL for calc tab (needs to track which calculator is active)
 */
function updateCalcURL(params: URLSearchParams): void {
	const tabConfig = TAB_CONFIGS.calc;

	// Infer which calculator is active by checking which params have non-default values
	let activeCalcType: string | null = null;

	// Check each calculator's parameters
	for (const [calcType, calcConfig] of Object.entries(CALC_CONFIGS)) {
		let hasNonDefault = false;

		for (const paramName of calcConfig.params) {
			const inputId = tabConfig.params[paramName];
			if (!inputId) continue;

			const input = document.getElementById(inputId) as HTMLInputElement;
			if (!input) continue;

			const currentValue = input.value;
			const defaultValue = getDefaultValue(inputId);

			if (currentValue !== defaultValue && isValidNumber(currentValue)) {
				hasNonDefault = true;
				break;
			}
		}

		if (hasNonDefault) {
			activeCalcType = calcType;
			break; // Use first calculator with non-default values
		}
	}

	// If we found an active calculator, only include its parameters
	if (activeCalcType && CALC_CONFIGS[activeCalcType]) {
		params.set("calc", activeCalcType);
		const calcConfig = CALC_CONFIGS[activeCalcType];

		for (const paramName of calcConfig.params) {
			const inputId = tabConfig.params[paramName];
			if (!inputId) continue;

			const input = document.getElementById(inputId) as HTMLInputElement;
			if (!input) continue;

			const currentValue = input.value;
			const defaultValue = getDefaultValue(inputId);

			if (currentValue !== defaultValue && isValidNumber(currentValue)) {
				params.set(paramName, currentValue);
			}
		}
	}
}

/**
 * Update URL for simultaneity tab (needs to encode events)
 */
function updateSimultaneityURL(params: URLSearchParams, tabConfig: TabConfig): void {
	// Add velocity parameter
	for (const [paramName, inputId] of Object.entries(tabConfig.params)) {
		const input = document.getElementById(inputId) as HTMLInputElement;
		if (!input) continue;

		const currentValue = input.value;
		const defaultValue = getDefaultValue(inputId);

		if (currentValue !== defaultValue && isValidNumber(currentValue)) {
			params.set(paramName, currentValue);
		}
	}

	// Encode events from the diagram
	// Access events via state module
	const events = simultaneityState.getEvents();
	if (events && events.length > 0) {
		// Check if events match the default train example (don't encode defaults)
		const isDefaultTrainExample =
			events.length === 2 &&
			Math.abs(events[0].ct - 599584.92) < 1 &&
			Math.abs(events[0].x - -300000) < 1 &&
			Math.abs(events[1].ct - 599584.92) < 1 &&
			Math.abs(events[1].x - 300000) < 1;

		if (!isDefaultTrainExample) {
			// Encode events as: ct1,x1;ct2,x2;...
			// Use toString() to preserve full precision instead of toFixed
			const encoded = events.map((e: any) => `${e.ct},${e.x}`).join(";");
			params.set("events", encoded);
		}
	}
}

/**
 * Apply pending slider values that were loaded from URL
 * Called after chart initialization to restore slider state
 */
export function applyPendingSliderValue(
	sliderId: string,
	valueDisplayId: string,
	unit: "days" | "years",
	chartId: string,
	chartRegistry: { current: Map<string, any> }
): void {
	const pendingValue = pendingSliderValues[sliderId];
	if (pendingValue !== undefined) {
		const slider = document.getElementById(sliderId) as HTMLInputElement;
		const valueDisplay = document.getElementById(valueDisplayId);

		if (slider) {
			// Only apply if value is within current slider range
			const min = parseFloat(slider.min || "0");
			const max = parseFloat(slider.max || String(Number.MAX_SAFE_INTEGER));
			if (!isNaN(min) && !isNaN(max) && pendingValue >= min && pendingValue <= max) {
				slider.value = pendingValue.toString();
				if (valueDisplay) {
					valueDisplay.textContent = `${pendingValue.toFixed(unit === "days" ? 0 : 1)} ${unit}`;
				}

				// Update the chart's x-axis max
				try {
					const chart = chartRegistry.current.get(chartId);
					if (chart && chart.options.scales?.x) {
						chart.options.scales.x.max = pendingValue;
						chart.update("none"); // Update without animation
					}
				} catch (error) {
					console.error(`Failed to update chart ${chartId} with slider value:`, error);
				}
			}
		}

		// Clear the pending value
		delete pendingSliderValues[sliderId];
	}
}

/**
 * Apply pending distance slider values for position/velocity charts
 * Called after chart initialization to restore slider state
 */
export function applyPendingDistanceSliderValue(
	sliderId: string,
	valueDisplayId: string,
	chartId: string,
	chartRegistry: { current: Map<string, any> }
): void {
	const pendingDistance = pendingSliderValues[sliderId];
	if (pendingDistance !== undefined) {
		const slider = document.getElementById(sliderId) as HTMLInputElement;
		const valueDisplay = document.getElementById(valueDisplayId);

		if (slider) {
			// Get max distance from data attribute (set by initializePositionVelocitySlider)
			const maxDistance = parseFloat(slider.dataset.maxDistance || "100");

			// Only apply if distance is within range
			if (pendingDistance >= 0 && pendingDistance <= maxDistance) {
				// Convert actual distance to slider percentage
				const sliderPercent = distanceToSlider(pendingDistance, maxDistance);
				slider.value = sliderPercent.toString();

				// Update display with appropriate precision
				const displayValue =
					pendingDistance < 10 ? pendingDistance.toFixed(2) : pendingDistance.toFixed(1);
				if (valueDisplay) {
					valueDisplay.textContent = `${displayValue} ly`;
				}

				// Update the chart's x-axis max
				try {
					const chart = chartRegistry.current.get(chartId);
					if (chart && chart.options.scales?.x) {
						// Ensure minimum chart range to prevent negative x-axis values
						chart.options.scales.x.max = Math.max(0.01, pendingDistance);
						chart.options.scales.x.min = 0; // Ensure axis starts at 0
						chart.update("none"); // Update without animation
					}
				} catch (error) {
					console.error(`Failed to update chart ${chartId} with slider value:`, error);
				}
			}
		}

		// Clear the pending value
		delete pendingSliderValues[sliderId];
	}
}

/**
 * Set up bidirectional URL synchronization
 * Returns a cleanup function to remove all event listeners
 */
export function setupURLSync(): () => void {
	let debounceTimer: number | undefined;

	// Store handlers for cleanup
	const handlers = new Map<Element, Map<string, EventListener>>();

	const addHandler = (element: Element, event: string, handler: EventListener) => {
		element.addEventListener(event, handler);
		if (!handlers.has(element)) {
			handlers.set(element, new Map());
		}
		handlers.get(element)!.set(event, handler);
	};

	// Update URL when inputs change (debounced to allow slider initialization)
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
			// Delay to allow chart calculations and slider initialization to complete
			debounceTimer = window.setTimeout(() => {
				updateURL();
			}, 150);
		};
		addHandler(input, "change", changeHandler);
	});

	// Update URL when tab changes
	const tabButtons = document.querySelectorAll('[data-bs-toggle="tab"]');
	tabButtons.forEach(button => {
		const tabHandler = () => {
			updateURL();
		};
		addHandler(button, "shown.bs.tab", tabHandler);
	});

	// Update URL when calculate buttons are clicked
	const calcButtons = document.querySelectorAll(".btn-calculate");
	calcButtons.forEach(button => {
		const clickHandler = () => {
			// Delay must be longer than slider initialization (100ms in main.ts)
			// to ensure data-chart-max is set before URL encoding check
			setTimeout(() => {
				updateURL();
			}, 200);
		};
		addHandler(button, "click", clickHandler);
	});

	// Return cleanup function
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
