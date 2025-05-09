//import Decimal from 'decimal.js';
import * as rl from './relativity_lib';

// yarn set version stable
// yarn
// yarn upgrade-interactive

// yarn install

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
    const v1Input = document.getElementById('v1Input') as HTMLInputElement;
    const v2Input = document.getElementById('v2Input') as HTMLInputElement;

    const lorentzButton = document.getElementById('lorentzButton');
    const velocityButton = document.getElementById('velocityButton');
    const rapidityButton = document.getElementById('rapidityButton');
    const aButton = document.getElementById('aButton');
    const flipButton = document.getElementById('flipButton');
    const addButton = document.getElementById('addButton');

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
    const resultA1b = document.getElementById('resultA1b');
    const resultA2b = document.getElementById('resultA2b');
    const resultAdd = document.getElementById('resultAdd');

    // lorentz factor from velocity
    if (lorentzButton && resultLorentz && lorentzInput) {
        lorentzButton.addEventListener('click', () => {
            const vel = rl.checkVelocity(lorentzInput.value ?? 0);
            const lorentz = rl.lorentzFactor(vel);
            setElement(resultLorentz, rl.formatSignificant(lorentz, "0", 3), "");
        });
    }

    // rapidity from velocity
    if (velocityButton && resultVelocity && velocityInput) {
        velocityButton.addEventListener('click', () => {
            const rapidity = rl.rapidityFromVelocity(velocityInput.value ?? 0);
            setElement(resultVelocity, rl.formatSignificant(rapidity, "0", 3), "");
        });
    }

    // velocity from rapidity
    if (rapidityButton && resultRapidity && rapidityInput) {
        rapidityButton.addEventListener('click', () => {
            const velocity = rl.velocityFromRapidity(rapidityInput.value ?? 0);
            setElement(resultRapidity, rl.formatSignificant(velocity, "9", 3), "m/s");
        });
    }

    // relativistic velocity and distance
    if (aButton && resultA && resultA1 && resultA2 && aInput) {
        aButton.addEventListener('click', () => {
            const accel = rl.g; // just assume 1g
            const secs = rl.ensure(aInput.value ?? 0).mul(60 * 60 * 24); // days to seconds

            const relVel = rl.relativisticVelocity(accel, secs);
            const relDist = rl.relativisticDistance(accel, secs);
            const relVelC = relVel.div(rl.c);
            const relDistC = relDist.div(rl.lightYear);

            setElement(resultA1, rl.formatSignificant(relVel, "9", 3), "m/s");
            setElement(resultA2, relDist.toPrecision(20), "m");

            setElement(resultA1b!, rl.formatSignificant(relVelC, "9", 3), "c");
            setElement(resultA2b!, rl.formatSignificant(relDistC, "0", 3), "ly");
            resultA.textContent = "";
        });
    }

    // flip and burn
    if (flipButton && resultFlip1 && resultFlip2 && resultFlip3 && resultFlip4 && flipInput) {
        flipButton.addEventListener('click', () => {
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
        });
    }

    // add velocities
    if (addButton && resultAdd && v1Input && v2Input) {
        addButton.addEventListener('click', () => {
            const v1 = rl.ensure(v1Input.value ?? 0);
            const v2 = rl.ensure(v2Input.value ?? 0);

            const added = rl.addVelocitiesC(v1, v2);

            setElement(resultAdd, rl.formatSignificant(added, "9", 3), "c");
        });
    }
});
