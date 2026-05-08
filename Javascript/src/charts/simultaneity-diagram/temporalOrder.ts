import { lorentzTransform } from "../minkowski-core";
import { COLORS as D3_COLORS } from "../minkowski-colors";

export function calculateTemporalOrder(
	eventCt: number,
	eventX: number,
	refCt: number,
	refX: number,
	beta: number
): "future" | "past" | "simultaneous" {
	const eventPrime = lorentzTransform(eventCt, eventX, beta);
	const refPrime = lorentzTransform(refCt, refX, beta);
	const deltaCtPrime = eventPrime.ctPrime - refPrime.ctPrime;

	if (Math.abs(deltaCtPrime) < 0.01) return "simultaneous";
	return deltaCtPrime > 0 ? "future" : "past";
}

export function getEventColor(
	order: "future" | "past" | "simultaneous",
	isReference: boolean
): string {
	if (isReference) return D3_COLORS.electricBlue;
	switch (order) {
		case "future":
			return D3_COLORS.quantumGreen;
		case "past":
			return D3_COLORS.photonGold;
		case "simultaneous":
			return D3_COLORS.plasmaWhite;
	}
}
