import type { ChartRegistry } from "../charts/charts";
import {
	drawMinkowskiDiagramD3,
	type MinkowskiData,
	type MinkowskiDiagramController,
} from "../charts/minkowski";
import {
	drawTwinParadoxMinkowski,
	type TwinParadoxMinkowskiData,
	type TwinParadoxController,
} from "../charts/minkowski-twins";
import { createSimultaneityDiagram, type SimultaneityController } from "../charts/simultaneity";
import {
	createLorentzHandler,
	createRapidityFromVelocityHandler,
	createVelocityFromRapidityHandler,
	createAccelHandler,
	createFlipBurnHandler,
	createTwinParadoxHandler,
	createAddVelocitiesHandler,
	createWarpDriveHandler,
	createPionAccelTimeHandler,
	createPionFuelFractionHandler,
	createSpacetimeIntervalHandler,
	createChartTimeModeHandler,
	createMassChartSliderHandler,
	initializeMassChartSlider,
	createPositionVelocitySliderHandler,
	initializePositionVelocitySlider,
} from "../ui/eventHandlers";
import { getButtonElement, getInputElement, getResultElement } from "./domAccessors";
import { applyPendingDistanceSliderValue, applyPendingSliderValue, updateURL } from "../urlState";

export interface CalculatorWiringState {
	minkowskiState: {
		lastData: MinkowskiData | null;
		controller: MinkowskiDiagramController | null;
	};
	twinsMinkowskiState: {
		lastData: TwinParadoxMinkowskiData | null;
		controller: TwinParadoxController | null;
	};
	simultaneityState: {
		controller: SimultaneityController | null;
	};
}

export interface CalculatorWiringDeps {
	chartRegistry: { current: ChartRegistry };
	state: CalculatorWiringState;
	addEventListener(
		element: Element | Window | null,
		event: string,
		handler: EventListener | EventListenerObject
	): void;
}

export function wireCalculatorHandlers(deps: CalculatorWiringDeps): void {
	const { chartRegistry, state } = deps;
	const addEventListener = (
		element: Element | Window | null,
		event: string,
		handler: EventListener | EventListenerObject
	): void => {
		deps.addEventListener(element, event, handler);
	};

	addEventListener(
		getButtonElement("lorentzButton"),
		"click",
		createLorentzHandler(
			() => getInputElement("lorentzInput"),
			() => getResultElement("resultLorentz")
		)
	);

	addEventListener(
		getButtonElement("velocityButton"),
		"click",
		createRapidityFromVelocityHandler(
			() => getInputElement("velocityInput"),
			() => getResultElement("resultVelocity")
		)
	);

	addEventListener(
		getButtonElement("rapidityButton"),
		"click",
		createVelocityFromRapidityHandler(
			() => getInputElement("rapidityInput"),
			() => getResultElement("resultRapidity")
		)
	);

	const accelHandlerBase = createAccelHandler(
		() => getInputElement("aAccelInput"),
		() => getInputElement("aInput"),
		() => getInputElement("aDryMassInput"),
		() => getInputElement("aEfficiencyInput"),
		() => [
			getResultElement("resultA1"),
			getResultElement("resultA2"),
			getResultElement("resultA1b"),
			getResultElement("resultA2b"),
			getResultElement("resultAFuel"),
			getResultElement("resultAFuelFraction"),
			getResultElement("resultAStars"),
			getResultElement("resultAGalaxyFraction"),
			getResultElement("resultAPeakLorentz"),
			getResultElement("resultAPeakLorentzSub"),
		],
		chartRegistry
	);

	const accelHandler = () => {
		accelHandlerBase();
		setTimeout(() => {
			initializeMassChartSlider(
				"accelMassChart",
				"accelMassSlider",
				"accelMassSliderValue",
				"days",
				chartRegistry
			);
			initializePositionVelocitySlider(
				"accelPositionVelocity",
				"accelPositionSlider",
				"accelPositionSliderValue",
				chartRegistry
			);
			applyPendingSliderValue(
				"accelMassSlider",
				"accelMassSliderValue",
				"days",
				"accelMassChart",
				chartRegistry
			);
			applyPendingDistanceSliderValue(
				"accelPositionSlider",
				"accelPositionSliderValue",
				"accelPositionVelocity",
				chartRegistry
			);
		}, 100);
	};

	addEventListener(getButtonElement("aButton"), "click", accelHandler);

	const flipHandlerBase = createFlipBurnHandler(
		() => getInputElement("flipAccelInput"),
		() => getInputElement("flipInput"),
		() => getInputElement("flipDryMassInput"),
		() => getInputElement("flipEfficiencyInput"),
		() => [
			getResultElement("resultFlip1"),
			getResultElement("resultFlip2"),
			getResultElement("resultFlip3"),
			getResultElement("resultFlip4"),
			getResultElement("resultFlip5"),
			getResultElement("resultFlip7"),
			getResultElement("resultFlipFuel"),
			getResultElement("resultFlipFuelFraction"),
			getResultElement("resultFlipStars"),
			getResultElement("resultFlipGalaxyFraction"),
		],
		chartRegistry,
		() => {
			const lyRadio = getInputElement("flipDistUnitLY");
			return lyRadio?.checked ? "ly" : "ld";
		}
	);

	const flipHandler = () => {
		flipHandlerBase();
		setTimeout(() => {
			initializeMassChartSlider(
				"flipMassChart",
				"flipMassSlider",
				"flipMassSliderValue",
				"years",
				chartRegistry
			);
			initializePositionVelocitySlider(
				"flipPositionVelocity",
				"flipPositionSlider",
				"flipPositionSliderValue",
				chartRegistry
			);
			applyPendingSliderValue(
				"flipMassSlider",
				"flipMassSliderValue",
				"years",
				"flipMassChart",
				chartRegistry
			);
			applyPendingDistanceSliderValue(
				"flipPositionSlider",
				"flipPositionSliderValue",
				"flipPositionVelocity",
				chartRegistry
			);
		}, 100);
	};

	addEventListener(getButtonElement("flipButton"), "click", flipHandler);

	const chartIds = [
		"accelVelocity",
		"accelLorentz",
		"accelRapidity",
		"flipVelocity",
		"flipLorentz",
		"flipRapidity",
	];

	chartIds.forEach(chartId => {
		const handler = createChartTimeModeHandler(chartId, chartRegistry);
		document.querySelectorAll(`[data-chart="${chartId}"]`).forEach(btn => {
			btn.addEventListener("click", e => {
				const mode = (e.target as HTMLButtonElement).dataset.mode as "proper" | "coordinate";
				handler(mode);
				updateURL();
			});
		});
	});

	addEventListener(
		getInputElement("accelMassSlider"),
		"input",
		createMassChartSliderHandler(
			"accelMassChart",
			() => getInputElement("accelMassSlider"),
			() => getResultElement("accelMassSliderValue"),
			"days",
			chartRegistry
		)
	);

	addEventListener(
		getInputElement("flipMassSlider"),
		"input",
		createMassChartSliderHandler(
			"flipMassChart",
			() => getInputElement("flipMassSlider"),
			() => getResultElement("flipMassSliderValue"),
			"years",
			chartRegistry
		)
	);

	addEventListener(
		getInputElement("accelPositionSlider"),
		"input",
		createPositionVelocitySliderHandler(
			"accelPositionVelocity",
			() => getInputElement("accelPositionSlider"),
			() => getResultElement("accelPositionSliderValue"),
			chartRegistry
		)
	);

	addEventListener(
		getInputElement("flipPositionSlider"),
		"input",
		createPositionVelocitySliderHandler(
			"flipPositionVelocity",
			() => getInputElement("flipPositionSlider"),
			() => getResultElement("flipPositionSliderValue"),
			chartRegistry
		)
	);

	const twinsCalculateHandler = createTwinParadoxHandler(
		() => getInputElement("twinsVelocityInput"),
		() => getInputElement("twinsTimeInput"),
		() => [
			getResultElement("resultTwins1"),
			getResultElement("resultTwins2"),
			getResultElement("resultTwins3"),
			getResultElement("resultTwins4"),
			getResultElement("resultTwins5"),
			getResultElement("resultTwins6"),
			getResultElement("resultTwins7"),
			getResultElement("resultTwins8"),
		],
		chartRegistry,
		(container, data, _controller) => {
			if (state.twinsMinkowskiState.controller) {
				state.twinsMinkowskiState.controller.update(data);
			} else {
				state.twinsMinkowskiState.controller = drawTwinParadoxMinkowski(
					container,
					data,
					newVelocityC => {
						const velocityInput = getInputElement("twinsVelocityInput");
						if (velocityInput) {
							velocityInput.value = newVelocityC.toString();
							twinsCalculateHandler(true);
						}
					}
				);
			}
			state.twinsMinkowskiState.lastData = data;
		}
	);

	addEventListener(getButtonElement("twinsButton"), "click", () => twinsCalculateHandler());

	addEventListener(getInputElement("twinsVelocityInput"), "input", (event: Event) => {
		const velocityInput = event.target as HTMLInputElement;
		const newVelocityC = parseFloat(velocityInput.value);
		if (!isNaN(newVelocityC) && state.twinsMinkowskiState.controller?.updateSlider) {
			state.twinsMinkowskiState.controller.updateSlider(newVelocityC);
		}
	});

	const twinsTab = document.getElementById("twins-tab");
	addEventListener(twinsTab, "shown.bs.tab", () => {
		if (!state.twinsMinkowskiState.controller) {
			getButtonElement("twinsButton")?.click();
		}
	});

	addEventListener(
		getButtonElement("addButton"),
		"click",
		createAddVelocitiesHandler(
			() => getInputElement("v1Input"),
			() => getInputElement("v2Input"),
			() => getResultElement("resultAdd")
		)
	);

	addEventListener(
		getButtonElement("warpButton"),
		"click",
		createWarpDriveHandler(
			() => getInputElement("warpDistanceInput"),
			() => getInputElement("warpBoostInput"),
			() => getInputElement("warpTransitInput"),
			() => getInputElement("warpBoostDurationInput"),
			() => [
				getResultElement("resultWarpDisplacement"),
				getResultElement("resultWarpSimultaneity"),
				getResultElement("resultWarpEarthTime"),
				getResultElement("resultWarpTravelerTime"),
			]
		)
	);

	addEventListener(
		getButtonElement("pionAccelButton"),
		"click",
		createPionAccelTimeHandler(
			() => getInputElement("pionFuelMassInput"),
			() => getInputElement("pionDryMassInput"),
			() => getInputElement("pionEfficiencyInput"),
			() => getResultElement("resultPionAccel")
		)
	);

	addEventListener(
		getButtonElement("fuelFractionButton"),
		"click",
		createPionFuelFractionHandler(
			() => getInputElement("fuelFractionAccelInput"),
			() => getInputElement("fuelFractionTimeInput"),
			() => getInputElement("fuelFractionEffInput"),
			() => getInputElement("fuelFractionDryMassInput"),
			() => getResultElement("resultFuelFraction"),
			() => getResultElement("resultFuelMass")
		)
	);

	addEventListener(
		getButtonElement("spacetimeButton"),
		"click",
		createSpacetimeIntervalHandler(
			() => getInputElement("spacetimeTime2"),
			() => getInputElement("spacetimeX2"),
			() => getInputElement("spacetimeVelocity"),
			() => getResultElement("resultSpacetimeSquared"),
			() => getResultElement("resultSpacetimeType"),
			() => getResultElement("resultSpacetimeDeltaT"),
			() => getResultElement("resultSpacetimeDeltaX"),
			() => getResultElement("resultSpacetimeMinSep"),
			() => getResultElement("resultSpacetimeVelocity"),
			(container, data, _controller) => {
				if (state.minkowskiState.controller) {
					state.minkowskiState.controller.update(data);
				} else {
					state.minkowskiState.controller = drawMinkowskiDiagramD3(container, data);
				}
				state.minkowskiState.lastData = data;
			}
		)
	);

	const spacetimeTab = document.getElementById("spacetime-tab");
	addEventListener(spacetimeTab, "shown.bs.tab", () => {
		if (!state.minkowskiState.controller) {
			getButtonElement("spacetimeButton")?.click();
		}
	});

	const simultaneityTab = document.getElementById("simultaneity-tab");
	addEventListener(simultaneityTab, "shown.bs.tab", () => {
		document.body.classList.add("simultaneity-active");

		if (!state.simultaneityState.controller) {
			const container = document.getElementById("simultaneityContainer");
			if (container) {
				setTimeout(() => {
					state.simultaneityState.controller = createSimultaneityDiagram(container);
					const input = document.getElementById("simVelocityInput") as HTMLInputElement;
					if (input && parseFloat(input.value) !== 0) {
						state.simultaneityState.controller?.updateSlider?.(parseFloat(input.value));
					}
				}, 100);
			}
		}
	});

	document.querySelectorAll('[data-bs-toggle="tab"]').forEach(tab => {
		if (tab.id !== "simultaneity-tab") {
			addEventListener(tab, "shown.bs.tab", () => {
				document.body.classList.remove("simultaneity-active");
			});
		}
	});

	const simVelocityInput = document.getElementById("simVelocityInput") as HTMLInputElement;
	const simCalculateButton = document.getElementById("simCalculateButton");
	const simResetButton = document.getElementById("simResetButton");
	const simClearButton = document.getElementById("simClearButton");

	const updateVelocityFromInput = () => {
		if (!simVelocityInput) return;

		let velocity = parseFloat(simVelocityInput.value);
		if (isNaN(velocity)) {
			velocity = 0;
		} else {
			velocity = Math.max(-0.99, Math.min(0.99, velocity));
		}

		simVelocityInput.value = velocity.toString();

		if (state.simultaneityState.controller?.updateSlider) {
			state.simultaneityState.controller.updateSlider(velocity);
		}
	};

	addEventListener(simCalculateButton, "click", updateVelocityFromInput);
	addEventListener(simVelocityInput, "keypress", (event: Event) => {
		if (event instanceof KeyboardEvent && event.key === "Enter") {
			updateVelocityFromInput();
		}
	});
	addEventListener(simResetButton, "click", () => {
		if (state.simultaneityState.controller) {
			state.simultaneityState.controller.reset();
			if (simVelocityInput) {
				simVelocityInput.value = "0";
			}
		}
	});
	addEventListener(simClearButton, "click", () => {
		if (state.simultaneityState.controller) {
			state.simultaneityState.controller.clearAll();
		}
	});
}
