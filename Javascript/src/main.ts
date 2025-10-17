import * as rl from './relativity_lib';
import { Chart, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

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
        // units specified - display value with units
        e.textContent = `${value} ${units}`;
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
    if (aButton && resultA1 && resultA2 && aInput) {
        aButton.addEventListener('click', () => {
            const accel = rl.g; // just assume 1g
            const secs = rl.ensure(aInput.value ?? 0).mul(60 * 60 * 24); // days to seconds

            const relVel = rl.relativisticVelocity(accel, secs);
            const relDist = rl.relativisticDistance(accel, secs);
            const relVelC = relVel.div(rl.c);
            const relDistC = relDist.div(rl.lightYear);

            setElement(resultA1, rl.formatSignificant(relVel, "9", 3), "m/s");
            setElement(resultA2, rl.formatSignificant(relDist, "9", 3), "m");

            setElement(resultA1b!, rl.formatSignificant(relVelC, "9", 3), "c");
            setElement(resultA2b!, rl.formatSignificant(relDistC, "0", 3), "ly");
        });
    }

    // Flip-and-burn charts
    let flipProperTimeChart: Chart | null = null;
    let flipCoordTimeChart: Chart | null = null;

    function updateFlipBurnCharts(distanceLightYears: number) {
        const m = rl.ensure(distanceLightYears).mul(rl.lightYear); // convert light years to meters
        let res = rl.flipAndBurn(rl.g, m);
        const properTimeSeconds = res.properTime.div(2); // Half journey (acceleration phase)

        // Generate data points (100 points for smooth curves)
        const numPoints = 100;
        const properTimePoints: number[] = [];
        const coordTimePoints: number[] = [];
        const velocityProperPoints: number[] = [];
        const velocityCoordPoints: number[] = [];

        // Acceleration phase (0 to half proper time)
        for (let i = 0; i <= numPoints; i++) {
            const tau = properTimeSeconds.mul(i / numPoints);
            const tauDays = tau.div(60 * 60 * 24);

            // Velocity during acceleration
            const velocity = rl.relativisticVelocity(rl.g, tau);
            const velocityC = velocity.div(rl.c);

            properTimePoints.push(parseFloat(tauDays.toString()));
            velocityProperPoints.push(parseFloat(velocityC.toString()));
        }

        // For coordinate time, we need to calculate coordinate time at each proper time step
        for (let i = 0; i <= numPoints; i++) {
            const tau = properTimeSeconds.mul(i / numPoints);
            const t = rl.coordinateTime(rl.g, tau);
            const tDays = t.div(60 * 60 * 24);

            // Velocity at this proper time
            const velocity = rl.relativisticVelocity(rl.g, tau);
            const velocityC = velocity.div(rl.c);

            coordTimePoints.push(parseFloat(tDays.toString()));
            velocityCoordPoints.push(parseFloat(velocityC.toString()));
        }

        // Velocity vs Proper Time Chart
        const flipProperCtx = (document.getElementById('flipProperTimeChart') as HTMLCanvasElement)?.getContext('2d');
        if (flipProperCtx) {
            if (flipProperTimeChart) flipProperTimeChart.destroy();
            flipProperTimeChart = new Chart(flipProperCtx, {
                type: 'line',
                data: {
                    labels: properTimePoints,
                    datasets: [{
                        label: 'Velocity (fraction of c)',
                        data: velocityProperPoints,
                        borderColor: 'rgb(99, 102, 241)',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: true },
                        title: { display: false }
                    },
                    scales: {
                        x: {
                            title: { display: true, text: 'Proper Time (days)' },
                            ticks: { maxTicksLimit: 10 }
                        },
                        y: {
                            title: { display: true, text: 'Velocity (c)' },
                            beginAtZero: true
                        }
                    }
                }
            });
        }

        // Velocity vs Coordinate Time Chart
        const flipCoordCtx = (document.getElementById('flipCoordTimeChart') as HTMLCanvasElement)?.getContext('2d');
        if (flipCoordCtx) {
            if (flipCoordTimeChart) flipCoordTimeChart.destroy();
            flipCoordTimeChart = new Chart(flipCoordCtx, {
                type: 'line',
                data: {
                    labels: coordTimePoints,
                    datasets: [{
                        label: 'Velocity (fraction of c)',
                        data: velocityCoordPoints,
                        borderColor: 'rgb(139, 92, 246)',
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: true },
                        title: { display: false }
                    },
                    scales: {
                        x: {
                            title: { display: true, text: 'Coordinate Time (days)' },
                            ticks: { maxTicksLimit: 10 }
                        },
                        y: {
                            title: { display: true, text: 'Velocity (c)' },
                            beginAtZero: true
                        }
                    }
                }
            });
        }
    }

    // flip and burn
    if (flipButton && resultFlip1 && resultFlip2 && resultFlip3 && resultFlip4 && flipInput) {
        flipButton.addEventListener('click', () => {
            const distanceLightYears = parseFloat(flipInput.value ?? '0');
            const m = rl.ensure(distanceLightYears).mul(rl.lightYear); // convert light years to meters
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

            // Update charts
            updateFlipBurnCharts(distanceLightYears);
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

    // Visualization charts
    let velocityChart: Chart | null = null;
    let distanceChart: Chart | null = null;
    let rapidityChart: Chart | null = null;
    let lorentzChart: Chart | null = null;

    const graphAccelInput = document.getElementById('graphAccelInput') as HTMLInputElement;
    const graphDurationInput = document.getElementById('graphDurationInput') as HTMLInputElement;
    const graphUpdateButton = document.getElementById('graphUpdateButton');

    function updateGraphs() {
        const accelG = parseFloat(graphAccelInput?.value ?? '1');
        const accel = rl.g.mul(accelG); // convert to m/s^2
        const durationDays = parseFloat(graphDurationInput?.value ?? '365');
        const durationSeconds = durationDays * 60 * 60 * 24;

        // Generate data points (100 points for smooth curves)
        const numPoints = 100;
        const timePoints: number[] = [];
        const velocityPoints: number[] = [];
        const velocityCPoints: number[] = [];
        const distancePoints: number[] = [];
        const distanceLyPoints: number[] = [];
        const rapidityPoints: number[] = [];
        const timeDilationPoints: number[] = [];

        for (let i = 0; i <= numPoints; i++) {
            const tau = (i / numPoints) * durationSeconds;
            const timeDays = tau / (60 * 60 * 24);

            const velocity = rl.relativisticVelocity(accel, tau);
            const velocityC = velocity.div(rl.c);
            const distance = rl.relativisticDistance(accel, tau);
            const distanceLy = distance.div(rl.lightYear);
            const rapidity = rl.rapidityFromVelocity(velocity);
            const lorentz = rl.lorentzFactor(velocity);
            const timeDilation = rl.one.div(lorentz); // 1/γ - how much proper time slows down

            timePoints.push(timeDays);
            velocityPoints.push(parseFloat(velocity.toString()));
            velocityCPoints.push(parseFloat(velocityC.toString()));
            distancePoints.push(parseFloat(distance.toString()));
            distanceLyPoints.push(parseFloat(distanceLy.toString()));
            rapidityPoints.push(parseFloat(rapidity.toString()));
            timeDilationPoints.push(parseFloat(timeDilation.toString()));
        }

        // Velocity Chart
        const velocityCtx = (document.getElementById('velocityChart') as HTMLCanvasElement)?.getContext('2d');
        if (velocityCtx) {
            if (velocityChart) velocityChart.destroy();
            velocityChart = new Chart(velocityCtx, {
                type: 'line',
                data: {
                    labels: timePoints,
                    datasets: [{
                        label: 'Velocity (fraction of c)',
                        data: velocityCPoints,
                        borderColor: 'rgb(99, 102, 241)',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: true },
                        title: { display: false }
                    },
                    scales: {
                        x: {
                            title: { display: true, text: 'Proper Time (days)' },
                            ticks: { maxTicksLimit: 10 }
                        },
                        y: {
                            title: { display: true, text: 'Velocity (c)' },
                            beginAtZero: true,
                            max: 1
                        }
                    }
                }
            });
        }

        // Distance Chart
        const distanceCtx = (document.getElementById('distanceChart') as HTMLCanvasElement)?.getContext('2d');
        if (distanceCtx) {
            if (distanceChart) distanceChart.destroy();
            distanceChart = new Chart(distanceCtx, {
                type: 'line',
                data: {
                    labels: timePoints,
                    datasets: [{
                        label: 'Distance (light years)',
                        data: distanceLyPoints,
                        borderColor: 'rgb(139, 92, 246)',
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: true },
                        title: { display: false }
                    },
                    scales: {
                        x: {
                            title: { display: true, text: 'Proper Time (days)' },
                            ticks: { maxTicksLimit: 10 }
                        },
                        y: {
                            title: { display: true, text: 'Distance (ly)' },
                            beginAtZero: true
                        }
                    }
                }
            });
        }

        // Rapidity Chart
        const rapidityCtx = (document.getElementById('rapidityChart') as HTMLCanvasElement)?.getContext('2d');
        if (rapidityCtx) {
            if (rapidityChart) rapidityChart.destroy();
            rapidityChart = new Chart(rapidityCtx, {
                type: 'line',
                data: {
                    labels: timePoints,
                    datasets: [{
                        label: 'Rapidity',
                        data: rapidityPoints,
                        borderColor: 'rgb(236, 72, 153)',
                        backgroundColor: 'rgba(236, 72, 153, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: true },
                        title: { display: false }
                    },
                    scales: {
                        x: {
                            title: { display: true, text: 'Proper Time (days)' },
                            ticks: { maxTicksLimit: 10 }
                        },
                        y: {
                            title: { display: true, text: 'Rapidity' },
                            beginAtZero: true
                        }
                    }
                }
            });
        }

        // Time Dilation & Length Contraction Chart
        const lorentzCtx = (document.getElementById('lorentzChart') as HTMLCanvasElement)?.getContext('2d');
        if (lorentzCtx) {
            if (lorentzChart) lorentzChart.destroy();
            lorentzChart = new Chart(lorentzCtx, {
                type: 'line',
                data: {
                    labels: timePoints,
                    datasets: [{
                        label: 'Time Dilation (1/γ)',
                        data: timeDilationPoints,
                        borderColor: 'rgb(34, 197, 94)',
                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        yAxisID: 'y'
                    }, {
                        label: 'Length Contraction (1/γ)',
                        data: timeDilationPoints, // Same as time dilation since both are 1/γ
                        borderColor: 'rgb(251, 146, 60)',
                        backgroundColor: 'rgba(251, 146, 60, 0.1)',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.4,
                        borderDash: [5, 5],
                        yAxisID: 'y1'
                    }]
                },
                options: {
                    responsive: true,
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    plugins: {
                        legend: { display: true },
                        title: { display: false }
                    },
                    scales: {
                        x: {
                            title: { display: true, text: 'Proper Time (days)' },
                            ticks: { maxTicksLimit: 10 }
                        },
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            title: { display: true, text: 'Time Rate (1 = normal)' },
                            beginAtZero: true,
                            max: 1
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            title: { display: true, text: 'Length (1 = no contraction)' },
                            beginAtZero: true,
                            max: 1,
                            grid: {
                                drawOnChartArea: false
                            }
                        }
                    }
                }
            });
        }
    }

    if (graphUpdateButton) {
        graphUpdateButton.addEventListener('click', updateGraphs);

        // Initialize graphs on page load
        setTimeout(updateGraphs, 100);
    }
});
