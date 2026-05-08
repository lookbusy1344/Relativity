import Decimal from "decimal.js";
import * as extra from "../../extra_lib";
import * as rl from "../../relativity_lib";
import { generateFlipBurnChartData } from "../../charts/dataGeneration";
import { updateFlipBurnCharts, type ChartRegistry } from "../../charts/charts";
import { setElement } from "../domUtils";
import { chartTimeModes } from "./chartTimeMode";

export function createFlipBurnHandler(
	getAccelInput: () => HTMLInputElement | null,
	getDistanceInput: () => HTMLInputElement | null,
	getDryMassInput: () => HTMLInputElement | null,
	getEfficiencyInput: () => HTMLInputElement | null,
	getResults: () => (HTMLElement | null)[],
	chartRegistry: { current: ChartRegistry },
	getDistUnit: () => "ly" | "ld" = () => "ly"
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
			resultFlip7,
			resultFlipFuel,
			resultFlipFuelFraction,
			resultFlipStars,
			resultFlipGalaxyFraction,
		] = getResults();
		if (!accelInput || !distanceInput || !dryMassInput || !efficiencyInput) return;

		if (pendingRAF !== null) {
			cancelAnimationFrame(pendingRAF);
			pendingRAF = null;
		}
		if (pendingCalculation !== null) {
			clearTimeout(pendingCalculation);
			pendingCalculation = null;
		}

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

		const isLightDays = getDistUnit() === "ld";
		const daysPerYear = new Decimal("365.25");

		let distanceLightYearsStr: string;
		try {
			const rawDec = rl.ensure(distanceInput.value ?? "0");
			const lyDec = isLightDays ? rawDec.div(daysPerYear) : rawDec;
			if (rawDec.lt(0.0001)) {
				distanceInput.value = "0.0001";
				distanceLightYearsStr = isLightDays
					? new Decimal("0.0001").div(daysPerYear).toFixed()
					: "0.0001";
			} else if (lyDec.gt(100000000000)) {
				distanceLightYearsStr = "100000000000";
				distanceInput.value = isLightDays
					? daysPerYear.mul("100000000000").toFixed()
					: "100000000000";
			} else {
				distanceLightYearsStr = lyDec.toFixed();
			}
		} catch {
			distanceLightYearsStr = "4";
			distanceInput.value = isLightDays ? daysPerYear.mul("4").toFixed() : "4";
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

		if (resultFlip1) resultFlip1.textContent = "Working...";
		if (resultFlip2) resultFlip2.textContent = "";
		if (resultFlip3) resultFlip3.textContent = "";
		if (resultFlip4) resultFlip4.textContent = "";
		if (resultFlip5) resultFlip5.textContent = "";
		if (resultFlip7) resultFlip7.textContent = "";
		if (resultFlipFuel) resultFlipFuel.textContent = "";
		if (resultFlipFuelFraction) resultFlipFuelFraction.textContent = "";
		if (resultFlipStars) resultFlipStars.textContent = "";
		if (resultFlipGalaxyFraction) resultFlipGalaxyFraction.textContent = "";

		pendingRAF = requestAnimationFrame(() => {
			pendingRAF = null;
			pendingCalculation = window.setTimeout(() => {
				const accel = rl.g.mul(accelGStr);
				const m = rl.ensure(distanceLightYearsStr).mul(rl.lightYear);
				const res = rl.flipAndBurn(accel, m);
				const peak = res.peakVelocity.div(rl.c);
				const lorentz = res.lorentzFactor;

				if (!lorentz.isFinite() || res.peakVelocity.gte(rl.c)) {
					if (resultFlip1)
						setElement(
							resultFlip1,
							"Precision limit exceeded — reduce acceleration or distance",
							""
						);
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
				const distanceLY = rl.ensure(distanceLightYearsStr);
				const contractedLY = distanceLY.div(lorentz);

				const dryMass = rl.ensure(dryMassStr);
				const efficiency = rl.ensure(efficiencyStr);
				const fuelFraction = rl.pionRocketFuelFraction(res.properTime, accel, efficiency);
				const fuelMass = fuelFraction.mul(dryMass).div(rl.one.minus(fuelFraction));
				const fuelPercent = fuelFraction.mul(100);

				if (resultFlip1) {
					const f = rl.formatDurationAutoUnit(res.properTime);
					setElement(resultFlip1, f.value, f.units);
				}
				if (resultFlip2) setElement(resultFlip2, rl.formatSignificant(peak, "9", 2), "c");
				if (resultFlip4) {
					const coordFormatted = rl.formatDurationAutoUnit(res.coordTime);
					const diffFormatted = rl.formatDurationAutoUnit(res.coordTime.minus(res.properTime));
					setElement(
						resultFlip4,
						`${coordFormatted.value} ${coordFormatted.units} (+${diffFormatted.value} ${diffFormatted.units})`,
						""
					);
				}
				if (resultFlip3) setElement(resultFlip3, rl.formatSignificant(lorentz, "0", 2), "");
				if (resultFlip5) setElement(resultFlip5, `1m shrinks to ${contractedStr}`, "");
				if (resultFlip7) {
					const distUnit = isLightDays ? "ld" : "ly";
					const displayDist = isLightDays ? distanceLY.mul(daysPerYear) : distanceLY;
					const displayContracted = isLightDays ? contractedLY.mul(daysPerYear) : contractedLY;
					const contractedLabel = isLightDays
						? `Distance shrinks to ${rl.formatSignificant(displayContracted, "0", 2)}${distUnit}`
						: `${rl.formatSignificant(displayDist, "0", 2)}${distUnit} shrinks to ${rl.formatSignificant(displayContracted, "0", 2)}${distUnit}`;
					setElement(resultFlip7, contractedLabel, "");
				}
				if (resultFlipFuel) setElement(resultFlipFuel, rl.formatMassWithUnit(fuelMass), "");
				if (resultFlipFuelFraction)
					setElement(resultFlipFuelFraction, rl.formatSignificant(fuelPercent, "9", 2), "%");

				const accelG = parseFloat(accelGStr);
				const distanceLightYears = parseFloat(distanceLightYearsStr);

				if (distanceLightYears >= 100000) {
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
				const efficiencyNum = parseFloat(efficiencyStr);
				const data = generateFlipBurnChartData(accelG, distanceLightYears, efficiencyNum);
				chartRegistry.current = updateFlipBurnCharts(chartRegistry.current, data, efficiencyNum, {
					velocity: chartTimeModes.flipVelocity,
					lorentz: chartTimeModes.flipLorentz,
					rapidity: chartTimeModes.flipRapidity,
				});
				pendingCalculation = null;
			}, 0);
		});
	};
}
