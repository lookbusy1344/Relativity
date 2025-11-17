/**
 * Event handler factory functions
 * Coordinate between DOM, physics, data generation, and charts
 */

import * as rl from '../relativity_lib';
import { setElement } from './domUtils';
import { generateAccelChartData, generateFlipBurnChartData, generateVisualizationChartData } from '../charts/dataGeneration';
import { updateAccelCharts, updateFlipBurnCharts, updateVisualizationCharts, type ChartRegistry } from '../charts/charts';

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
    getInput: () => HTMLInputElement | null,
    getResults: () => (HTMLElement | null)[],
    chartRegistry: { current: ChartRegistry }
): () => void {
    return () => {
        const input = getInput();
        const [resultA1, resultA2, resultA1b, resultA2b, resultAFuel40, resultAFuel, resultAFuel60, resultAFuel70] = getResults();
        if (!input) return;

        const accel = rl.g;
        const secs = rl.ensure(input.value ?? 0).mul(60 * 60 * 24);

        const relVel = rl.relativisticVelocity(accel, secs);
        const relDist = rl.relativisticDistance(accel, secs);
        const relVelC = relVel.div(rl.c);
        const relDistC = relDist.div(rl.lightYear);

        // Calculate fuel fractions at all efficiencies
        const fuelFraction40 = rl.photonRocketFuelFraction(secs, accel, 0.4);
        const fuelPercent40 = fuelFraction40.mul(100);
        const fuelFraction50 = rl.photonRocketFuelFraction(secs, accel, 0.5);
        const fuelPercent50 = fuelFraction50.mul(100);
        const fuelFraction60 = rl.photonRocketFuelFraction(secs, accel, 0.6);
        const fuelPercent60 = fuelFraction60.mul(100);
        const fuelFraction70 = rl.photonRocketFuelFraction(secs, accel, 0.7);
        const fuelPercent70 = fuelFraction70.mul(100);

        if (resultA1) setElement(resultA1, rl.formatSignificant(relVel, "9", 3), "m/s");
        if (resultA2) setElement(resultA2, rl.formatSignificant(relDist, "9", 3), "m");
        if (resultA1b) setElement(resultA1b, rl.formatSignificant(relVelC, "9", 3), "c");
        if (resultA2b) setElement(resultA2b, rl.formatSignificant(relDistC, "0", 3), "ly");
        if (resultAFuel40) setElement(resultAFuel40, rl.formatSignificant(fuelPercent40, "0", 8), "%");
        if (resultAFuel) setElement(resultAFuel, rl.formatSignificant(fuelPercent50, "0", 8), "%");
        if (resultAFuel60) setElement(resultAFuel60, rl.formatSignificant(fuelPercent60, "0", 8), "%");
        if (resultAFuel70) setElement(resultAFuel70, rl.formatSignificant(fuelPercent70, "0", 8), "%");

        // Update charts
        const durationDays = parseFloat(input.value ?? '365');
        const data = generateAccelChartData(1, durationDays);
        chartRegistry.current = updateAccelCharts(chartRegistry.current, data);
    };
}

export function createFlipBurnHandler(
    getInput: () => HTMLInputElement | null,
    getResults: () => (HTMLElement | null)[],
    chartRegistry: { current: ChartRegistry }
): () => void {
    return () => {
        const input = getInput();
        const [resultFlip1, resultFlip2, resultFlip3, resultFlip4, resultFlip5, resultFlip6, resultFlipFuel40, resultFlipFuel, resultFlipFuel60, resultFlipFuel70] = getResults();
        if (!input) return;

        const distanceLightYears = parseFloat(input.value ?? '0');
        const m = rl.ensure(distanceLightYears).mul(rl.lightYear);
        const res = rl.flipAndBurn(rl.g, m);
        const properTime = res.properTime.div(rl.secondsPerYear);
        const coordTime = res.coordTime.div(rl.secondsPerYear);
        const peak = res.peakVelocity.div(rl.c);
        const lorentz = res.lorentzFactor;
        const metre = rl.formatSignificant(rl.one.div(lorentz), "0", 2);
        const sec = rl.formatSignificant(rl.one.mul(lorentz), "0", 2);

        // Calculate fuel fractions at all efficiencies
        const fuelFraction40 = rl.photonRocketFuelFraction(res.properTime, rl.g, 0.4);
        const fuelPercent40 = fuelFraction40.mul(100);
        const fuelFraction50 = rl.photonRocketFuelFraction(res.properTime, rl.g, 0.5);
        const fuelPercent50 = fuelFraction50.mul(100);
        const fuelFraction60 = rl.photonRocketFuelFraction(res.properTime, rl.g, 0.6);
        const fuelPercent60 = fuelFraction60.mul(100);
        const fuelFraction70 = rl.photonRocketFuelFraction(res.properTime, rl.g, 0.7);
        const fuelPercent70 = fuelFraction70.mul(100);

        if (resultFlip1) setElement(resultFlip1, rl.formatSignificant(properTime, "0", 2), "yrs");
        if (resultFlip2) setElement(resultFlip2, rl.formatSignificant(peak, "9", 2), "c");
        if (resultFlip4) setElement(resultFlip4, rl.formatSignificant(coordTime, "0", 2), "yrs");
        if (resultFlip3) setElement(resultFlip3, rl.formatSignificant(lorentz, "0", 2), "");
        if (resultFlip5) setElement(resultFlip5, `1m becomes ${metre}m`, "");
        if (resultFlip6) setElement(resultFlip6, `1s becomes ${sec}s`, "");
        if (resultFlipFuel40) setElement(resultFlipFuel40, rl.formatSignificant(fuelPercent40, "0", 8), "%");
        if (resultFlipFuel) setElement(resultFlipFuel, rl.formatSignificant(fuelPercent50, "0", 8), "%");
        if (resultFlipFuel60) setElement(resultFlipFuel60, rl.formatSignificant(fuelPercent60, "0", 8), "%");
        if (resultFlipFuel70) setElement(resultFlipFuel70, rl.formatSignificant(fuelPercent70, "0", 8), "%");

        // Update charts
        const data = generateFlipBurnChartData(distanceLightYears);
        chartRegistry.current = updateFlipBurnCharts(chartRegistry.current, data);
    };
}

export function createGraphUpdateHandler(
    getAccelInput: () => HTMLInputElement | null,
    getDurationInput: () => HTMLInputElement | null,
    chartRegistry: { current: ChartRegistry }
): () => void {
    return () => {
        const accelInput = getAccelInput();
        const durationInput = getDurationInput();
        if (!accelInput || !durationInput) return;

        const accelG = parseFloat(accelInput.value ?? '1');
        const durationDays = parseFloat(durationInput.value ?? '365');

        const data = generateVisualizationChartData(accelG, durationDays);
        chartRegistry.current = updateVisualizationCharts(chartRegistry.current, data);
    };
}
