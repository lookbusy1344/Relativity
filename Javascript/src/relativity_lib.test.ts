import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import { formatSignificant, configure } from './relativity_lib';

// Configure decimal precision for testing
configure(150);

describe('formatSignificant', () => {
    describe('Basic functionality with default parameters', () => {
        it('should format simple decimal numbers with 2 decimal places', () => {
            expect(formatSignificant(new Decimal('123.456789'), '', 2, false)).toBe('123.46'); // rounds up
            expect(formatSignificant(new Decimal('0.123456'), '', 2, false)).toBe('0.12');
            expect(formatSignificant(new Decimal('9.876543'), '', 2, false)).toBe('9.88'); // rounds up
        });

        it('should handle integers (no decimal part)', () => {
            expect(formatSignificant(new Decimal('123'), '', 2, false)).toBe('123');
            expect(formatSignificant(new Decimal('0'), '', 2, false)).toBe('0');
            expect(formatSignificant(new Decimal('1'), '', 2, false)).toBe('1');
        });

        it('should handle negative numbers', () => {
            expect(formatSignificant(new Decimal('-123.456789'), '', 2, false)).toBe('-123.46'); // rounds down (away from zero)
            expect(formatSignificant(new Decimal('-0.123456'), '', 2, false)).toBe('-0.12');
            expect(formatSignificant(new Decimal('-9.876543'), '', 2, false)).toBe('-9.88'); // rounds down (away from zero)
        });
    });

    describe('Very large numbers', () => {
        it('should handle extremely large positive numbers in decimal notation', () => {
            // Numbers beyond JavaScript's safe integer range
            expect(formatSignificant(new Decimal('9007199254740992.123456'), '', 2, false)).toBe('9,007,199,254,740,992.12');
            expect(formatSignificant(new Decimal('12345678901234567890.987654321'), '', 2, false)).toBe('12,345,678,901,234,567,890.99'); // rounds up

            // Even larger numbers - now formatted in decimal notation, not scientific
            expect(formatSignificant(new Decimal('999999999999999999999999999999.123456789'), '', 2, false)).toBe('999,999,999,999,999,999,999,999,999,999.12');
            expect(formatSignificant(new Decimal('1234567890123456789012345678901234567890.5555555'), '', 2, false)).toBe('1,234,567,890,123,456,789,012,345,678,901,234,567,890.56'); // rounds up
        });

        it('should handle extremely large negative numbers in decimal notation', () => {
            expect(formatSignificant(new Decimal('-9007199254740992.123456'), '', 2, false)).toBe('-9,007,199,254,740,992.12');
            expect(formatSignificant(new Decimal('-12345678901234567890.987654321'), '', 2, false)).toBe('-12,345,678,901,234,567,890.99'); // rounds down

            // Very large negative numbers in decimal notation
            expect(formatSignificant(new Decimal('-999999999999999999999999999999.123456789'), '', 2, false)).toBe('-999,999,999,999,999,999,999,999,999,999.12');
        });

        it('should handle numbers with many integer digits and various decimal patterns', () => {
            // These very large numbers now in decimal notation (rounding applied)
            expect(formatSignificant(new Decimal('123456789012345678901234567890.000001'), '', 2, false)).toBe('123,456,789,012,345,678,901,234,567,890');
            expect(formatSignificant(new Decimal('123456789012345678901234567890.999999'), '', 2, false)).toBe('123,456,789,012,345,678,901,234,567,891'); // rounds up to next integer
            expect(formatSignificant(new Decimal('123456789012345678901234567890.123456'), '', 2, false)).toBe('123,456,789,012,345,678,901,234,567,890.12');
        });
    });

    describe('Very small numbers', () => {
        it('should handle extremely small positive numbers in decimal notation', () => {
            // These very small numbers now formatted in decimal notation with 2 decimal places (default)
            expect(formatSignificant(new Decimal('0.000000000000000000000000000001'), '', 2, false)).toBe('0');
            expect(formatSignificant(new Decimal('0.00000000000000000000001'), '', 2, false)).toBe('0');

            // With more decimal places, we can see the full precision
            expect(formatSignificant(new Decimal('0.000000123456789'), '', 20, false)).toBe('0.000000123456789');
            expect(formatSignificant(new Decimal('0.0000001234'), '', 15, false)).toBe('0.0000001234');
        });

        it('should handle extremely small negative numbers in decimal notation', () => {
            // These very small numbers in decimal notation (normalized -0 to 0)
            expect(formatSignificant(new Decimal('-0.000000000000000000000000000001'), '', 2, false)).toBe('0');  // -0 normalized to 0
            expect(formatSignificant(new Decimal('-0.00000000000000000000001'), '', 2, false)).toBe('0');  // -0 normalized to 0

            expect(formatSignificant(new Decimal('-0.000000123456789'), '', 20, false)).toBe('-0.000000123456789');
        });

        it('should handle numbers just above zero', () => {
            expect(formatSignificant(new Decimal('0.001'), '', 2, false)).toBe('0');    // 2 dp: rounds to 0.00, trailing zeros stripped
            expect(formatSignificant(new Decimal('0.009'), '', 2, false)).toBe('0.01'); // 2 dp: rounds up to 0.01
            expect(formatSignificant(new Decimal('0.0123456'), '', 2, false)).toBe('0.01'); // 2 dp: rounds to 0.01
            expect(formatSignificant(new Decimal('0.099999'), '', 2, false)).toBe('0.1'); // 2 dp: rounds to 0.10, trailing zero stripped
        });
    });

    describe('Extreme number handling', () => {
        it('should format extremely large numbers in decimal notation', () => {
            // These are formatted in decimal with requested precision
            const largeNum = new Decimal('1e100');
            const result = formatSignificant(largeNum, '', 5, false);
            expect(result).toContain('10,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000');

            const mediumNum = new Decimal('1.23456e50');
            const result2 = formatSignificant(mediumNum, '', 3, false);
            expect(result2).toContain('123,456,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000');
        });

        it('should format extremely small numbers in decimal notation', () => {
            const smallNum = new Decimal('1e-100');
            // With 2 decimal places, this rounds to 0
            expect(formatSignificant(smallNum, '', 2, false)).toBe('0');

            // With enough decimal places, we see the value
            expect(formatSignificant(smallNum, '', 105, false)).toContain('0.0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001');
        });
    });

    describe('Different significantDecimalPlaces values', () => {
        it('should handle 0 decimal places', () => {
            expect(formatSignificant(new Decimal('123.456'), '', 0, false)).toBe('123');
            expect(formatSignificant(new Decimal('999.999'), '', 0, false)).toBe('1,000'); // rounds up
            expect(formatSignificant(new Decimal('0.999'), '', 0, false)).toBe('1'); // rounds up
            expect(formatSignificant(new Decimal('-123.456'), '', 0, false)).toBe('-123');
        });

        it('should handle 1 decimal place', () => {
            expect(formatSignificant(new Decimal('123.456'), '', 1, false)).toBe('123.5'); // rounds up
            expect(formatSignificant(new Decimal('999.999'), '', 1, false)).toBe('1,000'); // rounds up, zero stripped
            expect(formatSignificant(new Decimal('0.999'), '', 1, false)).toBe('1'); // rounds up
        });

        it('should handle 5 decimal places', () => {
            expect(formatSignificant(new Decimal('123.456789012'), '', 5, false)).toBe('123.45679'); // rounds up
            expect(formatSignificant(new Decimal('0.123456789'), '', 5, false)).toBe('0.12346'); // rounds up
            expect(formatSignificant(new Decimal('999.999999999'), '', 5, false)).toBe('1,000'); // rounds up
        });

        it('should handle 10 decimal places', () => {
            // Trailing zeros stripped - gives us up to 10 decimal places
            expect(formatSignificant(new Decimal('123.12345678901234'), '', 10, false)).toBe('123.123456789');
            expect(formatSignificant(new Decimal('0.12345678901234'), '', 10, false)).toBe('0.123456789');
        });

        it('should handle 20 decimal places with large numbers', () => {
            // Now handles in decimal notation with full precision (trailing zero stripped by Decimal)
            expect(formatSignificant(new Decimal('12345678901234567890.12345678901234567890123456'), '', 20, false))
                .toBe('12,345,678,901,234,567,890.1234567890123456789'); // trailing 0 stripped
        });

        it('should handle more decimal places than available', () => {
            expect(formatSignificant(new Decimal('123.45'), '', 10, false)).toBe('123.45');
            expect(formatSignificant(new Decimal('123.4'), '', 5, false)).toBe('123.4');
        });
    });

    describe('ignoreChar functionality', () => {
        it('should skip ignoreChar digits before counting significant places', () => {
            // If the decimal part starts with '9's and we use '9' as ignoreChar,
            // those 9's are copied but not counted toward the limit
            expect(formatSignificant(new Decimal('123.999123'), '9', 2, false)).toBe('123.99912');
            expect(formatSignificant(new Decimal('0.999912345'), '9', 2, false)).toBe('0.999912');
        });

        it('should handle ignoreChar with 0s', () => {
            expect(formatSignificant(new Decimal('123.000456'), '0', 2, false)).toBe('123.00045');
            expect(formatSignificant(new Decimal('999.000000123'), '0', 3, false)).toBe('999.000000123');
        });

        it('should work normally when ignoreChar is not present', () => {
            expect(formatSignificant(new Decimal('123.456789'), '9', 2, false)).toBe('123.45');
            expect(formatSignificant(new Decimal('123.456789'), '0', 2, false)).toBe('123.45');
        });

        it('should handle ignoreChar with very long sequences', () => {
            expect(formatSignificant(new Decimal('0.999999999123456'), '9', 2, false)).toBe('0.99999999912');
            expect(formatSignificant(new Decimal('1.000000000123456'), '0', 2, false)).toBe('1.00000000012');
        });

        it('should handle single character ignoreChar requirement', () => {
            // Multiple characters should throw an error
            expect(() => formatSignificant(new Decimal('123.456'), 'ab', 2)).toThrow('ignoreChar must be a single character or empty');
            expect(() => formatSignificant(new Decimal('123.456'), '99', 2)).toThrow('ignoreChar must be a single character or empty');
        });
    });

    describe('Edge cases and boundary conditions', () => {
        it('should handle zero in various forms', () => {
            // Decimal.toString() strips trailing zeros, so 0.0 and 0.00 become just '0'
            expect(formatSignificant(new Decimal('0'), '', 2, false)).toBe('0');
            expect(formatSignificant(new Decimal('0.0'), '', 2, false)).toBe('0');
            expect(formatSignificant(new Decimal('0.00'), '', 2, false)).toBe('0');
            expect(formatSignificant(new Decimal('0.000'), '', 2, false)).toBe('0');
            expect(formatSignificant(new Decimal('-0'), '', 2, false)).toBe('0');
        });

        it('should handle numbers with trailing zeros', () => {
            // Decimal.toString() strips trailing zeros
            expect(formatSignificant(new Decimal('123.100'), '', 2, false)).toBe('123.1');  // becomes '123.1'
            expect(formatSignificant(new Decimal('123.000'), '', 2, false)).toBe('123');    // becomes '123'
            expect(formatSignificant(new Decimal('0.100'), '', 2, false)).toBe('0.1');      // becomes '0.1'
            expect(formatSignificant(new Decimal('0.200'), '', 2, false)).toBe('0.2');      // becomes '0.2'
        });

        it('should handle numbers with repeating patterns', () => {
            expect(formatSignificant(new Decimal('123.123123123123'), '', 2, false)).toBe('123.12');
            expect(formatSignificant(new Decimal('999.999999999'), '', 2, false)).toBe('1,000'); // rounds up
            expect(formatSignificant(new Decimal('0.123123123123'), '', 2, false)).toBe('0.12');
        });

        it('should handle numbers right at boundaries', () => {
            expect(formatSignificant(new Decimal('0.1'), '', 2, false)).toBe('0.1');
            expect(formatSignificant(new Decimal('0.01'), '', 2, false)).toBe('0.01');
            expect(formatSignificant(new Decimal('0.10'), '', 2, false)).toBe('0.1');   // trailing zero stripped
            expect(formatSignificant(new Decimal('1.0'), '', 2, false)).toBe('1');      // trailing zero stripped
            expect(formatSignificant(new Decimal('10.0'), '', 2, false)).toBe('10');    // trailing zero stripped
        });

        it('should handle very precise decimals', () => {
            const highPrecision = new Decimal('123.12345678901234567890123456789012345678901234567890');
            expect(formatSignificant(highPrecision, '', 2, false)).toBe('123.12');
            // Decimal.js precision limited to ~49 decimal places, trailing zero may be stripped
            expect(formatSignificant(highPrecision, '', 30, false)).toBe('123.12345678901234567890123456789');
        });

        it('should handle decimals shorter than requested places', () => {
            expect(formatSignificant(new Decimal('123.4'), '', 5, false)).toBe('123.4');
            expect(formatSignificant(new Decimal('123.45'), '', 10, false)).toBe('123.45');
            expect(formatSignificant(new Decimal('0.1'), '', 5, false)).toBe('0.1');
        });
    });

    describe('Precision preservation tests', () => {
        it('should preserve full precision of large numbers in integer part', () => {
            const largeNum = new Decimal('123456789012345678901234567890123456789.123456789');
            const result = formatSignificant(largeNum, '', 2, false);
            // Now formatted in decimal notation with full integer precision
            expect(result).toBe('123,456,789,012,345,678,901,234,567,890,123,456,789.12');
        });

        it('should not lose precision when converting to string', () => {
            // These numbers would lose precision if converted to JavaScript numbers
            const preciseNum1 = new Decimal('9007199254740993.123456');  // Above MAX_SAFE_INTEGER
            expect(formatSignificant(preciseNum1, '', 2, false)).toBe('9,007,199,254,740,993.12');

            const preciseNum2 = new Decimal('18014398509481984.987654');  // 2^54
            expect(formatSignificant(preciseNum2, '', 2, false)).toBe('18,014,398,509,481,984.99'); // rounds up
        });

        it('should maintain precision with very small fractional parts on large numbers', () => {
            const num = new Decimal('999999999999999999999999999999.000000000000000001');
            // Now in decimal notation (trailing zeros after decimal limit are stripped)
            expect(formatSignificant(num, '', 5, false)).toBe('999,999,999,999,999,999,999,999,999,999');
        });
    });

    describe('Stress tests with extreme values', () => {
        it('should handle numbers with 50+ decimal digits', () => {
            const longDecimal = new Decimal('123.12345678901234567890123456789012345678901234567890');
            expect(formatSignificant(longDecimal, '', 10, false)).toBe('123.123456789'); // trailing zero stripped
            // Decimal.js precision limits mean only 49 decimal places are preserved
            expect(formatSignificant(longDecimal, '', 50, false)).toBe('123.1234567890123456789012345678901234567890123456789');
        });

        it('should handle numbers with 100+ integer digits', () => {
            const hugeInt = '1234567890'.repeat(10) + '.123456789';  // 100 digit integer
            const decimal = new Decimal(hugeInt);
            const result = formatSignificant(decimal, '', 2, false);
            // Now formatted in decimal notation with full integer precision (with commas)
            expect(result).toContain('1,234,567,890,123,456,789,012,345,678,901,234,567,890');
            expect(result.endsWith('.12')).toBe(true);
        });

        it('should handle mixed extreme cases', () => {
            // Very large integer with very long decimal
            const extreme = '9'.repeat(50) + '.' + '1'.repeat(50);
            const decimal = new Decimal(extreme);
            // Now formatted in decimal notation (with commas)
            const result = formatSignificant(decimal, '', 5, false);
            // Check for commas in the formatted number
            expect(result).toContain(',');
            expect(result.includes('.11111')).toBe(true);
        });

        it('should handle alternating patterns in decimal part', () => {
            expect(formatSignificant(new Decimal('123.101010101010101010'), '', 2, false)).toBe('123.1');  // 2 dp, trailing zero stripped
            expect(formatSignificant(new Decimal('456.121212121212121212'), '', 2, false)).toBe('456.12'); // 2 dp
            expect(formatSignificant(new Decimal('789.909090909090909090'), '', 2, false)).toBe('789.91'); // 2 dp, rounds up
        });
    });

    describe('Real-world physics calculations', () => {
        it('should handle speed of light calculations', () => {
            const c = new Decimal('299792458.0');  // m/s
            expect(formatSignificant(c, '', 2, false)).toBe('299,792,458');  // trailing .0 stripped
            expect(formatSignificant(c, '', 0, false)).toBe('299,792,458');
        });

        it('should handle velocities extremely close to c in fraction form', () => {
            // Velocity with 30+ nines (extremely close to c)
            const v1 = new Decimal('0.999999999999999999999999999999');
            expect(formatSignificant(v1, '9', 5, false)).toBe('0.999999999999999999999999999999');

            // Velocity with 50+ nines
            const v2 = new Decimal('0.99999999999999999999999999999999999999999999999999');
            expect(formatSignificant(v2, '9', 10, false)).toBe('0.99999999999999999999999999999999999999999999999999');

            // With additional digits after the 9's
            const v3 = new Decimal('0.9999999999999999999999999999999987654321');
            expect(formatSignificant(v3, '9', 5, false)).toBe('0.9999999999999999999999999999999987654');
            expect(formatSignificant(v3, '9', 10, false)).toBe('0.9999999999999999999999999999999987654321');
        });

        it('should handle velocities in m/s extremely close to c', () => {
            const c = new Decimal('299792458');

            // 99.9% of c
            const v1 = c.mul('0.999');
            expect(formatSignificant(v1, '', 2, false)).toBe('299,492,665.54');
            expect(formatSignificant(v1, '', 0, false)).toBe('299,492,666');

            // 99.9999% of c (7 nines in the multiplier)
            const v2 = c.mul('0.9999999');
            expect(formatSignificant(v2, '', 2, false)).toBe('299,792,428.02');
            expect(formatSignificant(v2, '', 5, false)).toBe('299,792,428.02075');

            // 99.999999999% of c (12 nines)
            const v3 = c.mul('0.999999999999');
            expect(formatSignificant(v3, '', 2, false)).toBe('299,792,458');
            expect(formatSignificant(v3, '', 10, false)).toBe('299,792,457.9997002075');

            // Extremely close: only 1 m/s below c
            const v4 = c.sub('1');
            expect(formatSignificant(v4, '', 2, false)).toBe('299,792,457');
            expect(formatSignificant(v4, '', 10, false)).toBe('299,792,457');

            // Extremely close: only 0.001 m/s below c
            const v5 = c.sub('0.001');
            expect(formatSignificant(v5, '', 3, false)).toBe('299,792,457.999');
            expect(formatSignificant(v5, '', 10, false)).toBe('299,792,457.999');
        });

        it('should handle gravitational constant', () => {
            const G = new Decimal('0.0000000000667430');
            // Now in decimal notation with high precision
            expect(formatSignificant(G, '', 15, false)).toBe('0.000000000066743');
        });

        it('should handle Planck length', () => {
            const planckLength = new Decimal('0.000000000000000000000000000000000016162');
            // Now in decimal notation with very high precision
            expect(formatSignificant(planckLength, '', 40, false)).toBe('0.000000000000000000000000000000000016162');
        });

        it('should handle astronomical distances', () => {
            const lightYear = new Decimal('9460730472580800.0');  // meters
            expect(formatSignificant(lightYear, '', 2, false)).toBe('9,460,730,472,580,800');  // trailing .0 stripped

            const parsec = new Decimal('30856775814913673.0');  // meters
            expect(formatSignificant(parsec, '', 0, false)).toBe('30,856,775,814,913,673');
        });

        it('should handle relativistic calculations', () => {
            // Lorentz factor at 0.999c
            const gamma = new Decimal('22.36627047695794');
            expect(formatSignificant(gamma, '', 5, false)).toBe('22.36627');

            // Time dilation: very small difference - now in decimal notation
            const timeDiff = new Decimal('0.000000000001234567');
            expect(formatSignificant(timeDiff, '', 20, false)).toBe('0.000000000001234567');
        });
    });

    describe('Boundary behavior with ignoreChar', () => {
        it('should handle empty ignoreChar correctly', () => {
            expect(formatSignificant(new Decimal('123.999999'), '', 2, false)).toBe('124'); // rounds up to 124.00, zeros stripped
            expect(formatSignificant(new Decimal('123.000000'), '', 2, false)).toBe('123');  // trailing zeros stripped
        });

        it('should handle ignoreChar at start vs middle of decimal', () => {
            // 9 at start
            expect(formatSignificant(new Decimal('123.999456'), '9', 2, false)).toBe('123.99945');
            // 9 in middle (not ignored)
            expect(formatSignificant(new Decimal('123.459'), '9', 2, false)).toBe('123.45');
        });

        it('should handle all digits being ignoreChar', () => {
            expect(formatSignificant(new Decimal('123.9999999999'), '9', 2, false)).toBe('123.9999999999');
            expect(formatSignificant(new Decimal('456.0000000000'), '0', 2, false)).toBe('456');  // trailing zeros stripped
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
                expect(formatSignificant(new Decimal(input), '', 2, false)).toBe(expected);
            });
        });

        it('should handle negative numbers across all ranges', () => {
            expect(formatSignificant(new Decimal('-0.0001'), '', 2, false)).toBe('0');  // rounds to 0
            expect(formatSignificant(new Decimal('-0.0001'), '', 5, false)).toBe('-0.0001');
            expect(formatSignificant(new Decimal('-1.5'), '', 2, false)).toBe('-1.5');
            expect(formatSignificant(new Decimal('-1234567890.123'), '', 2, false)).toBe('-1,234,567,890.12');
        });
    });

    describe('Rounding indicator (r)', () => {
        it('should show (r) indicator when rounding occurs by default', () => {
            // Values that get rounded
            expect(formatSignificant(new Decimal('123.456'))).toBe('123.46 (r)');
            expect(formatSignificant(new Decimal('0.999999'), '', 2)).toBe('1 (r)');
            expect(formatSignificant(new Decimal('999.999'), '', 1)).toBe('1,000 (r)');
        });

        it('should NOT show (r) indicator when no rounding occurs', () => {
            // Exact values with no rounding
            expect(formatSignificant(new Decimal('123.12'))).toBe('123.12');
            expect(formatSignificant(new Decimal('0.5'), '', 2)).toBe('0.5');
            expect(formatSignificant(new Decimal('1000'), '', 2)).toBe('1,000');
        });

        it('should NOT show (r) when showRoundingIndicator=false', () => {
            // Same values as first test but with indicator disabled
            expect(formatSignificant(new Decimal('123.456'), '', 2, false)).toBe('123.46');
            expect(formatSignificant(new Decimal('0.999999'), '', 2, false)).toBe('1');
            expect(formatSignificant(new Decimal('999.999'), '', 1, false)).toBe('1,000');
        });

        it('should show (r) for critical velocity cases to prevent confusion', () => {
            const c = new Decimal('299792458');

            // 0.9999999999 * c rounds to exactly c (critical safety issue!)
            const nearC = c.mul('0.9999999999');
            expect(formatSignificant(nearC, '', 2)).toBe('299,792,457.97 (r)');

            // This indicates it's NOT exactly c, preventing dangerous confusion
            expect(formatSignificant(nearC, '', 2)).toContain('(r)');
        });

        it('should NOT show (r) with ignoreChar when preserving full precision', () => {
            // When using ignoreChar, no rounding should occur
            const v = new Decimal('0.99999999999');
            expect(formatSignificant(v, '9', 5)).toBe('0.99999999999');
            expect(formatSignificant(v, '9', 5)).not.toContain('(r)');
        });

        it('should show (r) with ignoreChar when truncation occurs', () => {
            // When ignoreChar truncates digits, it should show (r)
            const v = new Decimal('0.9999999999999987654321');
            expect(formatSignificant(v, '9', 5)).toBe('0.9999999999999987654 (r)');
            expect(formatSignificant(v, '9', 5)).toContain('(r)');
        });
    });
});
