import * as rl from "../../relativity_lib";
import type { ChartDataPoint } from "./types";

export function generateTwinParadoxChartData(
	velocityC: number,
	properTimeYears: number
): {
	velocityProfile: ChartDataPoint[];
	travelingTwinAging: ChartDataPoint[];
	earthTwinAging: ChartDataPoint[];
	distanceProfile: ChartDataPoint[];
	properTimeDistance: ChartDataPoint[];
	coordTimeDistance: ChartDataPoint[];
} {
	const numPoints = 100;
	const halfTimeDecimal = rl.ensure(properTimeYears / 2);

	const velocityDecimal = rl.c.mul(velocityC);
	const gammaDecimal = rl.lorentzFactor(velocityDecimal);

	const velocityCDecimal = rl.ensure(velocityC);

	const velocityProfile: ChartDataPoint[] = [];
	const travelingTwinAging: ChartDataPoint[] = [];
	const earthTwinAging: ChartDataPoint[] = [];
	const distanceProfile: ChartDataPoint[] = [];
	const properTimeDistance: ChartDataPoint[] = [];
	const coordTimeDistance: ChartDataPoint[] = [];

	for (let i = 0; i <= numPoints / 2; i++) {
		const tauDecimal = rl.ensure((i / numPoints) * properTimeYears);
		const tau = tauDecimal.toNumber();
		const earthTimeDecimal = tauDecimal.mul(gammaDecimal);
		const earthTime = earthTimeDecimal.toNumber();

		velocityProfile.push({
			x: tau,
			y: velocityC,
			xDecimal: tauDecimal,
			yDecimal: velocityCDecimal,
		});

		travelingTwinAging.push({
			x: tau,
			y: tau,
			xDecimal: tauDecimal,
			yDecimal: tauDecimal,
		});
		earthTwinAging.push({
			x: tau,
			y: earthTime,
			xDecimal: tauDecimal,
			yDecimal: earthTimeDecimal,
		});

		const distanceDecimal = velocityCDecimal.mul(earthTimeDecimal);
		const distance = distanceDecimal.toNumber();
		distanceProfile.push({
			x: tau,
			y: distance,
			xDecimal: tauDecimal,
			yDecimal: distanceDecimal,
		});
		properTimeDistance.push({
			x: tau,
			y: distance,
			xDecimal: tauDecimal,
			yDecimal: distanceDecimal,
		});
		coordTimeDistance.push({
			x: earthTime,
			y: distance,
			xDecimal: earthTimeDecimal,
			yDecimal: distanceDecimal,
		});
	}

	for (let i = Math.floor(numPoints / 2) + 1; i <= numPoints; i++) {
		const tauDecimal = rl.ensure((i / numPoints) * properTimeYears);
		const tau = tauDecimal.toNumber();
		const earthTimeDecimal = tauDecimal.mul(gammaDecimal);
		const earthTime = earthTimeDecimal.toNumber();

		const negativeVelocityCDecimal = velocityCDecimal.neg();
		const negativeVelocityC = negativeVelocityCDecimal.toNumber();
		velocityProfile.push({
			x: tau,
			y: negativeVelocityC,
			xDecimal: tauDecimal,
			yDecimal: negativeVelocityCDecimal,
		});

		travelingTwinAging.push({
			x: tau,
			y: tau,
			xDecimal: tauDecimal,
			yDecimal: tauDecimal,
		});
		earthTwinAging.push({
			x: tau,
			y: earthTime,
			xDecimal: tauDecimal,
			yDecimal: earthTimeDecimal,
		});

		const tauSinceTurnaroundDecimal = tauDecimal.minus(halfTimeDecimal);
		const maxDistanceDecimal = velocityCDecimal.mul(halfTimeDecimal).mul(gammaDecimal);
		const distanceDecimal = maxDistanceDecimal.minus(
			velocityCDecimal.mul(tauSinceTurnaroundDecimal).mul(gammaDecimal)
		);
		const distance = distanceDecimal.toNumber();
		distanceProfile.push({
			x: tau,
			y: distance,
			xDecimal: tauDecimal,
			yDecimal: distanceDecimal,
		});
		properTimeDistance.push({
			x: tau,
			y: distance,
			xDecimal: tauDecimal,
			yDecimal: distanceDecimal,
		});
		coordTimeDistance.push({
			x: earthTime,
			y: distance,
			xDecimal: earthTimeDecimal,
			yDecimal: distanceDecimal,
		});
	}

	return {
		velocityProfile,
		travelingTwinAging,
		earthTwinAging,
		distanceProfile,
		properTimeDistance,
		coordTimeDistance,
	};
}
