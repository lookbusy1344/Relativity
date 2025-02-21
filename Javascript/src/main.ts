import Decimal from 'decimal.js';
import * as rl from './relativity_lib';

// Setup: yarn
// Running the dev server(yarn dev)
// Building for production(yarn build)
// Running the linter(yarn lint)

let count = 0;

document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('calculateButton');
    const buttonC = document.getElementById('calculateButtonC');
    const result = document.getElementById('resultLorentz');
    const resultC = document.getElementById('resultLightSpeed');
    const velocityInput = document.getElementById('velocityInput') as HTMLInputElement;
    const velocityInputC = document.getElementById('velocityInputC') as HTMLInputElement;

    if (button && result && velocityInput) {
        button.addEventListener('click', () => {
            try {
                const v = rl.checkVelocity(velocityInput.value ?? 0);
                const l = rl.lorentzFactor(v);
                result.textContent = l.toPrecision(20); // (clicks: ${++count})`;
            } catch (err) {
                const error = err as Error;
                result.textContent = error.message;
            }
        });
    }

    if (buttonC && resultC && velocityInputC) {
        buttonC.addEventListener('click', () => {
            try {
                const v = rl.ensure(velocityInputC.value ?? 0);
                const fraction = new Decimal(v).dividedBy(rl.c);
                resultC.textContent = `${fraction.toPrecision(30)}c`;
                if (fraction.greaterThan(1)) {
                    resultC.style.color = 'red';
                } else {
                    resultC.style.color = 'black';
                }
            } catch (err) {
                const error = err as Error;
                resultC.textContent = error.message;
            }
        });
    }
});
