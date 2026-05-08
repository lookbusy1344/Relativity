import * as rl from "../../relativity_lib";
import { C } from "../minkowski-core";
import type { TwinParadoxMinkowskiData } from "./types";

export function formatVelocityMs(velocityC: number): string {
	const velocityMs = rl.c.mul(velocityC);
	return rl.formatSignificant(velocityMs, "9", 2);
}

export function calculateEvents(data: TwinParadoxMinkowskiData): {
	departure: { ct: number; x: number };
	turnaround: { ct: number; x: number };
	arrival: { ct: number; x: number };
	maxCoord: number;
} {
	const earthTimeSec = data.earthTimeYears * 365.25 * 24 * 3600;
	const distanceKm = data.distanceLY * 9.4607e12;

	const departure = { ct: 0, x: 0 };
	const turnaround = {
		ct: (earthTimeSec / 2) * C,
		x: distanceKm,
	};
	const arrival = {
		ct: earthTimeSec * C,
		x: 0,
	};

	const maxCoord =
		Math.max(
			Math.abs(turnaround.ct),
			Math.abs(turnaround.x),
			Math.abs(arrival.ct),
			Math.abs(arrival.x)
		) * 1.3;

	return { departure, turnaround, arrival, maxCoord };
}
