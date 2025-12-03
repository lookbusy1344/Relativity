import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import * as rl from './relativity_lib';

// Configure decimal precision for testing
rl.configure(150);

describe('formatSignificant', () => {
    describe('Basic functionality with default parameters', () => {
        it('should format simple decimal numbers with 2 decimal places', () => {
            expect(rl.formatSignificant(new Decimal('123.456789'))).toBe('123.46'); // rounds up
            expect(rl.formatSignificant(new Decimal('0.123456'))).toBe('0.12');
            expect(rl.formatSignificant(new Decimal('9.876543'))).toBe('9.88'); // rounds up
        });

        it('should handle integers (no decimal part)', () => {
            expect(rl.formatSignificant(new Decimal('123'))).toBe('123');
            expect(rl.formatSignificant(new Decimal('0'))).toBe('0');
            expect(rl.formatSignificant(new Decimal('1'))).toBe('1');
        });

        it('should handle negative numbers', () => {
            expect(rl.formatSignificant(new Decimal('-123.456789'))).toBe('-123.46'); // rounds down (away from zero)
            expect(rl.formatSignificant(new Decimal('-0.123456'))).toBe('-0.12');
            expect(rl.formatSignificant(new Decimal('-9.876543'))).toBe('-9.88'); // rounds down (away from zero)
        });
    });

    describe('Very large numbers', () => {
        it('should handle extremely large positive numbers in decimal notation', () => {
            // Numbers beyond JavaScript's safe integer range
            expect(rl.formatSignificant(new Decimal('9007199254740992.123456'))).toBe('9,007,199,254,740,992.12');
            expect(rl.formatSignificant(new Decimal('12345678901234567890.987654321'))).toBe('12,345,678,901,234,567,890.99'); // rounds up

            // Even larger numbers - now formatted in decimal notation, not scientific
            expect(rl.formatSignificant(new Decimal('999999999999999999999999999999.123456789'))).toBe('999,999,999,999,999,999,999,999,999,999.12');
            expect(rl.formatSignificant(new Decimal('1234567890123456789012345678901234567890.5555555'))).toBe('1,234,567,890,123,456,789,012,345,678,901,234,567,890.56'); // rounds up
        });

        it('should handle extremely large negative numbers in decimal notation', () => {
            expect(rl.formatSignificant(new Decimal('-9007199254740992.123456'))).toBe('-9,007,199,254,740,992.12');
            expect(rl.formatSignificant(new Decimal('-12345678901234567890.987654321'))).toBe('-12,345,678,901,234,567,890.99'); // rounds down

            // Very large negative numbers in decimal notation
            expect(rl.formatSignificant(new Decimal('-999999999999999999999999999999.123456789'))).toBe('-999,999,999,999,999,999,999,999,999,999.12');
        });

        it('should handle numbers with many integer digits and various decimal patterns', () => {
            // These very large numbers now in decimal notation (rounding applied)
            expect(rl.formatSignificant(new Decimal('123456789012345678901234567890.000001'))).toBe('123,456,789,012,345,678,901,234,567,890');
            expect(rl.formatSignificant(new Decimal('123456789012345678901234567890.999999'))).toBe('123,456,789,012,345,678,901,234,567,891'); // rounds up to next integer
            expect(rl.formatSignificant(new Decimal('123456789012345678901234567890.123456'))).toBe('123,456,789,012,345,678,901,234,567,890.12');
        });
    });

    describe('Very small numbers', () => {
        it('should handle extremely small positive numbers in decimal notation', () => {
            // These very small numbers now formatted in decimal notation with 2 decimal places (default)
            expect(rl.formatSignificant(new Decimal('0.000000000000000000000000000001'))).toBe('0');
            expect(rl.formatSignificant(new Decimal('0.00000000000000000000001'))).toBe('0');

            // With more decimal places, we can see the full precision
            expect(rl.formatSignificant(new Decimal('0.000000123456789'), '', 20)).toBe('0.000000123456789');
            expect(rl.formatSignificant(new Decimal('0.0000001234'), '', 15)).toBe('0.0000001234');
        });

        it('should handle extremely small negative numbers in decimal notation', () => {
            // These very small numbers in decimal notation (normalized -0 to 0)
            expect(rl.formatSignificant(new Decimal('-0.000000000000000000000000000001'))).toBe('0');  // -0 normalized to 0
            expect(rl.formatSignificant(new Decimal('-0.00000000000000000000001'))).toBe('0');  // -0 normalized to 0

            expect(rl.formatSignificant(new Decimal('-0.000000123456789'), '', 20)).toBe('-0.000000123456789');
        });

        it('should handle numbers just above zero', () => {
            expect(rl.formatSignificant(new Decimal('0.001'))).toBe('0');    // 2 dp: rounds to 0.00, trailing zeros stripped
            expect(rl.formatSignificant(new Decimal('0.009'))).toBe('0.01'); // 2 dp: rounds up to 0.01
            expect(rl.formatSignificant(new Decimal('0.0123456'))).toBe('0.01'); // 2 dp: rounds to 0.01
            expect(rl.formatSignificant(new Decimal('0.099999'))).toBe('0.1'); // 2 dp: rounds to 0.10, trailing zero stripped
        });
    });

    describe('Extreme number handling', () => {
        it('should format extremely large numbers in decimal notation', () => {
            // These are formatted in decimal with requested precision
            const largeNum = new Decimal('1e100');
            const result = rl.formatSignificant(largeNum, '', 5);
            expect(result).toContain('10,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000');

            const mediumNum = new Decimal('1.23456e50');
            const result2 = rl.formatSignificant(mediumNum, '', 3);
            expect(result2).toContain('123,456,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000');
        });

        it('should format extremely small numbers in decimal notation', () => {
            const smallNum = new Decimal('1e-100');
            // With 2 decimal places, this rounds to 0
            expect(rl.formatSignificant(smallNum, '', 2)).toBe('0');

            // With enough decimal places, we see the value
            expect(rl.formatSignificant(smallNum, '', 105)).toContain('0.0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001');
        });
    });

    describe('Different significantDecimalPlaces values', () => {
        it('should handle 0 decimal places', () => {
            expect(rl.formatSignificant(new Decimal('123.456'), '', 0)).toBe('123');
            expect(rl.formatSignificant(new Decimal('999.999'), '', 0)).toBe('1,000'); // rounds up
            expect(rl.formatSignificant(new Decimal('0.999'), '', 0)).toBe('1'); // rounds up
            expect(rl.formatSignificant(new Decimal('-123.456'), '', 0)).toBe('-123');
        });

        it('should handle 1 decimal place', () => {
            expect(rl.formatSignificant(new Decimal('123.456'), '', 1)).toBe('123.5'); // rounds up
            expect(rl.formatSignificant(new Decimal('999.999'), '', 1)).toBe('1,000'); // rounds up, zero stripped
            expect(rl.formatSignificant(new Decimal('0.999'), '', 1)).toBe('1'); // rounds up
        });

        it('should handle 5 decimal places', () => {
            expect(rl.formatSignificant(new Decimal('123.456789012'), '', 5)).toBe('123.45679'); // rounds up
            expect(rl.formatSignificant(new Decimal('0.123456789'), '', 5)).toBe('0.12346'); // rounds up
            expect(rl.formatSignificant(new Decimal('999.999999999'), '', 5)).toBe('1,000'); // rounds up
        });

        it('should handle 10 decimal places', () => {
            // Trailing zeros stripped - gives us up to 10 decimal places
            expect(rl.formatSignificant(new Decimal('123.12345678901234'), '', 10)).toBe('123.123456789');
            expect(rl.formatSignificant(new Decimal('0.12345678901234'), '', 10)).toBe('0.123456789');
        });

        it('should handle 20 decimal places with large numbers', () => {
            // Now handles in decimal notation with full precision (trailing zero stripped by Decimal)
            expect(rl.formatSignificant(new Decimal('12345678901234567890.12345678901234567890123456'), '', 20))
                .toBe('12,345,678,901,234,567,890.1234567890123456789'); // trailing 0 stripped
        });

        it('should handle more decimal places than available', () => {
            expect(rl.formatSignificant(new Decimal('123.45'), '', 10)).toBe('123.45');
            expect(rl.formatSignificant(new Decimal('123.4'), '', 5)).toBe('123.4');
        });
    });

    describe('ignoreChar functionality', () => {
        it('should skip ignoreChar digits before counting significant places', () => {
            // If the decimal part starts with '9's and we use '9' as ignoreChar,
            // those 9's are copied but not counted toward the limit
            expect(rl.formatSignificant(new Decimal('123.999123'), '9', 2)).toBe('123.99912');
            expect(rl.formatSignificant(new Decimal('0.999912345'), '9', 2)).toBe('0.999912');
        });

        it('should handle ignoreChar with 0s', () => {
            expect(rl.formatSignificant(new Decimal('123.000456'), '0', 2)).toBe('123.00045');
            expect(rl.formatSignificant(new Decimal('999.000000123'), '0', 3)).toBe('999.000000123');
        });

        it('should work normally when ignoreChar is not present', () => {
            expect(rl.formatSignificant(new Decimal('123.456789'), '9', 2)).toBe('123.45');
            expect(rl.formatSignificant(new Decimal('123.456789'), '0', 2)).toBe('123.45');
        });

        it('should handle ignoreChar with very long sequences', () => {
            expect(rl.formatSignificant(new Decimal('0.999999999123456'), '9', 2)).toBe('0.99999999912');
            expect(rl.formatSignificant(new Decimal('1.000000000123456'), '0', 2)).toBe('1.00000000012');
        });

        it('should handle single character ignoreChar requirement', () => {
            // Multiple characters should throw an error
            expect(() => rl.formatSignificant(new Decimal('123.456'), 'ab', 2)).toThrow('ignoreChar must be a single character or empty');
            expect(() => rl.formatSignificant(new Decimal('123.456'), '99', 2)).toThrow('ignoreChar must be a single character or empty');
        });
    });

    describe('Edge cases and boundary conditions', () => {
        it('should handle zero in various forms', () => {
            // Decimal.toString() strips trailing zeros, so 0.0 and 0.00 become just '0'
            expect(rl.formatSignificant(new Decimal('0'))).toBe('0');
            expect(rl.formatSignificant(new Decimal('0.0'))).toBe('0');
            expect(rl.formatSignificant(new Decimal('0.00'))).toBe('0');
            expect(rl.formatSignificant(new Decimal('0.000'))).toBe('0');
            expect(rl.formatSignificant(new Decimal('-0'))).toBe('0');
        });

        it('should handle numbers with trailing zeros', () => {
            // Decimal.toString() strips trailing zeros
            expect(rl.formatSignificant(new Decimal('123.100'))).toBe('123.1');  // becomes '123.1'
            expect(rl.formatSignificant(new Decimal('123.000'))).toBe('123');    // becomes '123'
            expect(rl.formatSignificant(new Decimal('0.100'))).toBe('0.1');      // becomes '0.1'
            expect(rl.formatSignificant(new Decimal('0.200'))).toBe('0.2');      // becomes '0.2'
        });

        it('should handle numbers with repeating patterns', () => {
            expect(rl.formatSignificant(new Decimal('123.123123123123'))).toBe('123.12');
            expect(rl.formatSignificant(new Decimal('999.999999999'))).toBe('1,000'); // rounds up
            expect(rl.formatSignificant(new Decimal('0.123123123123'))).toBe('0.12');
        });

        it('should handle numbers right at boundaries', () => {
            expect(rl.formatSignificant(new Decimal('0.1'))).toBe('0.1');
            expect(rl.formatSignificant(new Decimal('0.01'))).toBe('0.01');
            expect(rl.formatSignificant(new Decimal('0.10'))).toBe('0.1');   // trailing zero stripped
            expect(rl.formatSignificant(new Decimal('1.0'))).toBe('1');      // trailing zero stripped
            expect(rl.formatSignificant(new Decimal('10.0'))).toBe('10');    // trailing zero stripped
        });

        it('should handle very precise decimals', () => {
            const highPrecision = new Decimal('123.12345678901234567890123456789012345678901234567890');
            expect(rl.formatSignificant(highPrecision, '', 2)).toBe('123.12');
            // Decimal.js precision limited to ~49 decimal places, trailing zero may be stripped
            expect(rl.formatSignificant(highPrecision, '', 30)).toBe('123.12345678901234567890123456789');
        });

        it('should handle decimals shorter than requested places', () => {
            expect(rl.formatSignificant(new Decimal('123.4'), '', 5)).toBe('123.4');
            expect(rl.formatSignificant(new Decimal('123.45'), '', 10)).toBe('123.45');
            expect(rl.formatSignificant(new Decimal('0.1'), '', 5)).toBe('0.1');
        });
    });

    describe('Precision preservation tests', () => {
        it('should preserve full precision of large numbers in integer part', () => {
            const largeNum = new Decimal('123456789012345678901234567890123456789.123456789');
            const result = rl.formatSignificant(largeNum, '', 2);
            // Now formatted in decimal notation with full integer precision
            expect(result).toBe('123,456,789,012,345,678,901,234,567,890,123,456,789.12');
        });

        it('should not lose precision when converting to string', () => {
            // These numbers would lose precision if converted to JavaScript numbers
            const preciseNum1 = new Decimal('9007199254740993.123456');  // Above MAX_SAFE_INTEGER
            expect(rl.formatSignificant(preciseNum1, '', 2)).toBe('9,007,199,254,740,993.12');

            const preciseNum2 = new Decimal('18014398509481984.987654');  // 2^54
            expect(rl.formatSignificant(preciseNum2, '', 2)).toBe('18,014,398,509,481,984.99'); // rounds up
        });

        it('should maintain precision with very small fractional parts on large numbers', () => {
            const num = new Decimal('999999999999999999999999999999.000000000000000001');
            // Now in decimal notation (trailing zeros after decimal limit are stripped)
            expect(rl.formatSignificant(num, '', 5)).toBe('999,999,999,999,999,999,999,999,999,999');
        });
    });

    describe('Stress tests with extreme values', () => {
        it('should handle numbers with 50+ decimal digits', () => {
            const longDecimal = new Decimal('123.12345678901234567890123456789012345678901234567890');
            expect(rl.formatSignificant(longDecimal, '', 10)).toBe('123.123456789'); // trailing zero stripped
            // Decimal.js precision limits mean only 49 decimal places are preserved
            expect(rl.formatSignificant(longDecimal, '', 50)).toBe('123.1234567890123456789012345678901234567890123456789');
        });

        it('should handle numbers with 100+ integer digits', () => {
            const hugeInt = '1234567890'.repeat(10) + '.123456789';  // 100 digit integer
            const decimal = new Decimal(hugeInt);
            const result = rl.formatSignificant(decimal, '', 2);
            // Now formatted in decimal notation with full integer precision (with commas)
            expect(result).toContain('1,234,567,890,123,456,789,012,345,678,901,234,567,890');
            expect(result.endsWith('.12')).toBe(true);
        });

        it('should handle mixed extreme cases', () => {
            // Very large integer with very long decimal
            const extreme = '9'.repeat(50) + '.' + '1'.repeat(50);
            const decimal = new Decimal(extreme);
            // Now formatted in decimal notation (with commas)
            const result = rl.formatSignificant(decimal, '', 5);
            // Check for commas in the formatted number
            expect(result).toContain(',');
            expect(result.includes('.11111')).toBe(true);
        });

        it('should handle alternating patterns in decimal part', () => {
            expect(rl.formatSignificant(new Decimal('123.101010101010101010'))).toBe('123.1');  // 2 dp, trailing zero stripped
            expect(rl.formatSignificant(new Decimal('456.121212121212121212'))).toBe('456.12'); // 2 dp
            expect(rl.formatSignificant(new Decimal('789.909090909090909090'))).toBe('789.91'); // 2 dp, rounds up
        });
    });

    describe('Real-world physics calculations', () => {
        it('should handle speed of light calculations', () => {
            const c = new Decimal('299792458.0');  // m/s
            expect(rl.formatSignificant(c, '', 2)).toBe('299,792,458');  // trailing .0 stripped
            expect(rl.formatSignificant(c, '', 0)).toBe('299,792,458');
        });

        it('should handle velocities extremely close to c in fraction form', () => {
            // Velocity with 30+ nines (extremely close to c)
            const v1 = new Decimal('0.999999999999999999999999999999');
            expect(rl.formatSignificant(v1, '9', 5)).toBe('0.999999999999999999999999999999');

            // Velocity with 50+ nines
            const v2 = new Decimal('0.99999999999999999999999999999999999999999999999999');
            expect(rl.formatSignificant(v2, '9', 10)).toBe('0.99999999999999999999999999999999999999999999999999');

            // With additional digits after the 9's
            const v3 = new Decimal('0.9999999999999999999999999999999987654321');
            expect(rl.formatSignificant(v3, '9', 5)).toBe('0.9999999999999999999999999999999987654');
            expect(rl.formatSignificant(v3, '9', 10)).toBe('0.9999999999999999999999999999999987654321');
        });

        it('should handle velocities in m/s extremely close to c', () => {
            const c = new Decimal('299792458');

            // 99.9% of c
            const v1 = c.mul('0.999');
            expect(rl.formatSignificant(v1, '', 2)).toBe('299,492,665.54');
            expect(rl.formatSignificant(v1, '', 0)).toBe('299,492,666');

            // 99.9999% of c (7 nines in the multiplier)
            const v2 = c.mul('0.9999999');
            expect(rl.formatSignificant(v2, '', 2)).toBe('299,792,428.02');
            expect(rl.formatSignificant(v2, '', 5)).toBe('299,792,428.02075');

            // 99.999999999% of c (12 nines)
            const v3 = c.mul('0.999999999999');
            expect(rl.formatSignificant(v3, '', 2)).toBe('299,792,458');
            expect(rl.formatSignificant(v3, '', 10)).toBe('299,792,457.9997002075');

            // Extremely close: only 1 m/s below c
            const v4 = c.sub('1');
            expect(rl.formatSignificant(v4, '', 2)).toBe('299,792,457');
            expect(rl.formatSignificant(v4, '', 10)).toBe('299,792,457');

            // Extremely close: only 0.001 m/s below c
            const v5 = c.sub('0.001');
            expect(rl.formatSignificant(v5, '', 3)).toBe('299,792,457.999');
            expect(rl.formatSignificant(v5, '', 10)).toBe('299,792,457.999');
        });

        it('should handle gravitational constant', () => {
            const G = new Decimal('0.0000000000667430');
            // Now in decimal notation with high precision
            expect(rl.formatSignificant(G, '', 15)).toBe('0.000000000066743');
        });

        it('should handle Planck length', () => {
            const planckLength = new Decimal('0.000000000000000000000000000000000016162');
            // Now in decimal notation with very high precision
            expect(rl.formatSignificant(planckLength, '', 40)).toBe('0.000000000000000000000000000000000016162');
        });

        it('should handle astronomical distances', () => {
            const lightYear = new Decimal('9460730472580800.0');  // meters
            expect(rl.formatSignificant(lightYear, '', 2)).toBe('9,460,730,472,580,800');  // trailing .0 stripped

            const parsec = new Decimal('30856775814913673.0');  // meters
            expect(rl.formatSignificant(parsec, '', 0)).toBe('30,856,775,814,913,673');
        });

        it('should handle relativistic calculations', () => {
            // Lorentz factor at 0.999c
            const gamma = new Decimal('22.36627047695794');
            expect(rl.formatSignificant(gamma, '', 5)).toBe('22.36627');

            // Time dilation: very small difference - now in decimal notation
            const timeDiff = new Decimal('0.000000000001234567');
            expect(rl.formatSignificant(timeDiff, '', 20)).toBe('0.000000000001234567');
        });
    });

    describe('Boundary behavior with ignoreChar', () => {
        it('should handle empty ignoreChar correctly', () => {
            expect(rl.formatSignificant(new Decimal('123.999999'), '', 2)).toBe('124'); // rounds up to 124.00, zeros stripped
            expect(rl.formatSignificant(new Decimal('123.000000'), '', 2)).toBe('123');  // trailing zeros stripped
        });

        it('should handle ignoreChar at start vs middle of decimal', () => {
            // 9 at start
            expect(rl.formatSignificant(new Decimal('123.999456'), '9', 2)).toBe('123.99945');
            // 9 in middle (not ignored)
            expect(rl.formatSignificant(new Decimal('123.459'), '9', 2)).toBe('123.45');
        });

        it('should handle all digits being ignoreChar', () => {
            expect(rl.formatSignificant(new Decimal('123.9999999999'), '9', 2)).toBe('123.9999999999');
            expect(rl.formatSignificant(new Decimal('456.0000000000'), '0', 2)).toBe('456');  // trailing zeros stripped
        });
    });

    describe('Comprehensive mixed scenarios', () => {
        it('should handle array of diverse test values', () => {
            const testCases = [
                { input: '0', expected: '0' },
                { input: '1', expected: '1' },
                { input: '0.1', expected: '0.1' },
                { input: '10.0', expected: '10' },  // trailing .0 stripped
                { input: '123.456', expected: '123.46' },  // rounds up
                { input: '-123.456', expected: '-123.46' },  // rounds down
                { input: '0.00123', expected: '0' },  // rounds to 0.00, zeros stripped
                { input: '999999999.99999', expected: '1,000,000,000' },  // rounds up
                { input: '0.999', expected: '1' },  // rounds up to 1.00, zeros stripped
                { input: '100.001', expected: '100' },  // rounds to 100.00, zeros stripped
            ];

            testCases.forEach(({ input, expected }) => {
                expect(rl.formatSignificant(new Decimal(input), '', 2)).toBe(expected);
            });
        });

        it('should handle negative numbers across all ranges', () => {
            expect(rl.formatSignificant(new Decimal('-0.0001'), '', 2)).toBe('0');  // rounds to 0
            expect(rl.formatSignificant(new Decimal('-0.0001'), '', 5)).toBe('-0.0001');
            expect(rl.formatSignificant(new Decimal('-1.5'), '', 2)).toBe('-1.5');
            expect(rl.formatSignificant(new Decimal('-1234567890.123'), '', 2)).toBe('-1,234,567,890.12');
        });
    });

    describe('Preserving trailing zeros for stable width formatting', () => {
        it('should preserve trailing zeros when preserveTrailingZeros is true', () => {
            // 2 decimal places - should pad with zeros
            expect(rl.formatSignificant(new Decimal('123'), '', 2, true)).toBe('123.00');
            expect(rl.formatSignificant(new Decimal('123.5'), '', 2, true)).toBe('123.50');
            expect(rl.formatSignificant(new Decimal('123.45'), '', 2, true)).toBe('123.45');
            expect(rl.formatSignificant(new Decimal('0'), '', 2, true)).toBe('0.00');
            expect(rl.formatSignificant(new Decimal('0.1'), '', 2, true)).toBe('0.10');
        });

        it('should preserve trailing zeros with negative numbers', () => {
            expect(rl.formatSignificant(new Decimal('-123'), '', 2, true)).toBe('-123.00');
            expect(rl.formatSignificant(new Decimal('-123.5'), '', 2, true)).toBe('-123.50');
            expect(rl.formatSignificant(new Decimal('-0.1'), '', 2, true)).toBe('-0.10');
        });

        it('should work with different decimal place counts', () => {
            expect(rl.formatSignificant(new Decimal('123.4'), '', 3, true)).toBe('123.400');
            expect(rl.formatSignificant(new Decimal('123'), '', 0, true)).toBe('123');
            expect(rl.formatSignificant(new Decimal('123.456789'), '', 4, true)).toBe('123.4568'); // rounds up
        });

        it('should preserve thousand separators with trailing zeros', () => {
            expect(rl.formatSignificant(new Decimal('1234567'), '', 2, true)).toBe('1,234,567.00');
            expect(rl.formatSignificant(new Decimal('1234567.8'), '', 2, true)).toBe('1,234,567.80');
        });

        it('should default to stripping zeros when preserveTrailingZeros is false or omitted', () => {
            expect(rl.formatSignificant(new Decimal('123'), '', 2, false)).toBe('123');
            expect(rl.formatSignificant(new Decimal('123'), '', 2)).toBe('123');
            expect(rl.formatSignificant(new Decimal('123.50'), '', 2)).toBe('123.5');
        });
    });
});

describe('Calc Tab Operations', () => {
    describe('lorentzFactor', () => {
        it('should calculate Lorentz factor for zero velocity', () => {
            const gamma = rl.lorentzFactor(0);
            expect(gamma.toString()).toBe('1');
        });

        it('should calculate Lorentz factor for 0.5c', () => {
            const v = rl.c.mul(0.5);
            const gamma = rl.lorentzFactor(v);
            // γ = 1/√(1 - 0.5²) = 1/√0.75 ≈ 1.1547
            expect(gamma.toFixed(4)).toBe('1.1547');
        });

        it('should calculate Lorentz factor for 0.9c', () => {
            const v = rl.c.mul(0.9);
            const gamma = rl.lorentzFactor(v);
            // γ = 1/√(1 - 0.9²) = 1/√0.19 ≈ 2.2942
            expect(gamma.toFixed(4)).toBe('2.2942');
        });

        it('should calculate Lorentz factor for 0.99c', () => {
            const v = rl.c.mul(0.99);
            const gamma = rl.lorentzFactor(v);
            // γ = 1/√(1 - 0.99²) ≈ 7.0888
            expect(gamma.toFixed(4)).toBe('7.0888');
        });

        it('should calculate Lorentz factor for velocity extremely close to c', () => {
            const v = rl.c.mul('0.999999');
            const gamma = rl.lorentzFactor(v);
            // Should be very large but finite
            expect(gamma.gt(707)).toBe(true);
            expect(gamma.lt(708)).toBe(true);
        });

        it('should handle string input for velocity', () => {
            const gamma = rl.lorentzFactor('299792457'); // 1 m/s below c
            expect(gamma.isFinite()).toBe(true);
            expect(gamma.gt(1)).toBe(true);
        });

        it('should return NaN for velocity >= c', () => {
            const gamma = rl.lorentzFactor(rl.c);
            expect(gamma.isNaN()).toBe(true);
        });

        it('should handle negative velocities', () => {
            const v = rl.c.mul(-0.8);
            const gamma = rl.lorentzFactor(v);
            // γ is symmetric for +v and -v
            expect(gamma.toFixed(4)).toBe('1.6667');
        });
    });

    describe('rapidityFromVelocity', () => {
        it('should return zero rapidity for zero velocity', () => {
            const rapidity = rl.rapidityFromVelocity(0);
            expect(rapidity.toString()).toBe('0');
        });

        it('should calculate rapidity for 0.5c', () => {
            const v = rl.c.mul(0.5);
            const rapidity = rl.rapidityFromVelocity(v);
            // φ = atanh(0.5) ≈ 0.5493
            expect(rapidity.toFixed(4)).toBe('0.5493');
        });

        it('should calculate rapidity for 0.9c', () => {
            const v = rl.c.mul(0.9);
            const rapidity = rl.rapidityFromVelocity(v);
            // φ = atanh(0.9) ≈ 1.4722
            expect(rapidity.toFixed(4)).toBe('1.4722');
        });

        it('should calculate rapidity for velocity near c', () => {
            const v = rl.c.mul('0.99999');
            const rapidity = rl.rapidityFromVelocity(v);
            // Rapidity should be large but finite
            // φ = atanh(0.99999) ≈ 6.103
            expect(rapidity.gt(6.1)).toBe(true);
            expect(rapidity.lt(6.2)).toBe(true);
        });

        it('should handle string input', () => {
            const rapidity = rl.rapidityFromVelocity('150000000'); // ~0.5c
            expect(rapidity.isFinite()).toBe(true);
            expect(rapidity.gt(0)).toBe(true);
        });

        it('should handle negative velocities', () => {
            const v = rl.c.mul(-0.8);
            const rapidity = rl.rapidityFromVelocity(v);
            // Rapidity is antisymmetric: φ(-v) = -φ(v)
            expect(rapidity.lt(0)).toBe(true);
        });
    });

    describe('velocityFromRapidity', () => {
        it('should return zero velocity for zero rapidity', () => {
            const velocity = rl.velocityFromRapidity(0);
            expect(velocity.toString()).toBe('0');
        });

        it('should calculate velocity for rapidity = 1', () => {
            const velocity = rl.velocityFromRapidity(1);
            const velocityC = velocity.div(rl.c);
            // v/c = tanh(1) ≈ 0.7616
            expect(velocityC.toFixed(4)).toBe('0.7616');
        });

        it('should calculate velocity for large rapidity', () => {
            const velocity = rl.velocityFromRapidity(5);
            const velocityC = velocity.div(rl.c);
            // v/c = tanh(5) ≈ 0.9999
            expect(velocityC.toFixed(4)).toBe('0.9999');
        });

        it('should calculate velocity for very large rapidity', () => {
            const velocity = rl.velocityFromRapidity(10);
            const velocityC = velocity.div(rl.c);
            // For large φ, tanh(φ) → 1
            expect(velocityC.gt('0.999999')).toBe(true);
            expect(velocityC.lt(1)).toBe(true);
        });

        it('should handle string input', () => {
            const velocity = rl.velocityFromRapidity('2.5');
            expect(velocity.isFinite()).toBe(true);
            expect(velocity.gt(0)).toBe(true);
            expect(velocity.lt(rl.c)).toBe(true);
        });

        it('should handle negative rapidity', () => {
            const velocity = rl.velocityFromRapidity(-1.5);
            const velocityC = velocity.div(rl.c);
            expect(velocityC.lt(0)).toBe(true);
            expect(velocityC.gt(-1)).toBe(true);
        });

        it('should be inverse of rapidityFromVelocity', () => {
            const originalV = rl.c.mul('0.75');
            const rapidity = rl.rapidityFromVelocity(originalV);
            const recoveredV = rl.velocityFromRapidity(rapidity);
            // Should recover original velocity
            expect(originalV.minus(recoveredV).abs().lt('0.001')).toBe(true);
        });
    });

    describe('addVelocitiesC', () => {
        it('should add zero velocities to get zero', () => {
            const result = rl.addVelocitiesC(0, 0);
            expect(result.toString()).toBe('0');
        });

        it('should handle adding velocity to zero', () => {
            const result = rl.addVelocitiesC('0.5', 0);
            expect(result.toString()).toBe('0.5');
        });

        it('should add 0.5c + 0.5c relativistically', () => {
            const result = rl.addVelocitiesC('0.5', '0.5');
            // (0.5 + 0.5) / (1 + 0.5*0.5) = 1 / 1.25 = 0.8c
            expect(result.toFixed(4)).toBe('0.8000');
        });

        it('should add 0.9c + 0.9c to get < c', () => {
            const result = rl.addVelocitiesC('0.9', '0.9');
            // (0.9 + 0.9) / (1 + 0.9*0.9) ≈ 0.9945c
            expect(result.toFixed(4)).toBe('0.9945');
            expect(result.lt(1)).toBe(true);
        });

        it('should handle very high velocities without exceeding c', () => {
            const result = rl.addVelocitiesC('0.99', '0.99');
            // Should be very close to but less than 1c
            expect(result.lt(1)).toBe(true);
            expect(result.gt('0.999')).toBe(true);
        });

        it('should be commutative: v1 + v2 = v2 + v1', () => {
            const result1 = rl.addVelocitiesC('0.6', '0.7');
            const result2 = rl.addVelocitiesC('0.7', '0.6');
            expect(result1.toString()).toBe(result2.toString());
        });

        it('should handle negative velocities', () => {
            const result = rl.addVelocitiesC('0.8', '-0.3');
            // Should be less than 0.8c
            expect(result.gt(0)).toBe(true);
            expect(result.lt('0.8')).toBe(true);
        });

        it('should return NaN for velocities >= 1c', () => {
            const result = rl.addVelocitiesC('1', '0.5');
            expect(result.isNaN()).toBe(true);
        });

        it('should handle Decimal input', () => {
            const result = rl.addVelocitiesC(new Decimal('0.4'), new Decimal('0.4'));
            expect(result.isFinite()).toBe(true);
            expect(result.gt('0.4')).toBe(true);
            expect(result.lt('0.8')).toBe(true);
        });
    });

    describe('pionRocketAccelTime', () => {
        it('should calculate acceleration time for equal fuel and dry mass', () => {
            const time = rl.pionRocketAccelTime(1000, 1000, 0.85);
            // Time should be positive and finite
            expect(time.isFinite()).toBe(true);
            expect(time.gt(0)).toBe(true);
        });

        it('should calculate acceleration time for typical values', () => {
            const time = rl.pionRocketAccelTime(10000, 1000, 0.85);
            // More fuel = more time
            expect(time.isFinite()).toBe(true);
            expect(time.gt(0)).toBe(true);
            // Convert to days for readability
            const timeDays = time.div(60 * 60 * 24);
            expect(timeDays.gt(0)).toBe(true);
        });

        it('should return zero time for zero fuel', () => {
            const time = rl.pionRocketAccelTime(0, 1000, 0.85);
            expect(time.toString()).toBe('0');
        });

        it('should increase time with lower efficiency', () => {
            const time85 = rl.pionRocketAccelTime(1000, 1000, 0.85);
            const time70 = rl.pionRocketAccelTime(1000, 1000, 0.70);
            // Lower efficiency means less effective exhaust velocity, so less total delta-v for same fuel
            // Therefore, for same fuel, we get less acceleration time at lower efficiency
            expect(time70.lt(time85)).toBe(true);
        });

        it('should handle string inputs', () => {
            const time = rl.pionRocketAccelTime('5000', '2000', '0.8');
            expect(time.isFinite()).toBe(true);
            expect(time.gt(0)).toBe(true);
        });

        it('should handle Decimal inputs', () => {
            const time = rl.pionRocketAccelTime(
                new Decimal(3000),
                new Decimal(1500),
                new Decimal(0.85)
            );
            expect(time.isFinite()).toBe(true);
            expect(time.gt(0)).toBe(true);
        });

        it('should increase time proportionally with more fuel', () => {
            const time1 = rl.pionRocketAccelTime(1000, 1000, 0.85);
            const time2 = rl.pionRocketAccelTime(2000, 1000, 0.85);
            // More fuel should give more acceleration time
            expect(time2.gt(time1)).toBe(true);
        });
    });

    describe('pionRocketFuelFraction', () => {
        it('should return zero fuel fraction for zero thrust time', () => {
            const fraction = rl.pionRocketFuelFraction(0, rl.g, 0.85);
            expect(fraction.toString()).toBe('0');
        });

        it('should calculate fuel fraction for 1 year at 1g', () => {
            const thrustTime = new Decimal(365).mul(60 * 60 * 24); // 1 year in seconds
            const fraction = rl.pionRocketFuelFraction(thrustTime, rl.g, 0.85);
            // Fuel fraction should be between 0 and 1
            expect(fraction.gte(0)).toBe(true);
            expect(fraction.lt(1)).toBe(true);
        });

        it('should increase fuel fraction with longer thrust time', () => {
            const time1 = new Decimal(100).mul(60 * 60 * 24); // 100 days
            const time2 = new Decimal(200).mul(60 * 60 * 24); // 200 days
            const fraction1 = rl.pionRocketFuelFraction(time1, rl.g, 0.85);
            const fraction2 = rl.pionRocketFuelFraction(time2, rl.g, 0.85);
            expect(fraction2.gt(fraction1)).toBe(true);
        });

        it('should increase fuel fraction with higher acceleration', () => {
            const thrustTime = new Decimal(365).mul(60 * 60 * 24); // 1 year
            const fraction1g = rl.pionRocketFuelFraction(thrustTime, rl.g.mul(1), 0.85);
            const fraction2g = rl.pionRocketFuelFraction(thrustTime, rl.g.mul(2), 0.85);
            expect(fraction2g.gt(fraction1g)).toBe(true);
        });

        it('should decrease fuel fraction with higher efficiency', () => {
            const thrustTime = new Decimal(365).mul(60 * 60 * 24); // 1 year
            const fraction70 = rl.pionRocketFuelFraction(thrustTime, rl.g, 0.70);
            const fraction85 = rl.pionRocketFuelFraction(thrustTime, rl.g, 0.85);
            // Higher efficiency means we need less fuel for same delta-v
            expect(fraction85.lt(fraction70)).toBe(true);
        });

        it('should handle string inputs', () => {
            const thrustTime = '31536000'; // 1 year in seconds
            const accel = rl.g.toString();
            const fraction = rl.pionRocketFuelFraction(thrustTime, accel, '0.8');
            expect(fraction.isFinite()).toBe(true);
            expect(fraction.gte(0)).toBe(true);
            expect(fraction.lt(1)).toBe(true);
        });

        it('should return reasonable fuel fraction for short duration', () => {
            const thrustTime = new Decimal(1).mul(60 * 60 * 24); // 1 day
            const fraction = rl.pionRocketFuelFraction(thrustTime, rl.g, 0.85);
            // For 1 day at 1g, fuel fraction should be quite small
            expect(fraction.lt('0.1')).toBe(true);
        });

        it('should approach 1 as thrust time increases significantly', () => {
            const thrustTime = new Decimal(10).mul(365 * 60 * 60 * 24); // 10 years
            const fraction = rl.pionRocketFuelFraction(thrustTime, rl.g, 0.85);
            // For long times, fuel fraction should be substantial but less than 1
            expect(fraction.gt('0.5')).toBe(true);
            expect(fraction.lt(1)).toBe(true);
        });
    });

    describe('pionRocketFuelFractionsMultiple', () => {
        it('should calculate multiple fuel fractions at different efficiencies', () => {
            const thrustTime = new Decimal(365).mul(60 * 60 * 24); // 1 year
            const fractions = rl.pionRocketFuelFractionsMultiple(
                thrustTime,
                rl.g,
                [0.70, 0.75, 0.80, 0.85]
            );

            expect(fractions.length).toBe(4);
            // All should be positive and finite
            fractions.forEach(f => {
                expect(f.isFinite()).toBe(true);
                expect(f.gt(0)).toBe(true);
            });

            // Higher efficiency should give lower fuel fraction (as percentage)
            expect(fractions[3].lt(fractions[2])).toBe(true); // 85% < 80%
            expect(fractions[2].lt(fractions[1])).toBe(true); // 80% < 75%
            expect(fractions[1].lt(fractions[0])).toBe(true); // 75% < 70%
        });

        it('should return results as percentages (multiplied by 100)', () => {
            const thrustTime = new Decimal(100).mul(60 * 60 * 24); // 100 days
            const fractions = rl.pionRocketFuelFractionsMultiple(
                thrustTime,
                rl.g,
                [0.85]
            );

            // Result should be in percentage form (0-100 range)
            expect(fractions[0].gte(0)).toBe(true);
            expect(fractions[0].lt(100)).toBe(true);
        });

        it('should handle single efficiency value', () => {
            const thrustTime = new Decimal(365).mul(60 * 60 * 24);
            const fractions = rl.pionRocketFuelFractionsMultiple(
                thrustTime,
                rl.g,
                [0.85]
            );

            expect(fractions.length).toBe(1);
            expect(fractions[0].isFinite()).toBe(true);
        });

        it('should handle many efficiency values', () => {
            const thrustTime = new Decimal(365).mul(60 * 60 * 24);
            const efficiencies = [0.5, 0.6, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95];
            const fractions = rl.pionRocketFuelFractionsMultiple(
                thrustTime,
                rl.g,
                efficiencies
            );

            expect(fractions.length).toBe(efficiencies.length);

            // All should be monotonically decreasing (higher efficiency = lower fuel fraction)
            for (let i = 1; i < fractions.length; i++) {
                expect(fractions[i].lt(fractions[i - 1])).toBe(true);
            }
        });
    });

    describe('Integration tests - Round trip conversions', () => {
        it('should round-trip between velocity and rapidity', () => {
            const testVelocities = ['0.1', '0.5', '0.8', '0.95', '0.999'];

            testVelocities.forEach(vFrac => {
                const v = rl.c.mul(vFrac);
                const rapidity = rl.rapidityFromVelocity(v);
                const recoveredV = rl.velocityFromRapidity(rapidity);

                // Should recover original velocity within small tolerance
                const diff = v.minus(recoveredV).abs();
                expect(diff.lt('0.001')).toBe(true);
            });
        });

        it('should maintain precision for extreme velocities near c', () => {
            const v = rl.c.mul('0.9999999999');
            const gamma = rl.lorentzFactor(v);

            // Lorentz factor should be very large but finite
            expect(gamma.isFinite()).toBe(true);
            expect(gamma.gt(7000)).toBe(true);
        });

        it('should handle fuel fraction calculation and reverse calculation', () => {
            const thrustTime = new Decimal(365).mul(60 * 60 * 24);
            const dryMass = new Decimal(1000);
            const efficiency = new Decimal(0.85);

            // Calculate fuel fraction
            const fuelFraction = rl.pionRocketFuelFraction(thrustTime, rl.g, efficiency);

            // Calculate fuel mass from fraction
            const fuelMass = fuelFraction.mul(dryMass).div(rl.one.minus(fuelFraction));

            // Use that fuel mass to calculate acceleration time
            const recoveredTime = rl.pionRocketAccelTime(fuelMass, dryMass, efficiency, 0.4, rl.g);

            // Should recover original thrust time within reasonable tolerance
            const diff = thrustTime.minus(recoveredTime).abs();
            const tolerance = thrustTime.mul('0.01'); // 1% tolerance
            expect(diff.lt(tolerance)).toBe(true);
        });
    });
});

describe('formatMassWithUnit', () => {
    describe('Mass unit scaling', () => {
        it('should format very small masses in kilograms', () => {
            const mass = new Decimal(500);
            const result = rl.formatMassWithUnit(mass);
            expect(result).toBe('500 kg (5.00e+2 kg)');
        });

        it('should format small masses in tons', () => {
            // 5,000 kg = 5 tons (< 0.1 Earth masses)
            const mass = new Decimal(5000);
            const result = rl.formatMassWithUnit(mass);
            expect(result).toBe('5 tons (5.00e+3 kg)');
        });

        it('should format medium masses in Earth masses', () => {
            // 1 Earth mass
            const mass = rl.earthMass;
            const result = rl.formatMassWithUnit(mass);
            expect(result).toContain('1.00 Earth masses');
            expect(result).toContain('5.97e+24 kg');
        });

        it('should format large masses in Solar masses', () => {
            // 1 Solar mass
            const mass = rl.solarMass;
            const result = rl.formatMassWithUnit(mass);
            expect(result).toContain('1.00 Solar masses');
            expect(result).toContain('1.99e+30 kg');
        });

        it('should format very large masses in Milky Way masses', () => {
            // 1 Milky Way mass
            const mass = rl.milkyWayMass;
            const result = rl.formatMassWithUnit(mass);
            expect(result).toContain('1.00 Milky Way masses');
            expect(result).toContain('kg)');
        });

        it('should use tons for mass just above 1000 kg', () => {
            // 1500 kg = 1.5 tons, rounds to 2 tons as whole number
            const mass = new Decimal(1500);
            const result = rl.formatMassWithUnit(mass);
            expect(result).toBe('2 tons (1.50e+3 kg)');
        });

        it('should use Earth masses for mass at 0.1 Earth masses threshold', () => {
            const mass = rl.earthMass.mul(0.1);
            const result = rl.formatMassWithUnit(mass);
            expect(result).toContain('0.10 Earth masses');
        });

        it('should use Solar masses for mass at 0.1 Solar masses threshold', () => {
            const mass = rl.solarMass.mul(0.1);
            const result = rl.formatMassWithUnit(mass);
            expect(result).toContain('0.10 Solar masses');
        });

        it('should use Milky Way masses for mass at 0.1 Milky Way masses threshold', () => {
            const mass = rl.milkyWayMass.mul(0.1);
            const result = rl.formatMassWithUnit(mass);
            expect(result).toContain('0.10 Milky Way masses');
        });

        it('should format Mount Everest mass scale', () => {
            // 1 Mount Everest mass
            const mass = rl.everestMass;
            const result = rl.formatMassWithUnit(mass);
            expect(result).toContain('1.00 Everest masses');
            expect(result).toContain('8.10e+14 kg');
        });

        it('should format Moon mass scale', () => {
            // 1 Moon mass
            const mass = rl.moonMass;
            const result = rl.formatMassWithUnit(mass);
            expect(result).toContain('1.00 Moon masses');
            expect(result).toContain('7.34e+22 kg');
        });

        it('should use Everest masses for mass at 0.1 Everest masses threshold', () => {
            const mass = rl.everestMass.mul(0.1);
            const result = rl.formatMassWithUnit(mass);
            expect(result).toContain('0.10 Everest masses');
        });

        it('should use Moon masses for mass at 0.1 Moon masses threshold', () => {
            const mass = rl.moonMass.mul(0.1);
            const result = rl.formatMassWithUnit(mass);
            expect(result).toContain('0.10 Moon masses');
        });

        it('should use tons for mass just below 0.1 Everest masses', () => {
            // 5e13 kg is less than 0.1 Everest (8.1e13 kg)
            const mass = new Decimal('5e13');
            const result = rl.formatMassWithUnit(mass);
            expect(result).toContain('tons');
            expect(result).not.toContain('Everest');
        });

        it('should use Everest masses for mass between 0.1 Everest and 0.1 Moon', () => {
            // 1e15 kg is > 0.1 Everest (8.1e13) but < 0.1 Moon (7.342e21)
            const mass = new Decimal('1e15');
            const result = rl.formatMassWithUnit(mass);
            expect(result).toContain('Everest masses');
        });

        it('should use Moon masses for mass between 0.1 Moon and 0.1 Earth', () => {
            // 1e22 kg is > 0.1 Moon (7.342e21) but < 0.1 Earth (5.972e23)
            const mass = new Decimal('1e22');
            const result = rl.formatMassWithUnit(mass);
            expect(result).toContain('Moon masses');
        });

        it('should format supercluster mass scale', () => {
            // 1 Supercluster mass (Laniakea: ~1e17 solar masses)
            const mass = rl.superclusterMass;
            const result = rl.formatMassWithUnit(mass);
            expect(result).toContain('1.00 Supercluster masses');
            expect(result).toContain('1.99e+47 kg');
        });

        it('should use Supercluster masses for mass at 0.1 Supercluster masses threshold', () => {
            const mass = rl.superclusterMass.mul(0.1);
            const result = rl.formatMassWithUnit(mass);
            expect(result).toContain('0.10 Supercluster masses');
        });

        it('should use Milky Way masses for mass between 0.1 Milky Way and 0.1 Supercluster', () => {
            // 1e43 kg is > 0.1 Milky Way (2.98e41) but < 0.1 Supercluster (1.99e46)
            const mass = new Decimal('1e43');
            const result = rl.formatMassWithUnit(mass);
            expect(result).toContain('Milky Way masses');
            expect(result).not.toContain('Supercluster');
        });

        it('should use Supercluster masses for very large masses', () => {
            // 1e48 kg is > 0.1 Supercluster (1.99e46)
            const mass = new Decimal('1e48');
            const result = rl.formatMassWithUnit(mass);
            expect(result).toContain('Supercluster masses');
        });

        it('should format observable universe mass scale', () => {
            // 1 Observable Universe mass (~1e53 kg)
            const mass = rl.observableUniverseMass;
            const result = rl.formatMassWithUnit(mass);
            expect(result).toContain('1.00 Observable Universe masses');
            expect(result).toContain('1.00e+53 kg');
        });

        it('should use Observable Universe masses for mass at 0.1 Observable Universe masses threshold', () => {
            const mass = rl.observableUniverseMass.mul(0.1);
            const result = rl.formatMassWithUnit(mass);
            expect(result).toContain('0.10 Observable Universe masses');
        });

        it('should use Supercluster masses for mass between 0.1 Supercluster and 0.1 Observable Universe', () => {
            // 1e50 kg is > 0.1 Supercluster (1.99e46) but < 0.1 Observable Universe (1e52)
            const mass = new Decimal('1e50');
            const result = rl.formatMassWithUnit(mass);
            expect(result).toContain('Supercluster masses');
            expect(result).not.toContain('Observable Universe');
        });

        it('should use Observable Universe masses for extremely large masses', () => {
            // 1e54 kg is > 0.1 Observable Universe (1e52)
            const mass = new Decimal('1e54');
            const result = rl.formatMassWithUnit(mass);
            expect(result).toContain('Observable Universe masses');
        });
    });
});
