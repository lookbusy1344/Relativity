import * as simultaneityState from "../charts/simultaneityState";
import type { SimultaneityEventData } from "../charts/simultaneityState";
import { getActiveTab, getDefaultValue, isValidNumber } from "./defaults";
import { CALC_CONFIGS, TAB_CONFIGS } from "./config";

function updateCalcURL(params: URLSearchParams): void {
	const tabConfig = TAB_CONFIGS.calc;
	let activeCalcType: string | null = null;

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
			break;
		}
	}

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

function updateSimultaneityURL(params: URLSearchParams): void {
	const tabConfig = TAB_CONFIGS.simultaneity;

	for (const [paramName, inputId] of Object.entries(tabConfig.params)) {
		const input = document.getElementById(inputId) as HTMLInputElement;
		if (!input) continue;

		const currentValue = input.value;
		const defaultValue = getDefaultValue(inputId);

		if (currentValue !== defaultValue && isValidNumber(currentValue)) {
			params.set(paramName, currentValue);
		}
	}

	const events = simultaneityState.getEvents();
	if (events && events.length > 0) {
		const isDefaultTrainExample =
			events.length === 2 &&
			Math.abs(events[0].ct - 599584.92) < 1 &&
			Math.abs(events[0].x - -300000) < 1 &&
			Math.abs(events[1].ct - 599584.92) < 1 &&
			Math.abs(events[1].x - 300000) < 1;

		if (!isDefaultTrainExample) {
			const encoded = events.map((e: SimultaneityEventData) => `${e.ct},${e.x}`).join(";");
			params.set("events", encoded);
		}
	}
}

export function updateURL(): void {
	const activeTab = getActiveTab();
	const tabConfig = TAB_CONFIGS[activeTab];
	if (!tabConfig) return;

	const params = new URLSearchParams();
	params.set("tab", activeTab);

	if (activeTab === "calc") {
		updateCalcURL(params);
	} else if (activeTab === "simultaneity") {
		updateSimultaneityURL(params);
	} else {
		for (const [paramName, inputId] of Object.entries(tabConfig.params)) {
			if (inputId.startsWith("__")) continue;
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
			if (currentValue !== defaultValue && isValidNumber(currentValue)) {
				params.set(paramName, currentValue);
			}
		}

		if (activeTab === "flip") {
			const ldRadio = document.getElementById("flipDistUnitLD") as HTMLInputElement | null;
			if (ldRadio?.checked) {
				params.set("unit", "ld");
			}
		}
	}

	const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
	window.history.replaceState({}, "", newUrl);
}
