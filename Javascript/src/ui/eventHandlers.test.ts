import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createLorentzHandler,
  createRapidityFromVelocityHandler,
  createVelocityFromRapidityHandler,
  createAddVelocitiesHandler,
  createPionAccelTimeHandler,
  createPionFuelFractionHandler
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
});
