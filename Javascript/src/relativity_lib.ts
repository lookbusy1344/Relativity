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
    Decimal.set({ precision: precision, defaults: true });
    precisionConfigured = precision;

    c = new Decimal("299792458"); // speed of light in m/s
    g = new Decimal("9.80665"); // acceleration due to standard gravity
    lightYear = new Decimal("9460730472580800"); // meters in a light year
    au = new Decimal("149597870700"); // meters in an astronomical unit
    secondsPerYear = new Decimal(60 * 60 * 24).mul("365.25"); // seconds in a year

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
 * Given acceleration and required distance, calculate seconds required in proper time to reach that coord distance.
 * @param accel The acceleration in m/s^2
 * @param tau The proper time in seconds
 * @returns The proper time elapsed (s) as a Decimal
 */
export function relativisticTimeForDistance(accel: NumberInput, dist: NumberInput): Decimal {
    // (c / a) * acosh((dist * a) / csquared + one)
    const aD = ensure(accel);
    const distD = ensure(dist);
    return c.div(aD).mul(distD.mul(aD).div(cSquared).plus(one).acosh());
}

/**
 * Calculate the distance travelled under constant acceleration. Not relativistic
 * @param accel The acceleration in m/s^2
 * @param tau The time in seconds
 * @returns The distance travelled in meters as Decimal
 */
export function simpleDistance(accel: NumberInput, t: NumberInput): Decimal {
    // 0.5 * a * t^2
    const aD = ensure(accel);
    const tD = ensure(t);
    return half.mul(aD).mul(tD.pow(2));
}

/**
 * Calculate the rapidity from velocity. Rapidity is an alternative to velocity that adds linearly
 * @param velocity The velocity of the object in m/s
 * @returns The rapidity as a Decimal
 */
export function rapidityFromVelocity(velocity: NumberInput): Decimal {
    // atanh(v / c)
    const v = checkVelocity(velocity);
    return v.div(c).atanh();
}

/**
 * Calculate the relativistic velocity from rapidity. Checks for precision failure
 * @param rapidity The rapidity of the object
 * @returns The velocity as a Decimal
 */
export function velocityFromRapidity(rapidity: NumberInput): Decimal {
    // velocity = c * tanh(ensure(rapidity))
    const velocity = c.mul(ensure(rapidity).tanh());
    return checkVelocity(velocity, "Precision failure in velocityFromRapidity");
}

/**
 * Add two velocities relativistically. The velocities must be less than c
 * @param v1 The first velocity in m/s
 * @param v2 The second velocity in m/s
 * @returns The combined velocity as a Decimal
 */
export function addVelocities(v1: NumberInput, v2: NumberInput): Decimal {
    // (v1 + v2) / (one + (v1 * v2) / csquared)
    const v1D = checkVelocity(v1);
    const v2D = checkVelocity(v2);
    return v1D.plus(v2D).div(one.plus(v1D.mul(v2D).div(cSquared)));
}

/**
 * Calculate the coordinate time (lab time) elapsed for a stationary observer
 * @param accel The acceleration in m/s^2
 * @param tau The proper time in seconds
 * @returns The coordinate time elapsed in seconds as a Decimal
 */
export function coordinateTime(accel: NumberInput, tau: NumberInput): Decimal {
    // (c / a) * sinh(a * tau / c)
    const aD = ensure(accel);
    const tauD = ensure(tau);
    return c.div(aD).mul(aD.mul(tauD).div(c).sinh());
}

/**
 * Calculate the length contraction factor for a given length and velocity
 * @param len The proper length in meters
 * @param velocity The velocity of the object in m/s
 * @returns The contracted length in metres as a Decimal
 */
export function lengthContractionVelocity(len: NumberInput, velocity: NumberInput): Decimal {
    // len * sqrt(one - (velocity / c) ** 2)
    const lenD = ensure(len);
    const v = checkVelocity(velocity);
    return lenD.mul(one.minus(v.div(c).pow(2)).sqrt());
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

/**
 * Calculate the velocity under constant proper acceleration and coordinate time
 * @param accel The acceleration in m/s^2
 * @param t The coordinate time in seconds
 * @returns The velocity (m/s) as a Decimal
 */
export function relativisticVelocityCoord(accel: NumberInput, t: NumberInput): Decimal {
    // (a * t) / sqrt(one + (a * t / c) ** 2)
    const aD = ensure(accel);
    const tD = ensure(t);
    return aD.mul(tD).div(one.plus(aD.mul(tD).div(c).pow(2)).sqrt());
}
