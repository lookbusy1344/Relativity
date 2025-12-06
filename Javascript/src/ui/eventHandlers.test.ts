import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createLorentzHandler,
  createRapidityFromVelocityHandler,
  createVelocityFromRapidityHandler,
  createAddVelocitiesHandler,
  createPionAccelTimeHandler,
  createPionFuelFractionHandler,
  createFlipBurnHandler,
  createTwinParadoxHandler
} from './eventHandlers';
import { clearBody } from '../test-utils/dom-helpers';

describe('Event Handler Factories', () => {
  beforeEach(() => {
    clearBody();
  });

  describe('createLorentzHandler', () => {
    it('creates a function', () => {
      const getInput = vi.fn(() => null);
      const getResult = vi.fn(() => null);
      const handler = createLorentzHandler(getInput, getResult);
      expect(typeof handler).toBe('function');
    });

    it('returns early if input is missing', () => {
      const getInput = vi.fn(() => null);
      const getResult = vi.fn(() => document.createElement('span'));
      const handler = createLorentzHandler(getInput, getResult);

      handler();

      expect(getInput).toHaveBeenCalled();
      expect(getResult).toHaveBeenCalled();
    });

    it('returns early if result is missing', () => {
      const input = document.createElement('input');
      const getInput = vi.fn(() => input);
      const getResult = vi.fn(() => null);
      const handler = createLorentzHandler(getInput, getResult);

      handler();

      expect(getInput).toHaveBeenCalled();
      expect(getResult).toHaveBeenCalled();
    });

    it('calculates gamma factor for valid velocity', () => {
      const input = document.createElement('input');
      input.value = '180000000'; // 0.6c in m/s
      const result = document.createElement('span');
      document.body.appendChild(result);

      const getInput = vi.fn(() => input);
      const getResult = vi.fn(() => result);
      const handler = createLorentzHandler(getInput, getResult);

      handler();

      // gamma at 0.6c = 1 / sqrt(1 - 0.36) = 1 / sqrt(0.64) = 1.25
      expect(result.textContent).toContain('1.25');
    });

    it('handles zero velocity', () => {
      const input = document.createElement('input');
      input.value = '0';
      const result = document.createElement('span');
      document.body.appendChild(result);

      const getInput = vi.fn(() => input);
      const getResult = vi.fn(() => result);
      const handler = createLorentzHandler(getInput, getResult);

      handler();

      // gamma at 0c = 1
      expect(result.textContent).toBe('1');
    });
  });

  describe('createRapidityFromVelocityHandler', () => {
    it('creates a function', () => {
      const getInput = vi.fn(() => null);
      const getResult = vi.fn(() => null);
      const handler = createRapidityFromVelocityHandler(getInput, getResult);
      expect(typeof handler).toBe('function');
    });

    it('calculates rapidity for valid velocity', () => {
      const input = document.createElement('input');
      input.value = '149896229'; // 0.5c in m/s
      const result = document.createElement('span');
      document.body.appendChild(result);

      const getInput = vi.fn(() => input);
      const getResult = vi.fn(() => result);
      const handler = createRapidityFromVelocityHandler(getInput, getResult);

      handler();

      // rapidity = atanh(0.5) ≈ 0.549
      expect(result.textContent).toMatch(/0\.54/);
    });

    it('handles zero velocity', () => {
      const input = document.createElement('input');
      input.value = '0';
      const result = document.createElement('span');
      document.body.appendChild(result);

      const getInput = vi.fn(() => input);
      const getResult = vi.fn(() => result);
      const handler = createRapidityFromVelocityHandler(getInput, getResult);

      handler();

      // rapidity at 0c = 0
      expect(result.textContent).toBe('0');
    });
  });

  describe('createVelocityFromRapidityHandler', () => {
    it('creates a function', () => {
      const getInput = vi.fn(() => null);
      const getResult = vi.fn(() => null);
      const handler = createVelocityFromRapidityHandler(getInput, getResult);
      expect(typeof handler).toBe('function');
    });

    it('calculates velocity for valid rapidity', () => {
      const input = document.createElement('input');
      input.value = '0.549'; // rapidity for v=0.5c
      const result = document.createElement('span');
      document.body.appendChild(result);

      const getInput = vi.fn(() => input);
      const getResult = vi.fn(() => result);
      const handler = createVelocityFromRapidityHandler(getInput, getResult);

      handler();

      // Should have units m/s
      expect(result.textContent).toContain('m/s');
      // velocity = tanh(0.549) ≈ 0.5c ≈ 149,896,229 m/s
      expect(result.textContent).toMatch(/149,\d{3},\d{3}/);
    });
  });

  describe('createAddVelocitiesHandler', () => {
    it('creates a function', () => {
      const getV1 = vi.fn(() => null);
      const getV2 = vi.fn(() => null);
      const getResult = vi.fn(() => null);
      const handler = createAddVelocitiesHandler(getV1, getV2, getResult);
      expect(typeof handler).toBe('function');
    });

    it('returns early if any input is missing', () => {
      const v1Input = document.createElement('input');
      const getV1 = vi.fn(() => v1Input);
      const getV2 = vi.fn(() => null);
      const getResult = vi.fn(() => document.createElement('span'));
      const handler = createAddVelocitiesHandler(getV1, getV2, getResult);

      handler();

      expect(getV1).toHaveBeenCalled();
      expect(getV2).toHaveBeenCalled();
      expect(getResult).toHaveBeenCalled();
    });

    it('adds velocities relativistically', () => {
      const v1Input = document.createElement('input');
      v1Input.value = '0.5';
      const v2Input = document.createElement('input');
      v2Input.value = '0.5';
      const result = document.createElement('span');
      document.body.appendChild(result);

      const getV1 = vi.fn(() => v1Input);
      const getV2 = vi.fn(() => v2Input);
      const getResult = vi.fn(() => result);
      const handler = createAddVelocitiesHandler(getV1, getV2, getResult);

      handler();

      // Relativistic addition: (0.5c + 0.5c) / (1 + 0.5*0.5) = 1c / 1.25 = 0.8c
      expect(result.textContent).toContain('0.8');
      expect(result.textContent).toContain('c');
    });
  });

  describe('createPionAccelTimeHandler', () => {
    it('creates a function', () => {
      const getFuelMass = vi.fn(() => null);
      const getDryMass = vi.fn(() => null);
      const getEfficiency = vi.fn(() => null);
      const getResult = vi.fn(() => null);
      const handler = createPionAccelTimeHandler(getFuelMass, getDryMass, getEfficiency, getResult);
      expect(typeof handler).toBe('function');
    });

    it('calculates acceleration time for valid inputs', () => {
      const fuelMassInput = document.createElement('input');
      fuelMassInput.value = '1000';
      const dryMassInput = document.createElement('input');
      dryMassInput.value = '500';
      const efficiencyInput = document.createElement('input');
      efficiencyInput.value = '0.85';
      const result = document.createElement('span');
      document.body.appendChild(result);

      const getFuelMass = vi.fn(() => fuelMassInput);
      const getDryMass = vi.fn(() => dryMassInput);
      const getEfficiency = vi.fn(() => efficiencyInput);
      const getResult = vi.fn(() => result);
      const handler = createPionAccelTimeHandler(getFuelMass, getDryMass, getEfficiency, getResult);

      handler();

      // Should return a result with units "days"
      expect(result.textContent).toContain('days');
      // Should be a positive number
      expect(result.textContent).toMatch(/\d+/);
    });

    it('handles invalid efficiency', () => {
      const fuelMassInput = document.createElement('input');
      fuelMassInput.value = '1000';
      const dryMassInput = document.createElement('input');
      dryMassInput.value = '500';
      const efficiencyInput = document.createElement('input');
      efficiencyInput.value = '1.5'; // Invalid: > 1.0
      const result = document.createElement('span');
      document.body.appendChild(result);

      const getFuelMass = vi.fn(() => fuelMassInput);
      const getDryMass = vi.fn(() => dryMassInput);
      const getEfficiency = vi.fn(() => efficiencyInput);
      const getResult = vi.fn(() => result);
      const handler = createPionAccelTimeHandler(getFuelMass, getDryMass, getEfficiency, getResult);

      handler();

      // Should show error message
      expect(result.textContent).toContain('Efficiency must be between');
    });
  });

  describe('createPionFuelFractionHandler', () => {
    it('creates a function', () => {
      const getAccel = vi.fn(() => null);
      const getThrustTime = vi.fn(() => null);
      const getEfficiency = vi.fn(() => null);
      const getDryMass = vi.fn(() => null);
      const getResultFraction = vi.fn(() => null);
      const getResultMass = vi.fn(() => null);
      const handler = createPionFuelFractionHandler(
        getAccel, getThrustTime, getEfficiency, getDryMass, getResultFraction, getResultMass
      );
      expect(typeof handler).toBe('function');
    });

    it('calculates fuel fraction for valid inputs', () => {
      const accelInput = document.createElement('input');
      accelInput.value = '1';
      const thrustTimeInput = document.createElement('input');
      thrustTimeInput.value = '365';
      const efficiencyInput = document.createElement('input');
      efficiencyInput.value = '0.85';
      const dryMassInput = document.createElement('input');
      dryMassInput.value = '1000';
      const resultFraction = document.createElement('span');
      const resultMass = document.createElement('span');
      document.body.appendChild(resultFraction);
      document.body.appendChild(resultMass);

      const getAccel = vi.fn(() => accelInput);
      const getThrustTime = vi.fn(() => thrustTimeInput);
      const getEfficiency = vi.fn(() => efficiencyInput);
      const getDryMass = vi.fn(() => dryMassInput);
      const getResultFraction = vi.fn(() => resultFraction);
      const getResultMass = vi.fn(() => resultMass);
      const handler = createPionFuelFractionHandler(
        getAccel, getThrustTime, getEfficiency, getDryMass, getResultFraction, getResultMass
      );

      handler();

      // Should return fuel fraction with % units
      expect(resultFraction.textContent).toContain('%');
      // Should return fuel mass (some unit)
      expect(resultMass.textContent).toMatch(/\d+/);
    });

    it('handles invalid acceleration', () => {
      const accelInput = document.createElement('input');
      accelInput.value = '150'; // Invalid: > 100
      const thrustTimeInput = document.createElement('input');
      thrustTimeInput.value = '365';
      const efficiencyInput = document.createElement('input');
      efficiencyInput.value = '0.85';
      const dryMassInput = document.createElement('input');
      dryMassInput.value = '1000';
      const resultFraction = document.createElement('span');
      const resultMass = document.createElement('span');
      document.body.appendChild(resultFraction);
      document.body.appendChild(resultMass);

      const getAccel = vi.fn(() => accelInput);
      const getThrustTime = vi.fn(() => thrustTimeInput);
      const getEfficiency = vi.fn(() => efficiencyInput);
      const getDryMass = vi.fn(() => dryMassInput);
      const getResultFraction = vi.fn(() => resultFraction);
      const getResultMass = vi.fn(() => resultMass);
      const handler = createPionFuelFractionHandler(
        getAccel, getThrustTime, getEfficiency, getDryMass, getResultFraction, getResultMass
      );

      handler();

      // Should show error message
      expect(resultFraction.textContent).toContain('Acceleration must be between');
      expect(resultMass.textContent).toBe('-');
    });
  });

  describe('createFlipBurnHandler', () => {
    it('formats star count without double tilde for large values', async () => {
      // Setup DOM elements
      const accelInput = document.createElement('input');
      accelInput.value = '1'; // 1g
      const distanceInput = document.createElement('input');
      distanceInput.value = '30000'; // 30000 light years
      const dryMassInput = document.createElement('input');
      dryMassInput.value = '78000';
      const efficiencyInput = document.createElement('input');
      efficiencyInput.value = '0.85';

      const resultFlipStars = document.createElement('span');
      const resultFlipGalaxyFraction = document.createElement('span');

      document.body.appendChild(resultFlipStars);
      document.body.appendChild(resultFlipGalaxyFraction);

      const getAccel = vi.fn(() => accelInput);
      const getDistance = vi.fn(() => distanceInput);
      const getDryMass = vi.fn(() => dryMassInput);
      const getEfficiency = vi.fn(() => efficiencyInput);
      const getResults = vi.fn(() => [
        null, null, null, null, null, null, null, null,
        resultFlipStars, resultFlipGalaxyFraction
      ]);
      const chartRegistry = { current: new Map() };

      const handler = createFlipBurnHandler(
        getAccel, getDistance, getDryMass, getEfficiency,
        getResults, chartRegistry
      );

      // Execute handler
      handler();

      // Wait for async requestAnimationFrame to complete
      await new Promise(resolve => setTimeout(resolve, 10));

      // Verify star count doesn't have double tilde
      const starText = resultFlipStars.textContent;
      expect(starText).toBeTruthy();
      expect(starText).toMatch(/^~/); // Should start with single ~
      expect(starText).not.toMatch(/^~~/); // Should NOT start with ~~

      // Should be a formatted number like "~99,770,180,100"
      expect(starText).toMatch(/^~[\d,]+$/);
    });

    it('formats small star counts with tilde', async () => {
      const accelInput = document.createElement('input');
      accelInput.value = '1';
      const distanceInput = document.createElement('input');
      distanceInput.value = '10'; // Very close - should be < 1000 stars
      const dryMassInput = document.createElement('input');
      dryMassInput.value = '78000';
      const efficiencyInput = document.createElement('input');
      efficiencyInput.value = '0.85';

      const resultFlipStars = document.createElement('span');
      const resultFlipGalaxyFraction = document.createElement('span');

      document.body.appendChild(resultFlipStars);
      document.body.appendChild(resultFlipGalaxyFraction);

      const getAccel = vi.fn(() => accelInput);
      const getDistance = vi.fn(() => distanceInput);
      const getDryMass = vi.fn(() => dryMassInput);
      const getEfficiency = vi.fn(() => efficiencyInput);
      const getResults = vi.fn(() => [
        null, null, null, null, null, null, null, null,
        resultFlipStars, resultFlipGalaxyFraction
      ]);
      const chartRegistry = { current: new Map() };

      const handler = createFlipBurnHandler(
        getAccel, getDistance, getDryMass, getEfficiency,
        getResults, chartRegistry
      );

      handler();
      await new Promise(resolve => setTimeout(resolve, 10));

      const starText = resultFlipStars.textContent;
      expect(starText).toBeTruthy();
      // Small counts (< 1000) should also have tilde prefix
      expect(starText).toMatch(/^~\d+$/);
    });
  });

  describe('createTwinParadoxHandler', () => {
    it('accepts velocities up to but not reaching 1.0', async () => {
      // Setup DOM elements
      const velocityInput = document.createElement('input');
      velocityInput.value = '0.9999999999999'; // High precision velocity < 1.0
      const timeInput = document.createElement('input');
      timeInput.value = '4';

      const resultTwins1 = document.createElement('span');
      const resultTwins2 = document.createElement('span');
      const resultTwins3 = document.createElement('span');
      const resultTwins4 = document.createElement('span');
      const resultTwins5 = document.createElement('span');
      const resultTwins6 = document.createElement('span');
      const resultTwins7 = document.createElement('span');

      document.body.appendChild(resultTwins1);
      document.body.appendChild(resultTwins2);
      document.body.appendChild(resultTwins3);
      document.body.appendChild(resultTwins4);
      document.body.appendChild(resultTwins5);
      document.body.appendChild(resultTwins6);
      document.body.appendChild(resultTwins7);

      const getVelocity = vi.fn(() => velocityInput);
      const getTime = vi.fn(() => timeInput);
      const getResults = vi.fn(() => [
        resultTwins1, resultTwins2, resultTwins3, resultTwins4,
        resultTwins5, resultTwins6, resultTwins7
      ]);
      const chartRegistry = { current: new Map() };

      const handler = createTwinParadoxHandler(
        getVelocity, getTime, getResults, chartRegistry
      );

      // Execute handler
      handler();

      // Wait for async requestAnimationFrame to complete
      await new Promise(resolve => setTimeout(resolve, 10));

      // Verify the velocity was NOT clamped (should remain 0.9999999999999)
      expect(velocityInput.value).toBe('0.9999999999999');

      // Verify calculations completed (results should be populated, not "Working...")
      expect(resultTwins1.textContent).not.toBe('Working...');
      expect(resultTwins1.textContent).toMatch(/\d+/); // Should contain numbers
      expect(resultTwins1.textContent).toContain('yrs'); // Should have units
    });

    it('clamps velocities at exactly 1.0 to below 1.0', async () => {
      const velocityInput = document.createElement('input');
      velocityInput.value = '1.0'; // Exactly 1.0c
      const timeInput = document.createElement('input');
      timeInput.value = '4';

      const resultTwins1 = document.createElement('span');
      document.body.appendChild(resultTwins1);

      const getVelocity = vi.fn(() => velocityInput);
      const getTime = vi.fn(() => timeInput);
      const getResults = vi.fn(() => [resultTwins1, null, null, null, null, null, null]);
      const chartRegistry = { current: new Map() };

      const handler = createTwinParadoxHandler(
        getVelocity, getTime, getResults, chartRegistry
      );

      handler();
      await new Promise(resolve => setTimeout(resolve, 10));

      // Should be clamped to a value < 1.0
      const clampedValue = parseFloat(velocityInput.value);
      expect(clampedValue).toBeLessThan(1.0);
    });
  });
});
