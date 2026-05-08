import * as rl from "../../relativity_lib";
import type { ChartDataPoint, ChartDataPointWithVelocity } from "./types";

export function generateAccelChartData(
	accelG: number,
	durationDays: number,
	nozzleEfficiency: number
): {
	properTimeVelocity: ChartDataPoint[];
	coordTimeVelocity: ChartDataPoint[];
	properTimeRapidity: ChartDataPoint[];
	coordTimeRapidity: ChartDataPoint[];
	properTimeTimeDilation: ChartDataPoint[];
	coordTimeTimeDilation: ChartDataPoint[];
	properTimeMassRemaining: ChartDataPoint[];
	positionVelocity: ChartDataPoint[];
	spacetimeWorldline: ChartDataPointWithVelocity[];
} {
	const accel = rl.g.mul(accelG);
	const durationSeconds = durationDays * 60 * 60 * 24;
	const numPoints = 100;

	const properTimeVelocity: ChartDataPoint[] = [];
	const coordTimeVelocity: ChartDataPoint[] = [];
	const properTimeRapidity: ChartDataPoint[] = [];
	const coordTimeRapidity: ChartDataPoint[] = [];
	const properTimeTimeDilation: ChartDataPoint[] = [];
	const coordTimeTimeDilation: ChartDataPoint[] = [];
	const properTimeMassRemaining: ChartDataPoint[] = [];
	const positionVelocity: ChartDataPoint[] = [];
	const spacetimeWorldline: ChartDataPointWithVelocity[] = [];

	for (let i = 0; i <= numPoints; i++) {
		const tauDecimal = rl.ensure((i / numPoints) * durationSeconds);
		const tauDaysDecimal = tauDecimal.div(rl.ensure(60 * 60 * 24));
		const tauDays = tauDaysDecimal.toNumber();

		const velocity = rl.relativisticVelocity(accel, tauDecimal);
		const velocityCDecimal = velocity.div(rl.c);
		const velocityC = velocityCDecimal.toNumber();

		const rapidityDecimal = rl.rapidityFromVelocity(velocity);
		const rapidity = rapidityDecimal.toNumber();
		const lorentz = rl.lorentzFactor(velocity);
		const timeDilationDecimal = rl.one.div(lorentz);
		const timeDilation = timeDilationDecimal.toNumber();

		const t = rl.coordinateTime(accel, tauDecimal);
		const tDaysDecimal = t.div(rl.ensure(60 * 60 * 24));
		const tDays = tDaysDecimal.toNumber();

		const fuelFraction = rl.pionRocketFuelFraction(tauDecimal, accel, nozzleEfficiency);
		const massRemainingDecimal = rl.one.minus(fuelFraction).mul(100);
		const massRemaining = massRemainingDecimal.toNumber();

		properTimeVelocity.push({
			x: tauDays,
			y: velocityC,
			xDecimal: tauDaysDecimal,
			yDecimal: velocityCDecimal,
		});

		coordTimeVelocity.push({
			x: tDays,
			y: velocityC,
			xDecimal: tDaysDecimal,
			yDecimal: velocityCDecimal,
		});

		properTimeRapidity.push({
			x: tauDays,
			y: rapidity,
			xDecimal: tauDaysDecimal,
			yDecimal: rapidityDecimal,
		});

		coordTimeRapidity.push({
			x: tDays,
			y: rapidity,
			xDecimal: tDaysDecimal,
			yDecimal: rapidityDecimal,
		});

		properTimeTimeDilation.push({
			x: tauDays,
			y: timeDilation,
			xDecimal: tauDaysDecimal,
			yDecimal: timeDilationDecimal,
		});

		coordTimeTimeDilation.push({
			x: tDays,
			y: timeDilation,
			xDecimal: tDaysDecimal,
			yDecimal: timeDilationDecimal,
		});
		properTimeMassRemaining.push({
			x: tauDays,
			y: massRemaining,
			xDecimal: tauDaysDecimal,
			yDecimal: massRemainingDecimal,
		});

		const distance = rl.relativisticDistance(accel, tauDecimal);
		const distanceLyDecimal = distance.div(rl.lightYear);
		const distanceLy = distanceLyDecimal.toNumber();

		positionVelocity.push({
			x: distanceLy,
			y: velocityC,
			xDecimal: distanceLyDecimal,
			yDecimal: velocityCDecimal,
		});

		const tYearsDecimal = tDaysDecimal.div(rl.ensure(365.25));
		const tYears = tYearsDecimal.toNumber();

		spacetimeWorldline.push({
			x: tYears,
			y: distanceLy,
			velocity: velocityC,
			xDecimal: tYearsDecimal,
			yDecimal: distanceLyDecimal,
			velocityDecimal: velocityCDecimal,
		});
	}

	return {
		properTimeVelocity,
		coordTimeVelocity,
		properTimeRapidity,
		coordTimeRapidity,
		properTimeTimeDilation,
		coordTimeTimeDilation,
		properTimeMassRemaining,
		positionVelocity,
		spacetimeWorldline,
	};
}
