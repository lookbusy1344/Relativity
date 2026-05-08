import * as rl from "../../relativity_lib";
import type { ChartDataPoint, ChartDataPointWithVelocity } from "./types";

export function generateFlipBurnChartData(
	accelG: number,
	distanceLightYears: number,
	nozzleEfficiency: number
): {
	properTimeVelocity: ChartDataPoint[];
	coordTimeVelocity: ChartDataPoint[];
	properTimeRapidity: ChartDataPoint[];
	coordTimeRapidity: ChartDataPoint[];
	properTimeLorentz: ChartDataPoint[];
	coordTimeLorentz: ChartDataPoint[];
	properTimeMassRemaining: ChartDataPoint[];
	positionVelocityAccel: ChartDataPoint[];
	positionVelocityDecel: ChartDataPoint[];
	spacetimeWorldline: ChartDataPointWithVelocity[];
} {
	const accel = rl.g.mul(accelG);
	const m = rl.ensure(distanceLightYears).mul(rl.lightYear);
	const res = rl.flipAndBurn(accel, m);
	const halfProperTimeSeconds = res.properTime.div(2);
	const numPointsPerPhase = 50;

	const properTimeVelocity: ChartDataPoint[] = [];
	const coordTimeVelocity: ChartDataPoint[] = [];
	const properTimeRapidity: ChartDataPoint[] = [];
	const coordTimeRapidity: ChartDataPoint[] = [];
	const properTimeLorentz: ChartDataPoint[] = [];
	const coordTimeLorentz: ChartDataPoint[] = [];
	const properTimeMassRemaining: ChartDataPoint[] = [];
	const positionVelocityAccel: ChartDataPoint[] = [];
	const positionVelocityDecel: ChartDataPoint[] = [];
	const spacetimeWorldline: ChartDataPointWithVelocity[] = [];

	for (let i = 0; i <= numPointsPerPhase; i++) {
		const tau = halfProperTimeSeconds.mul(i / numPointsPerPhase);
		const tauYearsDecimal = tau.div(rl.secondsPerYear);
		const tauYears = tauYearsDecimal.toNumber();

		const velocity = rl.relativisticVelocity(accel, tau);
		const velocityCDecimal = velocity.div(rl.c);
		const velocityC = velocityCDecimal.toNumber();

		const rapidityDecimal = rl.rapidityFromVelocity(velocity);
		const rapidity = rapidityDecimal.toNumber();

		const lorentz = rl.lorentzFactor(velocity);
		const timeDilationDecimal = rl.one.div(lorentz);
		const timeDilation = timeDilationDecimal.toNumber();

		const t = rl.coordinateTime(accel, tau);
		const tYearsDecimal = t.div(rl.secondsPerYear);
		const tYears = tYearsDecimal.toNumber();

		const fuelFraction = rl.pionRocketFuelFraction(tau, accel, nozzleEfficiency);
		const massRemainingDecimal = rl.one.minus(fuelFraction).mul(100);
		const massRemaining = massRemainingDecimal.toNumber();

		properTimeVelocity.push({
			x: tauYears,
			y: velocityC,
			xDecimal: tauYearsDecimal,
			yDecimal: velocityCDecimal,
		});

		coordTimeVelocity.push({
			x: tYears,
			y: velocityC,
			xDecimal: tYearsDecimal,
			yDecimal: velocityCDecimal,
		});

		properTimeRapidity.push({
			x: tauYears,
			y: rapidity,
			xDecimal: tauYearsDecimal,
			yDecimal: rapidityDecimal,
		});

		coordTimeRapidity.push({
			x: tYears,
			y: rapidity,
			xDecimal: tYearsDecimal,
			yDecimal: rapidityDecimal,
		});

		properTimeLorentz.push({
			x: tauYears,
			y: timeDilation,
			xDecimal: tauYearsDecimal,
			yDecimal: timeDilationDecimal,
		});

		coordTimeLorentz.push({
			x: tYears,
			y: timeDilation,
			xDecimal: tYearsDecimal,
			yDecimal: timeDilationDecimal,
		});

		properTimeMassRemaining.push({
			x: tauYears,
			y: massRemaining,
			xDecimal: tauYearsDecimal,
			yDecimal: massRemainingDecimal,
		});

		const distance = rl.relativisticDistance(accel, tau);
		const distanceLyDecimal = distance.div(rl.lightYear);
		const distanceLy = distanceLyDecimal.toNumber();

		positionVelocityAccel.push({
			x: distanceLy,
			y: velocityC,
			xDecimal: distanceLyDecimal,
			yDecimal: velocityCDecimal,
		});

		spacetimeWorldline.push({
			x: tYears,
			y: distanceLy,
			velocity: velocityC,
			xDecimal: tYearsDecimal,
			yDecimal: distanceLyDecimal,
			velocityDecimal: velocityCDecimal,
		});
	}

	for (let i = numPointsPerPhase; i >= 0; i--) {
		const tauAccel = halfProperTimeSeconds.mul(i / numPointsPerPhase);
		const tauDecel = res.properTime.sub(tauAccel);
		const tauYearsDecimal = tauDecel.div(rl.secondsPerYear);
		const tauYears = tauYearsDecimal.toNumber();

		const velocity = rl.relativisticVelocity(accel, tauAccel);
		const velocityCDecimal = velocity.div(rl.c);
		const velocityC = velocityCDecimal.toNumber();

		const rapidityDecimal = rl.rapidityFromVelocity(velocity);
		const rapidity = rapidityDecimal.toNumber();

		const lorentz = rl.lorentzFactor(velocity);
		const timeDilationDecimal = rl.one.div(lorentz);
		const timeDilation = timeDilationDecimal.toNumber();

		const decelThrust = halfProperTimeSeconds.sub(tauAccel);
		const totalThrustTime = halfProperTimeSeconds.plus(decelThrust);
		const fuelFraction = rl.pionRocketFuelFraction(totalThrustTime, accel, nozzleEfficiency);
		const massRemainingDecimal = rl.one.minus(fuelFraction).mul(100);
		const massRemaining = massRemainingDecimal.toNumber();

		const tAccel = rl.coordinateTime(accel, tauAccel);
		const tDecel = res.coordTime.sub(tAccel);
		const tYearsDecimal = tDecel.div(rl.secondsPerYear);
		const tYears = tYearsDecimal.toNumber();

		properTimeVelocity.push({
			x: tauYears,
			y: velocityC,
			xDecimal: tauYearsDecimal,
			yDecimal: velocityCDecimal,
		});

		coordTimeVelocity.push({
			x: tYears,
			y: velocityC,
			xDecimal: tYearsDecimal,
			yDecimal: velocityCDecimal,
		});

		properTimeRapidity.push({
			x: tauYears,
			y: rapidity,
			xDecimal: tauYearsDecimal,
			yDecimal: rapidityDecimal,
		});

		coordTimeRapidity.push({
			x: tYears,
			y: rapidity,
			xDecimal: tYearsDecimal,
			yDecimal: rapidityDecimal,
		});

		properTimeLorentz.push({
			x: tauYears,
			y: timeDilation,
			xDecimal: tauYearsDecimal,
			yDecimal: timeDilationDecimal,
		});

		coordTimeLorentz.push({
			x: tYears,
			y: timeDilation,
			xDecimal: tYearsDecimal,
			yDecimal: timeDilationDecimal,
		});

		properTimeMassRemaining.push({
			x: tauYears,
			y: massRemaining,
			xDecimal: tauYearsDecimal,
			yDecimal: massRemainingDecimal,
		});

		const remainingAccelDistance = rl.relativisticDistance(accel, tauAccel);
		const totalDistance = rl.ensure(distanceLightYears).mul(rl.lightYear);
		const currentDistance = totalDistance.minus(remainingAccelDistance);
		const currentDistanceLyDecimal = currentDistance.div(rl.lightYear);
		const currentDistanceLy = currentDistanceLyDecimal.toNumber();

		positionVelocityDecel.push({
			x: currentDistanceLy,
			y: velocityC,
			xDecimal: currentDistanceLyDecimal,
			yDecimal: velocityCDecimal,
		});

		spacetimeWorldline.push({
			x: tYears,
			y: currentDistanceLy,
			velocity: velocityC,
			xDecimal: tYearsDecimal,
			yDecimal: currentDistanceLyDecimal,
			velocityDecimal: velocityCDecimal,
		});
	}

	return {
		properTimeVelocity,
		coordTimeVelocity,
		properTimeRapidity,
		coordTimeRapidity,
		properTimeLorentz,
		coordTimeLorentz,
		properTimeMassRemaining,
		positionVelocityAccel,
		positionVelocityDecel,
		spacetimeWorldline,
	};
}
