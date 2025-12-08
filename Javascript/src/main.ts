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
import { drawMinkowskiDiagramD3, type MinkowskiData, type MinkowskiDiagramController } from './charts/minkowski';
import { drawTwinParadoxMinkowski, type TwinParadoxMinkowskiData, type TwinParadoxController } from './charts/minkowski-twins';
import { createSimultaneityDiagram, type SimultaneityController } from './charts/simultaneity';
import { initializeFromURL, setupURLSync } from './urlState';

// Register Chart.js components
Chart.register(...registerables);

document.addEventListener('DOMContentLoaded', () => {
    const chartRegistry: { current: ChartRegistry } = { current: new Map() };

    // Store Minkowski diagram controller and data for updates
    const minkowskiState: {
        lastData: MinkowskiData | null,
        controller: MinkowskiDiagramController | null
    } = {
        lastData: null,
        controller: null
    };

    // Store Twin Paradox Minkowski diagram controller and data for updates
    const twinsMinkowskiState: {
        lastData: TwinParadoxMinkowskiData | null,
        controller: TwinParadoxController | null
    } = {
        lastData: null,
        controller: null
    };

    // Store Simultaneity diagram controller
    const simultaneityState: {
        controller: SimultaneityController | null
    } = {
        controller: null
    };

    // Store event handlers for cleanup
    type EventHandler = EventListener | EventListenerObject;
    const eventHandlers: Array<{ element: Element | Window, event: string, handler: EventHandler }> = [];
    const addEventListener = (element: Element | Window | null, event: string, handler: EventHandler) => {
        if (element) {
            element.addEventListener(event, handler);
            eventHandlers.push({ element, event, handler });
        }
    };

    // Lorentz factor from velocity
    addEventListener(
        getButtonElement('lorentzButton'),
        'click',
        createLorentzHandler(
            () => getInputElement('lorentzInput'),
            () => getResultElement('resultLorentz')
        )
    );

    // Rapidity from velocity
    addEventListener(
        getButtonElement('velocityButton'),
        'click',
        createRapidityFromVelocityHandler(
            () => getInputElement('velocityInput'),
            () => getResultElement('resultVelocity')
        )
    );

    // Velocity from rapidity
    addEventListener(
        getButtonElement('rapidityButton'),
        'click',
        createVelocityFromRapidityHandler(
            () => getInputElement('rapidityInput'),
            () => getResultElement('resultRapidity')
        )
    );

    // Constant acceleration
    addEventListener(
        getButtonElement('aButton'),
        'click',
        createAccelHandler(
            () => getInputElement('aAccelInput'),
            () => getInputElement('aInput'),
            () => getInputElement('aDryMassInput'),
            () => getInputElement('aEfficiencyInput'),
            () => [
                getResultElement('resultA1'),
                getResultElement('resultA2'),
                getResultElement('resultA1b'),
                getResultElement('resultA2b'),
                getResultElement('resultAFuel'),
                getResultElement('resultAFuelFraction'),
                getResultElement('resultAStars'),
                getResultElement('resultAGalaxyFraction')
            ],
            chartRegistry
        )
    );

    // Flip-and-burn
    addEventListener(
        getButtonElement('flipButton'),
        'click',
        createFlipBurnHandler(
            () => getInputElement('flipAccelInput'),
            () => getInputElement('flipInput'),
            () => getInputElement('flipDryMassInput'),
            () => getInputElement('flipEfficiencyInput'),
            () => [
                getResultElement('resultFlip1'),
                getResultElement('resultFlip2'),
                getResultElement('resultFlip3'),
                getResultElement('resultFlip4'),
                getResultElement('resultFlip5'),
                getResultElement('resultFlip6'),
                getResultElement('resultFlipFuel'),
                getResultElement('resultFlipFuelFraction'),
                getResultElement('resultFlipStars'),
                getResultElement('resultFlipGalaxyFraction')
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
            getResultElement('resultTwins7'),
            getResultElement('resultTwins8')
        ],
        chartRegistry,
        (container, data, _controller) => {
            if (twinsMinkowskiState.controller) {
                // Update existing diagram
                twinsMinkowskiState.controller.update(data);
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

    addEventListener(getButtonElement('twinsButton'), 'click', () => twinsCalculateHandler());

    // Bidirectional sync: input field -> slider
    const twinsInputHandler = (event: Event) => {
        const velocityInput = event.target as HTMLInputElement;
        const newVelocityC = parseFloat(velocityInput.value);
        if (!isNaN(newVelocityC) && twinsMinkowskiState.controller?.updateSlider) {
            twinsMinkowskiState.controller.updateSlider(newVelocityC);
        }
    };
    addEventListener(getInputElement('twinsVelocityInput'), 'input', twinsInputHandler);

    // Handle twins tab - pre-calculate when first shown
    const twinsTab = document.getElementById('twins-tab');
    const twinsTabHandler = () => {
        // Check if the diagram hasn't been generated yet
        if (!twinsMinkowskiState.controller) {
            // Trigger the twins paradox calculation
            const twinsButton = getButtonElement('twinsButton');
            twinsButton?.click();
        }
    };
    addEventListener(twinsTab, 'shown.bs.tab', twinsTabHandler);

    // Add velocities
    addEventListener(
        getButtonElement('addButton'),
        'click',
        createAddVelocitiesHandler(
            () => getInputElement('v1Input'),
            () => getInputElement('v2Input'),
            () => getResultElement('resultAdd')
        )
    );

    // Pion rocket acceleration time
    addEventListener(
        getButtonElement('pionAccelButton'),
        'click',
        createPionAccelTimeHandler(
            () => getInputElement('pionFuelMassInput'),
            () => getInputElement('pionDryMassInput'),
            () => getInputElement('pionEfficiencyInput'),
            () => getResultElement('resultPionAccel')
        )
    );

    // Pion rocket fuel fraction
    addEventListener(
        getButtonElement('fuelFractionButton'),
        'click',
        createPionFuelFractionHandler(
            () => getInputElement('fuelFractionAccelInput'),
            () => getInputElement('fuelFractionTimeInput'),
            () => getInputElement('fuelFractionEffInput'),
            () => getInputElement('fuelFractionDryMassInput'),
            () => getResultElement('resultFuelFraction'),
            () => getResultElement('resultFuelMass')
        )
    );

    // Spacetime interval
    addEventListener(
        getButtonElement('spacetimeButton'),
        'click',
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
                twinsMinkowskiState.controller.update(twinsMinkowskiState.lastData);
            }
        }, 700);
    };

    addEventListener(window, 'resize', handleResize);
    addEventListener(window, 'orientationchange', handleResize);

    // Handle tab changes - trigger calculation when spacetime tab is opened
    const spacetimeTab = document.getElementById('spacetime-tab');
    const spacetimeTabHandler = () => {
        // Check if the diagram hasn't been generated yet
        if (!minkowskiState.controller) {
            // Trigger the spacetime calculation
            const spacetimeButton = getButtonElement('spacetimeButton');
            spacetimeButton?.click();
        }
    };
    addEventListener(spacetimeTab, 'shown.bs.tab', spacetimeTabHandler);

    // Handle simultaneity tab - initialize diagram when opened
    const simultaneityTab = document.getElementById('simultaneity-tab');
    const simultaneityTabHandler = () => {
        if (!simultaneityState.controller) {
            const container = document.getElementById('simultaneityContainer');
            if (container) {
                // Small delay to ensure tab is fully visible
                setTimeout(() => {
                    simultaneityState.controller = createSimultaneityDiagram(container);
                    // Restore velocity from text input if set
                    const input = document.getElementById('simVelocityInput') as HTMLInputElement;
                    if (input && parseFloat(input.value) !== 0) {
                        simultaneityState.controller?.updateSlider?.(parseFloat(input.value));
                    }
                }, 100);
            }
        }
    };
    addEventListener(simultaneityTab, 'shown.bs.tab', simultaneityTabHandler);

    // Simultaneity controls
    const simVelocityInput = document.getElementById('simVelocityInput') as HTMLInputElement;
    const simCalculateButton = document.getElementById('simCalculateButton');
    const simResetButton = document.getElementById('simResetButton');
    const simClearButton = document.getElementById('simClearButton');

    // Function to update velocity from text input
    const updateVelocityFromInput = () => {
        if (!simVelocityInput) return;

        let velocity = parseFloat(simVelocityInput.value);

        // Validate and clamp velocity
        if (isNaN(velocity)) {
            velocity = 0;
        } else {
            velocity = Math.max(-0.99, Math.min(0.99, velocity));
        }

        // Update input field with clamped value
        simVelocityInput.value = velocity.toString();

        if (simultaneityState.controller?.updateSlider) {
            simultaneityState.controller.updateSlider(velocity);
        }
    };

    // Calculate button click handler
    addEventListener(simCalculateButton, 'click', updateVelocityFromInput);

    // Allow Enter key to trigger calculation
    const simKeypressHandler = (event: KeyboardEvent) => {
        if (event.key === 'Enter') {
            updateVelocityFromInput();
        }
    };
    addEventListener(simVelocityInput, 'keypress', simKeypressHandler as EventListener);

    const simResetHandler = () => {
        if (simultaneityState.controller) {
            simultaneityState.controller.reset();
            // Reset text input
            if (simVelocityInput) {
                simVelocityInput.value = '0';
            }
        }
    };
    addEventListener(simResetButton, 'click', simResetHandler);

    const simClearHandler = () => {
        if (simultaneityState.controller) {
            simultaneityState.controller.clearAll();
        }
    };
    addEventListener(simClearButton, 'click', simClearHandler);

    // Initialize from URL parameters and set up bidirectional sync
    initializeFromURL();
    const cleanupURLSync = setupURLSync();

    // Cleanup function to remove all event listeners
    const cleanup = () => {
        // Clear any pending resize timeout
        clearTimeout(resizeTimeout);

        // Remove all tracked event listeners
        eventHandlers.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });

        // Cleanup URL sync listeners
        cleanupURLSync();

        // Destroy chart controllers
        minkowskiState.controller?.destroy();
        twinsMinkowskiState.controller?.destroy();
        simultaneityState.controller?.destroy();
    };

    // Register cleanup on page unload
    addEventListener(window, 'beforeunload', cleanup);
});
