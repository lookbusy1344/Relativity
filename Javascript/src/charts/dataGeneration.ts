/**
 * Pure functions for generating chart-ready data from physics calculations
 * Converts Decimal.js results to numbers for Chart.js compatibility
 */

import Decimal from 'decimal.js';
import * as rl from '../relativity_lib';

export type ChartDataPoint = {
    x: number;
    y: number;
    xDecimal: Decimal;
    yDecimal: Decimal;
};
export type ChartDataPointWithVelocity = {
    x: number;
    y: number;
    velocity: number;
    xDecimal: Decimal;
    yDecimal: Decimal;
    velocityDecimal: Decimal;
};

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

        // Calculate mass remaining as percentage for all nozzle efficiencies
        const fuelPercents = rl.pionRocketFuelFractionsMultiple(tauDecimal, accel, [0.7, 0.75, 0.8, 0.85]);
        const [massRemaining70Decimal, massRemaining75Decimal, massRemaining80Decimal, massRemaining85Decimal] =
            fuelPercents.map(fp => rl.ensure(100).minus(fp));

        const [massRemaining70, massRemaining75, massRemaining80, massRemaining85] =
            [massRemaining70Decimal, massRemaining75Decimal, massRemaining80Decimal, massRemaining85Decimal]
                .map(d => d.toNumber());

        properTimeVelocity.push({
            x: tauDays,
            y: velocityC,
            xDecimal: tauDaysDecimal,
            yDecimal: velocityCDecimal
        });

        coordTimeVelocity.push({
            x: tDays,
            y: velocityC,
            xDecimal: tDaysDecimal,
            yDecimal: velocityCDecimal
        });

        properTimeRapidity.push({
            x: tauDays,
            y: rapidity,
            xDecimal: tauDaysDecimal,
            yDecimal: rapidityDecimal
        });

        coordTimeRapidity.push({
            x: tDays,
            y: rapidity,
            xDecimal: tDaysDecimal,
            yDecimal: rapidityDecimal
        });

        properTimeTimeDilation.push({
            x: tauDays,
            y: timeDilation,
            xDecimal: tauDaysDecimal,
            yDecimal: timeDilationDecimal
        });

        coordTimeTimeDilation.push({
            x: tDays,
            y: timeDilation,
            xDecimal: tDaysDecimal,
            yDecimal: timeDilationDecimal
        });
        properTimeMassRemaining40.push({
            x: tauDays,
            y: massRemaining70,
            xDecimal: tauDaysDecimal,
            yDecimal: massRemaining70Decimal
        });

        properTimeMassRemaining50.push({
            x: tauDays,
            y: massRemaining75,
            xDecimal: tauDaysDecimal,
            yDecimal: massRemaining75Decimal
        });

        properTimeMassRemaining60.push({
            x: tauDays,
            y: massRemaining80,
            xDecimal: tauDaysDecimal,
            yDecimal: massRemaining80Decimal
        });

        properTimeMassRemaining70.push({
            x: tauDays,
            y: massRemaining85,
            xDecimal: tauDaysDecimal,
            yDecimal: massRemaining85Decimal
        });

        // Calculate distance for phase space plots
        const distance = rl.relativisticDistance(accel, tauDecimal);
        const distanceLyDecimal = distance.div(rl.lightYear);
        const distanceLy = distanceLyDecimal.toNumber();

        // Position-velocity phase space
        positionVelocity.push({
            x: distanceLy,
            y: velocityC,
            xDecimal: distanceLyDecimal,
            yDecimal: velocityCDecimal
        });

        // Spacetime worldline (coord time vs distance) with velocity for gradient
        const tYearsDecimal = tDaysDecimal.div(rl.ensure(365.25));
        const tYears = tYearsDecimal.toNumber();

        spacetimeWorldline.push({
            x: tYears,
            y: distanceLy,
            velocity: velocityC,
            xDecimal: tYearsDecimal,
            yDecimal: distanceLyDecimal,
            velocityDecimal: velocityCDecimal
        });
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

        // Calculate mass remaining (fuel burned for thrust time so far)
        const fuelPercents = rl.pionRocketFuelFractionsMultiple(tau, accel, [0.7, 0.75, 0.8, 0.85]);
        const [massRemaining70Decimal, massRemaining75Decimal, massRemaining80Decimal, massRemaining85Decimal] =
            fuelPercents.map(fp => rl.ensure(100).minus(fp));

        const [massRemaining70, massRemaining75, massRemaining80, massRemaining85] =
            [massRemaining70Decimal, massRemaining75Decimal, massRemaining80Decimal, massRemaining85Decimal]
                .map(d => d.toNumber());

        properTimeVelocity.push({
            x: tauYears,
            y: velocityC,
            xDecimal: tauYearsDecimal,
            yDecimal: velocityCDecimal
        });

        coordTimeVelocity.push({
            x: tYears,
            y: velocityC,
            xDecimal: tYearsDecimal,
            yDecimal: velocityCDecimal
        });

        properTimeRapidity.push({
            x: tauYears,
            y: rapidity,
            xDecimal: tauYearsDecimal,
            yDecimal: rapidityDecimal
        });

        coordTimeRapidity.push({
            x: tYears,
            y: rapidity,
            xDecimal: tYearsDecimal,
            yDecimal: rapidityDecimal
        });

        properTimeLorentz.push({
            x: tauYears,
            y: timeDilation,
            xDecimal: tauYearsDecimal,
            yDecimal: timeDilationDecimal
        });

        coordTimeLorentz.push({
            x: tYears,
            y: timeDilation,
            xDecimal: tYearsDecimal,
            yDecimal: timeDilationDecimal
        });

        properTimeMassRemaining40.push({
            x: tauYears,
            y: massRemaining70,
            xDecimal: tauYearsDecimal,
            yDecimal: massRemaining70Decimal
        });

        properTimeMassRemaining50.push({
            x: tauYears,
            y: massRemaining75,
            xDecimal: tauYearsDecimal,
            yDecimal: massRemaining75Decimal
        });

        properTimeMassRemaining60.push({
            x: tauYears,
            y: massRemaining80,
            xDecimal: tauYearsDecimal,
            yDecimal: massRemaining80Decimal
        });

        properTimeMassRemaining70.push({
            x: tauYears,
            y: massRemaining85,
            xDecimal: tauYearsDecimal,
            yDecimal: massRemaining85Decimal
        });

        // Calculate distance traveled so far
        const distance = rl.relativisticDistance(accel, tau);
        const distanceLyDecimal = distance.div(rl.lightYear);
        const distanceLy = distanceLyDecimal.toNumber();

        // Position-velocity phase space (acceleration phase)
        positionVelocityAccel.push({
            x: distanceLy,
            y: velocityC,
            xDecimal: distanceLyDecimal,
            yDecimal: velocityCDecimal
        });

        // Spacetime worldline with velocity for gradient
        spacetimeWorldline.push({
            x: tYears,
            y: distanceLy,
            velocity: velocityC,
            xDecimal: tYearsDecimal,
            yDecimal: distanceLyDecimal,
            velocityDecimal: velocityCDecimal
        });
    }

    // Deceleration phase - mirror the acceleration phase
    // Start from i=50 down to i=0 to connect smoothly with acceleration phase
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

        // Total thrust time = half (accel) + time into decel phase
        const decelThrust = halfProperTimeSeconds.sub(tauAccel);
        const totalThrustTime = halfProperTimeSeconds.plus(decelThrust);
        const fuelPercents = rl.pionRocketFuelFractionsMultiple(totalThrustTime, accel, [0.7, 0.75, 0.8, 0.85]);
        const [massRemaining70Decimal, massRemaining75Decimal, massRemaining80Decimal, massRemaining85Decimal] =
            fuelPercents.map(fp => rl.ensure(100).minus(fp));

        const [massRemaining70, massRemaining75, massRemaining80, massRemaining85] =
            [massRemaining70Decimal, massRemaining75Decimal, massRemaining80Decimal, massRemaining85Decimal]
                .map(d => d.toNumber());

        const tAccel = rl.coordinateTime(accel, tauAccel);
        const tDecel = res.coordTime.sub(tAccel);
        const tYearsDecimal = tDecel.div(rl.secondsPerYear);
        const tYears = tYearsDecimal.toNumber();

        properTimeVelocity.push({
            x: tauYears,
            y: velocityC,
            xDecimal: tauYearsDecimal,
            yDecimal: velocityCDecimal
        });

        coordTimeVelocity.push({
            x: tYears,
            y: velocityC,
            xDecimal: tYearsDecimal,
            yDecimal: velocityCDecimal
        });

        properTimeRapidity.push({
            x: tauYears,
            y: rapidity,
            xDecimal: tauYearsDecimal,
            yDecimal: rapidityDecimal
        });

        coordTimeRapidity.push({
            x: tYears,
            y: rapidity,
            xDecimal: tYearsDecimal,
            yDecimal: rapidityDecimal
        });

        properTimeLorentz.push({
            x: tauYears,
            y: timeDilation,
            xDecimal: tauYearsDecimal,
            yDecimal: timeDilationDecimal
        });

        coordTimeLorentz.push({
            x: tYears,
            y: timeDilation,
            xDecimal: tYearsDecimal,
            yDecimal: timeDilationDecimal
        });

        properTimeMassRemaining40.push({
            x: tauYears,
            y: massRemaining70,
            xDecimal: tauYearsDecimal,
            yDecimal: massRemaining70Decimal
        });

        properTimeMassRemaining50.push({
            x: tauYears,
            y: massRemaining75,
            xDecimal: tauYearsDecimal,
            yDecimal: massRemaining75Decimal
        });

        properTimeMassRemaining60.push({
            x: tauYears,
            y: massRemaining80,
            xDecimal: tauYearsDecimal,
            yDecimal: massRemaining80Decimal
        });

        properTimeMassRemaining70.push({
            x: tauYears,
            y: massRemaining85,
            xDecimal: tauYearsDecimal,
            yDecimal: massRemaining85Decimal
        });

        // During deceleration, distance continues increasing from halfDistance to totalDistance
        // tauAccel represents equivalent accel time for current velocity
        const remainingAccelDistance = rl.relativisticDistance(accel, tauAccel);
        const totalDistance = rl.ensure(distanceLightYears).mul(rl.lightYear);
        const currentDistance = totalDistance.minus(remainingAccelDistance);
        const currentDistanceLyDecimal = currentDistance.div(rl.lightYear);
        const currentDistanceLy = currentDistanceLyDecimal.toNumber();

        // Position-velocity phase space (deceleration phase - creates return path of loop)
        positionVelocityDecel.push({
            x: currentDistanceLy,
            y: velocityC,
            xDecimal: currentDistanceLyDecimal,
            yDecimal: velocityCDecimal
        });

        // Spacetime worldline with velocity for gradient
        spacetimeWorldline.push({
            x: tYears,
            y: currentDistanceLy,
            velocity: velocityC,
            xDecimal: tYearsDecimal,
            yDecimal: currentDistanceLyDecimal,
            velocityDecimal: velocityCDecimal
        });
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
    properTimeDistance: ChartDataPoint[];
    coordTimeDistance: ChartDataPoint[];
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
    const properTimeDistance: ChartDataPoint[] = [];
    const coordTimeDistance: ChartDataPoint[] = [];

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
        properTimeDistance.push({ x: tau, y: distance });
        coordTimeDistance.push({ x: earthTime, y: distance });
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
        properTimeDistance.push({ x: tau, y: distance });
        coordTimeDistance.push({ x: earthTime, y: distance });
    }

    return {
        velocityProfile,
        travelingTwinAging,
        earthTwinAging,
        distanceProfile,
        properTimeDistance,
        coordTimeDistance
    };
}
