import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import {
	formatCoordinate,
	calculateGamma,
	lorentzTransform,
	debounce,
	createScaleSet
} from './minkowski-core';

describe('Minkowski Core Utilities', () => {
	describe('formatCoordinate', () => {
		it('formats positive numbers', () => {
			const result = formatCoordinate(new Decimal('1.234'));
			expect(result).toMatch(/1\.2/); // Using formatSignificant with 2 sig figs
		});

		it('formats negative numbers', () => {
			const result = formatCoordinate(new Decimal('-1.234'));
			expect(result).toMatch(/-1\.2/);
		});

		it('formats zero', () => {
			const result = formatCoordinate(new Decimal('0'));
			expect(result).toBe('0');
		});

		it('formats very small numbers', () => {
			const result = formatCoordinate(new Decimal('0.0001'));
			// formatSignificant handles small values
			expect(result).toMatch(/0\.0001|1\.0e-4/i);
		});

		it('formats very large numbers', () => {
			const result = formatCoordinate(new Decimal('100000'));
			// formatSignificant uses comma formatting for large values
			expect(result).toMatch(/100,000|1\.0e\+5/i);
		});
	});

	describe('calculateGamma', () => {
		it('returns 1 for zero velocity', () => {
			expect(calculateGamma(0)).toBe(1);
		});

		it('returns correct gamma for 0.6c', () => {
			// gamma = 1/sqrt(1-0.36) = 1/sqrt(0.64) = 1/0.8 = 1.25
			expect(calculateGamma(0.6)).toBeCloseTo(1.25, 10);
		});

		it('returns correct gamma for 0.8c', () => {
			// gamma = 1/sqrt(1-0.64) = 1/sqrt(0.36) = 1/0.6 = 1.666...
			expect(calculateGamma(0.8)).toBeCloseTo(1.666666667, 5);
		});

		it('returns large gamma for high velocity', () => {
			expect(calculateGamma(0.99)).toBeGreaterThan(7);
		});

		it('returns very large gamma for velocity near c', () => {
			expect(calculateGamma(0.999)).toBeGreaterThan(22);
		});
	});

	describe('lorentzTransform', () => {
		it('returns identity for zero velocity', () => {
			const result = lorentzTransform(5, 3, 0);
			expect(result.ctPrime).toBeCloseTo(5, 10);
			expect(result.xPrime).toBeCloseTo(3, 10);
		});

		it('preserves spacetime interval', () => {
			const ct = 5, x = 3, beta = 0.5;
			// Spacetime interval: s^2 = (ct)^2 - x^2
			const originalInterval = ct * ct - x * x;

			const result = lorentzTransform(ct, x, beta);
			const transformedInterval = result.ctPrime * result.ctPrime - result.xPrime * result.xPrime;

			expect(transformedInterval).toBeCloseTo(originalInterval, 10);
		});

		it('light-like events remain light-like', () => {
			// Event on light cone: ct = x
			const result = lorentzTransform(1, 1, 0.5);
			// Should still be on light cone: ct' = x'
			expect(Math.abs(result.ctPrime)).toBeCloseTo(Math.abs(result.xPrime), 10);
		});

		it('transforms correctly at 0.6c', () => {
			const ct = 5, x = 3, beta = 0.6;
			const gamma = calculateGamma(beta);

			// Manual calculation
			const expectedCtPrime = gamma * (ct - beta * x);
			const expectedXPrime = gamma * (x - beta * ct);

			const result = lorentzTransform(ct, x, beta);
			expect(result.ctPrime).toBeCloseTo(expectedCtPrime, 10);
			expect(result.xPrime).toBeCloseTo(expectedXPrime, 10);
		});

		it('handles negative coordinates', () => {
			const result = lorentzTransform(-5, -3, 0.4);
			expect(result.ctPrime).toBeLessThan(0);
			expect(result.xPrime).toBeLessThan(0);
		});
	});

	describe('createScaleSet', () => {
		it('returns scale functions and maxCoord', () => {
			const scales = createScaleSet(10, 900);
			expect(scales).toHaveProperty('xScale');
			expect(scales).toHaveProperty('yScale');
			expect(scales).toHaveProperty('maxCoord');
			expect(scales.maxCoord).toBe(10);
		});

		it('xScale maps 0 to center', () => {
			const scales = createScaleSet(10, 900);
			expect(scales.xScale(0)).toBe(450); // Center at size/2
		});

		it('yScale maps 0 to center', () => {
			const scales = createScaleSet(10, 900);
			expect(scales.yScale(0)).toBe(450);
		});

		it('xScale increases for positive x', () => {
			const scales = createScaleSet(10, 900);
			expect(scales.xScale(5)).toBeGreaterThan(scales.xScale(0));
			expect(scales.xScale(-5)).toBeLessThan(scales.xScale(0));
		});

		it('yScale decreases for positive ct (inverted y-axis)', () => {
			const scales = createScaleSet(10, 900);
			// In spacetime diagrams, positive ct goes up, but SVG y increases downward
			expect(scales.yScale(5)).toBeLessThan(scales.yScale(0));
			expect(scales.yScale(-5)).toBeGreaterThan(scales.yScale(0));
		});

		it('scales maxCoord to edge', () => {
			const scales = createScaleSet(10, 900);
			expect(scales.xScale(10)).toBe(900); // Right edge
			expect(scales.xScale(-10)).toBe(0);  // Left edge
			expect(scales.yScale(10)).toBe(0);   // Top edge (inverted)
			expect(scales.yScale(-10)).toBe(900); // Bottom edge (inverted)
		});
	});

	describe('debounce', () => {
		it('delays function execution', async () => {
			let callCount = 0;
			const fn = debounce(() => { callCount++; }, 100);

			fn();
			fn();
			fn();

			expect(callCount).toBe(0);

			await new Promise(resolve => setTimeout(resolve, 150));
			expect(callCount).toBe(1);
		});

		it('cancels previous timeouts', async () => {
			let callCount = 0;
			const fn = debounce(() => { callCount++; }, 50);

			fn();
			await new Promise(resolve => setTimeout(resolve, 25));
			fn();
			await new Promise(resolve => setTimeout(resolve, 25));
			fn();

			// Still within debounce window
			expect(callCount).toBe(0);

			await new Promise(resolve => setTimeout(resolve, 60));
			expect(callCount).toBe(1); // Only called once
		});

		it('passes arguments correctly', async () => {
			let receivedArgs: any[] = [];
			const fn = debounce((...args: any[]) => { receivedArgs = args; }, 50);

			fn('hello', 42, true);

			await new Promise(resolve => setTimeout(resolve, 60));
			expect(receivedArgs).toEqual(['hello', 42, true]);
		});
	});
});
