/**
 * Event handler factory functions
 * Coordinate between DOM, physics, data generation, and charts
 */

import Decimal from "decimal.js";
import * as rl from "../relativity_lib";
import { setElement } from "./domUtils";
import {
	generateVisualizationChartData,
	generateTwinParadoxChartData,
} from "../charts/dataGeneration";
import {
	updateVisualizationCharts,
	updateTwinParadoxCharts,
	type ChartRegistry,
} from "../charts/charts";
import { drawMinkowskiDiagramD3, type MinkowskiData } from "../charts/minkowski";
import { drawTwinParadoxMinkowski, type TwinParadoxMinkowskiData } from "../charts/minkowski-twins";

export {
	createAddVelocitiesHandler,
	createAccelHandler,
	createChartTimeModeHandler,
	createLorentzHandler,
	createMassChartSliderHandler,
	createRapidityFromVelocityHandler,
	createPositionVelocitySliderHandler,
	createVelocityFromRapidityHandler,
	distanceToSlider,
	getChartTimeModes,
	initializeMassChartSlider,
	initializePositionVelocitySlider,
	setChartTimeMode,
	sliderToDistance,
	createFlipBurnHandler,
	createWarpDriveHandler,
} from "./handlers";

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
		const efficiency = rl.ensure(efficiencyStr);

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
		const accelG = rl.ensure(accelGStr);
		const thrustTimeDays = rl.ensure(thrustTimeInput.value ?? 365);
		const thrustTimeSeconds = thrustTimeDays.mul(60 * 60 * 24);
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
		const efficiency = rl.ensure(efficiencyStr);
		let dryMassStr = dryMassInput.value ?? "1000";
		try {
			const dryMassDec = rl.ensure(dryMassStr);
			if (dryMassDec.lt(1)) {
				dryMassStr = "1";
				dryMassInput.value = "1";
			}
		} catch {
			dryMassStr = "1000";
			dryMassInput.value = "1000";
		}
		const dryMass = rl.ensure(dryMassStr);

		const accel = rl.g.mul(accelG);
		const fuelFraction = rl.pionRocketFuelFraction(thrustTimeSeconds, accel, efficiency);
		const fuelFractionPercent = fuelFraction.mul(100);

		// Calculate fuel mass: fuel_mass = (fuel_fraction × dry_mass) / (1 - fuel_fraction)
		// Decimal.js at 150dp retains full precision even when fuelFraction is very close to 1,
		// so no epsilon guard is needed.
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
