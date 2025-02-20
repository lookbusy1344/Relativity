import Decimal from 'decimal.js';

export type NumberInput = number | string | Decimal;

// Physical constants
export const c = new Decimal("299792458"); // speed of light in m/s
export const g = new Decimal("9.80665") // acceleration due to standard gravity
export const lightYear = new Decimal("9460730472580800") // meters in a light year
export const au = new Decimal("149597870700") // meters in an astronomical unit

// constants for calculations
const cSquared = c.pow(2); // speed of light squared
export const secondsPerYear = new Decimal(60 * 60 * 24).mul("365.25") // seconds in a year
const one = new Decimal(1);
const half = new Decimal(0.5);

/**
 * Ensure this is a Decimal, convert numbers and strings as required
 */
export function ensure(v: NumberInput): Decimal {
    if (typeof v === 'number' || typeof v === 'string') {
        return new Decimal(v);  // easily convertible
    } else if (v instanceof Decimal) {
        return v; // already a Decimal
    } else {
        throw new Error('Invalid input type');
    }
}

/**
 * Convert to Decimal and check velocity is less than c
 * @param velocity The velocity in m/s
 * @param msg The error message to display
 */
export function checkVelocity(velocity: NumberInput, msg: string = "Velocity must be lower than c"): Decimal {
    const v = ensure(velocity);
    if (v.abs().gte(c)) {
        throw new Error(msg);
    }
    return v;
}

/**
 * Lorentz factor calculation
 * @param velocity The velocity of the object in m/s
 */
export function lorentzFactor(velocity: NumberInput): Decimal {
    const v = checkVelocity(velocity);
    return one.div(one.minus(v.pow(2).div(cSquared)).sqrt());
}
