import Decimal from 'decimal.js';
import { formatSignificant, configure } from './src/relativity_lib.ts';

// Configure high precision
configure(150);

console.log('=== Testing High-Precision Velocity Formatting ===\n');

// Test case 1: Velocity very close to c
const v1 = new Decimal('0.99999999999999999999999999999999');
console.log('Velocity 1: 0.99999999999999999999999999999999c');
console.log('  With ignoreChar="9", 5 significant:', formatSignificant(v1, '9', 5));
console.log('  With ignoreChar="9", 10 significant:', formatSignificant(v1, '9', 10));
console.log('');

// Test case 2: Speed in m/s close to c
const c = new Decimal('299792458');
const v2 = c.mul('0.999999999999999');
console.log('Velocity 2:', v2.toString(), 'm/s');
console.log('  Formatted (10 dp):', formatSignificant(v2, '', 10));
console.log('');

// Test case 3: Very small difference from c
const diff = c.sub(v2);
console.log('Difference from c:', diff.toString(), 'm/s');
console.log('  Formatted (20 dp):', formatSignificant(diff, '', 20));
console.log('');

// Test case 4: Large numbers in decimal notation (no scientific notation!)
const huge = new Decimal('999999999999999999999999999999.123456789');
console.log('Huge number:', huge.toString());
console.log('  Formatted (5 dp):', formatSignificant(huge, '', 5));
console.log('');

// Test case 5: Tiny numbers in decimal notation
const tiny = new Decimal('0.000000000000000000123456789');
console.log('Tiny number:', tiny.toString());
console.log('  Formatted (30 dp):', formatSignificant(tiny, '', 30));
