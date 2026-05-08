import * as rl from "../../relativity_lib";
import { setElement } from "../domUtils";

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
