import { Chart, registerables } from 'chart.js';
import { getInputElement, getButtonElement, getResultElement } from './ui/domUtils';
import {
    createLorentzHandler,
    createRapidityFromVelocityHandler,
    createVelocityFromRapidityHandler,
    createAccelHandler,
    createFlipBurnHandler,
    createTwinParadoxHandler,
    createAddVelocitiesHandler,
    createPionAccelTimeHandler,
    createPionFuelFractionHandler,
    createSpacetimeIntervalHandler
} from './ui/eventHandlers';
import { type ChartRegistry } from './charts/charts';
import { drawMinkowskiDiagramD3, type MinkowskiData } from './charts/minkowski';
import { drawTwinParadoxMinkowski, type TwinParadoxMinkowskiData } from './charts/minkowski-twins';
import { createSimultaneityDiagram } from './charts/simultaneity';
import { initializeFromURL, setupURLSync } from './urlState';

// Register Chart.js components
Chart.register(...registerables);

document.addEventListener('DOMContentLoaded', () => {
    const chartRegistry: { current: ChartRegistry } = { current: new Map() };

    // Store Minkowski diagram controller and data for updates
    const minkowskiState: {
        lastData: MinkowskiData | null,
        controller: ReturnType<typeof drawMinkowskiDiagramD3> | null
    } = {
        lastData: null,
        controller: null
    };

    // Store Twin Paradox Minkowski diagram controller and data for updates
    const twinsMinkowskiState: {
        lastData: TwinParadoxMinkowskiData | null,
        controller: ReturnType<typeof drawTwinParadoxMinkowski> | null
    } = {
        lastData: null,
        controller: null
    };

    // Store Simultaneity diagram controller
    const simultaneityState: {
        controller: ReturnType<typeof createSimultaneityDiagram> | null
    } = {
        controller: null
    };

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
            () => getInputElement('aAccelInput'),
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
            () => getInputElement('flipAccelInput'),
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

    // Twin Paradox
    const twinsCalculateHandler = createTwinParadoxHandler(
        () => getInputElement('twinsVelocityInput'),
        () => getInputElement('twinsTimeInput'),
        () => [
            getResultElement('resultTwins1'),
            getResultElement('resultTwins2'),
            getResultElement('resultTwins3'),
            getResultElement('resultTwins4'),
            getResultElement('resultTwins5'),
            getResultElement('resultTwins6'),
            getResultElement('resultTwins7')
        ],
        chartRegistry,
        (container, data, _controller) => {
            if (twinsMinkowskiState.controller) {
                // Update existing diagram
                (twinsMinkowskiState.controller as any).update(data);
            } else {
                // Create new diagram with velocity change callback
                twinsMinkowskiState.controller = drawTwinParadoxMinkowski(container, data, (newVelocityC) => {
                    // Update input field
                    const velocityInput = getInputElement('twinsVelocityInput');
                    if (velocityInput) {
                        velocityInput.value = newVelocityC.toString();
                        // Trigger calculation with new velocity (silent mode to avoid flicker)
                        twinsCalculateHandler(true);
                    }
                });
            }
            twinsMinkowskiState.lastData = data;
        }
    );

    getButtonElement('twinsButton')?.addEventListener('click', () => twinsCalculateHandler());

    // Bidirectional sync: input field -> slider
    getInputElement('twinsVelocityInput')?.addEventListener('input', (event) => {
        const velocityInput = event.target as HTMLInputElement;
        const newVelocityC = parseFloat(velocityInput.value);
        if (!isNaN(newVelocityC) && twinsMinkowskiState.controller?.updateSlider) {
            twinsMinkowskiState.controller.updateSlider(newVelocityC);
        }
    });

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

    // Pion rocket fuel fraction
    getButtonElement('fuelFractionButton')?.addEventListener('click',
        createPionFuelFractionHandler(
            () => getInputElement('fuelFractionTimeInput'),
            () => getInputElement('fuelFractionEffInput'),
            () => getResultElement('resultFuelFraction')
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
            () => getResultElement('resultSpacetimeDeltaX'),
            () => getResultElement('resultSpacetimeMinSep'),
            () => getResultElement('resultSpacetimeVelocity'),
            (container, data, _controller) => {
                if (minkowskiState.controller) {
                    // Update existing diagram
                    minkowskiState.controller.update(data);
                } else {
                    // Create new diagram
                    minkowskiState.controller = drawMinkowskiDiagramD3(container, data);
                }
                minkowskiState.lastData = data;
            }
        )
    );


    // Handle orientation changes and window resize with debounce
    let resizeTimeout: number | undefined;
    const handleResize = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = window.setTimeout(() => {
            // Resize all Chart.js charts in the registry
            chartRegistry.current.forEach(chart => {
                chart.resize();
            });

            // Update Minkowski diagram if it exists
            if (minkowskiState.controller && minkowskiState.lastData) {
                minkowskiState.controller.update(minkowskiState.lastData);
            }

            // Update Twin Paradox Minkowski diagram if it exists
            if (twinsMinkowskiState.controller && twinsMinkowskiState.lastData) {
                (twinsMinkowskiState.controller as any).update(twinsMinkowskiState.lastData);
            }
        }, 700);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // Handle tab changes - trigger calculation when spacetime tab is opened
    const spacetimeTab = document.getElementById('spacetime-tab');
    if (spacetimeTab) {
        spacetimeTab.addEventListener('shown.bs.tab', () => {
            // Check if the diagram hasn't been generated yet
            if (!minkowskiState.controller) {
                // Trigger the spacetime calculation
                const spacetimeButton = getButtonElement('spacetimeButton');
                spacetimeButton?.click();
            }
        });
    }

    // Handle simultaneity tab - initialize diagram when opened
    const simultaneityTab = document.getElementById('simultaneity-tab');
    if (simultaneityTab) {
        simultaneityTab.addEventListener('shown.bs.tab', () => {
            if (!simultaneityState.controller) {
                const container = document.getElementById('simultaneityContainer');
                if (container) {
                    simultaneityState.controller = createSimultaneityDiagram(container);
                }
            }
        });
    }

    // Simultaneity controls
    const simVelocitySlider = document.getElementById('simVelocitySlider') as HTMLInputElement;
    const simVelocityValue = document.getElementById('simVelocityValue');
    const simPlayPauseButton = document.getElementById('simPlayPauseButton');
    const simResetButton = document.getElementById('simResetButton');
    const simClearButton = document.getElementById('simClearButton');
    let isSimAnimating = true;

    if (simVelocitySlider && simVelocityValue) {
        simVelocitySlider.addEventListener('input', (event) => {
            const target = event.target as HTMLInputElement;
            let velocity = parseFloat(target.value);

            // Snap to zero if close
            if (Math.abs(velocity) < 0.05) {
                velocity = 0;
                target.value = '0';
            }

            simVelocityValue.textContent = `v = ${velocity.toFixed(2)}c`;

            if (simultaneityState.controller?.updateSlider) {
                simultaneityState.controller.updateSlider(velocity);
            }
        });
    }

    if (simPlayPauseButton) {
        simPlayPauseButton.addEventListener('click', () => {
            if (simultaneityState.controller) {
                isSimAnimating = !isSimAnimating;
                if (isSimAnimating) {
                    simultaneityState.controller.play();
                    simPlayPauseButton.textContent = '⏸ Pause';
                } else {
                    simultaneityState.controller.pause();
                    simPlayPauseButton.textContent = '▶ Play';
                }
            }
        });
    }

    if (simResetButton) {
        simResetButton.addEventListener('click', () => {
            if (simultaneityState.controller && 'reset' in simultaneityState.controller) {
                (simultaneityState.controller as any).reset();
                // Reset slider
                if (simVelocitySlider && simVelocityValue) {
                    simVelocitySlider.value = '0';
                    simVelocityValue.textContent = 'v = 0.00c';
                }
                // Resume animation if paused
                if (!isSimAnimating && simPlayPauseButton) {
                    isSimAnimating = true;
                    simultaneityState.controller.play();
                    simPlayPauseButton.textContent = '⏸ Pause';
                }
            }
        });
    }

    if (simClearButton) {
        simClearButton.addEventListener('click', () => {
            if (simultaneityState.controller && 'clearAll' in simultaneityState.controller) {
                (simultaneityState.controller as any).clearAll();
            }
        });
    }

    // Initialize from URL parameters and set up bidirectional sync
    initializeFromURL();
    setupURLSync();
});
