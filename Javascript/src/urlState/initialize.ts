import * as simultaneityState from "../charts/simultaneityState";
import * as rl from "../relativity_lib";
import { CALC_CONFIGS, TAB_CONFIGS, type TabConfig } from "./config";
import { isValidNumber } from "./defaults";

function initializeCalcFromURL(urlParams: URLSearchParams): void {
	const tabConfig = TAB_CONFIGS.calc;

	let calcType = urlParams.get("calc")?.toLowerCase();

	if (!calcType) {
		if (urlParams.has("vel1") && urlParams.has("vel2")) {
			calcType = "addvel";
		} else if (urlParams.has("rapidity")) {
			calcType = "rapidity";
		} else if (urlParams.has("fuel") || urlParams.has("dry")) {
			calcType = "pion";
		} else if (urlParams.has("thrustTime")) {
			calcType = "fuelfrac";
		} else if (urlParams.has("vel")) {
			calcType = "lorentz";
		}
	}

	if (!calcType || !CALC_CONFIGS[calcType]) return;

	const calcConfig = CALC_CONFIGS[calcType];
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

	if (hasValidParams) {
		setTimeout(() => {
			const calcButton = document.getElementById(calcConfig.buttonId);
			if (calcButton) calcButton.click();
		}, 300);
	}
}

function initializeSimultaneityFromURL(urlParams: URLSearchParams, tabConfig: TabConfig): void {
	for (const [paramName, inputId] of Object.entries(tabConfig.params)) {
		const paramValue = urlParams.get(paramName);
		if (paramValue && isValidNumber(paramValue)) {
			const input = document.getElementById(inputId) as HTMLInputElement;
			if (input) {
				input.value = paramValue;
			}
		}
	}

	const eventsParam = urlParams.get("events");
	if (!eventsParam) return;

	try {
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
			simultaneityState.setPendingEvents(events);
		}
	} catch (error) {
		console.error("Failed to parse simultaneity events from URL:", error);
	}
}

export function initializeFromURL(): void {
	const urlParams = new URLSearchParams(window.location.search);
	const tabParam = urlParams.get("tab")?.toLowerCase();
	if (!tabParam || !TAB_CONFIGS[tabParam]) return;

	const tabConfig = TAB_CONFIGS[tabParam];
	const tabButton = document.getElementById(tabConfig.tabId);
	if (tabButton && window.bootstrap) {
		const tab = new window.bootstrap.Tab(tabButton);
		tab.show();
	}

	if (tabParam === "calc") {
		initializeCalcFromURL(urlParams);
		return;
	}

	if (tabParam === "simultaneity") {
		initializeSimultaneityFromURL(urlParams, tabConfig);
		return;
	}

	let hasValidParams = false;
	for (const [paramName, inputId] of Object.entries(tabConfig.params)) {
		const paramValue = urlParams.get(paramName);

		if (inputId.startsWith("__")) continue;
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

	if (tabParam === "flip") {
		const unitParam = urlParams.get("unit");
		const ldRadio = document.getElementById("flipDistUnitLD") as HTMLInputElement | null;
		const lyRadio = document.getElementById("flipDistUnitLY") as HTMLInputElement | null;
		if (unitParam === "ld" && ldRadio) {
			ldRadio.checked = true;
			if (lyRadio) lyRadio.checked = false;
			hasValidParams = true;
		}
	}

	if (hasValidParams && tabConfig.buttonId) {
		if (tabConfig.pendingResultId) {
			const pending = document.getElementById(tabConfig.pendingResultId);
			if (pending) pending.textContent = "Working...";
		}
		setTimeout(() => {
			const calcButton = document.getElementById(tabConfig.buttonId);
			if (calcButton) calcButton.click();
		}, 300);
	}
}
