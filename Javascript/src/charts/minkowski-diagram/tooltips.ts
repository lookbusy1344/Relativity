import { select, type Selection } from "d3-selection";
import Decimal from "decimal.js";
import { COLORS as D3_COLORS } from "../minkowski-colors";
import { formatCoordinate } from "../minkowski-core";
import type { TooltipController } from "../minkowski-types";

export function setupTooltips(
	svg: Selection<SVGSVGElement, unknown, null, undefined>,
	container: HTMLElement
): TooltipController {
	const tooltip = select(container)
		.append("div")
		.attr("class", "minkowski-tooltip")
		.style("position", "fixed")
		.style("background", D3_COLORS.tooltipBg)
		.style("border", `1px solid ${D3_COLORS.tooltipBorder}`)
		.style("padding", "8px 12px")
		.style("border-radius", "4px")
		.style("font-family", "'IBM Plex Mono', monospace")
		.style("font-size", "12px")
		.style("color", D3_COLORS.plasmaWhite)
		.style("pointer-events", "none")
		.style("opacity", "0")
		.style("z-index", "10000")
		.style("box-shadow", `0 0 15px ${D3_COLORS.tooltipBorder}80`)
		.style("transition", "opacity 200ms");

	let hideTimeout: number | undefined;

	const attachAxisTooltips = () => {
		svg
			.selectAll("g.axes line")
			.on("mouseenter", function (event: MouseEvent) {
				const axis = (this as SVGLineElement).getAttribute("data-axis");
				const axisName =
					axis === "ct"
						? "ct axis - Original Frame (time)"
						: axis === "x"
							? "x axis - Original Frame (space)"
							: axis === "ct'"
								? "ct' axis - Moving Frame (time)"
								: "x' axis - Moving Frame (space)";

				tooltip
					.html(axisName)
					.style("position", "fixed")
					.style("left", `${event.clientX + 10}px`)
					.style("top", `${event.clientY + 10}px`)
					.style("opacity", "1");
			})
			.on("mouseleave", () => {
				tooltip.style("opacity", "0");
			});
	};

	const attachEventTooltips = () => {
		svg
			.selectAll("g.events circle")
			.on("mouseenter", function (event: MouseEvent) {
				const label = (this as SVGCircleElement).getAttribute("data-label");
				const timeDecimalStr = (this as SVGCircleElement).getAttribute("data-time-decimal") || "0";
				const xDecimalStr = (this as SVGCircleElement).getAttribute("data-x-decimal") || "0";

				const content =
					label === "Origin"
						? "Event 1: Origin (0, 0)"
						: `Event 2: (${formatCoordinate(new Decimal(timeDecimalStr))}, ${formatCoordinate(new Decimal(xDecimalStr))})`;

				tooltip
					.html(content)
					.style("position", "fixed")
					.style("left", `${event.clientX + 10}px`)
					.style("top", `${event.clientY + 10}px`)
					.style("opacity", "1");
			})
			.on("mouseleave", () => {
				tooltip.style("opacity", "0");
			});
	};

	const attachLightConeTooltips = () => {
		svg
			.selectAll("g.light-cones line")
			.on("mouseenter", function (event: MouseEvent) {
				const from = (this as SVGLineElement).getAttribute("data-from");
				const content = from === "origin" ? "Light cone from origin" : "Light cone from event";

				tooltip
					.html(content)
					.style("position", "fixed")
					.style("left", `${event.clientX + 10}px`)
					.style("top", `${event.clientY + 10}px`)
					.style("opacity", "1");
			})
			.on("mouseleave", () => {
				tooltip.style("opacity", "0");
			});
	};

	attachAxisTooltips();
	attachEventTooltips();
	attachLightConeTooltips();

	let touchedElement: SVGElement | null = null;

	svg.on("touchstart", function (event: TouchEvent) {
		const touch = event.touches[0];
		const targetElement = event.target as SVGElement;

		const isInteractiveElement =
			(targetElement.tagName === "line" &&
				targetElement.parentElement?.classList.contains("axes")) ||
			targetElement.tagName === "circle" ||
			(targetElement.tagName === "line" &&
				targetElement.parentElement?.classList.contains("light-cones"));

		if (!isInteractiveElement) {
			return;
		}

		event.preventDefault();

		if (touchedElement === targetElement) {
			tooltip.style("opacity", "0");
			touchedElement = null;
		} else {
			touchedElement = targetElement;

			let content = "";
			if (
				targetElement.tagName === "line" &&
				targetElement.parentElement?.classList.contains("axes")
			) {
				const axis = (targetElement as SVGLineElement).getAttribute("data-axis");
				content =
					axis === "ct"
						? "ct axis - Original Frame (time)"
						: axis === "x"
							? "x axis - Original Frame (space)"
							: axis === "ct'"
								? "ct' axis - Moving Frame (time)"
								: "x' axis - Moving Frame (space)";
			} else if (targetElement.tagName === "circle") {
				const label = (targetElement as SVGCircleElement).getAttribute("data-label");
				const timeDecimalStr =
					(targetElement as SVGCircleElement).getAttribute("data-time-decimal") || "0";
				const xDecimalStr =
					(targetElement as SVGCircleElement).getAttribute("data-x-decimal") || "0";
				content =
					label === "Origin"
						? "Event 1: Origin (0, 0)"
						: `Event 2: (${formatCoordinate(new Decimal(timeDecimalStr))}, ${formatCoordinate(new Decimal(xDecimalStr))})`;
			} else if (
				targetElement.tagName === "line" &&
				targetElement.parentElement?.classList.contains("light-cones")
			) {
				const from = (targetElement as SVGLineElement).getAttribute("data-from");
				content = from === "origin" ? "Light cone from origin" : "Light cone from event";
			}

			if (content) {
				tooltip
					.html(content)
					.style("position", "fixed")
					.style("left", `${touch.clientX + 10}px`)
					.style("top", `${touch.clientY + 10}px`)
					.style("opacity", "1");
				clearTimeout(hideTimeout);
				hideTimeout = window.setTimeout(() => {
					tooltip.style("opacity", "0");
					touchedElement = null;
				}, 3000);
			}
		}
	});

	return {
		show(content: string, x: number, y: number) {
			tooltip.html(content).style("left", `${x}px`).style("top", `${y}px`).style("opacity", "1");
		},
		hide() {
			tooltip.style("opacity", "0");
		},
		destroy() {
			clearTimeout(hideTimeout);
			tooltip.remove();
		},
		reattach() {
			attachAxisTooltips();
			attachEventTooltips();
			attachLightConeTooltips();
		},
	};
}
