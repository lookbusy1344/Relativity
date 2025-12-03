import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import * as rl from './relativity_lib';

// Configure decimal precision for testing
rl.configure(150);

describe('Issue verification - flip and burn 100000 ly', () => {
    it('should match expected values from issue for 1g, 100000 ly, 78000kg dry, 0.85 efficiency', () => {
        // Test case from the issue:
        // flip and burn 1g, 100000 light years, dry mass 78000kg, nozzle efficiency 0.85
        // Expected: proper time 22.36 years, peak Lorentz 51,615.76, 
        // fuel mass 931,159.19 Solar masses (1.85e+36 kg), 
        // fuel fraction 99.9999999999999999999999999999957 %

        const accel = rl.g.mul(1); // 1g
        const distanceLY = new Decimal(100000);
        const distanceM = distanceLY.mul(rl.lightYear);
        const dryMass = new Decimal(78000);
        const efficiency = new Decimal(0.85);

        console.log("\nTesting flip and burn calculation from issue:");
        console.log("================================================");
        console.log(`Acceleration: 1g = ${rl.g} m/s²`);
        console.log(`Distance: ${distanceLY} light years`);
        console.log(`Dry mass: ${dryMass} kg`);
        console.log(`Nozzle efficiency: ${efficiency}`);

        // Call flipAndBurn function
        const res = rl.flipAndBurn(accel, distanceM);

        // Convert to years
        const properTimeYears = res.properTime.div(rl.secondsPerYear);
        const coordTimeYears = res.coordTime.div(rl.secondsPerYear);
        const peakVelocityC = res.peakVelocity.div(rl.c);

        console.log("\nResults from flipAndBurn:");
        console.log("========================");
        console.log(`Proper time: ${rl.formatSignificant(properTimeYears, "0", 2)} years`);
        console.log(`  Raw value: ${properTimeYears.toString()}`);
        console.log(`Peak Lorentz factor: ${rl.formatSignificant(res.lorentzFactor, "0", 2)}`);
        console.log(`  Raw value: ${res.lorentzFactor.toString()}`);

        // Calculate fuel requirements
        const fuelFraction = rl.pionRocketFuelFraction(res.properTime, accel, efficiency);
        const fuelMass = fuelFraction.mul(dryMass).div(rl.one.minus(fuelFraction));
        const fuelPercent = fuelFraction.mul(100);

        console.log("\nFuel calculations:");
        console.log("==================");
        console.log(`Fuel fraction: ${rl.formatSignificant(fuelPercent, "9", 36)} %`);
        console.log(`Fuel mass: ${rl.formatMassWithUnit(fuelMass)}`);
        console.log(`  In solar masses: ${fuelMass.div(rl.solarMass).toFixed(2)}`);

        // Expected values from issue
        const expectedProperTime = new Decimal(22.36);
        const expectedLorentz = new Decimal(51615.76);
        const expectedFuelMassSolar = new Decimal(931159.19);
        
        console.log("\nExpected values from issue:");
        console.log("===========================");
        console.log(`Proper time: 22.36 years`);
        console.log(`Peak Lorentz: 51,615.76`);
        console.log(`Fuel mass: 931,159.19 Solar masses`);

        console.log("\nDifferences:");
        console.log("============");
        const properTimeDiff = properTimeYears.minus(expectedProperTime);
        const lorentzDiff = res.lorentzFactor.minus(expectedLorentz);
        const fuelMassDiffSolar = fuelMass.div(rl.solarMass).minus(expectedFuelMassSolar);
        
        console.log(`Proper time diff: ${properTimeDiff.toString()} years`);
        console.log(`Lorentz diff: ${lorentzDiff.toString()}`);
        console.log(`Fuel mass diff: ${fuelMassDiffSolar.toFixed(2)} solar masses`);

        // Test with reasonable tolerances
        expect(properTimeYears.toNumber()).toBeCloseTo(22.36, 1);
        expect(res.lorentzFactor.toNumber()).toBeCloseTo(51615.76, -1); // within 10s
        expect(fuelMass.div(rl.solarMass).toNumber()).toBeCloseTo(931159.19, -2); // within 100s
    });
});
