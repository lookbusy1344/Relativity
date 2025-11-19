/**
 * Pure functions for generating chart-ready data from physics calculations
 * Converts Decimal.js results to numbers for Chart.js compatibility
 */

import * as rl from '../relativity_lib';

export type ChartDataPoint = { x: number; y: number };
export type ChartDataPointWithVelocity = { x: number; y: number; velocity: number };

export function generateAccelChartData(
    accelG: number,
    durationDays: number
): {
    properTimeVelocity: ChartDataPoint[];
    coordTimeVelocity: ChartDataPoint[];
    properTimeRapidity: ChartDataPoint[];
    coordTimeRapidity: ChartDataPoint[];
    properTimeTimeDilation: ChartDataPoint[];
    coordTimeTimeDilation: ChartDataPoint[];
    properTimeMassRemaining40: ChartDataPoint[];
    properTimeMassRemaining50: ChartDataPoint[];
    properTimeMassRemaining60: ChartDataPoint[];
    properTimeMassRemaining70: ChartDataPoint[];
    positionVelocity: ChartDataPoint[];  // NEW: {x: distance_ly, y: velocity_c}
    spacetimeWorldline: ChartDataPointWithVelocity[];  // NEW: {x: coord_time_years, y: distance_ly, velocity}
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
    const properTimeMassRemaining40: ChartDataPoint[] = [];
    const properTimeMassRemaining50: ChartDataPoint[] = [];
    const properTimeMassRemaining60: ChartDataPoint[] = [];
    const properTimeMassRemaining70: ChartDataPoint[] = [];
    const positionVelocity: ChartDataPoint[] = [];
    const spacetimeWorldline: ChartDataPointWithVelocity[] = [];

    for (let i = 0; i <= numPoints; i++) {
        const tau = (i / numPoints) * durationSeconds;
        const tauDays = tau / (60 * 60 * 24);

        const velocity = rl.relativisticVelocity(accel, tau);
        const velocityC = parseFloat(velocity.div(rl.c).toString());
        const rapidity = rl.rapidityFromVelocity(velocity);
        const rapidityValue = parseFloat(rapidity.toString());
        const lorentz = rl.lorentzFactor(velocity);
        const timeDilation = parseFloat(rl.one.div(lorentz).toString());

        const t = rl.coordinateTime(accel, tau);
        const tDays = parseFloat(t.div(rl.ensure(60 * 60 * 24)).toString());

        // Calculate mass remaining as percentage for all efficiencies
        const fuelFraction40 = rl.pionRocketFuelFraction(tau, accel, 0.4);
        const massRemaining40 = parseFloat(rl.one.minus(fuelFraction40).mul(100).toString());
        const fuelFraction50 = rl.pionRocketFuelFraction(tau, accel, 0.5);
        const massRemaining50 = parseFloat(rl.one.minus(fuelFraction50).mul(100).toString());
        const fuelFraction60 = rl.pionRocketFuelFraction(tau, accel, 0.6);
        const massRemaining60 = parseFloat(rl.one.minus(fuelFraction60).mul(100).toString());
        const fuelFraction70 = rl.pionRocketFuelFraction(tau, accel, 0.7);
        const massRemaining70 = parseFloat(rl.one.minus(fuelFraction70).mul(100).toString());

        properTimeVelocity.push({ x: tauDays, y: velocityC });
        coordTimeVelocity.push({ x: tDays, y: velocityC });
        properTimeRapidity.push({ x: tauDays, y: rapidityValue });
        coordTimeRapidity.push({ x: tDays, y: rapidityValue });
        properTimeTimeDilation.push({ x: tauDays, y: timeDilation });
        coordTimeTimeDilation.push({ x: tDays, y: timeDilation });
        properTimeMassRemaining40.push({ x: tauDays, y: massRemaining40 });
        properTimeMassRemaining50.push({ x: tauDays, y: massRemaining50 });
        properTimeMassRemaining60.push({ x: tauDays, y: massRemaining60 });
        properTimeMassRemaining70.push({ x: tauDays, y: massRemaining70 });

        // Calculate distance for phase space plots
        const distance = rl.relativisticDistance(accel, tau);
        const distanceLy = parseFloat(distance.div(rl.lightYear).toString());

        // Position-velocity phase space
        positionVelocity.push({ x: distanceLy, y: velocityC });

        // Spacetime worldline (coord time vs distance) with velocity for gradient
        spacetimeWorldline.push({ x: tDays / 365.25, y: distanceLy, velocity: velocityC });
    }

    return {
        properTimeVelocity,
        coordTimeVelocity,
        properTimeRapidity,
        coordTimeRapidity,
        properTimeTimeDilation,
        coordTimeTimeDilation,
        properTimeMassRemaining40,
        properTimeMassRemaining50,
        properTimeMassRemaining60,
        properTimeMassRemaining70,
        positionVelocity,
        spacetimeWorldline
    };
}

export function generateFlipBurnChartData(
    distanceLightYears: number
): {
    properTimeVelocity: ChartDataPoint[];
    coordTimeVelocity: ChartDataPoint[];
    properTimeRapidity: ChartDataPoint[];
    coordTimeRapidity: ChartDataPoint[];
    properTimeLorentz: ChartDataPoint[];
    coordTimeLorentz: ChartDataPoint[];
    properTimeMassRemaining40: ChartDataPoint[];
    properTimeMassRemaining50: ChartDataPoint[];
    properTimeMassRemaining60: ChartDataPoint[];
    properTimeMassRemaining70: ChartDataPoint[];
    positionVelocityAccel: ChartDataPoint[];  // NEW: acceleration phase
    positionVelocityDecel: ChartDataPoint[];  // NEW: deceleration phase
    spacetimeWorldline: ChartDataPointWithVelocity[];  // NEW: S-curve with velocity
} {
    const m = rl.ensure(distanceLightYears).mul(rl.lightYear);
    const res = rl.flipAndBurn(rl.g, m);
    const halfProperTimeSeconds = res.properTime.div(2);
    const numPointsPerPhase = 50;

    const properTimeVelocity: ChartDataPoint[] = [];
    const coordTimeVelocity: ChartDataPoint[] = [];
    const properTimeRapidity: ChartDataPoint[] = [];
    const coordTimeRapidity: ChartDataPoint[] = [];
    const properTimeLorentz: ChartDataPoint[] = [];
    const coordTimeLorentz: ChartDataPoint[] = [];
    const properTimeMassRemaining40: ChartDataPoint[] = [];
    const properTimeMassRemaining50: ChartDataPoint[] = [];
    const properTimeMassRemaining60: ChartDataPoint[] = [];
    const properTimeMassRemaining70: ChartDataPoint[] = [];
    const positionVelocityAccel: ChartDataPoint[] = [];
    const positionVelocityDecel: ChartDataPoint[] = [];
    const spacetimeWorldline: ChartDataPointWithVelocity[] = [];

    // Acceleration phase (0 to half proper time)
    for (let i = 0; i <= numPointsPerPhase; i++) {
        const tau = halfProperTimeSeconds.mul(i / numPointsPerPhase);
        const tauYears = parseFloat(tau.div(rl.secondsPerYear).toString());

        const velocity = rl.relativisticVelocity(rl.g, tau);
        const velocityC = parseFloat(velocity.div(rl.c).toString());
        const rapidity = rl.rapidityFromVelocity(velocity);
        const rapidityValue = parseFloat(rapidity.toString());
        const lorentz = rl.lorentzFactor(velocity);
        const timeDilation = parseFloat(rl.one.div(lorentz).toString());

        // Calculate mass remaining (fuel burned for thrust time so far)
        const fuelFraction40 = rl.pionRocketFuelFraction(tau, rl.g, 0.4);
        const massRemaining40 = parseFloat(rl.one.minus(fuelFraction40).mul(100).toString());
        const fuelFraction50 = rl.pionRocketFuelFraction(tau, rl.g, 0.5);
        const massRemaining50 = parseFloat(rl.one.minus(fuelFraction50).mul(100).toString());
        const fuelFraction60 = rl.pionRocketFuelFraction(tau, rl.g, 0.6);
        const massRemaining60 = parseFloat(rl.one.minus(fuelFraction60).mul(100).toString());
        const fuelFraction70 = rl.pionRocketFuelFraction(tau, rl.g, 0.7);
        const massRemaining70 = parseFloat(rl.one.minus(fuelFraction70).mul(100).toString());

        properTimeVelocity.push({ x: tauYears, y: velocityC });

        const t = rl.coordinateTime(rl.g, tau);
        const tYears = parseFloat(t.div(rl.secondsPerYear).toString());
        coordTimeVelocity.push({ x: tYears, y: velocityC });

        properTimeRapidity.push({ x: tauYears, y: rapidityValue });
        coordTimeRapidity.push({ x: tYears, y: rapidityValue });
        properTimeLorentz.push({ x: tauYears, y: timeDilation });
        coordTimeLorentz.push({ x: tYears, y: timeDilation });
        properTimeMassRemaining40.push({ x: tauYears, y: massRemaining40 });
        properTimeMassRemaining50.push({ x: tauYears, y: massRemaining50 });
        properTimeMassRemaining60.push({ x: tauYears, y: massRemaining60 });
        properTimeMassRemaining70.push({ x: tauYears, y: massRemaining70 });

        // Calculate distance traveled so far
        const distance = rl.relativisticDistance(rl.g, tau);
        const distanceLy = parseFloat(distance.div(rl.lightYear).toString());

        // Position-velocity phase space (acceleration phase)
        positionVelocityAccel.push({ x: distanceLy, y: velocityC });

        // Spacetime worldline with velocity for gradient
        spacetimeWorldline.push({ x: tYears, y: distanceLy, velocity: velocityC });
    }

    // Deceleration phase - mirror the acceleration phase
    // Start from i=49 down to i=0 (numPointsPerPhase points)
    for (let i = numPointsPerPhase - 1; i >= 0; i--) {
        const tauAccel = halfProperTimeSeconds.mul((i + 1) / numPointsPerPhase);
        const tauDecel = res.properTime.sub(tauAccel);
        const tauYears = parseFloat(tauDecel.div(rl.secondsPerYear).toString());

        const velocity = rl.relativisticVelocity(rl.g, tauAccel);
        const velocityC = parseFloat(velocity.div(rl.c).toString());
        const rapidity = rl.rapidityFromVelocity(velocity);
        const rapidityValue = parseFloat(rapidity.toString());
        const lorentz = rl.lorentzFactor(velocity);
        const timeDilation = parseFloat(rl.one.div(lorentz).toString());

        // Total thrust time = half (accel) + time into decel phase
        const decelThrust = halfProperTimeSeconds.sub(tauAccel);
        const totalThrustTime = halfProperTimeSeconds.plus(decelThrust);
        const fuelFraction40 = rl.pionRocketFuelFraction(totalThrustTime, rl.g, 0.4);
        const massRemaining40 = parseFloat(rl.one.minus(fuelFraction40).mul(100).toString());
        const fuelFraction50 = rl.pionRocketFuelFraction(totalThrustTime, rl.g, 0.5);
        const massRemaining50 = parseFloat(rl.one.minus(fuelFraction50).mul(100).toString());
        const fuelFraction60 = rl.pionRocketFuelFraction(totalThrustTime, rl.g, 0.6);
        const massRemaining60 = parseFloat(rl.one.minus(fuelFraction60).mul(100).toString());
        const fuelFraction70 = rl.pionRocketFuelFraction(totalThrustTime, rl.g, 0.7);
        const massRemaining70 = parseFloat(rl.one.minus(fuelFraction70).mul(100).toString());

        properTimeVelocity.push({ x: tauYears, y: velocityC });

        const tAccel = rl.coordinateTime(rl.g, tauAccel);
        const tDecel = res.coordTime.sub(tAccel);
        const tYears = parseFloat(tDecel.div(rl.secondsPerYear).toString());
        coordTimeVelocity.push({ x: tYears, y: velocityC });

        properTimeRapidity.push({ x: tauYears, y: rapidityValue });
        coordTimeRapidity.push({ x: tYears, y: rapidityValue });
        properTimeLorentz.push({ x: tauYears, y: timeDilation });
        coordTimeLorentz.push({ x: tYears, y: timeDilation });
        properTimeMassRemaining40.push({ x: tauYears, y: massRemaining40 });
        properTimeMassRemaining50.push({ x: tauYears, y: massRemaining50 });
        properTimeMassRemaining60.push({ x: tauYears, y: massRemaining60 });
        properTimeMassRemaining70.push({ x: tauYears, y: massRemaining70 });

        // During deceleration, distance continues increasing from halfDistance to totalDistance
        // tauAccel represents equivalent accel time for current velocity
        const remainingAccelDistance = rl.relativisticDistance(rl.g, tauAccel);
        const totalDistance = rl.ensure(distanceLightYears).mul(rl.lightYear);
        const currentDistance = totalDistance.minus(remainingAccelDistance);
        const currentDistanceLy = parseFloat(currentDistance.div(rl.lightYear).toString());

        // Position-velocity phase space (deceleration phase - creates return path of loop)
        positionVelocityDecel.push({ x: currentDistanceLy, y: velocityC });

        // Spacetime worldline with velocity for gradient
        spacetimeWorldline.push({ x: tYears, y: currentDistanceLy, velocity: velocityC });
    }

    return {
        properTimeVelocity,
        coordTimeVelocity,
        properTimeRapidity,
        coordTimeRapidity,
        properTimeLorentz,
        coordTimeLorentz,
        properTimeMassRemaining40,
        properTimeMassRemaining50,
        properTimeMassRemaining60,
        properTimeMassRemaining70,
        positionVelocityAccel,
        positionVelocityDecel,
        spacetimeWorldline
    };
}

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

        const velocity = rl.relativisticVelocity(accel, tau);
        const velocityCValue = parseFloat(velocity.div(rl.c).toString());
        const distance = rl.relativisticDistance(accel, tau);
        const distanceLyValue = parseFloat(distance.div(rl.lightYear).toString());
        const rapidityValue = parseFloat(rl.rapidityFromVelocity(velocity).toString());
        const lorentz = rl.lorentzFactor(velocity);
        const timeDilationValue = parseFloat(rl.one.div(lorentz).toString());

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
        timeDilation
    };
}
