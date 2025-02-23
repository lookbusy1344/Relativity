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
    if (value === "-") {
        e.textContent = value;
        e.setAttribute('title', "");
    } else {
        e.textContent = `${units}: ${value}`;
        e.setAttribute('title', `${value} ${units}`);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const lorentzInput = document.getElementById('lorentzInput') as HTMLInputElement;
    const velocityInput = document.getElementById('velocityInput') as HTMLInputElement;
    const aInput = document.getElementById('aInput') as HTMLInputElement;
    //const bInput = document.getElementById('bInput') as HTMLInputElement;

    const lorentzButton = document.getElementById('lorentzButton');
    const velocityButton = document.getElementById('velocityButton');
    const aButton = document.getElementById('aButton');
    //const bButton = document.getElementById('bButton');

    const resultLorentz = document.getElementById('resultLorentz');
    const resultVelocity = document.getElementById('resultVelocity');
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
                const v = rl.checkVelocity(lorentzInput.value ?? 0);
                const l = rl.lorentzFactor(v);
                resultLorentz.textContent = l.toPrecision(30); // (clicks: ${++count})`;
            } catch (err) {
                const error = err as Error;
                resultLorentz.textContent = error.message;
            }
        });
    }

    if (velocityButton && resultVelocity && velocityInput) {
        velocityButton.addEventListener('click', () => {
            try {
                const v = rl.ensure(velocityInput.value ?? 0);
                const fraction = new Decimal(v).dividedBy(rl.c);
                resultVelocity.textContent = `${fraction.toPrecision(40)}c`;
                if (fraction.greaterThan(1)) {
                    resultVelocity.style.color = 'red';
                } else {
                    resultVelocity.style.color = 'black';
                }
            } catch (err) {
                const error = err as Error;
                resultVelocity.textContent = error.message;
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

                setElement(resultA1, relVel.toString(), "m/s");
                setElement(resultA2, relDist.toPrecision(20), "m");
                setElement(resultA3, simpleVel.toString(), "m/s");
                setElement(resultA4, simpleDist.toPrecision(20), "m");

                setElement(resultA1b!, relVelC.toString(), "c");
                setElement(resultA2b!, relDistC.toString(), "ly");
                setElement(resultA3b!, simpleVelC.toString(), "c");
                setElement(resultA4b!, simpleDistC.toString(), "ly");
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
});
