import Decimal from 'decimal.js';
import * as rl from './relativity_lib';

// Setup: yarn
// Running the dev server(yarn dev)
// Building for production(yarn build)
// Running the linter(yarn lint)

function expandStr(s: string): Decimal {
    s = s.toLowerCase();
    if (s === 'c') {
        return rl.c;
    }
    if (s === 'g') {
        return rl.g;
    }
    if (s === 'ly') {
        return rl.lightYear;
    }
    return rl.ensure(s);
}

function processElement(e: HTMLInputElement): [Decimal, Decimal] {
    const orig = e.value ?? "0/0";
    const parts = orig.split('/', 2);
    if (parts.length !== 2) {
        throw new Error('Invalid input');
    }
    const a = expandStr(parts[0]);
    const b = expandStr(parts[1]);
    return [a, b];
}

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

    if (aButton && resultA && resultA1 && resultA2 && resultA3 && resultA4 && aInput) {
        aButton.addEventListener('click', () => {
            try {
                // relativistic velocity and distance are in m/s and meters
                const parts = processElement(aInput);

                const relVel = rl.relativisticVelocity(parts[0], parts[1]);
                const relDist = rl.relativisticDistance(parts[0], parts[1]);
                const simpleVel = parts[0].mul(parts[1]);
                const simpleDist = rl.simpleDistance(parts[0], parts[1]);
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

    if (flipButton && resultFlip1 && resultFlip2 && resultFlip3 && flipInput) {
        flipButton.addEventListener('click', () => {
            try {
                const m = rl.ensure(flipInput.value ?? 0).mul(rl.lightYear); // convert light years to meters
                let [properTime, peak, coordTime] = rl.flipAndBurn(rl.g, m);
                properTime = properTime.div(rl.secondsPerYear); // convert to years
                coordTime = coordTime.div(rl.secondsPerYear); // convert to years
                peak = peak.div(rl.c); // convert to fraction of c

                setElement(resultFlip1, rl.formatSignificant(properTime, "0", 3), "Proper years")
                setElement(resultFlip2, rl.formatSignificant(peak, "9", 3), "c")
                setElement(resultFlip3, rl.formatSignificant(coordTime, "0", 3), "Coord years")
            } catch (err) {
                const error = err as Error;
                resultFlip1.textContent = error.message;
                setElement(resultFlip2, "-", "");
                setElement(resultFlip3, "-", "");
            }
        });
    }

});
