import { Chart, registerables } from 'chart.js';
import { getInputElement, getButtonElement, getResultElement } from './ui/domUtils';
import {
    createLorentzHandler,
    createRapidityFromVelocityHandler,
    createVelocityFromRapidityHandler,
    createAccelHandler,
    createFlipBurnHandler,
    createAddVelocitiesHandler,
    createGraphUpdateHandler,
    createPionAccelTimeHandler,
    createSpacetimeIntervalHandler
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
                getResultElement('resultA2b'),
                getResultElement('resultAFuel40'),
                getResultElement('resultAFuel'),
                getResultElement('resultAFuel60'),
                getResultElement('resultAFuel70')
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
                getResultElement('resultFlip6'),
                getResultElement('resultFlipFuel40'),
                getResultElement('resultFlipFuel'),
                getResultElement('resultFlipFuel60'),
                getResultElement('resultFlipFuel70')
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

    // Pion rocket acceleration time
    getButtonElement('pionAccelButton')?.addEventListener('click',
        createPionAccelTimeHandler(
            () => getInputElement('pionFuelMassInput'),
            () => getInputElement('pionDryMassInput'),
            () => getInputElement('pionEfficiencyInput'),
            () => getResultElement('resultPionAccel')
        )
    );

    // Spacetime interval
    getButtonElement('spacetimeButton')?.addEventListener('click',
        createSpacetimeIntervalHandler(
            () => getInputElement('spacetimeTime2'),
            () => getInputElement('spacetimeX2'),
            () => getInputElement('spacetimeVelocity'),
            () => getResultElement('resultSpacetimeSquared'),
            () => getResultElement('resultSpacetimeType'),
            () => getResultElement('resultSpacetimeDeltaT'),
            () => getResultElement('resultSpacetimeDeltaX')
        )
    );

    // Visualization graphs
    const graphUpdateHandler = createGraphUpdateHandler(
        () => getInputElement('graphAccelInput'),
        () => getInputElement('graphDurationInput'),
        () => getResultElement('graphStatus'),
        chartRegistry
    );

    getButtonElement('graphUpdateButton')?.addEventListener('click', graphUpdateHandler);

    // Initialize visualization graphs on page load
    setTimeout(() => {
        const data = generateVisualizationChartData(1, 365);
        chartRegistry.current = updateVisualizationCharts(chartRegistry.current, data);
    }, 100);

    // Handle orientation changes and window resize with debounce
    let resizeTimeout: number | undefined;
    const handleResize = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = window.setTimeout(() => {
            // Resize all charts in the registry
            chartRegistry.current.forEach(chart => {
                chart.resize();
            });
        }, 700);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
});
