import Decimal from 'decimal.js';
import { formatSignificant, configure } from './src/relativity_lib.ts';

// Configure high precision
configure(150);

console.log('=== Demonstrating ignoreChar with different significant places ===\n');

// Example 1: Some 9's followed by other digits
const v1 = new Decimal('0.999912345678');
console.log('Value: 0.999912345678');
console.log('  With ignoreChar="9", 2 significant:', formatSignificant(v1, '9', 2));
console.log('  With ignoreChar="9", 5 significant:', formatSignificant(v1, '9', 5));
console.log('  With ignoreChar="9", 10 significant:', formatSignificant(v1, '9', 10));
console.log('  Without ignoreChar, 2 significant:', formatSignificant(v1, '', 2));
console.log('');

// Example 2: More 9's followed by other digits
const v2 = new Decimal('0.99999999987654321');
console.log('Value: 0.99999999987654321');
console.log('  With ignoreChar="9", 2 significant:', formatSignificant(v2, '9', 2));
console.log('  With ignoreChar="9", 5 significant:', formatSignificant(v2, '9', 5));
console.log('  With ignoreChar="9", 10 significant:', formatSignificant(v2, '9', 10));
console.log('  Without ignoreChar, 2 significant:', formatSignificant(v2, '', 2));
console.log('');

// Example 3: All 9's (like in the original example)
const v3 = new Decimal('0.99999999999999999999999999999999');
console.log('Value: 0.99999999999999999999999999999999 (all 9\'s)');
console.log('  With ignoreChar="9", 2 significant:', formatSignificant(v3, '9', 2));
console.log('  With ignoreChar="9", 5 significant:', formatSignificant(v3, '9', 5));
console.log('  With ignoreChar="9", 10 significant:', formatSignificant(v3, '9', 10));
console.log('  ^ All the same because there are no non-9 digits!');
console.log('');

// Example 4: Leading zeros
const v4 = new Decimal('123.000000012345');
console.log('Value: 123.000000012345');
console.log('  With ignoreChar="0", 2 significant:', formatSignificant(v4, '0', 2));
console.log('  With ignoreChar="0", 5 significant:', formatSignificant(v4, '0', 5));
console.log('  With ignoreChar="0", 10 significant:', formatSignificant(v4, '0', 10));
console.log('  Without ignoreChar, 2 significant:', formatSignificant(v4, '', 2));
