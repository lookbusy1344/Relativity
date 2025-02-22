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

document.addEventListener('DOMContentLoaded', () => {
    const lorentzInput = document.getElementById('lorentzInput') as HTMLInputElement;
    const velocityInput = document.getElementById('velocityInput') as HTMLInputElement;
    const aInput = document.getElementById('aInput') as HTMLInputElement;
    const bInput = document.getElementById('bInput') as HTMLInputElement;

    const lorentzButton = document.getElementById('lorentzButton');
    const velocityButton = document.getElementById('velocityButton');
    const aButton = document.getElementById('aButton');
    const bButton = document.getElementById('bButton');

    const resultLorentz = document.getElementById('resultLorentz');
    const resultVelocity = document.getElementById('resultVelocity');
    const resultA = document.getElementById('resultA');
    const resultB = document.getElementById('resultB');

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

    if (aButton && resultA && aInput) {
        aButton.addEventListener('click', () => {
            try {
                // relativistic velocity and distance are in m/s and meters
                const parts = processElement(aInput);

                const relVel = rl.relativisticVelocity(parts[0], parts[1]);
                const relDist = rl.relativisticDistance(parts[0], parts[1]);
                const simpleVel = parts[0].mul(parts[1]);
                const simpleDist = rl.simpleDistance(parts[0], parts[1]);

                resultA.textContent = `Relativistic velocity: ${relVel.toPrecision(50)} m/s, Distance: ${relDist.toPrecision(15)} m, Simple velocity: ${simpleVel.toPrecision(15)} m/s, Distance: ${simpleDist.toPrecision(15)} m`;
            } catch (err) {
                const error = err as Error;
                resultA.textContent = error.message;
            }
        });
    }

    if (bButton && resultB && bInput) {
        bButton.addEventListener('click', () => {
            try {
                // here results are in c and light years
                const parts = processElement(bInput);

                const relVel = rl.relativisticVelocity(parts[0], parts[1]).div(rl.c);
                const relDist = rl.relativisticDistance(parts[0], parts[1]).div(rl.lightYear);
                const simpleVel = parts[0].mul(parts[1]).div(rl.c);
                const simpleDist = rl.simpleDistance(parts[0], parts[1]).div(rl.lightYear);

                resultB.textContent = `Relativistic velocity: ${relVel.toPrecision(40)} c, Distance: ${relDist.toPrecision(15)} ly, Simple velocity: ${simpleVel.toPrecision(15)} c, Distance: ${simpleDist.toPrecision(15)} ly`;
            } catch (err) {
                const error = err as Error;
                resultB.textContent = error.message;
            }
        });
    }
});
