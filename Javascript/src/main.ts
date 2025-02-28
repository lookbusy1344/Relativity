//import Decimal from 'decimal.js';
import * as rl from './relativity_lib';

// Setup: yarn
// Running the dev server(yarn dev)
// Building for production(yarn build)
// Running the linter(yarn lint)

function setElement(e: HTMLElement, value: string, units: string): void {
    if (units === "" || value === "-") {
        // no units
        e.textContent = value;
        e.setAttribute('title', value);
    } else {
        // units specified
        e.textContent = `${units}: ${value}`;
        e.setAttribute('title', `${value} ${units}`);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const lorentzInput = document.getElementById('lorentzInput') as HTMLInputElement;
    const velocityInput = document.getElementById('velocityInput') as HTMLInputElement;
    const rapidityInput = document.getElementById('rapidityInput') as HTMLInputElement;
    const aInput = document.getElementById('aInput') as HTMLInputElement;
    const flipInput = document.getElementById('flipInput') as HTMLInputElement;

    const lorentzButton = document.getElementById('lorentzButton');
    const velocityButton = document.getElementById('velocityButton');
    const rapidityButton = document.getElementById('rapidityButton');
    const aButton = document.getElementById('aButton');
    const flipButton = document.getElementById('flipButton');

    const resultLorentz = document.getElementById('resultLorentz');
    const resultVelocity = document.getElementById('resultVelocity');
    const resultRapidity = document.getElementById('resultRapidity');
    const resultFlip1 = document.getElementById('resultFlip1');
    const resultFlip2 = document.getElementById('resultFlip2');
    const resultFlip3 = document.getElementById('resultFlip3');
    const resultFlip4 = document.getElementById('resultFlip4');
    const resultFlip5 = document.getElementById('resultFlip5');
    const resultFlip6 = document.getElementById('resultFlip6');

    const resultA = document.getElementById('resultA');
    const resultA1 = document.getElementById('resultA1');
    const resultA2 = document.getElementById('resultA2');
    const resultA3 = document.getElementById('resultA3');
    const resultA4 = document.getElementById('resultA4');
    const resultA1b = document.getElementById('resultA1b');
    const resultA2b = document.getElementById('resultA2b');
    const resultA3b = document.getElementById('resultA3b');
    const resultA4b = document.getElementById('resultA4b');

    if (lorentzButton && resultLorentz && lorentzInput) {
        lorentzButton.addEventListener('click', () => {
            try {
                const vel = rl.checkVelocity(lorentzInput.value ?? 0);
                const lorentz = rl.lorentzFactor(vel);
                setElement(resultLorentz, rl.formatSignificant(lorentz, "0", 3), "");
            } catch (err) {
                const error = err as Error;
                resultLorentz.textContent = error.message;
            }
        });
    }

    if (velocityButton && resultVelocity && velocityInput) {
        velocityButton.addEventListener('click', () => {
            try {
                const rapidity = rl.rapidityFromVelocity(velocityInput.value ?? 0);
                setElement(resultVelocity, rl.formatSignificant(rapidity, "0", 3), "");
            } catch (err) {
                const error = err as Error;
                resultVelocity.textContent = error.message;
            }
        });
    }

    if (rapidityButton && resultRapidity && rapidityInput) {
        rapidityButton.addEventListener('click', () => {
            try {
                const velocity = rl.velocityFromRapidity(rapidityInput.value ?? 0);
                setElement(resultRapidity, rl.formatSignificant(velocity, "9", 3), "m/s");
            } catch (err) {
                const error = err as Error;
                resultRapidity.textContent = error.message;
            }
        });
    }

    // relativistic velocity and distance
    if (aButton && resultA && resultA1 && resultA2 && resultA3 && resultA4 && aInput) {
        aButton.addEventListener('click', () => {
            try {
                const accel = rl.g; // just assume 1g
                const secs = rl.ensure(aInput.value ?? 0).mul(60 * 60 * 24); // days to seconds

                const relVel = rl.relativisticVelocity(accel, secs);
                const relDist = rl.relativisticDistance(accel, secs);
                const simpleVel = accel.mul(secs);
                const simpleDist = rl.simpleDistance(accel, secs);
                const relVelC = relVel.div(rl.c);
                const relDistC = relDist.div(rl.lightYear);
                const simpleVelC = simpleVel.div(rl.c);
                const simpleDistC = simpleDist.div(rl.lightYear);

                setElement(resultA1, rl.formatSignificant(relVel, "9", 3), "m/s");
                setElement(resultA2, relDist.toPrecision(20), "m");
                setElement(resultA3, simpleVel.toString(), "m/s");
                setElement(resultA4, simpleDist.toPrecision(20), "m");

                setElement(resultA1b!, rl.formatSignificant(relVelC, "9", 3), "c");
                setElement(resultA2b!, rl.formatSignificant(relDistC, "0", 3), "ly");
                setElement(resultA3b!, rl.formatSignificant(simpleVelC, "0", 3), "c");
                setElement(resultA4b!, rl.formatSignificant(simpleDistC, "0", 3), "ly");
                resultA.textContent = "";
            } catch (err) {
                const error = err as Error;
                resultA.textContent = error.message;
                setElement(resultA1, "-", "");
                setElement(resultA2, "-", "");
                setElement(resultA3, "-", "");
                setElement(resultA4, "-", "");
                setElement(resultA1b!, "-", "");
                setElement(resultA2b!, "-", "");
                setElement(resultA3b!, "-", "");
                setElement(resultA4b!, "-", "");
            }
        });
    }

    // flip and burn
    if (flipButton && resultFlip1 && resultFlip2 && resultFlip3 && resultFlip4 && flipInput) {
        flipButton.addEventListener('click', () => {
            try {
                const m = rl.ensure(flipInput.value ?? 0).mul(rl.lightYear); // convert light years to meters
                let res = rl.flipAndBurn(rl.g, m);
                const properTime = res.properTime.div(rl.secondsPerYear); // convert to years
                const coordTime = res.coordTime.div(rl.secondsPerYear); // convert to years
                const peak = res.peakVelocity.div(rl.c); // convert to fraction of c
                const lorentz = res.lorentzFactor;
                const metre = rl.formatSignificant(rl.one.div(lorentz), "0", 2);
                const sec = rl.formatSignificant(rl.one.mul(lorentz), "0", 2);

                setElement(resultFlip1, rl.formatSignificant(properTime, "0", 2), "yrs");
                setElement(resultFlip2, rl.formatSignificant(peak, "9", 2), "c");
                setElement(resultFlip4, rl.formatSignificant(coordTime, "0", 2), "yrs");

                setElement(resultFlip3, rl.formatSignificant(lorentz, "0", 2), "");
                setElement(resultFlip5!, `1m becomes ${metre}m`, "");
                setElement(resultFlip6!, `1s becomes ${sec}s`, "");
            } catch (err) {
                const error = err as Error;
                resultFlip1.textContent = error.message;
                setElement(resultFlip2, "-", "");
                setElement(resultFlip3, "-", "");
                setElement(resultFlip4, "-", "");
                setElement(resultFlip5!, "-", "");
                setElement(resultFlip6!, "-", "");
            }
        });
    }

});
