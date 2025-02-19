import Decimal from 'decimal.js';

// npm install
// npm run build
// to try the production build: npm run preview

function generateRandomDecimal(): Decimal {
    // Generate random number between 0 and 100 with up to 10 decimal places
    return new Decimal(Math.random()).times(1000).sqrt().dividedBy(3); //.toDecimalPlaces(50);
}

document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('calculateButton');
    const result = document.getElementById('result');

    if (button && result) {
        button.addEventListener('click', () => {
            const randomNum = generateRandomDecimal();
            result.textContent = `Precise random number: ${randomNum.toString()}`;
        });
    }
});
