import * as rl from "../../relativity_lib";
import { setElement } from "../domUtils";

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

		const distanceLightMinutes = rl.ensure(distanceInput.value ?? 30);
		const distanceMetres = distanceLightMinutes.mul(rl.c).mul(60);

		const boostVelocityC = rl.ensure(boostInput.value ?? 0.9);

		const transitMinutes = rl.ensure(transitInput.value ?? 0);
		const transitSeconds = transitMinutes.mul(60);

		const boostDurationMinutes = rl.ensure(boostDurationInput.value ?? 0);
		const boostDurationSeconds = boostDurationMinutes.mul(60);

		const result = rl.warpDriveTimeTravel(
			distanceMetres,
			boostVelocityC,
			transitSeconds,
			boostDurationSeconds
		);

		const boostVelocityMs = boostVelocityC.mul(rl.c);
		const lorentzFactor = rl.lorentzFactor(boostVelocityMs);

		const displacementMinutes = result.timeDisplacement.div(60);
		const simultaneityMinutes = result.simultaneityShift.div(60);
		const travelerTimeMinutes = result.travelerTime.div(60);

		const [dispResult, simResult, lorentzResult, travelerResult] = results;

		const dispFormatted = rl.formatTimeWithUnit(displacementMinutes.abs());
		const direction = displacementMinutes.isNegative() ? "into the past" : "into the future";
		setElement(dispResult!, `${dispFormatted.value} ${dispFormatted.units} ${direction}`, "");

		const simFormatted = rl.formatTimeWithUnit(simultaneityMinutes);
		setElement(simResult!, simFormatted.value, simFormatted.units);

		setElement(lorentzResult!, rl.formatSignificant(lorentzFactor, "", 3), "");

		const travelerFormatted = rl.formatTimeWithUnit(travelerTimeMinutes);
		setElement(travelerResult!, travelerFormatted.value, travelerFormatted.units);
	};
}
