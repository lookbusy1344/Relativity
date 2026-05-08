import Decimal from "decimal.js";
import * as extra from "../../extra_lib";
import * as rl from "../../relativity_lib";
import { setElement } from "../domUtils";
import { generateAccelChartData } from "../../charts/dataGeneration";
import { updateAccelCharts, type ChartRegistry } from "../../charts/charts";
import { chartTimeModes } from "./chartTimeMode";

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
			resultAPeakLorentz,
			resultAPeakLorentzSub,
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
			if (accelGDec.lt(0.01)) {
				accelGStr = "0.01";
				accelInput.value = "0.01";
			} else if (accelGDec.gt(10000)) {
				accelGStr = "10000";
				accelInput.value = "10000";
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

		let dryMassStr = dryMassInput.value ?? "78000";
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
			dryMassStr = "78000";
			dryMassInput.value = "78000";
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
		if (resultAPeakLorentz) resultAPeakLorentz.textContent = "";
		if (resultAPeakLorentzSub) resultAPeakLorentzSub.textContent = "";

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
				const lorentz = rl.lorentzFactor(relVel);

				if (!lorentz.isFinite() || relVel.gte(rl.c)) {
					if (resultA2)
						setElement(resultA2, "Precision limit exceeded — reduce acceleration or time", "");
					pendingCalculation = null;
					return;
				}

				const contractedM = rl.one.div(lorentz);
				const contractedNum = contractedM.toNumber();
				let contractedStr: string;
				if (contractedNum >= 0.01) {
					contractedStr = `${rl.formatSignificant(contractedM.mul(100), "0", 2)}cm`;
				} else if (contractedNum >= 0.00001) {
					contractedStr = `${rl.formatSignificant(contractedM.mul(1000), "0", 2)}mm`;
				} else {
					contractedStr = `${rl.formatSignificant(contractedM.mul(1000000), "0", 2)}μm`;
				}
				const relDistC = relDist.div(rl.lightYear);
				const relDistKm = relDist.div(1000);
				const relDistAU = relDist.div(rl.au);
				const coordTimeSec = rl.coordinateTime(accel, secs);

				// Calculate fuel fraction using user-provided efficiency
				const dryMass = rl.ensure(dryMassStr);
				const efficiency = rl.ensure(efficiencyStr);
				const fuelFraction = rl.pionRocketFuelFraction(secs, accel, efficiency);
				const fuelMass = fuelFraction.mul(dryMass).div(rl.one.minus(fuelFraction));
				const fuelPercent = fuelFraction.mul(100);

				if (resultA1) setElement(resultA1, rl.formatSignificant(relVel, "9", 2), "m/s");
				if (resultA2) {
					const timeDiffSec = coordTimeSec.minus(secs);
					const coordFormatted = rl.formatDurationAutoUnit(coordTimeSec);
					const diffFormatted = rl.formatDurationAutoUnit(timeDiffSec);
					setElement(
						resultA2,
						`${coordFormatted.value} ${coordFormatted.units} (+${diffFormatted.value} ${diffFormatted.units})`,
						""
					);
				}
				if (resultA1b) setElement(resultA1b, rl.formatSignificant(relVelC, "9", 3), "c");
				if (resultA2b) {
					const distanceFormatted = rl.formatDistanceAutoUnit(relDistC, relDistKm, relDistAU);
					setElement(resultA2b, distanceFormatted.value, distanceFormatted.units);
				}
				if (resultAFuel) setElement(resultAFuel, rl.formatMassWithUnit(fuelMass), "");
				if (resultAFuelFraction)
					setElement(resultAFuelFraction, rl.formatSignificant(fuelPercent, "9", 2), "%");

				if (resultAPeakLorentz)
					setElement(resultAPeakLorentz, rl.formatSignificant(lorentz, "0", 2), "");
				if (resultAPeakLorentzSub)
					setElement(resultAPeakLorentzSub, `1m shrinks to ${contractedStr}`, "");

				// Estimate stars in range - use distance in light years
				const distanceLightYears = relDistC.toNumber();
				if (distanceLightYears >= 100000) {
					// At or above 100k ly, show "Entire galaxy"
					if (resultAStars) setElement(resultAStars, "Entire galaxy", "");
					if (resultAGalaxyFraction) setElement(resultAGalaxyFraction, "100% of galaxy", "");
				} else {
					const starEstimate = extra.estimateStarsInSphere(distanceLightYears);
					const starsFormatted = extra.formatStarCount(starEstimate.stars);
					const fractionPercent = rl.formatSignificant(
						new Decimal(starEstimate.fraction * 100),
						"0",
						1
					);
					if (resultAStars) setElement(resultAStars, starsFormatted, "");
					if (resultAGalaxyFraction)
						setElement(resultAGalaxyFraction, `${fractionPercent}% of galaxy`, "");
				}

				// Update charts - parseFloat is OK here as Chart.js only needs limited precision for display
				const accelG = parseFloat(accelGStr);
				const durationDays = parseFloat(timeStr);
				const efficiencyNum = parseFloat(efficiencyStr);
				const data = generateAccelChartData(accelG, durationDays, efficiencyNum);
				chartRegistry.current = updateAccelCharts(chartRegistry.current, data, efficiencyNum, {
					velocity: chartTimeModes.accelVelocity,
					lorentz: chartTimeModes.accelLorentz,
					rapidity: chartTimeModes.accelRapidity,
				});
				pendingCalculation = null;
			}, 0);
		});
	};
}
