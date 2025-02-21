import Decimal from 'decimal.js';
import * as rl from './relativity_lib';

// Setup: yarn
// Running the dev server(yarn dev)
// Building for production(yarn build)
// Running the linter(yarn lint)

let count = 0;

document.addEventListener('DOMContentLoaded', () => {
    const lorentzButton = document.getElementById('lorentzButton');
    const velocityButton = document.getElementById('velocityButton');
    const resultLorentz = document.getElementById('resultLorentz');
    const resultVelocity = document.getElementById('resultVelocity');
    const lorentzInput = document.getElementById('lorentzInput') as HTMLInputElement;
    const velocityInput = document.getElementById('velocityInput') as HTMLInputElement;

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
});
