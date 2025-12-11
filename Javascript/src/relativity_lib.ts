import Decimal from 'decimal.js';

export type NumberInput = number | string | Decimal;
export type SimplifiedInterval = [NumberInput, NumberInput];                    // time, x
export type Interval = [NumberInput, NumberInput, NumberInput, NumberInput];    // time, x, y, z

export interface IFlipAndBurn {
    properTime: Decimal;
    peakVelocity: Decimal;
    lorentzFactor: Decimal;
    coordTime: Decimal;
}

export interface ITwinParadox {
    properTime: Decimal;
    earthTime: Decimal;
    ageDifference: Decimal;
    lorentzFactor: Decimal;
    oneWayDistance: Decimal;
    totalDistance: Decimal;
    velocity: Decimal;
}

// Physical constants
export const DecimalNaN: Decimal = new Decimal(NaN);
export const DecimalInfinity: Decimal = new Decimal(Infinity);
export let c: Decimal;
export let g: Decimal;
export let lightYear: Decimal;
export let au: Decimal;
export let secondsPerYear: Decimal;
export let everestMass: Decimal;
export let moonMass: Decimal;
export let earthMass: Decimal;
export let solarMass: Decimal;
export let milkyWayMass: Decimal;
export let superclusterMass: Decimal;
export let observableUniverseMass: Decimal;

// constants for calculations
export let one: Decimal;
let cSquared: Decimal;
let half: Decimal;

// previously configured precision
let precisionConfigured: number = -1;

// Configure the precision to 100 decimal places
configure(150);

export function configure(precision: number): void {
    Decimal.set({ precision: precision, defaults: true });
    precisionConfigured = precision;

    c = new Decimal("299792458"); // speed of light in m/s
    g = new Decimal("9.80665"); // acceleration due to standard gravity
    lightYear = new Decimal("9460730472580800"); // meters in a light year
    au = new Decimal("149597870700"); // meters in an astronomical unit
    secondsPerYear = new Decimal(60 * 60 * 24).mul("365.25"); // seconds in a year
    everestMass = new Decimal("8.1e14"); // kg (approximate mass of Mount Everest)
    moonMass = new Decimal("7.342e22"); // kg (mass of the Moon)
    earthMass = new Decimal("5.972e24"); // kg
    solarMass = new Decimal("1.98892e30"); // kg
    milkyWayMass = new Decimal("1.5e12").mul(solarMass); // kg (approximately 1.5 trillion solar masses)
    superclusterMass = new Decimal("1e17").mul(solarMass); // kg (Laniakea Supercluster: ~100,000 Milky Ways)
    observableUniverseMass = new Decimal("1e53"); // kg (observable universe: ordinary matter)

    cSquared = c.pow(2); // speed of light squared
    one = new Decimal(1);
    half = new Decimal("0.5");
}

/**
 * Ensure this is a Decimal, convert numbers and strings as required
 */
export function ensure(v: NumberInput): Decimal {
    if (precisionConfigured === -1) {
        throw new Error('Precision not configured');
    }
    if (typeof v === 'number' || typeof v === 'string') {
        return new Decimal(v);  // easily convertible
    } else if (v instanceof Decimal) {
        return v; // already a Decimal
    } else {
        throw new Error('Invalid input type');
    }
}

/**
 * Ensure this value is a Decimal and check it is a valid number, throw if not
 */
export function check(v: NumberInput, msg: string = "Invalid number"): Decimal {
    const v1 = ensure(v);
    if (v1.isNaN() || !v1.isFinite()) {
        throw new Error(msg);
    }
    return v1;
}

/**
 * Convert to Decimal and check velocity is less than c
 * @param velocity The velocity in m/s
 * @param msg The error message to display
 * @returns The velocity as a Decimal
 */
export function checkVelocity(velocity: NumberInput): Decimal {
    const v = ensure(velocity);
    if (v.abs().gte(c)) {
        return DecimalNaN;
    }
    return v;
}

/**
 * Calculate proper time (sec) to reach a given velocity under constant proper acceleration
 * @param accel The acceleration in m/s^2
 * @param velocity The required velocity in m/s
 * @returns Proper time tau in seconds as a Decimal
 */
export function tauToVelocity(accel: NumberInput, velocity: NumberInput): Decimal {
    // (c / a) * atanh(velocity / c)
    const aD = ensure(accel);
    const vD = checkVelocity(velocity);
    return c.div(aD).mul(vD.div(c).atanh());
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
 * @param dist The coord distance in meters
 * @returns The proper time elapsed (s) as a Decimal
 */
export function relativisticTimeForDistance(accel: NumberInput, dist: NumberInput): Decimal {
    // (c / a) * acosh((dist * a) / csquared + one)
    const aD = ensure(accel);
    const distD = ensure(dist);
    return c.div(aD).mul(distD.mul(aD).div(cSquared).plus(one).acosh());
}

/**
 * Calculate 4-tuple of proper time (s), peak velocity (m/s), Lorentz factor, and coord time (s) for a flip and burn maneuver at given constant acceleration
 * @param accel Proper acceleration in m/s^2
 * @param dist Coord distance in meters
 * @returns IFlipAndBurn containing proper time (s), peak velocity (m/s), peak Lorentz, and Coord time (s) as Decimals
 */
export function flipAndBurn(accel: NumberInput, dist: NumberInput): IFlipAndBurn {
    const accelD = ensure(accel);
    const totalDist = ensure(dist);
    const halfDist = totalDist.div(2);

    const timeToHalfProper = relativisticTimeForDistance(accelD, halfDist);
    const timeToHalfCoord = coordinateTime(accelD, timeToHalfProper);
    const peakVelocity = relativisticVelocity(accelD, timeToHalfProper);
    const lorentz = lorentzFactor(peakVelocity);
    return { properTime: timeToHalfProper.mul(2), peakVelocity, lorentzFactor: lorentz, coordTime: timeToHalfCoord.mul(2) };
}

/**
 * Calculate the twin paradox scenario: traveling twin at constant velocity with instant turnaround
 * @param velocity The velocity in m/s
 * @param properTime The proper time in seconds for the traveling twin (total journey)
 * @returns ITwinParadox containing ages (seconds), distances (meters), velocity (m/s), and Lorentz factor
 */
export function twinParadox(velocity: NumberInput, properTime: NumberInput): ITwinParadox {
    const vel = ensure(velocity);
    const properTimeS = ensure(properTime);

    // Validate velocity is less than c
    if (vel.abs().gte(c)) {
        return {
            properTime: DecimalNaN,
            earthTime: DecimalNaN,
            ageDifference: DecimalNaN,
            lorentzFactor: DecimalNaN,
            oneWayDistance: DecimalNaN,
            totalDistance: DecimalNaN,
            velocity: DecimalNaN
        };
    }

    // Calculate Lorentz factor
    const gamma = lorentzFactor(vel);

    // Earth time elapsed
    const earthTimeS = gamma.mul(properTimeS);

    // Age difference (Earth twin is older)
    const ageDiff = earthTimeS.minus(properTimeS);

    // Distance calculations
    // One way distance = v * (earth_time / 2)
    const oneWayDist = vel.mul(earthTimeS.div(2));
    const totalDist = oneWayDist.mul(2);

    return {
        properTime: properTimeS,
        earthTime: earthTimeS,
        ageDifference: ageDiff,
        lorentzFactor: gamma,
        oneWayDistance: oneWayDist,
        totalDistance: totalDist,
        velocity: vel
    };
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
    return checkVelocity(velocity);
}

/**
 * Add two velocities (m/s) relativistically. The velocities must be less than c
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
 * Add two velocities (fraction of c) relativistically. The velocities must be less than 1.0
 * @param v1 The first velocity as fraction of c
 * @param v2 The second velocity as fraction of c
 * @returns The combined velocity as a fraction of c
 */
export function addVelocitiesC(v1: NumberInput, v2: NumberInput): Decimal {
    // (v1 + v2) / (one + v1 * v2)
    const v1D = ensure(v1);
    const v2D = ensure(v2);
    if (v1D.abs().gte(one) || v2D.abs().gte(one)) {
        return DecimalNaN;
    }
    return v1D.plus(v2D).div(one.plus(v1D.mul(v2D)));
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

/**
 * Calculate the distance traveled under constant proper acceleration and coordinate time
 * @param accel The acceleration in m/s^2
 * @param t The coordinate time in seconds
 * @returns The coordinate distance traveled in meters as a Decimal
 */
export function relativisticDistanceCoord(accel: NumberInput, t: NumberInput): Decimal {
    // (csquared / a) * (sqrt(one + (a * t / c) ** 2) - one)
    const aD = ensure(accel);
    const tD = ensure(t);
    return cSquared.div(aD).mul(one.plus(aD.mul(tD).div(c).pow(2)).sqrt().minus(one));
}

/**
 * Calculate the relativistic momentum
 * @param mass The rest mass of the object in kg
 * @param velocity The velocity of the object in m/s
 * @returns The momentum in kg m/s as a Decimal
 */
export function relativisticMomentum(mass: NumberInput, velocity: NumberInput): Decimal {
    // mass * velocity * gamma
    const m = ensure(mass);
    const v = checkVelocity(velocity);
    const gamma = lorentzFactor(v)
    return m.mul(v).mul(gamma);
}

/**
 * Calculate the relativistic energy
 * @param mass The rest mass of the object in kg
 * @param velocity The velocity of the object in m/s
 * @returns The energy in Joules as a Decimal
 */
export function relativisticEnergy(mass: NumberInput, velocity: NumberInput): Decimal {
    // mass * csquared * gamma
    const m = ensure(mass);
    const gamma = lorentzFactor(velocity)
    return m.mul(cSquared).mul(gamma);
}

/**
 * Calculate the relativistic Doppler shift for light
 * @param frequency The frequency of the light in Hz
 * @param velocity The velocity of the source in m/s
 * @param source_moving_towards True if the source is moving towards the observer
 * @returns The shifted frequency in Hz as a Decimal
 */
export function dopplerShift(frequency: NumberInput, velocity: NumberInput, source_moving_towards: boolean = true): Decimal {
    //  towards: frequency * sqrt((one + beta) / (one - beta))
    //  away: frequency * sqrt((one - beta) / (one + beta))
    const f = ensure(frequency);
    const beta = checkVelocity(velocity).div(c);
    if (source_moving_towards) {
        return f.mul(one.plus(beta).div(one.minus(beta)).sqrt());
    } else {
        return f.mul(one.minus(beta).div(one.plus(beta)).sqrt());
    }
}

/**
 * Calculate the invariant (proper) mass of a system from energy and momentum
 * @param energy The energy of the system in Joules
 * @param p The momentum of the system in kg m/s
 * @returns The rest mass in kg as a Decimal
 */
export function invariantMassFromEnergyMomentum(energy: NumberInput, p: NumberInput): Decimal {
    // sqrt((energy / csquared) ** 2 - (p / csquared) ** 2)
    const e = ensure(energy);
    const pD = ensure(p);
    return e.div(cSquared).pow(2).minus(pD.div(cSquared).pow(2)).sqrt();
}

/**
 * Calculate the four-momentum of a particle
 * @param mass The rest mass of the particle in kg
 * @param velocity The velocity of the particle in m/s
 * @returns A tuple of energy (j), momentum (kg·m/s) as Decimals
 */
export function fourMomentum(mass: NumberInput, velocity: NumberInput): [Decimal, Decimal] {
    const m = ensure(mass);
    const v = checkVelocity(velocity);
    const gamma = lorentzFactor(v);
    const energy = m.mul(cSquared).mul(gamma);
    const momentum = m.mul(v).mul(gamma);
    return [energy, momentum];
}

/**
 * Calculate the invariant spacetime interval between two events in 1D space
 * @param event1 The first event as a tuple of time, x
 * @param event2 The second event as a tuple of time, x
 * @returns The invariant interval (spacetime interval squared, or seconds^2 - meters^2 / c^2)
 */
export function spacetimeInterval1d(event1: SimplifiedInterval, event2: SimplifiedInterval): Decimal {
    // sqrt(csquared * delta_ts - delta_xs)
    const [time1, x1] = event1;
    const [time2, x2] = event2;
    const delta_ts = ensure(time2).sub(ensure(time1)).pow(2);
    const delta_xs = ensure(x2).sub(ensure(x1)).pow(2);
    return cSquared.mul(delta_ts).minus(delta_xs).sqrt();
}

/**
 * Calculate the invariant spacetime interval between two events in 3D space
 * @param event1 The first event as a tuple of time, x, y, z
 * @param event2 The second event as a tuple of time, x, y, z
 * @returns The invariant interval (spacetime interval squared, or seconds^2 - meters^2 / c^2)
 */
export function spacetimeInterval3d(event1: Interval, event2: Interval): Decimal {
    // sqrt((cΔt) ^ 2 - (Δx) ^ 2 - (Δy) ^ 2 - (Δz) ^ 2)
    // normal intervals are time-like
    // zero is light-like
    // imaginary is space-like, not causally connected
    const [time1, x1, y1, z1] = event1;
    const [time2, x2, y2, z2] = event2;
    const delta_ts = ensure(time2).sub(ensure(time1)).pow(2);
    const delta_xs = ensure(x2).sub(ensure(x1)).pow(2);
    const delta_ys = ensure(y2).sub(ensure(y1)).pow(2);
    const delta_zs = ensure(z2).sub(ensure(z1)).pow(2);
    return cSquared.mul(delta_ts).minus(delta_xs).minus(delta_ys).minus(delta_zs).sqrt();
}

/**
 * Compute the time (in seconds) that a rocket can maintain constant proper acceleration
 * using matter-antimatter annihilation with charged-pion exhaust.
 *
 * Physics: Proton-antiproton annihilation produces multiple pions and other mesons.
 * Experimental data shows ~40% of annihilation energy appears as charged pion
 * kinetic energy that can be magnetically redirected for thrust. The remaining
 * ~60% goes to neutral pions (which decay to gamma rays), pion rest mass energy,
 * and other particles that cannot be efficiently directed.
 *
 * Assumptions:
 * - Charged pions have ~0.94c exhaust speed before decay.
 * - Nozzle efficiency reduces axial momentum (collimation), not particle speed.
 * - chargedFraction (~0.40) represents usable annihilation energy in charged pions;
 *   it scales available thrust/power, not exhaust speed.
 *
 * References:
 * - NASA studies: https://ntrs.nasa.gov/api/citations/20200001904/downloads/20200001904.pdf
 * - NASA contractor report: https://ntrs.nasa.gov/api/citations/19890018329/downloads/19890018329.pdf
 * - Experimental data: https://link.springer.com/article/10.1140/epja/s10050-024-01428-x
 *
 * @param fuelMass Combined matter + antimatter mass (kg) that will be annihilated
 * @param dryMass Dry mass of the spacecraft after all fuel is gone (kg)
 * @param nozzleEfficiency Magnetic nozzle effectiveness at collimating charged pions (0–1).
 *                         Default = 0.85 (realistic for magnetic nozzles).
 * @param chargedFraction Fraction of annihilation energy in charged pions (0–1).
 *                        Default = 0.4 (40%, from NASA experimental studies).
 *                        Note: Total system efficiency ≈ chargedFraction × nozzleEfficiency ≈ 0.34 at defaults.
 * @param accel Acceleration to maintain (m/s²). Default = 1g (9.80665 m/s²)
 * @returns Acceleration time in seconds as a Decimal
 */
export function pionRocketAccelTime(
    fuelMass: NumberInput,
    dryMass: NumberInput,
    nozzleEfficiency: NumberInput = 0.85,
    chargedFraction: NumberInput = 0.4,
    accel: NumberInput = g
): Decimal {
    const fuelD = check(fuelMass, "Invalid fuel mass");
    const dryD = check(dryMass, "Invalid dry mass");
    const nozzleEffD = check(nozzleEfficiency, "Invalid nozzle efficiency");
    const chargedFractionD = check(chargedFraction, "Invalid charged fraction");
    const accelD = check(accel, "Invalid acceleration");

    // Charged pion exhaust velocity (actual particle velocity, not including energy fraction)
    // Nozzle efficiency affects momentum collimation
    const ve = c.mul(0.94).mul(nozzleEffD);

    // Apply charged fraction as thrust efficiency: only this fraction of fuel energy
    // becomes usable momentum at velocity ve
    const veEffective = ve.mul(chargedFractionD);

    const m0 = dryD.plus(fuelD);
    const mf = dryD;

    if (m0.lte(mf) || veEffective.lte(0)) {
        return new Decimal(0);
    }

    // t = (v_e_effective / a) * ln(M0/Mf)
    return veEffective.div(accelD).mul(m0.div(mf).ln());
}

/**
 * Compute the propellant mass fraction required for a charged-pion antimatter rocket
 * to maintain constant proper acceleration for a given time.
 *
 * Physics: Proton-antiproton annihilation produces multiple pions and other mesons.
 * Experimental data shows ~40% of annihilation energy appears as charged pion
 * kinetic energy that can be magnetically redirected for thrust. The remaining
 * ~60% goes to neutral pions (which decay to gamma rays), pion rest mass energy,
 * and other particles that cannot be efficiently directed.
 *
 * Assumptions:
 * - Charged pions have ~0.94c exhaust speed before decay.
 * - Nozzle efficiency reduces axial momentum (collimation), not particle speed.
 * - chargedFraction (~0.40) represents usable annihilation energy in charged pions;
 *   it scales available thrust/power, not exhaust speed.
 *
 * References:
 * - NASA studies: https://ntrs.nasa.gov/api/citations/20200001904/downloads/20200001904.pdf
 * - NASA contractor report: https://ntrs.nasa.gov/api/citations/19890018329/downloads/19890018329.pdf
 * - Experimental data: https://link.springer.com/article/10.1140/epja/s10050-024-01428-x
 *
 * @param thrustTime Duration of thrust in seconds
 * @param accel Constant proper acceleration (m/s²). Default = 1g
 * @param nozzleEfficiency Magnetic nozzle effectiveness at collimating charged pions (0–1).
 *                         Default = 0.85 (realistic for magnetic nozzles).
 * @param chargedFraction Fraction of annihilation energy in charged pions (0–1).
 *                        Default = 0.4 (40%, from NASA experimental studies).
 *                        Note: Total system efficiency ≈ chargedFraction × nozzleEfficiency ≈ 0.34 at defaults.
 * @returns Propellant mass fraction (fuel_mass / initial_mass), range 0.0 to 1.0
 */
export function pionRocketFuelFraction(
    thrustTime: NumberInput,
    accel: NumberInput = g,
    nozzleEfficiency: NumberInput = 0.85,
    chargedFraction: NumberInput = 0.4
): Decimal {
    const timeD = check(thrustTime, "Invalid thrust time");
    const accelD = check(accel, "Invalid acceleration");
    const nozzleEffD = check(nozzleEfficiency, "Invalid nozzle efficiency");
    const chargedFractionD = check(chargedFraction, "Invalid charged fraction");

    // Charged pion exhaust velocity (actual particle velocity, not including energy fraction)
    // Nozzle efficiency affects momentum collimation
    const ve = c.mul(0.94).mul(nozzleEffD);

    // Apply charged fraction as thrust efficiency: only this fraction of fuel energy
    // becomes usable momentum at velocity ve
    const veEffective = ve.mul(chargedFractionD);

    if (veEffective.lte(0)) {
        return new Decimal(0);
    }

    // Mass ratio M0/Mf = exp(a*t / v_e_effective)
    const massRatio = accelD.mul(timeD).div(veEffective).exp();

    // Propellant fraction = 1 - (Mf/M0) = 1 - 1/mass_ratio
    return one.minus(one.div(massRatio));
}

/**
 * Calculate fuel fractions at multiple nozzle efficiency levels
 * @param thrustTime Duration of thrust in seconds
 * @param accel Constant proper acceleration (m/s²)
 * @param nozzleEfficiencies Array of nozzle efficiency values (0-1)
 * @returns Array of fuel fractions as percentages (0-100) for each nozzle efficiency level
 */
export function pionRocketFuelFractionsMultiple(
    thrustTime: NumberInput,
    accel: NumberInput,
    nozzleEfficiencies: number[]
): Decimal[] {
    return nozzleEfficiencies.map(nozzleEff => 
        pionRocketFuelFraction(thrustTime, accel, nozzleEff).mul(100)
    );
}

/**
 * Format a Decimal value with specified decimal places and thousand separators.
 * 
 * **BREAKING CHANGE (v2.0.0):** This function now formats all numbers in decimal notation
 * instead of preserving scientific notation. Previously, values like "1e100" would be
 * returned as-is in scientific notation. Now they are expanded to full decimal format
 * with thousand separators (e.g., "10,000,000,000...").
 * 
 * Features:
 * - Rounds to specified decimal places using banker's rounding
 * - Adds thousand separators (commas) to integer part
 * - Strips trailing zeros from decimal part
 * - Supports ignoreChar for selective digit formatting (useful for sequences like "0.999...")
 * - Normalizes -0 to 0
 * 
 * @param value The Decimal value to format
 * @param ignoreChar Optional single character to skip when counting significant places.
 *                   If the decimal part starts with this character, those digits are
 *                   copied but not counted toward the significantDecimalPlaces limit.
 *                   Useful for formatting values like 0.9999999123 with ignoreChar='9'.
 * @param significantDecimalPlaces Number of decimal places to include (default: 2).
 *                                 Set to 0 to return only the integer part (rounded).
 * @returns Formatted string with thousand separators and specified decimal places
 * @throws Error if ignoreChar is more than one character
 * 
 * @example
 * formatSignificant(new Decimal("1234.5678"))           // "1,234.57"
 * formatSignificant(new Decimal("0.999123"), "9", 3)    // "0.999123"
 * formatSignificant(new Decimal("1e100"), "", 2)        // "10,000,000,000..." (full decimal)
 * formatSignificant(new Decimal("1234.5678"), "", 0)    // "1,235" (rounded integer)
 */
export function formatSignificant(value: Decimal, ignoreChar: string = "", significantDecimalPlaces: number = 2, preserveTrailingZeros: boolean = false): string {
    if (ignoreChar.length > 1) {
        throw new Error('ignoreChar must be a single character or empty');
    }

    // If 0 decimal places requested, return just the integer part (rounded)
    if (significantDecimalPlaces === 0) {
        const integerStr = value.toFixed(0);
        // Add thousand separators
        const result = integerStr.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return result === '-0' ? '0' : result;
    }

    // For ignoreChar case, we need full precision to scan for the character
    // For normal case, we can use exact rounding
    const needsFullPrecision = ignoreChar.length > 0;
    const maxDecimalPlaces = needsFullPrecision
        ? Math.max(precisionConfigured, significantDecimalPlaces + 50)
        : significantDecimalPlaces;

    const str = value.toFixed(maxDecimalPlaces);
    const parts = str.split('.', 2);

    // Handle integers (no decimal part)
    if (parts.length !== 2) {
        const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        // If preserving trailing zeros and we want decimal places, add them
        if (preserveTrailingZeros && significantDecimalPlaces > 0) {
            const zeros = '0'.repeat(significantDecimalPlaces);
            return integerPart === '-0' ? `0.${zeros}` : `${integerPart}.${zeros}`;
        }
        return integerPart === '-0' ? '0' : integerPart;
    }

    let decOutput = ""; // output buffer
    let remainingPlaces = significantDecimalPlaces;

    if (needsFullPrecision) {
        // Scan for ignoreChar, then take significant digits
        let sigPart = true;
        for (let i = 0; i < parts[1].length; ++i) {
            const digit = parts[1][i];
            if (sigPart && digit === ignoreChar) {
                // in the ignoreChar part, just copy the digit
                decOutput += digit;
            } else if (remainingPlaces > 0) {
                // now include a fixed number of digits
                sigPart = false; // we've passed the ignoreChars
                decOutput += digit;
                --remainingPlaces;
            } else {
                break;
            }
        }
    } else {
        // No ignoreChar - toFixed already rounded correctly
        decOutput = parts[1];
    }

    // Strip trailing zeros to match Decimal.toString() behavior (unless preserving)
    if (!preserveTrailingZeros) {
        decOutput = decOutput.replace(/0+$/, '');
    } else {
        // Pad with zeros if needed to reach significantDecimalPlaces
        while (decOutput.length < significantDecimalPlaces) {
            decOutput += '0';
        }
    }

    // Add thousand separators (commas) to the integer part
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    const result = decOutput.length === 0 ? integerPart : `${integerPart}.${decOutput}`;

    // Normalize -0 to 0
    return result === '-0' ? '0' : result;
}

/**
 * Format a mass value with appropriate unit scaling (kg, tons, Everest masses, Moon masses, Earth masses, Solar masses, Milky Way masses, Supercluster masses, Observable Universe masses)
 * Uses 0.1x thresholds for unit transitions to provide human-readable output
 *
 * @param fuelMass - The mass value in kilograms
 * @returns Formatted string with smart unit and scientific notation in parentheses
 *
 * @example
 * formatMassWithUnit(new Decimal(500))             // "500 kg (5.0e+2 kg)"
 * formatMassWithUnit(new Decimal(5000))            // "5,000 tons (5.0e+3 kg)"
 * formatMassWithUnit(everestMass)                  // "1.00 Everest masses (8.10e+14 kg)"
 * formatMassWithUnit(moonMass)                     // "1.00 Moon masses (7.34e+22 kg)"
 * formatMassWithUnit(earthMass)                    // "1.00 Earth masses (5.97e+24 kg)"
 * formatMassWithUnit(superclusterMass)             // "1.00 Supercluster masses (1.99e+47 kg)"
 * formatMassWithUnit(observableUniverseMass)       // "1.00 Observable Universe masses (1.00e+53 kg)"
 */
export function formatMassWithUnit(fuelMass: Decimal): string {
    const fuelMassScientific = fuelMass.toExponential(2);

    if (fuelMass.lt(1000)) {
        // Show in kg for very small masses (< 1 ton)
        return `${formatSignificant(fuelMass, "0", 2)} kg (${fuelMassScientific} kg)`;
    }

    const everestMasses = fuelMass.div(everestMass);
    if (everestMasses.lt(0.1)) {
        // Show in tons for small masses (whole number)
        const tons = fuelMass.div(1000);
        return `${formatSignificant(tons, "0", 0)} tons (${fuelMassScientific} kg)`;
    }

    const moonMasses = fuelMass.div(moonMass);
    if (moonMasses.lt(0.1)) {
        // Show in Everest masses (use empty ignoreChar with preserveTrailingZeros to avoid bug with "0")
        return `${formatSignificant(everestMasses, "", 2, true)} Everest masses (${fuelMassScientific} kg)`;
    }

    const earthMasses = fuelMass.div(earthMass);
    if (earthMasses.lt(0.1)) {
        // Show in Moon masses (use empty ignoreChar with preserveTrailingZeros to avoid bug with "0")
        return `${formatSignificant(moonMasses, "", 2, true)} Moon masses (${fuelMassScientific} kg)`;
    }

    const solarMasses = fuelMass.div(solarMass);
    if (solarMasses.lt(0.1)) {
        // Show in Earth masses (use empty ignoreChar with preserveTrailingZeros to avoid bug with "0")
        return `${formatSignificant(earthMasses, "", 2, true)} Earth masses (${fuelMassScientific} kg)`;
    }

    const milkyWayMasses = fuelMass.div(milkyWayMass);
    if (milkyWayMasses.lt(0.1)) {
        // Show in Solar masses (use empty ignoreChar with preserveTrailingZeros to avoid bug with "0")
        return `${formatSignificant(solarMasses, "", 2, true)} Solar masses (${fuelMassScientific} kg)`;
    }

    const superclusterMasses = fuelMass.div(superclusterMass);
    if (superclusterMasses.lt(0.1)) {
        // Show in Milky Way masses (use empty ignoreChar with preserveTrailingZeros to avoid bug with "0")
        return `${formatSignificant(milkyWayMasses, "", 2, true)} Milky Way masses (${fuelMassScientific} kg)`;
    }

    const observableUniverseMasses = fuelMass.div(observableUniverseMass);
    if (observableUniverseMasses.lt(0.1)) {
        // Show in Supercluster masses (use empty ignoreChar with preserveTrailingZeros to avoid bug with "0")
        return `${formatSignificant(superclusterMasses, "", 2, true)} Supercluster masses (${fuelMassScientific} kg)`;
    }

    // Show in Observable Universe masses (use empty ignoreChar with preserveTrailingZeros to avoid bug with "0")
    return `${formatSignificant(observableUniverseMasses, "", 2, true)} Observable Universe masses (${fuelMassScientific} kg)`;
}

/**
 * Format distance with automatic unit selection based on magnitude
 * Uses light years for distances >= 0.1 ly, kilometers for smaller distances
 *
 * @param distanceInLightYears - Distance in light years (Decimal)
 * @param distanceInKm - Distance in kilometers (Decimal)
 * @returns Object with formatted value and units
 */
export function formatDistanceAutoUnit(distanceInLightYears: Decimal, distanceInKm: Decimal): { value: string; units: string } {
    const threshold = new Decimal('0.1');

    if (distanceInLightYears.gte(threshold)) {
        return {
            value: formatSignificant(distanceInLightYears, "0", 3, true),
            units: 'ly'
        };
    } else {
        return {
            value: formatSignificant(distanceInKm, "0", 1),
            units: 'km'
        };
    }
}