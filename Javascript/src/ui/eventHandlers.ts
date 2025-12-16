/**
 * Event handler factory functions
 * Coordinate between DOM, physics, data generation, and charts
 */

import Decimal from "decimal.js";
import * as rl from "../relativity_lib";
import * as extra from "../extra_lib";
import { setElement } from "./domUtils";
import {
	generateAccelChartData,
	generateFlipBurnChartData,
	generateVisualizationChartData,
	generateTwinParadoxChartData,
} from "../charts/dataGeneration";
import {
	updateAccelCharts,
	updateFlipBurnCharts,
	updateVisualizationCharts,
	updateTwinParadoxCharts,
	type ChartRegistry,
} from "../charts/charts";
import { drawMinkowskiDiagramD3, type MinkowskiData } from "../charts/minkowski";
import { drawTwinParadoxMinkowski, type TwinParadoxMinkowskiData } from "../charts/minkowski-twins";

// Per-chart time mode state
const chartTimeModes: Record<string, "proper" | "coordinate"> = {
	accelVelocity: "proper",
	accelLorentz: "proper",
	accelRapidity: "proper",
	flipVelocity: "proper",
	flipLorentz: "proper",
	flipRapidity: "proper",
};

export function createLorentzHandler(
	getInput: () => HTMLInputElement | null,
	getResult: () => HTMLElement | null
): () => void {
	return () => {
		const input = getInput();
		const result = getResult();
		if (!input || !result) return;

		const vel = rl.checkVelocity(input.value ?? 0);
		const lorentz = rl.lorentzFactor(vel);
		setElement(result, rl.formatSignificant(lorentz, "0", 3), "");
	};
}

export function createRapidityFromVelocityHandler(
	getInput: () => HTMLInputElement | null,
	getResult: () => HTMLElement | null
): () => void {
	return () => {
		const input = getInput();
		const result = getResult();
		if (!input || !result) return;

		const rapidity = rl.rapidityFromVelocity(input.value ?? 0);
		setElement(result, rl.formatSignificant(rapidity, "0", 3), "");
	};
}

export function createVelocityFromRapidityHandler(
	getInput: () => HTMLInputElement | null,
	getResult: () => HTMLElement | null
): () => void {
	return () => {
		const input = getInput();
		const result = getResult();
		if (!input || !result) return;

		const velocity = rl.velocityFromRapidity(input.value ?? 0);
		setElement(result, rl.formatSignificant(velocity, "9", 3), "m/s");
	};
}

export function createAddVelocitiesHandler(
	getV1Input: () => HTMLInputElement | null,
	getV2Input: () => HTMLInputElement | null,
	getResult: () => HTMLElement | null
): () => void {
	return () => {
		const v1Input = getV1Input();
		const v2Input = getV2Input();
		const result = getResult();
		if (!v1Input || !v2Input || !result) return;

		const v1 = rl.ensure(v1Input.value ?? 0);
		const v2 = rl.ensure(v2Input.value ?? 0);
		const added = rl.addVelocitiesC(v1, v2);

		setElement(result, rl.formatSignificant(added, "9", 3), "c");
	};
}

export function createWarpDriveHandler(
	getDistanceInput: () => HTMLInputElement | null,
	getBoostInput: () => HTMLInputElement | null,
	getTransitInput: () => HTMLInputElement | null,
	getBoostDurationInput: () => HTMLInputElement | null,
	getResults: () => (HTMLElement | null)[]
): () => void {
	return () => {
		const distanceInput = getDistanceInput();
		const boostInput = getBoostInput();
		const transitInput = getTransitInput();
		const boostDurationInput = getBoostDurationInput();
		const results = getResults();
		if (!distanceInput || !boostInput || !transitInput || !boostDurationInput) return;
		if (results.length < 4 || results.some(r => r === null)) return;

		// Convert inputs from user units to SI units
		// Distance: light-minutes -> metres (multiply by c * 60)
		const distanceLightMinutes = rl.ensure(distanceInput.value ?? 30);
		const distanceMetres = distanceLightMinutes.mul(rl.c).mul(60);

		// Boost velocity: already fraction of c
		const boostVelocityC = rl.ensure(boostInput.value ?? 0.9);

		// Transit time: minutes -> seconds
		const transitMinutes = rl.ensure(transitInput.value ?? 0);
		const transitSeconds = transitMinutes.mul(60);

		// Boost duration: minutes -> seconds
		const boostDurationMinutes = rl.ensure(boostDurationInput.value ?? 0);
		const boostDurationSeconds = boostDurationMinutes.mul(60);

		// Calculate
		const result = rl.warpDriveTimeTravel(
			distanceMetres,
			boostVelocityC,
			transitSeconds,
			boostDurationSeconds
		);

		// Calculate Lorentz factor for the boost velocity
		const boostVelocityMs = boostVelocityC.mul(rl.c);
		const lorentzFactor = rl.lorentzFactor(boostVelocityMs);

		// Convert results back to user-friendly units (seconds -> minutes)
		const displacementMinutes = result.timeDisplacement.div(60);
		const simultaneityMinutes = result.simultaneityShift.div(60);
		const travelerTimeMinutes = result.travelerTime.div(60);

		// Format and display
		const [dispResult, simResult, lorentzResult, travelerResult] = results;

		// Time displacement with descriptive text and auto-scaled units
		const dispFormatted = rl.formatTimeWithUnit(displacementMinutes.abs());
		const direction = displacementMinutes.isNegative() ? "into the past" : "into the future";
		setElement(dispResult!, `${dispFormatted.value} ${dispFormatted.units} ${direction}`, "");

		// Other results with auto-scaled units
		const simFormatted = rl.formatTimeWithUnit(simultaneityMinutes);
		setElement(simResult!, simFormatted.value, simFormatted.units);

		// Lorentz factor (dimensionless, show 3 significant figures)
		setElement(lorentzResult!, rl.formatSignificant(lorentzFactor, "", 3), "");

		const travelerFormatted = rl.formatTimeWithUnit(travelerTimeMinutes);
		setElement(travelerResult!, travelerFormatted.value, travelerFormatted.units);
	};
}

export function createAccelHandler(
	getAccelInput: () => HTMLInputElement | null,
	getTimeInput: () => HTMLInputElement | null,
	getDryMassInput: () => HTMLInputElement | null,
	getEfficiencyInput: () => HTMLInputElement | null,
	getResults: () => (HTMLElement | null)[],
	chartRegistry: { current: ChartRegistry }
): () => void {
	let pendingRAF: number | null = null;
	let pendingCalculation: number | null = null;

	return () => {
		const accelInput = getAccelInput();
		const timeInput = getTimeInput();
		const dryMassInput = getDryMassInput();
		const efficiencyInput = getEfficiencyInput();
		const [
			resultA1,
			resultA2,
			resultA1b,
			resultA2b,
			resultAFuel,
			resultAFuelFraction,
			resultAStars,
			resultAGalaxyFraction,
		] = getResults();
		if (!accelInput || !timeInput || !dryMassInput || !efficiencyInput) return;

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
		let accelGStr = accelInput.value ?? "1";
		try {
			const accelGDec = rl.ensure(accelGStr);
			if (accelGDec.lt(0.1)) {
				accelGStr = "0.1";
				accelInput.value = "0.1";
			} else if (accelGDec.gt(100)) {
				accelGStr = "100";
				accelInput.value = "100";
			}
		} catch {
			accelGStr = "1";
			accelInput.value = "1";
		}

		let timeStr = timeInput.value ?? "0";
		try {
			const timeDaysDec = rl.ensure(timeStr);
			if (timeDaysDec.lt(0.1)) {
				timeStr = "0.1";
				timeInput.value = "0.1";
			} else if (timeDaysDec.gt(60000)) {
				timeStr = "60000";
				timeInput.value = "60000";
			}
		} catch {
			timeStr = "365";
			timeInput.value = "365";
		}

		let dryMassStr = dryMassInput.value ?? "500";
		try {
			const dryMassDec = rl.ensure(dryMassStr);
			if (dryMassDec.lt(1)) {
				dryMassStr = "1";
				dryMassInput.value = "1";
			} else if (dryMassDec.gt(100000000)) {
				dryMassStr = "100000000";
				dryMassInput.value = "100000000";
			}
		} catch {
			dryMassStr = "500";
			dryMassInput.value = "500";
		}

		let efficiencyStr = efficiencyInput.value ?? "0.85";
		try {
			const efficiencyDec = rl.ensure(efficiencyStr);
			if (efficiencyDec.lt(0.01)) {
				efficiencyStr = "0.01";
				efficiencyInput.value = "0.01";
			} else if (efficiencyDec.gt(0.99)) {
				efficiencyStr = "0.99";
				efficiencyInput.value = "0.99";
			}
		} catch {
			efficiencyStr = "0.85";
			efficiencyInput.value = "0.85";
		}

		// Show working message
		if (resultA1) resultA1.textContent = "";
		if (resultA2) resultA2.textContent = "Working...";
		if (resultA1b) resultA1b.textContent = "";
		if (resultA2b) resultA2b.textContent = "";
		if (resultAFuel) resultAFuel.textContent = "";
		if (resultAFuelFraction) resultAFuelFraction.textContent = "";
		if (resultAStars) resultAStars.textContent = "";
		if (resultAGalaxyFraction) resultAGalaxyFraction.textContent = "";

		// Allow UI to update before heavy calculation
		pendingRAF = requestAnimationFrame(() => {
			pendingRAF = null;
			pendingCalculation = window.setTimeout(() => {
				// Use validated values from above
				const accel = rl.g.mul(accelGStr);
				const secs = rl.ensure(timeStr).mul(60 * 60 * 24);

				const relVel = rl.relativisticVelocity(accel, secs);
				const relDist = rl.relativisticDistance(accel, secs);
				const relVelC = relVel.div(rl.c);
				const relDistC = relDist.div(rl.lightYear);
				const relDistKm = relDist.div(1000);
				const coordTimeSec = rl.coordinateTime(accel, secs);
				const coordTimeDays = coordTimeSec.div(86400);

				// Calculate fuel fraction using user-provided efficiency
				const dryMass = rl.ensure(dryMassStr);
				const efficiency = rl.ensure(efficiencyStr);
				const fuelFraction = rl.pionRocketFuelFraction(secs, accel, efficiency);
				const fuelMass = fuelFraction.mul(dryMass).div(rl.one.minus(fuelFraction));
				const fuelPercent = fuelFraction.mul(100);

				if (resultA1) setElement(resultA1, rl.formatSignificant(relVel, "9", 2), "m/s");
				if (resultA2) {
					// Auto-switch between days and years for coordinate time
					if (coordTimeDays.gte(1000)) {
						const coordTimeYears = coordTimeDays.div(365.25);
						setElement(resultA2, rl.formatSignificant(coordTimeYears, "", 1), "yrs");
					} else {
						setElement(resultA2, rl.formatSignificant(coordTimeDays, "", 1), "days");
					}
				}
				if (resultA1b) setElement(resultA1b, rl.formatSignificant(relVelC, "9", 3), "c");
				if (resultA2b) {
					const distanceFormatted = rl.formatDistanceAutoUnit(relDistC, relDistKm);
					setElement(resultA2b, distanceFormatted.value, distanceFormatted.units);
				}
				if (resultAFuel) setElement(resultAFuel, rl.formatMassWithUnit(fuelMass), "");
				if (resultAFuelFraction)
					setElement(resultAFuelFraction, rl.formatSignificant(fuelPercent, "9", 2), "%");

				// Estimate stars in range - use distance in light years
				const distanceLightYears = parseFloat(relDistC.toString());
				if (distanceLightYears >= 100000) {
					// At or above 100k ly, show "Entire galaxy"
					if (resultAStars) setElement(resultAStars, "Entire galaxy", "");
					if (resultAGalaxyFraction) setElement(resultAGalaxyFraction, "100", "%");
				} else {
					const starEstimate = extra.estimateStarsInSphere(distanceLightYears);
					const starsFormatted = extra.formatStarCount(starEstimate.stars);
					const fractionPercent = rl.formatSignificant(
						new Decimal(starEstimate.fraction * 100),
						"0",
						1
					);
					if (resultAStars) setElement(resultAStars, starsFormatted, "");
					if (resultAGalaxyFraction) setElement(resultAGalaxyFraction, fractionPercent, "%");
				}

				// Update charts - parseFloat is OK here as Chart.js only needs limited precision for display
				const accelG = parseFloat(accelGStr);
				const durationDays = parseFloat(timeStr);
				const data = generateAccelChartData(accelG, durationDays);
				chartRegistry.current = updateAccelCharts(chartRegistry.current, data, {
					velocity: chartTimeModes.accelVelocity,
					lorentz: chartTimeModes.accelLorentz,
					rapidity: chartTimeModes.accelRapidity,
				});
				pendingCalculation = null;
			}, 0);
		});
	};
}

export function createFlipBurnHandler(
	getAccelInput: () => HTMLInputElement | null,
	getDistanceInput: () => HTMLInputElement | null,
	getDryMassInput: () => HTMLInputElement | null,
	getEfficiencyInput: () => HTMLInputElement | null,
	getResults: () => (HTMLElement | null)[],
	chartRegistry: { current: ChartRegistry }
): () => void {
	let pendingRAF: number | null = null;
	let pendingCalculation: number | null = null;

	return () => {
		const accelInput = getAccelInput();
		const distanceInput = getDistanceInput();
		const dryMassInput = getDryMassInput();
		const efficiencyInput = getEfficiencyInput();
		const [
			resultFlip1,
			resultFlip2,
			resultFlip3,
			resultFlip4,
			resultFlip5,
			resultFlip6,
			resultFlipFuel,
			resultFlipFuelFraction,
			resultFlipStars,
			resultFlipGalaxyFraction,
		] = getResults();
		if (!accelInput || !distanceInput || !dryMassInput || !efficiencyInput) return;

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
		let accelGStr = accelInput.value ?? "1";
		try {
			const accelGDec = rl.ensure(accelGStr);
			if (accelGDec.lt(0.1)) {
				accelGStr = "0.1";
				accelInput.value = "0.1";
			} else if (accelGDec.gt(100)) {
				accelGStr = "100";
				accelInput.value = "100";
			}
		} catch {
			accelGStr = "1";
			accelInput.value = "1";
		}

		let distanceLightYearsStr = distanceInput.value ?? "0";
		try {
			const distanceLYDec = rl.ensure(distanceLightYearsStr);
			if (distanceLYDec.lt(0.0001)) {
				distanceLightYearsStr = "0.0001";
				distanceInput.value = "0.0001";
			} else if (distanceLYDec.gt(50000000000)) {
				distanceLightYearsStr = "50000000000";
				distanceInput.value = "50000000000";
			}
		} catch {
			distanceLightYearsStr = "4";
			distanceInput.value = "4";
		}

		let dryMassStr = dryMassInput.value ?? "500";
		try {
			const dryMassDec = rl.ensure(dryMassStr);
			if (dryMassDec.lt(1)) {
				dryMassStr = "1";
				dryMassInput.value = "1";
			} else if (dryMassDec.gt(100000000)) {
				dryMassStr = "100000000";
				dryMassInput.value = "100000000";
			}
		} catch {
			dryMassStr = "500";
			dryMassInput.value = "500";
		}

		let efficiencyStr = efficiencyInput.value ?? "0.85";
		try {
			const efficiencyDec = rl.ensure(efficiencyStr);
			if (efficiencyDec.lt(0.01)) {
				efficiencyStr = "0.01";
				efficiencyInput.value = "0.01";
			} else if (efficiencyDec.gt(0.99)) {
				efficiencyStr = "0.99";
				efficiencyInput.value = "0.99";
			}
		} catch {
			efficiencyStr = "0.85";
			efficiencyInput.value = "0.85";
		}

		// Show working message
		if (resultFlip1) resultFlip1.textContent = "Working...";
		if (resultFlip2) resultFlip2.textContent = "";
		if (resultFlip3) resultFlip3.textContent = "";
		if (resultFlip4) resultFlip4.textContent = "";
		if (resultFlip5) resultFlip5.textContent = "";
		if (resultFlip6) resultFlip6.textContent = "";
		if (resultFlipFuel) resultFlipFuel.textContent = "";
		if (resultFlipFuelFraction) resultFlipFuelFraction.textContent = "";
		if (resultFlipStars) resultFlipStars.textContent = "";
		if (resultFlipGalaxyFraction) resultFlipGalaxyFraction.textContent = "";

		// Allow UI to update before heavy calculation
		pendingRAF = requestAnimationFrame(() => {
			pendingRAF = null;
			pendingCalculation = window.setTimeout(() => {
				// Use validated values from above
				const accel = rl.g.mul(accelGStr);
				const m = rl.ensure(distanceLightYearsStr).mul(rl.lightYear);
				const res = rl.flipAndBurn(accel, m);
				const properTime = res.properTime.div(rl.secondsPerYear);
				const coordTime = res.coordTime.div(rl.secondsPerYear);
				const peak = res.peakVelocity.div(rl.c);
				const lorentz = res.lorentzFactor;
				const metre = rl.formatSignificant(rl.one.div(lorentz), "0", 2);
				const sec = rl.formatSignificant(rl.one.mul(lorentz), "0", 2);

				// Calculate fuel mass
				const dryMass = rl.ensure(dryMassStr);
				const efficiency = rl.ensure(efficiencyStr);
				const fuelFraction = rl.pionRocketFuelFraction(res.properTime, accel, efficiency);
				const fuelMass = fuelFraction.mul(dryMass).div(rl.one.minus(fuelFraction));
				const fuelPercent = fuelFraction.mul(100);

				if (resultFlip1) setElement(resultFlip1, rl.formatSignificant(properTime, "0", 2), "yrs");
				if (resultFlip2) setElement(resultFlip2, rl.formatSignificant(peak, "9", 2), "c");
				if (resultFlip4) setElement(resultFlip4, rl.formatSignificant(coordTime, "", 1), "yrs");
				if (resultFlip3) setElement(resultFlip3, rl.formatSignificant(lorentz, "0", 2), "");
				if (resultFlip5) setElement(resultFlip5, `1m becomes ${metre}m`, "");
				if (resultFlip6) setElement(resultFlip6, `1s becomes ${sec}s`, "");
				if (resultFlipFuel) setElement(resultFlipFuel, rl.formatMassWithUnit(fuelMass), "");
				if (resultFlipFuelFraction)
					setElement(resultFlipFuelFraction, rl.formatSignificant(fuelPercent, "9", 2), "%");

				// Update charts - parseFloat is OK here as Chart.js only needs limited precision for display
				const accelG = parseFloat(accelGStr);
				const distanceLightYears = parseFloat(distanceLightYearsStr);

				// Estimate stars in range
				if (distanceLightYears >= 100000) {
					// At or above 100k ly, show "Entire galaxy"
					if (resultFlipStars) setElement(resultFlipStars, "Entire galaxy", "");
					if (resultFlipGalaxyFraction) setElement(resultFlipGalaxyFraction, "100", "%");
				} else {
					const starEstimate = extra.estimateStarsInSphere(distanceLightYears);
					const starsFormatted = extra.formatStarCount(starEstimate.stars);
					const fractionPercent = rl.formatSignificant(
						new Decimal(starEstimate.fraction * 100),
						"0",
						1
					);
					if (resultFlipStars) setElement(resultFlipStars, starsFormatted, "");
					if (resultFlipGalaxyFraction) setElement(resultFlipGalaxyFraction, fractionPercent, "%");
				}
				const data = generateFlipBurnChartData(accelG, distanceLightYears);
				chartRegistry.current = updateFlipBurnCharts(chartRegistry.current, data, {
					velocity: chartTimeModes.flipVelocity,
					lorentz: chartTimeModes.flipLorentz,
					rapidity: chartTimeModes.flipRapidity,
				});
				pendingCalculation = null;
			}, 0);
		});
	};
}

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
					earthTimeYears: parseFloat(earthAge.toString()),
					distanceLY: parseFloat(oneWayLy.toString()),
					gamma: parseFloat(lorentz.toString()),
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

export function createPionAccelTimeHandler(
	getFuelMassInput: () => HTMLInputElement | null,
	getDryMassInput: () => HTMLInputElement | null,
	getEfficiencyInput: () => HTMLInputElement | null,
	getResult: () => HTMLElement | null
): () => void {
	return () => {
		const fuelMassInput = getFuelMassInput();
		const dryMassInput = getDryMassInput();
		const efficiencyInput = getEfficiencyInput();
		const result = getResult();
		if (!fuelMassInput || !dryMassInput || !efficiencyInput || !result) return;

		const fuelMass = rl.ensure(fuelMassInput.value ?? 0);
		const dryMass = rl.ensure(dryMassInput.value ?? 0);
		const efficiency = rl.ensure(efficiencyInput.value ?? 0.85);

		// Validate efficiency range
		if (efficiency.lt(0.01) || efficiency.gt(1.0)) {
			setElement(result, "Efficiency must be between 0.01 and 1.0", "");
			return;
		}

		const accelTimeSeconds = rl.pionRocketAccelTime(fuelMass, dryMass, efficiency);
		const accelTimeDays = accelTimeSeconds.div(60 * 60 * 24);

		setElement(result, rl.formatSignificant(accelTimeDays, "0", 3), "days");
	};
}

export function createPionFuelFractionHandler(
	getAccelInput: () => HTMLInputElement | null,
	getThrustTimeInput: () => HTMLInputElement | null,
	getEfficiencyInput: () => HTMLInputElement | null,
	getDryMassInput: () => HTMLInputElement | null,
	getResultFraction: () => HTMLElement | null,
	getResultMass: () => HTMLElement | null
): () => void {
	return () => {
		const accelInput = getAccelInput();
		const thrustTimeInput = getThrustTimeInput();
		const efficiencyInput = getEfficiencyInput();
		const dryMassInput = getDryMassInput();
		const resultFraction = getResultFraction();
		const resultMass = getResultMass();
		if (
			!accelInput ||
			!thrustTimeInput ||
			!efficiencyInput ||
			!dryMassInput ||
			!resultFraction ||
			!resultMass
		)
			return;

		const accelG = rl.ensure(accelInput.value ?? 1);
		const thrustTimeDays = rl.ensure(thrustTimeInput.value ?? 365);
		const thrustTimeSeconds = thrustTimeDays.mul(60 * 60 * 24);
		const efficiency = rl.ensure(efficiencyInput.value ?? 0.85);
		const dryMass = rl.ensure(dryMassInput.value ?? 1000);

		// Validate acceleration range
		if (accelG.lt(0.01) || accelG.gt(100)) {
			setElement(resultFraction, "Acceleration must be between 0.01 and 100 g", "");
			setElement(resultMass, "-", "");
			return;
		}

		// Validate efficiency range
		if (efficiency.lt(0.01) || efficiency.gt(1.0)) {
			setElement(resultFraction, "Efficiency must be between 0.01 and 1.0", "");
			setElement(resultMass, "-", "");
			return;
		}

		// Validate dry mass
		if (dryMass.lte(0)) {
			setElement(resultFraction, "Dry mass must be positive", "");
			setElement(resultMass, "-", "");
			return;
		}

		const accel = rl.g.mul(accelG);
		const fuelFraction = rl.pionRocketFuelFraction(thrustTimeSeconds, accel, efficiency);
		const fuelFractionPercent = fuelFraction.mul(100);

		// Calculate fuel mass: fuel_mass = (fuel_fraction × dry_mass) / (1 - fuel_fraction)
		const fuelMass = fuelFraction.mul(dryMass).div(rl.one.minus(fuelFraction));

		setElement(resultFraction, rl.formatSignificant(fuelFractionPercent, "9", 2), "%");
		setElement(resultMass, rl.formatMassWithUnit(fuelMass), "");
	};
}

export function createSpacetimeIntervalHandler(
	getTime2Input: () => HTMLInputElement | null,
	getX2Input: () => HTMLInputElement | null,
	getVelocityInput: () => HTMLInputElement | null,
	getResultSquared: () => HTMLElement | null,
	getResultType: () => HTMLElement | null,
	getResultDeltaT: () => HTMLElement | null,
	getResultDeltaX: () => HTMLElement | null,
	getResultMinSep: () => HTMLElement | null,
	getResultVelocity: () => HTMLElement | null,
	onDiagramDrawn?: (
		container: HTMLElement,
		data: MinkowskiData,
		controller: ReturnType<typeof drawMinkowskiDiagramD3> | null
	) => void
): () => void {
	return () => {
		const time2Input = getTime2Input();
		const x2Input = getX2Input();
		const velocityInput = getVelocityInput();
		const resultSquared = getResultSquared();
		const resultType = getResultType();
		const resultDeltaT = getResultDeltaT();
		const resultDeltaX = getResultDeltaX();
		const resultMinSep = getResultMinSep();
		const resultVelocity = getResultVelocity();
		if (
			!time2Input ||
			!x2Input ||
			!velocityInput ||
			!resultSquared ||
			!resultType ||
			!resultDeltaT ||
			!resultDeltaX ||
			!resultMinSep ||
			!resultVelocity
		)
			return;

		// Validate and clamp inputs
		let t2Str = time2Input.value ?? "2";
		try {
			const t2Dec = rl.ensure(t2Str);
			if (t2Dec.lt(0.001)) {
				t2Str = "0.001";
				time2Input.value = "0.001";
			} else if (t2Dec.gt(1000000)) {
				t2Str = "1000000";
				time2Input.value = "1000000";
			}
		} catch {
			t2Str = "2";
			time2Input.value = "2";
		}

		let x2KmStr = x2Input.value ?? "299792.458";
		try {
			const x2KmDec = rl.ensure(x2KmStr);
			if (x2KmDec.lt(1)) {
				x2KmStr = "1";
				x2Input.value = "1";
			} else if (x2KmDec.gt(10000000000)) {
				x2KmStr = "10000000000";
				x2Input.value = "10000000000";
			}
		} catch {
			x2KmStr = "299792.458";
			x2Input.value = "299792.458";
		}

		let velocityCStr = velocityInput.value ?? "0.99";
		try {
			const velocityCDec = rl.ensure(velocityCStr);
			if (velocityCDec.lt(-0.999)) {
				velocityCStr = "-0.999";
				velocityInput.value = "-0.999";
			} else if (velocityCDec.gt(0.999)) {
				velocityCStr = "0.999";
				velocityInput.value = "0.999";
			}
		} catch {
			velocityCStr = "0.99";
			velocityInput.value = "0.99";
		}

		// Event 1 is always at (0, 0)
		const t1 = new Decimal(0);
		const x1 = new Decimal(0);

		const t2 = rl.ensure(t2Str);
		const x2Km = rl.ensure(x2KmStr);
		const velocityC = rl.ensure(velocityCStr);

		// Convert km to m for calculations
		const x2 = x2Km.mul(1000);

		// Calculate interval squared: s² = c²(Δt)² - (Δx)²
		const deltaT = t2.minus(t1);
		const deltaX = x2.minus(x1);
		const intervalSquared = rl.c.pow(2).mul(deltaT.pow(2)).minus(deltaX.pow(2));

		// Display interval squared in km²
		const intervalSquaredKm = intervalSquared.div(1000000);
		setElement(resultSquared, rl.formatSignificant(intervalSquaredKm, "0", 1), "km²");

		// Interpret the interval
		const tolerance = new Decimal(1e-10);
		if (intervalSquared.abs().lt(tolerance)) {
			// Lightlike interval
			setElement(resultType, "Lightlike: Light-speed connection", "");
			setElement(resultMinSep, "N/A (lightlike)", "");
			setElement(resultVelocity, "1c", "");
		} else if (intervalSquared.gt(0)) {
			// Timelike interval - causally connected
			const properTime = intervalSquared.sqrt().div(rl.c);
			setElement(
				resultType,
				`Timelike: ${rl.formatSignificant(properTime, "0", 3)} s - Events are causally connected`,
				""
			);

			// For timelike: minimum separation is proper time (in frame where events occur at same place)
			setElement(resultMinSep, rl.formatSignificant(properTime, "0", 3), "s");

			// Required velocity: v = Δx/Δt
			const requiredVel = deltaX.div(deltaT);
			const requiredVelC = requiredVel.div(rl.c);
			setElement(resultVelocity, rl.formatSignificant(requiredVelC, "9", 3), "c");
		} else {
			// Spacelike interval - not causally connected
			const properDistanceM = intervalSquared.abs().sqrt();
			const properDistanceKm = properDistanceM.div(1000);
			setElement(
				resultType,
				`Spacelike: ${rl.formatSignificant(properDistanceKm, "0", 1)} km - Events cannot be causally connected`,
				""
			);

			// For spacelike: minimum separation is proper distance (in frame where events are simultaneous)
			setElement(resultMinSep, rl.formatSignificant(properDistanceKm, "0", 3), "km");

			// Required velocity to make events simultaneous: v = c²Δt/Δx
			const requiredVel = rl.c.pow(2).mul(deltaT).div(deltaX);
			const requiredVelC = requiredVel.div(rl.c);
			setElement(resultVelocity, rl.formatSignificant(requiredVelC, "9", 3), "c");
		}

		// Calculate Lorentz transformation
		const v = velocityC.mul(rl.c); // Convert from c to m/s
		const gamma = rl.lorentzFactor(v);

		// Δt' = γ(Δt - vΔx/c²)
		const deltaTprime = gamma.mul(deltaT.minus(v.mul(deltaX).div(rl.c.pow(2))));

		// Δx' = γ(Δx - vΔt)
		const deltaXprimeM = gamma.mul(deltaX.minus(v.mul(deltaT)));
		const deltaXprimeKm = deltaXprimeM.div(1000);

		setElement(resultDeltaT, rl.formatSignificant(deltaTprime, "0", 3), "s");
		setElement(resultDeltaX, rl.formatSignificant(deltaXprimeKm, "0", 1), "km");

		// Draw Minkowski diagram
		const container = document.getElementById("minkowskiContainer");
		if (container) {
			// Determine interval type
			let intervalType: "timelike" | "spacelike" | "lightlike";
			if (intervalSquared.abs().lt(tolerance)) {
				intervalType = "lightlike";
			} else if (intervalSquared.gt(0)) {
				intervalType = "timelike";
			} else {
				intervalType = "spacelike";
			}

			const diagramData: MinkowskiData = {
				time: t2.toNumber(),
				distance: x2Km.toNumber(),
				velocity: velocityC.toNumber(),
				deltaTPrime: deltaTprime.toNumber(),
				deltaXPrime: deltaXprimeKm.toNumber(),
				intervalType,
				// Decimal versions for display
				timeDecimal: t2,
				distanceDecimal: x2Km,
				velocityDecimal: velocityC,
				deltaTPrimeDecimal: deltaTprime,
				deltaXPrimeDecimal: deltaXprimeKm,
			};

			// Notify caller that diagram was drawn (for resize handling)
			// The callback will handle creating or updating the diagram
			if (onDiagramDrawn) {
				onDiagramDrawn(container, diagramData, null);
			}
		}
	};
}

/**
 * Create handler for chart time mode toggle buttons
 */
export function createChartTimeModeHandler(
	chartId: string,
	chartRegistry: { current: ChartRegistry }
): (mode: "proper" | "coordinate") => void {
	return (mode: "proper" | "coordinate") => {
		// Update state
		chartTimeModes[chartId] = mode;

		// Update button states
		const buttons = document.querySelectorAll(`[data-chart="${chartId}"]`);
		buttons.forEach(btn => {
			const btnElement = btn as HTMLButtonElement;
			if (btnElement.dataset.mode === mode) {
				btnElement.classList.add("active");
			} else {
				btnElement.classList.remove("active");
			}
		});

		// Update the chart's x-axis max directly without recalculating
		const chartName = chartId + "Chart";
		const chart = chartRegistry.current.get(chartName);

		if (chart && chart.data.datasets.length >= 2) {
			// Get max x values from the existing datasets
			// Dataset 0 is proper time, Dataset 1 is coordinate time
			const properTimeData = chart.data.datasets[0].data as Array<{ x: number; y: number }>;
			const coordTimeData = chart.data.datasets[1].data as Array<{ x: number; y: number }>;

			const maxProperTime = Math.max(...properTimeData.map(d => d.x));
			const maxCoordTime = Math.max(...coordTimeData.map(d => d.x));

			// Update x-axis max based on mode
			const newXMax = mode === "proper" ? maxProperTime : maxCoordTime;

			if (chart.options.scales?.x) {
				chart.options.scales.x.max = newXMax;
				chart.update("none"); // Update without animation for instant response
			}
		}
	};
}

/**
 * Get current chart time modes
 */
export function getChartTimeModes() {
	return { ...chartTimeModes };
}

/**
 * Set chart time mode
 */
export function setChartTimeMode(chartId: string, mode: "proper" | "coordinate") {
	if (chartId in chartTimeModes) {
		chartTimeModes[chartId] = mode;
	}
}

/**
 * Create handler for mass chart time scale slider
 */
export function createMassChartSliderHandler(
	chartId: string,
	getSlider: () => HTMLInputElement | null,
	getValueDisplay: () => HTMLElement | null,
	unit: "days" | "years",
	chartRegistry: { current: ChartRegistry }
): () => void {
	return () => {
		const slider = getSlider();
		const valueDisplay = getValueDisplay();
		if (!slider || !valueDisplay) return;

		const newMax = parseFloat(slider.value);

		// Update display value
		valueDisplay.textContent = `${newMax.toFixed(unit === "days" ? 0 : 1)} ${unit}`;

		// Update the chart's x-axis max directly without recalculating
		const chart = chartRegistry.current.get(chartId);
		if (chart && chart.options.scales?.x) {
			chart.options.scales.x.max = newMax;
			chart.update("none"); // Update without animation for instant response
		}
	};
}

/**
 * Initialize mass chart slider with correct range from data
 */
export function initializeMassChartSlider(
	chartId: string,
	sliderId: string,
	valueDisplayId: string,
	unit: "days" | "years",
	chartRegistry: { current: ChartRegistry }
): void {
	const chart = chartRegistry.current.get(chartId);
	if (!chart || !chart.data.datasets.length) return;

	// Get max x value from first dataset (all mass datasets have same x range)
	const data = chart.data.datasets[0].data as Array<{ x: number; y: number }>;
	const dataMax = Math.max(...data.map(d => d.x));
	// Round up to nearest 0.5 to encompass the full calculation result
	const maxValue = Math.ceil(dataMax * 2) / 2;

	// Update slider attributes
	const slider = document.getElementById(sliderId) as HTMLInputElement;
	const valueDisplay = document.getElementById(valueDisplayId);
	if (slider && valueDisplay) {
		slider.max = maxValue.toString();
		slider.value = maxValue.toString();
		valueDisplay.textContent = `${maxValue.toFixed(unit === "days" ? 0 : 1)} ${unit}`;
	}
}

/**
 * Calculate adaptive exponent based on max distance
 * - Small distances (<10 ly): exponent ~1.5 for more even distribution
 * - Large distances (>1000 ly): exponent ~3 for fine control at start
 */
function getDistanceExponent(maxDistance: number): number {
	if (maxDistance <= 1) return 1.5;
	if (maxDistance >= 1000) return 3;
	// Logarithmic interpolation between 1.5 and 3
	const logMin = Math.log10(1);
	const logMax = Math.log10(1000);
	const logDist = Math.log10(maxDistance);
	const t = (logDist - logMin) / (logMax - logMin);
	return 1.5 + t * 1.5; // Ranges from 1.5 to 3
}

/**
 * Convert slider percentage (0-100) to actual distance using adaptive power scale
 * Exponent varies based on max distance for optimal responsiveness
 */
export function sliderToDistance(percentage: number, maxDistance: number): number {
	const exponent = getDistanceExponent(maxDistance);
	return maxDistance * Math.pow(percentage / 100, exponent);
}

/**
 * Convert actual distance to slider percentage (0-100) using inverse power scale
 */
export function distanceToSlider(distance: number, maxDistance: number): number {
	if (maxDistance <= 0) return 100;
	const exponent = getDistanceExponent(maxDistance);
	return 100 * Math.pow(distance / maxDistance, 1 / exponent);
}

/**
 * Create handler for position/velocity chart distance scale slider
 * Uses power scale for fine control at small distances
 */
export function createPositionVelocitySliderHandler(
	chartId: string,
	getSlider: () => HTMLInputElement | null,
	getValueDisplay: () => HTMLElement | null,
	chartRegistry: { current: ChartRegistry }
): () => void {
	return () => {
		const slider = getSlider();
		const valueDisplay = getValueDisplay();
		if (!slider || !valueDisplay) return;

		// Get max distance from data attribute
		const maxDistance = parseFloat(slider.dataset.maxDistance || slider.max);
		const sliderPercent = parseFloat(slider.value);

		// Convert slider percentage to actual distance using power scale
		const distance = sliderToDistance(sliderPercent, maxDistance);

		// Ensure minimum chart range to prevent negative x-axis values
		const chartDistance = Math.max(0.01, distance);

		// Update display value with appropriate precision
		const displayValue = distance < 10 ? distance.toFixed(2) : distance.toFixed(1);
		valueDisplay.textContent = `${displayValue} ly`;

		// Update the chart's x-axis max directly without recalculating
		const chart = chartRegistry.current.get(chartId);
		if (chart && chart.options.scales?.x) {
			chart.options.scales.x.max = chartDistance;
			chart.options.scales.x.min = 0; // Ensure axis starts at 0
			chart.update("none"); // Update without animation for instant response
		}
	};
}

/**
 * Initialize position/velocity chart slider with correct range from data
 * Uses power scale (0-100%) internally for fine control at small distances
 */
export function initializePositionVelocitySlider(
	chartId: string,
	sliderId: string,
	valueDisplayId: string,
	chartRegistry: { current: ChartRegistry }
): void {
	const chart = chartRegistry.current.get(chartId);
	if (!chart || !chart.data.datasets.length) return;

	// Get max x value across all datasets (flip-and-burn has accel + decel phases)
	const maxValue = Math.max(
		...chart.data.datasets.flatMap(dataset => {
			const data = dataset.data as Array<{ x: number; y: number }>;
			return data.map(d => d.x);
		})
	);

	// Update slider to use percentage scale (0-100)
	// Store actual max distance in data attribute for conversion
	const slider = document.getElementById(sliderId) as HTMLInputElement;
	const valueDisplay = document.getElementById(valueDisplayId);
	if (slider && valueDisplay) {
		slider.min = "0";
		slider.max = "100";
		slider.step = "0.5"; // 0.5% steps for smooth sliding
		slider.value = "100"; // Start at max (100%)
		slider.dataset.maxDistance = maxValue.toString();
		valueDisplay.textContent = `${maxValue.toFixed(1)} ly`;
	}
}
