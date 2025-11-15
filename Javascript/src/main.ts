import { Chart, registerables } from 'chart.js';
import { getInputElement, getButtonElement, getResultElement } from './ui/domUtils';
import {
    createLorentzHandler,
    createRapidityFromVelocityHandler,
    createVelocityFromRapidityHandler,
    createAccelHandler,
    createFlipBurnHandler,
    createAddVelocitiesHandler,
    createGraphUpdateHandler
} from './ui/eventHandlers';
import { generateVisualizationChartData } from './charts/dataGeneration';
import { updateVisualizationCharts, type ChartRegistry } from './charts/charts';

// Register Chart.js components
Chart.register(...registerables);

document.addEventListener('DOMContentLoaded', () => {
    const chartRegistry: { current: ChartRegistry } = { current: new Map() };

    // Lorentz factor from velocity
    getButtonElement('lorentzButton')?.addEventListener('click',
        createLorentzHandler(
            () => getInputElement('lorentzInput'),
            () => getResultElement('resultLorentz')
        )
    );

    // Rapidity from velocity
    getButtonElement('velocityButton')?.addEventListener('click',
        createRapidityFromVelocityHandler(
            () => getInputElement('velocityInput'),
            () => getResultElement('resultVelocity')
        )
    );

    // Velocity from rapidity
    getButtonElement('rapidityButton')?.addEventListener('click',
        createVelocityFromRapidityHandler(
            () => getInputElement('rapidityInput'),
            () => getResultElement('resultRapidity')
        )
    );

    // Constant acceleration
    getButtonElement('aButton')?.addEventListener('click',
        createAccelHandler(
            () => getInputElement('aInput'),
            () => [
                getResultElement('resultA1'),
                getResultElement('resultA2'),
                getResultElement('resultA1b'),
                getResultElement('resultA2b')
            ],
            chartRegistry
        )
    );

    // Flip-and-burn
    getButtonElement('flipButton')?.addEventListener('click',
        createFlipBurnHandler(
            () => getInputElement('flipInput'),
            () => [
                getResultElement('resultFlip1'),
                getResultElement('resultFlip2'),
                getResultElement('resultFlip3'),
                getResultElement('resultFlip4'),
                getResultElement('resultFlip5'),
                getResultElement('resultFlip6')
            ],
            chartRegistry
        )
    );

    // Add velocities
    getButtonElement('addButton')?.addEventListener('click',
        createAddVelocitiesHandler(
            () => getInputElement('v1Input'),
            () => getInputElement('v2Input'),
            () => getResultElement('resultAdd')
        )
    );

    // Visualization graphs
    const graphUpdateHandler = createGraphUpdateHandler(
        () => getInputElement('graphAccelInput'),
        () => getInputElement('graphDurationInput'),
        chartRegistry
    );

    getButtonElement('graphUpdateButton')?.addEventListener('click', graphUpdateHandler);

    // Initialize visualization graphs on page load
    setTimeout(() => {
        const data = generateVisualizationChartData(1, 365);
        chartRegistry.current = updateVisualizationCharts(chartRegistry.current, data);
    }, 100);
});
