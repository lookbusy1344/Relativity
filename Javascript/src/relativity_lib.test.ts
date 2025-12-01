import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import { formatSignificant, configure } from './relativity_lib';

// Configure decimal precision for testing
configure(150);

describe('formatSignificant', () => {
    describe('Basic functionality with default parameters', () => {
        it('should format simple decimal numbers with 2 decimal places', () => {
            expect(formatSignificant(new Decimal('123.456789'))).toBe('123.45');
            expect(formatSignificant(new Decimal('0.123456'))).toBe('0.12');
            expect(formatSignificant(new Decimal('9.876543'))).toBe('9.87');
        });

        it('should handle integers (no decimal part)', () => {
            expect(formatSignificant(new Decimal('123'))).toBe('123');
            expect(formatSignificant(new Decimal('0'))).toBe('0');
            expect(formatSignificant(new Decimal('1'))).toBe('1');
        });

        it('should handle negative numbers', () => {
            expect(formatSignificant(new Decimal('-123.456789'))).toBe('-123.45');
            expect(formatSignificant(new Decimal('-0.123456'))).toBe('-0.12');
            expect(formatSignificant(new Decimal('-9.876543'))).toBe('-9.87');
        });
    });

    describe('Very large numbers', () => {
        it('should handle extremely large positive numbers', () => {
            // Numbers beyond JavaScript's safe integer range
            expect(formatSignificant(new Decimal('9007199254740992.123456'))).toBe('9007199254740992.12');
            expect(formatSignificant(new Decimal('12345678901234567890.987654321'))).toBe('12345678901234567890.98');

            // Even larger numbers - these convert to scientific notation
            const huge1 = new Decimal('999999999999999999999999999999.123456789');
            expect(formatSignificant(huge1)).toBe(huge1.toString());
            const huge2 = new Decimal('1234567890123456789012345678901234567890.5555555');
            expect(formatSignificant(huge2)).toBe(huge2.toString());
        });

        it('should handle extremely large negative numbers', () => {
            expect(formatSignificant(new Decimal('-9007199254740992.123456'))).toBe('-9007199254740992.12');
            expect(formatSignificant(new Decimal('-12345678901234567890.987654321'))).toBe('-12345678901234567890.98');

            // Very large negative numbers convert to scientific notation
            const huge = new Decimal('-999999999999999999999999999999.123456789');
            expect(formatSignificant(huge)).toBe(huge.toString());
        });

        it('should handle numbers with many integer digits and various decimal patterns', () => {
            // These very large numbers convert to scientific notation
            const num1 = new Decimal('123456789012345678901234567890.000001');
            expect(formatSignificant(num1)).toBe(num1.toString());
            const num2 = new Decimal('123456789012345678901234567890.999999');
            expect(formatSignificant(num2)).toBe(num2.toString());
            const num3 = new Decimal('123456789012345678901234567890.123456');
            expect(formatSignificant(num3)).toBe(num3.toString());
        });
    });

    describe('Very small numbers', () => {
        it('should handle extremely small positive numbers', () => {
            // These very small numbers convert to scientific notation
            const tiny1 = new Decimal('0.000000000000000000000000000001');
            expect(formatSignificant(tiny1)).toBe(tiny1.toString());
            const tiny2 = new Decimal('0.00000000000000000000001');
            expect(formatSignificant(tiny2)).toBe(tiny2.toString());

            // These also convert to scientific notation
            const tiny3 = new Decimal('0.000000123456789');
            expect(formatSignificant(tiny3)).toBe(tiny3.toString());
            const tiny4 = new Decimal('0.0000001234');
            expect(formatSignificant(tiny4)).toBe(tiny4.toString());
        });

        it('should handle extremely small negative numbers', () => {
            // These very small numbers convert to scientific notation
            const tiny1 = new Decimal('-0.000000000000000000000000000001');
            expect(formatSignificant(tiny1)).toBe(tiny1.toString());
            const tiny2 = new Decimal('-0.00000000000000000000001');
            expect(formatSignificant(tiny2)).toBe(tiny2.toString());

            const tiny3 = new Decimal('-0.000000123456789');
            expect(formatSignificant(tiny3)).toBe(tiny3.toString());
        });

        it('should handle numbers just above zero', () => {
            expect(formatSignificant(new Decimal('0.001'))).toBe('0.00');
            expect(formatSignificant(new Decimal('0.009'))).toBe('0.00');
            expect(formatSignificant(new Decimal('0.0123456'))).toBe('0.01');
            expect(formatSignificant(new Decimal('0.099999'))).toBe('0.09');
        });
    });

    describe('Scientific notation handling', () => {
        it('should return scientific notation as-is', () => {
            const largeNum = new Decimal('1e100');
            expect(formatSignificant(largeNum)).toBe(largeNum.toString());

            const smallNum = new Decimal('1e-100');
            expect(formatSignificant(smallNum)).toBe(smallNum.toString());

            const mediumNum = new Decimal('1.23456e50');
            expect(formatSignificant(mediumNum)).toBe(mediumNum.toString());
        });

        it('should handle edge cases of scientific notation', () => {
            const num1 = new Decimal('9.99999e308');  // Near max double
            expect(formatSignificant(num1)).toBe(num1.toString());

            const num2 = new Decimal('1e-308');  // Near min positive double
            expect(formatSignificant(num2)).toBe(num2.toString());
        });
    });

    describe('Different significantDecimalPlaces values', () => {
        it('should handle 0 decimal places', () => {
            expect(formatSignificant(new Decimal('123.456'), '', 0)).toBe('123');
            expect(formatSignificant(new Decimal('999.999'), '', 0)).toBe('999');
            expect(formatSignificant(new Decimal('0.999'), '', 0)).toBe('0');
            expect(formatSignificant(new Decimal('-123.456'), '', 0)).toBe('-123');
        });

        it('should handle 1 decimal place', () => {
            expect(formatSignificant(new Decimal('123.456'), '', 1)).toBe('123.4');
            expect(formatSignificant(new Decimal('999.999'), '', 1)).toBe('999.9');
            expect(formatSignificant(new Decimal('0.999'), '', 1)).toBe('0.9');
        });

        it('should handle 5 decimal places', () => {
            expect(formatSignificant(new Decimal('123.456789012'), '', 5)).toBe('123.45678');
            expect(formatSignificant(new Decimal('0.123456789'), '', 5)).toBe('0.12345');
            expect(formatSignificant(new Decimal('999.999999999'), '', 5)).toBe('999.99999');
        });

        it('should handle 10 decimal places', () => {
            expect(formatSignificant(new Decimal('123.12345678901234'), '', 10)).toBe('123.1234567890');
            expect(formatSignificant(new Decimal('0.12345678901234'), '', 10)).toBe('0.1234567890');
        });

        it('should handle 20 decimal places with large numbers', () => {
            expect(formatSignificant(new Decimal('12345678901234567890.12345678901234567890123456'), '', 20))
                .toBe('12345678901234567890.12345678901234567890');
        });

        it('should handle more decimal places than available', () => {
            expect(formatSignificant(new Decimal('123.45'), '', 10)).toBe('123.45');
            expect(formatSignificant(new Decimal('123.4'), '', 5)).toBe('123.4');
        });
    });

    describe('ignoreChar functionality', () => {
        it('should skip ignoreChar digits before counting significant places', () => {
            // If the decimal part starts with '9's and we use '9' as ignoreChar,
            // those 9's are copied but not counted toward the limit
            expect(formatSignificant(new Decimal('123.999123'), '9', 2)).toBe('123.99912');
            expect(formatSignificant(new Decimal('0.999912345'), '9', 2)).toBe('0.999912');
        });

        it('should handle ignoreChar with 0s', () => {
            expect(formatSignificant(new Decimal('123.000456'), '0', 2)).toBe('123.00045');
            expect(formatSignificant(new Decimal('999.000000123'), '0', 3)).toBe('999.000000123');
        });

        it('should work normally when ignoreChar is not present', () => {
            expect(formatSignificant(new Decimal('123.456789'), '9', 2)).toBe('123.45');
            expect(formatSignificant(new Decimal('123.456789'), '0', 2)).toBe('123.45');
        });

        it('should handle ignoreChar with very long sequences', () => {
            expect(formatSignificant(new Decimal('0.999999999123456'), '9', 2)).toBe('0.99999999912');
            expect(formatSignificant(new Decimal('1.000000000123456'), '0', 2)).toBe('1.00000000012');
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
            expect(formatSignificant(new Decimal('0'))).toBe('0');
            expect(formatSignificant(new Decimal('0.0'))).toBe('0');
            expect(formatSignificant(new Decimal('0.00'))).toBe('0');
            expect(formatSignificant(new Decimal('0.000'))).toBe('0');
            expect(formatSignificant(new Decimal('-0'))).toBe('0');
        });

        it('should handle numbers with trailing zeros', () => {
            // Decimal.toString() strips trailing zeros
            expect(formatSignificant(new Decimal('123.100'))).toBe('123.1');  // becomes '123.1'
            expect(formatSignificant(new Decimal('123.000'))).toBe('123');    // becomes '123'
            expect(formatSignificant(new Decimal('0.100'))).toBe('0.1');      // becomes '0.1'
            expect(formatSignificant(new Decimal('0.200'))).toBe('0.2');      // becomes '0.2'
        });

        it('should handle numbers with repeating patterns', () => {
            expect(formatSignificant(new Decimal('123.123123123123'))).toBe('123.12');
            expect(formatSignificant(new Decimal('999.999999999'))).toBe('999.99');
            expect(formatSignificant(new Decimal('0.123123123123'))).toBe('0.12');
        });

        it('should handle numbers right at boundaries', () => {
            expect(formatSignificant(new Decimal('0.1'))).toBe('0.1');
            expect(formatSignificant(new Decimal('0.01'))).toBe('0.01');
            expect(formatSignificant(new Decimal('0.10'))).toBe('0.1');   // trailing zero stripped
            expect(formatSignificant(new Decimal('1.0'))).toBe('1');      // trailing zero stripped
            expect(formatSignificant(new Decimal('10.0'))).toBe('10');    // trailing zero stripped
        });

        it('should handle very precise decimals', () => {
            const highPrecision = new Decimal('123.12345678901234567890123456789012345678901234567890');
            expect(formatSignificant(highPrecision, '', 2)).toBe('123.12');
            expect(formatSignificant(highPrecision, '', 30)).toBe('123.123456789012345678901234567890');
        });

        it('should handle decimals shorter than requested places', () => {
            expect(formatSignificant(new Decimal('123.4'), '', 5)).toBe('123.4');
            expect(formatSignificant(new Decimal('123.45'), '', 10)).toBe('123.45');
            expect(formatSignificant(new Decimal('0.1'), '', 5)).toBe('0.1');
        });
    });

    describe('Precision preservation tests', () => {
        it('should preserve full precision of large numbers in integer part', () => {
            const largeNum = new Decimal('123456789012345678901234567890123456789.123456789');
            const result = formatSignificant(largeNum, '', 2);
            // This number is large enough to convert to scientific notation
            expect(result).toBe(largeNum.toString());
        });

        it('should not lose precision when converting to string', () => {
            // These numbers would lose precision if converted to JavaScript numbers
            const preciseNum1 = new Decimal('9007199254740993.123456');  // Above MAX_SAFE_INTEGER
            expect(formatSignificant(preciseNum1, '', 2)).toBe('9007199254740993.12');

            const preciseNum2 = new Decimal('18014398509481984.987654');  // 2^54
            expect(formatSignificant(preciseNum2, '', 2)).toBe('18014398509481984.98');
        });

        it('should maintain precision with very small fractional parts on large numbers', () => {
            const num = new Decimal('999999999999999999999999999999.000000000000000001');
            // This converts to scientific notation
            expect(formatSignificant(num, '', 5)).toBe(num.toString());
        });
    });

    describe('Stress tests with extreme values', () => {
        it('should handle numbers with 50+ decimal digits', () => {
            const longDecimal = new Decimal('123.12345678901234567890123456789012345678901234567890');
            expect(formatSignificant(longDecimal, '', 10)).toBe('123.1234567890');
            // Decimal.js precision limits mean only 49 decimal places are preserved
            expect(formatSignificant(longDecimal, '', 50)).toBe('123.1234567890123456789012345678901234567890123456789');
        });

        it('should handle numbers with 100+ integer digits', () => {
            const hugeInt = '1234567890'.repeat(10) + '.123456789';  // 100 digit integer
            const decimal = new Decimal(hugeInt);
            const result = formatSignificant(decimal, '', 2);
            // This converts to scientific notation
            expect(result).toBe(decimal.toString());
        });

        it('should handle mixed extreme cases', () => {
            // Very large integer with very long decimal
            const extreme = '9'.repeat(50) + '.' + '1'.repeat(50);
            const decimal = new Decimal(extreme);
            // This converts to scientific notation
            expect(formatSignificant(decimal, '', 5)).toBe(decimal.toString());
        });

        it('should handle alternating patterns in decimal part', () => {
            expect(formatSignificant(new Decimal('123.101010101010101010'))).toBe('123.10');
            expect(formatSignificant(new Decimal('456.121212121212121212'))).toBe('456.12');
            expect(formatSignificant(new Decimal('789.909090909090909090'))).toBe('789.90');
        });
    });

    describe('Real-world physics calculations', () => {
        it('should handle speed of light calculations', () => {
            const c = new Decimal('299792458.0');  // m/s
            expect(formatSignificant(c, '', 2)).toBe('299792458');  // trailing .0 stripped
            expect(formatSignificant(c, '', 0)).toBe('299792458');
        });

        it('should handle gravitational constant', () => {
            const G = new Decimal('0.0000000000667430');
            // This converts to scientific notation
            expect(formatSignificant(G, '', 5)).toBe(G.toString());
        });

        it('should handle Planck length', () => {
            const planckLength = new Decimal('0.000000000000000000000000000000000016162');
            // This converts to scientific notation
            expect(formatSignificant(planckLength, '', 10)).toBe(planckLength.toString());
        });

        it('should handle astronomical distances', () => {
            const lightYear = new Decimal('9460730472580800.0');  // meters
            expect(formatSignificant(lightYear, '', 2)).toBe('9460730472580800');  // trailing .0 stripped

            const parsec = new Decimal('30856775814913673.0');  // meters
            expect(formatSignificant(parsec, '', 0)).toBe('30856775814913673');
        });

        it('should handle relativistic calculations', () => {
            // Lorentz factor at 0.999c
            const gamma = new Decimal('22.36627047695794');
            expect(formatSignificant(gamma, '', 5)).toBe('22.36627');

            // Time dilation: very small difference - converts to scientific notation
            const timeDiff = new Decimal('0.000000000001234567');
            expect(formatSignificant(timeDiff, '', 10)).toBe(timeDiff.toString());
        });
    });

    describe('Boundary behavior with ignoreChar', () => {
        it('should handle empty ignoreChar correctly', () => {
            expect(formatSignificant(new Decimal('123.999999'), '', 2)).toBe('123.99');
            expect(formatSignificant(new Decimal('123.000000'), '', 2)).toBe('123');  // trailing zeros stripped
        });

        it('should handle ignoreChar at start vs middle of decimal', () => {
            // 9 at start
            expect(formatSignificant(new Decimal('123.999456'), '9', 2)).toBe('123.99945');
            // 9 in middle (not ignored)
            expect(formatSignificant(new Decimal('123.459'), '9', 2)).toBe('123.45');
        });

        it('should handle all digits being ignoreChar', () => {
            expect(formatSignificant(new Decimal('123.9999999999'), '9', 2)).toBe('123.9999999999');
            expect(formatSignificant(new Decimal('456.0000000000'), '0', 2)).toBe('456');  // trailing zeros stripped
        });
    });

    describe('Comprehensive mixed scenarios', () => {
        it('should handle array of diverse test values', () => {
            const testCases = [
                { input: '0', expected: '0' },
                { input: '1', expected: '1' },
                { input: '0.1', expected: '0.1' },
                { input: '10.0', expected: '10' },  // trailing .0 stripped
                { input: '123.456', expected: '123.45' },
                { input: '-123.456', expected: '-123.45' },
                { input: '0.00123', expected: '0.00' },
                { input: '999999999.99999', expected: '999999999.99' },
                { input: '0.999', expected: '0.99' },
                { input: '100.001', expected: '100.00' },
            ];

            testCases.forEach(({ input, expected }) => {
                expect(formatSignificant(new Decimal(input), '', 2)).toBe(expected);
            });
        });

        it('should handle negative numbers across all ranges', () => {
            expect(formatSignificant(new Decimal('-0.0001'), '', 2)).toBe('-0.00');
            expect(formatSignificant(new Decimal('-1.5'), '', 2)).toBe('-1.5');
            expect(formatSignificant(new Decimal('-1234567890.123'), '', 2)).toBe('-1234567890.12');
        });
    });
});
