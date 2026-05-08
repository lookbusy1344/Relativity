import * as rl from "../../relativity_lib";
import { setElement } from "../domUtils";
import {
	generateVisualizationChartData,
	generateTwinParadoxChartData,
} from "../../charts/dataGeneration";
import {
	updateVisualizationCharts,
	updateTwinParadoxCharts,
	type ChartRegistry,
} from "../../charts/charts";
import {
	drawTwinParadoxMinkowski,
	type TwinParadoxMinkowskiData,
} from "../../charts/minkowski-twins";

export function createTwinParadoxHandler(
	getVelocityInput: () => HTMLInputElement | null,
	getTimeInput: () => HTMLInputElement | null,
	getResults: () => (HTMLElement | null)[],
	chartRegistry: { current: ChartRegistry },
	onDiagramDrawn?: (
		container: HTMLElement,
		data: TwinParadoxMinkowskiData,
		controller: ReturnType<typeof drawTwinParadoxMinkowski> | null
	) => void
): (silent?: boolean) => void {
	let pendingRAF: number | null = null;
	let pendingCalculation: number | null = null;

	return (silent = false) => {
		const velocityInput = getVelocityInput();
		const timeInput = getTimeInput();
		const [
			resultTwins1,
			resultTwins2,
			resultTwins3,
			resultTwins4,
			resultTwins5,
			resultTwins6,
			resultTwins7,
			resultTwins8,
		] = getResults();
		if (!velocityInput || !timeInput) return;

		// Cancel pending calculation to prevent race condition
		if (pendingRAF !== null) {
			cancelAnimationFrame(pendingRAF);
			pendingRAF = null;
		}
		if (pendingCalculation !== null) {
			clearTimeout(pendingCalculation);
			pendingCalculation = null;
		}

		// Validate and clamp inputs immediately (before showing "Working...")
		let velocityCStr = velocityInput.value ?? "0.8";
		try {
			const velocityCDec = rl.ensure(velocityCStr);
			if (velocityCDec.lt(0.001)) {
				velocityCStr = "0.001";
				velocityInput.value = "0.001";
			} else if (velocityCDec.gte(1.0)) {
				velocityCStr = "0.999";
				velocityInput.value = "0.999";
			}
		} catch {
			velocityCStr = "0.8";
			velocityInput.value = "0.8";
		}

		let properTimeYearsStr = timeInput.value ?? "4";
		try {
			const properTimeYearsDec = rl.ensure(properTimeYearsStr);
			if (properTimeYearsDec.lt(0.01)) {
				properTimeYearsStr = "0.01";
				timeInput.value = "0.01";
			} else if (properTimeYearsDec.gt(1000)) {
				properTimeYearsStr = "1000";
				timeInput.value = "1000";
			}
		} catch {
			properTimeYearsStr = "4";
			timeInput.value = "4";
		}

		// Show working message (unless silent mode)
		if (!silent) {
			if (resultTwins1) resultTwins1.textContent = "Working...";
			if (resultTwins2) resultTwins2.textContent = "";
			if (resultTwins3) resultTwins3.textContent = "";
			if (resultTwins4) resultTwins4.textContent = "";
			if (resultTwins5) resultTwins5.textContent = "";
			if (resultTwins6) resultTwins6.textContent = "";
			if (resultTwins7) resultTwins7.textContent = "";
			if (resultTwins8) resultTwins8.textContent = "";
		}

		// Allow UI to update before heavy calculation (skip delay in silent mode)
		const execute = () => {
			// Use validated values from above

			// Convert UI inputs to SI units using string values to preserve precision
			// parseFloat loses precision for values like 0.99999999999999999 (becomes 1.0)
			const velocity = rl.c.mul(velocityCStr); // m/s
			const properTime = rl.ensure(properTimeYearsStr).mul(rl.secondsPerYear); // seconds

			// Call function with SI units
			const res = rl.twinParadox(velocity, properTime);

			// Convert results from SI units to display units
			const travelingAge = res.properTime.div(rl.secondsPerYear); // seconds to years
			const earthAge = res.earthTime.div(rl.secondsPerYear); // seconds to years
			const ageDiff = res.ageDifference.div(rl.secondsPerYear); // seconds to years
			const lorentz = res.lorentzFactor;
			const velocityMs = res.velocity; // Already in m/s
			const oneWayLy = res.oneWayDistance.div(rl.lightYear); // meters to light years
			const totalLy = res.totalDistance.div(rl.lightYear); // meters to light years

			if (resultTwins1) setElement(resultTwins1, rl.formatSignificant(travelingAge, "0", 2), "yrs");
			if (resultTwins2) setElement(resultTwins2, rl.formatSignificant(earthAge, "0", 2), "yrs");
			if (resultTwins3) setElement(resultTwins3, rl.formatSignificant(ageDiff, "0", 2), "yrs");
			if (resultTwins4) setElement(resultTwins4, rl.formatSignificant(lorentz, "0", 3), "");
			if (resultTwins5) setElement(resultTwins5, rl.formatSignificant(velocityMs, "9", 2), "m/s");
			if (resultTwins6) setElement(resultTwins6, rl.formatSignificant(oneWayLy, "0", 3), "ly");
			if (resultTwins7) setElement(resultTwins7, rl.formatSignificant(totalLy, "0", 3), "ly");

			// Calculate and display rapidity
			const rapidityValue = rl.rapidityFromVelocity(velocityMs);
			if (resultTwins8) setElement(resultTwins8, rl.formatSignificant(rapidityValue, "0", 2), "");

			// Update charts - parseFloat is OK here as Chart.js only needs limited precision for display
			const velocityCNum = parseFloat(velocityCStr);
			const properTimeYearsNum = parseFloat(properTimeYearsStr);
			const data = generateTwinParadoxChartData(velocityCNum, properTimeYearsNum);
			chartRegistry.current = updateTwinParadoxCharts(chartRegistry.current, data);

			// Draw Minkowski diagram
			const container = document.getElementById("twinsMinkowskiContainer");
			if (container && onDiagramDrawn) {
				const minkowskiData: TwinParadoxMinkowskiData = {
					velocityC: velocityCNum,
					properTimeYears: properTimeYearsNum,
					earthTimeYears: earthAge.toNumber(),
					distanceLY: oneWayLy.toNumber(),
					gamma: lorentz.toNumber(),
					// Decimal versions for display
					velocityCDecimal: rl.ensure(velocityCNum),
					properTimeYearsDecimal: rl.ensure(properTimeYearsNum),
					earthTimeYearsDecimal: earthAge,
					distanceLYDecimal: oneWayLy,
					gammaDecimal: lorentz,
				};

				onDiagramDrawn(container, minkowskiData, null);
			}

			pendingCalculation = null;
		};

		if (silent) {
			execute();
		} else {
			pendingRAF = requestAnimationFrame(() => {
				pendingRAF = null;
				pendingCalculation = window.setTimeout(execute, 0);
			});
		}
	};
}

export function createGraphUpdateHandler(
	getAccelInput: () => HTMLInputElement | null,
	getDurationInput: () => HTMLInputElement | null,
	getStatus: () => HTMLElement | null,
	chartRegistry: { current: ChartRegistry }
): () => void {
	let pendingRAF: number | null = null;
	let pendingCalculation: number | null = null;

	return () => {
		const accelInput = getAccelInput();
		const durationInput = getDurationInput();
		const status = getStatus();
		if (!accelInput || !durationInput) return;

		// Cancel pending calculation to prevent race condition
		if (pendingRAF !== null) {
			cancelAnimationFrame(pendingRAF);
			pendingRAF = null;
		}
		if (pendingCalculation !== null) {
			clearTimeout(pendingCalculation);
			pendingCalculation = null;
		}

		// Show working message
		if (status) status.textContent = "Working...";

		// Allow UI to update before heavy calculation
		pendingRAF = requestAnimationFrame(() => {
			pendingRAF = null;
			pendingCalculation = window.setTimeout(() => {
				// Use string values to preserve precision for Decimal.js calculations
				const accelGStr = accelInput.value ?? "1";
				const durationDaysStr = durationInput.value ?? "365";

				// parseFloat is OK here as Chart.js only needs limited precision for display
				const accelG = parseFloat(accelGStr);
				const durationDays = parseFloat(durationDaysStr);

				const data = generateVisualizationChartData(accelG, durationDays);
				chartRegistry.current = updateVisualizationCharts(chartRegistry.current, data);

				if (status) status.textContent = "Done";
				pendingCalculation = null;
			}, 0);
		});
	};
}
