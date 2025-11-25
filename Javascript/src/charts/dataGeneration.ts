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

        // Calculate mass remaining as percentage for all nozzle efficiencies
        const fuelPercents = rl.pionRocketFuelFractionsMultiple(tau, accel, [0.7, 0.75, 0.8, 0.85]);
        const [massRemaining70, massRemaining75, massRemaining80, massRemaining85] = 
            fuelPercents.map(fp => 100 - parseFloat(fp.toString()));

        properTimeVelocity.push({ x: tauDays, y: velocityC });
        coordTimeVelocity.push({ x: tDays, y: velocityC });
        properTimeRapidity.push({ x: tauDays, y: rapidityValue });
        coordTimeRapidity.push({ x: tDays, y: rapidityValue });
        properTimeTimeDilation.push({ x: tauDays, y: timeDilation });
        coordTimeTimeDilation.push({ x: tDays, y: timeDilation });
        properTimeMassRemaining40.push({ x: tauDays, y: massRemaining70 });
        properTimeMassRemaining50.push({ x: tauDays, y: massRemaining75 });
        properTimeMassRemaining60.push({ x: tauDays, y: massRemaining80 });
        properTimeMassRemaining70.push({ x: tauDays, y: massRemaining85 });

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
    accelG: number,
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

        const velocity = rl.relativisticVelocity(accel, tau);
        const velocityC = parseFloat(velocity.div(rl.c).toString());
        const rapidity = rl.rapidityFromVelocity(velocity);
        const rapidityValue = parseFloat(rapidity.toString());
        const lorentz = rl.lorentzFactor(velocity);
        const timeDilation = parseFloat(rl.one.div(lorentz).toString());

        // Calculate mass remaining (fuel burned for thrust time so far)
        const fuelPercents = rl.pionRocketFuelFractionsMultiple(tau, accel, [0.7, 0.75, 0.8, 0.85]);
        const [massRemaining70, massRemaining75, massRemaining80, massRemaining85] = 
            fuelPercents.map(fp => 100 - parseFloat(fp.toString()));

        properTimeVelocity.push({ x: tauYears, y: velocityC });

        const t = rl.coordinateTime(accel, tau);
        const tYears = parseFloat(t.div(rl.secondsPerYear).toString());
        coordTimeVelocity.push({ x: tYears, y: velocityC });

        properTimeRapidity.push({ x: tauYears, y: rapidityValue });
        coordTimeRapidity.push({ x: tYears, y: rapidityValue });
        properTimeLorentz.push({ x: tauYears, y: timeDilation });
        coordTimeLorentz.push({ x: tYears, y: timeDilation });
        properTimeMassRemaining40.push({ x: tauYears, y: massRemaining70 });
        properTimeMassRemaining50.push({ x: tauYears, y: massRemaining75 });
        properTimeMassRemaining60.push({ x: tauYears, y: massRemaining80 });
        properTimeMassRemaining70.push({ x: tauYears, y: massRemaining85 });

        // Calculate distance traveled so far
        const distance = rl.relativisticDistance(accel, tau);
        const distanceLy = parseFloat(distance.div(rl.lightYear).toString());

        // Position-velocity phase space (acceleration phase)
        positionVelocityAccel.push({ x: distanceLy, y: velocityC });

        // Spacetime worldline with velocity for gradient
        spacetimeWorldline.push({ x: tYears, y: distanceLy, velocity: velocityC });
    }

    // Deceleration phase - mirror the acceleration phase
    // Start from i=50 down to i=0 to connect smoothly with acceleration phase
    for (let i = numPointsPerPhase; i >= 0; i--) {
        const tauAccel = halfProperTimeSeconds.mul(i / numPointsPerPhase);
        const tauDecel = res.properTime.sub(tauAccel);
        const tauYears = parseFloat(tauDecel.div(rl.secondsPerYear).toString());

        const velocity = rl.relativisticVelocity(accel, tauAccel);
        const velocityC = parseFloat(velocity.div(rl.c).toString());
        const rapidity = rl.rapidityFromVelocity(velocity);
        const rapidityValue = parseFloat(rapidity.toString());
        const lorentz = rl.lorentzFactor(velocity);
        const timeDilation = parseFloat(rl.one.div(lorentz).toString());

        // Total thrust time = half (accel) + time into decel phase
        const decelThrust = halfProperTimeSeconds.sub(tauAccel);
        const totalThrustTime = halfProperTimeSeconds.plus(decelThrust);
        const fuelPercents = rl.pionRocketFuelFractionsMultiple(totalThrustTime, accel, [0.7, 0.75, 0.8, 0.85]);
        const [massRemaining70, massRemaining75, massRemaining80, massRemaining85] = 
            fuelPercents.map(fp => 100 - parseFloat(fp.toString()));

        properTimeVelocity.push({ x: tauYears, y: velocityC });

        const tAccel = rl.coordinateTime(accel, tauAccel);
        const tDecel = res.coordTime.sub(tAccel);
        const tYears = parseFloat(tDecel.div(rl.secondsPerYear).toString());
        coordTimeVelocity.push({ x: tYears, y: velocityC });

        properTimeRapidity.push({ x: tauYears, y: rapidityValue });
        coordTimeRapidity.push({ x: tYears, y: rapidityValue });
        properTimeLorentz.push({ x: tauYears, y: timeDilation });
        coordTimeLorentz.push({ x: tYears, y: timeDilation });
        properTimeMassRemaining40.push({ x: tauYears, y: massRemaining70 });
        properTimeMassRemaining50.push({ x: tauYears, y: massRemaining75 });
        properTimeMassRemaining60.push({ x: tauYears, y: massRemaining80 });
        properTimeMassRemaining70.push({ x: tauYears, y: massRemaining85 });

        // During deceleration, distance continues increasing from halfDistance to totalDistance
        // tauAccel represents equivalent accel time for current velocity
        const remainingAccelDistance = rl.relativisticDistance(accel, tauAccel);
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

export function generateTwinParadoxChartData(
    velocityC: number,
    properTimeYears: number
): {
    velocityProfile: ChartDataPoint[];
    travelingTwinAging: ChartDataPoint[];
    earthTwinAging: ChartDataPoint[];
    distanceProfile: ChartDataPoint[];
    spacetimeWorldline: ChartDataPoint[];
} {
    const numPoints = 100;
    const halfTime = properTimeYears / 2;

    // Calculate key physics values
    const velocity = rl.c.mul(velocityC);
    const gamma = parseFloat(rl.lorentzFactor(velocity).toString());

    const velocityProfile: ChartDataPoint[] = [];
    const travelingTwinAging: ChartDataPoint[] = [];
    const earthTwinAging: ChartDataPoint[] = [];
    const distanceProfile: ChartDataPoint[] = [];
    const spacetimeWorldline: ChartDataPoint[] = [];

    // First half: outbound journey
    for (let i = 0; i <= numPoints / 2; i++) {
        const tau = (i / numPoints) * properTimeYears;  // Proper time (traveling twin's clock)
        const earthTime = tau * gamma;  // Earth time

        // Velocity is constant at +v during outbound
        velocityProfile.push({ x: tau, y: velocityC });

        // Aging: traveling twin ages linearly, Earth twin ages faster
        travelingTwinAging.push({ x: tau, y: tau });
        earthTwinAging.push({ x: tau, y: earthTime });

        // Distance increases linearly
        const distance = velocityC * earthTime;  // distance in light years (since v is in c and t in years)
        distanceProfile.push({ x: tau, y: distance });

        // Spacetime worldline: (distance, time)
        spacetimeWorldline.push({ x: distance, y: earthTime });
    }

    // Second half: return journey
    for (let i = Math.floor(numPoints / 2) + 1; i <= numPoints; i++) {
        const tau = (i / numPoints) * properTimeYears;
        const earthTime = tau * gamma;

        // Velocity is constant at -v during return
        velocityProfile.push({ x: tau, y: -velocityC });

        // Aging continues
        travelingTwinAging.push({ x: tau, y: tau });
        earthTwinAging.push({ x: tau, y: earthTime });

        // Distance decreases back to zero
        const tauSinceTurnaround = tau - halfTime;
        const maxDistance = velocityC * halfTime * gamma;
        const distance = maxDistance - (velocityC * tauSinceTurnaround * gamma);
        distanceProfile.push({ x: tau, y: distance });

        // Spacetime worldline: returning to origin
        spacetimeWorldline.push({ x: distance, y: earthTime });
    }

    return {
        velocityProfile,
        travelingTwinAging,
        earthTwinAging,
        distanceProfile,
        spacetimeWorldline
    };
}
