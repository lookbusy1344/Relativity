import { select } from "d3-selection";
import { COLORS as D3_COLORS } from "../minkowski-colors";
import * as rl from "../../relativity_lib";
import type { TwinParadoxController, TwinParadoxMinkowskiData } from "./types";
import {
	debounce,
	createScaleSet,
	setupSVG,
	createAxisDefinitions,
	createLayerGroups,
	renderStandardAxes,
	renderTransformedAxes,
} from "../minkowski-core";
import { calculateEvents } from "./geometry";
import { renderWorldline } from "./worldlines";
import { renderSimultaneityLines } from "./simultaneityLines";
import { renderEvents } from "./events";
import { renderLabels } from "./labels";
import { renderLegend } from "./legend";
import { setupTooltips } from "./tooltips";
import { startJourneyAnimation } from "./animation";

export function drawTwinParadoxMinkowski(
	container: HTMLElement,
	data: TwinParadoxMinkowskiData,
	onVelocityChange?: (velocityC: number) => void
): TwinParadoxController {
	const size = 900;
	let isSliderUpdate = false;
	let events = calculateEvents(data);
	let scales = createScaleSet(events.maxCoord, size);

	const svg = setupSVG(container, size);
	createAxisDefinitions(svg);
	createLayerGroups(svg);

	renderStandardAxes(svg, scales, { ctLabel: "ct (Earth)", xLabel: "x" });
	let beta = data.velocityC;

	renderTransformedAxes(
		svg,
		scales,
		beta,
		{ ctLabel: "ct₁'", xLabel: "x₁'" },
		D3_COLORS.quantumGreen,
		"url(#arrowGreen)",
		"axis-outbound"
	);
	renderTransformedAxes(
		svg,
		scales,
		-beta,
		{ ctLabel: "ct₂'", xLabel: "x₂'" },
		D3_COLORS.photonGold,
		"url(#arrowAmber)",
		"axis-inbound",
		events.turnaround
	);
	renderSimultaneityLines(svg, scales, events.turnaround, beta, events.maxCoord);
	renderWorldline(svg, scales, events.departure, events.turnaround, events.arrival, false);
	renderEvents(svg, scales, events.departure, events.turnaround, events.arrival);
	renderLabels(svg, scales, data, events.departure, events.turnaround, events.arrival, size);
	renderLegend(container);
	setupTooltips(svg, container);

	const controlContainer = select(container)
		.append("div")
		.attr("class", "minkowski-controls")
		.style("position", "absolute")
		.style("bottom", "220px")
		.style("left", "50%")
		.style("transform", "translateX(-50%)")
		.style("display", "flex")
		.style("flex-direction", "column")
		.style("align-items", "center")
		.style("gap", "8px")
		.style("z-index", "1000");

	const toggleButton = controlContainer
		.append("button")
		.attr("class", "minkowski-toggle-button")
		.text("Toggle Animation")
		.style("padding", "8px 16px")
		.style("background", D3_COLORS.tooltipBg)
		.style("border", `1px solid ${D3_COLORS.tooltipBorder}`)
		.style("color", D3_COLORS.plasmaWhite)
		.style("font-family", "'IBM Plex Mono', monospace")
		.style("font-size", "12px")
		.style("cursor", "pointer")
		.style("border-radius", "4px")
		.style("box-shadow", `0 0 10px ${D3_COLORS.tooltipBorder}60`)
		.style("transition", "all 200ms")
		.on("mouseenter", function () {
			select(this)
				.style("background", D3_COLORS.tooltipBorder)
				.style("box-shadow", `0 0 15px ${D3_COLORS.tooltipBorder}80`);
		})
		.on("mouseleave", function () {
			select(this)
				.style("background", D3_COLORS.tooltipBg)
				.style("box-shadow", `0 0 10px ${D3_COLORS.tooltipBorder}60`);
		});

	const sliderContainer = controlContainer
		.append("div")
		.style("display", "none")
		.style("align-items", "center")
		.style("gap", "8px");
	sliderContainer
		.append("label")
		.style("color", D3_COLORS.quantumGreen)
		.style("font-family", "'IBM Plex Mono', monospace")
		.style("font-size", "11px")
		.text("Position:");
	sliderContainer
		.append("input")
		.attr("type", "range")
		.attr("min", "0")
		.attr("max", "50")
		.attr("value", "0")
		.style("width", "200px")
		.style("cursor", "pointer")
		.on("input", function () {
			const value = parseFloat(this.value) / 50;
			animation.setPosition(value);
		});

	let animation = startJourneyAnimation(
		svg,
		scales,
		data,
		events.departure,
		events.turnaround,
		events.arrival,
		() => {}
	);
	let isPlaying = true;

	toggleButton.on("click", () => {
		if (isPlaying) {
			animation.pause();
			isPlaying = false;
			sliderContainer.style("display", "flex");
		} else {
			animation.play();
			isPlaying = true;
			sliderContainer.style("display", "none");
		}
	});

	let velocityUpdateTimeout: number | null = null;
	const velocitySliderContainer = select(container)
		.append("div")
		.attr("class", "minkowski-velocity-slider")
		.style("position", "absolute")
		.style("top", "50px")
		.style("left", "20px")
		.style("display", "flex")
		.style("align-items", "center")
		.style("gap", "8px")
		.style("padding", "6px 8px")
		.style("background", D3_COLORS.tooltipBg)
		.style("border", `1px solid ${D3_COLORS.tooltipBorder}`)
		.style("border-radius", "4px")
		.style("box-shadow", `0 0 10px ${D3_COLORS.tooltipBorder}60`)
		.style("z-index", "1000");

	const velocityValueDisplay = velocitySliderContainer
		.append("span")
		.attr("class", "velocity-value-display")
		.style("color", D3_COLORS.plasmaWhite)
		.style("font-family", "'IBM Plex Mono', monospace")
		.style("font-size", "11px")
		.style("font-weight", "600")
		.style("min-width", "70px")
		.style("text-align", "right")
		.text(`v = ${rl.formatSignificant(data.velocityCDecimal, "9", 3)}c`);

	const velocitySlider = velocitySliderContainer
		.append("input")
		.attr("type", "range")
		.attr("min", "0.001")
		.attr("max", "0.999")
		.attr("step", "0.001")
		.attr("value", data.velocityC.toString())
		.attr("class", "velocity-slider-input")
		.style("width", "200px")
		.style("cursor", "pointer")
		.on("input", function () {
			const newVelocityC = parseFloat(this.value);
			velocityValueDisplay.text(`v = ${rl.formatSignificant(rl.ensure(newVelocityC), "9", 3)}c`);
			if (velocityUpdateTimeout !== null) window.clearTimeout(velocityUpdateTimeout);
			velocityUpdateTimeout = window.setTimeout(() => {
				if (onVelocityChange) {
					isSliderUpdate = true;
					onVelocityChange(newVelocityC);
				}
				velocityUpdateTimeout = null;
			}, 300);
		});

	const visibilityChangeHandler = () => {
		if (document.hidden) animation.pause();
		else if (isPlaying) animation.play();
	};
	document.addEventListener("visibilitychange", visibilityChangeHandler);

	let lastInnerWidth = window.innerWidth;
	const resizeHandler = debounce(() => {
		if (window.innerWidth === lastInnerWidth) return;
		lastInnerWidth = window.innerWidth;

		events = calculateEvents(data);
		scales = createScaleSet(events.maxCoord, size);
		beta = data.velocityC;

		svg.select("g.axes").selectAll("*").remove();
		svg.select("g.light-cones").selectAll("*").remove();
		svg.select("g.simultaneity-lines").selectAll("*").remove();
		svg.select("g.worldlines").selectAll("*").remove();
		svg.select("g.events").selectAll("*").remove();
		svg.select("g.labels").selectAll("*").remove();

		renderStandardAxes(svg, scales, { ctLabel: "ct (Earth)", xLabel: "x" });
		renderTransformedAxes(
			svg,
			scales,
			beta,
			{ ctLabel: "ct₁'", xLabel: "x₁'" },
			D3_COLORS.quantumGreen,
			"url(#arrowGreen)",
			"axis-outbound"
		);
		renderTransformedAxes(
			svg,
			scales,
			-beta,
			{ ctLabel: "ct₂'", xLabel: "x₂'" },
			D3_COLORS.photonGold,
			"url(#arrowAmber)",
			"axis-inbound",
			events.turnaround
		);
		renderSimultaneityLines(svg, scales, events.turnaround, beta, events.maxCoord);
		renderWorldline(svg, scales, events.departure, events.turnaround, events.arrival, false);
		renderEvents(svg, scales, events.departure, events.turnaround, events.arrival);
		renderLabels(svg, scales, data, events.departure, events.turnaround, events.arrival, size);
		renderLegend(container);
		setupTooltips(svg, container);
	}, 150);

	window.addEventListener("resize", resizeHandler);

	const controller: TwinParadoxController = {
		update(newData: TwinParadoxMinkowskiData) {
			data = newData;
			const twinsData = data;
			events = calculateEvents(twinsData);
			scales = createScaleSet(events.maxCoord, size);

			const wasPlaying = isPlaying;
			animation.stop();
			animation = startJourneyAnimation(
				svg,
				scales,
				twinsData,
				events.departure,
				events.turnaround,
				events.arrival,
				() => {}
			);
			if (!wasPlaying) {
				animation.pause();
				isPlaying = false;
				sliderContainer.style("display", "flex");
			}

			svg.select("g.axes").selectAll("*").remove();
			svg.select("g.light-cones").selectAll("*").remove();
			svg.select("g.simultaneity-lines").selectAll("*").remove();
			svg.select("g.worldlines").selectAll("*").remove();
			svg.select("g.events").selectAll("*").remove();
			svg.select("g.labels").selectAll("*").remove();

			beta = twinsData.velocityC;
			renderStandardAxes(svg, scales, { ctLabel: "ct (Earth)", xLabel: "x" });
			renderTransformedAxes(
				svg,
				scales,
				beta,
				{ ctLabel: "ct₁'", xLabel: "x₁'" },
				D3_COLORS.quantumGreen,
				"url(#arrowGreen)",
				"axis-outbound"
			);
			renderTransformedAxes(
				svg,
				scales,
				-beta,
				{ ctLabel: "ct₂'", xLabel: "x₂'" },
				D3_COLORS.photonGold,
				"url(#arrowAmber)",
				"axis-inbound",
				events.turnaround
			);
			renderSimultaneityLines(svg, scales, events.turnaround, beta, events.maxCoord);
			renderWorldline(svg, scales, events.departure, events.turnaround, events.arrival, true);
			renderEvents(svg, scales, events.departure, events.turnaround, events.arrival);
			renderLabels(
				svg,
				scales,
				twinsData,
				events.departure,
				events.turnaround,
				events.arrival,
				size
			);
			renderLegend(container);
			setupTooltips(svg, container);

			if (!isSliderUpdate) {
				velocitySlider.property("value", twinsData.velocityC);
				velocityValueDisplay.text(
					`v = ${rl.formatSignificant(twinsData.velocityCDecimal, "9", 3)}c`
				);
			}
			isSliderUpdate = false;
		},
		updateSlider(velocityC: number) {
			velocitySlider.property("value", velocityC);
			velocityValueDisplay.text(`v = ${rl.formatSignificant(rl.ensure(velocityC), "9", 3)}c`);
		},
		pause() {
			animation.pause();
			isPlaying = false;
		},
		play() {
			animation.play();
			isPlaying = true;
		},
		destroy() {
			animation.stop();
			window.removeEventListener("resize", resizeHandler);
			document.removeEventListener("visibilitychange", visibilityChangeHandler);
			select(container).selectAll("*").remove();
		},
	};

	return controller;
}
