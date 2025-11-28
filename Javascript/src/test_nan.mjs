// Simple test without importing the library
// First let's understand what JavaScript does with 0.99999999999999999

console.log("=== JavaScript Number Precision Issue ===");
console.log(`0.99999999999999999 as number: ${0.99999999999999999}`);
console.log(`parseFloat("0.99999999999999999") = ${parseFloat("0.99999999999999999")}`);

// Because JavaScript numbers (IEEE 754 double) can only represent about 15-17 significant digits,
// 0.99999999999999999 becomes exactly 1.0

console.log(`\n0.99999999999999999 === 1.0 ? ${0.99999999999999999 === 1.0}`);

// Now let's test with Decimal.js
import Decimal from 'decimal.js';

console.log("\n=== Decimal.js Precision ===");
Decimal.set({ precision: 150 });

// If the user enters the value as a string in the UI, it should be preserved
const strInput = "0.99999999999999999";
const numInput = 0.99999999999999999;

console.log(`From string "${strInput}": ${new Decimal(strInput).toString()}`);
console.log(`From number ${numInput}: ${new Decimal(numInput).toString()}`);

// The problem: parseFloat converts the string to a number FIRST
console.log(`\nThe UI does: parseFloat("0.99999999999999999") = ${parseFloat("0.99999999999999999")}`);

// If parseFloat is used, the value becomes 1.0 before Decimal sees it
const c = new Decimal("299792458");
const velocityFromNumber = c.mul(parseFloat("0.99999999999999999"));
const velocityFromString = c.mul("0.99999999999999999");

console.log(`\nVelocity from number: ${velocityFromNumber.toString()}`);
console.log(`Velocity from string: ${velocityFromString.toString()}`);
console.log(`c: ${c.toString()}`);

console.log(`\nVelocity from number >= c ? ${velocityFromNumber.gte(c)}`);
console.log(`Velocity from string >= c ? ${velocityFromString.gte(c)}`);
