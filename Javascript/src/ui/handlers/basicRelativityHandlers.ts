import * as rl from "../../relativity_lib";
import { setElement } from "../domUtils";

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
