import { select } from "d3-selection";
import { COLORS as D3_COLORS } from "../minkowski-colors";
import * as rl from "../../relativity_lib";
import type { MinkowskiData, MinkowskiDiagramController } from "../minkowski-types";
import { createScales } from "./scales";
import { setupSVG } from "./svg";
import { renderLightCones } from "./lightCones";
import { renderAxes } from "./axes";
import { renderSimultaneityLines } from "./simultaneityLines";
import { renderEvents } from "./events";
import { renderLabels } from "./labels";
import { setupTooltips } from "./tooltips";
import { startFrameAnimation } from "./animation";
import { debounce } from "../minkowski-core";

const SIZE = 900;

export function drawMinkowskiDiagramD3(
	container: HTMLElement,
	data: MinkowskiData
): MinkowskiDiagramController {
	const svg = setupSVG(container);
	let scales = createScales(data, SIZE);

	renderLightCones(svg, scales, data, false);
	renderSimultaneityLines(svg, scales, data, false);
	renderAxes(svg, scales, data, false);
	renderEvents(svg, scales, data, false);
	renderLabels(svg, scales, data, false);

	const tooltips = setupTooltips(svg, container);

	const controlContainer = select(container)
		.append("div")
		.attr("class", "minkowski-controls")
		.style("position", "absolute")
		.style("bottom", "10px")
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
		.style("background", D3_COLORS.tooltipBg)
		.style("border", `1px solid ${D3_COLORS.tooltipBorder}`)
		.style("color", D3_COLORS.plasmaWhite)
		.style("padding", "8px 16px")
		.style("border-radius", "4px")
		.style("font-family", "'IBM Plex Mono', monospace")
		.style("font-size", "12px")
		.style("cursor", "pointer")
		.style("box-shadow", `0 0 10px ${D3_COLORS.tooltipBorder}60`)
		.style("transition", "all 200ms")
		.text("Toggle Animation")
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

	let animation = startFrameAnimation(svg, scales, data, () => {
		// Animation update callback (currently unused)
	});
	let isPlaying = true;

	toggleButton.on("click", () => {
		if (isPlaying) {
			animation.pause();
			isPlaying = false;
			sliderContainer.style("display", "flex");
			renderAxes(svg, scales, data, false);
			renderSimultaneityLines(svg, scales, data, false);
			svg
				.select(".velocity-label")
				.text(`Moving frame ${rl.formatSignificant(data.velocityDecimal, "9", 2, true)}c`);
			svg
				.select(".separation-time")
				.text(`${rl.formatSignificant(data.deltaTPrimeDecimal, "", 3, true)} sec`);
			svg
				.select(".separation-distance")
				.text(`${rl.formatSignificant(data.deltaXPrimeDecimal, "0", 0)} km`);
			tooltips.reattach();
		} else {
			animation.play();
			isPlaying = true;
			sliderContainer.style("display", "none");
		}
	});

	const visibilityChangeHandler = () => {
		if (document.hidden) {
			animation.pause();
		} else if (isPlaying) {
			animation.play();
		}
	};
	document.addEventListener("visibilitychange", visibilityChangeHandler);

	let lastInnerWidth = window.innerWidth;
	const resizeHandler = debounce(() => {
		if (window.innerWidth === lastInnerWidth) return;
		lastInnerWidth = window.innerWidth;

		scales = createScales(data, SIZE);
		renderLightCones(svg, scales, data, false);
		renderSimultaneityLines(svg, scales, data, false);
		renderAxes(svg, scales, data, false);
		renderEvents(svg, scales, data, false);
		renderLabels(svg, scales, data, false);
		tooltips.reattach();
	}, 150);

	window.addEventListener("resize", resizeHandler);

	const controller: MinkowskiDiagramController = {
		update(newData: MinkowskiData) {
			data = newData;
			scales = createScales(data, SIZE);
			const wasPlaying = isPlaying;

			animation.stop();
			animation = startFrameAnimation(svg, scales, data, () => {});

			if (!wasPlaying) {
				animation.pause();
				sliderContainer.style("display", "flex");
			} else {
				sliderContainer.style("display", "none");
			}

			renderLightCones(svg, scales, data, true);
			renderSimultaneityLines(svg, scales, data, true);
			renderAxes(svg, scales, data, true);
			renderEvents(svg, scales, data, true);
			renderLabels(svg, scales, data, true);
			tooltips.reattach();
		},
		pause() {
			if (isPlaying) {
				isPlaying = false;
				animation.pause();
				sliderContainer.style("display", "flex");
				renderAxes(svg, scales, data, false);
				renderSimultaneityLines(svg, scales, data, false);
				svg
					.select(".velocity-label")
					.text(`Moving frame ${rl.formatSignificant(data.velocityDecimal, "9", 2, true)}c`);
				svg
					.select(".separation-time")
					.text(`${rl.formatSignificant(data.deltaTPrimeDecimal, "", 3, true)} sec`);
				svg
					.select(".separation-distance")
					.text(`${rl.formatSignificant(data.deltaXPrimeDecimal, "0", 0)} km`);
				tooltips.reattach();
			}
		},
		play() {
			if (!isPlaying) {
				isPlaying = true;
				animation.play();
				sliderContainer.style("display", "none");
			}
		},
		destroy() {
			window.removeEventListener("resize", resizeHandler);
			document.removeEventListener("visibilitychange", visibilityChangeHandler);
			tooltips.destroy();
			animation.stop();
			controlContainer.remove();
			svg.remove();
		},
	};

	return controller;
}
