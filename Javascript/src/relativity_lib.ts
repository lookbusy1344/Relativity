import Decimal from 'decimal.js';

export type NumberInput = number | string | Decimal;

// Physical constants
export let c: Decimal;
export let g: Decimal;
export let lightYear: Decimal;
export let au: Decimal;
export let secondsPerYear: Decimal;

// constants for calculations
let cSquared: Decimal;
let one: Decimal;
let half: Decimal;

// previously configured precision
let precisionConfigured: number = -1;

// Configure the precision to 100 decimal places
configure(100);

export function configure(precision: number): void {
    Decimal.set({ precision: precision, defaults: true })
    precisionConfigured = precision;

    c = new Decimal("299792458"); // speed of light in m/s
    g = new Decimal("9.80665") // acceleration due to standard gravity
    lightYear = new Decimal("9460730472580800") // meters in a light year
    au = new Decimal("149597870700") // meters in an astronomical unit
    secondsPerYear = new Decimal(60 * 60 * 24).mul("365.25") // seconds in a year

    cSquared = c.pow(2); // speed of light squared
    one = new Decimal(1);
    half = new Decimal(0.5);
}

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
 * @returns The velocity as a Decimal
 */
export function checkVelocity(velocity: NumberInput, msg: string = "Velocity must be lower than c"): Decimal {
    const v = ensure(velocity);
    if (v.abs().gte(c)) {
        throw new Error(msg);
    }
    return v;
}

/**
 * Calculate the relativistic velocity as a function of proper time tau
 * @param accel The acceleration in m/s^2
 * @param tau The proper time in seconds
 * @returns The velocity in m/s as Decimal
 */
export function relativisticVelocity(accel: NumberInput, tau: NumberInput): Decimal {
    // c * tanh(a * tau / c)
    const aD = ensure(accel);
    const tauD = ensure(tau);
    return c.mul(aD.mul(tauD).div(c).tanh());
}

/**
 * Calculate the distance travelled under constant proper acceleration. Relativistic
 * @param accel The acceleration in m/s^2
 * @param tau The proper time in seconds
 * @returns The coordinate distance travelled in meters as Decimal
 */
export function relativisticDistance(accel: NumberInput, tau: NumberInput): Decimal {
    // (csquared / a) * (cosh(a * tau / c) - one)
    const aD = ensure(accel);
    const tauD = ensure(tau);
    return cSquared.div(aD).mul(aD.mul(tauD).div(c).cosh().minus(one));
}

/**
 * Lorentz factor calculation
 * @param velocity The velocity of the object in m/s
 * @returns The Lorentz factor as a Decimal
 */
export function lorentzFactor(velocity: NumberInput): Decimal {
    const v = checkVelocity(velocity);
    return one.div(one.minus(v.pow(2).div(cSquared)).sqrt());
}
