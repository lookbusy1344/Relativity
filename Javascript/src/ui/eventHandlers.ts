/**
 * Event handler factory functions
 * Coordinate between DOM, physics, data generation, and charts
 */

import Decimal from 'decimal.js';
import * as rl from '../relativity_lib';
import { setElement } from './domUtils';
import { generateAccelChartData, generateFlipBurnChartData, generateVisualizationChartData, generateTwinParadoxChartData } from '../charts/dataGeneration';
import { updateAccelCharts, updateFlipBurnCharts, updateVisualizationCharts, updateTwinParadoxCharts, type ChartRegistry } from '../charts/charts';
import { drawMinkowskiDiagramD3, type MinkowskiData } from '../charts/minkowski';
import { drawTwinParadoxMinkowski, type TwinParadoxMinkowskiData } from '../charts/minkowski-twins';

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

export function createAccelHandler(
    getAccelInput: () => HTMLInputElement | null,
    getTimeInput: () => HTMLInputElement | null,
    getResults: () => (HTMLElement | null)[],
    chartRegistry: { current: ChartRegistry }
): () => void {
    let pendingRAF: number | null = null;
    let pendingCalculation: number | null = null;

    return () => {
        const accelInput = getAccelInput();
        const timeInput = getTimeInput();
        const [resultA1, resultA2, resultA1b, resultA2b, resultAFuel40, resultAFuel, resultAFuel60, resultAFuel70] = getResults();
        if (!accelInput || !timeInput) return;

        // Cancel pending calculation to prevent race condition
        if (pendingRAF !== null) {
            cancelAnimationFrame(pendingRAF);
            pendingRAF = null;
        }
        if (pendingCalculation !== null) {
            clearTimeout(pendingCalculation);
            pendingCalculation = null;
        }

        // Show working message
        if (resultA1) resultA1.textContent = "Working...";
        if (resultA2) resultA2.textContent = "";
        if (resultA1b) resultA1b.textContent = "";
        if (resultA2b) resultA2b.textContent = "";
        if (resultAFuel40) resultAFuel40.textContent = "";
        if (resultAFuel) resultAFuel.textContent = "";
        if (resultAFuel60) resultAFuel60.textContent = "";
        if (resultAFuel70) resultAFuel70.textContent = "";

        // Allow UI to update before heavy calculation
        pendingRAF = requestAnimationFrame(() => {
            pendingRAF = null;
            pendingCalculation = window.setTimeout(() => {
            // Use string values to preserve precision for Decimal.js calculations
            const accelGStr = accelInput.value ?? '1';
            const timeStr = timeInput.value ?? '0';
            const accel = rl.g.mul(accelGStr);
            const secs = rl.ensure(timeStr).mul(60 * 60 * 24);

            const relVel = rl.relativisticVelocity(accel, secs);
            const relDist = rl.relativisticDistance(accel, secs);
            const relVelC = relVel.div(rl.c);
            const relDistC = relDist.div(rl.lightYear);
            const relVelKm = relVel.div(1000);
            const relDistKm = relDist.div(1000);

            // Calculate fuel fractions at all nozzle efficiencies
            const [fuelPercent70, fuelPercent75, fuelPercent80, fuelPercent85] = 
                rl.pionRocketFuelFractionsMultiple(secs, accel, [0.7, 0.75, 0.8, 0.85]);

            if (resultA1) setElement(resultA1, rl.formatSignificant(relVelKm, "9", 3), "km/s");
            if (resultA2) setElement(resultA2, rl.formatSignificant(relDistKm, "0", 1), "km");
            if (resultA1b) setElement(resultA1b, rl.formatSignificant(relVelC, "9", 3), "c");
            if (resultA2b) setElement(resultA2b, rl.formatSignificant(relDistC, "0", 3), "ly");
            if (resultAFuel40) setElement(resultAFuel40, rl.formatSignificant(fuelPercent70, "9", 3), "%");
            if (resultAFuel) setElement(resultAFuel, rl.formatSignificant(fuelPercent75, "9", 3), "%");
            if (resultAFuel60) setElement(resultAFuel60, rl.formatSignificant(fuelPercent80, "9", 3), "%");
            if (resultAFuel70) setElement(resultAFuel70, rl.formatSignificant(fuelPercent85, "9", 3), "%");

            // Update charts - parseFloat is OK here as Chart.js only needs limited precision for display
            const accelG = parseFloat(accelGStr);
            const durationDays = parseFloat(timeStr);
            const data = generateAccelChartData(accelG, durationDays);
            chartRegistry.current = updateAccelCharts(chartRegistry.current, data);
            pendingCalculation = null;
            }, 0);
        });
    };
}

export function createFlipBurnHandler(
    getAccelInput: () => HTMLInputElement | null,
    getDistanceInput: () => HTMLInputElement | null,
    getResults: () => (HTMLElement | null)[],
    chartRegistry: { current: ChartRegistry }
): () => void {
    let pendingRAF: number | null = null;
    let pendingCalculation: number | null = null;

    return () => {
        const accelInput = getAccelInput();
        const distanceInput = getDistanceInput();
        const [resultFlip1, resultFlip2, resultFlip3, resultFlip4, resultFlip5, resultFlip6, resultFlipFuel40, resultFlipFuel, resultFlipFuel60, resultFlipFuel70] = getResults();
        if (!accelInput || !distanceInput) return;

        // Cancel pending calculation to prevent race condition
        if (pendingRAF !== null) {
            cancelAnimationFrame(pendingRAF);
            pendingRAF = null;
        }
        if (pendingCalculation !== null) {
            clearTimeout(pendingCalculation);
            pendingCalculation = null;
        }

        // Show working message
        if (resultFlip1) resultFlip1.textContent = "Working...";
        if (resultFlip2) resultFlip2.textContent = "";
        if (resultFlip3) resultFlip3.textContent = "";
        if (resultFlip4) resultFlip4.textContent = "";
        if (resultFlip5) resultFlip5.textContent = "";
        if (resultFlip6) resultFlip6.textContent = "";
        if (resultFlipFuel40) resultFlipFuel40.textContent = "";
        if (resultFlipFuel) resultFlipFuel.textContent = "";
        if (resultFlipFuel60) resultFlipFuel60.textContent = "";
        if (resultFlipFuel70) resultFlipFuel70.textContent = "";

        // Allow UI to update before heavy calculation
        pendingRAF = requestAnimationFrame(() => {
            pendingRAF = null;
            pendingCalculation = window.setTimeout(() => {
            // Use string values to preserve precision for Decimal.js calculations
            const accelGStr = accelInput.value ?? '1';
            const distanceLightYearsStr = distanceInput.value ?? '0';
            const accel = rl.g.mul(accelGStr);
            const m = rl.ensure(distanceLightYearsStr).mul(rl.lightYear);
            const res = rl.flipAndBurn(accel, m);
            const properTime = res.properTime.div(rl.secondsPerYear);
            const coordTime = res.coordTime.div(rl.secondsPerYear);
            const peak = res.peakVelocity.div(rl.c);
            const lorentz = res.lorentzFactor;
            const metre = rl.formatSignificant(rl.one.div(lorentz), "0", 2);
            const sec = rl.formatSignificant(rl.one.mul(lorentz), "0", 2);

            // Calculate fuel fractions at all nozzle efficiencies
            const [fuelPercent70, fuelPercent75, fuelPercent80, fuelPercent85] = 
                rl.pionRocketFuelFractionsMultiple(res.properTime, accel, [0.7, 0.75, 0.8, 0.85]);

            if (resultFlip1) setElement(resultFlip1, rl.formatSignificant(properTime, "0", 2), "yrs");
            if (resultFlip2) setElement(resultFlip2, rl.formatSignificant(peak, "9", 2), "c");
            if (resultFlip4) setElement(resultFlip4, rl.formatSignificant(coordTime, "0", 2), "yrs");
            if (resultFlip3) setElement(resultFlip3, rl.formatSignificant(lorentz, "0", 2), "");
            if (resultFlip5) setElement(resultFlip5, `1m becomes ${metre}m`, "");
            if (resultFlip6) setElement(resultFlip6, `1s becomes ${sec}s`, "");
            if (resultFlipFuel40) setElement(resultFlipFuel40, rl.formatSignificant(fuelPercent70, "9", 3), "%");
            if (resultFlipFuel) setElement(resultFlipFuel, rl.formatSignificant(fuelPercent75, "9", 3), "%");
            if (resultFlipFuel60) setElement(resultFlipFuel60, rl.formatSignificant(fuelPercent80, "9", 3), "%");
            if (resultFlipFuel70) setElement(resultFlipFuel70, rl.formatSignificant(fuelPercent85, "9", 3), "%");

            // Update charts - parseFloat is OK here as Chart.js only needs limited precision for display
            const accelG = parseFloat(accelGStr);
            const distanceLightYears = parseFloat(distanceLightYearsStr);
            const data = generateFlipBurnChartData(accelG, distanceLightYears);
            chartRegistry.current = updateFlipBurnCharts(chartRegistry.current, data);
            pendingCalculation = null;
            }, 0);
        });
    };
}

export function createTwinParadoxHandler(
    getVelocityInput: () => HTMLInputElement | null,
    getTimeInput: () => HTMLInputElement | null,
    getResults: () => (HTMLElement | null)[],
    chartRegistry: { current: ChartRegistry },
    onDiagramDrawn?: (container: HTMLElement, data: TwinParadoxMinkowskiData, controller: ReturnType<typeof drawTwinParadoxMinkowski> | null) => void
): (silent?: boolean) => void {
    let pendingRAF: number | null = null;
    let pendingCalculation: number | null = null;

    return (silent = false) => {
        const velocityInput = getVelocityInput();
        const timeInput = getTimeInput();
        const [resultTwins1, resultTwins2, resultTwins3, resultTwins4, resultTwins5, resultTwins6, resultTwins7] = getResults();
        if (!velocityInput || !timeInput) return;

        // Cancel pending calculation to prevent race condition
        if (pendingRAF !== null) {
            cancelAnimationFrame(pendingRAF);
            pendingRAF = null;
        }
        if (pendingCalculation !== null) {
            clearTimeout(pendingCalculation);
            pendingCalculation = null;
        }

        // Show working message (unless silent mode)
        if (!silent) {
            if (resultTwins1) resultTwins1.textContent = "Working...";
            if (resultTwins2) resultTwins2.textContent = "";
            if (resultTwins3) resultTwins3.textContent = "";
            if (resultTwins4) resultTwins4.textContent = "";
            if (resultTwins5) resultTwins5.textContent = "";
            if (resultTwins6) resultTwins6.textContent = "";
            if (resultTwins7) resultTwins7.textContent = "";
        }

        // Allow UI to update before heavy calculation (skip delay in silent mode)
        const execute = () => {
            // Use string values to preserve precision for Decimal.js calculations
            const velocityCStr = velocityInput.value ?? '0.8';
            const properTimeYearsStr = timeInput.value ?? '4';

            // Convert UI inputs to SI units using string values to preserve precision
            // parseFloat loses precision for values like 0.99999999999999999 (becomes 1.0)
            const velocity = rl.c.mul(velocityCStr);  // m/s
            const properTime = rl.ensure(properTimeYearsStr).mul(rl.secondsPerYear);  // seconds

            // Call function with SI units
            const res = rl.twinParadox(velocity, properTime);

            // Convert results from SI units to display units
            const travelingAge = res.properTime.div(rl.secondsPerYear);  // seconds to years
            const earthAge = res.earthTime.div(rl.secondsPerYear);  // seconds to years
            const ageDiff = res.ageDifference.div(rl.secondsPerYear);  // seconds to years
            const lorentz = res.lorentzFactor;
            const velocityKm = res.velocity.div(1000);  // m/s to km/s
            const oneWayLy = res.oneWayDistance.div(rl.lightYear);  // meters to light years
            const totalLy = res.totalDistance.div(rl.lightYear);  // meters to light years

            if (resultTwins1) setElement(resultTwins1, rl.formatSignificant(travelingAge, "0", 2), "yrs");
            if (resultTwins2) setElement(resultTwins2, rl.formatSignificant(earthAge, "0", 2), "yrs");
            if (resultTwins3) setElement(resultTwins3, rl.formatSignificant(ageDiff, "0", 2), "yrs");
            if (resultTwins4) setElement(resultTwins4, rl.formatSignificant(lorentz, "0", 3), "");
            if (resultTwins5) setElement(resultTwins5, `${rl.formatSignificant(rl.ensure(velocityCStr), "9", 3)}c (${rl.formatSignificant(velocityKm, "9", 1)} km/s)`, "");
            if (resultTwins6) setElement(resultTwins6, rl.formatSignificant(oneWayLy, "0", 3), "ly");
            if (resultTwins7) setElement(resultTwins7, rl.formatSignificant(totalLy, "0", 3), "ly");

            // Update charts - parseFloat is OK here as Chart.js only needs limited precision for display
            const velocityCNum = parseFloat(velocityCStr);
            const properTimeYearsNum = parseFloat(properTimeYearsStr);
            const data = generateTwinParadoxChartData(velocityCNum, properTimeYearsNum);
            chartRegistry.current = updateTwinParadoxCharts(chartRegistry.current, data);

            // Draw Minkowski diagram
            const container = document.getElementById('twinsMinkowskiContainer');
            if (container && onDiagramDrawn) {
                const minkowskiData: TwinParadoxMinkowskiData = {
                    velocityC: velocityCNum,
                    properTimeYears: properTimeYearsNum,
                    earthTimeYears: parseFloat(earthAge.toString()),
                    distanceLY: parseFloat(oneWayLy.toString()),
                    gamma: parseFloat(lorentz.toString())
                };

                onDiagramDrawn(container, minkowskiData, null);
            }

            pendingCalculation = null;
        };

        if (silent) {
            execute();
        } else {
            pendingRAF = requestAnimationFrame(() => {
                pendingRAF = null;
                pendingCalculation = window.setTimeout(execute, 0);
            });
        }
    };
}

export function createGraphUpdateHandler(
    getAccelInput: () => HTMLInputElement | null,
    getDurationInput: () => HTMLInputElement | null,
    getStatus: () => HTMLElement | null,
    chartRegistry: { current: ChartRegistry }
): () => void {
    let pendingRAF: number | null = null;
    let pendingCalculation: number | null = null;

    return () => {
        const accelInput = getAccelInput();
        const durationInput = getDurationInput();
        const status = getStatus();
        if (!accelInput || !durationInput) return;

        // Cancel pending calculation to prevent race condition
        if (pendingRAF !== null) {
            cancelAnimationFrame(pendingRAF);
            pendingRAF = null;
        }
        if (pendingCalculation !== null) {
            clearTimeout(pendingCalculation);
            pendingCalculation = null;
        }

        // Show working message
        if (status) status.textContent = "Working...";

        // Allow UI to update before heavy calculation
        pendingRAF = requestAnimationFrame(() => {
            pendingRAF = null;
            pendingCalculation = window.setTimeout(() => {
            // Use string values to preserve precision for Decimal.js calculations
            const accelGStr = accelInput.value ?? '1';
            const durationDaysStr = durationInput.value ?? '365';

            // parseFloat is OK here as Chart.js only needs limited precision for display
            const accelG = parseFloat(accelGStr);
            const durationDays = parseFloat(durationDaysStr);

            const data = generateVisualizationChartData(accelG, durationDays);
            chartRegistry.current = updateVisualizationCharts(chartRegistry.current, data);

            if (status) status.textContent = "Done";
            pendingCalculation = null;
            }, 0);
        });
    };
}

export function createPionAccelTimeHandler(
    getFuelMassInput: () => HTMLInputElement | null,
    getDryMassInput: () => HTMLInputElement | null,
    getEfficiencyInput: () => HTMLInputElement | null,
    getResult: () => HTMLElement | null
): () => void {
    return () => {
        const fuelMassInput = getFuelMassInput();
        const dryMassInput = getDryMassInput();
        const efficiencyInput = getEfficiencyInput();
        const result = getResult();
        if (!fuelMassInput || !dryMassInput || !efficiencyInput || !result) return;

        const fuelMass = rl.ensure(fuelMassInput.value ?? 0);
        const dryMass = rl.ensure(dryMassInput.value ?? 0);
        const efficiency = rl.ensure(efficiencyInput.value ?? 0.85);

        // Validate efficiency range
        if (efficiency.lt(0.01) || efficiency.gt(1.0)) {
            setElement(result, "Efficiency must be between 0.01 and 1.0", "");
            return;
        }

        const accelTimeSeconds = rl.pionRocketAccelTime(fuelMass, dryMass, efficiency);
        const accelTimeDays = accelTimeSeconds.div(60 * 60 * 24);

        setElement(result, rl.formatSignificant(accelTimeDays, "0", 3), "days");
    };
}

export function createPionFuelFractionHandler(
    getThrustTimeInput: () => HTMLInputElement | null,
    getEfficiencyInput: () => HTMLInputElement | null,
    getResult: () => HTMLElement | null
): () => void {
    return () => {
        const thrustTimeInput = getThrustTimeInput();
        const efficiencyInput = getEfficiencyInput();
        const result = getResult();
        if (!thrustTimeInput || !efficiencyInput || !result) return;

        const thrustTimeDays = rl.ensure(thrustTimeInput.value ?? 365);
        const thrustTimeSeconds = thrustTimeDays.mul(60 * 60 * 24);
        const efficiency = rl.ensure(efficiencyInput.value ?? 0.85);

        // Validate efficiency range
        if (efficiency.lt(0.01) || efficiency.gt(1.0)) {
            setElement(result, "Efficiency must be between 0.01 and 1.0", "");
            return;
        }

        const fuelFraction = rl.pionRocketFuelFraction(thrustTimeSeconds, rl.g, efficiency);
        const fuelFractionPercent = fuelFraction.mul(100);

        setElement(result, rl.formatSignificant(fuelFractionPercent, "9", 2), "%");
    };
}

export function createSpacetimeIntervalHandler(
    getTime2Input: () => HTMLInputElement | null,
    getX2Input: () => HTMLInputElement | null,
    getVelocityInput: () => HTMLInputElement | null,
    getResultSquared: () => HTMLElement | null,
    getResultType: () => HTMLElement | null,
    getResultDeltaT: () => HTMLElement | null,
    getResultDeltaX: () => HTMLElement | null,
    getResultMinSep: () => HTMLElement | null,
    getResultVelocity: () => HTMLElement | null,
    onDiagramDrawn?: (container: HTMLElement, data: MinkowskiData, controller: ReturnType<typeof drawMinkowskiDiagramD3> | null) => void
): () => void {
    return () => {
        const time2Input = getTime2Input();
        const x2Input = getX2Input();
        const velocityInput = getVelocityInput();
        const resultSquared = getResultSquared();
        const resultType = getResultType();
        const resultDeltaT = getResultDeltaT();
        const resultDeltaX = getResultDeltaX();
        const resultMinSep = getResultMinSep();
        const resultVelocity = getResultVelocity();
        if (!time2Input || !x2Input || !velocityInput ||
            !resultSquared || !resultType || !resultDeltaT || !resultDeltaX ||
            !resultMinSep || !resultVelocity) return;

        // Event 1 is always at (0, 0)
        const t1 = new Decimal(0);
        const x1 = new Decimal(0);

        const t2 = rl.ensure(time2Input.value ?? 0);
        const x2Km = rl.ensure(x2Input.value ?? 0);
        const velocityC = rl.ensure(velocityInput.value ?? 0);

        // Validate velocity is in valid range (-1.0 < v < 1.0)
        if (velocityC.lte(-1) || velocityC.gte(1)) {
            setElement(resultSquared, "Invalid velocity", "");
            setElement(resultType, "Velocity must be > -1.0 and < 1.0", "");
            setElement(resultDeltaT, "-", "");
            setElement(resultDeltaX, "-", "");
            setElement(resultMinSep, "-", "");
            setElement(resultVelocity, "-", "");
            return;
        }

        // Convert km to m for calculations
        const x2 = x2Km.mul(1000);

        // Calculate interval squared: s² = c²(Δt)² - (Δx)²
        const deltaT = t2.minus(t1);
        const deltaX = x2.minus(x1);
        const intervalSquared = rl.c.pow(2).mul(deltaT.pow(2)).minus(deltaX.pow(2));

        // Display interval squared in km²
        const intervalSquaredKm = intervalSquared.div(1000000);
        setElement(resultSquared, rl.formatSignificant(intervalSquaredKm, "0", 1), "km²");

        // Interpret the interval
        const tolerance = new Decimal(1e-10);
        if (intervalSquared.abs().lt(tolerance)) {
            // Lightlike interval
            setElement(resultType, "Lightlike: Light-speed connection", "");
            setElement(resultMinSep, "N/A (lightlike)", "");
            setElement(resultVelocity, "1c", "");
        } else if (intervalSquared.gt(0)) {
            // Timelike interval - causally connected
            const properTime = intervalSquared.sqrt().div(rl.c);
            setElement(resultType, `Timelike: ${rl.formatSignificant(properTime, "0", 3)} s - Events are causally connected`, "");
            
            // For timelike: minimum separation is proper time (in frame where events occur at same place)
            setElement(resultMinSep, rl.formatSignificant(properTime, "0", 3), "s");
            
            // Required velocity: v = Δx/Δt
            const requiredVel = deltaX.div(deltaT);
            const requiredVelC = requiredVel.div(rl.c);
            setElement(resultVelocity, rl.formatSignificant(requiredVelC, "9", 3), "c");
        } else {
            // Spacelike interval - not causally connected
            const properDistanceM = intervalSquared.abs().sqrt();
            const properDistanceKm = properDistanceM.div(1000);
            setElement(resultType, `Spacelike: ${rl.formatSignificant(properDistanceKm, "0", 1)} km - Events cannot be causally connected`, "");
            
            // For spacelike: minimum separation is proper distance (in frame where events are simultaneous)
            setElement(resultMinSep, rl.formatSignificant(properDistanceKm, "0", 3), "km");
            
            // Required velocity to make events simultaneous: v = c²Δt/Δx
            const requiredVel = rl.c.pow(2).mul(deltaT).div(deltaX);
            const requiredVelC = requiredVel.div(rl.c);
            setElement(resultVelocity, rl.formatSignificant(requiredVelC, "9", 3), "c");
        }

        // Calculate Lorentz transformation
        const v = velocityC.mul(rl.c); // Convert from c to m/s
        const gamma = rl.lorentzFactor(v);

        // Δt' = γ(Δt - vΔx/c²)
        const deltaTprime = gamma.mul(deltaT.minus(v.mul(deltaX).div(rl.c.pow(2))));

        // Δx' = γ(Δx - vΔt)
        const deltaXprimeM = gamma.mul(deltaX.minus(v.mul(deltaT)));
        const deltaXprimeKm = deltaXprimeM.div(1000);

        setElement(resultDeltaT, rl.formatSignificant(deltaTprime, "0", 3), "s");
        setElement(resultDeltaX, rl.formatSignificant(deltaXprimeKm, "0", 1), "km");

        // Draw Minkowski diagram
        const container = document.getElementById('minkowskiContainer');
        if (container) {
            // Determine interval type
            let intervalType: 'timelike' | 'spacelike' | 'lightlike';
            if (intervalSquared.abs().lt(tolerance)) {
                intervalType = 'lightlike';
            } else if (intervalSquared.gt(0)) {
                intervalType = 'timelike';
            } else {
                intervalType = 'spacelike';
            }

            const diagramData: MinkowskiData = {
                time: t2.toNumber(),
                distance: x2Km.toNumber(),
                velocity: velocityC.toNumber(),
                deltaTPrime: deltaTprime.toNumber(),
                deltaXPrime: deltaXprimeKm.toNumber(),
                intervalType
            };

            // Notify caller that diagram was drawn (for resize handling)
            // The callback will handle creating or updating the diagram
            if (onDiagramDrawn) {
                onDiagramDrawn(container, diagramData, null);
            }
        }
    };
}
