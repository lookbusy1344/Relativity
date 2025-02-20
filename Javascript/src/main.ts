import Decimal from 'decimal.js';
import * as rl from './relativity_lib';

// Setup: yarn
// Running the dev server(yarn dev)
// Building for production(yarn build)
// Running the linter(yarn lint)

let count = 0;

document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('calculateButton');
    const result = document.getElementById('result');
    const velocityInput = document.getElementById('velocityInput') as HTMLInputElement;

    if (button && result && velocityInput) {
        button.addEventListener('click', () => {
            try {
                const v = rl.checkVelocity(velocityInput.value ?? 0);
                const l = rl.lorentzFactor(v);
                result.textContent = `${v} m/s, lorentz factor: ${l.toPrecision(20)} (clicks: ${++count})`;
            } catch (err) {
                const error = err as Error;
                result.textContent = `Error: ${error.message}`;
            }
        });
    }
});
