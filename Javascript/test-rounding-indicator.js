import Decimal from 'decimal.js';
import { formatSignificant, configure } from './src/relativity_lib.ts';

configure(150);

console.log('=== Rounding Indicator Demo ===\n');

console.log('Examples where rounding occurs (shows " (r)"):');
console.log('  0.999999 with 2 dp:', formatSignificant(new Decimal('0.999999'), '', 2));
console.log('  0.999999 with 3 dp:', formatSignificant(new Decimal('0.999999'), '', 3));
console.log('  123.456 with 2 dp:', formatSignificant(new Decimal('123.456'), '', 2));
console.log('  299792457.9999 with 2 dp:', formatSignificant(new Decimal('299792457.9999'), '', 2));
console.log('');

console.log('Examples where NO rounding occurs (no indicator):');
console.log('  0.12 with 2 dp:', formatSignificant(new Decimal('0.12'), '', 2));
console.log('  123.00 with 2 dp:', formatSignificant(new Decimal('123.00'), '', 2));
console.log('  1000 with 2 dp:', formatSignificant(new Decimal('1000'), '', 2));
console.log('');

console.log('Turn off the indicator with showRoundingIndicator=false:');
console.log('  0.999999 with 2 dp, no indicator:', formatSignificant(new Decimal('0.999999'), '', 2, false));
console.log('  123.456 with 2 dp, no indicator:', formatSignificant(new Decimal('123.456'), '', 2, false));
console.log('');

console.log('Critical safety example for velocities:');
const c = new Decimal('299792458');
const v1 = c.mul('0.9999999999');
console.log('  Velocity: 0.9999999999c in m/s');
console.log('  Formatted (2 dp):', formatSignificant(v1, '', 2));
console.log('  ^ The (r) indicator warns this is NOT exactly c!');
console.log('');

const v2 = new Decimal('0.99999999999');
console.log('  Velocity: 0.99999999999c');
console.log('  With ignoreChar="9", 2 sig:', formatSignificant(v2, '9', 2));
console.log('  ^ No rounding with ignoreChar, so no indicator');
