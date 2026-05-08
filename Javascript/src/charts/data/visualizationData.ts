import * as rl from "../../relativity_lib";

export function generateVisualizationChartData(
	accelG: number,
	durationDays: number
): {
	timePoints: number[];
	velocityC: number[];
	distanceLy: number[];
	rapidity: number[];
	timeDilation: number[];
} {
	const accel = rl.g.mul(accelG);
	const durationSeconds = durationDays * 60 * 60 * 24;
	const numPoints = 100;

	const timePoints: number[] = [];
	const velocityC: number[] = [];
	const distanceLy: number[] = [];
	const rapidity: number[] = [];
	const timeDilation: number[] = [];

	for (let i = 0; i <= numPoints; i++) {
		const tau = (i / numPoints) * durationSeconds;
		const timeDays = tau / (60 * 60 * 24);

		const tauDecimal = rl.ensure(tau);
		const velocity = rl.relativisticVelocity(accel, tauDecimal);
		const velocityCValue = velocity.div(rl.c).toNumber();
		const distance = rl.relativisticDistance(accel, tauDecimal);
		const distanceLyValue = distance.div(rl.lightYear).toNumber();
		const rapidityValue = rl.rapidityFromVelocity(velocity).toNumber();
		const lorentz = rl.lorentzFactor(velocity);
		const timeDilationValue = rl.one.div(lorentz).toNumber();

		timePoints.push(timeDays);
		velocityC.push(velocityCValue);
		distanceLy.push(distanceLyValue);
		rapidity.push(rapidityValue);
		timeDilation.push(timeDilationValue);
	}

	return {
		timePoints,
		velocityC,
		distanceLy,
		rapidity,
		timeDilation,
	};
}
